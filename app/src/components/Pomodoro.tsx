import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Timer, X } from "lucide-react";
import { bloquesHoyLocal, saveFocusBlock, sumarBloqueLocal, type PomodoroPreset } from "../foco/data";
import { listProjects, type Project } from "../trabajo/data";
import { Selector } from "./Selector";

// Pomodoro global, pensado para el foco con TDAH: vive sobre todas las
// páginas, externaliza el tiempo (lo ves siempre), parte con un toque,
// avisa con una campana suave y celebra cada bloque sin culpa.

type Modo = "focus" | "break";

interface Estado {
  modo: Modo;
  corriendo: boolean;
  terminaEn: number | null; // epoch ms mientras corre
  restante: number; // segundos, cuando está en pausa
  etiqueta: string;
  focoMin: number;
  descansoMin: number;
}

const LS = "nucleoos-pomodoro";
const PRESETS = [15, 25, 45];

function cargar(): Estado {
  try {
    const raw = localStorage.getItem(LS);
    if (raw) {
      const e = JSON.parse(raw) as Estado;
      // Si quedó corriendo desde antes, recalculamos lo que resta.
      if (e.corriendo && e.terminaEn) {
        const rest = Math.round((e.terminaEn - Date.now()) / 1000);
        return { ...e, restante: Math.max(0, rest), corriendo: rest > 0 };
      }
      return e;
    }
  } catch { /* estado corrupto, partimos limpio */ }
  return { modo: "focus", corriendo: false, terminaEn: null, restante: 25 * 60, etiqueta: "", focoMin: 25, descansoMin: 5 };
}

/** Campana suave, un acorde ascendente. Nada de alarmas estridentes. */
function campana() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [523.25, 659.25, 783.99].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = f;
      o.connect(g);
      g.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.18;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.16, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
      o.start(t);
      o.stop(t + 0.95);
    });
    setTimeout(() => void ctx.close(), 1600);
  } catch { /* sin audio, seguimos igual */ }
}

function mmss(seg: number): string {
  const m = Math.floor(Math.max(0, seg) / 60);
  const s = Math.max(0, seg) % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function Pomodoro() {
  const [e, setE] = useState<Estado>(cargar);
  const [abierto, setAbierto] = useState(false);
  const [hechos, setHechos] = useState(bloquesHoyLocal);
  const [festejo, setFestejo] = useState(false);
  const [proyectos, setProyectos] = useState<Project[]>([]);
  // A qué empuja este bloque: nada, un proyecto de Trabajo, o Aprendizaje.
  const [destino, setDestino] = useState<string>("libre");
  const eRef = useRef(e);
  eRef.current = e;
  const destinoRef = useRef(destino);
  destinoRef.current = destino;
  const proyectosRef = useRef(proyectos);
  proyectosRef.current = proyectos;

  // Persistimos cada cambio para sobrevivir a recargas.
  useEffect(() => {
    localStorage.setItem(LS, JSON.stringify(e));
  }, [e]);

  // Proyectos activos para ligar el bloque (silencioso si Trabajo no está migrado).
  useEffect(() => {
    if (!abierto || proyectos.length > 0) return;
    listProjects()
      .then((ps) => setProyectos(ps.filter((p) => p.status === "activo")))
      .catch(() => { /* sin proyectos, el selector ofrece lo demás */ });
  }, [abierto, proyectos.length]);

  // Otras páginas pueden abrir el pomodoro ya apuntando a su proyecto o área.
  useEffect(() => {
    const escucha = (ev: Event) => {
      const d = (ev as CustomEvent<PomodoroPreset>).detail ?? {};
      if (d.projectId) setDestino(`p:${d.projectId}`);
      else if (d.area) setDestino(`a:${d.area}`);
      setAbierto(true);
    };
    window.addEventListener("nucleoos:pomodoro", escucha);
    return () => window.removeEventListener("nucleoos:pomodoro", escucha);
  }, []);

  const completar = useCallback(() => {
    campana();
    const prev = eRef.current;
    if (prev.modo === "focus") {
      setHechos(sumarBloqueLocal());
      setFestejo(true);
      setTimeout(() => setFestejo(false), 6000);
      // El bloque queda registrado con su destino (proyecto o área).
      const d = destinoRef.current;
      void saveFocusBlock({
        minutes: prev.focoMin,
        label: prev.etiqueta.trim() || null,
        project_id: d.startsWith("p:") ? d.slice(2) : null,
        area: d.startsWith("a:") ? d.slice(2) : null,
      });
      // Al terminar el foco, el descanso arranca solo para que de verdad pares.
      setE({ ...prev, modo: "break", restante: prev.descansoMin * 60, corriendo: true, terminaEn: Date.now() + prev.descansoMin * 60 * 1000 });
    } else {
      // Terminado el descanso, tú decides cuándo volver.
      setE({ ...prev, modo: "focus", restante: prev.focoMin * 60, corriendo: false, terminaEn: null });
    }
  }, []);

  // Reloj: revisa cada 250 ms cuánto queda.
  useEffect(() => {
    if (!e.corriendo) return;
    const id = setInterval(() => {
      const cur = eRef.current;
      if (!cur.corriendo || !cur.terminaEn) return;
      const rest = Math.round((cur.terminaEn - Date.now()) / 1000);
      if (rest <= 0) {
        completar();
      } else {
        setE((s) => ({ ...s, restante: rest }));
      }
    }, 250);
    return () => clearInterval(id);
  }, [e.corriendo, completar]);

  function iniciar() {
    setE((s) => {
      const rest = s.restante > 0 ? s.restante : (s.modo === "focus" ? s.focoMin : s.descansoMin) * 60;
      return { ...s, corriendo: true, restante: rest, terminaEn: Date.now() + rest * 1000 };
    });
  }
  function pausar() {
    setE((s) => ({ ...s, corriendo: false, terminaEn: null }));
  }
  function reiniciar() {
    setE((s) => ({ ...s, corriendo: false, terminaEn: null, restante: (s.modo === "focus" ? s.focoMin : s.descansoMin) * 60 }));
  }
  function elegirFoco(min: number) {
    setE((s) => ({
      ...s,
      focoMin: min,
      restante: s.modo === "focus" && !s.corriendo ? min * 60 : s.restante,
    }));
  }

  const total = (e.modo === "focus" ? e.focoMin : e.descansoMin) * 60;
  const pct = total > 0 ? Math.min(100, ((total - e.restante) / total) * 100) : 0;

  return (
    <>
      <button
        className={"pomo-fab" + (e.corriendo ? " corriendo" : "")}
        aria-label={abierto ? "Cerrar pomodoro" : "Abrir pomodoro"}
        onClick={() => setAbierto((v) => !v)}
      >
        {e.corriendo ? (
          <span className="pomo-fab-time tnum">{mmss(e.restante)}</span>
        ) : (
          <Timer size={20} />
        )}
        {e.corriendo && <span className={"pomo-fab-dot " + e.modo} />}
      </button>

      {abierto && (
        <div className="pomo-panel" role="dialog" aria-label="Temporizador pomodoro">
          <div className="pomo-head">
            <b>{e.modo === "focus" ? "Enfoque" : "Respiro"}</b>
            <button className="xdel" aria-label="Cerrar" style={{ width: 26, height: 26 }} onClick={() => setAbierto(false)}>
              <X size={14} />
            </button>
          </div>

          <input
            className="input-inline pomo-label"
            value={e.etiqueta}
            onChange={(ev) => setE((s) => ({ ...s, etiqueta: ev.target.value }))}
            placeholder="¿En qué te enfocas ahora?"
          />

          <div style={{ marginBottom: 12 }}>
            <Selector compacto value={destino} ariaLabel="A qué empuja este bloque"
              opciones={[
                { value: "libre", label: "Bloque libre, sin proyecto" },
                ...proyectos.map((p) => ({ value: `p:${p.id}`, label: `💼 ${p.name}` })),
                { value: "a:aprendizaje", label: "📚 Aprendizaje" },
              ]}
              onChange={setDestino} />
          </div>

          <div className="pomo-reloj tnum">{mmss(e.restante)}</div>
          <div className="pomo-track"><div className="pomo-fill" style={{ width: `${pct}%` }} /></div>

          <div className="pomo-controls">
            {e.corriendo ? (
              <button className="btn primary" onClick={pausar}><Pause size={15} style={{ verticalAlign: "-2px", marginRight: 5 }} />Pausa</button>
            ) : (
              <button className="btn primary" onClick={iniciar}><Play size={15} style={{ verticalAlign: "-2px", marginRight: 5 }} />{e.restante < total ? "Seguir" : "Empezar"}</button>
            )}
            <button className="btn ghost" onClick={reiniciar} aria-label="Reiniciar"><RotateCcw size={15} /></button>
          </div>

          {e.modo === "focus" && (
            <div className="pomo-presets">
              <span className="pomo-presets-lb">Minutos de foco</span>
              <div style={{ display: "flex", gap: 6 }}>
                {PRESETS.map((m) => (
                  <button key={m} className={"pomo-chip" + (e.focoMin === m ? " on" : "")} onClick={() => elegirFoco(m)}>{m}</button>
                ))}
              </div>
            </div>
          )}

          <p className="pomo-hechos">
            {festejo
              ? "Bloque completo. Respira, te lo ganaste. 🌱"
              : hechos > 0
                ? `Llevas ${hechos} ${hechos === 1 ? "bloque" : "bloques"} de foco hoy. Un paso a la vez.`
                : "Un bloque corto ya es empezar. Sin presión."}
          </p>
        </div>
      )}
    </>
  );
}
