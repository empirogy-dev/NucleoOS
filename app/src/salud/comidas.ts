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

export async function listMeals(days = 7): Promise<Meal[]> {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const { data, error } = await sb()
    .from("meals")
    .select("id,date,description,kcal,protein_g,carbs_g,fat_g,fiber_g,satiety,impact")
    .gte("date", fmtFechaLocal(d))
    .order("created_at", { ascending: false });
  check(error);
  return (data ?? []) as Meal[];
}

export async function addMeal(m: Omit<Meal, "id">): Promise<void> {
  const { error } = await sb().from("meals").insert({ ...m, user_id: await uid() });
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
