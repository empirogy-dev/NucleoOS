-- ============================================================
-- Diagnóstico del agente: ¿dónde se atascó un mensaje?
-- Pégalo en el SQL Editor de Supabase y dale Run.
-- Corre las 5 consultas de una y mira los resultados por bloque.
-- ============================================================

-- 1) ¿Llegaron mis mensajes? (deberían aparecer los que le mandaste al bot)
select creado_en, direccion, tipo, left(coalesce(contenido, ''), 60) as contenido,
       case when lote_id is null then 'sin lote' else 'en lote' end as lote
from public.wa_mensajes
order by creado_en desc limit 10;

-- 2) ¿Se crearon lotes y en qué estado quedaron?
--    en_buffer = esperando · procesando = el motor lo tomó · listo = respondido
--    cancelado = falló 3 veces
select estado, intentos, decision, procesar_despues_de, creado_en
from public.wa_lotes
order by creado_en desc limit 5;

-- 3) ¿Qué registró el agente? (aquí salen los errores con su mensaje)
select creado_en, tipo, detalle
from public.wa_eventos
order by creado_en desc limit 15;

-- 4) ¿El cron está programado y activo?
select jobname, schedule, active,
       case when command like '%PEGA_AQUI%' then '❌ le falta la llave'
            when command like '%Bearer eyJ%' then '✅ tiene la llave'
            else '❓ revisar' end as llave
from cron.job where jobname = 'nucleoos-wa-motor';

-- 5) ¿El cron corrió y qué respondió el motor?
--    status_code 200 = el motor trabajó · 401 = la llave del cron está mala
select r.created, r.status_code, left(r.content, 200) as respuesta, r.error_msg
from net._http_response r
order by r.created desc limit 5;
