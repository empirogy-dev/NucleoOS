import { IconField } from "../components/IconField";
import { Link } from "react-router-dom";
import { fechaRegistro, fmtFechaLocal } from "../lib/fechas";
import { useFechaActiva } from "../fecha/FechaActiva";
import { sincronizarHabitosConEjercicio } from "./data";
import { CampoHora } from "../components/CampoHora";
import { MetasDeArea } from "../components/MetasDeArea";
import { Selector } from "../components/Selector";
import { useCallback, useEffect, useState } from "react";
import { Moon, Pencil, Plus, Repeat, Trash2 } from "lucide-react";
import { TablesMissingError } from "../finanzas/data";
import { listObjectives, type Objective } from "../objetivos/data";
import { RetosTab } from "./RetosTab";
import { RutinasTab } from "./RutinasTab";
import {
  COLORES_HABITO,
  EXERCISE_KINDS,
  addExercise,
  addHabit,
  deleteExercise,
  deleteHabit,
  listExercise,
  listHabitLogs,
  HABITOS_DE_PAZ,
  listHabits,
  listRoutine,
  saveRoutine,
  sleepHours,
  streakFor,
  toggleHabit,
  updateHabit,
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
  const [habitModal, setHabitModal] = useState<{ base?: { name: string; icon: string; dias: number }; habit?: Habit } | null>(null);
  const [tabH, setTabH] = useState<"habitos" | "retos" | "rutinas">("habitos");

  const { fecha: hoy } = useFechaActiva();

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Antes de leer, la app rescata lo que ya hiciste: días de ejercicio
      // pasados pintan los hábitos de movimiento (idempotente).
      await sincronizarHabitosConEjercicio();
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
  const suenos = routine.map(sleepHours).filter((h): h is number => h !== null);
  const promedioSueno = suenos.length ? Math.round((suenos.reduce((a, b) => a + b, 0) / suenos.length) * 10) / 10 : null;
  const rutinaHoy = routine.find((r) => r.date === hoy);
  const existentes = new Set(habits.map((x) => x.name.toLowerCase()));
  const sugeridos = HABITOS_DE_PAZ.filter((x) => !existentes.has(x.name.toLowerCase()));

  return (
    <div className="page">
      <Head />

      <div className="ftabs">
        <button className={"ftab" + (tabH === "habitos" ? " active" : "")} onClick={() => setTabH("habitos")}>Hábitos</button>
        <button className={"ftab" + (tabH === "retos" ? " active" : "")} onClick={() => setTabH("retos")}>Retos</button>
        <button className={"ftab" + (tabH === "rutinas" ? " active" : "")} onClick={() => setTabH("rutinas")}>Rutinas</button>
      </div>

      {tabH === "rutinas" ? (
        <RutinasTab />
      ) : tabH === "retos" ? (
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
          <div className="statrow" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
            <div className="card stat"><div className="k">Hábitos de hoy</div><div className="v tnum">{doneToday.size} / {habits.length}</div></div>
            <div className="card stat"><div className="k">Mejor racha</div><div className="v tnum">{mejorRacha > 0 ? `🔥 ${mejorRacha}` : "0"}</div></div>
            <div className="card stat"><div className="k">Ejercicio (7 días)</div><div className="v tnum">{minutosSemana} min</div></div>
            <div className="card stat"><div className="k">Sueño promedio</div><div className="v tnum">{promedioSueno !== null ? `${promedioSueno} h` : "sin datos"}</div></div>
          </div>

          <MetasDeArea area="habitos" />

          <div className="panelgrid">
            {/* Checklist de hábitos */}
            <div className="card panel">
              <h3>Hábitos de hoy</h3>
              <p style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 10 }}>
                El cuadrado grande marca el día de hoy. Los chiquitos son tu calendario: un día cada uno, y puedes tocar cualquiera para marcarlo o desmarcarlo, incluso días pasados.
              </p>
              {habits.length === 0 && (
                <p style={{ color: "var(--muted)", fontSize: 13.5 }}>
                  Crea tu primer hábito: meditar, leer, tomar agua, salir a caminar. Lo que quieras cultivar.
                </p>
              )}
              {habits.map((h) => {
                const done = doneToday.has(h.id);
                const racha = streakFor(h.id, logs);
                const objetivo = h.target_days ?? 28;
                const color = h.color ?? "var(--hab)";
                const marcados = new Set(logs.filter((l) => l.habit_id === h.id).map((l) => l.date));
                // La cuadrícula se ancla a tu primer día marcado: es tu historia
                // completa, no una ventana que se desliza y "borra" lo antiguo.
                // Las pausas no restan, solo no suman. Cero culpa.
                const primera = [...marcados].sort()[0] ?? hoy;
                const ventana: string[] = [];
                const cursor = new Date(`${primera}T00:00:00`);
                while (fmtFechaLocal(cursor) <= hoy && ventana.length < 90) {
                  ventana.push(fmtFechaLocal(cursor));
                  cursor.setDate(cursor.getDate() + 1);
                }
                // Historial corto: rellenamos hacia atrás para ver el desafío completo.
                while (ventana.length < objetivo) {
                  const d = new Date(`${ventana[0]}T00:00:00`);
                  d.setDate(d.getDate() - 1);
                  ventana.unshift(fmtFechaLocal(d));
                }
                const hechos = marcados.size;
                const logrado = hechos >= objetivo;
                return (
                  <div key={h.id} style={{ borderBottom: "1px solid var(--line-soft)", padding: "10px 0" }}>
                    <div className="habit-row" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <button
                        className={"hcheck" + (done ? " done" : "")}
                        style={done ? { background: color, borderColor: color } : undefined}
                        aria-label={done ? "Desmarcar hoy" : "Marcar hoy como hecho"}
                        onClick={async () => { await toggleHabit(h.id, hoy, !done); void reload(); }}>
                        {done ? "✓" : ""}
                      </button>
                      <div className="txmeta">
                        <b style={{ color: done ? "var(--muted)" : "var(--ink)" }}>{h.icon} {h.name}</b>
                        <small>
                          {racha > 0 ? `racha de ${racha} día${racha === 1 ? "" : "s"} 🔥, ` : ""}
                          desafío de {objetivo} días acumulados{h.daily_minutes ? `, ${h.daily_minutes} min al día` : ""}. Las pausas no borran nada.
                        </small>
                      </div>
                      {logrado
                        ? <span className="chip" style={{ background: "color-mix(in srgb,var(--ok) 18%,var(--paper))", color: "var(--ok)" }}>🎉 {hechos} / {objetivo}</span>
                        : <span className="chip">{hechos} / {objetivo}</span>}
                      <button className="xdel" title="Editar hábito" aria-label="Editar hábito" onClick={() => setHabitModal({ habit: h })}>
                        <Pencil size={13} />
                      </button>
                      <button className="xdel" aria-label="Eliminar hábito" onClick={async () => { if (!window.confirm(`¿Eliminar el hábito ${h.name}? Se pierde su historial.`)) return; await deleteHabit(h.id); void reload(); }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="habit-grid" title="Toca un día para marcarlo o desmarcarlo">
                      {ventana.map((f) => {
                        const on = marcados.has(f);
                        return (
                          <button key={f} type="button"
                            className={"hg-cell" + (on ? " on" : "") + (f === hoy ? " today" : "")}
                            style={on ? { background: color, borderColor: color } : undefined}
                            aria-label={`${f}${on ? ", hecho" : ""}`}
                            title={f}
                            onClick={async () => { await toggleHabit(h.id, f, !on); void reload(); }} />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <button className="btn ghost" style={{ marginTop: 12 }} onClick={() => setHabitModal({})}>
                <Plus size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} /> Nuevo hábito
              </button>
              {sugeridos.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".11em", color: "var(--muted)", fontWeight: 600, marginBottom: 8 }}>
                    Sugeridos para tu paz
                  </div>
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
              )}
            </div>

            <div style={{ display: "grid", gap: 14, alignSelf: "start" }}>
              {/* Sueño: también es un hábito */}
              <div className="card panel">
                <h3><Moon size={14} style={{ verticalAlign: "-2px" }} /> Sueño</h3>
                <div className="frow">
                  <div className="field">
                    <label>Anoche me acosté</label>
                    <CampoHora value={rutinaHoy?.bed_time?.slice(0, 5) ?? ""} ariaLabel="Hora de acostarse"
                      onChange={async (v) => { if (v) { await saveRoutine(hoy, { bed_time: v }); void reload(); } }} />
                  </div>
                  <div className="field">
                    <label>Hoy me levanté</label>
                    <CampoHora value={rutinaHoy?.wake_time?.slice(0, 5) ?? ""} ariaLabel="Hora de despertar"
                      onChange={async (v) => { if (v) { await saveRoutine(hoy, { wake_time: v }); void reload(); } }} />
                  </div>
                </div>
                {rutinaHoy && sleepHours(rutinaHoy) !== null && (
                  <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Anoche dormiste <b className="tnum">{sleepHours(rutinaHoy)} horas</b>.</p>
                )}
              </div>

              {/* Ejercicio: también es un hábito */}
              <div className="card panel">
                <h3>Ejercicio</h3>
                <ExerciseForm onSaved={() => void reload()} />
                {exercise.slice(0, 4).map((e) => (
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
                <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 8 }}>
                  El detalle completo (calorías, semana, rutinas) vive en <Link to="/salud" style={{ color: "var(--accent-ink)", fontWeight: 600 }}>Energía</Link> y <Link to="/movimiento" style={{ color: "var(--accent-ink)", fontWeight: 600 }}>Movimiento</Link>. Aquí se registra igual de rápido.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
      </>
      )}


      {habitModal && (
        <HabitModal base={habitModal.base} habit={habitModal.habit}
          onClose={() => setHabitModal(null)} onSaved={() => { setHabitModal(null); void reload(); }} />
      )}
    </div>
  );
}

function Head() {
  return (
    <div className="page-head">
      <div className="eyebrow"><Repeat size={13} /> Núcleo</div>
      <h1>Hábitos</h1>
      <p>Sueño, ejercicio y las rutinas que construyen tu día, un check a la vez.</p>
    </div>
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
    await addExercise(fechaRegistro(), kind, Number(minutes));
    setMinutes("");
    setBusy(false);
    onSaved();
  }

  return (
    <form onSubmit={save} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
      <Selector compacto value={kind} ariaLabel="Tipo de ejercicio" onChange={setKind}
        opciones={EXERCISE_KINDS.map((k) => ({ value: k, label: k }))} />
      <input className="input-inline" style={{ width: 90, flex: "none" }} type="number" min="1" placeholder="min"
        value={minutes} onChange={(e) => setMinutes(e.target.value)} aria-label="Minutos" />
      <button className="btn ghost" type="submit" disabled={busy}>Anotar</button>
    </form>
  );
}

function HabitModal({ base, habit, onClose, onSaved }: {
  base?: { name: string; icon: string; dias: number };
  habit?: Habit;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(habit?.name ?? base?.name ?? "");
  const [icon, setIcon] = useState(habit?.icon ?? base?.icon ?? "🌱");
  const [dias, setDias] = useState(String(habit?.target_days ?? base?.dias ?? 28));
  const [color, setColor] = useState(habit?.color ?? "var(--hab)");
  const [minutos, setMinutos] = useState(habit?.daily_minutes != null ? String(habit.daily_minutes) : "");
  const [metas, setMetas] = useState<Objective[]>([]);
  const [metaId, setMetaId] = useState(habit?.meta_id ?? "");
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
    // El vínculo con la meta vive en el hábito (motor diario): la meta
    // conserva su propia métrica de resultado, nada se sobreescribe.
    const datos = {
      name,
      icon,
      target_days: dias ? Number(dias) : null,
      color: color === "var(--hab)" ? null : color,
      daily_minutes: minutos ? Number(minutos) : null,
      meta_id: metaId || null,
    };
    try {
      if (habit) {
        await updateHabit(habit.id, datos);
        onSaved();
        return;
      }
      await addHabit(datos);
      onSaved();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
      setBusy(false);
    }
  }

  return (
    <div className="tp-overlay" onClick={onClose}>
      <div className="tp" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <h3 style={{ marginBottom: 14 }}>{habit ? "Editar hábito" : "Nuevo hábito"}</h3>
        {err && <p style={{ fontSize: 12.5, color: "var(--err)", marginBottom: 10 }}>{err}</p>}
        <form onSubmit={save}>
          <div className="frow">
            <div className="field" style={{ flex: 1 }}><label>Nombre</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Proyección de familia" autoFocus /></div>
            <IconField value={icon} onChange={setIcon} />
          </div>
          <div className="frow">
            <div className="field"><label>¿Por cuánto tiempo?</label>
              <Selector value={dias} ariaLabel="Duración del desafío" onChange={setDias}
                opciones={[
                  { value: "7", label: "7 días" },
                  { value: "14", label: "14 días" },
                  { value: "21", label: "21 días" },
                  { value: "28", label: "28 días" },
                  { value: "66", label: "66 días (hábito instalado)" },
                  { value: "90", label: "90 días" },
                ]} /></div>
            <div className="field" style={{ maxWidth: 130 }}><label>Minutos al día</label>
              <input type="number" min={1} max={600} value={minutos} onChange={(e) => setMinutos(e.target.value)} placeholder="10" /></div>
          </div>
          <div className="field"><label>Color de la cuadrícula</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["var(--hab)", ...COLORES_HABITO.filter((c) => c !== "var(--hab)")].map((c) => (
                <button key={c} type="button" className="color-swatch"
                  style={{ background: c, outline: color === c ? "2px solid var(--ink)" : "none" }}
                  aria-label={`Color ${c}`} aria-pressed={color === c}
                  onClick={() => setColor(c)} />
              ))}
            </div>
          </div>
          {metas.length > 0 && (
            <div className="field"><label>¿A qué meta de tu Dirección empuja? (opcional)</label>
              <Selector value={metaId} ariaLabel="Meta de la que este hábito es motor diario" placeholder="Ninguna meta por ahora" onChange={setMetaId}
                opciones={[{ value: "", label: "Ninguna meta por ahora" }, ...metas.map((m) => ({ value: m.id, label: m.title }))]} />
              {metaId && (
                <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 5 }}>
                  Este hábito será el motor diario de esa meta: cada marca empuja visiblemente su barra, sin cambiar a qué está conectada la meta.
                </p>
              )}
            </div>
          )}
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
            Verás una cuadrícula con cada día del desafío, pintada con tu color. Tocas un día y queda marcado.
          </p>
          <button className="btn primary" disabled={busy} style={{ width: "100%", marginTop: 4 }}>
            {busy ? "Guardando…" : habit ? "Guardar cambios" : "Crear hábito"}
          </button>
        </form>
      </div>
    </div>
  );
}
