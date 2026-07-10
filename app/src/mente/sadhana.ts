import type { FaseRespiracion } from "./practicas";

// Sadhana: práctica guiada de trabajo interior, inspirada en lo aprendido
// en India y presentada con respeto, en secuencias que cualquiera puede seguir.
// Cada sadhana es una serie de pasos que avanzan solos, con campana entre ellos.

export interface SadhanaPaso {
  titulo: string;
  emoji: string;
  minutos: number;
  guia: string;
  fases?: FaseRespiracion[];
}

export interface Sadhana {
  id: string;
  nombre: string;
  emoji: string;
  descripcion: string;
  intencion: string;
  pasos: SadhanaPaso[];
}

export function minutosSadhana(s: Sadhana): number {
  return s.pasos.reduce((sum, p) => sum + p.minutos, 0);
}

export const SADHANAS: Sadhana[] = [
  {
    id: "sadhana-amanecer",
    nombre: "Sadhana del amanecer",
    emoji: "🌅",
    descripcion: "Para empezar el día desde el centro, antes de que el mundo pida cosas.",
    intencion: "Llegar a mí antes de llegar al día.",
    pasos: [
      {
        titulo: "Llegar",
        emoji: "🪷",
        minutos: 2,
        guia: "Siéntate con la espalda digna y los hombros sueltos. No hay nada que lograr todavía. Solo nota que estás aquí, que ya despertaste, que este momento es tuyo.",
      },
      {
        titulo: "Respiración de caja",
        emoji: "📦",
        minutos: 3,
        guia: "Sigue el círculo: cuatro lados iguales, como dibujar una caja con el aire. Si la mente se va a la lista de pendientes, vuelve amable al conteo.",
        fases: [
          { etiqueta: "Inhala", segundos: 4, tipo: "inhala" },
          { etiqueta: "Sostén", segundos: 4, tipo: "sosten" },
          { etiqueta: "Exhala", segundos: 4, tipo: "exhala" },
          { etiqueta: "Sostén vacía", segundos: 4, tipo: "sosten" },
        ],
      },
      {
        titulo: "Intención del día",
        emoji: "🕯",
        minutos: 2,
        guia: "Pregúntate: ¿cómo quiero estar hoy, más allá de lo que haga? Elige una palabra, una sola. Calma, presencia, valentía, ternura. Respira con ella.",
      },
      {
        titulo: "Silencio",
        emoji: "🧘",
        minutos: 6,
        guia: "Suelta toda técnica. Deja que la respiración vaya a su ritmo y quédate como testigo. Cuando la mente se vaya, y se va a ir, volver es la práctica.",
      },
      {
        titulo: "Gratitud y cierre",
        emoji: "🙏",
        minutos: 2,
        guia: "Trae una cosa que agradeces de tu vida tal como es hoy. Sostenla en el pecho. Junta las manos si quieres, inclina la cabeza y entra a tu día.",
      },
    ],
  },
  {
    id: "sadhana-regular",
    nombre: "Sadhana para regular",
    emoji: "🌊",
    descripcion: "Para momentos de ansiedad, sobrecarga o después de un día difícil. Baja las revoluciones del sistema nervioso.",
    intencion: "Mi cuerpo es un lugar seguro al que puedo volver.",
    pasos: [
      {
        titulo: "Tocar tierra",
        emoji: "🌳",
        minutos: 2,
        guia: "Apoya bien los pies. Nombra en silencio 5 cosas que ves, 3 que escuchas y 1 que tocas. Estás aquí, no en el pensamiento que te asustó.",
      },
      {
        titulo: "Suspiro fisiológico",
        emoji: "🌬",
        minutos: 3,
        guia: "Doble inhalación por la nariz, exhalación larga por la boca. Es el mecanismo natural con el que el cuerpo se calma solo. Déjalo trabajar.",
        fases: [
          { etiqueta: "Inhala", segundos: 3, tipo: "inhala" },
          { etiqueta: "Un poco más", segundos: 1, tipo: "inhala" },
          { etiqueta: "Exhala largo", segundos: 6, tipo: "exhala" },
        ],
      },
      {
        titulo: "Escaneo breve",
        emoji: "🌊",
        minutos: 4,
        guia: "Recorre el cuerpo de los pies a la cabeza soltando lo que encuentres apretado: mandíbula, hombros, manos, entrecejo. No fuerces, solo invita.",
      },
      {
        titulo: "Corazón",
        emoji: "💛",
        minutos: 3,
        guia: "Mano al pecho. Respira lento imaginando que el aire entra y sale por el corazón, y dite en silencio: estoy bien, estoy aquí, ya pasó.",
        fases: [
          { etiqueta: "Inhala", segundos: 5, tipo: "inhala" },
          { etiqueta: "Exhala", segundos: 5, tipo: "exhala" },
        ],
      },
    ],
  },
  {
    id: "sadhana-noche",
    nombre: "Sadhana de la noche",
    emoji: "🌙",
    descripcion: "Para cerrar el día y entregarlo, en vez de llevártelo a la cama.",
    intencion: "El día terminó. Me doy permiso de descansar.",
    pasos: [
      {
        titulo: "Soltar el día",
        emoji: "🍂",
        minutos: 2,
        guia: "Repasa el día sin juzgarlo, como quien mira fotos. Lo hecho, hecho está; lo pendiente puede esperar a mañana. Con cada exhalación, entrégalo.",
      },
      {
        titulo: "Exhalación larga",
        emoji: "🍃",
        minutos: 4,
        guia: "Inhala 4, exhala 8. La exhalación larga le dice a tu cuerpo que ya no hay nada que perseguir ni de qué huir.",
        fases: [
          { etiqueta: "Inhala", segundos: 4, tipo: "inhala" },
          { etiqueta: "Exhala", segundos: 8, tipo: "exhala" },
        ],
      },
      {
        titulo: "Cuerpo que se apaga",
        emoji: "🌊",
        minutos: 4,
        guia: "Recorre el cuerpo de la cabeza a los pies, apagando cada zona como quien apaga las luces de una casa: frente, mandíbula, hombros, brazos, piernas.",
      },
      {
        titulo: "Gratitud de cierre",
        emoji: "🙏",
        minutos: 2,
        guia: "Una cosa buena de hoy, aunque el día haya sido duro. Existió, y tú la viste. Con eso basta. Buenas noches.",
      },
    ],
  },
];
