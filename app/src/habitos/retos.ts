import { fmtFechaLocal, hoyLocal } from "../lib/fechas";
import { supabase } from "../lib/supabase";
import { TablesMissingError } from "../finanzas/data";

// Retos (migración 0022): compromisos vivos, no desafíos rígidos.
// Cada reto tiene frecuencia por días de la semana, se puede editar,
// pausar, retomar y terminar, y su progreso se marca día a día.

export type RetoStatus = "activo" | "pausado" | "terminado";

export interface Reto {
  id: string;
  title: string;
  icon: string | null;
  why: string | null;
  duration_days: number;
  days_mask: number; // bit por getDay(): 1 = domingo, 2 = lunes, 4 = martes...
  start_date: string;
  status: RetoStatus;
}

export interface RetoLog {
  id: string;
  challenge_id: string;
  date: string;
}

export const TODOS_LOS_DIAS = 127;
export const LUNES_A_VIERNES = 0b0111110; // bits 1 a 5 (lunes a viernes)

/** Días de la semana en orden visual L a D, con su bit según getDay(). */
export const DIAS_SEMANA = [
  { label: "L", bit: 1 << 1 },
  { label: "M", bit: 1 << 2 },
  { label: "X", bit: 1 << 3 },
  { label: "J", bit: 1 << 4 },
  { label: "V", bit: 1 << 5 },
  { label: "S", bit: 1 << 6 },
  { label: "D", bit: 1 << 0 },
] as const;

export function esProgramado(iso: string, mask: number): boolean {
  const [y, m, d] = iso.split("-").map(Number);
  const dia = new Date(y, m - 1, d).getDay();
  return (mask & (1 << dia)) !== 0;
}

export function etiquetaFrecuencia(mask: number): string {
  if (mask === TODOS_LOS_DIAS) return "todos los días";
  if (mask === LUNES_A_VIERNES) return "lunes a viernes";
  const dias = DIAS_SEMANA.filter((d) => (mask & d.bit) !== 0).map((d) => d.label);
  return dias.length === 0 ? "sin días" : dias.join(" ");
}

/** Fechas programadas del reto, desde el inicio hasta completar la duración. */
export function ventanaReto(reto: Reto): string[] {
  const [y, m, d] = reto.start_date.split("-").map(Number);
  const fecha = new Date(y, m - 1, d);
  const fechas: string[] = [];
  for (let i = 0; i < reto.duration_days && fechas.length < 365; i += 1) {
    const iso = fmtFechaLocal(fecha);
    if (esProgramado(iso, reto.days_mask)) fechas.push(iso);
    fecha.setDate(fecha.getDate() + 1);
  }
  return fechas;
}

/** Racha: días programados seguidos cumplidos, mirando hacia atrás desde hoy. */
export function rachaReto(reto: Reto, marcados: Set<string>): number {
  const hoy = hoyLocal();
  const d = new Date();
  // Si hoy está programado pero aún no se marca, la racha se cuenta desde ayer.
  if (esProgramado(hoy, reto.days_mask) && !marcados.has(hoy)) d.setDate(d.getDate() - 1);
  let racha = 0;
  for (let i = 0; i < 400; i += 1) {
    const iso = fmtFechaLocal(d);
    if (iso < reto.start_date) break;
    if (esProgramado(iso, reto.days_mask)) {
      if (!marcados.has(iso)) break;
      racha += 1;
    }
    d.setDate(d.getDate() - 1);
  }
  return racha;
}

// ---------- Retos sugeridos (se abren prellenados para personalizar) ----------
export interface RetoSugerido {
  title: string;
  icon: string;
  why: string;
  duration_days: number;
  days_mask: number;
}

export const RETOS_SUGERIDOS: RetoSugerido[] = [
  { title: "Meditar 10 minutos", icon: "🧘", why: "Para empezar el día desde la calma y no desde el apuro.", duration_days: 21, days_mask: TODOS_LOS_DIAS },
  { title: "Practicar sadhana cada mañana", icon: "🕉", why: "Mi momento conmigo antes de que el mundo pida cosas.", duration_days: 21, days_mask: TODOS_LOS_DIAS },
  { title: "Tomar más agua", icon: "💧", why: "Energía y claridad, un vaso a la vez.", duration_days: 14, days_mask: TODOS_LOS_DIAS },
  { title: "Caminar 20 minutos", icon: "🚶", why: "Aire, movimiento y cabeza despejada.", duration_days: 21, days_mask: TODOS_LOS_DIAS },
  { title: "Sin azúcar", icon: "🍬", why: "Una semana para recalibrar el paladar.", duration_days: 7, days_mask: TODOS_LOS_DIAS },
  { title: "Dormir antes de las 11", icon: "🌙", why: "El sueño es la base de toda mi energía.", duration_days: 14, days_mask: TODOS_LOS_DIAS },
];

// ---------- Datos ----------
function check(error: { code?: string; message: string } | null) {
  if (!error) return;
  if (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    /does not exist|could not find the table/i.test(error.message)
  ) {
    throw new TablesMissingError();
  }
  throw new Error(error.message);
}

function sb() {
  if (!supabase) throw new Error("Supabase no está configurado.");
  return supabase;
}

async function uid(): Promise<string> {
  const { data } = await sb().auth.getUser();
  if (!data.user) throw new Error("Sin sesión.");
  return data.user.id;
}

export async function listRetos(): Promise<Reto[]> {
  const { data, error } = await sb()
    .from("challenges")
    .select("id,title,icon,why,duration_days,days_mask,start_date,status")
    .order("created_at", { ascending: false });
  check(error);
  return (data ?? []) as Reto[];
}

export async function addReto(r: Omit<Reto, "id" | "status">): Promise<void> {
  const { error } = await sb().from("challenges").insert({ ...r, user_id: await uid() });
  check(error);
}

export async function updateReto(id: string, patch: Partial<Omit<Reto, "id">>): Promise<void> {
  const { error } = await sb().from("challenges").update(patch).eq("id", id);
  check(error);
}

export async function deleteReto(id: string): Promise<void> {
  const { error } = await sb().from("challenges").delete().eq("id", id);
  check(error);
}

export async function listRetoLogs(): Promise<RetoLog[]> {
  const { data, error } = await sb().from("challenge_logs").select("id,challenge_id,date");
  check(error);
  return (data ?? []) as RetoLog[];
}

export async function toggleRetoDay(retoId: string, date: string, done: boolean): Promise<void> {
  if (done) {
    const { error } = await sb().from("challenge_logs").insert({ challenge_id: retoId, date, user_id: await uid() });
    if (error && error.code !== "23505") check(error);
  } else {
    const { error } = await sb().from("challenge_logs").delete().eq("challenge_id", retoId).eq("date", date);
    check(error);
  }
}
