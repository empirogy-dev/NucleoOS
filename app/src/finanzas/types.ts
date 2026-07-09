export type TxType = "income" | "expense";
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
  icon: string | null;
  color: string | null;
}

export interface Tx {
  id: string;
  date: string;
  amount: number;
  type: TxType;
  description: string;
  category_id: string | null;
  account_id: string | null;
  source: TxSource;
}

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
