import { fmtFechaLocal } from "../lib/fechas";
import { supabase } from "../lib/supabase";
import { TablesMissingError } from "../finanzas/data";

export interface Habit {
  id: string;
  name: string;
  icon: string | null;
  target_days: number | null;
  color: string | null;
  daily_minutes: number | null;
}

/** Paleta de colores para los hábitos, tomada de las áreas de la app. */
export const COLORES_HABITO = [
  "var(--hab)", "var(--obj)", "var(--fin)", "var(--sal)", "var(--tra)",
  "var(--apr)", "var(--rel)", "var(--men)", "var(--mov)",
] as const;

export interface HabitLog {
  id: string;
  habit_id: string;
  date: string;
}

export interface RoutineLog {
  id: string;
  date: string;
  wake_time: string | null;
  bed_time: string | null;
}

export interface ExerciseLog {
  id: string;
  date: string;
  kind: string;
  minutes: number;
}

export const EXERCISE_KINDS = ["Caminata", "Yoga", "Gimnasio", "Correr", "Bicicleta", "Baile", "Natación", "Fútbol", "Tenis", "Pilates", "Escalada", "Patinaje", "Boxeo", "Otro"] as const;

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

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return fmtFechaLocal(d);
}

// ---------- Hábitos ----------
export async function listHabits(): Promise<Habit[]> {
  const { data, error } = await sb().from("habits").select("id,name,icon,target_days,color,daily_minutes").order("created_at");
  if (error && /color|daily_minutes/.test(error.message)) {
    // La migración 0030 aún no se corre: leemos sin color ni minutos.
    const medio = await sb().from("habits").select("id,name,icon,target_days").order("created_at");
    if (medio.error && /target_days/.test(medio.error.message)) {
      const legado = await sb().from("habits").select("id,name,icon").order("created_at");
      check(legado.error);
      return (legado.data ?? []).map((h) => ({ ...h, target_days: null, color: null, daily_minutes: null })) as Habit[];
    }
    check(medio.error);
    return (medio.data ?? []).map((h) => ({ ...h, color: null, daily_minutes: null })) as Habit[];
  }
  if (error && /target_days/.test(error.message)) {
    const legado = await sb().from("habits").select("id,name,icon").order("created_at");
    check(legado.error);
    return (legado.data ?? []).map((h) => ({ ...h, target_days: null, color: null, daily_minutes: null })) as Habit[];
  }
  check(error);
  return (data ?? []) as Habit[];
}

export interface HabitInput {
  name: string;
  icon: string | null;
  target_days: number | null;
  color: string | null;
  daily_minutes: number | null;
}

function errorHabito(error: { message: string } | null): void {
  if (!error) return;
  if (/color|daily_minutes/.test(error.message)) {
    throw new Error("Para el color y los minutos del hábito falta la migración 0030 (supabase/migrations/0030_habitos_color.sql).");
  }
  if (/target_days/.test(error.message)) {
    throw new Error("Falta la migración 0014 en Supabase (supabase/migrations/0014_habitos_reto.sql).");
  }
}

export async function addHabit(h: HabitInput): Promise<string> {
  const { data, error } = await sb()
    .from("habits")
    .insert({ ...h, user_id: await uid() })
    .select("id")
    .single();
  errorHabito(error);
  check(error);
  return (data as { id: string }).id;
}

export async function updateHabit(id: string, patch: Partial<HabitInput>): Promise<void> {
  const { error } = await sb().from("habits").update(patch).eq("id", id);
  errorHabito(error);
  check(error);
}

export async function deleteHabit(id: string): Promise<void> {
  const { error } = await sb().from("habits").delete().eq("id", id);
  check(error);
}

/** Logs de los últimos 90 días (para rachas y la vista semanal). */
export async function listHabitLogs(): Promise<HabitLog[]> {
  const { data, error } = await sb()
    .from("habit_logs")
    .select("id,habit_id,date")
    .gte("date", daysAgo(90));
  check(error);
  return (data ?? []) as HabitLog[];
}

export async function toggleHabit(habitId: string, date: string, done: boolean): Promise<void> {
  if (done) {
    const { error } = await sb().from("habit_logs").insert({ habit_id: habitId, date, user_id: await uid() });
    // 23505 = ya estaba marcado; lo ignoramos
    if (error && error.code !== "23505") check(error);
  } else {
    const { error } = await sb().from("habit_logs").delete().eq("habit_id", habitId).eq("date", date);
    check(error);
  }
}

/** Racha: días seguidos cumplidos, contando desde hoy (o desde ayer si hoy aún no marcas). */
export function streakFor(habitId: string, logs: HabitLog[]): number {
  const dates = new Set(logs.filter((l) => l.habit_id === habitId).map((l) => l.date));
  const today = new Date();
  const d = new Date(today);
  if (!dates.has(fmtFechaLocal(d))) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (dates.has(fmtFechaLocal(d))) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

// ---------- Sueño ----------
export async function listRoutine(days = 14): Promise<RoutineLog[]> {
  const { data, error } = await sb()
    .from("routine_logs")
    .select("id,date,wake_time,bed_time")
    .gte("date", daysAgo(days))
    .order("date", { ascending: false });
  check(error);
  return (data ?? []) as RoutineLog[];
}

export async function saveRoutine(date: string, patch: { wake_time?: string | null; bed_time?: string | null }): Promise<void> {
  const user_id = await uid();
  const { error } = await sb()
    .from("routine_logs")
    .upsert({ user_id, date, ...patch }, { onConflict: "user_id,date" });
  check(error);
}

/** Horas de sueño de una noche: de bed_time (noche anterior) a wake_time. */
export function sleepHours(r: RoutineLog): number | null {
  if (!r.wake_time || !r.bed_time) return null;
  const [wh, wm] = r.wake_time.split(":").map(Number);
  const [bh, bm] = r.bed_time.split(":").map(Number);
  let mins = wh * 60 + wm - (bh * 60 + bm);
  if (mins <= 0) mins += 24 * 60;
  return Math.round((mins / 60) * 10) / 10;
}

// ---------- Ejercicio ----------
export async function listExercise(days = 30): Promise<ExerciseLog[]> {
  const { data, error } = await sb()
    .from("exercise_logs")
    .select("id,date,kind,minutes")
    .gte("date", daysAgo(days))
    .order("date", { ascending: false });
  check(error);
  return (data ?? []) as ExerciseLog[];
}

/** Hábitos que se marcan solos cuando registras algo que ya los cumple:
 *  un gimnasio de 30 min marca tu hábito "Ir al gimnasio" sin doble trabajo.
 *  Se busca por palabras del nombre del hábito; si ya estaba marcado, no pasa nada. */
export async function autoMarcarHabitos(date: string, patron: RegExp, extra?: string): Promise<void> {
  try {
    const habits = await listHabits();
    for (const h of habits) {
      const nombre = h.name.toLowerCase();
      if (patron.test(nombre) || (extra && nombre.includes(extra.toLowerCase()))) {
        await toggleHabit(h.id, date, true);
      }
    }
  } catch { /* si no se pudo, el registro original igual quedó */ }
}

/** Palabras de hábitos de movimiento: se marcan al registrar ejercicio. */
export const RE_HABITO_MOVIMIENTO = /gimnasio|gym|entren|ejercicio|deporte|workout|yoga|correr|trotar|caminar|nadar|pilates|bailar/i;

/** Palabras de hábitos de mente: se marcan al completar una práctica. */
export const RE_HABITO_MENTE = /medita|mindful|respira|sadhana|journal|diario|gratitud/i;

/** ¿Ya hay una sesión de ese tipo registrada en esa fecha? Para avisar antes de duplicar. */
export async function sesionPrevia(kind: string, date: string): Promise<number | null> {
  try {
    const { data, error } = await sb()
      .from("exercise_logs")
      .select("minutes")
      .eq("date", date)
      .eq("kind", kind)
      .limit(1);
    if (error || !data || data.length === 0) return null;
    return Number(data[0].minutes);
  } catch {
    return null;
  }
}

export async function addExercise(date: string, kind: string, minutes: number): Promise<void> {
  const { error } = await sb().from("exercise_logs").insert({ date, kind, minutes, user_id: await uid() });
  check(error);
  // El ejercicio marca solo los hábitos que hablan de entrenar (o del tipo exacto).
  await autoMarcarHabitos(date, RE_HABITO_MOVIMIENTO, kind);
}

export async function deleteExercise(id: string): Promise<void> {
  const { error } = await sb().from("exercise_logs").delete().eq("id", id);
  check(error);
}

/** Hábitos sugeridos para estar en paz (pedido de la usuaria). */
export const HABITOS_DE_PAZ: Array<{ name: string; icon: string; dias: number }> = [
  { name: "Meditar 10 minutos", icon: "🧘", dias: 28 },
  { name: "Caminata consciente", icon: "🚶", dias: 28 },
  { name: "Escribir tres gratitudes", icon: "🙏", dias: 21 },
  { name: "Sin pantallas antes de dormir", icon: "📵", dias: 28 },
  { name: "Tomar dos litros de agua", icon: "💧", dias: 28 },
  { name: "Respiración consciente al despertar", icon: "🫁", dias: 21 },
];
