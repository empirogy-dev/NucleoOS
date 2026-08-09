// Edge Function "banco": la conexión en vivo con el banco, vía Plaid.
//
// Tres acciones desde la app (con sesión):
//   link_token  → abre la ventana segura de Plaid
//   exchange    → guarda la conexión y crea las cuentas
//   sync        → trae los movimientos nuevos
// Y una puerta pública para el webhook de Plaid, que avisa cuando hay
// movimientos frescos y dispara el sync solo.
//
// ⚠️ Al desplegar: DESACTIVA "Verify JWT" (el webhook de Plaid no trae
// sesión; la sesión de la app se valida adentro, a mano).
//
// Secretos necesarios (Edge Functions → Secrets):
//   PLAID_CLIENT_ID, PLAID_SECRET
//   PLAID_ENV        sandbox | production (por defecto sandbox)
//   SB_SECRET_KEY    la llave de servicio (ya existe)

import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
};

function json(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

function admin(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    (Deno.env.get("SB_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"))!,
  );
}

function base(): string {
  const env = (Deno.env.get("PLAID_ENV") ?? "sandbox").toLowerCase();
  return env === "production" ? "https://production.plaid.com" : "https://sandbox.plaid.com";
}

async function plaid(ruta: string, cuerpo: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await fetch(`${base()}${ruta}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: Deno.env.get("PLAID_CLIENT_ID"),
      secret: Deno.env.get("PLAID_SECRET"),
      ...cuerpo,
    }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(String(j?.error_message ?? j?.error_code ?? "Plaid falló"));
  return j;
}

/** Categoría de la app que mejor calza, por el nombre que manda Plaid. */
async function categoriaPara(db: SupabaseClient, userId: string, plaidCat: string | null, tipo: string): Promise<string | null> {
  if (!plaidCat) return null;
  // Plaid manda cosas como "FOOD_AND_DRINK": nos quedamos con la primera palabra.
  const palabra = plaidCat.split("_")[0].toLowerCase();
  const mapa: Record<string, string[]> = {
    food: ["comida", "restaurant", "supermercado", "alimentación"],
    transportation: ["transporte", "auto", "bencina"],
    travel: ["viaje", "transporte"],
    rent: ["arriendo", "vivienda", "hogar"],
    general: ["otros"],
    entertainment: ["entretención", "ocio"],
    personal: ["personal", "cuidado"],
    medical: ["salud", "médico"],
    income: ["sueldo", "ingreso"],
  };
  for (const nombre of mapa[palabra] ?? []) {
    const { data } = await db.from("categories").select("id")
      .eq("user_id", userId).eq("type", tipo === "income" ? "income" : "expense")
      .ilike("name", `%${nombre}%`).limit(1).maybeSingle();
    if (data) return data.id;
  }
  return null;
}

/** Trae lo nuevo de una conexión y lo escribe en transacciones y saldos. */
async function sincronizar(db: SupabaseClient, conexion: {
  id: string; user_id: string; access_token: string; cursor: string | null;
}): Promise<{ nuevas: number; error?: string }> {
  let cursor = conexion.cursor ?? undefined;
  let nuevas = 0;

  // Las cuentas del banco: el saldo lo manda él, nosotras lo reflejamos.
  const mapaCuentas = new Map<string, { id: string; tabla: "accounts" | "credit_cards" }>();
  try {
    const cuentas = await plaid("/accounts/get", { access_token: conexion.access_token });
    for (const c of (cuentas.accounts ?? []) as Array<Record<string, unknown>>) {
      const externo = String(c.account_id);
      const nombre = String(c.name ?? c.official_name ?? "Cuenta");
      const tipo = String(c.type ?? "");
      const saldo = Number((c.balances as Record<string, unknown>)?.current ?? 0);
      const moneda = String((c.balances as Record<string, unknown>)?.iso_currency_code ?? "CAD");
      const ultimos4 = String(c.mask ?? "");

      if (tipo === "credit") {
        const { data: ya } = await db.from("credit_cards").select("id")
          .eq("user_id", conexion.user_id).eq("external_id", externo).maybeSingle();
        if (ya) {
          await db.from("credit_cards").update({ balance: Math.abs(saldo) }).eq("id", ya.id);
          mapaCuentas.set(externo, { id: ya.id, tabla: "credit_cards" });
        } else {
          const { data: nueva } = await db.from("credit_cards").insert({
            user_id: conexion.user_id, name: nombre, last_four: ultimos4 || null,
            balance: Math.abs(saldo), currency: moneda, external_id: externo,
          }).select("id").single();
          if (nueva) mapaCuentas.set(externo, { id: nueva.id, tabla: "credit_cards" });
        }
      } else {
        const { data: ya } = await db.from("accounts").select("id")
          .eq("user_id", conexion.user_id).eq("external_id", externo).maybeSingle();
        if (ya) {
          await db.from("accounts").update({ balance: saldo }).eq("id", ya.id);
          mapaCuentas.set(externo, { id: ya.id, tabla: "accounts" });
        } else {
          const { data: nueva } = await db.from("accounts").insert({
            user_id: conexion.user_id, name: nombre, account_type: tipo === "depository" ? "Checking" : "Savings",
            balance: saldo, currency: moneda, is_connected: true, external_id: externo,
          }).select("id").single();
          if (nueva) mapaCuentas.set(externo, { id: nueva.id, tabla: "accounts" });
        }
      }
    }
  } catch (e) {
    return { nuevas: 0, error: String(e).slice(0, 200) };
  }

  // Las reglas de comercio de la usuaria mandan sobre la categoría de Plaid.
  const { data: reglas } = await db.from("merchant_rules")
    .select("pattern,merchant,category_id").eq("user_id", conexion.user_id);

  // transactions/sync: página a página hasta que no haya más.
  for (let vuelta = 0; vuelta < 10; vuelta++) {
    let pagina: Record<string, unknown>;
    try {
      pagina = await plaid("/transactions/sync", {
        access_token: conexion.access_token,
        ...(cursor ? { cursor } : {}),
        count: 200,
      });
    } catch (e) {
      return { nuevas, error: String(e).slice(0, 200) };
    }

    const agregadas = (pagina.added ?? []) as Array<Record<string, unknown>>;
    for (const t of agregadas) {
      const monto = Number(t.amount);
      // En Plaid, positivo = sale plata de la cuenta.
      const tipo = monto >= 0 ? "expense" : "income";
      const texto = String(t.merchant_name ?? t.name ?? "");
      const cuenta = mapaCuentas.get(String(t.account_id));
      const regla = (reglas ?? []).find((r: { pattern: string }) =>
        r.pattern && texto.toLowerCase().includes(String(r.pattern).toLowerCase()));
      const categoria = regla?.category_id
        ?? await categoriaPara(db, conexion.user_id, String((t.personal_finance_category as Record<string, unknown>)?.primary ?? ""), tipo);

      const fila: Record<string, unknown> = {
        user_id: conexion.user_id,
        date: String(t.date),
        amount: Math.abs(monto),
        type: tipo,
        description: "",
        bank_ref: texto,
        merchant: regla?.merchant ?? (t.merchant_name ? String(t.merchant_name) : null),
        category_id: categoria,
        external_id: String(t.transaction_id),
        source: "banco",
        ...(cuenta?.tabla === "accounts" ? { account_id: cuenta.id } : {}),
        ...(cuenta ? {
          payment_source_type: cuenta.tabla === "credit_cards" ? "credit_card" : "account",
          payment_source_id: cuenta.id,
        } : {}),
      };
      // El índice único por external_id hace el resto: si ya estaba, no entra.
      const { error } = await db.from("transactions").insert(fila);
      if (!error) nuevas++;
    }

    // Lo que el banco corrigió o borró después de publicarlo.
    for (const t of (pagina.removed ?? []) as Array<Record<string, unknown>>) {
      await db.from("transactions").delete()
        .eq("user_id", conexion.user_id).eq("external_id", String(t.transaction_id));
    }

    cursor = String(pagina.next_cursor ?? "");
    if (!pagina.has_more) break;
  }

  await db.from("bank_connections")
    .update({ cursor, last_sync: new Date().toISOString(), status: "activo" })
    .eq("id", conexion.id);
  return { nuevas };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405);
  if (!Deno.env.get("PLAID_CLIENT_ID") || !Deno.env.get("PLAID_SECRET")) {
    return json({ error: "Faltan los secretos PLAID_CLIENT_ID y PLAID_SECRET en Supabase." }, 500);
  }

  const db = admin();
  let cuerpo: Record<string, unknown> = {};
  try {
    cuerpo = await req.json();
  } catch { /* cuerpo vacío */ }

  // ---------- Webhook de Plaid (sin sesión) ----------
  // Plaid avisa que hay movimientos nuevos y sincronizamos al tiro: esto es
  // lo que hace que las transacciones lleguen "en vivo".
  if (cuerpo.webhook_type === "TRANSACTIONS") {
    const itemId = String(cuerpo.item_id ?? "");
    const { data: con } = await db.from("bank_connections")
      .select("id,user_id,access_token,cursor").eq("item_id", itemId).maybeSingle();
    if (con) {
      const r = await sincronizar(db, con);
      await db.from("wa_eventos").insert({
        user_id: con.user_id, tipo: "banco",
        detalle: { webhook: String(cuerpo.webhook_code ?? ""), nuevas: r.nuevas, error: r.error ?? null },
      });
    }
    return json({ ok: true });
  }

  // ---------- Acciones de la app (con sesión) ----------
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  const { data: quien } = token ? await db.auth.getUser(token) : { data: { user: null } };
  const userId = quien?.user?.id;
  if (!userId) return json({ error: "Sin sesión." }, 401);

  const accion = String(cuerpo.accion ?? "");

  try {
    if (accion === "link_token") {
      // Cuánta historia pedirle al banco. Plaid no le pregunta a la persona:
      // lo define quien integra, así que lo elige ella en la app. El tope de
      // Plaid son 730 días, y el banco entrega lo que tenga dentro de eso.
      const dias = Math.min(730, Math.max(30, Number(cuerpo.dias ?? 90)));
      const r = await plaid("/link/token/create", {
        user: { client_user_id: userId },
        client_name: "NucleoOS",
        products: ["transactions"],
        transactions: { days_requested: dias },
        country_codes: ["CA", "US"],
        language: "es",
        webhook: `${Deno.env.get("SUPABASE_URL")}/functions/v1/banco`,
      });
      return json({ link_token: r.link_token });
    }

    if (accion === "exchange") {
      const r = await plaid("/item/public_token/exchange", { public_token: String(cuerpo.public_token ?? "") });
      const accessToken = String(r.access_token);
      const itemId = String(r.item_id);
      const { data: con, error } = await db.from("bank_connections").upsert({
        user_id: userId, provider: "plaid", item_id: itemId, access_token: accessToken,
        institution_name: cuerpo.institucion ? String(cuerpo.institucion).slice(0, 120) : null,
      }, { onConflict: "user_id,item_id" }).select("id,user_id,access_token,cursor").single();
      if (error || !con) return json({ error: error?.message ?? "No pude guardar la conexión." }, 500);
      const s = await sincronizar(db, con);
      return json({ ok: true, nuevas: s.nuevas, error: s.error });
    }

    if (accion === "sync") {
      const { data: cons } = await db.from("bank_connections")
        .select("id,user_id,access_token,cursor").eq("user_id", userId).eq("status", "activo");
      let total = 0;
      for (const c of cons ?? []) total += (await sincronizar(db, c)).nuevas;
      return json({ ok: true, nuevas: total });
    }

    if (accion === "estado") {
      const { data } = await db.from("bank_connections")
        .select("id,institution_name,status,last_sync").eq("user_id", userId);
      return json({ conexiones: data ?? [] });
    }

    if (accion === "desconectar") {
      const id = String(cuerpo.id ?? "");
      const borrar = cuerpo.borrar === true;
      const { data: con } = await db.from("bank_connections")
        .select("access_token").eq("id", id).eq("user_id", userId).maybeSingle();
      if (!con) return json({ ok: true });

      let borradas = 0;
      if (borrar) {
        // Qué cuentas trajo ESTE banco: se preguntan mientras el token sirve,
        // así el borrado es preciso y no toca lo que la usuaria creó a mano.
        let externos: string[] = [];
        try {
          const r = await plaid("/accounts/get", { access_token: con.access_token });
          externos = ((r.accounts ?? []) as Array<Record<string, unknown>>).map((a) => String(a.account_id));
        } catch { /* el item ya no responde: se limpia por origen más abajo */ }

        const locales: string[] = [];
        if (externos.length > 0) {
          const { data: cuentas } = await db.from("accounts").select("id")
            .eq("user_id", userId).in("external_id", externos);
          const { data: tarjetas } = await db.from("credit_cards").select("id")
            .eq("user_id", userId).in("external_id", externos);
          for (const c of cuentas ?? []) locales.push(c.id);
          for (const c of tarjetas ?? []) locales.push(c.id);
        }

        // Los movimientos que vinieron del banco. Se borran por su origen y
        // su id externo, que solo pone la sincronización: filtrar además por
        // cuenta dejaba fuera los que quedaron sin cuenta mapeada, y esos se
        // quedaban huérfanos en la app.
        const { data: fuera } = await db.from("transactions")
          .delete().eq("user_id", userId).eq("source", "banco").not("external_id", "is", null)
          .select("id");
        borradas = (fuera ?? []).length;

        if (externos.length > 0) {
          await db.from("accounts").delete().eq("user_id", userId).in("external_id", externos);
          await db.from("credit_cards").delete().eq("user_id", userId).in("external_id", externos);
        } else {
          await db.from("accounts").delete().eq("user_id", userId).eq("is_connected", true).not("external_id", "is", null);
          await db.from("credit_cards").delete().eq("user_id", userId).not("external_id", "is", null);
        }
      }

      try { await plaid("/item/remove", { access_token: con.access_token }); } catch { /* ya no existe */ }
      await db.from("bank_connections").delete().eq("id", id).eq("user_id", userId);
      return json({ ok: true, borradas });
    }

    return json({ error: "Acción desconocida." }, 400);
  } catch (e) {
    return json({ error: String(e).slice(0, 300) }, 500);
  }
});
