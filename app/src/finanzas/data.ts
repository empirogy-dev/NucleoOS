import { supabase } from "../lib/supabase";
import {
  DEFAULT_CATEGORIES,
  type Account,
  type Category,
  type CreditCard,
  type Debt,
  type Goal,
  type Reminder,
  type ReminderRecurrence,
  type Tx,
  type TxSource,
} from "./types";

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

export async function updateAccount(id: string, a: Omit<Account, "id">): Promise<void> {
  const { error } = await sb().from("accounts").update(a).eq("id", id);
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
    .select("id,name,type,budget,budget_mode,exclude_from_budget,rollover_fund,icon,color")
    .order("created_at");
  if (error && /exclude_from_budget|rollover_fund/.test(error.message)) {
    // La migración 0012 aún no se corre: leemos sin los campos nuevos.
    const legado = await sb()
      .from("categories")
      .select("id,name,type,budget,budget_mode,icon,color")
      .order("created_at");
    check(legado.error);
    return (legado.data ?? []).map((c) => ({ ...c, exclude_from_budget: false, rollover_fund: false })) as Category[];
  }
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

export async function updateCategory(id: string, c: {
  name: string;
  type: Category["type"];
  icon: string | null;
  budget: number | null;
  budget_mode: string | null;
  exclude_from_budget: boolean;
  rollover_fund: boolean;
}): Promise<void> {
  const { error } = await sb().from("categories").update(c).eq("id", id);
  if (error && /exclude_from_budget/.test(error.message)) {
    throw new Error("Falta la migración 0012 en Supabase (supabase/migrations/0012_presupuestos.sql).");
  }
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

export async function addGoal(g: { name: string; target_amount: number; deadline: string | null; icon: string | null }): Promise<string> {
  const { data, error } = await sb().from("goals").insert({ ...g, user_id: await uid() }).select("id").single();
  check(error);
  return (data as { id: string }).id;
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

export async function updateGoal(id: string, g: {
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  icon: string | null;
}): Promise<void> {
  const { error } = await sb().from("goals").update(g).eq("id", id);
  check(error);
}

export async function deleteGoal(id: string): Promise<void> {
  const { error } = await sb().from("goals").delete().eq("id", id);
  check(error);
}

// ---------- Deudas ----------
export async function listDebts(): Promise<Debt[]> {
  const { data, error } = await sb()
    .from("debts")
    .select("id,name,institution,balance,interest_rate,min_payment,due_date,currency,notes")
    .order("created_at");
  check(error);
  return (data ?? []) as Debt[];
}

export async function addDebt(d: {
  name: string; institution: string | null; balance: number;
  interest_rate: number | null; min_payment: number | null;
  due_date: string | null; currency: string; notes: string | null;
}): Promise<void> {
  const user_id = await uid();
  const { data, error } = await sb().from("debts").insert({ ...d, user_id }).select("id").single();
  check(error);
  if (d.due_date && data) {
    await addReminder({
      title: `Pago de ${d.name}`,
      amount: d.min_payment,
      date: d.due_date,
      recurrence: "monthly",
      category: "debt",
      source_id: data.id,
    });
  }
}

/** Mantiene el recordatorio de pago de una deuda o tarjeta al editarla:
 *  lo actualiza, lo crea si ahora hay fecha, o lo borra si la fecha se quitó. */
async function syncReminderPago(
  sourceId: string,
  category: "debt" | "creditCard",
  title: string,
  amount: number | null,
  dueDate: string | null,
): Promise<void> {
  const { data } = await sb().from("reminders").select("id").eq("source_id", sourceId).limit(1);
  const existente = data?.[0];
  if (dueDate) {
    if (existente) {
      await sb().from("reminders").update({ title, amount, date: dueDate }).eq("id", existente.id);
    } else {
      await addReminder({ title, amount, date: dueDate, recurrence: "monthly", category, source_id: sourceId });
    }
  } else if (existente) {
    await sb().from("reminders").delete().eq("id", existente.id);
  }
}

export async function updateDebt(id: string, d: {
  name: string; institution: string | null; balance: number;
  interest_rate: number | null; min_payment: number | null;
  due_date: string | null; currency: string; notes: string | null;
}): Promise<void> {
  const { error } = await sb().from("debts").update(d).eq("id", id);
  check(error);
  await syncReminderPago(id, "debt", `Pago de ${d.name}`, d.min_payment, d.due_date);
}

export async function deleteDebt(id: string): Promise<void> {
  await sb().from("reminders").delete().eq("source_id", id);
  const { error } = await sb().from("debts").delete().eq("id", id);
  check(error);
}

// ---------- Tarjetas de crédito ----------
export async function listCards(): Promise<CreditCard[]> {
  const { data, error } = await sb()
    .from("credit_cards")
    .select("id,name,bank,last_four,credit_limit,balance,min_payment,due_date,apr,currency")
    .order("created_at");
  check(error);
  return (data ?? []) as CreditCard[];
}

export async function addCard(c: {
  name: string; bank: string | null; last_four: string | null;
  credit_limit: number | null; balance: number; min_payment: number | null;
  due_date: string | null; apr: number | null; currency: string;
}): Promise<void> {
  const user_id = await uid();
  const { data, error } = await sb().from("credit_cards").insert({ ...c, user_id }).select("id").single();
  check(error);
  if (c.due_date && data) {
    await addReminder({
      title: `Pago de la tarjeta ${c.name}`,
      amount: c.min_payment,
      date: c.due_date,
      recurrence: "monthly",
      category: "creditCard",
      source_id: data.id,
    });
  }
}

export async function updateCard(id: string, c: {
  name: string; bank: string | null; last_four: string | null;
  credit_limit: number | null; balance: number; min_payment: number | null;
  due_date: string | null; apr: number | null; currency: string;
}): Promise<void> {
  const { error } = await sb().from("credit_cards").update(c).eq("id", id);
  check(error);
  await syncReminderPago(id, "creditCard", `Pago de la tarjeta ${c.name}`, c.min_payment, c.due_date);
}

export async function deleteCard(id: string): Promise<void> {
  await sb().from("reminders").delete().eq("source_id", id);
  const { error } = await sb().from("credit_cards").delete().eq("id", id);
  check(error);
}

// ---------- Recordatorios de pago ----------
export async function listReminders(): Promise<Reminder[]> {
  const { data, error } = await sb()
    .from("reminders")
    .select("id,title,amount,date,recurrence,category,source_id")
    .order("date");
  check(error);
  return (data ?? []) as Reminder[];
}

export async function addReminder(r: {
  title: string; amount: number | null; date: string;
  recurrence: ReminderRecurrence; category: string; source_id?: string | null;
}): Promise<void> {
  const { error } = await sb().from("reminders").insert({ ...r, user_id: await uid() });
  check(error);
}

export async function deleteReminder(id: string): Promise<void> {
  const { error } = await sb().from("reminders").delete().eq("id", id);
  check(error);
}

// ---------- Transacciones ----------
export interface TxInput {
  date: string;
  amount: number;
  type: Tx["type"];
  description: string;
  merchant: string | null;
  bank_ref?: string | null;
  category_id: string | null;
  account_id: string | null;
  destination_kind: Tx["destination_kind"];
  destination_ref: string | null;
}

interface Efecto {
  tabla: "accounts" | "credit_cards" | "debts" | "goals";
  campo: "balance" | "current_amount";
  id: string;
  delta: number;
}

/** Efectos de un movimiento sobre los saldos, estilo contable:
 *  ingreso suma en la cuenta, gasto resta, y una transferencia resta en el
 *  origen y según el destino: suma en otra cuenta, baja lo usado de una
 *  tarjeta, abona a una deuda o aporta a una meta de ahorro. */
function efectosMovimiento(t: {
  type: Tx["type"];
  amount: number;
  account_id: string | null;
  destination_kind: Tx["destination_kind"];
  destination_ref: string | null;
}): Efecto[] {
  const monto = Number(t.amount);
  const ef: Efecto[] = [];
  if (t.type === "income") {
    if (t.account_id) ef.push({ tabla: "accounts", campo: "balance", id: t.account_id, delta: monto });
    return ef;
  }
  if (t.type === "expense") {
    if (t.account_id) ef.push({ tabla: "accounts", campo: "balance", id: t.account_id, delta: -monto });
    return ef;
  }
  if (t.account_id) ef.push({ tabla: "accounts", campo: "balance", id: t.account_id, delta: -monto });
  if (t.destination_ref) {
    if (t.destination_kind === "account") ef.push({ tabla: "accounts", campo: "balance", id: t.destination_ref, delta: monto });
    if (t.destination_kind === "card") ef.push({ tabla: "credit_cards", campo: "balance", id: t.destination_ref, delta: -monto });
    if (t.destination_kind === "debt") ef.push({ tabla: "debts", campo: "balance", id: t.destination_ref, delta: -monto });
    if (t.destination_kind === "goal") ef.push({ tabla: "goals", campo: "current_amount", id: t.destination_ref, delta: monto });
  }
  return ef;
}

async function aplicarEfectos(efectos: Efecto[], signo: 1 | -1): Promise<void> {
  for (const e of efectos) {
    const { data } = await sb().from(e.tabla).select(e.campo).eq("id", e.id).single();
    if (data) {
      const actual = Number((data as Record<string, unknown>)[e.campo] ?? 0);
      await sb().from(e.tabla).update({ [e.campo]: actual + signo * e.delta }).eq("id", e.id);
    }
  }
}

/** Columnas que se escriben en la tabla (mantiene destination_account_id por compatibilidad). */
function columnasTx(t: TxInput) {
  return {
    ...t,
    destination_account_id: t.destination_kind === "account" ? t.destination_ref : null,
  };
}

export async function listTransactions(limit = 200): Promise<Tx[]> {
  const { data, error } = await sb()
    .from("transactions")
    .select("id,date,amount,type,description,merchant,bank_ref,category_id,account_id,destination_account_id,destination_kind,destination_ref,source")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error && /bank_ref/.test(error.message)) {
    // La migración 0043 aún no se corre: leemos sin el texto del banco.
    const sinBankRef = await sb()
      .from("transactions")
      .select("id,date,amount,type,description,merchant,category_id,account_id,destination_account_id,destination_kind,destination_ref,source")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);
    check(sinBankRef.error);
    return (sinBankRef.data ?? []).map((x) => ({ ...x, bank_ref: null })) as Tx[];
  }
  if (error && /merchant/.test(error.message)) {
    // La migración 0013 aún no se corre: leemos sin comercio.
    const sinComercio = await sb()
      .from("transactions")
      .select("id,date,amount,type,description,category_id,account_id,destination_account_id,destination_kind,destination_ref,source")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);
    check(sinComercio.error);
    return (sinComercio.data ?? []).map((x) => ({ ...x, merchant: null })) as Tx[];
  }
  if (error && /destination_kind|destination_ref/.test(error.message)) {
    // La migración 0011 aún no se corre: leemos el formato antiguo.
    const legado = await sb()
      .from("transactions")
      .select("id,date,amount,type,description,category_id,account_id,destination_account_id,source")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);
    check(legado.error);
    return (legado.data ?? []).map((t) => ({
      ...t,
      merchant: null,
      destination_kind: t.destination_account_id ? ("account" as const) : null,
      destination_ref: t.destination_account_id,
    })) as Tx[];
  }
  check(error);
  return (data ?? []) as Tx[];
}

export async function addTransaction(t: TxInput, source: TxSource = "manual"): Promise<void> {
  const { error } = await sb()
    .from("transactions")
    .insert({ ...columnasTx(t), source, user_id: await uid() });
  check(error);
  await aplicarEfectos(efectosMovimiento(t), 1);
}

/** Importa filas de una cartola como transacciones (source: cartola), omitiendo duplicados. */
export async function importStatementRows(
  rows: Array<{ date: string; description: string; amount: number; type: "income" | "expense"; category: string }>,
  accountId: string | null,
  categories: Category[],
  existing: Tx[],
): Promise<{ imported: number; skipped: number }> {
  const user_id = await uid();
  const catByName = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));
  // La firma de un movimiento del banco es su texto crudo (bank_ref); la
  // descripción quedó libre para uso humano, así que ya no sirve de firma.
  const seen = new Set(
    existing.map((t) => `${t.date}|${Number(t.amount)}|${(t.bank_ref ?? t.description).trim().toLowerCase()}`)
  );

  const reglas = await listMerchantRules();
  const toInsert: Array<Record<string, unknown>> = [];
  let skipped = 0;
  for (const r of rows) {
    const key = `${r.date}|${Math.abs(r.amount)}|${r.description.trim().toLowerCase()}`;
    if (seen.has(key)) {
      skipped += 1;
      continue;
    }
    seen.add(key);
    const regla = reglaPara(r.description, reglas);
    toInsert.push({
      user_id,
      date: r.date,
      amount: Math.abs(r.amount),
      type: r.type,
      // El texto del banco va a bank_ref; la descripción nace vacía. El
      // comercio solo lo pone una regla (así las reglas nuevas pueden
      // seguir aplicándose a los movimientos que aún no tienen comercio).
      description: "",
      bank_ref: r.description,
      ...(regla ? { merchant: regla.merchant } : {}),
      category_id: regla?.category_id ?? (r.category ? catByName.get(r.category.toLowerCase()) ?? null : null),
      account_id: accountId,
      source: "cartola",
    });
  }

  if (toInsert.length > 0) {
    let { error } = await sb().from("transactions").insert(toInsert);
    if (error && /bank_ref/.test(error.message)) {
      // Sin la 0043 todavía: formato antiguo, el texto del banco en la descripción.
      const legado = toInsert.map(({ bank_ref, ...t }) => ({ ...t, description: bank_ref }));
      ({ error } = await sb().from("transactions").insert(legado));
    }
    check(error);
    if (accountId) {
      const delta = toInsert.reduce(
        (s, t) => s + (t.type === "income" ? Number(t.amount) : -Number(t.amount)),
        0
      );
      await ajustarSaldo(accountId, delta);
    }
  }
  return { imported: toInsert.length, skipped };
}

/** Ajusta el saldo de una cuenta en delta (positivo o negativo). */
async function ajustarSaldo(accountId: string | null, delta: number): Promise<void> {
  if (!accountId || delta === 0) return;
  const { data } = await sb().from("accounts").select("balance").eq("id", accountId).single();
  if (data) {
    await sb().from("accounts").update({ balance: Number(data.balance) + delta }).eq("id", accountId);
  }
}

/** Compatibilidad: las transferencias guardadas antes de la migración 0011
 *  solo tienen destination_account_id; se normalizan al formato nuevo. */
function normalizarDestino(t: Tx): Tx {
  if (t.type === "transfer" && !t.destination_kind && t.destination_account_id) {
    return { ...t, destination_kind: "account", destination_ref: t.destination_account_id };
  }
  return t;
}

/** Edita una transacción (también las importadas de cartola) y corrige los saldos. */
export async function updateTransaction(oldTx: Tx, t: TxInput): Promise<void> {
  const { error } = await sb().from("transactions").update(columnasTx(t)).eq("id", oldTx.id);
  check(error);
  await aplicarEfectos(efectosMovimiento(normalizarDestino(oldTx)), -1);
  await aplicarEfectos(efectosMovimiento(t), 1);
}

export async function deleteTransaction(t: Tx): Promise<void> {
  const { error } = await sb().from("transactions").delete().eq("id", t.id);
  check(error);
  await aplicarEfectos(efectosMovimiento(normalizarDestino(t)), -1);
}

/** Divide una boleta en varias partes, cada una con su categoría y monto.
 *  La suma de las partes debe calzar con el total; el saldo queda igual. */
export async function splitTransaction(
  original: Tx,
  partes: Array<{ description: string; category_id: string | null; amount: number }>,
): Promise<void> {
  const suma = partes.reduce((s, p) => s + p.amount, 0);
  if (Math.abs(suma - Number(original.amount)) > 0.01) {
    throw new Error("Las partes deben sumar exactamente el total de la boleta.");
  }
  for (const p of partes) {
    await addTransaction({
      date: original.date,
      amount: p.amount,
      type: original.type,
      description: p.description,
      merchant: original.merchant,
      category_id: p.category_id,
      account_id: original.account_id,
      destination_kind: null,
      destination_ref: null,
    });
  }
  await deleteTransaction(original);
}

// ---------- Comercios y reglas de renombrado ----------
export interface MerchantRule {
  id: string;
  pattern: string;
  merchant: string;
  category_id: string | null;
}

/** Normaliza el texto del banco: minúsculas, sin tildes ni símbolos. */
export function normalizarComercio(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/** Patrón de una regla: las primeras palabras sin números del texto del banco.
 *  "KLARNA*SPIKESEX CANADA TORONTO 0423" queda como "klarna spikesex canada". */
export function patronDesde(texto: string): string {
  const tokens = normalizarComercio(texto)
    .split(" ")
    .filter((t) => t && !/^\d+$/.test(t));
  return tokens.slice(0, 3).join(" ");
}

/** Nombre de comercio sugerido desde el texto crudo del banco:
 *  "[PR]SEPHORA KELOWNA KELOWNA BC" queda como "Sephora Kelowna". */
export function sugerenciaComercio(texto: string): string {
  const tokens = patronDesde(texto)
    .split(" ")
    .filter((t) => t.length > 2);
  return [...new Set(tokens)]
    .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
    .join(" ");
}

export async function listMerchantRules(): Promise<MerchantRule[]> {
  const { data, error } = await sb()
    .from("merchant_rules")
    .select("id,pattern,merchant,category_id")
    .order("created_at");
  if (error) return []; // tabla aún no migrada: sin reglas
  return (data ?? []) as MerchantRule[];
}

/** Busca la regla que calza con un texto del banco. */
export function reglaPara(texto: string, reglas: MerchantRule[]): MerchantRule | null {
  const norm = normalizarComercio(texto);
  return reglas.find((r) => norm.includes(r.pattern)) ?? null;
}

/**
 * Guarda una regla de renombrado y la aplica a los movimientos existentes
 * del banco que calzan y aún no tienen comercio. Devuelve cuántos actualizó.
 */
export async function saveMerchantRule(
  textoOriginal: string,
  merchant: string,
  categoryId: string | null,
): Promise<number> {
  const pattern = patronDesde(textoOriginal);
  if (!pattern || !merchant.trim()) return 0;
  const { error } = await sb()
    .from("merchant_rules")
    .upsert(
      { user_id: await uid(), pattern, merchant: merchant.trim(), category_id: categoryId },
      { onConflict: "user_id,pattern" },
    );
  if (error && /merchant_rules/.test(error.message)) {
    throw new Error("Falta la migración 0013 en Supabase (supabase/migrations/0013_comercios.sql).");
  }
  check(error);

  // aplicar a los existentes que calzan y no tienen comercio
  let { data } = await sb()
    .from("transactions")
    .select("id,description,bank_ref,category_id")
    .in("source", ["cartola", "banco"])
    .is("merchant", null);
  if (!data) {
    // Sin la 0043 (bank_ref no existe): leemos el formato antiguo.
    const legado = await sb()
      .from("transactions")
      .select("id,description,category_id")
      .in("source", ["cartola", "banco"])
      .is("merchant", null);
    data = (legado.data ?? []).map((t) => ({ ...t, bank_ref: null }));
  }
  const calzan = (data ?? []).filter((t) => normalizarComercio(t.bank_ref ?? t.description).includes(pattern));
  if (calzan.length > 0) {
    const ids = calzan.map((t) => t.id);
    await sb().from("transactions").update({ merchant: merchant.trim() }).in("id", ids);
    if (categoryId) {
      const sinCategoria = calzan.filter((t) => !t.category_id).map((t) => t.id);
      if (sinCategoria.length > 0) {
        await sb().from("transactions").update({ category_id: categoryId }).in("id", sinCategoria);
      }
    }
  }
  return calzan.length;
}
