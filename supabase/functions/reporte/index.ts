// Edge Function "reporte": soporte de NucleoOS.
// Recibe desde la landing un reporte de error (mensaje + captura opcional)
// y se lo manda al equipo por correo, vía la API de Resend. Pública (sin
// sesión) porque la usa gente que solo está probando la app.
//
// ⚠️ Al desplegar: DESACTIVA "Verify JWT" (se llama desde la landing sin login).
//
// Secretos necesarios (Edge Functions → Secrets):
//   RESEND_API_KEY   la misma que usa el correo de la app
//   SOPORTE_EMAIL    a dónde llegan los reportes (tu correo)

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
};

function json(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function esc(s: string): string {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405);

  try {
    const { email, mensaje, imagen, imagenTipo, imagenNombre } = await req.json();
    if (!mensaje || !String(mensaje).trim()) return json({ error: "Cuéntanos qué pasó." }, 400);

    const destino = Deno.env.get("SOPORTE_EMAIL");
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!destino || !apiKey) return json({ error: "Soporte no está configurado todavía." }, 500);

    // La imagen viaja en base64 sin encabezado. Tope ~7 MB para no abusar.
    if (typeof imagen === "string" && imagen.length > 7_000_000) {
      return json({ error: "La imagen pesa demasiado. Prueba con una más liviana." }, 400);
    }

    const adjuntos = imagen
      ? [{ filename: (imagenNombre as string) || (imagenTipo === "application/pdf" ? "captura.pdf" : "captura.png"), content: imagen }]
      : [];

    const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#2F3A35">
      <h2 style="font-weight:600">🛠 Nuevo reporte de NucleoOS</h2>
      <p><b>De:</b> ${esc(email || "sin correo")}</p>
      <p style="white-space:pre-wrap;background:#F7F3EA;padding:14px;border-radius:10px">${esc(mensaje)}</p>
      <p style="color:#8a9691;font-size:13px">${imagen ? "Con captura adjunta." : "Sin captura."}</p>
    </div>`;

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "NucleoOS Soporte <hola@nucleoos.app>",
        to: [destino],
        reply_to: email || undefined,
        subject: "🛠 Nuevo reporte de NucleoOS",
        html,
        attachments: adjuntos,
      }),
    });

    if (!r.ok) {
      const detalle = await r.text();
      console.error("Resend error:", detalle);
      return json({ error: "No pudimos enviar el reporte. Intenta de nuevo." }, 502);
    }
    return json({ ok: true });
  } catch (e) {
    console.error("reporte error:", e);
    return json({ error: "Algo falló. Intenta de nuevo." }, 500);
  }
});
