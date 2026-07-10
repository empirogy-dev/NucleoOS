import { supabase } from "../lib/supabase";
import { TablesMissingError } from "../finanzas/data";

// Sueños (bucket list) y vida ideal, del módulo Visión (migración 0019).
// Regla de la casa: si es "algún día quiero esto", vive aquí.
// Cuando se convierte en decisión, pasa a Dirección como meta.

export type DreamStatus = "idea" | "importante" | "meta";

export interface Dream {
  id: string;
  title: string;
  category: string;
  why: string | null;
  priority: number; // 1 a 3 corazones
  status: DreamStatus;
  notes: string | null;
}

export const CATEGORIAS_SUENO = [
  { key: "viajes", emoji: "✈️", label: "Viajes y lugares" },
  { key: "experiencias", emoji: "✨", label: "Experiencias" },
  { key: "aprender", emoji: "📚", label: "Aprender algo" },
  { key: "hogar", emoji: "🏡", label: "Hogar y estilo de vida" },
  { key: "cuerpo", emoji: "💪", label: "Cuerpo y salud" },
  { key: "creatividad", emoji: "🎨", label: "Crear algo" },
  { key: "personas", emoji: "💛", label: "Personas y vínculos" },
  { key: "otro", emoji: "🌱", label: "Otro" },
] as const;

export function emojiCategoria(key: string): string {
  return CATEGORIAS_SUENO.find((c) => c.key === key)?.emoji ?? "🌱";
}

export const STATUS_SUENO: Record<DreamStatus, string> = {
  idea: "Idea",
  importante: "Importante",
  meta: "En ejecución",
};

function check(error: { code?: string; message: string } | null) {
  if (!error) return;
  if (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    /does not exist|could not find the table/i.test(error.message)
  ) {
    throw new TablesMissingError();
  }
  throw new Error(error.message);
}

function sb() {
  if (!supabase) throw new Error("Supabase no está configurado.");
  return supabase;
}

async function uid(): Promise<string> {
  const { data } = await sb().auth.getUser();
  if (!data.user) throw new Error("Sin sesión.");
  return data.user.id;
}

// ---------- Sueños ----------
export async function listDreams(): Promise<Dream[]> {
  const { data, error } = await sb()
    .from("dreams")
    .select("id,title,category,why,priority,status,notes")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });
  check(error);
  return (data ?? []) as Dream[];
}

export async function addDream(d: Omit<Dream, "id">): Promise<void> {
  const { error } = await sb().from("dreams").insert({ ...d, user_id: await uid() });
  check(error);
}

export async function updateDream(id: string, patch: Partial<Omit<Dream, "id">>): Promise<void> {
  const { error } = await sb().from("dreams").update(patch).eq("id", id);
  check(error);
}

export async function deleteDream(id: string): Promise<void> {
  const { error } = await sb().from("dreams").delete().eq("id", id);
  check(error);
}

// ---------- Vida ideal ----------
export const SECCIONES_VIDA = [
  { key: "sentir", emoji: "🕊", titulo: "Cómo quiero sentirme", pregunta: "¿Con qué emoción quieres despertar la mayoría de los días? ¿Qué es la paz mental para ti?" },
  { key: "salud", emoji: "🌿", titulo: "Mi salud y energía", pregunta: "¿Cómo se siente tu cuerpo en tu vida ideal? ¿Qué haces con esa energía?" },
  { key: "relaciones", emoji: "💛", titulo: "Mis relaciones", pregunta: "¿Qué vínculos quieres cultivar y cómo se sienten cuando están sanos?" },
  { key: "trabajo", emoji: "🌸", titulo: "Mi trabajo ideal", pregunta: "¿En qué trabajas, con quién y con cuánta libertad? ¿Qué aporta al mundo?" },
  { key: "hogar", emoji: "🏡", titulo: "Mi hogar", pregunta: "¿Dónde vives y cómo se siente ese espacio? ¿Qué ves por la ventana?" },
  { key: "rutina", emoji: "☀️", titulo: "Mi rutina perfecta", pregunta: "Describe un día común de tu vida ideal, desde que despiertas hasta que te acuestas." },
] as const;

export async function getIdealLife(): Promise<Record<string, string>> {
  const { data, error } = await sb().from("ideal_life").select("section,content");
  check(error);
  const map: Record<string, string> = {};
  for (const row of (data ?? []) as Array<{ section: string; content: string | null }>) {
    map[row.section] = row.content ?? "";
  }
  return map;
}

export async function saveIdealSection(section: string, content: string): Promise<void> {
  const user_id = await uid();
  const { error } = await sb()
    .from("ideal_life")
    .upsert({ user_id, section, content, updated_at: new Date().toISOString() }, { onConflict: "user_id,section" });
  check(error);
}
