import { fmtFechaLocal } from "../lib/fechas";
import { supabase } from "../lib/supabase";
import { TablesMissingError } from "../finanzas/data";
import type { HealthProfile } from "./data";

// Energía diaria: agua, proteína y nivel de energía (migración 0018).

export interface EnergyLog {
  id: string;
  date: string;
  water_cups: number;
  protein_g: number | null;
  energy_level: number | null;
  note: string | null;
}

export const META_AGUA_VASOS = 8; // vasos de 250 ml, dos litros al día

/** Meta diaria de proteína: 1.2 g por kilo si conocemos el peso, si no 90 g. */
export function metaProteina(profile: HealthProfile | null): number {
  if (profile?.weight_kg) return Math.round(profile.weight_kg * 1.2);
  return 90;
}

export const NIVELES_ENERGIA = [
  { nivel: 1, emoji: "😴", label: "Agotada" },
  { nivel: 2, emoji: "😕", label: "Baja" },
  { nivel: 3, emoji: "🙂", label: "Normal" },
  { nivel: 4, emoji: "😄", label: "Con pilas" },
  { nivel: 5, emoji: "⚡", label: "A tope" },
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

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return fmtFechaLocal(d);
}

export async function listEnergy(days = 14): Promise<EnergyLog[]> {
  const { data, error } = await sb()
    .from("energy_logs")
    .select("id,date,water_cups,protein_g,energy_level,note")
    .gte("date", daysAgo(days))
    .order("date", { ascending: false });
  check(error);
  return (data ?? []) as EnergyLog[];
}

export async function upsertEnergy(date: string, patch: Partial<Pick<EnergyLog, "water_cups" | "protein_g" | "energy_level" | "note">>): Promise<void> {
  const user_id = await uid();
  const { error } = await sb()
    .from("energy_logs")
    .upsert({ user_id, date, ...patch }, { onConflict: "user_id,date" });
  check(error);
}
