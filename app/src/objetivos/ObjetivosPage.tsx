import { Link } from "react-router-dom";
import { celebrar } from "../lib/celebrar";
import { CampoFecha } from "../components/CampoFecha";
import { hoyLocal } from "../lib/fechas";
import { useCallback, useEffect, useState } from "react";
import { Check, ChevronDown, ChevronRight, Compass, Pencil, Plus, Trash2 } from "lucide-react";
import { AREAS } from "../areas";
import { TablesMissingError } from "../finanzas/data";
import { MONTO_OCULTO, modoPrivado } from "../finanzas/types";
import { listDreams, type Dream } from "../vision/suenos";
import { listExercise, listHabitLogs, listHabits, type ExerciseLog, type Habit, type HabitLog } from "../habitos/data";
import { listRetoLogs, listRetos, type Reto, type RetoLog } from "../habitos/retos";
import { listSesiones, type Sesion } from "../mente/practicas";
import { listProjects, listWorkLogs, type Project, type WorkLog } from "../trabajo/data";
import { listFocusBlocks, type FocusBlock } from "../foco/data";
import { listGoals } from "../finanzas/data";
import { listRelationships, listRelLogs, type Relationship, type RelLog } from "../relaciones/data";
import { LIBROS, VIAS_LIBRO, estadosLibros, librosLeidos, type Libro } from "../aprendizaje/biblioteca";
import { comoLibro, listLibrosPropios } from "../aprendizaje/librosPropios";
import { Selector } from "../components/Selector";
import {
  METRICAS_AUTO,
  PLAZO_DEFECTO_DIAS,
  STATUS_LABELS,
  focoRefOpciones,
  metaAutoEsperado,
  metricasParaArea,
  progresoDe,
  valorAuto,
  type Fuentes,
  addActivity,
  addMilestone,
  addObjective,
  deleteActivity,
  deleteMilestone,
  deleteObjective,
  listActivity,
  listObjectives,
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

export function ObjetivosPage() {
  const [tab, setTab] = useState<Tab>("metas");
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [ejercicio, setEjercicio] = useState<ExerciseLog[]>([]);
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [habitos, setHabitos] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [retos, setRetos] = useState<Reto[]>([]);
  const [proyectos, setProyectos] = useState<Project[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [focusBlocks, setFocusBlocks] = useState<FocusBlock[]>([]);
  const [goals, setGoals] = useState<Fuentes["goals"]>([]);
  const [personas, setPersonas] = useState<Relationship[]>([]);
  const [relLogs, setRelLogs] = useState<RelLog[]>([]);
  const [librosCat, setLibrosCat] = useState<Libro[]>(LIBROS);
  const [retoLogs, setRetoLogs] = useState<RetoLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<"objective" | "avance" | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [o, a] = await Promise.all([listObjectives(), listActivity(500)]);
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
    try {
      const [r, rl] = await Promise.all([listRetos(), listRetoLogs()]);
      setRetos(r);
      setRetoLogs(rl);
    } catch {
      /* sin tablas de retos, la métrica de reto no está disponible */
    }
    try {
      const [p, w] = await Promise.all([listProjects(), listWorkLogs(365)]);
      setProyectos(p);
      setWorkLogs(w);
    } catch {
      /* sin tablas de trabajo, la métrica de horas no está disponible */
    }
    try {
      setFocusBlocks(await listFocusBlocks(365));
    } catch {
      /* sin la 0035, la métrica de foco no está disponible */
    }
    try {
      setGoals(await listGoals());
    } catch {
      /* sin Finanzas migrado, la métrica de ahorro no está disponible */
    }
    try {
      const [pe, pl] = await Promise.all([listRelationships(), listRelLogs()]);
      setPersonas(pe);
      setRelLogs(pl);
    } catch {
      /* sin Relaciones migrado, la métrica de momentos no está disponible */
    }
    try {
      setLibrosCat([...LIBROS, ...(await listLibrosPropios()).map(comoLibro)]);
    } catch {
      /* sin la 0042 la meta de libros ofrece solo la biblioteca curada */
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
  const fuentes: Fuentes = { ejercicio, sesiones, habitLogs, retoLogs, avances: activity, workLogs, focusBlocks, goals, relLogs, libros: librosLeidos() };
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
                  fuentes={fuentes} habitos={habitos} retos={retos} proyectos={proyectos} personas={personas} libros={librosCat} onChanged={() => void reload()} />
              ))}
              <GuiaDireccion />
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
                  <div style={{ width: 86, flex: "none" }}>
                    <Selector compacto value={String(m.progress)} ariaLabel="Progreso del paso"
                      opciones={[0, 25, 50, 75, 100].map((v) => ({ value: String(v), label: `${v}%` }))}
                      onChange={async (v) => { await updateMilestoneProgress(m.id, Number(v)); void reload(); }} />
                  </div>
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
                {activity.slice(0, 40).map((a) => (
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
        <ObjectiveModal cx={{ habitos, retos, proyectos, goals, personas, libros: librosCat }} onClose={() => setModal(null)} onSaved={() => { setModal(null); void reload(); }} />
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

function ObjectiveCard({ o, sueno, fuentes, habitos, retos, proyectos, personas, libros, onChanged }: {
  o: Objective;
  sueno: Dream | null;
  fuentes: Fuentes;
  habitos: Habit[];
  retos: Reto[];
  proyectos: Project[];
  personas: Relationship[];
  libros: Libro[];
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState(false);
  const [newMs, setNewMs] = useState("");
  const esperado = metaAutoEsperado(o);
  const esAuto = esperado !== null || o.auto_metric === "ahorro_meta";
  const metrica = METRICAS_AUTO.find((m) => m.key === o.auto_metric) ?? null;
  const habitoDe = o.auto_metric === "habito_marcas"
    ? habitos.find((h) => h.id === o.auto_ref) ?? null
    : o.auto_metric === "reto_dias"
      ? (() => { const r = retos.find((x) => x.id === o.auto_ref); return r ? { icon: r.icon, name: r.title } : null; })()
      : o.auto_metric === "trabajo_horas"
        ? (() => { const p = proyectos.find((x) => x.id === o.auto_ref); return p ? { icon: "💼", name: p.name } : null; })()
        : o.auto_metric === "foco_minutos"
          ? (() => {
              const ref = o.auto_ref ?? "";
              if (ref.startsWith("p:")) { const p = proyectos.find((x) => x.id === ref.slice(2)); return p ? { icon: "🎯💼", name: p.name } : null; }
              if (ref === "a:aprendizaje") return { icon: "🎯📚", name: "Aprendizaje" };
              return null;
            })()
          : o.auto_metric === "rel_momentos"
            ? (() => {
                if (!o.auto_ref) return { icon: "💞", name: "cualquier persona" };
                const p = personas.find((x) => x.id === o.auto_ref);
                return p ? { icon: "💞", name: p.name } : null;
              })()
            : o.auto_metric === "libros_leidos"
              ? (() => {
                  const ref = o.auto_ref ?? "";
                  if (ref.startsWith("l:")) return { icon: "📚", name: "los que elegiste" };
                  if (ref.startsWith("v:")) { const v = VIAS_LIBRO.find((x) => x.key === ref.slice(2)); return v ? { icon: "📚", name: v.label } : null; }
                  return { icon: "📚", name: "la biblioteca" };
                })()
              : null;
  const valor = esAuto ? valorAuto(o, fuentes) : 0;
  const pct = progresoDe(o, fuentes);
  const tone = STATUS_TONES[o.status];
  const hasMs = o.milestones.length > 0;

  async function cycleStatus() {
    const order: ObjectiveStatus[] = ["en_camino", "en_riesgo", "lograda", "pausada"];
    const next = order[(order.indexOf(o.status) + 1) % order.length];
    await updateObjective(o.id, { status: next });
    if (next === "lograda") celebrar("grande");
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
        <button className="xdel" title="Editar meta" aria-label="Editar meta" onClick={() => setEditando(true)}>
          <Pencil size={13} />
        </button>
        <button className="xdel" aria-label="Eliminar meta" onClick={async () => { if (!window.confirm(`¿Eliminar la meta ${o.title}? También se borran sus pasos.`)) return; await deleteObjective(o.id); onChanged(); }}>
          <Trash2 size={14} />
        </button>
      </div>
      {editando && <EditObjectiveModal o={o} onClose={() => setEditando(false)} onSaved={() => { setEditando(false); onChanged(); }} />}

      <div className="bar" style={{ margin: "12px 0 0" }}>
        <div className="top">
          <span>
            {esAuto && metrica
              ? o.auto_metric === "ahorro_meta"
                ? (() => {
                    const g = fuentes.goals.find((x) => x.id === o.auto_ref);
                    if (!g) return "⚡ conectada a una meta de ahorro (revisa la conexión)";
                    // Con el ojito de Finanzas cerrado, aquí tampoco se ve la plata.
                    if (modoPrivado()) return `⚡ ${MONTO_OCULTO} aportados en ${g.icon ?? "🎯"} ${g.name}`;
                    return `⚡ ${Math.round(Number(g.current_amount)).toLocaleString("es-CL")} de ${Math.round(Number(g.target_amount)).toLocaleString("es-CL")} aportados en ${g.icon ?? "🎯"} ${g.name}`;
                  })()
                : o.auto_metric === "libros_leidos"
                  ? `⚡ ${valor} de ${esperado} ${metrica.unidad}${habitoDe ? ` de ${habitoDe.icon} ${habitoDe.name}` : ""}`
                  : `⚡ ${valor} de ≈${esperado} ${metrica.unidad}${habitoDe ? ` ${o.auto_metric === "rel_momentos" ? "con" : "de"} ${habitoDe.icon ?? ""} ${habitoDe.name}` : ""}, a ${o.auto_target} por semana`
              : hasMs ? (o.milestones.length === 1 ? "1 paso" : `${o.milestones.length} pasos`) : "progreso manual"}
          </span>
          <b className="tnum">{pct}%</b>
        </div>
        <div className="track">
          <div className="fill" style={{ width: `${pct}%`, background: areaColor(o.area) }} />
        </div>
      </div>
      {o.auto_metric === "libros_leidos" && (o.auto_ref ?? "").startsWith("l:") && (
        <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 6, lineHeight: 1.5 }}>
          {(() => {
            const estados = estadosLibros();
            const ids = (o.auto_ref ?? "").slice(2).split(",").filter(Boolean);
            return ids.map((id) => {
              const l = libros.find((x) => x.id === id);
              return `${estados[id] === "leido" ? "✓" : "☐"} ${l ? `${l.emoji} ${l.titulo}` : id}`;
            }).join("  ·  ");
          })()}
          <span style={{ display: "block", marginTop: 2 }}>
            La meta avanza cuando marcas un libro como leído en Aprendizaje → Biblioteca. Tu lectura diaria vive en su hábito.
          </span>
        </p>
      )}
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
          <AutoConfig o={o} cx={{ habitos, retos, proyectos, goals: fuentes.goals, personas, libros }}
            activaLabel={esAuto && metrica ? `${habitoDe ? `${habitoDe.icon} ${habitoDe.name}, ` : ""}${metrica.label}${o.auto_metric === "libros_leidos" && o.auto_target ? `, ${o.auto_target} en total` : o.auto_metric !== "ahorro_meta" && o.auto_target ? `, a ${o.auto_target} por semana` : ""}` : null}
            onChanged={onChanged} />
          {o.milestones.map((m) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
              <span style={{ flex: 1, fontSize: 13.5, color: m.progress >= 100 ? "var(--muted)" : "var(--ink-soft)", textDecoration: m.progress >= 100 ? "line-through" : "none" }}>
                {m.title}
              </span>
              <div style={{ width: 86, flex: "none" }}>
                <Selector compacto value={String(m.progress)} ariaLabel="Progreso del paso"
                  opciones={[0, 25, 50, 75, 100].map((v) => ({ value: String(v), label: `${v}%` }))}
                  onChange={async (v) => { await updateMilestoneProgress(m.id, Number(v)); onChanged(); }} />
              </div>
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

/** Ideas con respaldo de investigación para cumplir lo que te propones.
 *  Fuentes variadas: Gollwitzer, Oettingen, Milkman, Locke y Latham, Kivetz. */
function GuiaDireccion() {
  const [abierta, setAbierta] = useState(false);
  const IDEAS = [
    {
      titulo: "Decide el cuándo y el dónde",
      texto: "\"Martes y jueves a las 7, en el gimnasio\" cumple mucho más que \"voy a entrenar más\". El psicólogo Peter Gollwitzer lo llamó intenciones de implementación: la decisión ya está tomada cuando llega el momento.",
    },
    {
      titulo: "Sueña con obstáculos incluidos",
      texto: "Visualizar solo el éxito relaja al cerebro como si ya hubieras llegado. Gabriele Oettingen encontró que funciona imaginar el resultado Y el obstáculo real, con su plan: \"si llego cansada, igual me pongo las zapatillas y camino diez minutos\".",
    },
    {
      titulo: "Aprovecha los borrones y cuenta nueva",
      texto: "Lunes, inicio de mes, la vuelta de un viaje: Katy Milkman mostró que los comienzos con frontera clara le dan al cerebro permiso de reinventarse. Si un reto se cayó, no lo arrastres: reinícialo en el próximo punto de partida.",
    },
    {
      titulo: "Junta lo que debes con lo que amas",
      texto: "Tu serie favorita solo mientras caminas, el podcast solo en el gimnasio. La tentación empaquetada convierte la fuerza de voluntad en ganas.",
    },
    {
      titulo: "Persigue el proceso, no solo el resultado",
      texto: "\"Entrenar tres veces por semana\" depende de ti; \"bajar cinco kilos\" no del todo. La investigación en metas (Locke y Latham) favorece lo específico y controlable: por eso las metas de la app se alimentan de acciones, no de deseos.",
    },
    {
      titulo: "Mientras más cerca, más empuja",
      texto: "La motivación crece al acercarse al final, es el gradiente de meta que se observa hasta en las tarjetas de café. Mirar tu barra de progreso no es vanidad, es combustible.",
    },
    {
      titulo: "Sé alguien, no solo logres algo",
      texto: "Sostener \"soy una persona que entrena\" pesa menos que \"tengo que entrenar\". Cada registro que haces aquí es evidencia a favor de esa persona.",
    },
  ];
  return (
    <button className={"card guia-card" + (abierta ? " open" : "")} onClick={() => setAbierta(!abierta)}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 22 }}>🧭</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <b style={{ fontSize: 14, display: "block" }}>El arte de cumplir lo que te propones</b>
          <small style={{ fontSize: 12.5, color: "var(--muted)" }}>Siete ideas con respaldo de investigación, de varias fuentes. Cero frases de taza.</small>
        </div>
        <span style={{ color: "var(--muted)", fontSize: 12 }}>{abierta ? "▴" : "▾"}</span>
      </div>
      {abierta && (
        <div style={{ marginTop: 12, textAlign: "left", display: "grid", gap: 11 }}>
          {IDEAS.map((p, i) => (
            <div key={p.titulo} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <b className="tnum" style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{i + 1}</b>
              <div>
                <b style={{ fontSize: 13 }}>{p.titulo}</b>
                <p style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.55 }}>{p.texto}</p>
              </div>
            </div>
          ))}
          <p style={{ fontSize: 12, color: "var(--muted)", borderTop: "1px solid var(--line-soft)", paddingTop: 10 }}>
            En NucleoOS esto ya está cableado: tus deseos se escriben en Visión, maduran a metas con fecha aquí, y se conectan a hábitos, retos y movimiento para que el porcentaje avance con lo que haces de verdad.
          </p>
        </div>
      )}
    </button>
  );
}

/** Todo lo que los selectores de conexión necesitan para ofrecer sus opciones. */
interface Conexiones {
  habitos: Habit[];
  retos: Reto[];
  proyectos: Project[];
  goals: Fuentes["goals"];
  personas: Relationship[];
  libros: Libro[];
}

/** El segundo selector de una conexión automática: a QUÉ hábito, reto,
 *  proyecto, meta de ahorro o persona se liga. El mismo en el modal de
 *  Nueva meta y en el Progreso automático, para que nada quede distinto. */
function SelectorDeRef({ metric, refVal, onRef, cx, compacto }: { metric: string; refVal: string; onRef: (v: string) => void; cx: Conexiones; compacto?: boolean }) {
  const props = { compacto, value: refVal, onChange: onRef };
  if (metric === "habito_marcas") {
    return <Selector {...props} ariaLabel="Hábito que alimenta la meta" placeholder="¿Qué hábito?"
      opciones={cx.habitos.map((h) => ({ value: h.id, label: `${h.icon ?? "✓"} ${h.name}` }))} />;
  }
  if (metric === "reto_dias") {
    return <Selector {...props} ariaLabel="Reto que alimenta la meta" placeholder="¿Qué reto?"
      opciones={cx.retos.filter((r) => r.status !== "terminado").map((r) => ({ value: r.id, label: `${r.icon ?? "🎯"} ${r.title}` }))} />;
  }
  if (metric === "trabajo_horas") {
    return <Selector {...props} ariaLabel="Proyecto que alimenta la meta" placeholder="¿Qué proyecto?"
      opciones={cx.proyectos.map((p) => ({ value: p.id, label: `💼 ${p.name}` }))} />;
  }
  if (metric === "foco_minutos") {
    return <Selector {...props} ariaLabel="Proyecto o área que alimenta la meta" placeholder="¿A qué liga tu foco?"
      opciones={focoRefOpciones(cx.proyectos)} />;
  }
  if (metric === "ahorro_meta") {
    return <Selector {...props} ariaLabel="Meta de ahorro que alimenta esta meta" placeholder="¿Qué meta de ahorro?"
      opciones={cx.goals.map((g) => ({ value: g.id, label: `${g.icon ?? "🎯"} ${g.name}` }))} />;
  }
  if (metric === "rel_momentos") {
    return <Selector {...props} ariaLabel="Persona cuyos momentos alimentan esta meta"
      opciones={[{ value: "", label: "💞 Con cualquier persona" }, ...cx.personas.map((p) => ({ value: p.id, label: `💞 ${p.name}` }))]} />;
  }
  if (metric === "libros_leidos") {
    // El modo: los libros exactos que ella elige, una vía, o toda la biblioteca.
    const modo = refVal.startsWith("l:") ? "l:" : refVal;
    return <Selector {...props} value={modo} onChange={onRef} ariaLabel="Libros que alimentan esta meta"
      opciones={[
        { value: "l:", label: "🎯 Elegir los libros exactos" },
        { value: "", label: "📚 Cualquier libro de la biblioteca" },
        ...VIAS_LIBRO.map((v) => ({ value: `v:${v.key}`, label: `📚 Los de ${v.label}` })),
      ]} />;
  }
  return null;
}

/** La lista para marcar los libros exactos de una meta "Leer libros".
 *  Los de "Mi lista" (los que quieres leer) aparecen primero. */
function ChecklistLibros({ refVal, onRef, libros }: { refVal: string; onRef: (v: string) => void; libros: Libro[] }) {
  const [filtro, setFiltro] = useState("");
  const sel = new Set(refVal.slice(2).split(",").filter(Boolean));
  const estados = estadosLibros();
  const peso = (l: Libro) => (sel.has(l.id) ? 0 : estados[l.id] === "quiero" ? 1 : 2);
  const orden = [...libros].sort((a, b) => peso(a) - peso(b));
  const visibles = filtro.trim()
    ? orden.filter((l) => `${l.titulo} ${l.autor}`.toLowerCase().includes(filtro.trim().toLowerCase()))
    : orden;

  function alternar(id: string) {
    const s = new Set(sel);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    onRef(`l:${[...s].join(",")}`);
  }

  return (
    <div style={{ marginTop: 8 }}>
      <input className="input-inline" value={filtro} onChange={(e) => setFiltro(e.target.value)}
        placeholder="Buscar por título o autor…" aria-label="Buscar un libro" style={{ marginBottom: 6, width: "100%" }} />
      <div style={{ maxHeight: 172, overflowY: "auto", border: "1px solid var(--line)", borderRadius: "var(--r-sm)", padding: 4, background: "var(--surface)" }}>
        {visibles.map((l) => (
          <button key={l.id} type="button" className={"sel-opt" + (sel.has(l.id) ? " on" : "")}
            style={{ display: "flex", gap: 7, alignItems: "center" }}
            onClick={() => alternar(l.id)}>
            <span style={{ flex: "none" }}>{sel.has(l.id) ? "☑" : "☐"}</span>
            <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {l.emoji} {l.titulo}
              {estados[l.id] === "quiero" ? " · 📖 en tu lista" : estados[l.id] === "leido" ? " · ✓ leído" : ""}
            </span>
          </button>
        ))}
        {visibles.length === 0 && <p style={{ fontSize: 12.5, color: "var(--muted)", padding: 8 }}>Ningún libro calza con esa búsqueda.</p>}
      </div>
      <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 5 }}>
        {sel.size === 0
          ? "Marca los libros que quieres leerte: el total de la meta será esa cantidad."
          : sel.size === 1
            ? "1 libro elegido: terminarlo completa la meta."
            : `${sel.size} libros elegidos: cada uno que termines avanza ≈${Math.round(100 / sel.size)}%.`}
      </p>
    </div>
  );
}

/** Qué le falta a una conexión para poder guardarse, o null si está completa. */
function faltaEnConexion(metric: string, ref: string): string | null {
  if (metric === "habito_marcas" && !ref) return "Elige qué hábito alimenta esta meta.";
  if (metric === "reto_dias" && !ref) return "Elige qué reto alimenta esta meta.";
  if (metric === "trabajo_horas" && !ref) return "Elige qué proyecto de Trabajo alimenta esta meta.";
  if (metric === "foco_minutos" && !ref) return "Elige a qué proyecto o área ligas tus bloques de foco.";
  if (metric === "ahorro_meta" && !ref) return "Elige qué meta de ahorro de Finanzas alimenta esta meta.";
  if (metric === "libros_leidos" && ref === "l:") return "Marca al menos un libro para esta meta.";
  return null;
}

/** Cuántos libros exactos tiene elegidos una conexión "l:". */
function librosElegidos(ref: string): number {
  return ref.startsWith("l:") ? ref.slice(2).split(",").filter(Boolean).length : 0;
}

const METRICAS_CON_REF = ["habito_marcas", "reto_dias", "trabajo_horas", "foco_minutos", "ahorro_meta", "rel_momentos", "libros_leidos"];

/** Configuración del progreso automático de una meta, dentro de sus detalles. */
function AutoConfig({ o, cx, activaLabel, onChanged }: { o: Objective; cx: Conexiones; activaLabel: string | null; onChanged: () => void }) {
  const [metric, setMetric] = useState(o.auto_metric ?? "");
  const [target, setTarget] = useState(o.auto_target != null ? String(o.auto_target) : "");
  const [ref, setRef] = useState(o.auto_ref ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function guardar() {
    setErr(null);
    const falta = faltaEnConexion(metric, ref);
    if (falta) {
      setErr(falta);
      return;
    }
    try {
      await updateObjective(o.id, {
        auto_metric: metric || null,
        // Con libros exactos, el total ES la cantidad de libros elegidos.
        auto_target: metric === "libros_leidos" && ref.startsWith("l:")
          ? Math.max(1, librosElegidos(ref))
          : metric && metric !== "ahorro_meta" && target ? Number(target) : null,
        auto_ref: METRICAS_CON_REF.includes(metric) ? (ref || null) : null,
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
      {activaLabel && (
        <p style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 8 }}>
          Conectada ahora a: <b>{activaLabel}</b>. Cambia la selección de abajo solo si quieres reconectarla a otra cosa.
        </p>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: "1 1 210px", minWidth: 190 }}>
          <Selector compacto value={metric} ariaLabel="Métrica automática" placeholder="Sin conexión automática"
            opciones={[{ value: "", label: "Sin conexión automática" }, ...metricasParaArea(o.area).map((m) => ({ value: m.key, label: m.label }))]}
            onChange={(v) => { setMetric(v); setRef(v === "libros_leidos" ? "l:" : ""); }} />
        </div>
        {METRICAS_CON_REF.includes(metric) && (
          <div style={{ flex: "1 1 170px", minWidth: 150 }}>
            <SelectorDeRef compacto metric={metric} refVal={ref} onRef={setRef} cx={cx} />
          </div>
        )}
        {metric && metric !== "ahorro_meta" && !(metric === "libros_leidos" && ref.startsWith("l:")) && (
          <>
            <input className="input-inline" type="number" min={1} max={10000} value={target} placeholder="3"
              aria-label={metric === "libros_leidos" ? "Libros en total" : "Ritmo por semana"} style={{ maxWidth: 80, flex: "none" }}
              onChange={(e) => setTarget(e.target.value)} />
            <span style={{ fontSize: 12.5, color: "var(--muted)" }}>{metric === "libros_leidos" ? "libros en total" : "por semana"}</span>
          </>
        )}
        <button className="btn ghost" type="button" onClick={() => void guardar()}>Guardar</button>
        {saved && <span className="chip">✓ Conectada</span>}
      </div>
      {metric === "libros_leidos" && ref.startsWith("l:") && (
        <ChecklistLibros refVal={ref} onRef={setRef} libros={cx.libros} />
      )}
      {metric && (() => {
        const m = METRICAS_AUTO.find((x) => x.key === metric);
        return m ? (
          <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 6 }}>
            💡 Se alimenta de {m.fuente}.
          </p>
        ) : null;
      })()}
      {metric && target && Number(target) > 0 && (() => {
        const m = METRICAS_AUTO.find((x) => x.key === metric);
        const esperado = metaAutoEsperado({ ...o, auto_metric: metric, auto_target: Number(target) });
        if (!m || !esperado) return null;
        if (metric === "libros_leidos") {
          return (
            <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 6, lineHeight: 1.5 }}>
              Son {esperado} {esperado === 1 ? "libro" : "libros"} en total: cada libro que termines avanza ≈{Math.max(0.1, Math.round((100 / esperado) * 10) / 10)}%. Una página a la vez.
            </p>
          );
        }
        return (
          <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 6, lineHeight: 1.5 }}>
            Con tu plazo{o.deadline ? ` hasta el ${o.deadline}` : ` (${PLAZO_DEFECTO_DIAS} días por defecto, edita la meta y ponle fecha límite para afinarlo)`},
            son ≈{esperado} {m.unidad} en total: cada {m.singular} avanza ≈{Math.max(0.1, Math.round((100 / esperado) * 10) / 10)}%. Un día a la vez.
          </p>
        );
      })()}
      {err && <p style={{ fontSize: 12, color: "var(--err)", marginTop: 6 }}>{err}</p>}
    </div>
  );
}

/** Editar lo esencial de una meta: título, área y fecha límite. */
function EditObjectiveModal({ o, onClose, onSaved }: { o: Objective; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(o.title);
  const [area, setArea] = useState(o.area ?? "");
  const [deadline, setDeadline] = useState(o.deadline ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await updateObjective(o.id, { title, area: area || null, deadline: deadline || null });
      onSaved();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
      setBusy(false);
    }
  }

  return (
    <ModalShell title="Editar meta" onClose={onClose}>
      {err && <p style={{ fontSize: 12.5, color: "var(--err)", marginBottom: 10 }}>{err}</p>}
      <form onSubmit={save}>
        <div className="field"><label>La meta</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} autoFocus /></div>
        <div className="field"><label>Área de la vida</label>
          <Selector value={area} ariaLabel="Área de la vida" onChange={setArea}
            opciones={AREA_OPTIONS.map((a) => ({ value: a.key, label: a.name }))} /></div>
        <div className="field"><label>Fecha límite</label>
          <CampoFecha value={deadline} onChange={setDeadline} ariaLabel="Fecha límite" /></div>
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
          La fecha límite también define el plazo del progreso automático: con ella la meta sabe cuántas semanas tiene.
        </p>
        <button className="btn primary" disabled={busy} style={{ width: "100%", marginTop: 4 }}>{busy ? "Guardando…" : "Guardar cambios"}</button>
      </form>
    </ModalShell>
  );
}

function ObjectiveModal({ cx, onClose, onSaved }: { cx: Conexiones; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [area, setArea] = useState("");
  const [deadline, setDeadline] = useState("");
  const [metric, setMetric] = useState("");
  const [target, setTarget] = useState("");
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const falta = faltaEnConexion(metric, ref);
    if (falta) {
      setErr(falta);
      return;
    }
    setBusy(true);
    try {
      await addObjective({
        title,
        area: area || null,
        deadline: deadline || null,
        auto_metric: metric || null,
        // Con libros exactos, el total ES la cantidad de libros elegidos.
        auto_target: metric === "libros_leidos" && ref.startsWith("l:")
          ? Math.max(1, librosElegidos(ref))
          : metric && metric !== "ahorro_meta" && target ? Number(target) : null,
        auto_ref: METRICAS_CON_REF.includes(metric) ? (ref || null) : null,
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
          <Selector value={area} ariaLabel="Área de la vida" onChange={(v) => { setArea(v); setMetric(""); setRef(""); }}
            opciones={AREA_OPTIONS.map((a) => ({ value: a.key, label: a.name }))} /></div>
        <div className="field"><label>Fecha límite (opcional)</label>
          <CampoFecha value={deadline} onChange={setDeadline} ariaLabel="Fecha límite" /></div>
        <div className="frow">
          <div className="field"><label>Se alimenta de (opcional)</label>
            <Selector value={metric} ariaLabel="Métrica que alimenta la meta" placeholder="Nada, progreso manual o por pasos"
              opciones={[{ value: "", label: "Nada, progreso manual o por pasos" }, ...metricasParaArea(area || null).map((m) => ({ value: m.key, label: m.label }))]}
              onChange={(v) => { setMetric(v); setRef(v === "libros_leidos" ? "l:" : ""); }} /></div>
          {metric && metric !== "ahorro_meta" && !(metric === "libros_leidos" && ref.startsWith("l:")) && (
            <div className="field" style={{ maxWidth: 120 }}><label>{metric === "libros_leidos" ? "Libros en total" : "Por semana"}</label>
              <input type="number" min={1} required value={target} onChange={(e) => setTarget(e.target.value)} placeholder="3" /></div>
          )}
        </div>
        {METRICAS_CON_REF.includes(metric) && (
          <div className="field">
            <label>Conectada a</label>
            <SelectorDeRef metric={metric} refVal={ref} onRef={setRef} cx={cx} />
            {metric === "libros_leidos" && ref.startsWith("l:") && (
              <ChecklistLibros refVal={ref} onRef={setRef} libros={cx.libros} />
            )}
          </div>
        )}
        {metric && (
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
            💡 Se alimenta de {METRICAS_AUTO.find((m) => m.key === metric)?.fuente}.
            {metric !== "ahorro_meta" && metric !== "libros_leidos" && " Con la fecha límite, la meta calcula el total del plazo y cada registro real avanza su porcentaje, un día a la vez."}
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
            <Selector value={area} ariaLabel="Área del avance" onChange={setArea}
              opciones={AREAS.map((a) => ({ value: a.key, label: a.name }))} /></div>
          <div className="field"><label>Fecha</label>
            <CampoFecha value={date} onChange={setDate} ariaLabel="Fecha del avance" conBorrar={false} /></div>
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
