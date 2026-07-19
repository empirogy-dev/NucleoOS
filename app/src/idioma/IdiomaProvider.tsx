import { createContext, useContext, useState, type ReactNode } from "react";
import { TEXTOS, type Idioma } from "./textos";

// El idioma de la app, elegible en Ajustes. Se recuerda en el navegador
// y viaja entre dispositivos por el espejo de la nube (clave en CLAVES_NUBE).

const LS = "nucleoos-idioma";

function guardado(): Idioma {
  try {
    const v = localStorage.getItem(LS);
    if (v === "en" || v === "pt") return v;
  } catch { /* sin navegador */ }
  return "es";
}

interface Ctx {
  idioma: Idioma;
  setIdioma: (i: Idioma) => void;
  t: (clave: string) => string;
}

const IdiomaCtx = createContext<Ctx>({ idioma: "es", setIdioma: () => {}, t: (c) => c });

export function IdiomaProvider({ children }: { children: ReactNode }) {
  const [idioma, setIdiomaSt] = useState<Idioma>(guardado);

  function setIdioma(i: Idioma) {
    setIdiomaSt(i);
    try {
      localStorage.setItem(LS, i);
    } catch { /* nada */ }
  }

  // El español es la fuente de verdad: nunca se muestra un hueco.
  const t = (clave: string): string => TEXTOS[idioma][clave] ?? TEXTOS.es[clave] ?? clave;

  return <IdiomaCtx.Provider value={{ idioma, setIdioma, t }}>{children}</IdiomaCtx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useIdioma() {
  return useContext(IdiomaCtx);
}
