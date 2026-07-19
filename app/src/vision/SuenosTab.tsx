import { useCallback, useEffect, useState } from "react";
import { useIdioma } from "../idioma/IdiomaProvider";
import { CampoFecha } from "../components/CampoFecha";
import { Link } from "react-router-dom";
import { Pencil, Plus, Rocket, Trash2 } from "lucide-react";
import { AREAS } from "../areas";
import { Selector } from "../components/Selector";
import { TablesMissingError } from "../finanzas/data";
import { addObjective, listObjectives, objectiveProgress, type Objective } from "../objetivos/data";
import {
  CATEGORIAS_SUENO,
  STATUS_SUENO,
  addDream,
  deleteDream,
  emojiCategoria,
  listDreams,
  updateDream,
  type Dream,
  type DreamStatus,
} from "./suenos";

// Sueños: la bucket list de la vida. Todo lo que es "algún día quiero esto".
// Cuando un sueño madura, se convierte en meta y pasa a Dirección.

type Filtro = "todos" | DreamStatus;

export function SuenosTab() {
  const { t: tr } = useIdioma();
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [objetivos, setObjetivos] = useState<Objective[]>([]);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ tipo: "nuevo" } | { tipo: "editar"; dream: Dream } | { tipo: "convertir"; dream: Dream } | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDreams(await listDreams());
      setNeedsMigration(false);
    } catch (e) {
      if (e instanceof TablesMissingError) setNeedsMigration(true);
      else setError(e instanceof Error ? e.message : String(e));
    }
    try {
      setObjetivos(await listObjectives());
    } catch {
      /* sin metas aún, no bloquea los sueños */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (needsMigration) {
    return (
      <div className="card pad" style={{ maxWidth: 640 }}>
        <h3 style={{ marginBottom: 10 }}>Un paso pendiente en Supabase</h3>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 12 }}>
          Falta la tabla de sueños. Es una sola vez: abre el SQL Editor de Supabase, pega el contenido de
          <code> supabase/migrations/0019_suenos_vida_ideal.sql</code> y presiona Run.
        </p>
        <button className="btn primary" onClick={() => void reload()}>Ya lo hice, reintentar</button>
      </div>
    );
  }

  const porSueno = new Map(objetivos.filter((o) => o.dream_id).map((o) => [o.dream_id as string, o]));
  const visibles = dreams.filter((d) => filtro === "todos" || d.status === filtro);

  return (
    <>
      <div className="ftabs">
        {(["todos", "idea", "importante", "meta"] as Filtro[]).map((f) => (
          <button key={f} className={"ftab" + (filtro === f ? " active" : "")} onClick={() => setFiltro(f)}>
            {f === "todos" ? tr("Todos") : tr(STATUS_SUENO[f])}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        <button className="btn primary" onClick={() => setModal({ tipo: "nuevo" })}>
          <Plus size={15} style={{ verticalAlign: "-2px", marginRight: 5 }} /> {tr("Nuevo sueño")}
        </button>
      </div>

      {error && <div className="card pad" style={{ borderLeft: "3px solid var(--err)", marginBottom: 14 }}>{error}</div>}
      {loading ? (
        <p style={{ color: "var(--muted)" }}>Cargando…</p>
      ) : visibles.length === 0 ? (
        <div className="card pad" style={{ maxWidth: 640 }}>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            {dreams.length === 0
              ? "Tu bucket list está esperando. Anota lo que quieres vivir: viajar a Japón, aprender piano, vivir cerca del mar. Sin compromiso, solo deseo."
              : "Nada en este filtro por ahora."}
          </p>
        </div>
      ) : (
        <div className="dream-grid">
          {visibles.map((d) => {
            const meta = porSueno.get(d.id);
            return (
              <div className="card dream-card" key={d.id}>
                <div className="dc-top">
                  <span className="dc-emoji">{emojiCategoria(d.category)}</span>
                  <span className="dc-hearts" title={`Prioridad emocional ${d.priority} de 3`}>
                    {"♥".repeat(d.priority)}<span className="off">{"♥".repeat(3 - d.priority)}</span>
                  </span>
                </div>
                <b className="dc-title">{d.title}</b>
                {d.why && <p className="dc-why">“{d.why}”</p>}
                {d.notes && <p className="dc-notes">{d.notes}</p>}
                <div className="dc-foot">
                  {meta ? (
                    <Link to="/objetivos" className="chip" style={{ background: "color-mix(in srgb,var(--ok) 16%,var(--paper))", color: "var(--ok)" }}>
                      🚀 {tr("En ejecución")}, {objectiveProgress(meta)}%
                    </Link>
                  ) : d.status === "meta" ? (
                    <span className="chip">🚀 {tr(STATUS_SUENO[d.status])}</span>
                  ) : (
                    <span className="chip" style={d.status === "importante" ? { background: "color-mix(in srgb,var(--acc) 26%,var(--paper))", color: "var(--ink-soft)" } : undefined}>
                      {tr(STATUS_SUENO[d.status])}
                    </span>
                  )}
                  <span style={{ flex: 1 }} />
                  {!meta && d.status !== "meta" && (
                    <button className="xdel" title="Convertir en meta" aria-label="Convertir en meta" onClick={() => setModal({ tipo: "convertir", dream: d })}>
                      <Rocket size={14} />
                    </button>
                  )}
                  <button className="xdel" title="Editar" aria-label="Editar sueño" onClick={() => setModal({ tipo: "editar", dream: d })}>
                    <Pencil size={13} />
                  </button>
                  <button className="xdel" title="Eliminar" aria-label="Eliminar sueño"
                    onClick={async () => { if (!window.confirm(`¿Soltar el sueño ${d.title}?`)) return; await deleteDream(d.id); void reload(); }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(modal?.tipo === "nuevo" || modal?.tipo === "editar") && (
        <DreamModal
          dream={modal.tipo === "editar" ? modal.dream : null}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); void reload(); }}
        />
      )}
      {modal?.tipo === "convertir" && (
        <ConvertirModal dream={modal.dream} onClose={() => setModal(null)} onSaved={() => { setModal(null); void reload(); }} />
      )}
    </>
  );
}

function DreamModal({ dream, onClose, onSaved }: { dream: Dream | null; onClose: () => void; onSaved: () => void }) {
  const { t: tr } = useIdioma();
  const [title, setTitle] = useState(dream?.title ?? "");
  const [category, setCategory] = useState(dream?.category ?? "viajes");
  const [why, setWhy] = useState(dream?.why ?? "");
  const [priority, setPriority] = useState(dream?.priority ?? 2);
  const [status, setStatus] = useState<DreamStatus>(dream?.status ?? "idea");
  const [notes, setNotes] = useState(dream?.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const datos = { title, category, why: why || null, priority, status, notes: notes || null };
    try {
      if (dream) await updateDream(dream.id, datos);
      else await addDream(datos);
      onSaved();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
      setBusy(false);
    }
  }

  return (
    <div className="tp-overlay" onClick={onClose}>
      <div className="tp" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <h3 style={{ marginBottom: 4 }}>{dream ? tr("Editar sueño") : tr("Nuevo sueño")}</h3>
        <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 14 }}>
          Sin presión: esto es deseo, no compromiso. Convertirlo en meta es otro paso.
        </p>
        {err && <p style={{ fontSize: 12.5, color: "var(--err)", marginBottom: 10 }}>{err}</p>}
        <form onSubmit={save}>
          <div className="field"><label>{tr("¿Qué quieres vivir?")}</label>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Viajar a Japón, escribir un libro…" autoFocus /></div>
          <div className="frow">
            <div className="field"><label>{tr("Categoría")}</label>
              <Selector value={category} ariaLabel="Categoría del sueño" onChange={setCategory}
                opciones={CATEGORIAS_SUENO.map((c) => ({ value: c.key, label: `${c.emoji} ${tr(c.label)}` }))} /></div>
            <div className="field"><label>{tr("Estado")}</label>
              <Selector value={status} ariaLabel="Estado del sueño"
                opciones={[{ value: "idea", label: tr("Idea") }, { value: "importante", label: tr("Importante") }]}
                onChange={(v) => setStatus(v as DreamStatus)} /></div>
          </div>
          <div className="field"><label>{tr("¿Por qué lo quieres?")}</label>
            <input value={why} onChange={(e) => setWhy(e.target.value)} placeholder="Lo que ese sueño te haría sentir" /></div>
          <div className="field"><label>{tr("Prioridad emocional")}</label>
            <div style={{ display: "flex", gap: 6 }}>
              {[1, 2, 3].map((p) => (
                <button key={p} type="button" className={"moodbtn" + (priority === p ? " active" : "")}
                  title={p === 1 ? "Me gustaría" : p === 2 ? "Lo quiero de verdad" : "Es parte de quién soy"}
                  onClick={() => setPriority(p)}>
                  {"♥".repeat(p)}
                </button>
              ))}
            </div>
          </div>
          <div className="field"><label>{tr("Notas (opcional)")}</label>
            <textarea className="vision-edit" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ideas, links, detalles…" /></div>
          <button className="btn primary" disabled={busy} style={{ width: "100%", marginTop: 4 }}>{busy ? "Guardando…" : "Guardar sueño"}</button>
        </form>
      </div>
    </div>
  );
}

function ConvertirModal({ dream, onClose, onSaved }: { dream: Dream; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(dream.title);
  const [area, setArea] = useState("");
  const [deadline, setDeadline] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await addObjective({ title, area: area || null, deadline: deadline || null, dream_id: dream.id });
      await updateDream(dream.id, { status: "meta" });
      onSaved();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
      setBusy(false);
    }
  }

  return (
    <div className="tp-overlay" onClick={onClose}>
      <div className="tp" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <h3 style={{ marginBottom: 4 }}>🚀 De sueño a meta</h3>
        <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 14 }}>
          “{dream.title}” pasa a Dirección como meta activa, con su origen visible. El sueño se queda aquí, marcado en ejecución.
        </p>
        {err && <p style={{ fontSize: 12.5, color: "var(--err)", marginBottom: 10 }}>{err}</p>}
        <form onSubmit={save}>
          <div className="field"><label>La meta, en concreto</label>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ahorrar para viajar a Japón en 2027" autoFocus /></div>
          <div className="field"><label>Área de la vida</label>
            <Selector value={area} ariaLabel="Área de la vida" placeholder="General (toda la vida)" onChange={setArea}
              opciones={[{ value: "", label: "General (toda la vida)" }, ...AREAS.map((a) => ({ value: a.key, label: a.name }))]} /></div>
          <div className="field"><label>Fecha objetivo (opcional)</label>
            <CampoFecha value={deadline} onChange={setDeadline} ariaLabel="Fecha objetivo" /></div>
          <button className="btn primary" disabled={busy} style={{ width: "100%", marginTop: 4 }}>{busy ? "Creando…" : "Crear la meta en Dirección"}</button>
        </form>
      </div>
    </div>
  );
}
