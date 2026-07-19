// Edge Function "ia": el puente seguro de NucleoOS hacia Gemini.
// La llave vive en el secreto GEMINI_API_KEY del servidor y nunca viaja
// al navegador. Solo usuarias con sesión pueden llamarla (verify_jwt).
// La app manda { parts } y recibe la respuesta cruda de Gemini.

const MODEL = "gemini-flash-latest";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const headers = { ...CORS, "Content-Type": "application/json" };
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) {
    return new Response(
      JSON.stringify({ error: "Falta el secreto GEMINI_API_KEY en Supabase (Edge Functions → Secrets)." }),
      { status: 500, headers },
    );
  }
  try {
    const { parts } = await req.json();
    if (!Array.isArray(parts) || parts.length === 0) {
      return new Response(JSON.stringify({ error: "Petición sin contenido." }), { status: 400, headers });
    }
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
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers });
  }
});
