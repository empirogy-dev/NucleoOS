import { useEffect, useMemo, useRef, useState } from "react";
import { cierreDeFondo } from "../components/cierreDeFondo";
import { useIdioma } from "../idioma/IdiomaProvider";
import { fechaRegistro } from "../lib/fechas";
import { guardarSesion, type Practica, type Sesion } from "./practicas";
import { TONO_FASE, campana, detenerAmbiente, toggleAmbiente, tono } from "./sonido";

// Reproductor de sesiones: respiración con círculo animado y señal sonora
// por fase, meditaciones con guía paso a paso y campana de inicio y cierre.

export function SesionModal({ practica, minutos, onClose, onCompleta }: {
  practica: Practica;
  minutos: number;
  onClose: () => void;
  onCompleta: (s: Sesion) => void;
}) {
  const { t: tr } = useIdioma();
  const total = minutos * 60;
  const [restante, setRestante] = useState(total);
  const [corriendo, setCorriendo] = useState(false);
  const [iniciado, setIniciado] = useState(false);
  const [ambiente, setAmbiente] = useState(false);
  const guardada = useRef(false);

  const elapsed = total - restante;
  const listo = restante === 0;
  const fases = practica.fases;

  // Cronómetro general.
  useEffect(() => {
    if (!corriendo || restante <= 0) return;
    const id = setInterval(() => setRestante((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [corriendo, restante]);

  // Fase de respiración derivada del tiempo transcurrido.
  const cicloLen = useMemo(() => (fases ? fases.reduce((s, f) => s + f.segundos, 0) : 0), [fases]);
  let faseIdx = 0;
  let faseRest = 0;
  if (fases && cicloLen > 0) {
    let pos = elapsed % cicloLen;
    for (let i = 0; i < fases.length; i += 1) {
      if (pos < fases[i].segundos) {
        faseIdx = i;
        faseRest = fases[i].segundos - pos;
        break;
      }
      pos -= fases[i].segundos;
    }
  }
  const faseKey = fases ? `${Math.floor(cicloLen > 0 ? elapsed / cicloLen : 0)}-${faseIdx}` : "";

  // Señal sonora suave al cambiar de fase.
  const primeraFase = useRef(true);
  useEffect(() => {
    if (!fases || !iniciado || listo) return;
    if (primeraFase.current) {
      primeraFase.current = false;
      return; // la campana de inicio ya sonó
    }
    tono(TONO_FASE[fases[faseIdx].tipo]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faseKey, iniciado]);

  // Paso actual de la meditación, repartido en la duración elegida.
  const pasoIdx = Math.min(
    practica.pasos.length - 1,
    Math.floor(elapsed / Math.max(1, total / practica.pasos.length)),
  );
  useEffect(() => {
    if (practica.tipo !== "meditacion" || !iniciado || listo || pasoIdx === 0) return;
    tono(660, 1.3, 0.05);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pasoIdx]);

  // Cierre de sesión: campana, guardar y avisar.
  useEffect(() => {
    if (!listo || !iniciado || guardada.current) return;
    guardada.current = true;
    campana();
    detenerAmbiente();
    setAmbiente(false);
    const s: Sesion = { fecha: fechaRegistro(), id: practica.id, nombre: practica.nombre, minutos };
    guardarSesion(s);
    onCompleta(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listo, iniciado]);

  // Al cerrar el modal se apaga el sonido ambiental.
  useEffect(() => () => detenerAmbiente(), []);

  function alternar() {
    if (!iniciado) {
      setIniciado(true);
      campana();
    }
    setCorriendo((c) => !c);
  }

  // Si paras antes de tiempo, lo hecho también cuenta: un minuto de
  // respiración ya es un paso, no hace falta llegar al final para guardarlo.
  function guardarYTerminar() {
    if (guardada.current) { onClose(); return; }
    guardada.current = true;
    detenerAmbiente();
    const minutosReales = Math.max(1, Math.round(elapsed / 60));
    const s: Sesion = { fecha: fechaRegistro(), id: practica.id, nombre: practica.nombre, minutos: minutosReales };
    guardarSesion(s);
    onCompleta(s);
    onClose();
  }

  function escalaDe(i: number): number {
    if (!fases) return 0.5;
    const tipo = fases[i].tipo;
    if (tipo === "inhala") return 1;
    if (tipo === "exhala") return 0;
    return escalaDe((i - 1 + fases.length) % fases.length);
  }

  const esc = iniciado && !listo ? escalaDe(faseIdx) : 0.5;
  const mm = String(Math.floor(restante / 60)).padStart(2, "0");
  const ss = String(restante % 60).padStart(2, "0");
  const pct = Math.round((elapsed / total) * 100);

  return (
    <div className="tp-overlay" {...cierreDeFondo(onClose)}>
      <div className="tp" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 470 }}>
        <h3 style={{ marginBottom: 4 }}>{practica.emoji} {tr(practica.nombre)}</h3>
        <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: fases ? 8 : 12 }}>
          {minutos} {tr("minutos")}. {tr(practica.descripcion)}
        </p>

        {/* El patrón a la vista: así sabes qué ritmo vas a seguir antes de empezar. */}
        {fases && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {fases.map((f) => (
              <span key={f.etiqueta} className="chip" style={{ fontSize: 11.5 }}>
                {tr(f.etiqueta)} <b className="tnum">{f.segundos}</b>
              </span>
            ))}
          </div>
        )}

        {fases ? (
          <div className="resp-wrap">
            <div className="resp-guia" />
            <div
              className="resp-circulo"
              style={{
                transform: `scale(${0.62 + esc * 0.56})`,
                transitionDuration: iniciado && !listo ? `${fases[faseIdx].segundos}s` : "0.6s",
              }}
            />
            <div className="resp-info">
              {listo ? (
                <div className="resp-fase">✨</div>
              ) : iniciado ? (
                <>
                  <div className="resp-fase">{tr(fases[faseIdx].etiqueta)}</div>
                  <div className="resp-cuenta tnum">{corriendo ? faseRest : "⏸"}</div>
                </>
              ) : (
                <div className="resp-fase" style={{ fontSize: 14 }}>{tr("Cuando quieras")}</div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", margin: "10px 0 6px" }}>
            <div className="tnum" style={{ fontFamily: "var(--serif)", fontSize: 46, fontWeight: 500, color: listo ? "var(--ok)" : "var(--ink)" }}>
              {listo ? "✨" : `${mm}:${ss}`}
            </div>
          </div>
        )}

        <div className="track" style={{ margin: "4px 0 14px" }}>
          <div className="fill" style={{ width: `${pct}%`, background: listo ? "var(--ok)" : "var(--accent)" }} />
        </div>

        {fases && !listo && (
          <div style={{ textAlign: "center", fontSize: 12.5, color: "var(--muted)", marginBottom: 12 }}>
            {tr("Quedan")} <b className="tnum" style={{ color: "var(--ink-soft)" }}>{mm}:{ss}</b>. {tr("El círculo respira contigo: crece al inhalar y baja al exhalar.")}
          </div>
        )}

        {/* En la respiración el círculo es la guía, así que los pasos van
            plegados. En la meditación los pasos son la sesión, van abiertos. */}
        {practica.tipo === "respiracion" ? (
          <details className="sesion-tips">
            <summary>{tr("Cómo hacerlo")}</summary>
            <ol className="med-pasos">
              {practica.pasos.map((paso) => <li key={paso}>{tr(paso)}</li>)}
            </ol>
          </details>
        ) : (
          <ol className="med-pasos">
            {practica.pasos.map((paso, i) => (
              <li key={paso} className={iniciado && !listo && i === pasoIdx ? "activo" : undefined}>
                {tr(paso)}
              </li>
            ))}
          </ol>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {!listo && (
            <button className="btn primary" onClick={alternar}>
              {tr(corriendo ? "Pausar" : iniciado ? "Continuar" : "Comenzar")}
            </button>
          )}
          {!listo && (
            <button
              className={"btn ghost" + (ambiente ? " amb-on" : "")}
              title="Sonido ambiental suave"
              onClick={() => setAmbiente(toggleAmbiente())}
            >
              {"🌧 " + tr(ambiente ? "Ambiente activo" : "Ambiente")}
            </button>
          )}
          {listo && (
            <span className="chip" style={{ background: "color-mix(in srgb,var(--ok) 18%,var(--paper))", color: "var(--ok)" }}>
              🎉 {tr("Sesión completa. Quedó guardada.")}
            </span>
          )}
          <span style={{ flex: 1 }} />
          {!listo && iniciado ? (
            <>
              <button className="btn primary" onClick={guardarYTerminar}>{tr("Guardar y terminar")}</button>
              <button className="btn ghost" onClick={onClose} title={tr("Sale sin guardar nada de esta sesión")}>{tr("Salir sin guardar")}</button>
            </>
          ) : (
            <button className="btn ghost" onClick={onClose}>{tr(listo ? "Cerrar" : "Salir")}</button>
          )}
        </div>
      </div>
    </div>
  );
}
