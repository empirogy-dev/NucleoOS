import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, Plus, Search, Trash2 } from "lucide-react";
import { TablesMissingError } from "../finanzas/data";
import {
  addEntry,
  addNotebook,
  deleteEntry,
  deleteNotebook,
  listEntries,
  listNotebooks,
  saveEntry,
  type Entry,
  type Notebook,
} from "./data";

export function AprendizajePage() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedNb, setSelectedNb] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nbModal, setNbModal] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nb, en] = await Promise.all([listNotebooks(), listEntries()]);
      setNotebooks(nb);
      setEntries(en);
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

  const visibles = useMemo(() => {
    let list = entries;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((e) => e.title.toLowerCase().includes(q) || e.content.toLowerCase().includes(q));
    } else if (selectedNb) {
      list = list.filter((e) => e.notebook_id === selectedNb);
    }
    return list;
  }, [entries, query, selectedNb]);

  const entry = entries.find((e) => e.id === selectedEntry) ?? null;

  async function nuevaNota() {
    const nbId = selectedNb ?? notebooks[0]?.id;
    if (!nbId) {
      setNbModal(true);
      return;
    }
    const id = await addEntry(nbId, "Nueva nota");
    await reload();
    setSelectedEntry(id);
  }

  if (needsMigration) {
    return (
      <div className="page">
        <Head />
        <div className="card pad" style={{ maxWidth: 640 }}>
          <h3 style={{ marginBottom: 10 }}>Un paso pendiente en Supabase</h3>
          <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 12 }}>
            Faltan las tablas de Aprendizaje. Es una sola vez: abre el SQL Editor de Supabase, pega el contenido de
            <code> supabase/migrations/0008_aprendizaje.sql</code> y presiona Run.
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
        <div className="searchbox">
          <Search size={14} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar en todas tus notas…" aria-label="Buscar notas" />
        </div>
        <span style={{ flex: 1 }} />
        <button className="btn ghost" onClick={() => setNbModal(true)}>Nuevo cuaderno</button>
        <button className="btn primary" onClick={() => void nuevaNota()}>
          <Plus size={15} style={{ verticalAlign: "-2px", marginRight: 5 }} />
          Nueva nota
        </button>
      </div>

      {error && <div className="card pad" style={{ borderLeft: "3px solid var(--err)", marginBottom: 14 }}>{error}</div>}
      {loading ? (
        <p style={{ color: "var(--muted)" }}>Cargando…</p>
      ) : (
        <div className="apr-grid">
          {/* Cuadernos */}
          <div className="card panel" style={{ alignSelf: "start" }}>
            <h3>Cuadernos</h3>
            <button className={"nb-row" + (selectedNb === null ? " active" : "")} onClick={() => { setSelectedNb(null); setQuery(""); }}>
              <span>📚 Todas las notas</span>
              <small>{entries.length}</small>
            </button>
            {notebooks.map((nb) => {
              const n = entries.filter((e) => e.notebook_id === nb.id).length;
              return (
                <div key={nb.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <button className={"nb-row" + (selectedNb === nb.id ? " active" : "")} style={{ flex: 1 }}
                    onClick={() => { setSelectedNb(nb.id); setQuery(""); }}>
                    <span>{nb.icon ?? "📓"} {nb.name}</span>
                    <small>{n}</small>
                  </button>
                  <button className="xdel" aria-label="Eliminar cuaderno"
                    onClick={async () => { await deleteNotebook(nb.id); if (selectedNb === nb.id) setSelectedNb(null); void reload(); }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
            {notebooks.length === 0 && (
              <p style={{ color: "var(--muted)", fontSize: 13 }}>Crea tu primer cuaderno: inglés, programación, recetas, lo que estés aprendiendo.</p>
            )}
          </div>

          {/* Lista de notas */}
          <div className="card panel" style={{ alignSelf: "start" }}>
            <h3>{query ? `Resultados para "${query}"` : "Notas"}</h3>
            {visibles.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13.5 }}>{query ? "Nada por aquí." : "Sin notas todavía."}</p>}
            {visibles.map((e) => (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button className={"nb-row" + (selectedEntry === e.id ? " active" : "")} style={{ flex: 1 }}
                  onClick={() => setSelectedEntry(e.id)}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title || "Sin título"}</span>
                  <small>{e.updated_at.slice(0, 10)}</small>
                </button>
                <button className="xdel" aria-label="Eliminar nota"
                  onClick={async () => { await deleteEntry(e.id); if (selectedEntry === e.id) setSelectedEntry(null); void reload(); }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          {/* Editor */}
          <div className="card panel" style={{ alignSelf: "start" }}>
            {entry ? (
              <EntryEditor key={entry.id} entry={entry} onSaved={() => void reload()} />
            ) : (
              <p style={{ color: "var(--muted)", fontSize: 13.5, padding: "20px 0", textAlign: "center" }}>
                Elige una nota de la lista, o crea una nueva. ✍️
              </p>
            )}
          </div>
        </div>
      )}

      {nbModal && <NotebookModal onClose={() => setNbModal(false)} onSaved={() => { setNbModal(false); void reload(); }} />}
    </div>
  );
}

function Head() {
  return (
    <div className="page-head">
      <div className="eyebrow"><BookOpen size={13} /> Área</div>
      <h1>Aprendizaje</h1>
      <p>Tus cuadernos y notas. Lo que aprendes, guardado y buscable.</p>
    </div>
  );
}

function EntryEditor({ entry, onSaved }: { entry: Entry; onSaved: () => void }) {
  const [title, setTitle] = useState(entry.title);
  const [content, setContent] = useState(entry.content);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    await saveEntry(entry.id, { title, content });
    setBusy(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onSaved();
  }

  return (
    <div>
      <input className="entry-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título de la nota" aria-label="Título" />
      <textarea className="entry-body" rows={14} value={content} onChange={(e) => setContent(e.target.value)}
        placeholder="Escribe aquí lo que aprendiste…" aria-label="Contenido" />
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10 }}>
        <button className="btn primary" disabled={busy} onClick={() => void save()}>{busy ? "Guardando…" : "Guardar"}</button>
        {saved && <span className="chip">✓ Guardada</span>}
        <span style={{ marginLeft: "auto", fontSize: 11.5, color: "var(--muted)" }}>última edición {entry.updated_at.slice(0, 10)}</span>
      </div>
    </div>
  );
}

function NotebookModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📓");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await addNotebook(name, icon);
    onSaved();
  }

  return (
    <div className="tp-overlay" onClick={onClose}>
      <div className="tp" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <h3 style={{ marginBottom: 14 }}>Nuevo cuaderno</h3>
        <form onSubmit={save}>
          <div className="frow">
            <div className="field" style={{ flex: 1 }}><label>Nombre</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Inglés, programación, recetas…" autoFocus /></div>
            <div className="field" style={{ width: 84 }}><label>Ícono</label>
              <input value={icon} onChange={(e) => setIcon(e.target.value)} /></div>
          </div>
          <button className="btn primary" disabled={busy} style={{ width: "100%", marginTop: 4 }}>{busy ? "Guardando…" : "Crear cuaderno"}</button>
        </form>
      </div>
    </div>
  );
}
