import { useCallback, useEffect, useRef } from "react";
import { useTour } from "./TourProvider";
import { TOUR_CARTOLA, TOUR_CARTOLA_REVISION, TOUR_GENERAL } from "./guiones";
import { correspondeSolo } from "./tour";

// El recorrido de la importación de cartola, que es el único que acompaña un
// trámite en vez de explicar una pantalla. Vive aparte de la ventana que lo
// usa porque tiene su propia coreografía y se puede probar sola.
//
// Va en dos tramos porque la mitad de lo que hay que señalar todavía no
// existe cuando la ventana se abre: la lista de movimientos leídos aparece
// recién después de elegir el archivo, y el motor salta los pasos cuyo
// objetivo no encuentra en un segundo y medio.

/** Cuánto se espera antes de aparecer, para que la ventana termine de montarse. */
const ESPERA_ABRIR = 450;
/** Y antes del segundo tramo, para que la lista alcance a dibujarse. */
const ESPERA_LISTA = 380;

/** @param hayFilas si la ventana ya está mostrando movimientos leídos.
 *  @returns `empezar`, para el enlace de "¿primera vez?" que lo pide a mano. */
export function useTourCartola(hayFilas: boolean): { empezar: () => void } {
  const { iniciar, activo } = useTour();
  const seguir = useRef(false);
  const habia = useRef(false);
  const filas = useRef(hayFilas);
  filas.current = hayFilas;

  const tramoDos = useCallback(() => {
    seguir.current = false;
    window.setTimeout(() => iniciar(TOUR_CARTOLA_REVISION), ESPERA_LISTA);
  }, [iniciar]);

  const empezar = useCallback(() => {
    iniciar(TOUR_CARTOLA, (terminado) => {
      // Cortarlo a la mitad es un "déjame en paz": el segundo tramo no sale.
      seguir.current = terminado;
      // Pedido a mano con el archivo ya leído: se sigue de largo.
      if (terminado && filas.current) tramoDos();
    });
  }, [iniciar, tramoDos]);

  // Primera vez que se abre esta ventana: el recorrido parte solo.
  useEffect(() => {
    if (activo || !correspondeSolo(TOUR_CARTOLA, TOUR_GENERAL)) return;
    const id = window.setTimeout(empezar, ESPERA_ABRIR);
    return () => window.clearTimeout(id);
  }, [activo, empezar]);

  // Acaban de aparecer los movimientos: sigue el segundo tramo, si el primero
  // llegó hasta el final.
  useEffect(() => {
    const antes = habia.current;
    habia.current = hayFilas;
    if (!hayFilas || antes || !seguir.current) return;
    tramoDos();
  }, [hayFilas, tramoDos]);

  return { empezar };
}
