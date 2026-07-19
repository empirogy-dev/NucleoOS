import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useIdioma } from "../idioma/IdiomaProvider";

// Desplegable propio de NucleoOS: el listado de un <select> nativo lo
// dibuja el sistema operativo y no se puede pintar. Este panel es nuestro,
// con la tarjeta, los bordes y los colores del tema.

export interface OpcionSelector {
  value: string;
  label: string;
}

export function Selector({ value, onChange, opciones, ariaLabel, placeholder, compacto = false }: {
  value: string;
  onChange: (v: string) => void;
  opciones: OpcionSelector[];
  ariaLabel: string;
  placeholder?: string;
  compacto?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { t } = useIdioma();
  const ph = placeholder ?? t("com.elegir");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function fuera(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function tecla(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", tecla);
    };
  }, [open]);

  const actual = opciones.find((o) => o.value === value) ?? null;

  return (
    <div className="sel" ref={ref}>
      <button
        type="button"
        className={"sel-btn" + (compacto ? " compacto" : "")}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen(!open)}
      >
        <span className={"sel-txt" + (actual ? "" : " vacio")}>{actual?.label ?? ph}</span>
        <ChevronDown size={13} style={{ flex: "none", color: "var(--muted)" }} />
      </button>
      {open && (
        <div className="sel-pop" role="listbox" aria-label={ariaLabel}>
          {opciones.map((o) => (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={o.value === value}
              className={"sel-opt" + (o.value === value ? " on" : "")}
              onClick={() => { onChange(o.value); setOpen(false); }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
