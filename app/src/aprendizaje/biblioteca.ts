// Biblioteca curada de NucleoOS: los libros que de verdad ayudan a un
// cerebro TDAH a construir su vida, elegidos por impacto y no por moda.
// Nueve por sección (tres filas de tres tarjetas), cada uno con el
// porqué y sus tres ideas para llevar.

import { hoyLocal } from "../lib/fechas";

export type ViaLibro = "tdah" | "habitos" | "emociones" | "psicologia" | "relaciones" | "finanzas" | "proposito" | "espiritualidad";

export const VIAS_LIBRO: Array<{ key: ViaLibro; label: string }> = [
  { key: "tdah", label: "TDAH y foco" },
  { key: "habitos", label: "Hábitos" },
  { key: "emociones", label: "Emociones" },
  { key: "psicologia", label: "Psicología" },
  { key: "relaciones", label: "Relaciones" },
  { key: "finanzas", label: "Finanzas" },
  { key: "proposito", label: "Propósito" },
  { key: "espiritualidad", label: "Espiritualidad" },
];

/** Un ejercicio del libro, contado con nuestras palabras: la idea es de la
 *  autora, la redacción es nuestra. Nunca se copia el texto del libro. */
export interface EjercicioLibro {
  nombre: string;
  /** Cómo se hace, en dos o tres frases concretas. */
  como: string;
  /** Ritmo sugerido, para saber si conviene hacerlo hábito. */
  cada?: "diario" | "semanal" | "unico";
}

export interface Libro {
  id: string;
  titulo: string;
  autor: string;
  via: ViaLibro;
  emoji: string;
  porQue: string;
  ideas: string[];
  /** Los ejercicios que trae el libro, adaptados para hacerlos hoy. */
  ejercicios?: EjercicioLibro[];
}

// Dónde conseguir el libro, de forma legal: no alojamos PDFs (piratería), sino
// que llevamos a comprarlo o a pedirlo prestado. Los enlaces se arman con el
// título y el autor, así sirven para los 77 libros sin escribir uno por uno.
export function enlacesLibro(l: { titulo: string; autor: string }): Array<{ label: string; url: string }> {
  // El título puede venir como "Traducción (Original)": para buscar sirve mejor
  // el nombre original si está entre paréntesis.
  const m = l.titulo.match(/\(([^)]+)\)\s*$/);
  const base = (m ? m[1] : l.titulo).trim();
  const q = encodeURIComponent(`${base} ${l.autor}`.trim());
  return [
    { label: "Buscalibre", url: `https://www.buscalibre.com/libros/search?q=${q}` },
    { label: "Google Books", url: `https://www.google.com/search?tbm=bks&q=${q}` },
    { label: "Open Library", url: `https://openlibrary.org/search?q=${q}` },
  ];
}

export const LIBROS: Libro[] = [
  // ---------- TDAH y foco ----------
  {
    id: "adhd20",
    titulo: "TDAH 2.0 (ADHD 2.0)",
    autor: "Edward Hallowell y John Ratey",
    via: "tdah",
    emoji: "\u{1F9E0}",
    porQue: "Los dos m\u00e9dicos que llevan d\u00e9cadas estudiando el TDAH desarman el mito de que es un defecto. Explican el cerebro que corre como un Ferrari con frenos de bicicleta, y por qu\u00e9 la clave no es forzarte m\u00e1s sino aprender a manejar tus frenos. Trae la ciencia m\u00e1s nueva y, sobre todo, esperanza concreta. EL libro para entenderte sin patologizarte.",
    ideas: [
      "El TDAH es un rasgo con superpoderes y costos, no un defecto de car\u00e1cter.",
      "El ejercicio es medicina de primera l\u00ednea para este cerebro: mueve el cuerpo antes de exigirte foco.",
      "El entorno correcto vale m\u00e1s que el esfuerzo: dise\u00f1a tu vida para tu cerebro, no al rev\u00e9s.",
      "La conexi\u00f3n humana regula: el aislamiento empeora el TDAH, el v\u00ednculo lo calma.",
      "Busca tu punto justo de est\u00edmulo: ni tan aburrida que te apagues, ni tan saturada que colapses.",
    ],
    ejercicios: [
      { nombre: "Mueve el cuerpo antes de lo difícil", como: "Diez minutos de caminata, baile o escalera justo antes de sentarte a la tarea que estás evitando. El movimiento le enciende la atención al cerebro con TDAH.", cada: "diario" },
      { nombre: "Da vuelta el defecto", como: "Escribe algo que siempre te criticaron y busca dónde esa misma característica te sirve. Distraída también es curiosa. Intensa también es apasionada.", cada: "semanal" },
      { nombre: "Tus tres personas", como: "Anota tres personas que te conocen de verdad y pídele a cada una algo concreto. La conexión no es un lujo, es tratamiento.", cada: "unico" },
    ],
  },
  {
    id: "howtoadhd",
    titulo: "C\u00f3mo funciona el TDAH (How to ADHD)",
    autor: "Jessica McCabe",
    via: "tdah",
    emoji: "\u{1F9F0}",
    porQue: "Nace del canal de YouTube m\u00e1s querido sobre TDAH, escrito por alguien que lo vive, no solo lo estudia. Es una caja de herramientas pr\u00e1ctica, c\u00e1lida y sin verg\u00fcenza, con trucos que de verdad funcionan para un cerebro que se distrae, se agobia y olvida. Te trata como aliada, no como un problema a arreglar.",
    ideas: [
      "Trabaja con tu cerebro, no contra \u00e9l: si te funciona raro pero funciona, es v\u00e1lido.",
      "Externaliza todo: tu cerebro es para tener ideas, no para archivarlas.",
      "Los sistemas le ganan a la fuerza de voluntad, siempre.",
      "Tus herramientas dejan de funcionar y no es tu culpa: r\u00f3talas sin drama.",
      "Pide ayuda y adapta el mundo a ti: no naciste para encajar a la fuerza.",
    ],
    ejercicios: [
      { nombre: "Un sistema en vez de fuerza de voluntad", como: "Elige la cosa que se te olvida siempre y dale un soporte externo: una alarma, un lugar fijo, algo a la vista. Deja de pedirle a tu memoria lo que puede hacer una nota.", cada: "semanal" },
      { nombre: "Nombra el muro", como: "Cuando una tarea chica se siente imposible, para y nombra qué capa te frena: vergüenza, un intento fallido, miedo al juicio. Nombrarla la hace más baja.", cada: "diario" },
      { nombre: "Baja el listón a la mitad", como: "Si no arranca, córtala en dos y quédate con la mitad más fácil. Media tarea hecha vale más que una entera imaginada.", cada: "diario" },
    ],
  },
  {
    id: "driven",
    titulo: "Impulsado a la distracci\u00f3n (Driven to Distraction)",
    autor: "Edward Hallowell y John Ratey",
    via: "tdah",
    emoji: "\u{1F697}",
    porQue: "El cl\u00e1sico que puso el TDAH adulto en el mapa cuando casi nadie lo nombraba. Si TDAH 2.0 es el resumen moderno, este es el fundamento, lleno de casos reales que se sienten como mirarte al espejo. Te explica por qu\u00e9 toda la vida sentiste que algo no calzaba, y que eso tiene nombre y tiene salida.",
    ideas: [
      "El diagn\u00f3stico es un alivio, no una etiqueta: por fin todo tiene explicaci\u00f3n.",
      "El TDAH adulto existe y se ve distinto al de los ni\u00f1os.",
      "Estructura externa m\u00e1s comprensi\u00f3n interna: esa es la f\u00f3rmula.",
      "No es falta de voluntad ni de inteligencia, es un cableado distinto.",
      "Rod\u00e9ate de gente y sistemas que te devuelvan el rumbo cuando te pierdes.",
    ],
    ejercicios: [
      { nombre: "Todo a la vista", como: "Lo que no ves, no existe. Deja lo del día en un solo lugar visible: la mesa de la entrada, un pizarrón, una bandeja.", cada: "diario" },
      { nombre: "Cinco minutos de arranque", como: "Comprométete a cinco minutos y nada más. El costo de empezar es casi todo el costo de la tarea.", cada: "diario" },
    ],
  },
  {
    id: "scattered",
    titulo: "Mentes dispersas (Scattered Minds)",
    autor: "Gabor Mat\u00e9",
    via: "tdah",
    emoji: "\u{1F32B}",
    porQue: "Mat\u00e9 mira el TDAH con una compasi\u00f3n poco com\u00fan: no como una falla gen\u00e9tica a secas, sino como una historia que tambi\u00e9n se puede sanar. Une la neurociencia con la vida emocional temprana y abre una puerta distinta, m\u00e1s humana. Controversial para algunos, liberador para quien carg\u00f3 culpa durante a\u00f1os.",
    ideas: [
      "La atenci\u00f3n se desarrolla en el v\u00ednculo: sanar relaciones ayuda a sanar el foco.",
      "La autocomprensi\u00f3n desarma la verg\u00fcenza acumulada de a\u00f1os.",
      "No est\u00e1s rota: tu cerebro se adapt\u00f3 para sobrevivir.",
      "La curiosidad amable por ti misma sana m\u00e1s que la autoexigencia.",
      "El presente se puede reeducar: la historia no es destino.",
    ],
    ejercicios: [
      { nombre: "Escucha tu tono", como: "Cuando se te olvide algo, fíjate cómo te hablas. Después dilo de nuevo con la voz que usarías con una niña de seis años.", cada: "diario" },
      { nombre: "Media hora presente", como: "Media hora con alguien que quieres, sin pantalla y sin tarea de fondo. La atención se sostiene en el vínculo, no en el esfuerzo.", cada: "diario" },
    ],
  },
  {
    id: "notbroken",
    titulo: "Tu cerebro no est\u00e1 roto (Your Brain\u2019s Not Broken)",
    autor: "Tamara Rosier",
    via: "tdah",
    emoji: "\u{1F6E0}",
    porQue: "Rosier explica el TDAH desde las emociones, que es donde de verdad duele: la culpa, la verg\u00fcenza y el ciclo de prometer y no cumplir. Le pone palabras a la monta\u00f1a rusa interna y entrega herramientas concretas para bajarse de ella. Se siente escrito por alguien que estuvo justo donde t\u00fa est\u00e1s.",
    ideas: [
      "El TDAH es un problema de regulaci\u00f3n emocional tanto como de atenci\u00f3n.",
      "Los cuadrantes de energ\u00eda: no toda hora del d\u00eda sirve para todo.",
      "La motivaci\u00f3n TDAH corre con inter\u00e9s, urgencia, novedad y desaf\u00edo.",
      "Nombrar lo que sientes te devuelve el volante.",
      "Deja de pelear con tu cerebro y empieza a traducirlo.",
    ],
    ejercicios: [
      { nombre: "De qué energía vengo", como: "Antes de decidir el día, pregúntate con qué energía llegaste: acelerada, plana, dispersa o clara. Ordena las tareas según eso, no según la lista.", cada: "diario" },
      { nombre: "Lo que cuesta de verdad", como: "Junto a la tarea que estás postergando, escribe qué emoción trae: aburrimiento, miedo, rabia. Casi nunca cuesta el trabajo, cuesta el sentimiento.", cada: "semanal" },
    ],
  },
  {
    id: "radicalguide",
    titulo: "Una gu\u00eda radical para mujeres con TDAH (A Radical Guide for Women with ADHD)",
    autor: "Sari Solden y Michelle Frank",
    via: "tdah",
    emoji: "\u{1F451}",
    porQue: "El TDAH en mujeres se ve distinto y se diagnostica tarde, despu\u00e9s de a\u00f1os de sentirse demasiado o muy poco. Este libro es para ti espec\u00edficamente: combina teor\u00eda y ejercicios para dejar de esconderte y empezar a vivir en grande, tal como eres. Menos autoayuda gen\u00e9rica, m\u00e1s permiso para ocupar tu espacio.",
    ideas: [
      "Deja de esconder tu diferencia: la energ\u00eda de camuflarte te est\u00e1 costando la vida.",
      "Las mujeres con TDAH cargan expectativas de g\u00e9nero imposibles.",
      "Vivir en grande no es arreglarte primero: es empezar ahora, como eres.",
      "Tu forma de funcionar no es un error a corregir, es una a comprender.",
      "Rod\u00e9ate de quienes te celebran, no de quienes te toleran.",
    ],
    ejercicios: [
      { nombre: "Deja de compensar en silencio", como: "Elige una cosa que sostienes sola y que te agota, y esta semana pídela o suéltala. Aparentar que puedes con todo tiene un costo que nadie ve.", cada: "semanal" },
      { nombre: "Tu propia medida", como: "Escribe cómo se ve un buen día para ti, con tu cabeza y tu vida. No la casa impecable de otra persona.", cada: "unico" },
    ],
  },
  {
    id: "nowhabit",
    titulo: "El h\u00e1bito del ahora",
    autor: "Neil Fiore",
    via: "tdah",
    emoji: "\u{23F3}",
    porQue: "El mejor libro sobre procrastinaci\u00f3n porque la trata como lo que es, miedo, y no como flojera. Fiore muestra que postergas para protegerte del agobio, y ofrece un m\u00e9todo amable para volver a moverte: bloques cortos, descanso garantizado y una relaci\u00f3n nueva con el trabajo. Calza perfecto con tus bloques de foco.",
    ideas: [
      "Procrastinar es protegerte del agobio, no ser floja.",
      "Bloques cortos con descansos ganados: tu pomodoro es esto.",
      "Agenda primero el descanso y el placer, el trabajo cabe solo.",
      "Cambia el tengo que por elijo: el lenguaje suelta la presi\u00f3n.",
      "Empieza por treinta minutos imperfectos, no por el proyecto entero.",
    ],
    ejercicios: [
      { nombre: "Programación inversa", como: "Antes de agendar el trabajo, agenda el descanso, el ejercicio y lo que disfrutas. El trabajo cabe en lo que sobra, y sin culpa.", cada: "semanal" },
      { nombre: "Treinta minutos imperfectos", como: "Comprométete a solo treinta minutos de lo que estás evitando, y date permiso de que salga mal. Empezar es el logro.", cada: "diario" },
    ],
  },
  {
    id: "orderchaos",
    titulo: "Orden desde el caos (Order from Chaos)",
    autor: "Jaclyn Paul",
    via: "tdah",
    emoji: "\u{1F5C2}",
    porQue: "Organizaci\u00f3n de la casa y de la vida escrita por una mujer con TDAH que prob\u00f3 todo lo que no funciona antes de dar con lo que s\u00ed. Cero sistemas pensados para cerebros neurot\u00edpicos: ac\u00e1 los m\u00e9todos aguantan el desorden real, los d\u00edas malos y la memoria que falla. Pr\u00e1ctico, honesto y sin culpa.",
    ideas: [
      "El sistema perfecto es el que sigues usando en tres meses.",
      "Todo necesita UN lugar visible: lo guardado desaparece del universo.",
      "Mant\u00e9n el mantenimiento peque\u00f1o: diez minutos diarios le ganan al marat\u00f3n mensual.",
      "Dise\u00f1a para tu peor d\u00eda, no para tu mejor versi\u00f3n.",
      "Menos cosas es menos que ordenar: soltar tambi\u00e9n es organizar.",
    ],
    ejercicios: [
      { nombre: "Un lugar para lo que siempre pierdes", como: "Llaves, billetera, teléfono, audífonos. Un lugar fijo para cada uno y siempre el mismo. No es orden, es memoria externa.", cada: "unico" },
      { nombre: "Una sola bandeja de entrada", como: "Todo lo que llega, papeles, ideas, recados, va a un solo lugar y de ahí se reparte una vez al día. Cinco listas no son ninguna lista.", cada: "diario" },
    ],
  },
  {
    id: "hyperfocus",
    titulo: "Hiperfoco (Hyperfocus)",
    autor: "Chris Bailey",
    via: "tdah",
    emoji: "\u{1F526}",
    porQue: "La atenci\u00f3n tratada como un recurso que se administra: cu\u00e1ndo enfocarla en una sola cosa y cu\u00e1ndo soltarla a prop\u00f3sito para que la mente divague, que tambi\u00e9n es productivo. Para un cerebro TDAH es lectura clave, porque tu hiperfoco deja de ser un accidente y pasa a algo que puedes invitar. Ciencia pr\u00e1ctica sobre tu bien m\u00e1s escaso.",
    ideas: [
      "Tu atenci\u00f3n cabe una sola cosa compleja a la vez: el\u00edgela a prop\u00f3sito.",
      "El modo difuso (ducha, caminata) resuelve lo que el foco no pudo.",
      "Deja el ambiente sin anzuelos antes de empezar el bloque.",
      "Cuanto m\u00e1s importante la tarea, m\u00e1s grande el objeto de tu atenci\u00f3n.",
      "Descansar la atenci\u00f3n no es perder tiempo: la recarga.",
    ],
    ejercicios: [
      { nombre: "Una intención antes de abrir", como: "Antes de tocar el computador o el teléfono, di en voz baja para qué lo abres. El hiperfoco es un regalo, pero apunta a donde lo mandas.", cada: "diario" },
      { nombre: "Mente suelta", como: "Un rato caminando sin pódcast, sin música, sin nada. Ahí es donde aparecen las ideas que no llegan trabajando.", cada: "semanal" },
    ],
  },

    // ---------- Hábitos ----------
  {
    id: "atomicos",
    titulo: "Hábitos atómicos",
    autor: "James Clear",
    via: "habitos",
    emoji: "⚛️",
    porQue: "El manual definitivo de los sistemas pequeños. Clear muestra que no subes por metas sino por procesos, y que un 1% mejor cada día se acumula en algo enorme con el tiempo. Tu módulo de Dirección ya usa sus cuatro leyes; el libro las profundiza con calma y ejemplos que se quedan pegados. Ideal para un cerebro que se agota con los cambios grandes.",
    ideas: [
      "Un 1% mejor cada día se acumula: tus metas automáticas son este principio.",
      "Hazlo obvio y fácil, y súbele la fricción a lo que no quieres.",
      "Cada acción es un voto por la identidad que construyes.",
      "No subes por tus metas, caes al nivel de tus sistemas.",
      "Después de un tropiezo, la regla es nunca fallar dos veces seguidas.",
    ],
    ejercicios: [
      { nombre: "Apila un hábito nuevo", como: "Completa la frase: después de (algo que ya hago), voy a (lo nuevo, en su versión mínima). Ancla el hábito a algo que nunca falla.", cada: "diario" },
      { nombre: "Diseña el entorno", como: "Deja a la vista y a mano lo que quieres hacer, y agrégale pasos a lo que quieres dejar. El ambiente decide más que la voluntad.", cada: "unico" },
      { nombre: "Nunca dos veces seguidas", como: "Si un día se rompe la cadena, la única regla es no fallar dos días seguidos. Un tropiezo no es una recaída.", cada: "diario" },
    ],
  },
  {
    id: "tinyhabits",
    titulo: "Hábitos mínimos (Tiny Habits)",
    autor: "BJ Fogg",
    via: "habitos",
    emoji: "🌱",
    porQue: "La versión aún más pequeña que Clear, nacida en Stanford e ideal para el TDAH: cambios tan chicos que no activan la resistencia. Fogg arma el hábito con una receta simple de anclaje y celebración, y demuestra que la emoción, no la repetición, es lo que graba una costumbre. Empezar es ridículamente fácil, y eso es justo el punto.",
    ideas: [
      "Ancla el hábito nuevo a uno existente: después del café, un minuto de meditación.",
      "Celebra al tiro, aunque sea ridículo: la emoción graba el hábito.",
      "Si no pega, achícalo en vez de esforzarte más.",
      "La motivación sube y baja: diseña para cuando esté baja.",
      "Comportamiento pasa cuando se juntan motivación, capacidad y una señal.",
    ],
    ejercicios: [
      { nombre: "Celébralo en el momento", como: "Cuando cumplas la versión mínima, festeja al instante: un gesto, una sonrisa, decirte bien ahí. La emoción es la que graba el hábito, no la repetición sola.", cada: "diario" },
      { nombre: "La versión de dos", como: "Dos flexiones, dos líneas, dos minutos. Tan chico que no puedas negociarlo en un día malo.", cada: "diario" },
    ],
  },
  {
    id: "indistractable",
    titulo: "Indistraíble (Indistractable)",
    autor: "Nir Eyal",
    via: "habitos",
    emoji: "🎯",
    porQue: "La atención tratada como una habilidad entrenable y no como una condena. Eyal muestra que la mayoría de las distracciones nacen adentro, de una incomodidad que evitas, y da un método para reconquistar tu foco sin culpa ni apps mágicas. Súper útil para el lado digital del TDAH: las redes, el celular, la pestaña número 47.",
    ideas: [
      "La distracción parte por dentro: nombra qué incomodidad estás evitando.",
      "Convierte el tiempo en intención: cada bloque con su para qué.",
      "Ponle fricción a la distracción antes de que llegue.",
      "Los disparadores externos (avisos, pings) se domestican, no se sufren.",
      "Un pacto contigo o con otros vuelve difícil rendirte.",
    ],
    ejercicios: [
      { nombre: "Agenda con horas, no con listas", como: "Pon las cosas en el calendario con hora de inicio y de término. Una lista no defiende tu tiempo, un bloque sí.", cada: "semanal" },
      { nombre: "Diez minutos con la molestia", como: "Cuando venga el impulso de revisar el teléfono, quédate diez minutos con la incomodidad y observa cómo baja sola. La distracción es una salida del malestar.", cada: "diario" },
    ],
  },
  {
    id: "poderhabito",
    titulo: "El poder de los hábitos",
    autor: "Charles Duhigg",
    via: "habitos",
    emoji: "🔁",
    porQue: "El libro que le explicó al mundo el bucle de señal, rutina y recompensa. Duhigg mezcla ciencia e historias reales para mostrar que los hábitos no se borran, se reprograman, y que entender su mecánica te deja hackearlos. Con eso, hasta las costumbres más pegadas dejan de manejarte a ti.",
    ideas: [
      "Todo hábito tiene señal, rutina y recompensa: identifícalas y puedes cambiarlo.",
      "No elimines el hábito, reemplaza la rutina manteniendo señal y recompensa.",
      "Los hábitos clave (como entrenar) arrastran cambios en cadena.",
      "El ansia (craving) es el motor: sin ella, la rutina no arranca.",
      "Creer que puedes cambiar, mejor en comunidad, sostiene el cambio.",
    ],
    ejercicios: [
      { nombre: "Encuentra la señal y el premio", como: "Anota qué pasó justo antes del hábito que quieres cambiar y qué ganaste justo después. Ahí está el mecanismo completo.", cada: "semanal" },
      { nombre: "Cambia solo el medio", como: "Deja la misma señal y el mismo premio, cambia únicamente lo que haces en el medio. Es el único punto donde el hábito cede.", cada: "diario" },
    ],
  },
  {
    id: "deepwork",
    titulo: "Enfócate (Deep Work)",
    autor: "Cal Newport",
    via: "habitos",
    emoji: "🏛",
    porQue: "El argumento definitivo de por qué el trabajo profundo vale oro en un mundo lleno de distracciones, y cómo construir la vida que lo protege. Newport defiende el foco sin interrupciones como una habilidad rara y valiosa, y da rituales concretos para cultivarla. Para un cerebro TDAH es un mapa hacia esos ratos en que rindes por diez.",
    ideas: [
      "El trabajo profundo es raro y valioso: quien lo cultiva, destaca.",
      "Rituales y horarios fijos le quitan la decisión al momento.",
      "El aburrimiento entrena el foco: no llenes cada espera con el celular.",
      "Agenda cada minuto del día para elegir en qué se va tu atención.",
      "Termina el trabajo con un ritual de cierre: la mente descansa de verdad.",
    ],
    ejercicios: [
      { nombre: "Un bloque profundo agendado", como: "Noventa minutos con el teléfono en otra pieza y una sola tarea. Agendado como una cita, no como una intención.", cada: "diario" },
      { nombre: "Ritual de cierre", como: "Al terminar de trabajar, revisa lo pendiente, anota el primer paso de mañana y di una frase de cierre. Sin eso el trabajo sigue abierto en tu cabeza toda la noche.", cada: "diario" },
    ],
  },
  {
    id: "esencialismo",
    titulo: "Esencialismo",
    autor: "Greg McKeown",
    via: "habitos",
    emoji: "🎋",
    porQue: "Menos pero mejor, hecho disciplina. Para el cerebro TDAH que quiere hacerlo TODO y termina disperso, este libro es el permiso para elegir poco y en serio. McKeown enseña a distinguir lo vital de lo trivial y a decir que no sin culpa, para que tu energía vaya a lo que de verdad mueve tu vida.",
    ideas: [
      "Si no es un sí claro, es un no.",
      "Elimina para avanzar: cada compromiso nuevo roba energía a los que importan.",
      "Protege el espacio para pensar: sin él solo reaccionas.",
      "Explora mucho antes de comprometerte con poco.",
      "El costo de oportunidad es real: cada sí es un no a otra cosa.",
    ],
    ejercicios: [
      { nombre: "El no de la semana", como: "Elige una cosa a la que vas a decir no esta semana, y dilo sin explicación larga. Cada sí es un no a otra cosa, aunque no lo veas.", cada: "semanal" },
      { nombre: "Si no es un nueve, es un no", como: "Puntúa la oportunidad de uno a diez. Si no llega a nueve, no entra. El casi es lo que te llena la agenda de vida ajena.", cada: "semanal" },
    ],
  },
  {
    id: "onething",
    titulo: "Una sola cosa (The One Thing)",
    autor: "Gary Keller y Jay Papasan",
    via: "habitos",
    emoji: "1️⃣",
    porQue: "Una idea simple y potente: la palabra prioridades no existía en plural hasta hace poco. Keller propone una pregunta enfocadora, cuál es la única cosa que al hacerla vuelve todo lo demás más fácil o innecesario, y organiza la vida alrededor de ella. Antídoto perfecto contra la dispersión de querer avanzar en veinte frentes.",
    ideas: [
      "Una sola prioridad de verdad: la palabra prioridades no existía en plural.",
      "Bloquea tiempo para tu única cosa antes que nada más.",
      "El éxito se construye secuencialmente, no simultáneamente.",
      "Pregúntate la pregunta enfocadora cada mañana.",
      "Las fichas de dominó caen encadenadas: empieza por la primera.",
    ],
    ejercicios: [
      { nombre: "La pregunta principal", como: "Pregúntate cuál es la única cosa que puedo hacer hoy que haga todo lo demás más fácil o innecesario. Después hazla primero.", cada: "diario" },
      { nombre: "Bloquea la única cosa antes de todo", como: "Al planificar la semana, la única cosa entra al calendario antes que las reuniones. Lo que se agenda al final nunca ocurre.", cada: "semanal" },
    ],
  },
  {
    id: "minihabitos",
    titulo: "Mini hábitos",
    autor: "Stephen Guise",
    via: "habitos",
    emoji: "🐜",
    porQue: "Una flexión al día. En serio. Guise descubrió que la meta ridículamente pequeña elimina la resistencia y casi siempre terminas haciendo más de lo prometido. Es puro sentido común para el cerebro que se paraliza ante lo grande: si la tarea es tan chica que no puedes decir que no, la cadena no se rompe nunca.",
    ideas: [
      "La meta mínima se cumple hasta en tu peor día, y eso mantiene la cadena.",
      "La resistencia vive en el tamaño de la tarea, no en ti.",
      "Pasarte de la meta es bonus, no la nueva exigencia.",
      "Los mini hábitos no gastan fuerza de voluntad: por eso duran.",
      "La constancia crea identidad: te vuelves quien lo hace todos los días.",
    ],
    ejercicios: [
      { nombre: "El hábito ridículamente pequeño", como: "Define la meta tan chica que te dé risa: una flexión, dos líneas, abrir el cuaderno. Tan chica que no puedas fallar ni el peor día.", cada: "diario" },
      { nombre: "Lo de más es regalo", como: "Si el día te da para más, sigue. Pero nunca subas la meta, porque lo que te sostiene es que el mínimo siga siendo mínimo.", cada: "diario" },
    ],
  },
  {
    id: "gtd",
    titulo: "Organízate con eficacia (GTD)",
    autor: "David Allen",
    via: "habitos",
    emoji: "📥",
    porQue: "El clásico de sacar todo de la cabeza a un sistema confiable para que la mente quede libre de pensar. Allen arma un método completo de captura, aclaración y revisión que a un cerebro TDAH le calza como anillo: tu captura rápida ⚡ es puro GTD. Menos cosas dando vueltas en la cabeza, más calma para actuar.",
    ideas: [
      "La mente es para tener ideas, no para guardarlas.",
      "Si toma menos de dos minutos, hazlo ahora.",
      "Define siempre la siguiente acción física, no el proyecto abstracto.",
      "Una revisión semanal mantiene el sistema (y tu cabeza) confiable.",
      "Todo pendiente vive en un solo lugar de confianza, fuera de ti.",
    ],
    ejercicios: [
      { nombre: "Vacía la cabeza", como: "Escribe todo lo que traes pendiente, grande y chico, sin ordenar ni filtrar, hasta que no quede nada dando vueltas. La cabeza es para pensar, no para almacenar.", cada: "semanal" },
      { nombre: "Regla de los dos minutos", como: "Si algo toma menos de dos minutos, hazlo ahora. Anotarlo cuesta más que hacerlo.", cada: "diario" },
      { nombre: "Escribe la próxima acción física", como: "Cambia llamar al doctor por buscar el número del doctor en el correo. Las tareas se atascan cuando no dicen qué mover primero.", cada: "diario" },
    ],
  },

  // ---------- Emociones ----------
  {
    id: "autocompasion",
    titulo: "Sé amable contigo mismo",
    autor: "Kristin Neff",
    via: "emociones",
    emoji: "💗",
    porQue: "La ciencia de la autocompasión, el antídoto exacto contra la culpa crónica del TDAH. Neff demuestra con investigación que tratarte con la dureza de un sargento no motiva, paraliza, y ofrece una forma más amable y más eficaz de acompañarte. El tono cero culpa de NucleoOS viene directo de este trabajo.",
    ideas: [
      "La autocrítica no motiva, paraliza: la evidencia es clarísima.",
      "Trátate como tratarías a tu mejor amiga en el mismo problema.",
      "Fallar no te separa del resto, te une: humanidad compartida.",
      "La autocompasión no es autoindulgencia: es cuidado que sostiene.",
      "Una mano en el pecho y una frase amable calman el sistema nervioso.",
    ],
    ejercicios: [
      { nombre: "La pausa de autocompasión", como: "Cuando te pillas siendo dura contigo, di tres frases: esto duele, le pasa a mucha gente, y qué necesito ahora. Una mano en el pecho ayuda.", cada: "diario" },
      { nombre: "La carta de una amiga", como: "Escribe lo que te está pesando y respóndete como le responderías a tu mejor amiga en el mismo problema. Sin corregir, solo escribe.", cada: "semanal" },
    ],
  },
  {
    id: "mindset",
    titulo: "Mentalidad (Mindset)",
    autor: "Carol Dweck",
    via: "emociones",
    emoji: "🌀",
    porQue: "La mentalidad de crecimiento explicada por su investigadora original. Dweck muestra que creer que las habilidades se entrenan, en vez de venir selladas de fábrica, cambia cómo enfrentas los errores y cuánto llegas. Cambia el soy mala para esto por todavía no lo aprendo, y con eso cambia el resto.",
    ideas: [
      "Las habilidades se entrenan, no vienen selladas de fábrica.",
      "El todavía lo cambia todo.",
      "Elogia el proceso y el intento, también al hablarte a ti misma.",
      "El error es información para crecer, no una sentencia sobre ti.",
      "El talento sin esfuerzo se estanca: el esfuerzo es la variable que sí controlas.",
    ],
    ejercicios: [
      { nombre: "Agrega la palabra todavía", como: "Cuando te escuches decir no soy buena para esto, agrega todavía al final de la frase. Cambia una sentencia por un punto del camino.", cada: "diario" },
      { nombre: "Celebra el proceso, no el resultado", como: "Cuando algo salga bien, di en voz alta qué hiciste para lograrlo. Elogiar el talento vuelve frágil, elogiar el esfuerzo sostiene.", cada: "semanal" },
    ],
  },
  {
    id: "cuatroacuerdos",
    titulo: "Los cuatro acuerdos",
    autor: "Miguel Ruiz",
    via: "emociones",
    emoji: "🕊",
    porQue: "Sabiduría tolteca simple y honda para soltar la autoexigencia y el ruido ajeno. Ruiz propone cuatro acuerdos contigo misma que, practicados, desarman gran parte del sufrimiento que te causas sin darte cuenta. Corto, directo y de esos libros que se releen cada cierto tiempo porque siempre cae distinto.",
    ideas: [
      "Sé impecable con tus palabras, sobre todo las que te dices a ti.",
      "No te tomes nada personal: lo que otros hacen habla de ellos.",
      "No hagas suposiciones: pregunta en vez de inventar historias.",
      "Haz siempre tu máximo posible, sabiendo que cambia según el día.",
      "Estos cuatro acuerdos son una práctica diaria, no una meta que se logra una vez.",
    ],
    ejercicios: [
      { nombre: "Un acuerdo por semana", como: "Elige uno de los cuatro y practícalo esa semana completa, anotando cada noche dónde se te olvidó. Cuatro semanas, un acuerdo cada una.", cada: "semanal" },
    ],
  },
  {
    id: "inteligenciaemocional",
    titulo: "Inteligencia emocional",
    autor: "Daniel Goleman",
    via: "emociones",
    emoji: "🧭",
    porQue: "El libro que demostró al mundo que manejar las emociones predice más éxito y bienestar que el coeficiente intelectual. Goleman explica cómo funciona el cerebro emocional y por qué a veces te secuestra, y da las bases para conocerte y regularte mejor. Es el cimiento sobre el que se paran casi todos los demás libros de esta lista.",
    ideas: [
      "Nombrar la emoción ya la calma: ponerle palabras baja el volumen.",
      "El secuestro emocional dura minutos: no decidas dentro de él.",
      "La empatía se entrena escuchando sin preparar la respuesta.",
      "Autoconciencia primero: no puedes regular lo que no reconoces.",
      "Las emociones son datos, no órdenes: te informan, no te mandan.",
    ],
    ejercicios: [
      { nombre: "Pon un nombre a lo que sientes", como: "Tres veces al día, para diez segundos y ponle nombre a la emoción exacta. No molesta, sino dolida, o cansada, o con miedo. Nombrarla ya la baja de intensidad.", cada: "diario" },
      { nombre: "Los seis segundos", como: "Entre lo que te dispara y lo que respondes, mete seis segundos de respiración. Ahí es donde se decide si contestas tú o contesta la reacción.", cada: "diario" },
    ],
  },
  {
    id: "cuerpocuenta",
    titulo: "El cuerpo lleva la cuenta",
    autor: "Bessel van der Kolk",
    via: "emociones",
    emoji: "🫀",
    porQue: "Una obra que cambió la forma de entender el trauma: no vive en el recuerdo sino en el cuerpo, y por el cuerpo también se sana. Van der Kolk reúne décadas de investigación para mostrar por qué respirar, moverse y sentirte segura regulan lo que hablar no alcanza. Explica desde adentro por qué tus prácticas de regulación funcionan.",
    ideas: [
      "El cuerpo recuerda lo que la mente entierra.",
      "Respiración, movimiento y ritmo regulan lo que hablar no alcanza.",
      "Sentirse segura es la condición previa de toda sanación.",
      "El trauma no es el evento, es lo que quedó grabado en el sistema nervioso.",
      "Yoga, teatro y música sanan porque devuelven la sensación de agencia.",
    ],
    ejercicios: [
      { nombre: "Vuelve al cuerpo", como: "Cuando te desbordes, nombra en voz baja cinco cosas que ves y siente tus pies en el suelo. El cuerpo te trae de vuelta antes que la razón.", cada: "diario" },
      { nombre: "Exhalación larga", como: "Inhala en cuatro y exhala en ocho, unas diez veces. La exhalación larga es la que le avisa al sistema nervioso que ya estás a salvo.", cada: "diario" },
    ],
  },
  {
    id: "permisosentir",
    titulo: "Permiso para sentir",
    autor: "Marc Brackett",
    via: "emociones",
    emoji: "🎨",
    porQue: "Del director del centro de inteligencia emocional de Yale, un método concreto y probado (RULER) para reconocer, entender y regular lo que sientes. Brackett mezcla su historia personal con ciencia aplicable, y deja claro que ninguna emoción es el enemigo: todas traen información. Práctico para ti y para acompañar a otros.",
    ideas: [
      "Todas las emociones son información, ninguna es el enemigo.",
      "Reconocer, comprender, etiquetar, expresar, regular: en ese orden.",
      "El permiso para sentir se regala primero a una misma.",
      "Un vocabulario emocional más rico te da más control.",
      "Preguntar cómo te sientes de verdad abre puertas que el cómo estás cierra.",
    ],
    ejercicios: [
      { nombre: "Cómo te sientes de verdad", como: "Cuando alguien te pregunte cómo estás, respóndete a ti primero con la verdad completa, aunque a la otra persona le digas bien. Después de eso ya sabes qué necesitas.", cada: "diario" },
      { nombre: "Sé el científico, no el juez", como: "Con una emoción difícil, pregúntate de dónde viene y qué te está pidiendo, en vez de si es correcta o exagerada. Las emociones traen información, no notas.", cada: "semanal" },
    ],
  },
  {
    id: "trampafelicidad",
    titulo: "La trampa de la felicidad",
    autor: "Russ Harris",
    via: "emociones",
    emoji: "🪤",
    porQue: "Perseguir sentirse bien todo el tiempo es, paradójicamente, la trampa que te hace sentir peor. Harris traduce la terapia de aceptación y compromiso a lenguaje simple: la meta no es controlar el clima interno sino hacer lo que importa aunque esté feo. Liberador para quien vive peleando con sus propios pensamientos.",
    ideas: [
      "Los pensamientos son ruido de radio: escúchalos sin obedecerlos.",
      "Actúa según tus valores, no según tu ánimo.",
      "Aceptar no es rendirse: es dejar de pelear con lo que ya sientes.",
      "Defusión: mira tus pensamientos, no desde ellos.",
      "Una vida rica incluye emociones difíciles; evitarlas la achica.",
    ],
    ejercicios: [
      { nombre: "Nombra el pensamiento", como: "Cuando venga un pensamiento que te hunde, ponle delante: estoy notando que pienso que... Sigue igual de presente, pero deja de mandarte.", cada: "diario" },
      { nombre: "Tus valores en una hoja", como: "Escribe cómo quieres ser en las áreas que te importan, no qué quieres lograr. Después elige una acción de hoy que vaya en esa dirección.", cada: "semanal" },
    ],
  },
  {
    id: "cosasbuenas",
    titulo: "Cómo hacer que te pasen cosas buenas",
    autor: "Marian Rojas Estapé",
    via: "emociones",
    emoji: "☀️",
    porQue: "Psiquiatría explicada cercano y en español: cortisol, ansiedad y cómo el cuerpo y los pensamientos se retroalimentan hasta el agotamiento o hasta la calma. Rojas Estapé une neurociencia y vida cotidiana para mostrar que bajar el estrés es salud física, y que dónde pones la atención, en gran parte, define tu realidad.",
    ideas: [
      "El cortisol crónico enferma: bajar el estrés es salud física.",
      "Tu atención define tu realidad: lo que buscas, encuentras.",
      "Las personas vitamina existen: rodéate de ellas.",
      "El presente es el único lugar sin ansiedad: la mente sufre en el futuro.",
      "Cuerpo y mente son un solo sistema: cuida uno para calmar el otro.",
    ],
    ejercicios: [
      { nombre: "Una cosa buena que ya está", como: "Antes de dormir, escribe una cosa buena que ya existía hoy y que no notaste. El cerebro sale a buscar lo que le entrenas a ver.", cada: "diario" },
      { nombre: "Baja del futuro", como: "Cuando te sorprendas adelantando desastres, pregúntate si eso está pasando ahora o solo en tu cabeza. Casi todo el sufrimiento vive en el futuro imaginado.", cada: "diario" },
    ],
  },
  {
    id: "burnout",
    titulo: "Agotamiento (Burnout)",
    autor: "Emily Nagoski y Amelia Nagoski",
    via: "emociones",
    emoji: "🔥",
    porQue: "Escrito para mujeres, cambia por completo cómo entiendes el cansancio: el estrés es un ciclo físico que hay que CERRAR, y resolver el problema que lo causó no basta para cerrarlo. Las hermanas Nagoski explican por qué te agotas aunque todo esté bien y qué hacer con el cuerpo para descargar de verdad la tensión acumulada.",
    ideas: [
      "Cierra el ciclo del estrés con cuerpo: movimiento, llanto, abrazo largo, risa.",
      "El descanso no se gana, se necesita: 42% del día entre sueño y pausas.",
      "El síndrome de la dadora agota: no naciste para darlo todo.",
      "Resolver el estresor no cierra el ciclo del estrés: son cosas distintas.",
      "La comparación con un ideal imposible te vacía: suéltala.",
    ],
    ejercicios: [
      { nombre: "Cierra el ciclo del estrés", como: "Resolver el problema no basta: el cuerpo necesita señal de que pasó. Veinte minutos de movimiento, llorar, un abrazo largo o reír fuerte.", cada: "diario" },
      { nombre: "El presupuesto del 42%", como: "Suma tu sueño y tus pausas del día. Si no llegan al 42% de las 24 horas, el cansancio no es falta de carácter, es matemática.", cada: "semanal" },
    ],
  },

  // ---------- Psicología ----------
  {
    id: "kahneman",
    titulo: "Pensar rápido, pensar despacio",
    autor: "Daniel Kahneman",
    via: "psicologia",
    emoji: "🧠",
    porQue: "El premio Nobel que mapeó los dos sistemas de tu mente: el rápido que decide en automático y el lento que razona con esfuerzo. Kahneman reúne toda una vida de investigación para mostrar cómo y cuándo te engañas sin darte cuenta. Entender estos sistemas es entender por qué haces lo que haces, y diseñar mejores decisiones.",
    ideas: [
      "Casi todas tus decisiones las toma el sistema rápido: dale buenos atajos.",
      "Los sesgos no se apagan sabiendo que existen: se diseña alrededor de ellos.",
      "Cansada decides peor: las decisiones importantes van con energía, no de noche.",
      "Lo que ves es todo lo que hay: la mente ignora lo que no tiene a mano.",
      "El yo que recuerda y el que vive no coinciden: cuida la memoria, no solo el momento.",
    ],
    ejercicios: [
      { nombre: "Frena la primera respuesta", como: "Cuando una decisión te parezca obvia, espera veinticuatro horas y vuelve a mirarla. Lo obvio es la parte rápida de la mente, no siempre la correcta.", cada: "semanal" },
      { nombre: "Busca lo que te contradiga", como: "Antes de decidir algo grande, escribe tres razones por las que podrías estar equivocada. Es lo único que le hace peso a la certeza.", cada: "semanal" },
    ],
  },
  {
    id: "flow",
    titulo: "Fluir (Flow)",
    autor: "Mihaly Csikszentmihalyi",
    via: "psicologia",
    emoji: "🌊",
    porQue: "La ciencia del estado en que el tiempo desaparece y todo sale solo. Csikszentmihalyi estudió a miles de personas para entender cuándo somos más felices, y la respuesta sorprende: no descansando, sino absortos en un desafío a nuestra medida. Para un cerebro TDAH es lectura clave, porque el hiperfoco es tu flow, y se puede invitar en vez de esperar.",
    ideas: [
      "El flow aparece cuando el desafío calza justo con tu habilidad: ni aburrimiento ni angustia.",
      "Metas claras y feedback inmediato son la puerta de entrada.",
      "La felicidad no se persigue: se construye haciendo cosas que te absorben.",
      "El ocio pasivo rara vez da flow; la actividad enfocada, sí.",
      "Convertir el trabajo en juego con reglas propias multiplica el disfrute.",
    ],
    ejercicios: [
      { nombre: "El punto justo de dificultad", como: "Ajusta la tarea para que sea un poco más difícil de lo que puedes: si te aburre, súbele, si te angustia, bájale. El flujo vive en ese borde.", cada: "semanal" },
      { nombre: "Una hora sin interrupción", como: "Reserva una hora en lo que sabes hacer bien, sin teléfono ni relojes. Es la forma más barata de sentirte viva.", cada: "diario" },
    ],
  },
  {
    id: "gottlieb",
    titulo: "Quizás deberías hablar con alguien",
    autor: "Lori Gottlieb",
    via: "psicologia",
    emoji: "🛋",
    porQue: "Una terapeuta cuenta la terapia desde los dos sillones a la vez: el de ella con sus pacientes y el de su propia terapeuta cuando su vida se cae. Gottlieb escribe con humor y humanidad, y el libro le quita el miedo y el estigma a pedir ayuda. Se lee como novela y se queda como permiso para mirarte por dentro.",
    ideas: [
      "Todos cargamos algo: ir a terapia es mantención, no emergencia.",
      "La historia que te cuentas sobre tu vida se puede editar.",
      "El cambio duele antes de aliviar, y aún así vale la pena.",
      "Muchas veces lo que pides no es lo que necesitas: mira más hondo.",
      "La cárcel más común es la que construimos nosotras mismas, con la llave en la mano.",
    ],
    ejercicios: [
      { nombre: "Escribe la otra versión", como: "Cuenta la historia que te tiene atascada, y después escríbela de nuevo desde el lugar de la otra persona. No para darle la razón, para dejar de ser solo la protagonista.", cada: "semanal" },
      { nombre: "Qué estoy ganando con quedarme aquí", como: "Pregúntate qué te da seguir en la situación que dices querer cambiar. Casi siempre hay un premio escondido, y verlo es lo que suelta.", cada: "semanal" },
    ],
  },
  {
    id: "seligman",
    titulo: "Aprenda optimismo",
    autor: "Martin Seligman",
    via: "psicologia",
    emoji: "☀️",
    porQue: "El padre de la psicología positiva y su hallazgo central: el pesimismo se aprende, así que también se puede desaprender. Seligman aporta ciencia dura sobre cómo te explicas lo que te pasa, y muestra que ese estilo explicativo, más que los hechos, decide cuánto te hundes o te levantas. Práctico y esperanzador.",
    ideas: [
      "Lo que te hunde no es el evento, es tu explicación: permanente y personal hunde, temporal y externa levanta.",
      "Discute tus pensamientos catastróficos como si fueran de otra persona.",
      "El optimismo aprendido se entrena igual que un músculo.",
      "La indefensión aprendida existe, y también se revierte.",
      "Optimismo no es negar lo malo: es no volverlo permanente ni total.",
    ],
    ejercicios: [
      { nombre: "Discute con tu propia voz", como: "Escribe el pensamiento pesimista y después contéstalo como si fuera un rival: qué prueba tienes, qué otra explicación hay, cuánto va a durar de verdad.", cada: "diario" },
      { nombre: "Tres cosas que salieron bien", como: "Cada noche, tres cosas que salieron bien y tu parte en cada una. La segunda mitad importa más que la primera.", cada: "diario" },
    ],
  },
  {
    id: "ariely",
    titulo: "Las trampas del deseo",
    autor: "Dan Ariely",
    via: "psicologia",
    emoji: "🎲",
    porQue: "Somos irracionales, pero de forma predecible, y esa es una buena noticia: lo predecible se puede diseñar a tu favor. Ariely cuenta experimentos divertidos que explican tus compras, tu debilidad por lo gratis y tus postergaciones. Salir de este libro es mirar tus propias decisiones con una lupa nueva y algo de humor.",
    ideas: [
      "Lo gratis te hace decidir peor que cualquier descuento.",
      "Comparas todo con lo que tienes al lado: elige bien tus comparaciones.",
      "Las fechas límite autoimpuestas funcionan, sobre todo si son públicas.",
      "El precio ancla lo que crees que algo vale, aunque sea arbitrario.",
      "Somos más honestos cuando algo nos recuerda nuestros valores justo antes de decidir.",
    ],
    ejercicios: [
      { nombre: "Saca la opción trampa", como: "Cuando compares precios o planes, borra la opción que está ahí solo para que otra parezca buena. Casi siempre hay una.", cada: "semanal" },
      { nombre: "Ponle fricción a lo gratis", como: "Antes de tomar algo porque es gratis o está en oferta, calcula qué te cuesta en tiempo, espacio o atención. Gratis nunca es gratis.", cada: "semanal" },
    ],
  },
  {
    id: "drive",
    titulo: "La sorprendente verdad sobre qué nos motiva (Drive)",
    autor: "Daniel Pink",
    via: "psicologia",
    emoji: "🔋",
    porQue: "Los premios y castigos funcionan para tareas mecánicas y, sorprendentemente, matan las creativas. Pink reúne la ciencia de la motivación para mostrar que lo que de verdad nos mueve tiene tres nombres: autonomía, maestría y propósito. Cambia cómo entiendes tu propio impulso y cómo motivas a cualquiera, incluida tú misma.",
    ideas: [
      "El palo y la zanahoria apagan la motivación intrínseca: cuídala.",
      "La maestría engancha: busca tareas apenas por encima de tu nivel.",
      "Sin un porqué, ninguna zanahoria alcanza.",
      "La autonomía sobre qué, cuándo y cómo enciende el compromiso.",
      "Pagar lo justo saca el dinero de la ecuación y deja brillar la motivación real.",
    ],
    ejercicios: [
      { nombre: "Elige el cómo", como: "En una tarea obligatoria, quédate con una decisión propia: el orden, la hora, la música, el lugar. La autonomía chica cambia toda la motivación.", cada: "diario" },
      { nombre: "Para qué sirve esto", como: "Escribe a quién le sirve lo que estás haciendo, con nombre y cara. El propósito concreto empuja más que cualquier premio.", cada: "semanal" },
    ],
  },
  {
    id: "brene",
    titulo: "Los dones de la imperfección",
    autor: "Brené Brown",
    via: "psicologia",
    emoji: "💛",
    porQue: "Veinte años investigando la vergüenza para llegar a esto: la conexión y el coraje nacen de mostrarse imperfecta. Brown convierte la vulnerabilidad en fortaleza y ofrece el antídoto científico al perfeccionismo que paraliza. Un libro que abraza mientras te empuja a soltar la armadura de tener que ser suficiente.",
    ideas: [
      "El perfeccionismo no es excelencia: es miedo con buena ropa.",
      "La vergüenza crece en el secreto y muere al nombrarla.",
      "Ser suficiente no se logra: se decide.",
      "La vulnerabilidad no es debilidad: es el nacimiento del coraje.",
      "Pertenecer no es encajar: es atreverte a ser tú y aún así ser aceptada.",
    ],
    ejercicios: [
      { nombre: "Cuéntale a alguien la parte imperfecta", como: "Dile a una persona de confianza algo que te da vergüenza de esta semana. La vergüenza necesita silencio para crecer.", cada: "semanal" },
      { nombre: "Suficiente por hoy", como: "Al terminar el día, di suficiente por hoy y déjalo ahí, con lo que quedó a medias. No es rendirse, es dejar de pedirte perfección.", cada: "diario" },
    ],
  },
  {
    id: "dyer",
    titulo: "Tus zonas erróneas",
    autor: "Wayne Dyer",
    via: "psicologia",
    emoji: "🪞",
    porQue: "El clásico de los clásicos del autoconocimiento: las zonas donde te saboteas, la culpa, la preocupación, la necesidad de aprobación, y cómo salir de ellas. Dyer escribe directo y sin adornos, y por algo ha acompañado a millones. Un empujón cariñoso a hacerte cargo de tu propia felicidad, sin esperar permiso de nadie.",
    ideas: [
      "La culpa mira al pasado y la preocupación al futuro: ninguna cambia nada.",
      "Necesitar aprobación de todos es rentarle tu valor a extraños.",
      "Eres la suma de tus elecciones de hoy, no de tus etiquetas de ayer.",
      "Nadie te hace sentir algo sin tu permiso: la respuesta es tuya.",
      "Vivir en el ahora es el antídoto contra la mayoría de tus zonas erróneas.",
    ],
    ejercicios: [
      { nombre: "De quién es esta obligación", como: "Cuando digas tengo que, cámbialo por elijo o no elijo y fíjate cómo se siente. La mayoría de las obligaciones son acuerdos viejos que nadie revisó.", cada: "diario" },
      { nombre: "Diez minutos de culpa y basta", como: "Si te va a doler el pasado, ponle diez minutos de reloj y después vuelve al presente. La culpa no arregla nada de lo que ya pasó.", cada: "semanal" },
    ],
  },
  {
    id: "cialdini",
    titulo: "Influencia (Influence)",
    autor: "Robert Cialdini",
    via: "psicologia",
    emoji: "🧲",
    porQue: "Los seis resortes que mueven a las personas a decir que sí, escritos por quien los estudió toda su vida. Cialdini sirve doble: para persuadir con ética y, sobre todo, para detectar cuándo te están apretando los resortes a ti. Después de leerlo, la publicidad, las ventas y hasta las discusiones se ven distintas.",
    ideas: [
      "Reciprocidad: quien da primero, recibe. Úsalo para bien.",
      "La escasez apura decisiones: cuando sientas urgencia, sospecha.",
      "El compromiso chico de hoy abre el grande de mañana.",
      "La prueba social manda: hacemos lo que hacen los demás.",
      "La autoridad y el gustar bajan tus defensas: nota cuándo operan sobre ti.",
    ],
    ejercicios: [
      { nombre: "Reconoce la presión", como: "Cuando sientas urgencia por decidir, nombra qué te están usando: escasez, autoridad, todos lo hacen. Verlo funcionando le quita la fuerza.", cada: "semanal" },
      { nombre: "Nunca decidas en el momento", como: "Frente a una oferta que te apura, di que lo vas a pensar hasta mañana. Si la oferta no aguanta un día, no era para ti.", cada: "diario" },
    ],
  },

  // ---------- Relaciones ----------
  {
    id: "gottman",
    titulo: "Siete reglas de oro para vivir en pareja",
    autor: "John Gottman",
    via: "relaciones",
    emoji: "💞",
    porQue: "Cuarenta años observando parejas reales en un laboratorio hasta poder predecir quién dura y quién no. Gottman convierte esa ciencia en siete principios concretos y ejercicios que cualquiera puede practicar. Tu página de Relaciones ya cita sus hallazgos; el libro trae el método completo para cuidar el vínculo antes de que se enfríe.",
    ideas: [
      "Responde a los pequeños intentos de conexión: voltear cuando te hablan pesa más que las citas románticas.",
      "Mapas de amor: conocer el mundo interno del otro, actualizado.",
      "Cinco interacciones positivas por cada negativa: la proporción mágica.",
      "Los cuatro jinetes (crítica, desprecio, defensa, muro) predicen el quiebre: cázalos.",
      "Repara rápido después de una pelea: no importa pelear, importa cómo vuelves.",
    ],
    ejercicios: [
      { nombre: "Cinco cosas buenas por cada roce", como: "Después de un desencuentro, busca cinco gestos amables de verdad: un gracias, un chiste, una mano. La proporción es lo que sostiene una pareja, no la ausencia de peleas.", cada: "diario" },
      { nombre: "Cómo empieza el reclamo", como: "Empieza por yo me sentí y no por tú siempre. Los primeros tres minutos deciden casi toda la conversación.", cada: "diario" },
      { nombre: "Los mapas del otro", como: "Pregunta algo que no sabes de la vida diaria de tu persona: qué le preocupa esta semana, qué le da ganas. Conocer se hace, no se supone.", cada: "semanal" },
    ],
  },
  {
    id: "attached",
    titulo: "Maneras de amar (Attached)",
    autor: "Amir Levine y Rachel Heller",
    via: "relaciones",
    emoji: "🧲",
    porQue: "La teoría del apego aplicada a la vida adulta: por qué amas como amas y cómo dejar de repetir el mismo baile doloroso. Levine y Heller explican los estilos seguro, ansioso y evitativo con una claridad que provoca un montón de ajás. Entenderte y entender al otro cambia por completo cómo eliges y cómo te relacionas.",
    ideas: [
      "Conocer tu estilo de apego explica patrones de años.",
      "Necesitar cercanía no es dependencia: es biología sana.",
      "La comunicación directa le gana al juego de las indirectas.",
      "El estilo ansioso y el evitativo se atraen y se lastiman: nómbralo para salir del ciclo.",
      "Una pareja segura te regula: elegir bien es media terapia.",
    ],
    ejercicios: [
      { nombre: "Reconoce tu estilo", como: "Fíjate qué haces cuando te sientes lejos de alguien: persigues o desapareces. No es un defecto, es un patrón, y los patrones se pueden ver venir.", cada: "unico" },
      { nombre: "Pide claro, no en clave", como: "Cuando necesites cercanía, dilo directo en vez de mandar señales o castigar con silencio. Pedir claro es lo que hace segura una relación.", cada: "semanal" },
    ],
  },
  {
    id: "cnv",
    titulo: "Comunicación no violenta",
    autor: "Marshall Rosenberg",
    via: "relaciones",
    emoji: "🗣",
    porQue: "El método para pedir sin herir y escuchar sin defenderte, útil con la pareja, la mamá, los hijos y la jefa por igual. Rosenberg propone un lenguaje de cuatro pasos que transforma reproches en necesidades y peleas en acuerdos. Simple de entender, difícil de dominar, y capaz de cambiar tus conversaciones más importantes.",
    ideas: [
      "Observación sin juicio: llegaste a las 9 en vez de siempre llegas tarde.",
      "Detrás de cada reproche hay una necesidad sin nombrar.",
      "Pide en positivo y concreto, no en queja abstracta.",
      "Nombra tu sentir sin culpar al otro: me siento, no tú me haces.",
      "Escuchar la necesidad detrás del ataque desarma casi cualquier pelea.",
    ],
    ejercicios: [
      { nombre: "Los cuatro pasos", como: "Di lo que pasó sin juicio, lo que sentiste, lo que necesitas y qué pides concreto. Cuatro frases cortas cambian una pelea entera.", cada: "semanal" },
      { nombre: "Traduce el reproche", como: "Cuando alguien te ataque, escucha qué necesidad hay debajo del reproche. Detrás de nunca me ayudas casi siempre hay estoy agotada.", cada: "diario" },
    ],
  },
  {
    id: "lenguajesamor",
    titulo: "Los 5 lenguajes del amor",
    autor: "Gary Chapman",
    via: "relaciones",
    emoji: "💬",
    porQue: "Simple y transformador: cada persona da y recibe amor en un idioma distinto, y muchos desencuentros son solo traducciones fallidas. Chapman describe cinco lenguajes y muestra que amar de verdad es hablar el del otro, no el propio. Una idea chica que arregla malentendidos grandes en pareja, con hijos y hasta con amigos.",
    ideas: [
      "Descubre tu lenguaje y el del otro: palabras, tiempo, regalos, servicio o contacto.",
      "Ama en el idioma del otro, no en el tuyo.",
      "El tanque emocional lleno cambia toda la relación.",
      "Damos amor como nos gustaría recibirlo: por eso a veces no llega.",
      "Preguntar el lenguaje del otro es más útil que adivinarlo.",
    ],
    ejercicios: [
      { nombre: "Averigua el idioma del otro", como: "Pregúntale a tu persona qué la hace sentir más querida: palabras, tiempo, gestos de ayuda, regalos o contacto. Después dale eso, no lo que tú darías.", cada: "unico" },
      { nombre: "Un gesto en su idioma", como: "Una vez por semana, un gesto pensado en el idioma de la otra persona. Amar en el idioma equivocado se siente como no amar.", cada: "semanal" },
    ],
  },
  {
    id: "abrazame",
    titulo: "Abrázame fuerte",
    autor: "Sue Johnson",
    via: "relaciones",
    emoji: "🤗",
    porQue: "La creadora de la terapia de pareja más efectiva que existe (EFT) enseña las siete conversaciones que reparan el vínculo. Johnson muestra que casi toda pelea es, en el fondo, una protesta por desconexión y una pregunta escondida: ¿estás ahí para mí? Un mapa cálido para volver a sentirte segura con quien amas.",
    ideas: [
      "Las peleas de pareja son protestas por desconexión, no por platos sucios.",
      "¿Estás ahí para mí? es la pregunta debajo de todas las peleas.",
      "La vulnerabilidad expresada a tiempo desarma la guerra.",
      "El apego seguro en pareja se puede reconstruir a cualquier edad.",
      "Nombrar el baile negativo que hacen juntos los saca de él.",
    ],
    ejercicios: [
      { nombre: "Debajo de la rabia", como: "En medio de una discusión, di lo que hay abajo: tengo miedo de que no me importes tanto, me sentí sola. La rabia protege, la vulnerabilidad conecta.", cada: "semanal" },
      { nombre: "Cinco minutos de reencuentro", como: "Al volver a verse en el día, cinco minutos de atención completa sin logística ni pantallas. El vínculo se repara en lo chico y seguido.", cada: "diario" },
    ],
  },
  {
    id: "limites",
    titulo: "Límites (Set Boundaries, Find Peace)",
    autor: "Nedra Glover Tawwab",
    via: "relaciones",
    emoji: "🚧",
    porQue: "El manual moderno de poner límites sin culpa: qué decir, cómo decirlo y qué hacer cuando no los respetan. Tawwab, terapeuta, escribe claro y práctico, con ejemplos para cada relación difícil. Si el resentimiento te avisa que algo falta, este libro te da las palabras exactas para cuidarte sin dejar de querer a los demás.",
    ideas: [
      "El resentimiento es la señal de un límite que falta.",
      "Un límite se comunica, no se insinúa.",
      "Decir que no es una frase completa (y un acto de amor propio).",
      "Poner un límite incomoda al principio: la culpa no significa que esté mal.",
      "No eres responsable de la reacción del otro a tu límite sano.",
    ],
    ejercicios: [
      { nombre: "Una frase de límite lista", como: "Ten una frase preparada y corta: eso no me acomoda, no voy a poder, prefiero que no. Sin justificación y sin pedir permiso.", cada: "unico" },
      { nombre: "Donde te dio rabia", como: "Fíjate dónde sentiste rabia o agotamiento esta semana. Casi siempre ahí falta un límite, no paciencia.", cada: "semanal" },
    ],
  },
  {
    id: "artedeamar",
    titulo: "El arte de amar",
    autor: "Erich Fromm",
    via: "relaciones",
    emoji: "🎨",
    porQue: "El clásico filosófico que sostiene algo incómodo y liberador: amar no es encontrar a la persona correcta, es practicar una habilidad, con disciplina y paciencia, toda la vida. Fromm distingue el amor maduro del enganche, y muestra que empieza por poder estar bien contigo. Corto, denso y de esos que reordenan cómo miras el amor.",
    ideas: [
      "El amor es práctica activa, no un accidente que te ocurre.",
      "Amar madura cuando das desde la abundancia, no desde la carencia.",
      "Cuidado, responsabilidad, respeto y conocimiento: los cuatro pilares.",
      "Si no puedes estar bien sola, buscarás en el otro un parche, no un amor.",
      "Amar a una persona bien es amar en ella a la humanidad entera.",
    ],
    ejercicios: [
      { nombre: "Amar como práctica", como: "Elige una acción concreta de cuidado y hazla sin esperar respuesta. El amor del libro no es un sentimiento que llega, es algo que se practica.", cada: "semanal" },
      { nombre: "Un rato bien sola", como: "Un rato contigo sin llamar a nadie ni llenar el silencio. Solo puede amar de verdad quien puede estar sola.", cada: "semanal" },
    ],
  },
  {
    id: "ganaramigos",
    titulo: "Cómo ganar amigos e influir sobre las personas",
    autor: "Dale Carnegie",
    via: "relaciones",
    emoji: "🤝",
    porQue: "Noventa años vigente porque la naturaleza humana no cambia: el interés genuino por el otro abre todas las puertas. Carnegie reúne principios simples de trato humano que sirven en el trabajo, la amistad y la familia. No es manipulación, es recordar que todos queremos sentirnos importantes, y actuar en consecuencia con sinceridad.",
    ideas: [
      "Interésate genuinamente: la gente nota la diferencia con la técnica.",
      "El nombre propio es el sonido más dulce para cualquier persona.",
      "Nunca digas estás equivocado: deja que el otro salve la cara.",
      "Habla de lo que le importa al otro, no de lo que te importa a ti.",
      "Un elogio sincero y específico vale más que mil halagos vacíos.",
    ],
    ejercicios: [
      { nombre: "El nombre y una pregunta", como: "Usa el nombre de la persona y hazle una pregunta sobre ella antes de contar lo tuyo. Interés real, no técnica.", cada: "diario" },
      { nombre: "Reconoce primero", como: "Antes de corregir a alguien, di algo verdadero que hizo bien. Nadie escucha con la guardia arriba.", cada: "semanal" },
    ],
  },
  {
    id: "perel",
    titulo: "Inteligencia erótica",
    autor: "Esther Perel",
    via: "relaciones",
    emoji: "🔥",
    porQue: "La paradoja del amor moderno contada con una lucidez rara: la cercanía da seguridad pero el deseo necesita misterio y espacio. Perel explora por qué la pasión se apaga justo cuando más nos queremos, y cómo sostener a la vez la ternura y el fuego. Un libro que da permiso para hablar de lo que casi nadie habla en pareja.",
    ideas: [
      "El deseo necesita espacio: la fusión total lo apaga.",
      "Mirar al otro brillando en lo suyo reaviva la chispa.",
      "La pareja perfecta no existe: existen dos personas que se eligen.",
      "Seguridad y aventura son necesidades opuestas y ambas válidas.",
      "El erotismo es imaginación, no solo cuerpo: se cultiva.",
    ],
    ejercicios: [
      { nombre: "Espacio para el deseo", como: "Deja algo sin contar, sin resolver, sin compartir. El deseo necesita distancia, y la cercanía total lo apaga.", cada: "semanal" },
      { nombre: "Qué te hace sentir viva", como: "Escribe en qué momentos te sientes más tú, sola o acompañada. Ese es el mapa que la pareja no puede adivinar.", cada: "unico" },
    ],
  },
  {
    id: "masterylove",
    titulo: "El dominio del amor (The Mastery of Love)",
    autor: "Don Miguel Ruiz",
    via: "relaciones",
    emoji: "🕊️",
    porQue: "Del autor de Los cuatro acuerdos, aplicado al amor: dejamos de sufrir en las relaciones cuando dejamos de esperar que el otro nos llene. Ruiz habla de las heridas emocionales y del miedo que envenena los vínculos, con la sencillez de un cuento sabio. Sanador para quien ama desde la carencia y quiere aprender a amar desde la plenitud.",
    ideas: [
      "Nadie viene a completarte: dos personas enteras se disfrutan, no se necesitan.",
      "Tomarte las cosas de forma personal envenena el vínculo: casi nada es sobre ti.",
      "El amor propio es el filtro: como te tratas tú, dejas que te traten.",
      "El miedo pide control; el amor da libertad.",
      "Amar sin condiciones empieza por hacerlo contigo misma.",
    ],
    ejercicios: [
      { nombre: "Ni cazadora ni presa", como: "Fíjate si estás tratando de controlar o de complacer, y suelta las dos. El amor no es un trato de domesticación.", cada: "semanal" },
      { nombre: "Tu propia herida primero", como: "Cuando algo del otro te duela de más, pregúntate qué herida vieja tocó. Lo que arde de más casi nunca es de ahora.", cada: "semanal" },
    ],
  },

  // ---------- Finanzas ----------
  {
    id: "piensehagaserico",
    titulo: "Piense y hágase rico",
    autor: "Napoleon Hill",
    via: "finanzas",
    emoji: "\u{1F4B0}",
    porQue: "El clásico que fundó todo el género del desarrollo personal, escrito tras veinte años entrevistando a los hombres más ricos de su época. Hill sostiene que la riqueza empieza en un deseo definido y una decisión firme, no en la suerte, y arma un método de trece pasos para llevar una idea hasta lo concreto. Denso y de otra época, pero sus ejercicios siguen moviendo a millones.",
    ideas: [
      "El deseo difuso no mueve nada: escribe cuánto quieres, para cuándo y qué darás a cambio.",
      "Lee ese propósito en voz alta dos veces al día, para que se te grabe hasta en el sueño.",
      "La decisión rápida y el cambio lento distinguen a quien llega: los indecisos se quedan.",
      "La mente maestra: rodéate de gente que piense contigo, porque nadie llega sola.",
      "La persistencia no es un talento, es un hábito que se entrena fallando de nuevo.",
    ],
    ejercicios: [
      { nombre: "Tu propósito por escrito", como: "Escribe en una hoja cuánto quieres ganar, para cuándo, y qué vas a dar en cambio. Guárdala donde la veas.", cada: "unico" },
      { nombre: "Leerlo dos veces al día", como: "Lee ese propósito en voz alta al despertar y antes de dormir, hasta que se te grabe. Suena raro y funciona.", cada: "diario" },
      { nombre: "Tu mente maestra", como: "Elige dos o tres personas que puedan pensar contigo en esto y ponles una conversación al mes en el calendario.", cada: "semanal" },
    ],
  },
  {
    id: "psicologiadinero",
    titulo: "La psicología del dinero",
    autor: "Morgan Housel",
    via: "finanzas",
    emoji: "🧠",
    porQue: "El mejor libro de dinero de la década, y no trata de fórmulas sino de conducta, porque con la plata el comportamiento le gana al conocimiento. Housel cuenta historias cortas que enseñan más que cualquier planilla: por qué gente sencilla se hace rica y genios quiebran. Cambia tu relación con el dinero sin pedirte un solo cálculo.",
    ideas: [
      "Hacerse rica y mantenerse rica son habilidades opuestas.",
      "El interés compuesto necesita tiempo, no genialidad: empieza ya.",
      "Riqueza es lo que NO se ve: lo que no gastaste.",
      "Suficiente es saber cuándo parar: la codicia arruina lo ganado.",
      "Ahorra sin una razón específica: la mejor razón aparece cuando menos la esperas.",
    ],
    ejercicios: [
      { nombre: "Cuánto es suficiente para ti", como: "Escribe con número cuánto necesitas para vivir tranquila. Sin ese número, la meta siempre es un poco más y nunca llega.", cada: "unico" },
      { nombre: "El costo de la tranquilidad", como: "Antes de una compra grande, calcula qué parte de tu libertad estás pagando. La riqueza es lo que no gastaste, no lo que se ve.", cada: "semanal" },
    ],
  },
  {
    id: "padrerico",
    titulo: "Padre rico, padre pobre",
    autor: "Robert Kiyosaki",
    via: "finanzas",
    emoji: "🏠",
    porQue: "El libro que le cambió el chip financiero a una generación entera con una idea simple: activos contra pasivos, y por qué la casa propia no siempre es una inversión. Kiyosaki contrasta la mentalidad de dos padres para mostrar que la escuela enseña a trabajar por dinero, no a que el dinero trabaje por ti. Discutible en detalles, potente en el clic mental.",
    ideas: [
      "Un activo pone plata en tu bolsillo, un pasivo la saca.",
      "Los ricos compran activos primero y lujos con las ganancias.",
      "Tu trabajo paga las cuentas, tus activos construyen libertad.",
      "La educación financiera importa más que el sueldo.",
      "El miedo y la avaricia manejan a quien no entiende el dinero: edúcate para elegir.",
    ],
    ejercicios: [
      { nombre: "Separa activos de pasivos", como: "Haz dos columnas: lo que te trae plata cada mes y lo que te la saca. La casa nueva del vecino casi siempre está en la segunda.", cada: "unico" },
      { nombre: "Págate primero", como: "Cuando entre plata, aparta tu parte antes de pagar cuentas. Si te pagas al final, nunca queda nada.", cada: "semanal" },
    ],
  },
  {
    id: "babilonia",
    titulo: "El hombre más rico de Babilonia",
    autor: "George Clason",
    via: "finanzas",
    emoji: "🏺",
    porQue: "Sabiduría financiera de hace un siglo en forma de parábolas de la antigua Babilonia. Simple, corto y sorprendentemente vigente: contiene el 80% de lo que necesitas saber para no vivir apretada. Clason enseña a través de historias que se quedan pegadas, empezando por la regla más poderosa y más ignorada de todas: págate primero.",
    ideas: [
      "Págate primero: el 10% de todo lo que ganas es tuyo para guardar.",
      "Haz que tu oro trabaje: cada moneda ahorrada es una obrera que trabaja para ti.",
      "Cuidado con los consejos de quien no sabe: pregunta a quien ya lo logró.",
      "Vive por debajo de lo que ganas, sin importar cuánto ganes.",
      "Protege tu capital: primero no perder, después crecer.",
    ],
    ejercicios: [
      { nombre: "La décima parte tuya", como: "De cada diez que entren, uno se queda contigo y no se toca. Es la regla más vieja y la única que nunca falla.", cada: "semanal" },
      { nombre: "Que la plata trabaje", como: "Lo que ahorras no debe quedarse quieto: cada peso guardado tiene que estar ganando algo. Los ahorros dormidos pierden contra la inflación.", cada: "semanal" },
    ],
  },
  {
    id: "ramit",
    titulo: "Te enseñaré a ser rico",
    autor: "Ramit Sethi",
    via: "finanzas",
    emoji: "📊",
    porQue: "Finanzas personales automatizadas y sin culpa: gasta sin miedo en lo que amas y corta sin piedad lo que no. Sethi arma un sistema práctico de seis semanas que le encanta a un cerebro TDAH, porque saca la fuerza de voluntad de la ecuación. Directo, con humor y enfocado en una vida rica definida por ti, no por la vitrina.",
    ideas: [
      "Automatiza todo: la fuerza de voluntad no es un plan financiero (ideal para TDAH).",
      "Tu vida rica es personal: define qué es tuyo y qué es aparentar.",
      "El gran ahorro está en las 3 grandes: vivienda, transporte, comida, no en los cafés.",
      "Gasta a lo grande en lo que amas y recorta fuerte en lo que no.",
      "Empezar imperfecto hoy le gana a optimizar perfecto nunca.",
    ],
    ejercicios: [
      { nombre: "Automatiza el día de pago", como: "Programa las transferencias para el día siguiente al sueldo: ahorro, inversión, cuentas. La disciplina que no depende de ti es la que dura.", cada: "unico" },
      { nombre: "Gasta sin culpa en lo que amas", como: "Elige dos cosas que sí te dan felicidad y déjalas en el presupuesto sin culpa. Después recorta con fuerza en el resto.", cada: "unico" },
    ],
  },
  {
    id: "tudinero",
    titulo: "Tu dinero o tu vida",
    autor: "Vicki Robin y Joe Domínguez",
    via: "finanzas",
    emoji: "⚖️",
    porQue: "El libro que redefine el dinero como energía vital: cada compra cuesta horas de tu vida, no solo pesos. Robin propone un método de nueve pasos que cambia la pregunta de me alcanza a lo vale, y muestra que existe un punto de suficiente donde más plata ya no suma felicidad. Base del movimiento de independencia financiera.",
    ideas: [
      "Calcula tu tarifa real por hora y pregunta cuántas horas de vida cuesta cada compra.",
      "Suficiente es un lugar hermoso: más allá empieza el exceso que pesa.",
      "La independencia financiera es libertad de tiempo, no lujos.",
      "Registrar cada peso, sin juicio, revela hacia dónde se va tu vida.",
      "Alinea tus gastos con tus valores y el dinero deja de doler.",
    ],
    ejercicios: [
      { nombre: "Cuántas horas cuesta", como: "Antes de comprar algo, divide el precio por lo que ganas en una hora. Después decide si vale esas horas de tu vida.", cada: "semanal" },
      { nombre: "Sube el gráfico", como: "Anota cada mes lo que entra y lo que sale, y míralos juntos en un solo gráfico. Ver la línea es lo que cambia la conducta, no la intención.", cada: "semanal" },
    ],
  },
  {
    id: "cerdocapitalista",
    titulo: "Pequeño cerdo capitalista",
    autor: "Sofía Macías",
    via: "finanzas",
    emoji: "🐷",
    porQue: "Finanzas personales en español latinoamericano, con humor y sin tecnicismos gringos: quincenas, tandas y la realidad de acá. Macías explica ahorro, deudas e inversión de forma tan clara y cercana que da hasta gracia, sin dejar de ser útil. El libro perfecto para empezar si los otros te suenan lejanos o gringos.",
    ideas: [
      "Registrar gastos sin juicio es el primer superpoder (tu módulo Finanzas).",
      "El ahorro sin objetivo se evapora: ponle nombre y fecha.",
      "Invertir no es de ricos: es como los no ricos construyen patrimonio.",
      "Conoce tus deudas al detalle: la que no ves es la que más te cuesta.",
      "Un fondo para imprevistos te da paz y te saca de los préstamos caros.",
    ],
    ejercicios: [
      { nombre: "Ponle nombre a tus deudas", como: "Lista cada deuda con su interés real, de la más caliente a la más fría. La que más quema se paga primero, no la más chica.", cada: "unico" },
      { nombre: "El fondo para el susto", como: "Junta de a poco un mes de gastos en una cuenta aparte y no la mires. Sin colchón, cualquier imprevisto se vuelve deuda.", cada: "semanal" },
    ],
  },
  {
    id: "simplepath",
    titulo: "El camino simple a la riqueza (The Simple Path to Wealth)",
    autor: "JL Collins",
    via: "finanzas",
    emoji: "🛤",
    porQue: "Cartas de un padre a su hija sobre dinero, convertidas en la guía de inversión más simple y aburrida que existe, y por eso mismo funciona. Collins desmitifica la bolsa y defiende una estrategia que cualquiera puede seguir sin ser experta ni vivir pendiente. Claridad total sobre cómo el dinero, bien puesto, compra tu libertad.",
    ideas: [
      "La libertad se compra con tasa de ahorro, no con sueldo.",
      "Fondos indexados de bajo costo le ganan a casi todos los expertos.",
      "El dinero que te posee (deudas) es esclavitud moderna: elimínala primero.",
      "No mires ni toques tus inversiones en cada bajada: el tiempo hace el trabajo.",
      "Un buen colchón de dinero te compra el lujo más grande: opciones.",
    ],
    ejercicios: [
      { nombre: "Calcula tu tasa de ahorro", como: "Divide lo que guardas por lo que ganas. Ese porcentaje, y no el sueldo, es el que decide cuándo dejas de necesitar trabajar.", cada: "unico" },
      { nombre: "Aburrido y automático", como: "Elige una inversión simple, amplia y de costo bajo, y no la toques cuando el mercado caiga. Mover la mano es lo que sale caro.", cada: "unico" },
    ],
  },
  {
    id: "diewithzero",
    titulo: "Muere con cero (Die with Zero)",
    autor: "Bill Perkins",
    via: "finanzas",
    emoji: "🎢",
    porQue: "El contrapeso necesario a tanto libro de ahorrar: acumular sin gastar también es perder la vida. Perkins argumenta que las experiencias tienen su temporada, que los recuerdos pagan dividendos y que morir con una montaña de plata sin usar es un mal plan. Provocador y liberador para quien ahorra por miedo y nunca disfruta.",
    ideas: [
      "Cada experiencia tiene su ventana: el viaje de mochila no espera a los 70.",
      "Invierte en recuerdos: pagan dividendos toda la vida.",
      "Da en vida (herencias, ayuda, regalos): cuando de verdad sirve.",
      "Optimiza para plenitud total, no para dinero total.",
      "Equilibra ahorrar y vivir en cada etapa, no todo para un futuro incierto.",
    ],
    ejercicios: [
      { nombre: "Experiencias con fecha", como: "Escribe tres experiencias que solo se pueden vivir en esta década de tu vida y ponles fecha. Hay cosas que a los setenta ya no se pueden hacer.", cada: "unico" },
      { nombre: "Dar mientras sirve", como: "Si vas a ayudar a alguien con plata, hazlo cuando le cambia la vida, no cuando ya no la necesite. Una herencia a los sesenta llega tarde.", cada: "semanal" },
    ],
  },
  {
    id: "millonariodealledo",
    titulo: "El millonario de al lado",
    autor: "Thomas Stanley y William Danko",
    via: "finanzas",
    emoji: "🚪",
    porQue: "Investigación real sobre millonarios de verdad, y el hallazgo sorprende: la mayoría no maneja autos de lujo ni vive en mansiones. Stanley y Danko muestran que la riqueza real es silenciosa y se construye viviendo bajo tus medios durante años. Un baño de realidad contra la idea de que gastar mucho es señal de tener mucho.",
    ideas: [
      "Los que aparentan riqueza suelen no tenerla, y al revés.",
      "Vivir bajo tus medios es el hábito millonario número uno.",
      "La defensa (gastar poco) importa tanto como el ataque (ganar).",
      "La riqueza se acumula en silencio, no se exhibe.",
      "Enseñar a los hijos a depender de sí mismos vale más que dejarles plata.",
    ],
    ejercicios: [
      { nombre: "Cuenta lo que se ve", como: "Suma lo que gastas al mes en cosas que solo existen para mostrar. Ahí está casi toda la distancia entre parecer rico y serlo.", cada: "semanal" },
      { nombre: "Tu patrimonio esperado", como: "Multiplica tu edad por tu ingreso anual y divide por diez. Si tu patrimonio está bajo eso, el problema es el gasto, no el sueldo.", cada: "unico" },
    ],
  },

  // ---------- Propósito ----------
  {
    id: "frankl",
    titulo: "El hombre en busca de sentido",
    autor: "Viktor Frankl",
    via: "proposito",
    emoji: "🕯",
    porQue: "Escrito por un psiquiatra que sobrevivió a los campos de concentración, es uno de los libros más poderosos jamás escritos sobre el sentido de la vida. Frankl muestra que la libertad última, la que nadie puede quitarte, es elegir tu actitud, y que el sentido se encuentra incluso en el sufrimiento. Breve, sobrecogedor y transformador.",
    ideas: [
      "Quien tiene un porqué soporta casi cualquier cómo.",
      "Entre el estímulo y la respuesta hay un espacio, y ahí vive tu libertad.",
      "El sentido no se inventa, se descubre: en el amor, la obra y el coraje.",
      "No preguntes qué esperas de la vida; pregunta qué espera la vida de ti.",
      "El sufrimiento inevitable puede volverse logro cuando le encuentras un para qué.",
    ],
    ejercicios: [
      { nombre: "Para qué o para quién", como: "Escribe una razón concreta para sostener lo que estás pasando: una persona, un trabajo, algo que quieres terminar. El sentido es lo que sostiene lo insoportable.", cada: "semanal" },
      { nombre: "Lo último que nadie te saca", como: "Frente a algo que no puedes cambiar, decide cómo lo vas a enfrentar. Ahí, dice el libro, está la última libertad.", cada: "semanal" },
    ],
  },
  {
    id: "ikigai",
    titulo: "Ikigai",
    autor: "Héctor García y Francesc Miralles",
    via: "proposito",
    emoji: "🌸",
    porQue: "La razón japonesa para levantarse cada mañana, aprendida de los ancianos de Okinawa, la zona donde más gente pasa los cien años. García y Miralles unen propósito, comunidad y el placer de fluir en lo pequeño en una fórmula sencilla y luminosa. Un recordatorio de que una vida larga y feliz se construye en los detalles diarios.",
    ideas: [
      "Tu ikigai vive donde se cruzan lo que amas, lo que sabes, lo que el mundo necesita y lo que te pagan.",
      "Mantenerse en movimiento suave y ocupada en lo que importa alarga la vida.",
      "El fluir diario vale más que las metas épicas.",
      "No te jubiles nunca de aquello que te da sentido.",
      "La comunidad y los vínculos cercanos son medicina para el cuerpo y el alma.",
    ],
    ejercicios: [
      { nombre: "Las cuatro preguntas", como: "Escribe qué amas, en qué eres buena, por qué te pagarían y qué necesita el mundo. Busca dónde se cruzan al menos dos.", cada: "unico" },
      { nombre: "Una razón para levantarte", como: "Antes de dormir, deja escrita una cosa concreta que te haga levantarte mañana. No tiene que ser grande, tiene que ser tuya.", cada: "diario" },
    ],
  },
  {
    id: "startwithwhy",
    titulo: "Empieza con el porqué",
    autor: "Simon Sinek",
    via: "proposito",
    emoji: "⭕",
    porQue: "Las personas y las marcas que inspiran parten del porqué, no del qué. Sinek muestra con ejemplos memorables que la gente no compra lo que haces, sino la razón por la que lo haces, y que un propósito claro ordena todas las decisiones difíciles. Aplica igual a tu emprendimiento, a tu carrera y a tu vida entera.",
    ideas: [
      "La gente no compra lo que haces, compra por qué lo haces.",
      "El porqué claro ordena todas las decisiones difíciles.",
      "El círculo dorado: porqué, cómo, qué, en ese orden.",
      "Inspirar dura; manipular con precio o miedo se agota rápido.",
      "Rodéate de quienes creen lo que tú crees: ahí nace la lealtad.",
    ],
    ejercicios: [
      { nombre: "Escribe tu porqué", como: "Completa la frase: hago esto porque creo que... Si suena a lo que hace todo el mundo, sigue escribiendo.", cada: "unico" },
      { nombre: "Cuenta el porqué primero", como: "La próxima vez que expliques lo que haces, empieza por lo que crees y deja el qué para el final. La gente se mueve por el porqué.", cada: "semanal" },
    ],
  },
  {
    id: "alquimista",
    titulo: "El alquimista",
    autor: "Paulo Coelho",
    via: "proposito",
    emoji: "🏜",
    porQue: "La fábula del pastor que cruza el desierto persiguiendo su leyenda personal. Simple hasta lo cursi y, sin embargo, mueve algo cada vez que se relee. Coelho envuelve una idea poderosa en un cuento breve: cuando de verdad quieres algo, el universo conspira, pero sobre todo el proceso mismo de buscarlo es el que te transforma.",
    ideas: [
      "Cuando quieres algo de verdad, el proceso mismo te transforma.",
      "El tesoro estaba en el viaje, no al final.",
      "El miedo a sufrir es peor que el sufrimiento.",
      "Escucha las señales: el mundo te habla si prestas atención.",
      "Realizar tu leyenda personal es tu única obligación real.",
    ],
    ejercicios: [
      { nombre: "Nombra tu tesoro", como: "Escribe qué es lo que buscarías si supieras que puedes. La mayoría no falla en el camino, falla en no nombrarlo nunca.", cada: "unico" },
      { nombre: "Un paso al día hacia allá", como: "Un solo paso pequeño en dirección a eso, cada día, aunque no sepas la ruta completa. El camino se ve caminando.", cada: "diario" },
    ],
  },
  {
    id: "bigmagic",
    titulo: "Libera tu magia (Big Magic)",
    autor: "Elizabeth Gilbert",
    via: "proposito",
    emoji: "✨",
    porQue: "Creatividad sin drama ni sufrimiento romántico: no necesitas permiso, ni una musa torturada, ni que salga perfecto. Gilbert invita a vivir con curiosidad y a hacer por el gusto de hacer, soltando el miedo que congela tantos proyectos. Ideal para destrabar eso que sueñas crear y que duerme guardado por temor a no ser suficiente.",
    ideas: [
      "El miedo puede venir en el auto, pero no maneja.",
      "Hecho es mejor que perfecto: la creatividad ama el movimiento.",
      "Tu curiosidad es la brújula cuando la pasión abruma.",
      "Crea por el placer de crear, no por el resultado ni el aplauso.",
      "No le cargues a tu arte la obligación de pagar las cuentas: déjalo jugar.",
    ],
    ejercicios: [
      { nombre: "Hazlo por curiosidad", como: "Sigue una curiosidad chica esta semana, sin pedirle que se convierta en un proyecto ni en un ingreso. La curiosidad es la puerta cuando la pasión no aparece.", cada: "semanal" },
      { nombre: "El miedo va de pasajero", como: "Cuando el miedo aparezca, dile que puede venir pero no maneja. No hay que esperar valentía para empezar.", cada: "diario" },
    ],
  },
  {
    id: "elemento",
    titulo: "El elemento",
    autor: "Ken Robinson",
    via: "proposito",
    emoji: "🎭",
    porQue: "Del educador más querido del mundo, un libro sobre el punto donde tu talento natural se encuentra con tu pasión, eso que Robinson llama tu elemento. Con historias reales muestra por qué la escuela muchas veces apaga en vez de encender, y por qué nunca es tarde para encontrar lo tuyo. Un permiso para tomar en serio lo que amas.",
    ideas: [
      "Tu elemento existe: donde lo que haces bien se junta con lo que amas.",
      "La tribu correcta valida y multiplica tu talento.",
      "Nunca es tarde: el elemento se encuentra a cualquier edad.",
      "La educación estándar mata la creatividad; recupérala a propósito.",
      "Amar lo que haces cambia por completo tu relación con el tiempo y la energía.",
    ],
    ejercicios: [
      { nombre: "Cuándo se te pasa la hora", como: "Anota en qué actividades pierdes la noción del tiempo. Ahí está la pista de lo tuyo, mucho más que en lo que te sale bien.", cada: "semanal" },
      { nombre: "Busca a tu tribu", como: "Encuentra un grupo, aunque sea de internet, que haga eso que te gusta. Nadie descubre lo suyo completamente solo.", cada: "unico" },
    ],
  },
  {
    id: "designlife",
    titulo: "Diseña tu vida",
    autor: "Bill Burnett y Dave Evans",
    via: "proposito",
    emoji: "📐",
    porQue: "Dos profesores de diseño de Stanford aplican el design thinking a la vida: en vez de buscar LA respuesta perfecta, prototipas caminos y pruebas en pequeño. Burnett y Evans dan herramientas concretas para cuando no sabes qué hacer con tu vida o tu carrera, sin la presión de acertar a la primera. Práctico, amable y liberador.",
    ideas: [
      "No hay una vida correcta: hay varias vidas posibles, prototipa varias.",
      "Los problemas de gravedad (lo que no puedes cambiar) no son problemas: reencuadra.",
      "Prueba en pequeño antes de saltar en grande: conversaciones y experimentos.",
      "Sigue la energía: anota cuándo te sientes viva y ahí hay pistas.",
      "No se trata de encontrar tu pasión de un golpe, sino de construirla probando.",
    ],
    ejercicios: [
      { nombre: "Tus tres vidas", como: "Escribe tres versiones de los próximos cinco años: la que va en camino, la que harías si esa se cayera, y la que harías si el dinero y la opinión no importaran.", cada: "unico" },
      { nombre: "Diario de energía", como: "Durante una semana anota qué actividades te dieron energía y cuáles te la quitaron. Ese registro decide mejor que cualquier test vocacional.", cada: "semanal" },
      { nombre: "Prototipa antes de saltar", como: "Antes de cambiar de rumbo, prueba una versión chica: conversa con alguien que ya lo hace, toma un curso, hazlo un fin de semana.", cada: "semanal" },
    ],
  },
  {
    id: "artistway",
    titulo: "El camino del artista",
    autor: "Julia Cameron",
    via: "proposito",
    emoji: "🖋",
    porQue: "El curso clásico de doce semanas para recuperar la creatividad que creías perdida. Cameron propone dos prácticas centrales, las páginas matutinas y la cita de artista, que destapan la voz propia debajo del ruido y el miedo. Tu diario de Mente apunta justo hacia acá: escribir para desatascarte y reencontrar lo que te enciende.",
    ideas: [
      "Tres páginas a mano cada mañana drenan el ruido y destapan la voz propia.",
      "La cita de artista semanal: salir sola a llenar el pozo.",
      "El perfeccionismo es miedo con buenos modales.",
      "La creatividad es un flujo natural: se destapa, no se fabrica.",
      "Trata el bloqueo como falta de confianza, no de talento.",
    ],
    ejercicios: [
      { nombre: "Páginas matutinas", como: "Tres páginas a mano al despertar, sin pensar y sin releer. No es escribir bonito, es sacar el ruido de la cabeza.", cada: "diario" },
      { nombre: "Cita de artista", como: "Una salida sola por semana a algo que te llene el pozo: una librería, un museo, una feria. Sin productividad, sin compañía.", cada: "semanal" },
    ],
  },
  {
    id: "sietehabitos",
    titulo: "Los 7 hábitos de la gente altamente efectiva",
    autor: "Stephen Covey",
    via: "proposito",
    emoji: "🧱",
    porQue: "El clásico de carácter y propósito que va mucho más hondo que un libro de productividad. Covey propone construir la vida desde principios, empezando con el fin en mente y poniendo primero lo primero. Es un marco completo para dejar de reaccionar y empezar a vivir según lo que de verdad te importa, por dentro antes que por fuera.",
    ideas: [
      "Empieza con el fin en mente: escribe cómo quieres ser recordada.",
      "Primero lo primero: lo importante no urgente es donde se construye la vida.",
      "Afila la sierra: renovarte no es perder el tiempo, es la base.",
      "Sé proactiva: entre lo que pasa y tu respuesta, tú eliges.",
      "Piensa en ganar-ganar: la abundancia alcanza para todos.",
    ],
    ejercicios: [
      { nombre: "Empieza con el fin en mente", como: "Escribe qué te gustaría que dijeran de ti las personas que amas, dentro de muchos años. Eso es tu norte, y ordena las decisiones difíciles.", cada: "unico" },
      { nombre: "Primero lo primero", como: "Cada domingo elige dos cosas importantes que no son urgentes y agéndalas antes que nada. Ahí se construye la vida, no en los incendios.", cada: "semanal" },
    ],
  },
  {
    id: "thinkingbig",
    titulo: "La magia de pensar en grande (The Magic of Thinking Big)",
    autor: "David J. Schwartz",
    via: "proposito",
    emoji: "🎈",
    porQue: "Un clásico de 1959 que sigue vivo por una razón: el tamaño de tu vida lo decide el tamaño de tus pensamientos, no tu talento ni tu suerte. Schwartz derriba las excusas una por una y muestra que la acción, no la confianza, es lo que rompe el miedo. Ideal para esos momentos en que te sorprendes pidiéndole poco a la vida.",
    ideas: [
      "No es la capacidad, es la escala: la mayoría no falla por soñar grande sino por apuntar chico.",
      "La excusitis es la enfermedad del fracaso: salud, edad, suerte, todas tienen antídoto.",
      "Actúa primero, la confianza llega después: la acción cura el miedo.",
      "Cómo piensas de ti define cómo te tratan los demás.",
      "Rodéate de gente que piensa en grande: el ambiente contagia.",
    ],
    ejercicios: [
      { nombre: "Cúrate de la excusitis", como: "Cuando aparezca la excusa de salud, edad, suerte o inteligencia, escríbela y busca a alguien que llegó igual con esa misma condición.", cada: "semanal" },
      { nombre: "Piensa como si ya", como: "Antes de una reunión o entrevista, párate, camina y habla como la persona que ya está donde quieres llegar. La conducta arrastra a la confianza.", cada: "diario" },
    ],
  },

  // ---------- Espiritualidad ----------
  {
    id: "poderahora",
    titulo: "El poder del ahora",
    autor: "Eckhart Tolle",
    via: "espiritualidad",
    emoji: "🌅",
    porQue: "El libro de presencia más influyente de la era moderna, y una invitación radical: no eres tu mente, y el presente es el único lugar donde la vida de verdad ocurre. Tolle enseña a observar el flujo incesante de pensamientos sin identificarte con él, y a encontrar una calma que no depende de que todo esté resuelto. Denso a ratos, pero puede cambiarte por dentro.",
    ideas: [
      "El ruido mental no eres tú: eres quien lo observa.",
      "El pasado y el futuro solo existen como pensamiento presente.",
      "La incomodidad disminuye cuando dejas de pelear con el ahora.",
      "Observar una emoción sin nombrarla ni huir la disuelve.",
      "La mente es una gran herramienta y una pésima dueña: úsala, no al revés.",
    ],
    ejercicios: [
      { nombre: "Tres respiraciones sin historia", como: "Tres respiraciones prestando atención solo a la sensación del aire. Es la manera más corta de salir de la cabeza y volver al momento.", cada: "diario" },
      { nombre: "Escucha la voz", como: "Cuando la mente empiece a hablar sin parar, escúchala como si fuera una radio en otra pieza. El que escucha no es la voz.", cada: "diario" },
    ],
  },
  {
    id: "yogui",
    titulo: "Autobiografía de un yogui",
    autor: "Paramahansa Yogananda",
    via: "espiritualidad",
    emoji: "🪷",
    porQue: "El libro que llevó el yoga y la meditación de la India a Occidente y que sigue inspirando a millones. Yogananda narra su propia búsqueda espiritual con una mezcla de asombro, ciencia y devoción difícil de olvidar. Si tu sadhana te llama, este es su árbol genealógico: la práctica diaria como vehículo hacia algo más grande que la mente.",
    ideas: [
      "La práctica diaria (sadhana) es el vehículo, no la teoría.",
      "La respiración es el puente entre cuerpo y consciencia.",
      "Los maestros aparecen cuando la búsqueda es sincera.",
      "La ciencia y la espiritualidad no se contradicen: se completan.",
      "La calma interior no depende de las circunstancias: se cultiva por dentro.",
    ],
    ejercicios: [
      { nombre: "Un rato de silencio antes del día", como: "Diez minutos sentada en silencio antes de tocar el teléfono. La disciplina diaria es el corazón entero del libro.", cada: "diario" },
      { nombre: "Anota lo que no se explica", como: "Guarda en el diario las coincidencias y los encuentros raros de la semana, sin apurarte a explicarlos. Verlos juntos cambia cómo miras.", cada: "semanal" },
    ],
  },
  {
    id: "monjeferrari",
    titulo: "El monje que vendió su Ferrari",
    autor: "Robin Sharma",
    via: "espiritualidad",
    emoji: "🏎",
    porQue: "La fábula del abogado estrella que colapsa, lo vende todo y reconstruye su vida con sabiduría oriental. Sharma envuelve principios de disciplina, propósito y paz interior en una historia fácil de leer y de recordar. Una puerta de entrada amable a la vida interior para quien siente que corre mucho y llega a poco.",
    ideas: [
      "El éxito sin paz interior es una derrota elegante.",
      "Cuida tu mente como un jardín: lo que dejas entrar, crece.",
      "Los rituales diarios pequeños sostienen la transformación grande.",
      "Vivir con propósito le da sentido hasta a los días grises.",
      "El tiempo es tu bien más valioso: gástalo en lo que de verdad importa.",
    ],
    ejercicios: [
      { nombre: "La hora que es tuya", como: "Reserva la primera hora del día para ti: cuerpo, silencio, lectura. Antes de que el día empiece a pedirte cosas.", cada: "diario" },
      { nombre: "Vive como si te quedara poco", como: "Pregúntate qué harías distinto hoy si te quedara un año. Después haz una de esas cosas esta semana.", cada: "semanal" },
    ],
  },
  {
    id: "almaliberada",
    titulo: "La liberación del alma",
    autor: "Michael Singer",
    via: "espiritualidad",
    emoji: "🕊",
    porQue: "¿Quién es la que escucha tu voz mental? Con esa pregunta simple, Singer desarma la identificación con el ruido interno con una claridad que se siente casi física. Enseña a soltar la tensión que cargas por dentro y a mantener el corazón abierto incluso cuando la vida aprieta. De esos libros que reordenan cómo te habitas por dentro.",
    ideas: [
      "Hay una voz en tu cabeza que no para: tú eres quien la escucha.",
      "La energía bloqueada (samskaras) se libera sintiéndola pasar, no evitándola.",
      "Decide no cerrarte: el corazón abierto es una práctica, no un estado.",
      "Deja pasar lo que llega sin aferrarte ni empujarlo: solo obsérvalo.",
      "La paz aparece cuando dejas de exigirle a la vida que sea distinta.",
    ],
    ejercicios: [
      { nombre: "Suéltalo en el momento", como: "Cuando algo te apriete el pecho, en vez de analizarlo, relaja el cuerpo y déjalo pasar. Se suelta soltando, no entendiendo.", cada: "diario" },
      { nombre: "Quién está mirando", como: "Varias veces al día, pregúntate quién es el que está notando todo esto. Ese lugar es más tranquilo que cualquier pensamiento.", cada: "diario" },
    ],
  },
  {
    id: "siddhartha",
    titulo: "Siddhartha",
    autor: "Hermann Hesse",
    via: "espiritualidad",
    emoji: "🌊",
    porQue: "La novela corta y luminosa del buscador que prueba todos los caminos, el ascetismo, el placer, la riqueza, y termina encontrando la sabiduría escuchando un río. Hesse condensa una vida entera de búsqueda espiritual en pocas páginas hermosas. Un recordatorio de que nadie puede darte la verdad: cada quien la vive a su manera.",
    ideas: [
      "La sabiduría no se enseña, se vive: cada camino propio es válido.",
      "El río está en todas partes al mismo tiempo: el tiempo es ilusión.",
      "Amar el mundo tal como es, esa es la llegada.",
      "El conocimiento se transmite; la sabiduría, no.",
      "Cada extravío del camino también enseña: nada se pierde del todo.",
    ],
    ejercicios: [
      { nombre: "Escucha el río", como: "Siéntate cinco minutos frente a algo que se mueve: agua, árboles, gente pasando. Sin hacer nada, solo escuchando.", cada: "semanal" },
      { nombre: "Lo que aprendiste tú", como: "Escribe una cosa que solo entendiste viviéndola, que nadie te pudo enseñar. Ese es el punto del libro completo.", cada: "unico" },
    ],
  },
  {
    id: "derrumba",
    titulo: "Cuando todo se derrumba",
    autor: "Pema Chödrön",
    via: "espiritualidad",
    emoji: "🍂",
    porQue: "La monja budista para los momentos rotos: no hay suelo firme y esa, dice Chödrön, es la buena noticia. Con calidez y sin adornos, enseña a acercarse al dolor con curiosidad en vez de huir, y a habitar la incertidumbre sin desarmarte. Ideal para leer en plena crisis, no después, cuando más necesitas una mano sabia.",
    ideas: [
      "Las cosas se arman y se desarman: esa es la vida, no un error.",
      "Acércate a lo que duele con curiosidad en vez de huir.",
      "La esperanza y el miedo son la misma moneda: suelta ambas y respira.",
      "Quedarte con la incomodidad, sin arreglarla al toque, te hace más fuerte.",
      "La compasión nace justo donde tocaste tu propio dolor.",
    ],
    ejercicios: [
      { nombre: "Quédate un minuto", como: "Cuando venga la angustia, quédate un minuto sin arreglarla, sin distraerte y sin explicártela. Solo un minuto, y ahí ya cambió algo.", cada: "diario" },
      { nombre: "No estás sola en esto", como: "Cuando algo te duela, acuérdate de que en este mismo momento hay miles de personas sintiendo exactamente eso. El dolor compartido pesa distinto.", cada: "diario" },
    ],
  },
  {
    id: "pazcadapaso",
    titulo: "La paz está en cada paso",
    autor: "Thich Nhat Hanh",
    via: "espiritualidad",
    emoji: "🚶",
    porQue: "Mindfulness aterrizado en la vida real: lavar los platos, caminar, respirar en el semáforo en rojo. Thich Nhat Hanh enseña que la paz no está en un retiro lejano sino en la forma en que haces las cosas más simples, ahora mismo. Tu caminata consciente de Mente viene justo de esta tradición dulce y profunda.",
    ideas: [
      "La respiración consciente es un hogar portátil: siempre está contigo.",
      "Lava los platos para lavar los platos: cada acto puede ser meditación.",
      "La sonrisa leve cambia el estado: el cuerpo también guía a la mente.",
      "Volver al presente una y otra vez es toda la práctica.",
      "Cuidar tu paz interior es también cuidar la del mundo.",
    ],
    ejercicios: [
      { nombre: "Respirando, sé que respiro", como: "Al caminar, di por dentro: inspirando sé que inspiro, espirando sonrío. Convierte el traslado en práctica.", cada: "diario" },
      { nombre: "El teléfono como campana", como: "Elige un sonido de tu día, el teléfono, una puerta, el hervidor, y cada vez que suene respira una vez completa. La atención se entrena en lo cotidiano.", cada: "diario" },
    ],
  },
  {
    id: "lobos",
    titulo: "Mujeres que corren con los lobos",
    autor: "Clarissa Pinkola Estés",
    via: "espiritualidad",
    emoji: "🐺",
    porQue: "Mitos y cuentos de todo el mundo analizados por una psicoanalista junguiana para recuperar a la mujer salvaje e intuitiva que la domesticación fue callando. Estés escribe como quien cuenta historias junto al fuego, y cada relato es una medicina distinta. Un libro para leer despacio, que devuelve fuerza a lo instintivo y creativo.",
    ideas: [
      "La intuición es un músculo ancestral: se recupera usándola.",
      "Los ciclos de muerte y renacimiento son la naturaleza femenina profunda.",
      "Volver a lo salvaje es volver a casa, no perder el control.",
      "Guarda tu fuego creativo de quienes lo apagan: no todo se comparte.",
      "Escuchar tu voz instintiva es un acto de sanación y de poder.",
    ],
    ejercicios: [
      { nombre: "Lo que te robaron", como: "Escribe qué parte tuya guardaste para que te aceptaran: la voz fuerte, la rabia, el cuerpo, el arte. Nombrarla es el primer paso para volver a buscarla.", cada: "unico" },
      { nombre: "Tiempo salvaje", como: "Un rato a la semana sola en algo que no le sirve a nadie: caminar sin rumbo, cantar, escribir sin mostrar. El alma se alimenta de lo inútil.", cada: "semanal" },
    ],
  },
  {
    id: "profeta",
    titulo: "El profeta",
    autor: "Khalil Gibran",
    via: "espiritualidad",
    emoji: "🌙",
    porQue: "Poesía sabia sobre el amor, el trabajo, los hijos, la libertad y la muerte, envuelta en la despedida de un profeta a un pueblo que ama. Se lee en una hora y se relee toda la vida, porque cada pasaje cae distinto según lo que estés viviendo. Un pequeño tesoro para volver una y otra vez, subrayar y regalar.",
    ideas: [
      "Vuestros hijos no son vuestros hijos: son la vida que se prolonga.",
      "El trabajo es amor hecho visible.",
      "La alegría y la tristeza beben del mismo pozo.",
      "En la cercanía, deja espacios: los pilares del templo se sostienen separados.",
      "Dar de lo que tienes es poco; dar de ti misma es dar de verdad.",
    ],
    ejercicios: [
      { nombre: "Lee una página en voz alta", como: "Elige un capítulo, del amor, del trabajo, de los hijos, y léelo en voz alta despacio. Está escrito para sonar, no para estudiarse.", cada: "semanal" },
      { nombre: "Escribe tu propia respuesta", como: "Después de leer un capítulo, escribe qué dirías tú si te preguntaran lo mismo. Ahí aparece lo que de verdad piensas.", cada: "semanal" },
    ],
  },

];

export function librosDe(via: ViaLibro): Libro[] {
  return LIBROS.filter((l) => l.via === via);
}

// ---------- Estado de lectura (en el navegador por ahora) ----------
export type EstadoLibro = "quiero" | "leido";

const LS_ESTADOS = "nucleoos-libros-estado";

// Cada marca guarda también su fecha, para que "Libros terminados" pueda
// alimentar metas de Aprendizaje. El formato viejo (solo el estado) se
// sigue leyendo: esas marcas cuentan como sin fecha, a tu favor.
type MarcaLibro = EstadoLibro | { e: EstadoLibro; f: string };

function marcasCrudas(): Record<string, MarcaLibro> {
  try {
    const raw = localStorage.getItem(LS_ESTADOS);
    if (raw) return JSON.parse(raw) as Record<string, MarcaLibro>;
  } catch { /* nada */ }
  return {};
}

export function estadosLibros(): Record<string, EstadoLibro> {
  const out: Record<string, EstadoLibro> = {};
  for (const [id, m] of Object.entries(marcasCrudas())) out[id] = typeof m === "string" ? m : m.e;
  return out;
}

/** Libros marcados como leídos, con la fecha de la marca si existe y su vía.
 *  La vía sale de la biblioteca curada o de la memoria de libros propios. */
export function librosLeidos(): Array<{ id: string; fecha: string | null; via: ViaLibro | null }> {
  let viasPropias: Record<string, string> = {};
  try {
    viasPropias = JSON.parse(localStorage.getItem("nucleoos-libros-propios-vias") ?? "{}") as Record<string, string>;
  } catch { /* nada */ }
  return Object.entries(marcasCrudas())
    .filter(([, m]) => (typeof m === "string" ? m : m.e) === "leido")
    .map(([id, m]) => ({
      id,
      fecha: typeof m === "string" ? null : m.f,
      via: LIBROS.find((l) => l.id === id)?.via ?? (viasPropias[id] as ViaLibro | undefined) ?? null,
    }));
}

export function marcarLibro(id: string, estado: EstadoLibro | null): Record<string, EstadoLibro> {
  const todos = marcasCrudas();
  if (estado === null) delete todos[id];
  else todos[id] = { e: estado, f: hoyLocal() };
  localStorage.setItem(LS_ESTADOS, JSON.stringify(todos));
  return estadosLibros();
}
