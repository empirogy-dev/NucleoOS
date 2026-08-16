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
    // Lo reembolsado no gasta tu presupuesto: te devolvieron la plata.
    .filter((t) => t.type === "expense" && !t.reimbursed && t.category_id === categoryId && t.date.startsWith(mes))
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


// ---------- Cuánto poner de tope ----------
//
// Un presupuesto inventado no sirve: si lo pones muy bajo lo revientas el
// día 8 y dejas de mirarlo, y si lo pones muy alto no te avisa nunca. El
// único número honesto sale de lo que de verdad has gastado.
//
// Se miran los meses COMPLETOS, no el actual: el mes en curso va a la mitad y
// arrastraría el promedio hacia abajo, haciéndote poner un tope que no
// alcanza.

export interface HistorialCategoria {
  meses: Array<{ mes: string; total: number }>;
  promedio: number;
  maximo: number;
  /** El tope propuesto: el promedio con un respiro, redondeado a algo que se
   *  pueda recordar. Un tope exacto al promedio se pasa la mitad de los
   *  meses, por definición. */
  sugerido: number;
}

export function historialCategoria(
  cat: Category,
  txs: Tx[],
  mesActual: string,
  cuantos = 3,
): HistorialCategoria | null {
  const mesesAtras = (m: string, n: number) => {
    const [a, b] = m.split("-").map(Number);
    const d = new Date(Date.UTC(a, b - 1 - n, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  };

  const meses: Array<{ mes: string; total: number }> = [];
  for (let i = 1; i <= cuantos; i += 1) {
    const mes = mesesAtras(mesActual, i);
    const hubo = txs.some((t) => t.date.startsWith(mes));
    if (!hubo) continue; // un mes sin NINGÚN movimiento es un mes sin datos
    const total = txs
      .filter((t) => t.type === "expense" && !t.reimbursed
        && t.category_id === cat.id && t.date.startsWith(mes))
      .reduce((s, t) => s + Number(t.amount), 0);
    meses.push({ mes, total });
  }
  if (meses.length === 0) return null;

  const promedio = meses.reduce((s, m) => s + m.total, 0) / meses.length;
  const maximo = Math.max(...meses.map((m) => m.total));
  if (promedio <= 0) return null;

  // Un diez por ciento de aire, y redondeado hacia arriba a una cifra
  // redonda del tamaño del número: a 10 si es chico, a 1.000 si es grande.
  const conAire = promedio * 1.1;
  // Un tope es un número que uno tiene que poder recordar. 800 se recuerda,
  // 760 no, y la diferencia entre los dos no cambia nada.
  const escala = conAire >= 100000 ? 10000
    : conAire >= 10000 ? 1000
    : conAire >= 1000 ? 100
    : conAire >= 200 ? 50
    : 10;
  const sugerido = Math.ceil(conAire / escala) * escala;

  return { meses, promedio, maximo, sugerido };
}
