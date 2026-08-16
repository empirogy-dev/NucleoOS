import { useEffect, useState } from "react";

// ¿Usas un auto para trabajar?
//
// La pestaña del auto le sirve a quien deduce kilómetros y a nadie más. Para
// el resto es una pestaña más en una barra que ya tiene demasiadas, así que
// viene apagada y se enciende en Ajustes.
//
// Apagarla no borra nada ni bloquea nada: los viajes y las lecturas siguen
// donde estaban, y vuelven a aparecer al encenderla. Y si ya hay un auto
// guardado, la pestaña se muestra igual aunque la preferencia esté apagada:
// esconder datos que alguien ya cargó es peor que mostrar una pestaña de más.

const CLAVE = "nucleoos-usa-auto";

export function usaAutoActual(): boolean {
  try {
    return localStorage.getItem(CLAVE) === "1";
  } catch {
    return false;
  }
}

export function guardarUsaAuto(v: boolean): void {
  try {
    localStorage.setItem(CLAVE, v ? "1" : "0");
  } catch { /* sin navegador */ }
  window.dispatchEvent(new Event("nucleoos-usa-auto"));
}

export function useUsaAuto(): [boolean, (v: boolean) => void] {
  const [usa, setUsa] = useState<boolean>(() => usaAutoActual());
  useEffect(() => {
    const al = () => setUsa(usaAutoActual());
    window.addEventListener("nucleoos-usa-auto", al);
    window.addEventListener("storage", al);
    return () => {
      window.removeEventListener("nucleoos-usa-auto", al);
      window.removeEventListener("storage", al);
    };
  }, []);
  return [usa, (v) => { guardarUsaAuto(v); setUsa(v); }];
}
