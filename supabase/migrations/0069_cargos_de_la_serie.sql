-- 0069: qué cargos son de esta serie, cuando la app no lo puede saber.
--
-- El caso que lo obligó: Klarna cobra las cuotas de la antena Y el internet
-- mensual, por montos casi iguales, intercalados en el tiempo. Para la app
-- son seis cargos del mismo comercio por el mismo monto, y no hay regla que
-- pueda adivinar que cuatro son una cosa y dos son otra. Solo lo sabe quien
-- hizo la compra.
--
-- Normalmente esta columna va vacía y la serie se calcula sola desde los
-- movimientos, como siempre. Cuando trae una lista, esa lista manda: la serie
-- es exactamente esos cargos, y los que quedan afuera vuelven a agruparse
-- solos y pueden formar su propia serie.

alter table public.recurring_series
  add column if not exists tx_ids uuid[];

comment on column public.recurring_series.tx_ids is
  'Los cargos que la persona asignó a mano a esta serie. Nulo = la serie se calcula sola.';
