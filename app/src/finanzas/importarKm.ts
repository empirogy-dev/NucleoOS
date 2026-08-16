// Leer un reporte de kilómetros de una app que rastrea el auto.
//
// Está hecho contra MileIQ, que es la que ella paga, pero no le pide que sea
// MileIQ: se buscan las columnas por su nombre. Un reporte de otra app con
// columnas parecidas entra igual, y eso es lo que evita tener que escribir un
// lector nuevo cada vez.
//
// Lo que más importa aquí son las millas. MileIQ reporta en millas por
// defecto, y meter millas en un campo de kilómetros no da un error: da un
// número treinta y siete por ciento más bajo que el real, en silencio, en una
// cifra que después va a una declaración de impuestos.

export type Unidad = "km" | "mi";

const KM_POR_MILLA = 1.609344;

export interface ViajeLeido {
  date: string;
  km: number;
  destination: string | null;
  purpose: string | null;
  is_business: boolean;
  /** Lo que decía la columna de categoría, para poder mostrarlo. */
  categoria: string;
}

export interface LecturaReporte {
  /** Los viajes que se pueden importar. */
  viajes: ViajeLeido[];
  /** Qué unidad traía el archivo, y si se dedujo o vino escrita. */
  unidad: Unidad;
  unidadSegura: boolean;
  /** Filas que no se pudieron leer, con el motivo. Se muestran: un importador
   *  que descarta filas en silencio hace perder kilómetros sin avisar. */
  descartadas: Array<{ fila: number; motivo: string }>;
  desde: string | null;
  hasta: string | null;
}

export class ReporteIlegible extends Error {}

// ---------- Lo básico de un CSV ----------

function partirLinea(linea: string, sep: string): string[] {
  const valores: string[] = [];
  let actual = "";
  let entreComillas = false;
  for (let i = 0; i < linea.length; i += 1) {
    const c = linea[i];
    if (c === '"') {
      if (entreComillas && linea[i + 1] === '"') { actual += '"'; i += 1; }
      else entreComillas = !entreComillas;
      continue;
    }
    if (c === sep && !entreComillas) { valores.push(actual.trim()); actual = ""; continue; }
    actual += c;
  }
  valores.push(actual.trim());
  return valores;
}

const separadorDe = (linea: string): string =>
  [",", ";", "\t"].map((s) => ({ s, n: partirLinea(linea, s).length }))
    .sort((a, b) => b.n - a.n)[0].s;

const normal = (x: string): string =>
  x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim();

// ---------- Las columnas que hacen falta ----------

const COL_FECHA = ["start date", "date", "fecha", "trip date", "start"];
const COL_DISTANCIA = ["miles", "kilometers", "kilometres", "km", "distance", "distancia", "millas", "kilometros"];
const COL_CATEGORIA = ["category", "categoria", "purpose category", "type", "tipo"];
const COL_DESTINO = ["stop", "end", "to", "destination", "name of location", "destino", "hasta"];
const COL_MOTIVO = ["purpose", "notes", "note", "motivo", "proposito", "description"];

function buscar(cabeceras: string[], alias: string[]): number {
  const exacto = cabeceras.findIndex((h) => alias.includes(h));
  if (exacto !== -1) return exacto;
  // Parcial, pero solo si la cabecera CONTIENE el alias. Al revés ("date"
  // dentro de "d") emparejaba cualquier cosa con cualquier cosa.
  return cabeceras.findIndex((h) => alias.some((a) => h.includes(a)));
}

/** MileIQ pone dos o tres líneas de encabezado antes de la tabla. Se busca la
 *  primera línea que parezca cabeceras de verdad. */
function filaDeCabeceras(lineas: string[]): { indice: number; sep: string; cols: string[] } {
  let mejor: { indice: number; sep: string; cols: string[]; puntos: number } | null = null;
  for (let i = 0; i < Math.min(lineas.length, 15); i += 1) {
    const sep = separadorDe(lineas[i]);
    const cols = partirLinea(lineas[i], sep).map(normal);
    if (cols.length < 3) continue;
    const puntos = (buscar(cols, COL_FECHA) !== -1 ? 3 : 0)
      + (buscar(cols, COL_DISTANCIA) !== -1 ? 3 : 0)
      + (buscar(cols, COL_CATEGORIA) !== -1 ? 2 : 0);
    if (puntos >= 6 && (!mejor || puntos > mejor.puntos)) mejor = { indice: i, sep, cols, puntos };
  }
  if (!mejor) {
    throw new ReporteIlegible(
      "No encontré las columnas de fecha y distancia en este archivo. Exporta el reporte de viajes en CSV y súbelo tal cual, sin abrirlo ni guardarlo de nuevo.");
  }
  return mejor;
}

/** Las fechas de estos reportes vienen en formatos distintos según el país
 *  con el que se configuró la app. Se aceptan los que se pueden leer sin
 *  adivinar: el ISO, y el americano con mes primero, que es el de MileIQ. */
function leerFecha(crudo: string): string | null {
  const t = crudo.trim();
  if (!t) return null;

  const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  // 1/23/2026, 01/23/2026 10:35 AM, 1-23-2026
  const barras = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (barras) {
    const a = Number(barras[1]);
    const b = Number(barras[2]);
    // Si el primero no puede ser un mes, el archivo viene con el día primero.
    const [mes, dia] = a > 12 ? [b, a] : [a, b];
    if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
    return `${barras[3]}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
  }
  return null;
}

function leerNumero(crudo: string): number | null {
  const limpio = crudo.replace(/[^0-9,.-]/g, "").trim();
  if (!limpio) return null;
  // "1,234.5" es mil doscientos treinta y cuatro; "1.234,5" también, escrito
  // al revés. Se mira cuál de los dos signos va último.
  const ultimaComa = limpio.lastIndexOf(",");
  const ultimoPunto = limpio.lastIndexOf(".");
  let normalizado = limpio;
  if (ultimaComa > ultimoPunto) normalizado = limpio.replace(/\./g, "").replace(",", ".");
  else normalizado = limpio.replace(/,/g, "");
  const n = Number(normalizado);
  return Number.isFinite(n) ? n : null;
}

/** Las categorías que MileIQ considera de trabajo. "Unclassified" no lo es:
 *  son los viajes que ella todavía no ha decidido, y darlos por buenos sería
 *  inflarle la deducción sin preguntarle. */
const DE_TRABAJO = new Set([
  "business", "negocio", "trabajo", "work", "deductible",
]);

export function leerReporteKm(texto: string): LecturaReporte {
  const lineas = texto.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lineas.length < 2) throw new ReporteIlegible("El archivo está vacío.");

  const { indice, sep, cols } = filaDeCabeceras(lineas);
  const iFecha = buscar(cols, COL_FECHA);
  const iDist = buscar(cols, COL_DISTANCIA);
  const iCat = buscar(cols, COL_CATEGORIA);
  const iDestino = buscar(cols, COL_DESTINO);
  const iMotivo = buscar(cols, COL_MOTIVO);

  // La unidad sale del nombre de la columna, que es donde estas apps la
  // ponen. Si no lo dice, se asume millas y se avisa: MileIQ reporta en
  // millas por defecto y equivocarse hacia abajo es el error caro.
  const nombreDist = cols[iDist] ?? "";
  let unidad: Unidad = "mi";
  let unidadSegura = false;
  if (/kilometer|kilometre|kilometro|\bkm\b/.test(nombreDist)) { unidad = "km"; unidadSegura = true; }
  else if (/mile|milla/.test(nombreDist)) { unidad = "mi"; unidadSegura = true; }

  const viajes: ViajeLeido[] = [];
  const descartadas: Array<{ fila: number; motivo: string }> = [];

  for (let i = indice + 1; i < lineas.length; i += 1) {
    const v = partirLinea(lineas[i], sep);
    // Las filas de resumen del pie tienen menos columnas que la tabla.
    if (v.length < cols.length - 2) continue;

    const celdaFecha = v[iFecha] ?? "";
    // Las filas de resumen del final dicen "Total" donde va la fecha. Una
    // fecha siempre tiene números, así que si no los tiene esto no es un
    // viaje mal escrito, es el pie del reporte, y se salta sin ruido.
    if (!/\d/.test(celdaFecha)) continue;

    const fecha = leerFecha(celdaFecha);
    if (!fecha) {
      descartadas.push({ fila: i + 1, motivo: "no pude leer la fecha" });
      continue;
    }
    const dist = leerNumero(v[iDist] ?? "");
    if (dist === null || dist <= 0) {
      descartadas.push({ fila: i + 1, motivo: "sin distancia" });
      continue;
    }

    const cat = (v[iCat] ?? "").trim();
    viajes.push({
      date: fecha,
      km: unidad === "mi" ? dist * KM_POR_MILLA : dist,
      destination: iDestino !== -1 ? (v[iDestino] || "").trim() || null : null,
      purpose: iMotivo !== -1 ? (v[iMotivo] || "").trim() || null : null,
      is_business: DE_TRABAJO.has(normal(cat)),
      categoria: cat || "—",
    });
  }

  if (viajes.length === 0) {
    throw new ReporteIlegible("Encontré las columnas pero ninguna fila con fecha y distancia.");
  }

  const fechas = viajes.map((v) => v.date).sort();
  return {
    viajes,
    unidad,
    unidadSegura,
    descartadas,
    desde: fechas[0],
    hasta: fechas[fechas.length - 1],
  };
}

/**
 * Corregir a mano la unidad con la que se leyó el archivo.
 *
 * Ojo con la dirección, que es al revés de lo que parece. Los kilómetros de
 * `ViajeLeido` YA están en kilómetros: si el archivo venía en millas, la
 * conversión ya se hizo al leerlo. Así que decir "en realidad era km" no es
 * convertir de millas a kilómetros, es DESHACER esa conversión y quedarse con
 * el número tal como venía.
 *
 * Escrito al derecho, el conmutador multiplicaba en vez de dividir y los
 * kilómetros salían un sesenta por ciento más altos, sin ningún error visible.
 */
export function reinterpretarUnidad(
  viajes: ViajeLeido[], parseadaComo: Unidad, elegida: Unidad,
): ViajeLeido[] {
  if (parseadaComo === elegida) return viajes;
  const factor = elegida === "km" ? 1 / KM_POR_MILLA : KM_POR_MILLA;
  return viajes.map((v) => ({ ...v, km: v.km * factor }));
}

export interface ResumenImportacion {
  negocio: { cuantos: number; km: number };
  personales: { cuantos: number; km: number };
  /** Las categorías que trae el archivo con cuántos viajes tiene cada una.
   *  Sirve para que se vea qué quedó como personal y por qué. */
  porCategoria: Array<{ categoria: string; cuantos: number; km: number; negocio: boolean }>;
}

export function resumirImportacion(viajes: ViajeLeido[]): ResumenImportacion {
  const mapa = new Map<string, { categoria: string; cuantos: number; km: number; negocio: boolean }>();
  for (const v of viajes) {
    const x = mapa.get(v.categoria) ?? { categoria: v.categoria, cuantos: 0, km: 0, negocio: v.is_business };
    x.cuantos += 1;
    x.km += v.km;
    mapa.set(v.categoria, x);
  }
  const negocio = viajes.filter((v) => v.is_business);
  const personales = viajes.filter((v) => !v.is_business);
  return {
    negocio: { cuantos: negocio.length, km: negocio.reduce((s, v) => s + v.km, 0) },
    personales: { cuantos: personales.length, km: personales.reduce((s, v) => s + v.km, 0) },
    porCategoria: [...mapa.values()].sort((a, b) => b.km - a.km),
  };
}

/** Los que ya están guardados no se vuelven a meter.
 *
 *  Importar el mismo reporte dos veces es lo más fácil del mundo, y duplicar
 *  kilómetros de trabajo infla una deducción. Se comparan por día y distancia
 *  redondeada, que es lo que se repite exacto entre dos exportaciones. */
export function quitarRepetidos(
  nuevos: ViajeLeido[],
  yaGuardados: Array<{ date: string; km: number }>,
): { aImportar: ViajeLeido[]; repetidos: number } {
  const firma = (d: string, km: number) => `${d}|${km.toFixed(1)}`;
  const vistos = new Set(yaGuardados.map((v) => firma(v.date, Number(v.km))));
  const aImportar: ViajeLeido[] = [];
  let repetidos = 0;
  for (const v of nuevos) {
    const f = firma(v.date, v.km);
    if (vistos.has(f)) { repetidos += 1; continue; }
    vistos.add(f);
    aImportar.push(v);
  }
  return { aImportar, repetidos };
}
