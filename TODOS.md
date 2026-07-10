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
