import { createContext, useContext, useState } from "react";
import { hoyLocal, setFechaActivaGlobal } from "../lib/fechas";

// Contexto del modo "día pasado": una sola fecha activa para toda la app.
// El banner del Layout la muestra y cualquier página puede cambiarla.

interface FechaCtx {
  fecha: string;
  esHoy: boolean;
  setFecha: (f: string) => void;
  volverAHoy: () => void;
}

const Ctx = createContext<FechaCtx>({
  fecha: hoyLocal(),
  esHoy: true,
  setFecha: () => undefined,
  volverAHoy: () => undefined,
});

export function FechaActivaProvider({ children }: { children: React.ReactNode }) {
  const [fecha, setFechaState] = useState(hoyLocal());

  function setFecha(f: string) {
    const limpia = f && f <= hoyLocal() ? f : hoyLocal();
    setFechaState(limpia);
    setFechaActivaGlobal(limpia);
  }

  function volverAHoy() {
    setFechaState(hoyLocal());
    setFechaActivaGlobal(null);
  }

  return (
    <Ctx.Provider value={{ fecha, esHoy: fecha === hoyLocal(), setFecha, volverAHoy }}>
      {children}
    </Ctx.Provider>
  );
}

export function useFechaActiva() {
  return useContext(Ctx);
}

/** Fecha larga y humana: "martes 15 de julio". */
export function fechaLarga(iso: string): string {
  return new Date(`${iso}T00:00:00`)
    .toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })
    .replace(",", "");
}
