import { supabase } from "../lib/supabase";
import { TablesMissingError } from "../finanzas/data";

export type ProjectStatus = "idea" | "activo" | "pausado" | "terminado";

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  progress: number;
  description: string | null;
}

export interface WorkLog {
  id: string;
  date: string;
  kind: "empleo" | "proyecto";
  project_id: string | null;
  description: string;
  hours: number | null;
  mood: number | null;
}

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  idea: "Idea",
  activo: "Activo",
  pausado: "En pausa",
  terminado: "Terminado",
};

export const MOODS = [
  { value: 1, emoji: "😞", label: "Muy mal" },
  { value: 2, emoji: "😕", label: "Mal" },
  { value: 3, emoji: "😐", label: "Normal" },
  { value: 4, emoji: "🙂", label: "Bien" },
  { value: 5, emoji: "😄", label: "Muy bien" },
] as const;

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

// ---------- Proyectos ----------
export async function listProjects(): Promise<Project[]> {
  const { data, error } = await sb()
    .from("projects")
    .select("id,name,status,progress,description")
    .order("created_at");
  check(error);
  return (data ?? []) as Project[];
}

export async function addProject(p: { name: string; description: string | null }): Promise<void> {
  const { error } = await sb().from("projects").insert({ ...p, user_id: await uid() });
  check(error);
}

export async function updateProject(id: string, patch: { status?: ProjectStatus; progress?: number }): Promise<void> {
  const { error } = await sb().from("projects").update(patch).eq("id", id);
  check(error);
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await sb().from("projects").delete().eq("id", id);
  check(error);
}

// ---------- Registro de trabajo ----------
export async function listWorkLogs(days = 60): Promise<WorkLog[]> {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const { data, error } = await sb()
    .from("work_logs")
    .select("id,date,kind,project_id,description,hours,mood")
    .gte("date", d.toISOString().slice(0, 10))
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  check(error);
  return (data ?? []) as WorkLog[];
}

export async function addWorkLog(w: {
  date: string;
  kind: "empleo" | "proyecto";
  project_id: string | null;
  description: string;
  hours: number | null;
  mood: number | null;
}): Promise<void> {
  const { error } = await sb().from("work_logs").insert({ ...w, user_id: await uid() });
  check(error);
}

export async function deleteWorkLog(id: string): Promise<void> {
  const { error } = await sb().from("work_logs").delete().eq("id", id);
  check(error);
}

/** Horas totales por proyecto. */
export function hoursByProject(logs: WorkLog[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const l of logs) {
    if (l.kind !== "proyecto" || !l.project_id || !l.hours) continue;
    m.set(l.project_id, (m.get(l.project_id) ?? 0) + Number(l.hours));
  }
  return m;
}
