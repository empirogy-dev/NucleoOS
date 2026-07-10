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
