import { hoyLocal } from "../lib/fechas";
import { listEnergy, type EnergyLog } from "../salud/energia";
import {
  listExercise, listHabitLogs, listHabits, listRoutine, sleepHours, streakFor,
  type ExerciseLog, type Habit, type HabitLog, type RoutineLog,
} from "../habitos/data";
import { esProgramado, listRetoLogs, listRetos, type Reto } from "../habitos/retos";
import { listSesiones, type Sesion } from "../mente/practicas";
import { listEntries, type JournalEntry } from "../mente/diario";
import { listObjectives, type Objective } from "../objetivos/data";
import type { Hallazgo } from "../informes/base";

// El informe de bienestar: lo registrado día a día, contado como lo contaría
// alguien que se sienta a mirarlo contigo.
//
// Nació de una frase concreta: "esto también debería poder exportarse, por si
// lo quiero analizar con un psicólogo". Eso cambia para quién está escrito.
// No es la pantalla de la app, donde una sabe lo que significa cada número:
// es una hoja que lee otra persona, que no conoce la app, y que necesita
// saber qué se midió, cuántos días hay de verdad y qué falta.
//
// Por eso hay tres reglas en todo este archivo:
//
//  1. Los días sin registro NO valen cero. Una semana sin anotar el sueño no
//     es una semana sin dormir. Los promedios se sacan sobre los días que
//     tienen dato, y siempre se dice cuántos son.
//  2. Lo que se cruza se cruza con su n. "Duermes mejor cuando te mueves" con
//     tres días de datos no es un hallazgo, es una casualidad, y se calla.
//  3. Ningún número se inventa para rellenar. Si un módulo no tiene datos, esa
//     sección aparece vacía y lo dice.

export type Area = "energia" | "habitos" | "movimiento" | "mente" | "direccion";

export const AREAS: Array<{ key: Area; emoji: string; nombre: string; explica: string }> = [
  { key: "energia", emoji: "⚡", nombre: "Energía", explica: "sueño, energía percibida, agua y proteína" },
  { key: "movimiento", emoji: "🏃", nombre: "Movimiento", explica: "minutos, sesiones y tipo de ejercicio" },
  { key: "habitos", emoji: "🌱", nombre: "Hábitos", explica: "constancia de cada hábito y de los retos" },
  { key: "mente", emoji: "🧠", nombre: "Mente", explica: "prácticas, minutos y escritura en el diario" },
  { key: "direccion", emoji: "🎯", nombre: "Dirección", explica: "metas, avance y plazos" },
];

// ---------- El periodo ----------

export type PresetBienestar = "semana" | "dos" | "mes" | "tres" | "seis";

export interface RangoBienestar {
  desde: string;
  hasta: string;
  etiqueta: string;
}

const aDias = (f: string): number => new Date(`${f}T00:00:00Z`).getTime() / 86400000;

const sumarDias = (f: string, n: number): string =>
  new Date((aDias(f) + n) * 86400000).toISOString().slice(0, 10);

export const diasDeRango = (desde: string, hasta: string): number =>
  Math.max(1, Math.round(aDias(hasta) - aDias(desde)) + 1);

const DIAS_PRESET: Record<PresetBienestar, { dias: number; etiqueta: string }> = {
  semana: { dias: 7, etiqueta: "Últimos 7 días" },
  dos: { dias: 14, etiqueta: "Últimas 2 semanas" },
  mes: { dias: 30, etiqueta: "Últimos 30 días" },
  tres: { dias: 90, etiqueta: "Últimos 3 meses" },
  seis: { dias: 180, etiqueta: "Últimos 6 meses" },
};

export function rangoDePreset(p: PresetBienestar, hoy = hoyLocal()): RangoBienestar {
  const { dias, etiqueta } = DIAS_PRESET[p];
  return { desde: sumarDias(hoy, -(dias - 1)), hasta: hoy, etiqueta };
}

// ---------- Lo que se mide cada día ----------

export interface DiaBienestar {
  fecha: string;
  /** Horas dormidas, si esa noche tiene hora de dormir y de despertar. */
  sueno: number | null;
  acostarse: string | null;
  levantarse: string | null;
  /** Energía percibida de 1 a 5, como la anotó ella. */
  energia: number | null;
  agua: number | null;
  proteina: number | null;
  movimientoMin: number;
  movimientoTipos: string[];
  habitosHechos: number;
  habitosPosibles: number;
  menteMin: number;
  menteSesiones: number;
  diarioEntradas: number;
}

export interface SerieNumerica {
  /** Solo los días que tienen dato. Sobre estos se saca el promedio. */
  conDato: number;
  promedio: number | null;
  minimo: number | null;
  maximo: number | null;
}

export interface FilaHabito {
  id: string;
  nombre: string;
  icono: string | null;
  marcas: number;
  /** Qué porcentaje de los días del periodo lo marcó. */
  adherencia: number;
  rachaActual: number;
  /** El último día que lo marcó, para ver si sigue vivo. */
  ultima: string | null;
}

export interface FilaReto {
  id: string;
  titulo: string;
  icono: string | null;
  cumplidos: number;
  programados: number;
  adherencia: number;
  estado: string;
}

export interface FilaMovimiento {
  tipo: string;
  sesiones: number;
  minutos: number;
}

export interface FilaMeta {
  id: string;
  titulo: string;
  area: string | null;
  /** El estado escrito para leerse ("en camino"), no la clave guardada. */
  estado: string;
  lograda: boolean;
  progreso: number;
  plazo: string | null;
  /** Días que faltan para el plazo, negativo si ya pasó. */
  diasDePlazo: number | null;
  automatica: boolean;
}

export interface FilaSemana {
  /** El lunes de esa semana. */
  inicio: string;
  suenoProm: number | null;
  energiaProm: number | null;
  movimientoMin: number;
  habitosPct: number | null;
  menteMin: number;
}

/** Un cruce entre dos cosas que se registran por separado.
 *
 *  Es lo que una persona busca cuando trae estos datos a una consulta: no
 *  "cuánto dormí", sino "qué pasa con mi energía cuando duermo poco". Cada
 *  cruce viaja con cuántos días lo sostienen, porque sin eso no se puede
 *  saber si significa algo.
 */
export interface Cruce {
  clave: string;
  pregunta: string;
  conLabel: string;
  sinLabel: string;
  con: number | null;
  sin: number | null;
  diasCon: number;
  diasSin: number;
  unidad: string;
  /** Hay suficientes días de los dos lados como para mirarlo en serio. */
  confiable: boolean;
}

export interface InformeBienestar {
  desde: string;
  hasta: string;
  etiqueta: string;
  dias: number;
  generado: string;
  areas: Area[];
  /** Un registro por día del periodo, tenga datos o no. */
  diario: DiaBienestar[];
  semanas: FilaSemana[];
  sueno: SerieNumerica;
  energia: SerieNumerica;
  agua: SerieNumerica;
  proteina: SerieNumerica;
  /** Cuántos días del periodo tienen algún registro de cualquier tipo. */
  diasConAlgo: number;
  movimiento: {
    minutos: number;
    sesiones: number;
    diasActivos: number;
    porTipo: FilaMovimiento[];
    minutosPorSemana: number;
  };
  habitos: FilaHabito[];
  retos: FilaReto[];
  adherenciaHabitos: number | null;
  mente: {
    sesiones: number;
    minutos: number;
    diasConPractica: number;
    entradasDiario: number;
    /** El texto del diario solo viaja si la persona lo pidió. */
    entradas: Array<{ fecha: string; pregunta: string | null; texto: string }>;
  };
  metas: FilaMeta[];
  cruces: Cruce[];
  hallazgos: Hallazgo[];
}

export interface OpcionesBienestar {
  desde: string;
  hasta: string;
  etiqueta?: string;
  areas: Area[];
  /** Incluir lo escrito en el diario, no solo cuántas veces escribió.
   *  Va apagado por defecto: es lo más íntimo que guarda la app. */
  conTextoDiario?: boolean;
}

// ---------- Traer los datos ----------

/** Todo lo que el informe necesita, leído de una vez.
 *
 *  Cada módulo va en su propio try: la app se fue construyendo por partes y
 *  hay migraciones que una persona puede no haber corrido. Que falte el diario
 *  no puede dejar sin informe al sueño.
 */
export interface DatosCrudos {
  energia: EnergyLog[];
  rutina: RoutineLog[];
  ejercicio: ExerciseLog[];
  habitos: Habit[];
  marcas: HabitLog[];
  retos: Reto[];
  marcasReto: Array<{ challenge_id: string; date: string }>;
  sesiones: Sesion[];
  entradas: JournalEntry[];
  metas: Objective[];
}

export async function traerDatos(dias: number): Promise<DatosCrudos> {
  // Un poco más de días de los pedidos: las rachas y el "último registro"
  // necesitan mirar un poco antes del comienzo del periodo.
  const margen = dias + 14;
  const vacio: DatosCrudos = {
    energia: [], rutina: [], ejercicio: [], habitos: [], marcas: [],
    retos: [], marcasReto: [], sesiones: [], entradas: [], metas: [],
  };

  const intentar = async <T>(fn: () => Promise<T>, guardar: (v: T) => void) => {
    try {
      guardar(await fn());
    } catch {
      /* módulo sin migrar o sin datos: el informe sigue sin esa parte */
    }
  };

  await Promise.all([
    intentar(() => listEnergy(margen), (v) => { vacio.energia = v; }),
    intentar(() => listRoutine(margen), (v) => { vacio.rutina = v; }),
    intentar(() => listExercise(margen), (v) => { vacio.ejercicio = v; }),
    intentar(() => listHabits(), (v) => { vacio.habitos = v; }),
    intentar(() => listHabitLogs(), (v) => { vacio.marcas = v; }),
    intentar(() => listRetos(), (v) => { vacio.retos = v; }),
    intentar(() => listRetoLogs(), (v) => { vacio.marcasReto = v; }),
    intentar(() => listEntries(Math.max(margen, 60)), (v) => { vacio.entradas = v; }),
    intentar(() => listObjectives(), (v) => { vacio.metas = v; }),
  ]);
  // Las sesiones de Mente viven en este navegador, no en la base.
  vacio.sesiones = listSesiones();
  return vacio;
}

/** Los estados de una meta, escritos como se leen. En la base viven con
 *  guion bajo, y "en_camino" en una hoja que lee otra persona se ve como un
 *  error de la app. */
const ESTADO_META: Record<string, string> = {
  en_camino: "en camino",
  en_riesgo: "en riesgo",
  lograda: "lograda",
  pausada: "pausada",
};

// ---------- Cuentas ----------

const prom = (xs: number[]): number | null =>
  xs.length === 0 ? null : Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10;

function serie(valores: Array<number | null>): SerieNumerica {
  const con = valores.filter((v): v is number => v !== null);
  return {
    conDato: con.length,
    promedio: prom(con),
    minimo: con.length ? Math.min(...con) : null,
    maximo: con.length ? Math.max(...con) : null,
  };
}

/** El lunes de la semana de una fecha. */
function lunesDe(fecha: string): string {
  const d = new Date(`${fecha}T00:00:00Z`);
  const dia = d.getUTCDay(); // 0 domingo
  return sumarDias(fecha, dia === 0 ? -6 : 1 - dia);
}

export function armarInformeBienestar(datos: DatosCrudos, op: OpcionesBienestar): InformeBienestar {
  const { desde, hasta } = op;
  const dias = diasDeRango(desde, hasta);
  const incluye = (a: Area) => op.areas.includes(a);
  const dentro = (f: string) => f >= desde && f <= hasta;

  // Un índice por fecha de cada cosa, para armar el día a día de un pasada.
  const energiaPorDia = new Map(datos.energia.map((e) => [e.date, e]));
  const rutinaPorDia = new Map(datos.rutina.map((r) => [r.date, r]));
  const ejercicioPorDia = new Map<string, ExerciseLog[]>();
  for (const e of datos.ejercicio) {
    ejercicioPorDia.set(e.date, [...(ejercicioPorDia.get(e.date) ?? []), e]);
  }
  const marcasPorDia = new Map<string, number>();
  for (const m of datos.marcas) marcasPorDia.set(m.date, (marcasPorDia.get(m.date) ?? 0) + 1);
  const sesionesPorDia = new Map<string, Sesion[]>();
  for (const s of datos.sesiones) {
    sesionesPorDia.set(s.fecha, [...(sesionesPorDia.get(s.fecha) ?? []), s]);
  }
  const diarioPorDia = new Map<string, number>();
  for (const e of datos.entradas) diarioPorDia.set(e.date, (diarioPorDia.get(e.date) ?? 0) + 1);

  // Los hábitos que ya existían en el periodo. Un hábito creado ayer no
  // puede tener 30 días de adherencia, y contarlo así hundiría el promedio.
  const habitosDelPeriodo = datos.habitos;

  const diario: DiaBienestar[] = [];
  for (let i = 0; i < dias; i += 1) {
    const fecha = sumarDias(desde, i);
    const e = energiaPorDia.get(fecha);
    const r = rutinaPorDia.get(fecha);
    const ejs = ejercicioPorDia.get(fecha) ?? [];
    const ses = sesionesPorDia.get(fecha) ?? [];
    diario.push({
      fecha,
      sueno: r ? sleepHours(r) : null,
      acostarse: r?.bed_time ?? null,
      levantarse: r?.wake_time ?? null,
      energia: e?.energy_level ?? null,
      agua: e ? e.water_cups : null,
      proteina: e?.protein_g ?? null,
      movimientoMin: ejs.reduce((a, x) => a + x.minutes, 0),
      movimientoTipos: [...new Set(ejs.map((x) => x.kind))],
      habitosHechos: marcasPorDia.get(fecha) ?? 0,
      habitosPosibles: habitosDelPeriodo.length,
      menteMin: ses.reduce((a, s) => a + s.minutos, 0),
      menteSesiones: ses.length,
      diarioEntradas: diarioPorDia.get(fecha) ?? 0,
    });
  }

  const sueno = serie(diario.map((d) => d.sueno));
  const energia = serie(diario.map((d) => d.energia));
  const agua = serie(diario.map((d) => d.agua));
  const proteina = serie(diario.map((d) => d.proteina));
  const diasConAlgo = diario.filter((d) =>
    d.sueno !== null || d.energia !== null || d.agua !== null
    || d.movimientoMin > 0 || d.habitosHechos > 0 || d.menteSesiones > 0 || d.diarioEntradas > 0).length;

  // ---------- Movimiento ----------
  const ejerciciosDelPeriodo = datos.ejercicio.filter((e) => dentro(e.date));
  const porTipo = new Map<string, FilaMovimiento>();
  for (const e of ejerciciosDelPeriodo) {
    const v = porTipo.get(e.kind) ?? { tipo: e.kind, sesiones: 0, minutos: 0 };
    v.sesiones += 1;
    v.minutos += e.minutes;
    porTipo.set(e.kind, v);
  }
  const minutosMovimiento = ejerciciosDelPeriodo.reduce((a, e) => a + e.minutes, 0);
  const movimiento = {
    minutos: minutosMovimiento,
    sesiones: ejerciciosDelPeriodo.length,
    diasActivos: diario.filter((d) => d.movimientoMin > 0).length,
    porTipo: [...porTipo.values()].sort((a, b) => b.minutos - a.minutos),
    minutosPorSemana: Math.round((minutosMovimiento / dias) * 7),
  };

  // ---------- Hábitos ----------
  const habitos: FilaHabito[] = habitosDelPeriodo.map((h) => {
    const suyas = datos.marcas.filter((m) => m.habit_id === h.id);
    const enRango = suyas.filter((m) => dentro(m.date));
    const fechas = suyas.map((m) => m.date).sort();
    return {
      id: h.id,
      nombre: h.name,
      icono: h.icon,
      marcas: enRango.length,
      adherencia: Math.round((enRango.length / dias) * 100),
      rachaActual: streakFor(h.id, datos.marcas),
      ultima: fechas.length ? fechas[fechas.length - 1] : null,
    };
  }).sort((a, b) => b.adherencia - a.adherencia);

  const adherenciaHabitos = habitos.length > 0
    ? Math.round(habitos.reduce((a, h) => a + h.adherencia, 0) / habitos.length)
    : null;

  // ---------- Retos ----------
  //
  // Un reto no se mide contra todos los días, sino contra los días en que
  // tocaba: un reto de lunes a viernes no falla los domingos.
  const retos: FilaReto[] = datos.retos.map((r) => {
    const suyos = datos.marcasReto.filter((m) => m.challenge_id === r.id && dentro(m.date));
    let programados = 0;
    for (let i = 0; i < dias; i += 1) {
      const f = sumarDias(desde, i);
      const fin = sumarDias(r.start_date, r.duration_days - 1);
      if (f >= r.start_date && f <= fin && esProgramado(f, r.days_mask)) programados += 1;
    }
    return {
      id: r.id,
      titulo: r.title,
      icono: r.icon,
      cumplidos: suyos.length,
      programados,
      adherencia: programados > 0 ? Math.round((suyos.length / programados) * 100) : 0,
      estado: r.status,
    };
  }).filter((r) => r.programados > 0 || r.cumplidos > 0);

  // ---------- Mente ----------
  const sesionesPeriodo = datos.sesiones.filter((s) => dentro(s.fecha));
  const entradasPeriodo = datos.entradas.filter((e) => dentro(e.date));
  const mente = {
    sesiones: sesionesPeriodo.length,
    minutos: sesionesPeriodo.reduce((a, s) => a + s.minutos, 0),
    diasConPractica: new Set(sesionesPeriodo.map((s) => s.fecha)).size,
    entradasDiario: entradasPeriodo.length,
    entradas: op.conTextoDiario
      ? entradasPeriodo
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((e) => ({ fecha: e.date, pregunta: e.prompt, texto: e.content }))
      : [],
  };

  // ---------- Dirección ----------
  const metas: FilaMeta[] = datos.metas.map((m) => ({
    id: m.id,
    titulo: m.title,
    area: m.area,
    estado: ESTADO_META[m.status] ?? m.status,
    lograda: m.status === "lograda",
    progreso: Math.round(Number(m.progress ?? 0)),
    plazo: m.deadline,
    diasDePlazo: m.deadline ? Math.round(aDias(m.deadline) - aDias(hasta)) : null,
    automatica: Boolean(m.auto_metric),
  })).sort((a, b) => b.progreso - a.progreso);

  // ---------- Semana a semana ----------
  const porSemana = new Map<string, DiaBienestar[]>();
  for (const d of diario) {
    const k = lunesDe(d.fecha);
    porSemana.set(k, [...(porSemana.get(k) ?? []), d]);
  }
  const semanas: FilaSemana[] = [...porSemana.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([inicio, ds]) => ({
      inicio,
      suenoProm: prom(ds.map((d) => d.sueno).filter((v): v is number => v !== null)),
      energiaProm: prom(ds.map((d) => d.energia).filter((v): v is number => v !== null)),
      movimientoMin: ds.reduce((a, d) => a + d.movimientoMin, 0),
      habitosPct: habitosDelPeriodo.length > 0
        ? Math.round((ds.reduce((a, d) => a + d.habitosHechos, 0) / (ds.length * habitosDelPeriodo.length)) * 100)
        : null,
      menteMin: ds.reduce((a, d) => a + d.menteMin, 0),
    }));

  const informe: InformeBienestar = {
    desde, hasta,
    etiqueta: op.etiqueta ?? `${desde} a ${hasta}`,
    dias,
    generado: new Date().toISOString(),
    areas: op.areas,
    diario, semanas, sueno, energia, agua, proteina, diasConAlgo,
    movimiento, habitos, retos, adherenciaHabitos, mente, metas,
    cruces: [],
    hallazgos: [],
  };
  informe.cruces = buscarCruces(informe, incluye);
  informe.hallazgos = buscarHallazgos(informe, incluye);
  return informe;
}

// ---------- Los cruces ----------
//
// Siempre la misma forma: partir los días en dos grupos por algo que pasó, y
// comparar el promedio de otra cosa. Se exige un mínimo de días en cada grupo,
// porque con dos días a un lado cualquier diferencia se ve enorme y no
// significa nada.

const MINIMO_POR_LADO = 4;

function compararDias(
  dias: DiaBienestar[],
  /** Verdadero, falso, o nulo cuando ese día no se puede clasificar.
   *
   *  El nulo importa más de lo que parece. Si "durmió 7 horas o más" se
   *  responde mirando `sueno >= 7`, una noche sin registrar contesta que no, y
   *  entonces el informe termina diciendo que los días que duerme mal cumple
   *  menos hábitos cuando en realidad son días de los que no sabemos nada del
   *  sueño. Un día sin dato no entra en ninguno de los dos grupos. */
  condicion: (d: DiaBienestar) => boolean | null,
  medir: (d: DiaBienestar) => number | null,
): { con: number | null; sin: number | null; diasCon: number; diasSin: number } {
  const grupoCon: number[] = [];
  const grupoSin: number[] = [];
  for (const d of dias) {
    const lado = condicion(d);
    if (lado === null) continue;
    const valor = medir(d);
    if (valor === null) continue;
    (lado ? grupoCon : grupoSin).push(valor);
  }
  return {
    con: prom(grupoCon),
    sin: prom(grupoSin),
    diasCon: grupoCon.length,
    diasSin: grupoSin.length,
  };
}

/** Durmió siete horas o más, o no se sabe porque esa noche no está anotada. */
const durmioBien = (d: DiaBienestar): boolean | null => (d.sueno === null ? null : d.sueno >= 7);

function buscarCruces(inf: InformeBienestar, incluye: (a: Area) => boolean): Cruce[] {
  const cruces: Cruce[] = [];
  const agregar = (c: Omit<Cruce, "confiable">) => {
    cruces.push({
      ...c,
      confiable: c.diasCon >= MINIMO_POR_LADO && c.diasSin >= MINIMO_POR_LADO
        && c.con !== null && c.sin !== null,
    });
  };

  if (incluye("energia") && incluye("movimiento")) {
    const r = compararDias(inf.diario, (d) => d.movimientoMin > 0, (d) => d.energia);
    agregar({
      clave: "energiaMovimiento",
      pregunta: "¿Cómo está tu energía los días que te mueves?",
      conLabel: "Días con movimiento", sinLabel: "Días sin movimiento",
      unidad: "de 5", ...r,
    });
  }

  if (incluye("energia")) {
    const r = compararDias(inf.diario, durmioBien, (d) => d.energia);
    agregar({
      clave: "energiaSueno",
      pregunta: "¿Cómo está tu energía después de dormir 7 horas o más?",
      conLabel: "Tras 7 horas o más", sinLabel: "Tras menos de 7 horas",
      unidad: "de 5", ...r,
    });
  }

  if (incluye("mente") && incluye("energia")) {
    const r = compararDias(inf.diario, (d) => d.menteSesiones > 0, (d) => d.energia);
    agregar({
      clave: "energiaMente",
      pregunta: "¿Cómo está tu energía los días que practicas Mente?",
      conLabel: "Días con práctica", sinLabel: "Días sin práctica",
      unidad: "de 5", ...r,
    });
  }

  if (incluye("movimiento")) {
    // Aquí el lado lo decide el día anterior: se duerme después de moverse.
    const r = compararDias(inf.diario, (d) => d.movimientoMin > 0, (d) => d.sueno);
    agregar({
      clave: "suenoMovimiento",
      pregunta: "¿Duermes distinto los días que te mueves?",
      conLabel: "Noches tras moverte", sinLabel: "Noches sin movimiento",
      unidad: "horas", ...r,
    });
  }

  if (incluye("habitos")) {
    const r = compararDias(inf.diario, durmioBien, (d) => d.habitosHechos);
    agregar({
      clave: "habitosSueno",
      pregunta: "¿Cumples más hábitos cuando duermes bien?",
      conLabel: "Tras 7 horas o más", sinLabel: "Tras menos de 7 horas",
      unidad: "hábitos al día", ...r,
    });
  }

  return cruces;
}

// ---------- Lo que se ve al mirar ----------

function buscarHallazgos(inf: InformeBienestar, incluye: (a: Area) => boolean): Hallazgo[] {
  const h: Hallazgo[] = [];
  const n1 = (x: number) => x.toLocaleString("es-CL", { maximumFractionDigits: 1 });

  if (inf.diasConAlgo === 0) {
    return [{
      clave: "vacio",
      tono: "ojo",
      titulo: "No hay registros en este periodo",
      detalle: "El informe se arma con lo que está anotado en la app. Elige un periodo con registros, o empieza a anotar y vuelve en unas semanas.",
    }];
  }

  // Lo primero: cuánto de este periodo está realmente registrado. Sin esto,
  // todo lo que sigue se puede leer como si fuera la vida entera.
  const cobertura = Math.round((inf.diasConAlgo / inf.dias) * 100);
  h.push({
    clave: "cobertura",
    tono: cobertura >= 70 ? "bien" : cobertura >= 40 ? "ojo" : "alerta",
    titulo: `Hay registros en ${inf.diasConAlgo} de los ${inf.dias} días`,
    detalle: cobertura >= 70
      ? `El ${cobertura} por ciento del periodo está anotado, así que los promedios de abajo son representativos.`
      : `Solo el ${cobertura} por ciento del periodo está anotado. Los promedios salen de esos días y no del periodo completo, conviene leerlos con eso en mente.`,
  });

  if (incluye("energia") && inf.sueno.conDato >= 3) {
    const p = inf.sueno.promedio ?? 0;
    const noches = inf.diario.filter((d) => d.sueno !== null);
    const cortas = noches.filter((d) => (d.sueno ?? 0) < 7).length;
    h.push({
      clave: "sueno",
      tono: p >= 7 ? "bien" : p >= 6 ? "ojo" : "alerta",
      titulo: `Duermes ${n1(p)} horas en promedio`,
      detalle: `Sobre ${inf.sueno.conDato} noches registradas, entre ${n1(inf.sueno.minimo ?? 0)} y ${n1(inf.sueno.maximo ?? 0)} horas. ${cortas} de esas noches quedaron bajo las 7 horas.`,
    });
  }

  if (incluye("energia") && inf.energia.conDato >= 3) {
    const p = inf.energia.promedio ?? 0;
    h.push({
      clave: "energia",
      tono: p >= 3.5 ? "bien" : p >= 2.5 ? "ojo" : "alerta",
      titulo: `Tu energía promedio es ${n1(p)} de 5`,
      detalle: `Anotada en ${inf.energia.conDato} días. El día más bajo fue ${n1(inf.energia.minimo ?? 0)} y el más alto ${n1(inf.energia.maximo ?? 0)}.`,
    });
  }

  if (incluye("movimiento")) {
    const pct = Math.round((inf.movimiento.diasActivos / inf.dias) * 100);
    h.push({
      clave: "movimiento",
      tono: inf.movimiento.minutosPorSemana >= 150 ? "bien" : inf.movimiento.minutosPorSemana >= 75 ? "ojo" : "alerta",
      titulo: `Te mueves ${inf.movimiento.minutosPorSemana} minutos por semana`,
      detalle: `${inf.movimiento.sesiones} sesiones en ${inf.movimiento.diasActivos} días distintos, el ${pct} por ciento de los días del periodo. La recomendación habitual de actividad es 150 minutos semanales.`,
    });
  }

  if (incluye("habitos") && inf.habitos.length > 0) {
    const mejor = inf.habitos[0];
    const peor = inf.habitos[inf.habitos.length - 1];
    h.push({
      clave: "habitos",
      tono: (inf.adherenciaHabitos ?? 0) >= 60 ? "bien" : (inf.adherenciaHabitos ?? 0) >= 30 ? "ojo" : "alerta",
      titulo: `Cumples tus hábitos el ${inf.adherenciaHabitos} por ciento de los días`,
      detalle: `El más constante es ${mejor.nombre}, con ${mejor.adherencia} por ciento${
        inf.habitos.length > 1 ? `, y el que más cuesta es ${peor.nombre}, con ${peor.adherencia} por ciento` : ""}.`,
    });

    const abandonados = inf.habitos.filter((x) => x.marcas === 0);
    if (abandonados.length > 0) {
      h.push({
        clave: "habitosSinMarcar",
        tono: "ojo",
        titulo: `${abandonados.length} ${abandonados.length === 1 ? "hábito no se marcó" : "hábitos no se marcaron"} ni una vez`,
        detalle: `${abandonados.map((x) => x.nombre).join(", ")}. O dejaron de tener sentido y conviene sacarlos, o son justo los que necesitan ayuda.`,
      });
    }
  }

  if (incluye("mente")) {
    if (inf.mente.sesiones > 0) {
      h.push({
        clave: "mente",
        tono: inf.mente.diasConPractica >= inf.dias * 0.3 ? "bien" : "ojo",
        titulo: `${inf.mente.sesiones} prácticas de Mente, ${inf.mente.minutos} minutos`,
        detalle: `En ${inf.mente.diasConPractica} días distintos${
          inf.mente.entradasDiario > 0 ? `, y escribiste en el diario ${inf.mente.entradasDiario} ${inf.mente.entradasDiario === 1 ? "vez" : "veces"}` : ""}.`,
      });
    } else if (inf.mente.entradasDiario > 0) {
      h.push({
        clave: "menteSoloDiario",
        tono: "ojo",
        titulo: `Escribiste en el diario ${inf.mente.entradasDiario} ${inf.mente.entradasDiario === 1 ? "vez" : "veces"}`,
        detalle: "No hay prácticas registradas en este periodo. Las sesiones de Mente se guardan en el navegador donde las hiciste, así que si practicaste en otro dispositivo no aparecen aquí.",
      });
    }
  }

  if (incluye("direccion") && inf.metas.length > 0) {
    const activas = inf.metas.filter((m) => !m.lograda);
    const logradas = inf.metas.filter((m) => m.lograda);
    const vencidas = activas.filter((m) => m.diasDePlazo !== null && m.diasDePlazo < 0);
    h.push({
      clave: "metas",
      tono: vencidas.length > 0 ? "ojo" : "bien",
      titulo: `${activas.length} ${activas.length === 1 ? "meta activa" : "metas activas"}${logradas.length > 0 ? `, ${logradas.length} lograda${logradas.length === 1 ? "" : "s"}` : ""}`,
      detalle: activas.length === 0
        ? "No hay metas en curso en este periodo."
        : `Avance promedio de ${Math.round(activas.reduce((a, m) => a + m.progreso, 0) / activas.length)} por ciento.${
          vencidas.length > 0 ? ` ${vencidas.length} ${vencidas.length === 1 ? "pasó" : "pasaron"} su plazo: ${vencidas.map((m) => m.titulo).join(", ")}.` : ""}`,
    });
  }

  // Los cruces que se sostienen y muestran una diferencia que vale la pena
  // mirar. El corte no es un test estadístico y no se presenta como tal: es
  // "esto se ve en tus días, mírenlo juntos".
  for (const c of inf.cruces) {
    if (!c.confiable || c.con === null || c.sin === null) continue;
    const dif = c.con - c.sin;
    const relevante = Math.abs(dif) >= (c.unidad === "horas" ? 0.5 : c.unidad === "de 5" ? 0.4 : 0.5);
    if (!relevante) continue;
    h.push({
      clave: `cruce-${c.clave}`,
      tono: "ojo",
      titulo: c.pregunta,
      detalle: `${c.conLabel}, ${n1(c.con)} ${c.unidad} (${c.diasCon} días). ${c.sinLabel}, ${n1(c.sin)} ${c.unidad} (${c.diasSin} días). La diferencia es de ${n1(Math.abs(dif))}. Es lo que muestran tus registros, no una relación probada.`,
    });
  }

  return h;
}
