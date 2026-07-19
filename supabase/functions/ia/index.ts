// Edge Function "ia": el puente seguro de NucleoOS hacia Gemini.
// La llave vive en el secreto GEMINI_API_KEY del servidor y nunca viaja
// al navegador. Solo usuarias con sesión pueden llamarla (verify_jwt), y
// cada una tiene un tope diario (tabla ia_uso, migración 0045): aunque
// alguien esquive la app y llame directo, no puede usar tu llave como
// asistente ilimitado. También se limita el tamaño de cada petición.

import { createClient } from "npm:@supabase/supabase-js@2";

const MODEL = "gemini-flash-latest";
const TOPE_DIARIO = 80; // llamadas por usuaria por día: de sobra para vivir la app
const MAX_TEXTO = 30000; // caracteres de texto por petición
const MAX_PARTES = 6;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Parte {
  text?: string;
  inlineData?: { mimeType?: string; data?: string };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const headers = { ...CORS, "Content-Type": "application/json" };
  const responder = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers });

  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) return responder(500, { error: "Falta el secreto GEMINI_API_KEY en Supabase (Edge Functions → Secrets)." });

  try {
    // ¿Quién llama? El JWT ya viene verificado por la plataforma.
    const auth = req.headers.get("Authorization") ?? "";
    const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: quien } = await anon.auth.getUser();
    if (!quien?.user) return responder(401, { error: "Sin sesión." });

    // La petición: tamaño y forma acotados.
    const { parts } = await req.json();
    if (!Array.isArray(parts) || parts.length === 0 || parts.length > MAX_PARTES) {
      return responder(400, { error: "Petición sin contenido válido." });
    }
    const textoTotal = (parts as Parte[]).reduce((s, p) => s + (typeof p.text === "string" ? p.text.length : 0), 0);
    if (textoTotal > MAX_TEXTO) {
      return responder(400, { error: "La petición es demasiado larga para la IA de NucleoOS." });
    }

    // El tope diario, con el service role (la usuaria no puede tocar su contador).
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const dia = new Date().toISOString().slice(0, 10);
    const { data: fila } = await admin.from("ia_uso").select("usos").eq("user_id", quien.user.id).eq("dia", dia).maybeSingle();
    const usos = Number(fila?.usos ?? 0);
    if (usos >= TOPE_DIARIO) {
      return responder(429, { error: "Alcanzaste el tope diario de la IA de NucleoOS. Mañana se renueva, tu cerebro también merece un respiro. 🌙" });
    }
    await admin.from("ia_uso").upsert({ user_id: quien.user.id, dia, usos: usos + 1 }, { onConflict: "user_id,dia" });

    // Recién ahora, Gemini.
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts }] }),
      },
    );
    const body = await res.text();
    return new Response(body, { status: res.status, headers });
  } catch (e) {
    return responder(500, { error: String(e) });
  }
});
