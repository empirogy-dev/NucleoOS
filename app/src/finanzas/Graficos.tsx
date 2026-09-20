import { useId } from "react";
import {
  GROSOR_DONA,
  RADIO_DONA,
  colorSerie,
  geometriaColumnas,
  segmentosDona,
  type ColumnaMes,
} from "./formasGrafico";

// Los gráficos del informe, dibujados a mano en SVG.
//
// No se suma una librería de gráficos por tres formas: la dona es un círculo
// con trazos, las columnas son rectángulos y el rango es un div con ancho en
// porcentaje. Una librería traería trescientos kilobytes, su propia tipografía
// y sus colores, y habría que pelear con ella para que respetara el tema.
//
// Todos son decorativos para el lector de pantalla (aria-hidden) porque el
// mismo dato está siempre escrito al lado en texto. Un lector de pantalla no
// gana nada leyendo un círculo.

export interface DatoDona {
  nombre: string;
  valor: number;
  icono?: string | null;
}

export function Dona({ datos, titulo, centro, subcentro, fmt, maximo = 9 }: {
  datos: DatoDona[];
  titulo?: string;
  /** Lo que va escrito en el hueco del medio. */
  centro: string;
  subcentro?: string;
  fmt: (n: number) => string;
  /** Cuántas porciones antes de juntar el resto en "Otros". */
  maximo?: number;
}) {
  // Con veinte categorías la dona se vuelve un arcoíris ilegible. Las que no
  // caben se juntan en una sola porción, que sigue siendo verdad.
  const ordenados = [...datos].sort((a, b) => b.valor - a.valor);
  const visibles = ordenados.slice(0, maximo);
  const resto = ordenados.slice(maximo);
  const lista = resto.length > 0
    ? [...visibles, { nombre: "Otros", valor: resto.reduce((s, d) => s + d.valor, 0) }]
    : visibles;

  const segmentos = segmentosDona(lista.map((d) => d.valor));
  const total = lista.reduce((s, d) => s + d.valor, 0);
  const lado = (RADIO_DONA + GROSOR_DONA) * 2;

  if (segmentos.length === 0) {
    return <p style={{ color: "var(--muted)", fontSize: 13.5 }}>Sin gastos en este periodo.</p>;
  }

  return (
    <div style={{ display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ position: "relative", width: 190, flex: "none" }}>
        <svg viewBox={`0 0 ${lado} ${lado}`} width="190" height="190" aria-hidden role="presentation">
          <g transform={`rotate(-90 ${lado / 2} ${lado / 2})`}>
            {segmentos.map((s, i) => (
              <circle
                key={i}
                cx={lado / 2}
                cy={lado / 2}
                r={RADIO_DONA}
                fill="none"
                stroke={s.color}
                strokeWidth={GROSOR_DONA}
                strokeDasharray={s.dash}
                strokeDashoffset={s.offset}
              />
            ))}
          </g>
        </svg>
        <div style={{
          position: "absolute", inset: 0, display: "grid", placeItems: "center",
          textAlign: "center", pointerEvents: "none",
        }}>
          <div>
            {titulo && <div style={{ fontSize: 10.5, color: "var(--muted)", letterSpacing: ".08em", textTransform: "uppercase" }}>{titulo}</div>}
            {/* El hueco de la dona mide unos 100 píxeles: con 19 el monto se
                salía por los lados y quedaba encima del anillo. */}
            <div className="tnum" style={{ fontFamily: "var(--serif)", fontSize: 15.5, fontWeight: 500, lineHeight: 1.25, maxWidth: 104 }}>{centro}</div>
            {subcentro && <div style={{ fontSize: 11, color: "var(--muted)" }}>{subcentro}</div>}
          </div>
        </div>
      </div>

      <ul style={{ flex: 1, minWidth: 210, listStyle: "none", margin: 0, padding: 0 }}>
        {lista.map((d, i) => (
          <li key={d.nombre} style={{ display: "flex", alignItems: "center", gap: 9, padding: "5px 0", fontSize: 13 }}>
            <span aria-hidden style={{
              width: 10, height: 10, borderRadius: 3, background: colorSerie(i), flex: "none",
            }} />
            <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {d.icono ? `${d.icono} ` : ""}{d.nombre}
            </span>
            <b className="tnum" style={{ fontWeight: 600 }}>{fmt(d.valor)}</b>
            <span className="tnum" style={{ color: "var(--muted)", width: 38, textAlign: "right" }}>
              {total > 0 ? Math.round((d.valor / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Ingresos y gastos, mes a mes. La columna clara es lo que entró y la
 *  oscura lo que salió, que es como se lee de un vistazo si el mes cerró. */
export function ColumnasMeses({ datos, fmt, destacado }: {
  datos: ColumnaMes[];
  fmt: (n: number) => string;
  /** Los meses que están dentro del periodo elegido. Los demás se atenúan. */
  destacado?: (mes: string) => boolean;
}) {
  const id = useId();
  // El lienzo es angosto a propósito: dentro de una tarjeta el gráfico mide
  // unos 400 píxeles, y un lienzo de 700 se achicaría hasta dejar la mitad de
  // la tarjeta en blanco. La altura la calcula el navegador desde el viewBox.
  const g = geometriaColumnas(datos, 420, 210);
  if (datos.length === 0) return null;

  return (
    <div>
      <svg viewBox={`0 0 ${g.ancho} ${g.alto}`} style={{ width: "100%", height: "auto" }}
        preserveAspectRatio="xMidYMid meet" aria-hidden role="presentation">
        {g.guias.map((li, i) => (
          <g key={`${id}-g${i}`}>
            <line x1={0} x2={g.ancho} y1={li.y} y2={li.y} stroke="var(--line)" strokeWidth={1} />
            {/* Solo la línea de arriba lleva su cifra, y va por debajo de la
                línea: arriba se sale del lienzo. Sin ninguna cifra las
                columnas no se pueden leer, y con las tres el gráfico se
                llena de números y deja de mirarse. */}
            {li.valor > 0 && i === g.guias.length - 1 && (
              <text x={2} y={li.y + 12} fontSize={10.5} fill="var(--muted)" fontFamily="var(--sans)">{fmt(li.valor)}</text>
            )}
          </g>
        ))}
        {g.barras.map((b) => {
          const dentro = destacado ? destacado(b.mes) : true;
          return (
            <g key={b.mes} opacity={dentro ? 1 : 0.42}>
              <rect x={b.xIngreso} y={b.yIngreso} width={b.anchoBarra} height={b.altoIngreso}
                rx={3} fill="var(--ok)" />
              <rect x={b.xGasto} y={b.yGasto} width={b.anchoBarra} height={b.altoGasto}
                rx={3} fill="var(--err)" />
              <text x={b.xCentro} y={g.alto - 6} textAnchor="middle"
                fontSize={11} fill="var(--muted)" fontFamily="var(--sans)">{b.etiqueta}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span aria-hidden style={{ width: 10, height: 10, borderRadius: 3, background: "var(--ok)" }} />
          Entró, tope {fmt(Math.max(...datos.map((d) => d.ingresos), 0))}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span aria-hidden style={{ width: 10, height: 10, borderRadius: 3, background: "var(--err)" }} />
          Salió, tope {fmt(Math.max(...datos.map((d) => d.gastos), 0))}
        </span>
      </div>
    </div>
  );
}

/** Una barra que muestra un rango, no un número: "entre 70 y 95 al mes".
 *  Un rango se dibuja así porque un rango es lo que de verdad se sabe. */
export function BarraRango({ min, max, tope, etiqueta, nota, fmt }: {
  min: number;
  max: number;
  tope: number;
  etiqueta: string;
  nota?: string;
  fmt: (n: number) => string;
}) {
  const pctMin = tope > 0 ? Math.min(100, (min / tope) * 100) : 0;
  const pctMax = tope > 0 ? Math.min(100, (max / tope) * 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13, marginBottom: 6 }}>
        <span style={{ color: "var(--ink-soft)" }}>{etiqueta}</span>
        <b className="tnum" style={{ whiteSpace: "nowrap" }}>{fmt(min)} a {fmt(max)}</b>
      </div>
      <div className="track" style={{ height: 10, position: "relative" }}>
        <div className="fill" style={{ width: `${pctMax}%`, background: "var(--accent-wash)" }} />
        <div className="fill" style={{
          width: `${pctMin}%`, background: "var(--fin)", position: "absolute", top: 0, left: 0,
        }} />
      </div>
      {nota && <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>{nota}</div>}
    </div>
  );
}
