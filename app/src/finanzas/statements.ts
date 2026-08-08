import { supabase } from "../lib/supabase";
import { TablesMissingError } from "./data";

// El archivo de cartolas (0057): cada cartola que subes queda guardada con
// su cuenta o tarjeta, su mes y el archivo original en el bucket privado
// `cartolas`. Así, cuando el contador pida el respaldo de marzo, está.

export interface Cartola {
  id: string;
  account_id: string | null;
  credit_card_id: string | null;
  period_month: string; // YYYY-MM
  file_path: string | null;
  file_name: string | null;
  transactions_count: number;
  created_at: string;
}

function sb() {
  if (!supabase) throw new Error("Supabase no está configurado.");
  return supabase;
}

function check(error: { code?: string; message: string } | null) {
  if (!error) return;
  if (error.code === "42P01" || error.code === "PGRST205" || /does not exist|could not find the table/i.test(error.message)) {
    throw new TablesMissingError();
  }
  throw new Error(error.message);
}

async function uid(): Promise<string> {
  const { data } = await sb().auth.getUser();
  if (!data.user) throw new Error("Sin sesión.");
  return data.user.id;
}

export async function listCartolas(): Promise<Cartola[]> {
  const { data, error } = await sb()
    .from("statements")
    .select("id,account_id,credit_card_id,period_month,file_path,file_name,transactions_count,created_at")
    .order("period_month", { ascending: false });
  check(error);
  return (data ?? []) as Cartola[];
}

/** Registra la cartola importada y sube el archivo original al bucket. Si la
 *  subida del archivo falla, el registro queda igual: el respaldo es extra. */
export async function addCartola(args: {
  file: File | null;
  account_id: string | null;
  credit_card_id: string | null;
  period_month: string;
  transactions_count: number;
}): Promise<void> {
  const user = await uid();
  let file_path: string | null = null;
  let file_name: string | null = null;
  if (args.file) {
    file_name = args.file.name;
    const limpio = args.file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
    file_path = `${user}/${Date.now()}-${limpio}`;
    const { error: eSubida } = await sb().storage.from("cartolas").upload(file_path, args.file, { upsert: false });
    if (eSubida) { file_path = null; }
  }
  const { error } = await sb().from("statements").insert({
    user_id: user,
    account_id: args.account_id,
    credit_card_id: args.credit_card_id,
    period_month: args.period_month,
    file_path,
    file_name,
    status: "processed",
    transactions_count: args.transactions_count,
  });
  check(error);
}

export async function deleteCartola(c: Cartola): Promise<void> {
  if (c.file_path) await sb().storage.from("cartolas").remove([c.file_path]).catch(() => undefined);
  const { error } = await sb().from("statements").delete().eq("id", c.id);
  check(error);
}

/** Abre el archivo original en otra pestaña, con un enlace firmado corto. */
export async function openCartola(c: Cartola): Promise<void> {
  if (!c.file_path) return;
  const { data, error } = await sb().storage.from("cartolas").createSignedUrl(c.file_path, 120);
  if (error || !data?.signedUrl) throw new Error("No se pudo abrir el archivo.");
  window.open(data.signedUrl, "_blank", "noopener");
}
