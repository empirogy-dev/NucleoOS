import {
  GROSOR_DONA,
  RADIO_DONA,
  colorSerie,
  etiquetaMes,
  geometriaColumnas,
  segmentosDona,
} from "./formasGrafico";
import { plata, textoCadencia, type Informe } from "./reporte";
import type { Tx } from "./types";

// El informe que sale de la app para que lo lea otra persona.
//
// Son tres formas de lo mismo, y cada una existe por una razón distinta:
//
//  - El informe: una página armada para imprimir. Desde ahí el navegador
//    guarda un PDF, que es lo que uno manda por correo a un contador o a un
//    asesor. No se usa una librería de PDF: el motor de impresión ya sabe
//    paginar y lo hace mejor de lo que lo haría yo a mano.
//  - La planilla: los movimientos en CSV, uno por fila, con todo resuelto en
//    texto. Es lo que abre Excel y lo que lee cualquier programa contable.
//  - El paquete: un ZIP con las dos cosas más las tablas de resumen, para
//    entregar todo de una vez sin explicar nada.
//
// Nada de esto pasa por el servidor. El archivo se arma en el navegador y se
// baja, así que la plata de la persona no viaja a ninguna parte.

const esc = (s: string): string =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const pct = (n: number): string => `${Math.round(n)}%`;

export function descargarArchivo(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 6000);
}

/** Abre el informe en una pestaña y manda a imprimir. Si el navegador bloquea
 *  la ventana, se baja el archivo, que es lo segundo mejor. */
export function imprimirInforme(html: string, nombre: string): void {
  const v = window.open("", "_blank");
  if (!v) {
    descargarArchivo(new Blob([html], { type: "text/html;charset=utf-8" }), `${nombre}.html`);
    return;
  }
  v.document.write(html);
  v.document.close();
  v.focus();
  setTimeout(() => v.print(), 400);
}

// ---------- Las planillas ----------

const celda = (s: string | number): string => `"${String(s).replace(/"/g, '""')}"`;
/** Con el BOM adelante, Excel abre las tildes bien. Sin él, "Educación" se ve
 *  como "EducaciÃ³n" y la planilla parece rota aunque los datos estén bien. */
const csv = (filas: Array<Array<string | number>>): string =>
  "﻿" + filas.map((f) => f.map(celda).join(",")).join("\r\n");

const TIPO_TEXTO: Record<string, string> = {
  income: "Ingreso",
  expense: "Gasto",
  transfer: "Traspaso",
};

const FUENTE_TEXTO: Record<string, string> = {
  manual: "A mano",
  voz: "Por voz",
  recibo: "Desde una boleta",
  cartola: "Desde una cartola",
  banco: "Del banco",
};

/** Lo que la pestaña sabe de cada movimiento y el informe no: cómo se llama
 *  su categoría, de qué cuenta salió y qué etiquetas tiene. */
export interface ResueltoTx {
  categoria: string;
  cuenta: string;
  etiquetas: string;
  moneda: string;
  recurrente: boolean;
}

export function csvMovimientos(inf: Informe, resolver: (t: Tx) => ResueltoTx): string {
  const filas: Array<Array<string | number>> = [[
    "Fecha", "Tipo", "Descripción", "Comercio", "Categoría", "Etiquetas",
    "Monto", "Moneda", "Cuenta o tarjeta", "Origen del dato", "Cargo recurrente", "Reembolsado",
  ]];
  for (const t of inf.movimientos) {
    const r = resolver(t);
    filas.push([
      t.date,
      TIPO_TEXTO[t.type] ?? t.type,
      t.description ?? "",
      t.merchant ?? "",
      r.categoria,
      r.etiquetas,
      Number(t.amount).toFixed(2),
      r.moneda,
      r.cuenta,
      FUENTE_TEXTO[t.source] ?? t.source,
      r.recurrente ? "Sí" : "No",
      t.reimbursed ? "Sí" : "No",
    ]);
  }
  return csv(filas);
}

export function csvCategorias(inf: Informe): string {
  return csv([
    ["Categoría", "Total", "Parte del gasto", "Promedio mensual", "Periodo anterior", "Cambio", "Movimientos", "Moneda"],
    ...inf.categorias.map((c) => [
      c.nombre,
      c.total.toFixed(2),
      `${c.pct.toFixed(1)}%`,
      c.mensual.toFixed(2),
      c.anterior.toFixed(2),
      c.deltaPct === null ? "sin dato anterior" : `${c.deltaPct > 0 ? "+" : ""}${c.deltaPct.toFixed(1)}%`,
      c.cuantos,
      inf.moneda,
    ]),
  ]);
}

export function csvMeses(inf: Informe): string {
  return csv([
    ["Mes", "Entró", "Salió", "Diferencia", "Moneda", "Dentro del periodo"],
    ...inf.tendencia.map((m) => [
      m.mes, m.ingresos.toFixed(2), m.gastos.toFixed(2), m.neto.toFixed(2), inf.moneda, m.enRango ? "Sí" : "No",
    ]),
  ]);
}

export function csvRecurrentes(inf: Informe): string {
  return csv([
    ["Cargo", "Categoría", "Monto", "Cada cuánto", "Al mes", "Al año", "Último cargo", "Próximo esperado", "Activo", "Cambio de precio", "Cargos vistos", "Moneda"],
    ...inf.recurrentes.map((r) => [
      r.nombre,
      r.categoria,
      r.monto.toFixed(2),
      textoCadencia(r.cadencia),
      r.alMes.toFixed(2),
      r.alAno.toFixed(2),
      r.ultima,
      r.proxima,
      r.activa ? "Sí" : "No",
      r.cambioPrecio === null ? "" : `${r.cambioPrecio > 0 ? "+" : ""}${r.cambioPrecio.toFixed(2)}`,
      r.cuantosCargos,
      inf.moneda,
    ]),
  ]);
}

export function csvComercios(inf: Informe): string {
  return csv([
    ["Comercio", "Total", "Movimientos", "Último", "Moneda"],
    ...inf.comercios.map((c) => [c.nombre, c.total.toFixed(2), c.cuantos, c.ultima, inf.moneda]),
  ]);
}

// ---------- El informe para imprimir ----------

function svgDona(inf: Informe): string {
  const visibles = inf.categorias.slice(0, 9);
  const resto = inf.categorias.slice(9);
  const lista = resto.length > 0
    ? [...visibles.map((c) => ({ nombre: c.nombre, valor: c.total })),
       { nombre: "Otros", valor: resto.reduce((s, c) => s + c.total, 0) }]
    : visibles.map((c) => ({ nombre: c.nombre, valor: c.total }));
  const segs = segmentosDona(lista.map((d) => d.valor));
  if (segs.length === 0) return "<p class=\"vacio\">Sin gastos en este periodo.</p>";
  const lado = (RADIO_DONA + GROSOR_DONA) * 2;

  const circulos = segs.map((s) => `<circle cx="${lado / 2}" cy="${lado / 2}" r="${RADIO_DONA}" fill="none"
      stroke="${s.color}" stroke-width="${GROSOR_DONA}" stroke-dasharray="${s.dash}" stroke-dashoffset="${s.offset}" />`).join("");

  const leyenda = lista.map((d, i) => `
    <li><span class="punto" style="background:${colorSerie(i)}"></span>
      <span class="nom">${esc(d.nombre)}</span>
      <span class="num">${esc(plata(d.valor, inf.moneda))}</span>
      <span class="pp">${inf.totales.gastos > 0 ? pct((d.valor / inf.totales.gastos) * 100) : "0%"}</span></li>`).join("");

  return `<div class="dona">
    <svg viewBox="0 0 ${lado} ${lado}" width="180" height="180" role="img" aria-label="Gasto por categoría">
      <g transform="rotate(-90 ${lado / 2} ${lado / 2})">${circulos}</g>
    </svg>
    <ul class="leyenda">${leyenda}</ul>
  </div>`;
}

function svgMeses(inf: Informe): string {
  const g = geometriaColumnas(inf.tendencia.map((m) => ({ mes: m.mes, ingresos: m.ingresos, gastos: m.gastos })), 700, 190);
  if (g.barras.length === 0) return "";
  const guias = g.guias.map((li, i) => `<line x1="0" x2="${g.ancho}" y1="${li.y}" y2="${li.y}" stroke="#dfe3e0" stroke-width="1" />${
    li.valor > 0 && i === g.guias.length - 1
      ? `<text x="2" y="${li.y + 12}" font-size="10" fill="#6b7a72">${esc(plata(li.valor, inf.moneda))}</text>`
      : ""}`).join("");
  const barras = g.barras.map((b) => `
    <g>
      <rect x="${b.xIngreso}" y="${b.yIngreso}" width="${b.anchoBarra}" height="${b.altoIngreso}" rx="3" fill="#6BA783" />
      <rect x="${b.xGasto}" y="${b.yGasto}" width="${b.anchoBarra}" height="${b.altoGasto}" rx="3" fill="#C57A68" />
      <text x="${b.xCentro}" y="${g.alto - 6}" text-anchor="middle" font-size="10.5" fill="#6b7a72">${esc(b.etiqueta)}</text>
    </g>`).join("");
  return `<svg viewBox="0 0 ${g.ancho} ${g.alto}" width="100%" height="${g.alto}" role="img" aria-label="Ingresos y gastos mes a mes">
    ${guias}${barras}
  </svg>
  <p class="pie">La columna verde es lo que entró y la roja lo que salió, mes a mes, ${etiquetaMes(inf.tendencia[0].mes)} en adelante.</p>`;
}

function tablaCategorias(inf: Informe): string {
  if (inf.categorias.length === 0) return "";
  return `<table>
    <thead><tr><th>Categoría</th><th class="num">Total</th><th class="num">Parte</th><th class="num">Al mes</th><th class="num">Periodo anterior</th><th class="num">Cambio</th></tr></thead>
    <tbody>${inf.categorias.map((c) => `<tr>
      <td>${esc(c.nombre)}</td>
      <td class="num">${esc(plata(c.total, inf.moneda))}</td>
      <td class="num">${pct(c.pct)}</td>
      <td class="num">${esc(plata(c.mensual, inf.moneda))}</td>
      <td class="num">${c.anterior > 0 ? esc(plata(c.anterior, inf.moneda)) : "sin dato"}</td>
      <td class="num ${c.deltaPct !== null && c.deltaPct > 0 ? "sube" : c.deltaPct !== null && c.deltaPct < 0 ? "baja" : ""}">${
        c.deltaPct === null ? "" : `${c.deltaPct > 0 ? "+" : ""}${Math.round(c.deltaPct)}%`}</td>
    </tr>`).join("")}</tbody>
    <tfoot><tr><td>Total gastado</td><td class="num">${esc(plata(inf.totales.gastos, inf.moneda))}</td><td colspan="4"></td></tr></tfoot>
  </table>`;
}

function tablaRecurrentes(inf: Informe): string {
  if (inf.recurrentes.length === 0) {
    return `<p class="vacio">No se detectaron cargos que se repitan. Con dos o tres meses de movimientos importados, aparecen solos.</p>`;
  }
  return `<table>
    <thead><tr><th>Cargo</th><th>Categoría</th><th>Cada cuánto</th><th class="num">Monto</th><th class="num">Al mes</th><th class="num">Al año</th><th>Último</th></tr></thead>
    <tbody>${inf.recurrentes.map((r) => `<tr class="${r.activa ? "" : "apagado"}">
      <td>${esc(r.nombre)}${r.tipo === "cuota" ? " (en cuotas)" : ""}${r.activa ? "" : " (dejó de llegar)"}${r.cambioPrecio && r.cambioPrecio > 0 ? " (subió de precio)" : ""}</td>
      <td>${esc(r.categoria)}</td>
      <td>${esc(textoCadencia(r.cadencia))}</td>
      <td class="num">${esc(plata(r.monto, inf.moneda))}</td>
      <td class="num">${esc(plata(r.alMes, inf.moneda))}</td>
      <td class="num">${esc(plata(r.alAno, inf.moneda))}</td>
      <td>${esc(r.ultima)}</td>
    </tr>`).join("")}</tbody>
    <tfoot><tr><td colspan="4">Total de las suscripciones activas${inf.cuotasAlMes > 0 ? `, más ${esc(plata(inf.cuotasAlMes, inf.moneda))} al mes en cuotas` : ""}</td>
      <td class="num">${esc(plata(inf.recurrenteAlMes, inf.moneda))}</td>
      <td class="num">${esc(plata(inf.recurrenteAlAno, inf.moneda))}</td><td></td></tr></tfoot>
  </table>`;
}

function bloqueHallazgos(inf: Informe): string {
  if (inf.hallazgos.length === 0) return "";
  return `<ul class="hallazgos">${inf.hallazgos.map((h) => `
    <li class="${h.tono}"><b>${esc(h.titulo)}</b><span>${esc(h.detalle)}</span></li>`).join("")}</ul>`;
}

function bloqueRecortes(inf: Informe): string {
  if (inf.recortes.length === 0) return "";
  const tope = Math.max(...inf.recortes.map((r) => r.max));
  const FRICCION: Record<string, string> = {
    baja: "cuesta poco",
    media: "cuesta un poco de costumbre",
    alta: "cuesta mantenerlo",
  };
  return `<table class="recortes">
    <thead><tr><th>Dónde</th><th>Ahorro mensual estimado</th><th class="num">Rango</th></tr></thead>
    <tbody>${inf.recortes.map((r) => `<tr>
      <td><b>${esc(r.titulo)}</b><br><span class="detalle">${esc(r.detalle)}</span></td>
      <td class="barra">
        <span class="track"><span class="max" style="width:${(r.max / tope) * 100}%"></span><span class="min" style="width:${(r.min / tope) * 100}%"></span></span>
        <span class="fric">${esc(FRICCION[r.friccion] ?? "")}</span>
      </td>
      <td class="num">${esc(plata(r.min, inf.moneda))} a ${esc(plata(r.max, inf.moneda))}</td>
    </tr>`).join("")}</tbody>
    <tfoot><tr><td colspan="2">Todo junto, al mes</td>
      <td class="num">${esc(plata(inf.recorteMin, inf.moneda))} a ${esc(plata(inf.recorteMax, inf.moneda))}</td></tr>
      <tr><td colspan="2">Todo junto, al año</td>
      <td class="num">${esc(plata(inf.recorteMin * 12, inf.moneda))} a ${esc(plata(inf.recorteMax * 12, inf.moneda))}</td></tr></tfoot>
  </table>
  <p class="pie">Son estimaciones calculadas sobre los gastos reales de este periodo, no metas ni promedios de otra gente. El rango bajo es lo prudente y el alto es lo que se logra si se revisa cargo por cargo.</p>`;
}

function tablaMovimientos(inf: Informe, resolver: (t: Tx) => ResueltoTx): string {
  if (inf.movimientos.length === 0) return "";
  return `<section class="anexo">
    <h2>Anexo, todos los movimientos del periodo</h2>
    <table>
      <thead><tr><th>Fecha</th><th>Descripción</th><th>Categoría</th><th>Cuenta</th><th class="num">Monto</th></tr></thead>
      <tbody>${inf.movimientos.map((t) => {
        const r = resolver(t);
        // Un traspaso sin categoría no es un gasto sin clasificar: es plata
        // que se movió de un bolsillo tuyo a otro, y decirle "sin categoría"
        // hace que quien lee el informe salga a buscar una que no existe.
        const cat = t.type === "transfer" && r.categoria === "Sin categoría" ? "Traspaso" : r.categoria;
        return `<tr>
          <td class="fecha">${esc(t.date)}</td>
          <td>${esc(t.description || t.merchant || "Sin descripción")}</td>
          <td>${esc(cat)}</td>
          <td>${esc(r.cuenta)}</td>
          <td class="num ${t.type === "income" ? "entra" : ""}">${t.type === "income" ? "+" : ""}${esc(plata(Number(t.amount), r.moneda))}</td>
        </tr>`;
      }).join("")}</tbody>
    </table>
  </section>`;
}

export interface OpcionesInformeHtml {
  /** Quién lo pidió, para que la hoja diga de quién es. Puede ir vacío. */
  titular?: string;
  /** Pegar la lista completa de movimientos al final. */
  conMovimientos: boolean;
  resolver: (t: Tx) => ResueltoTx;
}

const ESTILOS = `
  @page { margin: 15mm; }
  * { box-sizing: border-box; }
  body { font: 12px/1.55 'Inter', system-ui, -apple-system, "Segoe UI", sans-serif; color: #1d2a24; margin: 0; background: #fff; }
  header { border-bottom: 2px solid #1d2a24; padding-bottom: 10px; margin-bottom: 18px; }
  h1 { font-size: 21px; margin: 0 0 4px; letter-spacing: -.02em; }
  header p { margin: 0; color: #63726a; font-size: 11.5px; }
  h2 { font-size: 15px; margin: 22px 0 10px; letter-spacing: -.01em; }
  section { break-inside: auto; }
  .kpis { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 4px; }
  .kpi { border: 1px solid #e2e7e3; border-radius: 10px; padding: 10px 13px; flex: 1 1 148px; max-width: 220px; }
  .kpi .k { font-size: 9.5px; text-transform: uppercase; letter-spacing: .09em; color: #63726a; font-weight: 600; }
  .kpi .v { font-size: 15.5px; font-weight: 600; font-variant-numeric: tabular-nums; margin-top: 3px; }
  .kpi .d { font-size: 10.5px; color: #63726a; }
  .dona { display: flex; gap: 20px; align-items: center; flex-wrap: wrap; }
  .leyenda { list-style: none; margin: 0; padding: 0; flex: 1; min-width: 260px; }
  .leyenda li { display: flex; align-items: center; gap: 8px; padding: 3px 0; font-size: 11.5px; border-bottom: 1px solid #f0f2f0; }
  .leyenda .punto { width: 9px; height: 9px; border-radius: 2px; flex: none; }
  .leyenda .nom { flex: 1; }
  .leyenda .num, .leyenda .pp { font-variant-numeric: tabular-nums; font-weight: 600; }
  .leyenda .pp { width: 36px; text-align: right; color: #63726a; font-weight: 400; }
  table { width: 100%; border-collapse: collapse; font-size: 11.5px; margin-top: 6px; }
  th { text-align: left; border-bottom: 1.5px solid #1d2a24; padding: 6px; font-size: 10px;
       text-transform: uppercase; letter-spacing: .06em; }
  td { padding: 5px 6px; border-bottom: 1px solid #eef1ef; vertical-align: top; }
  tfoot td { font-weight: 700; border-bottom: none; border-top: 1.5px solid #cfd8d2; }
  .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .fecha { white-space: nowrap; }
  .sube { color: #b4614c; }
  .baja, .entra { color: #4d8465; }
  tr.apagado td { color: #8a978f; }
  .hallazgos { list-style: none; margin: 0; padding: 0; }
  .hallazgos li { border-left: 3px solid #cfd8d2; padding: 6px 0 6px 11px; margin-bottom: 9px; break-inside: avoid; }
  .hallazgos li b { display: block; font-size: 12.5px; margin-bottom: 2px; }
  .hallazgos li span { color: #4a5852; }
  .hallazgos li.alerta { border-left-color: #C57A68; }
  .hallazgos li.ojo { border-left-color: #C69A4D; }
  .hallazgos li.bien { border-left-color: #6BA783; }
  .recortes td { vertical-align: middle; }
  .recortes .detalle { color: #63726a; font-size: 11px; }
  .recortes .track { display: block; position: relative; height: 9px; border-radius: 99px; background: #eef1ef; overflow: hidden; width: 150px; }
  .recortes .max, .recortes .min { position: absolute; top: 0; left: 0; height: 100%; border-radius: 99px; }
  .recortes .max { background: #d7e2d8; }
  .recortes .min { background: #4F6B5B; }
  .recortes .fric { font-size: 10px; color: #63726a; }
  .pie { color: #63726a; font-size: 10.5px; margin-top: 6px; }
  .vacio { color: #63726a; font-style: italic; }
  .anexo { break-before: page; page-break-before: always; }
  footer { margin-top: 26px; border-top: 1px solid #e2e7e3; padding-top: 8px; color: #8a978f; font-size: 10px; }
  @media screen { body { max-width: 940px; margin: 26px auto; padding: 0 22px; } }
`;

export function armarInformeHtml(inf: Informe, op: OpcionesInformeHtml): string {
  const { moneda } = inf;
  const comparar = (ahora: number, antes: number | undefined): string => {
    if (antes === undefined || antes <= 0) return "sin periodo anterior para comparar";
    const cambio = ((ahora - antes) / antes) * 100;
    if (Math.abs(cambio) < 1) return "igual que el periodo anterior";
    return `${Math.abs(Math.round(cambio))}% ${cambio > 0 ? "más" : "menos"} que el periodo anterior`;
  };

  const generado = new Date(inf.generado).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<title>Informe de finanzas, ${esc(inf.etiqueta)}</title>
<style>${ESTILOS}</style></head>
<body>
  <header>
    <h1>Informe de finanzas</h1>
    <p>${esc(inf.etiqueta)}, del ${esc(inf.desde)} al ${esc(inf.hasta)}. Todo en ${esc(moneda)}.
       ${op.titular ? `${esc(op.titular)}. ` : ""}Generado el ${esc(generado)} desde NucleoOS.</p>
  </header>

  <section>
    <h2>Cómo cerró el periodo</h2>
    <div class="kpis">
      <div class="kpi"><div class="k">Entró</div><div class="v">${esc(plata(inf.totales.ingresos, moneda))}</div>
        <div class="d">${esc(comparar(inf.totales.ingresos, inf.anterior?.ingresos))}</div></div>
      <div class="kpi"><div class="k">Salió</div><div class="v">${esc(plata(inf.totales.gastos, moneda))}</div>
        <div class="d">${esc(comparar(inf.totales.gastos, inf.anterior?.gastos))}</div></div>
      <div class="kpi"><div class="k">Quedó</div><div class="v">${esc(plata(inf.totales.neto, moneda))}</div>
        <div class="d">${inf.totales.tasaAhorro === null ? "sin ingresos registrados" : `${Math.round(inf.totales.tasaAhorro)}% de lo que entró`}</div></div>
      <div class="kpi"><div class="k">Gasto al mes</div><div class="v">${esc(plata(inf.totales.gastoMensual, moneda))}</div>
        <div class="d">promedio sobre ${inf.dias} días</div></div>
      <div class="kpi"><div class="k">Se cobra solo</div><div class="v">${esc(plata(inf.recurrenteAlMes, moneda))}</div>
        <div class="d">${inf.recurrentes.filter((r) => r.activa).length} cargos automáticos al mes</div></div>
      <div class="kpi"><div class="k">Movimientos</div><div class="v">${inf.totales.movimientos}</div>
        <div class="d">${inf.sinCategoria.cuantos} sin categoría</div></div>
    </div>
  </section>

  <section>
    <h2>A dónde se fue el dinero</h2>
    ${svgDona(inf)}
    ${tablaCategorias(inf)}
  </section>

  <section>
    <h2>Mes a mes</h2>
    ${svgMeses(inf)}
  </section>

  <section>
    <h2>Lo que se cobra solo</h2>
    <p>Gasto fijo estimado, ${esc(plata(inf.gastoFijo, moneda))} al mes. Gasto que decides cada vez, ${esc(plata(inf.gastoVariable, moneda))} al mes.</p>
    ${tablaRecurrentes(inf)}
  </section>

  <section>
    <h2>Qué se ve en estos números</h2>
    ${bloqueHallazgos(inf)}
  </section>

  ${inf.recortes.length > 0 ? `<section>
    <h2>Dónde hay plata que recuperar</h2>
    ${bloqueRecortes(inf)}
  </section>` : ""}

  ${inf.comercios.length > 0 ? `<section>
    <h2>A quién se le pagó más</h2>
    <table>
      <thead><tr><th>Comercio</th><th class="num">Total</th><th class="num">Veces</th><th>Último</th></tr></thead>
      <tbody>${inf.comercios.map((c) => `<tr><td>${esc(c.nombre)}</td>
        <td class="num">${esc(plata(c.total, moneda))}</td><td class="num">${c.cuantos}</td>
        <td class="fecha">${esc(c.ultima)}</td></tr>`).join("")}</tbody>
    </table>
  </section>` : ""}

  ${inf.presupuestos.length > 0 ? `<section>
    <h2>Presupuestos del mes de ${esc(inf.hasta.slice(0, 7))}</h2>
    <table>
      <thead><tr><th>Categoría</th><th class="num">Gastado</th><th class="num">Tope</th><th class="num">Usado</th></tr></thead>
      <tbody>${inf.presupuestos.map((p) => `<tr>
        <td>${esc(p.nombre)}</td><td class="num">${esc(plata(p.gastado, moneda))}</td>
        <td class="num">${esc(plata(p.tope, moneda))}</td>
        <td class="num ${p.excedido ? "sube" : ""}">${pct(p.pct)}${p.excedido ? ", se pasó" : ""}</td></tr>`).join("")}</tbody>
    </table>
  </section>` : ""}

  <footer>
    Informe hecho con los movimientos registrados en NucleoOS. Las cifras salen de lo que está cargado en la app,
    así que lo que no se registró no aparece aquí.
    ${inf.fueraDeMoneda > 0 ? `Quedaron ${inf.fueraDeMoneda} movimientos en otra moneda fuera de este informe.` : ""}
    ${inf.sinCategoria.cuantos > 0 ? `Hay ${inf.sinCategoria.cuantos} gastos sin categoría, por ${esc(plata(inf.sinCategoria.monto, moneda))}.` : ""}
  </footer>

  ${op.conMovimientos ? tablaMovimientos(inf, op.resolver) : ""}
</body></html>`;
}
