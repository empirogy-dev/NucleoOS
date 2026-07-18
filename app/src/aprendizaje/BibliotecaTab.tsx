import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { LIBROS, VIAS_LIBRO, librosDe, type Libro, type ViaLibro } from "./biblioteca";

// Biblioteca: libros curados por vía, cada uno con su porqué y sus ideas
// aplicadas a la app. Leer el resumen ya te deja algo; el libro, más.

export function BibliotecaTab() {
  const [via, setVia] = useState<ViaLibro>("tdah");

  return (
    <>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12, maxWidth: "64ch" }}>
        {LIBROS.length} libros elegidos por impacto real para un cerebro TDAH, no por moda. Abre uno y llévate sus tres ideas aunque nunca lo compres.
      </p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {VIAS_LIBRO.map((v) => (
          <button key={v.key} className={"ftab" + (via === v.key ? " active" : "")}
            style={{ padding: "6px 13px", fontSize: 12.5 }}
            onClick={() => setVia(v.key)}>
            {v.label}
          </button>
        ))}
      </div>
      <div className="rev-grid">
        {librosDe(via).map((l) => <LibroCard key={l.id} libro={l} />)}
      </div>
    </>
  );
}

function LibroCard({ libro }: { libro: Libro }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card panel">
      <button
        style={{ display: "flex", alignItems: "flex-start", gap: 10, width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0, font: "inherit", color: "inherit" }}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span style={{ fontSize: 22, lineHeight: 1 }}>{libro.emoji}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <b style={{ fontSize: 14.5, display: "block" }}>{libro.titulo}</b>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>{libro.autor}</span>
        </span>
        {open ? <ChevronDown size={15} style={{ color: "var(--muted)", flexShrink: 0 }} /> : <ChevronRight size={15} style={{ color: "var(--muted)", flexShrink: 0 }} />}
      </button>
      <p style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.55, marginTop: 8 }}>
        {libro.porQue}
      </p>
      {open && (
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
    </div>
  );
}
