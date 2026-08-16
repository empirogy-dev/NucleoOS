import type { Tx } from "./types";
import { hoyLocal } from "../lib/fechas";

// Lo que se te cobra solo.
//
// Una suscripción y una compra en cuotas son, para la app, la misma cosa: una
// serie de cargos del mismo comercio, por el mismo monto, cada tantos días. La
// única diferencia es si termina o no. Por eso hay UN detector y no dos: la
// serie se encuentra sola desde los movimientos que ya están, y lo único que
// hace falta preguntar es "¿cuántas cuotas son?".
//
// Nada de esto se guarda: se calcula cada vez desde el libro de movimientos.
// Una tabla de suscripciones escrita a mano se desactualiza el día que suben
// el precio, y entonces miente. Los cargos no mienten.

export type Cadencia = "semanal" | "quincenal" | "mensual" | "bimestral" | "trimestral" | "semestral" | "anual";

/** Cada cadencia con su rango de días aceptable y sus días típicos.
 *
 *  Los rangos son anchos a propósito: un cobro "mensual" cae el 3, el 5 y
 *  otra vez el 3, y los bancos publican con uno o dos días de atraso. Exigir
 *  treinta días exactos dejaría fuera casi todas las suscripciones reales.
 */
const CADENCIAS: Array<{ nombre: Cadencia; min: number; max: number; dias: number }> = [
  { nombre: "semanal", min: 6, max: 8, dias: 7 },
  { nombre: "quincenal", min: 12, max: 17, dias: 14 },
  { nombre: "mensual", min: 25, max: 36, dias: 30.44 },
  { nombre: "bimestral", min: 55, max: 70, dias: 60.9 },
  { nombre: "trimestral", min: 82, max: 100, dias: 91.3 },
  { nombre: "semestral", min: 170, max: 195, dias: 182.6 },
  { nombre: "anual", min: 350, max: 380, dias: 365.25 },
];

const DIAS_DEL_MES = 30.4375;

export interface Serie {
  /** Identificador estable entre recargas: comercio más el primer monto. Es
   *  lo que amarra la serie con lo que la persona decidió sobre ella. */
  clave: string;
  /** El movimiento más antiguo de la serie. Segundo amarre, por si el
   *  comercio cambia de nombre o sube de precio. */
  anclaId: string;
  nombre: string;
  txs: Tx[];
  /** Lo que cuesta hoy: el último cargo, no el promedio. */
  monto: number;
  /** Lo que costaba antes, si subió o bajó de precio. */
  montoAnterior: number | null;
  cadencia: Cadencia;
  diasEntre: number;
  alMes: number;
  alAno: number;
  primera: string;
  ultima: string;
  /** Cuándo debería llegar el próximo cargo. */
  proxima: string;
  /** Si el último cargo es tan viejo que ya no parece viva. */
  activa: boolean;
  categoriaId: string | null;
  currency: string;
}

// Palabras que aparecen en la glosa del banco y no dicen nada del comercio.
// Sin sacarlas, "PREAUTHORIZED DEBIT NETFLIX" y "NETFLIX" quedan como dos
// comercios distintos y la serie nunca se arma.
const RUIDO = new Set([
  "pos", "purchase", "payment", "pmt", "debit", "credit", "card", "visa", "mastercard",
  "amex", "recurring", "preauthorized", "preauth", "autopay", "transaction", "trans",
  "ref", "inc", "llc", "ltd", "corp", "com", "www", "http", "https", "the", "and",
  "compra", "pago", "cargo", "tarjeta", "debito", "credito", "por", "para", "con",
]);

/** El nombre del comercio reducido a lo que se repite igual todos los meses. */
export function claveComercio(t: Tx): string {
  const crudo = (t.merchant ?? "").trim() || (t.bank_ref ?? "").trim() || (t.description ?? "").trim();
  const limpio = crudo
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    // Fuera números y símbolos: los bancos meten folios y fechas en la glosa,
    // y eso cambia en cada cargo. Lo que queda es el nombre.
    .replace(/[^a-z]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const tokens = limpio.split(" ").filter((p) => p.length >= 3 && !RUIDO.has(p));
  return tokens.slice(0, 2).join(" ");
}

const aDias = (f: string): number => new Date(`${f}T00:00:00Z`).getTime() / 86400000;

const sumarDias = (f: string, n: number): string => {
  const d = new Date(`${f}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + Math.round(n));
  return d.toISOString().slice(0, 10);
};

const mediana = (xs: number[]): number => {
  const o = [...xs].sort((a, b) => a - b);
  const m = Math.floor(o.length / 2);
  return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2;
};

/** Dos montos que son "el mismo": un peso de diferencia en una cuenta de
 *  cincuenta dólares sigue siendo el mismo cobro. */
const mismoMonto = (a: number, b: number): boolean =>
  Math.abs(a - b) <= Math.max(0.02, Math.min(a, b) * 0.02);

/** Parte los cargos de un comercio en grupos por monto.
 *
 *  Hace falta porque un mismo comercio puede cobrar dos cosas distintas a la
 *  vez. El caso real: Klarna cobra las cuotas de la antena Y el servicio
 *  mensual de internet. Sin separarlos por monto, quedan como una sola serie
 *  con cargos cada quince días que no significa nada.
 */
function agruparPorMonto(txs: Tx[]): Tx[][] {
  const orden = [...txs].sort((a, b) => Number(a.amount) - Number(b.amount));
  const grupos: Tx[][] = [];
  for (const t of orden) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && mismoMonto(Number(ultimo[ultimo.length - 1].amount), Number(t.amount))) ultimo.push(t);
    else grupos.push([t]);
  }
  return grupos;
}

/** Vuelve a juntar los grupos que en realidad son un cambio de precio.
 *
 *  Netflix a 15,99 durante dos años y a 17,99 desde marzo son UNA suscripción
 *  que subió, no dos. Se reconoce porque los dos grupos no se pisan en el
 *  tiempo: uno termina donde empieza el otro. Si los cargos se intercalan, son
 *  dos cosas distintas cobradas en paralelo y se dejan separadas.
 */
function unirCambiosDePrecio(grupos: Tx[][]): Tx[][] {
  const rango = (g: Tx[]) => {
    const fechas = g.map((t) => t.date).sort();
    return { desde: fechas[0], hasta: fechas[fechas.length - 1] };
  };

  const actual = grupos.map((g) => [...g]);
  let hubo = true;
  while (hubo) {
    hubo = false;
    salir: for (let i = 0; i < actual.length; i += 1) {
      for (let j = i + 1; j < actual.length; j += 1) {
        const a = actual[i], b = actual[j];
        const ma = Number(a[0].amount), mb = Number(b[0].amount);
        const razon = Math.max(ma, mb) / Math.min(ma, mb);
        // Un cambio de precio es un ajuste, no otro producto. El doble ya no
        // es "te subieron la cuenta", es otra cosa.
        if (razon > 2) continue;
        const ra = rango(a), rb = rango(b);
        const separados = ra.hasta < rb.desde || rb.hasta < ra.desde;
        if (!separados) continue;
        actual[i] = [...a, ...b];
        actual.splice(j, 1);
        hubo = true;
        break salir;
      }
    }
  }
  return actual;
}

/** El nombre más presentable que aparece en los cargos de la serie.
 *
 *  Se prefiere el comercio por sobre la glosa del banco, y el más corto entre
 *  los que hay: la glosa larga suele traer folios pegados. */
function nombreDe(txs: Tx[]): string {
  const candidatos = txs
    .map((t) => (t.merchant ?? "").trim() || (t.description ?? "").trim() || (t.bank_ref ?? "").trim())
    .filter(Boolean)
    .sort((a, b) => a.length - b.length);
  return candidatos[0] ?? "Sin nombre";
}

export interface OpcionesRecurrentes {
  /** Para poder fijar "hoy" en las pruebas. */
  hoy?: string;
  /** Moneda de cada movimiento, si se sabe. */
  monedaDe?: (t: Tx) => string;
}

/**
 * Encuentra las series de cargos que se repiten.
 *
 * Solo gastos: las transferencias son plata que se mueve entre cuentas tuyas
 * y los pagos de tarjeta caerían aquí como si fueran una suscripción. Lo
 * reembolsado tampoco, porque no lo pagaste tú.
 */
export function buscarRecurrentes(txs: Tx[], opts: OpcionesRecurrentes = {}): Serie[] {
  const hoy = opts.hoy ?? hoyLocal();
  const gastos = txs.filter((t) =>
    t.type === "expense" && !t.mirror_of && !t.reimbursed && Number(t.amount) > 0);

  const porComercio = new Map<string, Tx[]>();
  for (const t of gastos) {
    const clave = claveComercio(t);
    if (!clave) continue;
    porComercio.set(clave, [...(porComercio.get(clave) ?? []), t]);
  }

  const series: Serie[] = [];
  for (const [comercio, lista] of porComercio) {
    if (lista.length < 2) continue;

    for (const grupo of unirCambiosDePrecio(agruparPorMonto(lista))) {
      // El mismo cargo por el mismo monto con uno o dos días de diferencia es
      // un cargo anotado dos veces: el banco lo trajo y además se creó desde
      // la boleta. Se deja uno solo. Si no, esa brecha de un día arruina el
      // ritmo de toda la serie y la suscripción desaparece de la lista por
      // culpa de un repetido que ni siquiera es plata de verdad.
      const orden: Tx[] = [];
      for (const t of [...grupo].sort((a, b) => a.date.localeCompare(b.date))) {
        const ultimo = orden[orden.length - 1];
        if (ultimo && aDias(t.date) - aDias(ultimo.date) < 5) continue;
        orden.push(t);
      }
      if (orden.length < 2) continue;

      const brechas: number[] = [];
      for (let i = 1; i < orden.length; i += 1) brechas.push(aDias(orden[i].date) - aDias(orden[i - 1].date));
      const med = mediana(brechas);

      const cad = CADENCIAS.find((c) => med >= c.min && med <= c.max);
      if (!cad) continue;

      // Con dos cargos y cadencia corta no hay serie: son dos compras que
      // costaron lo mismo. Desde tres meses seguidos ya es un patrón. Para lo
      // trimestral y lo anual se aceptan dos, porque esperar tres años para
      // avisarte de un cobro anual no le sirve a nadie.
      const minimo = cad.dias >= 82 ? 2 : 3;
      if (orden.length < minimo) continue;

      // Y las brechas tienen que parecerse entre ellas: si un mes pasan 30
      // días y al otro 90, eso no se cobra solo, lo compraste tú cuando te
      // acordaste.
      //
      // Con una salvedad: en una serie larga se perdona una brecha rara cada
      // cuatro. A veces el cobro falla y se reintenta al mes siguiente, y esa
      // suscripción sigue siendo una suscripción. En una serie corta no se
      // perdona ninguna, porque ahí la brecha rara ES toda la evidencia.
      const raras = brechas.filter((b) => b < med * 0.55 || b > med * 1.6).length;
      if (raras > Math.floor(brechas.length / 4)) continue;

      const ultimaTx = orden[orden.length - 1];
      const monto = Number(ultimaTx.amount);
      const primerMonto = Number(orden[0].amount);
      const alMes = (monto * DIAS_DEL_MES) / cad.dias;

      series.push({
        clave: `${comercio}|${primerMonto.toFixed(2)}`,
        anclaId: orden[0].id,
        nombre: nombreDe(orden),
        txs: orden,
        monto,
        montoAnterior: mismoMonto(monto, primerMonto) ? null : primerMonto,
        cadencia: cad.nombre,
        diasEntre: med,
        alMes,
        alAno: alMes * 12,
        primera: orden[0].date,
        ultima: ultimaTx.date,
        proxima: sumarDias(ultimaTx.date, cad.dias),
        // Si ya pasó más de una vez y media el intervalo, dejó de llegar. Con
        // el margen justo, un cobro que se atrasó tres días aparecería muerto.
        activa: aDias(hoy) - aDias(ultimaTx.date) <= cad.dias * 1.6,
        categoriaId: ultimaTx.category_id,
        currency: opts.monedaDe?.(ultimaTx) ?? "CAD",
      });
    }
  }

  // Lo más caro al año primero: ahí es donde conviene mirar si vale la pena.
  return series.sort((a, b) => b.alAno - a.alAno);
}

// ---------- Las cuotas ----------

export interface ProgresoCuotas {
  pagadas: number;
  total: number;
  restantes: number;
  montoRestante: number;
  montoTotal: number;
  /** Cuándo cae la última cuota, si el ritmo se mantiene. */
  termina: string;
  completa: boolean;
}

export function progresoCuotas(s: Serie, total: number): ProgresoCuotas {
  const pagadas = Math.min(s.txs.length, total);
  const restantes = Math.max(0, total - pagadas);
  return {
    pagadas,
    total,
    restantes,
    montoRestante: restantes * s.monto,
    montoTotal: total * s.monto,
    termina: sumarDias(s.ultima, s.diasEntre * restantes),
    completa: restantes === 0,
  };
}
