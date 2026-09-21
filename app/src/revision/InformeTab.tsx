import { useEffect, useMemo, useRef, useState } from "react";
import { Download } from "lucide-react";
import { useIdioma } from "../idioma/IdiomaProvider";
import { Selector } from "../components/Selector";
import { AyudaTip } from "../components/AyudaTip";
import { sinRobarFoco } from "../components/cierreDeFondo";
import { BarrasTiempo, LineaTiempo } from "../informes/Graficos";
import { etiquetaDia } from "../informes/formas";
import type { Tono } from "../informes/base";
import { ExportarBienestar } from "./ExportarBienestar";
import {
  AREAS, armarInformeBienestar, diasDeRango, rangoDePreset, traerDatos,
  type Area, type DatosCrudos, type InformeBienestar, type PresetBienestar,
} from "./bienestar";

// La pestaña Informe de Revisión.
//
// Revisión ya contaba qué pasó en la semana. Lo que faltaba era poder
// llevárselo: mirar el sueño y la energía día a día, ver qué se cruza con qué,
// y sacar de ahí una hoja que otra persona pueda leer. La frase que lo pidió
// fue "por si lo quiero analizar con un psicólogo", y eso es exactamente lo
// que ordena esta pantalla.

const PRESETS: Array<{ value: PresetBienestar; label: string }> = [
  { value: "semana", label: "Últimos 7 días" },
  { value: "dos", label: "Últimas 2 semanas" },
  { value: "mes", label: "Últimos 30 días" },
  { value: "tres", label: "Últimos 3 meses" },
  { value: "seis", label: "Últimos 6 meses" },
];

const COLOR_TONO: Record<Tono, string> = {
  bien: "var(--ok)",
  ojo: "var(--warn)",
  alerta: "var(--err)",
};

const n1 = (n: number) => n.toLocaleString("es-CL", { maximumFractionDigits: 1 });

export function InformeTab({ cargarDatos = traerDatos }: {
  /** De dónde salen los datos. Se puede cambiar para probar la pantalla sin
   *  base de datos detrás, igual que hace la pestaña de Recurrentes. */
  cargarDatos?: (dias: number) => Promise<DatosCrudos>;
} = {}) {
  const { t: tr } = useIdioma();
  const [preset, setPreset] = useState<PresetBienestar>("mes");
  const [areas, setAreas] = useState<Area[]>(["energia", "movimiento", "habitos", "mente", "direccion"]);
  const [conTextoDiario, setConTextoDiario] = useState(false);
  const [datos, setDatos] = useState<DatosCrudos | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportar, setExportar] = useState(false);

  const rango = useMemo(() => rangoDePreset(preset), [preset]);
  const dias = diasDeRango(rango.desde, rango.hasta);

  // Se traen los datos del periodo más largo que se haya pedido y se recorta
  // en memoria. Cambiar de "30 días" a "7 días" no tiene por qué volver a
  // preguntarle todo a la base.
  const diasTraidos = useRef(0);
  useEffect(() => {
    if (datos && dias <= diasTraidos.current) return;
    let vivo = true;
    setCargando(true);
    cargarDatos(dias)
      .then((d) => {
        if (!vivo) return;
        diasTraidos.current = dias;
        setDatos(d);
        setError(null);
      })
      .catch((e) => { if (vivo) setError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, [dias, datos, cargarDatos]);

  const informe: InformeBienestar | null = useMemo(() => {
    if (!datos) return null;
    return armarInformeBienestar(datos, {
      desde: rango.desde, hasta: rango.hasta, etiqueta: rango.etiqueta,
      areas, conTextoDiario,
    });
  }, [datos, rango, areas, conTextoDiario]);

  const alternarArea = (a: Area) => {
    setAreas((previas) => (previas.includes(a)
      // Nunca se quedan las cinco apagadas: un informe sin áreas no es nada.
      ? (previas.length === 1 ? previas : previas.filter((x) => x !== a))
      : [...previas, a]));
  };

  const incluye = (a: Area) => areas.includes(a);
  // Con muchos días el día a día se vuelve un peine: se pasa a semanas.
  const porSemanas = informe !== null && informe.dias > 45;

  return (
    <>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 14 }}>
        <div className="field" style={{ minWidth: 185, marginBottom: 0 }}>
          <label>{tr("Periodo")}</label>
          <Selector value={preset} ariaLabel={tr("Periodo")} onChange={(v) => setPreset(v as PresetBienestar)}
            opciones={PRESETS.map((p) => ({ value: p.value, label: tr(p.label) }))} />
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn primary" {...sinRobarFoco} disabled={!informe} onClick={() => setExportar(true)}>
          <Download size={15} style={{ verticalAlign: "-2px", marginRight: 5 }} />
          {tr("Exportar")}
        </button>
      </div>

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 11.5, color: "var(--muted)", marginRight: 2 }}>{tr("Qué entra")}:</span>
        {AREAS.map((a) => (
          <button key={a.key} className={"ftab" + (incluye(a.key) ? " active" : "")}
            title={a.explica} onClick={() => alternarArea(a.key)}>
            {a.emoji} {tr(a.nombre)}
          </button>
        ))}
      </div>

      {error && <div className="card pad" style={{ borderLeft: "3px solid var(--err)", marginBottom: 14 }}>{error}</div>}
      {cargando && !informe && <p style={{ color: "var(--muted)" }}>{tr("cargando")}</p>}

      {informe && (
        <>
          {/* Las tarjetas son hasta siete, así que la columna se aprieta a
              128px: con 150 entraban seis y la séptima se quedaba sola en una
              fila, con un hueco enorme al lado. */}
          <div className="statrow" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(128px, 1fr))" }}>
            <div className="card stat">
              <div className="k">{tr("Días con registro")}
                <AyudaTip etiqueta={tr("Qué significa")}
                  texto={tr("Cuántos días del periodo tienen algo anotado. Los promedios de abajo salen solo de esos días, nunca de los días vacíos: una semana sin anotar el sueño no es una semana sin dormir.")} />
              </div>
              <div className="v tnum">{informe.diasConAlgo} / {informe.dias}</div>
              <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>
                {Math.round((informe.diasConAlgo / informe.dias) * 100)}% {tr("del periodo")}
              </div>
            </div>
            {incluye("energia") && (
              <>
                <div className="card stat">
                  <div className="k">{tr("Sueño")}</div>
                  <div className="v tnum">{informe.sueno.promedio === null ? tr("sin datos") : `${n1(informe.sueno.promedio)} h`}</div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>
                    {informe.sueno.conDato} {tr("noches anotadas")}
                  </div>
                </div>
                <div className="card stat">
                  <div className="k">{tr("Energía")}</div>
                  <div className="v tnum">{informe.energia.promedio === null ? tr("sin datos") : `${n1(informe.energia.promedio)} / 5`}</div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>
                    {informe.energia.conDato} {tr("días anotados")}
                  </div>
                </div>
              </>
            )}
            {incluye("movimiento") && (
              <div className="card stat">
                <div className="k">{tr("Movimiento")}</div>
                <div className="v tnum">{informe.movimiento.minutosPorSemana} min</div>
                <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>
                  {tr("por semana")}, {informe.movimiento.sesiones} {tr("sesiones")}
                </div>
              </div>
            )}
            {incluye("habitos") && (
              <div className="card stat">
                <div className="k">{tr("Hábitos")}</div>
                <div className="v tnum">{informe.adherenciaHabitos === null ? tr("sin datos") : `${informe.adherenciaHabitos}%`}</div>
                <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>
                  {informe.habitos.length} {tr("en seguimiento")}
                </div>
              </div>
            )}
            {incluye("mente") && (
              <div className="card stat">
                <div className="k">{tr("Mente")}</div>
                <div className="v tnum">{informe.mente.minutos} min</div>
                <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>
                  {informe.mente.sesiones} {tr("prácticas")}, {informe.mente.entradasDiario} {tr("escritos")}
                </div>
              </div>
            )}
            {incluye("direccion") && (
              <div className="card stat">
                <div className="k">{tr("Metas activas")}</div>
                <div className="v tnum">{informe.metas.filter((m) => !m.lograda).length}</div>
                <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>
                  {informe.metas.filter((m) => m.lograda).length} {tr("logradas")}
                </div>
              </div>
            )}
          </div>

          {informe.hallazgos.length > 0 && (
            <div className="card panel">
              <h3>{tr("Qué se ve en estos registros")}</h3>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {informe.hallazgos.map((h) => (
                  <li key={h.clave} style={{ borderLeft: `3px solid ${COLOR_TONO[h.tono]}`, padding: "6px 0 6px 12px", marginBottom: 12 }}>
                    <b style={{ fontSize: 13.5, display: "block", marginBottom: 2 }}>{h.titulo}</b>
                    <span style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5 }}>{h.detalle}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {incluye("energia") && (
            <div className="panelgrid" style={{ marginTop: 14 }}>
              <div className="card panel">
                <h3>{tr("Sueño")}</h3>
                <LineaTiempo
                  puntos={porSemanas
                    ? informe.semanas.map((s) => ({ etiqueta: etiquetaDia(s.inicio), valor: s.suenoProm }))
                    : informe.diario.map((d) => ({ etiqueta: etiquetaDia(d.fecha), valor: d.sueno }))}
                  fmt={(v) => `${n1(v)} h`}
                  color="var(--accent-ink)"
                  banda={{ desde: 7, hasta: 9, nota: tr("La franja marca las 7 a 9 horas, que es lo que suele recomendarse para un adulto.") }}
                />
                <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 6 }}>
                  {porSemanas ? tr("Promedio por semana.") : tr("Una noche por punto.")}
                  {" "}{tr("Donde la línea se corta es que no hubo registro.")}
                </p>
              </div>
              <div className="card panel">
                <h3>{tr("Energía percibida")}</h3>
                <LineaTiempo
                  puntos={porSemanas
                    ? informe.semanas.map((s) => ({ etiqueta: etiquetaDia(s.inicio), valor: s.energiaProm }))
                    : informe.diario.map((d) => ({ etiqueta: etiquetaDia(d.fecha), valor: d.energia }))}
                  fmt={(v) => n1(v)}
                  min={1}
                  max={5}
                  color="var(--sal)"
                />
                <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 6 }}>
                  {tr("Del 1 al 5, como la anotaste ese día.")}
                  {informe.agua.promedio !== null && <> {tr("Agua")}, {n1(informe.agua.promedio)} {tr("vasos al día")}.</>}
                </p>
              </div>
            </div>
          )}

          {incluye("movimiento") && (
            <div className="card panel" style={{ marginTop: 14 }}>
              <h3>{tr("Movimiento")}</h3>
              <BarrasTiempo
                datos={porSemanas
                  ? informe.semanas.map((s) => ({ etiqueta: etiquetaDia(s.inicio), valor: s.movimientoMin }))
                  : informe.diario.map((d) => ({ etiqueta: etiquetaDia(d.fecha), valor: d.movimientoMin }))}
                fmt={(v) => `${Math.round(v)} min`}
                ancho={900}
                alto={190}
              />
              {informe.movimiento.porTipo.length > 0 ? (
                <div style={{ marginTop: 14 }}>
                  {informe.movimiento.porTipo.map((t) => (
                    <div className="bar" key={t.tipo}>
                      <div className="top">
                        <span className="lbl">{t.tipo}
                          <span style={{ color: "var(--muted)", fontSize: 11.5 }}>
                            {t.sesiones} {t.sesiones === 1 ? tr("sesión") : tr("sesiones")}
                          </span>
                        </span>
                        <b className="tnum">{t.minutos} min</b>
                      </div>
                      <div className="track">
                        <div className="fill" style={{
                          width: `${Math.round((t.minutos / Math.max(1, informe.movimiento.minutos)) * 100)}%`,
                          background: "var(--mov)",
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "var(--muted)", fontSize: 13.5 }}>{tr("No hay ejercicio registrado en este periodo.")}</p>
              )}
            </div>
          )}

          <div className="orden-grid orden-2col" style={{ marginTop: 14 }}>
            {incluye("habitos") && (
              <div className="orden-item"><div className="card panel">
                <h3>{tr("Constancia de los hábitos")}</h3>
                {informe.habitos.length === 0 ? (
                  <p style={{ color: "var(--muted)", fontSize: 13.5 }}>{tr("Todavía no tienes hábitos definidos.")}</p>
                ) : informe.habitos.map((h) => (
                  <div className="bar" key={h.id}>
                    <div className="top">
                      <span className="lbl">{h.icono} {h.nombre}
                        <span style={{ color: "var(--muted)", fontSize: 11.5 }}>
                          {h.marcas} {h.marcas === 1 ? tr("día") : tr("días")}
                          {h.rachaActual > 0 ? `, ${tr("racha de")} ${h.rachaActual}` : ""}
                        </span>
                      </span>
                      <b className="tnum">{h.adherencia}%</b>
                    </div>
                    <div className="track">
                      <div className="fill" style={{ width: `${h.adherencia}%`, background: "var(--hab)" }} />
                    </div>
                  </div>
                ))}
                {informe.retos.length > 0 && (
                  <>
                    <h3 style={{ marginTop: 18 }}>{tr("Retos")}</h3>
                    {informe.retos.map((r) => (
                      <div className="bar" key={r.id}>
                        <div className="top">
                          <span className="lbl">{r.icono} {r.titulo}
                            <span style={{ color: "var(--muted)", fontSize: 11.5 }}>
                              {r.cumplidos} {tr("de")} {r.programados} {tr("días que tocaba")}
                            </span>
                          </span>
                          <b className="tnum">{r.adherencia}%</b>
                        </div>
                        <div className="track">
                          <div className="fill" style={{ width: `${Math.min(100, r.adherencia)}%`, background: "var(--hab)" }} />
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div></div>
            )}

            {incluye("direccion") && (
              <div className="orden-item"><div className="card panel">
                <h3>{tr("Metas")}</h3>
                {informe.metas.length === 0 ? (
                  <p style={{ color: "var(--muted)", fontSize: 13.5 }}>{tr("Todavía no hay metas en Dirección.")}</p>
                ) : informe.metas.slice(0, 10).map((m) => (
                  <div className="bar" key={m.id}>
                    <div className="top">
                      <span className="lbl">{m.titulo}
                        <span style={{ color: "var(--muted)", fontSize: 11.5 }}>
                          {m.area ?? tr("general")}
                          {m.plazo ? `, ${tr("plazo")} ${m.plazo}` : ""}
                          {m.diasDePlazo !== null && m.diasDePlazo < 0 && !m.lograda ? `, ${tr("pasado")}` : ""}
                        </span>
                      </span>
                      <b className="tnum">{m.progreso}%</b>
                    </div>
                    <div className="track">
                      <div className="fill" style={{
                        width: `${Math.min(100, m.progreso)}%`,
                        background: m.lograda ? "var(--ok)" : "var(--obj)",
                      }} />
                    </div>
                  </div>
                ))}
              </div></div>
            )}

            {incluye("mente") && (
              <div className="orden-item"><div className="card panel">
                <h3>{tr("Mente")}</h3>
                <div className="txrow" style={{ padding: "8px 0" }}>
                  <div className="txmeta"><b>{tr("Prácticas")}</b><small>{tr("en")} {informe.mente.diasConPractica} {tr("días distintos")}</small></div>
                  <b className="tnum">{informe.mente.sesiones}</b>
                </div>
                <div className="txrow" style={{ padding: "8px 0" }}>
                  <div className="txmeta"><b>{tr("Minutos de práctica")}</b></div>
                  <b className="tnum">{informe.mente.minutos}</b>
                </div>
                <div className="txrow" style={{ padding: "8px 0" }}>
                  <div className="txmeta">
                    <b>{tr("Escritura en el diario")}</b>
                    <small>{tr("el texto no sale del informe salvo que lo pidas al exportar")}</small>
                  </div>
                  <b className="tnum">{informe.mente.entradasDiario}</b>
                </div>
                <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 10 }}>
                  {tr("Las prácticas se guardan en el navegador donde las hiciste, así que las de otro dispositivo no aparecen aquí.")}
                </p>
              </div></div>
            )}

            {informe.cruces.some((c) => c.confiable) && (
              <div className="orden-item"><div className="card panel">
                <h3>{tr("Qué se cruza con qué")}</h3>
                {informe.cruces.filter((c) => c.confiable).map((c) => (
                  <div key={c.clave} style={{ marginBottom: 16 }}>
                    <b style={{ fontSize: 13, display: "block", marginBottom: 6 }}>{c.pregunta}</b>
                    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>{c.conLabel}</div>
                        <b className="tnum" style={{ fontSize: 16 }}>{c.con === null ? "-" : n1(c.con)}</b>
                        <span style={{ fontSize: 11, color: "var(--muted)" }}> {c.unidad}, {c.diasCon} {tr("días")}</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>{c.sinLabel}</div>
                        <b className="tnum" style={{ fontSize: 16 }}>{c.sin === null ? "-" : n1(c.sin)}</b>
                        <span style={{ fontSize: 11, color: "var(--muted)" }}> {c.unidad}, {c.diasSin} {tr("días")}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <p style={{ fontSize: 11.5, color: "var(--muted)" }}>
                  {tr("Son asociaciones vistas en tus propios registros, no relaciones de causa probadas.")}
                </p>
              </div></div>
            )}

            <div className="orden-item"><div className="card panel">
              <h3>{tr("De dónde salen estos números")}</h3>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.7 }}>
                <li>{tr("Periodo")}: {informe.desde} a {informe.hasta}, {informe.dias} {tr("días")}.</li>
                <li>{tr("Un día sin registro no cuenta como cero: queda fuera del promedio.")}</li>
                <li>{tr("El sueño sale de la hora de acostarte y levantarte que anotas en Hábitos.")}</li>
                <li>{tr("La energía es la escala de 1 a 5 que anotas en Energía.")}</li>
                <li>{tr("Los minutos de movimiento son los que registras en cada sesión.")}</li>
                <li>{tr("Este informe no es un documento clínico ni reemplaza una evaluación profesional.")}</li>
              </ul>
            </div></div>
          </div>
        </>
      )}

      {exportar && informe && (
        <ExportarBienestar informe={informe} conTextoDiario={conTextoDiario}
          onCambiarTextoDiario={setConTextoDiario} onClose={() => setExportar(false)} />
      )}
    </>
  );
}
