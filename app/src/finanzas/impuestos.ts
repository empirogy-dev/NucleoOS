import type { Category, Tx } from "./types";

// A qué línea del formulario de impuestos suma cada categoría de gasto.
//
// Esto depende del PAÍS, no de la moneda. Las líneas numeradas 8521, 8523 y
// compañía son del formulario T2125 de Canadá y no significan nada en otra
// parte. Mostrárselas a alguien en Chile sería peor que no mostrar nada.
//
// Por eso hay un juego de líneas por país, y solo de los países que se
// pueden hacer bien. Inventar una lista para un país que no se conoce, en
// algo que termina en una declaración de impuestos, no es una función: es un
// riesgo.
//
// Y la app nunca decide a qué línea va una categoría. Propone la lista, da
// ejemplos de qué suele ir en cada una, guarda lo que la persona elige y
// suma. La decisión es contable y la toma ella o su contador.

export type PaisImpuestos = "CA" | "CL" | "otro";

export interface LineaImpuesto {
  /** El número del formulario, o un código propio cuando el país no numera. */
  numero: string;
  /** Como aparece en el formulario oficial, para poder buscarlo. */
  oficial: string;
  es: string;
  /** Qué suele ir aquí. Ejemplos, no reglas. */
  ejemplos?: string;
  /** Lo que hay que saber al elegirla, cuando no es obvio. */
  ojo?: string;
}

// ---------- Canadá: formulario T2125 ----------
// Los números y los nombres oficiales salen del formulario del CRA.

export const LINEAS_CA: LineaImpuesto[] = [
  { numero: "8521", oficial: "Advertising", es: "Publicidad y promoción",
    ejemplos: "Tarjetas de presentación, folletos, el dominio y el hosting de tu web, publicidad en Instagram o Google, avisos en directorios." },
  { numero: "8523", oficial: "Meals and entertainment", es: "Comidas y entretención",
    ejemplos: "Almuerzo con un cliente, comida en un viaje de trabajo, café de una reunión.",
    ojo: "El formulario solo permite deducir una parte de esta línea. La app suma el total; el ajuste lo hace tu declaración." },
  { numero: "8590", oficial: "Bad debts", es: "Deudas incobrables",
    ejemplos: "Un trabajo que facturaste, declaraste como ingreso y nunca te pagaron." },
  { numero: "8690", oficial: "Insurance", es: "Seguros del negocio",
    ejemplos: "Seguro de responsabilidad civil, seguro del local, seguro de tus equipos de trabajo.",
    ojo: "El seguro de salud o de vida personal no va aquí." },
  { numero: "8710", oficial: "Interest and bank charges", es: "Intereses y cargos del banco",
    ejemplos: "Mantención de la cuenta del negocio, intereses de un crédito del negocio, comisiones de la pasarela de pago." },
  { numero: "8760", oficial: "Business taxes, fees, licences and dues", es: "Permisos, licencias y cuotas",
    ejemplos: "Patente municipal, licencia de tu actividad, colegio profesional, membresías del rubro." },
  { numero: "8810", oficial: "Office expenses", es: "Gastos de oficina",
    ejemplos: "Suscripciones de software que usas para trabajar, almacenamiento en la nube, correo, artículos de escritorio de uso corriente." },
  { numero: "8811", oficial: "Office stationery and supplies", es: "Insumos y papelería",
    ejemplos: "Insumos que se consumen en el trabajo: papel, tinta, materiales de tu oficio." },
  { numero: "8860", oficial: "Professional fees", es: "Honorarios: abogado, contador",
    ejemplos: "Tu contador, un abogado, un asesor, alguien a quien le subcontratas parte del trabajo." },
  { numero: "8871", oficial: "Management and administration fees", es: "Administración y gestión",
    ejemplos: "Comisiones de plataformas que administran tu negocio, servicios de gestión." },
  { numero: "8910", oficial: "Rent", es: "Arriendo del local",
    ejemplos: "Arriendo de una oficina, un local, una bodega o una sala.",
    ojo: "Si trabajas desde tu casa, eso no va aquí: va en la línea 9945." },
  { numero: "8960", oficial: "Repairs and maintenance", es: "Reparaciones y mantención",
    ejemplos: "Arreglar un equipo de trabajo, mantención del local." },
  { numero: "9060", oficial: "Salaries, wages and benefits", es: "Sueldos y beneficios",
    ejemplos: "Lo que le pagas a alguien contratado por ti.",
    ojo: "Lo que retiras para ti no es un sueldo del negocio." },
  { numero: "9180", oficial: "Property taxes", es: "Contribuciones",
    ejemplos: "Contribuciones de la propiedad donde funciona el negocio." },
  { numero: "9200", oficial: "Travel expenses", es: "Viajes",
    ejemplos: "Pasajes, hotel y traslados de un viaje de trabajo.",
    ojo: "La comida del viaje va en la 8523, no aquí." },
  { numero: "9220", oficial: "Utilities", es: "Servicios: luz, agua, teléfono",
    ejemplos: "Luz, agua, gas, internet y teléfono del lugar donde trabajas.",
    ojo: "Si es tu casa, la proporción del trabajo va en la 9945." },
  { numero: "9224", oficial: "Fuel costs (except for motor vehicles)", es: "Combustible que no es del auto",
    ejemplos: "Combustible de maquinaria o de equipos, no del auto." },
  { numero: "9275", oficial: "Delivery, freight and express", es: "Envíos y despachos",
    ejemplos: "Correos, courier, despacho de lo que vendes." },
  { numero: "9281", oficial: "Motor vehicle expenses", es: "Gastos del auto",
    ejemplos: "Bencina del auto, mantención, seguro del auto, permiso de circulación.",
    ojo: "Aquí va la bencina del auto, no en la 9224. Si el auto también es personal, el formulario pide la proporción de uso del negocio, así que guarda el kilometraje." },
  { numero: "9270", oficial: "Other expenses", es: "Otros gastos",
    ejemplos: "Lo del negocio que no calza en ninguna de las anteriores. Si algo se repite mucho aquí, probablemente merece su propia línea." },
  { numero: "9936", oficial: "Capital cost allowance", es: "Depreciación de bienes",
    ejemplos: "Un computador, una cámara, un vehículo: bienes que duran años.",
    ojo: "Esta línea no se llena con gastos del año: se calcula aparte, según la tabla de depreciación." },
  { numero: "9945", oficial: "Business-use-of-home expenses", es: "Parte de la casa usada para trabajar",
    ejemplos: "La proporción del arriendo, la luz, el internet y la calefacción que corresponde al espacio donde trabajas.",
    ojo: "Esta línea tiene su propio cálculo en el formulario, según los metros que usas para trabajar." },
];

// ---------- Chile ----------
// Chile NO tiene un formulario con líneas numeradas por tipo de gasto, como
// el T2125. Quien emite boletas de honorarios elige entre gastos presuntos
// (un porcentaje automático, con tope) o gastos efectivos (los reales, uno
// por uno y con respaldo). Estas categorías sirven para lo segundo: llevar
// los gastos efectivos ordenados y listos para el contador.
//
// Los códigos empiezan con CL para dejar claro que son de esta app y no
// números de un formulario del SII. Inventar números oficiales sería mentir.

export const LINEAS_CL: LineaImpuesto[] = [
  { numero: "CL-ARR", oficial: "Arriendo del lugar de trabajo", es: "Arriendo de oficina o local",
    ejemplos: "Arriendo de la consulta, la oficina, el taller o la sala donde atiendes." },
  { numero: "CL-SER", oficial: "Servicios básicos", es: "Luz, agua, internet y teléfono",
    ejemplos: "Cuentas del lugar donde trabajas. Si trabajas en tu casa, solo la proporción que usas para trabajar." },
  { numero: "CL-INS", oficial: "Insumos y materiales", es: "Insumos y materiales",
    ejemplos: "Todo lo que se consume haciendo tu trabajo: materiales, papelería, insumos de tu oficio." },
  { numero: "CL-EQU", oficial: "Equipos y herramientas", es: "Equipos y herramientas",
    ejemplos: "Computador, cámara, herramientas, muebles de trabajo.",
    ojo: "Los bienes que duran años suelen ir por depreciación y no como gasto del año. Pregúntale a tu contador." },
  { numero: "CL-SOF", oficial: "Software y suscripciones", es: "Software y suscripciones",
    ejemplos: "Programas que usas para trabajar, almacenamiento en la nube, dominio y hosting." },
  { numero: "CL-HON", oficial: "Honorarios de terceros", es: "Honorarios que tú pagas",
    ejemplos: "Tu contador, un abogado, alguien que te ayuda con parte del trabajo. Con su boleta de honorarios." },
  { numero: "CL-MOV", oficial: "Movilización y viajes", es: "Movilización y viajes",
    ejemplos: "Pasajes, bencina y estacionamiento de traslados por trabajo, alojamiento de un viaje de trabajo." },
  { numero: "CL-PUB", oficial: "Publicidad y difusión", es: "Publicidad y difusión",
    ejemplos: "Publicidad en redes, diseño de tu marca, tu sitio web, material de difusión." },
  { numero: "CL-CAP", oficial: "Capacitación del oficio", es: "Capacitación y perfeccionamiento",
    ejemplos: "Cursos, congresos y libros directamente relacionados con lo que haces." },
  { numero: "CL-SEG", oficial: "Seguros del trabajo", es: "Seguros del trabajo",
    ejemplos: "Seguro de responsabilidad profesional, seguro del local o de tus equipos." },
  { numero: "CL-BAN", oficial: "Gastos bancarios", es: "Gastos bancarios y comisiones",
    ejemplos: "Mantención de la cuenta que usas para trabajar, comisiones de las plataformas de pago." },
  { numero: "CL-OTR", oficial: "Otros gastos del trabajo", es: "Otros gastos del trabajo",
    ejemplos: "Lo del trabajo que no calza en las anteriores, siempre con su documento de respaldo." },
];

export const LINEAS_POR_PAIS: Record<PaisImpuestos, LineaImpuesto[]> = {
  CA: LINEAS_CA,
  CL: LINEAS_CL,
  otro: [],
};

export const NOMBRE_PAIS: Record<PaisImpuestos, string> = {
  CA: "Canadá",
  CL: "Chile",
  otro: "Otro país",
};

/** El nombre del formulario, para decirle a la persona de dónde salen estos
 *  números en vez de mostrárselos sin contexto. */
export const FORMULARIO: Record<PaisImpuestos, string> = {
  CA: "Formulario T2125 del CRA, para quien trabaja por cuenta propia.",
  CL: "Gastos efectivos para tu declaración de renta. Chile no numera los gastos por tipo, así que estas categorías son de NucleoOS, para llevarlos ordenados.",
  otro: "",
};

export const lineasDe = (pais: PaisImpuestos): LineaImpuesto[] => LINEAS_POR_PAIS[pais] ?? [];

export const lineaPorNumero = (n: string | null | undefined, pais: PaisImpuestos): LineaImpuesto | undefined =>
  lineasDe(pais).find((l) => l.numero === n);

export interface TotalCategoria {
  cat: Category;
  /** Lo que sale de tu bolsillo. */
  gastado: number;
  /** La parte que es del negocio, que es la que se deduce. Igual a lo
   *  gastado mientras nadie ponga un porcentaje. */
  total: number;
  cuantos: number;
}

export interface TotalLinea {
  linea: LineaImpuesto;
  categorias: TotalCategoria[];
  total: number;
  gastado: number;
  cuantos: number;
}

/** Qué parte de una categoría es del negocio. Sin porcentaje puesto, todo. */
export function porcentajeNegocio(c: Category | null | undefined): number {
  const p = c?.business_pct;
  return p === null || p === undefined ? 100 : Math.min(100, Math.max(0, p));
}

export interface ResumenImpuestos {
  moneda: string;
  desde: string;
  hasta: string;
  lineas: TotalLinea[];
  /** El total deducible: ya con el porcentaje de negocio aplicado. */
  total: number;
  /** Lo gastado de verdad, antes del porcentaje. La diferencia entre los dos
   *  es lo que la app decidió que era personal, y eso hay que poder verlo. */
  gastado: number;
  /** Categorías con gasto en el período pero sin línea asignada todavía.
   *  Se muestran a propósito: un resumen que esconde lo que no cuadró es
   *  peor que uno que lo dice. */
  sinLinea: Array<{ cat: Category | null; total: number; cuantos: number }>;
  totalSinLinea: number;
  /** Cuántas categorías tienen un porcentaje puesto, para poder explicar el
   *  descuento en pantalla en vez de mostrar un número más chico sin más. */
  conPorcentaje: number;
}

/** Los gastos del período sumados por línea del formulario.
 *
 *  Una moneda a la vez, siempre: juntar dólares canadienses con pesos
 *  chilenos en una declaración de un solo país daría un número que no existe.
 */
export function resumenImpuestos(
  txs: Tx[],
  categories: Category[],
  opciones: { desde: string; hasta: string; moneda: string; pais: PaisImpuestos; monedaDe: (tx: Tx) => string },
): ResumenImpuestos {
  const { desde, hasta, moneda, pais, monedaDe } = opciones;
  const catPorId = new Map(categories.map((c) => [c.id, c]));

  const gastos = txs.filter((t) =>
    t.type === "expense" && t.date >= desde && t.date <= hasta && monedaDe(t) === moneda
    // Un gasto que otro te reembolsó no se deduce: no lo pagaste tú.
    && !t.reimbursed);

  const porCategoria = new Map<string, { total: number; cuantos: number }>();
  for (const t of gastos) {
    const clave = t.category_id ?? "";
    const antes = porCategoria.get(clave) ?? { total: 0, cuantos: 0 };
    porCategoria.set(clave, { total: antes.total + Number(t.amount), cuantos: antes.cuantos + 1 });
  }

  const lineas: TotalLinea[] = [];
  let conPorcentaje = 0;
  for (const linea of lineasDe(pais)) {
    const suyas: TotalCategoria[] = [...porCategoria.entries()].flatMap(([catId, n]) => {
      const cat = catPorId.get(catId);
      if (!cat || cat.tax_line !== linea.numero) return [];
      // El teléfono al sesenta por ciento deduce sesenta, no cien. Se guardan
      // los dos números: lo que pagaste y lo que se deduce.
      const pct = porcentajeNegocio(cat);
      if (pct !== 100) conPorcentaje += 1;
      return [{ cat, gastado: n.total, total: (n.total * pct) / 100, cuantos: n.cuantos }];
    }).sort((a, b) => b.total - a.total);
    if (suyas.length === 0) continue;
    lineas.push({
      linea,
      categorias: suyas,
      total: suyas.reduce((s, x) => s + x.total, 0),
      gastado: suyas.reduce((s, x) => s + x.gastado, 0),
      cuantos: suyas.reduce((s, x) => s + x.cuantos, 0),
    });
  }

  // Lo que no cuadró: sin categoría, o con una categoría que todavía no tiene
  // línea, o con una línea de OTRO país (pasa si se cambia el país después).
  const conLinea = new Set(lineasDe(pais).map((l) => l.numero));
  const sinLinea = [...porCategoria.entries()].flatMap(([catId, n]) => {
    const cat = catId ? catPorId.get(catId) ?? null : null;
    if (cat?.tax_line && conLinea.has(cat.tax_line)) return [];
    return [{ cat, total: n.total, cuantos: n.cuantos }];
  }).sort((a, b) => b.total - a.total);

  return {
    moneda,
    desde,
    hasta,
    lineas,
    total: lineas.reduce((s, l) => s + l.total, 0),
    gastado: lineas.reduce((s, l) => s + l.gastado, 0),
    conPorcentaje,
    sinLinea,
    totalSinLinea: sinLinea.reduce((s, x) => s + x.total, 0),
  };
}
