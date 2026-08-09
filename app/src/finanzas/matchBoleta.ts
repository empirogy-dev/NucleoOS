import type { Tx } from "./types";

// El match de una boleta con su gasto. Mismas reglas que usa Kay en el
// servidor, para que la app y el coach elijan siempre igual.
//
// El orden importa y salió de probarlo con casos reales:
//   1. El comercio manda. Un gasto ajeno del mismo monto jamás gana.
//   2. Entre los del mismo comercio (Starlink todos los meses), decide la
//      fecha más cercana a la de la boleta.
//   3. A igualdad, primero el que espera sin categoría en Por revisar.

export interface Candidato {
  tx: Tx;
  puntaje: number;
}

function normal(x: string): string {
  return x.toLowerCase().replace(/[^a-z0-9áéíóúñ ]/g, " ").trim();
}

function dias(a: string, b: string): number {
  const ms = Math.abs(new Date(`${a}T00:00:00Z`).getTime() - new Date(`${b}T00:00:00Z`).getTime());
  return ms / 86400000;
}

/** Los gastos que podrían ser esta boleta, del mejor al peor. Solo entran
 *  los del monto exacto: un monto distinto no es la misma compra. */
export function candidatosPara(
  txs: Tx[],
  boleta: { monto: number; comercio: string; fecha: string },
): Candidato[] {
  const primeraPalabra = normal(boleta.comercio).split(/\s+/).filter((p) => p.length > 3)[0] ?? "";
  return txs
    .filter((t) => t.type === "expense" && Math.abs(Number(t.amount) - boleta.monto) < 0.005)
    .map((tx) => {
      const texto = normal(`${tx.merchant ?? ""} ${tx.bank_ref ?? ""} ${tx.description ?? ""}`);
      let puntaje = 0;
      if (primeraPalabra && texto.includes(primeraPalabra)) puntaje += 1000;
      puntaje -= Math.min(dias(tx.date, boleta.fecha), 400) / 2;
      if (!tx.category_id) puntaje += 5;
      return { tx, puntaje };
    })
    .sort((a, b) => b.puntaje - a.puntaje);
}

/** ¿La mejor opción es lo bastante buena para proponerla con confianza?
 *  Con el comercio coincidiendo, sí. Sin comercio, solo si la fecha está
 *  muy cerca: si no, es mejor preguntar que adivinar. */
export function esBuenMatch(c: Candidato | undefined): boolean {
  if (!c) return false;
  return c.puntaje >= 900 || c.puntaje >= -3;
}
