import { fmtFechaLocal } from "../lib/fechas";
import { supabase } from "../lib/supabase";
import { TablesMissingError } from "../finanzas/data";

// Comidas del día (migración 0020): cada plato con sus macros estimados,
// registrado a mano o con la foto analizada por la IA.

export interface Meal {
  id: string;
  date: string;
  description: string;
  kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  satiety: number | null;
  impact: string | null;
  meal_type: string | null;
  eaten_at: string | null;
}

/** Momentos de comida del día. El emoji ancla el vistazo rápido. */
export const MOMENTOS = [
  { key: "desayuno", label: "Desayuno", emoji: "🌅" },
  { key: "almuerzo", label: "Almuerzo", emoji: "🍽" },
  { key: "cena", label: "Cena", emoji: "🌙" },
  { key: "snack", label: "Snack", emoji: "🍎" },
] as const;

/** Momento presugerido según la hora, para no hacerte elegir de cero. */
export function momentoSugerido(d = new Date()): string {
  const h = d.getHours();
  if (h < 11) return "desayuno";
  if (h < 16) return "almuerzo";
  if (h < 22) return "cena";
  return "snack";
}

export function momentoDe(key: string | null) {
  return MOMENTOS.find((m) => m.key === key) ?? null;
}

/** El bocado más reciente registrado, para el contador de ayuno. */
export function ultimoBocado(meals: Meal[]): Date | null {
  const tiempos = meals
    .map((m) => (m.eaten_at ? new Date(m.eaten_at) : null))
    .filter((d): d is Date => d !== null && !isNaN(d.getTime()));
  if (tiempos.length === 0) return null;
  return new Date(Math.max(...tiempos.map((t) => t.getTime())));
}

const COLS_FULL = "id,date,description,kcal,protein_g,carbs_g,fat_g,fiber_g,satiety,impact,meal_type,eaten_at";
const COLS_BASE = "id,date,description,kcal,protein_g,carbs_g,fat_g,fiber_g,satiety,impact";

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

export async function listMeals(days = 7): Promise<Meal[]> {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const desde = fmtFechaLocal(d);
  let rows: Record<string, unknown>[] | null = null;
  let error: { code?: string; message: string } | null = null;
  const full = await sb().from("meals").select(COLS_FULL).gte("date", desde).order("created_at", { ascending: false });
  rows = full.data as Record<string, unknown>[] | null;
  error = full.error;
  if (error && /meal_type|eaten_at|schema cache/i.test(error.message)) {
    // La migración 0034 aún no corre: leemos sin las columnas nuevas.
    const base = await sb().from("meals").select(COLS_BASE).gte("date", desde).order("created_at", { ascending: false });
    rows = base.data as Record<string, unknown>[] | null;
    error = base.error;
  }
  check(error);
  return (rows ?? []).map((r) => ({ meal_type: null, eaten_at: null, ...(r as object) })) as Meal[];
}

export async function addMeal(m: Omit<Meal, "id">): Promise<void> {
  const row = { ...m, user_id: await uid() };
  let { error } = await sb().from("meals").insert(row);
  if (error && /meal_type|eaten_at|schema cache/i.test(error.message)) {
    // Sin la 0034: guardamos el plato igual, sin momento ni hora del bocado.
    const { meal_type: _t, eaten_at: _e, ...base } = row;
    ({ error } = await sb().from("meals").insert(base));
  }
  check(error);
}

export async function deleteMeal(id: string): Promise<void> {
  const { error } = await sb().from("meals").delete().eq("id", id);
  check(error);
}

/** Totales de un día. */
export function totalesDia(meals: Meal[], date: string) {
  const del = meals.filter((m) => m.date === date);
  const suma = (f: (m: Meal) => number | null) => Math.round(del.reduce((s, m) => s + (f(m) ?? 0), 0));
  return {
    comidas: del.length,
    kcal: suma((m) => m.kcal),
    proteina: suma((m) => m.protein_g),
    carbos: suma((m) => m.carbs_g),
    grasas: suma((m) => m.fat_g),
    fibra: suma((m) => m.fiber_g),
  };
}
