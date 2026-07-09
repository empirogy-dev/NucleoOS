import { supabase } from "../lib/supabase";
import { DEFAULT_CATEGORIES, type Account, type Category, type Goal, type Tx } from "./types";

/** Error especial cuando faltan las tablas (migración no ejecutada). */
export class TablesMissingError extends Error {
  constructor() {
    super("Faltan las tablas de finanzas en Supabase.");
    this.name = "TablesMissingError";
  }
}

function check(error: { code?: string; message: string } | null) {
  if (!error) return;
  // 42P01 (Postgres) / PGRST205 (PostgREST) = la migración aún no se corre
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

// ---------- Cuentas ----------
export async function listAccounts(): Promise<Account[]> {
  const { data, error } = await sb()
    .from("accounts")
    .select("id,name,bank_name,account_type,balance,currency")
    .order("created_at");
  check(error);
  return (data ?? []) as Account[];
}

export async function addAccount(a: Omit<Account, "id">): Promise<void> {
  const { error } = await sb().from("accounts").insert({ ...a, user_id: await uid() });
  check(error);
}

export async function deleteAccount(id: string): Promise<void> {
  const { error } = await sb().from("accounts").delete().eq("id", id);
  check(error);
}

// ---------- Categorías ----------
export async function listCategories(): Promise<Category[]> {
  const { data, error } = await sb()
    .from("categories")
    .select("id,name,type,budget,icon,color")
    .order("created_at");
  check(error);
  return (data ?? []) as Category[];
}

/** Crea las categorías por defecto la primera vez (si el usuario no tiene ninguna). */
export async function seedCategoriesIfEmpty(): Promise<Category[]> {
  const existing = await listCategories();
  if (existing.length > 0) return existing;
  const user_id = await uid();
  const { error } = await sb()
    .from("categories")
    .insert(DEFAULT_CATEGORIES.map((c) => ({ ...c, user_id })));
  check(error);
  return listCategories();
}

export async function addCategory(c: { name: string; type: Category["type"]; icon?: string }): Promise<void> {
  const { error } = await sb().from("categories").insert({ ...c, user_id: await uid() });
  check(error);
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await sb().from("categories").delete().eq("id", id);
  check(error);
}

export async function updateCategoryBudget(id: string, budget: number | null): Promise<void> {
  const { error } = await sb().from("categories").update({ budget }).eq("id", id);
  check(error);
}

// ---------- Metas de ahorro ----------
export async function listGoals(): Promise<Goal[]> {
  const { data, error } = await sb()
    .from("goals")
    .select("id,name,target_amount,current_amount,deadline,icon,color")
    .order("created_at");
  check(error);
  return (data ?? []) as Goal[];
}

export async function addGoal(g: { name: string; target_amount: number; deadline: string | null; icon: string | null }): Promise<void> {
  const { error } = await sb().from("goals").insert({ ...g, user_id: await uid() });
  check(error);
}

export async function contributeToGoal(id: string, amount: number): Promise<void> {
  const { data, error } = await sb().from("goals").select("current_amount").eq("id", id).single();
  check(error);
  const { error: e2 } = await sb()
    .from("goals")
    .update({ current_amount: Number(data?.current_amount ?? 0) + amount })
    .eq("id", id);
  check(e2);
}

export async function deleteGoal(id: string): Promise<void> {
  const { error } = await sb().from("goals").delete().eq("id", id);
  check(error);
}

// ---------- Transacciones ----------
export async function listTransactions(limit = 200): Promise<Tx[]> {
  const { data, error } = await sb()
    .from("transactions")
    .select("id,date,amount,type,description,category_id,account_id,source")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  check(error);
  return (data ?? []) as Tx[];
}

export async function addTransaction(t: {
  date: string;
  amount: number;
  type: Tx["type"];
  description: string;
  category_id: string | null;
  account_id: string | null;
}): Promise<void> {
  const { error } = await sb()
    .from("transactions")
    .insert({ ...t, source: "manual", user_id: await uid() });
  check(error);
  // actualizar saldo de la cuenta (simple, v1)
  if (t.account_id) {
    const delta = t.type === "income" ? t.amount : -t.amount;
    const { data } = await sb().from("accounts").select("balance").eq("id", t.account_id).single();
    if (data) {
      await sb().from("accounts").update({ balance: Number(data.balance) + delta }).eq("id", t.account_id);
    }
  }
}

export async function deleteTransaction(t: Tx): Promise<void> {
  const { error } = await sb().from("transactions").delete().eq("id", t.id);
  check(error);
  // revertir saldo (v1)
  if (t.account_id) {
    const delta = t.type === "income" ? -t.amount : t.amount;
    const { data } = await sb().from("accounts").select("balance").eq("id", t.account_id).single();
    if (data) {
      await sb().from("accounts").update({ balance: Number(data.balance) + delta }).eq("id", t.account_id);
    }
  }
}
