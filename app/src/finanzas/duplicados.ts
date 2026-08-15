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

const normal = (x: string): string =>
  x.toLowerCase().replace(/[^a-z0-9áéíóúñ ]/g, " ").replace(/\s+/g, " ").trim();

const textoDe = (t: Tx): string =>
  normal(`${t.merchant ?? ""} ${t.bank_ref ?? ""} ${t.description ?? ""}`);

/** ¿Estos dos hablan del mismo comercio?
 *
 *  Sin esto, el monto solo alcanzaba para acusar: setenta y cinco dólares del
 *  doctor y setenta y cinco de bencina caían en el mismo grupo, y eso no es
 *  un repetido, son dos gastos distintos que costaron lo mismo. Ahora tienen
 *  que compartir una palabra de peso, o que el nombre de uno esté dentro del
 *  otro ("Hims & Hers" y "Hers", que es el banco escribiéndolo de dos formas).
 */
export function mismoComercio(a: Tx, b: Tx): boolean {
  const ta = textoDe(a);
  const tb = textoDe(b);
  if (!ta || !tb) return false;
  if (ta === tb) return true;
  if (ta.includes(tb) || tb.includes(ta)) return true;
  const palabras = (x: string) => new Set(x.split(" ").filter((p) => p.length >= 4));
  const pa = palabras(ta);
  for (const p of palabras(tb)) if (pa.has(p)) return true;
  return false;
}

/** ¿Pudieron salir del mismo bolsillo?
 *
 *  Si los dos dicen de qué cuenta o tarjeta salieron y son distintas, no son
 *  el mismo gasto: una compra se paga una vez, desde un lado. Cuando alguno
 *  no lo dice, se deja pasar, porque un gasto creado desde una boleta suele
 *  venir sin cuenta y ese es justo el caso que hay que encontrar.
 */
export function mismaFuente(a: Tx, b: Tx): boolean {
  const de = (t: Tx) => t.payment_source_id ?? t.account_id ?? null;
  const fa = de(a);
  const fb = de(b);
  if (!fa || !fb) return true;
  return fa === fb;
}

/** Grupos de dos o más movimientos que parecen ser el mismo. */
export function buscarRepetidos(txs: Tx[], ventanaDias = 4, exigirComercio = true): GrupoRepetido[] {
  // Las transferencias también entran. El pago de la tarjeta llega DOS veces,
  // una desde la cuenta que paga y otra en la tarjeta que recibe, y las dos
  // son transferencias: dejarlas fuera era esconder justo el repetido que más
  // desordena los saldos.
  const gastos = txs;

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
    const cerrar = () => {
      if (actual.length >= 2) {
        grupos.push({ clave: `${clave}:${actual[0].id}`, txs: actual, monto: Number(actual[0].amount) });
      }
      actual = [];
    };
    for (const t of orden) {
      const ultimo = actual[actual.length - 1];
      // Mismo monto NO basta: además tiene que caer cerca en el tiempo Y
      // hablar del mismo comercio.
      // Con exigirComercio en falso basta el monto, la fecha y el bolsillo.
      // Sirve para el caso en que el mismo gasto llega con dos nombres que no
      // se parecen en nada: Starlink cobrado a través de Klarna, por ejemplo.
      // Trae más ruido a propósito, así que se activa a mano.
      if (!ultimo || (dias(ultimo.date, t.date) <= ventanaDias
        && (!exigirComercio || mismoComercio(ultimo, t)) && mismaFuente(ultimo, t))) {
        actual.push(t);
      } else {
        cerrar();
        actual = [t];
      }
    }
    cerrar();
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
