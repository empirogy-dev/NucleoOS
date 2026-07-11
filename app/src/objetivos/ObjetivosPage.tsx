import { Link } from "react-router-dom";
import { hoyLocal } from "../lib/fechas";
import { useCallback, useEffect, useState } from "react";
import { Check, ChevronDown, ChevronRight, Compass, Plus, Trash2 } from "lucide-react";
import { AREAS } from "../areas";
import { TablesMissingError } from "../finanzas/data";
import { listDreams, type Dream } from "../vision/suenos";
import { listExercise, listHabitLogs, listHabits, type ExerciseLog, type Habit, type HabitLog } from "../habitos/data";
import { listSesiones, type Sesion } from "../mente/practicas";
import {
  METRICAS_AUTO,
  STATUS_LABELS,
  addActivity,
  addMilestone,
  addObjective,
  deleteActivity,
  deleteMilestone,
  deleteObjective,
  listActivity,
  listObjectives,
  objectiveProgress,
  updateMilestoneProgress,
  updateObjective,
  type ActivityEntry,
  type Objective,
  type ObjectiveStatus,
} from "./data";

// Dirección: lo que ya decidiste convertir en algo concreto.
// Metas activas, los próximos pasos que las mueven, tus avances
// y los ciclos que ya cerraste. Visión inspira, Dirección mueve.

const AREA_OPTIONS = [{ key: "", name: "General (toda la vida)" }, ...AREAS.map((a) => ({ key: a.key, name: a.name }))];

function areaColor(key: string | null): string {
  return AREAS.find((a) => a.key === key)?.color ?? "var(--obj)";
}

function areaName(key: string | null): string {
  return AREAS.find((a) => a.key === key)?.name ?? "General";
}

const STATUS_TONES: Record<ObjectiveStatus, { bg: string; fg: string }> = {
  en_camino: { bg: "var(--accent-wash)", fg: "var(--accent-ink)" },
  en_riesgo: { bg: "color-mix(in srgb,var(--warn) 18%,var(--paper))", fg: "var(--warn)" },
  lograda: { bg: "color-mix(in srgb,var(--ok) 18%,var(--paper))", fg: "var(--ok)" },
  pausada: { bg: "color-mix(in srgb,var(--muted) 18%,var(--paper))", fg: "var(--muted)" },
};

type Tab = "metas" | "pasos" | "avances" | "logradas";

/** Todo lo que puede alimentar una meta automática. */
interface Fuentes {
  ejercicio: ExerciseLog[];
  sesiones: Sesion[];
  habitLogs: HabitLog[];
}

/** Valor real de una métrica automática, contado desde que la meta nació. */
function valorAuto(o: Objective, f: Fuentes): number {
  const desde = o.created_at ? o.created_at.slice(0, 10) : "0000-00-00";
  if (o.auto_metric === "mov_sesiones") return f.ejercicio.filter((e) => e.date >= desde).length;
  if (o.auto_metric === "mov_minutos") return f.ejercicio.filter((e) => e.date >= desde).reduce((s, e) => s + e.minutes, 0);
  if (o.auto_metric === "mente_sesiones") return f.sesiones.filter((s) => s.fecha >= desde).length;
  if (o.auto_metric === "habito_marcas") return f.habitLogs.filter((l) => l.habit_id === o.auto_ref && l.date >= desde).length;
  return 0;
}

function progresoDe(o: Objective, f: Fuentes): number {
  if (o.auto_metric && o.auto_target) {
    return Math.min(100, Math.round((valorAuto(o, f) / o.auto_target) * 100));
  }
  return objectiveProgress(o);
}

export function ObjetivosPage() {
  const [tab, setTab] = useState<Tab>("metas");
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [ejercicio, setEjercicio] = useState<ExerciseLog[]>([]);
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [habitos, setHabitos] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<"objective" | "avance" | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [o, a] = await Promise.all([listObjectives(), listActivity(30)]);
      setObjectives(o);
      setActivity(a);
      setNeedsMigration(false);
    } catch (e) {
      if (e instanceof TablesMissingError) setNeedsMigration(true);
      else setError(e instanceof Error ? e.message : String(e));
    }
    try {
      setDreams(await listDreams());
    } catch {
      /* sin la 0019 no hay sueños vinculados, no bloquea */
    }
    try {
      setEjercicio(await listExercise(365));
    } catch {
      /* sin tablas de ejercicio, las metas automáticas parten en cero */
    }
    try {
      const [h, l] = await Promise.all([listHabits(), listHabitLogs()]);
      setHabitos(h);
      setHabitLogs(l);
    } catch {
      /* sin tablas de hábitos, la métrica de hábito no está disponible */
    }
    setSesiones(listSesiones());
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const activas = objectives.filter((o) => o.status !== "lograda");
  const logradas = objectives.filter((o) => o.status === "lograda");
  const enRiesgo = activas.filter((o) => o.status === "en_riesgo").length;
  const fuentes: Fuentes = { ejercicio, sesiones, habitLogs };
  const promedio = activas.length
    ? Math.round(activas.reduce((s, o) => s + progresoDe(o, fuentes), 0) / activas.length)
    : 0;
  const suenoDe = new Map(dreams.map((d) => [d.id, d]));
  const pasosPendientes = activas.flatMap((o) =>
    o.milestones.filter((m) => m.progress < 100).map((m) => ({ o, m })),
  );

  if (needsMigration) {
    return (
      <div className="page">
        <Head />
        <div className="card pad" style={{ maxWidth: 640 }}>
          <h3 style={{ marginBottom: 10 }}>Un paso pendiente en Supabase</h3>
          <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 12 }}>
            Faltan las tablas de metas. Es una sola vez: abre el SQL Editor de Supabase, pega el contenido de
            <code> supabase/migrations/0004_objetivos.sql</code> y presiona Run.
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

      <div className="statrow" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
        <div className="card stat"><div className="k">Metas activas</div><div className="v tnum">{activas.length}</div></div>
        <div className="card stat"><div className="k">Progreso promedio</div><div className="v tnum">{promedio}%</div></div>
        <div className="card stat"><div className="k">En riesgo</div><div className="v tnum" style={enRiesgo > 0 ? { color: "var(--warn)" } : undefined}>{enRiesgo}</div></div>
        <div className="card stat"><div className="k">Logradas</div><div className="v tnum" style={{ color: "var(--ok)" }}>{logradas.length}</div></div>
      </div>

      <div className="ftabs">
        <button className={"ftab" + (tab === "metas" ? " active" : "")} onClick={() => setTab("metas")}>Metas activas</button>
        <button className={"ftab" + (tab === "pasos" ? " active" : "")} onClick={() => setTab("pasos")}>
          Próximos pasos{pasosPendientes.length > 0 ? ` (${pasosPendientes.length})` : ""}
        </button>
        <button className={"ftab" + (tab === "avances" ? " active" : "")} onClick={() => setTab("avances")}>Avances</button>
        <button className={"ftab" + (tab === "logradas" ? " active" : "")} onClick={() => setTab("logradas")}>Logradas</button>
        <span style={{ flex: 1 }} />
        <button className="btn ghost" onClick={() => setModal("avance")}>Registrar avance</button>
        <button className="btn primary" onClick={() => setModal("objective")}>
          <Plus size={15} style={{ verticalAlign: "-2px", marginRight: 5 }} />
          Nueva meta
        </button>
      </div>

      {loading ? (
        <p style={{ color: "var(--muted)" }}>Cargando…</p>
      ) : (
        <>
          {tab === "metas" && (
            <div style={{ display: "grid", gap: 12, maxWidth: 780 }}>
              {activas.length === 0 && (
                <div className="card pad">
                  <p style={{ color: "var(--muted)", fontSize: 14 }}>
                    Sin metas activas. Crea una aquí, o anda a <Link to="/vision" style={{ color: "var(--accent-ink)", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 2 }}>Visión</Link> y convierte un sueño en meta.
                  </p>
                </div>
              )}
              {activas.map((o) => (
                <ObjectiveCard key={o.id} o={o} sueno={o.dream_id ? suenoDe.get(o.dream_id) ?? null : null}
                  fuentes={fuentes} habitos={habitos} onChanged={() => void reload()} />
              ))}
            </div>
          )}

          {tab === "pasos" && (
            <div className="card panel" style={{ maxWidth: 780 }}>
              <h3>👣 Lo próximo que mueve tus metas</h3>
              {pasosPendientes.length === 0 && (
                <p style={{ color: "var(--muted)", fontSize: 13.5 }}>
                  No hay pasos pendientes. Abre una meta y agrégale sus próximos pasos: acciones chicas y concretas, de esas que sí se hacen.
                </p>
              )}
              {pasosPendientes.map(({ o, m }) => (
                <div className="txrow" key={m.id}>
                  <button
                    className="hcheck"
                    aria-label={`Marcar ${m.title} como hecho`}
                    title="Marcar como hecho"
                    onClick={async () => { await updateMilestoneProgress(m.id, 100); void reload(); }}
                  >
                    {m.progress > 0 ? <Check size={13} style={{ opacity: 0.35 }} /> : ""}
                  </button>
                  <div className="txmeta">
                    <b>{m.title}</b>
                    <small>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: areaColor(o.area), display: "inline-block", marginRight: 5 }} />
                      {o.title}{m.progress > 0 ? `, va en ${m.progress}%` : ""}
                    </small>
                  </div>
                  <select className="ms-sel" value={m.progress} aria-label="Progreso del paso"
                    onChange={async (e) => { await updateMilestoneProgress(m.id, Number(e.target.value)); void reload(); }}>
                    {[0, 25, 50, 75, 100].map((v) => <option key={v} value={v}>{v}%</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}

          {tab === "avances" && (
            <div className="card panel" style={{ maxWidth: 780 }}>
              <h3>📈 Tu historia de progreso</h3>
              {activity.length === 0 && (
                <p style={{ color: "var(--muted)", fontSize: 13.5 }}>
                  Cada vez que avances en algo, regístralo. Entrenar 30 minutos, ahorrar 100 dólares, terminar una lección: todo cuenta.
                </p>
              )}
              <div className="tl">
                {activity.map((a) => (
                  <div className="row" key={a.id}>
                    <span className="tdot" style={{ background: areaColor(a.area) }} />
                    <div className="tx" style={{ flex: 1 }}>
                      <b>{a.date}, {areaName(a.area)}</b>
                      {a.description}
                    </div>
                    <button className="xdel" aria-label="Eliminar avance" style={{ width: 24, height: 24 }}
                      onClick={async () => { await deleteActivity(a.id); void reload(); }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "logradas" && (
            <div style={{ display: "grid", gap: 12, maxWidth: 780 }}>
              {logradas.length === 0 && (
                <div className="card pad">
                  <p style={{ color: "var(--muted)", fontSize: 14 }}>
                    Aquí se celebran los ciclos cerrados. Cuando una meta llegue a su fin, márcala como lograda y quedará en esta vitrina.
                  </p>
                </div>
              )}
              {logradas.map((o) => {
                const sueno = o.dream_id ? suenoDe.get(o.dream_id) ?? null : null;
                return (
                  <div className="card pad" key={o.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 24 }}>🏆</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <b style={{ fontSize: 14.5 }}>{o.title}</b>
                      <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
                        {areaName(o.area)}{sueno ? `, nació del sueño “${sueno.title}”` : ""}
                      </div>
                    </div>
                    <button className="chip" style={{ background: STATUS_TONES.lograda.bg, color: STATUS_TONES.lograda.fg, border: "none", cursor: "pointer" }}
                      title="Volver a activarla" onClick={async () => { await updateObjective(o.id, { status: "en_camino" }); void reload(); }}>
                      🎉 Lograda
                    </button>
                    <button className="xdel" aria-label="Eliminar meta" onClick={async () => { if (!window.confirm(`¿Eliminar la meta ${o.title}? También se borran sus pasos.`)) return; await deleteObjective(o.id); void reload(); }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {modal === "objective" && (
        <ObjectiveModal onClose={() => setModal(null)} onSaved={() => { setModal(null); void reload(); }} />
      )}
      {modal === "avance" && (
        <AvanceModal onClose={() => setModal(null)} onSaved={() => { setModal(null); void reload(); }} />
      )}
    </div>
  );
}

function Head() {
  return (
    <div className="page-head">
      <div className="eyebrow">
        <Compass size={13} /> Mi vida
      </div>
      <h1>Dirección</h1>
      <p>Lo que ya decidiste: metas activas, próximos pasos y avances. La inspiración vive en Visión, aquí se mueve.</p>
    </div>
  );
}

function ObjectiveCard({ o, sueno, fuentes, habitos, onChanged }: {
  o: Objective;
  sueno: Dream | null;
  fuentes: Fuentes;
  habitos: Habit[];
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [newMs, setNewMs] = useState("");
  const esAuto = Boolean(o.auto_metric && o.auto_target);
  const metrica = METRICAS_AUTO.find((m) => m.key === o.auto_metric) ?? null;
  const habitoDe = o.auto_metric === "habito_marcas" ? habitos.find((h) => h.id === o.auto_ref) ?? null : null;
  const valor = esAuto ? valorAuto(o, fuentes) : 0;
  const pct = progresoDe(o, fuentes);
  const tone = STATUS_TONES[o.status];
  const hasMs = o.milestones.length > 0;

  async function cycleStatus() {
    const order: ObjectiveStatus[] = ["en_camino", "en_riesgo", "lograda", "pausada"];
    const next = order[(order.indexOf(o.status) + 1) % order.length];
    await updateObjective(o.id, { status: next });
    onChanged();
  }

  async function saveMs(e: React.FormEvent) {
    e.preventDefault();
    if (!newMs.trim()) return;
    await addMilestone(o.id, newMs.trim(), o.milestones.length);
    setNewMs("");
    onChanged();
  }

  return (
    <div className="card pad">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button className="xdel" aria-label={open ? "Cerrar pasos" : "Ver pasos"} onClick={() => setOpen(!open)}>
          {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <b style={{ fontSize: 14.5 }}>{o.title}</b>
          <div style={{ fontSize: 11.5, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: areaColor(o.area), display: "inline-block" }} />
            {areaName(o.area)}{o.deadline ? `, para el ${o.deadline}` : ""}
            {sueno && <span title="Esta meta nació de un sueño de Visión">🌱 nace de “{sueno.title}”</span>}
          </div>
        </div>
        <button className="chip" style={{ background: tone.bg, color: tone.fg, border: "none", cursor: "pointer" }}
          title="Cambiar estado" onClick={() => void cycleStatus()}>
          {STATUS_LABELS[o.status]}
        </button>
        <button className="xdel" aria-label="Eliminar meta" onClick={async () => { if (!window.confirm(`¿Eliminar la meta ${o.title}? También se borran sus pasos.`)) return; await deleteObjective(o.id); onChanged(); }}>
          <Trash2 size={14} />
        </button>
      </div>

      <div className="bar" style={{ margin: "12px 0 0" }}>
        <div className="top">
          <span>
            {esAuto && metrica
              ? `⚡ se alimenta solo${habitoDe ? ` de ${habitoDe.icon ?? ""} ${habitoDe.name}` : ""}: ${valor} de ${o.auto_target} ${metrica.unidad}`
              : hasMs ? (o.milestones.length === 1 ? "1 paso" : `${o.milestones.length} pasos`) : "progreso manual"}
          </span>
          <b className="tnum">{pct}%</b>
        </div>
        <div className="track">
          <div className="fill" style={{ width: `${pct}%`, background: areaColor(o.area) }} />
        </div>
      </div>
      {!hasMs && !esAuto && (
        <input type="range" min={0} max={100} step={5} defaultValue={o.progress} className="slider"
          aria-label="Progreso de la meta"
          onMouseUp={async (e) => { await updateObjective(o.id, { progress: Number((e.target as HTMLInputElement).value) }); onChanged(); }}
          onTouchEnd={async (e) => { await updateObjective(o.id, { progress: Number((e.target as HTMLInputElement).value) }); onChanged(); }} />
      )}

      {!esAuto && !hasMs && !open && (
        <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 6 }}>
          💡 Ábrela con la flechita y conéctala a tu movimiento, tu práctica o un hábito: avanzará sola.
        </p>
      )}

      {open && (
        <div style={{ marginTop: 12, borderTop: "1px solid var(--line-soft)", paddingTop: 10 }}>
          <AutoConfig o={o} habitos={habitos} onChanged={onChanged} />
          {o.milestones.map((m) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
              <span style={{ flex: 1, fontSize: 13.5, color: m.progress >= 100 ? "var(--muted)" : "var(--ink-soft)", textDecoration: m.progress >= 100 ? "line-through" : "none" }}>
                {m.title}
              </span>
              <select className="ms-sel" value={m.progress} aria-label="Progreso del paso"
                onChange={async (e) => { await updateMilestoneProgress(m.id, Number(e.target.value)); onChanged(); }}>
                {[0, 25, 50, 75, 100].map((v) => <option key={v} value={v}>{v}%</option>)}
              </select>
              <button className="xdel" aria-label="Eliminar paso" onClick={async () => { await deleteMilestone(m.id); onChanged(); }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          <form onSubmit={saveMs} style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input className="input-inline" value={newMs} onChange={(e) => setNewMs(e.target.value)} placeholder="Nuevo paso, por ejemplo: investigar costos" />
            <button className="btn ghost" type="submit">Agregar</button>
          </form>
        </div>
      )}
    </div>
  );
}

/** Configuración del progreso automático de una meta, dentro de sus detalles. */
function AutoConfig({ o, habitos, onChanged }: { o: Objective; habitos: Habit[]; onChanged: () => void }) {
  const [metric, setMetric] = useState(o.auto_metric ?? "");
  const [target, setTarget] = useState(o.auto_target != null ? String(o.auto_target) : "");
  const [ref, setRef] = useState(o.auto_ref ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function guardar() {
    setErr(null);
    if (metric === "habito_marcas" && !ref) {
      setErr("Elige qué hábito alimenta esta meta.");
      return;
    }
    try {
      await updateObjective(o.id, {
        auto_metric: metric || null,
        auto_target: metric && target ? Number(target) : null,
        auto_ref: metric === "habito_marcas" ? ref : null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div style={{ marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid var(--line-soft)" }}>
      <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", fontWeight: 600, marginBottom: 6 }}>
        ⚡ Progreso automático
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <select className="ms-sel" style={{ padding: "8px 10px" }} value={metric} aria-label="Métrica automática"
          onChange={(e) => setMetric(e.target.value)}>
          <option value="">Sin conexión automática</option>
          {METRICAS_AUTO.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
        </select>
        {metric === "habito_marcas" && (
          <select className="ms-sel" style={{ padding: "8px 10px" }} value={ref} aria-label="Hábito que alimenta la meta"
            onChange={(e) => setRef(e.target.value)}>
            <option value="">¿Qué hábito?</option>
            {habitos.map((h) => <option key={h.id} value={h.id}>{h.icon} {h.name}</option>)}
          </select>
        )}
        {metric && (
          <input className="input-inline" type="number" min={1} max={100000} value={target} placeholder="meta"
            aria-label="Cantidad objetivo" style={{ maxWidth: 100, flex: "none" }}
            onChange={(e) => setTarget(e.target.value)} />
        )}
        <button className="btn ghost" type="button" onClick={() => void guardar()}>Guardar</button>
        {saved && <span className="chip">✓ Conectada</span>}
      </div>
      {metric && (
        <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 6 }}>
          La meta avanza sola con cada registro de {METRICAS_AUTO.find((m) => m.key === metric)?.fuente ?? "la app"}, contando desde que la creaste.
        </p>
      )}
      {err && <p style={{ fontSize: 12, color: "var(--err)", marginTop: 6 }}>{err}</p>}
    </div>
  );
}

function ObjectiveModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [area, setArea] = useState("");
  const [deadline, setDeadline] = useState("");
  const [metric, setMetric] = useState("");
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await addObjective({
        title,
        area: area || null,
        deadline: deadline || null,
        auto_metric: metric || null,
        auto_target: metric && target ? Number(target) : null,
      });
      onSaved();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
      setBusy(false);
    }
  }

  return (
    <ModalShell title="Nueva meta" onClose={onClose}>
      {err && <p style={{ fontSize: 12.5, color: "var(--err)", marginBottom: 10 }}>{err}</p>}
      <form onSubmit={save}>
        <div className="field"><label>¿Qué quieres lograr?</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ahorrar para el viaje a Japón" autoFocus /></div>
        <div className="field"><label>Área de la vida</label>
          <select value={area} onChange={(e) => setArea(e.target.value)}>
            {AREA_OPTIONS.map((a) => <option key={a.key} value={a.key}>{a.name}</option>)}
          </select></div>
        <div className="field"><label>Fecha límite (opcional)</label>
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></div>
        <div className="frow">
          <div className="field"><label>Se alimenta de (opcional)</label>
            <select value={metric} onChange={(e) => setMetric(e.target.value)}>
              <option value="">Nada, progreso manual o por pasos</option>
              {METRICAS_AUTO.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select></div>
          {metric && (
            <div className="field" style={{ maxWidth: 110 }}><label>Objetivo</label>
              <input type="number" min={1} required value={target} onChange={(e) => setTarget(e.target.value)} placeholder="50" /></div>
          )}
        </div>
        {metric && (
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
            Cada registro real (una rutina, una caminata, una sesión) hará avanzar esta meta solo.
          </p>
        )}
        <button className="btn primary" disabled={busy} style={{ width: "100%", marginTop: 4 }}>{busy ? "Guardando…" : "Crear meta"}</button>
      </form>
    </ModalShell>
  );
}

function AvanceModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [description, setDescription] = useState("");
  const [area, setArea] = useState("objetivos");
  const [date, setDate] = useState(hoyLocal());
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await addActivity({ area, date, description });
    onSaved();
  }

  return (
    <ModalShell title="Registrar avance" onClose={onClose}>
      <form onSubmit={save}>
        <div className="field"><label>¿Qué lograste?</label>
          <textarea className="vision-edit" rows={3} required value={description} autoFocus
            placeholder="Por ejemplo: hoy entrené 30 minutos, o ahorré 100 dólares."
            onChange={(e) => setDescription(e.target.value)} /></div>
        <div className="frow">
          <div className="field"><label>Área</label>
            <select value={area} onChange={(e) => setArea(e.target.value)}>
              {AREAS.map((a) => <option key={a.key} value={a.key}>{a.name}</option>)}
            </select></div>
          <div className="field"><label>Fecha</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        </div>
        <button className="btn primary" disabled={busy} style={{ width: "100%", marginTop: 4 }}>{busy ? "Guardando…" : "Guardar avance"}</button>
      </form>
    </ModalShell>
  );
}

function ModalShell({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="tp-overlay" onClick={onClose}>
      <div className="tp" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 430 }}>
        <h3 style={{ marginBottom: 14 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}
