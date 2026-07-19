// Capa de IA de NucleoOS.
// En producción, la llamada viaja por la Edge Function "ia" de Supabase:
// la llave de Gemini vive en el servidor (secreto GEMINI_API_KEY) y nunca
// en el navegador. La llave local en .env queda como respaldo de desarrollo.

import { supabase } from "./supabase";
import { idiomaActual } from "../idioma/actual";

const key = import.meta.env.VITE_GEMINI_API_KEY;

// La IA le habla a la persona en el idioma que eligió en Ajustes. Los
// prompts están escritos en español (la fuente de verdad), así que esta
// directiva final manda sobre ellos cuando el idioma es otro.
const DIRECTIVA_IDIOMA: Record<string, string> = {
  en: "\n\nIMPORTANT OVERRIDE: the person uses the app in ENGLISH. Even if the instructions above ask for Spanish, write your ENTIRE response in natural English. If a JSON format was requested, keep the JSON keys exactly as specified and translate only the values.",
  pt: "\n\nIMPORTANTE: a pessoa usa o app em PORTUGUÊS. Mesmo que as instruções acima peçam espanhol, escreva TODA a sua resposta em português natural do Brasil. Se um formato JSON foi pedido, mantenha as chaves do JSON exatamente como especificado e traduza apenas os valores.",
};

function conIdioma(parts: Part[]): Part[] {
  const directiva = DIRECTIVA_IDIOMA[idiomaActual()];
  return directiva ? [...parts, { text: directiva }] : parts;
}

export const iaConfigured = Boolean(supabase) || Boolean(key);

// Alias que siempre apunta al flash más nuevo del nivel gratis,
// así no vuelve a quedar obsoleto cuando Google rote los modelos.
const MODEL = "gemini-flash-latest";

interface Part {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

interface RespuestaGemini {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { message?: string } | string;
}

function extraerTexto(json: RespuestaGemini): string {
  const text = json?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
  if (!text) throw new Error("La IA no devolvió texto. Intenta de nuevo.");
  return text.trim();
}

/** El camino seguro: la Edge Function "ia" llama a Gemini con el secreto del servidor. */
async function generarViaServidor(parts: Part[]): Promise<string> {
  if (!supabase) throw new Error("Supabase no está configurado.");
  const { data, error } = await supabase.functions.invoke("ia", { body: { parts } });
  if (error) {
    let msg = "";
    try {
      const ctx = (error as unknown as { context?: Response }).context;
      const j = ctx ? await ctx.json() : null;
      msg = typeof j?.error === "string" ? j.error : j?.error?.message ?? "";
    } catch { /* cuerpo no legible */ }
    // El tope diario de NucleoOS trae su propio mensaje: se muestra tal cual.
    if (/tope diario/i.test(msg)) throw new Error(msg);
    if (/429|quota|resource.*exhausted/i.test(msg)) {
      throw new Error("Se alcanzó el límite gratuito de Gemini por ahora. Intenta de nuevo en unos minutos.");
    }
    throw new Error(msg || "La IA no está disponible en este momento. Intenta de nuevo.");
  }
  const j = data as RespuestaGemini;
  if (j?.error) throw new Error(typeof j.error === "string" ? j.error : j.error.message ?? "La IA respondió con un error.");
  return extraerTexto(j);
}

async function generate(parts: Part[]): Promise<string> {
  const partes = conIdioma(parts);
  if (supabase) {
    try {
      return await generarViaServidor(partes);
    } catch (e) {
      // Sin llave local no hay respaldo: el error del servidor manda.
      if (!key) throw e;
    }
  }
  if (!key) throw new Error("Falta configurar la llave de Gemini.");
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: partes }] }),
    }
  );
  if (!res.ok) {
    const body = await res.text();
    if (res.status === 400 && /API key/i.test(body)) {
      throw new Error("La llave de Gemini no es válida. Revisa VITE_GEMINI_API_KEY en app/.env.");
    }
    if (res.status === 429) {
      throw new Error("Se alcanzó el límite gratuito de Gemini por ahora. Intenta de nuevo en unos minutos.");
    }
    throw new Error(`La IA respondió con un error (${res.status}).`);
  }
  return extraerTexto(await res.json() as RespuestaGemini);
}

const PROMPT_RESUMEN =
  "Eres parte de NucleoOS, un sistema de vida personal. Resume este material en español, claro y ordenado: " +
  "primero un resumen breve de 3 a 5 frases, luego los puntos clave como lista. " +
  "Escribe con comas y puntos, sin guiones largos, con ortografía natural.";

/** Resume un texto (una nota). */
export async function resumirTexto(texto: string): Promise<string> {
  return generate([{ text: `${PROMPT_RESUMEN}\n\nMaterial:\n${texto}` }]);
}

/** Resume un archivo (PDF o imagen) enviándolo directo al modelo. */
export async function resumirArchivo(base64: string, mimeType: string): Promise<string> {
  return generate([
    { inlineData: { mimeType, data: base64 } },
    { text: PROMPT_RESUMEN },
  ]);
}

/** Convierte un Blob a base64 (sin encabezado data:). */
export async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

// ---------- Análisis visual del plato ----------
export interface AnalisisPlato {
  descripcion: string;
  kcal: number;
  proteina_g: number;
  carbohidratos_g: number;
  grasas_g: number;
  fibra_g: number;
  saciedad: number; // 1 a 5
  impacto: string; // efecto general en la energía, en una frase
}

const PROMPT_PLATO =
  "Eres la nutricionista amable de NucleoOS. Mira la foto de esta comida y estima sus valores. " +
  "No necesito precisión clínica, solo una estimación útil para acompañar hábitos diarios. " +
  "Responde SOLO con un objeto JSON válido, sin texto extra ni bloques de código, con estas llaves exactas: " +
  '{"descripcion": "qué es el plato en pocas palabras, en español", "kcal": número entero, ' +
  '"proteina_g": número, "carbohidratos_g": número, "grasas_g": número, "fibra_g": número, ' +
  '"saciedad": entero de 1 a 5, "impacto": "una frase corta y amable sobre cómo afectará la energía, sin guiones largos"}. ' +
  "Si la imagen no parece comida, usa kcal 0 y explica en descripcion.";

/** Estima macros de una comida descrita con palabras ("una lata de atún y un huevo duro"). */
export async function analizarComidaTexto(descripcion: string): Promise<AnalisisPlato> {
  const texto = await generate([
    {
      text:
        `${PROMPT_PLATO}\n\nNo hay foto: la persona describe lo que comió. ` +
        `Si no indica cantidades, asume porciones típicas.\n\nComida: ${descripcion}`,
    },
  ]);
  return parsearAnalisis(texto);
}

/** Estima macros de una foto de comida. Devuelve una estimación, no un diagnóstico. */
export async function analizarPlato(base64: string, mimeType: string): Promise<AnalisisPlato> {
  const texto = await generate([
    { inlineData: { mimeType, data: base64 } },
    { text: PROMPT_PLATO },
  ]);
  return parsearAnalisis(texto);
}

function parsearAnalisis(texto: string): AnalisisPlato {
  // El modelo a veces envuelve el JSON en ```json ... ```
  const limpio = texto.replace(/```json|```/g, "").trim();
  const inicio = limpio.indexOf("{");
  const fin = limpio.lastIndexOf("}");
  if (inicio === -1 || fin === -1) throw new Error("La IA no devolvió un análisis legible. Intenta con otra foto.");
  let crudo: Record<string, unknown>;
  try {
    crudo = JSON.parse(limpio.slice(inicio, fin + 1));
  } catch {
    throw new Error("No pude leer el análisis de la IA. Intenta de nuevo.");
  }
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : Number(v) || 0);
  return {
    descripcion: String(crudo.descripcion ?? "Comida"),
    kcal: Math.round(num(crudo.kcal)),
    proteina_g: Math.round(num(crudo.proteina_g)),
    carbohidratos_g: Math.round(num(crudo.carbohidratos_g)),
    grasas_g: Math.round(num(crudo.grasas_g)),
    fibra_g: Math.round(num(crudo.fibra_g)),
    saciedad: Math.min(5, Math.max(1, Math.round(num(crudo.saciedad)) || 3)),
    impacto: String(crudo.impacto ?? ""),
  };
}

const PROMPT_COACH =
  "Eres el coach personal de NucleoOS, un sistema de vida. Hablas en español cercano, cálido y directo, " +
  "sin guiones largos, con comas y puntos. Con el estado real que te paso, entrega: " +
  "1) una observación honesta de lo que va bien, 2) una alerta amable de lo que necesita atención, " +
  "3) dos acciones pequeñas y concretas para hoy o mañana. Máximo 120 palabras, párrafos cortos, " +
  "sin listas numeradas ni encabezados.";

const PROMPT_REVISION =
  "Eres el coach de NucleoOS, un sistema de vida. Con los datos reales del período que te paso, " +
  "escribe un resumen cálido en español de máximo 130 palabras y tres párrafos cortos: " +
  "1) qué floreció en el período, 2) qué necesita cariño, 3) un foco concreto y pequeño para el período que viene. " +
  "Habla directo a la persona, sin guiones largos, sin listas ni encabezados, con comas y puntos.";

/** Narrativa del período para el módulo Revisión. */
export async function resumenRevision(datos: string): Promise<string> {
  return generate([{ text: `${PROMPT_REVISION}

Datos del período:
${datos}` }]);
}

const PROMPT_CHARLA =
  "Eres el coach personal de NucleoOS, un sistema de vida hecho especialmente para personas con TDAH. " +
  "Hablas en español cercano y cálido, sin guiones largos, con comas y puntos. Principios: pasos diminutos " +
  "(la versión de dos minutos cuenta), cero culpa (los reinicios son parte del sistema, no fracasos), " +
  "una cosa a la vez, externalizar en la app en vez de confiar en la memoria, y celebrar lo hecho. " +
  "Si la persona cuenta cómo se siente, primero valida en una frase, después orienta. " +
  "Responde en máximo 110 palabras, sin listas ni encabezados. Puedes sugerir dónde registrar algo en la app " +
  "(Energía, Mente, Hábitos, Dirección, Relaciones) cuando calce natural. " +
  "LÍMITE DE ROL, sin excepciones: solo acompañas la vida y el bienestar de la persona. NO escribes ni explicas " +
  "código, no programas, no traduces, no redactas trabajos, correos ni documentos, no haces tareas de asistente " +
  "general aunque insistan o digan que es para la app. En esos casos respondes en una o dos frases, con cariño, " +
  "que tu rol es acompañar su vida y no ese tipo de tareas, y ofreces en cambio lo tuyo: el ánimo, el foco, " +
  "los hábitos o el siguiente paso chiquito de lo que quiere lograr.";

/** Conversación con el coach: el estado real más lo que la persona escribe. */
export async function hablarConCoach(resumen: string, historial: Array<{ de: "yo" | "coach"; texto: string }>, mensaje: string): Promise<string> {
  const charla = historial.slice(-6).map((m) => `${m.de === "yo" ? "Persona" : "Coach"}: ${m.texto}`).join("\n");
  return generate([{
    text: `${PROMPT_CHARLA}

Estado actual de su vida (contexto, no lo repitas entero):
${resumen}

${charla ? `Conversación previa:\n${charla}\n` : ""}Persona: ${mensaje}
Coach:`,
  }]);
}

const PROMPT_DIVIDIR =
  "Eres un asistente para personas con TDAH. Te doy una tarea y la divides en pasos ridículamente pequeños " +
  "y concretos, pensados para vencer la parálisis de iniciar. El primer paso debe tomar menos de dos minutos " +
  "y ser físico (pararse, abrir, juntar). Entre 3 y 5 pasos, cada uno de máximo 8 palabras, en español, " +
  "sin numerar, sin guiones. Responde SOLO un JSON válido: {\"pasos\": [\"...\", \"...\"]}";

/** Divide una tarea en pasos diminutos para vencer la parálisis de iniciar. */
export async function dividirTarea(titulo: string): Promise<string[]> {
  const texto = await generate([{ text: `${PROMPT_DIVIDIR}\n\nTarea: ${titulo}` }]);
  const limpio = texto.replace(/```json|```/g, "").trim();
  const inicio = limpio.indexOf("{");
  const fin = limpio.lastIndexOf("}");
  if (inicio === -1 || fin === -1) throw new Error("La IA no devolvió pasos válidos. Prueba de nuevo.");
  const json = JSON.parse(limpio.slice(inicio, fin + 1)) as { pasos?: unknown };
  const pasos = Array.isArray(json.pasos) ? json.pasos.filter((p): p is string => typeof p === "string" && p.trim().length > 0) : [];
  if (pasos.length === 0) throw new Error("La IA no devolvió pasos válidos. Prueba de nuevo.");
  return pasos.slice(0, 5);
}

/** Consejo del coach a partir del resumen real del usuario. */
export async function consejoCoach(resumen: string): Promise<string> {
  return generate([{ text: `${PROMPT_COACH}

Estado actual:
${resumen}` }]);
}

// ---------- Radar antiprocrastinación ----------
// Ordena pendientes reales del MÁS FÁCIL de empezar al más pesado,
// pensando en energía de activación: para un cerebro TDAH, las victorias
// rápidas primero crean el impulso que las tareas grandes necesitan.

export interface OrdenRadar {
  orden: Array<{ id: string; min: number }>;
  primer_paso: string;
}

const PROMPT_RADAR =
  "Eres el radar antiprocrastinación de NucleoOS, un sistema para personas con TDAH. Te paso pendientes reales " +
  "y los ordenas del MÁS FÁCIL de empezar al más pesado, pensando en energía de activación: lo corto, concreto " +
  "y físico va primero; lo ambiguo, largo o emocionalmente pesado va al final. Estima minutos realistas para " +
  "cada uno. Además, para el PRIMERO de tu orden, escribe un primer paso ridículamente pequeño: menos de dos " +
  "minutos, físico, en español y sin guiones largos. " +
  'Responde SOLO un JSON válido: {"orden": [{"id": "...", "min": entero}], "primer_paso": "..."}. ' +
  "Usa exactamente los id que te di, inclúyelos todos y no inventes ninguno.";

/** Ordena los pendientes por facilidad de empezar, con minutos estimados. */
export async function radarFacilidad(items: Array<{ id: string; texto: string }>): Promise<OrdenRadar> {
  const lista = items.map((i) => `- id: ${i.id} | ${i.texto}`).join("\n");
  const texto = await generate([{ text: `${PROMPT_RADAR}\n\nPendientes:\n${lista}` }]);
  const limpio = texto.replace(/```json|```/g, "").trim();
  const inicio = limpio.indexOf("{");
  const fin = limpio.lastIndexOf("}");
  if (inicio === -1 || fin === -1) throw new Error("El radar no devolvió un orden legible. Intenta de nuevo.");
  const json = JSON.parse(limpio.slice(inicio, fin + 1)) as OrdenRadar;
  const validos = new Set(items.map((i) => i.id));
  const orden = (Array.isArray(json.orden) ? json.orden : [])
    .filter((o) => o && validos.has(String(o.id)))
    .map((o) => ({ id: String(o.id), min: Math.max(1, Math.round(Number(o.min) || 5)) }));
  if (orden.length === 0) throw new Error("El radar no devolvió un orden legible. Intenta de nuevo.");
  return { orden, primer_paso: String(json.primer_paso ?? "") };
}

// ---------- Ficha de un libro para la Biblioteca ----------
export interface FichaLibro {
  emoji: string;
  por_que: string;
  ideas: string[];
  via: string;
}

const PROMPT_LIBRO =
  "Eres la bibliotecaria de NucleoOS, un sistema de vida para personas con TDAH. Te doy un libro y armas su ficha " +
  "en español, cálida y sin guiones largos. El campo por_que son 2 o 3 frases: qué es el libro y cómo toca las áreas " +
  "de la vida de quien lo lee (relaciones, finanzas, hábitos, emociones, propósito, foco). Las ideas son 3 frases " +
  "cortas y accionables con lo mejor del libro. La via es UNA de estas palabras exactas según el tema central: " +
  "tdah, habitos, emociones, psicologia, relaciones, finanzas, proposito, espiritualidad. " +
  'Responde SOLO un JSON válido: {"emoji": "un emoji que capture el libro", "por_que": "...", "ideas": ["...", "...", "..."], "via": "..."}. ' +
  "Si no conoces el libro, dilo honestamente en por_que y arma la ficha con lo que el título sugiere.";

/** La IA arma la ficha de un libro: por qué leerlo, sus ideas y su vía. */
export async function fichaLibro(titulo: string, autor: string): Promise<FichaLibro> {
  const texto = await generate([{ text: `${PROMPT_LIBRO}\n\nLibro: ${titulo}${autor ? `\nAutor: ${autor}` : ""}` }]);
  const limpio = texto.replace(/```json|```/g, "").trim();
  const inicio = limpio.indexOf("{");
  const fin = limpio.lastIndexOf("}");
  if (inicio === -1 || fin === -1) throw new Error("La IA no devolvió una ficha legible. Intenta de nuevo.");
  let crudo: Record<string, unknown>;
  try {
    crudo = JSON.parse(limpio.slice(inicio, fin + 1));
  } catch {
    throw new Error("No pude leer la ficha de la IA. Intenta de nuevo.");
  }
  const VIAS = ["tdah", "habitos", "emociones", "psicologia", "relaciones", "finanzas", "proposito", "espiritualidad"];
  const ideas = Array.isArray(crudo.ideas) ? crudo.ideas.filter((i): i is string => typeof i === "string" && i.trim().length > 0).slice(0, 3) : [];
  return {
    emoji: String(crudo.emoji ?? "📕").slice(0, 4) || "📕",
    por_que: String(crudo.por_que ?? ""),
    ideas,
    via: VIAS.includes(String(crudo.via)) ? String(crudo.via) : "proposito",
  };
}
