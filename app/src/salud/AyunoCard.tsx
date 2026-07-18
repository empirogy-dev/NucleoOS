import { useEffect, useState } from "react";
import { ultimoBocado, type Meal } from "./comidas";

// Contador de ayuno: horas desde tu última comida, con una meta que eliges.
// Se alimenta solo de tus platos registrados, sin que anotes nada extra.

const LS_META = "nucleoos-ayuno-meta";
const LS_MANUAL = "nucleoos-ayuno-manual";
const METAS = [12, 14, 16, 18];

function metaGuardada(): number {
  const v = Number(localStorage.getItem(LS_META));
  return METAS.includes(v) ? v : 16;
}

function manualGuardado(): Date | null {
  const raw = localStorage.getItem(LS_MANUAL);
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

/** La última comida real: el plato registrado más reciente o la marca manual, lo que sea más nuevo. */
function ultimaComida(meals: Meal[]): Date | null {
  const delPlato = ultimoBocado(meals);
  const manual = manualGuardado();
  if (delPlato && manual) return delPlato > manual ? delPlato : manual;
  return delPlato ?? manual;
}

export function AyunoCard({ meals }: { meals: Meal[] }) {
  const [meta, setMeta] = useState(metaGuardada);
  const [ahora, setAhora] = useState(() => Date.now());
  const [editandoHora, setEditandoHora] = useState(false);
  const [horaManual, setHoraManual] = useState("");

  // Late un minuto: el contador avanza mientras la miras.
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  function marcarAhora() {
    localStorage.setItem(LS_MANUAL, new Date().toISOString());
    setAhora(Date.now());
    setEditandoHora(false);
  }

  function guardarHoraManual() {
    if (!horaManual) return;
    const d = new Date(horaManual);
    if (isNaN(d.getTime()) || d.getTime() > Date.now()) return;
    localStorage.setItem(LS_MANUAL, d.toISOString());
    setAhora(Date.now());
    setEditandoHora(false);
    setHoraManual("");
  }

  const formularioManual = (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button type="button" className="btn primary" onClick={marcarAhora}>⏳ Empezar mi ayuno ahora</button>
        <button type="button" className="btn ghost" onClick={marcarAhora}>🍴 Acabo de comer</button>
        <button type="button" className="btn ghost" onClick={() => setEditandoHora(!editandoHora)}>Fue a otra hora</button>
      </div>
      <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
        Los dos botones hacen lo mismo por dentro: el ayuno siempre parte en tu último bocado. Si comes dentro de tu ventana, el contador se reinicia, así funciona el ayuno de verdad.
      </p>
      {editandoHora && (
        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
          <input type="datetime-local" className="input-inline" style={{ flex: "1 1 170px" }}
            value={horaManual} onChange={(e) => setHoraManual(e.target.value)}
            aria-label="Hora de tu última comida" />
          <button type="button" className="btn primary" disabled={!horaManual} onClick={guardarHoraManual}>Guardar</button>
        </div>
      )}
    </div>
  );

  const ultima = ultimaComida(meals);

  if (!ultima) {
    return (
      <div className="card panel">
        <h3>⏳ Ayuno</h3>
        <p style={{ fontSize: 13.5, color: "var(--muted)" }}>
          Registra un plato o marca a qué hora comiste por última vez, y aquí verás cuántas horas llevas en ayuno.
        </p>
        {formularioManual}
      </div>
    );
  }

  const ms = Math.max(0, ahora - ultima.getTime());
  const horas = ms / 3600000;
  const h = Math.floor(horas);
  const min = Math.floor((ms % 3600000) / 60000);
  const pct = Math.min(100, (horas / meta) * 100);
  const cumplida = horas >= meta;
  const hora = ultima.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="card panel">
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <h3 style={{ flex: 1 }}>⏳ Ayuno</h3>
        {cumplida && <span className="chip">meta cumplida</span>}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "2px 0 8px" }}>
        <b className="tnum" style={{ fontSize: 30, letterSpacing: "-.02em" }}>{h}</b>
        <span style={{ color: "var(--muted)" }}>h</span>
        <b className="tnum" style={{ fontSize: 30, letterSpacing: "-.02em" }}>{min}</b>
        <span style={{ color: "var(--muted)" }}>min</span>
        <span style={{ marginLeft: "auto", fontSize: 12.5, color: "var(--muted)" }}>meta {meta} h</span>
      </div>

      <div className="track" style={{ height: 8 }}>
        <div className="fill" style={{ width: `${pct}%`, background: cumplida ? "var(--sal)" : "var(--info)" }} />
      </div>

      <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "10px 0 8px" }}>
        {cumplida
          ? `Completaste tu ventana de ${meta} horas. Come cuando tu cuerpo lo pida, sin apuro.`
          : `Tu última comida fue a las ${hora}. Te faltan ${Math.max(0, meta - h)} h para tu meta, si es que quieres llegar.`}
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11.5, color: "var(--muted)" }}>Tu ventana</span>
        <div style={{ display: "flex", gap: 6 }}>
          {METAS.map((m) => (
            <button key={m} type="button"
              className={"pomo-chip" + (meta === m ? " on" : "")}
              onClick={() => { setMeta(m); localStorage.setItem(LS_META, String(m)); }}>
              {m} h
            </button>
          ))}
        </div>
      </div>
      {formularioManual}
      <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
        El ayuno intermitente no le sirve a todo el mundo. Esto es una guía amable, no una regla. Si tienes dudas de salud, pregúntale a tu médico.
      </p>
    </div>
  );
}
