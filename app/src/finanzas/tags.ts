import { supabase } from "../lib/supabase";
import { TablesMissingError } from "./data";

// Etiquetas de transacciones (migración 0057): una transacción puede llevar
// varias, independientes de su categoría. La gracia es separar mundos que
// las categorías mezclan: lo del negocio, lo personal, lo deducible de
// impuestos. Al final del año, filtrar por etiqueta ES el reporte para el
// contador.

export interface Etiqueta {
  id: string;
  name: string;
  color: string | null;
}

/** Las primeras etiquetas que se ofrecen crear, pensadas para quien trabaja
 *  como independiente en Canadá (deducciones CRA) sin dejar fuera al resto. */
export const ETIQUETAS_SUGERIDAS: Array<{ name: string; color: string }> = [
  { name: "Negocio", color: "#8FAF9B" },
  { name: "Personal", color: "#C9A96A" },
  { name: "Deducible impuestos", color: "#7E9CC0" },
];

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

export async function listTags(): Promise<Etiqueta[]> {
  const { data, error } = await sb().from("tags").select("id,name,color").order("name");
  check(error);
  return (data ?? []) as Etiqueta[];
}

export async function addTag(name: string, color: string | null = null): Promise<Etiqueta> {
  const limpio = name.trim();
  if (!limpio) throw new Error("La etiqueta necesita un nombre.");
  const { data, error } = await sb()
    .from("tags")
    .insert({ user_id: await uid(), name: limpio, color })
    .select("id,name,color")
    .single();
  check(error);
  return data as Etiqueta;
}

export async function deleteTag(id: string): Promise<void> {
  // Los vínculos en transaction_tags caen solos por el on delete cascade.
  const { error } = await sb().from("tags").delete().eq("id", id);
  check(error);
}

/** Mapa transaction_id → etiquetas, para pintar chips en la lista sin una
 *  consulta por fila. */
export async function tagsPorTransaccion(): Promise<Map<string, Etiqueta[]>> {
  const { data, error } = await sb()
    .from("transaction_tags")
    .select("transaction_id, tags (id,name,color)");
  check(error);
  const mapa = new Map<string, Etiqueta[]>();
  for (const fila of (data ?? []) as Array<{ transaction_id: string; tags: Etiqueta | Etiqueta[] | null }>) {
    const t = fila.tags;
    if (!t) continue;
    const lista = mapa.get(fila.transaction_id) ?? [];
    lista.push(...(Array.isArray(t) ? t : [t]));
    mapa.set(fila.transaction_id, lista);
  }
  return mapa;
}

export async function etiquetarTx(transactionId: string, tagId: string): Promise<void> {
  const { error } = await sb()
    .from("transaction_tags")
    .upsert(
      { user_id: await uid(), transaction_id: transactionId, tag_id: tagId },
      { onConflict: "transaction_id,tag_id", ignoreDuplicates: true },
    );
  check(error);
}

export async function desetiquetarTx(transactionId: string, tagId: string): Promise<void> {
  const { error } = await sb()
    .from("transaction_tags")
    .delete()
    .eq("transaction_id", transactionId)
    .eq("tag_id", tagId);
  check(error);
}
