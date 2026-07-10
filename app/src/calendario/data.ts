import { fmtFechaLocal } from "../lib/fechas";
import { listReminders } from "../finanzas/data";
import type { Reminder } from "../finanzas/types";
import { listAppointments, listExams, type Appointment, type HealthExam } from "../salud/data";
import { listRelationships, type Relationship } from "../relaciones/data";
import { listWorkLogs, type WorkLog } from "../trabajo/data";
import { listActivity, type ActivityEntry } from "../objetivos/data";

// El Calendario centraliza los eventos de todas las áreas (bloque C del
// reporte): pagos de Finanzas, citas y exámenes de Salud, cumpleaños de
// Relaciones, jornadas de Trabajo y avances (incluido lo estudiado).

export interface EventoCal {
  id: string;
  date: string;       // YYYY-MM-DD
  icon: string;
  title: string;
  area: string;       // clave de área para el color
  detail?: string;
}

export interface FuentesCal {
  reminders: Reminder[];
  citas: Appointment[];
  examenes: HealthExam[];
  vinculos: Relationship[];
  jornadas: WorkLog[];
  avances: ActivityEntry[];
}

/** Carga cada fuente por separado: si a un área le falta su migración,
 *  el calendario sigue funcionando con las demás. */
export async function cargarFuentes(): Promise<FuentesCal> {
  const seguro = async <T,>(fn: () => Promise<T[]>): Promise<T[]> => {
    try {
      return await fn();
    } catch {
      return [];
    }
  };
  const [reminders, citas, examenes, vinculos, jornadas, avances] = await Promise.all([
    seguro(listReminders),
    seguro(listAppointments),
    seguro(listExams),
    seguro(listRelationships),
    seguro(() => listWorkLogs(370)),
    seguro(() => listActivity(400)),
  ]);
  return { reminders, citas, examenes, vinculos, jornadas, avances };
}

/** Fechas en que un recordatorio ocurre dentro del mes visto. */
function ocurrenciasRecordatorio(r: Reminder, ym: string): string[] {
  const [y, m] = ym.split("-").map(Number);
  const inicio = new Date(y, m - 1, 1);
  const fin = new Date(y, m, 0);
  const ancla = new Date(r.date + "T00:00:00");
  const out: string[] = [];

  if (r.recurrence === "oneTime") {
    if (r.date.startsWith(ym)) out.push(r.date);
    return out;
  }
  if (r.recurrence === "monthly") {
    if (ancla <= fin) {
      const dia = Math.min(ancla.getDate(), fin.getDate());
      const fecha = new Date(y, m - 1, dia);
      if (fecha >= ancla) out.push(fmtFechaLocal(fecha));
    }
    return out;
  }
  // quincenal: de 14 en 14 desde el ancla
  const d = new Date(ancla);
  while (d < inicio) d.setDate(d.getDate() + 14);
  while (d <= fin) {
    out.push(fmtFechaLocal(d));
    d.setDate(d.getDate() + 14);
  }
  return out;
}

/** Todos los eventos del mes visto, listos para pintar. */
export function eventosDelMes(f: FuentesCal, ym: string): EventoCal[] {
  const [y, m] = ym.split("-").map(Number);
  const eventos: EventoCal[] = [];

  for (const r of f.reminders) {
    for (const fecha of ocurrenciasRecordatorio(r, ym)) {
      eventos.push({
        id: `rem-${r.id}-${fecha}`,
        date: fecha,
        icon: r.category === "creditCard" ? "💳" : r.category === "debt" ? "🏦" : "🔔",
        title: r.title,
        area: "finanzas",
      });
    }
  }

  for (const c of f.citas) {
    if (!c.date.startsWith(ym)) continue;
    eventos.push({
      id: `cita-${c.id}`,
      date: c.date,
      icon: "🩺",
      title: c.title,
      area: "salud",
      detail: c.time ? `a las ${c.time.slice(0, 5)}` : undefined,
    });
  }

  for (const e of f.examenes) {
    if (!e.due_date || e.result || !e.due_date.startsWith(ym)) continue;
    eventos.push({ id: `exam-${e.id}`, date: e.due_date, icon: "🧪", title: e.name, area: "salud" });
  }

  for (const v of f.vinculos) {
    if (!v.birthday) continue;
    const [, bm, bd] = v.birthday.split("-").map(Number);
    if (bm !== m) continue;
    const ultimo = new Date(y, m, 0).getDate();
    const fecha = fmtFechaLocal(new Date(y, m - 1, Math.min(bd, ultimo)));
    eventos.push({ id: `cumple-${v.id}`, date: fecha, icon: "🎂", title: `Cumpleaños de ${v.name}`, area: "relaciones" });
  }

  for (const j of f.jornadas) {
    if (!j.date.startsWith(ym)) continue;
    eventos.push({
      id: `trab-${j.id}`,
      date: j.date,
      icon: j.kind === "empleo" ? "🏢" : "🛠️",
      title: j.description || (j.kind === "empleo" ? "Jornada de empleo" : "Trabajo en proyecto"),
      area: "trabajo",
      detail: j.hours ? `${j.hours} h` : undefined,
    });
  }

  for (const a of f.avances) {
    if (!a.date.startsWith(ym)) continue;
    eventos.push({ id: `av-${a.id}`, date: a.date, icon: "✨", title: a.description, area: a.area });
  }

  return eventos.sort((a, b) => a.date.localeCompare(b.date));
}
