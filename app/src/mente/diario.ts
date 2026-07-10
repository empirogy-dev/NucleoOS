import { fmtFechaLocal } from "../lib/fechas";
import { supabase } from "../lib/supabase";
import { TablesMissingError } from "../finanzas/data";

// Diario de Mente (migración 0023): escritura con preguntas guía.
// Escribir ordena; no hace falta que sea bonito, hace falta que sea honesto.

export interface JournalEntry {
  id: string;
  date: string;
  prompt: string | null;
  content: string;
}

export const PROMPTS_DIARIO: Array<{ emoji: string; texto: string }> = [
  { emoji: "🙏", texto: "Tres cosas buenas de hoy, y qué hiciste tú para que pasaran." },
  { emoji: "🌊", texto: "¿Qué te removió hoy y dónde lo sentiste en el cuerpo?" },
  { emoji: "🔄", texto: "¿Qué pensamiento te apretó hoy? Escríbelo, y luego escríbelo más amable." },
  { emoji: "💌", texto: "Si tu mejor amiga viviera tu día de hoy, ¿qué le dirías?" },
  { emoji: "🌱", texto: "¿Qué versión de ti apareció hoy que quieres que vuelva mañana?" },
  { emoji: "✍️", texto: "Escritura libre: lo que salga, sin editar." },
];

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

export async function listEntries(days = 60): Promise<JournalEntry[]> {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const { data, error } = await sb()
    .from("journal_entries")
    .select("id,date,prompt,content")
    .gte("date", fmtFechaLocal(d))
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  check(error);
  return (data ?? []) as JournalEntry[];
}

export async function addEntry(e: { date: string; prompt: string | null; content: string }): Promise<void> {
  const { error } = await sb().from("journal_entries").insert({ ...e, user_id: await uid() });
  check(error);
}

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await sb().from("journal_entries").delete().eq("id", id);
  check(error);
}
