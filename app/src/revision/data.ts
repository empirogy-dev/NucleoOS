import { fmtFechaLocal } from "../lib/fechas";
import { listSesiones } from "../mente/practicas";
import { listEnergy } from "../salud/energia";
import { listMeals, momentoDe, totalesDia } from "../salud/comidas";
import { listExercise, listHabitLogs, listHabits, listRoutine, sincronizarHabitosConEjercicio, sleepHours } from "../habitos/data";
import { METRICAS_AUTO, cargarFuentes, listObjectives, type Fuentes, type Objective } from "../objetivos/data";
import { listRetoLogs, listRetos } from "../habitos/retos";
import { listCategories, listTransactions } from "../finanzas/data";
import { listActivity } from "../objetivos/data";
import { listRelLogs } from "../relaciones/data";
import { listEntries } from "../mente/diario";
import { listDayTasks } from "../tareas/data";
import { listFocusBlocks } from "../foco/data";
import { listProjects } from "../trabajo/data";

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

/** Un día; offset 0 = hoy, 1 = ayer. */
export function diaDe(offset: number): Periodo {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  const largo = d.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" }).replace(",", "");
  const bonito = largo.charAt(0).toUpperCase() + largo.slice(1);
  const fecha = iso(d);
  return {
    desde: fecha,
    hasta: fecha,
    etiqueta: offset === 0 ? `Hoy, ${largo}` : offset === 1 ? `Ayer, ${largo}` : bonito,
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

  // Hábitos y retos (rescatando primero los días de ejercicio ya hechos)
  await seguro(async () => {
    await sincronizarHabitosConEjercicio();
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

  // Tareas del día (checklist del Inicio)
  await seguro(async () => {
    const del = (await listDayTasks(70)).filter((t) => dentro(t.date));
    if (!del.length) return;
    const listas = del.filter((t) => t.done).length;
    modulos.push({
      emoji: "📝", titulo: "Tareas del día", to: "/",
      lineas: [
        { k: "Completadas", v: `${listas} de ${del.length}` },
      ],
    });
  });

  // Bloques de foco (pomodoro)
  await seguro(async () => {
    const del = (await listFocusBlocks(70)).filter((f) => dentro(f.date));
    if (!del.length) return;
    const minutos = del.reduce((s, f) => s + f.minutes, 0);
    modulos.push({
      emoji: "🎯", titulo: "Foco", to: "/trabajo",
      lineas: [
        { k: "Bloques de foco", v: String(del.length) },
        { k: "Minutos enfocada", v: String(minutos) },
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

  // Dirección, Relaciones y Aprendizaje (avances, vínculos y lo que empujó cada meta)
  await seguro(async () => {
    const avances = (await listActivity(300)).filter((a) => dentro(a.date));
    let vinculos = 0;
    try {
      vinculos = (await listRelLogs()).filter((l) => dentro(l.date)).length;
    } catch { /* relaciones sin migrar */ }
    const lineas: LineaResumen[] = [
      { k: "Avances registrados", v: String(avances.length) },
      { k: "De aprendizaje", v: String(avances.filter((a) => a.area === "aprendizaje").length) },
      { k: "Conexiones con personas", v: String(vinculos) },
    ];
    // Lo que cada meta automática avanzó en el período: aquí se VE el empuje.
    try {
      const [objs, f] = await Promise.all([listObjectives(), cargarFuentes()]);
      for (const o of objs.filter((x) => x.status === "en_camino" || x.status === "en_riesgo")) {
        if (!o.auto_metric) continue;
        const m = METRICAS_AUTO.find((x) => x.key === o.auto_metric);
        const n = eventosEnPeriodo(o, f, dentro);
        if (m && n > 0) lineas.push({ k: `⚡ ${o.title}`, v: `+${n} ${m.unidad} en el período` });
      }
    } catch { /* sin metas automáticas */ }
    modulos.push({ emoji: "🧭", titulo: "Dirección y avances", to: "/objetivos", lineas });
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

/** Cuánto empujó una meta automática dentro del período. */
function eventosEnPeriodo(o: Objective, f: Fuentes, dentro: (d: string) => boolean): number {
  if (o.auto_metric === "mov_sesiones") return f.ejercicio.filter((e) => dentro(e.date)).length;
  if (o.auto_metric === "mov_minutos") return f.ejercicio.filter((e) => dentro(e.date)).reduce((s, e) => s + e.minutes, 0);
  if (o.auto_metric === "mente_sesiones") return f.sesiones.filter((s) => dentro(s.fecha)).length;
  if (o.auto_metric === "habito_marcas") return f.habitLogs.filter((l) => l.habit_id === o.auto_ref && dentro(l.date)).length;
  if (o.auto_metric === "reto_dias") return f.retoLogs.filter((l) => l.challenge_id === o.auto_ref && dentro(l.date)).length;
  if (o.auto_metric === "area_avances") return f.avances.filter((a) => dentro(a.date) && (o.area === null || a.area === o.area)).length;
  if (o.auto_metric === "trabajo_horas") {
    return Math.round(f.workLogs.filter((w) => w.project_id === o.auto_ref && dentro(w.date) && w.hours).reduce((s, w) => s + Number(w.hours), 0) * 10) / 10;
  }
  if (o.auto_metric === "foco_minutos") {
    const ref = o.auto_ref ?? "";
    return f.focusBlocks
      .filter((b) => dentro(b.date))
      .filter((b) => (ref.startsWith("p:") ? b.project_id === ref.slice(2) : ref.startsWith("a:") ? b.area === ref.slice(2) : false))
      .reduce((s, b) => s + b.minutes, 0);
  }
  if (o.auto_metric === "rel_momentos") {
    return f.relLogs.filter((l) => dentro(l.date) && (!o.auto_ref || l.relationship_id === o.auto_ref)).length;
  }
  if (o.auto_metric === "libros_leidos") {
    const ref = o.auto_ref ?? "";
    const ids = ref.startsWith("l:") ? new Set(ref.slice(2).split(",").filter(Boolean)) : null;
    return f.libros
      .filter((l) => l.fecha !== null && dentro(l.fecha))
      .filter((l) => (ids ? ids.has(l.id) : ref.startsWith("v:") ? l.via === ref.slice(2) : true))
      .length;
  }
  return 0;
}

// ---------- Día: la página de agenda de una fecha ----------
// A diferencia del resumen (promedios y totales), aquí se ve el detalle:
// qué comiste, qué hábitos marcaste, qué practicaste, qué escribiste.
export async function armarDia(fecha: string): Promise<{ modulos: ModuloResumen[]; markdown: string }> {
  const modulos: ModuloResumen[] = [];
  const seguro = async (fn: () => Promise<void>) => {
    try {
      await fn();
    } catch {
      /* módulo sin migrar o sin datos, se omite sin drama */
    }
  };

  // Energía del día: agua, energía percibida, sueño
  await seguro(async () => {
    const log = (await listEnergy(70)).find((e) => e.date === fecha);
    const rutina = (await listRoutine(70)).find((r) => r.date === fecha);
    const horas = rutina ? sleepHours(rutina) : null;
    const lineas: LineaResumen[] = [];
    if (horas !== null) lineas.push({ k: "Sueño", v: `${horas} h` });
    if (log) {
      lineas.push({ k: "Agua", v: `${log.water_cups} de 8 vasos` });
      if (log.energy_level != null) lineas.push({ k: "Energía percibida", v: `${log.energy_level} de 5` });
      if (log.note) lineas.push({ k: "Nota", v: log.note });
    }
    if (lineas.length) modulos.push({ emoji: "⚡", titulo: "Energía", to: "/salud", lineas });
  });

  // Comidas del día, plato por plato
  await seguro(async () => {
    const meals = (await listMeals(70)).filter((m) => m.date === fecha);
    if (!meals.length) return;
    const tot = totalesDia(meals, fecha);
    modulos.push({
      emoji: "🍽", titulo: "Comidas", to: "/salud",
      lineas: [
        ...meals.map((m) => {
          const mm = momentoDe(m.meal_type);
          return { k: mm ? `${mm.emoji} ${m.description}` : m.description, v: `${m.kcal ?? 0} kcal, ${Math.round(m.protein_g ?? 0)} g prot` };
        }),
        { k: "Total del día", v: `${tot.kcal} kcal, ${tot.proteina} g de proteína` },
      ],
    });
  });

  // Movimiento del día, sesión por sesión
  await seguro(async () => {
    const ejercicio = (await listExercise(70)).filter((e) => e.date === fecha);
    if (!ejercicio.length) return;
    modulos.push({
      emoji: "🏃", titulo: "Movimiento", to: "/movimiento",
      lineas: ejercicio.map((e) => ({ k: e.kind, v: `${e.minutes} min` })),
    });
  });

  // Mente: prácticas y diario del día
  await seguro(async () => {
    const ses = listSesiones().filter((s) => s.fecha === fecha);
    let entradas: Array<{ prompt: string | null; content: string }> = [];
    try {
      entradas = (await listEntries(120)).filter((e) => e.date === fecha);
    } catch { /* diario sin migrar */ }
    if (!ses.length && !entradas.length) return;
    modulos.push({
      emoji: "🧠", titulo: "Mente", to: "/mente",
      lineas: [
        ...ses.map((s) => ({ k: s.nombre, v: `${s.minutos} min` })),
        ...entradas.map((e) => ({
          k: e.prompt ?? "Escritura libre",
          v: e.content.length > 60 ? e.content.slice(0, 57) + "…" : e.content,
        })),
      ],
    });
  });

  // Hábitos y retos marcados ese día, con nombre
  await seguro(async () => {
    const marcados = (await listHabitLogs()).filter((l) => l.date === fecha);
    const habits = marcados.length ? await listHabits() : [];
    const lineas: LineaResumen[] = marcados
      .map((l) => habits.find((h) => h.id === l.habit_id))
      .filter((h): h is NonNullable<typeof h> => Boolean(h))
      .map((h) => ({ k: `${h.icon ?? "✓"} ${h.name}`, v: "cumplido" }));
    try {
      const retoLogs = (await listRetoLogs()).filter((l) => l.date === fecha);
      if (retoLogs.length) {
        const retos = await listRetos();
        for (const l of retoLogs) {
          const r = retos.find((x) => x.id === l.challenge_id);
          if (r) lineas.push({ k: `${r.icon ?? "🎯"} ${r.title}`, v: "día de reto cumplido" });
        }
      }
    } catch { /* retos sin migrar */ }
    if (lineas.length) modulos.push({ emoji: "🔄", titulo: "Hábitos y retos", to: "/habitos", lineas });
  });

  // Bloques de foco de ese día, con su destino
  await seguro(async () => {
    const del = (await listFocusBlocks(70)).filter((f) => f.date === fecha);
    if (!del.length) return;
    let proyectos: Array<{ id: string; name: string }> = [];
    try {
      proyectos = await listProjects();
    } catch { /* sin Trabajo migrado */ }
    modulos.push({
      emoji: "🎯", titulo: "Foco", to: "/trabajo",
      lineas: del.map((f) => {
        const destino = f.project_id
          ? proyectos.find((p) => p.id === f.project_id)?.name ?? "un proyecto"
          : f.area === "aprendizaje" ? "Aprendizaje" : null;
        const nombre = f.label || destino || "Bloque de foco";
        return { k: destino && f.label ? `${f.label} (${destino})` : nombre, v: `${f.minutes} min` };
      }),
    });
  });

  // Tareas del checklist de ese día, una por una
  await seguro(async () => {
    const del = (await listDayTasks(70)).filter((t) => t.date === fecha);
    if (!del.length) return;
    modulos.push({
      emoji: "📝", titulo: "Tareas del día", to: "/",
      lineas: del.map((t) => ({ k: t.title, v: t.done ? "lista" : "quedó pendiente" })),
    });
  });

  // Avances registrados ese día
  await seguro(async () => {
    const avances = (await listActivity(300)).filter((a) => a.date === fecha);
    if (!avances.length) return;
    modulos.push({
      emoji: "🧭", titulo: "Avances", to: "/objetivos",
      lineas: avances.map((a) => ({ k: a.description, v: a.area })),
    });
  });

  // Finanzas del día, resumidas
  await seguro(async () => {
    const del = (await listTransactions(800)).filter((t) => t.date === fecha);
    if (!del.length) return;
    const gastos = del.filter((t) => t.type === "expense").reduce((a, t) => a + t.amount, 0);
    const ingresos = del.filter((t) => t.type === "income").reduce((a, t) => a + t.amount, 0);
    const f = (n: number) => `$${Math.round(n).toLocaleString("es-CL")}`;
    const lineas: LineaResumen[] = [{ k: "Movimientos", v: String(del.length) }];
    if (gastos > 0) lineas.push({ k: "Gastos", v: f(gastos) });
    if (ingresos > 0) lineas.push({ k: "Ingresos", v: f(ingresos) });
    modulos.push({ emoji: "💰", titulo: "Finanzas", to: "/finanzas", lineas });
  });

  const md = [
    `# NucleoOS · Mi día`,
    `**${fecha}**`,
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
