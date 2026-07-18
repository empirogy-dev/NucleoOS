import { fmtFechaLocal, hoyLocal } from "../lib/fechas";
import { supabase } from "../lib/supabase";
import { TablesMissingError } from "../finanzas/data";

// Bloques de foco (migración 0035): cada pomodoro terminado, con su
// duración y a qué proyecto o área empujó. El conteo local de respaldo
// vive en el navegador para que el pomodoro funcione sin migración.

export interface FocusBlock {
  id: string;
  date: string;
  minutes: number;
  label: string | null;
  project_id: string | null;
  area: string | null;
}

const LS_HECHOS = "nucleoos-pomodoro-hechos";

/** Conteo local de bloques de hoy: instantáneo y sin depender de la nube. */
export function bloquesHoyLocal(): number {
  try {
    const raw = localStorage.getItem(LS_HECHOS);
    if (raw) {
      const { date, count } = JSON.parse(raw) as { date: string; count: number };
      if (date === hoyLocal()) return count;
    }
  } catch { /* nada */ }
  return 0;
}

export function sumarBloqueLocal(): number {
  const n = bloquesHoyLocal() + 1;
  localStorage.setItem(LS_HECHOS, JSON.stringify({ date: hoyLocal(), count: n }));
  return n;
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

export async function listFocusBlocks(days = 30): Promise<FocusBlock[]> {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const { data, error } = await sb()
    .from("focus_blocks")
    .select("id,date,minutes,label,project_id,area")
    .gte("date", fmtFechaLocal(d))
    .order("created_at", { ascending: false });
  check(error);
  return (data ?? []) as FocusBlock[];
}

/** Guarda un bloque terminado. Si falta la 0035, no molesta: el conteo local ya corrió. */
export async function saveFocusBlock(b: { minutes: number; label: string | null; project_id: string | null; area: string | null }): Promise<void> {
  try {
    const { error } = await sb().from("focus_blocks").insert({ ...b, date: hoyLocal(), user_id: await uid() });
    check(error);
  } catch { /* sin migración o sin red: el respaldo local basta */ }
}

// ---------- Puente para abrir el pomodoro desde otras páginas ----------
export interface PomodoroPreset {
  projectId?: string;
  projectName?: string;
  area?: string; // "aprendizaje" por ahora
}

export function abrirPomodoro(preset?: PomodoroPreset) {
  window.dispatchEvent(new CustomEvent("nucleoos:pomodoro", { detail: preset ?? {} }));
}
