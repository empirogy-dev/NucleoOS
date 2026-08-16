import { supabase } from "../lib/supabase";
import { claveComercio, type Serie } from "./recurrentes";
import type { Tx } from "./types";

// Lo que la persona decidió sobre una serie de cargos (migración 0068).
//
// La serie en sí se calcula desde los movimientos. Aquí solo vive lo que la
// app no puede saber sola: que esos doce cargos iguales son una compra en
// cuotas, que aquello no es una suscripción, o cómo se llama de verdad.

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

function sb() {
  if (!supabase) throw new Error("Supabase no está configurado.");
  return supabase;
}

async function uid(): Promise<string> {
  const { data } = await sb().auth.getUser();
  if (!data.user) throw new Error("Sin sesión.");
  return data.user.id;
}

const COLUMNAS = "id,clave,anchor_tx_id,kind,name,installments_total,tx_ids";

/** Todas las decisiones guardadas.
 *
 *  Sin la migración 0068 la tabla no existe todavía: la pestaña sigue
 *  funcionando y muestra las suscripciones detectadas, solo que no se puede
 *  marcar nada. Se prefiere eso a que la página entera se caiga.
 */
export async function listarDecisiones(): Promise<DecisionSerie[]> {
  const { data, error } = await sb().from("recurring_series").select(COLUMNAS);
  if (!error) return (data ?? []) as DecisionSerie[];
  // Con la 0068 corrida pero no la 0069, pedir tx_ids falla y se perdería
  // TODO lo ya marcado. Se vuelve a pedir sin esa columna: lo que hay sigue
  // funcionando y lo único que falta es poder separar cargos a mano.
  const reintento = await sb().from("recurring_series").select(COLUMNAS.replace(",tx_ids", ""));
  if (reintento.error) return [];
  const filas = (reintento.data ?? []) as unknown as Array<Omit<DecisionSerie, "tx_ids">>;
  return filas.map((d) => ({ ...d, tx_ids: null }));
}

/** ¿Está la tabla creada? Para poder decirlo en pantalla en vez de fallar
 *  callado cuando alguien intenta marcar una serie. */
export async function hayTablaSeries(): Promise<boolean> {
  const { error } = await sb().from("recurring_series").select("id").limit(1);
  return !error;
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

export async function guardarDecision(
  s: { clave: string; anclaId: string },
  cambios: { kind?: TipoSerie; name?: string | null; installments_total?: number | null; tx_ids?: string[] | null },
  existente: DecisionSerie | null,
): Promise<void> {
  if (cambios.kind === "installments" && !cambios.installments_total) {
    throw new Error("Falta decir cuántas cuotas son en total.");
  }
  // tx_ids solo viaja si de verdad se está usando. Mandarlo siempre haría
  // fallar el guardado entero en quien todavía no corrió la 0069, y por una
  // columna que en la mayoría de los casos va vacía.
  const conTxIds = <T extends object>(fila: T) =>
    (cambios.tx_ids && cambios.tx_ids.length ? { ...fila, tx_ids: cambios.tx_ids } : fila);

  if (existente) {
    const { tx_ids: _fuera, ...resto } = cambios;
    const { error } = await sb()
      .from("recurring_series")
      .update(conTxIds({ ...resto, updated_at: new Date().toISOString() }))
      .eq("id", existente.id);
    if (error) throw new Error(error.message);
    return;
  }
  const { error } = await sb().from("recurring_series").insert(conTxIds({
    user_id: await uid(),
    clave: s.clave,
    anchor_tx_id: s.anclaId,
    kind: cambios.kind ?? "subscription",
    name: cambios.name ?? null,
    installments_total: cambios.installments_total ?? null,
  }));
  if (error) throw new Error(error.message);
}

/** Volver a dejarla como una suscripción normal, sin nada marcado. */
export async function olvidarDecision(d: DecisionSerie): Promise<void> {
  const { error } = await sb().from("recurring_series").delete().eq("id", d.id);
  if (error) throw new Error(error.message);
}
