import { useEffect, useState } from "react";

// ¿Haces ayuno intermitente?
//
// Hasta ahora la app daba por hecho que sí. El contador se alimenta solo de
// los platos registrados, así que apenas alguien anotaba una comida empezaba a
// correr un ayuno que nadie pidió, con su meta y su "meta cumplida". A quien
// no ayuna, eso le dice todos los días que está haciendo algo que no está
// haciendo, y en una app de salud eso no es un detalle.
//
// Por eso son tres estados y no dos. "Sin responder" no es lo mismo que "no":
// mientras nadie conteste, la tarjeta pregunta en vez de contar. Un interruptor
// de dos posiciones obligaba a elegir un valor por defecto, y cualquiera de los
// dos habría estado mal: encendido vuelve al problema de ahora, y apagado le
// esconde la función a quien sí ayuna y ya la estaba usando.

export type PrefAyuno = "si" | "no" | null;

const CLAVE = "nucleoos-hace-ayuno";
const EVENTO = "nucleoos-hace-ayuno";

export function prefAyunoActual(): PrefAyuno {
  try {
    const v = localStorage.getItem(CLAVE);
    return v === "1" ? "si" : v === "0" ? "no" : null;
  } catch {
    return null;
  }
}

export function guardarPrefAyuno(v: PrefAyuno): void {
  try {
    if (v === null) localStorage.removeItem(CLAVE);
    else localStorage.setItem(CLAVE, v === "si" ? "1" : "0");
  } catch { /* sin navegador */ }
  window.dispatchEvent(new Event(EVENTO));
}

/** La preferencia, viva: cambia sola cuando se toca en otra parte de la app
 *  (la tarjeta de Energía y el interruptor de Ajustes son la misma cosa). */
export function usePrefAyuno(): [PrefAyuno, (v: PrefAyuno) => void] {
  const [pref, setPref] = useState<PrefAyuno>(() => prefAyunoActual());
  useEffect(() => {
    const al = () => setPref(prefAyunoActual());
    window.addEventListener(EVENTO, al);
    window.addEventListener("storage", al);
    return () => {
      window.removeEventListener(EVENTO, al);
      window.removeEventListener("storage", al);
    };
  }, []);
  return [pref, (v) => { guardarPrefAyuno(v); setPref(v); }];
}
