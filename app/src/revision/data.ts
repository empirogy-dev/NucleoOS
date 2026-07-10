import { fmtFechaLocal } from "../lib/fechas";
import { listSesiones } from "../mente/practicas";
import { listEnergy } from "../salud/energia";
import { listMeals, totalesDia } from "../salud/comidas";
import { listExercise, listHabitLogs, listRoutine, sleepHours } from "../habitos/data";
import { listRetoLogs } from "../habitos/retos";
import { listCategories, listTransactions } from "../finanzas/data";
import { listActivity } from "../objetivos/data";
import { listRelLogs } from "../relaciones/data";
import { listEntries } from "../mente/diario";

// Revisión: convierte lo registrado en claridad.
// Agrega los datos de todos los módulos por período y busca patrones.

export interface Periodo {
  desde: string;
  hasta: string;
  etiqueta: string;
}

function iso(d: Date): string {
  return fmtFechaLocal(d);
}

/** Semana de lunes a domingo; offset 0 = esta semana, 1 = la anterior. */
export function semanaDe(offset: number): Periodo {
  const hoy = new Date();
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7) - offset * 7);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("es-CL", { day: "numeric", month: "short" });
  return {
    desde: iso(lunes),
    hasta: iso(domingo),
    etiqueta: offset === 0 ? `Esta semana (${fmt(lunes)} al ${fmt(domingo)})` : `Semana del ${fmt(lunes)} al ${fmt(domingo)}`,
  };
}

/** Mes calendario; offset 0 = este mes. */
export function mesDe(offset: number): Periodo {
  const hoy = new Date();
  const primero = new Date(hoy.getFullYear(), hoy.getMonth() - offset, 1);
  const ultimo = new Date(hoy.getFullYear(), hoy.getMonth() - offset + 1, 0);
  const nombre = primero.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
  return { desde: iso(primero), hasta: iso(ultimo), etiqueta: nombre.charAt(0).toUpperCase() + nombre.slice(1) };
}

export interface LineaResumen {
  k: string;
  v: string;
}

export interface ModuloResumen {
  emoji: string;
  titulo: string;
  to: string;
  lineas: LineaResumen[];
}

const en = (p: Periodo) => (fecha: string) => fecha >= p.desde && fecha <= p.hasta;

function prom(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

export async function armarResumen(p: Periodo): Promise<{ modulos: ModuloResumen[]; markdown: string }> {
  const dentro = en(p);
  const modulos: ModuloResumen[] = [];
  const seguro = async (fn: () => Promise<void>) => {
    try {
      await fn();
    } catch {
      /* módulo sin migrar o sin datos, se omite sin drama */
    }
  };

  // Mente (sesiones locales + diario)
  await seguro(async () => {
    const ses = listSesiones().filter((s) => dentro(s.fecha));
    const minutos = ses.reduce((a, s) => a + s.minutos, 0);
    const sadhanas = ses.filter((s) => s.id.startsWith("sadhana")).length;
    let entradas = 0;
    try {
      entradas = (await listEntries(120)).filter((e) => dentro(e.date)).length;
    } catch { /* diario sin migrar */ }
    modulos.push({
      emoji: "🧠", titulo: "Mente", to: "/mente",
      lineas: [
        { k: "Sesiones", v: String(ses.length) },
        { k: "Minutos de práctica", v: String(minutos) },
        { k: "Sadhanas", v: String(sadhanas) },
        { k: "Entradas de diario", v: String(entradas) },
      ],
    });
  });

  // Energía (agua, proteína, energía percibida, comidas)
  await seguro(async () => {
    const energia = (await listEnergy(70)).filter((e) => dentro(e.date));
    const meals = (await listMeals(70)).filter((m) => dentro(m.date));
    const agua = prom(energia.map((e) => e.water_cups));
    const nivel = prom(energia.filter((e) => e.energy_level != null).map((e) => Number(e.energy_level)));
    const fechas = new Set([...energia.map((e) => e.date), ...meals.map((m) => m.date)]);
    const prots = [...fechas].map((f) => {
      const log = energia.find((e) => e.date === f);
      return Number(log?.protein_g ?? 0) + totalesDia(meals, f).proteina;
    }).filter((x) => x > 0);
    modulos.push({
      emoji: "⚡", titulo: "Energía", to: "/salud",
      lineas: [
        { k: "Agua promedio", v: agua !== null ? `${agua} vasos` : "sin registro" },
        { k: "Proteína promedio", v: prots.length ? `${Math.round(prots.reduce((a, b) => a + b, 0) / prots.length)} g` : "sin registro" },
        { k: "Energía percibida", v: nivel !== null ? `${nivel} de 5` : "sin registro" },
        { k: "Platos registrados", v: String(meals.length) },
      ],
    });
  });

  // Sueño y movimiento
  await seguro(async () => {
    const rutina = (await listRoutine(70)).filter((r) => dentro(r.date));
    const horas = rutina.map(sleepHours).filter((h): h is number => h !== null);
    const ejercicio = (await listExercise(70)).filter((e) => dentro(e.date));
    const min = ejercicio.reduce((a, e) => a + e.minutes, 0);
    modulos.push({
      emoji: "🌙", titulo: "Sueño y movimiento", to: "/salud",
      lineas: [
        { k: "Sueño promedio", v: horas.length ? `${prom(horas)} h` : "sin registro" },
        { k: "Noches registradas", v: String(horas.length) },
        { k: "Movimiento", v: `${min} min en ${ejercicio.length} ${ejercicio.length === 1 ? "sesión" : "sesiones"}` },
      ],
    });
  });

  // Hábitos y retos
  await seguro(async () => {
    const marcas = (await listHabitLogs()).filter((l) => dentro(l.date)).length;
    let retoMarcas = 0;
    try {
      retoMarcas = (await listRetoLogs()).filter((l) => dentro(l.date)).length;
    } catch { /* retos sin migrar */ }
    modulos.push({
      emoji: "🔄", titulo: "Hábitos y retos", to: "/habitos",
      lineas: [
        { k: "Hábitos marcados", v: String(marcas) },
        { k: "Días de reto cumplidos", v: String(retoMarcas) },
      ],
    });
  });

  // Finanzas
  await seguro(async () => {
    const [txs, cats] = await Promise.all([listTransactions(800), listCategories()]);
    const del = txs.filter((t) => dentro(t.date));
    const gastos = del.filter((t) => t.type === "expense").reduce((a, t) => a + t.amount, 0);
    const ingresos = del.filter((t) => t.type === "income").reduce((a, t) => a + t.amount, 0);
    const porCat = new Map<string, number>();
    for (const t of del.filter((x) => x.type === "expense" && x.category_id)) {
      porCat.set(t.category_id as string, (porCat.get(t.category_id as string) ?? 0) + t.amount);
    }
    let top: string | null = null;
    for (const [id, monto] of porCat) {
      if (top === null || monto > (porCat.get(top) ?? 0)) top = id;
    }
    const nombreTop = top ? cats.find((c) => c.id === top)?.name ?? null : null;
    const f = (n: number) => `$${Math.round(n).toLocaleString("es-CL")}`;
    modulos.push({
      emoji: "💰", titulo: "Finanzas", to: "/finanzas",
      lineas: [
        { k: "Gastos", v: f(gastos) },
        { k: "Ingresos", v: f(ingresos) },
        { k: "Balance", v: f(ingresos - gastos) },
        { k: "Mayor gasto", v: nombreTop ?? "sin categoría destacada" },
      ],
    });
  });

  // Dirección, Relaciones y Aprendizaje (avances y vínculos)
  await seguro(async () => {
    const avances = (await listActivity(300)).filter((a) => dentro(a.date));
    let vinculos = 0;
    try {
      vinculos = (await listRelLogs()).filter((l) => dentro(l.date)).length;
    } catch { /* relaciones sin migrar */ }
    modulos.push({
      emoji: "🧭", titulo: "Dirección y avances", to: "/objetivos",
      lineas: [
        { k: "Avances registrados", v: String(avances.length) },
        { k: "De aprendizaje", v: String(avances.filter((a) => a.area === "aprendizaje").length) },
        { k: "Conexiones con personas", v: String(vinculos) },
      ],
    });
  });

  // Markdown listo para pegar en Notion o donde quieras.
  const md = [
    `# NucleoOS · Revisión`,
    `**${p.etiqueta}** (${p.desde} al ${p.hasta})`,
    "",
    ...modulos.flatMap((m) => [
      `## ${m.emoji} ${m.titulo}`,
      ...m.lineas.map((l) => `- ${l.k}: ${l.v}`),
      "",
    ]),
  ].join("\n");

  return { modulos, markdown: md };
}

// ---------- Patrones: cruces entre módulos (últimos 30 días) ----------
export interface Patron {
  emoji: string;
  titulo: string;
  texto: string;
  conDatos: boolean;
}

export async function buscarPatrones(): Promise<Patron[]> {
  const patrones: Patron[] = [];
  const hace30 = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return iso(d);
  })();

  // Mapa por día: energía percibida, sueño, movimiento, práctica de mente.
  const energiaDia = new Map<string, number>();
  const suenoDia = new Map<string, number>();
  const movDia = new Map<string, number>();
  const menteDia = new Set<string>();

  try {
    for (const e of await listEnergy(31)) {
      if (e.energy_level != null) energiaDia.set(e.date, Number(e.energy_level));
    }
  } catch { /* sin 0018 */ }
  try {
    for (const r of await listRoutine(31)) {
      const h = sleepHours(r);
      if (h !== null) suenoDia.set(r.date, h);
    }
    for (const e of await listExercise(31)) {
      movDia.set(e.date, (movDia.get(e.date) ?? 0) + e.minutes);
    }
  } catch { /* sin 0005 */ }
  for (const s of listSesiones()) {
    if (s.fecha >= hace30) menteDia.add(s.fecha);
  }

  function comparar(emoji: string, titulo: string, cond: (fecha: string) => boolean | null, siMejor: string, siPeor: string, siIgual: string): Patron {
    const conCond: number[] = [];
    const sinCond: number[] = [];
    for (const [fecha, nivel] of energiaDia) {
      const c = cond(fecha);
      if (c === null) continue;
      (c ? conCond : sinCond).push(nivel);
    }
    if (conCond.length < 3 || sinCond.length < 3) {
      return { emoji, titulo, conDatos: false, texto: "Aún faltan días con registro para ver este patrón. Sigue anotando, el espejo se arma solo." };
    }
    const a = conCond.reduce((x, y) => x + y, 0) / conCond.length;
    const b = sinCond.reduce((x, y) => x + y, 0) / sinCond.length;
    const diff = Math.round((a - b) * 10) / 10;
    if (diff >= 0.4) return { emoji, titulo, conDatos: true, texto: `${siMejor} En promedio, ${a.toFixed(1)} contra ${b.toFixed(1)} de energía percibida.` };
    if (diff <= -0.4) return { emoji, titulo, conDatos: true, texto: `${siPeor} En promedio, ${a.toFixed(1)} contra ${b.toFixed(1)}.` };
    return { emoji, titulo, conDatos: true, texto: siIgual };
  }

  patrones.push(comparar(
    "😴", "Sueño y energía",
    (f) => (suenoDia.has(f) ? (suenoDia.get(f) as number) >= 7 : null),
    "Los días que duermes 7 horas o más, tu energía sube.",
    "Curioso: tus días de más sueño no muestran más energía todavía.",
    "Por ahora tu energía se ve pareja duermas lo que duermas. Con más días de registro esto se afina.",
  ));

  patrones.push(comparar(
    "🏃", "Movimiento y claridad",
    (f) => (movDia.get(f) ?? 0) >= 20 ? true : movDia.has(f) || energiaDia.has(f) ? false : null,
    "Los días con al menos 20 minutos de movimiento, tu energía percibida es más alta.",
    "Tus días de movimiento aún no muestran más energía. Puede ser el horario o la intensidad.",
    "El movimiento todavía no marca diferencia clara en tu energía. Dale más días.",
  ));

  patrones.push(comparar(
    "🧘", "Regulación y estado",
    (f) => (energiaDia.has(f) ? menteDia.has(f) : null),
    "Los días que practicas Mente, tu energía percibida es más alta.",
    "Ojo: los días de práctica muestran menos energía. Quizás practicas justo los días difíciles, y eso también está bien.",
    "La práctica aún no marca diferencia visible en tu energía. La constancia lo dirá.",
  ));

  return patrones;
}
