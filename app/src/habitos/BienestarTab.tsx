import { useEffect, useState } from "react";
import { PRACTICAS, faseLunar, proximasLunas, type Practica } from "./bienestar";

export function BienestarTab() {
  const [practica, setPractica] = useState<Practica | null>(null);
  const hoy = new Date();
  const fase = faseLunar(hoy);
  const lunas = proximasLunas(hoy);
  const fmt = (d: Date) => d.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="panelgrid">
      <div className="card panel">
        <h3>🧘 Meditaciones y respiración</h3>
        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
          Prácticas cortas para volver a tu centro. Elige una y sigue los pasos con el temporizador.
        </p>
        {PRACTICAS.map((p) => (
          <div className="txrow" key={p.nombre}>
            <span className="txicon">{p.emoji}</span>
            <div className="txmeta">
              <b>{p.nombre}</b>
              <small>{p.minutos} minutos. {p.descripcion}</small>
            </div>
            <button className="btn ghost" onClick={() => setPractica(p)}>Comenzar</button>
          </div>
        ))}
      </div>

      <div className="card panel" style={{ alignSelf: "start" }}>
        <h3>🌙 Calendario lunar</h3>
        <div style={{ textAlign: "center", padding: "10px 0 14px" }}>
          <div style={{ fontSize: 52, lineHeight: 1 }}>{fase.emoji}</div>
          <div style={{ fontFamily: "var(--serif)", fontSize: 19, fontWeight: 500, marginTop: 8 }}>{fase.nombre}</div>
          <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 6, lineHeight: 1.5 }}>{fase.consejo}</p>
        </div>
        <div style={{ borderTop: "1px solid var(--line-soft)", paddingTop: 10, display: "grid", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--ink-soft)" }}>
            <span>🌕 Próxima luna llena</span><b style={{ fontSize: 12.5 }}>{fmt(lunas.llena)}</b>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--ink-soft)" }}>
            <span>🌑 Próxima luna nueva</span><b style={{ fontSize: 12.5 }}>{fmt(lunas.nueva)}</b>
          </div>
        </div>
      </div>

      {practica && <PracticaModal practica={practica} onClose={() => setPractica(null)} />}
    </div>
  );
}

function PracticaModal({ practica, onClose }: { practica: Practica; onClose: () => void }) {
  const total = practica.minutos * 60;
  const [restante, setRestante] = useState(total);
  const [corriendo, setCorriendo] = useState(false);

  useEffect(() => {
    if (!corriendo || restante <= 0) return;
    const id = setInterval(() => setRestante((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [corriendo, restante]);

  const mm = String(Math.floor(restante / 60)).padStart(2, "0");
  const ss = String(restante % 60).padStart(2, "0");
  const pct = Math.round(((total - restante) / total) * 100);
  const listo = restante === 0;

  return (
    <div className="tp-overlay" onClick={onClose}>
      <div className="tp" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <h3 style={{ marginBottom: 4 }}>{practica.emoji} {practica.nombre}</h3>
        <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 14 }}>{practica.descripcion}</p>

        <div style={{ textAlign: "center", margin: "6px 0 14px" }}>
          <div className="tnum" style={{ fontFamily: "var(--serif)", fontSize: 44, fontWeight: 500, color: listo ? "var(--ok)" : "var(--ink)" }}>
            {listo ? "✨" : `${mm}:${ss}`}
          </div>
          <div className="track" style={{ marginTop: 10 }}>
            <div className="fill" style={{ width: `${pct}%`, background: listo ? "var(--ok)" : "var(--accent)" }} />
          </div>
        </div>

        <ol style={{ paddingLeft: 20, display: "grid", gap: 6, marginBottom: 16 }}>
          {practica.pasos.map((paso) => (
            <li key={paso} style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.5 }}>{paso}</li>
          ))}
        </ol>

        <div style={{ display: "flex", gap: 8 }}>
          {!listo && (
            <button className="btn primary" onClick={() => setCorriendo(!corriendo)}>
              {corriendo ? "Pausar" : restante === total ? "Comenzar" : "Continuar"}
            </button>
          )}
          {listo && <span className="chip" style={{ background: "color-mix(in srgb,var(--ok) 18%,var(--paper))", color: "var(--ok)" }}>🎉 Práctica completa. ¿Cómo te sientes?</span>}
          <button className="btn ghost" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
