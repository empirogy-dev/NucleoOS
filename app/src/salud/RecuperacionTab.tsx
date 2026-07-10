import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { TablesMissingError } from "../finanzas/data";
import { hoyLocal } from "../lib/fechas";
import { listSesiones } from "../mente/practicas";
import { ModalShell } from "./ClinicaTab";
import {
  SOBRIETY_MILESTONES,
  addSobriety,
  daysSince,
  deleteSobriety,
  humanizeDays,
  listSobriety,
  type Sobriety,
} from "./data";

// Recuperación: descanso, pausas y tu camino de sobriedad.
// La energía no solo se gasta, también se recupera.

const IDEAS_DESCANSO = [
  { emoji: "🌿", texto: "Una pausa de 10 minutos sin pantalla, mirando lejos." },
  { emoji: "🚶", texto: "Caminar despacio alrededor de la cuadra, sin audífonos." },
  { emoji: "🛁", texto: "Ducha caliente larga o baño de pies antes de dormir." },
  { emoji: "📖", texto: "Leer algo liviano que no tenga nada que ver con pendientes." },
  { emoji: "😴", texto: "Siesta corta de 20 minutos antes de las cuatro de la tarde." },
];

export function RecuperacionTab() {
  const [sobriety, setSobriety] = useState<Sobriety[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState(false);

  const hoy = hoyLocal();
  const sesionesHoy = listSesiones().filter((s) => s.fecha === hoy);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSobriety(await listSobriety());
    } catch (e) {
      if (!(e instanceof TablesMissingError)) setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (loading) return <p style={{ color: "var(--muted)" }}>Cargando…</p>;

  return (
    <>
      {error && <div className="card pad" style={{ borderLeft: "3px solid var(--err)", marginBottom: 14 }}>{error}</div>}
      <div className="panelgrid">
        <div style={{ display: "grid", gap: 14, alignSelf: "start" }}>
          {/* Sobriedad */}
          <div className="card panel">
            <h3>🌱 Sobriedad</h3>
            {sobriety.length === 0 && (
              <p style={{ color: "var(--muted)", fontSize: 13.5 }}>
                Si estás dejando algo (marihuana, alcohol, cigarro), créale un tracker. Cada día limpio cuenta y aquí se celebra.
              </p>
            )}
            {sobriety.map((s) => {
              const dias = daysSince(s.start_date);
              const logrados = SOBRIETY_MILESTONES.filter((m) => dias >= m.days);
              const proximo = SOBRIETY_MILESTONES.find((m) => dias < m.days);
              return (
                <div className="sob" key={s.id} style={{ marginTop: 0, padding: "10px 0", borderBottom: "1px solid var(--line-soft)" }}>
                  <span className="seed">🌱</span>
                  <div>
                    <div className="t1">Libre de {s.substance}</div>
                    <div className="t2 tnum">{humanizeDays(dias)}</div>
                    <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{dias} días desde el {s.start_date}</div>
                  </div>
                  <div className="hitos">
                    {logrados.slice(-2).map((m) => <span className="hito" key={m.days}>✓ {m.label}</span>)}
                    {proximo && <span className="hito next">Próximo: {proximo.label}</span>}
                    {!proximo && <span className="hito">🎉 Más de 2 años</span>}
                  </div>
                  <button className="xdel" aria-label="Eliminar tracker" onClick={async () => { if (!window.confirm(`¿Eliminar el tracker de ${s.substance}? Se pierde el conteo de días.`)) return; await deleteSobriety(s.id); void reload(); }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
            <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => setModal(true)}>
              <Plus size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} /> Nuevo tracker
            </button>
          </div>

          {/* Pausas de hoy */}
          <div className="card panel">
            <h3>🕊 Tus pausas de hoy</h3>
            {sesionesHoy.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 13.5 }}>
                Aún no hay sesiones de calma hoy. Una respiración de dos minutos en <Link to="/mente" style={{ color: "var(--accent-ink)", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 2 }}>Mente</Link> ya recarga.
              </p>
            ) : (
              sesionesHoy.map((s, i) => (
                <div className="txrow" key={`${s.id}-${i}`}>
                  <span className="txicon">✨</span>
                  <div className="txmeta">
                    <b>{s.nombre}</b>
                    <small>{s.minutos} minutos de recuperación</small>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card panel" style={{ alignSelf: "start" }}>
          <h3>🌙 Ideas para recuperar energía</h3>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 10 }}>
            El descanso también es productivo. Elige una y regálatela hoy.
          </p>
          {IDEAS_DESCANSO.map((d) => (
            <div className="txrow" key={d.texto}>
              <span className="txicon">{d.emoji}</span>
              <div className="txmeta" style={{ whiteSpace: "normal" }}>
                <small style={{ fontSize: 13, color: "var(--ink-soft)" }}>{d.texto}</small>
              </div>
            </div>
          ))}
        </div>
      </div>

      {modal && <SobModal onClose={() => setModal(false)} onSaved={() => { setModal(false); void reload(); }} />}
    </>
  );
}

function SobModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [substance, setSubstance] = useState("");
  const [start, setStart] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await addSobriety(substance, start);
    onSaved();
  }

  return (
    <ModalShell title="Nuevo tracker de sobriedad" onClose={onClose}>
      <form onSubmit={save}>
        <div className="field"><label>¿Qué estás dejando?</label>
          <input required value={substance} onChange={(e) => setSubstance(e.target.value)} placeholder="marihuana, alcohol, cigarro…" autoFocus /></div>
        <div className="field"><label>¿Desde cuándo estás limpia?</label>
          <input type="date" required value={start} onChange={(e) => setStart(e.target.value)} /></div>
        <button className="btn primary" disabled={busy} style={{ width: "100%", marginTop: 4 }}>{busy ? "Guardando…" : "Empezar a contar"}</button>
      </form>
    </ModalShell>
  );
}
