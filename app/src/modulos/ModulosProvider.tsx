import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { guardarOcultos, leerOcultos } from "./modulos";

// Estado compartido de qué módulos están escondidos. El menú y Ajustes lo
// leen del mismo lugar, así que un cambio se ve al instante en los dos.
// La preferencia se respalda en la nube (clave en CLAVES_NUBE) y te sigue
// entre el computador y el teléfono.

interface Ctx {
  ocultos: Set<string>;
  esVisible: (id: string) => boolean;
  alternar: (id: string) => void;
  /** Reemplaza el set completo de una vez (lo usa el onboarding). */
  reemplazar: (ids: string[]) => void;
}

const ModulosCtx = createContext<Ctx>({
  ocultos: new Set(),
  esVisible: () => true,
  alternar: () => {},
  reemplazar: () => {},
});

export function ModulosProvider({ children }: { children: ReactNode }) {
  const [ocultos, setOcultos] = useState<Set<string>>(leerOcultos);

  const alternar = useCallback((id: string) => {
    setOcultos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      guardarOcultos(next);
      return next;
    });
  }, []);

  const esVisible = useCallback((id: string) => !ocultos.has(id), [ocultos]);

  const reemplazar = useCallback((ids: string[]) => {
    const next = new Set(ids);
    guardarOcultos(next);
    setOcultos(next);
  }, []);

  return <ModulosCtx.Provider value={{ ocultos, esVisible, alternar, reemplazar }}>{children}</ModulosCtx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useModulos() {
  return useContext(ModulosCtx);
}
