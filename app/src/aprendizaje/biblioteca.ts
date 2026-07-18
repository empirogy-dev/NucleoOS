// Biblioteca curada de NucleoOS: los libros que de verdad ayudan a un
// cerebro TDAH a construir su vida, elegidos por impacto y no por moda.
// Nueve por sección (tres filas de tres tarjetas), cada uno con el
// porqué y sus tres ideas para llevar.

export type ViaLibro = "tdah" | "habitos" | "emociones" | "relaciones" | "finanzas" | "proposito" | "espiritualidad";

export const VIAS_LIBRO: Array<{ key: ViaLibro; label: string }> = [
  { key: "tdah", label: "TDAH y foco" },
  { key: "habitos", label: "Hábitos" },
  { key: "emociones", label: "Emociones" },
  { key: "relaciones", label: "Relaciones" },
  { key: "finanzas", label: "Finanzas" },
  { key: "proposito", label: "Propósito" },
  { key: "espiritualidad", label: "Espiritualidad" },
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
  // ---------- TDAH y foco ----------
  {
    id: "adhd20",
    titulo: "ADHD 2.0",
    autor: "Edward Hallowell y John Ratey",
    via: "tdah",
    emoji: "🧠",
    porQue: "Los dos médicos que llevan décadas estudiando el TDAH explican el cerebro que corre como Ferrari con frenos de bicicleta. EL libro para entenderte sin patologizarte.",
    ideas: [
      "El TDAH es un rasgo con superpoderes y costos, no un defecto de carácter.",
      "El ejercicio es medicina de primera línea para este cerebro.",
      "El entorno correcto vale más que el esfuerzo: diseña tu vida para tu cerebro.",
    ],
  },
  {
    id: "howtoadhd",
    titulo: "How to ADHD",
    autor: "Jessica McCabe",
    via: "tdah",
    emoji: "🧰",
    porQue: "Escrito por alguien que vive con TDAH, no solo lo estudia. Una caja de herramientas práctica y sin vergüenza.",
    ideas: [
      "Trabaja con tu cerebro, no contra él: si te funciona raro pero funciona, es válido.",
      "Externaliza todo: tu cerebro no es un buen archivador.",
      "Los sistemas le ganan a la fuerza de voluntad, siempre.",
    ],
  },
  {
    id: "driven",
    titulo: "Driven to Distraction",
    autor: "Edward Hallowell y John Ratey",
    via: "tdah",
    emoji: "🚗",
    porQue: "El clásico que puso el TDAH adulto en el mapa. Si ADHD 2.0 es el resumen moderno, este es el fundamento con casos reales que se sienten como espejos.",
    ideas: [
      "El diagnóstico es un alivio, no una etiqueta: por fin todo tiene explicación.",
      "El TDAH adulto existe y se ve distinto al de los niños.",
      "Estructura externa más comprensión interna, esa es la fórmula.",
    ],
  },
  {
    id: "scattered",
    titulo: "Scattered Minds",
    autor: "Gabor Maté",
    via: "tdah",
    emoji: "🌫",
    porQue: "Maté mira el TDAH con compasión profunda: no como falla genética a secas, sino como una historia que también se sana. Controversial y hermoso.",
    ideas: [
      "La atención se desarrolla en el vínculo: sanar relaciones ayuda a sanar el foco.",
      "La autocomprensión desarma la vergüenza acumulada de años.",
      "No estás rota: tu cerebro se adaptó para sobrevivir.",
    ],
  },
  {
    id: "notbroken",
    titulo: "Your Brain's Not Broken",
    autor: "Tamara Rosier",
    via: "tdah",
    emoji: "🛠",
    porQue: "Rosier explica el TDAH desde las emociones, que es donde de verdad duele: la culpa, la vergüenza, el ciclo de prometer y no cumplir.",
    ideas: [
      "El TDAH es un problema de regulación emocional tanto como de atención.",
      "Los cuadrantes de energía: no toda hora del día sirve para todo.",
      "La motivación TDAH corre con interés, urgencia, novedad y desafío.",
    ],
  },
  {
    id: "radicalguide",
    titulo: "A Radical Guide for Women with ADHD",
    autor: "Sari Solden y Michelle Frank",
    via: "tdah",
    emoji: "👑",
    porQue: "El TDAH en mujeres se ve distinto y se diagnostica tarde, después de años de sentirse 'demasiado' o 'poco'. Este libro es para ti específicamente.",
    ideas: [
      "Deja de esconder tu diferencia: la energía de camuflarte te está costando la vida.",
      "Las mujeres con TDAH cargan expectativas de género imposibles.",
      "Vivir en grande no es arreglarte primero: es empezar ahora, como eres.",
    ],
  },
  {
    id: "nowhabit",
    titulo: "El hábito del ahora",
    autor: "Neil Fiore",
    via: "tdah",
    emoji: "⏳",
    porQue: "El mejor libro sobre procrastinación porque la trata como miedo y no como flojera. Su método calza perfecto con tus bloques de foco.",
    ideas: [
      "Procrastinar es protegerte del agobio, no ser floja.",
      "Bloques cortos con descansos ganados: tu pomodoro es esto.",
      "Agenda primero el descanso y el placer, el trabajo cabe solo.",
    ],
  },
  {
    id: "orderchaos",
    titulo: "Order from Chaos",
    autor: "Jaclyn Paul",
    via: "tdah",
    emoji: "🗂",
    porQue: "Organización doméstica y de vida escrita por una mujer con TDAH que probó todo lo que no funciona. Cero sistemas de personas neurotípicas.",
    ideas: [
      "El sistema perfecto es el que sigues usando en tres meses.",
      "Todo necesita UN lugar, visible: lo guardado desaparece del universo.",
      "Mantén el mantenimiento pequeño: diez minutos diarios le ganan al maratón mensual.",
    ],
  },
  {
    id: "hyperfocus",
    titulo: "Hyperfocus",
    autor: "Chris Bailey",
    via: "tdah",
    emoji: "🔦",
    porQue: "La atención como recurso que se administra: cuándo enfocarla en una sola cosa y cuándo dejarla vagar a propósito, que también es productivo.",
    ideas: [
      "Tu atención cabe una sola cosa compleja a la vez: elígela a propósito.",
      "El modo difuso (ducha, caminata) resuelve lo que el foco no pudo.",
      "Deja el ambiente sin anzuelos antes de empezar el bloque.",
    ],
  },

  // ---------- Hábitos ----------
  {
    id: "atomicos",
    titulo: "Hábitos atómicos",
    autor: "James Clear",
    via: "habitos",
    emoji: "⚛️",
    porQue: "El manual de los sistemas pequeños. Tu módulo de Dirección ya usa sus cuatro leyes; el libro las profundiza con calma.",
    ideas: [
      "Un 1% mejor cada día se acumula: tus metas automáticas son este principio.",
      "Hazlo obvio y fácil, y súbele la fricción a lo que no quieres.",
      "Cada acción es un voto por la identidad que construyes.",
    ],
  },
  {
    id: "tinyhabits",
    titulo: "Hábitos mínimos (Tiny Habits)",
    autor: "BJ Fogg",
    via: "habitos",
    emoji: "🌱",
    porQue: "La versión aún más pequeña que Clear, ideal para TDAH: cambios tan chicos que no activan la resistencia.",
    ideas: [
      "Ancla el hábito nuevo a uno existente: después del café, un minuto de meditación.",
      "Celebra al tiro, aunque sea ridículo: la emoción graba el hábito.",
      "Si no pega, achícalo en vez de esforzarte más.",
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
      "La distracción parte por dentro: nombra qué incomodidad estás evitando.",
      "Convierte el tiempo en intención: cada bloque con su para qué.",
      "Ponle fricción a la distracción antes de que llegue.",
    ],
  },
  {
    id: "poderhabito",
    titulo: "El poder de los hábitos",
    autor: "Charles Duhigg",
    via: "habitos",
    emoji: "🔁",
    porQue: "El que explicó al mundo el bucle señal, rutina, recompensa. Entender la mecánica te deja hackearla.",
    ideas: [
      "Todo hábito tiene señal, rutina y recompensa: identifícalas y puedes cambiarlo.",
      "No elimines el hábito, reemplaza la rutina manteniendo señal y recompensa.",
      "Los hábitos clave (como entrenar) arrastran cambios en cadena.",
    ],
  },
  {
    id: "deepwork",
    titulo: "Deep Work (Enfócate)",
    autor: "Cal Newport",
    via: "habitos",
    emoji: "🏛",
    porQue: "El argumento definitivo de por qué el trabajo profundo vale oro en un mundo distraído, y cómo construir la vida que lo protege.",
    ideas: [
      "El trabajo profundo es raro y valioso: quien lo cultiva, destaca.",
      "Rituales y horarios fijos le quitan la decisión al momento.",
      "El aburrimiento entrena el foco: no llenes cada espera con el celular.",
    ],
  },
  {
    id: "esencialismo",
    titulo: "Esencialismo",
    autor: "Greg McKeown",
    via: "habitos",
    emoji: "🎋",
    porQue: "Menos pero mejor. Para el cerebro TDAH que quiere hacerlo TODO, este libro es el permiso para elegir poco y en serio.",
    ideas: [
      "Si no es un sí claro, es un no.",
      "Elimina para avanzar: cada compromiso nuevo roba energía a los que importan.",
      "Protege el espacio para pensar: sin él solo reaccionas.",
    ],
  },
  {
    id: "onething",
    titulo: "The One Thing (Solo una cosa)",
    autor: "Gary Keller y Jay Papasan",
    via: "habitos",
    emoji: "1️⃣",
    porQue: "La pregunta enfocadora: ¿cuál es la ÚNICA cosa que puedo hacer, tal que al hacerla todo lo demás se vuelve más fácil o innecesario?",
    ideas: [
      "Una sola prioridad de verdad: la palabra prioridades no existía en plural.",
      "Bloquea tiempo para tu única cosa antes que nada más.",
      "El éxito se construye secuencialmente, no simultáneamente.",
    ],
  },
  {
    id: "minihabitos",
    titulo: "Mini hábitos",
    autor: "Stephen Guise",
    via: "habitos",
    emoji: "🐜",
    porQue: "Una flexión al día. En serio. La meta ridículamente pequeña elimina la resistencia y casi siempre terminas haciendo más.",
    ideas: [
      "La meta mínima se cumple hasta en tu peor día, y eso mantiene la cadena.",
      "La resistencia vive en el tamaño de la tarea, no en ti.",
      "Pasarte de la meta es bonus, no la nueva exigencia.",
    ],
  },
  {
    id: "gtd",
    titulo: "Organízate con eficacia (GTD)",
    autor: "David Allen",
    via: "habitos",
    emoji: "📥",
    porQue: "El clásico de sacar todo de la cabeza a un sistema confiable. Tu captura rápida ⚡ es puro GTD.",
    ideas: [
      "La mente es para tener ideas, no para guardarlas.",
      "Si toma menos de dos minutos, hazlo ahora.",
      "Define siempre la siguiente acción física, no el proyecto abstracto.",
    ],
  },

  // ---------- Emociones ----------
  {
    id: "autocompasion",
    titulo: "Sé amable contigo mismo",
    autor: "Kristin Neff",
    via: "emociones",
    emoji: "💗",
    porQue: "La ciencia de la autocompasión, el antídoto exacto contra la culpa crónica del TDAH. El tono cero culpa de NucleoOS viene de esta investigación.",
    ideas: [
      "La autocrítica no motiva, paraliza: la evidencia es clarísima.",
      "Trátate como tratarías a tu mejor amiga en el mismo problema.",
      "Fallar no te separa del resto, te une: humanidad compartida.",
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
      "El 'todavía' cambia todo.",
      "Elogia el proceso y el intento, también al hablarte a ti misma.",
    ],
  },
  {
    id: "cuatroacuerdos",
    titulo: "Los cuatro acuerdos",
    autor: "Miguel Ruiz",
    via: "emociones",
    emoji: "🕊",
    porQue: "Sabiduría simple para soltar la autoexigencia y el ruido ajeno. Corto, directo y releíble.",
    ideas: [
      "Sé impecable con tus palabras, sobre todo las que te dices a ti.",
      "No te tomes nada personal: lo que otros hacen habla de ellos.",
      "Haz siempre tu máximo posible, sabiendo que cambia según el día.",
    ],
  },
  {
    id: "inteligenciaemocional",
    titulo: "Inteligencia emocional",
    autor: "Daniel Goleman",
    via: "emociones",
    emoji: "🧭",
    porQue: "El libro que demostró que manejar emociones predice más éxito y bienestar que el coeficiente intelectual. La base de todo lo demás.",
    ideas: [
      "Nombrar la emoción ya la calma: ponerle palabras baja el volumen.",
      "El secuestro emocional dura minutos: no decidas dentro de él.",
      "La empatía se entrena escuchando sin preparar la respuesta.",
    ],
  },
  {
    id: "cuerpocuenta",
    titulo: "El cuerpo lleva la cuenta",
    autor: "Bessel van der Kolk",
    via: "emociones",
    emoji: "🫀",
    porQue: "El trauma no vive en el recuerdo sino en el cuerpo, y por el cuerpo también se sana. Explica por qué tus prácticas de regulación funcionan.",
    ideas: [
      "El cuerpo recuerda lo que la mente entierra.",
      "Respiración, movimiento y ritmo regulan lo que hablar no alcanza.",
      "Sentirse segura es la condición previa de toda sanación.",
    ],
  },
  {
    id: "permisosentir",
    titulo: "Permiso para sentir",
    autor: "Marc Brackett",
    via: "emociones",
    emoji: "🎨",
    porQue: "Del director del centro de inteligencia emocional de Yale: un método concreto (RULER) para reconocer y regular lo que sientes.",
    ideas: [
      "Todas las emociones son información, ninguna es el enemigo.",
      "Reconocer, comprender, etiquetar, expresar, regular: en ese orden.",
      "El permiso para sentir se regala primero a una misma.",
    ],
  },
  {
    id: "trampafelicidad",
    titulo: "La trampa de la felicidad",
    autor: "Russ Harris",
    via: "emociones",
    emoji: "🪤",
    porQue: "Perseguir sentirse bien todo el tiempo es la trampa. Terapia de aceptación y compromiso en lenguaje simple: hacer lo que importa aunque el clima interno esté feo.",
    ideas: [
      "Los pensamientos son ruido de radio: escúchalos sin obedecerlos.",
      "Actúa según tus valores, no según tu ánimo.",
      "Aceptar no es rendirse: es dejar de pelear con lo que ya sientes.",
    ],
  },
  {
    id: "cosasbuenas",
    titulo: "Cómo hacer que te pasen cosas buenas",
    autor: "Marian Rojas Estapé",
    via: "emociones",
    emoji: "☀️",
    porQue: "Psiquiatría explicada en cercano y en español: cortisol, ansiedad y cómo el cuerpo y los pensamientos se retroalimentan.",
    ideas: [
      "El cortisol crónico enferma: bajar el estrés es salud física.",
      "Tu atención define tu realidad: lo que buscas, encuentras.",
      "Las personas vitamina existen: rodéate de ellas.",
    ],
  },
  {
    id: "burnout",
    titulo: "Burnout",
    autor: "Emily Nagoski y Amelia Nagoski",
    via: "emociones",
    emoji: "🔥",
    porQue: "Escrito para mujeres: el estrés es un ciclo físico que hay que CERRAR (no basta resolver el problema que lo causó). Cambia cómo entiendes el cansancio.",
    ideas: [
      "Cierra el ciclo del estrés con cuerpo: movimiento, llanto, abrazo largo, risa.",
      "El descanso no se gana, se necesita: 42% del día entre sueño y pausas.",
      "El síndrome de la dadora agota: no naciste para darlo todo.",
    ],
  },

  // ---------- Relaciones ----------
  {
    id: "gottman",
    titulo: "Siete reglas de oro para vivir en pareja",
    autor: "John Gottman",
    via: "relaciones",
    emoji: "💞",
    porQue: "Cuarenta años observando parejas reales en laboratorio. Tu página de Relaciones ya cita sus hallazgos; el libro trae los ejercicios completos.",
    ideas: [
      "Responde a los pequeños intentos de conexión: voltear cuando te hablan pesa más que las citas románticas.",
      "Mapas de amor: conocer el mundo interno del otro, actualizado.",
      "Cinco interacciones positivas por cada negativa: la proporción mágica.",
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
      "Conocer tu estilo de apego explica patrones de años.",
      "Necesitar cercanía no es dependencia: es biología sana.",
      "La comunicación directa le gana al juego de las indirectas.",
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
      "Detrás de cada reproche hay una necesidad sin nombrar.",
      "Pide en positivo y concreto, no en queja abstracta.",
    ],
  },
  {
    id: "lenguajesamor",
    titulo: "Los 5 lenguajes del amor",
    autor: "Gary Chapman",
    via: "relaciones",
    emoji: "💬",
    porQue: "Simple y transformador: cada persona da y recibe amor en un idioma distinto, y muchos desencuentros son solo traducciones fallidas.",
    ideas: [
      "Descubre tu lenguaje y el del otro: palabras, tiempo, regalos, servicio o contacto.",
      "Ama en el idioma del otro, no en el tuyo.",
      "El tanque emocional lleno cambia toda la relación.",
    ],
  },
  {
    id: "abrazame",
    titulo: "Abrázame fuerte",
    autor: "Sue Johnson",
    via: "relaciones",
    emoji: "🤗",
    porQue: "La creadora de la terapia de pareja más efectiva que existe (EFT) enseña las siete conversaciones que reparan el vínculo.",
    ideas: [
      "Las peleas de pareja son protestas por desconexión, no por platos sucios.",
      "¿Estás ahí para mí? es la pregunta debajo de todas las peleas.",
      "La vulnerabilidad expresada a tiempo desarma la guerra.",
    ],
  },
  {
    id: "limites",
    titulo: "Límites (Set Boundaries, Find Peace)",
    autor: "Nedra Glover Tawwab",
    via: "relaciones",
    emoji: "🚧",
    porQue: "El manual moderno de poner límites sin culpa: qué decir, cómo decirlo y qué hacer cuando no los respetan.",
    ideas: [
      "El resentimiento es la señal de un límite que falta.",
      "Un límite se comunica, no se insinúa.",
      "Decir que no es una frase completa (y un acto de amor propio).",
    ],
  },
  {
    id: "artedeamar",
    titulo: "El arte de amar",
    autor: "Erich Fromm",
    via: "relaciones",
    emoji: "🎨",
    porQue: "El clásico filosófico: amar no es encontrar a la persona correcta sino practicar una habilidad, con disciplina y paciencia, toda la vida.",
    ideas: [
      "El amor es práctica activa, no un accidente que te ocurre.",
      "Amar madura cuando das desde la abundancia, no desde la carencia.",
      "Cuidado, responsabilidad, respeto y conocimiento: los cuatro pilares.",
    ],
  },
  {
    id: "ganaramigos",
    titulo: "Cómo ganar amigos e influir sobre las personas",
    autor: "Dale Carnegie",
    via: "relaciones",
    emoji: "🤝",
    porQue: "Noventa años vigente porque la naturaleza humana no cambia: interés genuino por el otro abre todas las puertas.",
    ideas: [
      "Interésate genuinamente: la gente nota la diferencia con la técnica.",
      "El nombre propio es el sonido más dulce para cualquier persona.",
      "Nunca digas 'estás equivocado': deja que el otro salve la cara.",
    ],
  },
  {
    id: "perel",
    titulo: "Inteligencia erótica",
    autor: "Esther Perel",
    via: "relaciones",
    emoji: "🔥",
    porQue: "La paradoja del amor moderno: la cercanía da seguridad pero el deseo necesita misterio. Perel enseña a sostener ambos.",
    ideas: [
      "El deseo necesita espacio: la fusión total lo apaga.",
      "Mirar al otro brillando en lo suyo reaviva la chispa.",
      "La pareja perfecta no existe: existen dos personas que se eligen.",
    ],
  },

  // ---------- Finanzas ----------
  {
    id: "psicologiadinero",
    titulo: "La psicología del dinero",
    autor: "Morgan Housel",
    via: "finanzas",
    emoji: "🧠",
    porQue: "El mejor libro de dinero de la década: no es de fórmulas sino de conducta, porque con la plata el comportamiento le gana al conocimiento.",
    ideas: [
      "Hacerse rica y mantenerse rica son habilidades opuestas.",
      "El interés compuesto necesita tiempo, no genialidad: empieza ya.",
      "Riqueza es lo que NO se ve: lo que no gastaste.",
    ],
  },
  {
    id: "padrerico",
    titulo: "Padre rico, padre pobre",
    autor: "Robert Kiyosaki",
    via: "finanzas",
    emoji: "🏠",
    porQue: "El que le cambió el chip financiero a una generación: activos contra pasivos, y por qué la casa propia no siempre es inversión.",
    ideas: [
      "Un activo pone plata en tu bolsillo, un pasivo la saca.",
      "Los ricos compran activos primero y lujos con las ganancias.",
      "Tu trabajo paga las cuentas, tus activos construyen libertad.",
    ],
  },
  {
    id: "babilonia",
    titulo: "El hombre más rico de Babilonia",
    autor: "George Clason",
    via: "finanzas",
    emoji: "🏺",
    porQue: "Sabiduría financiera de hace un siglo en forma de parábolas. Simple, corto y contiene el 80% de lo que necesitas saber.",
    ideas: [
      "Págate primero: el 10% de todo lo que ganas es tuyo para guardar.",
      "Haz que tu oro trabaje: cada moneda ahorrada es una esclava que trabaja para ti.",
      "Cuidado con los consejos de quien no sabe: pregunta a quien ya lo logró.",
    ],
  },
  {
    id: "ramit",
    titulo: "Te enseñaré a ser rico",
    autor: "Ramit Sethi",
    via: "finanzas",
    emoji: "📊",
    porQue: "Finanzas personales automatizadas y sin culpa: gasta sin miedo en lo que amas, corta sin piedad lo que no.",
    ideas: [
      "Automatiza todo: la fuerza de voluntad no es un plan financiero (ideal para TDAH).",
      "Tu vida rica es personal: define qué es tuyo y qué es aparentar.",
      "El gran ahorro está en las 3 grandes: vivienda, transporte, comida, no en los cafés.",
    ],
  },
  {
    id: "tudinero",
    titulo: "Tu dinero o tu vida",
    autor: "Vicki Robin y Joe Domínguez",
    via: "finanzas",
    emoji: "⚖️",
    porQue: "El libro que redefine el dinero como energía vital: cada compra cuesta horas de tu vida. Cambia la pregunta de '¿me alcanza?' a '¿lo vale?'.",
    ideas: [
      "Calcula tu tarifa real por hora y pregunta cuántas horas de vida cuesta cada compra.",
      "Suficiente es un lugar hermoso: más allá empieza el exceso que pesa.",
      "La independencia financiera es libertad de tiempo, no lujos.",
    ],
  },
  {
    id: "cerdocapitalista",
    titulo: "Pequeño cerdo capitalista",
    autor: "Sofía Macías",
    via: "finanzas",
    emoji: "🐷",
    porQue: "Finanzas personales en español latinoamericano, con humor y sin tecnicismos gringos: quincenas, tandas y la realidad de acá.",
    ideas: [
      "Registrar gastos sin juicio es el primer superpoder (tu módulo Finanzas).",
      "El ahorro sin objetivo se evapora: ponle nombre y fecha.",
      "Invertir no es de ricos: es como los no ricos construyen patrimonio.",
    ],
  },
  {
    id: "simplepath",
    titulo: "The Simple Path to Wealth",
    autor: "JL Collins",
    via: "finanzas",
    emoji: "🛤",
    porQue: "Cartas de un padre a su hija sobre dinero: la estrategia de inversión más simple y aburrida que existe, y por eso funciona.",
    ideas: [
      "La libertad se compra con tasa de ahorro, no con sueldo.",
      "Fondos indexados de bajo costo le ganan a casi todos los expertos.",
      "El dinero que te posee (deudas) es esclavitud moderna: elimínala primero.",
    ],
  },
  {
    id: "diewithzero",
    titulo: "Die with Zero",
    autor: "Bill Perkins",
    via: "finanzas",
    emoji: "🎢",
    porQue: "El contrapeso necesario: acumular sin gastar también es perder. Las experiencias tienen su temporada y los recuerdos pagan dividendos.",
    ideas: [
      "Cada experiencia tiene su ventana: el viaje de mochila no espera a los 70.",
      "Invierte en recuerdos: pagan dividendos toda la vida.",
      "Da en vida (herencias, ayuda, regalos): cuando de verdad sirve.",
    ],
  },
  {
    id: "millonariodealledo",
    titulo: "El millonario de al lado",
    autor: "Thomas Stanley y William Danko",
    via: "finanzas",
    emoji: "🚪",
    porQue: "Investigación real sobre millonarios: la mayoría no maneja autos de lujo ni vive en mansiones. La riqueza real es silenciosa.",
    ideas: [
      "Los que aparentan riqueza suelen no tenerla, y al revés.",
      "Vivir bajo tus medios es el hábito millonario número uno.",
      "La defensa (gastar poco) importa tanto como el ataque (ganar).",
    ],
  },

  // ---------- Propósito ----------
  {
    id: "frankl",
    titulo: "El hombre en busca de sentido",
    autor: "Viktor Frankl",
    via: "proposito",
    emoji: "🕯",
    porQue: "Escrito por un psiquiatra sobreviviente de los campos de concentración: la libertad última es elegir tu actitud, y el sentido se encuentra hasta en el sufrimiento.",
    ideas: [
      "Quien tiene un porqué soporta casi cualquier cómo.",
      "Entre el estímulo y la respuesta hay un espacio, y ahí vive tu libertad.",
      "El sentido no se inventa, se descubre: en el amor, la obra y el coraje.",
    ],
  },
  {
    id: "ikigai",
    titulo: "Ikigai",
    autor: "Héctor García y Francesc Miralles",
    via: "proposito",
    emoji: "🌸",
    porQue: "La razón japonesa para levantarse cada mañana, aprendida de los ancianos de Okinawa: propósito, comunidad y fluir en lo pequeño.",
    ideas: [
      "Tu ikigai vive donde se cruzan lo que amas, lo que sabes, lo que el mundo necesita y lo que te pagan.",
      "Mantenerse en movimiento suave y ocupada en lo que importa alarga la vida.",
      "El fluir diario vale más que las metas épicas.",
    ],
  },
  {
    id: "startwithwhy",
    titulo: "Empieza con el porqué",
    autor: "Simon Sinek",
    via: "proposito",
    emoji: "⭕",
    porQue: "Las personas y marcas que inspiran parten del porqué, no del qué. Aplica a tu emprendimiento y a tu vida entera.",
    ideas: [
      "La gente no compra lo que haces, compra por qué lo haces.",
      "El porqué claro ordena todas las decisiones difíciles.",
      "El círculo dorado: porqué, cómo, qué, en ese orden.",
    ],
  },
  {
    id: "alquimista",
    titulo: "El alquimista",
    autor: "Paulo Coelho",
    via: "proposito",
    emoji: "🏜",
    porQue: "La fábula del pastor que persigue su leyenda personal. Simple hasta lo cursi, y sin embargo mueve algo cada vez que se relee.",
    ideas: [
      "Cuando quieres algo de verdad, el proceso mismo te transforma.",
      "El tesoro estaba en el viaje, no al final.",
      "El miedo a sufrir es peor que el sufrimiento.",
    ],
  },
  {
    id: "bigmagic",
    titulo: "Libera tu magia (Big Magic)",
    autor: "Elizabeth Gilbert",
    via: "proposito",
    emoji: "✨",
    porQue: "Creatividad sin drama: no necesitas permiso, ni sufrimiento, ni que sea perfecto. Ideal para destrabar proyectos que duermen por miedo.",
    ideas: [
      "El miedo puede venir en el auto, pero no maneja.",
      "Hecho es mejor que perfecto: la creatividad ama el movimiento.",
      "Tu curiosidad es la brújula cuando la pasión abruma.",
    ],
  },
  {
    id: "elemento",
    titulo: "El elemento",
    autor: "Ken Robinson",
    via: "proposito",
    emoji: "🎭",
    porQue: "Del educador más querido del mundo: el punto donde el talento natural se encuentra con la pasión personal, y por qué la escuela no te ayudó a encontrarlo.",
    ideas: [
      "Tu elemento existe: donde lo que haces bien se junta con lo que amas.",
      "La tribu correcta valida y multiplica tu talento.",
      "Nunca es tarde: el elemento se encuentra a cualquier edad.",
    ],
  },
  {
    id: "designlife",
    titulo: "Diseña tu vida",
    autor: "Bill Burnett y Dave Evans",
    via: "proposito",
    emoji: "📐",
    porQue: "Dos profesores de diseño de Stanford aplican design thinking a la vida: prototipa caminos en vez de buscar LA respuesta perfecta.",
    ideas: [
      "No hay una vida correcta: hay varias vidas posibles, prototipa varias.",
      "Los problemas de gravedad (lo que no puedes cambiar) no son problemas: reencuadra.",
      "Prueba en pequeño antes de saltar en grande: conversaciones y experimentos.",
    ],
  },
  {
    id: "artistway",
    titulo: "El camino del artista",
    autor: "Julia Cameron",
    via: "proposito",
    emoji: "🖋",
    porQue: "El curso clásico de 12 semanas para recuperar la creatividad: páginas matutinas y citas contigo misma. Tu diario de Mente ya apunta hacia acá.",
    ideas: [
      "Tres páginas a mano cada mañana drenan el ruido y destapan la voz propia.",
      "La cita de artista semanal: salir sola a llenar el pozo.",
      "El perfeccionismo es miedo con buenos modales.",
    ],
  },
  {
    id: "sietehabitos",
    titulo: "Los 7 hábitos de la gente altamente efectiva",
    autor: "Stephen Covey",
    via: "proposito",
    emoji: "🧱",
    porQue: "El clásico de carácter y propósito: empezar con el fin en mente, primero lo primero. Más profundo que un libro de productividad.",
    ideas: [
      "Empieza con el fin en mente: escribe cómo quieres ser recordada.",
      "Primero lo primero: lo importante no urgente es donde se construye la vida.",
      "Afila la sierra: renovarte no es perder el tiempo, es la base.",
    ],
  },

  // ---------- Espiritualidad ----------
  {
    id: "poderahora",
    titulo: "El poder del ahora",
    autor: "Eckhart Tolle",
    via: "espiritualidad",
    emoji: "🌅",
    porQue: "El libro de presencia más influyente de la era moderna: no eres tu mente, y el presente es el único lugar donde la vida ocurre.",
    ideas: [
      "El ruido mental no eres tú: eres quien lo observa.",
      "El pasado y el futuro solo existen como pensamiento presente.",
      "La incomodidad disminuye cuando dejas de pelear con el ahora.",
    ],
  },
  {
    id: "yogui",
    titulo: "Autobiografía de un yogui",
    autor: "Paramahansa Yogananda",
    via: "espiritualidad",
    emoji: "🪷",
    porQue: "El libro que llevó el yoga y la meditación de la India a Occidente. Si tu sadhana te llama, este es su árbol genealógico.",
    ideas: [
      "La práctica diaria (sadhana) es el vehículo, no la teoría.",
      "La respiración es el puente entre cuerpo y consciencia.",
      "Los maestros aparecen cuando la búsqueda es sincera.",
    ],
  },
  {
    id: "monjeferrari",
    titulo: "El monje que vendió su Ferrari",
    autor: "Robin Sharma",
    via: "espiritualidad",
    emoji: "🏎",
    porQue: "La fábula del abogado exitoso que colapsa y reconstruye su vida con sabiduría oriental. Puerta de entrada amable a la vida interior.",
    ideas: [
      "El éxito sin paz interior es una derrota elegante.",
      "Cuida tu mente como un jardín: lo que dejas entrar, crece.",
      "Los rituales diarios pequeños sostienen la transformación grande.",
    ],
  },
  {
    id: "almaliberada",
    titulo: "La liberación del alma",
    autor: "Michael Singer",
    via: "espiritualidad",
    emoji: "🕊",
    porQue: "¿Quién es la que escucha tu voz mental? Singer desarma la identificación con el ruido interno con una claridad que se siente física.",
    ideas: [
      "Hay una voz en tu cabeza que no para: tú eres quien la escucha.",
      "La energía bloqueada (samskaras) se libera sintiéndola pasar, no evitándola.",
      "Decide no cerrarte: el corazón abierto es una práctica, no un estado.",
    ],
  },
  {
    id: "siddhartha",
    titulo: "Siddhartha",
    autor: "Hermann Hesse",
    via: "espiritualidad",
    emoji: "🌊",
    porQue: "La novela corta del buscador que prueba todos los caminos (ascetismo, placer, riqueza) y encuentra la sabiduría escuchando un río.",
    ideas: [
      "La sabiduría no se enseña, se vive: cada camino propio es válido.",
      "El río está en todas partes al mismo tiempo: el tiempo es ilusión.",
      "Amar el mundo tal como es, esa es la llegada.",
    ],
  },
  {
    id: "derrumba",
    titulo: "Cuando todo se derrumba",
    autor: "Pema Chödrön",
    via: "espiritualidad",
    emoji: "🍂",
    porQue: "La monja budista para los momentos rotos: no hay suelo firme y esa es la buena noticia. Para leer en las crisis, no después.",
    ideas: [
      "Las cosas se arman y se desarman: esa es la vida, no un error.",
      "Acércate a lo que duele con curiosidad en vez de huir.",
      "La esperanza y el miedo son la misma moneda: suelta ambas y respira.",
    ],
  },
  {
    id: "pazcadapaso",
    titulo: "La paz está en cada paso",
    autor: "Thich Nhat Hanh",
    via: "espiritualidad",
    emoji: "🚶",
    porQue: "Mindfulness en la vida real: lavar platos, caminar, respirar en el semáforo. Tu caminata consciente de Mente viene de esta tradición.",
    ideas: [
      "La respiración consciente es un hogar portátil: siempre está contigo.",
      "Lava los platos para lavar los platos: cada acto puede ser meditación.",
      "La sonrisa leve cambia el estado: el cuerpo también guía a la mente.",
    ],
  },
  {
    id: "lobos",
    titulo: "Mujeres que corren con los lobos",
    autor: "Clarissa Pinkola Estés",
    via: "espiritualidad",
    emoji: "🐺",
    porQue: "Mitos y cuentos analizados por una psicoanalista para recuperar a la mujer salvaje e intuitiva que la domesticación fue callando.",
    ideas: [
      "La intuición es un músculo ancestral: se recupera usándola.",
      "Los ciclos de muerte y renacimiento son la naturaleza femenina profunda.",
      "Volver a lo salvaje es volver a casa, no perder el control.",
    ],
  },
  {
    id: "profeta",
    titulo: "El profeta",
    autor: "Khalil Gibran",
    via: "espiritualidad",
    emoji: "🌙",
    porQue: "Poesía sabia sobre el amor, el trabajo, los hijos y la muerte. Se lee en una hora y se relee toda la vida.",
    ideas: [
      "Vuestros hijos no son vuestros hijos: son la vida que se prolonga.",
      "El trabajo es amor hecho visible.",
      "La alegría y la tristeza beben del mismo pozo.",
    ],
  },
];

export function librosDe(via: ViaLibro): Libro[] {
  return LIBROS.filter((l) => l.via === via);
}

// ---------- Estado de lectura (en el navegador por ahora) ----------
export type EstadoLibro = "quiero" | "leido";

const LS_ESTADOS = "nucleoos-libros-estado";

export function estadosLibros(): Record<string, EstadoLibro> {
  try {
    const raw = localStorage.getItem(LS_ESTADOS);
    if (raw) return JSON.parse(raw) as Record<string, EstadoLibro>;
  } catch { /* nada */ }
  return {};
}

export function marcarLibro(id: string, estado: EstadoLibro | null): Record<string, EstadoLibro> {
  const todos = estadosLibros();
  if (estado === null) delete todos[id];
  else todos[id] = estado;
  localStorage.setItem(LS_ESTADOS, JSON.stringify(todos));
  return todos;
}
