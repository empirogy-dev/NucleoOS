import { supabase } from "../lib/supabase";

// Boletas adjuntas a cada transacción, como en QuickBooks: la foto o el PDF
// del comprobante queda guardado junto al movimiento, en el bucket privado
// "recibos" (migración 0053). Cada usuario ve solo su carpeta. La ruta es
// {userId}/{txId}/{archivo}, así una transacción puede tener varias boletas.

export interface ReciboFile {
  name: string;
  path: string;
}

const BUCKET = "recibos";

function sb() {
  if (!supabase) throw new Error("Supabase no está configurado.");
  return supabase;
}

async function uid(): Promise<string> {
  const { data } = await sb().auth.getUser();
  if (!data.user) throw new Error("Sin sesión.");
  return data.user.id;
}

/** Los txId que tienen al menos una boleta, para pintar el clip en su fila.
 *  Una sola llamada trae todas las carpetas del usuario. Si el bucket aún no
 *  existe, devuelve vacío: la página de Finanzas sigue funcionando igual. */
export async function listReciboTxIds(): Promise<Set<string>> {
  try {
    const userId = await uid();
    const { data, error } = await sb().storage.from(BUCKET).list(userId, { limit: 1000 });
    if (error) return new Set();
    return new Set(
      (data ?? [])
        .filter((f) => f.id === null && f.name !== ".emptyFolderPlaceholder") // las carpetas vienen con id null
        .map((f) => f.name),
    );
  } catch {
    return new Set();
  }
}

export async function listRecibos(txId: string): Promise<ReciboFile[]> {
  const userId = await uid();
  const { data, error } = await sb().storage.from(BUCKET).list(`${userId}/${txId}`);
  if (error) {
    if (/bucket/i.test(error.message)) throw new Error("BUCKET_MISSING");
    throw new Error(error.message);
  }
  return (data ?? [])
    .filter((f) => f.name !== ".emptyFolderPlaceholder")
    .map((f) => ({
      name: f.name.replace(/^\d+-/, ""),
      path: `${userId}/${txId}/${f.name}`,
    }));
}

export async function uploadRecibo(txId: string, file: File): Promise<void> {
  const userId = await uid();
  const safe = file.name.replace(/[^\w.\-()áéíóúñÁÉÍÓÚÑ ]/g, "_");
  const { error } = await sb().storage.from(BUCKET).upload(
    `${userId}/${txId}/${Date.now()}-${safe}`,
    file,
    { contentType: file.type || "application/octet-stream" },
  );
  if (error) {
    if (/bucket/i.test(error.message)) throw new Error("BUCKET_MISSING");
    throw new Error(error.message);
  }
}

export async function deleteRecibo(path: string): Promise<void> {
  const { error } = await sb().storage.from(BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}

export async function openRecibo(path: string): Promise<void> {
  const { data, error } = await sb().storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error || !data) throw new Error(error?.message ?? "No se pudo abrir la boleta.");
  window.open(data.signedUrl, "_blank", "noopener");
}

export interface ReciboItem {
  txId: string;
  path: string;
  name: string;
  isImage: boolean;
}

/** Todas las boletas del usuario, cada una con el id de su transacción, para
 *  la biblioteca de comprobantes. Una llamada para las carpetas y luego una
 *  por transacción en paralelo. Si el bucket no existe, devuelve vacío. */
export async function listTodosRecibos(): Promise<ReciboItem[]> {
  try {
    const userId = await uid();
    const { data: folders, error } = await sb().storage.from(BUCKET).list(userId, { limit: 2000 });
    if (error) return [];
    const txIds = (folders ?? [])
      .filter((f) => f.id === null && f.name !== ".emptyFolderPlaceholder")
      .map((f) => f.name);
    const listas = await Promise.all(
      txIds.map(async (txId) => {
        const { data } = await sb().storage.from(BUCKET).list(`${userId}/${txId}`);
        return (data ?? [])
          .filter((f) => f.name !== ".emptyFolderPlaceholder")
          .map((f) => ({
            txId,
            path: `${userId}/${txId}/${f.name}`,
            name: f.name.replace(/^\d+-/, ""),
            isImage: /\.(png|jpe?g|webp)$/i.test(f.name),
          }));
      }),
    );
    return listas.flat();
  } catch {
    return [];
  }
}

/** URLs firmadas (una hora) para varias boletas de una vez: para las
 *  miniaturas de la biblioteca sin una llamada por imagen. */
export async function signedUrlsRecibos(paths: string[]): Promise<Map<string, string>> {
  const mapa = new Map<string, string>();
  if (paths.length === 0) return mapa;
  const { data } = await sb().storage.from(BUCKET).createSignedUrls(paths, 3600);
  for (const d of data ?? []) {
    if (d.path && d.signedUrl) mapa.set(d.path, d.signedUrl);
  }
  return mapa;
}
