-- 0070: qué parte de una categoría es del negocio.
--
-- Hay gastos que no son ni personales ni de la empresa, son las dos cosas: el
-- teléfono, el internet de la casa, la mantención del auto que se usa para
-- trabajar y también para ir al supermercado. Hoy la app los manda enteros a
-- una línea de impuestos, y eso deja el resumen mal en las dos direcciones:
-- deduce de más si va todo al negocio, y deduce de menos si no va nada.
--
-- El porcentaje va en la categoría y no en cada gasto a propósito. Nadie
-- decide gasto por gasto qué parte del teléfono fue de trabajo: se decide una
-- vez, con un criterio, y se aplica a todo. Que es también lo que después hay
-- que poder defender si alguien lo pregunta.
--
-- Nulo significa cien por ciento, para que nada cambie sin que se pida.

alter table public.categories
  add column if not exists business_pct smallint
    check (business_pct is null or business_pct between 0 and 100);

comment on column public.categories.business_pct is
  'Qué parte de esta categoría es gasto del negocio, de 0 a 100. Nulo = 100.';
