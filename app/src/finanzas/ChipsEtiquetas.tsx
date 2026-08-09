import { sinRobarFoco } from "../components/cierreDeFondo";
import type { Etiqueta } from "./tags";

// Las etiquetas se marcan y se desmarcan, nunca se escriben aquí. Se crean en
// su propia pestaña, y esto solo elige entre las que ella ya hizo.

export function ChipsEtiquetas({ etiquetas, puestas, onToggle, tamano = 12.5 }: {
  etiquetas: Etiqueta[];
  puestas: Set<string>;
  onToggle: (id: string) => void;
  tamano?: number;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {etiquetas.map((e) => {
        const puesta = puestas.has(e.id);
        return (
          <button key={e.id} type="button" {...sinRobarFoco}
            aria-pressed={puesta}
            onClick={() => onToggle(e.id)}
            style={{
              font: "inherit", fontSize: tamano, cursor: "pointer",
              padding: tamano < 12 ? "3px 9px" : "5px 11px", borderRadius: 999,
              border: `1px solid ${e.color ?? "var(--line)"}`,
              background: puesta ? (e.color ?? "var(--accent)") : "transparent",
              color: puesta ? "#fff" : "var(--ink-soft)",
            }}>
            {puesta ? "✓ " : ""}{e.name}
          </button>
        );
      })}
    </div>
  );
}
