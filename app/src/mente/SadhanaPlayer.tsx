import { useEffect, useRef, useState } from "react";
import { fechaRegistro } from "../lib/fechas";
import { guardarSesion, type Sesion } from "./practicas";
import { minutosSadhana, type Sadhana } from "./sadhana";
import { TONO_FASE, campana, detenerAmbiente, toggleAmbiente, tono } from "./sonido";

// Reproductor de sadhana: los pasos avanzan solos, con campana entre ellos.
// Tú solo te quedas; la secuencia te lleva.

export function SadhanaPlayer({ sadhana, onClose, onCompleta }: {
  sadhana: Sadhana;
  onClose: () => void;
  onCompleta: (s: Sesion) => void;
}) {
  const pasos = sadhana.pasos;
  const [pasoIdx, setPasoIdx] = useState(0);
  const [restante, setRestante] = useState(pasos[0].minutos * 60);
  const [corriendo, setCorriendo] = useState(false);
  const [iniciado, setIniciado] = useState(false);
  const [listo, setListo] = useState(false);
  const [ambiente, setAmbiente] = useState(false);
  const guardada = useRef(false);

  const paso = pasos[pasoIdx];
  const totalSeg = minutosSadhana(sadhana) * 60;
  const transcurridoPasos = pasos.slice(0, pasoIdx).reduce((s, p) => s + p.minutos * 60, 0);
  const elapsedTotal = transcurridoPasos + (paso.minutos * 60 - restante);
  const pctTotal = Math.min(100, Math.round((elapsedTotal / totalSeg) * 100));

  // Cronómetro del paso actual.
  useEffect(() => {
    if (!corriendo || listo || restante <= 0) return;
    const id = setInterval(() => setRestante((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [corriendo, restante, listo]);

  // Al terminar un paso: campana y avanzar, o cerrar la sadhana.
  useEffect(() => {
    if (restante > 0 || !iniciado || listo) return;
    if (pasoIdx < pasos.length - 1) {
      campana();
      setPasoIdx(pasoIdx + 1);
      setRestante(pasos[pasoIdx + 1].minutos * 60);
    } else {
      setListo(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restante, iniciado, listo]);

  // Cierre: campana final, guardar y avisar.
  useEffect(() => {
    if (!listo || guardada.current) return;
    guardada.current = true;
    campana();
    detenerAmbiente();
    setAmbiente(false);
    const s: Sesion = { fecha: fechaRegistro(), id: sadhana.id, nombre: sadhana.nombre, minutos: minutosSadhana(sadhana) };
    guardarSesion(s);
    onCompleta(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listo]);

  useEffect(() => () => detenerAmbiente(), []);

  // Fase de respiración del paso actual (si el paso la tiene).
  const fases = paso.fases;
  const elapsedPaso = paso.minutos * 60 - restante;
  const cicloLen = fases ? fases.reduce((s, f) => s + f.segundos, 0) : 0;
  let faseIdx = 0;
  let faseRest = 0;
  if (fases && cicloLen > 0) {
    let pos = elapsedPaso % cicloLen;
    for (let i = 0; i < fases.length; i += 1) {
      if (pos < fases[i].segundos) {
        faseIdx = i;
        faseRest = fases[i].segundos - pos;
        break;
      }
      pos -= fases[i].segundos;
    }
  }
  const faseKey = fases ? `${pasoIdx}-${Math.floor(cicloLen > 0 ? elapsedPaso / cicloLen : 0)}-${faseIdx}` : "";
  const ultimaFase = useRef("");
  useEffect(() => {
    if (!fases || !iniciado || listo || !corriendo) return;
    if (ultimaFase.current === "" || elapsedPaso === 0) {
      ultimaFase.current = faseKey;
      return;
    }
    if (ultimaFase.current !== faseKey) {
      ultimaFase.current = faseKey;
      tono(TONO_FASE[fases[faseIdx].tipo]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faseKey, iniciado, corriendo]);

  function alternar() {
    if (!iniciado) {
      setIniciado(true);
      campana();
    }
    setCorriendo((c) => !c);
  }

  function escalaDe(i: number): number {
    if (!fases) return 0.5;
    const tipo = fases[i].tipo;
    if (tipo === "inhala") return 1;
    if (tipo === "exhala") return 0;
    return escalaDe((i - 1 + fases.length) % fases.length);
  }

  const esc = iniciado && !listo && corriendo ? escalaDe(faseIdx) : 0.5;
  const mm = String(Math.floor(restante / 60)).padStart(2, "0");
  const ss = String(restante % 60).padStart(2, "0");

  return (
    <div className="tp-overlay" onClick={onClose}>
      <div className="tp" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <h3 style={{ marginBottom: 2 }}>{sadhana.emoji} {sadhana.nombre}</h3>
        <p style={{ fontSize: 12.5, color: "var(--muted)", fontStyle: "italic", marginBottom: 12 }}>
          “{sadhana.intencion}”
        </p>

        <div className="sd-dots">
          {pasos.map((p, i) => (
            <span key={p.titulo} className={"sd-dot" + (i < pasoIdx || listo ? " done" : i === pasoIdx ? " activo" : "")} title={p.titulo} />
          ))}
        </div>

        {listo ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 44 }}>🙏</div>
            <p style={{ fontFamily: "var(--serif)", fontSize: 19, marginTop: 8 }}>Sadhana completa</p>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 6 }}>
              {minutosSadhana(sadhana)} minutos contigo. Quedó guardada en tus sesiones.
            </p>
          </div>
        ) : !iniciado && (sadhana.intro || sadhana.preparacion) ? (
          <div style={{ padding: "4px 2px 10px" }}>
            {sadhana.intro && (
              <p style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.65, marginBottom: 12 }}>
                {sadhana.intro}
              </p>
            )}
            {sadhana.preparacion && (
              <>
                <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".11em", color: "var(--muted)", fontWeight: 600, marginBottom: 6 }}>
                  Antes de comenzar
                </div>
                <ul style={{ paddingLeft: 18, display: "grid", gap: 5, marginBottom: 12 }}>
                  {sadhana.preparacion.map((p) => (
                    <li key={p} style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5 }}>{p}</li>
                  ))}
                </ul>
              </>
            )}
            <p style={{ fontSize: 12.5, color: "var(--muted)" }}>
              {pasos.length} pasos, {minutosSadhana(sadhana)} minutos. La secuencia avanza sola con una campana suave entre pasos.
            </p>
          </div>
        ) : (
          <>
            <div style={{ textAlign: "center", margin: "4px 0 10px" }}>
              <div style={{ fontSize: 30 }}>{paso.emoji}</div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 20, fontWeight: 500, marginTop: 2 }}>{paso.titulo}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                Paso {pasoIdx + 1} de {pasos.length}, quedan <b className="tnum">{mm}:{ss}</b>
              </div>
            </div>

            {fases ? (
              <div className="resp-wrap" style={{ width: 170, height: 170 }}>
                <div className="resp-guia" />
                <div
                  className="resp-circulo"
                  style={{
                    width: 140,
                    height: 140,
                    transform: `scale(${0.62 + esc * 0.56})`,
                    transitionDuration: iniciado && corriendo ? `${fases[faseIdx].segundos}s` : "0.6s",
                  }}
                />
                <div className="resp-info">
                  {iniciado ? (
                    <>
                      <div className="resp-fase" style={{ fontSize: 16 }}>{fases[faseIdx].etiqueta}</div>
                      <div className="resp-cuenta tnum">{corriendo ? faseRest : "⏸"}</div>
                    </>
                  ) : (
                    <div className="resp-fase" style={{ fontSize: 13 }}>Cuando quieras</div>
                  )}
                </div>
              </div>
            ) : null}

            <p style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.6, textAlign: "center", maxWidth: "46ch", margin: "6px auto 14px" }}>
              {paso.guia}
            </p>
          </>
        )}

        <div className="track" style={{ marginBottom: 14 }}>
          <div className="fill" style={{ width: `${listo ? 100 : pctTotal}%`, background: listo ? "var(--ok)" : "var(--men)" }} />
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {!listo && (
            <button className="btn primary" onClick={alternar}>
              {corriendo ? "Pausar" : iniciado ? "Continuar" : "Comenzar"}
            </button>
          )}
          {!listo && (
            <button className={"btn ghost" + (ambiente ? " amb-on" : "")} title="Sonido ambiental suave"
              onClick={() => setAmbiente(toggleAmbiente())}>
              {ambiente ? "🌧 Ambiente activo" : "🌧 Ambiente"}
            </button>
          )}
          <span style={{ flex: 1 }} />
          <button className="btn ghost" onClick={onClose}>{listo ? "Cerrar" : "Terminar"}</button>
        </div>
      </div>
    </div>
  );
}
