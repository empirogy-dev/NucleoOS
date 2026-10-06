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
    id: "mov-tabs",
    objetivo: ".ftabs",
    titulo: "Tres formas de mover el cuerpo",
    texto: "Práctica suave para soltar cuando andas apretada, Entrenamiento para lo que de verdad cansa, y Programas para seguir un plan de varias semanas sin tener que inventarlo cada día.",
  },
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
  {
    id: "men-historial",
    objetivo: ".ftabs",
    titulo: "Lo que haces va quedando",
    texto: "Historial guarda cada práctica con sus minutos, e Insights busca qué se repite en lo que escribes. Ninguna de las dos te pide nada: se llenan solas si usas las otras pestañas.",
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
  {
    id: "rel-cadencia",
    objetivo: ".page",
    titulo: "Tú pones cada cuánto",
    texto: "A cada persona le dices cada cuántos días te gustaría hablarle. Siete para tu mamá, noventa para un amigo de la universidad. La app no opina del número, solo te avisa cuando se pasa.",
  },
];

const direccion: PasoTour[] = [
  {
    id: "dir-tabs",
    objetivo: ".ftabs",
    titulo: "Metas, pasos y avances",
    texto: "Metas activas es lo que persigues ahora, Próximos pasos es lo que toca esta semana, Avances es lo que ya moviste, y Logradas es la pestaña que se mira los días en que sientes que no avanzas en nada.",
  },
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
  {
    id: "tra-animo",
    objetivo: ".page",
    titulo: "Cómo te sentiste también cuenta",
    texto: "Al cerrar la jornada puedes anotar cómo estuvo. Con unas semanas de eso se ve qué días te dejan bien y cuáles te vacían, que no siempre son los que uno cree.",
  },
];

const aprendizaje: PasoTour[] = [
  {
    id: "apr-cuadernos",
    objetivo: ".ftabs",
    titulo: "Cuadernos y biblioteca",
    texto: "Las notas viven en cuadernos por tema, para que un apunte de un curso no quede mezclado con una receta. La biblioteca es otra cosa: libros ya elegidos, con sus ideas resumidas.",
  },
  {
    id: "apr-buscar",
    objetivo: ".page",
    titulo: "Buscar en todo lo que escribiste",
    texto: "El buscador mira dentro de todas tus notas a la vez, así que da lo mismo en qué cuaderno la dejaste. Es la diferencia entre guardar algo y poder encontrarlo un año después.",
  },
  {
    id: "apr-biblioteca",
    objetivo: ".ftabs",
    titulo: "La biblioteca ya viene elegida",
    texto: "No es tu lista de pendientes: son libros elegidos por lo que le sirven a un cerebro con TDAH y TDA, cada uno con sus ideas y sus ejercicios. Te llevas lo suyo aunque nunca lo compres, y marcas lo que quieres leer y lo que ya leíste.",
  },
];

const calendario: PasoTour[] = [
  {
    id: "cal-vista",
    objetivo: ".page",
    titulo: "Todo lo que tiene fecha",
    texto: "Aquí caen tus tareas, tus pagos, tus recordatorios y lo que registras en los otros módulos. Es la agenda viva de la que habla la app.",
  },
  {
    id: "cal-mes",
    objetivo: ".page",
    titulo: "Un mes entero, de lunes a domingo",
    texto: "Te mueves entre meses con las flechas del título, y el botón Hoy te devuelve donde estabas. Arriba dice cuántas cosas tiene el mes que estás mirando.",
  },
  {
    id: "cal-solo",
    objetivo: ".page",
    titulo: "No hay que llenarlo a mano",
    texto: "Casi todo llega solo: los pagos que registras en Finanzas, los cumpleaños de tus vínculos, tus jornadas de Trabajo y los avances de tus metas. Si el mes se ve vacío es porque todavía no has registrado nada, no porque falte algo por configurar.",
  },
];

const revision: PasoTour[] = [
  {
    id: "rev-dia",
    objetivo: ".ftabs",
    titulo: "Tu día, ya vivido",
    texto: "La pestaña Día arma la agenda de lo que pasó, no de lo que planeabas: a qué hora comiste, cuándo te moviste, qué anotaste. Sirve para reconstruir un día raro y entender qué lo hizo raro.",
  },
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
  {
    id: "vis-tabs",
    objetivo: ".ftabs",
    titulo: "Tres maneras de mirar lo mismo",
    texto: "Sueños es la lista de lo que quieres vivir, Visual board es para verlo en imágenes, y Vida ideal es el texto donde te describes el día que quieres tener.",
  },
  {
    id: "vis-meta",
    objetivo: ".page",
    titulo: "Cuando un sueño madura",
    texto: "Aquí nada tiene fecha ni te persigue, a propósito. El día que un sueño deje de ser sueño, lo pasas a Dirección y recién ahí se vuelve una meta con pasos.",
  },
];

// ---------- La importación de la cartola ----------
//
// Este es el momento donde se perdió la amiga de la usuaria: bajó la app,
// llegó a Finanzas, vio "Importar cartola" y no supo ni qué archivo era ni de
// dónde sacarlo. Por eso es el único recorrido que no explica una pantalla
// sino un trámite, paso por paso, mientras lo estás haciendo.
//
// Son dos guiones y no uno porque la mitad de lo que hay que señalar todavía
// no existe cuando la ventana se abre: la tabla de movimientos leídos aparece
// recién después de elegir el archivo, y el motor salta los pasos cuyo
// objetivo no encuentra en un segundo y medio. Así que el primero acompaña
// hasta soltar el archivo, y el segundo arranca solo cuando la lista ya está
// en pantalla.
//
// Las claves no son rutas a propósito: no queremos que estos salten al entrar
// a Finanzas, sino solo con la ventana de importar abierta.

export const TOUR_CARTOLA = "cartola";
export const TOUR_CARTOLA_REVISION = "cartola-revision";

const cartola: PasoTour[] = [
  {
    id: "car-que-es",
    titulo: "Qué es una cartola",
    texto: "Es el archivo con todos los movimientos de un mes que te da tu banco. Entras a tu banco por internet, buscas 'cartola', 'estado de cuenta' o 'statement', eliges el mes y lo descargas. Eso es lo que vas a subir aquí.",
  },
  {
    id: "car-fuente",
    objetivo: "[data-tour='cartola-fuente']",
    titulo: "Primero, de dónde viene",
    texto: "Dime de qué cuenta o tarjeta es la cartola y de qué mes. Con eso los movimientos quedan archivados donde corresponde y puedo avisarte si subes dos veces el mismo mes.",
  },
  {
    id: "car-archivo",
    objetivo: "[data-tour='cartola-archivo']",
    titulo: "Ahora el archivo",
    texto: "Sirve CSV, OFX, QFX, Excel o PDF. Si tu banco te deja elegir, prefiere CSV u OFX: esos los leo exactos. El PDF lo lee la IA y después tú revisas. Puedes subir varios archivos juntos, por ejemplo la cuenta y la tarjeta del mismo mes.",
  },
  {
    id: "car-espera",
    titulo: "Y eso es todo por ahora",
    texto: "Cuando elijas el archivo te muestro lo que encontré, y seguimos desde ahí. Nada se guarda hasta que tú aprietes el botón del final.",
  },
];

const cartolaRevision: PasoTour[] = [
  {
    id: "carv-lista",
    objetivo: "[data-tour='cartola-revision']",
    titulo: "Esto es lo que leí",
    texto: "Cada línea es un movimiento con su fecha, su descripción y su monto. Todavía no está guardado: es una vista previa para que revises antes de dejarlo entrar.",
  },
  {
    id: "carv-repetidos",
    objetivo: "[data-tour='cartola-repetidos']",
    titulo: "Los repetidos ya vienen resueltos",
    texto: "Comparo con lo que ya tienes registrado. Si un movimiento ya estaba, lo dejo desmarcado para que no se cuente dos veces. Pasa harto cuando anotaste algo a mano y después subes la cartola del mismo mes.",
  },
  {
    id: "carv-marcar",
    objetivo: "[data-tour='cartola-revision']",
    titulo: "Tú decides qué entra",
    texto: "Cada línea tiene su casilla. Desmarca lo que no quieras, marca un repetido si de verdad ocurrió dos veces. Si algo salió mal leído, lo puedes corregir después en Transacciones.",
  },
  {
    id: "carv-importar",
    objetivo: "[data-tour='cartola-importar']",
    titulo: "Y aquí se guarda",
    texto: "El botón dice cuántos movimientos van a entrar. Después aparecen en Transacciones, listos para categorizar, y el Reporte empieza a tener de qué hablar.",
  },
];

const ajustes: PasoTour[] = [
  {
    id: "aju-pais",
    objetivo: "[data-tour='pagina']",
    titulo: "Tu país y tu moneda",
    texto: "El país decide qué te puede ofrecer la app: conectar el banco funciona en algunos países y en otros todavía no. La moneda es la principal; si tienes cuentas en otro país, cada una lleva la suya y no se mezclan.",
  },
  {
    id: "aju-secciones",
    objetivo: "[data-tour='pagina']",
    titulo: "Enciende y apaga secciones",
    texto: "La app tiene catorce módulos y no todos le sirven a todo el mundo. Lo que apagas desaparece del menú y deja de pedirte datos. Se puede volver a encender cuando quieras.",
  },
  {
    id: "aju-tour",
    objetivo: "[data-tour='pagina']",
    titulo: "El tema, y volver a ver el recorrido",
    texto: "Eliges el tema de colores con el que quieres vivir aquí. Y si algún día quieres repasar cómo funciona la app, el recorrido completo se pide desde aquí o desde el signo de pregunta de arriba.",
  },
];

// ---------- Para qué es cada sección ----------
//
// Esto es lo que contesta el signo de pregunta que está al lado del título de
// cada pantalla. No describe lo que hay dentro (para eso está el subtítulo),
// sino para qué sirve tenerlo: qué pregunta de tu vida responde esta sección.
// Dos o tres frases, porque quien abre esto está perdido y no va a leer más.

export const PROPOSITOS: Record<string, string> = {
  "/": "Para empezar el día sabiendo qué toca y cómo vienes, sin entrar a cada sección. Todo lo que ves aquí se arma solo con lo que registras en el resto de la app.",
  "/finanzas": "Para saber en qué se te va la plata y dejar de adivinar. Registras a mano o subes la cartola del banco, la app ordena los movimientos, y el informe te muestra tus categorías, los cargos que se cobran solos y dónde hay plata que recuperar.",
  "/salud": "Para entender por qué hay días en que andas bien y otros en que no. Anotas lo que comes, lo que tomas, cómo duermes y cómo te sientes, y Revisión cruza todo eso para mostrarte de qué depende tu energía.",
  "/habitos": "Para sostener en el tiempo lo que decidiste hacer. Marcas el día y ves la racha crecer, y lo que registras en otros módulos marca sus hábitos solo, para que no anotes dos veces lo mismo.",
  "/movimiento": "Para mover el cuerpo con un plan y que quede registrado sin esfuerzo. Sigues una rutina paso a paso o anotas lo que hiciste, y esos minutos alimentan tus hábitos, tu energía y tus metas.",
  "/mente": "Para bajar revoluciones y sacar de la cabeza lo que anda dando vueltas. Prácticas que corren con su propio tiempo y su campana, y un diario que te propone una pregunta cuando no sabes por dónde partir.",
  "/relaciones": "Para no perder de vista a la gente que te importa cuando la vida se pone densa. Anotas a quién quieres cuidar y cada cuánto te gustaría hablarle, y la app te avisa cuando pasa mucho tiempo.",
  "/objetivos": "Para convertir lo que quieres en algo que de verdad avanza. Cada meta se parte en hitos con fecha, y puede alimentarse sola de lo que ya registras en movimiento, hábitos, trabajo o ahorro.",
  "/trabajo": "Para saber en qué se te fue el tiempo, y no solo en qué creías que se te iba. Tus proyectos con sus tareas, tu jornada y tus bloques de foco, todos ligados entre sí.",
  "/aprendizaje": "Para que lo que aprendes no se pierda, y para no partir de cero preguntándote qué leer. Tus notas ordenadas por tema y buscables, y una biblioteca curada de libros para un cerebro con TDAH y TDA, cada uno con sus ideas y sus ejercicios.",
  "/calendario": "Para ver en una sola pantalla todo lo que tiene fecha en tu vida: tus tareas, tus pagos, tus citas, tus cumpleaños y lo que vas registrando en los otros módulos.",
  "/revision": "Para que todo lo que registras se convierta en algo que se entiende. Mira tu día, tu semana y tu mes, cruza módulos para encontrar patrones, y arma un informe que puedes exportar y llevarle a un profesional.",
  "/vision": "Para acordarte de por qué haces todo lo demás. Aquí van tu visión de vida y tus sueños, sin obligaciones; cuando uno madura, lo pasas a Dirección y se vuelve una meta con fecha.",
  "/ajustes": "Para dejar la app a tu medida: tu país y tu moneda, qué secciones quieres ver, el tema de colores, y las funciones que solo le sirven a algunas personas, como el ayuno o el auto de trabajo.",
};

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
  "/ajustes": { clave: "/ajustes", pasos: ajustes },
  [TOUR_CARTOLA]: { clave: TOUR_CARTOLA, pasos: cartola },
  [TOUR_CARTOLA_REVISION]: { clave: TOUR_CARTOLA_REVISION, pasos: cartolaRevision },
};
