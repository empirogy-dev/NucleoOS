import type { Category, Tx } from "./types";

// Presupuestos avanzados, portados de lib/categoryBudgeting.ts de Fluxney:
// modo por categoría (fijo, flexible, variable), fondo de arrastre y
// umbral de advertencia según el modo.

export type BudgetMode = "fixed" | "flexible" | "variable";

export function modoDe(c: Category): BudgetMode {
  if (c.budget_mode === "fixed" || c.budget_mode === "flexible" || c.budget_mode === "variable") {
    return c.budget_mode;
  }
  return c.type === "savings" ? "variable" : "flexible";
}

/** Umbral de advertencia (% usado) según el modo, como en Fluxney. */
export function umbralAdvertencia(modo: BudgetMode): number {
  if (modo === "fixed") return 75;
  if (modo === "flexible") return 85;
  return 90;
}

function gastoDelMes(categoryId: string, txs: Tx[], mes: string): number {
  return txs
    .filter((t) => t.type === "expense" && t.category_id === categoryId && t.date.startsWith(mes))
    .reduce((s, t) => s + Number(t.amount), 0);
}

function mesAnterior(mes: string, n: number): string {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(y, m - 1 - n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export interface ResumenPresupuesto {
  gastado: number;
  arrastre: number;
  disponible: number;
  restante: number;
  pct: number;
  umbral: number;
  excedido: boolean;
}

/**
 * Resumen del presupuesto de una categoría en el mes:
 * si tiene fondo de arrastre, lo no gastado de los últimos 12 meses se
 * acumula y se suma a lo disponible de este mes (sin bajar de cero).
 */
export function resumenPresupuesto(c: Category, txs: Tx[], mesActual: string): ResumenPresupuesto {
  const presupuesto = Number(c.budget ?? 0);
  const gastado = gastoDelMes(c.id, txs, mesActual);
  let arrastre = 0;
  if (c.rollover_fund && presupuesto > 0) {
    let acumulado = 0;
    for (let i = 12; i >= 1; i -= 1) {
      const mes = mesAnterior(mesActual, i);
      acumulado = Math.max(0, acumulado + presupuesto - gastoDelMes(c.id, txs, mes));
    }
    arrastre = acumulado;
  }
  const disponible = Math.max(presupuesto + arrastre, 0);
  const restante = disponible - gastado;
  const pct = disponible > 0 ? (gastado / disponible) * 100 : 0;
  const umbral = umbralAdvertencia(modoDe(c));
  return { gastado, arrastre, disponible, restante, pct, umbral, excedido: gastado > disponible };
}
