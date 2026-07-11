import { useState } from "react";
import { Brain } from "lucide-react";
import { OrdenGrid } from "../components/OrdenGrid";
import { fmtFechaLocal, hoyLocal } from "../lib/fechas";
import { faseLunar, proximasLunas } from "./lunar";
import {
  CATEGORIAS_MENTE,
  MEDITACIONES,
  RESPIRACIONES,
  listSesiones,
  type CategoriaMente,
  type Practica,
  type Sesion,
} from "./practicas";
import { SADHANAS, minutosSadhana, type Sadhana } from "./sadhana";
import { SadhanaPlayer } from "./SadhanaPlayer";
import { SesionModal } from "./SesionModal";
import { DiarioTab } from "./DiarioTab";
import { InsightsTab } from "./InsightsTab";

// Mente: regulación, presencia, corazón y mentalidad.
// Las prácticas se agrupan por vía; la sadhana es la práctica central.

type Tab = "practicas" | "sadhana" | "diario" | "historial" | "insights";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "practicas", label: "Prácticas" },
  { key: "sadhana", label: "Sadhana 🕉" },
  { key: "diario", label: "Diario" },
  { key: "historial", label: "Historial" },
  { key: "insights", label: "Insights" },
];

export function MentePage() {
  const [tab, setTab] = useState<Tab>("practicas");
  const [categoria, setCategoria] = useState<CategoriaMente | "todas">("todas");
  const [sesion, setSesion] = useState<{ practica: Practica; minutos: number } | null>(null);
  const [sadhana, setSadhana] = useState<Sadhana | null>(null);
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

  const respiraciones = RESPIRACIONES.filter((p) => categoria === "todas" || p.categoria === categoria);
  const meditaciones = MEDITACIONES.filter((p) => categoria === "todas" || p.categoria === categoria);

  return (
    <div className="page">
      <div className="page-head">
        <div className="eyebrow"><Brain size={13} /> Núcleo</div>
        <h1>Mente</h1>
        <p>Regulación, presencia, corazón y mentalidad. Elige la vía que necesitas hoy y cuántos minutos tienes.</p>
      </div>

      <div className="statrow" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
        <div className="card stat"><div className="k">Sesiones hoy</div><div className="v tnum">{sesionesHoy}</div></div>
        <div className="card stat"><div className="k">Minutos (7 días)</div><div className="v tnum">{minutosSemana}</div></div>
        <div className="card stat"><div className="k">Fase lunar</div><div className="v" style={{ fontSize: 20 }}>{fase.emoji} {fase.nombre}</div></div>
        <div className="card stat"><div className="k">Próxima luna llena</div><div className="v" style={{ fontSize: 17 }}>{lunas.llena.toLocaleDateString("es-CL", { day: "numeric", month: "long" })}</div></div>
      </div>

      <div className="ftabs">
        {TABS.map((t) => (
          <button key={t.key} className={"ftab" + (tab === t.key ? " active" : "")} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {tab === "practicas" && (
        <>
          <div className="ftabs" style={{ marginBottom: 12 }}>
            <button className={"ftab" + (categoria === "todas" ? " active" : "")} onClick={() => setCategoria("todas")}>Todas</button>
            {CATEGORIAS_MENTE.map((c) => (
              <button key={c.key} className={"ftab" + (categoria === c.key ? " active" : "")} onClick={() => setCategoria(c.key)}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
          {categoria !== "todas" && (
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
              {CATEGORIAS_MENTE.find((c) => c.key === categoria)?.descripcion}
            </p>
          )}
          <OrdenGrid clave="mente-practicas" bloques={[
            ...(respiraciones.length > 0 ? [{
              id: "respiracion",
              el: (
                <ListaPracticas
                  titulo="🫁 Respiración guiada"
                  intro="Con círculo animado y una señal sonora suave en cada cambio: inhalar, sostener, exhalar."
                  practicas={respiraciones}
                  onComenzar={(practica, minutos) => setSesion({ practica, minutos })}
                />
              ),
            }] : []),
            ...(meditaciones.length > 0 ? [{
              id: "meditacion",
              el: (
                <ListaPracticas
                  titulo="🧘 Meditación y presencia"
                  intro="Guiadas paso a paso, con campana al inicio y al final. También en movimiento: la caminata consciente cuenta."
                  practicas={meditaciones}
                  onComenzar={(practica, minutos) => setSesion({ practica, minutos })}
                />
              ),
            }] : []),
            {
              id: "lunar",
              el: (
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
              ),
            },
            {
              id: "tip",
              el: (
              <div className="tip-destacado" style={{ marginBottom: 0 }}>
                💡 ¿No sabes cuál elegir? Si el cuerpo está acelerado, Regulación. Si la mente está lejos, Mindfulness. Si el corazón pesa, Corazón. Si la voz interna castiga, Mentalidad.
              </div>
              ),
            },
          ]} />
        </>
      )}

      {tab === "sadhana" && (
        <>
          <p style={{ fontSize: 13.5, color: "var(--ink-soft)", maxWidth: "64ch", marginBottom: 16 }}>
            La sadhana es tu práctica interior diaria: una secuencia guiada de respiración, sonido, presencia y silencio
            que avanza sola, paso a paso, con una campana suave entre cada uno. No necesitas experiencia, tu único trabajo es quedarte.
            {(() => {
              const sadhanasSemana = historial.filter((h) => h.id.startsWith("sadhana") && h.fecha >= desde).length;
              return sadhanasSemana > 0 ? ` Esta semana la has practicado ${sadhanasSemana} ${sadhanasSemana === 1 ? "vez" : "veces"}. 🌱` : "";
            })()}
          </p>

          {SADHANAS.filter((s) => s.destacada).map((s) => (
            <div className="card panel sadhana-hero" key={s.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <span style={{ fontSize: 34 }}>{s.emoji}</span>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <b style={{ fontFamily: "var(--serif)", fontSize: 18, fontWeight: 500 }}>{s.nombre}</b>
                  <p style={{ fontSize: 12.5, color: "var(--muted)", fontStyle: "italic" }}>“{s.intencion}”</p>
                </div>
                <span className="chip">{minutosSadhana(s)} min</span>
                <button className="btn primary" onClick={() => setSadhana(s)}>Comenzar</button>
              </div>
              <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "10px 0 6px", lineHeight: 1.55 }}>{s.descripcion}</p>
              <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
                {s.pasos.map((p) => `${p.emoji} ${p.titulo}`).join(", ")}
              </div>
            </div>
          ))}

          <div className="dream-grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", marginTop: 14 }}>
            {SADHANAS.filter((s) => !s.destacada).map((s) => (
              <div className="card dream-card" key={s.id}>
                <div className="dc-top">
                  <span className="dc-emoji">{s.emoji}</span>
                  <span className="chip">{minutosSadhana(s)} min</span>
                </div>
                <b className="dc-title">{s.nombre}</b>
                <p className="dc-why">“{s.intencion}”</p>
                <p className="dc-notes">{s.descripcion}</p>
                <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
                  {s.pasos.map((p) => `${p.emoji} ${p.titulo}`).join(", ")}
                </div>
                <div className="dc-foot">
                  <span style={{ flex: 1 }} />
                  <button className="btn primary" onClick={() => setSadhana(s)}>Comenzar</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "diario" && <DiarioTab />}

      {tab === "historial" && (
        <div className="card panel" style={{ maxWidth: 640 }}>
          <h3>📖 Tus sesiones</h3>
          {historial.length === 0 && (
            <p style={{ color: "var(--muted)", fontSize: 13.5 }}>
              Aún no hay sesiones. La primera puede ser de dos minutos, eso ya cuenta.
            </p>
          )}
          {historial.slice(0, 30).map((s, i) => (
            <div className="txrow" key={`${s.fecha}-${s.id}-${i}`}>
              <span className="txicon">{s.id.startsWith("sadhana") ? "🕉" : s.fecha === hoy ? "✨" : "🕊"}</span>
              <div className="txmeta">
                <b>{s.nombre}</b>
                <small>{s.minutos} min, {s.fecha === hoy ? "hoy" : s.fecha}</small>
              </div>
            </div>
          ))}
          {historial.length > 0 && (
            <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 10 }}>
              Tu historial vive en este navegador por ahora. Pronto se guardará también en la nube.
            </p>
          )}
        </div>
      )}

      {tab === "insights" && <InsightsTab />}

      {sesion && (
        <SesionModal
          practica={sesion.practica}
          minutos={sesion.minutos}
          onClose={() => setSesion(null)}
          onCompleta={() => setHistorial(listSesiones())}
        />
      )}
      {sadhana && (
        <SadhanaPlayer
          sadhana={sadhana}
          onClose={() => setSadhana(null)}
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
