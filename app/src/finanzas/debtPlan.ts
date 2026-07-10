import type { Debt } from "./types";

// Plan para salir de deudas, portado de la lógica de Fluxney
// (optimizarDeudaAvalanche en logicaFinanciera.js) y ampliado con la
// estrategia bola de nieve y una simulación mes a mes.

export type Estrategia = "avalanche" | "snowball";

export const ESTRATEGIA_LABELS: Record<Estrategia, string> = {
  avalanche: "Avalancha (mayor interés primero)",
  snowball: "Bola de nieve (menor saldo primero)",
};

/** Ordena las deudas según la estrategia: a cuál atacar primero. */
export function ordenarDeudas(deudas: Debt[], estrategia: Estrategia): Debt[] {
  const activas = deudas.filter((d) => Number(d.balance) > 0);
  return [...activas].sort((a, b) =>
    estrategia === "avalanche"
      ? Number(b.interest_rate ?? 0) - Number(a.interest_rate ?? 0)
      : Number(a.balance) - Number(b.balance)
  );
}

/** Interés que genera una deuda en un mes con su tasa anual. */
export function interesMensual(d: Debt): number {
  return (Number(d.balance) * Number(d.interest_rate ?? 0)) / 100 / 12;
}

export interface PlanResultado {
  meses: number;
  interesesTotales: number;
  inalcanzable: boolean;
}

/**
 * Simula el pago mes a mes: cada deuda paga su mínimo, el dinero extra
 * (más los mínimos que se van liberando al saldar deudas, el efecto
 * bola de nieve) se aplica a la primera deuda del orden de la estrategia.
 */
export function simularPlan(deudas: Debt[], extraMensual: number, estrategia: Estrategia): PlanResultado {
  const orden = ordenarDeudas(deudas, estrategia).map((d) => ({
    saldo: Number(d.balance),
    tasaMes: Number(d.interest_rate ?? 0) / 100 / 12,
    min: Number(d.min_payment ?? 0),
  }));
  if (orden.length === 0) return { meses: 0, interesesTotales: 0, inalcanzable: false };

  const capacidad = orden.reduce((s, d) => s + d.min, 0) + extraMensual;
  if (capacidad <= 0) return { meses: 0, interesesTotales: 0, inalcanzable: true };

  let meses = 0;
  let intereses = 0;
  while (orden.some((d) => d.saldo > 0.01) && meses < 600) {
    meses += 1;
    let liberado = 0;
    for (const d of orden) {
      if (d.saldo <= 0.01) {
        liberado += d.min;
        continue;
      }
      const interes = d.saldo * d.tasaMes;
      intereses += interes;
      d.saldo += interes;
      d.saldo -= Math.min(d.saldo, d.min);
    }
    let extra = extraMensual + liberado;
    for (const d of orden) {
      if (d.saldo > 0.01 && extra > 0) {
        const pago = Math.min(d.saldo, extra);
        d.saldo -= pago;
        extra -= pago;
      }
    }
  }
  return { meses, interesesTotales: Math.round(intereses), inalcanzable: meses >= 600 };
}
