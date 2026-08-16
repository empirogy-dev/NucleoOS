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

// ---------- De un archivo a una grilla de texto ----------
//
// Todo lo de más abajo trabaja sobre una grilla de celdas, no sobre líneas de
// texto. Así el mismo reconocimiento de columnas sirve para un CSV, para un
// Excel y para una tabla HTML, que son las tres cosas distintas que una app
// puede estar llamando "exportar a XLS".

/** Parte un CSV entero, no línea por línea.
 *
 *  Una celda entre comillas puede traer un salto de línea adentro, y un motivo
 *  de viaje escrito en dos renglones parte la tabla en dos si primero se corta
 *  por saltos de línea y después por comas. */
function grillaDeTexto(texto: string, sep: string): string[][] {
  const filas: string[][] = [];
  let fila: string[] = [];
  let actual = "";
  let entreComillas = false;

  const cerrarCelda = () => { fila.push(actual.trim()); actual = ""; };
  const cerrarFila = () => { cerrarCelda(); filas.push(fila); fila = []; };

  for (let i = 0; i < texto.length; i += 1) {
    const c = texto[i];
    if (c === '"') {
      if (entreComillas && texto[i + 1] === '"') { actual += '"'; i += 1; }
      else entreComillas = !entreComillas;
      continue;
    }
    if (!entreComillas) {
      if (c === sep) { cerrarCelda(); continue; }
      if (c === "\n") { cerrarFila(); continue; }
      if (c === "\r") continue;
    }
    actual += c;
  }
  if (actual !== "" || fila.length > 0) cerrarFila();
  return filas.filter((f) => f.some((celda) => celda !== ""));
}

/** El separador que produce más columnas. Se decide una vez para todo el
 *  archivo: decidirlo línea por línea hacía que una fila con un punto y coma
 *  dentro de un comentario se partiera distinto que las demás. */
function separadorDe(texto: string): string {
  const muestra = texto.split(/\r?\n/).slice(0, 15).join("\n");
  return [",", ";", "\t"]
    .map((sep) => {
      const g = grillaDeTexto(muestra, sep);
      return { sep, n: Math.max(0, ...g.map((f) => f.length)) };
    })
    .sort((a, b) => b.n - a.n)[0].sep;
}

/** Algunas apps llaman "XLS" a una tabla HTML con otra extensión. */
function grillaDeHtml(texto: string): string[][] {
  const doc = new DOMParser().parseFromString(texto, "text/html");
  const tabla = [...doc.querySelectorAll("table")]
    .sort((a, b) => b.rows.length - a.rows.length)[0];
  if (!tabla) throw new ReporteIlegible("Ese archivo no trae ninguna tabla que pueda leer.");
  return [...tabla.rows]
    .map((r) => [...r.cells].map((c) => (c.textContent ?? "").replace(/\s+/g, " ").trim()))
    .filter((f) => f.some((celda) => celda !== ""));
}

const normal = (x: string): string =>
  x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim();

// ---------- Las columnas que hacen falta ----------

const COL_FECHA = ["start date", "date", "fecha", "trip date", "start"];
const COL_DISTANCIA = ["miles", "kilometers", "kilometres", "km", "distance", "distancia", "millas", "kilometros"];
const COL_CATEGORIA = ["category", "categoria", "purpose category", "type", "tipo"];
// "end" a secas no: emparejaba con "End Time" antes que con "End Location",
// y el destino salía siendo una hora.
const COL_DESTINO = ["end location", "stop location", "stop", "destination", "name of location", "destino"];
const COL_MOTIVO = ["purpose", "notes", "note", "motivo", "proposito", "description"];

function buscar(cabeceras: string[], alias: string[]): number {
  const exacto = cabeceras.findIndex((h) => alias.includes(h));
  if (exacto !== -1) return exacto;
  // Parcial, pero solo si la cabecera CONTIENE el alias. Al revés ("date"
  // dentro de "d") emparejaba cualquier cosa con cualquier cosa.
  return cabeceras.findIndex((h) => alias.some((a) => h.includes(a)));
}

/** MileIQ pone dos o tres filas de encabezado antes de la tabla, así que las
 *  cabeceras no están en la primera. Se busca la fila que más se parezca. */
function filaDeCabeceras(filas: string[][]): { indice: number; cols: string[] } {
  let mejor: { indice: number; cols: string[]; puntos: number } | null = null;
  // Hasta cuarenta filas hacia abajo: el reporte de MileIQ trae un resumen
  // completo arriba y la tabla no empieza hasta la fila diecinueve.
  for (let i = 0; i < Math.min(filas.length, 40); i += 1) {
    const cols = filas[i].map(normal);
    if (cols.length < 3) continue;
    const puntos = (buscar(cols, COL_FECHA) !== -1 ? 3 : 0)
      + (buscar(cols, COL_DISTANCIA) !== -1 ? 3 : 0)
      + (buscar(cols, COL_CATEGORIA) !== -1 ? 2 : 0);
    if (puntos >= 6 && (!mejor || puntos > mejor.puntos)) mejor = { indice: i, cols, puntos };
  }
  if (!mejor) {
    throw new ReporteIlegible(
      "No encontré las columnas de fecha y distancia. Asegúrate de haber exportado el reporte de viajes y no un resumen.");
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

/** El corazón: una grilla de celdas convertida en viajes. */
export function leerReporteGrilla(filas: string[][]): LecturaReporte {
  if (filas.length < 2) throw new ReporteIlegible("El archivo está vacío.");

  const { indice, cols } = filaDeCabeceras(filas);
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

  for (let i = indice + 1; i < filas.length; i += 1) {
    const v = filas[i];
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

/** Un reporte en texto: separado por comas, punto y coma o tabulaciones. */
export function leerReporteKm(texto: string): LecturaReporte {
  const limpio = texto.replace(/^﻿/, "");
  return leerReporteGrilla(grillaDeTexto(limpio, separadorDe(limpio)));
}

// ---------- Qué es realmente este archivo ----------
//
// "Exportar a XLS" significa cosas distintas según la app: un Excel de verdad,
// una tabla HTML con la extensión cambiada, o texto separado por tabulaciones.
// Y a veces es un .xls de los antiguos, que es un formato binario que no se
// puede leer sin arrastrar una librería entera.
//
// Se mira el contenido y no la extensión, porque la extensión miente.

const empiezaCon = (b: Uint8Array, bytes: number[]) => bytes.every((x, i) => b[i] === x);

export async function leerArchivoKm(
  file: File,
  leerExcel: (f: File) => Promise<string[][]>,
  leerExcelAntiguo: (f: File) => Promise<string[][]>,
): Promise<LecturaReporte> {
  const cabeza = new Uint8Array(await file.slice(0, 8).arrayBuffer());

  // %PDF
  if (empiezaCon(cabeza, [0x25, 0x50, 0x44, 0x46])) {
    throw new ReporteIlegible(
      "Esto es un PDF, y de un PDF no puedo sacar los números con la exactitud que hace falta para una declaración. En tu app de kilómetros elige exportar en Excel.");
  }

  // Un .xls de los anteriores a 2007: otro formato completamente distinto.
  if (empiezaCon(cabeza, [0xd0, 0xcf, 0x11, 0xe0])) {
    return leerReporteGrilla(await leerExcelAntiguo(file));
  }

  // Todo .xlsx es un ZIP, y todo ZIP empieza con PK.
  if (empiezaCon(cabeza, [0x50, 0x4b])) {
    return leerReporteGrilla(await leerExcel(file));
  }

  const texto = (await file.text()).replace(/^﻿/, "");
  if (/^\s*(<!doctype html|<html|<table)/i.test(texto)) {
    return leerReporteGrilla(grillaDeHtml(texto));
  }
  return leerReporteKm(texto);
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

  // Se cuenta cuántos hay de cada firma, no si la firma existe.
  //
  // Dos viajes del mismo día por la misma distancia son la ida y la vuelta, y
  // son dos viajes de verdad. Con un conjunto de firmas, el segundo se perdía
  // como si fuera un duplicado: en el reporte real de MileIQ eso borraba cien
  // viajes de cuatrocientos dieciséis, sin decir nada.
  const cuantos = new Map<string, number>();
  for (const v of yaGuardados) {
    const f = firma(v.date, Number(v.km));
    cuantos.set(f, (cuantos.get(f) ?? 0) + 1);
  }

  const aImportar: ViajeLeido[] = [];
  let repetidos = 0;
  for (const v of nuevos) {
    const f = firma(v.date, v.km);
    const quedan = cuantos.get(f) ?? 0;
    if (quedan > 0) { cuantos.set(f, quedan - 1); repetidos += 1; continue; }
    aImportar.push(v);
  }
  return { aImportar, repetidos };
}
