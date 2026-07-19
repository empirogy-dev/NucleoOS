import { supabase } from "../lib/supabase";
import { TablesMissingError } from "../finanzas/data";
import { type Libro, type ViaLibro } from "./biblioteca";

// Tus propios libros (migración 0042): viven en Supabase y se muestran
// en la Biblioteca junto a los curados, con la misma tarjeta y las
// mismas marcas de "lo quiero leer" y "leído".

export interface LibroPropio {
  id: string;
  title: string;
  author: string;
  via: ViaLibro;
  emoji: string;
  why: string;
  ideas: string[];
}

// Las metas de "Libros terminados" cuentan por vía de forma síncrona,
// así que recordamos aquí la vía de cada libro propio.
const LS_VIAS = "nucleoos-libros-propios-vias";

export function viasPropiasCache(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LS_VIAS);
    if (raw) return JSON.parse(raw) as Record<string, string>;
  } catch { /* nada */ }
  return {};
}

function guardarViasCache(libros: LibroPropio[]) {
  const mapa: Record<string, string> = {};
  for (const l of libros) mapa[l.id] = l.via;
  localStorage.setItem(LS_VIAS, JSON.stringify(mapa));
}

function sb() {
  if (!supabase) throw new Error("Supabase no está configurado.");
  return supabase;
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

async function uid(): Promise<string> {
  const { data } = await sb().auth.getUser();
  if (!data.user) throw new Error("Sin sesión.");
  return data.user.id;
}

export async function listLibrosPropios(): Promise<LibroPropio[]> {
  const { data, error } = await sb()
    .from("user_books")
    .select("id,title,author,via,emoji,why,ideas")
    .order("created_at");
  check(error);
  const libros = ((data ?? []) as Array<Omit<LibroPropio, "ideas"> & { ideas: unknown }>).map((l) => ({
    ...l,
    ideas: Array.isArray(l.ideas) ? l.ideas.filter((i): i is string => typeof i === "string") : [],
  }));
  guardarViasCache(libros);
  return libros;
}

export async function addLibroPropio(l: { title: string; author: string; via: ViaLibro; emoji: string; why: string; ideas: string[] }): Promise<void> {
  const { error } = await sb().from("user_books").insert({ ...l, user_id: await uid() });
  check(error);
}

export async function deleteLibroPropio(id: string): Promise<void> {
  const { error } = await sb().from("user_books").delete().eq("id", id);
  check(error);
}

/** Un libro propio con la misma forma que los curados, para la misma tarjeta. */
export function comoLibro(l: LibroPropio): Libro {
  return { id: l.id, titulo: l.title, autor: l.author, via: l.via, emoji: l.emoji, porQue: l.why, ideas: l.ideas };
}
