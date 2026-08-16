import { supabase } from "../lib/supabase";

// El auto y su bitácora.
//
// Lo que se deduce de un auto no es lo que costó, es la parte de sus gastos
// que corresponde al trabajo. Y esa parte se mide en kilómetros: los del
// negocio divididos por los del año. Este archivo hace esa división y nada
// más; qué gastos entran en el cálculo lo decide la línea de impuestos que
// ella le puso a cada categoría.

export interface Vehiculo {
  id: string;
  name: string;
  plate: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  currency: string;
  notes: string | null;
}

export interface Lectura {
  id: string;
  vehicle_id: string;
  date: string;
  km: number;
  note: string | null;
}

export interface Viaje {
  id: string;
  vehicle_id: string;
  date: string;
  km: number;
  destination: string | null;
  purpose: string | null;
}

// ---------- El cálculo ----------

export type EstadoUso =
  | "listo"
  | "faltanLecturas"   // menos de dos lecturas del odómetro
  | "sinViajes"        // hay lecturas pero ningún viaje de trabajo
  | "incoherente";     // los viajes suman más que el odómetro

export interface UsoDelAuto {
  estado: EstadoUso;
  anio: string;
  /** Kilómetros del año, según el odómetro. */
  kmTotales: number;
  /** Kilómetros de trabajo, según la bitácora. */
  kmNegocio: number;
  /** El porcentaje que se usa para deducir. Cero si todavía no se puede. */
  porcentaje: number;
  viajes: number;
  lecturaInicio: Lectura | null;
  lecturaFin: Lectura | null;
}

/**
 * Qué parte del auto fue de trabajo en un año.
 *
 * Los kilómetros totales salen del odómetro y NO de sumar viajes: la bitácora
 * solo registra los de trabajo, porque anotar cada ida al supermercado es lo
 * que hace que una bitácora se abandone a la semana. Los personales salen por
 * resta, que es además como se revisa.
 *
 * Hace falta una lectura al empezar y otra al terminar. Con una sola no hay
 * recorrido que medir, y el porcentaje se queda sin calcular en vez de
 * inventarse: un número inventado aquí es una deducción que no se sostiene.
 */
export function usoDelAuto(anio: string, lecturas: Lectura[], viajes: Viaje[]): UsoDelAuto {
  const finDeAnio = `${anio}-12-31`;
  const ordenadas = [...lecturas]
    .filter((l) => l.date <= finDeAnio)
    .sort((a, b) => a.date.localeCompare(b.date));

  // El punto de partida: la última lectura anterior al año, y si no hay
  // ninguna, la primera del año. Lo segundo es el caso de un auto comprado a
  // mitad de año, que es justamente cuando esto se empieza a llevar.
  const previas = ordenadas.filter((l) => l.date < `${anio}-01-01`);
  const delAnio = ordenadas.filter((l) => l.date.startsWith(anio));
  const lecturaInicio = previas[previas.length - 1] ?? delAnio[0] ?? null;
  const lecturaFin = delAnio[delAnio.length - 1] ?? null;

  const suyos = viajes.filter((v) => v.date.startsWith(anio));
  const kmNegocio = suyos.reduce((s, v) => s + Number(v.km), 0);

  const base = {
    anio,
    kmNegocio,
    viajes: suyos.length,
    lecturaInicio,
    lecturaFin,
  };

  if (!lecturaInicio || !lecturaFin || lecturaInicio.id === lecturaFin.id) {
    return { ...base, estado: "faltanLecturas", kmTotales: 0, porcentaje: 0 };
  }

  const kmTotales = Number(lecturaFin.km) - Number(lecturaInicio.km);
  if (kmTotales <= 0) {
    return { ...base, estado: "faltanLecturas", kmTotales: 0, porcentaje: 0 };
  }
  if (kmNegocio === 0) {
    return { ...base, estado: "sinViajes", kmTotales, porcentaje: 0 };
  }
  // Más kilómetros de trabajo que kilómetros recorridos es imposible, así que
  // algo está mal anotado. Se dice en vez de devolver un 130 por ciento.
  if (kmNegocio > kmTotales) {
    return { ...base, estado: "incoherente", kmTotales, porcentaje: 0 };
  }

  return {
    ...base,
    estado: "listo",
    kmTotales,
    porcentaje: Math.round((kmNegocio / kmTotales) * 100),
  };
}

// ---------- Guardar y leer ----------

function sb() {
  if (!supabase) throw new Error("Supabase no está configurado.");
  return supabase;
}

async function uid(): Promise<string> {
  const { data } = await sb().auth.getUser();
  if (!data.user) throw new Error("Sin sesión.");
  return data.user.id;
}

/** Cuando falta la migración, la pestaña lo dice en vez de fallar callado. */
export class FaltaMigracionAuto extends Error {
  constructor() {
    super("Falta la migración 0071 en Supabase (supabase/migrations/0071_auto_y_kilometraje.sql).");
    this.name = "FaltaMigracionAuto";
  }
}

function revisar(error: { code?: string; message: string } | null) {
  if (!error) return;
  if (error.code === "42P01" || error.code === "PGRST205"
    || /does not exist|could not find the table/i.test(error.message)) {
    throw new FaltaMigracionAuto();
  }
  throw new Error(error.message);
}

export async function listarVehiculos(): Promise<Vehiculo[]> {
  const { data, error } = await sb()
    .from("vehicles")
    .select("id,name,plate,purchase_date,purchase_price,currency,notes")
    .order("created_at");
  revisar(error);
  return (data ?? []) as Vehiculo[];
}

export async function guardarVehiculo(
  v: Omit<Vehiculo, "id">, id?: string,
): Promise<void> {
  if (!v.name.trim()) throw new Error("El auto necesita un nombre.");
  if (id) {
    const { error } = await sb().from("vehicles").update(v).eq("id", id);
    revisar(error);
    return;
  }
  const { error } = await sb().from("vehicles").insert({ ...v, user_id: await uid() });
  revisar(error);
}

export async function borrarVehiculo(id: string): Promise<void> {
  // Las lecturas y los viajes caen solos por el on delete cascade.
  const { error } = await sb().from("vehicles").delete().eq("id", id);
  revisar(error);
}

export async function listarLecturas(vehicleId: string): Promise<Lectura[]> {
  const { data, error } = await sb()
    .from("vehicle_odometer")
    .select("id,vehicle_id,date,km,note")
    .eq("vehicle_id", vehicleId)
    .order("date");
  revisar(error);
  return (data ?? []) as Lectura[];
}

export async function guardarLectura(
  vehicleId: string, date: string, km: number, note: string | null,
): Promise<void> {
  const { error } = await sb().from("vehicle_odometer").upsert(
    { user_id: await uid(), vehicle_id: vehicleId, date, km, note },
    { onConflict: "vehicle_id,date" },
  );
  revisar(error);
}

export async function borrarLectura(id: string): Promise<void> {
  const { error } = await sb().from("vehicle_odometer").delete().eq("id", id);
  revisar(error);
}

export async function listarViajes(vehicleId: string): Promise<Viaje[]> {
  const { data, error } = await sb()
    .from("vehicle_trips")
    .select("id,vehicle_id,date,km,destination,purpose")
    .eq("vehicle_id", vehicleId)
    .order("date", { ascending: false });
  revisar(error);
  return (data ?? []) as Viaje[];
}

export async function guardarViaje(
  v: { vehicle_id: string; date: string; km: number; destination: string | null; purpose: string | null },
  id?: string,
): Promise<void> {
  if (!(v.km > 0)) throw new Error("El viaje necesita cuántos kilómetros fueron.");
  if (id) {
    const { error } = await sb().from("vehicle_trips").update(v).eq("id", id);
    revisar(error);
    return;
  }
  const { error } = await sb().from("vehicle_trips").insert({ ...v, user_id: await uid() });
  revisar(error);
}

export async function borrarViaje(id: string): Promise<void> {
  const { error } = await sb().from("vehicle_trips").delete().eq("id", id);
  revisar(error);
}

/** Exportar la bitácora del año, que es lo que se muestra si la piden. */
export function bitacoraCSV(auto: Vehiculo, uso: UsoDelAuto, viajes: Viaje[]): string {
  const esc = (x: unknown) => `"${String(x ?? "").replace(/"/g, '""')}"`;
  const suyos = viajes.filter((v) => v.date.startsWith(uso.anio))
    .sort((a, b) => a.date.localeCompare(b.date));
  const filas: string[][] = suyos.map((v) => [
    v.date, String(v.km), v.destination ?? "", v.purpose ?? "",
  ]);
  const pie: string[][] = [
    [], ["", "", "", ""],
    ["Business km", String(uso.kmNegocio), "", ""],
    ["Total km", String(uso.kmTotales), "", ""],
    ["Business use %", String(uso.porcentaje), "", ""],
    ["Odometer start", uso.lecturaInicio ? `${uso.lecturaInicio.date} = ${uso.lecturaInicio.km}` : "", "", ""],
    ["Odometer end", uso.lecturaFin ? `${uso.lecturaFin.date} = ${uso.lecturaFin.km}` : "", "", ""],
    ["Vehicle", auto.name + (auto.plate ? ` (${auto.plate})` : ""), "", ""],
  ];
  const cab = ["Date", "Km", "Destination", "Purpose"];
  return "﻿" + [cab, ...filas, ...pie]
    .map((f) => f.map(esc).join(",")).join("\r\n");
}
