import type { Manual } from "./tipos";

export const MANUAL_ES: Manual = {
  titulo: "Manual de NucleoOS",
  intro: "Todo lo que hace la app, explicado en orden y en palabras normales. No hace falta leerlo entero: busca la sección que te interesa y lee solo esa. Si recién llegaste, con las tres primeras tienes de sobra para partir.",
  indice: "Contenido",
  secciones: [
    {
      id: "que-es",
      titulo: "Qué es NucleoOS",
      parrafos: [
        "NucleoOS es una agenda viva. Todo lo que registras queda con su fecha: lo que comiste, lo que dormiste, lo que gastaste, lo que entrenaste, lo que practicaste, lo que avanzaste. Y después la sección Revisión junta todo eso y te lo devuelve convertido en algo que se entiende: tu día, tu semana, tu mes y los patrones entre un área y otra.",
        "La idea de fondo es simple: registrar una vez, en el lugar que corresponde, y que la app haga el trabajo de cruzar los datos. Si anotas un entrenamiento en Movimiento, tu hábito de ejercicio queda marcado, tus minutos de la semana suben y la meta que dependía de eso avanza, sin que tú anotes nada tres veces.",
        "No es una app que te rete. Si un día no registras nada, no pasa nada: no hay rachas que se castiguen ni pantallas que te pidan cuentas. Está pensada así a propósito, porque la hicimos pensando en gente a la que las apps de productividad le terminan dando culpa en vez de orden.",
      ],
    },
    {
      id: "empezar",
      titulo: "Primeros pasos",
      parrafos: [
        "Al crear tu cuenta la app te hace cuatro preguntas cortas y nada más. Puedes cambiar todas las respuestas después, en Ajustes.",
      ],
      pasos: [
        "Cómo te llamas, o cómo quieres que te llame la app.",
        "Qué quieres ordenar primero: todo, tus finanzas, tu cuerpo o tu cabeza. Esto decide qué secciones ves al principio, para que el menú no te grite con catorce cosas el primer día. Las demás se encienden cuando quieras, en Ajustes y luego Módulos.",
        "Dónde vives y en qué moneda manejas tu plata. Esto solo se pregunta si vas a usar Finanzas. El país importa más de lo que parece: define qué te puede ofrecer la app, porque la conexión automática con el banco funciona en algunos países y en otros todavía no.",
        "Por dónde empezar: la app te propone dos o tres cosas concretas según lo que elegiste, no una lista de treinta.",
      ],
    },
    {
      id: "moverse",
      titulo: "Cómo moverse por la app",
      parrafos: [
        "El menú de la izquierda está agrupado por para qué sirve cada cosa, no por orden alfabético: Panorama para ver el conjunto, Núcleo para lo que te sostiene el cuerpo y la cabeza, Mi vida para lo que administras, Inspiración para lo que te mueve. Si hay secciones que no te sirven, se apagan en Ajustes y el menú se achica de verdad.",
        "Arriba a la derecha hay cuatro botones que conviene conocer el primer día:",
      ],
      puntos: [
        "La campana, con tus avisos: pagos que vencen, personas con las que hace mucho no hablas, cosas con fecha.",
        "La paleta, para elegir el tema de colores con el que quieres vivir aquí.",
        "El signo de pregunta, que abre el recorrido guiado. Tiene dos opciones: conocer la app entera en siete pasos, o que te explique la pantalla donde estás.",
        "Los ajustes, donde se decide qué app tienes.",
      ],
    },
    {
      id: "ayuda-dentro",
      titulo: "La ayuda que viene dentro de la app",
      parrafos: [
        "No hace falta volver a este manual para cada duda. La app se explica sola en tres niveles, y conviene saber que existen:",
      ],
      puntos: [
        "El signo de pregunta al lado del título de cada sección. Lo aprietas y en dos frases te dice para qué es esa sección, qué pregunta de tu vida responde. Desde ahí también puedes pedir el recorrido de esa pantalla, que son tres o cuatro ventanitas señalando lo importante.",
        "El recorrido general, en el signo de pregunta de la barra de arriba. Siete pasos cortos que te muestran la app entera. Se puede saltar en cualquier momento, y si lo saltas no vuelve a aparecer solo.",
        "El recorrido de la importación de cartola, que es el único que te acompaña mientras haces algo. Aparece la primera vez que abres la ventana de importar, y también se pide a mano con el enlace que dice primera vez.",
      ],
    },
    {
      id: "inicio",
      titulo: "Inicio",
      parrafos: [
        "Es la pantalla donde empieza el día. Muestra tus tareas de hoy, el pulso del día, que son los números que vienen de Energía, Hábitos y Movimiento, y la brújula, que es cuánto van avanzando tus metas de Dirección.",
        "Nada de lo que ves aquí se llena a mano: todo se arma solo con lo que registras en el resto de la app. Las tarjetas se arrastran, así que pon arriba lo que de verdad miras y deja abajo el resto. El orden se guarda y te sigue entre dispositivos.",
        "También está la captura rápida, el botón para anotar algo sin perder lo que estabas haciendo. Escribes la idea, se guarda, y sigues en lo tuyo. Después decides si era una tarea, un gasto o nada.",
      ],
    },
    {
      id: "calendario",
      titulo: "Calendario",
      parrafos: [
        "Todo lo que tiene fecha en tu vida, en una sola pantalla: tus tareas, tus pagos, tus citas, los cumpleaños de tus vínculos, tus jornadas de trabajo y los avances de tus metas.",
        "Te mueves entre meses con las flechas del título y el botón Hoy te devuelve donde estabas. Arriba dice cuántas cosas tiene el mes que estás mirando.",
        "Casi nada se llena aquí: llega solo desde los otros módulos. Si el mes se ve vacío es porque todavía no has registrado nada, no porque falte algo por configurar.",
      ],
    },
    {
      id: "revision",
      titulo: "Revisión",
      parrafos: [
        "Es la sección que convierte lo registrado en claridad, y probablemente la razón por la que vale la pena registrar. Tiene cinco pestañas:",
      ],
      puntos: [
        "Día: la agenda de lo que pasó, no de lo que planeabas. A qué hora comiste, cuándo te moviste, qué anotaste. Sirve para reconstruir un día raro y entender qué lo hizo raro.",
        "Semana y Mes: lo mismo con más zoom, para ver tendencias en vez de días sueltos.",
        "Patrones: cruza módulos. Cómo cambia tu energía según lo que duermes, qué pasa con tu ánimo las semanas que te mueves, ese tipo de cosas.",
        "Informe: eliges un periodo y qué áreas entran, y sale un documento con gráficos y observaciones que puedes imprimir, guardar como PDF o exportar como planilla.",
      ],
    },
    {
      id: "finanzas",
      titulo: "Finanzas",
      parrafos: [
        "Es el módulo más grande, así que va explicado por partes. Para qué es: para saber en qué se te va la plata y dejar de adivinar.",
        "Las pestañas están agrupadas por para qué sirven. Primero el día a día, después lo que tienes y lo que debes, después lo que se repite, y al final, separado, lo de configurar.",
      ],
      puntos: [
        "Resumen: el mes de un vistazo, con tus ingresos, tus gastos, tu balance en cuentas y tu patrimonio neto.",
        "Transacciones: tu libro de movimientos. Todo lo que entró y salió, con su fecha, su categoría y su cuenta.",
        "Cuentas: tus cuentas bancarias y de efectivo, con su saldo.",
        "Deudas y tarjetas: lo que debes, a quién, y qué te toca pagar.",
        "Suscripciones y cuotas: los cargos que se te cobran solos mes a mes.",
        "Metas: tus metas de ahorro.",
        "Reporte: el informe que explica a dónde se fue la plata.",
        "Categorías y etiquetas: cómo quieres clasificar lo tuyo.",
        "Auto: si tienes un vehículo de trabajo, sus gastos y kilómetros aparte.",
      ],
    },
    {
      id: "registrar-gasto",
      titulo: "Registrar un gasto o un ingreso",
      parrafos: [
        "El botón Registrar abre la ventana para anotar un movimiento a mano. Lo escribes una vez y queda con su fecha, su categoría y su cuenta.",
        "Si tienes la boleta en la mano, puedes tomarle una foto y dejar que la app llene los datos sola. Revisa lo que puso antes de guardar: la lectura automática acierta casi siempre, pero casi siempre no es siempre.",
        "Las boletas y comprobantes quedan guardados junto al movimiento, así que un año después puedes volver a mirar el papel sin buscarlo en una caja.",
      ],
    },
    {
      id: "cartola",
      titulo: "Importar la cartola del banco",
      parrafos: [
        "Esta es la parte que más tiempo ahorra y la que más confunde al principio, así que va completa.",
        "Una cartola es el archivo con todos los movimientos de un mes que te da tu banco. En algunos países se llama estado de cuenta, en inglés statement. No es la foto de la pantalla del banco ni un correo: es un archivo que se descarga.",
      ],
      pasos: [
        "Entra a tu banco por internet y busca cartola, estado de cuenta, movimientos o statement. Elige el mes que quieres y descarga el archivo.",
        "Si tu banco te deja elegir el formato, prefiere CSV u OFX, porque esos se leen exactos. También sirven QFX, Excel y PDF. El PDF lo lee la inteligencia artificial y después tú revisas, porque un PDF no trae los datos ordenados, trae una imagen del papel.",
        "En la app, entra a Finanzas y aprieta Importar cartola.",
        "Dile de qué cuenta o tarjeta es y de qué mes. Con eso los movimientos quedan archivados donde corresponde y la app puede avisarte si subes dos veces el mismo mes.",
        "Elige el archivo. Puedes subir varios de una vez, hasta seis, por ejemplo la cuenta y la tarjeta del mismo mes.",
        "Revisa la lista que aparece. Cada línea es un movimiento con su fecha, su descripción y su monto. Nada está guardado todavía: es una vista previa.",
        "Mira los repetidos. La app compara con lo que ya tienes y deja desmarcado lo que ya estaba, para que no se cuente dos veces. Pasa harto cuando anotaste algo a mano y después subes la cartola del mismo mes.",
        "Aprieta el botón del final, que dice cuántos movimientos van a entrar. Recién ahí se guarda.",
      ],
      puntos: [
        "Si algo quedó mal leído, se corrige después en Transacciones. No hay que volver a importar.",
        "La conexión automática con el banco, que se salta todo este proceso, funciona por ahora con bancos de Canadá y Estados Unidos. En el resto de los países se importa la cartola, que hace lo mismo con un paso más.",
      ],
    },
    {
      id: "clasificar",
      titulo: "Categorías y etiquetas",
      parrafos: [
        "La categoría contesta qué tipo de gasto es: supermercado, arriendo, transporte. Cada movimiento lleva una.",
        "La etiqueta contesta otra cosa: para qué era. Puedes etiquetar un gasto como negocio, como personal, como un viaje concreto, como un proyecto. Un mismo movimiento puede llevar varias, y eso es lo que permite responder preguntas que la categoría sola no responde, por ejemplo cuánto te costó de verdad ese viaje entre bencina, comida y alojamiento.",
        "Si trabajas por tu cuenta, etiquetar lo de negocio desde el principio significa que a fin de año el resumen de impuestos ya está hecho, en vez de pasar un fin de semana reconstruyéndolo.",
      ],
    },
    {
      id: "deudas",
      titulo: "Cuentas, deudas y tarjetas",
      parrafos: [
        "Las cuentas son dónde vive tu plata, incluida la de efectivo. Cada una lleva su moneda: si tienes cuentas en dos países, NucleoOS nunca las mezcla ni las suma como si fueran lo mismo.",
        "Las deudas son lo que debes, con su institución, su monto y lo que te toca pagar. El pago de una tarjeta no es un gasto nuevo: es mover plata de una cuenta a la tarjeta, y la app lo trata así para que tus gastos del mes no se dupliquen.",
        "El patrimonio neto que ves en Resumen es simplemente lo que tienes menos lo que debes. Es el número más honesto de la pantalla y a veces el más incómodo.",
      ],
    },
    {
      id: "recurrentes",
      titulo: "Suscripciones y cuotas",
      parrafos: [
        "La app mira tus movimientos y propone cuáles parecen cargos que se repiten solos cada mes: streaming, gimnasio, seguros, cuotas.",
        "Son propuestas, no conclusiones, y tú confirmas o descartas cada una. Esto importa: un detector automático que nadie revisa termina diciendo que el supermercado es una suscripción, y con eso los números del informe dejan de servir. Lo que tú confirmas es lo que usa el reporte.",
        "Vale la pena hacerlo una vez con calma, porque es donde suele aparecer la plata que se va sin que nadie la mire.",
      ],
    },
    {
      id: "reporte",
      titulo: "El reporte de Finanzas",
      parrafos: [
        "La pestaña Reporte es el coach financiero. Eliges un periodo y te muestra, con gráficos, a dónde se fue la plata:",
      ],
      puntos: [
        "En qué categorías se fue, ordenadas por tamaño, con cuánto cambió cada una respecto al periodo anterior.",
        "Cuánto de tu gasto son cargos que se cobran solos, de los que tú confirmaste en Suscripciones y cuotas.",
        "Dónde hay plata que se puede recuperar, con un rango realista en vez de una promesa.",
        "Cómo vienes mes a mes, para ver si la tendencia va para algún lado.",
      ],
    },
    {
      id: "energia",
      titulo: "Energía",
      parrafos: [
        "Para entender por qué hay días en que andas bien y otros en que no. Aquí van el agua, la comida, el sueño, el ciclo, la recuperación y tus datos de salud clínica.",
        "Registrar toma segundos: los vasos de agua y tu nivel de energía se marcan con un toque. Las comidas se pueden fotografiar y la app estima calorías y proteína. Es una guía, no una balanza: sirve para ver la tendencia, no para pesar cada cosa.",
        "El ayuno solo aparece si tú dices que ayunas. La app pregunta una vez y respeta la respuesta, porque marcarle ayuno a alguien que simplemente no ha comido todavía no ayuda a nadie.",
        "Con dos semanas de registro, Revisión ya puede decirte cómo se relaciona tu energía con lo que duermes y con cuánto te mueves.",
      ],
    },
    {
      id: "mente",
      titulo: "Mente",
      parrafos: [
        "Para bajar revoluciones y sacar de la cabeza lo que anda dando vueltas.",
        "Prácticas y Sadhana son respiraciones y meditaciones que corren con su propio tiempo y su campana. Eliges una, la haces, y queda registrada con sus minutos.",
        "El diario es para escribir. Si no sabes por dónde empezar, la app te propone una pregunta. Lo que escribes es tuyo: no sale de la app nunca, salvo que tú marques la casilla al exportar un informe, y esa casilla viene apagada.",
        "Historial guarda cada práctica con sus minutos, e Insights busca qué se repite en lo que escribes. Ninguna de las dos te pide nada: se llenan solas.",
      ],
    },
    {
      id: "movimiento",
      titulo: "Movimiento",
      parrafos: [
        "Tres formas de mover el cuerpo, según el día: Práctica suave para soltar cuando andas apretada, Entrenamiento para lo que de verdad cansa, y Programas para seguir un plan de varias semanas sin tener que inventarlo cada día.",
        "Puedes seguir una rutina paso a paso o simplemente anotar qué hiciste y cuántos minutos. Las dos cosas cuentan igual.",
        "Todo lo que registras aquí cae en otros lados: aparece en Energía, marca tu hábito de ejercicio y alimenta las metas de Dirección que dependen del movimiento.",
      ],
    },
    {
      id: "habitos",
      titulo: "Hábitos",
      parrafos: [
        "Hay tres cosas distintas y conviene no confundirlas. Un hábito es algo que quieres sostener siempre. Un reto tiene principio y fin, como treinta días sin azúcar. Una rutina es una secuencia de pasos que haces de corrido.",
        "Se marca con un toque y el cuadrito se pinta con el color del hábito. La cuadrícula parte el día que lo creaste, no antes, así que las rachas no mienten.",
        "Algunos se marcan solos. Si registras un entrenamiento en Movimiento, tu hábito de ejercicio queda marcado sin que hagas nada más.",
      ],
    },
    {
      id: "relaciones",
      titulo: "Relaciones",
      parrafos: [
        "Para no perder de vista a la gente que te importa cuando la vida se pone densa.",
        "Anotas a cada persona y cada cuántos días te gustaría hablarle. Siete para tu mamá, noventa para un amigo de la universidad. La app no opina del número, solo te avisa cuando se pasa.",
        "También registras los momentos: una llamada, un café, algo que te contó. Sirve para acordarte de lo importante la próxima vez que se vean, que es de lo que se trata. Los cumpleaños que anotes aparecen solos en el Calendario.",
      ],
    },
    {
      id: "direccion",
      titulo: "Dirección",
      parrafos: [
        "Para convertir lo que quieres en algo que de verdad avanza. Metas activas es lo que persigues ahora, Próximos pasos es lo que toca esta semana, Avances es lo que ya moviste, y Logradas es la pestaña que se mira los días en que sientes que no avanzas en nada.",
        "Cada meta se parte en hitos, y el porcentaje sale de ellos. Es la diferencia entre aprender inglés y algo que de verdad se puede empezar el martes.",
        "Una meta puede alimentarse sola de lo que ya registras: sesiones de movimiento, días de un hábito, horas de un proyecto, aportes a un ahorro. Avanza mientras vives, sin que tengas que entrar a actualizarla.",
      ],
    },
    {
      id: "trabajo",
      titulo: "Trabajo",
      parrafos: [
        "Para saber en qué se te fue el tiempo, y no solo en qué creías que se te iba.",
        "Cada proyecto lleva sus tareas y el avance se calcula solo con lo que vas marcando. Registras tu jornada y los bloques de foco quedan ligados al proyecto, así que al final del mes el número existe en vez de ser una impresión.",
        "Al cerrar la jornada puedes anotar cómo estuvo. Con unas semanas de eso se ve qué días te dejan bien y cuáles te vacían, que no siempre son los que uno cree.",
      ],
    },
    {
      id: "aprendizaje",
      titulo: "Aprendizaje",
      parrafos: [
        "Para que lo que aprendes no se pierda en cuadernos sueltos, y para no partir de cero preguntándote qué leer.",
        "Las notas viven en cuadernos por tema, para que un apunte de un curso no quede mezclado con una receta. El buscador mira dentro de todas tus notas a la vez, así que da lo mismo en qué cuaderno la dejaste. Esa es la diferencia entre guardar algo y poder encontrarlo un año después.",
        "La biblioteca es otra cosa, y es curada: libros elegidos por lo que de verdad le sirven a un cerebro con TDAH y TDA, no por moda. Cada uno trae por qué está ahí, sus ideas principales y ejercicios concretos, así que te llevas lo suyo aunque nunca lo compres. Marcas lo que quieres leer y lo que ya leíste, sin meta de libros al año ni nada que te rete.",
      ],
    },
    {
      id: "vision",
      titulo: "Visión",
      parrafos: [
        "Para acordarte de por qué haces todo lo demás. Sueños es la lista de lo que quieres vivir, Visual board es para verlo en imágenes, y Vida ideal es el texto donde te describes el día que quieres tener.",
        "Aquí nada tiene fecha ni te persigue, a propósito. El día que un sueño deje de ser sueño, lo pasas a Dirección y recién ahí se vuelve una meta con pasos.",
      ],
    },
    {
      id: "informes",
      titulo: "Llevarle tus datos a otra persona",
      parrafos: [
        "Hay dos informes y los dos están pensados para que los lea alguien que no usa la app.",
        "El de Finanzas, en la pestaña Reporte, es el que le llevarías a un contador o a un asesor: gráficos, categorías, cargos recurrentes y dónde hay plata que recuperar. El de Revisión, en la pestaña Informe, es el que le llevarías a un psicólogo, a un médico o a un nutricionista: energía, movimiento, hábitos, mente y dirección en el periodo que elijas.",
        "Los dos salen en tres formatos. El informe se abre para imprimir, y desde ahí el navegador lo guarda como PDF. La planilla sale en CSV, para quien quiera hacer sus propios cálculos. Y el paquete trae todo junto en un ZIP.",
      ],
      puntos: [
        "Cada promedio dice sobre cuántos días se calculó, y los días sin registro nunca cuentan como cero. Un informe que dijera que dormiste cero horas las noches que no anotaste nada sería peor que no tener informe.",
        "Los cruces entre áreas publican cuántos días los respaldan, y se marcan como flojos cuando son pocos. Así quien lo lee sabe qué peso darle.",
        "El texto de tu diario no sale nunca, salvo que marques una casilla que viene apagada.",
      ],
    },
    {
      id: "privacidad",
      titulo: "Tus datos y tu privacidad",
      parrafos: [
        "Tus datos son tuyos y la app está hecha para que puedas sacarlos cuando quieras, en formatos que abre cualquiera. Eso es a propósito: una app donde tus datos quedan atrapados no es un lugar seguro para guardar tu vida.",
        "Hay un modo privado en Finanzas, el botón del ojo, que tapa todos los montos en pantalla. Sirve para mostrarle la app a alguien, o para usarla en un lugar con gente alrededor, sin mostrar tu plata. Lo que exportas lleva las cifras reales: el modo privado es para la pantalla, no para los informes.",
        "Los términos y la política de privacidad se leen completos en nucleoos.app/terminos y nucleoos.app/privacidad.",
      ],
    },
    {
      id: "ajustes",
      titulo: "Ajustes",
      parrafos: [
        "Aquí se decide qué app tienes. Tu país y tu moneda, qué secciones ves, el tema de colores, el idioma, y las funciones que solo le sirven a algunas personas, como el ayuno o el vehículo de trabajo.",
        "El país es el que más cambia las cosas: define qué te puede ofrecer la app, para no ofrecerte algo que no va a funcionar donde vives.",
        "También desde aquí puedes volver a ver el recorrido guiado completo, cuantas veces quieras.",
      ],
    },
    {
      id: "idiomas",
      titulo: "Idiomas",
      parrafos: [
        "La app está en español, inglés y portugués, y se cambia en Ajustes. Todo el recorrido guiado, los informes y los avisos están en los tres.",
        "Este manual está además en francés, para quien quiera leerlo así, aunque la aplicación todavía no esté traducida a ese idioma.",
      ],
    },
    {
      id: "problemas",
      titulo: "Si algo no te funciona",
      parrafos: [
        "Las cosas que más se preguntan, con lo que suele ser la respuesta:",
      ],
      puntos: [
        "No me aparece el recorrido guiado. Si lo saltaste una vez, la app respeta eso y no vuelve a salir solo. Se pide a mano en el signo de pregunta de la barra de arriba, o en Ajustes.",
        "La app me ofrece conectar el banco y yo no vivo en Canadá ni Estados Unidos. Revisa tu país en Ajustes: con el país puesto, la app deja de ofrecerlo y te muestra la importación de cartola, que hace lo mismo.",
        "Subí la cartola y aparecen movimientos repetidos. La app los marca y los deja desmarcados sola. Si ya habías importado el mes, revisa antes de confirmar: los repetidos salen con un aviso.",
        "El PDF de mi banco quedó mal leído. Un PDF no trae datos, trae la imagen del papel, así que la lectura es una estimación. Si tu banco ofrece CSV u OFX, usa esos. Lo que quedó mal se corrige en Transacciones sin volver a importar.",
        "Me dice que un gasto normal es una suscripción. Entra a Suscripciones y cuotas y descártalo. El reporte usa lo que tú confirmaste, no lo que la app supuso.",
        "Mi informe dice que tengo pocos datos. Es literal y es a propósito: con pocos días registrados un promedio no significa nada, y preferimos decirlo antes que inventar un número que se vea bien.",
      ],
    },
    {
      id: "ayuda",
      titulo: "Si necesitas ayuda",
      parrafos: [
        "Si algo no está aquí, o algo no funciona como dice este manual, escríbenos a hola@nucleoos.app. Decir qué pantalla era y qué esperabas que pasara ayuda muchísimo.",
      ],
    },
  ],
};
