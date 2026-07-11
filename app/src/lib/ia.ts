// Capa de IA de NucleoOS.
// Por ahora usa Gemini (nivel gratis de Google AI Studio) directo desde el
// navegador con la llave de la usuaria en .env. Antes de vender la app, esta
// llamada se mueve a una Edge Function para que la llave nunca viaje al cliente.

const key = import.meta.env.VITE_GEMINI_API_KEY;

export const iaConfigured = Boolean(key);

// Alias que siempre apunta al flash más nuevo del nivel gratis,
// así no vuelve a quedar obsoleto cuando Google rote los modelos.
const MODEL = "gemini-flash-latest";

interface Part {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

async function generate(parts: Part[]): Promise<string> {
  if (!key) throw new Error("Falta configurar la llave de Gemini.");
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts }] }),
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
  const json = await res.json();
  const text: string | undefined = json?.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text ?? "")
    .join("");
  if (!text) throw new Error("La IA no devolvió texto. Intenta de nuevo.");
  return text.trim();
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

/** Estima macros de una foto de comida. Devuelve una estimación, no un diagnóstico. */
export async function analizarPlato(base64: string, mimeType: string): Promise<AnalisisPlato> {
  const texto = await generate([
    { inlineData: { mimeType, data: base64 } },
    { text: PROMPT_PLATO },
  ]);
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

/** Consejo del coach a partir del resumen real del usuario. */
export async function consejoCoach(resumen: string): Promise<string> {
  return generate([{ text: `${PROMPT_COACH}

Estado actual:
${resumen}` }]);
}
