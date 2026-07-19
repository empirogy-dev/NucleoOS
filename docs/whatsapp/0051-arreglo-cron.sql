-- ============================================================
-- Arreglo puntual: solo reprograma el cron del motor.
--
-- Úsalo si ya corriste la 0051 (las tablas y las políticas quedaron
-- creadas) pero el cron quedó con el marcador en vez de tu llave.
-- Es idempotente: se puede correr las veces que sea.
--
-- CÓMO: pégalo en el SQL Editor de Supabase, reemplaza AHÍ el marcador
-- de la línea del Bearer por tu service role key, y Run.
-- ============================================================

-- 1) ¿Cómo está todo ahora? (mira los resultados antes de seguir)
select 'tablas' as que, string_agg(tablename, ', ' order by tablename) as detalle
from pg_tables where schemaname = 'public' and tablename like 'wa\_%'
union all
select 'politicas', string_agg(policyname, ', ' order by policyname)
from pg_policies where schemaname = 'public' and tablename like 'wa\_%'
union all
select 'cron', coalesce(string_agg(jobname, ', '), 'sin programar')
from cron.job where jobname = 'nucleoos-wa-motor';

-- 2) Reprogramar el cron con la llave buena.
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

-- 3) Comprobar que quedó bien (debe decir "listo: la llave está puesta").
select case
  when command like '%PEGA_AQUI%' then 'ojo: el cron quedó con el marcador, sin llave'
  when command like '%Bearer eyJ%' then 'listo: la llave está puesta'
  else 'revisar a mano'
end as estado
from cron.job where jobname = 'nucleoos-wa-motor';
