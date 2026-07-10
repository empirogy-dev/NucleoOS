import { AvancesArea } from "../components/AvancesArea";
import { fmtFechaLocal, hoyLocal } from "../lib/fechas";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Briefcase, Plus, Trash2 } from "lucide-react";
import { TablesMissingError } from "../finanzas/data";
import {
  MOODS,
  STATUS_LABELS,
  addProject,
  addWorkLog,
  deleteProject,
  deleteWorkLog,
  hoursByProject,
  listProjects,
  listWorkLogs,
  updateProject,
  type Project,
  type ProjectStatus,
  type WorkLog,
} from "./data";

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
                const tone = STATUS_TONES[p.status];
                return (
                  <div className="card pad" key={p.id}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <b style={{ fontSize: 14.5 }}>{p.name}</b>
                        <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
                          {horas > 0 ? `${Math.round(horas * 10) / 10} horas dedicadas` : "sin horas registradas"}
                          {p.description ? `, ${p.description}` : ""}
                        </div>
                      </div>
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
                    <div className="bar" style={{ margin: "12px 0 0" }}>
                      <div className="top"><span>avance</span><b className="tnum">{p.progress}%</b></div>
                      <div className="track"><div className="fill" style={{ width: `${p.progress}%`, background: "var(--tra)" }} /></div>
                    </div>
                    <input type="range" min={0} max={100} step={5} defaultValue={p.progress} className="slider"
                      aria-label="Avance del proyecto"
                      onMouseUp={async (e) => { await updateProject(p.id, { progress: Number((e.target as HTMLInputElement).value) }); void reload(); }}
                      onTouchEnd={async (e) => { await updateProject(p.id, { progress: Number((e.target as HTMLInputElement).value) }); void reload(); }} />
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

      <AvancesArea area="trabajo" />

      {modal === "project" && <ProjectModal onClose={() => setModal(null)} onSaved={() => { setModal(null); void reload(); }} />}
      {modal === "worklog" && <WorkLogModal projects={projects} onClose={() => setModal(null)} onSaved={() => { setModal(null); void reload(); }} />}
    </div>
  );
}

function Head() {
  return (
    <div className="page-head">
      <div className="eyebrow"><Briefcase size={13} /> Área</div>
      <h1>Trabajo y Proyectos</h1>
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
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              {projects.length === 0 && <option value="">Primero crea un proyecto</option>}
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select></div>
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
