import { claveComercio, type Serie } from "./recurrentes";
import type { Tx } from "./types";

// Lo que la persona decidió sobre una serie de cargos, sin la base de datos.
//
// Está separado de `seriesData.ts` a propósito: guardar y leer necesita
// Supabase, pero emparejar una serie con su decisión es una cuenta y nada más.
// El informe de finanzas hace justo eso, y no tiene por qué arrastrar el
// cliente de la base de datos (ni volverse imposible de probar) para hacerlo.

export type TipoSerie = "subscription" | "installments" | "ignored";

export interface DecisionSerie {
  id: string;
  clave: string;
  anchor_tx_id: string | null;
  kind: TipoSerie;
  name: string | null;
  installments_total: number | null;
  /** Los cargos que la persona asignó a mano a esta serie (0069). Nulo o
   *  vacío significa que la serie se calcula sola desde los movimientos. */
  tx_ids: string[] | null;
}

/**
 * Emparejar una serie calculada con la decisión que ya se tomó sobre ella.
 *
 * Se prueba primero por el movimiento ancla y después por la clave. Ese orden
 * importa: si suben el precio, la clave cambia pero el ancla no, y así la
 * decisión no se pierde justo cuando más se nota.
 */
export function decisionDe(s: Serie, decisiones: DecisionSerie[]): DecisionSerie | null {
  const ids = new Set(s.txs.map((t) => t.id));
  return decisiones.find((d) => d.anchor_tx_id && ids.has(d.anchor_tx_id))
    ?? decisiones.find((d) => d.clave === s.clave)
    ?? null;
}

/** La clave y el ancla de una serie vista desde un solo movimiento.
 *
 *  Sirve para marcar "esto se me cobra todos los meses" desde el lápiz de una
 *  transacción, sin esperar a que la app junte tres cobros y lo descubra sola.
 *  El ancla es ese movimiento: la pestaña reconoce la serie porque el ancla
 *  cae dentro de ella, no porque la clave calce exacto.
 */
export type Anclaje = Pick<Tx, "id" | "amount" | "merchant" | "bank_ref" | "description">;

export function serieDeUnaTx(t: Anclaje): { clave: string; anclaId: string } {
  return { clave: `${claveComercio(t)}|${Number(t.amount).toFixed(2)}`, anclaId: t.id };
}

/** La decisión guardada para el movimiento que se está editando, si hay. */
export function decisionDeTx(t: Tx, decisiones: DecisionSerie[]): DecisionSerie | null {
  const { clave } = serieDeUnaTx(t);
  return decisiones.find((d) => d.anchor_tx_id === t.id)
    ?? decisiones.find((d) => d.clave === clave)
    ?? null;
}
