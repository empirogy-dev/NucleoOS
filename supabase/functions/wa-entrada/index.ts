// Edge Function "wa-entrada": la puerta del chat a NucleoOS.
// Proveedor: Telegram Bot API (gratis, sin templates ni ventana de 24 h).
// Recibe el webhook de Telegram, verifica el secret token, deduplica y
// decide: comando directo (vincular, deshacer, silencio) o al buffer por
// silencio (wa_lotes) para que wa-motor lo procese.
//
// Nota de nombres: las tablas wa_* nacieron para WhatsApp y sirven igual
// para Telegram (la columna `telefono` guarda el chat_id, `wamid` guarda
// el update_id). Si algún día volvemos a WhatsApp, este archivo es lo
// único que cambia (la versión Meta Cloud API vive en el historial git).
//
// ⚠️ Al desplegar: DESACTIVA "Verify JWT" en esta función (Telegram no
// tiene sesión de Supabase; la seguridad la pone el secret token).
//
// Secretos necesarios (Edge Functions → Secrets):
//   TELEGRAM_BOT_TOKEN    el token que te da @BotFather
//   TELEGRAM_SECRET       palabra que tú inventas; se registra con setWebhook
//                         y Telegram la manda en cada webhook

import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

const GRACIA_TEXTO_MS = 12_000; // silencio antes de procesar
const GRACIA_AUDIO_MS = 22_000; // los audios suelen venir con un "ah y también"

// Las tablas de las que `deshacer` puede borrar (solo registros del agente, <24 h).
const TABLAS_DESHACER = new Set([
  "day_tasks", "exercise_logs", "energy_logs", "routine_logs", "meals",
  "habit_logs", "relationship_logs", "activity_log", "work_logs", "journal_entries",
]);

function admin(): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

function api(metodo: string): string {
  return `https://api.telegram.org/bot${Deno.env.get("TELEGRAM_BOT_TOKEN")}/${metodo}`;
}

/** ¿Es una zona IANA que Deno entiende? Si no, no la guardamos: mejor el
 *  default que una zona inventada que rompa el cálculo de "hoy". */
function zonaValida(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

async function enviarTexto(chatId: string, texto: string): Promise<void> {
  if (!Deno.env.get("TELEGRAM_BOT_TOKEN")) return;
  await fetch(api("sendMessage"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: Number(chatId), text: texto }),
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
  const ok = () => new Response("ok", { status: 200 }); // a Telegram SIEMPRE 200 salvo secret malo
  if (req.method !== "POST") return ok();

  const db = admin();
  const raw = await req.text();

  // 0) Utilidades de administración, autenticadas con WA_CRON_SECRET.
  //    Sirven para configurar el webhook de Telegram usando el token que ya
  //    vive en los secretos del servidor, sin que nadie tenga que copiarlo.
  const llaveAdmin = (Deno.env.get("WA_CRON_SECRET") ?? "").trim();
  const auth = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (llaveAdmin && auth === llaveAdmin) {
    try {
      const orden = JSON.parse(raw || "{}");
      const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
      if (!token) return new Response(JSON.stringify({ error: "falta TELEGRAM_BOT_TOKEN" }), { status: 500 });

      if (orden?.accion === "configurar_webhook") {
        const r = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/wa-entrada`,
            secret_token: String(orden.secret ?? ""),
            allowed_updates: ["message"],
          }),
        });
        return new Response(await r.text(), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (orden?.accion === "ver_webhook") {
        const r = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
        return new Response(await r.text(), { status: 200, headers: { "Content-Type": "application/json" } });
      }
    } catch { /* si el body no es una orden, sigue el camino normal */ }
  }

  // 1) Seguridad: Telegram manda el secret token que registramos con setWebhook.
  const secreto = Deno.env.get("TELEGRAM_SECRET");
  if (secreto) {
    const cabecera = req.headers.get("x-telegram-bot-api-secret-token") ?? "";
    if (cabecera !== secreto) return new Response("secret inválido", { status: 401 });
  } else {
    await evento(db, { tipo: "error", detalle: { aviso: "webhook sin TELEGRAM_SECRET configurado" } });
  }

  try {
    const body = JSON.parse(raw || "{}");
    const m = body?.message;
    // Solo mensajes de chats privados: el bot no participa en grupos.
    if (!m?.chat?.id || m.chat.type !== "private") return ok();

    const chatId = String(m.chat.id);
    const updateId = body?.update_id != null ? `tg-${body.update_id}` : null;
    const esVoz = Boolean(m.voice ?? m.audio);
    const esFoto = Array.isArray(m.photo) && m.photo.length > 0;
    const tipo: string = esVoz ? "audio" : esFoto ? "imagen" : "texto";
    const texto: string = String(m.text ?? m.caption ?? "").trim();
    // Audio y foto: guardamos el file_id y wa-motor lo descarga con el token.
    // En las fotos Telegram manda varios tamaños: usamos el más grande.
    const media = tipo !== "texto"
      ? JSON.stringify({
          fileId: m.voice?.file_id ?? m.audio?.file_id ?? m.photo?.[m.photo.length - 1]?.file_id ?? null,
          mime: m.voice?.mime_type ?? m.audio?.mime_type ?? (esFoto ? "image/jpeg" : null),
          caption: texto || null,
        })
      : null;

    // 2) Dedupe por update_id: un reintento de Telegram no puede duplicar registros.
    if (updateId) {
      const { data: visto } = await db.from("wa_mensajes").select("id").eq("wamid", updateId).maybeSingle();
      if (visto) return ok();
    }

    // 3) ¿De quién es este chat?
    const { data: vinculo } = await db.from("wa_vinculos").select("*").eq("telefono", chatId).maybeSingle();

    // 4) Comando de vinculación (funciona sin vínculo, con bypass del buffer).
    const cmdVincular = texto.toLowerCase().match(/^\/?vincular\s+(\d{6})$/);
    if (cmdVincular) {
      const { data: cod } = await db.from("wa_codigos")
        .select("id,user_id,timezone,expira_en,usado").eq("codigo", cmdVincular[1])
        .order("creado_en", { ascending: false }).limit(1).maybeSingle();
      if (!cod || cod.usado || new Date(cod.expira_en) < new Date()) {
        await enviarTexto(chatId, "Ese código ya no sirve. Genera uno nuevo en NucleoOS → Ajustes → Telegram.");
        return ok();
      }
      await db.from("wa_codigos").update({ usado: true }).eq("id", cod.id);
      await db.from("wa_vinculos").delete().eq("telefono", chatId); // si era de otra cuenta, el código manda
      // La zona horaria viaja en el código: así "hoy" y "ayer" son los de ELLA,
      // esté en Santiago, Bogotá, Madrid o Vancouver.
      const vinculoNuevo: Record<string, unknown> = { user_id: cod.user_id, telefono: chatId };
      if (cod.timezone && zonaValida(String(cod.timezone))) vinculoNuevo.timezone = cod.timezone;
      await db.from("wa_vinculos").upsert(vinculoNuevo, { onConflict: "user_id" });
      await evento(db, { user_id: cod.user_id, tipo: "inbound", detalle: { accion: "vinculado" } });
      await enviarTexto(chatId,
        "Listo, tu Telegram quedó vinculado a NucleoOS. 🎉\n\n" +
        "Cuéntame lo que hiciste y yo lo registro en tu app: \"hice 30 min de gimnasio\", \"tomé 2 vasos de agua\", \"recuérdame comprar pan\". También puedes mandarme audios.\n\n" +
        "Escribe \"deshacer\" para borrar lo último que registré, y \"silencio\" para pausar mis avisos.");
      return ok();
    }

    // 5) Chats sin vínculo: /start explica cómo vincular; el resto, UNA respuesta por día.
    if (!vinculo) {
      const hace24h = new Date(Date.now() - 24 * 3600_000).toISOString();
      const { data: yaRespondido } = await db.from("wa_mensajes")
        .select("id").eq("telefono", chatId).eq("direccion", "out").gte("creado_en", hace24h).limit(1);
      await db.from("wa_mensajes").insert({ telefono: chatId, direccion: "in", tipo: "sistema", contenido: null, wamid: updateId });
      if (texto === "/start" || !yaRespondido || yaRespondido.length === 0) {
        await enviarTexto(chatId, "Hola, soy el asistente de NucleoOS. Para conversar conmigo, genera tu código en la app (Ajustes → Telegram) y mándamelo así: vincular 123456");
        await db.from("wa_mensajes").insert({ telefono: chatId, direccion: "out", tipo: "sistema", contenido: "invitacion_vinculo" });
      }
      await evento(db, { tipo: "desconocido", detalle: {} });
      return ok();
    }

    // 6) Comandos con bypass del buffer.
    const cmd = texto.toLowerCase().replace(/^\//, "");
    if (cmd === "silencio") {
      await db.from("wa_vinculos").update({ avisos_activos: false }).eq("user_id", vinculo.user_id);
      await enviarTexto(chatId, "Avisos pausados. 🤫 Sigo registrando lo que me cuentes. Escribe \"avisos\" cuando los quieras de vuelta.");
      return ok();
    }
    if (cmd === "avisos") {
      await db.from("wa_vinculos").update({ avisos_activos: true }).eq("user_id", vinculo.user_id);
      await enviarTexto(chatId, "Avisos encendidos de nuevo. 💛");
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
        await enviarTexto(chatId, "No tengo registros recientes tuyos para borrar.");
        return ok();
      }
      const d = objetivo.detalle as { tabla: string; fila_id: string; resumen?: string };
      await db.from(d.tabla).delete().eq("id", d.fila_id).eq("user_id", vinculo.user_id);
      await db.from("wa_eventos").update({ detalle: { ...d, deshecho: true } }).eq("id", objetivo.id);
      await enviarTexto(chatId, `Borrado: ${d.resumen ?? "el último registro"}.`);
      return ok();
    }
    if (cmd === "start") {
      await enviarTexto(chatId, "Aquí estoy. 💛 Cuéntame lo que hiciste y lo registro en tu app.");
      return ok();
    }

    // 7) Al buffer: guardar el mensaje y empujar el lote (se dispara por silencio).
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
      user_id: vinculo.user_id, telefono: chatId, direccion: "in", tipo,
      contenido: media ?? texto, wamid: updateId, lote_id: loteId ?? null,
    });
    await evento(db, { user_id: vinculo.user_id, lote_id: loteId ?? null, tipo: "inbound", detalle: { tipo } });

    // Despertamos al motor apenas se cumpla el silencio, en vez de esperar al
    // cron: así la respuesta llega en segundos y no en un minuto largo. Si
    // esta llamada no prospera, el cron lo recoge igual un momento después.
    const llaveMotor = (Deno.env.get("WA_CRON_SECRET") ?? "").trim();
    const enSegundoPlano = (globalThis as { EdgeRuntime?: { waitUntil: (p: Promise<unknown>) => void } }).EdgeRuntime;
    if (llaveMotor && enSegundoPlano) {
      enSegundoPlano.waitUntil((async () => {
        await new Promise((r) => setTimeout(r, gracia + 1500));
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/wa-motor`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${llaveMotor}` },
          body: "{}",
        }).catch(() => undefined);
      })());
    }
    return ok();
  } catch (e) {
    await evento(db, { tipo: "error", detalle: { donde: "wa-entrada", error: String(e).slice(0, 300) } }).catch(() => undefined);
    return ok(); // 200 igual: los errores nuestros no deben hacer que Telegram reintente en bucle
  }
});
