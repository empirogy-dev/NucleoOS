// Lo que comparten todos los informes que salen de la app.
//
// Hay dos informes (las finanzas y el bienestar) y van a haber más. Los tres
// pedazos que ninguno debería reescribir son: cómo se escapa el texto para
// meterlo en una página, cómo se arma un CSV que Excel abra bien, y cómo se
// manda una página a imprimir. La hoja de estilos también vive aquí, porque
// dos informes de la misma app que se ven distintos parecen de dos apps.
//
// Nada de esto pasa por el servidor: el archivo se arma en el navegador y se
// baja. Lo que una persona registra en su vida no tiene por qué viajar a
// ninguna parte para convertirse en un PDF.

export const esc = (s: string): string =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const pct = (n: number): string => `${Math.round(n)}%`;

/** Un número escrito como se escribe en español: con coma y sin decimales
 *  de más. */
export const numero = (n: number, decimales = 1): string =>
  n.toLocaleString("es-CL", { maximumFractionDigits: decimales });

// ---------- Observaciones ----------
//
// El tono no es decoración: es lo que hace que un informe se pueda leer en
// diagonal. Verde lo que va bien, amarillo lo que conviene mirar, rojo lo que
// pide algo ahora.

export type Tono = "bien" | "ojo" | "alerta";

export interface Hallazgo {
  clave: string;
  tono: Tono;
  titulo: string;
  detalle: string;
}

// ---------- Planillas ----------

const celda = (s: string | number): string => `"${String(s).replace(/"/g, '""')}"`;

/** Un CSV que Excel abre bien.
 *
 *  El BOM del principio es lo que hace que las tildes se vean: sin él,
 *  "Educación" aparece como "EducaciÃ³n" y la planilla parece rota aunque los
 *  datos estén perfectos. Las filas van con retorno de carro porque es lo que
 *  esperan los programas viejos, que son justo los que usan los contadores.
 */
export const csvTexto = (filas: Array<Array<string | number>>): string =>
  "﻿" + filas.map((f) => f.map(celda).join(",")).join("\r\n");

// ---------- Salida ----------

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
 *  la ventana emergente, se baja el archivo, que es lo segundo mejor. */
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

/** El texto del pie de un archivo, con la fecha en que se generó. */
export const generadoEl = (iso: string): string =>
  new Date(iso).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });

// ---------- Cómo se ve un informe impreso ----------
//
// Colores fijos, no los del tema: esto se imprime en papel blanco y lo lee
// alguien que no usa la app. Los tonos son los mismos del sistema de diseño,
// bajados a algo que sobreviva a una impresora.

export const ESTILOS_INFORME = `
  @page { margin: 15mm; }
  * { box-sizing: border-box; }
  body { font: 12px/1.55 'Inter', system-ui, -apple-system, "Segoe UI", sans-serif; color: #1d2a24; margin: 0; background: #fff; }
  header { border-bottom: 2px solid #1d2a24; padding-bottom: 10px; margin-bottom: 18px; }
  h1 { font-size: 21px; margin: 0 0 4px; letter-spacing: -.02em; }
  header p { margin: 0; color: #63726a; font-size: 11.5px; }
  h2 { font-size: 15px; margin: 22px 0 10px; letter-spacing: -.01em; }
  h3 { font-size: 12.5px; margin: 14px 0 6px; }
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

/** La lista de observaciones, igual en todos los informes. */
export function bloqueHallazgos(hallazgos: Hallazgo[]): string {
  if (hallazgos.length === 0) return "";
  return `<ul class="hallazgos">${hallazgos.map((h) => `
    <li class="${h.tono}"><b>${esc(h.titulo)}</b><span>${esc(h.detalle)}</span></li>`).join("")}</ul>`;
}
