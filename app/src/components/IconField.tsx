import { useEffect, useRef, useState } from "react";

// Panel de íconos pedido por la usuaria: en vez de tipear un emoji,
// se elige de una grilla. Se usa en hábitos, categorías, metas y cuadernos.
const EMOJIS = [
  "🌱", "💧", "🧘", "🏃", "🚶", "💪", "🤸", "🚴", "🏋️", "🛏️",
  "☀️", "🌙", "💤", "🍎", "🥗", "🥦", "🍫", "☕", "🍺", "🚭",
  "💊", "🦷", "🫁", "❤️", "🧠", "😌", "🙏", "📖", "✍️", "📚",
  "📝", "💻", "🎧", "🎸", "🎨", "🧩", "📵", "⏰", "🧹", "🛒",
  "💰", "📊", "🎯", "⭐", "✨", "🔥", "🌿", "🌊", "🐶", "💌",
];

export function IconField({ value, onChange, label = "Ícono" }: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function fuera(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, []);

  // La grilla va EN LÍNEA, no flotando. Flotando quedaba recortada por la
  // ventana, que ya tiene su propio scroll, así que había que desplazarse
  // hacia el lado y hacia abajo para ver los íconos, y varios no se veían
  // nunca. En línea, el campo se ensancha a toda la fila y se ven todos.
  return (
    <div className="field" style={{ width: open ? "100%" : 84, flexBasis: open ? "100%" : undefined }} ref={ref}>
      <label>{label}</label>
      <button type="button" className="icon-btn" aria-label="Elegir ícono" onClick={() => setOpen(!open)}
        style={open ? undefined : { width: "100%" }}>
        {value || "🏷️"}{open ? "" : ""}
      </button>
      {open && (
        <div className="icon-grid" role="listbox" aria-label="Íconos disponibles">
          {EMOJIS.map((e) => (
            <button key={e} type="button" className={"icon-opt" + (value === e ? " active" : "")}
              onClick={() => { onChange(e); setOpen(false); }}>
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
