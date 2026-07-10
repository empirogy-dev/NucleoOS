import { supabase } from "../lib/supabase";
import { TablesMissingError } from "../finanzas/data";

export type ObjectiveStatus = "en_camino" | "en_riesgo" | "lograda" | "pausada";

export interface Milestone {
  id: string;
  objective_id: string;
  title: string;
  progress: number;
  position: number;
}

export interface Objective {
  id: string;
  title: string;
  area: string | null;
  status: ObjectiveStatus;
  progress: number;
  deadline: string | null;
  dream_id: string | null;
  milestones: Milestone[];
}

export interface ActivityEntry {
  id: string;
  area: string;
  date: string;
  description: string;
}

export const STATUS_LABELS: Record<ObjectiveStatus, string> = {
  en_camino: "En camino",
  en_riesgo: "En riesgo",
  lograda: "Lograda",
  pausada: "En pausa",
};

/** Progreso efectivo: promedio de milestones si los hay, si no el manual. */
export function objectiveProgress(o: Objective): number {
  if (o.milestones.length === 0) return o.progress;
  return Math.round(o.milestones.reduce((s, m) => s + m.progress, 0) / o.milestones.length);
}

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

// ---------- Metas ----------
export async function listObjectives(): Promise<Objective[]> {
  let objs: Array<Omit<Objective, "milestones">>;
  const objRes = await sb().from("objectives").select("id,title,area,status,progress,deadline,dream_id").order("created_at");
  if (objRes.error && /dream_id/.test(objRes.error.message)) {
    // La migración 0019 aún no se corre: leemos sin el vínculo al sueño.
    const legado = await sb().from("objectives").select("id,title,area,status,progress,deadline").order("created_at");
    check(legado.error);
    objs = (legado.data ?? []).map((o) => ({ ...o, dream_id: null })) as Array<Omit<Objective, "milestones">>;
  } else {
    check(objRes.error);
    objs = (objRes.data ?? []) as Array<Omit<Objective, "milestones">>;
  }
  const msRes = await sb().from("objective_milestones").select("id,objective_id,title,progress,position").order("position").order("created_at");
  check(msRes.error);
  const byObj = new Map<string, Milestone[]>();
  for (const m of (msRes.data ?? []) as Milestone[]) {
    const list = byObj.get(m.objective_id) ?? [];
    list.push(m);
    byObj.set(m.objective_id, list);
  }
  return objs.map((o) => ({
    ...o,
    milestones: byObj.get(o.id) ?? [],
  }));
}

export async function addObjective(o: { title: string; area: string | null; deadline: string | null; dream_id?: string | null }): Promise<void> {
  const { error } = await sb().from("objectives").insert({ ...o, user_id: await uid() });
  if (error && /dream_id/.test(error.message)) {
    throw new Error("Para convertir sueños en metas falta la migración 0019 (supabase/migrations/0019_suenos_vida_ideal.sql).");
  }
  check(error);
}

export async function updateObjective(id: string, patch: { status?: ObjectiveStatus; progress?: number }): Promise<void> {
  const { error } = await sb().from("objectives").update(patch).eq("id", id);
  check(error);
}

export async function deleteObjective(id: string): Promise<void> {
  const { error } = await sb().from("objectives").delete().eq("id", id);
  check(error);
}

// ---------- Milestones ----------
export async function addMilestone(objectiveId: string, title: string, position: number): Promise<void> {
  const { error } = await sb()
    .from("objective_milestones")
    .insert({ objective_id: objectiveId, title, position, user_id: await uid() });
  check(error);
}

export async function updateMilestoneProgress(id: string, progress: number): Promise<void> {
  const { error } = await sb().from("objective_milestones").update({ progress }).eq("id", id);
  check(error);
}

export async function deleteMilestone(id: string): Promise<void> {
  const { error } = await sb().from("objective_milestones").delete().eq("id", id);
  check(error);
}

// ---------- Avances (registro transversal) ----------
export async function listActivity(limit = 20): Promise<ActivityEntry[]> {
  const { data, error } = await sb()
    .from("activity_log")
    .select("id,area,date,description")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  check(error);
  return (data ?? []) as ActivityEntry[];
}

export async function addActivity(a: { area: string; date: string; description: string }): Promise<void> {
  const { error } = await sb().from("activity_log").insert({ ...a, user_id: await uid() });
  check(error);
}

export async function deleteActivity(id: string): Promise<void> {
  const { error } = await sb().from("activity_log").delete().eq("id", id);
  check(error);
}
