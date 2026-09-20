import { analizarRecurrentes, serieElegida, type OpcionesRecurrentes, type Serie } from "./recurrentes";
import { decisionDe, type DecisionSerie } from "./decisiones";
import { buscarRepetidos } from "./duplicados";
import { resumenPresupuesto } from "./budgeting";
import { monedaDeTx, type Account, type Category, type CreditCard, type Debt, type Tx } from "./types";
import { hoyLocal } from "../lib/fechas";

// El informe de finanzas: la plata contada como la contaría alguien que se
// sienta contigo a mirarla.
//
// Aquí no hay nada de pantalla. Este archivo toma los movimientos tal como
// están guardados y devuelve un objeto con todo lo que el informe necesita
// decir: cuánto entró, cuánto salió, en qué se fue, qué se repite todos los
// meses, qué cambió respecto al periodo anterior y dónde hay plata que se
// puede recuperar sin cambiar de vida.
//
// Se separa de la pestaña por dos razones. La primera es que el mismo informe
// se muestra en la app y se exporta para que lo lea otra persona, y los dos
// tienen que decir exactamente lo mismo. La segunda es que las cuentas de
// plata se prueban mejor solas que a través de un componente.
//
// Regla de la casa: nunca se suman monedas distintas. Todo el informe se
// calcula para UNA moneda, y si hay movimientos en otras, se dice cuántos
// quedaron fuera en vez de mezclarlos en un total que no existe.

// ---------- El periodo ----------

export type Preset = "mes" | "mesPasado" | "tres" | "seis" | "anio" | "doce" | "todo";

export interface Rango {
  desde: string;
  hasta: string;
  etiqueta: string;
}

const mesDe = (f: string): string => f.slice(0, 7);

/** Primer día de un mes YYYY-MM. */
const inicioMes = (ym: string): string => `${ym}-01`;

/** Último día de un mes YYYY-MM, respetando febrero y los meses de 30. */
export function finMes(ym: string): string {
  const [a, m] = ym.split("-").map(Number);
  const ultimo = new Date(Date.UTC(a, m, 0)).getUTCDate();
  return `${ym}-${String(ultimo).padStart(2, "0")}`;
}

/** Mueve un mes YYYY-MM hacia adelante o hacia atrás. */
export function sumarMeses(ym: string, delta: number): string {
  const [a, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

const aDias = (f: string): number => new Date(`${f}T00:00:00Z`).getTime() / 86400000;

const sumarDias = (f: string, n: number): string =>
  new Date((aDias(f) + n) * 86400000).toISOString().slice(0, 10);

/** Cuántos días tiene un rango, contando los dos extremos. */
export const diasDeRango = (desde: string, hasta: string): number =>
  Math.max(1, Math.round(aDias(hasta) - aDias(desde)) + 1);

/**
 * El rango de fechas de cada periodo ofrecido.
 *
 * "Todo" necesita saber desde cuándo hay movimientos, por eso recibe la fecha
 * del más antiguo. Sin movimientos, cae en el mes actual y el informe sale
 * vacío, que es la verdad.
 */
export function rangoDePreset(p: Preset, primerMovimiento: string | null, hoy = hoyLocal()): Rango {
  const mes = mesDe(hoy);
  if (p === "mes") return { desde: inicioMes(mes), hasta: hoy, etiqueta: "Este mes" };
  if (p === "mesPasado") {
    const ant = sumarMeses(mes, -1);
    return { desde: inicioMes(ant), hasta: finMes(ant), etiqueta: "El mes pasado" };
  }
  if (p === "tres") return { desde: inicioMes(sumarMeses(mes, -2)), hasta: hoy, etiqueta: "Últimos 3 meses" };
  if (p === "seis") return { desde: inicioMes(sumarMeses(mes, -5)), hasta: hoy, etiqueta: "Últimos 6 meses" };
  if (p === "doce") return { desde: inicioMes(sumarMeses(mes, -11)), hasta: hoy, etiqueta: "Últimos 12 meses" };
  if (p === "anio") return { desde: `${hoy.slice(0, 4)}-01-01`, hasta: hoy, etiqueta: `Año ${hoy.slice(0, 4)}` };
  return { desde: primerMovimiento ?? inicioMes(mes), hasta: hoy, etiqueta: "Todo lo registrado" };
}

// ---------- Lo que devuelve ----------

export interface Totales {
  ingresos: number;
  gastos: number;
  neto: number;
  /** Cuánto de lo que entró no se gastó, en porcentaje. Nulo sin ingresos. */
  tasaAhorro: number | null;
  movimientos: number;
  /** Lo mismo llevado a un mes, para poder comparar periodos de distinto largo. */
  gastoMensual: number;
  ingresoMensual: number;
  gastoDiario: number;
}

export interface FilaCategoria {
  id: string;
  nombre: string;
  icono: string | null;
  total: number;
  /** Qué parte del gasto del periodo se fue aquí, de 0 a 100. */
  pct: number;
  cuantos: number;
  /** Lo mismo en el periodo anterior, y la diferencia en porcentaje. */
  anterior: number;
  deltaPct: number | null;
  mensual: number;
}

export interface FilaComercio {
  nombre: string;
  total: number;
  cuantos: number;
  ultima: string;
}

export interface FilaMes {
  mes: string;
  ingresos: number;
  gastos: number;
  neto: number;
  enRango: boolean;
}

export interface FilaPresupuesto {
  id: string;
  nombre: string;
  icono: string | null;
  tope: number;
  gastado: number;
  pct: number;
  excedido: boolean;
}

export interface FilaRecurrente {
  clave: string;
  nombre: string;
  /** Una suscripción no termina nunca y una cuota sí. Se cuentan aparte
   *  porque recortar una suscripción es una decisión y pagar una cuota no. */
  tipo: "suscripcion" | "cuota";
  alMes: number;
  alAno: number;
  monto: number;
  cadencia: string;
  categoria: string;
  ultima: string;
  proxima: string;
  activa: boolean;
  /** Subió o bajó de precio desde que se cobra. */
  cambioPrecio: number | null;
  cuantosCargos: number;
  /** Los movimientos que forman la serie, para poder marcarlos en la
   *  planilla exportada: "este cargo es una suscripción". */
  txIds: string[];
}

export type Tono = "bien" | "ojo" | "alerta";

export interface Hallazgo {
  clave: string;
  tono: Tono;
  titulo: string;
  detalle: string;
}

export type Friccion = "baja" | "media" | "alta";

export interface Recorte {
  clave: string;
  titulo: string;
  detalle: string;
  /** Ahorro mensual estimado, en un rango honesto. */
  min: number;
  max: number;
  friccion: Friccion;
}

export interface Informe {
  desde: string;
  hasta: string;
  etiqueta: string;
  dias: number;
  /** El periodo llevado a meses, con decimales. Sirve para los promedios. */
  meses: number;
  moneda: string;
  generado: string;
  totales: Totales;
  /** El mismo largo de periodo, justo antes. Nulo si no hay nada antes. */
  anterior: Totales | null;
  categorias: FilaCategoria[];
  comercios: FilaComercio[];
  tendencia: FilaMes[];
  presupuestos: FilaPresupuesto[];
  recurrentes: FilaRecurrente[];
  /** Solo las suscripciones activas. Las cuotas van aparte: se acaban. */
  recurrenteAlMes: number;
  recurrenteAlAno: number;
  cuotasAlMes: number;
  gastoFijo: number;
  gastoVariable: number;
  hallazgos: Hallazgo[];
  recortes: Recorte[];
  recorteMin: number;
  recorteMax: number;
  /** Qué tan confiable es lo de arriba: datos que faltan o están sucios. */
  sinCategoria: { monto: number; cuantos: number; pct: number };
  fueraDeMoneda: number;
  repetidos: { grupos: number; monto: number };
  /** Los movimientos del periodo, para la exportación. */
  movimientos: Tx[];
}

export interface DatosInforme {
  txs: Tx[];
  categories: Category[];
  accounts: Account[];
  cards: CreditCard[];
  debts?: Debt[];
  /** Lo que la persona ya decidió en la pestaña Recurrentes: qué serie es una
   *  suscripción, cuál es una compra en cuotas y cuál no es ninguna de las dos.
   *  Sin esto, el informe contradiría a la pestaña de al lado. */
  decisiones?: DecisionSerie[];
  /** La moneda del informe. Lo que esté en otra queda fuera y se avisa. */
  moneda: string;
  monedaPorDefecto: string;
  desde: string;
  hasta: string;
  etiqueta?: string;
  /** Cómo se escriben los montos DENTRO de las observaciones y los recortes.
   *  La pestaña pasa el suyo para que el modo privado también los tape; la
   *  exportación usa el de acá, que siempre dice la cifra real. */
  fmt?: (n: number) => string;
}

// ---------- Utilidades de cuenta ----------

/** Los montos del informe llevan el código de la moneda (CAD, CLP) y no el
 *  signo: quien lee el informe exportado puede no saber de qué país es ese
 *  peso. En pantalla lo reemplaza `fmtMoney`, que además sabe enmascarar los
 *  montos cuando el modo privado está encendido. */
export function plata(n: number, moneda: string): string {
  try {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: moneda,
      currencyDisplay: "code",
      maximumFractionDigits: moneda === "CLP" ? 0 : 2,
    }).format(n);
  } catch {
    return `${n.toFixed(2)} ${moneda}`;
  }
}

/** Un número suelto (un porcentaje, una tasa) escrito como se escribe en
 *  español: con coma y sin decimales de más. */
const numero = (n: number): string => n.toLocaleString("es-CL", { maximumFractionDigits: 2 });

const suma = (xs: number[]): number => xs.reduce((s, n) => s + n, 0);

/** Un gasto que de verdad te costó plata.
 *
 *  Quedan fuera el reflejo de un traspaso (la misma plata contada dos veces)
 *  y lo que alguien te devolvió, porque al final no salió de tu bolsillo.
 */
const esGasto = (t: Tx): boolean => t.type === "expense" && !t.mirror_of && !t.reimbursed;
const esIngreso = (t: Tx): boolean => t.type === "income" && !t.mirror_of;

function totalesDe(rows: Tx[], dias: number): Totales {
  const ingresos = suma(rows.filter(esIngreso).map((t) => Number(t.amount)));
  const gastos = suma(rows.filter(esGasto).map((t) => Number(t.amount)));
  const meses = Math.max(dias / 30.4375, 0.1);
  return {
    ingresos,
    gastos,
    neto: ingresos - gastos,
    tasaAhorro: ingresos > 0 ? ((ingresos - gastos) / ingresos) * 100 : null,
    movimientos: rows.length,
    gastoMensual: gastos / meses,
    ingresoMensual: ingresos / meses,
    gastoDiario: gastos / dias,
  };
}

/** El nombre del comercio como se muestra, sin la glosa cruda del banco. */
function nombreComercio(t: Tx): string {
  const m = (t.merchant ?? "").trim();
  if (m) return m;
  const d = (t.description ?? "").trim();
  if (d) return d;
  return (t.bank_ref ?? "").trim() || "Sin nombre";
}

/** Categorías que casi siempre se pueden apretar sin que duela la vida.
 *
 *  Se reconocen por el nombre porque las categorías las escribe cada persona.
 *  Si no calza ninguna, el informe simplemente no propone ese recorte: es
 *  mejor callarse que inventar que el arriendo es discrecional.
 */
const PALABRAS_DISCRECIONALES = [
  "restaurant", "restauran", "cafe", "café", "delivery", "bar", "salid", "entreten",
  "compras", "ropa", "shopping", "antojo", "ocio", "juego", "streaming", "suscrip",
];

const esDiscrecional = (nombre: string): boolean => {
  const n = nombre.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return PALABRAS_DISCRECIONALES.some((p) => n.includes(p.normalize("NFD").replace(/[̀-ͯ]/g, "")));
};

const CADENCIA_TEXTO: Record<string, string> = {
  semanal: "cada semana",
  quincenal: "cada dos semanas",
  mensual: "todos los meses",
  bimestral: "cada dos meses",
  trimestral: "cada tres meses",
  semestral: "cada seis meses",
  anual: "una vez al año",
};

export const textoCadencia = (c: string): string => CADENCIA_TEXTO[c] ?? c;

// ---------- El informe ----------

export function armarInformeFinanzas(d: DatosInforme): Informe {
  const { desde, hasta, moneda } = d;
  const dias = diasDeRango(desde, hasta);
  const meses = Math.max(dias / 30.4375, 0.1);

  const porCuenta = new Map(d.accounts.map((a) => [a.id, a.currency]));
  const porTarjeta = new Map(d.cards.map((c) => [c.id, c.currency]));
  const monedaDe = (t: Tx) => monedaDeTx(t, porCuenta, porTarjeta, d.monedaPorDefecto);

  const suyos = d.txs.filter((t) => monedaDe(t) === moneda);
  const fueraDeMoneda = d.txs.length - suyos.length;

  const enRango = (t: Tx) => t.date >= desde && t.date <= hasta;
  const rows = suyos.filter(enRango);

  // El periodo anterior del mismo largo, para poder decir "más" o "menos"
  // sin comparar un mes con un semestre.
  const finAnterior = sumarDias(desde, -1);
  const iniAnterior = sumarDias(finAnterior, -(dias - 1));
  const rowsAnterior = suyos.filter((t) => t.date >= iniAnterior && t.date <= finAnterior);

  const totales = totalesDe(rows, dias);
  const anterior = rowsAnterior.length > 0 ? totalesDe(rowsAnterior, dias) : null;

  // ---------- En qué se fue ----------
  const catById = new Map(d.categories.map((c) => [c.id, c]));
  const acumular = (lista: Tx[]) => {
    const m = new Map<string, { total: number; cuantos: number }>();
    for (const t of lista.filter(esGasto)) {
      const id = t.category_id ?? "sin";
      const v = m.get(id) ?? { total: 0, cuantos: 0 };
      v.total += Number(t.amount);
      v.cuantos += 1;
      m.set(id, v);
    }
    return m;
  };
  const actualPorCat = acumular(rows);
  const antesPorCat = acumular(rowsAnterior);

  const categorias: FilaCategoria[] = [...actualPorCat.entries()]
    .map(([id, v]) => {
      const c = id === "sin" ? undefined : catById.get(id);
      const antes = antesPorCat.get(id)?.total ?? 0;
      return {
        id,
        nombre: c?.name ?? "Sin categoría",
        icono: c?.icon ?? null,
        total: v.total,
        pct: totales.gastos > 0 ? (v.total / totales.gastos) * 100 : 0,
        cuantos: v.cuantos,
        anterior: antes,
        deltaPct: antes > 0 ? ((v.total - antes) / antes) * 100 : null,
        mensual: v.total / meses,
      };
    })
    .sort((a, b) => b.total - a.total);

  // ---------- A quién se le pagó ----------
  const porComercio = new Map<string, { total: number; cuantos: number; ultima: string }>();
  for (const t of rows.filter(esGasto)) {
    const nombre = nombreComercio(t);
    const v = porComercio.get(nombre) ?? { total: 0, cuantos: 0, ultima: t.date };
    v.total += Number(t.amount);
    v.cuantos += 1;
    if (t.date > v.ultima) v.ultima = t.date;
    porComercio.set(nombre, v);
  }
  const comercios: FilaComercio[] = [...porComercio.entries()]
    .map(([nombre, v]) => ({ nombre, ...v }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 12);

  // ---------- Mes a mes ----------
  //
  // Siempre al menos seis meses, aunque el periodo sea uno solo: un mes suelto
  // no dice si vas mejor o peor, y esa es justo la pregunta.
  const mesFin = mesDe(hasta);
  const mesIni = mesDe(desde);
  const largo = Math.max(6, mesesEntre(mesIni, mesFin) + 1);
  const tendencia: FilaMes[] = [];
  for (let i = largo - 1; i >= 0; i -= 1) {
    const mes = sumarMeses(mesFin, -i);
    const delMes = suyos.filter((t) => t.date.startsWith(mes));
    const ingresos = suma(delMes.filter(esIngreso).map((t) => Number(t.amount)));
    const gastos = suma(delMes.filter(esGasto).map((t) => Number(t.amount)));
    tendencia.push({ mes, ingresos, gastos, neto: ingresos - gastos, enRango: mes >= mesIni && mes <= mesFin });
  }

  // ---------- Presupuestos ----------
  //
  // El presupuesto es mensual, así que se mira el último mes del periodo. Para
  // un periodo largo se dice igual, aclarando de qué mes se habla.
  const presupuestos: FilaPresupuesto[] = d.categories
    .filter((c) => c.type === "expense" && Number(c.budget) > 0 && !c.exclude_from_budget)
    .map((c) => {
      const r = resumenPresupuesto(c, suyos, mesFin);
      return {
        id: c.id,
        nombre: c.name,
        icono: c.icon,
        tope: r.disponible,
        gastado: r.gastado,
        pct: r.pct,
        excedido: r.excedido,
      };
    })
    .sort((a, b) => b.pct - a.pct);

  // ---------- Lo que se cobra solo ----------
  //
  // Se busca sobre TODO el historial de la moneda, no sobre el periodo: una
  // suscripción se reconoce por sus tres o cuatro cargos, y mirar solo un mes
  // la haría desaparecer justo en el informe que existe para encontrarla.
  const series = seriesDelInforme(suyos, d.decisiones ?? [], { monedaDe, hoy: hasta })
    .filter(({ serie }) => serie.currency === moneda);

  const recurrentes: FilaRecurrente[] = conNombresDistintos(series).map(({ serie, tipo, nombre }) => ({
    clave: serie.clave,
    nombre,
    tipo,
    alMes: serie.alMes,
    alAno: serie.alAno,
    monto: serie.monto,
    cadencia: serie.cadencia,
    categoria: serie.categoriaId ? catById.get(serie.categoriaId)?.name ?? "Sin categoría" : "Sin categoría",
    ultima: serie.ultima,
    proxima: serie.proxima,
    activa: serie.activa,
    cambioPrecio: serie.montoAnterior !== null ? serie.monto - serie.montoAnterior : null,
    cuantosCargos: serie.txs.length,
    txIds: serie.txs.map((t) => t.id),
  }));

  const activas = recurrentes.filter((r) => r.activa && r.tipo === "suscripcion");
  const recurrenteAlMes = suma(activas.map((r) => r.alMes));
  const recurrenteAlAno = suma(activas.map((r) => r.alAno));
  const cuotasAlMes = suma(recurrentes.filter((r) => r.activa && r.tipo === "cuota").map((r) => r.alMes));
  // El gasto fijo no puede ser mayor que el gasto: si el detector se entusiasma
  // y marca como recurrente algo que es una compra normal, el tope evita que
  // el informe diga que gastas más fijo de lo que gastas en total.
  const gastoFijo = Math.min(recurrenteAlMes + cuotasAlMes, totales.gastoMensual);
  const gastoVariable = Math.max(0, totales.gastoMensual - gastoFijo);

  // ---------- Calidad de los datos ----------
  const sinCat = rows.filter((t) => esGasto(t) && !t.category_id);
  const montoSinCat = suma(sinCat.map((t) => Number(t.amount)));
  const gruposRepetidos = buscarRepetidos(rows);
  // Lo de más: el grupo tiene tres cargos iguales, uno es de verdad y los
  // otros dos están de sobra.
  const montoRepetido = suma(gruposRepetidos.map((g) => Number(g.monto) * (g.txs.length - 1)));

  const informeBase = {
    desde,
    hasta,
    etiqueta: d.etiqueta ?? `${desde} a ${hasta}`,
    dias,
    meses,
    moneda,
    generado: new Date().toISOString(),
    totales,
    anterior,
    categorias,
    comercios,
    tendencia,
    presupuestos,
    recurrentes,
    recurrenteAlMes,
    recurrenteAlAno,
    cuotasAlMes,
    gastoFijo,
    gastoVariable,
    sinCategoria: {
      monto: montoSinCat,
      cuantos: sinCat.length,
      pct: totales.gastos > 0 ? (montoSinCat / totales.gastos) * 100 : 0,
    },
    fueraDeMoneda,
    repetidos: { grupos: gruposRepetidos.length, monto: montoRepetido },
    movimientos: [...rows].sort((a, b) => b.date.localeCompare(a.date)),
  };

  const dinero = d.fmt ?? ((n: number) => plata(n, moneda));
  const hallazgos = buscarHallazgos(informeBase, series.map((e) => e.serie), d.cards, d.debts ?? [], dinero);
  const recortes = buscarRecortes(informeBase, d.cards, dinero);
  return {
    ...informeBase,
    hallazgos,
    recortes,
    recorteMin: suma(recortes.map((r) => r.min)),
    recorteMax: suma(recortes.map((r) => r.max)),
  };
}

/** Una serie tal como la cuenta el informe, con lo que la persona decidió
 *  sobre ella ya aplicado. */
interface SerieDelInforme {
  serie: Serie;
  tipo: "suscripcion" | "cuota";
  nombre: string;
}

/**
 * Las series que cuentan, siguiendo las mismas reglas que la pestaña
 * Recurrentes.
 *
 * Existe para que las dos pantallas no se contradigan. Si alguien marcó
 * "esto no es una suscripción" en Recurrentes y el informe la sigue contando,
 * la app queda diciendo dos cosas distintas sobre el mismo cargo, y la que se
 * exporta y se manda al contador es justo esta.
 *
 * El orden importa: las series que la persona armó a mano se apartan primero,
 * y sus cargos no entran al detector. Así los cargos que quedan se agrupan
 * solos y pueden formar su propia serie, que es lo que pasa cuando un
 * intermediario cobra dos cosas distintas con el mismo nombre.
 */
export function seriesDelInforme(
  txs: Tx[],
  decisiones: DecisionSerie[],
  opts: OpcionesRecurrentes,
): SerieDelInforme[] {
  const txPorId = new Map(txs.map((t) => [t.id, t]));
  const aMano: Array<{ serie: Serie; detectada: boolean; decision: DecisionSerie | null }> = [];
  const apartados = new Set<string>();

  for (const d of decisiones) {
    if (!d.tx_ids?.length) continue;
    const cargos = d.tx_ids.map((id) => txPorId.get(id)).filter((t): t is Tx => !!t);
    const e = serieElegida(d.clave, cargos, opts);
    if (!e) continue;
    for (const t of cargos) apartados.add(t.id);
    aMano.push({ serie: e.serie, detectada: true, decision: d });
  }

  const detectadas = analizarRecurrentes(txs.filter((t) => !apartados.has(t.id)), opts)
    .map((e) => ({ serie: e.serie, detectada: e.detectada, decision: decisionDe(e.serie, decisiones) }));

  return [...aMano, ...detectadas]
    // Lo que la persona descartó no existe para el informe. Lo que la app no
    // reconoció sola tampoco, salvo que ella lo haya confirmado.
    .filter(({ detectada, decision }) =>
      decision?.kind !== "ignored"
      && (detectada || decision?.kind === "subscription" || decision?.kind === "installments"))
    .map(({ serie, decision }) => ({
      serie,
      tipo: decision?.kind === "installments" ? "cuota" as const : "suscripcion" as const,
      nombre: decision?.name?.trim() || serie.nombre,
    }))
    .sort((a, b) => b.serie.alAno - a.serie.alAno);
}

/** Dos cargos del mismo comercio se ven igual en una tabla, y eso pasa de
 *  verdad: el mismo intermediario cobrando dos cosas. Cuando el nombre se
 *  repite y nadie le puso uno propio, se distingue por el monto. */
function conNombresDistintos(series: SerieDelInforme[]): SerieDelInforme[] {
  const cuantos = new Map<string, number>();
  for (const s of series) cuantos.set(s.nombre, (cuantos.get(s.nombre) ?? 0) + 1);
  return series.map((s) => ((cuantos.get(s.nombre) ?? 0) > 1
    ? { ...s, nombre: `${s.nombre} (${s.serie.monto.toFixed(2)})` }
    : s));
}

function mesesEntre(a: string, b: string): number {
  const [a1, m1] = a.split("-").map(Number);
  const [a2, m2] = b.split("-").map(Number);
  return (a2 - a1) * 12 + (m2 - m1);
}

type InformeSinConsejos = Omit<Informe, "hallazgos" | "recortes" | "recorteMin" | "recorteMax">;

// ---------- Lo que se ve al mirar los números ----------
//
// Cada hallazgo sale de una cuenta concreta y dice de dónde salió. Un consejo
// que no se puede verificar en la tabla de al lado es un adorno, y esta
// pestaña existe justo para lo contrario.

function buscarHallazgos(
  inf: InformeSinConsejos,
  series: Serie[],
  cards: CreditCard[],
  debts: Debt[],
  dinero: (n: number) => string,
): Hallazgo[] {
  const h: Hallazgo[] = [];
  const { totales, anterior, categorias } = inf;

  if (totales.movimientos === 0) {
    return [{
      clave: "vacio",
      tono: "ojo",
      titulo: "Todavía no hay movimientos en este periodo",
      detalle: "Importa una cartola o registra algunos gastos, y el informe se arma solo con lo que haya.",
    }];
  }

  // Lo primero que uno quiere saber: ¿quedó algo?
  if (totales.tasaAhorro === null) {
    h.push({
      clave: "sinIngresos",
      tono: "ojo",
      titulo: "No hay ingresos registrados en este periodo",
      detalle: `Se gastaron ${dinero(totales.gastos)} sin ninguna entrada anotada. Si tu sueldo o tus ventas no están en la app, todo lo que sigue mira solo la mitad de la historia.`,
    });
  } else if (totales.tasaAhorro < 0) {
    h.push({
      clave: "ahorroNegativo",
      tono: "alerta",
      titulo: "Gastaste más de lo que entró",
      detalle: `Salieron ${dinero(-totales.neto)} más de lo que entró. Esa diferencia sale de tus ahorros o de una tarjeta, y en los dos casos se paga después.`,
    });
  } else if (totales.tasaAhorro < 10) {
    h.push({
      clave: "ahorroBajo",
      tono: "ojo",
      titulo: `Te quedó el ${Math.round(totales.tasaAhorro)} por ciento de lo que entró`,
      detalle: "Debajo del diez por ciento, cualquier imprevisto se paga con deuda. La meta razonable para empezar es diez, y después veinte.",
    });
  } else {
    h.push({
      clave: "ahorroOk",
      tono: "bien",
      titulo: `Guardaste el ${Math.round(totales.tasaAhorro)} por ciento de lo que entró`,
      detalle: `Son ${dinero(totales.neto)} que no se gastaron. Si ese dinero tiene un destino (una meta, la deuda más cara), deja de ser un saldo suelto.`,
    });
  }

  // ¿Se está yendo más que antes?
  if (anterior && anterior.gastoMensual > 0) {
    const cambio = ((totales.gastoMensual - anterior.gastoMensual) / anterior.gastoMensual) * 100;
    if (cambio >= 15) {
      h.push({
        clave: "gastoSubio",
        tono: "alerta",
        titulo: `El gasto subió ${Math.round(cambio)} por ciento respecto al periodo anterior`,
        detalle: `Pasó de ${dinero(anterior.gastoMensual)} a ${dinero(totales.gastoMensual)} al mes. Abajo, en las categorías, está cuál lo empujó.`,
      });
    } else if (cambio <= -10) {
      h.push({
        clave: "gastoBajo",
        tono: "bien",
        titulo: `El gasto bajó ${Math.round(-cambio)} por ciento respecto al periodo anterior`,
        detalle: `De ${dinero(anterior.gastoMensual)} a ${dinero(totales.gastoMensual)} al mes. Vale la pena mirar qué hiciste distinto y dejarlo escrito.`,
      });
    }
  }

  // Concentración: casi siempre una sola categoría explica el mes.
  const top = categorias[0];
  if (top && top.pct >= 30) {
    h.push({
      clave: "concentracion",
      tono: "ojo",
      titulo: `${Math.round(top.pct)} de cada 100 se fueron a ${top.nombre}`,
      detalle: `${dinero(top.total)} en ${top.cuantos} ${top.cuantos === 1 ? "movimiento" : "movimientos"}. Cuando una categoría pesa tanto, es la única donde un recorte se nota de verdad.`,
    });
  }

  // La categoría que más subió, si el salto es grande y el monto importa.
  const subidas = categorias
    .filter((c) => c.deltaPct !== null && c.deltaPct >= 25 && c.pct >= 5)
    .sort((a, b) => (b.total - b.anterior) - (a.total - a.anterior));
  if (subidas[0]) {
    const c = subidas[0];
    h.push({
      clave: "categoriaSubio",
      tono: "alerta",
      titulo: `${c.nombre} subió ${Math.round(c.deltaPct ?? 0)} por ciento`,
      detalle: `De ${dinero(c.anterior)} a ${dinero(c.total)}. Son ${dinero(c.total - c.anterior)} más que el periodo anterior.`,
    });
  }

  // Lo que se cobra solo, junto, que es donde se ve el tamaño real.
  if (inf.recurrenteAlMes > 0) {
    const suscripciones = inf.recurrentes.filter((r) => r.activa && r.tipo === "suscripcion");
    const nombres = suscripciones.slice(0, 3).map((r) => r.nombre).join(", ");
    // El porcentaje se calcula con el gasto fijo, que ya está topado al gasto
    // total: sin eso, un detector entusiasta puede llegar a decir "el 102 por
    // ciento de lo que gastas", que es imposible y hace desconfiar de todo.
    const parte = totales.gastoMensual > 0 ? Math.min(100, (inf.gastoFijo / totales.gastoMensual) * 100) : 0;
    h.push({
      clave: "recurrentes",
      tono: parte >= 25 ? "alerta" : "ojo",
      titulo: `Se te cobran ${dinero(inf.recurrenteAlMes)} al mes sin que hagas nada`,
      detalle: `Son ${dinero(inf.recurrenteAlAno)} al año entre ${suscripciones.length} cargos${nombres ? ` (los más caros: ${nombres})` : ""}, ${parte >= 90 ? "casi todo lo que gastas en un mes" : `el ${Math.round(parte)} por ciento de lo que gastas al mes`}.${
        inf.cuotasAlMes > 0 ? ` Aparte van ${dinero(inf.cuotasAlMes)} al mes en cuotas, que sí se terminan.` : ""}`,
    });
  }

  // Alzas de precio en las suscripciones: el cobro que sube y nadie mira.
  const alzas = series.filter((s) => s.montoAnterior !== null && s.monto > s.montoAnterior);
  if (alzas.length > 0) {
    const total = suma(alzas.map((s) => (s.monto - (s.montoAnterior ?? 0)) * (30.4375 / s.diasEntre)));
    h.push({
      clave: "alzas",
      tono: "ojo",
      titulo: alzas.length === 1 ? `${alzas[0].nombre} te subió el precio` : `${alzas.length} cargos te subieron de precio`,
      detalle: `${alzas.map((s) => `${s.nombre}, de ${dinero(s.montoAnterior ?? 0)} a ${dinero(s.monto)}`).join(". ")}. En total son ${dinero(total)} más al mes que antes.`,
    });
  }

  // Suscripciones dormidas: el cargo que dejó de llegar puede ser una baja que
  // ya hiciste, o un servicio que sigue vivo y vuelve el mes que viene.
  const dormidas = inf.recurrentes.filter((r) => !r.activa);
  if (dormidas.length > 0) {
    h.push({
      clave: "dormidas",
      tono: "ojo",
      titulo: `${dormidas.length} ${dormidas.length === 1 ? "cargo repetido dejó" : "cargos repetidos dejaron"} de llegar`,
      detalle: `${dormidas.slice(0, 4).map((r) => `${r.nombre}, última vez el ${r.ultima}`).join(". ")}. Si los diste de baja, perfecto. Si no, revisa que no vuelvan a aparecer.`,
    });
  }

  // Presupuestos reventados.
  const pasados = inf.presupuestos.filter((p) => p.excedido);
  if (pasados.length > 0) {
    h.push({
      clave: "presupuestos",
      tono: "alerta",
      titulo: `${pasados.length} ${pasados.length === 1 ? "presupuesto se pasó" : "presupuestos se pasaron"} del tope`,
      detalle: pasados.slice(0, 4)
        .map((p) => `${p.nombre}, ${dinero(p.gastado)} de ${dinero(p.tope)}`)
        .join(". ") + ".",
    });
  }

  // Tarjetas: el interés es el gasto que no aparece en ninguna categoría.
  const conInteres = cards.filter((c) => Number(c.balance) > 0 && Number(c.apr) > 0 && c.currency === inf.moneda);
  if (conInteres.length > 0) {
    const mensual = suma(conInteres.map((c) => (Number(c.balance) * Number(c.apr)) / 100 / 12));
    if (mensual >= 1) {
      h.push({
        clave: "interesTarjeta",
        tono: "alerta",
        titulo: `El interés de tus tarjetas cuesta cerca de ${dinero(mensual)} al mes`,
        detalle: `${conInteres.map((c) => `${c.name}, debes ${dinero(Number(c.balance))} al ${numero(Number(c.apr))} por ciento anual`).join(". ")}. Pagar eso primero rinde más que cualquier inversión que te ofrezcan.`,
      });
    }
  }

  const deudasCaras = debts.filter((d) => Number(d.balance) > 0 && Number(d.interest_rate) > 0 && d.currency === inf.moneda);
  if (deudasCaras.length > 0) {
    const cara = [...deudasCaras].sort((a, b) => Number(b.interest_rate) - Number(a.interest_rate))[0];
    h.push({
      clave: "deudaCara",
      tono: "ojo",
      titulo: `Tu deuda más cara es ${cara.name}, al ${numero(Number(cara.interest_rate))} por ciento`,
      detalle: `Quedan ${dinero(Number(cara.balance))}. Cada peso extra que le pongas a esta antes que a las demás es el que más te ahorra.`,
    });
  }

  // Calidad de los datos: sin esto, todo lo de arriba se lee con desconfianza.
  if (inf.sinCategoria.pct >= 10) {
    h.push({
      clave: "sinCategoria",
      tono: "ojo",
      titulo: `${Math.round(inf.sinCategoria.pct)} por ciento del gasto está sin categoría`,
      detalle: `Son ${dinero(inf.sinCategoria.monto)} en ${inf.sinCategoria.cuantos} movimientos. Clasificarlos cambia los números de arriba, así que conviene hacerlo antes de sacar conclusiones.`,
    });
  }

  if (inf.repetidos.grupos > 0) {
    h.push({
      clave: "repetidos",
      tono: "ojo",
      titulo: `Hay ${inf.repetidos.grupos} ${inf.repetidos.grupos === 1 ? "movimiento que parece anotado dos veces" : "movimientos que parecen anotados dos veces"}`,
      detalle: `Suman cerca de ${dinero(inf.repetidos.monto)} de más. Revísalos en Transacciones, en la bandeja de repetidos, antes de mandar este informe a alguien.`,
    });
  }

  if (inf.fueraDeMoneda > 0) {
    h.push({
      clave: "otraMoneda",
      tono: "ojo",
      titulo: `Quedaron ${inf.fueraDeMoneda} movimientos en otra moneda`,
      detalle: `Este informe está en ${inf.moneda} y no mezcla monedas. Cambia la moneda arriba para ver los demás.`,
    });
  }

  return h;
}

// ---------- Dónde hay plata que recuperar ----------
//
// Los rangos son estimaciones, y se dicen como estimaciones. Cada uno sale de
// un número propio de la persona, nunca de un promedio de internet: recortar
// un veinte por ciento de TUS suscripciones es una frase que se puede
// comprobar, "la gente gasta demasiado en café" no.

function buscarRecortes(
  inf: InformeSinConsejos,
  cards: CreditCard[],
  dinero: (n: number) => string,
): Recorte[] {
  const r: Recorte[] = [];

  // Con menos de tres semanas de datos, un promedio mensual es una
  // adivinanza. Mejor no proponer recortes que proponerlos sobre humo.
  if (inf.dias < 21 || inf.totales.gastos <= 0) return r;

  if (inf.recurrenteAlMes > 0) {
    const nombres = inf.recurrentes.filter((x) => x.activa).slice(0, 3).map((x) => x.nombre).join(", ");
    r.push({
      clave: "suscripciones",
      titulo: "Revisar lo que se cobra solo",
      detalle: `Pagas ${dinero(inf.recurrenteAlMes)} al mes en cargos automáticos${nombres ? ` (${nombres} son los más caros)` : ""}. Dar de baja o bajar de plan una parte es el recorte que menos cambia tu día a día.`,
      min: inf.recurrenteAlMes * 0.2,
      max: inf.recurrenteAlMes * 0.4,
      friccion: "baja",
    });
  }

  const discrecionales = inf.categorias.filter((c) => esDiscrecional(c.nombre) && c.mensual > 0);
  if (discrecionales.length > 0) {
    const totalMes = suma(discrecionales.map((c) => c.mensual));
    r.push({
      clave: "discrecional",
      titulo: `Bajar un poco ${discrecionales.slice(0, 2).map((c) => c.nombre.toLowerCase()).join(" y ")}`,
      detalle: `Entre esas categorías se van ${dinero(totalMes)} al mes. Recortar entre un 15 y un 25 por ciento no significa dejarlo, significa una o dos veces menos al mes.`,
      min: totalMes * 0.15,
      max: totalMes * 0.25,
      friccion: "media",
    });
  }

  // La categoría que se disparó: volver a lo de antes ya es un ahorro, y es
  // el más fácil de defender porque ese nivel de gasto ya lo viviste.
  const salto = inf.categorias
    .filter((c) => c.anterior > 0 && c.total > c.anterior && c.pct >= 8)
    .sort((a, b) => (b.total - b.anterior) - (a.total - a.anterior))[0];
  if (salto) {
    const diferencia = (salto.total - salto.anterior) / inf.meses;
    if (diferencia > 0) {
      r.push({
        clave: "volverAlPromedio",
        titulo: `Volver ${salto.nombre.toLowerCase()} a lo que era antes`,
        detalle: `Esta categoría subió ${dinero(salto.total - salto.anterior)} respecto al periodo anterior. No es un recorte nuevo, es volver a un nivel en el que ya viviste.`,
        min: diferencia * 0.5,
        max: diferencia,
        friccion: "media",
      });
    }
  }

  // Los gastos chicos que se acumulan. El corte no es un número inventado:
  // es la vigésima parte del gasto mensual, así se adapta a cada bolsillo.
  const corte = inf.totales.gastoMensual / 20;
  const chicos = inf.movimientos.filter((t) => esGasto(t) && Number(t.amount) <= corte);
  const totalChicos = suma(chicos.map((t) => Number(t.amount))) / inf.meses;
  if (chicos.length >= 10 && totalChicos > 0) {
    r.push({
      clave: "hormiga",
      titulo: "Las compras chicas, juntas",
      detalle: `${chicos.length} movimientos de menos de ${dinero(corte)} suman ${dinero(totalChicos)} al mes. Por separado ninguno se siente, y juntos son esto.`,
      min: totalChicos * 0.1,
      max: totalChicos * 0.2,
      friccion: "alta",
    });
  }

  const conInteres = cards.filter((c) => Number(c.balance) > 0 && Number(c.apr) > 0 && c.currency === inf.moneda);
  if (conInteres.length > 0) {
    const mensual = suma(conInteres.map((c) => (Number(c.balance) * Number(c.apr)) / 100 / 12));
    if (mensual >= 1) {
      r.push({
        clave: "interes",
        titulo: "Dejar de pagar intereses de tarjeta",
        detalle: `El interés te cuesta cerca de ${dinero(mensual)} al mes. Bajar el saldo lo baja en la misma proporción, y pagarlo entero lo deja en cero.`,
        min: mensual * 0.3,
        max: mensual,
        friccion: "alta",
      });
    }
  }

  return r.sort((a, b) => b.max - a.max);
}
