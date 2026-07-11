// Calendario lunar: fase calculada con el mes sinódico
// desde la luna nueva del 6 de enero de 2000.
const SINODICO = 29.53058867;
const EPOCA = Date.UTC(2000, 0, 6, 18, 14);

export function edadLunar(fecha: Date): number {
  const dias = (fecha.getTime() - EPOCA) / 86400000;
  return ((dias % SINODICO) + SINODICO) % SINODICO;
}

export interface FaseLunar {
  nombre: string;
  emoji: string;
  consejo: string;
}

export function faseLunar(fecha: Date): FaseLunar {
  const edad = edadLunar(fecha);
  if (edad < 1.85) return { nombre: "Luna nueva", emoji: "🌑", consejo: "Momento de sembrar intenciones y empezar de a poco." };
  if (edad < 5.54) return { nombre: "Creciente", emoji: "🌒", consejo: "Energía para dar los primeros pasos de lo que sembraste." };
  if (edad < 9.23) return { nombre: "Cuarto creciente", emoji: "🌓", consejo: "Buen momento para decidir y comprometerte." };
  if (edad < 12.91) return { nombre: "Gibosa creciente", emoji: "🌔", consejo: "Afina los detalles, ya casi florece." };
  if (edad < 16.61) return { nombre: "Luna llena", emoji: "🌕", consejo: "Celebra lo logrado y suelta lo que pesa." };
  if (edad < 20.3) return { nombre: "Gibosa menguante", emoji: "🌖", consejo: "Agradece y comparte lo aprendido." };
  if (edad < 23.99) return { nombre: "Cuarto menguante", emoji: "🌗", consejo: "Ordena, limpia y cierra pendientes." };
  if (edad < 27.68) return { nombre: "Menguante", emoji: "🌘", consejo: "Descansa y recupera energía sin culpa." };
  return { nombre: "Luna nueva", emoji: "🌑", consejo: "Momento de sembrar intenciones y empezar de a poco." };
}

// ---------- Cielo próximo: eventos astronómicos curados ----------
// Fechas aproximadas para el hemisferio norte; la hora exacta varía por ciudad.
export interface EventoCielo {
  fecha: string;
  nombre: string;
  detalle: string;
}

export const EVENTOS_CIELO: EventoCielo[] = [
  { fecha: "2026-07-30", nombre: "Delta Acuáridas", detalle: "Lluvia de meteoros suave, mejor después de medianoche mirando al sur." },
  { fecha: "2026-08-12", nombre: "Eclipse total de sol", detalle: "Histórico: la totalidad cruza Islandia y España." },
  { fecha: "2026-08-13", nombre: "Perseidas", detalle: "La gran lluvia del verano, decenas de meteoros por hora en cielo oscuro." },
  { fecha: "2026-08-28", nombre: "Eclipse parcial de luna", detalle: "Visible desde América al anochecer." },
  { fecha: "2026-09-22", nombre: "Equinoccio", detalle: "Día y noche casi iguales: empieza el otoño en el norte." },
  { fecha: "2026-10-21", nombre: "Oriónidas", detalle: "Polvo del cometa Halley, en la madrugada." },
  { fecha: "2026-11-17", nombre: "Leónidas", detalle: "Meteoros rápidos y brillantes después de medianoche." },
  { fecha: "2026-12-13", nombre: "Gemínidas", detalle: "La lluvia más generosa del año, si el frío no te detiene." },
  { fecha: "2026-12-21", nombre: "Solsticio", detalle: "La noche más larga del año en el norte. Buen cierre de ciclo." },
];

/** Los próximos eventos del cielo desde hoy. */
export function proximosEventosCielo(desdeIso: string, n = 4): EventoCielo[] {
  return EVENTOS_CIELO.filter((e) => e.fecha >= desdeIso).slice(0, n);
}

/** Próximas luna llena y luna nueva desde hoy. */
export function proximasLunas(desde: Date): { llena: Date; nueva: Date } {
  const d = new Date(desde);
  let llena: Date | null = null;
  let nueva: Date | null = null;
  for (let i = 0; i < 31 && (!llena || !nueva); i += 1) {
    const edad = edadLunar(d);
    if (!llena && edad >= 12.91 && edad < 16.61) llena = new Date(d);
    if (!nueva && (edad < 1.85 || edad >= 27.68) && i > 2) nueva = new Date(d);
    d.setDate(d.getDate() + 1);
  }
  return { llena: llena ?? new Date(desde), nueva: nueva ?? new Date(desde) };
}
