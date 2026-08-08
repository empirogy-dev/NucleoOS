// Edge Function "wa-motor": el Escriba de NucleoOS.
// La llama el cron cada minuto (migración 0051). Drena los lotes vencidos
// del buffer, arma el bloque semántico (texto + audios + fotos), se lo da
// a Gemini con las tools de registro, escribe en las MISMAS tablas de la
// app a nombre de la usuaria del vínculo, y confirma por el chat.
//
// Seguridad (docs/whatsapp/SECURITY-AUDIT.md):
//   SEC-N2: el user_id sale del vínculo, jamás del modelo. Toda escritura
//           lleva su user_id explícito.
//   SEC-N3: máximo 5 tools por turno y 50 escrituras al día por vínculo.
//   SEC-N5: los medios se bajan del host oficial de Telegram.
//   COST-N1: comparte el tope diario de ia_uso con la app.
//
// Secretos: GEMINI_API_KEY · TELEGRAM_BOT_TOKEN · WA_CRON_SECRET
// (proveedor: Telegram Bot API, gratis y sin ventana de 24 h)
// Esta función se protege sola: exige en Authorization la palabra de
// WA_CRON_SECRET (o una llave de servicio), así solo el cron la despierta.

import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

const MODEL = "gemini-flash-latest";
const TOPE_DIARIO_IA = 80;        // compartido con la Edge Function "ia" (tabla ia_uso)
const MAX_TOOLS_POR_TURNO = 5;
const MAX_ESCRITURAS_DIA = 50;
const LEASE_MS = 5 * 60_000;
const MAX_INTENTOS = 3;

function admin(): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL")!, (Deno.env.get("SB_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"))!);
}

// ---------- Utilidades ----------

/** La fecha de la usuaria en SU zona (Santiago, Bogotá, Madrid, Vancouver…).
 *  Si la zona guardada fuera inválida, cae a UTC en vez de romper el lote. */
function enZona(timezone: string, d: Date): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(d); // YYYY-MM-DD
  } catch {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "UTC" }).format(d);
  }
}

function hoyEn(timezone: string): string {
  return enZona(timezone, new Date());
}

function ayerEn(timezone: string): string {
  return enZona(timezone, new Date(Date.now() - 24 * 3600_000));
}

/** Manda el mensaje y DICE si pudo: un envio fallido en silencio deja a la
 *  usuaria esperando una respuesta que nunca llega. */
/** La hora local de la usuaria, "HH:MM". */
function horaEn(timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
  }
}

/** Minutos desde medianoche, para comparar horas sin enredos. */
function minutosDe(hhmm: string): number {
  const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : -1;
}

async function enviarTexto(chatId: string, texto: string): Promise<{ ok: boolean; error?: string }> {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!token) return { ok: false, error: "falta el secreto TELEGRAM_BOT_TOKEN" };
  if (!texto.trim()) return { ok: false, error: "mensaje vacio" };
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: Number(chatId), text: texto }),
    });
    const j = await res.json();
    if (!j?.ok) return { ok: false, error: String(j?.description ?? `http ${res.status}`).slice(0, 200) };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e).slice(0, 200) };
  }
}

/** Telegram entrega los medios en dos pasos: getFile cambia el file_id por
 *  un file_path, y ese path se descarga del host oficial de Telegram
 *  (api.telegram.org, cumpliendo SEC-N5 por construcción). */
async function bajarMedia(fileId: string): Promise<{ b64: string; mime: string } | null> {
  try {
    const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!token || !/^[\w-]+$/.test(fileId)) return null;
    const meta = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`);
    if (!meta.ok) return null;
    const info = await meta.json();
    const path = String(info?.result?.file_path ?? "");
    if (!path || path.includes("..")) return null;
    const res = await fetch(`https://api.telegram.org/file/bot${token}/${path}`, { redirect: "error" });
    if (!res.ok) return null;
    // El tipo se deduce de la EXTENSION, no del content-type: Telegram sirve
    // las notas de voz como binario generico y Gemini rechaza lo que no
    // reconoce como audio o imagen.
    const ext = path.toLowerCase().split(".").pop() ?? "";
    const porExtension: Record<string, string> = {
      oga: "audio/ogg", ogg: "audio/ogg", opus: "audio/ogg",
      mp3: "audio/mp3", m4a: "audio/mp4", mp4: "audio/mp4",
      wav: "audio/wav", aac: "audio/aac", flac: "audio/flac",
      jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
    };
    const delServidor = res.headers.get("content-type") ?? "";
    const mime = porExtension[ext]
      ?? (delServidor.startsWith("audio/") || delServidor.startsWith("image/") ? delServidor : "audio/ogg");
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.length > 8 * 1024 * 1024) return null; // 8 MB de tope
    let bin = "";
    const paso = 0x8000;
    for (let i = 0; i < buf.length; i += paso) bin += String.fromCharCode(...buf.subarray(i, i + paso));
    return { b64: btoa(bin), mime };
  } catch {
    return null;
  }
}

// ---------- El contexto de las tools: la identidad viene del servidor ----------

interface Ctx {
  db: SupabaseClient;
  userId: string;        // del vínculo, JAMÁS del modelo (SEC-N2)
  timezone: string;
  loteId: string;
  escrituras: { tabla: string; fila_id: string; resumen: string }[];
}

type ToolFn = (args: Record<string, unknown>, ctx: Ctx) => Promise<string>;

function diasAtrasEn(timezone: string, n: number): string {
  return enZona(timezone, new Date(Date.now() - n * 24 * 3600_000));
}

const DIAS_SEMANA: Record<string, number> = {
  domingo: 0, sunday: 0, lunes: 1, monday: 1, segunda: 1, martes: 2, tuesday: 2,
  miercoles: 3, "miércoles": 3, wednesday: 3, quarta: 3, jueves: 4, thursday: 4, quinta: 4,
  viernes: 5, friday: 5, sexta: 5, sabado: 6, "sábado": 6, saturday: 6,
};

/** Fecha de los args, entendiendo referencias relativas: "ayer", "anteayer",
 *  "hace 3 dias", "el lunes" (el lunes mas reciente hacia atras). */
function fechaDe(args: Record<string, unknown>, ctx: Ctx): string {
  const f = String(args.fecha ?? "").toLowerCase().trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(f)) return f;
  if (f === "ayer" || f === "yesterday" || f === "ontem") return ayerEn(ctx.timezone);
  if (f === "anteayer" || f === "antier" || f === "anteontem") return diasAtrasEn(ctx.timezone, 2);
  const hace = f.match(/hace\s+(\d{1,2})\s*d/) ?? f.match(/(\d{1,2})\s+days?\s+ago/);
  if (hace) return diasAtrasEn(ctx.timezone, Math.min(60, Number(hace[1])));
  const dia = Object.keys(DIAS_SEMANA).find((d) => f.includes(d));
  if (dia !== undefined) {
    const objetivo = DIAS_SEMANA[dia];
    // El dia de la semana de hoy, en la zona de la usuaria.
    for (let n = 1; n <= 7; n++) {
      const fecha = diasAtrasEn(ctx.timezone, n);
      const [y, m, d] = fecha.split("-").map(Number);
      if (new Date(Date.UTC(y, m - 1, d)).getUTCDay() === objetivo) return fecha;
    }
  }
  return hoyEn(ctx.timezone);
}

/** Un instante "fecha + hora local de la usuaria" convertido a ISO UTC.
 *  Usa el offset actual de la zona: exacto para fechas cercanas, que es
 *  el caso del registro conversacional. */
function isoEnZona(timezone: string, fecha: string, hora: string): string | null {
  try {
    const ahora = new Date();
    const enTz = new Date(ahora.toLocaleString("en-US", { timeZone: timezone }));
    const offMin = Math.round((enTz.getTime() - ahora.getTime()) / 60000);
    const base = new Date(`${fecha}T${hora}:00Z`);
    if (isNaN(base.getTime())) return null;
    return new Date(base.getTime() - offMin * 60000).toISOString();
  } catch {
    return null;
  }
}

/** El momento de la comida segun la hora local: nadie deberia tener que
 *  decir "esto fue desayuno" a las 8 de la manana. */
function momentoPorHora(hhmm: string): string {
  const h = Number(hhmm.slice(0, 2));
  if (h >= 5 && h < 11) return "desayuno";
  if (h >= 11 && h < 15) return "almuerzo";
  if (h >= 15 && h < 19) return "snack";
  return "cena";
}

async function anotarEscritura(ctx: Ctx, tabla: string, filaId: string, resumen: string): Promise<void> {
  ctx.escrituras.push({ tabla, fila_id: filaId, resumen });
  await ctx.db.from("wa_eventos").insert({
    user_id: ctx.userId, lote_id: ctx.loteId, tipo: "tool",
    detalle: { tabla, fila_id: filaId, resumen },
  });
}

// ---------- Estimación de macros (mismo espíritu que el plato de la app) ----------

async function estimarMacros(descripcion: string): Promise<{ kcal: number; prot: number; carb: number; grasa: number } | null> {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) return null;
  const prompt =
    "Eres nutricionista. Estima los macros de este plato descrito en lenguaje casual. " +
    "Responde SOLO un JSON: {\"kcal\":number,\"prot\":number,\"carb\":number,\"grasa\":number}. " +
    `Plato: ${descripcion}`;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    const j = await res.json();
    const texto = j?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const m = texto.match(/\{[^}]+\}/);
    return m ? JSON.parse(m[0]) : null;
  } catch {
    return null;
  }
}

// ---------- Catálogo de tools del Escriba (v1, sin dinero: eso llega con confirmación) ----------

const TOOLS: Record<string, { decl: Record<string, unknown>; run: ToolFn }> = {
  crear_tarea: {
    decl: {
      name: "crear_tarea",
      description: "Anota una tarea para hoy en la lista de Tareas del día de la usuaria.",
      parameters: { type: "OBJECT", properties: { titulo: { type: "STRING", description: "La tarea, corta y clara" } }, required: ["titulo"] },
    },
    run: async (args, ctx) => {
      const titulo = String(args.titulo ?? "").slice(0, 200).trim();
      if (!titulo) return "Falta el texto de la tarea.";
      const { data, error } = await ctx.db.from("day_tasks")
        .insert({ title: titulo, date: hoyEn(ctx.timezone), user_id: ctx.userId }).select("id").single();
      if (error || !data) return `No pude anotar la tarea: ${error?.message ?? "sin fila"}`;
      await anotarEscritura(ctx, "day_tasks", data.id, `tarea "${titulo}"`);
      return `Tarea anotada: ${titulo}`;
    },
  },

  completar_tarea: {
    decl: {
      name: "completar_tarea",
      description: "Marca como hecha una tarea de hoy que la usuaria dice que ya terminó.",
      parameters: { type: "OBJECT", properties: { titulo: { type: "STRING", description: "Palabras de la tarea a marcar" } }, required: ["titulo"] },
    },
    run: async (args, ctx) => {
      const palabras = String(args.titulo ?? "").trim();
      const { data } = await ctx.db.from("day_tasks").select("id,title")
        .eq("user_id", ctx.userId).eq("date", hoyEn(ctx.timezone)).eq("done", false)
        .ilike("title", `%${palabras.split(/\s+/)[0] ?? ""}%`).limit(1).maybeSingle();
      if (!data) return `No encontré una tarea pendiente que se parezca a "${palabras}".`;
      await ctx.db.from("day_tasks").update({ done: true }).eq("id", data.id).eq("user_id", ctx.userId);
      return `Marcada como hecha: ${data.title}`;
    },
  },

  registrar_ejercicio: {
    decl: {
      name: "registrar_ejercicio",
      description: "Registra una sesión de ejercicio en Energía. Tipos válidos: Caminata, Yoga, Gimnasio, Correr, Bicicleta, Baile, Natación, Fútbol, Tenis, Pilates, Escalada, Patinaje, Boxeo, Otro.",
      parameters: {
        type: "OBJECT",
        properties: {
          tipo: { type: "STRING", description: "Uno de los tipos válidos, en español" },
          minutos: { type: "NUMBER", description: "Duración en minutos, entre 1 y 600" },
          fecha: { type: "STRING", description: "YYYY-MM-DD, o 'ayer'. Vacío = hoy" },
        },
        required: ["tipo", "minutos"],
      },
    },
    run: async (args, ctx) => {
      const minutos = Math.round(Number(args.minutos));
      if (!(minutos >= 1 && minutos <= 600)) return "Los minutos deben estar entre 1 y 600. Pregunta a la usuaria.";
      const tipo = String(args.tipo ?? "Otro");
      const fecha = fechaDe(args, ctx);
      const { data, error } = await ctx.db.from("exercise_logs")
        .insert({ date: fecha, kind: tipo, minutes: minutos, user_id: ctx.userId }).select("id").single();
      if (error || !data) return `No pude registrarlo: ${error?.message ?? "sin fila"}`;
      await anotarEscritura(ctx, "exercise_logs", data.id, `${tipo} ${minutos} min (${fecha})`);
      return `Registrado: ${tipo}, ${minutos} min, fecha ${fecha}. Quedó en Energía y empuja sus metas conectadas.`;
    },
  },

  registrar_agua: {
    decl: {
      name: "registrar_agua",
      description: "Suma vasos de agua al día de hoy (meta diaria: 8 vasos).",
      parameters: { type: "OBJECT", properties: { vasos: { type: "NUMBER", description: "Cuántos vasos sumar, 1 a 8" }, fecha: { type: "STRING", description: "YYYY-MM-DD o 'ayer'. Vacío = hoy" } }, required: ["vasos"] },
    },
    run: async (args, ctx) => {
      const vasos = Math.round(Number(args.vasos));
      if (!(vasos >= 1 && vasos <= 8)) return "Los vasos deben ser entre 1 y 8.";
      const fecha = fechaDe(args, ctx);
      const { data: fila } = await ctx.db.from("energy_logs").select("id,water_cups")
        .eq("user_id", ctx.userId).eq("date", fecha).maybeSingle();
      const total = Math.min(8, Number(fila?.water_cups ?? 0) + vasos);
      const { error } = await ctx.db.from("energy_logs")
        .upsert({ user_id: ctx.userId, date: fecha, water_cups: total }, { onConflict: "user_id,date" });
      if (error) return `No pude registrar el agua: ${error.message}`;
      await anotarEscritura(ctx, "energy_logs", fecha, `agua ${total} vasos (${fecha})`);
      return `Agua registrada: ${total} de 8 vasos el ${fecha}.`;
    },
  },

  registrar_sueno: {
    decl: {
      name: "registrar_sueno",
      description: "Registra a qué hora se acostó y despertó la usuaria (el sueño de anoche).",
      parameters: {
        type: "OBJECT",
        properties: {
          acoste: { type: "STRING", description: "Hora de acostarse HH:MM (24 h)" },
          desperte: { type: "STRING", description: "Hora de despertar HH:MM (24 h)" },
          fecha: { type: "STRING", description: "El día en que DESPERTÓ: YYYY-MM-DD o 'ayer'. Vacío = hoy" },
        },
        required: ["acoste", "desperte"],
      },
    },
    run: async (args, ctx) => {
      const hhmm = /^\d{1,2}:\d{2}$/;
      const acoste = String(args.acoste ?? ""), desperte = String(args.desperte ?? "");
      if (!hhmm.test(acoste) || !hhmm.test(desperte)) return "Las horas deben venir como HH:MM.";
      const fecha = fechaDe(args, ctx);
      const { error } = await ctx.db.from("routine_logs")
        .upsert({ user_id: ctx.userId, date: fecha, bed_time: acoste, wake_time: desperte }, { onConflict: "user_id,date" });
      if (error) return `No pude registrar el sueño: ${error.message}`;
      return `Sueño registrado: te acostaste ${acoste} y despertaste ${desperte}.`;
    },
  },

  registrar_plato: {
    decl: {
      name: "registrar_plato",
      description: "Registra una comida en Nutrición con macros estimados a partir de la descripción.",
      parameters: {
        type: "OBJECT",
        properties: {
          descripcion: { type: "STRING", description: "Qué comió, con el detalle que haya. Si es vago, estima una porción normal y registra igual" },
          momento: { type: "STRING", description: "desayuno | almuerzo | once | cena | snack. Vacío = se infiere por la hora" },
          fecha: { type: "STRING", description: "YYYY-MM-DD, 'ayer', 'anteayer', 'hace 2 dias' o 'el lunes'. Vacío = hoy" },
          hora: { type: "STRING", description: "HH:MM si la usuaria dijo a qué hora comió. Vacío si no" },
        },
        required: ["descripcion"],
      },
    },
    run: async (args, ctx) => {
      const desc = String(args.descripcion ?? "").slice(0, 400).trim();
      if (desc.length < 3) return "Registra igual con lo que dijo: usa la descripción tal cual, no le pidas repetir.";
      const macros = await estimarMacros(desc);
      const fecha = fechaDe(args, ctx);
      const esHoy = fecha === hoyEn(ctx.timezone);
      const hora = /^\d{2}:\d{2}$/.test(String(args.hora ?? "")) ? String(args.hora) : null;
      // "once" es merienda chilena: en la app vive como snack.
      const momentoCrudo = String(args.momento ?? "") === "once" ? "snack" : String(args.momento ?? "");
      const momento = ["desayuno", "almuerzo", "cena", "snack"].includes(momentoCrudo)
        ? momentoCrudo
        : momentoPorHora(hora ?? (esHoy ? horaEn(ctx.timezone) : "13:00"));
      // La hora del bocado: la dicha, o ahora si es de hoy. En días pasados
      // sin hora queda vacía para no ensuciar el contador de ayuno.
      const eatenAt = hora ? isoEnZona(ctx.timezone, fecha, hora) : esHoy ? new Date().toISOString() : null;
      const fila: Record<string, unknown> = {
        user_id: ctx.userId, date: fecha, description: desc,
        eaten_at: eatenAt,
        meal_type: momento,
        kcal: macros?.kcal ?? null, protein_g: macros?.prot ?? null,
        carbs_g: macros?.carb ?? null, fat_g: macros?.grasa ?? null,
      };
      const { data, error } = await ctx.db.from("meals").insert(fila).select("id").single();
      if (error || !data) return `No pude registrar el plato: ${error?.message ?? "sin fila"}`;
      await anotarEscritura(ctx, "meals", data.id, `plato "${desc.slice(0, 40)}" (${momento} ${fecha})`);
      return macros
        ? `Guardado como ${momento} del ${fecha}: ≈${macros.kcal} kcal, ${macros.prot} g de proteína.`
        : `Guardado como ${momento} del ${fecha} (sin macros esta vez).`;
    },
  },

  marcar_habito: {
    decl: {
      name: "marcar_habito",
      description: "Marca como cumplido un hábito existente (hoy o en una fecha pasada) de la usuaria (por su nombre aproximado).",
      parameters: { type: "OBJECT", properties: { nombre: { type: "STRING", description: "Nombre o palabra clave del hábito" }, fecha: { type: "STRING", description: "YYYY-MM-DD o 'ayer'. Vacío = hoy" } }, required: ["nombre"] },
    },
    run: async (args, ctx) => {
      const palabra = String(args.nombre ?? "").trim().split(/\s+/)[0] ?? "";
      const { data: hab } = await ctx.db.from("habits").select("id,name")
        .eq("user_id", ctx.userId).ilike("name", `%${palabra}%`).limit(1).maybeSingle();
      if (!hab) return `No encontré un hábito que se parezca a "${args.nombre}".`;
      const fecha = fechaDe(args, ctx);
      const { data: ya } = await ctx.db.from("habit_logs").select("id")
        .eq("user_id", ctx.userId).eq("habit_id", hab.id).eq("date", fecha).maybeSingle();
      if (ya) return `${hab.name} ya estaba marcado hoy. 🌱`;
      const { data, error } = await ctx.db.from("habit_logs")
        .insert({ habit_id: hab.id, date: fecha, user_id: ctx.userId }).select("id").single();
      if (error || !data) return `No pude marcarlo: ${error?.message ?? "sin fila"}`;
      await anotarEscritura(ctx, "habit_logs", data.id, `hábito "${hab.name}" de hoy`);
      return `Marcado: ${hab.name}. 🔥`;
    },
  },

  registrar_interaccion: {
    decl: {
      name: "registrar_interaccion",
      description: "Registra un contacto con una persona de Relaciones (llamada, visita, mensaje).",
      parameters: {
        type: "OBJECT",
        properties: {
          persona: { type: "STRING", description: "Nombre de la persona tal como la llama la usuaria" },
          descripcion: { type: "STRING", description: "Qué pasó, en una línea" },
          fecha: { type: "STRING", description: "YYYY-MM-DD o 'ayer'. Vacío = hoy" },
        },
        required: ["persona", "descripcion"],
      },
    },
    run: async (args, ctx) => {
      const nombre = String(args.persona ?? "").trim();
      const { data: rel } = await ctx.db.from("relationships").select("id,name")
        .eq("user_id", ctx.userId).ilike("name", `%${nombre}%`).limit(1).maybeSingle();
      if (!rel) return `No encontré a "${nombre}" en Relaciones. Puede agregarla en la app.`;
      const { data, error } = await ctx.db.from("relationship_logs")
        .insert({ relationship_id: rel.id, date: fechaDe(args, ctx), description: String(args.descripcion ?? "").slice(0, 300), user_id: ctx.userId })
        .select("id").single();
      if (error || !data) return `No pude registrarlo: ${error?.message ?? "sin fila"}`;
      await anotarEscritura(ctx, "relationship_logs", data.id, `interacción con ${rel.name}`);
      return `Registrado el momento con ${rel.name}. 💛`;
    },
  },

  registrar_avance: {
    decl: {
      name: "registrar_avance",
      description: "Registra un avance hacia las metas (Dirección). Áreas válidas: salud, habitos, relaciones, objetivos, trabajo, finanzas, aprendizaje.",
      parameters: {
        type: "OBJECT",
        properties: {
          descripcion: { type: "STRING", description: "El avance, en una línea" },
          area: { type: "STRING", description: "Área de la vida, o vacío para general" },
        },
        required: ["descripcion"],
      },
    },
    run: async (args, ctx) => {
      const areas = ["salud", "habitos", "relaciones", "objetivos", "trabajo", "finanzas", "aprendizaje"];
      const area = areas.includes(String(args.area)) ? String(args.area) : "objetivos";
      const { data, error } = await ctx.db.from("activity_log")
        .insert({ area, date: hoyEn(ctx.timezone), description: String(args.descripcion ?? "").slice(0, 300), user_id: ctx.userId })
        .select("id").single();
      if (error || !data) return `No pude registrar el avance: ${error?.message ?? "sin fila"}`;
      await anotarEscritura(ctx, "activity_log", data.id, `avance "${String(args.descripcion).slice(0, 40)}"`);
      return "Avance registrado: empuja tus metas conectadas en Dirección.";
    },
  },

  registrar_jornada: {
    decl: {
      name: "registrar_jornada",
      description: "Registra una jornada de trabajo (horas y cómo se sintió, 1 a 5).",
      parameters: {
        type: "OBJECT",
        properties: {
          horas: { type: "NUMBER", description: "Horas trabajadas, 0.5 a 16" },
          descripcion: { type: "STRING", description: "Qué hizo, en una línea" },
          animo: { type: "NUMBER", description: "1 a 5, vacío si no lo dijo" },
        },
        required: ["horas", "descripcion"],
      },
    },
    run: async (args, ctx) => {
      const horas = Number(args.horas);
      if (!(horas >= 0.5 && horas <= 16)) return "Las horas deben estar entre 0.5 y 16.";
      const animo = Number(args.animo);
      const { data, error } = await ctx.db.from("work_logs")
        .insert({
          date: hoyEn(ctx.timezone), kind: "empleo", project_id: null,
          description: String(args.descripcion ?? "").slice(0, 300), hours: horas,
          mood: animo >= 1 && animo <= 5 ? Math.round(animo) : null, user_id: ctx.userId,
        }).select("id").single();
      if (error || !data) return `No pude registrar la jornada: ${error?.message ?? "sin fila"}`;
      await anotarEscritura(ctx, "work_logs", data.id, `jornada de ${horas} h`);
      return `Jornada registrada: ${horas} h.`;
    },
  },

  escribir_diario: {
    decl: {
      name: "escribir_diario",
      description: "Guarda una entrada en el diario de Mente, con las palabras de la usuaria.",
      parameters: { type: "OBJECT", properties: { texto: { type: "STRING", description: "El texto tal cual, sin resumir ni editar" } }, required: ["texto"] },
    },
    run: async (args, ctx) => {
      const texto = String(args.texto ?? "").slice(0, 4000).trim();
      if (texto.length < 3) return "La entrada está vacía.";
      const { data, error } = await ctx.db.from("journal_entries")
        .insert({ date: hoyEn(ctx.timezone), prompt: null, content: texto, user_id: ctx.userId }).select("id").single();
      if (error || !data) return `No pude guardar el diario: ${error?.message ?? "sin fila"}`;
      await anotarEscritura(ctx, "journal_entries", data.id, "entrada de diario");
      return "Guardado en tu diario. 🕊";
    },
  },

  marcar_ayuno: {
    decl: {
      name: "marcar_ayuno",
      description: "Marca que la usuaria acaba de comer o empieza su ayuno ahora (reinicia el contador de ayuno).",
    },
    run: async (_args, ctx) => {
      const ahora = new Date().toISOString();
      const raw = JSON.stringify({ i: ahora, en: ahora }); // formato del espejo de la app
      const { error } = await ctx.db.from("user_kv").upsert(
        { user_id: ctx.userId, key: "nucleoos-ayuno-manual", value: { raw }, updated_at: ahora },
        { onConflict: "user_id,key" },
      );
      if (error) return `No pude marcar el ayuno: ${error.message}`;
      return "Ayuno marcado: el contador parte ahora. ⏳";
    },
  },

  crear_proyecto: {
    decl: {
      name: "crear_proyecto",
      description: "Crea un proyecto nuevo en Trabajo (para algo con varias tareas, ej: lanzar un producto).",
      parameters: {
        type: "OBJECT",
        properties: {
          nombre: { type: "STRING", description: "Nombre del proyecto" },
          descripcion: { type: "STRING", description: "De qué se trata, en una línea. Vacío si no se sabe" },
        },
        required: ["nombre"],
      },
    },
    run: async (args, ctx) => {
      const nombre = String(args.nombre ?? "").trim().slice(0, 120);
      if (!nombre) return "El proyecto necesita un nombre.";
      const { data, error } = await ctx.db.from("projects")
        .insert({ user_id: ctx.userId, name: nombre, status: "activo", description: String(args.descripcion ?? "").slice(0, 300) || null })
        .select("id").single();
      if (error || !data) return `No pude crear el proyecto: ${error?.message ?? "sin fila"}`;
      await anotarEscritura(ctx, "projects", data.id, `proyecto "${nombre}"`);
      return `Proyecto creado: ${nombre}. Puedes dictarme sus tareas.`;
    },
  },

  agregar_tarea_proyecto: {
    decl: {
      name: "agregar_tarea_proyecto",
      description: "Agrega una tarea a un proyecto existente (por su nombre aproximado).",
      parameters: {
        type: "OBJECT",
        properties: {
          proyecto: { type: "STRING", description: "Nombre o palabra clave del proyecto" },
          titulo: { type: "STRING", description: "La tarea, corta y concreta" },
        },
        required: ["proyecto", "titulo"],
      },
    },
    run: async (args, ctx) => {
      const palabra = String(args.proyecto ?? "").trim().split(/\s+/)[0] ?? "";
      const { data: proy } = await ctx.db.from("projects").select("id,name")
        .eq("user_id", ctx.userId).neq("status", "terminado").ilike("name", `%${palabra}%`).limit(1).maybeSingle();
      if (!proy) return `No encontré un proyecto que se parezca a "${args.proyecto}". Ofrécele crearlo con crear_proyecto.`;
      const titulo = String(args.titulo ?? "").trim().slice(0, 200);
      const { data, error } = await ctx.db.from("project_tasks")
        .insert({ user_id: ctx.userId, project_id: proy.id, title: titulo }).select("id").single();
      if (error || !data) return `No pude agregar la tarea: ${error?.message ?? "sin fila"}`;
      await anotarEscritura(ctx, "project_tasks", data.id, `tarea "${titulo}" en ${proy.name}`);
      return `Tarea agregada a ${proy.name}: ${titulo}`;
    },
  },

  crear_meta: {
    decl: {
      name: "crear_meta",
      description: "Crea una meta nueva en Dirección. Áreas válidas: salud, habitos, relaciones, trabajo, finanzas, aprendizaje, o vacío si es general.",
      parameters: {
        type: "OBJECT",
        properties: {
          titulo: { type: "STRING", description: "La meta, en una frase (ej: correr 5K en octubre)" },
          area: { type: "STRING", description: "Área de la vida, o vacío" },
        },
        required: ["titulo"],
      },
    },
    run: async (args, ctx) => {
      const titulo = String(args.titulo ?? "").trim().slice(0, 200);
      if (!titulo) return "La meta necesita un título.";
      const areas = ["salud", "habitos", "relaciones", "trabajo", "finanzas", "aprendizaje"];
      const area = areas.includes(String(args.area)) ? String(args.area) : null;
      const { data, error } = await ctx.db.from("objectives")
        .insert({ user_id: ctx.userId, title: titulo, area }).select("id").single();
      if (error || !data) return `No pude crear la meta: ${error?.message ?? "sin fila"}`;
      await anotarEscritura(ctx, "objectives", data.id, `meta "${titulo}"`);
      return `Meta creada en Dirección: ${titulo}`;
    },
  },

  tomar_nota: {
    decl: {
      name: "tomar_nota",
      description: "Guarda una nota o idea en los cuadernos de Aprendizaje. Úsala cuando diga 'toma nota', 'anótame esta idea' o cuente un aprendizaje.",
      parameters: {
        type: "OBJECT",
        properties: {
          texto: { type: "STRING", description: "La nota completa, con sus palabras" },
          cuaderno: { type: "STRING", description: "Nombre del cuaderno si lo dice. Vacío = el cuaderno de Kay" },
        },
        required: ["texto"],
      },
    },
    run: async (args, ctx) => {
      const texto = String(args.texto ?? "").trim().slice(0, 2000);
      if (!texto) return "La nota está vacía.";
      const nombreCuaderno = String(args.cuaderno ?? "").trim();
      let cuaderno: { id: string; name: string } | null = null;
      if (nombreCuaderno) {
        const { data } = await ctx.db.from("notebooks").select("id,name")
          .eq("user_id", ctx.userId).ilike("name", `%${nombreCuaderno.split(/\s+/)[0]}%`).limit(1).maybeSingle();
        cuaderno = data as { id: string; name: string } | null;
      }
      if (!cuaderno) {
        // El cuaderno de Kay: se crea solo la primera vez.
        const { data } = await ctx.db.from("notebooks").select("id,name")
          .eq("user_id", ctx.userId).eq("name", "Notas con Kay").maybeSingle();
        cuaderno = data as { id: string; name: string } | null;
        if (!cuaderno) {
          const { data: nuevo, error } = await ctx.db.from("notebooks")
            .insert({ user_id: ctx.userId, name: "Notas con Kay", icon: "🌱" }).select("id,name").single();
          if (error || !nuevo) return `No pude crear el cuaderno: ${error?.message ?? "sin fila"}`;
          cuaderno = nuevo as { id: string; name: string };
        }
      }
      const { data, error } = await ctx.db.from("notebook_entries")
        .insert({ user_id: ctx.userId, notebook_id: cuaderno.id, title: texto.slice(0, 60), content: texto })
        .select("id").single();
      if (error || !data) return `No pude guardar la nota: ${error?.message ?? "sin fila"}`;
      await anotarEscritura(ctx, "notebook_entries", data.id, `nota en ${cuaderno.name}`);
      return `Nota guardada en ${cuaderno.name}.`;
    },
  },

  registrar_lectura: {
    decl: {
      name: "registrar_lectura",
      description: "Registra que la usuaria leyó (páginas o minutos de un libro). Queda como avance de Aprendizaje.",
      parameters: {
        type: "OBJECT",
        properties: {
          libro: { type: "STRING", description: "Título o palabras del libro" },
          detalle: { type: "STRING", description: "Cuánto leyó (30 páginas, 20 minutos, un capítulo...)" },
          fecha: { type: "STRING", description: "YYYY-MM-DD o 'ayer'. Vacío = hoy" },
        },
        required: ["libro"],
      },
    },
    run: async (args, ctx) => {
      const libro = String(args.libro ?? "").trim().slice(0, 120);
      const detalle = String(args.detalle ?? "").trim().slice(0, 120);
      const fecha = fechaDe(args, ctx);
      const texto = `Leyó ${detalle ? detalle + " de " : ""}"${libro}"`;
      const { data, error } = await ctx.db.from("activity_log")
        .insert({ user_id: ctx.userId, area: "aprendizaje", date: fecha, description: texto.slice(0, 300) })
        .select("id").single();
      if (error || !data) return `No pude registrar la lectura: ${error?.message ?? "sin fila"}`;
      await anotarEscritura(ctx, "activity_log", data.id, `lectura de "${libro}" (${fecha})`);
      return `Lectura registrada: ${texto}, ${fecha}. Empuja tus metas de aprendizaje.`;
    },
  },

  registrar_energia: {
    decl: {
      name: "registrar_energia",
      description: "Registra el nivel de energía del día, de 1 (en el suelo) a 5 (a mil).",
      parameters: {
        type: "OBJECT",
        properties: {
          nivel: { type: "NUMBER", description: "1 a 5" },
          fecha: { type: "STRING", description: "YYYY-MM-DD o 'ayer'. Vacío = hoy" },
        },
        required: ["nivel"],
      },
    },
    run: async (args, ctx) => {
      const nivel = Math.round(Number(args.nivel));
      if (!(nivel >= 1 && nivel <= 5)) return "El nivel va de 1 a 5.";
      const fecha = fechaDe(args, ctx);
      const { error } = await ctx.db.from("energy_logs")
        .upsert({ user_id: ctx.userId, date: fecha, energy_level: nivel }, { onConflict: "user_id,date" });
      if (error) return `No pude registrar la energía: ${error.message}`;
      await anotarEscritura(ctx, "energy_logs", fecha, `energía ${nivel}/5 (${fecha})`);
      return `Energía del ${fecha}: ${nivel} de 5. Úsala para calibrar qué le sugieres hoy.`;
    },
  },

  actualizar_perfil: {
    decl: {
      name: "actualizar_perfil",
      description: "Guarda o actualiza el perfil de coaching de la usuaria: meta principal, alimentación o restricciones, condiciones, estilo de trato y notas de lo aprendido. Llámala cada vez que cuente algo DURADERO sobre sí misma.",
      parameters: {
        type: "OBJECT",
        properties: {
          meta: { type: "STRING", description: "Su meta principal (bajar grasa, ganar músculo, más energía, salud general...)" },
          alimentacion: { type: "STRING", description: "Tipo de alimentación o restricciones (vegetariana, keto, anti cándida, sin gluten, ninguna...)" },
          condiciones: { type: "STRING", description: "Condiciones a considerar (TDAH, tiroides, una lesión...)" },
          estilo: { type: "STRING", description: "Cómo prefiere que la trates (más empuje, más suave, sin emojis...)" },
          notas: { type: "STRING", description: "Algo aprendido que valga recordar (horarios típicos, lo que le cuesta, lo que le funciona)" },
        },
      },
    },
    run: async (args, ctx) => {
      const { data: kv } = await ctx.db.from("user_kv").select("value")
        .eq("user_id", ctx.userId).eq("key", "nucleoos-coach-perfil").maybeSingle();
      let perfil: Record<string, string> = {};
      try {
        perfil = JSON.parse(String((kv?.value as { raw?: string })?.raw ?? "{}"));
      } catch { /* dato corrupto: se rehace */ }
      for (const campo of ["meta", "alimentacion", "condiciones", "estilo"]) {
        const v = String(args[campo] ?? "").trim();
        if (v) perfil[campo] = v.slice(0, 200);
      }
      const nota = String(args.notas ?? "").trim();
      // Las notas se acumulan (con tope), porque el aprendizaje es continuo.
      if (nota) perfil.notas = `${perfil.notas ? perfil.notas + " · " : ""}${nota}`.slice(-600);
      const { error } = await ctx.db.from("user_kv").upsert(
        { user_id: ctx.userId, key: "nucleoos-coach-perfil", value: { raw: JSON.stringify(perfil) }, updated_at: new Date().toISOString() },
        { onConflict: "user_id,key" },
      );
      if (error) return `No pude guardar el perfil: ${error.message}`;
      await anotarEscritura(ctx, "user_kv", "coach-perfil", "perfil de coaching actualizado");
      return "Perfil guardado. Desde ahora personaliza con esto.";
    },
  },

  crear_recordatorio: {
    decl: {
      name: "crear_recordatorio",
      description:
        "Programa un recordatorio con hora para que el bot le escriba a esa hora. " +
        "Usalo cuando diga 'recuerdame X a las N', 'avisame a las N' o pida que le avises a una hora. " +
        "La hora SIEMPRE en formato 24 horas: las 2 de la tarde es 14:00, las 8 de la manana es 08:00.",
      parameters: {
        type: "OBJECT",
        properties: {
          texto: { type: "STRING", description: "Que hay que recordarle, corto y en segunda persona (ej: tomar tus suplementos)" },
          hora: { type: "STRING", description: "HH:MM en 24 horas" },
          repite: { type: "STRING", description: "diario si es todos los dias, unico si es solo por hoy. Ante la duda, diario" },
          pregunta: { type: "BOOLEAN", description: "true si ella pide que le PREGUNTES algo y lo registres (ej: preguntame si tome mis pastillas, preguntame como dormi). false si es solo un aviso (ej: recuerdame tomar agua)." },
        },
        required: ["texto", "hora"],
      },
    },
    run: async (args, ctx) => {
      const texto = String(args.texto ?? "").slice(0, 200).trim();
      const hora = String(args.hora ?? "").trim();
      const m = hora.match(/^(\d{1,2}):(\d{2})$/);
      if (!texto) return "Falta que me digas qué recordar.";
      if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return "La hora debe venir como HH:MM en formato 24 horas. Pregúntale a qué hora exacta.";
      const horaNorm = `${m[1].padStart(2, "0")}:${m[2]}`;
      const repite = args.repite === "unico" ? "unico" : "diario";
      const pregunta = args.pregunta === true;
      const fila: Record<string, unknown> = {
        user_id: ctx.userId, texto, hora: horaNorm, repite,
        fecha: repite === "unico" ? hoyEn(ctx.timezone) : null,
      };
      if (pregunta) fila.pregunta = true;
      let { data, error } = await ctx.db.from("wa_recordatorios").insert(fila).select("id").single();
      // Sin la 0056 todavía: lo guardamos como aviso normal.
      if (error && /pregunta/i.test(error.message)) {
        delete fila.pregunta;
        ({ data, error } = await ctx.db.from("wa_recordatorios").insert(fila).select("id").single());
      }
      if (error || !data) return `No pude programarlo: ${error?.message ?? "sin fila"}`;
      await anotarEscritura(ctx, "wa_recordatorios", data.id, `recordatorio "${texto}" a las ${horaNorm}`);
      return pregunta
        ? `Listo: a las ${horaNorm} ${repite === "diario" ? "todos los días" : "hoy"} te pregunto ${texto} y registro tu respuesta.`
        : `Recordatorio listo: te escribo a las ${horaNorm} ${repite === "diario" ? "todos los días" : "hoy"} para ${texto}.`;
    },
  },

  ver_recordatorios: {
    decl: {
      name: "ver_recordatorios",
      description: "Lee los recordatorios activos de la usuaria, con su hora. Úsala si pregunta qué recordatorios tiene.",
    },
    run: async (_args, ctx) => {
      const { data } = await ctx.db.from("wa_recordatorios")
        .select("texto,hora,repite").eq("user_id", ctx.userId).eq("activo", true).order("hora");
      const lista = (data ?? []) as Array<{ texto: string; hora: string; repite: string }>;
      if (lista.length === 0) return "No tiene recordatorios programados.";
      return "Recordatorios activos: " + lista.map((r) => `${r.hora} ${r.texto}${r.repite === "diario" ? " (cada día)" : " (solo hoy)"}`).join(" · ");
    },
  },

  borrar_recordatorio: {
    decl: {
      name: "borrar_recordatorio",
      description: "Apaga un recordatorio que la usuaria ya no quiere, buscándolo por sus palabras.",
      parameters: {
        type: "OBJECT",
        properties: { texto: { type: "STRING", description: "Palabras del recordatorio a apagar" } },
        required: ["texto"],
      },
    },
    run: async (args, ctx) => {
      const palabra = String(args.texto ?? "").trim().split(/\s+/)[0] ?? "";
      const { data } = await ctx.db.from("wa_recordatorios").select("id,texto,hora")
        .eq("user_id", ctx.userId).eq("activo", true).ilike("texto", `%${palabra}%`).limit(1).maybeSingle();
      if (!data) return `No encontré un recordatorio parecido a "${args.texto}".`;
      await ctx.db.from("wa_recordatorios").update({ activo: false }).eq("id", data.id).eq("user_id", ctx.userId);
      return `Apagado el recordatorio de las ${data.hora}: ${data.texto}`;
    },
  },

  por_donde_empiezo: {
    decl: {
      name: "por_donde_empiezo",
      description: "Junta TODOS los frentes reales de la usuaria (tareas de hoy, tareas de proyectos, metas, hábitos, energía del día, citas). Úsala cuando pregunte '¿por dónde empiezo?', '¿qué hago ahora?' o diga que está abrumada. Con lo que devuelve, recomienda UNA sola cosa.",
    },
    run: async (_args, ctx) => {
      const fecha = hoyEn(ctx.timezone);
      const [tareas, proyectos, ptareas, metas, habitos, marcados, energia, citas] = await Promise.all([
        ctx.db.from("day_tasks").select("title,done").eq("user_id", ctx.userId).eq("date", fecha).order("created_at"),
        ctx.db.from("projects").select("id,name").eq("user_id", ctx.userId).eq("status", "activo").limit(6),
        ctx.db.from("project_tasks").select("project_id,title,done").eq("user_id", ctx.userId).eq("done", false).limit(20),
        ctx.db.from("objectives").select("title,status,deadline").eq("user_id", ctx.userId).neq("status", "lograda").limit(8),
        ctx.db.from("habits").select("id,name").eq("user_id", ctx.userId).limit(15),
        ctx.db.from("habit_logs").select("habit_id").eq("user_id", ctx.userId).eq("date", fecha),
        ctx.db.from("energy_logs").select("energy_level").eq("user_id", ctx.userId).eq("date", fecha).maybeSingle(),
        ctx.db.from("appointments").select("title,time").eq("user_id", ctx.userId).eq("date", fecha).limit(5),
      ]);

      const lineas: string[] = [];
      const nivel = (energia.data as { energy_level?: number } | null)?.energy_level;
      lineas.push(nivel
        ? `ENERGÍA DE HOY: ${nivel}/5 ${nivel <= 2 ? "(baja: sugiere algo liviano y corto)" : nivel >= 4 ? "(alta: puede con lo pesado)" : "(media)"}`
        : "ENERGÍA DE HOY: no registrada (pregúntala en la misma respuesta, de pasada)");

      const pendHoy = ((tareas.data ?? []) as Array<{ title: string; done: boolean }>).filter((t) => !t.done).map((t) => t.title);
      if (pendHoy.length) lineas.push(`Tareas de hoy pendientes: ${pendHoy.join("; ")}`);

      const nombreProy = new Map(((proyectos.data ?? []) as Array<{ id: string; name: string }>).map((p) => [p.id, p.name]));
      const dePro = ((ptareas.data ?? []) as Array<{ project_id: string; title: string }>)
        .filter((t) => nombreProy.has(t.project_id))
        .slice(0, 8).map((t) => `${t.title} (proyecto ${nombreProy.get(t.project_id)})`);
      if (dePro.length) lineas.push(`Tareas de proyectos: ${dePro.join("; ")}`);

      const metasTxt = ((metas.data ?? []) as Array<{ title: string; status: string; deadline: string | null }>)
        .map((m) => `${m.title}${m.status === "en_riesgo" ? " (EN RIESGO)" : ""}${m.deadline ? ` (vence ${m.deadline})` : ""}`);
      if (metasTxt.length) lineas.push(`Metas vivas: ${metasTxt.join("; ")}`);

      const hechos = new Set(((marcados.data ?? []) as Array<{ habit_id: string }>).map((l) => l.habit_id));
      const pendHab = ((habitos.data ?? []) as Array<{ id: string; name: string }>).filter((h) => !hechos.has(h.id)).map((h) => h.name);
      if (pendHab.length) lineas.push(`Hábitos sin marcar hoy: ${pendHab.join(", ")}`);

      const citasTxt = ((citas.data ?? []) as Array<{ title: string; time: string | null }>).map((c) => `${c.title}${c.time ? ` a las ${c.time}` : ""}`);
      if (citasTxt.length) lineas.push(`Citas de hoy: ${citasTxt.join("; ")}`);

      if (lineas.length <= 1 && pendHoy.length === 0) lineas.push("No hay nada urgente pendiente: día despejado.");
      return lineas.join("\n");
    },
  },

  ver_dia: {
    decl: {
      name: "ver_dia",
      description: "Lee el día de la usuaria: tareas de hoy, hábitos pendientes y próximo pago. Úsala para responder '¿qué me toca hoy?'.",
    },
    run: async (_args, ctx) => {
      const fecha = hoyEn(ctx.timezone);
      const { data: tareas } = await ctx.db.from("day_tasks").select("title,done")
        .eq("user_id", ctx.userId).eq("date", fecha).order("created_at");
      const { data: habitos } = await ctx.db.from("habits").select("id,name").eq("user_id", ctx.userId);
      const { data: marcados } = await ctx.db.from("habit_logs").select("habit_id")
        .eq("user_id", ctx.userId).eq("date", fecha);
      const hechos = new Set((marcados ?? []).map((l) => l.habit_id));
      const pendientes = (habitos ?? []).filter((h) => !hechos.has(h.id)).map((h) => h.name);
      const t = (tareas ?? []).map((x) => `${x.done ? "✓" : "·"} ${x.title}`).join(" | ") || "sin tareas";
      return `Tareas de hoy: ${t}. Hábitos pendientes: ${pendientes.join(", ") || "ninguno"}.`;
    },
  },
};

// ---------- El turno con Gemini (tool-calling con tope) ----------

/** El mismo contexto que ve tu coach en el Inicio de la app: quién eres,
 *  tu visión, tus metas vivas, los hábitos de hoy y tu sobriedad. Sin esto
 *  el bot respondería como un asistente genérico, no como TU coach. */
async function contextoDe(db: SupabaseClient, userId: string, timezone: string): Promise<string> {
  const hoy = hoyEn(timezone);
  const partes: string[] = [];
  try {
    const [perfil, metas, habitos, marcados, sobriedad, tareas] = await Promise.all([
      db.from("profiles").select("display_name,life_vision").eq("id", userId).maybeSingle(),
      db.from("objectives").select("title,status,area").eq("user_id", userId).neq("status", "lograda").limit(8),
      db.from("habits").select("id,name").eq("user_id", userId).limit(15),
      db.from("habit_logs").select("habit_id").eq("user_id", userId).eq("date", hoy),
      db.from("sobriety").select("substance,start_date").eq("user_id", userId).limit(3),
      db.from("day_tasks").select("title,done").eq("user_id", userId).eq("date", hoy).limit(10),
    ]);

    const nombre = (perfil.data as { display_name?: string } | null)?.display_name;
    if (nombre) partes.push(`Se llama ${nombre}.`);
    const vision = (perfil.data as { life_vision?: string } | null)?.life_vision;
    if (vision) partes.push(`Su visión de vida: "${String(vision).slice(0, 300)}".`);

    const listaMetas = (metas.data ?? []) as Array<{ title: string; status: string }>;
    if (listaMetas.length > 0) {
      partes.push("Metas activas: " + listaMetas.map((m) => `${m.title}${m.status === "en_riesgo" ? " (en riesgo)" : ""}`).join(", ") + ".");
    }

    const listaHabitos = (habitos.data ?? []) as Array<{ id: string; name: string }>;
    if (listaHabitos.length > 0) {
      const hechos = new Set(((marcados.data ?? []) as Array<{ habit_id: string }>).map((l) => l.habit_id));
      const pendientes = listaHabitos.filter((h) => !hechos.has(h.id)).map((h) => h.name);
      partes.push(pendientes.length === 0
        ? "Hoy ya marcó todos sus hábitos. 🎉"
        : `Hábitos que le faltan hoy: ${pendientes.join(", ")}.`);
    }

    const listaTareas = (tareas.data ?? []) as Array<{ title: string; done: boolean }>;
    const pendTareas = listaTareas.filter((t) => !t.done).map((t) => t.title);
    if (pendTareas.length > 0) partes.push(`Tareas pendientes de hoy: ${pendTareas.join(", ")}.`);

    for (const s of (sobriedad.data ?? []) as Array<{ substance: string; start_date: string }>) {
      const dias = Math.floor((Date.now() - new Date(s.start_date).getTime()) / 86400000);
      if (dias >= 0) partes.push(`Lleva ${dias} días libre de ${s.substance}: celébralo si viene al caso, nunca lo minimices.`);
    }
  } catch {
    /* si alguna tabla falla, el coach responde igual con lo que tenga */
  }

  // El perfil de coaching: lo que Kay sabe de ESTA persona. Si aún no existe,
  // el mini-onboarding conversacional parte solo, sin formularios.
  try {
    const { data: kv } = await db.from("user_kv").select("value")
      .eq("user_id", userId).eq("key", "nucleoos-coach-perfil").maybeSingle();
    const perfil = JSON.parse(String((kv?.value as { raw?: string })?.raw ?? "{}")) as Record<string, string>;
    const lineas: string[] = [];
    if (perfil.meta) lineas.push(`meta principal: ${perfil.meta}`);
    if (perfil.alimentacion) lineas.push(`alimentación: ${perfil.alimentacion}`);
    if (perfil.condiciones) lineas.push(`condiciones: ${perfil.condiciones}`);
    if (perfil.estilo) lineas.push(`estilo de trato que prefiere: ${perfil.estilo}`);
    if (perfil.notas) lineas.push(`lo que has aprendido de ella: ${perfil.notas}`);
    if (lineas.length > 0) {
      partes.push(`Su perfil de coaching (${lineas.join("; ")}). Personaliza SOLO con esto, nunca supongas otra dieta ni otra meta.`);
    } else {
      partes.push("AÚN NO TIENES SU PERFIL DE COACHING: además de registrar lo que te cuente, preséntate en una frase como Kay y pregúntale, cálida y breve, cuál es su meta principal ahora y si sigue alguna alimentación especial. Cuando responda, guárdalo con actualizar_perfil.");
    }
  } catch { /* sin user_kv, Kay atiende igual */ }
  return partes.length > 0 ? `\n\nLO QUE SABES DE ELLA HOY:\n${partes.join("\n")}` : "";
}

function promptSistema(idioma: string, timezone: string): string {
  const idiomaTxt = idioma === "en" ? "inglés" : idioma === "pt" ? "portugués" : "español";
  return (
    "Eres KAY, la coach personal de NucleoOS en el chat de la usuaria. Cálida, cercana y con chispa, " +
    "como una amiga entrenadora: celebra, empuja con cariño y jamás hace sentir culpa. Muchas usuarias " +
    "tienen TDAH y TDA: cero sermones, cero listas, cero tono de manual.\n\n" +
    "REGLA NÚMERO UNO: GUARDAR PRIMERO, CONVERSAR DESPUÉS. Si el mensaje cuenta algo que pasó (comida, " +
    "ejercicio, agua, sueño, una tarea, un hábito, un contacto, trabajo, un avance, algo del diario), " +
    "llama la tool correspondiente AHORA, con lo que tengas:\n" +
    "· Si falta la cantidad, ESTÍMALA razonable (una porción normal, 30 minutos, 1 vaso) y guarda igual. " +
    "Jamás te niegues a guardar por falta de detalle.\n" +
    "· Puedes preguntar UN dato faltante como máximo, UNA sola vez, y siempre DESPUÉS de guardar lo que ya sabías.\n" +
    "· PROHIBIDO pedir que repita algo que ya aparece en esta conversación: los mensajes anteriores están ahí, úsalos.\n" +
    "· PROHIBIDO decir \"listo\", \"registrado\" o \"anotado\" sin haber llamado la tool: sería mentirle sobre sus datos.\n\n" +
    "EL SUPERPODER \"¿POR DÓNDE EMPIEZO?\": cuando pregunte por dónde partir, qué hacer ahora, o diga que " +
    "está abrumada o bloqueada, llama por_donde_empiezo y con eso recomienda UNA SOLA cosa concreta, nunca " +
    "una lista. Elige con este criterio: primero lo que vence hoy o está en riesgo, después lo que más " +
    "destranca el resto. Con energía baja (1 o 2) sugiere lo más liviano o el primer paso de 2 minutos de " +
    "algo grande; con energía alta (4 o 5), lo más pesado del día. Si la cosa es grande, pártela: dile solo " +
    "el PRIMER paso chico y concreto. Cero culpa por lo pendiente: jamás menciones cuánto se acumuló. " +
    "Ejemplo: \"Con la energía de hoy, parte por lo más simple: manda ese correo (2 min) y lo demás lo vemos " +
    "después 💪\". Un mini-plan del día completo SOLO si te lo pide explícitamente, y máximo 3 cosas.\n\n" +
    "FECHAS Y HORAS: entiende referencias relativas y pásalas en el campo fecha de las tools: \"ayer\", " +
    "\"anteayer\", \"hace 3 días\", \"el lunes\" (el más reciente). Si dice a qué hora comió, pásala en hora. " +
    "Si no dice fecha, es hoy. El momento de la comida se infiere por la hora: no lo preguntes.\n\n" +
    "Ejemplos de lo que se espera de ti:\n" +
    "· \"hice 30 minutos de gimnasio\" → llama registrar_ejercicio con tipo \"Gimnasio\" y minutos 30.\n" +
    "· \"salí a caminar media hora\" → registrar_ejercicio con tipo \"Caminata\" y minutos 30.\n" +
    "· \"tomé dos vasos de agua\" → registrar_agua con vasos 2.\n" +
    "· \"recuérdame comprar pan\" (SIN hora) → crear_tarea con titulo \"comprar pan\".\n" +
    "· \"recuérdame tomar mis suplementos a las 2\" (CON hora) → crear_recordatorio con texto \"tomar tus suplementos\" y hora \"14:00\". Si menciona una hora, SIEMPRE crear_recordatorio y nunca crear_tarea, porque solo así te escribo a esa hora. Si pide varios recordatorios en un mensaje, crea uno por cada hora.\n" +
    "· \"me comí un yogur con granola\" → registrar_plato con esa descripción.\n" +
    "· \"llamé a mi mamá\" → registrar_interaccion con persona \"mamá\".\n" +
    "· \"crea un proyecto para el lanzamiento\" → crear_proyecto; \"agrégale la tarea diseñar logo\" → agregar_tarea_proyecto.\n" +
    "· \"anótame: comprar comida, llamar al banco, terminar el informe\" → crear_tarea TRES veces, una por cosa.\n" +
    "· \"mi meta es correr 5K en octubre\" → crear_meta.\n" +
    "· \"toma nota: idea para el negocio...\" → tomar_nota. \"leí 30 páginas de Hábitos Atómicos\" → registrar_lectura.\n" +
    "· \"hoy ando con la energía por el suelo\" → registrar_energia con nivel 1 o 2.\n" +
    "· \"medité 10 minutos\" → marcar_habito con el hábito de meditación si existe.\n\n" +
    "Resto de las reglas:\n" +
    "1. No inventes montos de dinero. Cantidades de comida, agua o minutos sí se estiman con criterio.\n" +
    "2. Un mensaje puede traer VARIAS cosas: llama a todas las tools que hagan falta.\n" +
    "3. TU TONO: 1 a 3 frases, directo y con cariño. Confirma lo guardado en UNA frase y suma máximo una " +
    "pregunta o un empujón. Nada de viñetas, nada de párrafos largos, nada de explicar cómo usarte. " +
    "Ejemplo bueno: \"Anotado el pollo con arroz 💪 ¿Cómo viene la energía hoy?\". Ejemplo prohibido: " +
    "\"Para registrar tu comida necesito los siguientes datos\".\n" +
    "4. Si el mensaje es una nota de voz, entiende lo que dice y actúa igual que si te lo hubieran escrito.\n" +
    "5. Si solo conversa o pregunta cómo va, usa ver_dia y responde con sus datos, sin registrar nada.\n" +
    "6. Personaliza solo con LO QUE SABES DE ELLA (abajo): no asumas dietas ni regímenes que no estén en su perfil. " +
    "Y cuando te cuente algo duradero de ella (su meta, su alimentación, una condición, cómo prefiere que la trates), guárdalo con actualizar_perfil además de responderle.\n" +
    "7. No des consejo médico ni financiero profesional. No escribas código ni hagas tareas ajenas a la vida " +
    "de la usuaria: redirige con cariño a lo que sí haces.\n" +
    "8. No uses guiones como puntuación. Emojis con moderación.\n" +
    `Responde SIEMPRE en ${idiomaTxt}. La fecha de hoy para la usuaria (timezone ${timezone}) es ${hoyEn(timezone)}.`
  );
}

async function turnoGemini(bloque: { text?: string; inlineData?: { mimeType: string; data: string } }[], ctx: Ctx, idioma: string, contexto: string, historial: Record<string, unknown>[] = []): Promise<string> {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) return "La IA no está configurada todavía.";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
  const declaraciones = Object.values(TOOLS).map((t) => t.decl);

  const contents: Record<string, unknown>[] = [...historial, { role: "user", parts: bloque }];
  let toolsUsadas = 0;
  let exigido = false;

  for (let paso = 0; paso < MAX_TOOLS_POR_TURNO + 2; paso++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: promptSistema(idioma, ctx.timezone) + contexto }] },
        contents,
        tools: [{ functionDeclarations: declaraciones }],
      }),
    });
    const j = await res.json();

    // Si la IA falla, hay que ENTERARSE. Antes un error aqui se veia como una
    // respuesta vacia y el bot contestaba "Listo" sin haber hecho nada.
    if (!res.ok || j?.error) {
      await ctx.db.from("wa_eventos").insert({
        user_id: ctx.userId, lote_id: ctx.loteId, tipo: "error",
        detalle: { donde: "gemini", status: res.status, mensaje: String(j?.error?.message ?? "sin detalle").slice(0, 400) },
      });
      return "Se me trabo la conexion con la IA y no pude registrarlo. Intentalo de nuevo en un momento.";
    }

    const partes: Record<string, unknown>[] = j?.candidates?.[0]?.content?.parts ?? [];
    if (partes.length === 0) {
      await ctx.db.from("wa_eventos").insert({
        user_id: ctx.userId, lote_id: ctx.loteId, tipo: "error",
        detalle: { donde: "gemini", motivo: "respuesta sin contenido", razon: String(j?.candidates?.[0]?.finishReason ?? "") },
      });
      return "No pude entender ese mensaje. Cuentamelo de otra forma y lo registro.";
    }
    const llamadas = partes.filter((p) => p.functionCall) as { functionCall: { name: string; args: Record<string, unknown> } }[];

    if (llamadas.length === 0) {
      const texto = partes.map((p) => (typeof p.text === "string" ? p.text : "")).join("").trim();
      // El bug más doloroso del bot: decir "registrado" sin haber llamado
      // ninguna tool. En vez de confesarlo y pedir que repita, se le exige
      // al modelo que llame las tools AHORA con lo que ya tiene.
      if (ctx.escrituras.length === 0 && !exigido && /(list[oa]|registr|anot|guard|apunt|saved|logged|record)/i.test(texto)) {
        exigido = true;
        contents.push({ role: "model", parts: [{ text: texto }] });
        contents.push({ role: "user", parts: [{ text: "[SISTEMA] No llamaste ninguna tool, así que NADA quedó guardado. Llama AHORA las tools con los datos que ya están en la conversación, estimando lo que falte. No le pidas repetir nada. Después confirma en una frase corta." }] });
        continue;
      }
      return texto || "Listo. 🌱";
    }

    contents.push({ role: "model", parts: partes });
    const respuestas: Record<string, unknown>[] = [];
    for (const ll of llamadas) {
      const tool = TOOLS[ll.functionCall.name];
      let resultado: string;
      if (!tool) resultado = "Esa tool no existe.";
      else if (toolsUsadas >= MAX_TOOLS_POR_TURNO) resultado = "Tope de acciones por mensaje alcanzado: dile a la usuaria que siga en la app.";
      else {
        toolsUsadas++;
        try {
          resultado = await tool.run(ll.functionCall.args ?? {}, ctx);
        } catch (e) {
          resultado = `Falló: ${String(e).slice(0, 200)}`;
        }
      }
      respuestas.push({ functionResponse: { name: ll.functionCall.name, response: { resultado } } });
    }
    contents.push({ role: "user", parts: respuestas });
  }
  return "Registré lo que pude. Revisa la app para confirmar. 🌱";
}

/** El repartidor: recorre los vínculos y manda los recordatorios cuya hora
 *  ya llegó, cada uno en la zona horaria de su dueña. Se apoya en
 *  ultimo_envio para no avisar dos veces el mismo día, y solo mira hacia
 *  atrás media hora para no soltar de golpe recordatorios viejos. */
async function repartirRecordatorios(db: SupabaseClient): Promise<number> {
  let enviados = 0;
  const { data: vinculos } = await db.from("wa_vinculos")
    .select("user_id,telefono,timezone,avisos_activos").eq("avisos_activos", true);

  for (const v of (vinculos ?? []) as Array<{ user_id: string; telefono: string; timezone: string }>) {
    const ahora = minutosDe(horaEn(v.timezone));
    const hoy = hoyEn(v.timezone);
    let { data: pendientes, error } = await db.from("wa_recordatorios")
      .select("id,texto,hora,repite,fecha,ultimo_envio,pregunta")
      .eq("user_id", v.user_id).eq("activo", true);
    // Sin la 0056 todavía: leemos sin el campo pregunta.
    if (error && /pregunta/i.test(error.message)) {
      ({ data: pendientes, error } = await db.from("wa_recordatorios")
        .select("id,texto,hora,repite,fecha,ultimo_envio")
        .eq("user_id", v.user_id).eq("activo", true));
    }
    if (error) return enviados; // sin la 0052 todavía, el resto del motor sigue igual

    for (const r of (pendientes ?? []) as Array<{ id: string; texto: string; hora: string; repite: string; fecha: string | null; ultimo_envio: string | null; pregunta?: boolean }>) {
      if (r.ultimo_envio === hoy) continue;
      if (r.repite === "unico" && r.fecha !== hoy) continue;
      const cuando = minutosDe(r.hora);
      if (cuando < 0 || ahora < cuando || ahora - cuando > 30) continue;

      // Un recordatorio normal avisa; uno con pregunta invita a responder,
      // y esa respuesta la registra el motor como cualquier otro mensaje.
      const texto = r.pregunta
        ? `💬 ${r.texto}\n\nCuéntame y lo dejo registrado por ti. 🌱`
        : `⏰ ${r.texto}`;
      const envio = await enviarTexto(v.telefono, texto);
      await db.from("wa_recordatorios")
        .update({ ultimo_envio: hoy, ...(r.repite === "unico" ? { activo: false } : {}) })
        .eq("id", r.id);
      await db.from("wa_eventos").insert({
        user_id: v.user_id, tipo: "aviso",
        detalle: { clase: "recordatorio", hora: r.hora, ok: envio.ok, error: envio.error ?? null },
      });
      if (envio.ok) enviados++;
    }
  }
  return enviados;
}

// El check-in de la mañana: el coach pregunta solo lo esencial (despertar,
// agua, desayuno) a la hora que la persona eligió. La respuesta que ella
// mande la procesa el motor normal, que ya sabe registrar todo eso. Así un
// cerebro con TDAH no tiene que acordarse de anotar lo básico.
// Los tres momentos del día en que el coach pregunta solo. Cada uno con sus
// columnas en wa_vinculos (activo/hora/ultimo) y su mensaje. La respuesta la
// procesa el motor normal, que ya sabe registrar sueño, agua, platos y diario.
const MOMENTOS = [
  {
    clase: "checkin", activo: "checkin_activo", hora: "checkin_hora", ultimo: "checkin_ultimo", porDefecto: "08:00",
    mensaje:
      "🌅 Buenos días 🌱 Para arrancar el día ordenada, cuéntame en un mensaje: " +
      "¿a qué hora te levantaste, ya tomaste agua, y qué desayunaste o vas a desayunar? " +
      "Con eso lo dejo registrado por ti. Y si anoche cenaste, dime a qué hora, para llevarte la cuenta del ayuno.",
  },
  {
    clase: "almuerzo", activo: "almuerzo_activo", hora: "almuerzo_hora", ultimo: "almuerzo_ultimo", porDefecto: "13:00",
    mensaje:
      "🍽 Hora de almuerzo. ¿Ya comiste? Cuéntame qué almorzaste y a qué hora, y de paso cuántos vasos de agua llevas. " +
      "Lo registro por ti, sin que tengas que abrir la app.",
  },
  {
    clase: "noche", activo: "noche_activo", hora: "noche_hora", ultimo: "noche_ultimo", porDefecto: "21:00",
    mensaje:
      "🌙 Cerremos el día. Dos cosas: ¿a qué hora fue tu última comida? (así te llevo la cuenta del ayuno) " +
      "y ¿hubo algo especial hoy que quieras guardar? Puede ser un momento lindo, algo que aprendiste o algo que quieras recordar. " +
      "Me lo cuentas y lo dejo escrito en tu diario. 💛",
  },
] as const;

function fmtISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** La próxima vez que toca un pago, respetando su recurrencia. Un pago
 *  mensual guarda la fecha del PRIMERO (que suele estar en el pasado), así
 *  que hay que proyectarlo hacia adelante o nunca se avisa. Igual que
 *  nextOccurrence en la app. */
function proximaOcurrencia(ancla: string, recurrencia: string, hoy: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ancla ?? "")) return null;
  if (recurrencia === "oneTime") return ancla >= hoy ? ancla : null;
  const now = new Date(hoy + "T00:00:00Z");
  const d = new Date(ancla + "T00:00:00Z");
  if (d >= now) return ancla;
  if (recurrencia === "monthly") {
    const diaPago = d.getUTCDate();
    let guarda = 0;
    while (d < now && guarda++ < 240) {
      d.setUTCDate(1);
      d.setUTCMonth(d.getUTCMonth() + 1);
      const ultimoDia = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
      d.setUTCDate(Math.min(diaPago, ultimoDia));
    }
    return fmtISO(d);
  }
  let guarda = 0; // quincenal
  while (d < now && guarda++ < 500) d.setUTCDate(d.getUTCDate() + 14);
  return fmtISO(d);
}

function cuandoTexto(fecha: string, hoy: string): string {
  const dias = Math.round((new Date(fecha + "T00:00:00Z").getTime() - new Date(hoy + "T00:00:00Z").getTime()) / 86400000);
  if (dias <= 0) return "¡hoy!";
  if (dias === 1) return "mañana";
  return `en ${dias} días`;
}

/** Lo que ya está esperando en tu app y que, si nadie te lo dice, se olvida:
 *  lo mismo que muestra el Calendario (pagos con su recurrencia, citas,
 *  exámenes y cumpleaños) más las tareas de hoy y los vínculos por
 *  reconectar. Va pegado al check-in de la mañana, sin sumar otro mensaje. */
async function loQueTeEspera(db: SupabaseClient, userId: string, timezone: string): Promise<string> {
  const hoy = hoyEn(timezone);
  const limite = fmtISO(new Date(new Date(hoy + "T00:00:00Z").getTime() + 7 * 86400_000)); // los próximos 7 días
  const lineas: string[] = [];
  const seguro = async <T>(p: PromiseLike<{ data: T[] | null }>): Promise<T[]> => {
    try { return (await p).data ?? []; } catch { return []; }
  };

  try {
    const [tareas, rels, logs, pagos, citas, examenes] = await Promise.all([
      seguro<{ title: string; done: boolean }>(db.from("day_tasks").select("title,done").eq("user_id", userId).eq("date", hoy).limit(10)),
      seguro<{ id: string; name: string; birthday: string | null; contact_every_days: number | null }>(
        db.from("relationships").select("id,name,birthday,contact_every_days").eq("user_id", userId).limit(80)),
      seguro<{ relationship_id: string; date: string }>(
        db.from("relationship_logs").select("relationship_id,date").eq("user_id", userId).order("date", { ascending: false }).limit(400)),
      seguro<{ title: string; amount: number | null; date: string; recurrence: string }>(
        db.from("reminders").select("title,amount,date,recurrence").eq("user_id", userId).limit(60)),
      seguro<{ title: string; date: string; time: string | null }>(
        db.from("appointments").select("title,date,time").eq("user_id", userId).gte("date", hoy).lte("date", limite).order("date").limit(10)),
      seguro<{ name: string; due_date: string | null; result: string | null }>(
        db.from("health_exams").select("name,due_date,result").eq("user_id", userId).limit(20)),
    ]);

    const pend = tareas.filter((t) => !t.done).map((t) => t.title);
    if (pend.length > 0) lineas.push(`📝 Tareas de hoy: ${pend.join(", ")}.`);

    // Pagos: se proyecta la próxima fecha según su recurrencia (mensual,
    // quincenal o única), así la tarjeta y el seguro sí aparecen.
    const proximos = pagos
      .map((p) => ({ ...p, cuando: proximaOcurrencia(p.date, p.recurrence, hoy) }))
      .filter((p): p is typeof p & { cuando: string } => Boolean(p.cuando) && p.cuando! <= limite)
      .sort((a, b) => a.cuando.localeCompare(b.cuando));
    if (proximos.length > 0) {
      lineas.push("💳 Pagos: " + proximos.slice(0, 6).map((p) =>
        `${p.title}${p.amount ? ` (${p.amount})` : ""} ${cuandoTexto(p.cuando, hoy)}`).join(", ") + ".");
    }

    if (citas.length > 0) {
      lineas.push("🩺 Citas: " + citas.map((c) =>
        `${c.title}${c.time ? ` a las ${String(c.time).slice(0, 5)}` : ""} ${cuandoTexto(c.date, hoy)}`).join(", ") + ".");
    }

    const exams = examenes.filter((e) => !e.result && e.due_date && e.due_date >= hoy && e.due_date <= limite);
    if (exams.length > 0) {
      lineas.push("🧪 Exámenes: " + exams.map((e) => `${e.name} ${cuandoTexto(e.due_date!, hoy)}`).join(", ") + ".");
    }

    // Cumpleaños de los próximos 7 días.
    const cumples: string[] = [];
    for (const r of rels) {
      if (!r.birthday) continue;
      const [, mes, dia] = r.birthday.split("-").map(Number);
      if (!mes || !dia) continue;
      const base = new Date(hoy + "T00:00:00Z");
      let prox = new Date(Date.UTC(base.getUTCFullYear(), mes - 1, dia));
      if (prox < base) prox = new Date(Date.UTC(base.getUTCFullYear() + 1, mes - 1, dia));
      const faltan = Math.round((prox.getTime() - base.getTime()) / 86400000);
      if (faltan <= 7) cumples.push(`${r.name} ${faltan === 0 ? "¡hoy!" : cuandoTexto(fmtISO(prox), hoy)}`);
    }
    if (cumples.length > 0) lineas.push(`🎂 Cumpleaños: ${cumples.join(", ")}.`);

    // Vínculos a los que toca escribirles, según la cadencia que elegiste.
    const ultimo = new Map<string, string>();
    for (const l of logs) if (!ultimo.has(l.relationship_id)) ultimo.set(l.relationship_id, l.date);
    const reconectar = rels.filter((r) => {
      if (!r.contact_every_days) return false;
      const u = ultimo.get(r.id);
      if (!u) return true;
      const dias = Math.round((new Date(hoy + "T00:00:00Z").getTime() - new Date(u + "T00:00:00Z").getTime()) / 86400000);
      return dias >= r.contact_every_days;
    }).map((r) => r.name);
    if (reconectar.length > 0) {
      lineas.push(`💌 Por reconectar: ${reconectar.slice(0, 4).join(", ")}${reconectar.length > 4 ? ` y ${reconectar.length - 4} más` : ""}.`);
    }
  } catch {
    /* si una tabla falla, el check-in sale igual sin esta parte */
  }
  return lineas.length > 0 ? `\n\nY esto te espera:\n${lineas.join("\n")}` : "";
}

async function repartirCheckins(db: SupabaseClient): Promise<number> {
  let enviados = 0;
  const campos = MOMENTOS.flatMap((m) => [m.activo, m.hora, m.ultimo]).join(",");
  const { data: vinculos, error } = await db.from("wa_vinculos")
    .select(`user_id,telefono,timezone,${campos}`)
    .eq("avisos_activos", true);
  if (error) return enviados; // sin la 0054/0055 todavía, el resto del motor sigue igual

  for (const v of (vinculos ?? []) as Array<Record<string, unknown>>) {
    const tz = String(v.timezone ?? "UTC");
    const hoy = hoyEn(tz);
    const ahora = minutosDe(horaEn(tz));

    for (const m of MOMENTOS) {
      if (v[m.activo] !== true) continue;
      if (v[m.ultimo] === hoy) continue; // ya preguntamos hoy
      const cuando = minutosDe(String(v[m.hora] ?? m.porDefecto) || m.porDefecto);
      if (cuando < 0 || ahora < cuando || ahora - cuando > 30) continue; // ventana de 30 min

      // Solo en la mañana sumamos lo que ya espera en la app: así Telegram
      // te avisa de los vínculos, tareas, pagos y cumpleaños que hoy solo
      // se ven si abres la app.
      const extra = m.clase === "checkin" ? await loQueTeEspera(db, String(v.user_id), tz) : "";
      const envio = await enviarTexto(String(v.telefono), m.mensaje + extra);
      await db.from("wa_vinculos").update({ [m.ultimo]: hoy }).eq("user_id", String(v.user_id));
      await db.from("wa_eventos").insert({
        user_id: String(v.user_id), tipo: "aviso",
        detalle: { clase: m.clase, hora: v[m.hora], ok: envio.ok, error: envio.error ?? null },
      });
      if (envio.ok) enviados++;
    }
  }
  return enviados;
}

// ---------- El drenaje del buffer ----------

/** ¿Quien llama tiene derecho a despertar el motor?
 *  Acepta tres llaves para no depender de qué sistema use el proyecto:
 *   · WA_CRON_SECRET: una palabra tuya (la forma recomendada; así la
 *     service role key nunca se escribe dentro de una migración SQL)
 *   · la service role key legacy (eyJ...) o la nueva (sb_secret_...),
 *     según cuál le inyecte Supabase a la función. */
function autorizado(req: Request): boolean {
  const enviada = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!enviada) return false;
  const validas = [
    Deno.env.get("WA_CRON_SECRET"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    Deno.env.get("SB_SECRET_KEY"),
  ].filter((k): k is string => Boolean(k && k.trim())).map((k) => k.trim());
  return validas.some((k) => k === enviada);
}

Deno.serve(async (req: Request) => {
  // Solo el cron (o quien tenga una llave de servicio) puede invocar el motor.
  if (!autorizado(req)) {
    return new Response(JSON.stringify({ error: "Sin permiso." }), { status: 401 });
  }
  const db = admin();
  const ahora = new Date().toISOString();

  // 1) Reclaim: lotes colgados en `procesando` con el lease vencido vuelven a la cola;
  //    a los 3 intentos se cancelan (dead-letter) con su evento.
  const { data: colgados } = await db.from("wa_lotes").select("id,intentos")
    .eq("estado", "procesando").lt("lease_hasta", ahora);
  for (const c of colgados ?? []) {
    if (Number(c.intentos) >= MAX_INTENTOS) {
      await db.from("wa_lotes").update({ estado: "cancelado" }).eq("id", c.id);
      await db.from("wa_eventos").insert({ lote_id: c.id, tipo: "error", detalle: { motivo: "dead-letter tras 3 intentos" } });
    } else {
      await db.from("wa_lotes").update({ estado: "en_buffer" }).eq("id", c.id);
    }
  }

  // 2) Reclamo atómico de lotes vencidos: el UPDATE con filtro es una sola sentencia,
  //    dos corridas del cron no pueden tomar el mismo lote.
  const { data: lotes } = await db.from("wa_lotes")
    .update({ estado: "procesando", lease_hasta: new Date(Date.now() + LEASE_MS).toISOString() })
    .eq("estado", "en_buffer").lte("procesar_despues_de", ahora)
    .select("id,user_id,intentos").limit(10);

  let procesados = 0;
  for (const lote of lotes ?? []) {
    await db.from("wa_lotes").update({ intentos: Number(lote.intentos) + 1 }).eq("id", lote.id);
    try {
      const { data: vinculo } = await db.from("wa_vinculos").select("*").eq("user_id", lote.user_id).single();
      if (!vinculo) throw new Error("lote sin vínculo");

      // La memoria corta: los últimos mensajes de ida y vuelta, para que
      // Kay nunca pida repetir lo que ya le contaron. Sin esto, cada turno
      // partía de cero y la usuaria repetía lo mismo tres veces.
      const { data: previos } = await db.from("wa_mensajes")
        .select("direccion,tipo,contenido")
        .eq("user_id", lote.user_id).neq("lote_id", lote.id)
        .order("creado_en", { ascending: false }).limit(12);
      const historial: Record<string, unknown>[] = [];
      for (const m of (previos ?? []).reverse()) {
        if (m.tipo !== "texto" || !m.contenido) continue;
        historial.push({
          role: m.direccion === "out" ? "model" : "user",
          parts: [{ text: String(m.contenido).slice(0, 500) }],
        });
      }

      // El bloque semántico: los mensajes del lote en orden.
      const { data: mensajes } = await db.from("wa_mensajes").select("tipo,contenido")
        .eq("lote_id", lote.id).order("creado_en");
      const bloque: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [];
      for (const m of mensajes ?? []) {
        if (m.tipo === "texto") {
          if (m.contenido) bloque.push({ text: `[mensaje] ${m.contenido}` });
        } else {
          try {
            const info = JSON.parse(m.contenido ?? "{}");
            if (info.caption) bloque.push({ text: `[caption de ${m.tipo}] ${info.caption}` });
            const media = info.fileId ? await bajarMedia(String(info.fileId)) : null;
            if (media) {
              // Una guía antes del medio: sin esto el modelo a veces solo
              // describe el audio en vez de actuar sobre lo que dice.
              bloque.push({
                text: m.tipo === "audio"
                  ? "[nota de voz de la usuaria: entiende lo que dice y REGISTRA con las tools lo que cuenta que hizo]"
                  : "[foto de la usuaria: si es comida, regístrala con registrar_plato]",
              });
              bloque.push({ inlineData: { mimeType: media.mime, data: media.b64 } });
            }
            else bloque.push({ text: `[${m.tipo} que no se pudo leer]` });
          } catch {
            bloque.push({ text: `[${m.tipo} ilegible]` });
          }
        }
      }
      if (bloque.length === 0) {
        await db.from("wa_lotes").update({ estado: "listo", decision: "abstener" }).eq("id", lote.id);
        continue;
      }

      // Presupuesto compartido de IA (COST-N1) + tope de escrituras del día.
      const dia = new Date().toISOString().slice(0, 10);
      const { data: uso } = await db.from("ia_uso").select("usos").eq("user_id", lote.user_id).eq("dia", dia).maybeSingle();
      const usos = Number(uso?.usos ?? 0);
      const desdeHoy = `${dia}T00:00:00Z`;
      const { count: escriturasHoy } = await db.from("wa_eventos")
        .select("id", { count: "exact", head: true })
        .eq("user_id", lote.user_id).eq("tipo", "tool").gte("creado_en", desdeHoy);
      if (usos >= TOPE_DIARIO_IA || Number(escriturasHoy ?? 0) >= MAX_ESCRITURAS_DIA) {
        await enviarTexto(vinculo.telefono, "Hoy ya usamos toda la energía de IA. Mañana se renueva, y la app sigue abierta para ti. 💛");
        await db.from("wa_lotes").update({ estado: "listo", decision: "abstener" }).eq("id", lote.id);
        continue;
      }
      await db.from("ia_uso").upsert({ user_id: lote.user_id, dia, usos: usos + 1 }, { onConflict: "user_id,dia" });

      // Idioma de la usuaria (espejo de la app).
      const { data: kvIdioma } = await db.from("user_kv").select("value")
        .eq("user_id", lote.user_id).eq("key", "nucleoos-idioma").maybeSingle();
      const idioma = String((kvIdioma?.value as { raw?: string })?.raw ?? "es").replace(/"/g, "");

      const ctx: Ctx = { db, userId: lote.user_id, timezone: vinculo.timezone, loteId: lote.id, escrituras: [] };
      const contexto = await contextoDe(db, lote.user_id, vinculo.timezone);
      let respuesta = await turnoGemini(bloque, ctx, idioma, contexto, historial);

      // Red de seguridad: si el modelo dijo que guardó algo pero ninguna tool
      // escribió, se lo avisamos. Prefiero admitir el fallo antes que dejar a
      // la usuaria creyendo que su registro quedó hecho.
      const dijoQueGuardo = /(listo|registr|anot|guard|apunt)/i.test(respuesta);
      if (ctx.escrituras.length === 0 && dijoQueGuardo) {
        respuesta += "\n\nOjo: tuve un problema técnico y esto aún no queda en la app. No me lo repitas: dime solo \"guárdalo\" y lo dejo registrado al tiro.";
        await db.from("wa_eventos").insert({
          user_id: lote.user_id, lote_id: lote.id, tipo: "error",
          detalle: { motivo: "confirmo sin registrar" },
        });
      }

      const envio = await enviarTexto(vinculo.telefono, respuesta.slice(0, 3000));
      if (!envio.ok) {
        await db.from("wa_eventos").insert({
          user_id: lote.user_id, lote_id: lote.id, tipo: "error",
          detalle: { donde: "telegram", error: envio.error, chat: String(vinculo.telefono).slice(-4) },
        });
      }
      await db.from("wa_mensajes").insert({
        user_id: lote.user_id, telefono: vinculo.telefono, direccion: "out",
        tipo: "texto", contenido: respuesta.slice(0, 2000), lote_id: lote.id,
      });
      await db.from("wa_lotes").update({
        estado: "listo",
        decision: ctx.escrituras.length > 0 ? "registrar" : "responder",
      }).eq("id", lote.id);
      await db.from("wa_eventos").insert({
        user_id: lote.user_id, lote_id: lote.id, tipo: "envio",
        detalle: { registros: ctx.escrituras.length },
      });
      procesados++;
    } catch (e) {
      await db.from("wa_lotes").update({ estado: "en_buffer" }).eq("id", lote.id); // reintenta (o dead-letter al 3ro)
      await db.from("wa_eventos").insert({ lote_id: lote.id, tipo: "error", detalle: { error: String(e).slice(0, 300) } });
    }
  }

  // 3) Los recordatorios con hora, que no dependen de que ella escriba.
  let recordatorios = 0;
  try {
    recordatorios = await repartirRecordatorios(db);
  } catch { /* si algo falla aquí, el procesamiento de mensajes ya quedó hecho */ }

  // 3b) El check-in de la mañana: el coach pregunta solo lo esencial.
  let checkins = 0;
  try {
    checkins = await repartirCheckins(db);
  } catch { /* sin la 0054 o error puntual: el resto del motor sigue igual */ }

  // 4) Limpieza: eventos viejos y códigos vencidos.
  const hace30d = new Date(Date.now() - 30 * 24 * 3600_000).toISOString();
  await db.from("wa_eventos").delete().lt("creado_en", hace30d);
  await db.from("wa_codigos").delete().lt("expira_en", new Date(Date.now() - 3600_000).toISOString());

  return new Response(JSON.stringify({ procesados, recordatorios, checkins }), { status: 200, headers: { "Content-Type": "application/json" } });
});
