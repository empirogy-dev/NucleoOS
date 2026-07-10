import { useState } from "react";
import { Brain } from "lucide-react";
import { fmtFechaLocal, hoyLocal } from "../lib/fechas";
import { faseLunar, proximasLunas } from "./lunar";
import { MEDITACIONES, RESPIRACIONES, listSesiones, type Practica, type Sesion } from "./practicas";
import { SesionModal } from "./SesionModal";

export function MentePage() {
  const [sesion, setSesion] = useState<{ practica: Practica; minutos: number } | null>(null);
  const [historial, setHistorial] = useState<Sesion[]>(listSesiones());

  const hoy = hoyLocal();
  const fase = faseLunar(new Date());
  const lunas = proximasLunas(new Date());
  const fmt = (d: Date) => d.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });

  const hace7 = new Date();
  hace7.setDate(hace7.getDate() - 6);
  const desde = fmtFechaLocal(hace7);
  const sesionesHoy = historial.filter((s) => s.fecha === hoy).length;
  const minutosSemana = historial.filter((s) => s.fecha >= desde).reduce((sum, s) => sum + s.minutos, 0);

  return (
    <div className="page">
      <div className="page-head">
        <div className="eyebrow"><Brain size={13} /> Núcleo</div>
        <h1>Mente</h1>
        <p>Respiración guiada, meditaciones y tu calma diaria. Elige cuántos minutos tienes y la sesión se adapta.</p>
      </div>

      <div className="statrow" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
        <div className="card stat"><div className="k">Sesiones hoy</div><div className="v tnum">{sesionesHoy}</div></div>
        <div className="card stat"><div className="k">Minutos (7 días)</div><div className="v tnum">{minutosSemana}</div></div>
        <div className="card stat"><div className="k">Fase lunar</div><div className="v" style={{ fontSize: 20 }}>{fase.emoji} {fase.nombre}</div></div>
        <div className="card stat"><div className="k">Próxima luna llena</div><div className="v" style={{ fontSize: 17 }}>{lunas.llena.toLocaleDateString("es-CL", { day: "numeric", month: "long" })}</div></div>
      </div>

      <div className="panelgrid">
        <div style={{ display: "grid", gap: 14, alignSelf: "start" }}>
          <ListaPracticas
            titulo="🫁 Respiración guiada"
            intro="Con círculo animado y una señal sonora suave en cada cambio: inhalar, sostener, exhalar."
            practicas={RESPIRACIONES}
            onComenzar={(practica, minutos) => setSesion({ practica, minutos })}
          />
          <ListaPracticas
            titulo="🧘 Meditaciones"
            intro="Guiadas paso a paso, con campana al inicio y al final. De 5 a 30 minutos."
            practicas={MEDITACIONES}
            onComenzar={(practica, minutos) => setSesion({ practica, minutos })}
          />
        </div>

        <div style={{ display: "grid", gap: 14, alignSelf: "start" }}>
          <div className="card panel">
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

          <div className="card panel">
            <h3>📖 Tus últimas sesiones</h3>
            {historial.length === 0 && (
              <p style={{ color: "var(--muted)", fontSize: 13.5 }}>
                Aún no hay sesiones. La primera puede ser de dos minutos, eso ya cuenta.
              </p>
            )}
            {historial.slice(0, 7).map((s, i) => (
              <div className="txrow" key={`${s.fecha}-${s.id}-${i}`}>
                <span className="txicon">{s.fecha === hoy ? "✨" : "🕊"}</span>
                <div className="txmeta">
                  <b>{s.nombre}</b>
                  <small>{s.minutos} min, {s.fecha === hoy ? "hoy" : s.fecha}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {sesion && (
        <SesionModal
          practica={sesion.practica}
          minutos={sesion.minutos}
          onClose={() => setSesion(null)}
          onCompleta={() => setHistorial(listSesiones())}
        />
      )}
    </div>
  );
}

function ListaPracticas({ titulo, intro, practicas, onComenzar }: {
  titulo: string;
  intro: string;
  practicas: Practica[];
  onComenzar: (p: Practica, minutos: number) => void;
}) {
  const [minutos, setMinutos] = useState<Record<string, number>>({});
  return (
    <div className="card panel">
      <h3>{titulo}</h3>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>{intro}</p>
      {practicas.map((p) => {
        const min = minutos[p.id] ?? p.duraciones[0];
        return (
          <div className="txrow" key={p.id}>
            <span className="txicon">{p.emoji}</span>
            <div className="txmeta">
              <b>{p.nombre}</b>
              <small>{p.descripcion}</small>
            </div>
            <select
              className="ms-sel"
              aria-label={`Duración de ${p.nombre}`}
              value={min}
              onChange={(e) => setMinutos((m) => ({ ...m, [p.id]: Number(e.target.value) }))}
            >
              {p.duraciones.map((d) => <option key={d} value={d}>{d} min</option>)}
            </select>
            <button className="btn ghost" onClick={() => onComenzar(p, min)}>Comenzar</button>
          </div>
        );
      })}
    </div>
  );
}
