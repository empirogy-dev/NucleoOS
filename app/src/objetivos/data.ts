import { supabase } from "../lib/supabase";
import { TablesMissingError } from "../finanzas/data";
import { listExercise, listHabitLogs, type ExerciseLog, type HabitLog } from "../habitos/data";
import { listRetoLogs, type RetoLog } from "../habitos/retos";
import { listSesiones, type Sesion } from "../mente/practicas";
import { listWorkLogs, type WorkLog } from "../trabajo/data";
import { listFocusBlocks, type FocusBlock } from "../foco/data";

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
  auto_metric: string | null;
  auto_target: number | null;
  auto_ref: string | null;
  created_at: string | null;
  milestones: Milestone[];
}

/** Métricas con las que una meta puede alimentarse sola (migración 0024).
 *  auto_target guarda el ritmo POR SEMANA; el total esperado sale del plazo. */
export const METRICAS_AUTO = [
  { key: "mov_sesiones", label: "Sesiones de movimiento", unidad: "sesiones", singular: "sesión", fuente: "Movimiento y Energía" },
  { key: "mov_minutos", label: "Minutos de movimiento", unidad: "min", singular: "minuto", fuente: "Movimiento y Energía" },
  { key: "mente_sesiones", label: "Sesiones de Mente", unidad: "sesiones", singular: "sesión", fuente: "Mente" },
  { key: "habito_marcas", label: "Días de un hábito", unidad: "días", singular: "día", fuente: "Hábitos" },
  { key: "reto_dias", label: "Días de un reto", unidad: "días", singular: "día", fuente: "Hábitos, pestaña Retos" },
  { key: "area_avances", label: "Avances registrados en su área", unidad: "avances", singular: "avance", fuente: "el botón Registrar avance de su área" },
  { key: "trabajo_horas", label: "Horas de un proyecto", unidad: "horas", singular: "hora", fuente: "las jornadas de ese proyecto en Trabajo" },
  { key: "foco_minutos", label: "Minutos de foco (pomodoro)", unidad: "min", singular: "minuto", fuente: "tus bloques de foco ligados a ese proyecto o a Aprendizaje" },
] as const;

/** Para "foco_minutos", auto_ref guarda a qué se liga: "p:<id de proyecto>" o "a:aprendizaje". */
export function focoRefOpciones(proyectos: Array<{ id: string; name: string }>): Array<{ value: string; label: string }> {
  return [
    ...proyectos.map((p) => ({ value: `p:${p.id}`, label: `💼 ${p.name}` })),
    { value: "a:aprendizaje", label: "📚 Aprendizaje" },
  ];
}

export const PLAZO_DEFECTO_DIAS = 90;

/** Todo lo que puede alimentar una meta automática. */
export interface Fuentes {
  ejercicio: ExerciseLog[];
  sesiones: Sesion[];
  habitLogs: HabitLog[];
  retoLogs: RetoLog[];
  avances: ActivityEntry[];
  workLogs: WorkLog[];
  focusBlocks: FocusBlock[];
}

/** Las fuentes completas del progreso automático, con las MISMAS ventanas
 *  en todas las páginas: si el Inicio y Dirección miran datos distintos,
 *  la misma meta muestra porcentajes distintos y se pierde la confianza. */
export async function cargarFuentes(): Promise<Fuentes> {
  const seguro = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
    try {
      return await fn();
    } catch {
      return fallback;
    }
  };
  const [ejercicio, habitLogs, retoLogs, avances, workLogs, focusBlocks] = await Promise.all([
    seguro(() => listExercise(365), [] as ExerciseLog[]),
    seguro(() => listHabitLogs(), [] as HabitLog[]),
    seguro(() => listRetoLogs(), [] as RetoLog[]),
    seguro(() => listActivity(500), [] as ActivityEntry[]),
    seguro(() => listWorkLogs(365), [] as WorkLog[]),
    seguro(() => listFocusBlocks(365), [] as FocusBlock[]),
  ]);
  return { ejercicio, sesiones: listSesiones(), habitLogs, retoLogs, avances, workLogs, focusBlocks };
}

/** Valor real de una métrica automática, contado desde que la meta nació. */
export function valorAuto(o: Objective, f: Fuentes): number {
  const desde = o.created_at ? o.created_at.slice(0, 10) : "0000-00-00";
  if (o.auto_metric === "mov_sesiones") return f.ejercicio.filter((e) => e.date >= desde).length;
  if (o.auto_metric === "mov_minutos") return f.ejercicio.filter((e) => e.date >= desde).reduce((s, e) => s + e.minutes, 0);
  if (o.auto_metric === "mente_sesiones") return f.sesiones.filter((s) => s.fecha >= desde).length;
  if (o.auto_metric === "habito_marcas") return f.habitLogs.filter((l) => l.habit_id === o.auto_ref && l.date >= desde).length;
  if (o.auto_metric === "reto_dias") return f.retoLogs.filter((l) => l.challenge_id === o.auto_ref && l.date >= desde).length;
  if (o.auto_metric === "area_avances") {
    return f.avances.filter((a) => a.date >= desde && (o.area === null || a.area === o.area)).length;
  }
  if (o.auto_metric === "trabajo_horas") {
    return Math.round(
      f.workLogs
        .filter((w) => w.project_id === o.auto_ref && w.date >= desde && w.hours)
        .reduce((s, w) => s + Number(w.hours), 0) * 10,
    ) / 10;
  }
  if (o.auto_metric === "foco_minutos") {
    const ref = o.auto_ref ?? "";
    return f.focusBlocks
      .filter((b) => b.date >= desde)
      .filter((b) => (ref.startsWith("p:") ? b.project_id === ref.slice(2) : ref.startsWith("a:") ? b.area === ref.slice(2) : false))
      .reduce((s, b) => s + b.minutes, 0);
  }
  return 0;
}

/** Progreso efectivo considerando el automático, los pasos o lo manual. */
export function progresoDe(o: Objective, f: Fuentes): number {
  const esperado = metaAutoEsperado(o);
  if (esperado !== null) {
    return Math.min(100, Math.round((valorAuto(o, f) / esperado) * 100));
  }
  return objectiveProgress(o);
}

/** Total esperado de la meta automática: ritmo semanal por las semanas del plazo.
 *  El plazo va desde la creación hasta la fecha límite (o 90 días si no hay). */
export function metaAutoEsperado(o: Objective): number | null {
  if (!o.auto_metric || !o.auto_target) return null;
  const inicio = o.created_at ? new Date(o.created_at) : new Date();
  const fin = o.deadline
    ? new Date(`${o.deadline}T00:00:00`)
    : new Date(inicio.getTime() + PLAZO_DEFECTO_DIAS * 86400000);
  const dias = Math.max(7, Math.round((fin.getTime() - inicio.getTime()) / 86400000));
  return Math.max(1, Math.round((dias / 7) * o.auto_target));
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
  const SIN_AUTO = { auto_metric: null, auto_target: null, auto_ref: null };
  const objRes = await sb().from("objectives").select("id,title,area,status,progress,deadline,dream_id,auto_metric,auto_target,auto_ref,created_at").order("created_at");
  if (objRes.error && /auto_metric|auto_target|auto_ref/.test(objRes.error.message)) {
    // La migración 0024 aún no se corre: leemos sin el progreso automático.
    const medio = await sb().from("objectives").select("id,title,area,status,progress,deadline,dream_id,created_at").order("created_at");
    if (medio.error && /dream_id/.test(medio.error.message)) {
      const legado = await sb().from("objectives").select("id,title,area,status,progress,deadline,created_at").order("created_at");
      check(legado.error);
      objs = (legado.data ?? []).map((o) => ({ ...o, dream_id: null, ...SIN_AUTO })) as Array<Omit<Objective, "milestones">>;
    } else {
      check(medio.error);
      objs = (medio.data ?? []).map((o) => ({ ...o, ...SIN_AUTO })) as Array<Omit<Objective, "milestones">>;
    }
  } else if (objRes.error && /dream_id/.test(objRes.error.message)) {
    // La 0019 tampoco está.
    const legado = await sb().from("objectives").select("id,title,area,status,progress,deadline,created_at").order("created_at");
    check(legado.error);
    objs = (legado.data ?? []).map((o) => ({ ...o, dream_id: null, ...SIN_AUTO })) as Array<Omit<Objective, "milestones">>;
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

export async function addObjective(o: { title: string; area: string | null; deadline: string | null; dream_id?: string | null; auto_metric?: string | null; auto_target?: number | null; auto_ref?: string | null }): Promise<void> {
  const { error } = await sb().from("objectives").insert({ ...o, user_id: await uid() });
  if (error && /dream_id/.test(error.message)) {
    throw new Error("Para convertir sueños en metas falta la migración 0019 (supabase/migrations/0019_suenos_vida_ideal.sql).");
  }
  if (error && /auto_metric|auto_target|auto_ref/.test(error.message)) {
    throw new Error("Para el progreso automático falta la migración 0024 (supabase/migrations/0024_metas_automaticas.sql).");
  }
  check(error);
}

export async function updateObjective(id: string, patch: { title?: string; area?: string | null; deadline?: string | null; status?: ObjectiveStatus; progress?: number; auto_metric?: string | null; auto_target?: number | null; auto_ref?: string | null }): Promise<void> {
  const { error } = await sb().from("objectives").update(patch).eq("id", id);
  if (error && /auto_metric_check/.test(error.message)) {
    throw new Error("Para esta conexión falta la migración 0028 (supabase/migrations/0028_meta_avances.sql).");
  }
  if (error && /auto_metric|auto_target|auto_ref/.test(error.message)) {
    throw new Error("Para el progreso automático falta la migración 0024 (supabase/migrations/0024_metas_automaticas.sql).");
  }
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
