import { useEffect, useRef, useState } from "react";
import { Compass, HelpCircle, MapPin } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useIdioma } from "../idioma/IdiomaProvider";
import { useTour } from "./TourProvider";
import { TOUR_GENERAL } from "./guiones";
import { correspondeSolo, estadoTour, marcarHecho, reiniciarTour, tomarTourPendiente, EVENTO_TOUR } from "./tour";

// El botón de "aprende a usar la app", en la barra de arriba.
//
// Es un menú y no un botón suelto porque son dos preguntas distintas y la
// persona sabe cuál está haciendo: "no entiendo esta pantalla" y "muéstrame
// la app entera". Un solo botón tenía que adivinar, y adivinaba mal justo con
// quien lleva meses usando la app y solo quiere el recorrido completo.
//
// El puntito del ícono es para quien ya era usuaria antes de que el tour
// existiera: a ella nunca le va a saltar solo, porque su bienvenida ya estaba
// hecha hace meses. El punto se apaga en cuanto ve el recorrido o dice que no
// lo quiere.

export function BotonAyuda() {
  const { t: tr } = useIdioma();
  const location = useLocation();
  const { iniciar, activo, guionDeRuta } = useTour();
  const clave = guionDeRuta(location.pathname);
  const [abierto, setAbierto] = useState(false);
  const [estado, setEstado] = useState(() => estadoTour());
  const caja = useRef<HTMLDivElement>(null);

  // El estado del tour se toca desde Ajustes y desde el propio tour, así que
  // se escucha en vez de leerse una sola vez.
  useEffect(() => {
    const al = () => setEstado(estadoTour());
    window.addEventListener(EVENTO_TOUR, al);
    window.addEventListener("storage", al);
    return () => {
      window.removeEventListener(EVENTO_TOUR, al);
      window.removeEventListener("storage", al);
    };
  }, []);

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

  // Recién salida de la bienvenida: el recorrido general parte solo.
  useEffect(() => {
    if (!tomarTourPendiente()) return;
    const id = window.setTimeout(() => iniciar(TOUR_GENERAL), 500);
    return () => window.clearTimeout(id);
  }, [iniciar]);

  // La primera visita a una sección se explica sola, salvo que la persona
  // haya saltado el tour general, que es su forma de decir "déjame en paz".
  useEffect(() => {
    if (activo || !clave) return;
    if (!correspondeSolo(clave, TOUR_GENERAL)) return;
    // Un respiro antes de aparecer: que la pantalla termine de montarse y de
    // traer sus datos, para no señalar un lugar vacío.
    const id = window.setTimeout(() => iniciar(clave), 700);
    return () => window.clearTimeout(id);
  }, [clave, activo, iniciar]);

  // Nunca lo vio ni lo saltó: el punto le avisa de que esto existe.
  const sinVer = !estado.saltado && !estado.hechos.includes(TOUR_GENERAL);

  const verTodo = () => {
    setAbierto(false);
    // Desde cero: quien lo pide otra vez quiere el recorrido completo, no el
    // que quedó a medias, y quiere que los de cada módulo vuelvan a salir.
    reiniciarTour();
    iniciar(TOUR_GENERAL);
  };

  const verPantalla = () => {
    setAbierto(false);
    if (!clave) {
      iniciar(TOUR_GENERAL);
      return;
    }
    // Pedirlo a mano no deja pendiente el general.
    marcarHecho(TOUR_GENERAL);
    iniciar(clave);
  };

  return (
    <div className="tour-menu" ref={caja}>
      <button className={"iconbtn" + (sinVer ? " con-punto" : "")}
        aria-haspopup="menu" aria-expanded={abierto}
        onClick={() => setAbierto(!abierto)}
        aria-label={tr("Aprende a usar la app")} title={tr("Aprende a usar la app")}>
        <HelpCircle size={18} />
      </button>
      {abierto && (
        <div className="tour-menu-pop" role="menu">
          <div className="tour-menu-tit">{tr("Aprende a usar la app")}</div>
          <button type="button" role="menuitem" className="tour-menu-opt" onClick={verTodo}>
            <Compass size={15} />
            <span>
              <b>{tr("Conocer la app entera")}</b>
              <small>{tr("El recorrido completo, siete pasos cortos")}</small>
            </span>
          </button>
          <button type="button" role="menuitem" className="tour-menu-opt" onClick={verPantalla}>
            <MapPin size={15} />
            <span>
              <b>{clave ? tr("Qué es esta pantalla") : tr("Esta pantalla no tiene recorrido propio")}</b>
              <small>{clave
                ? tr("Te muestro lo de aquí en tres o cuatro pasos")
                : tr("Te muestro el recorrido general")}</small>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
