// Capa de IA de NucleoOS.
// Por ahora usa Gemini (nivel gratis de Google AI Studio) directo desde el
// navegador con la llave de la usuaria en .env. Antes de vender la app, esta
// llamada se mueve a una Edge Function para que la llave nunca viaje al cliente.

const key = import.meta.env.VITE_GEMINI_API_KEY;

export const iaConfigured = Boolean(key);

const MODEL = "gemini-2.5-flash";

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

const PROMPT_COACH =
  "Eres el coach personal de NucleoOS, un sistema de vida. Hablas en español cercano, cálido y directo, " +
  "sin guiones largos, con comas y puntos. Con el estado real que te paso, entrega: " +
  "1) una observación honesta de lo que va bien, 2) una alerta amable de lo que necesita atención, " +
  "3) dos acciones pequeñas y concretas para hoy o mañana. Máximo 120 palabras, párrafos cortos, " +
  "sin listas numeradas ni encabezados.";

/** Consejo del coach a partir del resumen real del usuario. */
export async function consejoCoach(resumen: string): Promise<string> {
  return generate([{ text: `${PROMPT_COACH}

Estado actual:
${resumen}` }]);
}
