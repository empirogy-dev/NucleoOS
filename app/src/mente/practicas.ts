// Mente: respiraciones guiadas y meditaciones con duración a elegir.

export interface FaseRespiracion {
  etiqueta: string;
  segundos: number;
  tipo: "inhala" | "sosten" | "exhala";
}

export interface Practica {
  id: string;
  nombre: string;
  emoji: string;
  tipo: "respiracion" | "meditacion";
  descripcion: string;
  duraciones: number[]; // minutos elegibles
  pasos: string[];
  fases?: FaseRespiracion[];
}

export const RESPIRACIONES: Practica[] = [
  {
    id: "resp-478",
    nombre: "Respiración 4 7 8",
    emoji: "🫁",
    tipo: "respiracion",
    descripcion: "Calma el sistema nervioso en minutos. Ideal antes de dormir o en momentos de ansiedad.",
    duraciones: [2, 3, 5, 8],
    pasos: [
      "Siéntate cómoda y suelta los hombros.",
      "Sigue el círculo: crece cuando inhalas, se queda quieto cuando sostienes y baja cuando exhalas.",
      "Exhala por la boca con un suspiro suave.",
    ],
    fases: [
      { etiqueta: "Inhala", segundos: 4, tipo: "inhala" },
      { etiqueta: "Sostén", segundos: 7, tipo: "sosten" },
      { etiqueta: "Exhala", segundos: 8, tipo: "exhala" },
    ],
  },
  {
    id: "resp-caja",
    nombre: "Respiración de caja",
    emoji: "📦",
    tipo: "respiracion",
    descripcion: "La que se usa para recuperar el foco bajo presión. Cuatro lados iguales, como una caja.",
    duraciones: [2, 4, 6, 10],
    pasos: [
      "Endereza la espalda sin tensarla.",
      "Cada lado de la caja dura 4 segundos: inhala, sostén, exhala, sostén vacía.",
      "Si te pierdes, vuelve al círculo. No hay apuro.",
    ],
    fases: [
      { etiqueta: "Inhala", segundos: 4, tipo: "inhala" },
      { etiqueta: "Sostén", segundos: 4, tipo: "sosten" },
      { etiqueta: "Exhala", segundos: 4, tipo: "exhala" },
      { etiqueta: "Sostén vacía", segundos: 4, tipo: "sosten" },
    ],
  },
  {
    id: "resp-corazon",
    nombre: "Conexión con el corazón",
    emoji: "💛",
    tipo: "respiracion",
    descripcion: "Coherencia cardíaca simple: cinco segundos adentro, cinco afuera, la atención en el pecho.",
    duraciones: [3, 5, 10, 15],
    pasos: [
      "Pon una mano sobre el pecho.",
      "Imagina que el aire entra y sale directamente por el corazón.",
      "Trae un recuerdo que te dé ternura y sostenlo mientras respiras.",
    ],
    fases: [
      { etiqueta: "Inhala", segundos: 5, tipo: "inhala" },
      { etiqueta: "Exhala", segundos: 5, tipo: "exhala" },
    ],
  },
];

export const MEDITACIONES: Practica[] = [
  {
    id: "med-gratitud",
    nombre: "Meditación de gratitud",
    emoji: "🙏",
    tipo: "meditacion",
    descripcion: "Entrena a tu mente para notar lo bueno que ya existe en tu vida.",
    duraciones: [5, 10, 15],
    pasos: [
      "Cierra los ojos y respira profundo tres veces.",
      "Trae a tu mente una persona que te hace bien. Agradécele en silencio.",
      "Ahora un lugar donde te sientes en paz. Recórrelo con la memoria.",
      "Ahora algo de tu cuerpo que funciona sin que se lo pidas. Dale las gracias.",
      "Termina notando cómo se siente tu pecho.",
    ],
  },
  {
    id: "med-escaneo",
    nombre: "Escaneo corporal",
    emoji: "🌊",
    tipo: "meditacion",
    descripcion: "Recorre tu cuerpo soltando tensión, parte por parte. Perfecto para reconectar contigo.",
    duraciones: [10, 15, 20, 30],
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
    id: "med-silencio",
    nombre: "Meditación en silencio",
    emoji: "🧘",
    tipo: "meditacion",
    descripcion: "Solo tú, tu respiración y una campana al inicio y al final. Para cuando ya no necesitas guía.",
    duraciones: [5, 10, 15, 20, 30],
    pasos: [
      "Elige una postura que puedas sostener sin dolor.",
      "Deja que la respiración vaya a su propio ritmo, sin controlarla.",
      "Cuando la mente se vaya (se va a ir), vuelve amable a la respiración.",
      "La campana te avisará cuando termine. Hasta entonces, nada que hacer.",
    ],
  },
];

export const PRACTICAS: Practica[] = [...RESPIRACIONES, ...MEDITACIONES];

// ---------- Historial de sesiones (local, por ahora) ----------
const KEY = "nucleoos-mente";

export interface Sesion {
  fecha: string; // YYYY-MM-DD
  id: string;
  nombre: string;
  minutos: number;
}

export function listSesiones(): Sesion[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Sesion[]) : [];
  } catch {
    return [];
  }
}

export function guardarSesion(s: Sesion) {
  const todas = [s, ...listSesiones()].slice(0, 300);
  localStorage.setItem(KEY, JSON.stringify(todas));
}
