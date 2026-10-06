import { useEffect, useRef, useState } from "react";
import { Compass, HelpCircle } from "lucide-react";
import { useIdioma } from "../idioma/IdiomaProvider";
import { useTour } from "./TourProvider";
import { GUIONES, PROPOSITOS } from "./guiones";

// El signo de pregunta que vive al lado del título de cada sección.
//
// El botón de la barra de arriba sirve para "muéstrame la app". Este sirve
// para la otra pregunta, la que aparece cuando ya estás dentro de algo y no
// entiendes qué es: "¿y esto para qué es?". Contesta eso en dos frases, y
// recién después ofrece el recorrido, porque leer tres líneas cuesta menos
// que seguir cuatro ventanitas.
//
// Está en todas las secciones por la misma razón, pero importa sobre todo en
// Finanzas, que es el módulo más difícil y el que la gente abre primero.

export function AyudaModulo({ clave }: { clave: string }) {
  const { t: tr } = useIdioma();
  const { iniciar } = useTour();
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false);
    };
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") setAbierto(false); };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", tecla);
    };
  }, [abierto]);

  const proposito = PROPOSITOS[clave];
  if (!proposito) return null;
  const pasos = GUIONES[clave]?.pasos.length ?? 0;

  return (
    <span className="modayuda" ref={caja}>
      <button type="button" className="modayuda-btn" aria-haspopup="dialog" aria-expanded={abierto}
        onClick={() => setAbierto(!abierto)}
        aria-label={tr("Para qué es esta sección")} title={tr("Para qué es esta sección")}>
        <HelpCircle size={17} />
      </button>
      {abierto && (
        <span className="modayuda-pop" role="dialog">
          <span className="modayuda-tit">{tr("Para qué es esta sección")}</span>
          <span className="modayuda-txt">{tr(proposito)}</span>
          {pasos > 0 && (
            <button type="button" className="btn ghost modayuda-ir"
              onClick={() => { setAbierto(false); iniciar(clave); }}>
              <Compass size={14} />
              {tr("Ver el recorrido")}
              <small>{pasos} {pasos === 1 ? tr("paso") : tr("pasos")}</small>
            </button>
          )}
        </span>
      )}
    </span>
  );
}
