-- ============================================================
-- NucleoOS · Migración 0046 — El cartero automático
-- 1) Tabla correos_enviados: la memoria del cartero, para que ningún
--    recordito ni aviso del ciclo se envíe dos veces. Sin políticas:
--    solo el servidor la toca.
-- 2) Cron diario (16:00 UTC, las 9 de la mañana en Vancouver) que llama
--    a la Edge Function "correos".
--
-- ⚠️ ANTES DE CORRER: reemplaza PEGA_AQUI_TU_SERVICE_ROLE_KEY por tu
--    service role key (Dashboard → Settings → API → service_role).
--    Esa llave nunca sale de Supabase: vive en esta tarea programada.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

create table if not exists public.correos_enviados (
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null,
  ref text not null,
  dia date not null,
  primary key (user_id, tipo, ref)
);

alter table public.correos_enviados enable row level security;
-- Sin políticas a propósito: solo el service role del servidor entra.

create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'nucleoos-correos-diarios') then
    perform cron.unschedule('nucleoos-correos-diarios');
  end if;
end $$;

select cron.schedule(
  'nucleoos-correos-diarios',
  '0 16 * * *',
  $cron$
  select net.http_post(
    url := 'https://devxnjumkapxqguasgaz.supabase.co/functions/v1/correos',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer PEGA_AQUI_TU_SERVICE_ROLE_KEY'
    ),
    body := '{}'::jsonb
  );
  $cron$
);
