# Templates de Meta — Núcleo WhatsApp

> Los 6 templates que el Cartero necesita para avisarte cuando la ventana de 24 horas está
> cerrada. **Se mandan a aprobación el día 1** (demoran de horas a días). Se crean en
> WhatsApp Manager de Meta (business.facebook.com → Message templates), categoría **Utility**, un template por idioma.
> Regla: idioma `es` y `en`, las variables `{{1}}`, `{{2}}` deben
> calzar EXACTO entre el template y el envío.

## aviso_ayuno
- **es:** `🎉 Completaste tu ayuno de {{1}} horas. Come cuando tu cuerpo lo pida, sin apuro. Responde a este mensaje si quieres registrar tu comida.`
- **en:** `🎉 You completed your {{1}} hour fast. Eat when your body asks, no rush. Reply to this message if you want to log your meal.`

## aviso_tareas
- **es:** `📝 Buenos días. Hoy tienes {{1}} tareas: {{2}}. Responde y las vamos marcando juntas.`
- **en:** `📝 Good morning. Today you have {{1}} tasks: {{2}}. Reply and we can check them off together.`

## aviso_cumple
- **es:** `🎂 {{1}}: es el cumpleaños de {{2}}. Un mensaje corto vale más de lo que crees. Responde si quieres ideas.`
- **en:** `🎂 {{1}}: it's {{2}}'s birthday. A short message is worth more than you think. Reply if you want ideas.`

## aviso_pago
- **es:** `🔔 Recordatorio: {{1}} vence {{2}}. Responde si quieres ver los detalles.`
- **en:** `🔔 Reminder: {{1}} is due {{2}}. Reply if you want the details.`

## aviso_habitos
- **es:** `🌱 Aún quedan hábitos de hoy sin marcar: {{1}}. Un check antes de dormir cierra el día bonito. Responde "marca {{2}}" y lo anoto.`
- **en:** `🌱 Some of today's habits are still unchecked: {{1}}. One check before bed closes the day nicely. Reply "marca {{2}}" and I'll log it.`

## aviso_generico
- **es:** `💛 Tienes novedades en NucleoOS: {{1}}. Responde a este mensaje para ver el detalle.`
- **en:** `💛 You have updates in NucleoOS: {{1}}. Reply to this message to see the details.`

## Notas
- Todos invitan a **responder**: la respuesta abre la ventana de 24 horas y ahí el agente
  conversa libre (el truco de producto del BRIEF §8).
- Sin guiones como puntuación, tono NucleoOS.
- Cuando Meta apruebe cada uno, se anota aquí su estado
  (el código de `despachar()` usa estos mismos nombres tal como queden en WhatsApp Manager).

| Template | es | en |
|----------|----|----|
| aviso_ayuno | ⬜ pendiente | ⬜ pendiente |
| aviso_tareas | ⬜ pendiente | ⬜ pendiente |
| aviso_cumple | ⬜ pendiente | ⬜ pendiente |
| aviso_pago | ⬜ pendiente | ⬜ pendiente |
| aviso_habitos | ⬜ pendiente | ⬜ pendiente |
| aviso_generico | ⬜ pendiente | ⬜ pendiente |
