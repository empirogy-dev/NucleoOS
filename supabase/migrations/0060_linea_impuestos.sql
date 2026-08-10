-- 0060: a qué línea del formulario de impuestos corresponde cada categoría.
--
-- En Canadá, quien trabaja por cuenta propia declara sus gastos en el
-- formulario T2125, que no pide una lista de boletas: pide un total por cada
-- línea numerada del formulario. Guardar aquí a qué línea va cada categoría
-- es lo que convierte un año de gastos en los números que se copian a la
-- declaración.
--
-- Queda vacío a propósito. Decidir que Bencina va a la línea 9281 y no a la
-- 9224 es una decisión contable, no técnica, y la toma ella o su contador.
-- La app propone, guarda y suma; no decide.

alter table public.categories
  add column if not exists tax_line text;

comment on column public.categories.tax_line is
  'Línea del formulario de impuestos a la que suma esta categoría, por ejemplo 8521. La elige la persona.';
