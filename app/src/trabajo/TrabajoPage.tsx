import { fmtFechaLocal, hoyLocal } from "../lib/fechas";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Briefcase, Plus, Trash2 } from "lucide-react";
import { TablesMissingError } from "../finanzas/data";
import {
  MOODS,
  STATUS_LABELS,
  addProject,
  addProjectTask,
  addWorkLog,
  deleteProject,
  deleteProjectTask,
  deleteWorkLog,
  hoursByProject,
  listProjects,
  listProjectTasks,
  listWorkLogs,
  sincronizarProgreso,
  toggleProjectTask,
  updateProject,
  type Project,
  type ProjectStatus,
  type ProjectTask,
  type WorkLog,
} from "./data";
import { abrirPomodoro, listFocusBlocks, type FocusBlock } from "../foco/data";
import { MetasDeArea } from "../components/MetasDeArea";
import { Selector } from "../components/Selector";

const STATUS_TONES: Record<ProjectStatus, { bg: string; fg: string }> = {
  idea: { bg: "color-mix(in srgb,var(--muted) 18%,var(--paper))", fg: "var(--muted)" },
  activo: { bg: "var(--accent-wash)", fg: "var(--accent-ink)" },
  pausado: { bg: "color-mix(in srgb,var(--warn) 18%,var(--paper))", fg: "var(--warn)" },
  terminado: { bg: "color-mix(in srgb,var(--ok) 18%,var(--paper))", fg: "var(--ok)" },
};

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return fmtFechaLocal(d);
}

function moodEmoji(v: number | null): string {
  return MOODS.find((m) => m.value === v)?.emoji ?? "";
}

export function TrabajoPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<"project" | "worklog" | null>(null);
  const [focos, setFocos] = useState<FocusBlock[]>([]);
  const [ptasks, setPtasks] = useState<ProjectTask[]>([]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, l] = await Promise.all([listProjects(), listWorkLogs()]);
      setProjects(p);
      setLogs(l);
      setNeedsMigration(false);
    } catch (e) {
      if (e instanceof TablesMissingError) setNeedsMigration(true);
      else setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
    try {
      setFocos(await listFocusBlocks(7));
    } catch { /* sin la 0035, los bloques no se muestran y ya */ }
    try {
      setPtasks(await listProjectTasks());
    } catch { /* sin la 0038, el checklist no aparece y ya */ }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const horasPorProyecto = useMemo(() => hoursByProject(logs), [logs]);
  const semana = isoDaysAgo(6);
  const horasSemana = logs.filter((l) => l.date >= semana && l.hours).reduce((s, l) => s + Number(l.hours), 0);
  const activos = projects.filter((p) => p.status === "activo").length;
  const moods = logs.filter((l) => l.kind === "empleo" && l.mood != null && l.date >= isoDaysAgo(13)).map((l) => l.mood as number);
  const animo = moods.length ? Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10 : null;

  if (needsMigration) {
    return (
      <div className="page">
        <Head />
        <div className="card pad" style={{ maxWidth: 640 }}>
          <h3 style={{ marginBottom: 10 }}>Un paso pendiente en Supabase</h3>
          <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 12 }}>
            Faltan las tablas de Trabajo. Es una sola vez: abre el SQL Editor de Supabase, pega el contenido de
            <code> supabase/migrations/0006_trabajo.sql</code> y presiona Run.
          </p>
          <button className="btn primary" onClick={() => void reload()}>Ya lo hice, reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <Head />

      <div className="ftabs">
        <span style={{ flex: 1 }} />
        <button className="btn ghost" onClick={() => setModal("worklog")}>Registrar jornada</button>
        <button className="btn primary" onClick={() => setModal("project")}>
          <Plus size={15} style={{ verticalAlign: "-2px", marginRight: 5 }} />
          Nuevo proyecto
        </button>
      </div>

      {error && <div className="card pad" style={{ borderLeft: "3px solid var(--err)", marginBottom: 14 }}>{error}</div>}
      {loading ? (
        <p style={{ color: "var(--muted)" }}>Cargando…</p>
      ) : (
        <>
          <div className="statrow" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
            <div className="card stat"><div className="k">Proyectos activos</div><div className="v tnum">{activos}</div></div>
            <div className="card stat"><div className="k">Horas (7 días)</div><div className="v tnum">{Math.round(horasSemana * 10) / 10} h</div></div>
            <div className="card stat"><div className="k">Registros</div><div className="v tnum">{logs.length}</div></div>
            <div className="card stat"><div className="k">Ánimo laboral (14 días)</div><div className="v">{animo !== null ? `${moodEmoji(Math.round(animo))} ${animo}` : "sin datos"}</div></div>
          </div>

          <MetasDeArea area="trabajo" />

          <div className="panelgrid" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
            {/* Proyectos */}
            <div style={{ display: "grid", gap: 12, alignSelf: "start" }}>
              {projects.length === 0 && (
                <div className="card pad">
                  <p style={{ color: "var(--muted)", fontSize: 14 }}>
                    Sin proyectos todavía. Crea el primero: esa idea que quieres desarrollar merece un lugar.
                  </p>
                </div>
              )}
              {projects.map((p) => {
                const horas = horasPorProyecto.get(p.id) ?? 0;
                const bloques = focos.filter((f) => f.project_id === p.id);
                const minFoco = bloques.reduce((s, f) => s + f.minutes, 0);
                const tone = STATUS_TONES[p.status];
                return (
                  <div className="card pad" key={p.id}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <b style={{ fontSize: 14.5 }}>{p.name}</b>
                        <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
                          {horas > 0 ? `${Math.round(horas * 10) / 10} horas dedicadas` : "sin horas registradas"}
                          {bloques.length > 0 ? `, 🎯 ${bloques.length} ${bloques.length === 1 ? "bloque" : "bloques"} de foco (${minFoco} min) esta semana` : ""}
                          {p.description ? `, ${p.description}` : ""}
                        </div>
                      </div>
                      {p.status === "activo" && (
                        <button className="chip" style={{ border: "none", cursor: "pointer" }}
                          title="Arrancar un bloque de foco para este proyecto"
                          onClick={() => abrirPomodoro({ projectId: p.id, projectName: p.name })}>
                          🎯 Foco
                        </button>
                      )}
                      <button className="chip" style={{ background: tone.bg, color: tone.fg, border: "none", cursor: "pointer" }}
                        title="Cambiar estado"
                        onClick={async () => {
                          const order: ProjectStatus[] = ["idea", "activo", "pausado", "terminado"];
                          const next = order[(order.indexOf(p.status) + 1) % order.length];
                          await updateProject(p.id, { status: next });
                          void reload();
                        }}>
                        {STATUS_LABELS[p.status]}
                      </button>
                      <button className="xdel" aria-label="Eliminar proyecto" onClick={async () => { await deleteProject(p.id); void reload(); }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {ptasks.some((t) => t.project_id === p.id) || p.progress > 0 ? (
                      <div className="bar" style={{ margin: "12px 0 0" }}>
                        <div className="top">
                          <span>{ptasks.some((t) => t.project_id === p.id) ? "avance por checklist" : "avance"}</span>
                          <b className="tnum">{p.progress}%</b>
                        </div>
                        <div className="track"><div className="fill" style={{ width: `${p.progress}%`, background: "var(--tra)" }} /></div>
                      </div>
                    ) : (
                      <p style={{ fontSize: 12, color: "var(--muted)", margin: "10px 0 0" }}>
                        El porcentaje de un proyecto se mide con su checklist de pasos (créalo abajo). Tus horas y bloques de foco ya quedan contados arriba, y empujan la meta conectada en Dirección.
                      </p>
                    )}
                    {!ptasks.some((t) => t.project_id === p.id) && p.progress > 0 && (
                      <input type="range" min={0} max={100} step={5} defaultValue={p.progress} className="slider"
                        aria-label="Avance del proyecto"
                        onMouseUp={async (e) => { await updateProject(p.id, { progress: Number((e.target as HTMLInputElement).value) }); void reload(); }}
                        onTouchEnd={async (e) => { await updateProject(p.id, { progress: Number((e.target as HTMLInputElement).value) }); void reload(); }} />
                    )}
                    <ChecklistProyecto projectId={p.id} tasks={ptasks} onChanged={() => void reload()} />
                  </div>
                );
              })}
            </div>

            {/* Bitácora */}
            <div className="card panel" style={{ alignSelf: "start" }}>
              <h3>Bitácora de trabajo</h3>
              {logs.length === 0 && (
                <p style={{ color: "var(--muted)", fontSize: 13.5 }}>
                  Registra tu jornada: qué hiciste, cuántas horas y cómo te sentiste.
                </p>
              )}
              {logs.slice(0, 8).map((l) => {
                const proj = l.project_id ? projects.find((p) => p.id === l.project_id) : undefined;
                return (
                  <div className="txrow" key={l.id} style={{ padding: "8px 0" }}>
                    <span className="txicon">{l.kind === "empleo" ? "🏢" : "🛠️"}</span>
                    <div className="txmeta">
                      <b style={{ fontSize: 13 }}>{l.description || (l.kind === "empleo" ? "Jornada de trabajo" : proj?.name ?? "Proyecto")}</b>
                      <small>
                        {l.date}{proj ? `, ${proj.name}` : l.kind === "empleo" ? ", empleo" : ""}
                        {l.hours ? `, ${l.hours} h` : ""}{l.mood ? `, ${moodEmoji(l.mood)}` : ""}
                      </small>
                    </div>
                    <button className="xdel" aria-label="Eliminar registro" onClick={async () => { await deleteWorkLog(l.id); void reload(); }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}


      {modal === "project" && <ProjectModal onClose={() => setModal(null)} onSaved={() => { setModal(null); void reload(); }} />}
      {modal === "worklog" && <WorkLogModal projects={projects} onClose={() => setModal(null)} onSaved={() => { setModal(null); void reload(); }} />}
    </div>
  );
}

/** El checklist del proyecto: los pasos marcados calculan el avance solos. */
function ChecklistProyecto({ projectId, tasks, onChanged }: { projectId: string; tasks: ProjectTask[]; onChanged: () => void }) {
  const [abierto, setAbierto] = useState(false);
  const [nueva, setNueva] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const del = tasks.filter((t) => t.project_id === projectId);
  const listas = del.filter((t) => t.done).length;

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    if (!nueva.trim()) return;
    setErr(null);
    try {
      await addProjectTask(projectId, nueva.trim());
      setNueva("");
      const todas = await listProjectTasks();
      await sincronizarProgreso(projectId, todas);
      onChanged();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
    }
  }

  async function marcar(t: ProjectTask) {
    try {
      await toggleProjectTask(t.id, !t.done);
      const todas = await listProjectTasks();
      await sincronizarProgreso(projectId, todas);
      onChanged();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
    }
  }

  async function borrar(t: ProjectTask) {
    try {
      await deleteProjectTask(t.id);
      const todas = await listProjectTasks();
      await sincronizarProgreso(projectId, todas);
      onChanged();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
    }
  }

  return (
    <div style={{ marginTop: 10 }}>
      <button className="linklike" onClick={() => setAbierto(!abierto)}>
        {abierto ? "Ocultar checklist" : del.length > 0 ? `Checklist: ${listas} de ${del.length} pasos` : "＋ Agregar checklist de pasos"}
      </button>
      {abierto && (
        <div style={{ marginTop: 8 }}>
          {del.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "5px 0", borderBottom: "1px solid var(--line-soft)" }}>
              <button
                aria-label={t.done ? "Desmarcar paso" : "Marcar paso listo"}
                onClick={() => void marcar(t)}
                style={{
                  width: 18, height: 18, borderRadius: 6, cursor: "pointer", flex: "none",
                  border: `1.5px solid ${t.done ? "var(--tra)" : "var(--line)"}`,
                  background: t.done ? "var(--tra)" : "transparent",
                  color: "#fff", fontSize: 10, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                {t.done ? "✓" : ""}
              </button>
              <span style={{ flex: 1, fontSize: 13, color: t.done ? "var(--muted)" : "var(--ink)", textDecoration: t.done ? "line-through" : "none" }}>
                {t.title}
              </span>
              <button className="xdel" aria-label="Eliminar paso" style={{ width: 22, height: 22 }} onClick={() => void borrar(t)}>
                <Trash2 size={11} />
              </button>
            </div>
          ))}
          <form onSubmit={agregar} style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input className="input-inline" style={{ flex: 1 }} value={nueva} onChange={(e) => setNueva(e.target.value)}
              placeholder="Un paso concreto: armar el pitch, estudiar el capítulo 2…" />
            <button className="btn ghost" type="submit" disabled={!nueva.trim()}>Anotar</button>
          </form>
          <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
            Cada paso marcado recalcula solo el porcentaje del proyecto.
          </p>
          {err && <p style={{ fontSize: 12, color: "var(--err)", marginTop: 6 }}>{err}</p>}
        </div>
      )}
    </div>
  );
}

function Head() {
  return (
    <div className="page-head">
      <div className="eyebrow"><Briefcase size={13} /> Mi vida</div>
      <h1>Trabajo</h1>
      <p>Tus proyectos personales, tu empleo, tus horas y cómo te sientes.</p>
    </div>
  );
}

function ProjectModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await addProject({ name, description: description || null });
    onSaved();
  }

  return (
    <ModalShell title="Nuevo proyecto" onClose={onClose}>
      <form onSubmit={save}>
        <div className="field"><label>Nombre</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="NucleoOS" autoFocus /></div>
        <div className="field"><label>Descripción (opcional)</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mi sistema de vida" /></div>
        <button className="btn primary" disabled={busy} style={{ width: "100%", marginTop: 4 }}>{busy ? "Guardando…" : "Crear proyecto"}</button>
      </form>
    </ModalShell>
  );
}

function WorkLogModal({ projects, onClose, onSaved }: { projects: Project[]; onClose: () => void; onSaved: () => void }) {
  const [kind, setKind] = useState<"empleo" | "proyecto">("empleo");
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [hours, setHours] = useState("");
  const [mood, setMood] = useState<number | null>(null);
  const [date, setDate] = useState(hoyLocal());
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await addWorkLog({
      date,
      kind,
      project_id: kind === "proyecto" ? projectId || null : null,
      description,
      hours: hours ? Number(hours) : null,
      mood: kind === "empleo" ? mood : null,
    });
    onSaved();
  }

  return (
    <ModalShell title="Registrar jornada" onClose={onClose}>
      <div className="seg">
        <button type="button" className={"segbtn" + (kind === "empleo" ? " active" : "")} onClick={() => setKind("empleo")}>Mi empleo</button>
        <button type="button" className={"segbtn" + (kind === "proyecto" ? " active" : "")} onClick={() => setKind("proyecto")}>Un proyecto</button>
      </div>
      <form onSubmit={save}>
        {kind === "proyecto" && (
          <div className="field"><label>Proyecto</label>
            <Selector value={projectId} ariaLabel="Proyecto de la jornada"
              placeholder={projects.length === 0 ? "Primero crea un proyecto" : "Elige el proyecto"}
              opciones={projects.map((p) => ({ value: p.id, label: `💼 ${p.name}` }))}
              onChange={setProjectId} /></div>
        )}
        <div className="field"><label>¿Qué hiciste?</label>
          <textarea className="vision-edit" rows={2} value={description} autoFocus
            placeholder={kind === "empleo" ? "Por ejemplo: turno normal, cerré dos reportes." : "Por ejemplo: avancé en el módulo de finanzas."}
            onChange={(e) => setDescription(e.target.value)} /></div>
        <div className="frow">
          <div className="field"><label>Horas</label>
            <input type="number" min="0" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="8" /></div>
          <div className="field"><label>Fecha</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        </div>
        {kind === "empleo" && (
          <div className="field">
            <label>¿Cómo te sentiste en el trabajo?</label>
            <div className="moods">
              {MOODS.map((m) => (
                <button key={m.value} type="button" title={m.label}
                  className={"moodbtn" + (mood === m.value ? " active" : "")}
                  onClick={() => setMood(mood === m.value ? null : m.value)}>
                  {m.emoji}
                </button>
              ))}
            </div>
          </div>
        )}
        <button className="btn primary" disabled={busy} style={{ width: "100%", marginTop: 4 }}>{busy ? "Guardando…" : "Guardar"}</button>
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
