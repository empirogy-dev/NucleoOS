import { fechaRegistro, fmtFechaLocal, hoyLocal } from "../lib/fechas";
import { supabase } from "../lib/supabase";
import { TablesMissingError } from "../finanzas/data";

// Tareas del día (migración 0033): el checklist del Inicio.
// Cosas sueltas que no son hábito ni meta, pero que anotas para no olvidarlas.

export interface DayTask {
  id: string;
  date: string;
  title: string;
  done: boolean;
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

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return fmtFechaLocal(d);
}

/** Tareas de los últimos días (para hoy y para las que quedaron pendientes). */
export async function listDayTasks(days = 14): Promise<DayTask[]> {
  const { data, error } = await sb()
    .from("day_tasks")
    .select("id,date,title,done")
    .gte("date", daysAgo(days))
    .order("date", { ascending: false })
    .order("created_at");
  check(error);
  return (data ?? []) as DayTask[];
}

export async function addDayTask(title: string, date = fechaRegistro()): Promise<void> {
  const { error } = await sb().from("day_tasks").insert({ title, date, user_id: await uid() });
  check(error);
}

export async function toggleDayTask(id: string, done: boolean): Promise<void> {
  const { error } = await sb().from("day_tasks").update({ done }).eq("id", id);
  check(error);
}

export async function deleteDayTask(id: string): Promise<void> {
  const { error } = await sb().from("day_tasks").delete().eq("id", id);
  check(error);
}

/** Una tarea pendiente de otro día se trae a hoy, sin culpa. */
export async function moveDayTaskToToday(id: string): Promise<void> {
  const { error } = await sb().from("day_tasks").update({ date: hoyLocal() }).eq("id", id);
  check(error);
}
