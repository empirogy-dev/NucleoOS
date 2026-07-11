// Mente: respiraciones guiadas y meditaciones con duración a elegir.

export interface FaseRespiracion {
  etiqueta: string;
  segundos: number;
  tipo: "inhala" | "sosten" | "exhala";
}

export type CategoriaMente = "regulacion" | "mindfulness" | "corazon" | "mentalidad";

export const CATEGORIAS_MENTE: Array<{ key: CategoriaMente; emoji: string; label: string; descripcion: string }> = [
  { key: "regulacion", emoji: "🌊", label: "Regulación", descripcion: "Para calmar el sistema nervioso cuando aprieta." },
  { key: "mindfulness", emoji: "🍃", label: "Mindfulness", descripcion: "Para volver al presente, quieta o en movimiento." },
  { key: "corazon", emoji: "💛", label: "Corazón", descripcion: "Gratitud, ternura y coherencia con lo que amas." },
  { key: "mentalidad", emoji: "🌞", label: "Mentalidad", descripcion: "Para hablarte mejor y pensar con más amplitud." },
];

export interface Practica {
  id: string;
  nombre: string;
  emoji: string;
  tipo: "respiracion" | "meditacion";
  categoria: CategoriaMente;
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
    categoria: "regulacion",
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
    categoria: "regulacion",
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
    id: "resp-suspiro",
    nombre: "Suspiro fisiológico",
    emoji: "🌬",
    tipo: "respiracion",
    categoria: "regulacion",
    descripcion: "Doble inhalación y exhalación larga. El botón de calma más rápido que conoce tu sistema nervioso.",
    duraciones: [2, 3, 5],
    pasos: [
      "Inhala por la nariz hasta llenar los pulmones.",
      "Sin soltar, inhala un poco más, como un segundo sorbo de aire.",
      "Exhala largo por la boca, dejando caer los hombros.",
      "Es el mismo suspiro que el cuerpo hace solo después de llorar. Aquí lo usamos a propósito.",
    ],
    fases: [
      { etiqueta: "Inhala", segundos: 3, tipo: "inhala" },
      { etiqueta: "Un poco más", segundos: 1, tipo: "inhala" },
      { etiqueta: "Exhala largo", segundos: 6, tipo: "exhala" },
    ],
  },
  {
    id: "resp-exhala",
    nombre: "Exhalación larga",
    emoji: "🍃",
    tipo: "respiracion",
    categoria: "regulacion",
    descripcion: "Cuando la exhalación dura el doble que la inhalación, el cuerpo entiende que el peligro pasó.",
    duraciones: [3, 5, 10],
    pasos: [
      "Inhala suave por la nariz contando hasta 4.",
      "Exhala por la nariz o la boca contando hasta 8, sin forzar.",
      "Si 8 es mucho, empieza con 6. Lo que importa es que salir dure más que entrar.",
    ],
    fases: [
      { etiqueta: "Inhala", segundos: 4, tipo: "inhala" },
      { etiqueta: "Exhala", segundos: 8, tipo: "exhala" },
    ],
  },
  {
    id: "resp-zumbido",
    nombre: "Zumbido del nervio vago",
    emoji: "🐝",
    tipo: "respiracion",
    categoria: "regulacion",
    descripcion: "Exhalar zumbando estimula el nervio vago, el freno natural del sistema nervioso. Simple y potente.",
    duraciones: [3, 5, 10],
    pasos: [
      "Cierra los labios suaves y relaja la mandíbula.",
      "Inhala por la nariz, y al exhalar haz un zumbido como de abeja, mmm.",
      "Siente la vibración en el pecho, la garganta y la cara.",
      "Mientras más larga y cómoda la exhalación, más profundo el efecto.",
    ],
    fases: [
      { etiqueta: "Inhala", segundos: 4, tipo: "inhala" },
      { etiqueta: "Exhala zumbando", segundos: 8, tipo: "exhala" },
    ],
  },
  {
    id: "resp-corazon",
    nombre: "Conexión con el corazón",
    emoji: "💛",
    tipo: "respiracion",
    categoria: "corazon",
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
    categoria: "corazon",
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
    categoria: "mindfulness",
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
    id: "med-grounding",
    nombre: "Grounding 5 4 3 2 1",
    emoji: "🌳",
    tipo: "meditacion",
    categoria: "regulacion",
    descripcion: "Vuelve al presente por los sentidos. Perfecta cuando la mente se dispara o la ansiedad aprieta.",
    duraciones: [3, 5, 10],
    pasos: [
      "Apoya bien los pies en el suelo y siente su peso.",
      "Nombra 5 cosas que puedes ver, con detalle y sin apuro.",
      "Nombra 4 cosas que puedes tocar. Tócalas de verdad si puedes.",
      "Nombra 3 sonidos que puedes escuchar ahora mismo.",
      "Nombra 2 olores, o 2 olores que te gusten si no hueles nada.",
      "Nombra 1 sabor, y quédate un momento aquí, donde estás a salvo.",
    ],
  },
  {
    id: "med-tension",
    nombre: "Para la tensión emocional",
    emoji: "🫂",
    tipo: "meditacion",
    categoria: "regulacion",
    descripcion: "Cuando algo pesa en el pecho o la garganta. No para arreglarlo, para acompañarlo.",
    duraciones: [5, 10, 15],
    pasos: [
      "Siéntate y pon una mano donde sientas la tensión.",
      "Ponle nombre a lo que sientes: rabia, pena, miedo, mezcla. Nombrar ya calma.",
      "Ubícala en el cuerpo: ¿dónde vive, qué forma tiene, se mueve?",
      "Respira hacia ese lugar, como si el aire pudiera llegarle directamente.",
      "No intentes que se vaya. Solo hazle compañía, como a una amiga triste.",
      "Cierra agradeciéndote por haberte quedado contigo.",
    ],
  },
  {
    id: "med-silencio",
    nombre: "Meditación en silencio",
    emoji: "🧘",
    tipo: "meditacion",
    categoria: "mindfulness",
    descripcion: "Solo tú, tu respiración y una campana al inicio y al final. Para cuando ya no necesitas guía.",
    duraciones: [5, 10, 15, 20, 30],
    pasos: [
      "Elige una postura que puedas sostener sin dolor.",
      "Deja que la respiración vaya a su propio ritmo, sin controlarla.",
      "Cuando la mente se vaya (se va a ir), vuelve amable a la respiración.",
      "La campana te avisará cuando termine. Hasta entonces, nada que hacer.",
    ],
  },
  {
    id: "med-mariposa",
    nombre: "Abrazo de mariposa",
    emoji: "🦋",
    tipo: "meditacion",
    categoria: "regulacion",
    descripcion: "Te abrazas y alternas toques suaves en los hombros. Regula el sistema nervioso, se usa incluso después de sustos grandes.",
    duraciones: [3, 5, 10],
    pasos: [
      "Cruza los brazos sobre el pecho, cada mano en el hombro contrario.",
      "Alterna toques suaves y lentos: izquierda, derecha, izquierda, como un aleteo.",
      "Respira lento mientras tanto, con la exhalación un poco más larga.",
      "Si aparecen emociones, déjalas pasar como nubes, sin pelearles.",
      "Termina quedándote un momento en el abrazo, quieta.",
    ],
  },
  {
    id: "med-frio",
    nombre: "Exposición al frío",
    emoji: "🧊",
    tipo: "meditacion",
    categoria: "regulacion",
    descripcion: "Terminar la ducha con agua fría entrena al sistema nervioso a mantenerse en calma bajo estrés.",
    duraciones: [2, 3, 5],
    pasos: [
      "Dúchate normal, y al final gira la llave al frío.",
      "El primer impulso es tensarte y respirar corto. Ahí está el ejercicio: suelta los hombros.",
      "Exhala largo y lento, como si le dijeras al cuerpo que no hay peligro.",
      "Empieza con 15 o 30 segundos y sube de a poco cada semana.",
      "Sal, sécate y nota la ola de calor y claridad que llega después.",
      "Si tienes alguna condición cardíaca, consúltalo antes con tu médico.",
    ],
  },
  {
    id: "med-caminata",
    nombre: "Caminata consciente",
    emoji: "🚶",
    tipo: "meditacion",
    categoria: "mindfulness",
    descripcion: "Meditación en movimiento: caminar lento con toda la atención puesta en caminar. También regula.",
    duraciones: [10, 15, 20, 30],
    pasos: [
      "Elige un tramo tranquilo, puede ser tu pasillo, la cuadra o un parque.",
      "Camina más lento de lo normal, sintiendo cómo cada pie toca el suelo.",
      "Nota el balanceo de los brazos, el aire en la cara, los sonidos alrededor.",
      "Cuando la mente se vaya a la lista de pendientes, vuelve a las plantas de los pies.",
      "No hay meta ni destino. El destino es cada paso.",
    ],
  },
  {
    id: "med-pausa",
    nombre: "Pausa consciente",
    emoji: "🍵",
    tipo: "meditacion",
    categoria: "mindfulness",
    descripcion: "Tres minutos para cortar el piloto automático en medio del día. Tu mindfulness diario mínimo.",
    duraciones: [3, 5],
    pasos: [
      "Detén lo que estás haciendo y suelta los hombros.",
      "Pregúntate: ¿qué está pasando en mí ahora? Pensamientos, emociones, cuerpo.",
      "Lleva la atención a la respiración, solo unas cuantas rondas.",
      "Amplía la atención al cuerpo completo, como si respiraras con todo él.",
      "Vuelve a tu día, pero ya no en automático.",
    ],
  },
  {
    id: "med-compasion",
    nombre: "Amor propio",
    emoji: "💗",
    tipo: "meditacion",
    categoria: "corazon",
    descripcion: "Hablarte como le hablarías a alguien que amas. Autocompasión, no autoexigencia.",
    duraciones: [5, 10, 15],
    pasos: [
      "Pon una mano en el pecho y siente su calor.",
      "Reconoce lo que estás viviendo: esto es difícil, y está bien que lo sea.",
      "Recuerda que no estás sola en esto: ser humana incluye días duros.",
      "Ofrécete en silencio: que me trate con ternura, que me dé lo que necesito, que esté en paz.",
      "Piensa qué le dirías a tu mejor amiga en tu situación. Ahora dítelo a ti.",
    ],
  },
  {
    id: "med-afirmaciones",
    nombre: "Afirmaciones",
    emoji: "🌞",
    tipo: "meditacion",
    categoria: "mentalidad",
    descripcion: "Frases en presente para entrenar la voz con la que te hablas. Repetición amable, no pensamiento mágico.",
    duraciones: [3, 5],
    pasos: [
      "Siéntate derecha y respira profundo dos veces.",
      "Repite lento, sintiendo cada frase: estoy construyendo la vida que quiero.",
      "Merezco calma, orden y cosas buenas.",
      "Puedo hacer cosas difíciles, ya lo he demostrado.",
      "Hoy me trato como a alguien que amo.",
      "Elige la frase que más te costó creer y repítela tres veces más.",
    ],
  },
  {
    id: "med-reencuadre",
    nombre: "Reencuadre de un pensamiento",
    emoji: "🔄",
    tipo: "meditacion",
    categoria: "mentalidad",
    descripcion: "Toma un pensamiento que te aprieta y míralo desde otro ángulo. Inspirado en terapia cognitiva.",
    duraciones: [5, 10],
    pasos: [
      "Identifica el pensamiento que te está pesando y dilo en una frase.",
      "Pregúntate: ¿qué evidencia real tengo a favor y en contra?",
      "¿Qué le diría a una amiga que pensara exactamente esto?",
      "¿Cómo se ve esto desde dentro de un año?",
      "Reescribe el pensamiento en una versión más justa contigo, ni rosa ni catastrófica.",
      "Si quieres dejarlo por escrito, el Diario está a un toque de distancia.",
    ],
  },
  {
    id: "med-tresbuenas",
    nombre: "Tres cosas buenas",
    emoji: "✨",
    tipo: "meditacion",
    categoria: "mentalidad",
    descripcion: "La práctica clásica de la psicología positiva: notar lo bueno y entender tu parte en ello.",
    duraciones: [5],
    pasos: [
      "Respira profundo y repasa tu día sin apuro.",
      "Encuentra tres cosas que salieron bien, por chicas que sean.",
      "Con cada una, pregúntate: ¿qué hice yo para que pasara?",
      "Nota cómo se siente el cuerpo al recordarlas.",
      "Si quieres que queden guardadas, escríbelas en el Diario al terminar.",
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
