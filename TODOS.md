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

## Bloque B, Inicio orientado al avance
- [ ] `[Nuevo]` Mostrar porcentaje de avance por área (no el balance financiero).
- [ ] `[Nuevo]` "Actividad reciente" centrada en el avance hacia tu mejor versión, no en transacciones.

## Bloque C, Calendario v1 (módulo transversal)
- [ ] `[Nuevo]` Vista mensual que centraliza: pagos (Finanzas), citas y exámenes (Salud), cumpleaños (Relaciones), jornadas (Trabajo) y estudio (Aprendizaje).
- [ ] `[Nuevo]` Trabajo: que la jornada registrada quede como tracker diario y en el calendario.
- [ ] `[Nuevo]` Aprendizaje: trackear lo estudiado cada día y verlo en el calendario.
- [ ] `[Nuevo]` Conectar con Google Calendar (Fase 4, integraciones).

## Bloque D, Relaciones accionables
- [ ] `[Nuevo]` Tips segmentados por tipo de relación (pareja, mamá, amistad...), no genéricos.
- [ ] `[Nuevo]` Al abrir una persona, acciones concretas según el vínculo (invitar a salir, llevar a tomar café, regalo sorpresa).

## Bloque E, Salud plus
- [ ] `[Nuevo]` Ficha: agregar peso, estatura, alimentación (con opciones) y color de ojos.
- [ ] `[Nuevo]` Exámenes: adjuntar el PDF del laboratorio o una foto, y poder exportarlos.
- [ ] `[Nuevo]` Tarjetas reordenables por prioridad con arrastrar y soltar.

## Bloque F, Notificaciones
- [ ] `[Nuevo]` Recordatorios en todo (persona con ADHD: son parte central, no opcionales). Centro de notificaciones mas avisos del navegador.

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
