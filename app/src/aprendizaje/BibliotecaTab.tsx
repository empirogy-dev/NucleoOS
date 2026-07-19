import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Plus, Sparkles, Trash2 } from "lucide-react";
import {
  LIBROS,
  VIAS_LIBRO,
  estadosLibros,
  librosDe,
  marcarLibro,
  type EstadoLibro,
  type Libro,
  type ViaLibro,
} from "./biblioteca";
import {
  addLibroPropio,
  comoLibro,
  deleteLibroPropio,
  listLibrosPropios,
  type LibroPropio,
} from "./librosPropios";
import { TablesMissingError } from "../finanzas/data";
import { Selector } from "../components/Selector";
import { fichaLibro, iaConfigured } from "../lib/ia";

// Biblioteca: libros curados por vía, cada uno con su porqué y sus ideas,
// más los libros que tú agregas (la IA arma su ficha). Marca los que
// quieres leer y los que ya leíste: tu estantería personal.

export function BibliotecaTab() {
  const [via, setVia] = useState<ViaLibro | "milista" | "leidos">("tdah");
  const [estados, setEstados] = useState<Record<string, EstadoLibro>>(estadosLibros);
  const [propios, setPropios] = useState<LibroPropio[]>([]);
  const [faltaMigracion, setFaltaMigracion] = useState(false);
  const [modal, setModal] = useState(false);

  const cargarPropios = useCallback(async () => {
    try {
      setPropios(await listLibrosPropios());
      setFaltaMigracion(false);
    } catch (e) {
      if (e instanceof TablesMissingError) setFaltaMigracion(true);
      /* sin sesión o sin tabla: la biblioteca curada sigue funcionando */
    }
  }, []);

  useEffect(() => {
    void cargarPropios();
  }, [cargarPropios]);

  const leidos = Object.values(estados).filter((e) => e === "leido").length;
  const quiero = Object.values(estados).filter((e) => e === "quiero").length;

  function marcar(id: string, estado: EstadoLibro | null) {
    setEstados(marcarLibro(id, estado));
  }

  async function eliminarPropio(l: Libro) {
    if (!window.confirm(`¿Sacar "${l.titulo}" de tu biblioteca?`)) return;
    await deleteLibroPropio(l.id);
    marcar(l.id, null);
    void cargarPropios();
  }

  const idsPropios = new Set(propios.map((p) => p.id));
  const todos: Libro[] = [...LIBROS, ...propios.map(comoLibro)];
  const visibles =
    via === "milista" ? todos.filter((l) => estados[l.id] === "quiero")
    : via === "leidos" ? todos.filter((l) => estados[l.id] === "leido")
    : [...librosDe(via), ...propios.filter((p) => p.via === via).map(comoLibro)];

  return (
    <>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap" }}>
        <p style={{ fontSize: 13, color: "var(--muted)", maxWidth: "62ch", flex: "1 1 300px" }}>
          {todos.length} libros elegidos por impacto real para un cerebro TDAH, no por moda. Abre uno y llévate sus tres ideas aunque nunca lo compres.
          {(leidos > 0 || quiero > 0) && (
            <>
              {" "}Llevas <b style={{ color: "var(--ink)" }}>{leidos} {leidos === 1 ? "leído" : "leídos"}</b> y <b style={{ color: "var(--ink)" }}>{quiero}</b> en tu lista.
            </>
          )}
        </p>
        <button className="btn primary" onClick={() => setModal(true)}>
          <Plus size={15} style={{ verticalAlign: "-2px", marginRight: 5 }} />
          Agregar libro
        </button>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {VIAS_LIBRO.map((v) => (
          <button key={v.key} className={"ftab" + (via === v.key ? " active" : "")}
            style={{ padding: "6px 13px", fontSize: 12.5 }}
            onClick={() => setVia(v.key)}>
            {v.label}
          </button>
        ))}
        <button className={"ftab" + (via === "milista" ? " active" : "")}
          style={{ padding: "6px 13px", fontSize: 12.5 }}
          onClick={() => setVia("milista")}>
          📖 Mi lista{quiero > 0 ? ` (${quiero})` : ""}
        </button>
        <button className={"ftab" + (via === "leidos" ? " active" : "")}
          style={{ padding: "6px 13px", fontSize: 12.5 }}
          onClick={() => setVia("leidos")}>
          ✓ Leídos{leidos > 0 ? ` (${leidos})` : ""}
        </button>
      </div>
      {visibles.length === 0 ? (
        <div className="card pad" style={{ maxWidth: 560 }}>
          <p style={{ fontSize: 13.5, color: "var(--muted)" }}>
            {via === "milista"
              ? "Aún no marcas libros con \"Lo quiero leer\". Recorre las vías y arma tu lista: aquí te esperan."
              : "Aún no marcas libros como leídos. El primero que termines, márcalo y celebra."}
          </p>
        </div>
      ) : (
        <div className="rev-grid">
          {visibles.map((l) => (
            <LibroCard key={l.id} libro={l} estado={estados[l.id] ?? null} onMarcar={marcar}
              onEliminar={idsPropios.has(l.id) ? () => void eliminarPropio(l) : undefined} />
          ))}
        </div>
      )}
      {modal && (
        <AgregarLibroModal faltaMigracion={faltaMigracion}
          onClose={() => setModal(false)}
          onSaved={() => { setModal(false); void cargarPropios(); }} />
      )}
    </>
  );
}

function LibroCard({ libro, estado, onMarcar, onEliminar }: {
  libro: Libro;
  estado: EstadoLibro | null;
  onMarcar: (id: string, estado: EstadoLibro | null) => void;
  onEliminar?: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card panel" style={estado === "leido" ? { borderColor: "color-mix(in srgb, var(--ok) 45%, var(--line))" } : undefined}>
      <button
        style={{ display: "flex", alignItems: "flex-start", gap: 10, width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0, font: "inherit", color: "inherit" }}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span style={{ fontSize: 22, lineHeight: 1 }}>{libro.emoji}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <b style={{ fontSize: 14.5, display: "block" }}>{libro.titulo}</b>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>{libro.autor}{onEliminar ? " · tuyo" : ""}</span>
        </span>
        {open ? <ChevronDown size={15} style={{ color: "var(--muted)", flexShrink: 0 }} /> : <ChevronRight size={15} style={{ color: "var(--muted)", flexShrink: 0 }} />}
      </button>
      <p style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.55, marginTop: 8 }}>
        {libro.porQue}
      </p>
      {open && libro.ideas.length > 0 && (
        <div style={{ marginTop: 8, borderTop: "1px solid var(--line-soft)", paddingTop: 8 }}>
          <p style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".11em", color: "var(--muted)", fontWeight: 600, marginBottom: 4 }}>
            Tres ideas para llevarte
          </p>
          {libro.ideas.map((i) => (
            <p key={i} style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.55, padding: "5px 0", borderBottom: "1px solid var(--line-soft)" }}>
              💡 {i}
            </p>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
        <button
          className="pomo-chip"
          style={estado === "quiero" ? { background: "var(--accent-wash)", borderColor: "transparent", color: "var(--accent-ink)" } : undefined}
          onClick={() => onMarcar(libro.id, estado === "quiero" ? null : "quiero")}
        >
          {estado === "quiero" ? "📖 En tu lista" : "Lo quiero leer"}
        </button>
        <button
          className="pomo-chip"
          style={estado === "leido" ? { background: "color-mix(in srgb, var(--ok) 20%, var(--paper))", borderColor: "transparent", color: "var(--ok)" } : undefined}
          onClick={() => onMarcar(libro.id, estado === "leido" ? null : "leido")}
        >
          {estado === "leido" ? "✓ Leído" : "Lo leí"}
        </button>
        {onEliminar && (
          <>
            <span style={{ flex: 1 }} />
            <button className="xdel" aria-label={`Eliminar ${libro.titulo} de tu biblioteca`} onClick={onEliminar}>
              <Trash2 size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function AgregarLibroModal({ faltaMigracion, onClose, onSaved }: { faltaMigracion: boolean; onClose: () => void; onSaved: () => void }) {
  const [titulo, setTitulo] = useState("");
  const [autor, setAutor] = useState("");
  const [viaSel, setViaSel] = useState<string>("proposito");
  const [emoji, setEmoji] = useState("📕");
  const [porQue, setPorQue] = useState("");
  const [ideas, setIdeas] = useState<string[]>([]);
  const [pensando, setPensando] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function completarConIA() {
    if (!titulo.trim()) {
      setErr("Escribe primero el título del libro.");
      return;
    }
    setErr(null);
    setPensando(true);
    try {
      const f = await fichaLibro(titulo.trim(), autor.trim());
      setEmoji(f.emoji);
      setPorQue(f.por_que);
      setIdeas(f.ideas);
      setViaSel(f.via);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setPensando(false);
    }
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await addLibroPropio({
        title: titulo.trim(),
        author: autor.trim(),
        via: viaSel as ViaLibro,
        emoji,
        why: porQue.trim(),
        ideas,
      });
      onSaved();
    } catch (ex) {
      if (ex instanceof TablesMissingError) {
        setErr("Para tus propios libros falta la migración 0042 (supabase/migrations/0042_libros_propios.sql). Córrela en el SQL Editor y vuelve a guardar.");
      } else {
        setErr(ex instanceof Error ? ex.message : String(ex));
      }
      setBusy(false);
    }
  }

  return (
    <div className="tp-overlay" onClick={onClose}>
      <div className="tp" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <h3 style={{ marginBottom: 14 }}>Agregar un libro tuyo</h3>
        {faltaMigracion && (
          <p style={{ fontSize: 12.5, color: "var(--warn)", marginBottom: 10 }}>
            Falta la migración 0042 (supabase/migrations/0042_libros_propios.sql): córrela en el SQL Editor para poder guardar.
          </p>
        )}
        {err && <p style={{ fontSize: 12.5, color: "var(--err)", marginBottom: 10 }}>{err}</p>}
        <form onSubmit={guardar}>
          <div className="field"><label>Título</label>
            <input required value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="The Mastery of Love" autoFocus /></div>
          <div className="field"><label>Autor (opcional)</label>
            <input value={autor} onChange={(e) => setAutor(e.target.value)} placeholder="Don Miguel Ruiz" /></div>
          {iaConfigured && (
            <button type="button" className="btn ghost" style={{ width: "100%", marginBottom: 12 }} disabled={pensando}
              onClick={() => void completarConIA()}>
              <Sparkles size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />
              {pensando ? "La IA está armando la ficha…" : "Que la IA arme la ficha: resumen, ideas y vía"}
            </button>
          )}
          <div className="field"><label>Vía de la vida que toca</label>
            <Selector value={viaSel} ariaLabel="Vía del libro" onChange={setViaSel}
              opciones={VIAS_LIBRO.map((v) => ({ value: v.key, label: v.label }))} /></div>
          <div className="field"><label>Por qué leerlo (opcional)</label>
            <textarea className="vision-edit" rows={3} value={porQue} onChange={(e) => setPorQue(e.target.value)}
              placeholder="Qué te dio este libro, o deja que la IA lo escriba." /></div>
          {ideas.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".11em", color: "var(--muted)", fontWeight: 600, marginBottom: 4 }}>
                Ideas para llevarte
              </p>
              {ideas.map((i) => (
                <p key={i} style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.5, padding: "4px 0" }}>💡 {i}</p>
              ))}
            </div>
          )}
          <button className="btn primary" disabled={busy} style={{ width: "100%" }}>{busy ? "Guardando…" : "Guardar en mi biblioteca"}</button>
        </form>
      </div>
    </div>
  );
}
