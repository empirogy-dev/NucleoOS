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

  return (
    <div className="field" style={{ width: 84, position: "relative" }} ref={ref}>
      <label>{label}</label>
      <button type="button" className="icon-btn" aria-label="Elegir ícono" onClick={() => setOpen(!open)}>
        {value || "🏷️"}
      </button>
      {open && (
        <div className="icon-pop" role="listbox" aria-label="Íconos disponibles">
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
