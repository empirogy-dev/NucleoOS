import { fmtFechaLocal, hoyLocal } from "../lib/fechas";

export type TxType = "income" | "expense" | "transfer";
export type TxSource = "manual" | "voz" | "recibo" | "cartola" | "banco";

export interface Account {
  id: string;
  name: string;
  bank_name: string | null;
  account_type: string;
  balance: number;
  currency: string;
}

export interface Category {
  id: string;
  name: string;
  type: "income" | "expense" | "savings";
  budget: number | null;
  budget_mode: string | null;
  rollover_fund: boolean | null;
  exclude_from_budget: boolean | null;
  icon: string | null;
  color: string | null;
}

export const BUDGET_MODE_LABELS: Record<string, string> = {
  fixed: "Fijo",
  flexible: "Flexible",
  variable: "Variable (no mensual)",
};

export interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  icon: string | null;
  color: string | null;
}

export interface Debt {
  id: string;
  name: string;
  institution: string | null;
  balance: number;
  interest_rate: number | null;
  min_payment: number | null;
  due_date: string | null;
  currency: string;
  notes: string | null;
}

export interface CreditCard {
  id: string;
  name: string;
  bank: string | null;
  last_four: string | null;
  credit_limit: number | null;
  balance: number;
  min_payment: number | null;
  due_date: string | null;
  apr: number | null;
  currency: string;
}

export type ReminderRecurrence = "oneTime" | "monthly" | "biweekly";

export interface Reminder {
  id: string;
  title: string;
  amount: number | null;
  date: string;
  recurrence: ReminderRecurrence;
  category: string; // custom | debt | creditCard
  source_id: string | null;
}

/** Próxima ocurrencia de un recordatorio (>= hoy) según su recurrencia. */
export function nextOccurrence(r: Reminder): string {
  const today = hoyLocal();
  if (r.recurrence === "oneTime" || r.date >= today) return r.date;
  const d = new Date(r.date + "T00:00:00");
  const now = new Date(today + "T00:00:00");
  if (r.recurrence === "monthly") {
    // Conserva el día de pago original: si el mes es más corto (ej. pago el 31
    // y llega febrero), usa el último día del mes en vez de saltarse al mes
    // siguiente, que es lo que hace setMonth con el desborde.
    const diaPago = d.getDate();
    while (d < now) {
      d.setDate(1);
      d.setMonth(d.getMonth() + 1);
      const ultimoDia = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      d.setDate(Math.min(diaPago, ultimoDia));
    }
  } else {
    while (d < now) d.setDate(d.getDate() + 14);
  }
  return fmtFechaLocal(d);
}

/** Días desde hoy hasta la fecha (negativo = vencido). */
export function daysUntil(dateStr: string): number {
  const today = new Date(hoyLocal() + "T00:00:00");
  const d = new Date(dateStr + "T00:00:00");
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

export function dueLabel(days: number): { text: string; tone: "err" | "warn" | "ok" } {
  if (days < 0) return { text: `vencido hace ${-days} día${days === -1 ? "" : "s"}`, tone: "err" };
  if (days === 0) return { text: "¡hoy!", tone: "warn" };
  if (days === 1) return { text: "mañana", tone: "warn" };
  if (days <= 7) return { text: `en ${days} días`, tone: "warn" };
  return { text: `en ${days} días`, tone: "ok" };
}

/** Destino de una transferencia: cuenta, tarjeta, deuda o meta de ahorro. */
export type DestKind = "account" | "card" | "debt" | "goal";

export interface Tx {
  id: string;
  date: string;
  amount: number;
  type: TxType;
  description: string;
  category_id: string | null;
  account_id: string | null;
  destination_account_id: string | null;
  destination_kind: DestKind | null;
  destination_ref: string | null;
  source: TxSource;
}

/** Tipos de cuenta (los valores en inglés vienen del esquema de Fluxney). */
export const ACCOUNT_TYPES = ["Checking", "Savings", "Credit Card", "Cash", "Investment"] as const;

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  Checking: "Corriente",
  Savings: "Ahorro",
  "Credit Card": "Tarjeta de crédito",
  Cash: "Efectivo",
  Investment: "Inversión",
};

export const DEFAULT_CATEGORIES: Array<Pick<Category, "name" | "type" | "icon">> = [
  { name: "Comida", type: "expense", icon: "🍎" },
  { name: "Transporte", type: "expense", icon: "🚌" },
  { name: "Hogar", type: "expense", icon: "🏠" },
  { name: "Salud", type: "expense", icon: "💊" },
  { name: "Entretención", type: "expense", icon: "🎬" },
  { name: "Compras", type: "expense", icon: "🛍️" },
  { name: "Servicios", type: "expense", icon: "💡" },
  { name: "Educación", type: "expense", icon: "📚" },
  { name: "Sueldo", type: "income", icon: "💼" },
  { name: "Otros ingresos", type: "income", icon: "✨" },
  { name: "Ahorro", type: "savings", icon: "🌱" },
];

export function fmtMoney(n: number, currency = "CLP"): string {
  try {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "CLP" ? 0 : 2,
    }).format(n);
  } catch {
    return `$${n.toLocaleString("es-CL")}`;
  }
}
