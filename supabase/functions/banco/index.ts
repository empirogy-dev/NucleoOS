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

/** Kay avisa por Telegram del gasto recién llegado y pide la boleta. Ese
 *  es el circuito que crea el hábito: ves el gasto en el momento, mandas la
 *  foto, y queda categorizado y con respaldo sin esfuerzo. */
async function avisarGasto(db: SupabaseClient, userId: string, gastos: Array<{ id: string; monto: number; texto: string }>): Promise<void> {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!token || gastos.length === 0) return;
  const { data: v } = await db.from("wa_vinculos")
    .select("telefono,avisos_activos").eq("user_id", userId).maybeSingle();
  if (!v?.telefono || v.avisos_activos === false) return;

  // Tope de tres por sincronización: un banco que publica veinte de golpe no
  // puede convertirse en veinte notificaciones.
  const muestra = gastos.slice(0, 3);
  const resto = gastos.length - muestra.length;
  const lineas = muestra.map((g) => `💳 ${g.texto || "Gasto"}: ${g.monto}`);
  const texto = `${lineas.join("\n")}${resto > 0 ? `\n… y ${resto} más.` : ""}\n\n` +
    "¿Me mandas la foto de la boleta? La dejo pegada al gasto y con su categoría. 📎";
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: Number(v.telefono), text: texto }),
  }).catch(() => undefined);

  // La cola de gastos esperando boleta: la lee el motor cuando llega la foto.
  await db.from("user_kv").upsert({
    user_id: userId,
    key: "nucleoos-boletas-pendientes",
    value: { raw: JSON.stringify(muestra.map((g) => ({ id: g.id, texto: g.texto, monto: g.monto }))) },
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,key" });
}

/** Trae lo nuevo de una conexión y lo escribe en transacciones y saldos. */
async function sincronizar(db: SupabaseClient, conexion: {
  id: string; user_id: string; access_token: string; cursor: string | null;
}): Promise<{ nuevas: number; error?: string }> {
  let cursor = conexion.cursor ?? undefined;
  let nuevas = 0;
  const recienLlegados: Array<{ id: string; monto: number; texto: string }> = [];

  // Las cuentas del banco: el saldo lo manda él, nosotras lo reflejamos.
  const mapaCuentas = new Map<string, { id: string; tabla: "accounts" | "credit_cards" }>();
  try {
    const cuentas = await plaid("/accounts/get", { access_token: conexion.access_token });
    for (const c of (cuentas.accounts ?? []) as Array<Record<string, unknown>>) {
      const externo = String(c.account_id);
      const nombre = String(c.name ?? c.official_name ?? "Cuenta");
      const tipo = String(c.type ?? "");
      // Si el banco no manda saldo, NO se escribe cero. Escribir cero borra
      // el saldo bueno y deja una tarjeta con deuda real diciendo que no
      // debes nada: peor que no actualizar. Pasó con la American Express.
      const saldoCrudo = (c.balances as Record<string, unknown>)?.current;
      const saldo = saldoCrudo === null || saldoCrudo === undefined ? null : Number(saldoCrudo);
      const moneda = String((c.balances as Record<string, unknown>)?.iso_currency_code ?? "CAD");
      const ultimos4 = String(c.mask ?? "");

      if (tipo === "credit") {
        const { data: ya } = await db.from("credit_cards").select("id")
          .eq("user_id", conexion.user_id).eq("external_id", externo).maybeSingle();
        if (ya) {
          if (saldo !== null) {
            await db.from("credit_cards").update({ balance: Math.abs(saldo) }).eq("id", ya.id);
          }
          mapaCuentas.set(externo, { id: ya.id, tabla: "credit_cards" });
        } else {
          const { data: nueva } = await db.from("credit_cards").insert({
            user_id: conexion.user_id, name: nombre, last_four: ultimos4 || null,
            balance: Math.abs(saldo ?? 0), currency: moneda, external_id: externo,
          }).select("id").single();
          if (nueva) mapaCuentas.set(externo, { id: nueva.id, tabla: "credit_cards" });
        }
      } else {
        const { data: ya } = await db.from("accounts").select("id")
          .eq("user_id", conexion.user_id).eq("external_id", externo).maybeSingle();
        if (ya) {
          if (saldo !== null) {
            await db.from("accounts").update({ balance: saldo }).eq("id", ya.id);
          }
          mapaCuentas.set(externo, { id: ya.id, tabla: "accounts" });
        } else {
          const { data: nueva } = await db.from("accounts").insert({
            user_id: conexion.user_id, name: nombre, account_type: tipo === "depository" ? "Checking" : "Savings",
            balance: saldo ?? 0, currency: moneda, is_connected: true, external_id: externo,
          }).select("id").single();
          if (nueva) mapaCuentas.set(externo, { id: nueva.id, tabla: "accounts" });
        }
      }
    }
  } catch (e) {
    return { nuevas: 0, error: String(e).slice(0, 200) };
  }

  // Las reglas de comercio de la usuaria mandan sobre la categoría de Plaid.
  let { data: reglas } = await db.from("merchant_rules")
    .select("pattern,merchant,category_id,tx_type,destination_kind,destination_ref")
    .eq("user_id", conexion.user_id);
  if (!reglas) {
    // Sin la 0062 la regla existe pero sin el tipo: se lee lo de siempre.
    const previo = await db.from("merchant_rules")
      .select("pattern,merchant,category_id").eq("user_id", conexion.user_id);
    reglas = previo.data;
  }

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
      const texto = String(t.merchant_name ?? t.name ?? "");
      const cuenta = mapaCuentas.get(String(t.account_id));

      // Pagar la tarjeta de crédito NO es un ingreso ni un gasto: es plata que
      // se mueve de un bolsillo propio a otro. El banco lo publica dos veces,
      // una en la cuenta que paga y otra en la tarjeta que recibe, y sin esto
      // el lado de la tarjeta entraba como INGRESO e inflaba el mes.
      const regla = (reglas ?? []).find((r: { pattern: string }) =>
        r.pattern && texto.toLowerCase().includes(String(r.pattern).toLowerCase()));
      const cat = (t.personal_finance_category ?? {}) as Record<string, unknown>;
      const detalle = String(cat.detailed ?? "").toUpperCase();
      const esPagoDeTarjeta =
        detalle.includes("CREDIT_CARD_PAYMENT")
        // Red de seguridad para cuando el banco no manda la categoría: plata
        // que ENTRA a una tarjeta y se llama pago, solo puede ser esto.
        || (cuenta?.tabla === "credit_cards" && monto < 0 && /(payment|paiement|pago)/i.test(texto));

      // Lo que ella decidió una vez manda sobre lo que diga el banco.
      const tipo = regla?.tx_type ?? (esPagoDeTarjeta ? "transfer" : monto >= 0 ? "expense" : "income");
      const categoria = tipo === "transfer"
        ? null
        : regla?.category_id
          ?? await categoriaPara(db, conexion.user_id, String(cat.primary ?? ""), tipo);

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
        ...(tipo === "transfer"
          ? regla?.destination_kind
            // El destino que ella eligió al automatizar la regla.
            ? { destination_kind: regla.destination_kind, destination_ref: regla.destination_ref }
            : cuenta?.tabla === "credit_cards"
              // El lado de la tarjeta: la plata llega AQUÍ.
              ? { destination_kind: "card", destination_ref: cuenta.id }
              : {}
          : {}),
      };
      // Un cargo pasa por dos vidas: primero pendiente, después firme. Cuando
      // se hace firme, el banco le da un id NUEVO y apunta al pendiente con
      // pending_transaction_id. Si eso se ignora, el mismo gasto queda dos
      // veces: el pendiente que ella ya categorizó y el firme recién llegado,
      // muchas veces con otro nombre (Starlink pasa a llamarse Klarna, que es
      // quien cobra) y otra fecha.
      //
      // Así que no se inserta: se ACTUALIZA el pendiente. Se le pone el id
      // nuevo, la fecha y el monto definitivos, y se respeta todo lo que ella
      // escribió encima: su categoría, su comercio, sus etiquetas, su boleta.
      const idPendiente = t.pending_transaction_id ? String(t.pending_transaction_id) : "";
      if (idPendiente) {
        const { data: antes } = await db.from("transactions")
          .select("id,category_id,merchant")
          .eq("user_id", conexion.user_id).eq("external_id", idPendiente).maybeSingle();
        if (antes) {
          await db.from("transactions").update({
            external_id: String(t.transaction_id),
            date: String(t.date),
            amount: Math.abs(monto),
            type: tipo,
            bank_ref: texto,
            // Lo suyo manda: solo se rellena lo que estaba vacío.
            ...(antes.merchant ? {} : { merchant: fila.merchant }),
            ...(antes.category_id ? {} : { category_id: categoria }),
          }).eq("id", antes.id);
          continue;
        }
      }

      // El índice único por external_id hace el resto: si ya estaba, no entra.
      const { data: creada, error } = await db.from("transactions").insert(fila).select("id").single();
      if (!error && creada) {
        nuevas++;
        if (tipo === "expense") recienLlegados.push({ id: creada.id, monto: Math.abs(monto), texto });
      } else if (error && cuenta) {
        // Ya existía. No se toca lo que ella escribió (categoría, comercio,
        // etiquetas), pero SÍ se rehace el vínculo con su cuenta: si la
        // tarjeta se borró y se volvió a crear, sus movimientos quedaron
        // colgando y el banco es quien sabe a cuál pertenecen.
        await db.from("transactions")
          .update({
            payment_source_type: cuenta.tabla === "credit_cards" ? "credit_card" : "account",
            payment_source_id: cuenta.id,
            ...(cuenta.tabla === "accounts" ? { account_id: cuenta.id } : { account_id: null }),
          })
          .eq("user_id", conexion.user_id)
          .eq("external_id", String(t.transaction_id));
      }
    }

    // Lo que el banco corrigió después de publicarlo: la propina que subió el
    // monto, la fecha que se movió. Se corrige el dato del banco y no se toca
    // lo que ella escribió.
    for (const t of (pagina.modified ?? []) as Array<Record<string, unknown>>) {
      const monto = Number(t.amount);
      await db.from("transactions").update({
        date: String(t.date),
        amount: Math.abs(monto),
        bank_ref: String(t.merchant_name ?? t.name ?? ""),
      }).eq("user_id", conexion.user_id).eq("external_id", String(t.transaction_id));
    }

    // Lo que el banco borró después de publicarlo.
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
  // El aviso va DESPUÉS de guardar: nunca se anuncia lo que no quedó escrito.
  await avisarGasto(db, conexion.user_id, recienLlegados);
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
        // Explícito: cuentas Y tarjetas de crédito. Sin esto, la pantalla de
        // selección de Plaid puede dejar las tarjetas fuera de la lista.
        account_filters: {
          depository: { account_subtypes: ["checking", "savings"] },
          credit: { account_subtypes: ["credit card"] },
        },
        country_codes: ["CA", "US"],
        language: "es",
        // Bancos con OAuth (Capital One, Chase, Bank of America) no aceptan
        // que la clave se escriba en Plaid: mandan a su propio sitio y
        // vuelven aquí. Sin esto, esos bancos responden "credenciales
        // incorrectas" aunque estén perfectas.
        ...(Deno.env.get("PLAID_REDIRECT_URI") ? { redirect_uri: Deno.env.get("PLAID_REDIRECT_URI") } : {}),
        webhook: `${Deno.env.get("SUPABASE_URL")}/functions/v1/banco`,
      });
      return json({ link_token: r.link_token });
    }

    // Volver a abrir Plaid sobre una conexión que YA existe, para marcar las
    // cuentas que quedaron fuera (las tarjetas, típicamente). No pide las
    // credenciales de nuevo ni pierde lo ya sincronizado.
    if (accion === "agregar_cuentas") {
      const { data: con } = await db.from("bank_connections")
        .select("access_token").eq("id", String(cuerpo.id ?? "")).eq("user_id", userId).maybeSingle();
      if (!con) return json({ error: "No encontré esa conexión." }, 404);
      const r = await plaid("/link/token/create", {
        user: { client_user_id: userId },
        client_name: "NucleoOS",
        country_codes: ["CA", "US"],
        language: "es",
        access_token: con.access_token,
        update: { account_selection_enabled: true },
        ...(Deno.env.get("PLAID_REDIRECT_URI") ? { redirect_uri: Deno.env.get("PLAID_REDIRECT_URI") } : {}),
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
      // Con "desde_cero" se olvida el marcador de avance y el banco vuelve a
      // entregar toda su historia. Es lo que hay que hacer si los movimientos
      // se borraron a mano: si no, el banco cree que ya te los dio.
      const desdeCero = cuerpo.desde_cero === true;
      if (desdeCero) {
        await db.from("bank_connections").update({ cursor: null }).eq("user_id", userId);
      }
      const { data: cons } = await db.from("bank_connections")
        .select("id,user_id,access_token,cursor").eq("user_id", userId).eq("status", "activo");
      let total = 0;
      const errores: string[] = [];
      // Plaid sirve lo que tiene guardado, y lo refresca por su cuenta unas
      // pocas veces al día. Cuando la persona aprieta Actualizar, le pedimos
      // al banco datos frescos AHORA. Si el plan no incluye este refresco, se
      // ignora y seguimos con lo que haya: nunca bloquea la sincronización.
      for (const c of cons ?? []) {
        try {
          await plaid("/transactions/refresh", { access_token: c.access_token });
        } catch { /* sin refresco a pedido: seguimos con lo que Plaid tenga */ }
      }
      for (const c of cons ?? []) {
        const r = await sincronizar(db, desdeCero ? { ...c, cursor: null } : c);
        total += r.nuevas;
        if (r.error) errores.push(r.error);
      }
      return json({ ok: true, nuevas: total, ...(errores.length ? { aviso: errores.join(" | ") } : {}) });
    }

    // ---------- Diagnóstico ----------
    // Cuando un banco se conecta pero no aparece ni un movimiento, hay que
    // poder ver dónde se cortó: si el banco entregó las cuentas, en qué
    // estado está el vínculo, y cuántos movimientos tenemos de cada cuenta.
    // Sin esto, la única respuesta posible es "no sé".
    if (accion === "diagnostico") {
      const { data: cons } = await db.from("bank_connections")
        .select("id,institution_name,access_token,cursor,status,last_sync").eq("user_id", userId);
      const salida: Array<Record<string, unknown>> = [];
      for (const c of cons ?? []) {
        const fila: Record<string, unknown> = {
          id: c.id,
          banco: c.institution_name ?? "Banco",
          estado: c.status,
          ultima_sync: c.last_sync,
          trajo_algo_alguna_vez: Boolean(c.cursor),
        };
        try {
          const item = await plaid("/item/get", { access_token: c.access_token });
          const it = (item.item ?? {}) as Record<string, unknown>;
          fila.error_del_banco = (it.error as Record<string, unknown>)?.error_code ?? null;
          fila.productos = it.billed_products ?? it.available_products ?? null;
        } catch (e) {
          fila.error_del_banco = String(e).slice(0, 160);
        }
        try {
          const r = await plaid("/accounts/get", { access_token: c.access_token });
          const cuentas: Array<Record<string, unknown>> = [];
          for (const a of (r.accounts ?? []) as Array<Record<string, unknown>>) {
            const externo = String(a.account_id);
            // Cuántos movimientos tenemos guardados de esa cuenta.
            const tarjeta = String(a.type) === "credit";
            const { data: local } = await db.from(tarjeta ? "credit_cards" : "accounts")
              .select("id").eq("user_id", userId).eq("external_id", externo).maybeSingle();
            let guardados = 0;
            if (local) {
              const { count } = await db.from("transactions")
                .select("id", { count: "exact", head: true })
                .eq("user_id", userId)
                .eq(tarjeta ? "payment_source_id" : "account_id", local.id);
              guardados = count ?? 0;
            }
            cuentas.push({
              nombre: a.name, tipo: a.type, subtipo: a.subtype, ultimos4: a.mask,
              en_nucleoos: Boolean(local), movimientos_guardados: guardados,
            });
          }
          fila.cuentas = cuentas;
        } catch (e) {
          fila.cuentas = String(e).slice(0, 160);
        }
        salida.push(fila);
      }
      return json({ conexiones: salida });
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
