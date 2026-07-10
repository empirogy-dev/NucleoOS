// Bienestar: prácticas guiadas y calendario lunar (pedido de la usuaria).

export interface Practica {
  nombre: string;
  emoji: string;
  minutos: number;
  descripcion: string;
  pasos: string[];
}

export const PRACTICAS: Practica[] = [
  {
    nombre: "Respiración 4 7 8",
    emoji: "🫁",
    minutos: 3,
    descripcion: "Calma el sistema nervioso en minutos. Ideal antes de dormir o en momentos de ansiedad.",
    pasos: [
      "Siéntate cómoda y suelta los hombros.",
      "Inhala por la nariz contando hasta 4.",
      "Sostén el aire contando hasta 7.",
      "Exhala por la boca contando hasta 8, con un suspiro suave.",
      "Repite el ciclo hasta que termine el tiempo.",
    ],
  },
  {
    nombre: "Respiración de caja",
    emoji: "📦",
    minutos: 4,
    descripcion: "La que usan para recuperar el foco bajo presión. Cuatro lados iguales, como una caja.",
    pasos: [
      "Inhala contando hasta 4.",
      "Sostén contando hasta 4.",
      "Exhala contando hasta 4.",
      "Sostén vacía contando hasta 4, y vuelve a empezar.",
    ],
  },
  {
    nombre: "Meditación de gratitud",
    emoji: "🙏",
    minutos: 5,
    descripcion: "Entrena a tu mente para notar lo bueno que ya existe en tu vida.",
    pasos: [
      "Cierra los ojos y respira profundo tres veces.",
      "Trae a tu mente una persona que te hace bien. Agradécele en silencio.",
      "Ahora un lugar donde te sientes en paz. Recórrelo con la memoria.",
      "Ahora algo de tu cuerpo que funciona sin que se lo pidas. Dale las gracias.",
      "Termina notando cómo se siente tu pecho.",
    ],
  },
  {
    nombre: "Escaneo corporal",
    emoji: "🌊",
    minutos: 8,
    descripcion: "Recorre tu cuerpo soltando tensión, parte por parte. Perfecto para reconectar contigo.",
    pasos: [
      "Acuéstate o siéntate con la espalda apoyada.",
      "Lleva la atención a tus pies. Nota su temperatura y suéltalos.",
      "Sube lento: piernas, caderas, abdomen, pecho.",
      "Suelta los hombros, los brazos, las manos.",
      "Afloja la mandíbula, el entrecejo, el cuero cabelludo.",
      "Quédate un momento sintiendo el cuerpo completo.",
    ],
  },
  {
    nombre: "Conexión con el corazón",
    emoji: "💛",
    minutos: 5,
    descripcion: "Lleva la atención al pecho y respira desde ahí. Coherencia cardíaca simple.",
    pasos: [
      "Pon una mano sobre el pecho.",
      "Respira lento: inhala 5 segundos, exhala 5 segundos.",
      "Imagina que el aire entra y sale directamente por el corazón.",
      "Trae un recuerdo que te dé ternura y sostenlo mientras respiras.",
    ],
  },
];

// ---------- Calendario lunar ----------
// Fase calculada con el mes sinódico desde la luna nueva del 6 de enero de 2000.
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
