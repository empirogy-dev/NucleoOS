-- ============================================================
-- Reprogramar el cron del motor con TU palabra secreta.
--
-- ⬇️⬇️ SOLO TIENES QUE CAMBIAR UNA COSA: la palabra de la línea 14.
--      Pon ahí, entre las comillas, la MISMA palabra que guardaste en
--      el secreto WA_CRON_SECRET (el valor, no el nombre del secreto).
--      Ejemplo: si tu secreto vale motor-nucleoos-2026, la línea queda:
--         mi_palabra text := 'motor-nucleoos-2026';
--
-- Si se te olvida cambiarla, el script se detiene y te avisa, en vez de
-- dejar el cron mal puesto en silencio.
-- ============================================================

do $outer$
declare
  mi_palabra text := 'PON_AQUI_TU_PALABRA';   -- ⬅️ CAMBIA ESTO Y NADA MÁS
  comando text;
begin
  if mi_palabra = 'PON_AQUI_TU_PALABRA' or length(mi_palabra) < 4 then
    raise exception 'Falta tu palabra: cambia PON_AQUI_TU_PALABRA por el valor de tu secreto WA_CRON_SECRET y vuelve a correr esto.';
  end if;

  if exists (select 1 from cron.job where jobname = 'nucleoos-wa-motor') then
    perform cron.unschedule('nucleoos-wa-motor');
  end if;

  comando := format(
    'select net.http_post(url := %L, headers := jsonb_build_object(%L, %L, %L, %L), body := %L::jsonb);',
    'https://devxnjumkapxqguasgaz.supabase.co/functions/v1/wa-motor',
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || mi_palabra,
    '{}'
  );

  perform cron.schedule('nucleoos-wa-motor', '* * * * *', comando);
  raise notice 'Cron reprogramado. En un minuto revisa la consulta de abajo.';
end $outer$;

-- Espera un minuto y corre esto: debe decir "✅ el motor ya trabaja".
select r.created, r.status_code,
       case when r.status_code = 200 then '✅ el motor ya trabaja'
            when r.status_code = 401 then '❌ la palabra no coincide con el secreto'
            else '❓ revisar' end as estado,
       left(r.content, 120) as respuesta
from net._http_response r order by r.created desc limit 3;
