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
  /** Los personales solo existen cuando vienen importados de una app que
   *  rastrea el auto sola (0072). A mano nadie los anota, y no hace falta. */
  is_business: boolean;
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
  /** Kilómetros del año. Salen del odómetro, o de sumar todos los viajes
   *  cuando la bitácora también trae los personales. */
  kmTotales: number;
  /** De dónde salieron los totales, porque no es lo mismo y hay que decirlo. */
  fuenteTotales: "odometro" | "bitacora" | "ninguna";
  /** Kilómetros de trabajo, según la bitácora. */
  kmNegocio: number;
  /** El porcentaje que se usa para deducir. Cero si todavía no se puede. */
  porcentaje: number;
  viajes: number;
  /** Todo lo que suma la bitácora del año, de trabajo y personal. Sirve para
   *  contrastarla con el odómetro: la diferencia son kilómetros que el auto
   *  anduvo y la app no registró, y esos cuentan como personales. */
  kmBitacora: number;
  /** Cuántos viajes personales hay registrados, que es lo que distingue una
   *  bitácora importada de una escrita a mano. */
  viajesPersonales: number;
  lecturaInicio: Lectura | null;
  lecturaFin: Lectura | null;
}

/**
 * Qué parte del auto fue de trabajo en un año.
 *
 * Los kilómetros totales salen del odómetro: una lectura al empezar y otra al
 * terminar. La bitácora escrita a mano solo registra los viajes de trabajo,
 * porque anotar cada ida al supermercado es lo que hace que se abandone, así
 * que los personales salen por resta.
 *
 * La excepción es una bitácora importada de una app que rastrea el auto sola:
 * ahí los personales vienen incluidos y su suma ES el recorrido del año, sin
 * necesidad de mirar el tablero.
 *
 * Cuando no hay ninguna de las dos cosas el porcentaje se queda sin calcular
 * en vez de inventarse: un número inventado aquí es una deducción que no se
 * sostiene.
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
  const kmNegocio = suyos
    .filter((v) => v.is_business !== false)
    .reduce((s, v) => s + Number(v.km), 0);
  // Si la bitácora trae también los viajes personales, la suma de todos ES el
  // recorrido del año y no hace falta el odómetro. Es lo que pasa cuando los
  // viajes vienen importados de una app que rastrea el auto sola.
  const hayPersonales = suyos.some((v) => v.is_business === false);
  const kmDeLaBitacora = suyos.reduce((s, v) => s + Number(v.km), 0);

  const base = {
    anio,
    kmNegocio,
    viajes: suyos.filter((v) => v.is_business !== false).length,
    viajesPersonales: suyos.filter((v) => v.is_business === false).length,
    kmBitacora: kmDeLaBitacora,
    lecturaInicio,
    lecturaFin,
  };

  // El odómetro manda cuando está: es la prueba de cuánto anduvo el auto de
  // verdad, incluidos los viajes que ninguna app alcanzó a registrar.
  const conOdometro = lecturaInicio && lecturaFin && lecturaInicio.id !== lecturaFin.id
    ? Number(lecturaFin.km) - Number(lecturaInicio.km)
    : 0;

  let kmTotales = 0;
  let fuenteTotales: UsoDelAuto["fuenteTotales"] = "ninguna";
  if (conOdometro > 0) { kmTotales = conOdometro; fuenteTotales = "odometro"; }
  else if (hayPersonales && kmDeLaBitacora > 0) { kmTotales = kmDeLaBitacora; fuenteTotales = "bitacora"; }

  if (fuenteTotales === "ninguna") {
    return { ...base, estado: "faltanLecturas", kmTotales: 0, porcentaje: 0, fuenteTotales };
  }
  if (kmNegocio === 0) {
    return { ...base, estado: "sinViajes", kmTotales, porcentaje: 0, fuenteTotales };
  }
  // Más kilómetros de trabajo que kilómetros recorridos es imposible, así que
  // algo está mal anotado. Se dice en vez de devolver un 130 por ciento.
  // Un punto de redondeo de margen: sumar cien viajes en coma flotante puede
  // dar un pelo más que el propio total del que salieron.
  if (kmNegocio > kmTotales + 0.01) {
    return { ...base, estado: "incoherente", kmTotales, porcentaje: 0, fuenteTotales };
  }

  return {
    ...base,
    estado: "listo",
    kmTotales,
    fuenteTotales,
    porcentaje: Math.min(100, Math.round((kmNegocio / kmTotales) * 100)),
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
    .select("id,vehicle_id,date,km,destination,purpose,is_business")
    .eq("vehicle_id", vehicleId)
    .order("date", { ascending: false });
  if (!error) return (data ?? []) as Viaje[];
  // Sin la 0072 no existe is_business: se lee sin esa columna y todos los
  // viajes cuentan como de trabajo, que es lo que eran antes de importar.
  if (/is_business/.test(error.message)) {
    const sinColumna = await sb()
      .from("vehicle_trips")
      .select("id,vehicle_id,date,km,destination,purpose")
      .eq("vehicle_id", vehicleId)
      .order("date", { ascending: false });
    revisar(sinColumna.error);
    return (sinColumna.data ?? []).map((v) => ({ ...v, is_business: true })) as Viaje[];
  }
  revisar(error);
  return [];
}

export async function guardarViaje(
  v: { vehicle_id: string; date: string; km: number; destination: string | null;
       purpose: string | null; is_business?: boolean },
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

/** Guardar muchos viajes de una vez, que es como llegan de una importación.
 *
 *  En tandas: mandar mil filas en una sola llamada es lo que hace que una
 *  importación falle entera por el peso y no por los datos. */
export async function guardarViajes(
  vehicleId: string,
  viajes: Array<{ date: string; km: number; destination: string | null; purpose: string | null; is_business: boolean }>,
): Promise<number> {
  const user_id = await uid();
  let guardados = 0;
  for (let i = 0; i < viajes.length; i += 200) {
    const tanda = viajes.slice(i, i + 200).map((v) => ({ ...v, vehicle_id: vehicleId, user_id }));
    const { error } = await sb().from("vehicle_trips").insert(tanda);
    revisar(error);
    guardados += tanda.length;
  }
  return guardados;
}

/** Borrar todos los viajes personales de un año. Sirve para volver atrás una
 *  importación sin perder la bitácora escrita a mano. */
export async function borrarPersonalesDelAnio(vehicleId: string, anio: string): Promise<void> {
  const { error } = await sb().from("vehicle_trips").delete()
    .eq("vehicle_id", vehicleId).eq("is_business", false)
    .gte("date", `${anio}-01-01`).lte("date", `${anio}-12-31`);
  revisar(error);
}
