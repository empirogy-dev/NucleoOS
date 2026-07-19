-- ============================================================
-- Reprogramar el cron del motor usando TU palabra secreta.
--
-- Antes: el cron llevaba la service role key (frágil, porque Supabase
-- cambió de sistema de llaves, y encima obligaba a pegar un secreto
-- crítico dentro de un SQL).
-- Ahora: lleva la palabra que TÚ inventas en WA_CRON_SECRET. Si algún
-- día se filtra, solo sirve para despertar el motor un minuto antes.
--
-- ANTES DE CORRER:
--   1. En Supabase → Edge Functions → Secrets, crea el secreto
--      WA_CRON_SECRET con una palabra tuya (ej: motor-nucleoos-2026).
--   2. Vuelve a desplegar wa-motor con el código nuevo del repo.
--   3. Apaga otra vez "Verify JWT with legacy secret" en wa-motor.
--   4. Pega esto en el SQL Editor, reemplaza AQUÍ la palabra y Run.
-- ============================================================

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
      'Authorization', 'Bearer ESCRIBE_AQUI_TU_PALABRA_DE_WA_CRON_SECRET'
    ),
    body := '{}'::jsonb
  );
  $cron$
);

-- Un minuto después de correr esto, comprueba que el motor ya trabaja:
--   status_code 200 = ✅ funcionando · 401 = la palabra no coincide
select r.created, r.status_code, left(r.content, 120) as respuesta
from net._http_response r order by r.created desc limit 3;
