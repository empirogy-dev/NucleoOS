import type { Category, Tx } from "./types";

// Las líneas del formulario T2125 de Canadá, que es donde quien trabaja por
// cuenta propia declara los gastos de su negocio.
//
// El formulario no pide una lista de boletas: pide UN total por cada línea
// numerada. Esto es lo que convierte un año de gastos sueltos en los números
// que se copian a la declaración, o que se le pasan al contador ya sumados.
//
// El nombre oficial va en inglés a propósito: así es como aparece en el
// formulario y en los programas de impuestos, y es lo que hay que buscar al
// momento de llenarlo. Al lado va en español, para entenderlo al elegirlo.
//
// IMPORTANTE: la app no decide a qué línea va cada categoría. Propone la
// lista, guarda lo que ella elige y suma. Decidir que la bencina va a
// "Motor vehicle expenses" y no a "Fuel costs" es una decisión contable.

export interface LineaImpuesto {
  numero: string;
  oficial: string;
  es: string;
  /** Lo que hay que saber al elegirla, cuando no es obvio. */
  ojo?: string;
}

export const LINEAS_T2125: LineaImpuesto[] = [
  { numero: "8521", oficial: "Advertising", es: "Publicidad y promoción" },
  { numero: "8523", oficial: "Meals and entertainment", es: "Comidas y entretención", ojo: "El formulario solo permite deducir una parte de esta línea. La app suma el total; el ajuste lo hace tu declaración." },
  { numero: "8590", oficial: "Bad debts", es: "Deudas incobrables" },
  { numero: "8690", oficial: "Insurance", es: "Seguros del negocio" },
  { numero: "8710", oficial: "Interest and bank charges", es: "Intereses y cargos del banco" },
  { numero: "8760", oficial: "Business taxes, fees, licences and dues", es: "Permisos, licencias y cuotas" },
  { numero: "8810", oficial: "Office expenses", es: "Gastos de oficina" },
  { numero: "8811", oficial: "Office stationery and supplies", es: "Insumos y papelería" },
  { numero: "8860", oficial: "Professional fees", es: "Honorarios: abogado, contador" },
  { numero: "8871", oficial: "Management and administration fees", es: "Administración y gestión" },
  { numero: "8910", oficial: "Rent", es: "Arriendo del local" },
  { numero: "8960", oficial: "Repairs and maintenance", es: "Reparaciones y mantención" },
  { numero: "9060", oficial: "Salaries, wages and benefits", es: "Sueldos y beneficios" },
  { numero: "9180", oficial: "Property taxes", es: "Contribuciones" },
  { numero: "9200", oficial: "Travel expenses", es: "Viajes" },
  { numero: "9220", oficial: "Utilities", es: "Servicios: luz, agua, teléfono" },
  { numero: "9224", oficial: "Fuel costs (except for motor vehicles)", es: "Combustible que no es del auto" },
  { numero: "9275", oficial: "Delivery, freight and express", es: "Envíos y despachos" },
  { numero: "9281", oficial: "Motor vehicle expenses", es: "Gastos del auto", ojo: "Aquí va la bencina del auto, no en la 9224. Si el auto es también personal, el formulario pide la proporción de uso del negocio." },
  { numero: "9270", oficial: "Other expenses", es: "Otros gastos" },
  { numero: "9936", oficial: "Capital cost allowance", es: "Depreciación de bienes", ojo: "Esta línea no se llena con gastos del año: se calcula aparte, sobre los bienes que compraste." },
  { numero: "9945", oficial: "Business-use-of-home expenses", es: "Parte de la casa usada para trabajar", ojo: "Esta línea tiene su propio cálculo en el formulario, según los metros que usas para trabajar." },
];

export const lineaPorNumero = (n: string | null | undefined): LineaImpuesto | undefined =>
  LINEAS_T2125.find((l) => l.numero === n);

export interface TotalLinea {
  linea: LineaImpuesto;
  categorias: Array<{ cat: Category; total: number; cuantos: number }>;
  total: number;
  cuantos: number;
}

export interface ResumenImpuestos {
  moneda: string;
  desde: string;
  hasta: string;
  lineas: TotalLinea[];
  total: number;
  /** Categorías con gasto en el período pero sin línea asignada todavía.
   *  Se muestran a propósito: un resumen que esconde lo que no cuadró es
   *  peor que uno que lo dice. */
  sinLinea: Array<{ cat: Category | null; total: number; cuantos: number }>;
  totalSinLinea: number;
}

/** Los gastos del período sumados por línea del formulario.
 *
 *  Una moneda a la vez, siempre: juntar dólares canadienses con pesos
 *  chilenos en una declaración canadiense daría un número que no existe.
 */
export function resumenImpuestos(
  txs: Tx[],
  categories: Category[],
  opciones: { desde: string; hasta: string; moneda: string; monedaDe: (tx: Tx) => string },
): ResumenImpuestos {
  const { desde, hasta, moneda, monedaDe } = opciones;
  const catPorId = new Map(categories.map((c) => [c.id, c]));

  const gastos = txs.filter((t) =>
    t.type === "expense" && t.date >= desde && t.date <= hasta && monedaDe(t) === moneda);

  const porCategoria = new Map<string, { total: number; cuantos: number }>();
  for (const t of gastos) {
    const clave = t.category_id ?? "";
    const antes = porCategoria.get(clave) ?? { total: 0, cuantos: 0 };
    porCategoria.set(clave, { total: antes.total + Number(t.amount), cuantos: antes.cuantos + 1 });
  }

  const lineas: TotalLinea[] = [];
  for (const linea of LINEAS_T2125) {
    const suyas = [...porCategoria.entries()].flatMap(([catId, n]) => {
      const cat = catPorId.get(catId);
      return cat && cat.tax_line === linea.numero ? [{ cat, total: n.total, cuantos: n.cuantos }] : [];
    }).sort((a, b) => b.total - a.total);
    if (suyas.length === 0) continue;
    lineas.push({
      linea,
      categorias: suyas,
      total: suyas.reduce((s, x) => s + x.total, 0),
      cuantos: suyas.reduce((s, x) => s + x.cuantos, 0),
    });
  }

  const sinLinea = [...porCategoria.entries()].flatMap(([catId, n]) => {
    const cat = catId ? catPorId.get(catId) ?? null : null;
    if (cat?.tax_line) return [];
    return [{ cat, total: n.total, cuantos: n.cuantos }];
  }).sort((a, b) => b.total - a.total);

  return {
    moneda,
    desde,
    hasta,
    lineas,
    total: lineas.reduce((s, l) => s + l.total, 0),
    sinLinea,
    totalSinLinea: sinLinea.reduce((s, x) => s + x.total, 0),
  };
}
