import { VisionBoard } from "./VisionBoard";
import { hoyLocal } from "../lib/fechas";
import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Plus, Target, Trash2 } from "lucide-react";
import { AREAS } from "../areas";
import { TablesMissingError } from "../finanzas/data";
import {
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

export function ObjetivosPage() {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<"objective" | "avance" | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [o, a] = await Promise.all([listObjectives(), listActivity(15)]);
      setObjectives(o);
      setActivity(a);
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

  const enCamino = objectives.filter((o) => o.status === "en_camino").length;
  const enRiesgo = objectives.filter((o) => o.status === "en_riesgo").length;
  const logradas = objectives.filter((o) => o.status === "lograda").length;
  const promedio = objectives.length
    ? Math.round(objectives.reduce((s, o) => s + objectiveProgress(o), 0) / objectives.length)
    : 0;

  if (needsMigration) {
    return (
      <div className="page">
        <Head />
        <div className="card pad" style={{ maxWidth: 640 }}>
          <h3 style={{ marginBottom: 10 }}>Un paso pendiente en Supabase</h3>
          <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 12 }}>
            Faltan las tablas de Objetivos. Es una sola vez: abre el SQL Editor de Supabase, pega el contenido de
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

      <div className="ftabs">
        <span style={{ flex: 1 }} />
        <button className="btn ghost" onClick={() => setModal("avance")}>Registrar avance</button>
        <button className="btn primary" onClick={() => setModal("objective")}>
          <Plus size={15} style={{ verticalAlign: "-2px", marginRight: 5 }} />
          Nueva meta
        </button>
      </div>

      {error && <div className="card pad" style={{ borderLeft: "3px solid var(--err)", marginBottom: 14 }}>{error}</div>}
      {loading ? (
        <p style={{ color: "var(--muted)" }}>Cargando…</p>
      ) : (
        <>
          <VisionBoard />

          <div className="statrow" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
            <div className="card stat"><div className="k">Progreso promedio</div><div className="v tnum">{promedio}%</div></div>
            <div className="card stat"><div className="k">En camino</div><div className="v tnum">{enCamino}</div></div>
            <div className="card stat"><div className="k">En riesgo</div><div className="v tnum" style={enRiesgo > 0 ? { color: "var(--warn)" } : undefined}>{enRiesgo}</div></div>
            <div className="card stat"><div className="k">Logradas</div><div className="v tnum" style={{ color: "var(--ok)" }}>{logradas}</div></div>
          </div>

          <div className="panelgrid" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
            <div style={{ display: "grid", gap: 12 }}>
              {objectives.length === 0 && (
                <div className="card pad">
                  <p style={{ color: "var(--muted)", fontSize: 14 }}>
                    Aún no tienes metas. Crea la primera: puede ser de cualquier área de tu vida, o general.
                  </p>
                </div>
              )}
              {objectives.map((o) => (
                <ObjectiveCard key={o.id} o={o} onChanged={() => void reload()} />
              ))}
            </div>

            <div className="card panel" style={{ alignSelf: "start" }}>
              <h3>Avances recientes</h3>
              {activity.length === 0 && (
                <p style={{ color: "var(--muted)", fontSize: 13.5 }}>
                  Cada vez que avances en algo, regístralo aquí. Es tu historia de progreso.
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
          </div>
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
        <Target size={13} /> Área
      </div>
      <h1>Objetivos</h1>
      <p>Tu visión de vida, hecha metas concretas con pasos y avances.</p>
    </div>
  );
}

function ObjectiveCard({ o, onChanged }: { o: Objective; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [newMs, setNewMs] = useState("");
  const pct = objectiveProgress(o);
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
          <div style={{ fontSize: 11.5, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: areaColor(o.area), display: "inline-block" }} />
            {areaName(o.area)}{o.deadline ? `, para el ${o.deadline}` : ""}
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
          <span>{hasMs ? (o.milestones.length === 1 ? "1 paso" : `${o.milestones.length} pasos`) : "progreso manual"}</span>
          <b className="tnum">{pct}%</b>
        </div>
        <div className="track">
          <div className="fill" style={{ width: `${pct}%`, background: areaColor(o.area) }} />
        </div>
      </div>
      {!hasMs && (
        <input type="range" min={0} max={100} step={5} defaultValue={o.progress} className="slider"
          aria-label="Progreso de la meta"
          onMouseUp={async (e) => { await updateObjective(o.id, { progress: Number((e.target as HTMLInputElement).value) }); onChanged(); }}
          onTouchEnd={async (e) => { await updateObjective(o.id, { progress: Number((e.target as HTMLInputElement).value) }); onChanged(); }} />
      )}

      {open && (
        <div style={{ marginTop: 12, borderTop: "1px solid var(--line-soft)", paddingTop: 10 }}>
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
            <input className="input-inline" value={newMs} onChange={(e) => setNewMs(e.target.value)} placeholder="Nuevo paso, por ejemplo: definir el plan" />
            <button className="btn ghost" type="submit">Agregar</button>
          </form>
        </div>
      )}
    </div>
  );
}

function ObjectiveModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [area, setArea] = useState("");
  const [deadline, setDeadline] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await addObjective({ title, area: area || null, deadline: deadline || null });
    onSaved();
  }

  return (
    <ModalShell title="Nueva meta" onClose={onClose}>
      <form onSubmit={save}>
        <div className="field"><label>¿Qué quieres lograr?</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sistema de Vida completo" autoFocus /></div>
        <div className="field"><label>Área de la vida</label>
          <select value={area} onChange={(e) => setArea(e.target.value)}>
            {AREA_OPTIONS.map((a) => <option key={a.key} value={a.key}>{a.name}</option>)}
          </select></div>
        <div className="field"><label>Fecha límite (opcional)</label>
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></div>
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
            placeholder="Por ejemplo: terminé el módulo de Finanzas y quedó funcionando."
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
