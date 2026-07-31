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
  /** El libro contado en varios párrafos, para leer sin tenerlo. Aparece al
   *  abrir la tarjeta, así la cuadrícula se mantiene liviana. Los párrafos
   *  se separan con un salto de línea doble. */
  resumen?: string;
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
    resumen:
      "Hallowell y Ratey son dos psiquiatras que llevan más de treinta años tratando el TDAH, y los dos lo tienen. Este libro es su puesta al día: lo que la ciencia entendió en las últimas dos décadas, contado sin lenguaje clínico y sin tratarte como un caso. Empiezan proponiendo dejar de llamarlo déficit, porque el problema nunca fue que te falte atención, sino que no la puedes dirigir cuando quieres.\n\nEl centro del libro es una imagen que se te queda: un motor de Ferrari con frenos de bicicleta. Tu cerebro no está lento ni averiado, está corriendo más rápido de lo que puede frenar. Los autores explican qué pasa físicamente cuando la mente se va a esa red interna donde vive el rumiar, y por qué ahí aparecen la culpa, la vergüenza y las historias oscuras que te cuentas de ti misma a las tres de la mañana.\n\nLa segunda mitad son los frenos, y no es lo que esperarías. Ejercicio, porque el movimiento le da al cerebro lo que ningún truco de organización puede darle. Conexión humana real, que ellos llaman la otra vitamina. Estructura afuera de tu cabeza, porque adentro no se sostiene. Y la medicación tratada con honestidad, sin promesa y sin miedo. Es el libro para leer primero, cuando lo que necesitas es entender qué tienes y que hay salida.",
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
    resumen:
      "Jessica McCabe fue la niña de la que todos esperaban mucho y la adulta que a los treinta y dos años tenía un matrimonio roto, un trabajo perdido y ninguna explicación. En vez de esconderlo, abrió un canal de YouTube para investigar en público qué le pasaba a su propio cerebro. Ese canal se volvió el lugar donde millones de personas se entendieron por primera vez, y este libro es todo eso ordenado.\n\nSu idea central es simple y cambia todo: tu cerebro no está roto, está construido distinto, y los consejos que le sirven a los demás fallan contigo porque están hechos para otra máquina. Explica que tu sistema nervioso no se mueve por importancia sino por interés, urgencia, novedad y desafío, y que pedirle disciplina a un cerebro así es como pedirle a alguien miope que se concentre más para ver.\n\nDe ahí sale su concepto más útil, el muro de lo terrible: esa pared invisible que se levanta frente a una tarea de dos minutos y está hecha de capas de vergüenza, intentos fallidos y miedo al juicio. McCabe enseña a bajar cada capa en vez de tratar de saltar el muro con fuerza de voluntad. El resto del libro son herramientas concretas para memoria, tiempo, emociones y desorden, todas escritas con la calidez de alguien que estuvo exactamente donde tú estás.",
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
    resumen:
      "En 1994, cuando casi nadie aceptaba que el TDAH existiera en adultos, estos dos médicos publicaron el libro que abrió la conversación. Antes de esto, un adulto que no podía terminar nada era simplemente flojo, desordenado o poco brillante. Después de esto, tuvo un nombre, una explicación y un tratamiento. Vale leerlo aunque haya libros más nuevos, porque este es el que puso los cimientos.\n\nLo que lo hace distinto son los casos. Página tras página aparecen personas reales: el ejecutivo brillante que no logra abrir el correo, la mujer que lleva veinte años sintiendo que finge ser adulta, el niño al que todos le dijeron que podría si quisiera. Leerlos produce un efecto raro y necesario, el de mirarte en un espejo y darte cuenta de que lo tuyo tiene forma, que no eres un caso único ni un desastre inexplicable.\n\nLos autores describen las distintas caras del TDAH, incluida la que no se mueve ni interrumpe y por eso pasa décadas sin diagnóstico, y explican qué esperar de la evaluación, la terapia y el tratamiento. Pero lo que de verdad te llevas es más simple: la sensación de que toda esa vida en la que sentiste que algo no calzaba tiene una razón, y que la razón no eres tú siendo insuficiente.",
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
    resumen:
      "Gabor Maté es médico, tiene TDAH y sus tres hijos también. Escribió este libro después de años de tratar adicciones y trauma en el barrio más duro de Vancouver, y desde ahí propone una mirada que no encontrarás en los manuales: el TDAH no como una avería genética a secas, sino como la forma en que un cerebro muy sensible se desarrolló en un ambiente que no le pudo dar toda la calma que necesitaba.\n\nSu argumento es que los primeros años importan más de lo que la medicina reconoce. No dice que los padres tengan la culpa, y esto es clave: dice que la sintonía emocional temprana moldea circuitos que después se ven como falta de atención, y que un padre agotado, deprimido o sobrepasado no eligió nada de eso. Es la parte que algunos investigadores discuten, así que conviene leerla como una lente más y no como la única verdad.\n\nLo que sí es indiscutible es el efecto que produce. Para quien cargó durante años la sensación de ser difícil, exagerada o defectuosa, Maté ofrece algo que casi ningún libro de TDAH da: compasión de verdad, y la idea de que el cerebro sigue cambiando, que nada quedó cerrado en la infancia. Termina enseñando a hacerte de madre a ti misma, con paciencia y sin el látigo de siempre.",
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
    resumen:
      "Tamara Rosier trabaja como coach de personas con TDAH y tiene TDAH, y notó algo que los libros de organización se saltan: el problema más grande de tu día casi nunca es el calendario, son las emociones. La culpa de la mañana, la vergüenza de la tarde, la rabia con una misma a las nueve de la noche. Este libro empieza justo ahí, en la parte que duele.\n\nDescribe la montaña rusa por dentro con una precisión incómoda. El ciclo de prometer con toda el alma y no cumplir, y cómo cada vuelta deja un depósito de vergüenza que hace más difícil la siguiente. La forma en que un comentario chico te desarma el día entero, porque tu sistema emocional reacciona antes y más fuerte. Y esa voz que traduce todo a lo mismo, que es que hay algo mal contigo.\n\nDesde ahí entrega herramientas que sirven de verdad. Aprender a leer con qué energía llegaste al día y ordenar las tareas según eso en vez de según la lista. Distinguir la tarea del sentimiento que trae, porque casi nunca cuesta el trabajo, cuesta el aburrimiento o el miedo. Y cortar el ciclo de la vergüenza antes de que arrastre el día completo. Se siente escrito por alguien que estuvo exactamente donde tú estás, y eso se nota en cada página.",
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
    resumen:
      "El TDAH en mujeres se ve distinto y se diagnostica tarde, muchas veces pasados los cuarenta, después de años de escuchar que eres desordenada, dramática o demasiado. Sari Solden lleva décadas trabajando exactamente con esas mujeres, y junto a Michelle Frank escribió este libro que no es un manual de organización sino algo bastante más profundo.\n\nLa tesis es que el daño más grande no lo hicieron los síntomas, lo hizo el esfuerzo de esconderlos. Décadas compensando en silencio, trabajando el doble para parecer normal, evitando todo lo que podía delatarte, guardando la parte tuya que era demasiado. Ese trabajo invisible es el que te dejó agotada, y es también el que nadie te agradeció nunca porque nadie lo vio.\n\nEl libro está armado como un taller, con ejercicios de escritura en cada capítulo, y va en un orden claro: entender tu cerebro, revisar la historia que te contaste sobre ti, soltar la vergüenza, y después decidir cómo quieres vivir en grande y sin esconderte. No promete que te vuelvas ordenada. Promete algo mejor, que es dejar de gastar la vida disimulando quién eres.",
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
    resumen:
      "Neil Fiore era psicólogo en Berkeley y notó que sus pacientes más brillantes eran los que más postergaban. De ahí salió la idea que hace grande a este libro: la procrastinación no es flojera ni falta de carácter, es un mecanismo de protección. Postergas porque en algún nivel esa tarea representa una amenaza, al juicio, al fracaso, a descubrir que no eres suficiente.\n\nSu invento más útil se llama programación inversa, y da vuelta el calendario completo. En vez de llenarlo de trabajo y meter el descanso en lo que sobre, primero agendas el descanso, el ejercicio, las comidas y lo que disfrutas. El trabajo entra después, en lo que queda. Suena al revés y funciona por una razón fina: cuando el juego está garantizado, el trabajo deja de ser la cosa que te robó la vida, y sin esa amenaza la resistencia baja sola.\n\nLo demás es igual de práctico. Bloques cortos de treinta minutos en los que solo hay que empezar, con permiso explícito de que salga mal. La costumbre de preguntarte cuándo puedes empezar en vez de cuándo tienes que terminar. Y una regla que a un cerebro TDAH le calza perfecto, que es no dejar nunca el trabajo en un punto difícil, porque el yo de mañana necesita una entrada fácil.",
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
    resumen:
      "Jaclyn Paul escribe desde su casa real, no desde una casa de revista. Tiene TDAH, probó durante años todos los sistemas de organización que existen y los vio fallar uno por uno, hasta que entendió por qué: están diseñados para cerebros que recuerdan, que ven el desorden acumularse y que no tienen días en que la energía simplemente no llega.\n\nSu punto de partida es liberador. El desorden de tu casa no es un defecto moral ni una prueba de que eres una adulta fallida, es un síntoma, y los síntomas se manejan con sistemas, no con culpa. De ahí construye métodos que aguantan la vida real: un lugar fijo para cada cosa que siempre pierdes, una sola bandeja de entrada en vez de cinco montones, rutinas tan cortas que sobreviven a un día malo.\n\nLo que más se agradece es la honestidad sobre las recaídas. Paul asume que la casa se va a desordenar de nuevo, que vas a abandonar el sistema y que vas a volver, y diseña todo pensando en eso en vez de pedirte una constancia que no tienes. Es el libro práctico para cuando ya entendiste tu cerebro y lo que necesitas ahora es que la casa deje de ganarte.",
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
    resumen:
      "Chris Bailey se dedicó un año entero a experimentar consigo mismo sobre productividad, y de ahí salió este libro sobre lo que llama tu recurso más escaso, que no es el tiempo sino la atención. Su idea de fondo es que la atención no se gestiona con más esfuerzo, se gestiona eligiendo a qué la apuntas y cuánta le queda disponible.\n\nLa primera mitad es el hiperfoco, que él define no como el accidente que te pasa a veces sino como un estado que se puede invitar: una sola tarea, un espacio sin interrupciones y una intención dicha antes de empezar. Explica por qué tu memoria de trabajo se llena con cuatro cosas y todo lo que llega después bota algo, y por qué cada notificación cuesta bastante más de lo que dura.\n\nLa segunda mitad es la parte que casi nadie cuenta y que a un cerebro TDAH le sirve todavía más: soltar la atención a propósito. Caminar sin pódcast, lavar los platos sin nada de fondo, dejar la mente vagar. Bailey muestra que ahí es donde el cerebro conecta ideas viejas y aparecen las soluciones que no llegan trabajando. Para ti eso vale doble, porque convierte lo que siempre te dijeron que era distracción en una herramienta que puedes usar cuando quieras.",
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
    resumen:
      "James Clear escribió el libro de hábitos que más se vende en el mundo, y su fuerza está en una idea que suena obvia hasta que la aplicas: no subes de nivel por la meta que te pones, sino por el sistema que repites. Las metas son la dirección, los sistemas son lo que te lleva. Por eso dos personas con la misma meta terminan en lugares distintos.\n\nEl mecanismo que propone tiene cuatro pasos y sirve tanto para armar un hábito como para desarmarlo. Que sea obvio, que sea atractivo, que sea fácil y que sea satisfactorio. Para dejar uno, das vuelta las cuatro. De ahí salen sus herramientas más conocidas: apilar el hábito nuevo sobre uno que ya haces, diseñar el ambiente para que lo bueno esté a mano, y la regla de los dos minutos, que reduce cualquier hábito a su versión de entrada.\n\nSu aporte más profundo viene al final. Clear dice que los hábitos que duran no son los que persigues por un resultado, sino los que sostienen una identidad. No es correr para bajar de peso, es convertirte en alguien que se mueve. Cada repetición es un voto a favor de la persona que quieres ser, y por eso la regla que más importa es no fallar dos días seguidos: un tropiezo no borra la identidad, dos empiezan a construir otra.",
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
    resumen:
      "BJ Fogg dirige un laboratorio de conducta en Stanford y lleva veinte años estudiando qué hace que una persona haga algo. Su respuesta cabe en una fórmula: la conducta ocurre cuando la motivación, la capacidad y una señal coinciden en el mismo momento. Si algo no está pasando, siempre falta uno de los tres, y casi nunca es el que crees.\n\nSu conclusión práctica va contra todo lo que te enseñaron. La motivación es el ingrediente menos confiable de los tres porque sube y baja sin permiso, así que lo inteligente es no depender de ella. En vez de eso, bajas la dificultad hasta que el hábito sea diminuto: dos flexiones, una página, pasarte el hilo dental por un solo diente. Tan chico que no necesite motivación para ocurrir.\n\nLa parte que lo distingue de otros libros de hábitos es la celebración. Fogg insiste en que festejes en el instante mismo en que cumples, con un gesto, una sonrisa o diciéndote algo bueno, porque la emoción positiva es lo que graba el hábito en el cerebro, no la repetición sola. Suena tonto y es lo que más funciona. Si te cuesta arrancar cosas y llevas años sintiendo que te falta disciplina, este libro te saca ese peso de encima.",
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
    resumen:
      "Nir Eyal escribió antes un libro sobre cómo las aplicaciones te enganchan, y después escribió este para enseñar a soltarse. Empieza desarmando la excusa cómoda: el teléfono no es el problema de fondo. La distracción no empieza en la pantalla, empieza adentro, en una incomodidad que quieres dejar de sentir. Aburrimiento, ansiedad, la tarea que te da miedo abrir.\n\nDe ahí sale su definición, que es la clave del libro. Lo contrario de la distracción no es el foco, es la tracción: toda acción que te acerca a lo que decidiste. Y cualquier cosa se convierte en distracción si te aleja de eso, incluso responder correos o limpiar la cocina. Por eso su primera herramienta es planificar el tiempo por bloques con hora de inicio y término, porque solo se puede saber que te distrajiste si antes decidiste qué ibas a hacer.\n\nLa parte más útil es cómo tratar el impulso. En vez de resistirlo con fuerza, Eyal enseña a quedarse con la sensación diez minutos y observar cómo baja sola, porque los impulsos son olas y no líneas rectas. Después vienen los trucos externos, apagar avisos, sacar aplicaciones, poner precio al compromiso. Pero el orden importa: primero el adentro, después el teléfono.",
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
    resumen:
      "Charles Duhigg es periodista y armó este libro con historias, no con listas. La de una mujer que cambió su vida entera cuando dejó de fumar, la de un ejecutivo que arregló una empresa quebrada concentrándose solo en la seguridad de los trabajadores, la de un supermercado que sabía que una clienta estaba embarazada antes que su familia. Todas apuntan al mismo mecanismo.\n\nEse mecanismo tiene tres partes y una vez que lo ves no lo puedes dejar de ver. Una señal que dispara, una rutina que ejecutas y un premio que tu cerebro registra. Lo importante es que el hábito no se borra, la conexión ya quedó hecha. Lo que sí se puede es dejar la misma señal y el mismo premio, y cambiar únicamente la rutina del medio. Ese es el único punto donde un hábito cede.\n\nLa segunda idea grande es la de los hábitos ancla: hay unos pocos que arrastran a todos los demás. Hacer la cama, salir a caminar, anotar lo que comes. No cambian mucho por sí solos, pero mueven una pieza que empuja al resto. Para un cerebro que se agobia con listas largas, esta es la mejor noticia del libro: no hay que cambiar veinte cosas, hay que encontrar la que mueve las otras diecinueve.",
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
    resumen:
      "Cal Newport es profesor de ciencias de la computación y su argumento es económico antes que espiritual. En un mundo donde casi todos trabajan interrumpidos, la capacidad de concentrarte sin distracción en algo difícil se volvió rara, y por lo tanto valiosa. Lo llama trabajo profundo, y dice que es la habilidad que separa a quien avanza de quien solo responde mensajes todo el día.\n\nSu enemigo declarado es lo que llama residuo de atención: cuando saltas de una tarea a otra, una parte de tu cabeza se queda pegada en la anterior, así que nunca estás del todo en ninguna. Por eso revisar el correo cada quince minutos no cuesta quince minutos, cuesta la profundidad de todo el bloque. Newport propone agendar el trabajo profundo como una cita fija, defenderlo con el teléfono en otra pieza y aceptar que aburrirse es parte del entrenamiento.\n\nLo que más se agradece es su ritual de cierre. Al terminar la jornada revisas lo pendiente, dejas escrito el primer paso de mañana y dices una frase que marca el fin. Sin eso, el trabajo sigue abierto en tu cabeza toda la noche. Es un libro exigente y a veces duro con las redes sociales, pero si sientes que trabajas todo el día y no avanzas en nada, aquí está la explicación.",
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
    resumen:
      "Greg McKeown parte de una escena que se le quedó a mucha gente: el día que nació su hija, él estaba en una reunión de trabajo a la que no era necesario ir, y fue igual. De ahí sale la pregunta del libro completo, que es qué pasa cuando pasas la vida diciendo que sí a todo por no incomodar a nadie.\n\nSu tesis es que casi todo es ruido y unas pocas cosas son lo esencial, y que la diferencia entre una persona agotada y una enfocada no es cuánto trabaja, es cuánto descarta. No propone hacer más en menos tiempo, propone hacer menos cosas pero mejor. Y aclara algo incómodo: si tú no eliges dónde va tu tiempo, alguien más lo va a elegir por ti, y esa es la definición práctica de una vida ajena.\n\nSus herramientas son directas. La regla de que si algo no es un nueve sobre diez, es un no, porque los casi son los que te llenan la agenda. Preguntarte no qué pierdes al decir que no, sino qué pierdes al decir que sí. Y proteger el tiempo de pensar y de dormir como si fueran reuniones importantes, porque son las que hacen posible todo lo demás. Es el libro para leer cuando no das más y no entiendes bien por qué.",
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
    resumen:
      "Gary Keller construyó una de las mayores empresas inmobiliarias del mundo y escribió este libro cuando entendió qué había hecho distinto: no hizo más cosas, hizo una sola a la vez y en el orden correcto. Su primera pelea es contra la multitarea, que desarma con datos: cambiar de tarea tiene un costo real en tiempo y en errores, y la sensación de estar avanzando en cinco frentes es justamente una sensación.\n\nEl corazón del libro es una pregunta que se puede usar todos los días, para el trabajo, la salud, la casa o la pareja. Cuál es la única cosa que puedo hacer, de modo que al hacerla todo lo demás se vuelva más fácil o innecesario. Fíjate en la segunda parte, porque ahí está el filo: no se trata de lo más urgente ni de lo más rápido, se trata de lo que desbloquea el resto.\n\nLa imagen que se te queda es la del dominó. Una ficha puede voltear a otra bastante más grande que ella, y así en cadena, hasta mover cosas que parecían imposibles. Por eso Keller insiste en bloquear la única cosa en el calendario antes que cualquier reunión, y en aceptar que hacerlo va a decepcionar a alguien. El precio del foco es ese, y el libro te ayuda a pagarlo sin culpa.",
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
    resumen:
      "Stephen Guise pasó una década intentando hacer treinta minutos de ejercicio y fracasando. Un día, medio en broma, decidió hacer una sola flexión. La hizo, y después hizo más. De ese accidente salió este libro, que es corto, directo y probablemente el más útil que existe para quien lleva años empezando cosas que no continúa.\n\nSu explicación es sencilla y buena. La fuerza de voluntad se gasta y la motivación se mueve sola, así que cualquier plan que dependa de las dos va a fallar en algún momento. Pero si la meta es tan pequeña que no requiere ninguna de las dos, entonces no hay día malo que la pueda tumbar. Una flexión se puede hacer enferma, triste, cansada o a las once y media de la noche.\n\nLa regla que sostiene todo, y que la gente rompe siempre, es que la meta nunca sube. Si un día haces treinta flexiones, la meta del día siguiente sigue siendo una. Lo de más es un regalo, no un nuevo estándar. Guise explica por qué subir la meta destruye el sistema completo: en el momento en que exige, vuelve a necesitar motivación. Para un cerebro TDAH esto es oro, porque elimina de raíz la culpa del día que no rindió.",
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
    resumen:
      "David Allen escribió el método de productividad más copiado del mundo, y su punto de partida es una frase que vale por medio libro: tu cabeza es para tener ideas, no para guardarlas. Todo lo que sostienes mentalmente, la cita del dentista, el regalo que falta, la conversación pendiente, ocupa un espacio que después no tienes para pensar.\n\nEl método tiene cinco pasos y funciona como un embudo. Capturas todo lo que trae ruido en un solo lugar de confianza. Aclaras qué es cada cosa y si requiere acción. Organizas por contexto, no por urgencia. Reflexionas con una revisión semanal que es el corazón del sistema, no un adorno. Y actúas. Sus dos reglas más conocidas caben en una línea cada una: si toma menos de dos minutos, hazlo ahora, y escribe siempre la próxima acción física, no el proyecto entero.\n\nHay que decir algo honesto: el sistema completo puede ser demasiado para un cerebro TDAH, porque exige mantenerlo y ahí es donde se cae. Lo que sí sobrevive siempre son la captura rápida, los dos minutos y la próxima acción concreta, que es cambiar llamar al doctor por buscar el número en el correo. Si te llevas solo eso, ya vale el libro.",
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
    resumen:
      "Kristin Neff es investigadora y fue la primera en estudiar científicamente la autocompasión, después de llegar a ella por su propia vida, con un matrimonio que se caía y un hijo con autismo. El libro nace de ahí, así que no es teoría bonita, es lo que le funcionó cuando no le quedaba nada.\n\nSu argumento más importante es que la autoestima no sirve para lo que creemos. La autoestima necesita que te vaya bien, que seas mejor que otros, que la comparación te favorezca, y por eso se cae justo cuando más la necesitas. La autocompasión no depende de nada de eso: está disponible especialmente el día que fallaste. Neff la desarma en tres partes, ser amable contigo en vez de dura, reconocer que el sufrimiento es parte de ser humano y no una prueba de tu defecto, y mirar el dolor de frente sin exagerarlo ni taparlo.\n\nY sale al paso de la objeción que todos ponemos, que si me trato bien me voy a echar a perder. Muestra lo contrario: la crítica interna activa la amenaza y con miedo nadie mejora, mientras que el trato amable deja el cerebro en un estado donde sí se puede aprender. Trae ejercicios concretos, y el más usado es la pausa de tres frases que puedes decir en medio de un mal momento, con una mano en el pecho.",
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
    resumen:
      "Carol Dweck es psicóloga en Stanford y pasó décadas estudiando por qué dos personas con la misma capacidad reaccionan distinto al fracaso. Su respuesta divide el libro en dos formas de mirar: la mentalidad fija, que cree que la inteligencia y el talento son una cantidad que te tocó, y la de crecimiento, que los ve como algo que se desarrolla.\n\nLa diferencia no es un detalle de actitud, cambia lo que haces. Si crees que el talento es fijo, cada desafío es un examen que puede revelar que no lo tienes, así que evitas lo difícil, escondes los errores y te sientes amenazada por el éxito ajeno. Si crees que se desarrolla, el desafío es información y el error es parte del proceso, así que te expones más y por eso mismo aprendes más. La profecía se cumple sola en las dos direcciones.\n\nLo que más se ocupa del libro es su descubrimiento sobre los elogios. Decirle a alguien qué inteligente eres lo vuelve más frágil, porque después evita todo lo que pueda desmentirlo. Elogiar el esfuerzo, la estrategia y la persistencia produce lo contrario. De ahí sale la herramienta más simple y más poderosa que trae, que es agregar la palabra todavía al final de la frase: no sé hacer esto, todavía. Deja de ser una sentencia y pasa a ser un punto del camino.",
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
    resumen:
      "Miguel Ruiz era cirujano hasta que un accidente de auto le cambió la vida y volvió a la tradición tolteca de su familia. Este libro, cortísimo, es su síntesis: cuatro acuerdos que puedes hacer contigo misma para salir de lo que él llama la domesticación, todo lo que aprendiste de chica sobre cómo deberías ser y que nunca elegiste.\n\nLos cuatro son simples de decir y difíciles de vivir. Sé impecable con tus palabras, porque lo que dices, sobre todo de ti misma, construye tu realidad. No te tomes nada personalmente, porque lo que la gente hace habla de su mundo y no del tuyo. No hagas suposiciones, porque casi todo el sufrimiento viene de historias que inventamos sin preguntar. Y haz siempre lo máximo que puedas, entendiendo que tu máximo cambia según el día, y que en un día malo tu máximo es menos y eso está bien.\n\nEse cuarto acuerdo es el que más le sirve a una persona con TDAH, porque desarma la vara fija con la que te mides. El libro es corto y a ratos suena a fábula, pero se relee bien y funciona mejor cuando lo tomas como práctica y no como lectura: un acuerdo por semana, anotando cada noche dónde se te olvidó.",
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
    resumen:
      "Daniel Goleman es periodista científico y en 1995 juntó lo que la neurociencia estaba descubriendo en un libro que cambió la conversación pública. Su tesis, discutida en su momento y hoy asumida, es que el cociente intelectual predice bastante menos de lo que creíamos sobre cómo le va a alguien en la vida, y que otra cosa pesa más.\n\nEsa otra cosa la divide en cinco: reconocer lo que sientes mientras lo sientes, poder regularlo, motivarte a ti misma, leer las emociones de los demás y manejar las relaciones. La parte que más se recuerda es la que llama el secuestro emocional, cuando la amígdala reacciona antes de que la parte pensante alcance a entrar, y por eso haces o dices algo que después no reconoces como tuyo. No es falta de carácter, es un circuito que va más rápido.\n\nLo práctico está en el espacio que se puede meter en el medio. Nombrar la emoción exacta, no molesta sino dolida o cansada o con miedo, ya baja su intensidad, porque nombrar activa la parte del cerebro que la amígdala se saltó. Y respirar seis segundos antes de responder es literalmente lo que le da tiempo a esa parte a llegar. Para un cerebro que reacciona fuerte y rápido, este libro explica por qué pasa y qué hacer con eso.",
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
    resumen:
      "Bessel van der Kolk lleva más de cuarenta años tratando trauma, primero con veteranos de guerra y después con sobrevivientes de abuso infantil. Este libro es la suma de todo eso y se convirtió en el más importante sobre el tema, porque explica algo que la terapia tradicional había pasado por alto: el trauma no se guarda solo como recuerdo, se guarda en el cuerpo.\n\nPor eso una persona puede contar su historia con calma y sin embargo tener el sistema nervioso en alerta permanente, o al revés, sentirse desconectada y como anestesiada. El cuerpo sigue defendiéndose de algo que ya pasó. Van der Kolk muestra con imágenes cerebrales qué le ocurre al área del lenguaje durante un recuerdo traumático, y con eso explica por qué hablar a veces no basta, y por qué pedirle a alguien que se calme razonando casi nunca funciona.\n\nDe ahí viene su conclusión terapéutica, que abrió la puerta a tratamientos que hoy son comunes. Yoga, teatro, movimiento, ritmo, respiración, EMDR, todo lo que entra por el cuerpo en vez de por la conversación. Advertencia honesta: es un libro largo y por momentos difícil de leer, con relatos duros. Se puede leer por partes. Lo que te llevas es entender que no eres exagerada ni frágil, es que el cuerpo lleva su propia contabilidad.",
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
    resumen:
      "Marc Brackett dirige el centro de inteligencia emocional de Yale y escribió este libro desde una historia personal: fue un niño que sufrió abuso y acoso, y lo que lo salvó fue un tío que le hizo una pregunta que nadie le hacía, cómo te sientes de verdad. El libro entero sale de esa pregunta.\n\nSu punto de partida es que a casi nadie le enseñaron a nombrar lo que siente, y que decir bien cuando no estás bien es la respuesta que todos aprendimos. Sin nombre, la emoción igual actúa, solo que a ciegas. Brackett muestra que la precisión importa: no es lo mismo estar ansiosa que abrumada, ni molesta que decepcionada, y que cada una pide algo distinto.\n\nSu método tiene cinco pasos que se recuerdan bien: reconocer, entender, etiquetar con precisión, expresar y regular. Y trae una idea que ordena todo, la de ser científico y no juez con lo que sientes. En vez de preguntarte si esta emoción es correcta o exagerada, preguntas de dónde viene y qué te está pidiendo. Las emociones no son notas de conducta, son información. Es un libro cálido, con muchas historias, y especialmente bueno si creciste en una casa donde sentir mucho era un problema.",
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
    resumen:
      "Russ Harris es médico y terapeuta, y su libro empieza con una provocación: la búsqueda de la felicidad es lo que nos tiene infelices. La trampa del título es la idea, repetida en todas partes, de que deberíamos sentirnos bien casi siempre, y que sentirse mal es una falla que hay que arreglar. Con esa vara, cualquier tristeza normal se vuelve un problema.\n\nEl libro es la puerta de entrada más amable a la terapia de aceptación y compromiso. Su propuesta no es pensar en positivo, es dejar de pelear con lo que sientes, porque la lucha consume más energía que el sentimiento mismo. Para eso enseña a tomar distancia del pensamiento sin discutirlo: le pones delante la frase estoy notando que pienso que, y de pronto deja de ser la verdad y pasa a ser una frase que apareció en tu cabeza. Sigue ahí, pero deja de mandar.\n\nLa segunda mitad es la que le da sentido a la primera. Aceptar no es resignarse, es dejar de gastar la energía en la pelea para poder usarla en lo que te importa. Harris te hace escribir tus valores, que no son metas sino cómo quieres ser en cada área de tu vida, y desde ahí eliges la acción de hoy. Es práctico, tiene humor y funciona muy bien para ansiedad y para la autocrítica dura.",
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
    resumen:
      "Marian Rojas Estapé es psiquiatra española y escribió el libro de divulgación que más se ha leído en español en los últimos años. Su tema es el cortisol, la hormona del estrés, y cómo vivimos con ella alta de forma permanente sin darnos cuenta, hasta que el cuerpo empieza a pasar la cuenta.\n\nSu idea más útil, y la que más se cita, es que el cerebro no distingue entre lo real y lo imaginado con suficiente intensidad. Si pasas la tarde adelantando un desastre que no ha ocurrido, tu cuerpo produce las mismas hormonas que si estuviera ocurriendo. Por eso una persona que se preocupa mucho vive físicamente agotada sin haber hecho nada, y por eso la pregunta que ella propone sirve tanto: esto que me está doliendo, está pasando ahora o solo en mi cabeza.\n\nLa segunda mitad es más luminosa y es de donde viene el título. Habla del papel de la atención, del asombro y de la gratitud entrenada, y explica por qué el cerebro sale a buscar aquello que le enseñas a ver, así que anotar una cosa buena al día no es un adorno, es entrenamiento. Escribe fácil, con casos de consulta y sin lenguaje técnico, y es un buen primer libro si nunca has leído nada de psicología.",
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
    resumen:
      "Emily y Amelia Nagoski son hermanas gemelas, una investigadora de la salud y la otra directora de coro, y escribieron este libro después de que las dos terminaran quemadas de formas distintas. Está pensado sobre todo para mujeres, y su primera afirmación es la que lo cambia todo: puedes resolver el problema que te estresa y aun así quedarte con todo el estrés adentro.\n\nLa explicación es fisiológica. El estrés es un ciclo que el cuerpo tiene que completar, igual que un animal que huye, escapa y después tiembla y vuelve a la calma. Nosotras resolvemos el correo, cerramos el asunto y seguimos, pero el cuerpo nunca recibió la señal de que el peligro pasó, así que se queda a medio ciclo, acumulando. Por eso cierran el ciclo cosas que parecen no tener relación con el problema: veinte minutos de movimiento, llorar hasta el final, un abrazo largo de verdad, reír fuerte, dormir.\n\nLa segunda mitad va contra lo que llaman el síndrome de la mujer que da, esa regla no escrita de que tienes que ser calmada, generosa y estar siempre disponible. Traen también el dato del cuarenta y dos por ciento, que es la parte del día que el cuerpo necesita en descanso sumando sueño y pausas. Si no llegas ahí, el agotamiento no es falta de carácter, es aritmética.",
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
    resumen:
      "Daniel Kahneman ganó el Nobel de Economía siendo psicólogo, algo que casi no ocurre, y este libro es el resumen de una vida de trabajo junto a Amos Tversky demostrando que las personas no decidimos como la teoría económica creía. El libro se lee lento y vale cada página, porque cambia la confianza que le tienes a tu propio criterio.\n\nSu estructura es una imagen simple. Tienes dos sistemas de pensamiento. Uno rápido, automático, intuitivo, el que reconoce una cara o esquiva un auto, y que funciona todo el día sin que lo notes. Y otro lento, deliberado, el que multiplica números grandes, que es preciso pero perezoso y caro de encender. El problema es que el rápido responde primero a casi todo, incluso a preguntas que no le corresponden, y el lento firma lo que el rápido decidió.\n\nDe ahí sale el catálogo de trampas que te vas a reconocer haciendo. Juzgar por lo primero que llega a la mente en vez de por lo frecuente. Anclarte en el primer número que escuchaste. Ver patrones donde solo hay azar. La certeza que sientes cuando la historia calza bien, que Kahneman muestra que no es señal de acierto. No te vuelve inmune, pero te deja el hábito de sospechar de lo obvio, y ese hábito solo ya vale.",
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
    resumen:
      "Mihaly Csikszentmihalyi se pasó la vida haciendo una pregunta simple a miles de personas de todo el mundo: cuándo te sentiste realmente bien. Cirujanos, escaladores, obreros, ajedrecistas, madres. Las respuestas describían siempre el mismo estado, y a ese estado lo llamó flujo. Es el corazón de este libro y de toda la psicología positiva que vino después.\n\nEl flujo aparece cuando el desafío de lo que haces calza justo con tu capacidad. Si la tarea es mucho más difícil, aparece la angustia. Si es mucho más fácil, aparece el aburrimiento. En el punto justo pasa algo curioso: desaparece la noción del tiempo, desaparece la conciencia de ti misma y la actividad se vuelve un fin en sí misma. Necesita además dos cosas concretas, objetivos claros y saber cómo lo estás haciendo mientras lo haces.\n\nLa conclusión del libro es la que sorprende. Descubrió que la gente entra en flujo más seguido trabajando que en su tiempo libre, aunque diga preferir el tiempo libre, porque el ocio pasivo no tiene ni desafío ni reglas ni señales de avance. La felicidad, dice, no es algo que ocurre, es algo que se construye ajustando la dificultad de lo que haces. Para un cerebro TDAH esto explica mucho: no es que no puedas concentrarte, es que la calibración tiene que ser más fina.",
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
    resumen:
      "Lori Gottlieb es psicoterapeuta y este libro cuenta dos cosas a la vez: las historias de cuatro de sus pacientes y la suya propia, cuando una ruptura la dejó tan mal que tuvo que ir a terapia ella. Ver a la terapeuta sentada en la otra silla es lo que hace este libro distinto a cualquier otro del género.\n\nSus pacientes son un productor de Hollywood insoportable, una recién casada con un diagnóstico terminal, una mujer mayor que se dio un plazo para decidir si seguir viva, y una veinteañera que va de relación en relación. A través de ellos aparece la idea que sostiene el libro: casi todos venimos a contar una historia sobre nosotros mismos, y esa historia suele ser la cárcel. Cambiar no es cambiar los hechos, es poder contarlos de otra manera.\n\nHay una frase suya que se cita mucho y que resume el resto: la libertad no está en no tener límites, está en poder elegir cómo respondes a los que tienes. Y una pregunta incómoda que aparece varias veces, qué estás ganando con quedarte donde dices no querer estar, porque casi siempre hay un premio escondido en la queja. Se lee como una novela, se ríe, se llora, y termina siendo el mejor libro para entender qué pasa de verdad adentro de una terapia.",
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
    resumen:
      "Martin Seligman empezó su carrera estudiando lo contrario de este libro. En sus experimentos descubrió lo que llamó indefensión aprendida: cuando un ser vivo comprueba varias veces que haga lo que haga nada cambia, deja de intentar incluso cuando la salida está abierta. Años después dio vuelta la pregunta y fundó la psicología positiva. De ahí sale este libro.\n\nSu hallazgo central es que el optimismo y el pesimismo no son personalidad, son un estilo de explicación que se puede identificar y cambiar. Frente a algo malo, el pesimista lo explica como permanente, general y culpa suya. Esto siempre me pasa, todo me sale mal, soy yo. El optimista lo explica como puntual, acotado y con causas de afuera. Esta vez salió mal, en esta cosa específica, por estas circunstancias. Y frente a lo bueno, el patrón se invierte exactamente.\n\nLo práctico es su método para discutir con tu propia voz, que toma prestado de la terapia cognitiva. Anotas la adversidad, la creencia que apareció, la consecuencia que tuvo, y después la discutes como si fuera un rival: qué prueba tengo, qué otra explicación cabe, cuánto va a durar de verdad. No es pensar en positivo, es hacerle preguntas duras a una voz a la que nunca se las hiciste.",
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
    resumen:
      "Dan Ariely es economista conductual y sufrió quemaduras graves de joven, lo que lo dejó años en un hospital observando cómo se toman decisiones. Este libro es la colección de sus experimentos, y se lee con una mezcla de risa y vergüenza, porque cada capítulo demuestra que caemos todos igual, y que caemos de forma predecible.\n\nEl más famoso es el de la opción trampa. Cuando una revista ofrecía suscripción digital a cincuenta y nueve, impresa a ciento veinticinco y las dos juntas también a ciento veinticinco, casi todos elegían la combinada. Al sacar la opción absurda, la mayoría cambiaba a la barata. La opción que nadie elige está ahí para que otra parezca buena, y una vez que lo sabes empiezas a verla en todos los menús y planes.\n\nOtros hallazgos pegan más de cerca. El precio del cero, que nos hace tomar cosas que no queremos ni necesitamos solo porque son gratis. El efecto placebo del precio, donde un remedio caro alivia más que el mismo remedio barato. Y su experimento sobre honestidad, que muestra que casi nadie roba mucho pero casi todos hacen trampa un poquito, y que recordar un compromiso moral antes basta para que eso baje. Es entretenido, corto de leer y te vuelve mejor consumidora.",
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
    resumen:
      "Daniel Pink parte mostrando algo que a las empresas les costó aceptar: los premios y castigos funcionan bien para tareas mecánicas y repetitivas, y funcionan mal, a veces peor que nada, para tareas que requieren pensar o crear. Hay experimentos donde ofrecer más dinero empeora el resultado, y ese hallazgo es el que abre el libro.\n\nSu explicación es que para el trabajo con la cabeza necesitamos otro combustible, y lo divide en tres. Autonomía, que es poder decidir qué haces, cuándo, cómo y con quién. Maestría, que es la sensación de estar mejorando en algo que importa, que resulta ser adictiva en el buen sentido. Y propósito, que es saber para qué o para quién sirve lo que haces. Cuando los tres están, la motivación deja de tener que empujarse desde afuera.\n\nLo interesante para la vida diaria es que estas tres cosas se pueden aplicar a escala chica. En una tarea que odias, quedarte con una decisión propia, el orden o la hora o el lugar, ya cambia cómo se siente. Ver el avance escrito en alguna parte alimenta la maestría. Y ponerle nombre y cara a quién le sirve lo que estás haciendo empuja bastante más que cualquier premio. Es un libro de trabajo, pero sirve igual para los hábitos personales.",
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
    resumen:
      "Brené Brown es investigadora y llevaba años estudiando la vergüenza cuando se dio cuenta de algo en sus propios datos: había un grupo de personas que vivía distinto, con más conexión y menos miedo, y lo único que las distinguía era que se creían dignas de amor tal como estaban. No perfectas. Dignas. De ahí sale este libro.\n\nSu distinción más importante es entre culpa y vergüenza, y vale por sí sola. La culpa dice hice algo malo, y es útil, porque señala una acción que puedes reparar. La vergüenza dice soy mala, y es corrosiva, porque no deja nada que hacer. Brown muestra que la vergüenza necesita tres cosas para crecer, secreto, silencio y juicio, y que por eso se muere cuando le cuentas a alguien que te quiere bien.\n\nDe ahí viene lo demás. Que la vulnerabilidad no es debilidad sino el lugar exacto donde nacen la conexión y la creatividad. Que el perfeccionismo no es buscar la excelencia, es un escudo para evitar el juicio, y que además no protege. Y que hay que soltar el agotamiento como símbolo de estatus, esa idea de que valer implica estar siempre cansada. Está escrito con sus propias caídas adentro, y por eso no suena a sermón.",
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
    resumen:
      "Wayne Dyer publicó este libro en 1976 y vendió decenas de millones de copias, porque fue de los primeros en decirle a la gente común algo que hoy suena normal y entonces no lo era: la mayor parte de tu sufrimiento no viene de lo que pasa, viene de lo que te dices sobre lo que pasa, y eso sí lo puedes cambiar.\n\nLas zonas erróneas del título son esas conductas que se repiten y siempre terminan mal. Necesitar la aprobación de todos, quedarte pegada en la culpa por lo que ya pasó, angustiarte por lo que todavía no ocurre, buscar culpables, postergar como forma de vida. Dyer las va desarmando una por una, y a cada una le pone su antídoto, sin adornos y a veces con dureza.\n\nSu herramienta más simple es también la que más sirve. Cambiar el tengo que por elijo o no elijo, y quedarte mirando cómo se siente la frase nueva. La mayoría de las obligaciones que arrastramos son acuerdos viejos que nunca revisamos, y ponerles la palabra elijo delante los devuelve a tus manos. El estilo es de su época, directo y con poca ciencia, pero pega fuerte si vives pendiente de lo que van a pensar de ti.",
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
    resumen:
      "Robert Cialdini es psicólogo social y para escribir este libro hizo algo poco común: se metió tres años de incógnito a trabajar como vendedor, recaudador y publicista, para ver desde adentro cómo se convence a la gente. El resultado es el libro más citado del mundo sobre persuasión, y se lee tanto para vender como para defenderse.\n\nOrdena todo en seis principios que funcionan como atajos mentales. Reciprocidad, la incomodidad de deber un favor, aunque sea un chocolate con la cuenta. Compromiso y coherencia, que una vez que dijiste que sí a algo chico te empuja a seguir. Aprobación social, hacer lo que hacen los demás. Simpatía, decir que sí a quien te cae bien. Autoridad, obedecer al que parece experto. Y escasez, querer más lo que se acaba.\n\nLa parte que más te sirve es que Cialdini enseña a reconocerlos funcionando. Cuando sientas urgencia por decidir, para y nombra cuál te están usando, porque verlos le quita casi toda la fuerza. Y deja una regla práctica que ahorra plata y arrepentimiento: frente a una oferta que te apura, di que lo vas a pensar hasta mañana. Si no aguanta un día, no era para ti.",
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
    resumen:
      "John Gottman hizo algo que nadie había hecho: metió parejas a un departamento con cámaras y sensores, las grabó conversando y midió todo, pulso, gestos, palabras. Con esos datos llegó a predecir con más de un noventa por ciento de acierto qué parejas seguirían juntas años después, viendo solo unos minutos de conversación.\n\nLo que encontró contradice el sentido común. No importa cuánto peleen, importa cómo. Identificó cuatro conductas que anuncian el final, y las llamó los cuatro jinetes: la crítica que ataca a la persona en vez del problema, el desprecio que es el peor de todos, la actitud defensiva y el cerrarse en silencio. También encontró la proporción que separa a las parejas que duran: por cada momento tenso hacen falta cinco gestos positivos reales.\n\nSu otro hallazgo es más tierno y más útil todavía. Las parejas que duran no son las que resuelven todos sus conflictos, porque la mayoría de los conflictos no se resuelven nunca, sino las que mantienen viva la amistad y se conocen de verdad. Por eso insiste en actualizar lo que llama los mapas del otro, preguntar qué le preocupa esta semana, qué le da ganas. Y en cómo empiezas un reclamo, porque los primeros tres minutos deciden casi toda la conversación.",
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
    resumen:
      "Amir Levine y Rachel Heller tomaron la teoría del apego, que se había estudiado sobre todo en niños, y la aplicaron a las relaciones adultas. El resultado explica en doscientas páginas cosas que la gente pasa décadas sin entender sobre por qué elige a quien elige y por qué duele lo que duele.\n\nDescriben tres estilos. El seguro, que se acerca sin drama, pide lo que necesita y da espacio sin sentirse abandonado. El ansioso, que necesita mucha cercanía, lee señales todo el tiempo y se activa cuando siente distancia. Y el evitativo, que valora tanto su independencia que la cercanía le da claustrofobia y se aleja justo cuando la cosa se pone íntima. No son defectos de carácter, son estrategias que se aprendieron temprano.\n\nSu observación más incómoda es la trampa ansioso evitativo: esas dos personas se atraen con fuerza y arman la relación más agotadora que existe, porque una persigue y la otra se aleja, y cada movimiento confirma el miedo de la otra. El libro enseña a reconocer tu estilo, a detectar el del otro antes de involucrarte demasiado, y sobre todo a pedir claro en vez de mandar señales o castigar con silencio. Pedir directo es, según ellos, lo que hace segura una relación.",
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
    resumen:
      "Marshall Rosenberg creció viendo disturbios raciales en Detroit y pasó la vida preguntándose por qué algunas personas responden con violencia y otras con compasión frente a lo mismo. De ahí salió este método, que después usó en mediaciones de guerra, en cárceles y en escuelas, y que sirve igual para una conversación de cocina.\n\nSu diagnóstico es que hablamos en un idioma que separa sin darnos cuenta. Juzgamos, comparamos, exigimos y diagnosticamos al otro, y eso pone a cualquiera a la defensiva antes de escuchar. Su propuesta es cambiar la estructura de lo que dices, y son cuatro pasos cortos: describir lo que pasó como lo grabaría una cámara, sin interpretación, decir lo que sentiste, decir qué necesidad tuya no está cubierta, y hacer una petición concreta y en positivo.\n\nLa otra mitad, y la que más cuesta, es escuchar así. Cuando alguien te ataca, debajo del reproche hay siempre una necesidad no dicha: detrás de nunca me ayudas casi siempre hay estoy agotada. Rosenberg enseña a traducir eso en vez de defenderte. Es un libro que se lee rápido y se practica lento, y hay que decirlo, al principio suena artificial. Después deja de sonar así y cambia conversaciones que llevaban años atascadas.",
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
    resumen:
      "Gary Chapman fue consejero de parejas durante años y notó un patrón que se repetía en su oficina: dos personas que se querían de verdad y aun así una de las dos se sentía poco querida. No faltaba amor, faltaba traducción. De esa observación salió este libro, que se volvió uno de los más vendidos de la historia sobre relaciones.\n\nSu idea es que cada persona recibe el amor principalmente por una de cinco vías. Palabras que afirman, tiempo de calidad con atención completa, actos de servicio, regalos que muestran que pensaste en el otro, y contacto físico. Todos apreciamos las cinco, pero hay una que llena más que las otras, y esa es la que hay que conocer.\n\nEl problema es que casi todos damos en nuestro propio idioma. Si el tuyo es tiempo y el del otro son actos de servicio, tú vas a insistir en salir juntos mientras la otra persona espera que le ayudes con algo, y los dos van a quedar con la sensación de estar dando sin recibir. Amar en el idioma equivocado se siente igual que no amar. La receta es simple y casi nadie la aplica: pregúntale directamente qué la hace sentir más querida, y después dale eso, no lo que tú darías.",
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
    resumen:
      "Sue Johnson creó la terapia focalizada en las emociones, que es de las pocas con evidencia sólida de que funciona en parejas, y este libro es su método traducido para que lo lea cualquiera. Su punto de partida es que las peleas de pareja casi nunca son sobre lo que parecen: no son sobre los platos ni el dinero ni la suegra.\n\nDebajo hay siempre la misma pregunta, dicha o no: estás ahí para mí, te importo, puedo contar contigo. Johnson describe la danza que se arma cuando esa pregunta no se responde: uno protesta, exige, reclama, y el otro se cierra y se aleja para no empeorarlo, y cada movimiento provoca el del otro en un círculo que se alimenta solo. Ella lo llama el diálogo del demonio, y enseña a ver el círculo como el enemigo común, en vez de al otro.\n\nLa salida es lo que da título al libro. Debajo de la rabia siempre hay algo más frágil, tengo miedo de no importarte tanto, me sentí sola. Decir eso, que es mucho más difícil que gritar, es lo único que interrumpe el círculo, porque la rabia empuja al otro lejos y la vulnerabilidad lo trae cerca. El libro trae siete conversaciones guiadas para hacerlas juntos, y funciona igual leído por una sola persona.",
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
    resumen:
      "Nedra Glover Tawwab es terapeuta y notó que la mayoría de los problemas que llegaban a su consulta, el agotamiento, el resentimiento, las relaciones que ahogan, tenían la misma raíz: límites que nunca se pusieron. Este libro es directo, práctico y está lleno de casos, y se lee como una conversación con alguien que no te va a dejar salir por la tangente.\n\nSu definición ordena todo: un límite es lo que tú vas a hacer, no lo que el otro debe hacer. Eso cambia el foco, porque no dependes de que la otra persona cambie. Distingue tres tipos, los porosos, donde todo entra y terminas viviendo la vida de los demás, los rígidos, que dejan a todo el mundo afuera para no salir lastimada, y los sanos, que se mueven según la relación y el momento.\n\nLo mejor es cómo trata la culpa. Asume que poner un límite va a incomodar, que alguien va a reaccionar mal, y que la culpa que sientes después no es señal de que hiciste algo malo, es señal de que hiciste algo nuevo. Enseña frases cortas y sin justificación, eso no me acomoda, no voy a poder, prefiero que no. Y trae una pista buenísima: donde sentiste rabia esta semana, ahí falta un límite, no paciencia.",
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
    resumen:
      "Erich Fromm era psicoanalista y filósofo, y escribió este ensayo breve en 1956 con una tesis que sigue incomodando: casi todos creemos que el problema del amor es ser amados, encontrar a la persona correcta, y por eso nos dedicamos a volvernos deseables. Fromm dice que el problema es otro, es la capacidad de amar, y que esa capacidad se aprende como cualquier arte.\n\nSu comparación es con la música o la medicina. Nadie espera tocar el piano por tener ganas ni curar por sentirlo mucho: se estudia la teoría, se practica y se le da prioridad en la vida. Con el amor hacemos lo contrario, esperamos que ocurra solo. Y describe cuatro elementos que están presentes en cualquier forma de amor maduro, sea de pareja, de madre, de amistad o hacia una misma: cuidado, responsabilidad, respeto y conocimiento.\n\nSu observación más filosa es que el amor maduro no es fusión. Dice que unirse a alguien para dejar de sentir la soledad no es amor, es dependencia disfrazada, y que solo puede amar de verdad quien es capaz de estar sola sin angustiarse. Es un libro corto, denso y bastante distinto a todo lo demás de esta sección, con más filosofía que técnica, y de esos que se releen distinto en cada etapa de la vida.",
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
    resumen:
      "Dale Carnegie publicó este libro en 1936 y lleva más de treinta millones de ejemplares vendidos. El título envejeció mal y suena a manipulación, pero el contenido es casi lo contrario: lo que enseña es a dejar de hablar de una misma y a interesarse de verdad por el otro, que resulta ser lo más escaso que hay.\n\nSus principios se resumen rápido. No critiques ni te quejes, porque nadie cambia con la guardia arriba. Da aprecio honesto y concreto, no halagos vacíos. Haz preguntas sobre la otra persona y escucha las respuestas de verdad. Usa su nombre. Admite tus errores rápido y sin drama. Deja que la otra persona sienta que la idea es suya. Y cuando tengas que corregir, empieza por algo verdadero que hizo bien.\n\nHay que leerlo con criterio, porque su época se nota: los ejemplos son de vendedores y jefes hombres de los años treinta, y algunas técnicas suenan a fórmula si las aplicas sin sinceridad. El propio Carnegie insiste en que sin interés real nada de esto funciona, y tiene razón. Leído así, es un manual sorprendentemente vigente para alguien a quien le cuesta lo social, porque convierte en pasos concretos algo que a otros les sale sin pensar.",
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
    resumen:
      "Esther Perel es terapeuta de parejas, habla nueve idiomas y trabajó con parejas de muchas culturas, lo que le dio una mirada poco común. Este libro se ocupa de una pregunta que casi nadie hace en voz alta: por qué el deseo se apaga justamente en las relaciones donde hay más amor y más seguridad.\n\nSu respuesta es que el amor y el deseo se alimentan de cosas opuestas. El amor quiere cercanía, certeza, saberlo todo del otro, tenerlo cerca. El deseo quiere distancia, misterio, sorpresa, algo que descubrir. Cuando una pareja se fusiona por completo, en el buen sentido, hace todo junta, se cuenta todo, no queda espacio para desear, porque no se desea lo que ya se tiene entero. No es falta de amor, es exceso de fusión.\n\nDe ahí salen sus propuestas, que suenan raras y funcionan. Guardar algo para ti, tener vida propia, ver al otro desde lejos haciendo lo suyo con gente que no eres tú. Perel escribe con casos de consulta y sin recetas, y no promete arreglos rápidos. Es especialmente valioso para parejas largas, con hijos y rutina, donde todo funciona bien salvo eso, y nadie sabe muy bien cómo hablarlo.",
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
    resumen:
      "Don Miguel Ruiz escribió este libro después de Los cuatro acuerdos, y es el que aplica esa misma sabiduría tolteca a las relaciones. Su imagen central es dura y se te queda: dice que la mayoría de nosotros anda por la vida con una herida emocional abierta y llena de veneno, y que cuando alguien la toca sin querer, saltamos.\n\nDe ahí explica casi todo el conflicto de pareja. Reaccionamos con una fuerza que no corresponde a lo que pasó, porque lo que arde no es de ahora, es la herida vieja. Y describe lo que llama la relación de caza: una persona persigue y controla, la otra se somete y complace, y las dos creen que eso es amor cuando en realidad es un acuerdo de domesticación, con reglas que nadie firmó.\n\nSu propuesta es que el amor de verdad no exige nada y no busca cambiar a nadie, y que eso solo es posible cuando dejaste de necesitar que el otro te llene lo que a ti te falta. Por eso insiste en sanar tu propia herida primero, no como egoísmo sino como requisito. El libro es breve, se lee como una conversación y tiene un tono de fábula que a algunos les encanta y a otros les sobra. Si te sirvieron Los cuatro acuerdos, este es el paso siguiente.",
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
    resumen:
      "Napoleon Hill dedicó veinte años a entrevistar a las personas más ricas de su época, Ford, Carnegie, Edison y varios cientos más, buscando qué tenían en común. Publicó el resultado en 1937, en plena Gran Depresión, y desde entonces es el libro de mentalidad financiera más leído del mundo. Casi todo lo que hoy se dice sobre visualización y mentalidad de abundancia sale de aquí.\n\nSu conclusión es que la riqueza empieza en un estado mental muy preciso, que no es soñar despierta. Hill lo llama deseo ardiente y lo separa del simple querer con un método concreto: escribir la cantidad exacta que quieres ganar, la fecha, qué vas a dar a cambio, y leerlo en voz alta dos veces al día hasta que se te grabe. Suena raro, y es justamente lo que hace que la mente empiece a filtrar oportunidades que antes pasaban de largo.\n\nDe ahí vienen sus otros principios: la fe entendida como convicción sostenida, la autosugestión, el conocimiento especializado por encima del general, la decisión rápida frente a la duda eterna, la persistencia, y el que muchos consideran el más valioso, la mente maestra, que es rodearte de dos o tres personas que piensen contigo. Hay que leerlo sabiendo que su lenguaje es de otra época y que a ratos suena esotérico. Lo que sobrevive, y sobrevive muy bien, es la parte del propósito escrito y la mente maestra.",
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
    resumen:
      "Morgan Housel trabajó años escribiendo sobre finanzas y llegó a una conclusión que da título al libro: manejar bien la plata tiene poco que ver con lo que sabes y mucho con cómo te comportas. Y el comportamiento no se aprende en una planilla. Son diecinueve capítulos cortos, cada uno con una historia, y se lee en pocas tardes.\n\nEmpieza con un contraste que lo dice todo. Un ejecutivo brillante que se declaró en quiebra, y un conserje que murió con ocho millones de dólares porque ahorró poco durante muchísimo tiempo y no tocó nada. La diferencia no fue conocimiento, fue paciencia. De ahí sale su idea más repetida, que el interés compuesto no premia al que más gana sino al que más aguanta sin interrumpir.\n\nSus otros capítulos son igual de útiles. Que nadie está loco, porque cada persona toma decisiones desde la época y el país que le tocó vivir. Que la riqueza es justamente lo que no ves, porque son los autos no comprados y las casas no cambiadas. Que la libertad, poder decidir qué haces con tu día, es el mejor dividendo que paga el dinero. Y que sin un número claro de cuánto es suficiente, la meta siempre es un poco más y nunca llega.",
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
    resumen:
      "Robert Kiyosaki cuenta su historia con dos figuras paternas: su padre biológico, profesor con educación superior y siempre justo de dinero, y el padre de su mejor amigo, que no terminó el colegio y se hizo rico. Los dos le daban consejos opuestos, y el libro es la comparación entre esas dos formas de ver el dinero.\n\nSu aporte más útil es una distinción simple que casi nadie aprende en el colegio. Un activo pone plata en tu bolsillo cada mes, un pasivo la saca. Y explica por qué la casa propia, que todos llamamos inversión, en su definición suele ser un pasivo, porque te cuesta plata todos los meses. También ordena el mundo laboral en cuatro cuadrantes, empleado, autoempleado, dueño de negocio e inversionista, y muestra que en los dos primeros vendes tu tiempo y por eso hay un techo.\n\nHay que leerlo con criterio y conviene decirlo claro: parte de sus consejos son discutibles, sus historias no siempre se pueden verificar, y su entusiasmo por el endeudamiento para invertir ha dejado a mucha gente mal parada. Lo que sí vale, y vale mucho, es el cambio de mirada. Deja de preguntarte cuánto ganas y empieza a preguntarte cuánto de eso se queda contigo y trabajando. Es un buen primer libro si nunca pensaste el dinero así, no el único.",
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
    resumen:
      "George Clason publicó estas parábolas en los años veinte como folletos para bancos, y terminaron convertidas en el libro de finanzas personales más antiguo que se sigue leyendo. Están ambientadas en la antigua Babilonia y las cuenta Arkad, el hombre más rico de la ciudad, que empezó siendo un escriba pobre.\n\nSu regla principal es la más vieja que existe y también la única que nunca falla: de cada diez monedas que ganes, una se queda contigo. Nada más. Ni el diez por ciento del sobrante, ni lo que quede a fin de mes, sino una de cada diez apartada apenas entra. Arkad insiste en que esa parte es literalmente tu paga por trabajar, y que lo demás es lo que le pagas a todo el mundo.\n\nDe ahí siguen las otras lecciones, contadas como cuentos que se recuerdan bien. Controla tus gastos, porque los gastos crecen para llenar lo que ganes. Haz que el oro trabaje, porque lo guardado y quieto pierde valor. Cuídate de las pérdidas buscando consejo de quien sabe del tema, no de tu amigo entusiasta. Y asegura un ingreso para el futuro. Se lee en una tarde, es agradable como relato, y su virtud está en que las reglas son tan simples que se pueden aplicar el mismo día.",
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
    resumen:
      "Ramit Sethi escribe como habla, sin solemnidad y con humor, y su libro está pensado para gente joven que nunca ordenó sus finanzas y que se siente culpable por eso. Su primera pelea es contra los libros que te hacen sentir mal por comprarte un café: dice que ese enfoque no funciona y además te amarga la vida.\n\nSu propuesta se llama gasto consciente y le da vuelta la lógica. Elige dos o tres cosas que de verdad te dan felicidad, viajes, libros, salir a comer, lo que sea, y déjalas en el presupuesto sin ninguna culpa. Después recorta con fuerza y sin piedad en todo lo demás, que probablemente no notes. Las ganancias grandes están en las cuentas, los intereses y los sueldos, no en el café.\n\nSu segunda idea es la automatización, y es la que hace que el sistema aguante. Programas las transferencias para el día siguiente al sueldo: ahorro, inversión, cuentas fijas, y lo que queda en la cuenta corriente se puede gastar tranquila. La disciplina que no depende de tu memoria ni de tu ánimo es la única que dura, y eso para un cerebro TDAH es exactamente lo que se necesita. Ojo con una cosa: las cuentas y productos que menciona son de Estados Unidos, así que los principios sirven todos y los nombres hay que traducirlos a tu país.",
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
    resumen:
      "Vicki Robin y Joe Domínguez escribieron el libro que fundó el movimiento de independencia financiera, mucho antes de que existiera internet. Su pregunta de partida no es cómo ganar más, es una bastante más incómoda: cuánta vida estás cambiando por dinero, y si el cambio te conviene.\n\nDe ahí sale su cálculo más famoso. Toma tu sueldo, réstale todo lo que gastas por trabajar, transporte, ropa, comidas fuera, el descanso que necesitas para recuperarte, y divide por las horas reales que le dedicas, incluidas las de traslado. Ese número es lo que vale una hora de tu vida. Después, antes de cada compra, divides el precio por esa cifra y sabes cuántas horas de vida cuesta. Cambia por completo lo que decides comprar.\n\nEl método tiene nueve pasos y el que más se usa es el gráfico mensual: anotas lo que entra y lo que sale y los dibujas juntos en una sola línea de tiempo. Ver las dos líneas acercarse es lo que cambia la conducta, más que cualquier propósito. Y el punto de cruce, cuando tus ingresos pasivos cubren tus gastos, es lo que ellos llaman independencia financiera. Es un libro con alma, más filosófico que técnico, y de los que cambian cómo miras tu trabajo.",
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
    resumen:
      "Sofía Macías escribió el libro de finanzas personales más leído en México y buena parte de América Latina, y su gran mérito es que está escrito para nuestra realidad. Habla de sueldos en pesos, de tarjetas con intereses altísimos, de la familia que te pide prestado y del ahorro informal, cosas que los libros gringos no mencionan.\n\nEmpieza por donde de verdad duele, las deudas. Enseña a listarlas todas con su interés real, que casi nadie conoce, y a atacar primero la que más quema y no la más chica, porque los intereses son los que te tienen corriendo en el mismo lugar. Explica en detalle cómo funcionan las tarjetas de crédito, qué es el pago mínimo y por qué es la trampa más cara que existe.\n\nDespués construye hacia arriba: el fondo para imprevistos antes que cualquier otra cosa, porque sin colchón el primer susto se convierte en deuda nueva, el presupuesto que sí se puede sostener, y una introducción sencilla a invertir para quien nunca lo ha hecho. El tono es de amiga que te habla claro, con humor y sin sermones. Es la mejor puerta de entrada si vives en Latinoamérica y todo lo que has leído hasta ahora te sonaba a otro país.",
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
    resumen:
      "JL Collins empezó a escribir estas ideas como cartas para su hija, que no quería saber nada de finanzas. Ese origen se nota y es su mayor virtud: todo está explicado como si la persona que lee no supiera nada y además no tuviera ganas de aprender. Es probablemente la explicación más clara que existe de cómo funciona invertir a largo plazo.\n\nSu tesis va contra toda la industria. Dice que la mayoría de los fondos con gestor no le ganan al mercado a largo plazo, que las comisiones se comen una parte enorme de tus ganancias en el camino, y que la estrategia que funciona es aburrida: comprar un fondo indexado amplio y de costo bajo, aportar todos los meses y no mover nada durante décadas. Nada de adivinar el momento correcto.\n\nSu parte más valiosa es psicológica. Explica qué va a pasar cuando el mercado caiga un cuarenta por ciento, porque va a pasar varias veces en tu vida, y por qué ese es exactamente el momento en que la gente pierde plata: no por la caída, sino por vender durante la caída. También introduce la tasa de ahorro como el número que de verdad importa, más que el sueldo. Ojo, escribe desde Estados Unidos, así que los fondos concretos hay que buscar el equivalente en tu país.",
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
    resumen:
      "Bill Perkins fue operador financiero y escribió este libro contra una idea que nadie cuestiona: ahorrar toda la vida para gastar al final. Su argumento es que la plata solo sirve para comprar experiencias, y que las experiencias tienen fecha de vencimiento, porque hay cosas que a los treinta se pueden hacer y a los setenta no, tengas el dinero que tengas.\n\nSu concepto más útil es el dividendo del recuerdo. Una experiencia no se disfruta solo cuando ocurre, sino cada vez que la recuerdas y cada vez que la cuentas durante el resto de tu vida. Por eso una experiencia a los veinticinco paga dividendos por sesenta años y la misma a los sesenta y cinco paga muchos menos. Ordena la vida en tramos y propone poner cada experiencia en el tramo donde todavía se puede vivir.\n\nSu otra propuesta incomoda a mucha gente y tiene sentido: si vas a ayudar a tus hijos o a alguien que quieres con dinero, dáselo cuando les cambia la vida y no cuando ya no lo necesitan, porque una herencia recibida a los sesenta llega tarde. Hay que leerlo con equilibrio, porque escribe desde una posición cómoda y a veces se olvida de quien vive al día. Pero como contrapeso a la culpa de gastar, es un libro necesario.",
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
    resumen:
      "Thomas Stanley y William Danko pasaron veinte años investigando a millonarios de verdad en Estados Unidos, con encuestas y entrevistas, y publicaron lo que encontraron. El resultado desarmó por completo la imagen que todos teníamos: la mayoría no vivía en barrios caros, no manejaba autos de lujo y no se veía rica en absoluto.\n\nSu hallazgo central es la diferencia entre parecer y ser. Los millonarios que estudiaron gastaban bastante por debajo de lo que podían, compraban autos usados, vivían en casas modestas y le daban mucho valor a la independencia financiera por encima del estatus. En cambio, mucha gente con ingresos altos y ninguna riqueza acumulada estaba dedicada a sostener una apariencia que le costaba todo lo que ganaba.\n\nTraen una fórmula simple para saber dónde estás: multiplica tu edad por tu ingreso anual y divide por diez. Si tu patrimonio está por debajo de eso, el problema es el gasto y no el sueldo. También describen lo que llaman el cuidado económico exterior, que es la ayuda constante de padres a hijos adultos, y muestran con datos que suele debilitar en vez de ayudar. Los datos son de los años noventa y de Estados Unidos, pero la conducta que describen se reconoce en cualquier parte.",
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
    resumen:
      "Viktor Frankl era psiquiatra en Viena cuando fue deportado a los campos de concentración, donde perdió a sus padres, a su hermano y a su esposa. Sobrevivió tres años y escribió este libro en nueve días. La primera mitad es lo que vivió, contado sin odio y sin morbo, casi con la mirada de un investigador. La segunda es la terapia que construyó a partir de eso.\n\nSu observación clave la hizo adentro del campo. Notó que quienes sobrevivían no eran los más fuertes ni los más sanos, sino los que tenían algo por delante: un hijo al otro lado del mundo, un libro que querían terminar, alguien esperando. Cuando esa razón desaparecía, la persona se apagaba en pocos días. De ahí concluye que el ser humano no busca placer ni poder por sobre todo, busca sentido, y que puede soportar casi cualquier cómo si tiene un porqué.\n\nLa frase que resume el libro es la que más se cita en el mundo: entre el estímulo y la respuesta hay un espacio, y en ese espacio está tu libertad. A todo se lo pueden quitar a una persona, dice, menos la última libertad, que es elegir la actitud frente a lo que le toca. Es un libro breve, duro en su primera parte y luminoso en la segunda, y de los pocos que de verdad cambian a quien los lee.",
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
    resumen:
      "Héctor García y Francesc Miralles viajaron a Ogimi, un pueblo de Okinawa que tiene la mayor concentración de centenarios del mundo, y entrevistaron a sus habitantes más viejos. Este libro es lo que encontraron, mezclado con investigación sobre longevidad y con la idea japonesa que le da título.\n\nIkigai se traduce más o menos como la razón por la que te levantas en la mañana. No es una gran misión ni una vocación heroica: para muchos de los ancianos que entrevistaron era cuidar la huerta, juntarse con las amigas, hacer una artesanía. El libro lo explica con el diagrama de cuatro círculos, lo que amas, en lo que eres buena, por lo que te pagarían y lo que el mundo necesita, aunque conviene decir que ese diagrama es una adaptación occidental y no viene del concepto japonés original.\n\nLo demás son los hábitos que observaron y que la ciencia respalda: comer hasta estar ochenta por ciento llena, moverse todo el día de forma suave en vez de entrenar duro dos veces por semana, pertenecer a un grupo pequeño que se cuida, y sobre todo no jubilarse nunca del todo, seguir teniendo algo que hacer que importe. Es un libro liviano, agradable y ordenado, bueno para leer despacio.",
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
    resumen:
      "Simon Sinek notó que algunas empresas y algunos líderes inspiran de una forma que no se explica por su producto ni por su presupuesto, y se puso a buscar el patrón. Lo encontró en el orden en que comunican, y lo dibujó como tres círculos: qué haces, cómo lo haces y por qué lo haces.\n\nCasi todo el mundo comunica de afuera hacia adentro. Empieza por el qué, que es lo fácil de decir, y a veces llega al cómo. Los que inspiran hacen lo contrario, empiezan por el porqué, que es la creencia que hay detrás de lo que hacen, y el producto viene después como consecuencia. Sinek lo respalda con biología, diciendo que el porqué le habla a la parte del cerebro que decide y que no maneja lenguaje, y por eso una decisión inspirada se siente antes de poder explicarse.\n\nSu ejemplo más conocido es Apple, y hay que leerlo sabiendo eso: el libro elige empresas que confirman su idea y a veces simplifica de más. Pero el ejercicio que propone es genuinamente útil, sobre todo si estás emprendiendo. Completa la frase hago esto porque creo que, y si lo que sale suena igual a lo que diría cualquiera de tu rubro, sigue escribiendo hasta que suene tuyo. Eso solo ordena una marca entera.",
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
    resumen:
      "Paulo Coelho escribió esta novela corta en dos semanas y terminó siendo uno de los libros más traducidos de la historia. Cuenta la historia de Santiago, un pastor andaluz que sueña dos veces con un tesoro enterrado junto a las pirámides y decide vender sus ovejas e ir a buscarlo.\n\nEl viaje es una excusa para lo demás. En el camino se encuentra con un rey que le habla de la leyenda personal, esa cosa que viniste a hacer y que de niña sabías perfectamente. Se encuentra con un mercader de cristales que sueña con ir a La Meca pero prefiere seguir soñándolo, porque cumplirlo le quitaría la razón para seguir. Y se encuentra con el alquimista, que le enseña a escuchar al corazón incluso cuando tiene miedo.\n\nSu idea más famosa, que cuando quieres algo el universo conspira para que lo consigas, ha sido criticada por ingenua y con razón, porque el mundo real pone obstáculos que no se disuelven con fe. Pero hay algo que el libro hace muy bien y que ninguna crítica le quita: te obliga a mirar de frente qué es lo tuyo y por qué lo estás postergando. Y su lección final, que el tesoro estaba donde empezó, se entiende distinto según la edad con que lo leas.",
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
    resumen:
      "Elizabeth Gilbert escribió este libro después del éxito enorme de Comer, rezar, amar, y trata sobre cómo vivir una vida creativa sin destruirse en el intento. Está dirigido a cualquiera que haga algo con las manos o la cabeza, no solo a artistas, y su tono es el de una amiga mayor que ya pasó por todo.\n\nSu idea más discutida y más liberadora es que las ideas andan dando vueltas buscando a alguien que las realice, y que si no trabajas con la que te llegó, se va a buscar a otra persona. No hace falta creerlo literalmente para que sirva, porque quita del medio la pregunta paralizante de si eres suficientemente talentosa. La idea llegó, y lo que corresponde es responderle.\n\nSu otra propuesta va contra el mito del artista atormentado. Gilbert dice que no hace falta sufrir para crear, que el miedo va a estar siempre y que la solución no es esperar a que se vaya sino invitarlo a viajar contigo, dejándole claro que no maneja. También aconseja no obligar a tu creatividad a pagar las cuentas, porque esa presión mata el juego. Y propone la curiosidad como puerta cuando la pasión no aparece, que es un alivio enorme para quien lleva años esperando encontrar su gran vocación.",
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
    resumen:
      "Ken Robinson fue el educador cuya charla sobre si la escuela mata la creatividad es la más vista de la historia. Este libro desarrolla esa idea con decenas de historias de personas que encontraron lo suyo, muchas veces después de haber sido pésimos estudiantes.\n\nLlama el elemento al punto donde se cruzan lo que se te da bien de forma natural y lo que además amas hacer. Insiste en que hacen falta las dos cosas: hay gente muy buena en algo que la aburre profundamente, y gente que ama algo para lo que no tiene facilidad. Cuando las dos coinciden aparece un estado donde el tiempo se pasa distinto y el esfuerzo no pesa igual.\n\nSu crítica al sistema educativo es dura y bien argumentada. Dice que la escuela ordena a los niños por edad como si fueran una línea de producción, que valora unas pocas inteligencias y descarta el resto, y que a muchísima gente le enseñó temprano que lo suyo no servía. Por eso insiste en dos cosas: nunca es tarde, con casos de gente que encontró lo suyo a los cincuenta o los sesenta, y hace falta la tribu, porque casi nadie descubre lo suyo completamente solo. Es un libro que da esperanza sin sonar hueco.",
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
    resumen:
      "Bill Burnett y Dave Evans enseñan en Stanford y son diseñadores, no consejeros vocacionales. Su propuesta es tratar la vida como se trata un problema de diseño: no se resuelve pensando mucho, se resuelve prototipando, probando cosas chicas y aprendiendo de lo que pasa.\n\nSu primera tarea es desarmar lo que llaman creencias que estorban, la peor de todas la de que existe una única cosa correcta para ti y que si no la encuentras fallaste. En su lugar proponen escribir tres versiones distintas de los próximos cinco años: la vida que ya va en camino, la que harías si esa se cayera de golpe, y la que harías si el dinero y la opinión de los demás no importaran. Las tres tienen que ser vidas que te darían gusto vivir.\n\nLa herramienta que más se usa es el diario de energía. Durante unas semanas anotas qué actividades te dieron energía y cuáles te la quitaron, y ese registro dice bastante más que cualquier test vocacional. Después viene el prototipo, que es probar en chico antes de saltar: conversar con alguien que ya vive de eso, tomar un curso, hacerlo un fin de semana. Es un libro práctico, con ejercicios de verdad, y especialmente bueno si estás en un cambio y no sabes por dónde empezar.",
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
    resumen:
      "Julia Cameron escribió este libro en 1992 como un curso de doce semanas para gente creativamente bloqueada, y terminó convertido en un clásico que se sigue haciendo en grupos por todo el mundo. No es un libro para leer, es un programa para hacer, y esa distinción importa porque leído sin practicarlo no sirve de mucho.\n\nSu tesis es que la creatividad no es un talento que se tiene o no se tiene, es un flujo natural que en la mayoría de la gente está tapado. Tapado por críticas viejas, por profesores que dijeron algo hiriente, por la idea de que el arte es para los que lo hacen profesionalmente. Cameron dedica buena parte del libro a desenterrar esas heridas concretas y a devolverles su tamaño real.\n\nSus dos herramientas son famosas por lo bien que funcionan. Las páginas matutinas, tres páginas a mano apenas te despiertas, escribiendo lo que sea sin pensar y sin releer, que no son para escribir bien sino para sacar el ruido de la cabeza. Y la cita de artista, una salida sola por semana a algo que te llene el pozo, sin productividad y sin compañía. Tiene un lenguaje espiritual que a algunos les incomoda, y se puede traducir sin perder nada. Las herramientas funcionan igual.",
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
    resumen:
      "Stephen Covey publicó este libro en 1989 y es probablemente el más influyente que existe sobre efectividad personal. Su diferencia con la mayoría es que no habla de técnicas sino de carácter: dice que los atajos de personalidad funcionan un rato y que lo único que sostiene en el tiempo son los principios.\n\nOrganiza los siete hábitos en una progresión que tiene sentido. Los tres primeros son la victoria privada: ser proactiva, que significa responder en vez de reaccionar, empezar con el fin en mente, que es saber para dónde vas antes de correr, y poner primero lo primero, que es su famosa matriz de lo urgente y lo importante. Los tres siguientes son la victoria pública: pensar en ganar y ganar, buscar primero entender y después ser entendida, y la sinergia. El séptimo, afilar la sierra, es cuidarte para poder sostener los otros seis.\n\nDe todos, el que más cambia la vida diaria es el tercero. Covey muestra que lo urgente se come el día entero y que lo importante y no urgente, la salud, las relaciones, planificar, aprender, es donde se construye una vida, y que si no lo agendas primero simplemente no ocurre. Es un libro denso, con lenguaje empresarial de su época, pero vale el esfuerzo por esa idea sola.",
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
    resumen:
      "David Schwartz publicó este libro en 1959 y sigue vendiéndose, lo que ya dice algo. Su tema es directo: el tamaño de tu éxito lo determina el tamaño de lo que crees posible, y la mayoría de la gente se pone un techo mucho antes de que el mundo se lo ponga.\n\nSu concepto más recordado es lo que llama excusitis, la enfermedad del fracaso, y describe sus cuatro formas. La de la salud, no puedo porque me siento mal. La de la inteligencia, no soy suficientemente lista. La de la edad, ya es tarde o soy muy joven. Y la de la suerte, a otros les tocó y a mí no. Contra cada una propone lo mismo, buscar a alguien que llegó lejos teniendo exactamente esa condición, porque siempre existe.\n\nSu segunda idea es que la acción precede a la confianza y no al revés. No esperas sentirte segura para actuar, actúas y la seguridad llega después, y por eso sugiere pararse, caminar y hablar como la persona que quieres ser, porque la conducta arrastra al ánimo. El estilo es de su época, muy de vendedor optimista americano, y algunos ejemplos envejecieron. Pero si tu límite principal es que no te crees capaz, este libro pega justo ahí.",
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
    resumen:
      "Eckhart Tolle vivió hasta los veintinueve años en una depresión profunda, con noches en que pensaba en no seguir. Una madrugada tuvo una experiencia que describe como una separación repentina entre él y su propio pensamiento, y después pasó años sentado en bancos de parque sin saber muy bien qué le había ocurrido. Este libro es el intento de explicarlo.\n\nSu idea central es que la mayor parte del sufrimiento no viene de los hechos, viene del pensamiento compulsivo sobre los hechos. Vivimos rumiando el pasado o ensayando el futuro, y a eso Tolle lo llama estar identificada con la mente. Su propuesta es simple de decir y difícil de sostener: darte cuenta de que hay alguien que escucha esa voz, y que ese alguien no es la voz. Ese darse cuenta es lo que llama presencia.\n\nSus herramientas son cortas y se pueden hacer en cualquier parte. Prestar atención a la respiración durante tres ciclos. Sentir el cuerpo por dentro, las manos, los pies. Escuchar los sonidos sin nombrarlos. También habla del cuerpo del dolor, esa acumulación de sufrimiento viejo que se activa sola y busca más de lo mismo. El libro está escrito en preguntas y respuestas y a ratos se pone denso, así que se lee mejor de a poco y releyendo.",
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
    resumen:
      "Paramahansa Yogananda nació en India en 1893 y fue uno de los primeros maestros de yoga en instalarse en Occidente. Esta autobiografía, publicada en 1946, es el libro que introdujo la meditación india a millones de personas de habla inglesa y española, y sigue siendo el más leído del género.\n\nCuenta su vida desde la infancia, la búsqueda de un maestro, el encuentro con Sri Yukteswar y los años de formación, y después su viaje a Estados Unidos. Está lleno de relatos de fenómenos extraordinarios, santos que aparecen en dos lugares a la vez, curaciones, levitaciones. Hay que decirlo con honestidad: esos episodios se toman como se quiera tomar, y el libro se disfruta igual leyéndolos como parte de una tradición y no como reportaje.\n\nLo que queda cuando se deja eso de lado es un retrato humano muy hermoso de la relación entre un maestro y su discípulo, y una defensa de la disciplina diaria por encima de la experiencia espectacular. Yogananda insiste en que el trabajo real es sentarse todos los días, no la visión que ocurre una vez. Steve Jobs lo releía cada año y lo regaló en su propio funeral, que es una recomendación curiosa y bastante elocuente.",
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
    resumen:
      "Robin Sharma cuenta la historia de Julian Mantle, un abogado exitoso y millonario que sufre un infarto en plena sala de tribunal, vende todo lo que tiene, incluido su Ferrari, y se va a los Himalaya a buscar otra forma de vivir. Vuelve años después a contarle a un antiguo colega lo que aprendió, y ese relato es el libro.\n\nEl formato es una fábula, con un jardín imaginario donde cada elemento representa una enseñanza, y hay que decir que ese recurso resulta encantador para algunos y forzado para otros. Lo que hay debajo son principios bastante clásicos: cuidar la mente como se cuida un jardín, tener un propósito claro, practicar la disciplina como un músculo, respetar el tiempo, servir a otros y vivir el presente.\n\nSu aporte más concreto y el que la gente aplica es lo que llama la hora sagrada. Reservar la primera hora del día para ti, antes de que el día empiece a pedirte cosas, y llenarla con cuerpo, silencio y lectura. Es un libro liviano, se lee rápido, y funciona muy bien como puerta de entrada si nunca has leído nada de este tipo. Si ya leíste bastante, te va a sonar conocido, y no por eso deja de servir.",
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
    resumen:
      "Michael Singer era estudiante de doctorado en economía cuando tuvo una experiencia que lo dejó buscando el resto de su vida, y curiosamente después fundó y dirigió una empresa de software enorme. Este libro es su explicación de qué es esa voz que habla adentro de tu cabeza y qué hacer con ella.\n\nEmpieza con una observación que produce un efecto raro apenas la lees: hay una voz que comenta todo, y si tú la puedes escuchar, entonces tú no eres esa voz. Singer construye todo el libro sobre esa grieta. Dice que pasamos la vida obedeciendo a un narrador que opina sin parar, y que la libertad empieza cuando lo escuchas como escucharías una radio encendida en otra pieza.\n\nSu parte más práctica trata de cómo se acumula el dolor. Cuando algo duele y no lo dejamos pasar, queda guardado como una espina, y después organizamos la vida entera para no rozarla. Su propuesta es al revés: cuando algo te apriete el pecho, en vez de analizarlo o defenderte, relaja el cuerpo y déjalo pasar a través tuyo. Se suelta soltando, no entendiendo. Es un libro corto, muy claro, y de los mejores para alguien que piensa demasiado.",
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
    resumen:
      "Hermann Hesse escribió esta novela corta en 1922, después de un viaje a India y de su propia crisis personal. Cuenta la vida de Siddhartha, un joven brahmán que lo tiene todo y aun así se va de su casa a buscar algo que no sabe nombrar. No es la vida de Buda, aunque Buda aparece como personaje, y ese detalle es justamente el punto.\n\nSiddhartha prueba todos los caminos. La ascesis extrema con los samanas, hasta casi desaparecer. Después el mundo entero, con Kamala, el comercio, el dinero, el juego, hasta hundirse en eso también. Y cuando conoce a Buda y reconoce que es un iluminado, decide no seguirlo, porque entiende que la sabiduría no se puede recibir de otro. Esa escena es el corazón del libro.\n\nAl final termina de barquero junto a un río, y ahí aprende lo que ningún maestro pudo enseñarle, escuchando el agua. La novela es breve, está escrita con una prosa muy hermosa y se lee en un par de tardes. Lo que te llevas no es una técnica, es una pregunta que se queda: qué cosa has entendido de verdad tú, por haberla vivido, y no por habértela dicho alguien.",
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
    resumen:
      "Pema Chödrön es una monja budista estadounidense que llegó al budismo después de que su segundo matrimonio se acabara de golpe. Este libro está escrito desde ahí, desde el momento en que la vida se desarma, y por eso funciona tan bien para quien está justo en ese punto y no quiere que le digan que todo pasa por algo.\n\nSu propuesta va contra el instinto. Dice que cuando llega el dolor hacemos siempre lo mismo, buscar terreno firme, distraernos, explicarnos, arreglarlo rápido, y que ese movimiento es el que alarga el sufrimiento. Lo que propone en cambio es quedarse. No entender, no resolver, no huir. Solo quedarse un minuto con lo que se siente, sin taparlo. Y dice algo importante: que ahí, justo donde todo se desarma, hay una apertura que no aparece cuando todo va bien.\n\nDe ahí vienen sus prácticas. La compasión hacia una misma primero, porque no se puede dar lo que no se tiene. El tonglen, que consiste en respirar hacia adentro el dolor propio y ajeno y exhalar alivio, que suena imposible y hace algo raro y bueno. Y la idea que más consuela: cuando algo te duele, en este mismo momento hay miles de personas sintiendo exactamente eso, así que no estás sola en ello.",
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
    resumen:
      "Thich Nhat Hanh fue un monje vietnamita que vivió la guerra en su país, fue exiliado por pedir la paz y pasó el resto de su vida enseñando en Occidente. Martin Luther King lo propuso para el Nobel de la Paz. Este libro es su enseñanza más accesible, escrito en capítulos de una o dos páginas.\n\nSu idea es que no hace falta ir a ningún retiro ni sentarse una hora al día para practicar. La atención plena se entrena en lo que ya estás haciendo: lavar los platos sintiendo el agua caliente en las manos, caminar sabiendo que caminas, comer una mandarina mirándola de verdad. La práctica no es un rato aparte del día, es el día.\n\nSus herramientas son pequeñas y se pegan. La respiración con una frase adentro, inspirando sé que inspiro, espirando sonrío. La media sonrisa, que suena tonta y cambia el estado de ánimo antes de que la mente entienda por qué. Y la campana de atención plena, que es elegir un sonido cotidiano, el teléfono, una puerta, el hervidor, y que cada vez que suene sea un recordatorio para respirar una vez completa. Es un libro simple, tierno, sin nada de complicado, y de los que se pueden abrir en cualquier página.",
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
    resumen:
      "Clarissa Pinkola Estés es psicoanalista junguiana y cantadora, es decir, guardiana de cuentos en su tradición latina. Pasó veinte años recogiendo relatos populares de muchas culturas y escribió este libro, que se convirtió en un fenómeno enorme entre mujeres de todo el mundo.\n\nSu tesis es que existe una naturaleza instintiva en cada mujer, que ella llama la mujer salvaje, y que la educación, el miedo y la necesidad de agradar la fueron domesticando hasta dejarla dormida. No usa salvaje como descontrolada, sino como natural, la que sabe cuándo algo está mal antes de poder explicarlo, la que crea, la que pone límites sin pedir permiso.\n\nEl libro avanza a través de cuentos, La Loba, Barba Azul, Los zapatos rojos, Piel de foca, y después de cada uno viene su interpretación psicológica. Ahí aparecen los temas: el depredador interno que sabotea, lo que entregaste para que te aceptaran, el ciclo de vida y muerte que hay en toda relación y todo proyecto, la necesidad de volver a casa cada cierto tiempo. Es un libro largo, denso, escrito con una prosa muy poética que hay que leer despacio. No es para leerlo entero de corrido, es para tenerlo cerca durante meses.",
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
    resumen:
      "Khalil Gibran era libanés, emigró a Estados Unidos siendo niño y escribió este libro en inglés en 1923. Nunca ha dejado de publicarse y se lee en bodas, en funerales y en momentos de cambio en todo el mundo. No es un libro de instrucciones ni de religión, aunque suene a las dos cosas.\n\nLa estructura es simple. Almustafá, un profeta que lleva doce años viviendo en una ciudad extranjera, está por embarcarse de vuelta a casa. La gente del pueblo lo rodea y le pide que hable antes de irse. Y él responde una por una a las preguntas de la vida: el amor, el matrimonio, los hijos, el trabajo, la alegría y la tristeza, la libertad, el dolor, la amistad, la muerte.\n\nSus pasajes más conocidos incomodan un poco y por eso se recuerdan. Dice que tus hijos no son tus hijos, que vienen a través tuyo pero no de ti. Que en el matrimonio conviene dejar espacios, porque las columnas del templo se sostienen separadas. Que la alegría y la tristeza son inseparables y que cuanto más hondo cava el dolor, más alegría puede caber después. Está escrito como poesía en prosa, así que se lee mejor en voz alta y de a un capítulo, no de corrido.",
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
