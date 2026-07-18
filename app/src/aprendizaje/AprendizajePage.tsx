import { IconField } from "../components/IconField";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, FileUp, Plus, Search, Sparkles, Trash2 } from "lucide-react";
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
import {
  deleteFile,
  downloadBlob,
  esResumible,
  listFiles,
  openFile,
  uploadFile,
  type MaterialFile,
} from "./files";
import { blobToBase64, iaConfigured, resumirArchivo, resumirTexto } from "../lib/ia";
import { abrirPomodoro } from "../foco/data";
import { BibliotecaTab } from "./BibliotecaTab";

export function AprendizajePage() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedNb, setSelectedNb] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [vista, setVista] = useState<"notas" | "biblioteca">("notas");
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nbModal, setNbModal] = useState(false);
  const [pendingNote, setPendingNote] = useState(false);
  const [summary, setSummary] = useState<{ title: string; text: string } | null>(null);
  const [summarizing, setSummarizing] = useState<string | null>(null);
  const [iaError, setIaError] = useState<string | null>(null);

  async function resumirNota(e: Entry) {
    setIaError(null);
    setSummarizing(`nota-${e.id}`);
    try {
      const texto = await resumirTexto(`${e.title}\n\n${e.content}`);
      setSummary({ title: `Resumen de ${e.title || "la nota"}`, text: texto });
    } catch (ex) {
      setIaError(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setSummarizing(null);
    }
  }

  async function resumirMaterial(f: MaterialFile) {
    setIaError(null);
    setSummarizing(`file-${f.path}`);
    try {
      const blob = await downloadBlob(f.path);
      let texto: string;
      if (f.mimeType.startsWith("text/")) {
        texto = await resumirTexto(await blob.text());
      } else {
        texto = await resumirArchivo(await blobToBase64(blob), f.mimeType);
      }
      setSummary({ title: `Resumen de ${f.name}`, text: texto });
    } catch (ex) {
      setIaError(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setSummarizing(null);
    }
  }

  async function guardarResumenComoNota() {
    if (!summary) return;
    const nbId = selectedNb ?? notebooks[0]?.id;
    if (!nbId) return;
    const id = await addEntry(nbId, summary.title);
    await saveEntry(id, { content: summary.text });
    setSummary(null);
    await reload();
    setSelectedEntry(id);
  }

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
      // Sin cuadernos todavía: pedimos crear uno y la nota se crea al terminar.
      setPendingNote(true);
      setNbModal(true);
      return;
    }
    const id = await addEntry(nbId, "Nueva nota");
    await reload();
    setSelectedEntry(id);
  }

  async function onNotebookCreated() {
    setNbModal(false);
    const nbs = await listNotebooks();
    const nuevo = nbs[nbs.length - 1];
    if (nuevo) setSelectedNb(nuevo.id);
    if (pendingNote && nuevo) {
      setPendingNote(false);
      const id = await addEntry(nuevo.id, "Nueva nota");
      setSelectedEntry(id);
    }
    await reload();
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
        <button className={"ftab" + (vista === "notas" ? " active" : "")} onClick={() => setVista("notas")}>Mis notas</button>
        <button className={"ftab" + (vista === "biblioteca" ? " active" : "")} onClick={() => setVista("biblioteca")}>Biblioteca</button>
        {vista === "notas" && (
          <>
            <div className="searchbox">
              <Search size={14} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar en todas tus notas…" aria-label="Buscar notas" />
            </div>
            <span style={{ flex: 1 }} />
            <button className="btn ghost" title="Un bloque de foco para estudiar"
              onClick={() => abrirPomodoro({ area: "aprendizaje" })}>
              🎯 Foco de estudio
            </button>
            <button className="btn ghost" onClick={() => setNbModal(true)}>Nuevo cuaderno</button>
            <button className="btn primary" onClick={() => void nuevaNota()}>
              <Plus size={15} style={{ verticalAlign: "-2px", marginRight: 5 }} />
              Nueva nota
            </button>
          </>
        )}
      </div>

      {vista === "biblioteca" ? (
        <BibliotecaTab />
      ) : (
      <>
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
                    onClick={async () => { if (!window.confirm(`¿Eliminar el cuaderno ${nb.name}? Se borran todas sus notas.`)) return; await deleteNotebook(nb.id); if (selectedNb === nb.id) setSelectedNb(null); void reload(); }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
            {notebooks.length === 0 && (
              <p style={{ color: "var(--muted)", fontSize: 13 }}>Crea tu primer cuaderno: inglés, programación, recetas, lo que estés aprendiendo.</p>
            )}

            {selectedNb && (
              <MaterialSection notebookId={selectedNb} summarizing={summarizing} onResumir={resumirMaterial} />
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
                  onClick={async () => { if (!window.confirm(`¿Eliminar la nota ${e.title || "sin título"}?`)) return; await deleteEntry(e.id); if (selectedEntry === e.id) setSelectedEntry(null); void reload(); }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          {/* Editor */}
          <div className="card panel" style={{ alignSelf: "start" }}>
            {iaError && (
              <div className="alert err" style={{ marginBottom: 12 }}>{iaError}</div>
            )}
            {entry ? (
              <EntryEditor key={entry.id} entry={entry} onSaved={() => void reload()}
                onResumir={() => void resumirNota(entry)}
                resumiendo={summarizing === `nota-${entry.id}`} />
            ) : (
              <p style={{ color: "var(--muted)", fontSize: 13.5, padding: "20px 0", textAlign: "center" }}>
                Elige una nota de la lista, o crea una nueva. ✍️
              </p>
            )}
          </div>
        </div>
      )}
      </>
      )}

      {nbModal && <NotebookModal onClose={() => { setNbModal(false); setPendingNote(false); }} onSaved={() => void onNotebookCreated()} />}
      {summary && (
        <div className="tp-overlay" onClick={() => setSummary(null)}>
          <div className="tp" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <h3 style={{ marginBottom: 12 }}>✨ {summary.title}</h3>
            <div className="summary-body">{summary.text}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button className="btn primary" onClick={() => void guardarResumenComoNota()}>Guardar como nota</button>
              <button className="btn ghost" onClick={() => setSummary(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MaterialSection({ notebookId, summarizing, onResumir }: {
  notebookId: string;
  summarizing: string | null;
  onResumir: (f: MaterialFile) => void;
}) {
  const [files, setFiles] = useState<MaterialFile[]>([]);
  const [bucketMissing, setBucketMissing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setErr(null);
    try {
      setFiles(await listFiles(notebookId));
      setBucketMissing(false);
    } catch (e) {
      if (e instanceof Error && e.message === "BUCKET_MISSING") setBucketMissing(true);
      else setErr(e instanceof Error ? e.message : String(e));
    }
  }, [notebookId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      setErr("El archivo pesa más de 15 MB. Por ahora sube archivos más livianos.");
      return;
    }
    setUploading(true);
    setErr(null);
    try {
      await uploadFile(notebookId, file);
      await reload();
    } catch (ex) {
      if (ex instanceof Error && ex.message === "BUCKET_MISSING") setBucketMissing(true);
      else setErr(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ borderTop: "1px solid var(--line-soft)", marginTop: 14, paddingTop: 12 }}>
      <h3 style={{ fontSize: 13.5, marginBottom: 10 }}><FileUp size={13} style={{ verticalAlign: "-2px" }} /> Material del cuaderno</h3>
      {bucketMissing ? (
        <p style={{ fontSize: 12.5, color: "var(--muted)" }}>
          Para subir archivos, corre <code>supabase/migrations/0009_material.sql</code> en el SQL Editor y vuelve a entrar aquí.
        </p>
      ) : (
        <>
          {err && <p style={{ fontSize: 12, color: "var(--err)", marginBottom: 8 }}>{err}</p>}
          {files.map((f) => (
            <div className="txrow" key={f.path} style={{ padding: "6px 0" }}>
              <span className="txicon" style={{ width: 28, height: 28, fontSize: 13 }}>
                {f.mimeType === "application/pdf" ? "📄" : f.mimeType.startsWith("image/") ? "🖼️" : "📝"}
              </span>
              <div className="txmeta">
                <button className="linklike" onClick={() => void openFile(f.path)} title="Abrir">{f.name}</button>
                <small>{f.size ? `${Math.round(f.size / 1024)} KB` : ""}</small>
              </div>
              {esResumible(f.mimeType) && (
                <button className="xdel" style={{ width: "auto", padding: "0 8px", fontSize: 11.5, fontWeight: 600 }}
                  title={iaConfigured ? "Resumir con IA" : "Configura tu llave de Gemini en app/.env"}
                  disabled={!iaConfigured || summarizing === `file-${f.path}`}
                  onClick={() => onResumir(f)}>
                  {summarizing === `file-${f.path}` ? "…" : "✨ Resumir"}
                </button>
              )}
              <button className="xdel" aria-label="Eliminar archivo" onClick={async () => { if (!window.confirm(`¿Eliminar el archivo ${f.name}?`)) return; await deleteFile(f.path); void reload(); }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          <label className="btn ghost" style={{ display: "inline-block", marginTop: 8, cursor: "pointer" }}>
            {uploading ? "Subiendo…" : "Subir archivo"}
            <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md" style={{ display: "none" }} onChange={onFile} disabled={uploading} />
          </label>
          {!iaConfigured && files.length > 0 && (
            <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 8 }}>
              Para los resúmenes con IA, consigue tu llave gratis en aistudio.google.com/apikey y agrégala como VITE_GEMINI_API_KEY en app/.env.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function Head() {
  return (
    <div className="page-head">
      <div className="eyebrow"><BookOpen size={13} /> Mi vida</div>
      <h1>Aprendizaje</h1>
      <p>Tus cuadernos y notas. Lo que aprendes, guardado y buscable.</p>
    </div>
  );
}

function EntryEditor({ entry, onSaved, onResumir, resumiendo }: {
  entry: Entry;
  onSaved: () => void;
  onResumir: () => void;
  resumiendo: boolean;
}) {
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
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
        <button className="btn primary" disabled={busy} onClick={() => void save()}>{busy ? "Guardando…" : "Guardar"}</button>
        <button className="btn ghost" disabled={!iaConfigured || resumiendo || !content.trim()}
          title={iaConfigured ? "Resumir esta nota con IA" : "Configura tu llave de Gemini en app/.env"}
          onClick={onResumir}>
          <Sparkles size={13} style={{ verticalAlign: "-2px", marginRight: 5 }} />
          {resumiendo ? "Resumiendo…" : "Resumir con IA"}
        </button>
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
            <IconField value={icon} onChange={setIcon} />
          </div>
          <button className="btn primary" disabled={busy} style={{ width: "100%", marginTop: 4 }}>{busy ? "Guardando…" : "Crear cuaderno"}</button>
        </form>
      </div>
    </div>
  );
}
