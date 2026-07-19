// Edge Function "wa-entrada": la puerta de WhatsApp a NucleoOS.
// Recibe el webhook de YCloud, verifica la firma, filtra ecos, deduplica
// por wamid y decide: comando directo (vincular, deshacer, silencio) o
// al buffer por silencio (wa_lotes) para que wa-motor lo procese.
//
// ⚠️ Al desplegar: DESACTIVA "Verify JWT" en esta función (Dashboard →
// Edge Functions → wa-entrada → Details): YCloud no tiene sesión de
// Supabase. La seguridad la ponen la firma HMAC y el vínculo.
//
// Secretos necesarios (Edge Functions → Secrets):
//   YCLOUD_API_KEY        para responder por WhatsApp
//   YCLOUD_WEBHOOK_SECRET para verificar la firma del webhook
//   YCLOUD_NUMERO         el número del bot en E.164 (ej. +16045551234)

import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

const GRACIA_TEXTO_MS = 20_000; // silencio antes de procesar
const GRACIA_AUDIO_MS = 35_000; // los audios suelen venir con un "ah y también"
const TOLERANCIA_FIRMA_MS = 5 * 60_000;

// Las tablas de las que `deshacer` puede borrar (solo registros del agente, <24 h).
const TABLAS_DESHACER = new Set([
  "day_tasks", "exercise_logs", "energy_logs", "routine_logs", "meals",
  "habit_logs", "relationship_logs", "activity_log", "work_logs", "journal_entries",
]);

function admin(): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

/** Normaliza a E.164 con +: YCloud a veces manda el número pelado. */
function e164(t: string): string {
  const limpio = String(t ?? "").replace(/[^\d+]/g, "");
  return limpio.startsWith("+") ? limpio : `+${limpio}`;
}

async function hmacHex(secreto: string, mensaje: string): Promise<string> {
  const clave = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secreto), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const firma = await crypto.subtle.sign("HMAC", clave, new TextEncoder().encode(mensaje));
  return Array.from(new Uint8Array(firma)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function igualesSeguro(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}

/** Envía texto libre por YCloud. Solo se usa con la ventana recién abierta
 *  (el inbound acaba de llegar), así que el texto libre está permitido. */
async function enviarTexto(telefono: string, texto: string): Promise<void> {
  const key = Deno.env.get("YCLOUD_API_KEY");
  const desde = Deno.env.get("YCLOUD_NUMERO");
  if (!key || !desde) return; // sin credenciales aún: el registro igual queda hecho
  await fetch("https://api.ycloud.com/v2/whatsapp/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": key },
    body: JSON.stringify({ from: desde, to: telefono, type: "text", text: { body: texto } }),
  }).catch(() => undefined);
}

async function evento(db: SupabaseClient, fila: {
  user_id?: string | null; lote_id?: string | null; tipo: string; detalle?: Record<string, unknown>;
}): Promise<void> {
  await db.from("wa_eventos").insert({
    user_id: fila.user_id ?? null, lote_id: fila.lote_id ?? null,
    tipo: fila.tipo, detalle: fila.detalle ?? {},
  });
}

Deno.serve(async (req: Request) => {
  const ok = () => new Response("ok", { status: 200 }); // a YCloud SIEMPRE 200 salvo firma mala
  if (req.method !== "POST") return ok();

  // 1) Firma: HMAC-SHA256 sobre `${timestamp}.${rawBody}`, anti-replay 5 min.
  const raw = await req.text();
  const secreto = Deno.env.get("YCLOUD_WEBHOOK_SECRET");
  const db = admin();
  if (secreto) {
    const firma = req.headers.get("x-ycloud-signature") ?? req.headers.get("ycloud-signature") ?? "";
    const ts = req.headers.get("x-ycloud-timestamp") ?? req.headers.get("ycloud-timestamp") ?? "";
    const edad = Math.abs(Date.now() - Number(ts) * (String(ts).length > 11 ? 1 : 1000));
    const esperada = await hmacHex(secreto, `${ts}.${raw}`);
    if (!firma || !ts || edad > TOLERANCIA_FIRMA_MS || !igualesSeguro(esperada, firma)) {
      return new Response("firma inválida", { status: 401 });
    }
  } else {
    await evento(db, { tipo: "error", detalle: { aviso: "webhook sin YCLOUD_WEBHOOK_SECRET configurado" } });
  }

  try {
    const body = JSON.parse(raw);

    // 2) Solo mensajes entrantes. Los ecos de nuestros propios envíos se ignoran (evita bucles).
    const tipoEvento = String(body?.type ?? "");
    if (tipoEvento.includes("echo")) return ok();
    const m = body?.whatsappInboundMessage;
    if (!m?.from) return ok();

    const telefono = e164(m.from);
    const wamid = m.wamid ?? m.id ?? null;
    const tipo: string = m.type === "audio" ? "audio" : m.type === "image" ? "imagen" : "texto";
    const texto: string = (m.text?.body ?? m.image?.caption ?? "").trim();
    // Audio e imagen: guardamos el enlace y wa-motor lo descarga (validando el host).
    const media = tipo !== "texto"
      ? JSON.stringify({ link: m.audio?.link ?? m.image?.link ?? null, mime: m.audio?.mimeType ?? m.image?.mimeType ?? null, caption: texto || null })
      : null;

    // 3) Dedupe por wamid: un reintento de YCloud no puede duplicar registros.
    if (wamid) {
      const { data: visto } = await db.from("wa_mensajes").select("id").eq("wamid", wamid).maybeSingle();
      if (visto) return ok();
    }

    // 4) ¿De quién es este número?
    const { data: vinculo } = await db.from("wa_vinculos").select("*").eq("telefono", telefono).maybeSingle();

    // 5) Comando de vinculación (funciona sin vínculo, con bypass del buffer).
    const cmdVincular = texto.toLowerCase().match(/^vincular\s+(\d{6})$/);
    if (cmdVincular) {
      const { data: cod } = await db.from("wa_codigos")
        .select("id,user_id,expira_en,usado").eq("codigo", cmdVincular[1])
        .order("creado_en", { ascending: false }).limit(1).maybeSingle();
      if (!cod || cod.usado || new Date(cod.expira_en) < new Date()) {
        await enviarTexto(telefono, "Ese código ya no sirve. Genera uno nuevo en NucleoOS → Ajustes → WhatsApp.");
        return ok();
      }
      await db.from("wa_codigos").update({ usado: true }).eq("id", cod.id);
      await db.from("wa_vinculos").delete().eq("telefono", telefono); // si era de otra cuenta, el código manda
      await db.from("wa_vinculos").upsert({
        user_id: cod.user_id, telefono, ventana_expira: new Date(Date.now() + 24 * 3600_000).toISOString(),
      }, { onConflict: "user_id" });
      await evento(db, { user_id: cod.user_id, tipo: "inbound", detalle: { accion: "vinculado" } });
      await enviarTexto(telefono,
        "Listo, tu WhatsApp quedó vinculado a NucleoOS. 🎉\n\n" +
        "Cuéntame lo que hiciste y yo lo registro en tu app: \"hice 30 min de gimnasio\", \"tomé 2 vasos de agua\", \"recuérdame comprar pan\". También puedes mandarme audios.\n\n" +
        "Escribe \"deshacer\" para borrar lo último que registré, y \"silencio\" para pausar mis avisos.");
      return ok();
    }

    // 6) Números sin vínculo: UNA respuesta por día y nada más. Jamás llegan al motor.
    if (!vinculo) {
      const hace24h = new Date(Date.now() - 24 * 3600_000).toISOString();
      const { data: yaRespondido } = await db.from("wa_mensajes")
        .select("id").eq("telefono", telefono).eq("direccion", "out").gte("creado_en", hace24h).limit(1);
      await db.from("wa_mensajes").insert({ telefono, direccion: "in", tipo: "sistema", contenido: null, wamid });
      if (!yaRespondido || yaRespondido.length === 0) {
        await enviarTexto(telefono, "Hola, soy el asistente de NucleoOS. Para conversar conmigo, vincula tu número desde la app: Ajustes → WhatsApp.");
        await db.from("wa_mensajes").insert({ telefono, direccion: "out", tipo: "sistema", contenido: "invitacion_vinculo" });
      }
      await evento(db, { tipo: "desconocido", detalle: { telefono_hash: telefono.slice(-4) } });
      return ok();
    }

    // Cada mensaje entrante reabre la ventana de 24 h.
    await db.from("wa_vinculos").update({
      ventana_expira: new Date(Date.now() + 24 * 3600_000).toISOString(),
    }).eq("user_id", vinculo.user_id);

    // 7) Comandos con bypass del buffer.
    const cmd = texto.toLowerCase();
    if (cmd === "silencio") {
      await db.from("wa_vinculos").update({ avisos_activos: false }).eq("user_id", vinculo.user_id);
      await enviarTexto(telefono, "Avisos pausados. 🤫 Sigo registrando lo que me cuentes. Escribe \"avisos\" cuando los quieras de vuelta.");
      return ok();
    }
    if (cmd === "avisos") {
      await db.from("wa_vinculos").update({ avisos_activos: true }).eq("user_id", vinculo.user_id);
      await enviarTexto(telefono, "Avisos encendidos de nuevo. 💛");
      return ok();
    }
    if (cmd === "deshacer") {
      const hace24h = new Date(Date.now() - 24 * 3600_000).toISOString();
      const { data: ult } = await db.from("wa_eventos")
        .select("id,detalle").eq("user_id", vinculo.user_id).eq("tipo", "tool")
        .gte("creado_en", hace24h).order("creado_en", { ascending: false }).limit(10);
      const objetivo = (ult ?? []).find((e) => {
        const d = e.detalle as Record<string, unknown>;
        return d?.tabla && d?.fila_id && !d?.deshecho && TABLAS_DESHACER.has(String(d.tabla));
      });
      if (!objetivo) {
        await enviarTexto(telefono, "No tengo registros recientes tuyos para borrar.");
        return ok();
      }
      const d = objetivo.detalle as { tabla: string; fila_id: string; resumen?: string };
      await db.from(d.tabla).delete().eq("id", d.fila_id).eq("user_id", vinculo.user_id);
      await db.from("wa_eventos").update({ detalle: { ...d, deshecho: true } }).eq("id", objetivo.id);
      await enviarTexto(telefono, `Borrado: ${d.resumen ?? "el último registro"}.`);
      return ok();
    }

    // 8) Al buffer: guardar el mensaje y empujar el lote (se dispara por silencio).
    const gracia = tipo === "audio" ? GRACIA_AUDIO_MS : GRACIA_TEXTO_MS;
    const procesarDespues = new Date(Date.now() + gracia).toISOString();
    const { data: loteAbierto } = await db.from("wa_lotes")
      .select("id").eq("user_id", vinculo.user_id).eq("estado", "en_buffer")
      .order("creado_en", { ascending: false }).limit(1).maybeSingle();

    let loteId = loteAbierto?.id as string | undefined;
    if (loteId) {
      await db.from("wa_lotes").update({ procesar_despues_de: procesarDespues }).eq("id", loteId);
    } else {
      const { data: nuevo } = await db.from("wa_lotes")
        .insert({ user_id: vinculo.user_id, procesar_despues_de: procesarDespues })
        .select("id").single();
      loteId = nuevo?.id;
    }

    await db.from("wa_mensajes").insert({
      user_id: vinculo.user_id, telefono, direccion: "in", tipo,
      contenido: media ?? texto, wamid, lote_id: loteId ?? null,
    });
    await evento(db, { user_id: vinculo.user_id, lote_id: loteId ?? null, tipo: "inbound", detalle: { tipo } });
    return ok();
  } catch (e) {
    await evento(db, { tipo: "error", detalle: { donde: "wa-entrada", error: String(e).slice(0, 300) } }).catch(() => undefined);
    return ok(); // 200 igual: los errores nuestros no deben hacer que YCloud reintente en bucle
  }
});
