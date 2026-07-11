import { hoyLocal } from "../lib/fechas";
import { supabase } from "../lib/supabase";
import { TablesMissingError } from "../finanzas/data";

export interface HealthProfile {
  blood_type: string | null;
  allergies: string | null;
  conditions: string | null;
  surgeries: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  diet: string | null;
  eye_color: string | null;
  activity_level: string | null;
}

/** Niveles de actividad y su factor de proteína (gramos por kilo). */
export const NIVELES_ACTIVIDAD = [
  { key: "sedentaria", label: "Tranquila, poco ejercicio", factor: 1.0 },
  { key: "ligera", label: "Me muevo, 1 a 3 días por semana", factor: 1.3 },
  { key: "activa", label: "Entreno 3 a 5 días por semana", factor: 1.6 },
  { key: "atleta", label: "Entreno casi todos los días", factor: 2.0 },
] as const;

export const DIETAS = ["Balanceada", "Vegetariana", "Vegana", "Keto", "Sin gluten", "Sin lactosa", "Otra"] as const;

export interface Medication {
  id: string;
  name: string;
  dose: string | null;
  schedule: string | null;
  active: boolean;
  kind: "medicamento" | "suplemento";
}

export interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string | null;
  location: string | null;
}

export interface HealthExam {
  id: string;
  name: string;
  due_date: string | null;
  result: string | null;
}

export interface Sobriety {
  id: string;
  substance: string;
  start_date: string;
}

export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

/** Hitos de sobriedad en días. */
export const SOBRIETY_MILESTONES = [
  { days: 7, label: "1 semana" },
  { days: 30, label: "1 mes" },
  { days: 90, label: "3 meses" },
  { days: 180, label: "6 meses" },
  { days: 365, label: "1 año" },
  { days: 545, label: "18 meses" },
  { days: 730, label: "2 años" },
] as const;

export function daysSince(dateStr: string): number {
  const start = new Date(dateStr + "T00:00:00");
  const today = new Date(hoyLocal() + "T00:00:00");
  return Math.max(0, Math.round((today.getTime() - start.getTime()) / 86400000));
}

/** "1 año y 4 meses", "3 meses y 12 días", "18 días". */
export function humanizeDays(days: number): string {
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  const rest = days - years * 365 - months * 30;
  const parts: string[] = [];
  if (years > 0) parts.push(years === 1 ? "1 año" : `${years} años`);
  if (months > 0) parts.push(months === 1 ? "1 mes" : `${months} meses`);
  if (years === 0 && rest > 0) parts.push(rest === 1 ? "1 día" : `${rest} días`);
  if (parts.length === 0) return "primer día";
  return parts.length === 2 ? `${parts[0]} y ${parts[1]}` : parts[0];
}

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

// ---------- Ficha ----------
export async function getHealthProfile(): Promise<HealthProfile | null> {
  const { data, error } = await sb()
    .from("health_profile")
    .select("*")
    .maybeSingle();
  check(error);
  return data as HealthProfile | null;
}

export async function saveHealthProfile(p: HealthProfile): Promise<void> {
  const { error } = await sb()
    .from("health_profile")
    .upsert({ user_id: await uid(), ...p, updated_at: new Date().toISOString() });
  if (error && /activity_level/.test(error.message)) {
    throw new Error("Para el nivel de actividad falta la migración 0029 (supabase/migrations/0029_actividad.sql).");
  }
  if (error && /weight_kg|height_cm|diet|eye_color/.test(error.message)) {
    throw new Error("Falta la migración 0015 en Supabase (supabase/migrations/0015_salud_plus.sql).");
  }
  check(error);
}

// ---------- Medicamentos y suplementos ----------
export async function listMedications(): Promise<Medication[]> {
  const { data, error } = await sb()
    .from("medications")
    .select("id,name,dose,schedule,active,kind")
    .order("created_at");
  if (error && /kind/.test(error.message)) {
    // La migración 0027 aún no se corre: todo se lista como medicamento.
    const legado = await sb().from("medications").select("id,name,dose,schedule,active").order("created_at");
    check(legado.error);
    return (legado.data ?? []).map((m) => ({ ...m, kind: "medicamento" as const })) as Medication[];
  }
  check(error);
  return (data ?? []) as Medication[];
}

export async function addMedication(m: { name: string; dose: string | null; schedule: string | null; kind: "medicamento" | "suplemento" }): Promise<void> {
  const { error } = await sb().from("medications").insert({ ...m, user_id: await uid() });
  if (error && /kind/.test(error.message)) {
    throw new Error("Para registrar suplementos falta la migración 0027 (supabase/migrations/0027_suplementos.sql).");
  }
  check(error);
}

export async function deleteMedication(id: string): Promise<void> {
  const { error } = await sb().from("medications").delete().eq("id", id);
  check(error);
}

// ---------- Citas ----------
export async function listAppointments(): Promise<Appointment[]> {
  const { data, error } = await sb()
    .from("appointments")
    .select("id,title,date,time,location")
    .order("date");
  check(error);
  return (data ?? []) as Appointment[];
}

export async function addAppointment(a: { title: string; date: string; time: string | null; location: string | null }): Promise<void> {
  const { error } = await sb().from("appointments").insert({ ...a, user_id: await uid() });
  check(error);
}

export async function deleteAppointment(id: string): Promise<void> {
  const { error } = await sb().from("appointments").delete().eq("id", id);
  check(error);
}

// ---------- Exámenes ----------
export async function listExams(): Promise<HealthExam[]> {
  const { data, error } = await sb()
    .from("health_exams")
    .select("id,name,due_date,result")
    .order("created_at");
  check(error);
  return (data ?? []) as HealthExam[];
}

export async function addExam(e: { name: string; due_date: string | null; result: string | null }): Promise<void> {
  const { error } = await sb().from("health_exams").insert({ ...e, user_id: await uid() });
  check(error);
}

export async function deleteExam(id: string): Promise<void> {
  const { error } = await sb().from("health_exams").delete().eq("id", id);
  check(error);
}

// ---------- Sobriedad ----------
export async function listSobriety(): Promise<Sobriety[]> {
  const { data, error } = await sb()
    .from("sobriety")
    .select("id,substance,start_date")
    .order("created_at");
  check(error);
  return (data ?? []) as Sobriety[];
}

export async function addSobriety(substance: string, start_date: string): Promise<void> {
  const { error } = await sb().from("sobriety").insert({ substance, start_date, user_id: await uid() });
  check(error);
}

export async function deleteSobriety(id: string): Promise<void> {
  const { error } = await sb().from("sobriety").delete().eq("id", id);
  check(error);
}
