import type { Guion, PasoTour } from "./tour";

// Lo que dice el tour, módulo por módulo.
//
// Tres reglas de redacción, que valen para cada línea de este archivo:
//
//  1. Se dice para qué sirve, no cómo se llama. "Sube la cartola que te manda
//     el banco" en vez de "importador de estados de cuenta". Quien llega aquí
//     no conoce el vocabulario de la app, y si lo conociera no necesitaría el
//     tour.
//  2. Un paso, una idea. Si hay que explicar dos cosas, son dos pasos.
//  3. Nada de promesas. Si algo funciona solo en ciertos países o solo con
//     ciertos datos, se dice en el mismo paso.
//
// Los selectores apuntan a cosas que ya existen en la app (la barra de
// pestañas, la fila de números, el menú). Los `data-tour` se agregaron solo
// donde hacía falta señalar un botón concreto y no había forma estable de
// alcanzarlo.

export const TOUR_GENERAL = "general";

const general: PasoTour[] = [
  {
    id: "hola",
    ruta: "/",
    titulo: "Te muestro la app en un minuto",
    texto: "Son siete pasos cortos. Puedes saltarlos cuando quieras con el botón de abajo, y volver a verlos desde Ajustes.",
  },
  {
    id: "menu",
    ruta: "/",
    objetivo: "[data-tour='menu']",
    titulo: "Aquí vive todo",
    texto: "El menú está agrupado por para qué sirve cada cosa: ver tu panorama, cuidar tu núcleo, ordenar tu vida. Si hay secciones que no te sirven, se apagan en Ajustes y el menú se achica.",
  },
  {
    id: "captura",
    ruta: "/",
    objetivo: "[data-tour='captura']",
    titulo: "Anota sin perder lo que estabas haciendo",
    texto: "Este botón abre una nota rápida desde cualquier pantalla. Escribes la idea, se guarda, y sigues en lo tuyo. Después decides si era una tarea, un gasto o nada.",
  },
  {
    id: "inicio",
    ruta: "/",
    objetivo: "[data-tour='pagina']",
    titulo: "Inicio es tu día de hoy",
    texto: "Tus tareas, tu pulso del día y el siguiente paso sugerido. Si algún día no registras nada, no pasa nada: la app no te va a retar.",
  },
  {
    id: "revision",
    ruta: "/revision",
    objetivo: "[data-tour='pagina']",
    titulo: "Revisión convierte lo registrado en claridad",
    texto: "Junta lo de todos los módulos por día, semana y mes, encuentra patrones entre áreas, y arma un informe que puedes exportar y llevarle a alguien.",
  },
  {
    id: "ajustes",
    ruta: "/ajustes",
    objetivo: "[data-tour='pagina']",
    titulo: "Ajustes decide qué app tienes",
    texto: "Aquí eliges tu país y tu moneda, qué secciones ves, el tema de colores y funciones que solo le sirven a algunas personas, como el ayuno o el auto de trabajo. El país importa más de lo que parece: define qué te puede ofrecer la app.",
  },
  {
    id: "fin",
    ruta: "/",
    titulo: "Eso es todo",
    texto: "Cuando entres a una sección por primera vez, te muestro lo suyo en tres o cuatro pasos. Si prefieres explorar sola, salta ese tour y no vuelve a aparecer.",
  },
];

// ---------- Los módulos ----------

const inicio: PasoTour[] = [
  {
    id: "ini-tareas",
    objetivo: "[data-tour='pagina']",
    titulo: "Tu día, sin abrir nada más",
    texto: "Las tareas de hoy, cómo vienes, y una sugerencia de por dónde seguir. Si un día no hay nada anotado, la pantalla se queda tranquila y no te pide cuentas.",
  },
  {
    id: "ini-brujula",
    objetivo: "[data-tour='pagina']",
    titulo: "La brújula y el pulso",
    texto: "La brújula muestra cuánto avanzan tus metas de Dirección. El pulso son los números del día que vienen de Energía, Hábitos y Movimiento, sin que tengas que ir a buscarlos.",
  },
  {
    id: "ini-orden",
    objetivo: "[data-tour='pagina']",
    titulo: "Se ordena como tú quieras",
    texto: "Las tarjetas se arrastran: pon arriba lo que de verdad miras y deja abajo lo demás. El orden se guarda y te sigue entre dispositivos.",
  },
];

const finanzas: PasoTour[] = [
  {
    id: "fin-tabs",
    objetivo: ".ftabs",
    titulo: "Finanzas por pestañas",
    texto: "Resumen es el mes de un vistazo, Transacciones es tu libro de movimientos, y Reporte es el informe que explica a dónde se fue la plata. Las demás las vas a necesitar más adelante.",
  },
  {
    id: "fin-registrar",
    objetivo: "[data-tour='fin-registrar']",
    titulo: "Registrar un gasto o un ingreso",
    texto: "Lo escribes una vez y queda con su fecha, su categoría y su cuenta. También puedes tomarle foto a la boleta y que los datos se llenen solos.",
  },
  {
    id: "fin-cartola",
    objetivo: "[data-tour='fin-cartola']",
    titulo: "La cartola es el atajo",
    texto: "La cartola es el archivo con todos tus movimientos que te da el banco: entras a tu banco por internet, descargas el mes (CSV, PDF u OFX), y lo subes aquí. En un minuto tienes registrado lo que a mano te tomaría una hora.",
  },
  {
    id: "fin-reporte",
    objetivo: ".ftabs",
    titulo: "El informe para mirar de verdad",
    texto: "En la pestaña Reporte están los gráficos, los cargos que se te cobran solos y dónde hay plata que recuperar. Se exporta a PDF o a planilla, para que lo revise un contador si quieres.",
  },
];

const energia: PasoTour[] = [
  {
    id: "ene-tabs",
    objetivo: ".ftabs",
    titulo: "Tu combustible diario",
    texto: "Hoy es lo del día (agua, proteína, cómo andas de energía), Nutrición son tus comidas, y las otras pestañas guardan el sueño, el ciclo y tus datos de salud.",
  },
  {
    id: "ene-plato",
    objetivo: ".page",
    titulo: "Fotografía el plato",
    texto: "Le tomas una foto a tu comida y la app estima calorías y proteína. Es una guía, no una balanza: sirve para ver la tendencia, no para pesar cada cosa.",
  },
  {
    id: "ene-registro",
    objetivo: ".page",
    titulo: "Registrar toma segundos",
    texto: "Los vasos de agua y tu nivel de energía se marcan con un toque. Con dos semanas de eso, Revisión ya puede decirte cómo se relaciona tu energía con lo que duermes y te mueves.",
  },
];

const habitos: PasoTour[] = [
  {
    id: "hab-tabs",
    objetivo: ".ftabs",
    titulo: "Hábitos, retos y rutinas",
    texto: "Un hábito es algo que quieres sostener siempre. Un reto tiene principio y fin, como treinta días sin azúcar. Una rutina es una secuencia de pasos que haces de corrido.",
  },
  {
    id: "hab-marcar",
    objetivo: ".page",
    titulo: "Se marca con un toque",
    texto: "Marcas el día y el cuadrito se pinta con el color del hábito. La cuadrícula parte el día que lo creaste, así que las rachas no mienten.",
  },
  {
    id: "hab-auto",
    objetivo: ".page",
    titulo: "Algunos se marcan solos",
    texto: "Si registras un entrenamiento en Movimiento, tu hábito de ejercicio queda marcado sin que hagas nada más. La idea es anotar una vez, no dos.",
  },
];

const movimiento: PasoTour[] = [
  {
    id: "mov-rutinas",
    objetivo: ".page",
    titulo: "Rutinas guiadas o entreno libre",
    texto: "Puedes seguir una rutina paso a paso, o simplemente anotar qué hiciste y cuántos minutos. Las dos cosas suman a tus minutos de la semana.",
  },
  {
    id: "mov-suma",
    objetivo: ".page",
    titulo: "Todo cae en el mismo lugar",
    texto: "Lo que registras aquí aparece en Energía, marca tu hábito de ejercicio y alimenta las metas de Dirección que dependen del movimiento.",
  },
];

const mente: PasoTour[] = [
  {
    id: "men-practicas",
    objetivo: ".ftabs",
    titulo: "Prácticas con campana",
    texto: "Respiraciones, meditaciones y sadhanas que corren con su propio tiempo y su campana. Eliges una, la haces, y queda registrada con sus minutos.",
  },
  {
    id: "men-diario",
    objetivo: ".ftabs",
    titulo: "El diario, con preguntas que ayudan",
    texto: "Si no sabes por dónde empezar a escribir, la app te propone una pregunta. Lo que escribes es tuyo: no sale de la app salvo que tú lo pidas al exportar.",
  },
];

const relaciones: PasoTour[] = [
  {
    id: "rel-personas",
    objetivo: ".page",
    titulo: "Las personas que te importan",
    texto: "Anotas a quién quieres cuidar y cada cuánto te gustaría hablarle. La app te avisa cuando pasa mucho tiempo, sin dramas.",
  },
  {
    id: "rel-momentos",
    objetivo: ".page",
    titulo: "Registra los momentos",
    texto: "Una llamada, un café, algo que te contó. Sirve para acordarte de lo importante la próxima vez que se vean, que es de lo que se trata.",
  },
];

const direccion: PasoTour[] = [
  {
    id: "dir-metas",
    objetivo: ".page",
    titulo: "Metas que se mueven solas",
    texto: "Una meta puede alimentarse de lo que ya registras: sesiones de movimiento, días de un hábito, horas de un proyecto, aportes a un ahorro. Avanza sola mientras vives.",
  },
  {
    id: "dir-hitos",
    objetivo: ".page",
    titulo: "Pártela en pedazos",
    texto: "Cada meta puede tener hitos, y el porcentaje sale de ellos. Es la diferencia entre 'aprender inglés' y algo que de verdad se puede empezar el martes.",
  },
];

const trabajo: PasoTour[] = [
  {
    id: "tra-proyectos",
    objetivo: ".page",
    titulo: "Proyectos con su checklist",
    texto: "Cada proyecto lleva sus tareas, y el avance se calcula solo con lo que vas marcando.",
  },
  {
    id: "tra-jornada",
    objetivo: ".page",
    titulo: "Las horas y el foco",
    texto: "Registras tu jornada y los bloques de pomodoro quedan ligados al proyecto. Al final del mes sabes en qué se te fue el tiempo, no solo en qué creías que se te iba.",
  },
];

const aprendizaje: PasoTour[] = [
  {
    id: "apr-cuadernos",
    objetivo: ".ftabs",
    titulo: "Cuadernos y biblioteca",
    texto: "Las notas viven en cuadernos por tema. La biblioteca lleva lo que quieres leer y lo que ya leíste, con sus fechas.",
  },
];

const calendario: PasoTour[] = [
  {
    id: "cal-vista",
    objetivo: ".page",
    titulo: "Todo lo que tiene fecha",
    texto: "Aquí caen tus tareas, tus pagos, tus recordatorios y lo que registras en los otros módulos. Es la agenda viva de la que habla la app.",
  },
];

const revision: PasoTour[] = [
  {
    id: "rev-tabs",
    objetivo: ".ftabs",
    titulo: "Día, semana, mes y patrones",
    texto: "Cada pestaña mira la misma vida con distinto zoom. Patrones cruza módulos: cómo cambia tu energía según lo que duermes o te mueves.",
  },
  {
    id: "rev-informe",
    objetivo: ".ftabs",
    titulo: "El informe que se puede entregar",
    texto: "En la pestaña Informe eliges un periodo y qué áreas entran, y sale un PDF con gráficos y observaciones. Es lo que le llevarías a un psicólogo o a un médico si quisieras.",
  },
];

const vision: PasoTour[] = [
  {
    id: "vis-collage",
    objetivo: ".page",
    titulo: "Para qué es todo esto",
    texto: "Tu visión de vida y tus sueños, con imágenes si quieres. Es la pantalla que se mira cuando uno se pregunta por qué estaba haciendo tanto esfuerzo.",
  },
];

/** Todos los guiones por su clave. Para los módulos, la clave es la ruta:
 *  así el tour de una pantalla se encuentra sin una tabla aparte. */
export const GUIONES: Record<string, Guion> = {
  [TOUR_GENERAL]: { clave: TOUR_GENERAL, pasos: general },
  "/": { clave: "/", pasos: inicio },
  "/finanzas": { clave: "/finanzas", pasos: finanzas },
  "/salud": { clave: "/salud", pasos: energia },
  "/habitos": { clave: "/habitos", pasos: habitos },
  "/movimiento": { clave: "/movimiento", pasos: movimiento },
  "/mente": { clave: "/mente", pasos: mente },
  "/relaciones": { clave: "/relaciones", pasos: relaciones },
  "/objetivos": { clave: "/objetivos", pasos: direccion },
  "/trabajo": { clave: "/trabajo", pasos: trabajo },
  "/aprendizaje": { clave: "/aprendizaje", pasos: aprendizaje },
  "/calendario": { clave: "/calendario", pasos: calendario },
  "/revision": { clave: "/revision", pasos: revision },
  "/vision": { clave: "/vision", pasos: vision },
};
