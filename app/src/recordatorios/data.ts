import { supabase } from "../lib/supabase";

// Recordatorios con hora (migración 0052): la misma tabla que usa el bot
// de Telegram. Lo que creas aquí te lo escribe el bot a esa hora, y lo
// que le pides al bot aparece aquí. Un solo lugar, dos alarmas.

export interface Recordatorio {
  id: string;
  texto: string;
  hora: string;              // "14:00", en tu zona
  repite: "diario" | "unico";
  fecha: string | null;      // solo si repite = unico
  activo: boolean;
  /** true: el coach te lo pregunta y registra tu respuesta.
   *  false: solo te avisa. Así cada quien arma sus propios check-ins. */
  pregunta?: boolean;
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

export class RecordatoriosFaltanError extends Error {}

function check(error: { code?: string; message: string } | null) {
  if (!error) return;
  if (error.code === "42P01" || error.code === "PGRST205" || /does not exist|could not find the table/i.test(error.message)) {
    throw new RecordatoriosFaltanError(error.message);
  }
  throw new Error(error.message);
}

export async function listRecordatorios(): Promise<Recordatorio[]> {
  const con = await sb().from("wa_recordatorios")
    .select("id,texto,hora,repite,fecha,activo,pregunta")
    .eq("activo", true)
    .order("hora");
  // Sin la 0056 todavía: leemos sin el campo pregunta.
  if (con.error && /pregunta/i.test(con.error.message)) {
    const sin = await sb().from("wa_recordatorios")
      .select("id,texto,hora,repite,fecha,activo")
      .eq("activo", true)
      .order("hora");
    check(sin.error);
    return (sin.data ?? []) as Recordatorio[];
  }
  check(con.error);
  return (con.data ?? []) as Recordatorio[];
}

export async function addRecordatorio(
  texto: string,
  hora: string,
  repite: "diario" | "unico",
  fechaHoy: string,
  pregunta = false,
): Promise<void> {
  const fila: Record<string, unknown> = {
    user_id: await uid(),
    texto: texto.slice(0, 200),
    hora,
    repite,
    fecha: repite === "unico" ? fechaHoy : null,
  };
  if (pregunta) fila.pregunta = true;
  let { error } = await sb().from("wa_recordatorios").insert(fila);
  if (error && /pregunta/i.test(error.message)) {
    delete fila.pregunta;
    ({ error } = await sb().from("wa_recordatorios").insert(fila));
  }
  check(error);
}

export async function apagarRecordatorio(id: string): Promise<void> {
  const { error } = await sb().from("wa_recordatorios").update({ activo: false }).eq("id", id);
  check(error);
}
