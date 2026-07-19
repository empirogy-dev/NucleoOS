---
proyecto: NucleoOS — Agente de WhatsApp
doc: arquitectura objetivo + arranque
actualizado: 2026-07-19
relacionado: BRIEF.md
---

# Arquitectura objetivo, cómo queda hecho y cómo arrancar

> Complementa `BRIEF.md`. El brief dice *qué* (los tres roles y los módulos); esto dice *cómo se ve
> terminado*, *qué data model* y *qué se hace el día 1*.
> Todo se construye **dentro del repo NucleoOS**: Edge Functions en `supabase/functions/`,
> migraciones en `supabase/migrations/`, panel en `app/src/ajustes/`.

---

## 1. Cómo se ve cuando está hecho

El agente es **una Edge Function que recibe WhatsApp y escribe en las tablas de NucleoOS**, más un
**cron cartero** que lee esas mismas tablas y avisa. No hay servidor nuevo, no hay base de datos
nueva, no hay frontend nuevo (solo una tarjeta en Ajustes).

### Runtime (de la entrada del mensaje a la respuesta)

```
WhatsApp (YCloud)
        │  webhook inbound
        ▼
[1] Edge Function `wa-entrada`   → valida firma YCloud, normaliza a evento único
        │                          {telefono, user_id (por wa_vinculos), type, text|audio|imagen, wamid, ts}
        │                          audio → se descarga y se guarda la referencia para Gemini
        ▼
[2] Buffer por silencio ⭐        → inserta en `wa_mensajes` con estado "en_buffer";
        │                          `wa_lotes` guarda "procesar_despues_de" = ahora + 20 s
        │                          (cada mensaje nuevo del mismo número EMPUJA ese timestamp)
        ▼
[3] Cron `wa-motor` (cada minuto) → toma lotes vencidos, arma el bloque semántico
        │                          (texto + audio transcrito + captions, en orden)
        ▼
[4] Motor de DECISIÓN             → ¿registrar? ¿responder? ¿ambos? ¿confirmar? ¿abstenerse?
        │                          comandos directos (vincular, deshacer) hacen bypass en [1]
        ▼
[5] Gemini con tool-calling       → mismo patrón server-side de la función `ia`:
        │        ▲                  prompt del agente + resumen de la usuaria + DIRECTIVA_IDIOMA
        │        │ tools             + tope diario `ia_uso` compartido
        ▼        │
[6] Capa de Tools NucleoOS ◄──────┘ escriben con service role ACOTADO al user_id del vínculo:
        │                          registrar_plato → meals · registrar_ejercicio → exercise_logs ·
        │                          crear_tarea → day_tasks · marcar_habito → habit_logs ·
        │                          registrar_gasto → transactions · marcar_ayuno → user_kv · …
        ▼
[7] Salida YCloud                 → texto libre (ventana <24 h) | template aprobado (fuera de ventana)
        ▼
[8] Persistencia + Observabilidad → `wa_eventos` (batch, decisión, tools, respuesta, errores)

   Cartero (transversal, independiente del chat):
   Cron `wa-cartero` (cada 15 min) → lee meals/user_kv (ayuno), day_tasks, relationships,
   reminders, habits/habit_logs, challenges, cycles → dedupe en `wa_avisos_enviados` →
   respeta horas de silencio y switches → envía template o texto según ventana.
```

### Superficies
- **Ajustes → WhatsApp** (única UI nueva): código de vinculación · estado del vínculo ·
  switches por tipo de aviso · horas de silencio · últimos registros hechos por chat.
- **No hay inbox.** La conversación vive en WhatsApp; los datos, en los módulos de la app.

### Modelo de datos (Supabase, objetivo)

**Tablas nuevas (migración `0052_whatsapp.sql` en adelante):**
- `wa_vinculos` — user_id · telefono (E.164, único) · vinculado_en · avisos jsonb (switches:
  ayuno, tareas, cumples, pagos, habitos, retos, brujula, ciclo) · silencio_desde/hasta ·
  hora_resumen · timezone.
- `wa_codigos` — user_id · codigo (6 dígitos) · expira_en · usado (vinculación desde Ajustes).
- `wa_mensajes` — id · user_id · direccion (in/out) · tipo (texto/audio/imagen/template) ·
  contenido · wamid · lote_id · creado_en.
- `wa_lotes` — id · user_id · estado (en_buffer/procesando/listo) · procesar_despues_de ·
  decision · creado_en (el buffer del §2 del brief).
- `wa_avisos_enviados` — user_id · tipo · clave_dedupe (ej. fecha, o ISO del inicio del ayuno) ·
  enviado_en (mismo patrón que `correos_enviados`).
- `wa_eventos` — log de observabilidad (jsonb, TTL 30 días).

**Tablas existentes que el agente escribe** (ninguna cambia):
`meals` · `energy_logs` · `routine_logs` · `exercise_logs` · `habit_logs` · `challenge_logs` ·
`day_tasks` · `transactions` · `goals` · `relationship_logs` · `activity_log` · `work_logs` ·
`journal_entries` · `notebook_entries` · `appointments` · `health_profile` · `user_kv`
(claves del espejo: `nucleoos-ayuno-manual`, `nucleoos-mente`, `nucleoos-libros-estado`).

**Tablas existentes que el Cartero lee:**
`meals` + `user_kv` (fin de ayuno) · `day_tasks` (tareas de hoy) · `relationships` (cumpleaños,
reconectar) · `reminders` (pagos) · `habits`/`habit_logs` (noche) · `challenges`/`challenge_logs`
(reto) · `objectives`/`objective_milestones` (brújula) · `cycles` (fase).

### La pieza clave: la capa de Tools NucleoOS (mismo contrato del curso, tools propias)

```ts
interface Tool {
  name: string;                  // "registrar_ejercicio"
  description: string;           // para el tool-calling de Gemini
  schema: JsonSchema;            // args: { tipo: "Gimnasio", minutos: 30, fecha?: "2026-07-19" }
  sensible?: boolean;            // true => el motor confirma antes de ejecutar (dinero, salud)
  run(args, ctx): Promise<ToolResult>;  // ctx: user_id, timezone, idioma, supabase (service acotado)
}
// registrar_plato:     run() => estima macros con Gemini (mismo prompt del plato de la app) e inserta en meals
// registrar_ejercicio: run() => inserta en exercise_logs; el automarcado de hábitos y las metas se enteran solos
// registrar_gasto:     run() => sugiere categoría con merchant_rules e inserta en transactions   [sensible]
// marcar_ayuno:        run() => upsert user_kv "nucleoos-ayuno-manual" {i, en} (formato del espejo)
// crear_tarea:         run() => inserta en day_tasks con la fecha local de la usuaria
// deshacer:            run() => borra el último registro creado por el agente (<24 h, solo suyos)
// ver_dia (lectura):   run() => tareas + hábitos pendientes + próximo pago, para el Coach
```

Toda tool **confirma en una línea** y deja su llamada en `wa_eventos`. Las tools de lectura
alimentan al Coach; las de escritura son el Escriba.

---

## 2. Cómo arrancar HOY (día 1, sesión dedicada)

> Estrategia idéntica al curso: **MVP del camino feliz primero**, luego capas.
> Requisito previo de Bárbara: cuenta YCloud + número de WhatsApp (el curso lo cubre).

1. **Docs YCloud** a mano: inbound webhook, send message, media download, templates, status.
2. **Migración `0052_whatsapp.sql`**: `wa_vinculos`, `wa_codigos`, `wa_mensajes`, `wa_lotes`,
   `wa_avisos_enviados`, `wa_eventos` (RLS: solo service role; la usuaria lee su vínculo).
3. **Edge Function `wa-entrada`**: webhook YCloud → normalizar → `vincular` como primer comando
   que funciona de punta a punta.
4. **Camino feliz sin buffer**: texto → Gemini con 3 tools (`crear_tarea`, `registrar_ejercicio`,
   `registrar_agua`) → confirmación por texto libre. *Probar: "recuérdame comprar pan" aparece en la app.*
5. **Audio**: descargar de YCloud → Gemini → mismo motor. *Probar el caso estrella: audio de gimnasio.*
6. **Buffer inteligente** (`wa_lotes` + cron `wa-motor` cada minuto) + resto de tools del Escriba.
7. **Cartero v1** (cron `wa-cartero`): fin de ayuno + tareas del día + cumpleaños, con
   `wa_avisos_enviados` y templates aprobados (mandarlos a aprobación de Meta **el día 1**, demoran).
8. **Panel en Ajustes** + `deshacer` + horas de silencio.
9. **Recién entonces**: pulir Coach (tools de lectura, resumen), foto del plato, v1.5.

---

## 3. Reusar de lo ya construido (no reinventar)

- **Edge Function `ia`**: el patrón completo de Gemini server-side ya existe (secreto
  `GEMINI_API_KEY`, tope `ia_uso`, caps de tamaño). El motor del agente lo replica y comparte contador.
- **Edge Function `correos` + pg_cron (0046)**: el patrón de cron con service key y el dedupe
  (`correos_enviados`) son el molde exacto de `wa-cartero` y `wa-avisos_enviados`.
- **El espejo `user_kv` (0044)**: ayuno, mente y libros ya viven en la nube con claves conocidas;
  el agente lee y escribe el mismo formato (`{i, en}` para el ayuno, con la regla de "tu palabra
  manda si es posterior al último plato").
- **El prompt del plato** (`fichaLibro`/`plato` en `ia.ts`): la estimación de macros por texto o
  foto se reutiliza tal cual para `registrar_plato`.
- **`DIRECTIVA_IDIOMA` + `conIdioma()`**: el agente responde en el idioma de Ajustes gratis.
- **`merchant_rules`**: la categorización de gastos ya aprendida sirve para `registrar_gasto`.
- **Shapes YCloud del curso** (confirmados en el repo de referencia del curso):
  ```
  body.whatsappInboundMessage = { from:"+1…", to:"+1…", type:"text|audio|image",
                                  text:{ body }, customerProfile:{ name }, wamid, … }
  ```
  Envío: `POST https://api.ycloud.com/v2/whatsapp/messages`, idioma `es` (NO `es_CL`),
  teléfono a veces llega sin `+`, componentes del template deben calzar exacto.

**Lo que NO se trae del curso:** inbox multi-tenant, CRM, setter, HighLevel, roles de equipo,
Next.js. NucleoOS ya tiene producto, usuarios y frontend; el agente es un canal, no otra app.

---

## 4. Decisiones para la sesión dedicada

- **Buffer en Postgres, no en memoria**: las Edge Functions son efímeras; el estado del buffer
  vive en `wa_lotes` y un cron cada minuto lo drena. Simple y a prueba de reinicios.
- **Service role acotado**: las tools reciben un cliente que SIEMPRE filtra por el user_id del
  vínculo. Un teléfono jamás puede escribir en datos de otra usuaria.
- **Templates primero**: mandar los 6 templates v1 a aprobación de Meta el primer día; sin
  templates aprobados el Cartero solo funciona con ventana abierta.
- **Timezone por vínculo** (def. America/Vancouver): "ayer" y las horas de silencio se resuelven
  ahí, no en UTC.
- **Idempotencia por `wamid`**: YCloud puede reintentar el webhook; un wamid ya visto se ignora.
- **Un solo bolsillo de IA**: `ia_uso` compartido evita que WhatsApp queme el tope del coach.
- **Los avisos y las tools no se pisan**: el Cartero corre aunque la usuaria nunca escriba;
  el Escriba funciona aunque los avisos estén apagados.
- **Migración de canal futura**: si algún día se cambia YCloud por Meta directo, solo cambian
  [1] y [7]; el motor, las tools y el cartero no se tocan (misma lección del cutover del curso).
