import { X } from "lucide-react";
import { PALETTES } from "../theme/palettes";
import { useTheme } from "../theme/ThemeProvider";

export function ThemePicker({ onClose }: { onClose: () => void }) {
  const { palette, setPalette } = useTheme();
  return (
    <div className="tp-overlay" onClick={onClose}>
      <div className="tp" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <h3>Elige tu tema</h3>
          <button className="xdel" aria-label="Cerrar" onClick={onClose}><X size={14} /></button>
        </div>
        <p>Tu espacio, tu color. Toda la app se adapta al instante.</p>
        <div className="tp-grid">
          {PALETTES.map((p) => (
            <button
              key={p.key}
              className={"tp-card" + (palette === p.key ? " active" : "")}
              onClick={() => setPalette(p.key)}
            >
              <b>{p.name}</b>
              <span className="tp-dots">
                {p.dots.map((c, i) => (
                  <i key={i} style={{ background: c }} />
                ))}
              </span>
            </button>
          ))}
        </div>
        <div className="tp-close">
          <button className="btn primary" onClick={onClose}>Listo</button>
        </div>
      </div>
    </div>
  );
}
