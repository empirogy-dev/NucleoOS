---
proyecto: NucleoOS — Agente de WhatsApp
estado: brief de producto v1, adaptado del curso "Agentes de WhatsApp"
actualizado: 2026-07-19
relacionado: ARQUITECTURA-OBJETIVO.md
---

# Núcleo WhatsApp, el escriba y el cartero de NucleoOS

> **No es "solo un bot" y tampoco es un inbox genérico.** Es el **canal conversacional de NucleoOS**:
> un agente de WhatsApp que **registra por ti en la app** (texto, audio y foto), **te avisa
> proactivamente** de lo que importa (tu ayuno, tus tareas, los cumpleaños, tus pagos) y **conversa
> como tu coach** con tus datos reales. El WhatsApp es el robot que rellena la aplicación.

## Qué es (definición corta para el agente)
- Un número de WhatsApp conectado a NucleoOS. Le escribes o le mandas un audio y él **escribe en tu app**.
- **El Escriba**: "hice 30 minutos de gimnasio" → queda registrado en Energía y empuja tus metas conectadas.
- **El Cartero**: "🎉 Completaste tu ayuno de 16 horas" · "🎂 Mañana es el cumpleaños de tu mamá" te llegan solos.
- **El Coach**: le preguntas "¿cómo voy esta semana?" y responde con tus datos, en tu idioma, consciente del TDAH.
- Cada usuaria de NucleoOS vincula **su propio número**: multi-usuario desde el diseño, igual que la app.

## Los tres roles del agente

| Rol | Dirección | Ejemplo |
|-----|-----------|---------|
| **Escriba** | tú → app | Audio: "me comí un bowl de yogur con granola" → plato registrado con macros estimados |
| **Cartero** | app → tú | "⏳ Tu ayuno de 16 h termina a las 9:00" · "📝 Hoy tienes 3 tareas: …" |
| **Coach** | conversación | "¿Qué me toca hoy?" → responde con tu brújula, hábitos y calendario |

## Decisiones fijas (NO re-discutir en el plan)
| Tema | Decisión |
|------|----------|
| Proveedor WhatsApp | **YCloud (único)**, igual que el curso: webhook inbound, send message, templates |
| LLM | **Gemini vía Edge Function** (el mismo motor seguro del coach de la app, con tope diario en `ia_uso`). OpenRouter queda como opción v2 si se quiere rutear modelos |
| Transcripción de audio | **Gemini nativo** (recibe audio directamente, sin servicio aparte) |
| Stack | **Supabase Edge Functions** (webhook + cron) + la app Vite existente. **Sin Next.js**: NucleoOS ya tiene su frontend |
| Multi-usuario | Por **vínculo de número**: tabla `wa_vinculos` (teléfono → user_id), vinculación con código desde Ajustes |
| Dónde escribe | En las **mismas tablas que la app** (`meals`, `exercise_logs`, `day_tasks`, `habit_logs`, `transactions`…). Cero tablas espejo |
| Persona | El coach de NucleoOS: cálido, breve, consciente del TDAH, en el idioma elegido por la usuaria, sin guiones como puntuación |
| Construcción | En el repo NucleoOS (`supabase/functions/` + `app/src/ajustes`) |

## Onboarding (vínculo, no wizard)
1. En **Ajustes → WhatsApp** la app muestra un **código de 6 dígitos** y el número del bot.
2. La usuaria le escribe al bot: `vincular 123456`.
3. El bot confirma, guarda el vínculo (teléfono → user_id) y saluda en su idioma.
4. Desde ese momento puede registrar y recibir avisos. En Ajustes puede **desvincular** o **silenciar por tipo de aviso**.

---

## MÓDULOS

### 1. Vínculo y seguridad (la puerta de entrada)
- Solo números **vinculados** hablan con el agente: un mensaje de un número desconocido recibe una sola respuesta con cómo vincularse, y nada más.
- El código de vinculación **expira** (10 minutos) y es de un solo uso.
- Todo lo que el Escriba escribe va **a nombre del user_id del vínculo**, respetando RLS con service role acotado.
- El **tope diario de IA** (`ia_uso`, 80 usos) es compartido entre la app y WhatsApp: un solo bolsillo.
- Desvincular borra el vínculo y apaga los avisos, sin tocar los datos de la app.

### 2. Buffer y agrupación inteligente ⭐ (diferenciador, igual que el curso)
La gente no escribe en un mensaje: escribe en ráfagas. El agente espera el **silencio de la usuaria** antes de actuar.
- **Delay configurable** (10 a 60 s, por defecto 20 s). El buffer **se reinicia** con cada mensaje nuevo.
- Junta **texto + audio transcrito + caption de foto** en un solo bloque semántico.
- **Reglas por tipo**: si llega un audio, espera un poco más (suele venir un "ah y también…").
- **Bypass**: comandos directos (`vincular`, `deshacer`, respuestas a botones) se procesan al instante.
- **Logs de batch**: qué mensajes entraron juntos y qué decidió el motor con ellos.

### 3. Motor de decisión (qué hacer con cada batch)
El agente decide entre:
- **Registrar** (Escriba): detectó una o varias acciones registrables → ejecuta tools, confirma con un resumen corto.
- **Responder** (Coach): es una pregunta o desahogo → responde con contexto, sin registrar nada.
- **Registrar y responder**: "hice 40 min de gym pero estoy agotada" → registra el ejercicio Y acompaña.
- **Pedir confirmación**: acción sensible o ambigua ("¿eso fue HOY o ayer?", montos de dinero).
- **Abstenerse**: fuera de tope diario, mensaje vacío, número no vinculado.
- Guardrail del coach: **LÍMITE DE ROL** (no escribe código, no hace tareas ajenas a la vida de la usuaria), heredado del prompt de la app.

### 4. El Escriba: qué registra por módulo de NucleoOS 🖋
El corazón del producto. Cada área de la app tiene sus tools de registro. Frases de ejemplo reales:

| Módulo | Qué se puede decir por WhatsApp | Tool → tabla destino |
|--------|-------------------------------|----------------------|
| **Energía / Nutrición** | "me comí un bowl de yogur con frutas" · foto del plato · "tomé 3 vasos de agua" · "me acosté a la 1 y desperté a las 7" · "energía 4 de 5" | `registrar_plato` → `meals` (con macros estimados por Gemini, igual que la foto del plato de la app) · `registrar_agua` / `registrar_energia` → `energy_logs` · `registrar_sueno` → `routine_logs` |
| **Energía / Ayuno** | "acabo de comer" · "empecé mi ayuno a las 8" | `marcar_ayuno` → `user_kv` (`nucleoos-ayuno-manual`, el mismo espejo de la app) |
| **Movimiento** | "hice 30 minutos de gimnasio" · "salí a caminar 20 min" | `registrar_ejercicio` → `exercise_logs` (con kcal estimadas; empuja las metas conectadas y el automarcado de hábitos) |
| **Hábitos y retos** | "marca leer" · "hoy sí medité" · "cumplí el reto del agua" | `marcar_habito` → `habit_logs` · `marcar_reto` → `challenge_logs` |
| **Tareas del día** | "recuérdame comprar pan" · "anota llamar al banco" · "listo lo del banco" | `crear_tarea` / `completar_tarea` → `day_tasks` |
| **Finanzas** | "gasté 12 lucas en café" · "me pagaron 500" · "aporté 100 a mi meta del viaje" | `registrar_gasto` / `registrar_ingreso` → `transactions` (con categoría sugerida por `merchant_rules`) · `aportar_meta` → `goals` |
| **Relaciones** | "llamé a mi mamá, me contó de su viaje" | `registrar_interaccion` → `relationship_logs` (y desactiva el "por reconectar") |
| **Dirección** | "avancé en mi meta: leí 40 páginas" | `registrar_avance` → `activity_log` (alimenta la métrica `area_avances`) |
| **Trabajo** | "trabajé 6 horas en Empirogy, buen día" | `registrar_jornada` → `work_logs` (horas + ánimo si lo menciona) |
| **Mente** | "hice la respiración 4 7 8, 3 minutos" · audio de diario: "hoy me sentí…" | `registrar_sesion` → `user_kv` (`nucleoos-mente`, espejo) · `escribir_diario` → `journal_entries` |
| **Aprendizaje** | "anota en mi cuaderno de inglés: aprendí…" · "terminé Hábitos atómicos" | `crear_nota` → `notebook_entries` · `marcar_libro` → `user_kv` (`nucleoos-libros-estado`) |
| **Salud clínica** | "peso 62.5 hoy" · "tengo hora al dentista el martes 3pm" | `actualizar_ficha` → `health_profile` · `crear_cita` → `appointments` |

**Reglas del Escriba:**
- Siempre **confirma en una línea** lo que registró: "✓ Gimnasio, 30 min, ≈180 kcal. Quedó en Energía."
- Si el batch trae **varias cosas**, registra todas y confirma en una sola respuesta.
- **`deshacer`** borra el último registro hecho por WhatsApp (ventana de 24 h, solo lo que él creó).
- Fechas relativas se resuelven en el **timezone de la usuaria** ("ayer", "esta mañana").
- Lo que no entiende, **pregunta antes de escribir**. Nunca inventa montos ni fechas.

### 5. El Cartero: avisos proactivos por módulo 📮
Los avisos salen de un **cron** que lee las mismas tablas de la app. Cada aviso es **apagable por tipo** desde Ajustes y respeta **horas de silencio** (por defecto 22:00 a 8:00).

| Aviso | Cuándo | Fuente |
|-------|--------|--------|
| ⏳ **Fin de ayuno** | Al completarse la ventana (ej. 16 h desde la última comida) | `user_kv` (ayuno) + `meals` |
| 📝 **Tareas del día** | Mañana (hora elegible, def. 9:00) con las tareas de hoy + lo que quedó de ayer | `day_tasks` |
| 🎂 **Cumpleaños** | El día antes y el día del cumpleaños de un vínculo | `relationships.birthday` |
| 💌 **Tiempo de reconectar** | Cuando pasa el contacto ideal de una persona | `relationships` + `relationship_logs` |
| 🔔 **Pago próximo** | 2 días antes y el día del vencimiento | `reminders` (deudas y tarjetas) |
| ✓ **Hábitos de la noche** | 20:30 si quedan hábitos del día sin marcar | `habits` + `habit_logs` |
| 🔥 **Reto del día** | Recordatorio del reto activo si a las 19:00 no está marcado | `challenges` + `challenge_logs` |
| 🧭 **Brújula de la semana** | Lunes: tu meta más próxima y su siguiente paso | `objectives` + `objective_milestones` |
| 🌙 **Fase del ciclo** | Al empezar una nueva fase, con su consejo | `cycles` (ya existe en el cartero de correos) |
| 📊 **Resumen semanal** | Domingo por la tarde: lo que se movió en la semana | Revisión (v1.5) |

**Regla de oro:** el Cartero **no spamea**. Máximo N avisos al día (configurable, def. 5), agrupa lo agrupable ("Hoy: 3 tareas y el cumpleaños de tu mamá") y cada tipo se envía **una sola vez** (tabla `wa_avisos_enviados`, como `correos_enviados`).

### 6. El Coach: conversación con contexto
- Mismo cerebro que el coach de la app: prompt con **resumen vivo** (visión, metas, hábitos de hoy, sobriedad, vínculos por reconectar) + **DIRECTIVA_IDIOMA** (responde en el idioma elegido en Ajustes).
- Preguntas típicas: "¿cómo voy esta semana?" · "¿qué me toca hoy?" · "dame un consejo para arrancar".
- Puede **usar tools de lectura** (ver tareas, ver próximo pago, ver racha) para responder con números reales.
- Hereda los guardrails: no promete lo que la app no hace, no da consejo médico ni financiero profesional, escala con cariño.

### 7. Media: audio, foto y texto
- **Audio** (el caso estrella): se descarga de YCloud, va a Gemini con el prompt del motor, se trata como texto. El TDAH habla más fácil de lo que escribe.
- **Foto con caption**: si parece comida → flujo del **plato** (mismo prompt que la app: kcal, proteína, carbos, grasas). Si no, se describe y pasa al motor.
- **Texto**: directo al buffer.
- Documentos, videos y stickers: v2 (se responde amable que todavía no se leen).

### 8. Ventana de 24 h y templates Meta ⚠️ (crítico, igual que el curso)
- Si la usuaria escribió hace **menos de 24 h** → el Cartero y el Coach responden con **texto libre**.
- Si la ventana está **cerrada** → los avisos salen **solo como template aprobado por Meta**. Sin excepciones.
- **Templates v1 a aprobar** (una variable por hueco, idioma `es` y `en`): `aviso_ayuno` · `aviso_tareas` · `aviso_cumple` · `aviso_pago` · `aviso_habitos` · `aviso_generico` (texto corto + "responde para ver el detalle").
- Truco de producto: el template invita a responder ("¿quieres el detalle?"), la respuesta **abre la ventana** y ahí el agente conversa libre.
- Gotchas heredados del curso: idioma `es` (NO `es_CL`), teléfono a veces sin `+`, los componentes del request deben calzar exacto con el template.

### 9. Confirmaciones y acciones sensibles
- **Dinero** (`transactions`, `goals`): siempre confirma monto y categoría antes de escribir si el monto supera un umbral (def. 100) o la moneda es ambigua.
- **Borrar**: el agente solo borra con `deshacer` (su propio último registro). Nunca borra datos históricos por chat.
- **Datos clínicos**: registra solo lo dicho explícito, sin inferir.

### 10. Prompting y personalización
- System prompt del agente **versionado en el repo** (como los prompts de `ia.ts`), con secciones: persona · tools · reglas del Escriba · guardrails · idioma.
- **Variables dinámicas**: nombre, idioma, timezone, resumen del día.
- Tono NucleoOS: frases cortas, cero culpa, celebra los logros ("🎉 15 días de racha"). Sin guiones como puntuación.

### 11. Observabilidad (logs mínimos)
`wa_eventos`: mensaje entrante (wamid, tipo) · batch armado · decisión del motor · tools llamadas con resultado · respuesta enviada · estado de ventana · template usado · errores de YCloud. Visible para debugging en SQL; un contador simple en Ajustes ("registros por WhatsApp este mes").

### 12. Panel en Ajustes (la única superficie nueva de UI)
- Estado del vínculo (número, desde cuándo) + botón desvincular.
- Código de vinculación cuando no hay vínculo.
- **Switches por tipo de aviso** + horas de silencio + hora del resumen matinal.
- Últimos 10 registros hechos por WhatsApp (con enlace a su módulo).
- NO hay inbox: la conversación vive en WhatsApp, los datos viven en la app.

### 13. Límites y costos
- IA: comparte `ia_uso` (80/día). El buffer ahorra llamadas: una ráfaga de 4 mensajes = 1 llamada.
- YCloud/Meta: las conversaciones iniciadas por la usuaria son las baratas; los templates del Cartero son "utility". Presupuestar por usuaria activa (~30 conversaciones/mes).
- Fallar en silencio jamás: si el registro falla, el bot lo dice y sugiere hacerlo en la app.

---

## LISTA MAESTRA

### Core v1 (el camino feliz completo)
- Vínculo de número con código desde Ajustes.
- Webhook YCloud → normalizador → buffer inteligente → motor → respuesta.
- Escriba con las tools de mayor frecuencia: **plato (texto), agua, sueño, ejercicio, hábito, tarea, gasto, interacción, avance, jornada, diario, ayuno**.
- Audio transcrito como entrada (Gemini).
- Confirmación en una línea + `deshacer`.
- Cartero v1: **fin de ayuno, tareas del día, cumpleaños, pago próximo, hábitos de la noche**.
- Ventana 24 h + templates aprobados como guardrail duro.
- Coach con contexto y en el idioma de la usuaria.
- Tope diario compartido + horas de silencio.
- Panel en Ajustes (vínculo + switches).

### Nice to have v1.5
Foto del plato por WhatsApp · resumen semanal del domingo · brújula del lunes · fase del ciclo · agrupación de avisos en un solo mensaje matinal · nota de Aprendizaje por audio largo · quiet hours por día de semana · marcar libro/reto por chat.

### v2
Onboarding SaaS multi-usuaria pulido (QR de vinculación) · botones interactivos de WhatsApp (marcar hábito con un tap) · WhatsApp Flows para formularios (nueva meta) · respuesta por audio del coach · OpenRouter para rutear modelos · recordatorios conversacionales creados por chat ("avísame el viernes") · digest configurable por área.

---

## Notas
- **La app manda.** WhatsApp nunca tiene datos propios: escribe y lee las tablas de NucleoOS. Si mañana WhatsApp se cae, la app queda intacta.
- **El espejo `user_kv`** ya sincroniza ayuno, mente, libros e idioma: el agente lo reutiliza tal cual (mismas claves, mismo formato).
- **El cartero de correos** (Edge Function `correos`) sigue vivo para el lazo con otras personas; el Cartero de WhatsApp es para la usuaria misma. Comparten patrón de dedupe.
- **Relación con el curso:** los módulos genéricos del curso que NO aplican aquí (CRM, setter, HighLevel, inbox multi-tenant, roles de equipo) se dejan fuera a propósito: NucleoOS ya es el producto y la única "cliente" de cada agente es su dueña.
