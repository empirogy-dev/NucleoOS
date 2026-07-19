# NucleoOS, lista viva de mejoras y bugs

Fuente: reporte de la usuaria del 9 de julio de 2026 mas hallazgos de QA. Etiquetas: `[Bug]` no funciona como debería, `[Nuevo]` funcionalidad a agregar. Los bloques (A, B, C...) indican el orden de trabajo propuesto.

## Eje central: integración entre módulos
Las metas y avances se asignan a un área pero no se reflejan en ella, y el calendario debe centralizar todo. Este hilo atraviesa la mayoría de los ítems.

## Bloque A, bugs reportados (completado el 9 jul 2026)
- [x] `[Bug]` Objetivos: un avance asignado a un área no aparece en esa área. Resuelto: sección "Avances en esta área" en las 5 áreas (66b899f).
- [x] `[Bug]` Hábitos, sueño: solo se veía el dato de hoy. Resuelto: bitácora de los últimos 7 días con horas dormidas (3815ffb).
- [x] `[Bug]` Finanzas: transacciones importadas sin edición. Resuelto: lápiz en cada movimiento para renombrar, categorizar, cambiar cuenta, monto, tipo y fecha, con saldos corregidos (ce49e46).
- [x] `[Nuevo]` Finanzas: tipo Transferencia (pedido de la usuaria): no cuenta como gasto ni ingreso, mueve saldo entre cuentas, o solo descuenta del origen si el destino está fuera de la app, como el pago de la tarjeta.
- [ ] `[Nuevo]` Seguimiento: vincular la transferencia "fuera de la app" directamente a una tarjeta de crédito registrada, para que baje su saldo usado.

## Auditoría completa de Fluxney (9 jul 2026): lo que faltaba portar a Finanzas
Resultado del barrido archivo por archivo de Fluxney/src pedido por la usuaria.

- [x] `[Bug]` Transacciones: filtros por cuenta o tarjeta, tipo, categoría y búsqueda, con contador (bbe8eb7).
- [x] `[Nuevo]` Deudas: plan para salir de deudas con avalancha y bola de nieve, simulación de meses e intereses, y las tarjetas con saldo entran con su APR (8f07107).
- [x] `[Nuevo]` Transferencias hacia metas de ahorro (con la 0011).
- [x] `[Nuevo]` Resumen financiero: patrimonio neto, deuda total y balance en el Resumen de Finanzas.
- [x] `[Nuevo]` Proyección de saldo a 3 meses con arrastre, en la pestaña Reporte.
- [x] `[Nuevo]` Presupuestos avanzados: modo por categoría, fondo de arrastre con acumulación de 12 meses, excluir del presupuesto y umbrales de alerta por modo (migración 0012).
- [x] `[Nuevo]` Editar categorías (nombre, ícono, tipo, modo, arrastre, excluir) y editar metas de ahorro (incluido lo ahorrado).
- [x] `[Nuevo]` Deudas: campo de notas en el formulario y la tarjeta. Pendiente: días de anticipación del recordatorio.
- [ ] `[Nuevo]` Multi moneda con conversión automática (CurrencyContext tenía tasas y ajuste autoConversion).
- [ ] `[Nuevo]` Formato de fecha configurable en Ajustes.
- Ya cubiertos por el plan: escaneo de recibos (Fase 2 con IA), conexión de banco y tarjetas (Fase 5), calendario financiero (Bloque C).

## Comercios (pedido del 9 jul 2026)
- [x] `[Nuevo]` Movimientos con nombre de comercio (a quién le pagaste) separado de la descripción (qué fue) y la categoría (migración 0013).
- [x] `[Nuevo]` Reglas automáticas: al renombrar una boleta del banco, las siguientes llegan con ese nombre y categoría, y se aplican a las existentes.
- [ ] `[Nuevo]` Administrar las reglas guardadas (verlas, editarlas, borrarlas), quizás en Ajustes.

## Bloque B, Inicio orientado al avance (completado el 9 jul 2026)
- [x] `[Nuevo]` Avance por área con barras de color desde las metas de Objetivos, y anillo global hacia tu mejor versión.
- [x] `[Nuevo]` Avances recientes en vez de transacciones; las stats financieras viven en Finanzas.

## Bloque C, Calendario v1 (completado el 9 jul 2026)
- [x] `[Nuevo]` Vista mensual que centraliza pagos con recurrencia, citas, exámenes pendientes, cumpleaños anuales, jornadas de trabajo y avances de todas las áreas (incluido el estudio).
- [x] `[Nuevo]` Trabajo: cada jornada registrada aparece en su día del calendario con sus horas.
- [x] `[Nuevo]` Aprendizaje: lo estudiado se registra en "Avances en esta área" y cae al calendario.
- [ ] `[Nuevo]` Conectar con Google Calendar (Fase 4, integraciones).
- [ ] `[Nuevo]` Crear eventos propios desde el calendario (hoy solo agrega lo de las áreas).

## Pedidos del 9 jul 2026 (tarde)
- [x] `[Nuevo]` Hábitos: tracker día a día con cuadrícula por hábito, desafío de 7 a 90 días (por defecto 28) y marcado retroactivo (migración 0014).
- [x] `[Nuevo]` Panel de íconos en hábitos, categorías, metas y cuadernos.
- [x] `[Nuevo]` Finanzas: transacciones agrupadas por mes con encabezados colapsables y totales.

## Bloque D, Relaciones accionables
- [ ] `[Nuevo]` Tips segmentados por tipo de relación (pareja, mamá, amistad...), no genéricos.
- [ ] `[Nuevo]` Al abrir una persona, acciones concretas según el vínculo (invitar a salir, llevar a tomar café, regalo sorpresa).

## Bloque E, Salud plus (completado el 9 jul 2026)
- [x] `[Nuevo]` Ficha ampliada: peso, estatura, alimentación con opciones y color de ojos (migración 0015).
- [x] `[Nuevo]` Exámenes: adjuntar el PDF del laboratorio o una foto, abrirlos y eliminarlos (bucket privado salud).
- [ ] `[Nuevo]` Tarjetas reordenables con arrastrar y soltar (pendiente, baja prioridad).

## Coach y proyección (pedidos del 9 jul 2026, tarde)
- [x] `[Nuevo]` Coach v1 en el Inicio: con Gemini, lee tu estado real (visión, metas, hábitos, avances, proyectos, citas, sobriedad, vínculos) y entrega qué va bien, qué necesita atención y dos acciones para hoy.
- [x] `[Nuevo]` Visual board en Objetivos: imágenes de lo que proyectas, en bucket privado (migración 0016).
- [x] `[Nuevo]` Hábitos: pestaña Bienestar con 5 prácticas guiadas con temporizador y calendario lunar. Además deportes ampliados y hábitos de paz sugeridos con un clic.

## Bloque F, Notificaciones (completado el 9 jul 2026)
- [x] `[Nuevo]` Centro de notificaciones en la campana: pagos, citas, cumpleaños, vínculos y hábitos pendientes, con urgencia destacada.
- [x] `[Nuevo]` Avisos del navegador una vez al día con lo urgente (se activan en Ajustes).
- [ ] `[Nuevo]` Notificaciones push en el celular (llegan con la app móvil, Fase 3).

## Rediseño de navegación y nuevos módulos (10 jul 2026)
- [x] `[Nuevo]` Menú por secciones: Panorama (Inicio, Calendario), Núcleo (Energía, Mente, Hábitos), Mi vida (Relaciones, Dirección, Trabajo, Finanzas, Aprendizaje) e Inspiración (Visión). Ajustes pasó al topbar junto a la campana.
- [x] `[Nuevo]` Renombres: Salud → Energía, Objetivos → Dirección, Trabajo y Proyectos → Trabajo, Hábitos y Rutinas → Hábitos.
- [x] `[Nuevo]` Módulo Mente: respiración guiada con círculo animado y señal sonora por fase, meditaciones de 5 a 30 minutos con guía paso a paso, campana de inicio y cierre, sonido ambiental opcional, pausar y reanudar, sesiones completadas con historial, y el calendario lunar.
- [x] `[Nuevo]` Visión como collage libre: mover, redimensionar, rotar, superponer, notas de texto con colores y guardado automático del layout (migración 0017).
- [ ] `[Nuevo]` Mente: guardar el historial de sesiones en Supabase (hoy vive en el navegador con localStorage).

## Energía diaria y Visión/Dirección (10 jul 2026, tarde)
- [x] `[Nuevo]` Energía rediseñada como combustible diario: pestañas Hoy, Nutrición, Movimiento, Sueño, Recuperación y Salud clínica. Lectura rápida arriba (sueño, agua, proteína, movimiento), vasos de agua tocables, proteína con meta según peso, energía percibida con emojis (migración 0018). El sueño y el ejercicio se mudaron desde Hábitos; la sobriedad vive en Recuperación; lo médico intacto en Salud clínica.
- [x] `[Nuevo]` Visión con pestañas Sueños (bucket list con categoría, por qué, prioridad emocional y estados), Visual board (el collage) y Vida ideal (6 bloques guiados con autoguardado), migración 0019.
- [x] `[Nuevo]` Dirección con pestañas Metas activas, Próximos pasos (milestones pendientes accionables), Avances y Logradas. Puente sueño → meta con origen visible (objectives.dream_id).
- [ ] `[Nuevo]` Energía: gráfico de tendencia del nivel de energía percibida contra sueño y movimiento.
- [ ] `[Nuevo]` Sueños con imagen propia (hoy usan el emoji de su categoría).

## Plataforma holística (10 jul 2026, noche)
- [x] `[Nuevo]` Nutrición con IA: foto del plato → estimación de calorías, proteína, carbohidratos, grasas, fibra, saciedad e impacto en la energía (Gemini), guardado por día con acumulados (migración 0020). La proteína de los platos suma sola al contador de Hoy.
- [x] `[Nuevo]` Capa educativa de nutrición: 6 mini guías expandibles, claras y sin moralismos.
- [x] `[Nuevo]` Mente: sección Sadhana con 3 secuencias guiadas (amanecer, regular, noche) que avanzan solas con campana entre pasos, círculo de respiración y registro. Nuevas prácticas: suspiro fisiológico, exhalación larga, grounding 5 4 3 2 1, tensión emocional.
- [x] `[Nuevo]` Módulo Movimiento en el Núcleo: práctica suave (yoga, movilidad, estiramientos) y entrenamiento (fuerza, cardio, core) con filtros por duración, reproductor de rutina que registra en Energía, retos de 7 y 21 días con progreso (migración 0021) y Mi material (bucket privado para PDFs, clases, videos y audios propios).
- [ ] `[Nuevo]` Movimiento: reproducir videos propios dentro de la app (hoy se abren en otra pestaña) y clases con audio guiado.
- [ ] `[Nuevo]` Sadhana: audio narrado de las guías (hoy es texto más campana y tonos).
- [ ] `[Nuevo]` Nutrición: editar los macros estimados antes de guardar el plato.

## Retos flexibles y sadhana de referencia (10 jul 2026, noche)
- [x] `[Nuevo]` Retos como compromisos vivos en Hábitos → Retos (migración 0022): sugeridos personalizables o propios, editables después, frecuencia por días de la semana, marcar día a día, racha, avance, pausar, retomar y terminar. Los Retos de Movimiento pasaron a llamarse Programas.
- [x] `[Nuevo]` Mente → Sadhana: "Mi sadhana" destacada (20 min, inspirada en la tradición Swatantra del video de referencia): introducción y preparación antes de comenzar, 6 pasos (llegar, respiración de limpieza, sonido, presencia, silencio, cierre) con círculo, campanas y registro.
- [ ] `[Nuevo]` Ajustar los pasos de Mi sadhana con las palabras exactas de la usuaria (el video de YouTube no es legible desde la app, se construyó con la estructura pública de la tradición).
- [ ] `[Nuevo]` Retos: marcar el día automáticamente al completar una sesión de Mente o una rutina de Movimiento vinculada.

## Mente expandida, Revisión y camino a Notion (10 jul 2026, noche)
- [x] `[Nuevo]` Mente reorganizada: pestañas Prácticas (con vías Regulación, Mindfulness, Corazón y Mentalidad), Sadhana, Diario, Historial e Insights. Seis prácticas nuevas: caminata consciente, pausa consciente, amor propio, afirmaciones, reencuadre cognitivo y tres cosas buenas.
- [x] `[Nuevo]` Diario con preguntas guía (gratitud, reencuadre, escritura libre), migración 0023.
- [x] `[Nuevo]` Insights de Mente: minutos por semana, racha, práctica favorita y hacia qué vía se inclina tu práctica.
- [x] `[Nuevo]` Copy de Sadhana universal y premium, sin referencias personales.
- [x] `[Nuevo]` Módulo Revisión en Panorama: resúmenes por semana y mes de todos los módulos con navegación de períodos, lectura narrada con IA, Copiar para Notion en Markdown, y Patrones (sueño vs energía, movimiento vs claridad, regulación vs estado) sobre los últimos 30 días.
- [ ] `[Nuevo]` Notion API directa (Fase 4, requiere Edge Function porque la API de Notion no permite llamadas desde el navegador): exportar reportes automáticos, páginas de journaling y notas de aprendizaje.
- [ ] `[Nuevo]` Patrones: sumar finanzas vs estado emocional cuando haya más días de energía percibida registrados.

## Detalles de la usuaria (10 jul 2026, noche)
- [x] `[Bug]` Sugeridos para tu paz no agregaban el hábito: la causa es que la migración 0014 no está corrida en Supabase (el error era silencioso). Ahora el chip abre el modal prellenado, se elige la duración, y cualquier error se muestra.
- [x] `[Bug]` Formularios sin estilo: inputs, textareas y labels ahora usan el sistema de diseño (antes solo los select).
- [x] `[Nuevo]` Tarjetas reordenables con el mouse en Energía → Hoy: arrastra desde el agarre ⋮ y el orden queda guardado.
- [x] `[Nuevo]` Metas con progreso automático (migración 0024): una meta como Estar en forma se alimenta sola de sesiones o minutos de movimiento, o de sesiones de Mente, contando desde su creación.
- [x] `[Nuevo]` Regulación: abrazo de mariposa y zumbido del nervio vago.
- [x] `[Nuevo]` Movimiento sin la pestaña Mi material (se retirará o se moverá a Aprendizaje si la usuaria lo pide).
- [x] `[Nuevo]` Tarjetas reordenables extendidas a Inicio, Mente (Prácticas), Hábitos y todas las pestañas de Energía (Hoy, Nutrición, Movimiento, Sueño, Recuperación, Salud clínica).
- [x] `[Nuevo]` Programas propios en Movimiento (migración 0025): crear, editar y eliminar programas con nombre, ícono, objetivo, días y rutinas que se ciclan; los originales quedan como sugeridos.
- [x] `[Nuevo]` Metas alimentadas también por hábitos: métrica Días de un hábito con selección del hábito (auto_ref en la 0024), completando la cadena sueño → meta → movimiento, práctica o hábito.
- [x] `[Nuevo]` Metas editables (lápiz): título, área y fecha límite.
- [x] `[Nuevo]` Progreso automático por ritmo semanal: se define "X por semana" y el total esperado sale del plazo hasta la fecha límite (90 días si no hay), con vista previa del porcentaje que avanza cada registro. Un día a la vez, sin saltos a 100%.
- [ ] `[Nuevo]` Reordenar con el dedo en el celular (hoy funciona con mouse; el arrastre táctil llega con la app móvil o con pointer events).

## Afinamiento antes del deployment (11 jul 2026)
- [x] `[Bug]` Mente se veía apretado con las tarjetas reordenables: vuelve a su diseño curado de dos columnas (el reordenable sigue en Inicio, Energía y Hábitos, donde las tarjetas son parejas).
- [x] `[Bug]` Foto del plato: la llave era válida pero el modelo gemini-2.5-flash fue retirado para cuentas nuevas; la app usa ahora gemini-flash-latest (verificado con imagen real).
- [x] `[Nuevo]` Hábitos y retos apuntan a una dirección: al crearlos se elige "¿A qué dirección de tu vida apunta?" y la meta queda conectada sola (hábito a ritmo diario, reto a su ritmo semanal). Métrica reto_dias en la migración 0026.
- [x] `[Nuevo]` Agua y retos conectados: al llegar a los 8 vasos, el reto de agua activo se marca solo, y la tarjeta lo explica.
- [x] `[Nuevo]` Movimiento: workout libre (tipo, minutos y kcal estimadas) en Entrenamiento, y duración elegible en cada rutina antes de comenzar.
- [x] `[Nuevo]` Calorías estimadas (MET por tipo y tu peso de la ficha): en registros de hoy, semana de movimiento y balance contra lo comido en Nutrición.
- [x] `[Nuevo]` Regulación: exposición al frío (ducha fría guiada) y retos sugeridos de redes sociales y ducha fría.
- [x] `[Bug]` El menú lateral no scrolleaba: con muchos módulos, Finanzas y Visión quedaban inalcanzables. Ahora la navegación scrollea con barra fina y la cuenta queda fija abajo.
- [x] `[Nuevo]` Finanzas: dividir una boleta (tijera ✂️ en cada movimiento): repartes el total en partes con su descripción, categoría y monto, cada una va a su presupuesto, y el saldo no cambia. Con atajo "el resto" y validación de suma exacta.
- [x] `[Nuevo]` Nutrición por texto: escribir "una lata de atún y un huevo duro" y la IA estima macros igual que la foto, con guardado al día.
- [x] `[Nuevo]` Movimiento: rutina Espalda feliz y cuadrícula de práctica suave equilibrada (6 tarjetas parejas).
- [x] `[Nuevo]` Dirección: guía expandible "Cómo se construye una dirección" al estilo Hábitos Atómicos (sueño → decisión → sistema → identidad, más las cuatro leyes), enlazando Visión y las conexiones de hábitos y retos.
- [x] `[Bug]` Filtros de duración repetitivos en Movimiento eliminados (la duración se elige al abrir cada rutina) y "Todas" eliminado en las prácticas de Mente: se entra directo por vía (Regulación, Mindfulness, Corazón, Mentalidad), sin listas gigantes.
- [x] `[Nuevo]` Luna plana propia: SVG con colores del tema en vez del emoji 3D del sistema, con orientación del hemisferio norte. Menos emojis en las pestañas de Mente.
- [x] `[Bug]` Hábitos vuelve a su diseño compacto de dos columnas (el reordenable dejaba espacios muertos con tarjetas de alturas muy distintas).
- [x] `[Nuevo]` Luna boho de verdad: crecientes de tinta con puntas afiladas y puntitos de compañía, dibujadas con arcos (tercera versión, aprobada la referencia de la usuaria).
- [x] `[Nuevo]` Cielo próximo: calendario astronómico curado bajo el calendario lunar (Perseidas, eclipses de agosto 2026, equinoccio, Gemínidas, solsticio).
- [x] `[Nuevo]` Suplementos en Salud clínica con su propia tarjeta (migración 0027 agrega kind a medications), y Salud clínica de vuelta a columnas compactas.
- [x] `[Nuevo]` Guía de Dirección reescrita sin clichés: siete ideas con respaldo de investigación de varias fuentes (Gollwitzer, Oettingen, Milkman, Locke y Latham, gradiente de meta), cero frases de taza.
- [x] `[Nuevo]` Métrica "Avances registrados en su área" (migración 0028): una meta de Aprendizaje se alimenta de los avances que registras en Aprendizaje, y lo mismo para cualquier área.
- [x] `[Nuevo]` Consolidación de gastos: la pestaña Transacciones es ahora bandeja Por revisar (sin categoría) y Archivo (consolidado por mes). Al categorizar o dividir un movimiento, sale solo de la bandeja.
- [x] `[Nuevo]` Nivel de actividad en la ficha (migración 0029): la meta de proteína se calcula sola con peso × actividad, de 1.0 g por kilo (vida tranquila) a 2.0 (entrena casi a diario).
- [x] `[Nuevo]` Hábitos con color propio y minutos al día (migración 0030): cada hábito elige su color de la paleta de la app para la cuadrícula y el check, y puede definir cuánto tiempo diario ("proyección de familia, 10 min al día"). Con lápiz para editar hábitos existentes.
- [x] `[Nuevo]` Sueño y ejercicio de vuelta en Hábitos (también son hábitos), compartiendo datos con Energía y Movimiento.
- [x] `[Nuevo]` Salud clínica reordenada: suplementos bajo medicamentos y la ficha a lo largo de su columna, sin espacios muertos.
- [x] `[Nuevo]` Lema nuevo: "El sistema operativo de tu vida" (sidebar y login).
- [x] `[Nuevo]` Inicio fusionado (Hoy + Pulso + Brújula, a pedido de la usuaria que quería las tres): saludo con nombre y fecha, Pulso del día con 6 señales tocables (sueño, agua, proteína, movimiento, Mente, hábitos), Brújula con la meta más próxima y su siguiente paso, coach, áreas y avances. Fuera el anillo "mejor versión 0%" y los pagos reducidos a uno discreto.
- [x] `[Nuevo]` Relaciones con profundidad investigada: tipo "hijos" propio, acciones enriquecidas por vínculo (Gottman para parejas, 200 horas de Hall para amistades, historias familiares de Duke, tiempo especial con hijos) y tarjeta "Tu red de apoyo según la ciencia" con hallazgo rotativo diario (estudio de Harvard incluido).
- [x] `[Nuevo]` Relaciones visible de verdad (segundo pase tras feedback): las personas se ordenan por prioridad arrastrando, y la Guía para conectar tiene pestañas Pareja, Hijos, Familia, Amistades y Colegas con el listado completo de consejos a la vista.
- [x] `[Bug]` Ficha con 0029 corrida seguía fallando: era el caché de esquema de PostgREST; el error ahora explica el comando NOTIFY pgrst, 'reload schema'.
- [x] `[Nuevo]` Mosaico sin huecos: las cuadrículas reordenables usan columnas CSS (masonry), las tarjetas se empacan hacia arriba en todas las páginas que las usan (Inicio, Energía).
- [x] `[Nuevo]` Coach conversable y consciente del TDAH: puedes contarle cómo te sientes o preguntarle, valida primero y orienta con pasos diminutos, cero culpa y reinicios sin drama.
- [x] `[Nuevo]` Tu cumpleaños en Ajustes (migración 0031): el día señalado, el Inicio te celebra a ti. Amor propio.
- [x] `[Bug]` Relaciones: el 🔀 del pie parecía botón sin serlo (texto corregido), el botón real ahora dice "🔀 Otras ideas", y la guía muestra 5 ideas con "Ver las N ideas" para no estirar la columna.
- [ ] `[Nuevo]` Google Calendar (Fase 4, necesita OAuth con servidor) y Notion API directa (Fase 4); mientras tanto Revisión exporta Markdown listo para pegar.
- [ ] `[Nuevo]` Registrar la hora del workout (requiere columna nueva en exercise_logs).
- [x] `[Nuevo]` "Avances en esta área" retirado de todas las páginas: para eso están el tracker y Revisión (pedido de la usuaria).
- [x] `[Nuevo]` Balance calórico de hoy en Nutrición (migración 0032 agrega sexo a la ficha): mantención con Mifflin St Jeor (peso, estatura, edad del cumpleaños, sexo y nivel de actividad), objetivo elegible (bajar grasa, mantener, subir masa), meta del día, lo comido, lo que queda y si vas en déficit o superávit. Con respaldo local si el caché de esquema de Supabase se atrasa.
- [x] `[Nuevo]` Revisión con pestaña Día: la agenda de cada fecha con el detalle completo (cada plato con sus macros, agua, sueño, energía percibida, sesiones de movimiento, prácticas y diario de Mente, hábitos y retos marcados con su nombre, avances y finanzas del día). Cada día empieza limpio y el historial queda guardado por fecha, navegable con las flechas y exportable a Markdown.
- [x] `[Nuevo]` DESIGN.md y CLAUDE.md puestos al día: navegación por secciones, lema, reglas de layout (sin espacios vacíos, luna boho, colores por hábito) y registro de decisiones al 11 de julio.
- [x] `[Nuevo]` Relaciones rediseñada (fusión elegida por la usuaria entre opciones): tip del día como franja a lo ancho, personas como filas anchas arrastrables por prioridad (nada se aprieta) y la guía para conectar con la ciencia en columna fija a la derecha.
- [x] `[Nuevo]` Tareas de hoy en el Inicio (migración 0033): checklist del día para lo suelto que no es hábito ni meta (hacer la cama, lavar la ropa). Se anota, se marca, se borra, y lo pendiente de otros días aparece con "pasar a hoy", sin culpa. Queda registrado en Revisión: en la pestaña Día tarea por tarea, y en Semana y Mes el total completado.
- [x] `[Nuevo]` Pomodoro global para el foco con TDAH: botón flotante presente en todas las páginas, bloques de 15, 25 o 45 minutos, descanso automático, campana suave al terminar, etiqueta "¿en qué te enfocas?" para anclar la atención, y cuenta los bloques del día sin culpa. Sobrevive al cambiar de página y a recargar.
- [x] `[Nuevo]` Comidas con momento del día (migración 0034): al guardar un plato eliges desayuno, almuerzo, cena o snack, presugerido según la hora. Se ve en la lista de comidas y en Revisión → Día.
- [x] `[Nuevo]` Contador de ayuno en Nutrición (migración 0034 agrega eaten_at): horas desde tu última comida con meta elegible (12, 14, 16, 18 h) y barra. Se alimenta solo de tus comidas, con nota amable de que no le sirve a todo el mundo.
- [x] `[Nuevo]` Suite TDAH (la identidad de la app): pomodoro ligado a proyectos de Trabajo y a Aprendizaje (migración 0035, focus_blocks): cada bloque terminado se guarda con su destino, se ve por proyecto ("🎯 3 bloques esta semana"), tiene botón "🎯 Foco" en cada proyecto activo y "🎯 Foco de estudio" en Aprendizaje, señal "🎯 Foco" en el Pulso del Inicio, y cae a Revisión (Día con detalle, Semana y Mes con totales).
- [x] `[Nuevo]` Captura rápida global (rayo ⚡ sobre el pomodoro): un toque, escribes el pensamiento, Enter, y quedó en Tareas de hoy. Sin categorías ni decisiones.
- [x] `[Nuevo]` "¿No sabes por dónde empezar?" en el Inicio: contra la parálisis, la app elige UNA sola cosa (tarea pendiente, hábito sin marcar o microacción) y la muestra sola, con "La hice", "Otra cosa" y "Dale un bloque de foco".
- [x] `[Nuevo]` Divide esta tarea con IA (tijera ✂️ en Tareas de hoy): Gemini la parte en 3 a 5 pasos ridículamente chicos, el primero físico y de menos de dos minutos, que reemplazan a la original.
- [x] `[Nuevo]` Menú de dopamina en el Inicio: lista personal editable de recompensas sanas y rápidas, muestra 3 al azar, "Muéstrame otras". Vive en el navegador (localStorage).
- [x] `[Nuevo]` Rutinas guiadas paso a paso en Hábitos → Rutinas: como el reproductor de sadhana pero para la vida diaria (Mañana suave y Cierre del día sugeridas, editables y propias), un paso a la vez en grande con campanita. Viven en el navegador (localStorage).
- [x] `[Nuevo]` Registrar días pasados en Energía → Hoy: selector de fecha (hasta 14 días atrás) con aviso claro; agua, proteína, energía percibida, movimiento, sueño y platos se guardan en ese día y suman a las metas. Desaparecer unos días no borra lo que sí hiciste.
- [x] `[Nuevo]` Ayuno con entrada manual: botón "Acabo de comer" y hora exacta ("fue ayer a las 21:00") sin registrar un plato completo; convive con la hora automática de los platos.
- [x] `[Nuevo]` Ciclo menstrual (migración 0036): pestaña Ciclo en Energía (se oculta si la ficha dice masculino) con registro de cada regla, día y fase hormonal (menstrual, folicular, ovulatoria, lútea) con qué necesitas en cada una, línea del ciclo, predicción de la próxima con el historial real, y el correo de la pareja con botón "Avísale cómo acompañarte" (correo prellenado con la fase y cómo apoyar).
- [x] `[Nuevo]` El lazo es de a dos (migración 0037): cada vínculo puede tener correo e invitación con consentimiento (sin invitar → invitada → acepta o declina); solo si acepta aparece "Mándale un recordito" con una idea a la medida del vínculo. El cariño no se obliga.
- [x] `[Nuevo]` Biblioteca en Aprendizaje: 12 libros curados por vía (TDAH y foco, Hábitos, Emociones, Relaciones), cada uno con su porqué para un cerebro TDAH y tres ideas aplicadas a la app. Los de relaciones se asoman en la página de Relaciones bajo la ciencia.
- [x] `[Nuevo]` Modo día pasado global (pedido de la usuaria): el selector vive en Ajustes (y en Energía → Hoy) y pone TODA la app en ese día con un banner visible arriba; Energía, Hábitos, Movimiento, Mente, Diario, Tareas, Avances y Relaciones registran en esa fecha. "Volver a hoy" con un clic, y al recargar la app vuelve sola a hoy por seguridad.
- [x] `[Bug]` La pestaña Ciclo seguía apareciendo con la ficha en masculino: la página no refrescaba el perfil al guardar la ficha. Ahora al guardar se refresca al tiro, la pestaña desaparece y si estabas en ella te lleva a Hoy.
- [x] `[Nuevo]` Biblioteca ampliada a 63 libros: 9 por sección (filas de tres justas) en 7 vías, sumando Finanzas, Propósito y Espiritualidad a las cuatro originales. Cada libro con estado de lectura ("Lo quiero leer" / "Lo leí", en el navegador por ahora) y contador personal arriba. Relaciones asoma 3 con enlace a los 9.
- [x] `[Bug]` El tracker de hábitos "se borraba": las marcas estaban en la base pero la cuadrícula era una ventana deslizante de los últimos N días, y tras semanas sin entrar las marcas viejas quedaban fuera de vista. Ahora la cuadrícula se ancla al primer día marcado (historia completa, tope 90 días) y el desafío cuenta marcas acumuladas: las pausas no borran nada.
- [x] `[Nuevo]` Biblioteca: filtros "📖 Mi lista" y "✓ Leídos" con contador, para ver tus libros marcados en un solo lugar.
- [x] `[Bug]` Energía mostraba su propio selector "¿Se te pasó un día?" duplicando el de Ajustes: eliminado, queda solo el modo global.
- [x] `[Nuevo]` Movimiento con guardia antiduplicados: si el día ya tiene una sesión del mismo tipo (quizás anotada desde Energía), pregunta antes de sumar otra.
- [x] `[Bug]` La Brújula del Inicio y Dirección mostraban porcentajes distintos para la misma meta (3 de 47 contra 4 de 47): el Inicio cargaba solo 7 días de ejercicio y 10 avances. Ahora ambas páginas usan cargarFuentes() con las mismas ventanas (365 días de ejercicio, 500 avances) y dicen exactamente lo mismo, verificado en vivo.
- [x] `[Nuevo]` Hábitos que se marcan solos: registrar ejercicio marca los hábitos que hablan de entrenar (gimnasio, yoga, caminar...) y completar una práctica de Mente marca los de meditar o respirar. Sin doble trabajo, y Revisión los cuenta.
- [x] `[Bug]` Las barras de "Tus áreas" del Inicio ignoraban el progreso automático de las metas (usaban solo el manual): con Estar en forma al 9%, Hábitos mostraba 0%. Ahora usan progresoDe con las fuentes completas, verificado en vivo (Hábitos 11%).
- [x] `[Nuevo]` DEPLOY.md: el checklist completo del deployment (preparación, Supabase, Vercel, post publicación y Fase 4).
- [x] `[Nuevo]` Checklist por proyecto en Trabajo (migración 0038, project_tasks): pasos concretos que al marcarse recalculan solos el porcentaje del proyecto (el slider manual queda para proyectos sin checklist).
- [x] `[Nuevo]` Métrica "Horas de un proyecto" (0038 amplía el check): una meta como Estudiar IA se conecta al proyecto Estudiar y avanza con las horas de jornada registradas en Trabajo. Selector de proyecto en la conexión automática de Dirección.
- [x] `[Nuevo]` Logo nuevo: átomo con núcleo en línea (LogoAtomo.tsx), en el sidebar, el login y el favicon de la pestaña de Chrome (favicon.svg). El núcleo eres tú.
- [x] `[Nuevo]` DEPLOY.md ahora abre con la "Prueba completa antes de publicar": el checklist módulo por módulo para verificar que todo funcione.
- [x] `[Bug]` Revisión mostraba "Dirección y avances" en cero aunque hubo 4 sesiones de gimnasio: ahora el módulo muestra cuánto empujó cada meta automática en el período ("⚡ Estar en forma: +4 sesiones"), verificado en vivo.
- [x] `[Nuevo]` Sincronización retroactiva de hábitos: al abrir Hábitos o Revisión, los días de ejercicio ya registrados (últimos 60) pintan solos los hábitos de movimiento que existan. Crear "Ir al gimnasio" hoy rescata tu historia completa. Con "Ir al gimnasio 🏋️" agregado a los sugeridos de un clic.
- [x] `[Bug]` La sincronización de hábitos peleaba con el desmarque manual: si desmarcabas un día pintado por el ejercicio, la siguiente carga lo volvía a marcar. Ahora recuerda lo que ya pintó (memoria local) y nunca insiste sobre algo que desmarcaste. Tu palabra manda. Verificado en vivo.
- [x] `[Nuevo]` Microcopy en Hábitos: explica que el cuadrado grande marca hoy y los chiquitos son el calendario día a día (tocables, incluso retroactivos).
- [ ] `[Nuevo]` Correos automáticos (Fase 4, con servidor): recordatorios del ciclo a la pareja y recorditos del lazo a quienes aceptaron; hoy salen prellenados desde tu propio correo con un clic.

## Reporte del checklist HTML (19 jul 2026)
- [x] `[Bug]` Mobile roto en casi toda la app: varias páginas (Dirección, Trabajo, Finanzas, Hábitos, Mente, Energía, Relaciones, Insights) fijan el ancho de columnas de `.statrow`/`.panelgrid` con un estilo en línea que le gana en prioridad a la regla responsive del CSS. En celular no colapsaban a una columna y el último cuadrado se cortaba. Arreglado con `!important` en la media query (una sola causa para casi todos los "se corta" reportados).
- [x] `[Bug]` Fila de cada práctica en Mente y de cada hábito: sin `flex-wrap`, en celular el botón "Comenzar" (o los botones de un hábito) podían quedar fuera del ancho visible. Ahora envuelven a una segunda línea en pantallas angostas.
- [x] `[Bug]` Menú de dopamina repetía las mismas 3 ideas cada 2 o 3 ciclos: el sorteo era puramente aleatorio sin memoria. Ahora usa una "bolsa" barajada que no repite ninguna hasta mostrar todas.
- [x] `[Bug]` Mente: al parar una práctica antes de que terminara el tiempo, no quedaba ningún botón para guardarla, se perdía todo. Ahora "Guardar y terminar" guarda los minutos reales hechos (mínimo 1), coherente con el resto de la app: lo chico también cuenta.
- [x] `[Bug]` Pomodoro no empujaba ninguna meta pese a estar ligado a un proyecto: faltaba la métrica automática. Nueva métrica "Minutos de foco (pomodoro)" en Dirección, conectable a un proyecto o a Aprendizaje; ya suma en el Inicio, Dirección y Revisión.
- [x] `[Bug]` La meta "Estudiar IA" había quedado reconectada a un hábito en vez de a las horas del proyecto (por eso la jornada registrada no la movía). No es un bug de código: cualquier meta se conecta a UNA sola fuente y esa se pisa si se cambia. Se agregó una línea "Conectada ahora a: …" en el panel para que la conexión activa nunca quede invisible ni se pise sin querer.
- [x] `[Nuevo]` La brújula del Inicio ahora aclara "y N metas más en camino" junto al título: mostrar solo una es intencional (un cerebro TDAH con diez metas a la vista no avanza en ninguna), pero ahora se entiende que es una elección de foco, no que las demás desaparecieron.
- [x] `[Nuevo]` Selects sin la flecha nativa del sistema, con una del tema, en toda la app. El listado desplegado en sí lo sigue dibujando el navegador (limitación real de `<select>`, ningún sitio la puede restylear sin construir un dropdown propio).
- [x] `[Nuevo]` Logo del átomo con líneas más finas (de 1.5 a 0.9 de grosor), en el sidebar, el login y el favicon.
- [x] `[Nuevo]` Las metas ahora viven también en su área: tarjeta "Tus metas de esta área" con barras en Finanzas, Trabajo, Aprendizaje, Relaciones, Hábitos y Energía, con enlace a Dirección.
- [x] `[Nuevo]` Rutinas con tiempo por paso: editor de hasta 10 pasos, cada uno con sus minutos opcionales, y el reproductor con cuenta regresiva por paso que avanza solo con campanita. Migra el formato viejo sin perder rutinas.
- [x] `[Nuevo]` Finanzas: la automatización ahora se ofrece también al CATEGORIZAR (antes solo al renombrar el comercio): checkbox "Automatizar" que crea la regla, se aplica a las existentes y a las que lleguen. El traspaso a la tarjeta se categoriza una vez y nunca más.
- [x] `[Nuevo]` Estado civil en la ficha (migración 0039): soltera oculta la sección de pareja del ciclo, en pareja la muestra. Y los consejos de cada fase ahora tienen versión "para ti" (te hablan a ti) separada del texto de apoyo que va en el correo a la pareja.
- [x] `[Nuevo]` Visual board: tres tipos de letra por nota (normal, títulos y caligrafía; botones Aa en la barra, migración 0039), imágenes PNG con fondo transparente respetado (sin caja ni sombra, como sticker), y en celular el lienzo entero se escala para verse completo sin cortarse, con el arrastre compensando la escala.
- [x] `[Nuevo]` Ayuno: botón "⏳ Empezar mi ayuno ahora" junto a "Acabo de comer", con nota que explica que ambos parten el contador en tu último bocado (así funciona el ayuno de verdad).
- [x] `[Nuevo]` Horas con el estilo de la app: CampoHora (dos selects de hora y minutos del tema) reemplaza al input time nativo en las tarjetas de Sueño de Energía y Hábitos. El panel azul era del navegador y no se puede restylear; ahora ya no existe.
- [x] `[Nuevo]` Brújula con flechas ‹ › para pasear por todas tus metas activas sin salir del Inicio (muestra "2 de 5"), verificado en vivo.
- [x] `[Bug]` Menú de dopamina, segundo intento: la bolsa ahora se agota COMPLETA antes de rebarajar, ninguna idea se repite hasta ver todas.
- [x] `[Nuevo]` Vida ideal: botón Guardar explícito en cada bloque (el autoguardado al salir del texto sigue funcionando).
- [x] `[Nuevo]` Trabajo: un proyecto sin checklist ya no muestra un "0%" que desanima; explica que el porcentaje se mide con el checklist y que las horas y el foco ya cuentan arriba y empujan la meta conectada.
- [x] `[Nuevo]` Logo con el átomo más grande dentro del cuadrado (menos fondo vacío, mejor balance), en sidebar, login y favicon.
- [x] `[Nuevo]` Selector propio de NucleoOS (components/Selector.tsx): desplegable 100% del tema (tarjeta, bordes redondeados, opción activa en salvia) que reemplaza al panel nativo del sistema. Aplicado donde más se usa a diario: las horas de sueño (CampoHora en Energía y Hábitos), el tipo de ejercicio en Energía y Movimiento, y la duración de las prácticas de Mente. Verificado en vivo con captura.
- [x] `[Nuevo]` Barrido COMPLETO de selects: los 41 desplegables nativos de la app migrados al Selector propio (Dirección, Finanzas con sus filtros y modales, ficha clínica, hábitos, retos, sueños, trabajo, pomodoro, ajustes, rutinas de movimiento). Cero selects del sistema operativo, verificado en vivo.
- [x] `[Nuevo]` Métrica "Dinero de una meta de ahorro" (migración 0040, que además arregla que foco_minutos faltaba en el check de la base): una meta de Dirección se conecta a una meta de ahorro de Finanzas y su porcentaje es el dinero real aportado, sin ritmo semanal. Selector de metas de ahorro en la conexión automática.
- [x] `[Nuevo]` Las metas de Dirección del área Finanzas se mudaron de arriba de la página a la pestaña Metas, junto a los cuadrados de ahorro, donde corresponden. Verificado en vivo.
- [x] `[Nuevo]` Categorización ESTRICTA del "se alimenta de": cada área ofrece solo sus métricas propias más sus avances (Relaciones solo momentos, Finanzas solo ahorro, Trabajo solo horas y foco, Aprendizaje foco y libros); nada de hábitos o retos colados en áreas ajenas. Solo la meta General ofrece todo.
- [x] `[Nuevo]` El modal de Nueva meta conecta TODO al crear: selector "Conectada a" para elegir el hábito, reto, proyecto, meta de ahorro o persona en el momento, y una línea "Se alimenta de..." idéntica para todas las métricas (se eliminó la lamparita exclusiva de Finanzas que rompía la coherencia).
- [x] `[Nuevo]` El puente Dirección–Finanzas se arma desde los dos lados: al crear o editar una meta de ahorro en Finanzas aparece "Empuja una meta de tu Dirección (opcional)". La meta "Ahorrar para vivir en Chile" quedó conectada a "Viaje a Chile" en la sesión.
- [x] `[Nuevo]` El cartero automático (Fase 4 cumplida): Edge Function "correos" que un cron diario (9 am de Vancouver) despacha vía Resend desde hola@nucleoos.app con responder-a al correo de la usuaria. Recorditos del lazo los jueves (a quienes aceptaron, con ideas por tipo de vínculo que rotan por semana) y aviso a la pareja el primer día de cada fase del ciclo (solo con partner_email configurado). Tabla correos_enviados (0046, solo service role) evita repeticiones, y el cron va en la misma migración. Pendiente de la usuaria: correr 0046 con su service key pegada y crear la función "correos" en el Dashboard.
- [x] `[Nuevo]` Seguridad de la IA en dos capas (hallazgo de la usuaria: el coach escribía código): 1) límite de rol en el prompt del coach, rechaza con cariño programar, traducir o redactar y redirige al bienestar (verificado en vivo); 2) la protección real en el servidor: la Edge Function v2 impone tope de 80 llamadas diarias por usuaria (tabla ia_uso de la migración 0045, solo service role, nadie puede resetear su contador) y límites de tamaño por petición. Pendiente de la usuaria: correr 0045 y repegar la función en el Dashboard.
- [x] `[Nuevo]` Deshacer en el Despegue: el clic curioso tiene vuelta atrás. Botón "↩︎ deshacer la última" junto al contador de victorias (y también cuando la lista quedó vacía): desmarca la tarea o el paso real en su lugar de origen (los pasos de meta recuperan su avance anterior, no cero) y lo devuelve al principio de la lista. Verificado en vivo: marcar → hecha en la base → deshacer → desmarcada y de vuelta.
- [x] `[Nuevo]` El Radar se llama ahora "Despegue" 🚀 (elección de la usuaria), con cohete, botón "Despegar" y textos de despegue.
- [x] `[Nuevo]` Serpentinas de celebración (idea de la usuaria): cañón de confeti propio (canvas, sin librerías, colores del tema) que dispara desde las esquinas como año nuevo. Lluvia grande al terminar un reto, lograr una meta o vaciar el Despegue; ráfaga chica al marcar tareas de hoy, victorias del Despegue, "lo hice hoy" de retos, rutinas de movimiento completadas, el "una sola cosa" del Inicio y cada bloque de pomodoro.
- [x] `[Nuevo]` Radar antiprocrastinación en Trabajo (idea de la usuaria): escanea TODO lo pendiente (checklists de proyectos activos, próximos pasos de metas y tareas de hoy) y la IA lo ordena del más fácil al más pesado por energía de activación, con minutos estimados, un primer paso físico de 2 minutos para el primero, check de victoria en cada fila (marca la tarea o el paso real), botón de foco, contador de victorias de la pasada y respaldo sin IA (lo más corto primero). Verificado en vivo: basura 5 min → correo 10 min → plan de negocios 180 min.
- [x] `[Nuevo]` Menú y campana domados en celular: con el menú abierto el fondo queda quieto (adiós al baile de la barra del navegador), el menú ganó una X para cerrar (además del toque afuera), su altura usa 100dvh, y la campana de avisos ahora es un panel fijo a lo ancho con su propio scroll en vez de salirse de la pantalla. Verificado a 360px.
- [x] `[Nuevo]` Celular sin scroll lateral en NINGUNA página: tres arreglos de raíz (hijos de grid con min-width 0 para que los textos largos vuelvan a cortarse con puntos suspensivos, inputs sin ancho mínimo nativo, y el ancho se verificó en las 14 páginas a 360px). Relaciones, Trabajo, Ajustes y Finanzas quedaron exactas.
- [x] `[Nuevo]` El panel "Elige tu tema" (y TODOS los modales) ahora caben en la pantalla del celular: altura máxima con scroll interno, y el panel de temas ganó una X para cerrar arriba, además del Listo de abajo.
- [x] `[Nuevo]` COMPLETADO de punta a punta: la IA viaja por el servidor: Edge Function "ia" (supabase/functions/ia/index.ts) que llama a Gemini con el secreto GEMINI_API_KEY y exige sesión; la app la usa primero y la llave local queda solo como respaldo de desarrollo. La usuaria desplegó la función, puso el secreto con llave nueva, agregó las variables de Supabase en Vercel y app/.env salió del repositorio. El coach respondió en producción por el camino seguro.
- [x] `[HITO]` 🚀 NucleoOS DESPLEGADO EN INTERNET: https://www.nucleoos.app (Vercel, dominio propio, 18 de julio de 2026). Prueba de oro pasada en producción: tarea registrada en el Inicio y vista en Revisión → Día. Espejo de la nube activo (la 0044 ya baja claves a dispositivos nuevos).
- [x] `[Nuevo]` Ojito de privacidad en Finanzas: un botón en la barra de pestañas enmascara TODOS los montos con ✱✱✱✱✱ (balance, deuda, patrimonio, ingresos, gastos, transacciones, metas de ahorro, deudas, y también la meta de ahorro en Dirección). Para enseñar la app sin enseñar la plata. La preferencia se recuerda en el navegador. Verificado en vivo.
- [x] `[Nuevo]` Ayuno: la marca manual ahora es una corrección explícita que le gana al último plato si la haces después de registrarlo (antes, un plato anotado tarde con la hora equivocada pisaba tu "empecé a las 17:00"). Si luego comes algo nuevo, el plato vuelve a mandar. Verificado en vivo: marca 17:00 con plato de las 17:49 muestra 57 minutos, no 2.
- [x] `[Nuevo]` Espejo en la nube (migración 0044): las claves del navegador que importan (sesiones de Mente, libros marcados, rutinas guiadas, menú de dopamina, ayuno, ciclo, objetivo calórico, bloques de foco y la memoria del automarcado) se respaldan en la tabla user_kv y bajan solas al iniciar sesión en cualquier dispositivo. La app nunca se bloquea si la nube falla.
- [x] `[Nuevo]` Ayuno con fecha y hora del tema (adiós al datetime nativo), hora de las citas médicas con CampoHora, y cero paneles del navegador en TODA la app (fecha, hora y selects). Verificado.
- [x] `[Nuevo]` Lema nuevo en la app: "Un sistema para cambiar el rumbo de tu vida" (Login y barra lateral).
- [x] `[Nuevo]` vercel.json creado con la regla SPA, listo para el deploy.
- [x] `[Nuevo]` Comercio y descripción en su lugar (migración 0043): el texto crudo del banco se mudó de la Descripción a su propia columna bank_ref (la firma para duplicados y reglas). Al editar un movimiento del banco, el Comercio parte con la sugerencia limpia ("[PR]SEPHORA KELOWNA BC" → "Sephora Kelowna") y la Descripción parte en blanco, para anotar qué fue. Las importaciones nuevas ya nacen ordenadas así.
- [x] `[Nuevo]` Bug latente cazado: dos regex sin backslash en el normalizador de comercios borraban la letra ese de los patrones ("Sephora" quedaba "ephora", "Costco" quedaba "co tco"). Corregido, y las 11 reglas guardadas de la sesión fueron reparadas con sus patrones reales.
- [x] `[Nuevo]` Calendario propio (CampoFecha): los 18 selectores de fecha de la app dejaron el panel azul del navegador y usan un calendario con el tema de NucleoOS (mes en español, semana desde lunes, salto por año para cumpleaños, límites min y max, botones Hoy y Borrar). Metas, finanzas, citas, retos, ciclo, sobriedad, sueños, ajustes y más.
- [x] `[Nuevo]` La métrica de libros ahora se llama "Leer libros" y deja elegir LOS LIBROS EXACTOS: una lista con buscador donde marcas los que quieres leerte (los de "Mi lista" primero), el total de la meta es esa cantidad automáticamente ("2 libros elegidos: cada uno avanza 50%") y cada libro que marques leído la empuja. También quedan las opciones por vía o toda la biblioteca.
- [x] `[Nuevo]` Biblioteca personalizable (migración 0042): botón "Agregar libro" con ficha armada por la IA (emoji, por qué leerlo y cómo toca las áreas de tu vida, tres ideas y la vía sugerida), guardado en Supabase, tarjeta igual a las curadas con marca "tuyo" y botón de eliminar. Los libros propios cuentan en las metas de "Libros terminados", también por vía. Se sumaron a la biblioteca curada The Mastery of Love (Relaciones) y The Magic of Thinking Big (Propósito): ahora son 65.
- [x] `[Nuevo]` "Libros terminados" completa: se conecta a cualquier libro de la biblioteca o a una vía específica (TDAH y foco, Hábitos, Finanzas...), y su objetivo es el TOTAL de libros ("leerme 3 libros"), no un ritmo semanal. La tarjeta muestra "X de Y libros de la vía" y cada libro marcado como leído avanza el porcentaje.
- [x] `[Nuevo]` Visual board: arreglado el bug donde editar una nota y cerrar tocando el lienzo perdía el texto (el editor se desmontaba antes de guardar; ahora todo cierre guarda). Además: botón de negrita, botones para agrandar y achicar la letra, botón "Sin fondo" para dejar solo las letras, y botón "Agregar texto" que crea una frase suelta en grande sobre el lienzo. Migración 0041.
- [x] `[Nuevo]` Cada área alimenta sus metas de verdad: métrica "Momentos con una persona" (los registros de Relaciones empujan metas de Relaciones, con una persona específica o con cualquiera) y métrica "Libros terminados" (la biblioteca de Aprendizaje guarda la fecha de cada libro leído y empuja metas de Aprendizaje). La lista "se alimenta de" ya no muestra todo revuelto: cada área ofrece SOLO sus métricas propias más las universales (hábitos, retos y avances). Revisión también cuenta el empuje de estas métricas. Migración 0040 ampliada.
- [x] `[Nuevo]` Las métricas de conexión se ordenan según el área de la meta: una meta de Finanzas ofrece primero ahorro, una de Trabajo ofrece horas y foco, una de Energía ofrece movimiento. Y el modal de nueva meta con área Finanzas sugiere conectarla a una meta de ahorro.
- [ ] `[Nuevo]` Lazo mutuo: el recordatorio debería salir enviado por la app, no que la usuaria lo mande manualmente. Es exactamente la Fase 4 (correos automáticos) ya anotada arriba, no un ítem nuevo.
- [x] `[Bug]` El número de la campana no bajaba al revisar las notificaciones: contaba pendientes reales, no "sin leer". Ahora al abrir el panel lo visto queda marcado como visto (memoria local por día): el número desaparece y solo vuelve con avisos nuevos o al día siguiente. Los avisos siguen listados adentro mientras estén pendientes. Verificado en vivo (2 → sin número, sobrevive a recargar).
- [ ] `[Nuevo]` Mover a Supabase lo que quedó en localStorage: menú de dopamina, rutinas guiadas, marca manual de ayuno y sesiones de Mente (importa antes del deployment para que sobrevivan al cambio de dispositivo).
- [ ] `[Nuevo]` Deployment: publicar la app en internet (próxima sesión grande).

## Bloque G, al final
- [ ] `[Nuevo]` Ajustes: idioma inglés (prioridad baja, definida por la usuaria).

## Pendientes de QA (9 jul 2026)
- [ ] Pasada interactiva con cuenta QA (bloqueada: confirmar el usuario qa.nucleoos+2@gmail.com en Supabase o desactivar "Confirm email").
- [ ] Framework de tests (vitest) con regresiones de los bugs de fechas.
- [ ] Modo oscuro, formato de moneda por región, "marcar pagado" en recordatorios, modal de confirmación propio.

## Corregidos
- [x] `[Bug]` Fechas en UTC corrían el día en la noche (fix 9c725e7).
- [x] `[Bug]` Pago mensual del día 29 al 31 se corría de mes (fix 82a9f9b).
- [x] `[Bug]` Avatar fijo "B" (fix a204ef3).
- [x] `[Bug]` Nueva nota sin cuadernos moría en el modal (fix 3bdd45b).
- [x] `[Bug]` Eliminar sin confirmación con borrado en cascada (fix 019d359).
