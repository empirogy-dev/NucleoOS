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
