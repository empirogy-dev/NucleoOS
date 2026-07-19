-- ============================================================
-- NucleoOS · Migración 0051 — Núcleo WhatsApp (el Escriba y el Cartero)
-- Las seis tablas del agente de WhatsApp, con RLS explícita en cada una
-- (nada de "sigue el mismo patrón"), y el cron que drena el buffer.
--
-- 1) wa_vinculos: un teléfono = una usuaria. Con sus switches de avisos,
--    su timezone y sus horas de silencio.
-- 2) wa_codigos: códigos de vinculación de 6 dígitos, 10 minutos, un uso.
-- 3) wa_mensajes: historial del chat (dedupe por wamid).
-- 4) wa_lotes: el buffer por silencio, con lease y reintentos.
-- 5) wa_avisos_enviados: la memoria del cartero (como correos_enviados).
-- 6) wa_eventos: observabilidad con lote_id como hilo conductor.
--
-- ⚠️ ANTES DE CORRER: reemplaza PEGA_AQUI_TU_SERVICE_ROLE_KEY por tu
--    service role key (Dashboard → Settings → API → service_role).
--    Esa llave nunca sale de Supabase: vive en la tarea programada.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

-- ---------- 1) Vínculos ----------
create table if not exists public.wa_vinculos (
  user_id uuid primary key references auth.users(id) on delete cascade,
  telefono text not null unique,              -- E.164 con +
  vinculado_en timestamptz not null default now(),
  ventana_expira timestamptz,                 -- último mensaje entrante + 24 h
  timezone text not null default 'America/Vancouver',
  hora_resumen text not null default '09:00',
  silencio_desde text not null default '22:00',
  silencio_hasta text not null default '08:00',
  avisos jsonb not null default '{"ayuno":true,"tareas":true,"cumples":true,"pagos":true,"habitos":true}'::jsonb,
  avisos_activos boolean not null default true
);

-- ---------- 2) Códigos de vinculación ----------
create table if not exists public.wa_codigos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  codigo text not null,
  expira_en timestamptz not null,
  usado boolean not null default false,
  creado_en timestamptz not null default now()
);

-- ---------- 3) Mensajes ----------
create table if not exists public.wa_mensajes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,  -- null si el número no está vinculado
  telefono text not null,
  direccion text not null check (direccion in ('in','out')),
  tipo text not null check (tipo in ('texto','audio','imagen','template','sistema')),
  contenido text,                             -- texto, o JSON {link,mime} para audio/imagen
  wamid text,
  lote_id uuid,
  creado_en timestamptz not null default now()
);
create unique index if not exists uq_wa_mensajes_wamid
  on public.wa_mensajes (wamid) where wamid is not null;
create index if not exists ix_wa_mensajes_telefono on public.wa_mensajes (telefono, creado_en desc);

-- ---------- 4) Lotes (buffer por silencio) ----------
create table if not exists public.wa_lotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  estado text not null default 'en_buffer'
    check (estado in ('en_buffer','procesando','listo','cancelado')),
  procesar_despues_de timestamptz not null,
  lease_hasta timestamptz,
  intentos int not null default 0,
  decision text,
  creado_en timestamptz not null default now()
);
create index if not exists ix_wa_lotes_pendientes
  on public.wa_lotes (procesar_despues_de) where estado = 'en_buffer';

-- ---------- 5) Memoria del cartero ----------
create table if not exists public.wa_avisos_enviados (
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null,
  clave text not null,
  enviado_en timestamptz not null default now(),
  primary key (user_id, tipo, clave)
);

-- ---------- 6) Observabilidad ----------
create table if not exists public.wa_eventos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  lote_id uuid,
  tipo text not null,        -- inbound | decision | tool | envio | error | aviso | desconocido
  detalle jsonb not null default '{}'::jsonb,
  creado_en timestamptz not null default now()
);
create index if not exists ix_wa_eventos_lote on public.wa_eventos (lote_id);
create index if not exists ix_wa_eventos_usuario on public.wa_eventos (user_id, creado_en desc);

-- ============================================================
-- RLS explícita en las seis tablas (SEC-N8).
-- La usuaria ve lo suyo desde Ajustes; TODAS las escrituras del agente
-- entran por el service role del servidor.
-- ============================================================
alter table public.wa_vinculos enable row level security;
alter table public.wa_codigos enable row level security;
alter table public.wa_mensajes enable row level security;
alter table public.wa_lotes enable row level security;
alter table public.wa_avisos_enviados enable row level security;
alter table public.wa_eventos enable row level security;

-- Vínculo: ver, ajustar switches y desvincular. Crear NO (solo el bot al validar el código).
create policy wa_vinculo_ver on public.wa_vinculos for select using (auth.uid() = user_id);
create policy wa_vinculo_editar on public.wa_vinculos for update using (auth.uid() = user_id);
create policy wa_vinculo_borrar on public.wa_vinculos for delete using (auth.uid() = user_id);

-- Códigos: la usuaria genera y ve los suyos.
create policy wa_codigos_ver on public.wa_codigos for select using (auth.uid() = user_id);
create policy wa_codigos_crear on public.wa_codigos for insert with check (auth.uid() = user_id);

-- Historial y eventos: solo lectura de lo propio (para el panel de Ajustes).
create policy wa_mensajes_ver on public.wa_mensajes for select using (auth.uid() = user_id);
create policy wa_eventos_ver on public.wa_eventos for select using (auth.uid() = user_id);

-- wa_lotes y wa_avisos_enviados: sin políticas a propósito, solo el servidor.

-- ============================================================
-- Cron: drenar el buffer cada minuto (el cartero llega en la fase 5).
-- ============================================================
create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'nucleoos-wa-motor') then
    perform cron.unschedule('nucleoos-wa-motor');
  end if;
end $$;

select cron.schedule(
  'nucleoos-wa-motor',
  '* * * * *',
  $cron$
  select net.http_post(
    url := 'https://devxnjumkapxqguasgaz.supabase.co/functions/v1/wa-motor',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer PEGA_AQUI_TU_SERVICE_ROLE_KEY'
    ),
    body := '{}'::jsonb
  );
  $cron$
);
