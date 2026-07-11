import { AvancesArea } from "../components/AvancesArea";
import { IconField } from "../components/IconField";
import { OrdenGrid } from "../components/OrdenGrid";
import { Link } from "react-router-dom";
import { fmtFechaLocal, hoyLocal } from "../lib/fechas";
import { useCallback, useEffect, useState } from "react";
import { Plus, Repeat, Trash2 } from "lucide-react";
import { TablesMissingError } from "../finanzas/data";
import { listObjectives, updateObjective, type Objective } from "../objetivos/data";
import { RetosTab } from "./RetosTab";
import {
  addHabit,
  deleteHabit,
  listHabitLogs,
  HABITOS_DE_PAZ,
  listHabits,
  streakFor,
  toggleHabit,
  type Habit,
  type HabitLog,
} from "./data";

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return fmtFechaLocal(d);
}

export function HabitosPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [habitModal, setHabitModal] = useState<{ base?: { name: string; icon: string; dias: number } } | null>(null);
  const [tabH, setTabH] = useState<"habitos" | "retos">("habitos");

  const hoy = hoyLocal();

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [h, l] = await Promise.all([listHabits(), listHabitLogs()]);
      setHabits(h);
      setLogs(l);
      setNeedsMigration(false);
    } catch (e) {
      if (e instanceof TablesMissingError) setNeedsMigration(true);
      else setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const doneToday = new Set(logs.filter((l) => l.date === hoy).map((l) => l.habit_id));
  const mejorRacha = habits.reduce((max, h) => Math.max(max, streakFor(h.id, logs)), 0);
  const existentes = new Set(habits.map((x) => x.name.toLowerCase()));
  const sugeridos = HABITOS_DE_PAZ.filter((x) => !existentes.has(x.name.toLowerCase()));

  return (
    <div className="page">
      <Head />

      <div className="ftabs">
        <button className={"ftab" + (tabH === "habitos" ? " active" : "")} onClick={() => setTabH("habitos")}>Hábitos</button>
        <button className={"ftab" + (tabH === "retos" ? " active" : "")} onClick={() => setTabH("retos")}>Retos</button>
      </div>

      {tabH === "retos" ? (
        <RetosTab />
      ) : needsMigration ? (
        <div className="card pad" style={{ maxWidth: 640 }}>
          <h3 style={{ marginBottom: 10 }}>Un paso pendiente en Supabase</h3>
          <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 12 }}>
            Faltan las tablas de Hábitos. Es una sola vez: abre el SQL Editor de Supabase, pega el contenido de
            <code> supabase/migrations/0005_habitos.sql</code> y presiona Run.
          </p>
          <button className="btn primary" onClick={() => void reload()}>Ya lo hice, reintentar</button>
        </div>
      ) : (
        <>
      {error && <div className="card pad" style={{ borderLeft: "3px solid var(--err)", marginBottom: 14 }}>{error}</div>}
      {loading ? (
        <p style={{ color: "var(--muted)" }}>Cargando…</p>
      ) : (
        <>
          <div className="statrow" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="card stat"><div className="k">Hábitos de hoy</div><div className="v tnum">{doneToday.size} / {habits.length}</div></div>
            <div className="card stat"><div className="k">Mejor racha</div><div className="v tnum">{mejorRacha > 0 ? `🔥 ${mejorRacha}` : "0"}</div></div>
          </div>

          <OrdenGrid clave="habitos" bloques={[
            { id: "checklist", el: (
            <div className="card panel">
              <h3>Hábitos de hoy</h3>
              {habits.length === 0 && (
                <p style={{ color: "var(--muted)", fontSize: 13.5 }}>
                  Crea tu primer hábito: meditar, leer, tomar agua, salir a caminar. Lo que quieras cultivar.
                </p>
              )}
              {habits.map((h) => {
                const done = doneToday.has(h.id);
                const racha = streakFor(h.id, logs);
                const objetivo = h.target_days ?? 28;
                const ventana: string[] = [];
                for (let i = objetivo - 1; i >= 0; i -= 1) ventana.push(isoDaysAgo(i));
                const marcados = new Set(logs.filter((l) => l.habit_id === h.id).map((l) => l.date));
                const hechos = ventana.filter((f) => marcados.has(f)).length;
                const logrado = hechos >= objetivo;
                return (
                  <div key={h.id} style={{ borderBottom: "1px solid var(--line-soft)", padding: "10px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <button
                        className={"hcheck" + (done ? " done" : "")}
                        aria-label={done ? "Desmarcar hoy" : "Marcar hoy como hecho"}
                        onClick={async () => { await toggleHabit(h.id, hoy, !done); void reload(); }}>
                        {done ? "✓" : ""}
                      </button>
                      <div className="txmeta">
                        <b style={{ color: done ? "var(--muted)" : "var(--ink)" }}>{h.icon} {h.name}</b>
                        <small>{racha > 0 ? `racha de ${racha} día${racha === 1 ? "" : "s"} 🔥, ` : ""}desafío de {objetivo} días</small>
                      </div>
                      {logrado
                        ? <span className="chip" style={{ background: "color-mix(in srgb,var(--ok) 18%,var(--paper))", color: "var(--ok)" }}>🎉 {hechos} / {objetivo}</span>
                        : <span className="chip">{hechos} / {objetivo}</span>}
                      <button className="xdel" aria-label="Eliminar hábito" onClick={async () => { if (!window.confirm(`¿Eliminar el hábito ${h.name}? Se pierde su historial.`)) return; await deleteHabit(h.id); void reload(); }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="habit-grid" title="Toca un día para marcarlo o desmarcarlo">
                      {ventana.map((f) => (
                        <button key={f} type="button"
                          className={"hg-cell" + (marcados.has(f) ? " on" : "") + (f === hoy ? " today" : "")}
                          aria-label={`${f}${marcados.has(f) ? ", hecho" : ""}`}
                          title={f}
                          onClick={async () => { await toggleHabit(h.id, f, !marcados.has(f)); void reload(); }} />
                      ))}
                    </div>
                  </div>
                );
              })}
              <button className="btn ghost" style={{ marginTop: 12 }} onClick={() => setHabitModal({})}>
                <Plus size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} /> Nuevo hábito
              </button>
            </div>
            ) },
            ...(sugeridos.length > 0 ? [{ id: "sugeridos", el: (
              <div className="card panel">
                <h3>🌿 Sugeridos para tu paz</h3>
                <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 10 }}>
                  Tócalo, elige por cuántos días, y queda listo para trackear.
                </p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {sugeridos.map((x) => (
                    <button key={x.name} className="chip" style={{ border: "none", cursor: "pointer" }}
                      title={`Crear el hábito ${x.name}`}
                      onClick={() => setHabitModal({ base: x })}>
                      {x.icon} {x.name}
                    </button>
                  ))}
                </div>
              </div>
            ) }] : []),
            { id: "link-energia", el: (
              <Link to="/salud" className="card pad vb-link" style={{ marginBottom: 0 }}>
                <span style={{ fontSize: 22 }}>⚡</span>
                <span>
                  <b style={{ display: "block", fontSize: 14 }}>El sueño y el ejercicio se mudaron a Energía</b>
                  <small style={{ fontSize: 12.5, color: "var(--muted)" }}>
                    Ahí registras agua, proteína, movimiento y descanso, todo el combustible de tu cuerpo.
                  </small>
                </span>
              </Link>
            ) },
            { id: "link-mente", el: (
              <Link to="/mente" className="card pad vb-link" style={{ marginBottom: 0 }}>
                <span style={{ fontSize: 22 }}>🧘</span>
                <span>
                  <b style={{ display: "block", fontSize: 14 }}>Meditaciones y respiración en Mente</b>
                  <small style={{ fontSize: 12.5, color: "var(--muted)" }}>
                    Sesiones guiadas de 2 a 30 minutos y el calendario lunar.
                  </small>
                </span>
              </Link>
            ) },
          ]} />
        </>
      )}
      </>
      )}

      <AvancesArea area="habitos" />

      {habitModal && <HabitModal base={habitModal.base} onClose={() => setHabitModal(null)} onSaved={() => { setHabitModal(null); void reload(); }} />}
    </div>
  );
}

function Head() {
  return (
    <div className="page-head">
      <div className="eyebrow"><Repeat size={13} /> Núcleo</div>
      <h1>Hábitos</h1>
      <p>Las rutinas que construyen tu día, un check a la vez.</p>
    </div>
  );
}

function HabitModal({ base, onClose, onSaved }: {
  base?: { name: string; icon: string; dias: number };
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(base?.name ?? "");
  const [icon, setIcon] = useState(base?.icon ?? "🌱");
  const [dias, setDias] = useState(String(base?.dias ?? 28));
  const [metas, setMetas] = useState<Objective[]>([]);
  const [metaId, setMetaId] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setMetas((await listObjectives()).filter((o) => o.status !== "lograda"));
      } catch {
        /* sin metas disponibles, el select no se muestra */
      }
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    let habitId: string;
    try {
      habitId = await addHabit(name, icon, dias ? Number(dias) : null);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
      setBusy(false);
      return;
    }
    if (metaId) {
      try {
        await updateObjective(metaId, { auto_metric: "habito_marcas", auto_ref: habitId, auto_target: 7 });
      } catch (ex) {
        setErr(`El hábito quedó creado, pero no pude conectarlo a la meta: ${ex instanceof Error ? ex.message : String(ex)}`);
        setBusy(false);
        return;
      }
    }
    onSaved();
  }

  return (
    <div className="tp-overlay" onClick={onClose}>
      <div className="tp" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <h3 style={{ marginBottom: 14 }}>Nuevo hábito</h3>
        {err && <div className="alert err" style={{ marginBottom: 10 }}>{err}</div>}
        <form onSubmit={save}>
          <div className="frow">
            <div className="field" style={{ flex: 1 }}><label>Nombre</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Meditar 10 minutos" autoFocus /></div>
            <IconField value={icon} onChange={setIcon} />
          </div>
          <div className="field"><label>¿Por cuánto tiempo?</label>
            <select value={dias} onChange={(e) => setDias(e.target.value)}>
              <option value="7">7 días</option>
              <option value="14">14 días</option>
              <option value="21">21 días</option>
              <option value="28">28 días</option>
              <option value="66">66 días (hábito instalado)</option>
              <option value="90">90 días</option>
            </select></div>
          {metas.length > 0 && (
            <div className="field"><label>¿A qué dirección de tu vida apunta? (opcional)</label>
              <select value={metaId} onChange={(e) => setMetaId(e.target.value)}>
                <option value="">Ninguna meta por ahora</option>
                {metas.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
              {metaId && (
                <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 5 }}>
                  Cada día que marques este hábito hará avanzar esa meta, a ritmo diario.
                </p>
              )}
            </div>
          )}
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
            Verás una cuadrícula con cada día del desafío. Tocas un día y queda marcado: tu avance, visible.
          </p>
          <button className="btn primary" disabled={busy} style={{ width: "100%", marginTop: 4 }}>{busy ? "Guardando…" : "Crear hábito"}</button>
        </form>
      </div>
    </div>
  );
}
