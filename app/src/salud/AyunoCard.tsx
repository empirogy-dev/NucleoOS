import { useEffect, useState } from "react";
import { ultimoBocado, type Meal } from "./comidas";

// Contador de ayuno: horas desde tu última comida, con una meta que eliges.
// Se alimenta solo de tus platos registrados, sin que anotes nada extra.

const LS_META = "nucleoos-ayuno-meta";
const METAS = [12, 14, 16, 18];

function metaGuardada(): number {
  const v = Number(localStorage.getItem(LS_META));
  return METAS.includes(v) ? v : 16;
}

export function AyunoCard({ meals }: { meals: Meal[] }) {
  const [meta, setMeta] = useState(metaGuardada);
  const [ahora, setAhora] = useState(() => Date.now());

  // Late un minuto: el contador avanza mientras la miras.
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const ultima = ultimoBocado(meals);

  if (!ultima) {
    return (
      <div className="card panel">
        <h3>⏳ Ayuno</h3>
        <p style={{ fontSize: 13.5, color: "var(--muted)" }}>
          Cuando registres tu primera comida con su hora, aquí verás cuántas horas llevas en ayuno. Se calcula solo.
        </p>
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
      <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
        El ayuno intermitente no le sirve a todo el mundo. Esto es una guía amable, no una regla. Si tienes dudas de salud, pregúntale a tu médico.
      </p>
    </div>
  );
}
