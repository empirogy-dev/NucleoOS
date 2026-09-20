// La geometría de los gráficos, sin React adentro.
//
// Los mismos gráficos se dibujan en dos partes: en la pestaña, con
// componentes, y dentro del informe que se exporta, que es un archivo HTML
// armado con texto. Si cada uno calculara sus propios ángulos, tarde o
// temprano el informe y la pantalla mostrarían cosas distintas, que es el
// peor error posible en algo que habla de plata.
//
// La dona se dibuja con un círculo y trazos discontinuos en vez de arcos.
// Suena raro y es mucho más seguro: un arco de 360 grados exactos no se puede
// dibujar (el punto de partida y el de llegada son el mismo y el trazo
// desaparece), y una sola categoría que se lleve todo el gasto es un caso
// perfectamente normal.

/** Colores de las series. Tonos lavados, del mismo mundo que los temas.
 *  No dependen del tema elegido a propósito: el informe exportado se imprime
 *  en blanco y tiene que verse igual que en pantalla. */
export const PALETA_GRAFICO = [
  "#4F6B5B", "#7FA38C", "#C9A98A", "#D0937C", "#C0A052",
  "#7FA3BE", "#9A92C0", "#BF90A8", "#6FA79A", "#A8B89E",
  "#CF9E77", "#8C9A8E",
];

export const colorSerie = (i: number): string => PALETA_GRAFICO[i % PALETA_GRAFICO.length];

export interface SegmentoDona {
  color: string;
  /** El valor del atributo stroke-dasharray del círculo. */
  dash: string;
  /** El valor del atributo stroke-dashoffset. */
  offset: number;
  valor: number;
  pct: number;
}

export const RADIO_DONA = 60;
export const GROSOR_DONA = 26;

/**
 * Los trazos de la dona, en el orden en que se dibujan.
 *
 * Cada segmento es el mismo círculo pintado con un trazo discontinuo: se ve
 * solo el pedazo que le toca, y el resto queda invisible. El pedacito de aire
 * entre segmentos se descuenta del largo, no se agrega, para que la suma siga
 * dando la vuelta completa.
 */
export function segmentosDona(valores: number[], aire = 1.5): SegmentoDona[] {
  const total = valores.reduce((s, n) => s + Math.max(0, n), 0);
  const circunferencia = 2 * Math.PI * RADIO_DONA;
  if (total <= 0) return [];
  let recorrido = 0;
  return valores.map((v, i) => {
    const valor = Math.max(0, v);
    const largo = (valor / total) * circunferencia;
    // El aire solo cabe si el segmento es más grande que el aire mismo. En una
    // categoría de medio por ciento, descontarlo la haría desaparecer.
    const visible = valores.length > 1 && largo > aire * 2 ? largo - aire : largo;
    const seg: SegmentoDona = {
      color: colorSerie(i),
      dash: `${visible.toFixed(2)} ${(circunferencia - visible).toFixed(2)}`,
      offset: -recorrido,
      valor,
      pct: (valor / total) * 100,
    };
    recorrido += largo;
    return seg;
  });
}

// ---------- Las columnas del mes a mes ----------

export interface ColumnaMes {
  mes: string;
  ingresos: number;
  gastos: number;
}

export interface GeometriaColumnas {
  ancho: number;
  alto: number;
  /** Las líneas horizontales con su valor, para leer la altura. */
  guias: Array<{ y: number; valor: number }>;
  barras: Array<{
    mes: string;
    etiqueta: string;
    xIngreso: number;
    xGasto: number;
    anchoBarra: number;
    yIngreso: number;
    altoIngreso: number;
    yGasto: number;
    altoGasto: number;
    xCentro: number;
  }>;
}

const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** "2026-09" se lee como "sep". En enero se agrega el año, que es cuando
 *  cambia y cuando uno se pierde mirando el gráfico. */
export function etiquetaMes(ym: string): string {
  const [a, m] = ym.split("-").map(Number);
  const nombre = MESES_CORTOS[(m - 1) % 12] ?? ym;
  return m === 1 ? `${nombre} ${String(a).slice(2)}` : nombre;
}

/** Un número redondo por encima del máximo, para que la guía de arriba sea
 *  legible: 4.320 sube a 5.000 y no a 4.500. */
function techo(n: number): number {
  if (n <= 0) return 1;
  const escala = 10 ** Math.floor(Math.log10(n));
  const paso = escala / 2;
  return Math.ceil(n / paso) * paso;
}

export function geometriaColumnas(
  datos: ColumnaMes[],
  ancho = 720,
  alto = 210,
  margenIzq = 8,
  margenAbajo = 22,
): GeometriaColumnas {
  const max = techo(Math.max(1, ...datos.map((d) => Math.max(d.ingresos, d.gastos))));
  const altoUtil = alto - margenAbajo;
  const anchoUtil = ancho - margenIzq;
  const paso = datos.length > 0 ? anchoUtil / datos.length : anchoUtil;
  // Dos barras por mes, con aire entre meses. El ancho se adapta a cuántos
  // meses hay: con doce quedan finitas y con seis quedan cómodas.
  const anchoBarra = Math.max(4, Math.min(22, (paso - 10) / 2));
  const y = (v: number) => altoUtil - (v / max) * altoUtil;

  const guias = [0, 0.5, 1].map((f) => ({ y: altoUtil - f * altoUtil, valor: max * f }));

  const barras = datos.map((d, i) => {
    const centro = margenIzq + paso * i + paso / 2;
    return {
      mes: d.mes,
      etiqueta: etiquetaMes(d.mes),
      anchoBarra,
      xIngreso: centro - anchoBarra - 1,
      xGasto: centro + 1,
      yIngreso: y(d.ingresos),
      altoIngreso: Math.max(d.ingresos > 0 ? 1 : 0, altoUtil - y(d.ingresos)),
      yGasto: y(d.gastos),
      altoGasto: Math.max(d.gastos > 0 ? 1 : 0, altoUtil - y(d.gastos)),
      xCentro: centro,
    };
  });

  return { ancho, alto, guias, barras };
}
