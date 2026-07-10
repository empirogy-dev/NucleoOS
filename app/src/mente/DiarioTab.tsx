import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { TablesMissingError } from "../finanzas/data";
import { hoyLocal } from "../lib/fechas";
import { PROMPTS_DIARIO, addEntry, deleteEntry, listEntries, type JournalEntry } from "./diario";

// Diario: escribir para ordenar la cabeza. Con pregunta guía o en libre.

export function DiarioTab() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setEntries(await listEntries());
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

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await addEntry({ date: hoyLocal(), prompt, content: texto.trim() });
      setTexto("");
      setPrompt(null);
      await reload();
    } catch (ex) {
      if (ex instanceof TablesMissingError) setNeedsMigration(true);
      else setError(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setBusy(false);
    }
  }

  if (needsMigration) {
    return (
      <div className="card pad" style={{ maxWidth: 640 }}>
        <h3 style={{ marginBottom: 10 }}>Un paso pendiente en Supabase</h3>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 12 }}>
          Para tu diario, corre <code>supabase/migrations/0023_diario.sql</code> en el SQL Editor de Supabase.
        </p>
        <button className="btn primary" onClick={() => void reload()}>Ya lo hice, reintentar</button>
      </div>
    );
  }

  return (
    <div className="panelgrid">
      <div className="card panel" style={{ alignSelf: "start" }}>
        <h3>✍️ Hoy</h3>
        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 10 }}>
          Elige una pregunta guía o escribe libre. No tiene que ser bonito, tiene que ser honesto.
        </p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {PROMPTS_DIARIO.map((p) => (
            <button key={p.texto} type="button"
              className="chip"
              style={{ border: "none", cursor: "pointer", ...(prompt === p.texto ? {} : { background: "var(--surface)", color: "var(--ink-soft)" }) }}
              onClick={() => setPrompt(prompt === p.texto ? null : p.texto)}>
              {p.emoji} {p.texto.split(":")[0].split(",")[0].split("?")[0].slice(0, 32)}
            </button>
          ))}
        </div>
        {prompt && <p style={{ fontSize: 13, color: "var(--accent-ink)", fontWeight: 500, marginBottom: 8 }}>{prompt}</p>}
        {error && <p style={{ fontSize: 12.5, color: "var(--err)", marginBottom: 8 }}>{error}</p>}
        <form onSubmit={guardar}>
          <textarea
            className="vision-edit"
            rows={6}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribe aquí, para ti…"
          />
          <button className="btn primary" disabled={busy || !texto.trim()} style={{ marginTop: 10 }}>
            {busy ? "Guardando…" : "Guardar en mi diario"}
          </button>
        </form>
      </div>

      <div className="card panel" style={{ alignSelf: "start" }}>
        <h3>📖 Entradas anteriores</h3>
        {loading ? (
          <p style={{ color: "var(--muted)" }}>Cargando…</p>
        ) : entries.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 13.5 }}>
            Aún no hay entradas. La primera puede ser de dos líneas, eso ya cuenta.
          </p>
        ) : (
          entries.slice(0, 20).map((e) => (
            <div key={e.id} style={{ borderBottom: "1px solid var(--line-soft)", padding: "10px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <b style={{ fontSize: 12, color: "var(--muted)", flex: 1 }}>{e.date}{e.prompt ? `, ${e.prompt.slice(0, 40)}…` : ""}</b>
                <button className="xdel" style={{ width: 24, height: 24 }} aria-label="Eliminar entrada"
                  onClick={async () => { if (!window.confirm("¿Eliminar esta entrada del diario?")) return; await deleteEntry(e.id); void reload(); }}>
                  <Trash2 size={12} />
                </button>
              </div>
              <p style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.55, whiteSpace: "pre-wrap", marginTop: 4 }}>{e.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
