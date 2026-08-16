import { supabase } from "../lib/supabase";
import type { Serie } from "./recurrentes";

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

const COLUMNAS = "id,clave,anchor_tx_id,kind,name,installments_total";

/** Todas las decisiones guardadas.
 *
 *  Sin la migración 0068 la tabla no existe todavía: la pestaña sigue
 *  funcionando y muestra las suscripciones detectadas, solo que no se puede
 *  marcar nada. Se prefiere eso a que la página entera se caiga.
 */
export async function listarDecisiones(): Promise<DecisionSerie[]> {
  const { data, error } = await sb().from("recurring_series").select(COLUMNAS);
  if (error) return [];
  return (data ?? []) as DecisionSerie[];
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

export async function guardarDecision(
  s: Serie,
  cambios: { kind?: TipoSerie; name?: string | null; installments_total?: number | null },
  existente: DecisionSerie | null,
): Promise<void> {
  if (cambios.kind === "installments" && !cambios.installments_total) {
    throw new Error("Falta decir cuántas cuotas son en total.");
  }
  if (existente) {
    const { error } = await sb()
      .from("recurring_series")
      .update({ ...cambios, updated_at: new Date().toISOString() })
      .eq("id", existente.id);
    if (error) throw new Error(error.message);
    return;
  }
  const { error } = await sb().from("recurring_series").insert({
    user_id: await uid(),
    clave: s.clave,
    anchor_tx_id: s.anclaId,
    kind: cambios.kind ?? "subscription",
    name: cambios.name ?? null,
    installments_total: cambios.installments_total ?? null,
  });
  if (error) throw new Error(error.message);
}

/** Volver a dejarla como una suscripción normal, sin nada marcado. */
export async function olvidarDecision(d: DecisionSerie): Promise<void> {
  const { error } = await sb().from("recurring_series").delete().eq("id", d.id);
  if (error) throw new Error(error.message);
}
