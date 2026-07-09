import { supabase } from "../lib/supabase";
import { TablesMissingError } from "../finanzas/data";

export interface Notebook {
  id: string;
  name: string;
  icon: string | null;
}

export interface Entry {
  id: string;
  notebook_id: string;
  title: string;
  content: string;
  updated_at: string;
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

// ---------- Cuadernos ----------
export async function listNotebooks(): Promise<Notebook[]> {
  const { data, error } = await sb().from("notebooks").select("id,name,icon").order("created_at");
  check(error);
  return (data ?? []) as Notebook[];
}

export async function addNotebook(name: string, icon: string | null): Promise<void> {
  const { error } = await sb().from("notebooks").insert({ name, icon, user_id: await uid() });
  check(error);
}

export async function deleteNotebook(id: string): Promise<void> {
  const { error } = await sb().from("notebooks").delete().eq("id", id);
  check(error);
}

// ---------- Notas ----------
export async function listEntries(): Promise<Entry[]> {
  const { data, error } = await sb()
    .from("notebook_entries")
    .select("id,notebook_id,title,content,updated_at")
    .order("updated_at", { ascending: false });
  check(error);
  return (data ?? []) as Entry[];
}

export async function addEntry(notebookId: string, title: string): Promise<string> {
  const { data, error } = await sb()
    .from("notebook_entries")
    .insert({ notebook_id: notebookId, title, user_id: await uid() })
    .select("id")
    .single();
  check(error);
  return data?.id as string;
}

export async function saveEntry(id: string, patch: { title?: string; content?: string }): Promise<void> {
  const { error } = await sb()
    .from("notebook_entries")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  check(error);
}

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await sb().from("notebook_entries").delete().eq("id", id);
  check(error);
}
