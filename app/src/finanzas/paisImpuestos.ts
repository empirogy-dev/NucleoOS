import { useEffect, useState } from "react";
import type { PaisImpuestos } from "./impuestos";

// El país en el que declaras impuestos. No es lo mismo que la moneda: se
// puede tener una cuenta en dólares y declarar en Chile, o al revés. Por eso
// vive aparte y no colgando de la moneda predeterminada.

const CLAVE = "nucleoos-pais-impuestos";

export function paisImpuestosActual(): PaisImpuestos {
  const x = localStorage.getItem(CLAVE);
  return x === "CA" || x === "CL" ? x : "otro";
}

export function guardarPaisImpuestos(p: PaisImpuestos): void {
  localStorage.setItem(CLAVE, p);
  // Para que las pantallas abiertas se enteren sin recargar.
  window.dispatchEvent(new Event("nucleoos-pais"));
}

export function usePaisImpuestos(): [PaisImpuestos, (p: PaisImpuestos) => void] {
  const [pais, setPais] = useState<PaisImpuestos>(() => paisImpuestosActual());
  useEffect(() => {
    const al = () => setPais(paisImpuestosActual());
    window.addEventListener("nucleoos-pais", al);
    window.addEventListener("storage", al);
    return () => {
      window.removeEventListener("nucleoos-pais", al);
      window.removeEventListener("storage", al);
    };
  }, []);
  return [pais, (p) => { guardarPaisImpuestos(p); setPais(p); }];
}
