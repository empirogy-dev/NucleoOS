import { supabase } from "../lib/supabase";
import type { DecisionSerie, TipoSerie } from "./decisiones";

// Lo que la persona decidió sobre una serie de cargos (migración 0068).
//
// La serie en sí se calcula desde los movimientos. Aquí solo vive lo que la
// app no puede saber sola: que esos doce cargos iguales son una compra en
// cuotas, que aquello no es una suscripción, o cómo se llama de verdad.

// Lo que no toca la base vive en `decisiones.ts` y se vuelve a exportar aquí,
// para que quien ya importaba desde este archivo no tenga que cambiar nada.
export type { DecisionSerie, TipoSerie, Anclaje } from "./decisiones";
export { decisionDe, decisionDeTx, serieDeUnaTx } from "./decisiones";

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
