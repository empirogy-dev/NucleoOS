# Reporte QA, NucleoOS, 9 de julio de 2026

- **Método:** revisión de código completa de las 7 áreas mas pasada de humo en el navegador (9 rutas, sesión real, sin mutaciones).
- **Alcance:** app web en `app/` (React 19, Vite, Supabase). Tier Standard.
- **Consola:** 0 errores en las 9 rutas. **Red:** 0 llamadas fallidas.
- **Puntaje de salud:** antes 82, después 96.

## Problemas encontrados y corregidos

### ISSUE-001, Alto, corregido (9c725e7)
**Las fechas usaban UTC y se corrían de día en la noche.** `toISOString()` devuelve la fecha de Greenwich: en Canadá después de las 7 u 8 de la tarde ya es "mañana". Gastos, hábitos, sueño, ejercicio, avances, rachas y recordatorios se registraban con el día equivocado. Se creó `src/lib/fechas.ts` (hoyLocal, fmtFechaLocal, diasAtrasLocal, mesActualLocal) y se reemplazaron los 28 usos. Verificado con simulación de zona horaria: a las 9:30 pm en Toronto el código viejo daba 2026-07-10 y el nuevo da 2026-07-09.

### ISSUE-002, Medio, corregido (82a9f9b)
**El pago mensual del día 29 al 31 se corría de mes.** `setMonth` desborda los meses cortos (31 de febrero pasa a 3 de marzo) y el recordatorio perdía su día de pago para siempre. Ahora conserva el día original y usa el último día del mes cuando es más corto. Verificado con casos 31 ene, 30 dic y 15 jun.

### ISSUE-003, Bajo, corregido (a204ef3)
**El avatar de la barra superior decía "B" fijo** para cualquier usuario. Ahora muestra la inicial del nombre del perfil o del correo.

### ISSUE-004, Medio, corregido (3bdd45b)
**"Nueva nota" sin cuadernos no creaba la nota prometida.** Abría el modal de cuaderno y ahí moría el flujo. Ahora, al crear el primer cuaderno desde ese camino, la nota se crea y se abre en el editor. Además todo cuaderno recién creado queda seleccionado.

### ISSUE-005, Alto, corregido (019d359)
**Ningún botón de eliminar pedía confirmación**, y varios son destructivos en cascada: borrar un cuaderno elimina todas sus notas, un vínculo borra su historial, el tracker de sobriedad pierde el conteo, una cuenta deja sus transacciones huérfanas. Los 17 botones de eliminar ahora piden confirmación con un mensaje que explica la consecuencia.

## Pendientes (deferred)

1. **Pasada interactiva con cuenta QA.** Bloqueada: la confirmación por correo está activa y la cuenta `qa.nucleoos+2@gmail.com` quedó sin confirmar. Para destrabarla: en Supabase, Authentication, Users, confirmar ese usuario, o desactivar "Confirm email" temporalmente.
2. **Framework de tests.** El proyecto no tiene tests. Recomendación: vitest con Testing Library, con tests de regresión para ISSUE-001 e ISSUE-002. Decisión de la usuaria.
3. **Modo oscuro.** DESIGN.md lo contempla; aún no está implementado.
4. **Editar registros.** Varias entidades solo permiten crear y eliminar (transacciones, cuentas, deudas, citas). Falta la edición.
5. **Formato de moneda.** `fmtMoney` usa siempre el locale es-CL; en CAD muestra "CA$1.500,00". Considerar locale por moneda.
6. **Recordatorio de una sola vez vencido** queda visible para siempre; falta "marcar como pagado".
7. **window.confirm funciona pero es feo.** Reemplazar por un modal del sistema de diseño.
8. **Build:** advertencia de chunk mayor a 500 kB; separar código por área a futuro.
9. **Red local:** la pila IPv6 de loopback de la máquina falló durante la sesión; Vite ahora se lanza con `--host 127.0.0.1` (launch.json) para evitarlo.

## Evidencia
- TypeScript sin errores tras cada fix; build de producción ok.
- Simulaciones de lógica (zona horaria y desborde de mes) en Node con casos esperados.
- Pasada de humo autenticada por las 9 rutas: 0 errores de consola, 0 fallas de red.
