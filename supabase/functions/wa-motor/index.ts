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
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
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

async function enviarTexto(chatId: string, texto: string): Promise<void> {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: Number(chatId), text: texto }),
  }).catch(() => undefined);
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
    const mime = res.headers.get("content-type") ?? (path.endsWith(".oga") || path.endsWith(".ogg") ? "audio/ogg" : "application/octet-stream");
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

function fechaDe(args: Record<string, unknown>, ctx: Ctx): string {
  const f = String(args.fecha ?? "");
  if (/^\d{4}-\d{2}-\d{2}$/.test(f)) return f;
  if (f === "ayer") return ayerEn(ctx.timezone);
  return hoyEn(ctx.timezone);
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
      parameters: { type: "OBJECT", properties: { vasos: { type: "NUMBER", description: "Cuántos vasos sumar, 1 a 8" } }, required: ["vasos"] },
    },
    run: async (args, ctx) => {
      const vasos = Math.round(Number(args.vasos));
      if (!(vasos >= 1 && vasos <= 8)) return "Los vasos deben ser entre 1 y 8.";
      const fecha = hoyEn(ctx.timezone);
      const { data: fila } = await ctx.db.from("energy_logs").select("id,water_cups")
        .eq("user_id", ctx.userId).eq("date", fecha).maybeSingle();
      const total = Math.min(8, Number(fila?.water_cups ?? 0) + vasos);
      const { error } = await ctx.db.from("energy_logs")
        .upsert({ user_id: ctx.userId, date: fecha, water_cups: total }, { onConflict: "user_id,date" });
      if (error) return `No pude registrar el agua: ${error.message}`;
      return `Agua registrada: vas ${total} de 8 vasos hoy.`;
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
        },
        required: ["acoste", "desperte"],
      },
    },
    run: async (args, ctx) => {
      const hhmm = /^\d{1,2}:\d{2}$/;
      const acoste = String(args.acoste ?? ""), desperte = String(args.desperte ?? "");
      if (!hhmm.test(acoste) || !hhmm.test(desperte)) return "Las horas deben venir como HH:MM.";
      const fecha = hoyEn(ctx.timezone);
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
          descripcion: { type: "STRING", description: "Qué comió, con detalle. Si es muy vago, pregunta antes" },
          momento: { type: "STRING", description: "desayuno | almuerzo | cena | snack. Vacío si no se sabe" },
        },
        required: ["descripcion"],
      },
    },
    run: async (args, ctx) => {
      const desc = String(args.descripcion ?? "").slice(0, 400).trim();
      if (desc.length < 6) return "La descripción es muy vaga: pregunta qué comió exactamente.";
      const macros = await estimarMacros(desc);
      const fila: Record<string, unknown> = {
        user_id: ctx.userId, date: hoyEn(ctx.timezone), description: desc,
        eaten_at: new Date().toISOString(),
        meal_type: ["desayuno", "almuerzo", "cena", "snack"].includes(String(args.momento)) ? args.momento : null,
        kcal: macros?.kcal ?? null, protein_g: macros?.prot ?? null,
        carbs_g: macros?.carb ?? null, fat_g: macros?.grasa ?? null,
      };
      const { data, error } = await ctx.db.from("meals").insert(fila).select("id").single();
      if (error || !data) return `No pude registrar el plato: ${error?.message ?? "sin fila"}`;
      await anotarEscritura(ctx, "meals", data.id, `plato "${desc.slice(0, 40)}"`);
      return macros
        ? `Plato registrado: ≈${macros.kcal} kcal, ${macros.prot} g de proteína. El contador de ayuno se reinició.`
        : "Plato registrado (no pude estimar los macros esta vez). El contador de ayuno se reinició.";
    },
  },

  marcar_habito: {
    decl: {
      name: "marcar_habito",
      description: "Marca como cumplido hoy un hábito existente de la usuaria (por su nombre aproximado).",
      parameters: { type: "OBJECT", properties: { nombre: { type: "STRING", description: "Nombre o palabra clave del hábito" } }, required: ["nombre"] },
    },
    run: async (args, ctx) => {
      const palabra = String(args.nombre ?? "").trim().split(/\s+/)[0] ?? "";
      const { data: hab } = await ctx.db.from("habits").select("id,name")
        .eq("user_id", ctx.userId).ilike("name", `%${palabra}%`).limit(1).maybeSingle();
      if (!hab) return `No encontré un hábito que se parezca a "${args.nombre}".`;
      const fecha = hoyEn(ctx.timezone);
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
        .insert({ relationship_id: rel.id, date: hoyEn(ctx.timezone), description: String(args.descripcion ?? "").slice(0, 300), user_id: ctx.userId })
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
      parameters: { type: "OBJECT", properties: {}, required: [] },
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

  ver_dia: {
    decl: {
      name: "ver_dia",
      description: "Lee el día de la usuaria: tareas de hoy, hábitos pendientes y próximo pago. Úsala para responder '¿qué me toca hoy?'.",
      parameters: { type: "OBJECT", properties: {}, required: [] },
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
  return partes.length > 0 ? `\n\nLO QUE SABES DE ELLA HOY:\n${partes.join("\n")}` : "";
}

function promptSistema(idioma: string, timezone: string): string {
  const idiomaTxt = idioma === "en" ? "inglés" : idioma === "pt" ? "portugués" : "español";
  return (
    "Eres el asistente de WhatsApp de NucleoOS, la app de vida de la usuaria. Tu trabajo es el de un ESCRIBA: " +
    "cuando ella cuenta algo que hizo (ejercicio, comida, agua, sueño, tareas, hábitos, contactos con personas, " +
    "trabajo, avances, diario), lo registras con las tools. Reglas de oro:\n" +
    "1. NUNCA inventes montos, fechas ni horas: si algo es ambiguo, pregunta en una línea.\n" +
    "2. Un mensaje puede traer VARIAS cosas: registra todas.\n" +
    "3. Confirma SIEMPRE en pocas líneas lo que registraste, cálido y breve, estilo coach consciente del TDAH. Celebra los logros.\n" +
    "4. Si la usuaria solo conversa o pregunta cómo va, usa ver_dia y responde con sus datos, sin registrar nada.\n" +
    "5. No des consejo médico ni financiero profesional. No escribas código ni hagas tareas ajenas a la vida de la usuaria: " +
    "redirige con cariño a lo que sí haces.\n" +
    "6. No uses guiones como puntuación. Emojis con moderación.\n" +
    `Responde SIEMPRE en ${idiomaTxt}. La fecha de hoy para la usuaria (timezone ${timezone}) es ${hoyEn(timezone)}.`
  );
}

async function turnoGemini(bloque: { text?: string; inlineData?: { mimeType: string; data: string } }[], ctx: Ctx, idioma: string, contexto: string): Promise<string> {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) return "La IA no está configurada todavía.";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
  const declaraciones = Object.values(TOOLS).map((t) => t.decl);

  const contents: Record<string, unknown>[] = [{ role: "user", parts: bloque }];
  let toolsUsadas = 0;

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
    const partes: Record<string, unknown>[] = j?.candidates?.[0]?.content?.parts ?? [];
    const llamadas = partes.filter((p) => p.functionCall) as { functionCall: { name: string; args: Record<string, unknown> } }[];

    if (llamadas.length === 0) {
      const texto = partes.map((p) => (typeof p.text === "string" ? p.text : "")).join("").trim();
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
    Deno.env.get("SUPABASE_SECRET_KEY"),
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
            if (media) bloque.push({ inlineData: { mimeType: media.mime, data: media.b64 } });
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
      const respuesta = await turnoGemini(bloque, ctx, idioma, contexto);

      await enviarTexto(vinculo.telefono, respuesta.slice(0, 3000));
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

  // 3) Limpieza: eventos viejos y códigos vencidos.
  const hace30d = new Date(Date.now() - 30 * 24 * 3600_000).toISOString();
  await db.from("wa_eventos").delete().lt("creado_en", hace30d);
  await db.from("wa_codigos").delete().lt("expira_en", new Date(Date.now() - 3600_000).toISOString());

  return new Response(JSON.stringify({ procesados }), { status: 200, headers: { "Content-Type": "application/json" } });
});
