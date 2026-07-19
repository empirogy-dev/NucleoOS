import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { hoyLocal } from "../lib/fechas";
import { useIdioma } from "../idioma/IdiomaProvider";
import { CALENDARIO } from "../idioma/textos";

// Calendario propio de NucleoOS: el panel de un <input type="date"> lo
// dibuja el navegador y no se puede pintar. Este calendario es nuestro,
// con la tarjeta, los bordes y los colores del tema, y habla el idioma
// elegido en Ajustes. Entrega "YYYY-MM-DD".

function fmt(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function CampoFecha({ value, onChange, ariaLabel, placeholder, compacto = false, conBorrar = true, min, max }: {
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
  placeholder?: string;
  compacto?: boolean;
  /** Si la fecha es obligatoria en su formulario, esconde el botón Borrar. */
  conBorrar?: boolean;
  min?: string;
  max?: string;
}) {
  const [open, setOpen] = useState(false);
  const { idioma, t } = useIdioma();
  const cal = CALENDARIO[idioma];
  const hoy = hoyLocal();
  const base = value || hoy;
  const [anio, setAnio] = useState(Number(base.slice(0, 4)));
  const [mes, setMes] = useState(Number(base.slice(5, 7)) - 1);
  const ref = useRef<HTMLDivElement>(null);

  function legible(v: string): string {
    const [y, m, d] = v.split("-").map(Number);
    if (!y || !m || !d) return v;
    return cal.legible(d, cal.meses[m - 1], y);
  }

  useEffect(() => {
    if (!open) return;
    // Al abrir, el calendario se para en el mes de la fecha elegida (u hoy).
    const b = value || hoyLocal();
    setAnio(Number(b.slice(0, 4)));
    setMes(Number(b.slice(5, 7)) - 1);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function mover(delta: number) {
    const m = mes + delta;
    if (m < 0) { setMes(11); setAnio(anio - 1); }
    else if (m > 11) { setMes(0); setAnio(anio + 1); }
    else setMes(m);
  }

  // Lunes como primer día de la semana.
  const primerDia = (new Date(anio, mes, 1).getDay() + 6) % 7;
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const celdas: Array<number | null> = [
    ...Array.from({ length: primerDia }, () => null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ];

  return (
    <div className="sel" ref={ref}>
      <button
        type="button"
        className={"sel-btn" + (compacto ? " compacto" : "")}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen(!open)}
      >
        <span className={"sel-txt" + (value ? "" : " vacio")}>{value ? legible(value) : placeholder ?? t("com.elegirfecha")}</span>
        <CalendarDays size={13} style={{ flex: "none", color: "var(--muted)" }} />
      </button>
      {open && (
        <div className="sel-pop cal-pop" role="dialog" aria-label={ariaLabel}>
          <div className="cal-head">
            <button type="button" className="cal-nav" aria-label="Año anterior" onClick={() => setAnio(anio - 1)}><ChevronsLeft size={13} /></button>
            <button type="button" className="cal-nav" aria-label="Mes anterior" onClick={() => mover(-1)}><ChevronLeft size={14} /></button>
            <span className="cal-mes">{cal.meses[mes]} {anio}</span>
            <button type="button" className="cal-nav" aria-label="Mes siguiente" onClick={() => mover(1)}><ChevronRight size={14} /></button>
            <button type="button" className="cal-nav" aria-label="Año siguiente" onClick={() => setAnio(anio + 1)}><ChevronsRight size={13} /></button>
          </div>
          <div className="cal-grid">
            {cal.dias.map((d) => <span key={d} className="cal-dow">{d}</span>)}
            {celdas.map((d, i) => d === null
              ? <span key={`v${i}`} />
              : (() => {
                  const iso = fmt(anio, mes, d);
                  const fuera = Boolean((min && iso < min) || (max && iso > max));
                  return (
                    <button key={iso} type="button" disabled={fuera}
                      className={"cal-dia" + (iso === value ? " on" : "") + (iso === hoy ? " hoy" : "") + (fuera ? " off" : "")}
                      onClick={() => { onChange(iso); setOpen(false); }}>
                      {d}
                    </button>
                  );
                })()
            )}
          </div>
          <div className="cal-pie">
            {conBorrar && value
              ? <button type="button" className="cal-accion" onClick={() => { onChange(""); setOpen(false); }}>{t("com.borrar")}</button>
              : <span />}
            <button type="button" className="cal-accion" onClick={() => { onChange(hoy); setOpen(false); }}>{t("com.hoy")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
