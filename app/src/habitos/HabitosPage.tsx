import { fmtFechaLocal, hoyLocal } from "../lib/fechas";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Moon, Plus, Repeat, Trash2 } from "lucide-react";
import { TablesMissingError } from "../finanzas/data";
import {
  EXERCISE_KINDS,
  addExercise,
  addHabit,
  deleteExercise,
  deleteHabit,
  listExercise,
  listHabitLogs,
  listHabits,
  listRoutine,
  saveRoutine,
  sleepHours,
  streakFor,
  toggleHabit,
  type ExerciseLog,
  type Habit,
  type HabitLog,
  type RoutineLog,
} from "./data";

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return fmtFechaLocal(d);
}

export function HabitosPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [routine, setRoutine] = useState<RoutineLog[]>([]);
  const [exercise, setExercise] = useState<ExerciseLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [habitModal, setHabitModal] = useState(false);

  const hoy = hoyLocal();

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [h, l, r, e] = await Promise.all([listHabits(), listHabitLogs(), listRoutine(), listExercise()]);
      setHabits(h);
      setLogs(l);
      setRoutine(r);
      setExercise(e);
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
  const semana = isoDaysAgo(6);
  const minutosSemana = exercise.filter((e) => e.date >= semana).reduce((s, e) => s + e.minutes, 0);
  const sueños = routine.map(sleepHours).filter((h): h is number => h !== null);
  const promedioSueño = sueños.length ? Math.round((sueños.reduce((a, b) => a + b, 0) / sueños.length) * 10) / 10 : null;

  const rutinaHoy = routine.find((r) => r.date === hoy);

  if (needsMigration) {
    return (
      <div className="page">
        <Head />
        <div className="card pad" style={{ maxWidth: 640 }}>
          <h3 style={{ marginBottom: 10 }}>Un paso pendiente en Supabase</h3>
          <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 12 }}>
            Faltan las tablas de Hábitos. Es una sola vez: abre el SQL Editor de Supabase, pega el contenido de
            <code> supabase/migrations/0005_habitos.sql</code> y presiona Run.
          </p>
          <button className="btn primary" onClick={() => void reload()}>Ya lo hice, reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <Head />

      {error && <div className="card pad" style={{ borderLeft: "3px solid var(--err)", marginBottom: 14 }}>{error}</div>}
      {loading ? (
        <p style={{ color: "var(--muted)" }}>Cargando…</p>
      ) : (
        <>
          <div className="statrow" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
            <div className="card stat"><div className="k">Hábitos de hoy</div><div className="v tnum">{doneToday.size} / {habits.length}</div></div>
            <div className="card stat"><div className="k">Mejor racha</div><div className="v tnum">{mejorRacha > 0 ? `🔥 ${mejorRacha}` : "0"}</div></div>
            <div className="card stat"><div className="k">Ejercicio (7 días)</div><div className="v tnum">{minutosSemana} min</div></div>
            <div className="card stat"><div className="k">Sueño promedio</div><div className="v tnum">{promedioSueño !== null ? `${promedioSueño} h` : "sin datos"}</div></div>
          </div>

          <div className="panelgrid">
            {/* Checklist de hábitos */}
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
                return (
                  <div className="txrow" key={h.id}>
                    <button
                      className={"hcheck" + (done ? " done" : "")}
                      aria-label={done ? "Desmarcar" : "Marcar como hecho"}
                      onClick={async () => { await toggleHabit(h.id, hoy, !done); void reload(); }}>
                      {done ? "✓" : ""}
                    </button>
                    <div className="txmeta">
                      <b style={{ textDecoration: done ? "line-through" : "none", color: done ? "var(--muted)" : "var(--ink)" }}>
                        {h.icon} {h.name}
                      </b>
                      <small>{racha > 0 ? `racha de ${racha} día${racha === 1 ? "" : "s"} 🔥` : "sin racha todavía"}</small>
                    </div>
                    <WeekDots habitId={h.id} logs={logs} />
                    <button className="xdel" aria-label="Eliminar hábito" onClick={async () => { await deleteHabit(h.id); void reload(); }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
              <button className="btn ghost" style={{ marginTop: 12 }} onClick={() => setHabitModal(true)}>
                <Plus size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} /> Nuevo hábito
              </button>
            </div>

            <div style={{ display: "grid", gap: 14, alignSelf: "start" }}>
              {/* Sueño de hoy */}
              <div className="card panel">
                <h3><Moon size={14} style={{ verticalAlign: "-2px" }} /> Sueño</h3>
                <div className="frow">
                  <div className="field">
                    <label>Anoche me acosté</label>
                    <input type="time" defaultValue={rutinaHoy?.bed_time ?? ""} key={`bed-${rutinaHoy?.id ?? "new"}`}
                      onBlur={async (e) => { if (e.target.value) { await saveRoutine(hoy, { bed_time: e.target.value }); void reload(); } }} />
                  </div>
                  <div className="field">
                    <label>Hoy me levanté</label>
                    <input type="time" defaultValue={rutinaHoy?.wake_time ?? ""} key={`wake-${rutinaHoy?.id ?? "new"}`}
                      onBlur={async (e) => { if (e.target.value) { await saveRoutine(hoy, { wake_time: e.target.value }); void reload(); } }} />
                  </div>
                </div>
                {rutinaHoy && sleepHours(rutinaHoy) !== null && (
                  <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Anoche dormiste <b className="tnum">{sleepHours(rutinaHoy)} horas</b>.</p>
                )}
              </div>

              {/* Ejercicio */}
              <div className="card panel">
                <h3>Ejercicio</h3>
                <ExerciseForm onSaved={() => void reload()} />
                {exercise.slice(0, 5).map((e) => (
                  <div className="txrow" key={e.id} style={{ padding: "7px 0" }}>
                    <div className="txmeta">
                      <b style={{ fontSize: 13 }}>{e.kind}</b>
                      <small>{e.date}</small>
                    </div>
                    <b className="tnum" style={{ fontSize: 13 }}>{e.minutes} min</b>
                    <button className="xdel" aria-label="Eliminar ejercicio" onClick={async () => { await deleteExercise(e.id); void reload(); }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {habitModal && <HabitModal onClose={() => setHabitModal(false)} onSaved={() => { setHabitModal(false); void reload(); }} />}
    </div>
  );
}

function Head() {
  return (
    <div className="page-head">
      <div className="eyebrow"><Repeat size={13} /> Área</div>
      <h1>Hábitos y Rutinas</h1>
      <p>Sueño, ejercicio y los hábitos que construyen tu día.</p>
    </div>
  );
}

function WeekDots({ habitId, logs }: { habitId: string; logs: HabitLog[] }) {
  const dates = useMemo(() => new Set(logs.filter((l) => l.habit_id === habitId).map((l) => l.date)), [habitId, logs]);
  const days: string[] = [];
  for (let i = 6; i >= 0; i -= 1) days.push(isoDaysAgo(i));
  return (
    <span className="weekdots" title="Últimos 7 días">
      {days.map((d) => <i key={d} className={dates.has(d) ? "on" : ""} />)}
    </span>
  );
}

function ExerciseForm({ onSaved }: { onSaved: () => void }) {
  const [kind, setKind] = useState<string>(EXERCISE_KINDS[0]);
  const [minutes, setMinutes] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!minutes) return;
    setBusy(true);
    await addExercise(hoyLocal(), kind, Number(minutes));
    setMinutes("");
    setBusy(false);
    onSaved();
  }

  return (
    <form onSubmit={save} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
      <select className="ms-sel" style={{ flex: 1 }} value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Tipo de ejercicio">
        {EXERCISE_KINDS.map((k) => <option key={k}>{k}</option>)}
      </select>
      <input className="input-inline" style={{ width: 90, flex: "none" }} type="number" min="1" placeholder="min"
        value={minutes} onChange={(e) => setMinutes(e.target.value)} aria-label="Minutos" />
      <button className="btn ghost" type="submit" disabled={busy}>Anotar</button>
    </form>
  );
}

function HabitModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🌿");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await addHabit(name, icon);
    onSaved();
  }

  return (
    <div className="tp-overlay" onClick={onClose}>
      <div className="tp" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <h3 style={{ marginBottom: 14 }}>Nuevo hábito</h3>
        <form onSubmit={save}>
          <div className="frow">
            <div className="field" style={{ flex: 1 }}><label>Nombre</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Meditar 10 minutos" autoFocus /></div>
            <div className="field" style={{ width: 84 }}><label>Ícono</label>
              <input value={icon} onChange={(e) => setIcon(e.target.value)} /></div>
          </div>
          <button className="btn primary" disabled={busy} style={{ width: "100%", marginTop: 4 }}>{busy ? "Guardando…" : "Crear hábito"}</button>
        </form>
      </div>
    </div>
  );
}
