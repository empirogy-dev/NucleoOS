import {
  ESTILOS_INFORME, bloqueHallazgos, csvTexto, esc, generadoEl, numero, pct,
} from "../informes/base";
import { etiquetaDia, geometriaBarras, geometriaLinea } from "../informes/formas";
import { AREAS, type Area, type InformeBienestar } from "./bienestar";

// El informe de bienestar, listo para entregar.
//
// La diferencia con el de finanzas no es técnica, es de destinatario. Un
// contador quiere totales y una planilla. Un psicólogo quiere ver la serie:
// qué pasó día a día, cuántos días hay de verdad, y qué se cruza con qué. Por
// eso aquí manda el día a día y no el total, y por eso cada promedio dice
// sobre cuántos días se calculó.
//
// Lo que se escribe en el diario es lo más íntimo que guarda la app. No sale
// nunca a menos que se pida explícitamente en la ventana de exportar, y
// cuando sale, el informe lo dice en la portada para que nadie lo mande sin
// darse cuenta.

const AREA_NOMBRE = new Map(AREAS.map((a) => [a.key, a.nombre]));

const n1 = (n: number) => numero(n, 1);

const ESTILOS_EXTRA = `
  .serie { display: flex; gap: 18px; flex-wrap: wrap; margin: 4px 0 10px; font-size: 11.5px; color: #63726a; }
  .serie b { color: #1d2a24; }
  .grafico { margin: 6px 0 2px; }
  .barrita { display: inline-block; height: 8px; border-radius: 99px; background: #4F6B5B; vertical-align: middle; }
  .barrita-fondo { display: inline-block; width: 90px; height: 8px; border-radius: 99px; background: #eef1ef; vertical-align: middle; margin-right: 7px; }
  .cruce { border: 1px solid #e2e7e3; border-radius: 10px; padding: 10px 13px; margin-bottom: 9px; break-inside: avoid; }
  .cruce b { display: block; font-size: 12.5px; margin-bottom: 5px; }
  .cruce .lado { display: inline-block; margin-right: 22px; font-size: 11.5px; }
  .cruce .lado i { display: block; color: #63726a; font-style: normal; font-size: 10.5px; }
  .cruce .lado span { font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums; }
  .cruce .flojo { color: #8a978f; font-size: 10.5px; margin-top: 4px; }
  .entrada { break-inside: avoid; margin-bottom: 12px; border-left: 2px solid #e2e7e3; padding-left: 11px; }
  .entrada h4 { margin: 0 0 3px; font-size: 11.5px; }
  .entrada .pregunta { color: #63726a; font-style: italic; font-size: 11px; margin: 0 0 4px; }
  .entrada p { margin: 0; white-space: pre-wrap; font-size: 11.5px; }
`;

// ---------- Los gráficos, dibujados como texto ----------

function svgLinea(
  puntos: Array<{ etiqueta: string; valor: number | null }>,
  fmt: (n: number) => string,
  color: string,
  rango?: { min?: number; max?: number },
): string {
  const g = geometriaLinea(puntos, { ancho: 680, alto: 170, min: rango?.min, max: rango?.max, marcas: 6 });
  if (!g.hayDatos) return `<p class="vacio">Sin registros en este periodo.</p>`;
  return `<svg class="grafico" viewBox="0 0 ${g.ancho} ${g.alto}" width="100%" height="${g.alto}" role="img" aria-label="Serie en el tiempo">
    ${g.guias.map((li, i) => `<line x1="0" x2="${g.ancho}" y1="${li.y}" y2="${li.y}" stroke="#dfe3e0" stroke-width="1" />
      <text x="2" y="${li.y + (i === g.guias.length - 1 ? 11 : -3)}" font-size="9.5" fill="#6b7a72">${esc(fmt(li.valor))}</text>`).join("")}
    ${g.trazos.map((d) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />`).join("")}
    ${g.puntos.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="2.2" fill="${color}" />`).join("")}
    ${g.marcasX.map((m, i) => `<text x="${m.x}" y="${g.alto - 5}" text-anchor="${i === 0 ? "start" : i === g.marcasX.length - 1 ? "end" : "middle"}" font-size="10" fill="#6b7a72">${esc(m.texto)}</text>`).join("")}
  </svg>`;
}

function svgBarras(datos: Array<{ etiqueta: string; valor: number }>, fmt: (n: number) => string, color: string): string {
  const g = geometriaBarras(datos, { ancho: 680, alto: 150, marcas: 6 });
  if (datos.length === 0) return "";
  return `<svg class="grafico" viewBox="0 0 ${g.ancho} ${g.alto}" width="100%" height="${g.alto}" role="img" aria-label="Valores por día">
    ${g.guias.map((li, i) => `<line x1="0" x2="${g.ancho}" y1="${li.y}" y2="${li.y}" stroke="#dfe3e0" stroke-width="1" />${
      i === g.guias.length - 1 ? `<text x="2" y="${li.y + 11}" font-size="9.5" fill="#6b7a72">${esc(fmt(li.valor))}</text>` : ""}`).join("")}
    ${g.barras.map((b) => `<rect x="${b.x}" y="${b.y}" width="${b.ancho}" height="${b.alto}" rx="2" fill="${color}" />`).join("")}
    ${g.marcasX.map((m, i) => `<text x="${m.x}" y="${g.alto - 5}" text-anchor="${i === 0 ? "start" : i === g.marcasX.length - 1 ? "end" : "middle"}" font-size="10" fill="#6b7a72">${esc(m.texto)}</text>`).join("")}
  </svg>`;
}

/** Con muchos días, el gráfico diario se vuelve un peine ilegible: se pasa a
 *  semanas. El corte está donde la línea deja de leerse, no en un número
 *  bonito. */
const porSemanas = (inf: InformeBienestar) => inf.dias > 45;

function serieSueno(inf: InformeBienestar) {
  return porSemanas(inf)
    ? inf.semanas.map((s) => ({ etiqueta: etiquetaDia(s.inicio), valor: s.suenoProm }))
    : inf.diario.map((d) => ({ etiqueta: etiquetaDia(d.fecha), valor: d.sueno }));
}

function serieEnergia(inf: InformeBienestar) {
  return porSemanas(inf)
    ? inf.semanas.map((s) => ({ etiqueta: etiquetaDia(s.inicio), valor: s.energiaProm }))
    : inf.diario.map((d) => ({ etiqueta: etiquetaDia(d.fecha), valor: d.energia }));
}

function serieMovimiento(inf: InformeBienestar) {
  return porSemanas(inf)
    ? inf.semanas.map((s) => ({ etiqueta: etiquetaDia(s.inicio), valor: s.movimientoMin }))
    : inf.diario.map((d) => ({ etiqueta: etiquetaDia(d.fecha), valor: d.movimientoMin }));
}

// ---------- Las planillas ----------

export function csvDiaADia(inf: InformeBienestar): string {
  return csvTexto([
    ["Fecha", "Horas de sueño", "Se acostó", "Se levantó", "Energía (1 a 5)", "Agua (vasos)",
     "Proteína (g)", "Minutos de movimiento", "Tipo de movimiento", "Hábitos cumplidos",
     "Hábitos activos", "Minutos de Mente", "Sesiones de Mente", "Entradas de diario"],
    ...inf.diario.map((d) => [
      d.fecha,
      d.sueno ?? "",
      d.acostarse ?? "",
      d.levantarse ?? "",
      d.energia ?? "",
      d.agua ?? "",
      d.proteina ?? "",
      d.movimientoMin,
      d.movimientoTipos.join(", "),
      d.habitosHechos,
      d.habitosPosibles,
      d.menteMin,
      d.menteSesiones,
      d.diarioEntradas,
    ]),
  ]);
}

export function csvSemanas(inf: InformeBienestar): string {
  return csvTexto([
    ["Semana del", "Sueño promedio", "Energía promedio", "Minutos de movimiento", "Hábitos cumplidos (%)", "Minutos de Mente"],
    ...inf.semanas.map((s) => [
      s.inicio, s.suenoProm ?? "", s.energiaProm ?? "", s.movimientoMin, s.habitosPct ?? "", s.menteMin,
    ]),
  ]);
}

export function csvHabitos(inf: InformeBienestar): string {
  return csvTexto([
    ["Hábito", "Días marcados", "Adherencia (%)", "Racha actual (días)", "Última marca", "Días del periodo"],
    ...inf.habitos.map((h) => [h.nombre, h.marcas, h.adherencia, h.rachaActual, h.ultima ?? "", inf.dias]),
    ...inf.retos.map((r) => [`Reto: ${r.titulo}`, r.cumplidos, r.adherencia, "", "", r.programados]),
  ]);
}

export function csvMovimiento(inf: InformeBienestar): string {
  return csvTexto([
    ["Tipo", "Sesiones", "Minutos", "Minutos por sesión"],
    ...inf.movimiento.porTipo.map((m) => [
      m.tipo, m.sesiones, m.minutos, m.sesiones > 0 ? Math.round(m.minutos / m.sesiones) : 0,
    ]),
  ]);
}

export function csvMetas(inf: InformeBienestar): string {
  return csvTexto([
    ["Meta", "Área", "Estado", "Avance (%)", "Plazo", "Días para el plazo", "Se alimenta sola"],
    ...inf.metas.map((m) => [
      m.titulo, m.area ?? "", m.estado, m.progreso, m.plazo ?? "", m.diasDePlazo ?? "", m.automatica ? "Sí" : "No",
    ]),
  ]);
}

// ---------- El informe ----------

export interface OpcionesInformeBienestar {
  titular?: string;
  /** Pegar el día a día completo como anexo al final. */
  conDiaADia: boolean;
}

function seccionEnergia(inf: InformeBienestar): string {
  return `<section>
    <h2>⚡ Energía</h2>
    <h3>Sueño</h3>
    <div class="serie">
      <span>Promedio <b>${inf.sueno.promedio === null ? "sin datos" : `${n1(inf.sueno.promedio)} horas`}</b></span>
      <span>Noches registradas <b>${inf.sueno.conDato} de ${inf.dias}</b></span>
      ${inf.sueno.minimo !== null ? `<span>Rango <b>${n1(inf.sueno.minimo)} a ${n1(inf.sueno.maximo ?? 0)} horas</b></span>` : ""}
    </div>
    ${svgLinea(serieSueno(inf), (v) => `${n1(v)} h`, "#4F6B5B")}
    <h3>Energía percibida, de 1 a 5</h3>
    <div class="serie">
      <span>Promedio <b>${inf.energia.promedio === null ? "sin datos" : n1(inf.energia.promedio)}</b></span>
      <span>Días registrados <b>${inf.energia.conDato} de ${inf.dias}</b></span>
    </div>
    ${svgLinea(serieEnergia(inf), (v) => n1(v), "#C0A052", { min: 1, max: 5 })}
    ${inf.agua.conDato > 0 || inf.proteina.conDato > 0 ? `<h3>Alimentación</h3>
    <div class="serie">
      ${inf.agua.promedio !== null ? `<span>Agua <b>${n1(inf.agua.promedio)} vasos al día</b> (${inf.agua.conDato} días)</span>` : ""}
      ${inf.proteina.promedio !== null ? `<span>Proteína <b>${Math.round(inf.proteina.promedio)} g al día</b> (${inf.proteina.conDato} días)</span>` : ""}
    </div>` : ""}
  </section>`;
}

function seccionMovimiento(inf: InformeBienestar): string {
  const m = inf.movimiento;
  return `<section>
    <h2>🏃 Movimiento</h2>
    <div class="serie">
      <span>Total <b>${m.minutos} minutos</b></span>
      <span>Por semana <b>${m.minutosPorSemana} minutos</b></span>
      <span>Sesiones <b>${m.sesiones}</b></span>
      <span>Días activos <b>${m.diasActivos} de ${inf.dias}</b></span>
    </div>
    ${svgBarras(serieMovimiento(inf), (v) => `${Math.round(v)} min`, "#7FA38C")}
    ${m.porTipo.length > 0 ? `<table>
      <thead><tr><th>Tipo</th><th class="num">Sesiones</th><th class="num">Minutos</th><th class="num">Por sesión</th></tr></thead>
      <tbody>${m.porTipo.map((t) => `<tr>
        <td>${esc(t.tipo)}</td><td class="num">${t.sesiones}</td><td class="num">${t.minutos}</td>
        <td class="num">${t.sesiones > 0 ? Math.round(t.minutos / t.sesiones) : 0}</td></tr>`).join("")}</tbody>
    </table>` : `<p class="vacio">No hay ejercicio registrado en este periodo.</p>`}
  </section>`;
}

function seccionHabitos(inf: InformeBienestar): string {
  const barra = (p: number) => `<span class="barrita-fondo"><span class="barrita" style="width:${Math.max(2, Math.min(100, p)) * 0.9}px"></span></span>`;
  return `<section>
    <h2>🌱 Hábitos</h2>
    ${inf.habitos.length === 0 ? `<p class="vacio">No hay hábitos definidos.</p>` : `
    <div class="serie"><span>Cumplimiento promedio <b>${inf.adherenciaHabitos}%</b> sobre ${inf.dias} días</span></div>
    <table>
      <thead><tr><th>Hábito</th><th>Constancia</th><th class="num">Días marcados</th><th class="num">Racha</th><th>Última vez</th></tr></thead>
      <tbody>${inf.habitos.map((h) => `<tr class="${h.marcas === 0 ? "apagado" : ""}">
        <td>${h.icono ? `${esc(h.icono)} ` : ""}${esc(h.nombre)}</td>
        <td>${barra(h.adherencia)}${h.adherencia}%</td>
        <td class="num">${h.marcas}</td>
        <td class="num">${h.rachaActual}</td>
        <td class="fecha">${h.ultima ? esc(h.ultima) : "nunca"}</td></tr>`).join("")}</tbody>
    </table>`}
    ${inf.retos.length > 0 ? `<h3>Retos</h3>
    <table>
      <thead><tr><th>Reto</th><th class="num">Cumplidos</th><th class="num">Días que tocaba</th><th class="num">Adherencia</th><th>Estado</th></tr></thead>
      <tbody>${inf.retos.map((r) => `<tr>
        <td>${r.icono ? `${esc(r.icono)} ` : ""}${esc(r.titulo)}</td>
        <td class="num">${r.cumplidos}</td><td class="num">${r.programados}</td>
        <td class="num">${r.adherencia}%</td><td>${esc(r.estado)}</td></tr>`).join("")}</tbody>
    </table>
    <p class="pie">Un reto se mide contra los días en que tocaba, no contra todos los días del periodo.</p>` : ""}
  </section>`;
}

function seccionMente(inf: InformeBienestar): string {
  const m = inf.mente;
  return `<section>
    <h2>🧠 Mente</h2>
    <div class="serie">
      <span>Prácticas <b>${m.sesiones}</b></span>
      <span>Minutos <b>${m.minutos}</b></span>
      <span>Días con práctica <b>${m.diasConPractica} de ${inf.dias}</b></span>
      <span>Entradas de diario <b>${m.entradasDiario}</b></span>
    </div>
    ${m.sesiones === 0 && m.entradasDiario === 0 ? `<p class="vacio">No hay prácticas ni escritura registradas en este periodo.</p>` : ""}
    <p class="pie">Las prácticas se guardan en el navegador donde se hicieron, así que las hechas en otro dispositivo no aparecen aquí.</p>
    ${m.entradas.length > 0 ? `<h3>Diario, ${m.entradas.length} ${m.entradas.length === 1 ? "entrada" : "entradas"}</h3>
      ${m.entradas.map((e) => `<div class="entrada">
        <h4>${esc(e.fecha)}</h4>
        ${e.pregunta ? `<p class="pregunta">${esc(e.pregunta)}</p>` : ""}
        <p>${esc(e.texto)}</p>
      </div>`).join("")}` : ""}
  </section>`;
}

function seccionDireccion(inf: InformeBienestar): string {
  return `<section>
    <h2>🎯 Dirección</h2>
    ${inf.metas.length === 0 ? `<p class="vacio">No hay metas registradas.</p>` : `<table>
      <thead><tr><th>Meta</th><th>Área</th><th class="num">Avance</th><th>Plazo</th><th>Estado</th></tr></thead>
      <tbody>${inf.metas.map((m) => `<tr class="${m.lograda ? "apagado" : ""}">
        <td>${esc(m.titulo)}</td>
        <td>${esc(m.area ?? "general")}</td>
        <td class="num">${m.progreso}%</td>
        <td class="fecha">${m.plazo ? `${esc(m.plazo)}${m.diasDePlazo !== null && m.diasDePlazo < 0 && !m.lograda ? " (pasado)" : ""}` : "sin plazo"}</td>
        <td>${esc(m.estado)}${m.automatica ? ", se alimenta sola" : ""}</td></tr>`).join("")}</tbody>
    </table>`}
  </section>`;
}

function seccionCruces(inf: InformeBienestar): string {
  const utiles = inf.cruces.filter((c) => c.con !== null || c.sin !== null);
  if (utiles.length === 0) return "";
  return `<section>
    <h2>Qué se cruza con qué</h2>
    ${utiles.map((c) => `<div class="cruce">
      <b>${esc(c.pregunta)}</b>
      <span class="lado"><i>${esc(c.conLabel)}</i><span>${c.con === null ? "sin datos" : `${n1(c.con)} ${esc(c.unidad)}`}</span></span>
      <span class="lado"><i>${esc(c.sinLabel)}</i><span>${c.sin === null ? "sin datos" : `${n1(c.sin)} ${esc(c.unidad)}`}</span></span>
      <span class="lado"><i>Días comparados</i><span>${c.diasCon} y ${c.diasSin}</span></span>
      ${c.confiable ? "" : `<div class="flojo">Con tan pocos días a un lado, esta comparación no alcanza para concluir nada. Se muestra para que no falte, no como hallazgo.</div>`}
    </div>`).join("")}
    <p class="pie">Esto es lo que muestran los registros de este periodo. Son asociaciones entre cosas anotadas por la misma persona, no relaciones de causa probadas.</p>
  </section>`;
}

function anexoDiaADia(inf: InformeBienestar): string {
  return `<section class="anexo">
    <h2>Anexo, día a día</h2>
    <p class="pie">Una fila por día del periodo. Las celdas vacías son días sin registro, que no son lo mismo que un cero.</p>
    <table>
      <thead><tr><th>Fecha</th><th class="num">Sueño</th><th class="num">Energía</th><th class="num">Movimiento</th>
        <th>Tipo</th><th class="num">Hábitos</th><th class="num">Mente</th><th class="num">Diario</th></tr></thead>
      <tbody>${inf.diario.map((d) => `<tr>
        <td class="fecha">${esc(d.fecha)}</td>
        <td class="num">${d.sueno === null ? "" : `${n1(d.sueno)} h`}</td>
        <td class="num">${d.energia === null ? "" : d.energia}</td>
        <td class="num">${d.movimientoMin > 0 ? `${d.movimientoMin} min` : ""}</td>
        <td>${esc(d.movimientoTipos.join(", "))}</td>
        <td class="num">${d.habitosPosibles > 0 ? `${d.habitosHechos} de ${d.habitosPosibles}` : ""}</td>
        <td class="num">${d.menteMin > 0 ? `${d.menteMin} min` : ""}</td>
        <td class="num">${d.diarioEntradas > 0 ? d.diarioEntradas : ""}</td>
      </tr>`).join("")}</tbody>
    </table>
  </section>`;
}

export function armarInformeBienestarHtml(inf: InformeBienestar, op: OpcionesInformeBienestar): string {
  const incluye = (a: Area) => inf.areas.includes(a);
  const cobertura = Math.round((inf.diasConAlgo / inf.dias) * 100);

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<title>Informe de bienestar, ${esc(inf.etiqueta)}</title>
<style>${ESTILOS_INFORME}${ESTILOS_EXTRA}</style></head>
<body>
  <header>
    <h1>Informe de bienestar</h1>
    <p>${esc(inf.etiqueta)}, del ${esc(inf.desde)} al ${esc(inf.hasta)}, ${inf.dias} días.
       ${op.titular ? `${esc(op.titular)}. ` : ""}Generado el ${esc(generadoEl(inf.generado))} desde NucleoOS.</p>
    <p>Incluye ${esc(inf.areas.map((a) => AREA_NOMBRE.get(a) ?? a).join(", "))}.${
      inf.mente.entradas.length > 0 ? " <b>Contiene el texto del diario personal.</b>" : ""}</p>
  </header>

  <section>
    <h2>De un vistazo</h2>
    <div class="kpis">
      <div class="kpi"><div class="k">Días registrados</div><div class="v">${inf.diasConAlgo} de ${inf.dias}</div>
        <div class="d">${pct(cobertura)} del periodo</div></div>
      ${incluye("energia") ? `<div class="kpi"><div class="k">Sueño</div><div class="v">${inf.sueno.promedio === null ? "sin datos" : `${n1(inf.sueno.promedio)} h`}</div>
        <div class="d">${inf.sueno.conDato} noches anotadas</div></div>
      <div class="kpi"><div class="k">Energía</div><div class="v">${inf.energia.promedio === null ? "sin datos" : `${n1(inf.energia.promedio)} de 5`}</div>
        <div class="d">${inf.energia.conDato} días anotados</div></div>` : ""}
      ${incluye("movimiento") ? `<div class="kpi"><div class="k">Movimiento</div><div class="v">${inf.movimiento.minutosPorSemana} min</div>
        <div class="d">por semana, ${inf.movimiento.sesiones} sesiones</div></div>` : ""}
      ${incluye("habitos") ? `<div class="kpi"><div class="k">Hábitos</div><div class="v">${inf.adherenciaHabitos === null ? "sin datos" : `${inf.adherenciaHabitos}%`}</div>
        <div class="d">${inf.habitos.length} en seguimiento</div></div>` : ""}
      ${incluye("mente") ? `<div class="kpi"><div class="k">Mente</div><div class="v">${inf.mente.minutos} min</div>
        <div class="d">${inf.mente.sesiones} prácticas, ${inf.mente.entradasDiario} escritos</div></div>` : ""}
      ${incluye("direccion") ? `<div class="kpi"><div class="k">Metas activas</div><div class="v">${inf.metas.filter((m) => !m.lograda).length}</div>
        <div class="d">${inf.metas.filter((m) => m.lograda).length} logradas</div></div>` : ""}
    </div>
  </section>

  <section>
    <h2>Qué se ve en estos registros</h2>
    ${bloqueHallazgos(inf.hallazgos)}
  </section>

  ${incluye("energia") ? seccionEnergia(inf) : ""}
  ${incluye("movimiento") ? seccionMovimiento(inf) : ""}
  ${incluye("habitos") ? seccionHabitos(inf) : ""}
  ${incluye("mente") ? seccionMente(inf) : ""}
  ${incluye("direccion") ? seccionDireccion(inf) : ""}
  ${seccionCruces(inf)}

  <footer>
    Este informe se arma con lo que está registrado en NucleoOS, así que lo que no se anotó no aparece.
    Las celdas y los días vacíos son falta de registro, no ceros. Los promedios se calculan solo sobre los días con dato,
    y cada uno dice cuántos son. No es un documento clínico ni reemplaza una evaluación profesional.
  </footer>

  ${op.conDiaADia ? anexoDiaADia(inf) : ""}
</body></html>`;
}

/** La nota que acompaña al paquete, para quien lo abre sin haber visto la app. */
export function lectura(inf: InformeBienestar): string {
  return [
    `Bienestar, ${inf.etiqueta}`,
    `Periodo: del ${inf.desde} al ${inf.hasta}, ${inf.dias} días.`,
    `Con registros en ${inf.diasConAlgo} de esos días.`,
    `Áreas incluidas: ${inf.areas.map((a) => AREA_NOMBRE.get(a) ?? a).join(", ")}.`,
    "",
    "Qué hay en cada archivo:",
    "  informe.html: el informe completo con gráficos y observaciones. Se abre en el navegador y se imprime a PDF.",
    "  dia-a-dia.csv: una fila por día, con sueño, energía, agua, proteína, movimiento, hábitos, Mente y diario.",
    "  semana-a-semana.csv: lo mismo agrupado por semana.",
    "  habitos.csv: constancia de cada hábito y de los retos.",
    "  movimiento.csv: minutos y sesiones por tipo de ejercicio.",
    "  metas.csv: las metas con su avance y su plazo.",
    "",
    "Cómo leer los datos:",
    "  Una celda vacía es un día SIN REGISTRO, no un cero. Un día sin sueño anotado no es una noche sin dormir.",
    "  Los promedios se calculan solo sobre los días que tienen dato, y el informe dice cuántos son.",
    "  La energía es una escala de 1 a 5 que la persona anota a mano, según cómo se sintió.",
    "  El sueño sale de la hora de acostarse y de levantarse que ella misma registra, no de un sensor.",
    "  Los minutos de movimiento son los que ella anotó al registrar cada sesión.",
    "  Las prácticas de Mente se guardan en el navegador donde se hicieron, así que pueden faltar las de otro dispositivo.",
    "  Los cruces entre variables son asociaciones observadas, no relaciones de causa.",
    "",
    inf.mente.entradas.length > 0
      ? "ATENCIÓN: este paquete incluye el texto del diario personal, porque se pidió expresamente al exportar."
      : "El texto del diario no está incluido. Solo se cuenta cuántas veces se escribió.",
    "",
    `Generado el ${new Date(inf.generado).toLocaleString("es-CL")} desde NucleoOS.`,
  ].join("\n");
}
