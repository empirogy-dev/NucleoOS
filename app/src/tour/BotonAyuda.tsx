import { useEffect } from "react";
import { HelpCircle } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useIdioma } from "../idioma/IdiomaProvider";
import { useTour } from "./TourProvider";
import { TOUR_GENERAL } from "./guiones";
import { correspondeSolo, marcarHecho, tomarTourPendiente } from "./tour";

// El signo de pregunta de la barra de arriba, y el que decide cuándo un tour
// de módulo aparece solo.
//
// Van juntos porque son la misma pregunta desde dos lados: "¿qué es esta
// pantalla?". El botón la contesta cuando la persona la hace; el efecto la
// contesta la primera vez, antes de que tenga que preguntarla.

export function BotonAyuda() {
  const { t: tr } = useIdioma();
  const location = useLocation();
  const { iniciar, activo, guionDeRuta } = useTour();
  const clave = guionDeRuta(location.pathname);

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

  // Sin guion para esta pantalla, el botón lanza el recorrido general, que
  // siempre tiene algo que decir.
  const alPulsar = () => {
    if (clave) {
      // Repetirlo a pedido no debería dejarlo marcado como pendiente.
      marcarHecho(TOUR_GENERAL);
      iniciar(clave);
    } else {
      iniciar(TOUR_GENERAL);
    }
  };

  return (
    <button className="iconbtn" onClick={alPulsar}
      aria-label={tr("Qué es esta pantalla")} title={tr("Qué es esta pantalla")}>
      <HelpCircle size={18} />
    </button>
  );
}
