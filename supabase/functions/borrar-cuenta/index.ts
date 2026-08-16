import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

// Borrar la cuenta y todo lo que hay dentro.
//
// Es la función más destructiva del sistema, así que está escrita a la
// defensiva y en un orden pensado: primero lo que NO se puede deshacer desde
// afuera, y al final la cuenta.
//
//   1. Se corta la conexión con el banco EN PLAID. Si se borrara la cuenta
//      primero, el vínculo con su banco quedaría vivo en Plaid para siempre,
//      sin nadie que pudiera cerrarlo. Es el paso que más importa y por eso
//      va primero.
//   2. Se borran los archivos del almacenamiento. Storage no se borra solo
//      con la cuenta: sus boletas y cartolas quedarían ahí.
//   3. Se borra el usuario. Todas las tablas cuelgan de él con borrado en
//      cascada, así que sus datos se van con él.
//
// Tres candados antes de tocar nada: sesión válida, la palabra de
// confirmación escrita, y que el correo escrito calce con el de la sesión.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

function admin(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    (Deno.env.get("SB_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"))!,
  );
}

/** Corta el vínculo con el banco en Plaid. Si falla, se sigue: no dejar
 *  borrar la cuenta porque Plaid no responde sería peor. Se reporta. */
async function soltarPlaid(db: SupabaseClient, userId: string): Promise<string[]> {
  const avisos: string[] = [];
  const clientId = Deno.env.get("PLAID_CLIENT_ID");
  const secret = Deno.env.get("PLAID_SECRET");
  const { data: conexiones } = await db.from("bank_connections")
    .select("id,access_token,institution_name").eq("user_id", userId);
  if (!conexiones || conexiones.length === 0) return avisos;
  if (!clientId || !secret) {
    avisos.push("No se pudo cerrar la conexión con el banco: faltan las llaves de Plaid.");
    return avisos;
  }
  const env = (Deno.env.get("PLAID_ENV") ?? "sandbox").toLowerCase();
  const base = env === "production" ? "https://production.plaid.com" : "https://sandbox.plaid.com";
  for (const c of conexiones) {
    try {
      const r = await fetch(`${base}/item/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId, secret, access_token: c.access_token }),
      });
      if (!r.ok) avisos.push(`El banco ${c.institution_name ?? ""} no confirmó la desconexión.`);
    } catch {
      avisos.push(`No se pudo contactar a Plaid para desconectar ${c.institution_name ?? "el banco"}.`);
    }
  }
  return avisos;
}

/** Borra todo lo que la persona subió. El almacenamiento no se borra en
 *  cascada con la cuenta: hay que ir a buscarlo. */
async function borrarArchivos(db: SupabaseClient, userId: string): Promise<number> {
  let borrados = 0;
  for (const bucket of ["recibos", "cartolas"]) {
    try {
      const { data: carpetas } = await db.storage.from(bucket).list(userId, { limit: 2000 });
      const rutas: string[] = [];
      for (const c of carpetas ?? []) {
        if (c.id === null) {
          const { data: dentro } = await db.storage.from(bucket).list(`${userId}/${c.name}`);
          for (const f of dentro ?? []) rutas.push(`${userId}/${c.name}/${f.name}`);
        } else {
          rutas.push(`${userId}/${c.name}`);
        }
      }
      // De a doscientos: una lista enorme en una sola llamada puede fallar
      // entera y dejar archivos atrás sin que nadie se entere.
      for (let i = 0; i < rutas.length; i += 200) {
        const tanda = rutas.slice(i, i + 200);
        const { error } = await db.storage.from(bucket).remove(tanda);
        if (!error) borrados += tanda.length;
      }
    } catch { /* bucket que no existe: nada que borrar */ }
  }
  return borrados;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405);

  let cuerpo: Record<string, unknown> = {};
  try { cuerpo = await req.json(); } catch { /* cuerpo vacío */ }

  const db = admin();

  // Candado 1: sesión válida.
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  const { data: quien } = token ? await db.auth.getUser(token) : { data: { user: null } };
  const user = quien?.user;
  if (!user) return json({ error: "Sin sesión." }, 401);

  // Candado 2: la palabra escrita a mano. Protege de un clic accidental y de
  // cualquier cosa que llame a esta función sin que ella lo sepa.
  if (String(cuerpo.confirmacion ?? "").trim().toUpperCase() !== "BORRAR MI CUENTA") {
    return json({ error: "Falta escribir la confirmación." }, 400);
  }

  // Candado 3: el correo escrito tiene que ser el de la sesión.
  const correo = String(cuerpo.correo ?? "").trim().toLowerCase();
  if (!correo || correo !== (user.email ?? "").toLowerCase()) {
    return json({ error: "El correo no coincide con el de tu cuenta." }, 400);
  }

  const avisos = await soltarPlaid(db, user.id);
  const archivos = await borrarArchivos(db, user.id);

  // Y al final la cuenta. Las tablas cuelgan de auth.users con borrado en
  // cascada, así que sus datos se van con ella.
  const { error } = await db.auth.admin.deleteUser(user.id);
  if (error) {
    return json({
      error: "No pude borrar la cuenta. Tus archivos sí se borraron. Escríbenos a hola@nucleoos.app.",
      detalle: error.message,
    }, 500);
  }

  return json({ ok: true, archivos, avisos });
});
