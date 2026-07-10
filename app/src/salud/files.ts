import { supabase } from "../lib/supabase";

// Resultados de exámenes: PDF del laboratorio o foto, en el bucket
// privado "salud" (migración 0015). Cada usuario ve solo su carpeta.

export interface ExamFile {
  name: string;
  path: string;
}

const BUCKET = "salud";

function sb() {
  if (!supabase) throw new Error("Supabase no está configurado.");
  return supabase;
}

async function uid(): Promise<string> {
  const { data } = await sb().auth.getUser();
  if (!data.user) throw new Error("Sin sesión.");
  return data.user.id;
}

export async function listExamFiles(examId: string): Promise<ExamFile[]> {
  const userId = await uid();
  const { data, error } = await sb().storage.from(BUCKET).list(`${userId}/examenes/${examId}`);
  if (error) {
    if (/bucket/i.test(error.message)) throw new Error("BUCKET_MISSING");
    throw new Error(error.message);
  }
  return (data ?? [])
    .filter((f) => f.name !== ".emptyFolderPlaceholder")
    .map((f) => ({
      name: f.name.replace(/^\d+-/, ""),
      path: `${userId}/examenes/${examId}/${f.name}`,
    }));
}

export async function uploadExamFile(examId: string, file: File): Promise<void> {
  const userId = await uid();
  const safe = file.name.replace(/[^\w.\-()áéíóúñÁÉÍÓÚÑ ]/g, "_");
  const { error } = await sb().storage.from(BUCKET).upload(
    `${userId}/examenes/${examId}/${Date.now()}-${safe}`,
    file,
    { contentType: file.type || "application/octet-stream" },
  );
  if (error) {
    if (/bucket/i.test(error.message)) throw new Error("BUCKET_MISSING");
    throw new Error(error.message);
  }
}

export async function deleteExamFile(path: string): Promise<void> {
  const { error } = await sb().storage.from(BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}

export async function openExamFile(path: string): Promise<void> {
  const { data, error } = await sb().storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error || !data) throw new Error(error?.message ?? "No se pudo abrir el archivo.");
  window.open(data.signedUrl, "_blank", "noopener");
}
