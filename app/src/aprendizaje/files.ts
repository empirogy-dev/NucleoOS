import { supabase } from "../lib/supabase";

export interface MaterialFile {
  name: string;
  path: string;
  size: number | null;
  mimeType: string;
}

const BUCKET = "aprendizaje";

function sb() {
  if (!supabase) throw new Error("Supabase no está configurado.");
  return supabase;
}

async function uid(): Promise<string> {
  const { data } = await sb().auth.getUser();
  if (!data.user) throw new Error("Sin sesión.");
  return data.user.id;
}

export function mimeFromName(name: string): string {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  const map: Record<string, string> = {
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    txt: "text/plain",
    md: "text/plain",
  };
  return map[ext] ?? "application/octet-stream";
}

/** true si la IA puede resumir este tipo de archivo. */
export function esResumible(mimeType: string): boolean {
  return mimeType === "application/pdf" || mimeType.startsWith("image/") || mimeType.startsWith("text/");
}

export async function listFiles(notebookId: string): Promise<MaterialFile[]> {
  const userId = await uid();
  const { data, error } = await sb().storage.from(BUCKET).list(`${userId}/${notebookId}`, {
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) {
    // Bucket inexistente: la migración 0009 no se ha corrido.
    if (/bucket/i.test(error.message)) throw new Error("BUCKET_MISSING");
    throw new Error(error.message);
  }
  return (data ?? [])
    .filter((f) => f.name !== ".emptyFolderPlaceholder")
    .map((f) => ({
      name: f.name.replace(/^\d+-/, ""),
      path: `${userId}/${notebookId}/${f.name}`,
      size: (f.metadata as { size?: number } | null)?.size ?? null,
      mimeType: mimeFromName(f.name),
    }));
}

export async function uploadFile(notebookId: string, file: File): Promise<void> {
  const userId = await uid();
  const safe = file.name.replace(/[^\w.\-()áéíóúñÁÉÍÓÚÑ ]/g, "_");
  const path = `${userId}/${notebookId}/${Date.now()}-${safe}`;
  const { error } = await sb().storage.from(BUCKET).upload(path, file, {
    contentType: file.type || mimeFromName(file.name),
  });
  if (error) {
    if (/bucket/i.test(error.message)) throw new Error("BUCKET_MISSING");
    throw new Error(error.message);
  }
}

export async function deleteFile(path: string): Promise<void> {
  const { error } = await sb().storage.from(BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}

export async function openFile(path: string): Promise<void> {
  const { data, error } = await sb().storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error || !data) throw new Error(error?.message ?? "No se pudo abrir el archivo.");
  window.open(data.signedUrl, "_blank", "noopener");
}

export async function downloadBlob(path: string): Promise<Blob> {
  const { data, error } = await sb().storage.from(BUCKET).download(path);
  if (error || !data) throw new Error(error?.message ?? "No se pudo descargar el archivo.");
  return data;
}
