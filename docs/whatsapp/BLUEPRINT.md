# BLUEPRINT — Núcleo WhatsApp (Core v1)

> **Proyecto:** NucleoOS, agente de WhatsApp · **Fecha:** 2026-07-19
> **Inputs:** `BRIEF.md` (tres roles + módulos) · `ARQUITECTURA-OBJETIVO.md` (runtime) ·
> `USER-STORIES.md` (24 stories) · `SECURITY-AUDIT.md` (SEC-N bloqueantes)
> **Estado:** listo para construir por fases. Cada fase cierra con su checklist del SECURITY-AUDIT.

---

## 1. Resumen ejecutivo

El agente son **dos Edge Functions y dos crons** sobre el Supabase que ya existe:

| Pieza | Qué hace |
|-------|----------|
| `wa-entrada` (Edge Function, webhook) | Valida el secret token de Telegram, normaliza (chat_id, texto, voz, foto), dedupe por update_id, comandos bypass, encola en el buffer |
| `wa-motor` (Edge Function, cron cada minuto) | Drena lotes vencidos, decide, llama a Gemini con tools, escribe en la app, responde |
| `wa-cartero` (Edge Function, cron cada 15 min) | Lee las tablas de la app, calcula avisos, dedupe, despacha con ventana/templates |
| `despachar()` (módulo compartido) | ÚNICO punto de salida al canal: en Telegram siempre texto libre; si vuelve WhatsApp, aquí viven ventana y templates |

**Estrategia:** camino feliz primero (F1 vínculo → F2 Escriba texto), después audio, buffer,
cartero, coach y panel. Los templates de Meta se mandan a aprobar en F1 porque demoran.

## 2. Decisiones fijas

Las del `BRIEF.md` §Decisiones fijas. Recordatorio de las tres que definen el código:
**Telegram Bot API** (gratis, sin ventana; YCloud rechazó el país y Meta cobra los avisos; WhatsApp queda como canal premium futuro, solo cambian [1] y [7]) · **Gemini vía Edge Function con `ia_uso` compartido** · **cero tablas espejo**
(las tools escriben en las tablas reales de la app).

---

## 3. Esquema de base de datos (migración `0051_whatsapp.sql`)

> Patrón heredado del repo: RLS explícita en la misma migración, `gen_random_uuid()`, dedupe por
> índice único parcial, espejo `user_kv` intacto. La usuaria corre la migración a mano en el SQL
> Editor, como siempre.

```sql
-- ============================================
-- 0051: Núcleo WhatsApp (vínculos, buffer, cartero, observabilidad)
-- ============================================

create table wa_vinculos (
  user_id uuid primary key references auth.users(id) on delete cascade,
  telefono text not null unique,              -- E.164 con +
  vinculado_en timestamptz not null default now(),
  ventana_expira timestamptz,                 -- último inbound + 24 h (SEC-N4)
  timezone text not null default 'America/Vancouver',
  hora_resumen time not null default '09:00',
  silencio_desde time not null default '22:00',
  silencio_hasta time not null default '08:00',
  avisos jsonb not null default '{"ayuno":true,"tareas":true,"cumples":true,"pagos":true,"habitos":true}'::jsonb,
  avisos_activos boolean not null default true  -- el comando "silencio" apaga esto
);

create table wa_codigos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  codigo text not null,                       -- 6 dígitos
  expira_en timestamptz not null,             -- now() + 10 min
  usado boolean not null default false,
  creado_en timestamptz not null default now()
);

create table wa_mensajes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,  -- null si desconocido
  telefono text not null,
  direccion text not null check (direccion in ('in','out')),
  tipo text not null check (tipo in ('texto','audio','imagen','template','sistema')),
  contenido text,                             -- texto / transcripción / caption
  wamid text,
  lote_id uuid,
  creado_en timestamptz not null default now()
);
create unique index uq_wa_mensajes_wamid on wa_mensajes (wamid) where wamid is not null;  -- SEC-N1

create table wa_lotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  estado text not null default 'en_buffer'
    check (estado in ('en_buffer','procesando','listo','cancelado')),
  procesar_despues_de timestamptz not null,   -- se EMPUJA con cada mensaje (silencio)
  lease_hasta timestamptz,                    -- reclaim de colgados (SCALE-N1)
  intentos int not null default 0,            -- 3 → cancelado (dead-letter)
  decision text,                              -- registrar | responder | ambos | confirmar | abstener
  creado_en timestamptz not null default now()
);
create index ix_wa_lotes_pendientes on wa_lotes (procesar_despues_de) where estado = 'en_buffer';

create table wa_avisos_enviados (               -- dedupe del cartero (patrón correos_enviados)
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null,                         -- ayuno | tareas | cumple | pago | habitos
  clave text not null,                        -- fecha, o ISO del inicio del ayuno, o persona+fecha
  enviado_en timestamptz not null default now(),
  primary key (user_id, tipo, clave)
);

create table wa_eventos (                       -- observabilidad con trace (OBS-N1/N2)
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  lote_id uuid,                               -- correlador del turno completo
  tipo text not null,                         -- inbound | decision | tool | envio | error | aviso
  detalle jsonb not null default '{}'::jsonb, -- SIEMPRE pasado por el logger con redacción
  creado_en timestamptz not null default now()
);
create index ix_wa_eventos_lote on wa_eventos (lote_id);
-- TTL 30 días: job de limpieza en el mismo cron del cartero

-- ============================================
-- RLS explícita (SEC-N8): nada de "sigue el mismo patrón"
-- ============================================
alter table wa_vinculos enable row level security;
alter table wa_codigos enable row level security;
alter table wa_mensajes enable row level security;
alter table wa_lotes enable row level security;
alter table wa_avisos_enviados enable row level security;
alter table wa_eventos enable row level security;

-- La usuaria ve y borra SU vínculo y genera SUS códigos:
create policy vinculo_propio on wa_vinculos for select using (auth.uid() = user_id);
create policy vinculo_borrar on wa_vinculos for delete using (auth.uid() = user_id);
create policy vinculo_editar on wa_vinculos for update using (auth.uid() = user_id);  -- switches
create policy codigos_propios on wa_codigos for select using (auth.uid() = user_id);
create policy codigos_crear on wa_codigos for insert with check (auth.uid() = user_id);
-- Historial visible en Ajustes (solo lectura):
create policy mensajes_propios on wa_mensajes for select using (auth.uid() = user_id);
create policy eventos_propios on wa_eventos for select using (auth.uid() = user_id);
-- wa_lotes y todas las escrituras server-side: SIN políticas de cliente (solo service role).

-- ============================================
-- Cron (mismo patrón que 0046, la usuaria pega su service key)
-- ============================================
-- select cron.schedule('wa-motor',   '* * * * *',    $$ select net.http_post(...función wa-motor...) $$);
-- select cron.schedule('wa-cartero', '*/15 * * * *', $$ select net.http_post(...función wa-cartero...) $$);
```

**Tablas de la app que el agente toca** (sin cambios de esquema): escribe en `meals`,
`energy_logs`, `routine_logs`, `exercise_logs`, `habit_logs`, `challenge_logs`, `day_tasks`,
`transactions`, `goals`, `relationship_logs`, `activity_log`, `work_logs`, `journal_entries`,
`notebook_entries`, `appointments`, `health_profile`, `user_kv`; el cartero lee `meals`, `user_kv`,
`day_tasks`, `relationships`, `reminders`, `habits`, `habit_logs`, `challenges`, `challenge_logs`.

---

## 4. Motor del agente

### 4.1 `wa-entrada` (webhook)

```
1. leer rawBody ANTES de parsear · verificar HMAC (timestamp + "." + rawBody), tolerancia 5 min
2. filtrar echo events · normalizar teléfono a E.164 con +
3. dedupe por wamid (insert or ignore)
4. resolver vínculo: sin vínculo → respuesta única fija (sin LLM) + silencio 24 h (SEC-N1)
5. comandos bypass: "vincular <código>" · "deshacer" · "silencio" · "avisos" · respuestas sí/no
   a confirmación pendiente → se procesan al instante
6. resto: insertar wa_mensajes + upsert wa_lotes (procesar_despues_de = now() + 20 s,
   +15 s de gracia si es audio) · actualizar ventana_expira = now() + 24 h
7. audio/imagen: descargar SOLO de hosts YCloud (SEC-N5), guardar referencia para el motor
8. responder 200 SIEMPRE (los errores van a wa_eventos)
```

### 4.2 `wa-motor` (cron cada minuto)

```
1. tomar lotes con procesar_despues_de <= now() y estado en_buffer
   FOR UPDATE SKIP LOCKED · lease_hasta = now() + 5 min · intentos + 1
2. reclaim: lotes en procesando con lease vencido vuelven a en_buffer; intentos >= 3 → cancelado
   + wa_eventos tipo error (dead-letter, SCALE-N1)
3. armar bloque semántico: mensajes del lote en orden (texto + transcripciones + captions,
   etiquetados por origen)
4. tope de presupuesto: ia_uso del día (compartido con la app) + 20 turnos/hora por vínculo
   → si excede: respuesta fija amable sin LLM (COST-N1)
5. Gemini con tool-calling: prompt del agente (persona coach + reglas del Escriba + guardrails
   + DIRECTIVA_IDIOMA) + contexto corto del día
6. decisión: registrar | responder | ambos | confirmar | abstener (queda en wa_lotes.decision)
7. ejecutar tools (máx 5 por turno) vía ToolContext (SEC-N2); sensibles → guardar confirmación
   pendiente y preguntar (SEC-N3)
8. responder vía despachar() · marcar lote listo · todo el turno a wa_eventos con lote_id
```

### 4.3 `wa-cartero` (cron cada 15 min)

```
para cada vínculo con avisos_activos:
  1. calcular candidatos: fin de ayuno (regla ultimaComida de la app: último bocado de meals
     vs marca manual de user_kv, la posterior manda) · tareas a la hora_resumen · cumpleaños
     (día antes y día) · pagos (2 días antes y el día) · hábitos sin marcar a las 20:30
  2. filtrar por switches (avisos jsonb) y horas de silencio (retener y agrupar a la mañana)
  3. dedupe contra wa_avisos_enviados (tipo + clave)
  4. tope diario (5): agrupar lo agrupable en un mensaje
  5. despachar() cada aviso · registrar en wa_avisos_enviados + wa_eventos
además: limpiar wa_eventos > 30 días y wa_codigos vencidos
```

### 4.4 `despachar()` (único punto de salida, SEC-N4)

```ts
async function despachar(vinculo, mensaje: { texto?: string; template?: NombreTemplate; vars?: string[] }) {
  const abierta = vinculo.ventana_expira && new Date(vinculo.ventana_expira) > new Date();
  if (abierta && mensaje.texto) return ycloudTexto(vinculo.telefono, mensaje.texto);
  const t = TEMPLATES[mensaje.template ?? "aviso_generico"];   // aprobados por Meta, idioma es/en
  if (!t?.aprobado) { log("retenido_sin_template"); return; }   // fail-safe: no se envía
  return ycloudTemplate(vinculo.telefono, t, mensaje.vars);
}
```

---

## 5. Capa de Tools

```ts
interface ToolContext {
  userId: string;          // del vínculo, JAMÁS del LLM (SEC-N2)
  timezone: string;
  idioma: "es" | "en" | "pt";
  db: DbAcotada;           // wrapper del service role que inyecta eq("user_id", userId) SIEMPRE
}

interface Tool {
  name: string;
  description: string;     // para el tool-calling de Gemini
  schema: JsonSchema;      // SIN user_id, SIN teléfono, SIN ids ajenos
  sensible?: boolean;      // dinero y salud clínica → confirmación dura (SEC-N3)
  run(args, ctx: ToolContext): Promise<{ ok: boolean; resumen: string }>;
}
```

**Catálogo v1 (escritura):** `crear_tarea` · `completar_tarea` · `registrar_ejercicio` ·
`registrar_agua` · `registrar_sueno` · `registrar_energia` · `registrar_plato` (estima macros con
el prompt de la app) · `marcar_ayuno` (user_kv, formato `{i, en}`) · `marcar_habito` ·
`marcar_reto` · `registrar_gasto` 🔒 · `registrar_ingreso` 🔒 · `aportar_meta` 🔒 ·
`registrar_interaccion` · `registrar_avance` · `registrar_jornada` · `escribir_diario` ·
`crear_nota` · `actualizar_ficha` 🔒 · `crear_cita` · `deshacer`.
**Lectura (para el Coach):** `ver_dia` · `ver_semana` · `ver_proximo_pago` · `ver_racha`.
Toda tool devuelve un `resumen` de una línea que el motor usa para confirmar.

---

## 6. Reuso (no reinventar)

| De la casa | Para |
|------------|------|
| Edge Function `ia` (patrón Gemini server-side + `ia_uso`) | El motor entero |
| Edge Function `correos` + cron 0046 + `correos_enviados` | El cartero y su dedupe |
| Espejo `user_kv` 0044 (`nucleoos-ayuno-manual` `{i,en}`, `nucleoos-mente`, `nucleoos-libros-estado`) | `marcar_ayuno`, sesiones, libros |
| Prompt del plato y de visión de `ia.ts` | `registrar_plato` texto y foto |
| `DIRECTIVA_IDIOMA` + `conIdioma()` | Respuestas en es/en/pt |
| `merchant_rules` | Categoría sugerida en `registrar_gasto` |
| Regla `ultimaComida` de `AyunoCard.tsx` | Cálculo del fin de ayuno en el cartero |
| `estimarKcal` + `EXERCISE_KINDS` | `registrar_ejercicio` |
| Del curso: shapes YCloud, gotchas (`es` no `es_CL`, teléfono sin `+`, components exactos) | `wa-entrada` y templates |

---

## 7. Roadmap por fases

| Fase | Entrega | Stories | Cierra con |
|------|---------|---------|------------|
| **F1** | Migración 0051 + `wa-entrada` + vínculo punta a punta + **enviar templates a Meta** | E1 completa | Checklist F1 del SECURITY-AUDIT |
| **F2** | Escriba texto: tarea, ejercicio, agua, sueño, plato, gasto 🔒, `deshacer` | E2 completa | Checklist F2 (identidad + topes + confirmación) |
| **F3** | Audio nativo + foto del plato | E3 | SSRF check |
| **F4** | Buffer con lease/reclaim/dead-letter + `wa_eventos` con trace | E4, US-E7-2 | Checklist F4 |
| **F5** | Cartero: ayuno, tareas, cumples, pagos, hábitos + `despachar()` + silencio/switches | E5 completa | Checklist F5 (¡templates ya aprobados!) |
| **F6** | Coach: tools de lectura, registrar y acompañar | E6 | Tope LLM verificado |
| **F7** | Panel en Ajustes + contador + alertas mínimas | E7 | Checklist final completo |

**Prueba de oro del canal** (equivalente a la de producción de la app): audio real de Bárbara
"hice 30 minutos de gimnasio y me tomé dos vasos de agua" → los dos registros aparecen en la app,
la meta conectada avanza, y a la mañana siguiente llega el resumen de tareas por template.

## 8. Riesgos vivos

Los 8 SEC-N del `SECURITY-AUDIT.md` son bloqueantes por fase. Además, dos operativos:
- **Aprobación de templates de Meta demora días**: se envían en F1 aunque el cartero llegue en F5.
- **YCloud es cuenta nueva de Bárbara**: hasta que exista número y API key, F1 se construye contra
  un mock del shape del curso y se prueba con la cuenta real al final de F1.

_Blueprint adaptado del formato del curso "Agentes de WhatsApp" a la arquitectura real de NucleoOS._
