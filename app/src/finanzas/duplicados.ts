import type { Tx } from "./types";

// Encontrar el mismo gasto anotado dos veces.
//
// Pasa por dos caminos, y los dos son fáciles de no notar:
//   1. Se sube la boleta dos veces y se crea el gasto dos veces.
//   2. El banco trae el gasto Y además se crea uno desde la boleta, porque la
//      boleta no encontró a su pariente. Ahí el gasto queda contado el doble
//      y encima el del banco se queda para siempre en Por revisar.
//
// No se pide la fecha idéntica: el banco publica un cargo uno o dos días
// después de la compra, así que exigir el mismo día dejaría fuera justo los
// repetidos que más importa encontrar.

export interface GrupoRepetido {
  clave: string;
  txs: Tx[];
  monto: number;
}

const dias = (a: string, b: string): number =>
  Math.abs(new Date(`${a}T00:00:00Z`).getTime() - new Date(`${b}T00:00:00Z`).getTime()) / 86400000;

/** Grupos de dos o más movimientos que parecen ser el mismo. */
export function buscarRepetidos(txs: Tx[], ventanaDias = 4): GrupoRepetido[] {
  const gastos = txs.filter((t) => t.type !== "transfer");

  // Primero por monto exacto, que es la señal fuerte. Dos gastos del mismo
  // monto en días distintos pueden ser reales (el café de todos los días),
  // por eso además tienen que caer cerca en el tiempo.
  const porMonto = new Map<string, Tx[]>();
  for (const t of gastos) {
    const clave = `${t.type}:${Number(t.amount).toFixed(2)}`;
    porMonto.set(clave, [...(porMonto.get(clave) ?? []), t]);
  }

  const grupos: GrupoRepetido[] = [];
  for (const [clave, lista] of porMonto) {
    if (lista.length < 2) continue;
    const orden = [...lista].sort((a, b) => a.date.localeCompare(b.date));
    let actual: Tx[] = [];
    for (const t of orden) {
      if (actual.length === 0 || dias(actual[actual.length - 1].date, t.date) <= ventanaDias) {
        actual.push(t);
      } else {
        if (actual.length >= 2) grupos.push({ clave: `${clave}:${actual[0].id}`, txs: actual, monto: Number(actual[0].amount) });
        actual = [t];
      }
    }
    if (actual.length >= 2) grupos.push({ clave: `${clave}:${actual[0].id}`, txs: actual, monto: Number(actual[0].amount) });
  }

  // Los más caros primero: ahí es donde un doble conteo duele.
  return grupos.sort((a, b) => b.monto - a.monto);
}

/** Cuál conviene conservar: el del banco manda, porque es el que cuadra con
 *  el saldo de la cuenta. Entre iguales, el que ya tiene categoría. */
export function cualConservar(grupo: GrupoRepetido, conRecibo: Set<string>): Tx {
  const puntaje = (t: Tx): number => {
    let p = 0;
    if (t.source === "banco") p += 100;
    else if (t.source === "cartola") p += 80;
    if (t.category_id) p += 10;
    if (t.account_id || t.payment_source_id) p += 5;
    if (conRecibo.has(t.id)) p += 3;
    return p;
  };
  return [...grupo.txs].sort((a, b) => puntaje(b) - puntaje(a))[0];
}
