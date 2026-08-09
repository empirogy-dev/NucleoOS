import type { Tx } from "./types";

// El match de una boleta con su gasto. Mismas reglas que usa Kay en el
// servidor, para que la app y el coach elijan siempre igual.
//
// El orden importa y salió de probarlo con casos reales:
//   1. El comercio manda. Un gasto ajeno del mismo monto jamás gana.
//   2. Entre los del mismo comercio (Starlink todos los meses), decide la
//      fecha más cercana a la de la boleta.
//   3. A igualdad, primero el que espera sin categoría en Por revisar.
//
// Y una lección de la vida real: exigir el monto EXACTO dejaba fuera gastos
// que sí eran, porque la propina, el redondeo o una lectura de un centavo
// los movían. Ahora hay tres cercos, del más estricto al más amplio, y la
// persona siempre ve opciones para elegir en vez de un "no encontré nada".

export type Cerco = "exacto" | "cercano" | "fecha";

export interface Candidato {
  tx: Tx;
  puntaje: number;
  cerco: Cerco;
}

function normal(x: string): string {
  return x.toLowerCase().replace(/[^a-z0-9áéíóúñ ]/g, " ").trim();
}

function dias(a: string, b: string): number {
  const ms = Math.abs(new Date(`${a}T00:00:00Z`).getTime() - new Date(`${b}T00:00:00Z`).getTime());
  return ms / 86400000;
}

export function candidatosPara(
  txs: Tx[],
  boleta: { monto: number; comercio: string; fecha: string },
  tope = 8,
): Candidato[] {
  const gastos = txs.filter((t) => t.type === "expense");
  const primeraPalabra = normal(boleta.comercio).split(/\s+/).filter((p) => p.length > 3)[0] ?? "";

  const puntaje = (tx: Tx): number => {
    const texto = normal(`${tx.merchant ?? ""} ${tx.bank_ref ?? ""} ${tx.description ?? ""}`);
    let p = 0;
    if (primeraPalabra && texto.includes(primeraPalabra)) p += 1000;
    p -= Math.min(dias(tx.date, boleta.fecha), 400) / 2;
    if (!tx.category_id) p += 5;
    return p;
  };

  const dif = (tx: Tx) => Math.abs(Number(tx.amount) - boleta.monto);
  // Margen del cerco intermedio: un 20% o dos pesos, lo que sea más grande.
  // El 20% no es capricho: en el restorán la boleta muestra el subtotal y el
  // banco cobra con propina, y eso en Canadá es justo ese salto. También
  // cubre redondeos y una lectura con un dígito bailando.
  const margen = Math.max(2, boleta.monto * 0.2);

  const exactos = gastos.filter((t) => dif(t) < 0.02);
  const cercanos = boleta.monto > 0
    ? gastos.filter((t) => dif(t) >= 0.02 && dif(t) <= margen && dias(t.date, boleta.fecha) <= 20)
    : [];
  // Último recurso: los gastos de esos días, con el monto que sea. Mejor
  // mostrarle algo que elegir, que decirle que no hay nada.
  const porFecha = gastos.filter((t) => dif(t) > margen && dias(t.date, boleta.fecha) <= 10);

  const arma = (lista: Tx[], cerco: Cerco): Candidato[] =>
    lista.map((tx) => ({ tx, puntaje: puntaje(tx), cerco })).sort((a, b) => b.puntaje - a.puntaje);

  return [...arma(exactos, "exacto"), ...arma(cercanos, "cercano"), ...arma(porFecha, "fecha")].slice(0, tope);
}

/** Qué se muestra de entrada y qué queda guardado detrás de "ver otros".
 *
 *  La lección: cuando uno calza exacto, mostrar ocho parecidos al lado de la
 *  respuesta correcta no ayuda, estorba. Se enseña solo el mejor cerco, y los
 *  demás quedan a un toque de distancia por si acaso.
 */
export function separar(cands: Candidato[]): { principales: Candidato[]; otros: Candidato[] } {
  if (cands.length === 0) return { principales: [], otros: [] };
  const mejor = cands[0].cerco;
  // Del cerco exacto caben hasta tres: un mismo monto puede repetirse de
  // verdad. Los otros cercos son suposiciones, y de esas basta con dos.
  const cuantos = mejor === "exacto" ? 3 : 2;
  const principales = cands.filter((c) => c.cerco === mejor).slice(0, cuantos);
  return { principales, otros: cands.filter((c) => !principales.includes(c)) };
}

/** ¿La mejor opción es lo bastante buena para dejarla marcada de entrada?
 *  Solo si el monto calza exacto: con un monto distinto, que elija ella. */
export function esBuenMatch(c: Candidato | undefined): boolean {
  if (!c || c.cerco !== "exacto") return false;
  return c.puntaje >= 900 || c.puntaje >= -3;
}
