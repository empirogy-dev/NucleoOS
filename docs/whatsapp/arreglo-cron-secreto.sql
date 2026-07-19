-- ============================================================
-- Cron del motor, LISTO PARA COPIAR Y PEGAR. No hay nada que cambiar.
-- La palabra ya está escrita: motor-nucleoos-2026
--
-- Lo único que tiene que existir en Supabase (Edge Functions → Secrets):
--     Nombre: WA_CRON_SECRET
--     Valor:  motor-nucleoos-2026
--
-- Pegar en el SQL Editor → Run.
-- ============================================================

-- 1) Quitar el cron anterior si estaba puesto
do $$
begin
  if exists (select 1 from cron.job where jobname = 'nucleoos-wa-motor') then
    perform cron.unschedule('nucleoos-wa-motor');
  end if;
end $$;

-- 2) Programarlo de nuevo, ya con la palabra
select cron.schedule(
  'nucleoos-wa-motor',
  '* * * * *',
  $cron$
  select net.http_post(
    url := 'https://devxnjumkapxqguasgaz.supabase.co/functions/v1/wa-motor',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer motor-nucleoos-2026'
    ),
    body := '{}'::jsonb
  );
  $cron$
);

-- 3) Espera un minuto y corre esta consulta sola:
--    select r.created, r.status_code,
--           case when r.status_code = 200 then 'listo, el motor ya trabaja'
--                when r.status_code = 401 then 'la palabra del secreto no coincide'
--                else 'revisar' end as estado
--    from net._http_response r order by r.created desc limit 3;
