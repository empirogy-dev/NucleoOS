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
