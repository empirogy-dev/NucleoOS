// Biblioteca curada de NucleoOS: los libros que de verdad ayudan a un
// cerebro TDAH, elegidos por impacto y no por moda. Cada uno con el
// porqué y sus ideas aplicadas a los módulos de la app.

export type ViaLibro = "tdah" | "habitos" | "emociones" | "relaciones";

export const VIAS_LIBRO: Array<{ key: ViaLibro; label: string }> = [
  { key: "tdah", label: "TDAH y foco" },
  { key: "habitos", label: "Hábitos" },
  { key: "emociones", label: "Emociones" },
  { key: "relaciones", label: "Relaciones" },
];

export interface Libro {
  id: string;
  titulo: string;
  autor: string;
  via: ViaLibro;
  emoji: string;
  porQue: string;
  ideas: string[];
}

export const LIBROS: Libro[] = [
  {
    id: "adhd20",
    titulo: "ADHD 2.0",
    autor: "Edward Hallowell y John Ratey",
    via: "tdah",
    emoji: "🧠",
    porQue: "Los dos médicos que llevan décadas estudiando el TDAH explican el cerebro que corre como Ferrari con frenos de bicicleta. Es EL libro para entenderte sin patologizarte.",
    ideas: [
      "El TDAH es un rasgo con superpoderes y costos, no un defecto de carácter.",
      "El ejercicio es medicina de primera línea: mueve el cuerpo antes de exigirle al cerebro (tu módulo Movimiento existe por esto).",
      "El entorno correcto vale más que el esfuerzo: diseña tu vida para tu cerebro, no contra él.",
    ],
  },
  {
    id: "howtoadhd",
    titulo: "How to ADHD",
    autor: "Jessica McCabe",
    via: "tdah",
    emoji: "🧰",
    porQue: "Escrito por alguien que vive con TDAH, no solo lo estudia. Una caja de herramientas práctica y sin vergüenza, con el tono cálido que usa esta app.",
    ideas: [
      "Trabaja con tu cerebro, no contra él: si algo te funciona raro pero funciona, es válido.",
      "Externaliza todo: el cerebro TDAH no es un buen archivador (por eso existe la captura rápida ⚡).",
      "Los sistemas le ganan a la fuerza de voluntad, siempre.",
    ],
  },
  {
    id: "nowhabit",
    titulo: "El hábito del ahora",
    autor: "Neil Fiore",
    via: "tdah",
    emoji: "⏳",
    porQue: "El mejor libro sobre procrastinación porque la trata como miedo y no como flojera. Su método de empezar sin presión calza perfecto con los bloques de foco.",
    ideas: [
      "Procrastinar es protegerte de la crítica y el agobio, no ser floja.",
      "Trabaja en bloques cortos con descansos ganados (tu pomodoro es exactamente esto).",
      "Agenda primero el descanso y el placer, y el trabajo cabe solo.",
    ],
  },
  {
    id: "atomicos",
    titulo: "Hábitos atómicos",
    autor: "James Clear",
    via: "habitos",
    emoji: "⚛️",
    porQue: "El manual de los sistemas pequeños. Tu módulo de Dirección ya usa sus cuatro leyes; el libro las profundiza con calma.",
    ideas: [
      "Un 1% mejor cada día se acumula: las metas automáticas de la app son este principio en vivo.",
      "Hazlo obvio y fácil: baja la fricción de lo que quieres y súbesela a lo que no.",
      "Cada acción es un voto por la identidad que construyes.",
    ],
  },
  {
    id: "tinyhabits",
    titulo: "Hábitos mínimos (Tiny Habits)",
    autor: "BJ Fogg",
    via: "habitos",
    emoji: "🌱",
    porQue: "La versión aún más pequeña que Clear, ideal para TDAH: cambios tan chicos que no activan la resistencia, anclados a lo que ya haces.",
    ideas: [
      "Ancla el hábito nuevo a uno existente: después de servirme café, medito un minuto.",
      "Celebra al tiro, aunque sea ridículo: la emoción es la que graba el hábito.",
      "Si un hábito no pega, achícalo en vez de esforzarte más.",
    ],
  },
  {
    id: "indistractable",
    titulo: "Indistractable",
    autor: "Nir Eyal",
    via: "habitos",
    emoji: "🎯",
    porQue: "La atención tratada como habilidad entrenable. Útil para el lado digital del TDAH: redes, celular, la pestaña número 47.",
    ideas: [
      "La distracción parte por dentro (incomodidad), no por el celular: nombra qué estás evitando.",
      "Convierte el tiempo en intención: cada bloque con un para qué (tu pomodoro con destino).",
      "Pactos de esfuerzo: ponle fricción a la distracción antes de que llegue.",
    ],
  },
  {
    id: "autocompasion",
    titulo: "Sé amable contigo mismo",
    autor: "Kristin Neff",
    via: "emociones",
    emoji: "💗",
    porQue: "La ciencia de la autocompasión, el antídoto exacto contra la culpa crónica que deja el TDAH. El tono cero culpa de NucleoOS viene de esta línea de investigación.",
    ideas: [
      "La autocrítica no motiva, paraliza: la evidencia es clarísima.",
      "Trátate como tratarías a tu mejor amiga en el mismo problema.",
      "Humanidad compartida: fallar no te separa del resto, te une.",
    ],
  },
  {
    id: "mindset",
    titulo: "Mindset",
    autor: "Carol Dweck",
    via: "emociones",
    emoji: "🌀",
    porQue: "La mentalidad de crecimiento explicada por su investigadora original. Cambia el 'soy mala para esto' por 'todavía no lo aprendo'.",
    ideas: [
      "Las habilidades se entrenan, no vienen selladas de fábrica.",
      "El 'todavía' cambia todo: no sé hacerlo todavía.",
      "Elogia el proceso y el intento, no el talento (también al hablarte a ti misma).",
    ],
  },
  {
    id: "cuatroacuerdos",
    titulo: "Los cuatro acuerdos",
    autor: "Miguel Ruiz",
    via: "emociones",
    emoji: "🕊",
    porQue: "Sabiduría simple para soltar la autoexigencia y el ruido ajeno. Corto, directo y releíble, perfecto para un cerebro que no quiere 400 páginas.",
    ideas: [
      "Sé impecable con tus palabras, sobre todo las que te dices a ti.",
      "No te tomes nada personal: lo que otros hacen habla de ellos.",
      "Haz siempre tu máximo posible, sabiendo que cambia según el día (y según la fase del ciclo).",
    ],
  },
  {
    id: "gottman",
    titulo: "Siete reglas de oro para vivir en pareja",
    autor: "John Gottman",
    via: "relaciones",
    emoji: "💞",
    porQue: "Cuarenta años observando parejas reales en laboratorio. Tu página de Relaciones ya cita sus hallazgos; el libro trae los ejercicios completos.",
    ideas: [
      "Responde a los pequeños intentos de conexión: voltear cuando te hablan es lo que más pesa.",
      "Los mapas de amor: conocer el mundo interno del otro, actualizado.",
      "La proporción mágica: cinco interacciones positivas por cada negativa.",
    ],
  },
  {
    id: "attached",
    titulo: "Maneras de amar (Attached)",
    autor: "Amir Levine y Rachel Heller",
    via: "relaciones",
    emoji: "🧲",
    porQue: "La teoría del apego aplicada a la vida adulta: por qué amas como amas, y cómo dejar de repetir el mismo baile.",
    ideas: [
      "Conocer tu estilo de apego (seguro, ansioso, evitativo) explica patrones de años.",
      "Necesitar cercanía no es dependencia: es biología sana.",
      "La comunicación efectiva le gana al juego de las indirectas, siempre.",
    ],
  },
  {
    id: "cnv",
    titulo: "Comunicación no violenta",
    autor: "Marshall Rosenberg",
    via: "relaciones",
    emoji: "🗣",
    porQue: "El método para pedir sin herir y escuchar sin defenderte. Sirve con la pareja, la mamá, los hijos y la jefa por igual.",
    ideas: [
      "Observación sin juicio: 'llegaste a las 9' en vez de 'siempre llegas tarde'.",
      "Detrás de cada reproche hay una necesidad sin nombrar: búscala.",
      "Pide en positivo y concreto, no en queja abstracta.",
    ],
  },
];

export function librosDe(via: ViaLibro): Libro[] {
  return LIBROS.filter((l) => l.via === via);
}
