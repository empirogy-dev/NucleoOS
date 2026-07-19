# Núcleo WhatsApp — User Stories (Core v1)

> **Versión:** 1.0 · **Estado:** BORRADOR · **Fecha:** 2026-07-19
> **Proyecto:** NucleoOS, agente de WhatsApp (el Escriba, el Cartero y el Coach)
> **Inputs:** `BRIEF.md` · `ARQUITECTURA-OBJETIVO.md` · `SECURITY-AUDIT.md`
> **Alcance:** SOLO Core v1. `v1.5` y `v2` quedan fuera (ver "Stories diferidos").
> **Total stories:** 24 (P0: 16 · P1: 7 · P2: 1)
> **Personas:** **Bárbara** (usuaria de NucleoOS con el número vinculado) · **Sistema** (Edge Functions + cron)

---

## User Journey Map

```
[E1 Vínculo] Bárbara vincula su número desde Ajustes → el bot la saluda en su idioma
   │
   ▼
[E2 Escriba texto] "recuérdame comprar pan" → aparece en Tareas de hoy de la app
   │
   ▼
[E3 Audio] Audio: "hice 30 minutos de gimnasio" → registrado en Energía con kcal
   │
   ▼
[E4 Buffer] Ráfaga de 4 mensajes → una sola respuesta con todos los registros hechos
   │
   ▼
[E5 Cartero] "🎉 Completaste tu ayuno de 16 h" le llega sola, con template si la ventana está cerrada
   │
   ▼
[E6 Coach] "¿cómo voy esta semana?" → respuesta con sus datos reales
   │
   ▼
[E7 Panel] En Ajustes ve el vínculo, apaga avisos, define horas de silencio
```

---

## Resumen de Epics

| Epic | Fase | Stories | Prioridad | Descripción |
|------|------|---------|-----------|-------------|
| E1: Vínculo y seguridad | F1 | 4 | P0 | Código desde Ajustes, un número = una usuaria, desconocidos afuera |
| E2: Escriba camino feliz (texto) | F2 | 5 | P0 | Webhook → tools → registro en las tablas de la app → confirmación |
| E3: Audio y foto | F3 | 2 | P0/P1 | El caso estrella: audio transcrito; foto del plato |
| E4: Buffer inteligente | F4 | 3 | P0/P1 | Agrupar por silencio, batch multimodal, bypass de comandos |
| E5: Cartero + ventana 24 h | F5 | 5 | P0 | Avisos proactivos con dedupe, templates Meta, horas de silencio |
| E6: Coach con contexto | F6 | 2 | P1 | Preguntas con datos reales, guardrails heredados |
| E7: Panel en Ajustes + observabilidad | F7 | 3 | P1/P2 | Switches, últimos registros, logs con redacción |

---

## Epic 1 — Vínculo y seguridad (F1)

> Sin vínculo no hay agente. Un número de teléfono es una usuaria de NucleoOS, y nadie más entra.

### US-E1-1: Generar código de vinculación desde Ajustes

**Como** Bárbara
**Quiero** ver en Ajustes un código de 6 dígitos y el número del bot
**Para** vincular mi WhatsApp sin tocar nada técnico

**Acceptance Criteria:**

Funcionalidad:
- [ ] Ajustes → WhatsApp muestra el número del bot y un botón "Generar código"
- [ ] El código se guarda en `wa_codigos` con expiración de 10 minutos y un solo uso
- [ ] Si ya hay vínculo activo, se muestra el estado en vez del código

Validaciones:
- [ ] Un código expirado o usado no vincula: el bot responde "Ese código ya no sirve. Genera uno nuevo en Ajustes."

Error Handling:
- [ ] Si falla la generación: "No pudimos generar el código. Intenta de nuevo."

UX:
- [ ] El código se muestra grande, con el texto exacto a enviar: `vincular 123456`
- [ ] Texto en el idioma elegido (es/en/pt vía `t()`)

**Prioridad:** P0 · **Estimación:** S · **Dependencias:** Ninguna
**Notas técnicas:** Migración `0051_whatsapp.sql`. RLS: la usuaria solo ve sus códigos.

---

### US-E1-2: Vincular el número por WhatsApp

**Como** Bárbara
**Quiero** mandarle `vincular 123456` al bot y quedar conectada
**Para** que todo lo que le diga se registre en MI cuenta

**Acceptance Criteria:**

Funcionalidad:
- [ ] El comando `vincular <código>` hace bypass del buffer y se procesa al instante
- [ ] Código válido → upsert en `wa_vinculos` (teléfono E.164 → user_id) + marca el código como usado
- [ ] El bot saluda en el idioma de la usuaria y explica en 3 líneas qué puede hacer

Validaciones:
- [ ] Teléfono ya vinculado a OTRA cuenta: se reemplaza solo si el código es válido (el código manda)
- [ ] Código inválido: mensaje amable con el camino correcto

Error Handling:
- [ ] Errores de BD: el bot responde "Algo falló al vincular. Intenta de nuevo en un momento." y se registra en `wa_eventos`

UX:
- [ ] La tarjeta de Ajustes pasa a "Vinculado" en el próximo refresh

**Prioridad:** P0 · **Estimación:** M · **Dependencias:** US-E1-1
**Notas técnicas:** Normalizar teléfono a E.164 con `+` aunque YCloud lo mande sin él (gotcha del curso).

---

### US-E1-3: Ignorar números desconocidos

**Como** Sistema
**Quiero** responder UNA sola vez a un número sin vínculo y luego silencio
**Para** no gastar IA ni filtrar nada a desconocidos

**Acceptance Criteria:**

Funcionalidad:
- [ ] Mensaje de número no vinculado → respuesta única: "Hola, soy el asistente de NucleoOS. Vincula tu número desde Ajustes en la app."
- [ ] Mensajes siguientes del mismo número en 24 h: se registran en `wa_eventos` y NO se responde
- [ ] Ningún mensaje de desconocido llega al LLM ni a las tools

Validaciones:
- [ ] La respuesta única no revela si el número de alguien más está vinculado

Error Handling:
- [ ] N/A (el silencio es el comportamiento)

**Prioridad:** P0 · **Estimación:** S · **Dependencias:** US-E1-2
**Notas técnicas:** SEC-N1 del SECURITY-AUDIT (superficie pública). Rate limit por número.

---

### US-E1-4: Verificar la firma del webhook y dedupe por wamid

**Como** Sistema
**Quiero** aceptar solo webhooks firmados por YCloud y procesar cada wamid una vez
**Para** que nadie inyecte mensajes falsos ni se dupliquen registros

**Acceptance Criteria:**

Funcionalidad:
- [ ] HMAC-SHA256 sobre `timestamp + "." + rawBody`, comparación timing-safe, tolerancia anti-replay 5 min
- [ ] Raw body leído ANTES de parsear JSON
- [ ] Índice único en `wa_mensajes.wamid`; wamid repetido se ignora con `ON CONFLICT DO NOTHING`
- [ ] Eventos echo (mensajes salientes propios) se filtran para no responderse a sí mismo (loop)

Validaciones:
- [ ] Firma inválida → 401 sin procesar · timestamp viejo → rechazo · echo → ignorado

Error Handling:
- [ ] Se responde 200 a YCloud aunque el procesamiento posterior falle (el error va a `wa_eventos`), para evitar reintentos en bucle

**Prioridad:** P0 · **Estimación:** M · **Dependencias:** Ninguna
**Notas técnicas:** WH-01/WH-02 del audit del curso, aplican tal cual. Tests de firma inválida/válida/replay/echo.

---

## Epic 2 — Escriba camino feliz, texto (F2)

> El corazón: le escribes y la app queda rellenada. Sin buffer todavía, un mensaje a la vez.

### US-E2-1: Registrar una tarea por texto

**Como** Bárbara
**Quiero** escribir "recuérdame comprar pan" y que aparezca en mis Tareas de hoy
**Para** vaciar la cabeza sin abrir la app

**Acceptance Criteria:**

Funcionalidad:
- [ ] El motor detecta la intención y llama `crear_tarea` → insert en `day_tasks` con MI user_id y MI fecha local
- [ ] El bot confirma en una línea: "✓ Anotado en tus tareas de hoy: comprar pan"
- [ ] La tarea aparece en el Inicio de la app al refrescar

Validaciones:
- [ ] El texto de la tarea nunca se inventa: es lo que dije, limpio de la parte de comando

Error Handling:
- [ ] Si el insert falla: "No pude anotarlo, la app no me respondió. Inténtalo en NucleoOS." + `wa_eventos`

**Prioridad:** P0 · **Estimación:** L · **Dependencias:** US-E1-2
**Notas técnicas:** Primera tool completa de punta a punta. El `user_id` viene del vínculo (ToolContext), JAMÁS del LLM (SEC-N2).

---

### US-E2-2: Registrar ejercicio, agua y sueño por texto

**Como** Bárbara
**Quiero** decir "hice 30 min de gimnasio", "tomé 3 vasos de agua" o "dormí de 1 a 7"
**Para** que Energía quede al día sola

**Acceptance Criteria:**

Funcionalidad:
- [ ] `registrar_ejercicio` → `exercise_logs` (tipo + minutos; kcal estimadas con el peso de la ficha)
- [ ] `registrar_agua` → upsert `energy_logs.water_cups` (suma, no reemplaza, y respeta el tope de 8)
- [ ] `registrar_sueno` → upsert `routine_logs` (bed_time/wake_time)
- [ ] Las metas conectadas y el automarcado de hábitos se enteran solos (misma tabla que la app)

Validaciones:
- [ ] Minutos fuera de rango 1 a 600: pregunta antes de escribir
- [ ] "ayer" y "esta mañana" se resuelven en el timezone del vínculo

Error Handling:
- [ ] Tabla faltante o RLS: mensaje amable + log, nunca stacktrace al chat

**Prioridad:** P0 · **Estimación:** L · **Dependencias:** US-E2-1
**Notas técnicas:** Reusa `estimarKcal` y el catálogo `EXERCISE_KINDS` (el LLM mapea "gym" → "Gimnasio").

---

### US-E2-3: Registrar un plato por texto con macros

**Como** Bárbara
**Quiero** describir lo que comí y que quede con calorías y proteína estimadas
**Para** que Nutrición se llene sin pesar nada

**Acceptance Criteria:**

Funcionalidad:
- [ ] `registrar_plato` usa el MISMO prompt del plato de la app (kcal, proteína, carbos, grasas) → insert en `meals` con `eaten_at`
- [ ] La confirmación trae el resumen: "✓ Plato registrado: ≈420 kcal, 22 g proteína"
- [ ] El contador de ayuno se reinicia solo (ultimoBocado lee `meals`)

Validaciones:
- [ ] Si la descripción es muy vaga ("comí algo"), pregunta qué fue antes de estimar

Error Handling:
- [ ] Si Gemini no puede estimar: registra el plato sin macros y lo dice

**Prioridad:** P0 · **Estimación:** M · **Dependencias:** US-E2-2
**Notas técnicas:** Es una tool que llama al LLM adentro (estimación) y luego escribe. Cuenta 1 uso extra de `ia_uso`.

---

### US-E2-4: Registrar gasto con confirmación previa

**Como** Bárbara
**Quiero** escribir "gasté 12 en café" y que el bot confirme antes de anotarlo
**Para** que mis finanzas queden bien y sin sustos

**Acceptance Criteria:**

Funcionalidad:
- [ ] `registrar_gasto` es tool **sensible**: el bot muestra monto, moneda y categoría sugerida (vía `merchant_rules`) y espera un "sí"
- [ ] Confirmado → insert en `transactions` (cuenta por defecto) y responde con el saldo del presupuesto de esa categoría si existe
- [ ] "no" o silencio de 10 min → no se escribe nada

Validaciones:
- [ ] Moneda ambigua o monto ≥ umbral (100): SIEMPRE pregunta
- [ ] La categoría sugerida es editable respondiendo con otra

Error Handling:
- [ ] Fallo del insert tras confirmar: se avisa explícito ("NO quedó registrado")

**Prioridad:** P0 · **Estimación:** L · **Dependencias:** US-E2-1
**Notas técnicas:** SEC-N2/SEC-N3: la confirmación es default duro para tools de dinero, no config opcional.

---

### US-E2-5: Deshacer el último registro

**Como** Bárbara
**Quiero** escribir `deshacer` y que se borre lo último que el bot registró
**Para** corregir sin entrar a la app

**Acceptance Criteria:**

Funcionalidad:
- [ ] `deshacer` (bypass del buffer) borra el último registro creado POR el agente en <24 h
- [ ] Responde qué borró: "Borrado: Gimnasio 30 min de hoy"
- [ ] Solo borra registros propios del agente (marcados en `wa_eventos` con la referencia tabla+id)

Validaciones:
- [ ] Sin nada que deshacer: "No tengo registros recientes tuyos para borrar."
- [ ] `deshacer` dos veces borra los dos últimos, en orden

Error Handling:
- [ ] Registro ya borrado desde la app: lo dice y no falla

**Prioridad:** P0 · **Estimación:** M · **Dependencias:** US-E2-1
**Notas técnicas:** El agente nunca borra datos históricos ni cosas creadas en la app (SEC-N3).

---

## Epic 3 — Audio y foto (F3)

### US-E3-1: Registrar por mensaje de voz

**Como** Bárbara
**Quiero** mandar un audio ("fui al gym 40 minutos y me tomé dos vasos de agua")
**Para** registrar caminando, sin escribir

**Acceptance Criteria:**

Funcionalidad:
- [ ] El audio se descarga de YCloud (validando que el host sea de YCloud) y va a Gemini como audio nativo
- [ ] La transcripción entra al mismo motor que el texto; múltiples acciones en un audio → múltiples tools
- [ ] La confirmación lista todo lo registrado en un solo mensaje

Validaciones:
- [ ] Audio > 5 min o formato raro: "Ese audio no lo pude leer, ¿me lo mandas más corto o por texto?"

Error Handling:
- [ ] Fallo de descarga o transcripción: aviso amable + `wa_eventos`, jamás registro a medias sin avisar

**Prioridad:** P0 · **Estimación:** L · **Dependencias:** US-E2-2
**Notas técnicas:** SEC-N5 (SSRF): solo se descargan URLs con host de YCloud. El TDAH habla más fácil de lo que escribe: este es EL caso de uso.

---

### US-E3-2: Foto del plato por WhatsApp

**Como** Bárbara
**Quiero** mandar la foto de mi comida
**Para** que quede con macros como en la app

**Acceptance Criteria:**

Funcionalidad:
- [ ] Imagen con o sin caption → si parece comida, flujo del plato (mismo prompt de visión de la app) → `meals`
- [ ] Si no parece comida, el bot pregunta qué hacer con ella

Validaciones:
- [ ] Imagen > 10 MB se rechaza amable

Error Handling:
- [ ] Visión falla → ofrece registrarlo por texto

**Prioridad:** P1 · **Estimación:** M · **Dependencias:** US-E3-1
**Notas técnicas:** Reusa el prompt `plato` de `ia.ts` con imagen inline.

---

## Epic 4 — Buffer inteligente (F4)

### US-E4-1: Agrupar la ráfaga por silencio

**Como** Bárbara
**Quiero** que si mando 4 mensajes seguidos el bot espere a que termine
**Para** recibir UNA respuesta coherente, no cuatro

**Acceptance Criteria:**

Funcionalidad:
- [ ] Cada inbound abre o reutiliza un lote en `wa_lotes` con `procesar_despues_de = ahora + 20 s`
- [ ] Cada mensaje nuevo EMPUJA ese timestamp (se dispara por silencio, no por el primer mensaje)
- [ ] El cron `wa-motor` (cada minuto) toma lotes vencidos con `FOR UPDATE SKIP LOCKED` y los procesa UNA vez
- [ ] El batch entero va como un solo bloque semántico al motor

Validaciones:
- [ ] Un lote en `procesando` con lease vencido (>5 min) se recupera y reintenta; tras 3 intentos → `cancelado` + aviso en `wa_eventos`

Error Handling:
- [ ] El worker es idempotente por lote: reproceso no duplica registros

**Prioridad:** P0 · **Estimación:** L · **Dependencias:** US-E2-1
**Notas técnicas:** SCALE-N1: reclaim + dead-letter + idempotencia DISEÑADOS desde el día uno (hallazgo 🔴 del audit del curso).

---

### US-E4-2: Batch multimodal con regla por tipo

**Como** Bárbara
**Quiero** que un audio + un texto enviados juntos se entiendan como una sola cosa
**Para** no recibir respuestas fragmentadas

**Acceptance Criteria:**

Funcionalidad:
- [ ] El bloque consolidado une texto + transcripciones + captions en orden, cada fragmento etiquetado por origen
- [ ] Si llega un audio, el lote espera un poco más (`gracia_audio`, +15 s)

Validaciones:
- [ ] Transcripción no lista al vencer el lote: se espera un ciclo más; si sigue sin estar, se marca "(audio pendiente)" y se procesa

**Prioridad:** P1 · **Estimación:** M · **Dependencias:** US-E4-1, US-E3-1

---

### US-E4-3: Bypass de comandos

**Como** Sistema
**Quiero** que `vincular`, `deshacer` y las respuestas de confirmación salten el buffer
**Para** que lo urgente no espere 20 segundos

**Acceptance Criteria:**

Funcionalidad:
- [ ] Comandos exactos y respuestas "sí/no" a una confirmación pendiente se procesan al instante
- [ ] El resto del lote en curso no se pierde ni se mezcla con el comando

**Prioridad:** P1 · **Estimación:** S · **Dependencias:** US-E4-1

---

## Epic 5 — Cartero + ventana 24 h (F5)

> Los avisos que pidió Bárbara: el ayuno, las tareas, los cumpleaños. Con Meta no se juega: fuera de ventana, template o nada.

### US-E5-1: Aviso de fin de ayuno

**Como** Bárbara
**Quiero** que me avise cuando se completa mi ventana de ayuno
**Para** saber que ya puedo comer sin estar mirando el reloj

**Acceptance Criteria:**

Funcionalidad:
- [ ] El cron `wa-cartero` (cada 15 min) calcula el fin del ayuno con la MISMA regla de la app (último bocado de `meals` vs marca manual de `user_kv`, la posterior manda) + la meta de horas
- [ ] Al completarse: "🎉 Completaste tu ayuno de 16 h. Come cuando tu cuerpo lo pida."
- [ ] Dedupe por inicio del ayuno en `wa_avisos_enviados` (un aviso por ayuno)

Validaciones:
- [ ] Respeta horas de silencio: si termina a las 3 AM, el aviso espera a las 8

Error Handling:
- [ ] Sin datos de ayuno: el aviso simplemente no existe (cero ruido)

**Prioridad:** P0 · **Estimación:** L · **Dependencias:** US-E1-2
**Notas técnicas:** La lógica `ultimaComida` de `AyunoCard.tsx` se replica en el cartero (misma semántica, mismo espejo).

---

### US-E5-2: Resumen matinal de tareas

**Como** Bárbara
**Quiero** un mensaje a las 9:00 con mis tareas de hoy y lo pendiente de ayer
**Para** arrancar el día con el mapa claro

**Acceptance Criteria:**

Funcionalidad:
- [ ] A la hora elegida (def. 9:00, timezone del vínculo): "📝 Hoy: comprar pan, llamar al banco. De ayer quedó: X"
- [ ] Sin tareas → no se envía nada (cero ruido)
- [ ] Dedupe por fecha

**Prioridad:** P0 · **Estimación:** M · **Dependencias:** US-E5-1
**Notas técnicas:** Lee `day_tasks`. Agrupable con cumpleaños del día en un solo mensaje.

---

### US-E5-3: Cumpleaños y reconexión

**Como** Bárbara
**Quiero** que me avise "🎂 Mañana es el cumpleaños de tu mamá"
**Para** nunca más llegar tarde a un cariño

**Acceptance Criteria:**

Funcionalidad:
- [ ] Aviso el día antes y el día del cumpleaños (`relationships.birthday`)
- [ ] Aviso de "💌 tiempo de reconectar con X" cuando vence el contacto ideal (máx. 1 por persona por semana)
- [ ] Dedupe por persona + fecha

**Prioridad:** P0 · **Estimación:** M · **Dependencias:** US-E5-2

---

### US-E5-4: Ventana 24 h como guardrail duro

**Como** Sistema
**Quiero** que TODO envío pase por un único punto de salida que valide la ventana
**Para** no arriesgar el número con Meta jamás

**Acceptance Criteria:**

Funcionalidad:
- [ ] Función única `despachar()` para todo outbound (Cartero y Coach): ventana abierta → texto libre; cerrada → SOLO template aprobado
- [ ] `wa_vinculos.ventana_expira` = último inbound + 24 h, actualizado en cada mensaje entrante
- [ ] Estado ambiguo → se asume cerrada (fail-safe)
- [ ] Los 6 templates v1 (`aviso_ayuno`, `aviso_tareas`, `aviso_cumple`, `aviso_pago`, `aviso_habitos`, `aviso_generico`) se mandan a aprobación de Meta ANTES de construir el cartero

Validaciones:
- [ ] Ninguna ruta del código puede llamar a YCloud sin pasar por `despachar()` (invariante testeable)
- [ ] Template rechazado por mismatch de estructura: error registrado, no reintenta en bucle

**Prioridad:** P0 · **Estimación:** L · **Dependencias:** US-E5-1
**Notas técnicas:** SEC-N4, adaptación del SEC-04 del curso: aquí no hay inbox humano que pueda saltarse el guardrail, pero el punto único de salida se mantiene igual. Idioma `es`/`en` (NO `es_CL`).

---

### US-E5-5: Silenciar y STOP

**Como** Bárbara
**Quiero** poder escribir `silencio` o apagar avisos por tipo en Ajustes
**Para** que el bot sea un regalo y no una carga

**Acceptance Criteria:**

Funcionalidad:
- [ ] `silencio` por chat apaga TODOS los avisos (deja el Escriba y el Coach activos); `avisos` los reenciende
- [ ] Switches por tipo en Ajustes (jsonb en `wa_vinculos.avisos`)
- [ ] Horas de silencio configurables (def. 22:00 a 8:00): los avisos se retienen y se agrupan a la mañana
- [ ] Tope diario de avisos (def. 5): lo que exceda se agrupa o se descarta con log

**Prioridad:** P0 · **Estimación:** M · **Dependencias:** US-E5-4
**Notas técnicas:** SEC-N7 (opt-out obligatorio). El estado de cada switch se respeta server-side en el cartero.

---

## Epic 6 — Coach con contexto (F6)

### US-E6-1: Preguntar cómo voy

**Como** Bárbara
**Quiero** preguntarle "¿cómo va mi semana?" o "¿qué me toca hoy?"
**Para** tener a mi coach en el bolsillo

**Acceptance Criteria:**

Funcionalidad:
- [ ] El motor usa tools de LECTURA (`ver_dia`, `ver_semana`) y responde con números reales (tareas, hábitos, racha, próximo pago)
- [ ] Responde en el idioma de Ajustes, con el tono del coach de la app
- [ ] Hereda LÍMITE DE ROL: no escribe código, no hace tareas ajenas a la vida de la usuaria

Validaciones:
- [ ] Con el tope diario de IA agotado: respuesta fija amable sin LLM ("Hoy ya usamos toda la energía de IA, seguimos mañana 💛")

**Prioridad:** P1 · **Estimación:** L · **Dependencias:** US-E2-1

---

### US-E6-2: Registrar y acompañar en el mismo mensaje

**Como** Bárbara
**Quiero** que "fui al gym pero estoy agotada" registre el ejercicio Y me acompañe
**Para** sentir que hablo con mi coach, no con un formulario

**Acceptance Criteria:**

Funcionalidad:
- [ ] El motor puede decidir "registrar y responder": ejecuta la tool y añade una línea de acompañamiento
- [ ] La confirmación del registro nunca se pierde por la conversación

**Prioridad:** P1 · **Estimación:** M · **Dependencias:** US-E6-1, US-E2-2

---

## Epic 7 — Panel en Ajustes + observabilidad (F7)

### US-E7-1: Panel del vínculo en Ajustes

**Como** Bárbara
**Quiero** ver mi vínculo, mis switches de avisos y mis últimos registros por WhatsApp
**Para** controlar todo desde la app

**Acceptance Criteria:**

Funcionalidad:
- [ ] Tarjeta en Ajustes: estado del vínculo + desvincular + switches por aviso + horas de silencio + hora del resumen
- [ ] Lista de los últimos 10 registros hechos por el agente con link a su módulo
- [ ] Desvincular borra el vínculo y apaga el cartero al instante (los datos de la app quedan intactos)

UX:
- [ ] Textos en es/en/pt · sin guiones como puntuación · estilo DESIGN.md

**Prioridad:** P1 · **Estimación:** M · **Dependencias:** US-E5-5

---

### US-E7-2: Observabilidad con redacción

**Como** Sistema
**Quiero** loguear cada decisión con un trace_id y sin PII innecesaria
**Para** poder depurar "por qué el bot hizo X" sin crear un problema de privacidad

**Acceptance Criteria:**

Funcionalidad:
- [ ] `wa_eventos` registra: inbound, lote, decisión, tools llamadas (nombre + resultado, args redactados), respuesta, template usado, errores
- [ ] `lote_id` como correlador de todo el turno (OBS-N1)
- [ ] Deny-list en el logger: nunca se escriben claves, tokens ni el texto completo de mensajes sensibles
- [ ] TTL de 30 días

**Prioridad:** P1 · **Estimación:** M · **Dependencias:** US-E4-1

---

### US-E7-3: Contador de uso y alertas mínimas

**Como** Bárbara
**Quiero** ver cuánto registré por WhatsApp este mes y que el sistema se queje solo si algo falla seguido
**Para** confiar en que el canal funciona

**Acceptance Criteria:**

Funcionalidad:
- [ ] Contador simple en Ajustes (registros del mes por WhatsApp)
- [ ] Alerta interna (correo a Bárbara) si: errores de envío YCloud sostenidos, lotes en dead-letter, cartero sin correr >24 h

**Prioridad:** P2 · **Estimación:** S · **Dependencias:** US-E7-2

---

## Resumen de dependencias

```
US-E1-1 (Código) → US-E1-2 (Vincular) → US-E2-1 (Tarea) → US-E2-2 (Energía) → US-E2-3 (Plato)
US-E1-4 (Firma+dedupe) es prerequisito del webhook completo
US-E2-1 → US-E2-4 (Gasto sensible) · US-E2-5 (Deshacer)
US-E2-2 → US-E3-1 (Audio) → US-E3-2 (Foto) · US-E4-2 (Batch multimodal)
US-E2-1 → US-E4-1 (Buffer) → US-E4-3 (Bypass)
US-E1-2 → US-E5-1 (Ayuno) → US-E5-2 (Tareas) → US-E5-3 (Cumples) → US-E5-4 (Ventana) → US-E5-5 (Silencio)
US-E2-1 → US-E6-1 (Coach) → US-E6-2 (Registrar+acompañar)
US-E5-5 → US-E7-1 (Panel) · US-E4-1 → US-E7-2 (Observabilidad) → US-E7-3 (Alertas)
```

## Flujos críticos

| Flujo crítico | Stories |
|---------------|---------|
| Vínculo seguro (un número = una usuaria) | US-E1-1, US-E1-2, US-E1-3, US-E1-4 |
| Registro con identidad anclada server-side | US-E2-1, US-E2-2 (SEC-N2) |
| Dinero con confirmación | US-E2-4 |
| Buffer idempotente con dead-letter | US-E4-1 |
| Ventana 24 h con punto único de salida | US-E5-4 |
| Opt-out y silencio | US-E5-5 |

## Stories diferidos (post Core v1)

| Story | Razón | Fase |
|-------|-------|------|
| Resumen semanal del domingo + brújula del lunes | El cartero diario cubre v1 | v1.5 |
| Aviso de fase del ciclo | Ya existe por correo | v1.5 |
| Nota de Aprendizaje por audio largo | Nicho | v1.5 |
| Marcar libro / reto por chat | Frecuencia baja | v1.5 |
| Botones interactivos (marcar hábito con un tap) | Requiere templates interactivos | v2 |
| WhatsApp Flows (crear meta por formulario) | Producto mayor | v2 |
| Respuesta por audio del coach | Costo TTS | v2 |
| Recordatorios conversacionales ("avísame el viernes") | Motor de recordatorios propio | v2 |

---

## Tabla resumen

| Epic | # Stories | P0 | P1 | P2 |
|------|-----------|----|----|----|
| E1: Vínculo y seguridad | 4 | 4 | 0 | 0 |
| E2: Escriba texto | 5 | 5 | 0 | 0 |
| E3: Audio y foto | 2 | 1 | 1 | 0 |
| E4: Buffer | 3 | 1 | 2 | 0 |
| E5: Cartero + ventana | 5 | 5 | 0 | 0 |
| E6: Coach | 2 | 0 | 2 | 0 |
| E7: Panel + observabilidad | 3 | 0 | 2 | 1 |
| **TOTAL** | **24** | **16** | **7** | **1** |

_User stories adaptadas del formato del curso "Agentes de WhatsApp" al producto NucleoOS._
