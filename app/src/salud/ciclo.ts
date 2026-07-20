import { hoyLocal } from "../lib/fechas";
import { supabase } from "../lib/supabase";
import { TablesMissingError } from "../finanzas/data";
import { idiomaActual } from "../idioma/actual";

// Ciclo menstrual (migración 0036): cada regla registrada permite saber
// en qué fase hormonal vas, qué necesitas, y cuándo se estima la próxima.
// La configuración vive en la ficha con respaldo local.

export interface Cycle {
  id: string;
  start_date: string;
}

export interface CicloConfig {
  cycle_length: number;
  period_length: number;
  partner_email: string | null;
}

export const CONFIG_DEFECTO: CicloConfig = { cycle_length: 28, period_length: 5, partner_email: null };

const LS_CONFIG = "nucleoos-ciclo-config";

export interface Fase {
  key: "menstrual" | "folicular" | "ovulatoria" | "lutea";
  nombre: string;
  emoji: string;
  descripcion: string;
  paraTi: string; // el consejo que te habla a ti
  apoyo: string; // cómo puede acompañarte tu pareja (solo si la hay)
}

const FASES: Record<Fase["key"], Omit<Fase, "key">> = {
  menstrual: {
    nombre: "Menstrual",
    emoji: "🌑",
    descripcion: "Estrógeno y progesterona en el piso: la energía baja y el cuerpo pide descanso de verdad. No es flojera, es fisiología.",
    paraTi: "Regálate calor (guatero, té), comida rica en hierro, planes suaves y cero exigencia. Bajar el ritmo estos días es cuidarte, no fallar.",
    apoyo: "Calor (guatero, té), comida rica en hierro, planes suaves y cero exigencia. Es el momento de bajar el ritmo sin culpa.",
  },
  folicular: {
    nombre: "Folicular",
    emoji: "🌒",
    descripcion: "El estrógeno sube y con él la energía, el ánimo y la claridad mental. Suele ser la mejor fase para empezar cosas.",
    paraTi: "Súbete a la ola: es tu mejor fase para empezar proyectos, planificar y darle a los entrenamientos exigentes.",
    apoyo: "Acompañar el impulso: buen momento para planes, proyectos y entrenamientos más exigentes.",
  },
  ovulatoria: {
    nombre: "Ovulatoria",
    emoji: "🌕",
    descripcion: "El punto más alto de energía y sociabilidad del ciclo. El estrógeno llega a su cima.",
    paraTi: "Aprovecha tu cima: conversaciones importantes, panoramas con gente que quieres, movimiento. Estos días todo te fluye más fácil.",
    apoyo: "Aprovechar la energía juntos: conversaciones importantes, panoramas, movimiento. Todo fluye más fácil.",
  },
  lutea: {
    nombre: "Lútea",
    emoji: "🌗",
    descripcion: "La progesterona domina y hacia el final puede venir el SPM: más sensibilidad, menos paciencia, antojo de calma. Con TDAH esta fase puede sentirse más intensa.",
    paraTi: "Baja las exigencias sociales, prioriza la comodidad y prepárate algo rico. Sentir más fuerte estos días no es exagerar, es tu química.",
    apoyo: "Paciencia extra, validar sin arreglar, menos planes sociales y más comodidad. Un 'te tengo algo rico' vale oro.",
  },
};

/** Fase según el día del ciclo (1 = primer día de la regla). */
export function faseDe(dia: number, cfg: CicloConfig): Fase {
  const ovulacion = Math.max(cfg.period_length + 2, cfg.cycle_length - 14);
  let key: Fase["key"];
  if (dia <= cfg.period_length) key = "menstrual";
  else if (dia < ovulacion - 1) key = "folicular";
  else if (dia <= ovulacion + 1) key = "ovulatoria";
  else key = "lutea";
  return { key, ...FASES[key] };
}

export function diaDelCiclo(ultimoInicio: string, fecha = hoyLocal()): number {
  const inicio = new Date(`${ultimoInicio}T00:00:00`);
  const hoy = new Date(`${fecha}T00:00:00`);
  return Math.max(1, Math.round((hoy.getTime() - inicio.getTime()) / 86400000) + 1);
}

/** Largo promedio real usando los últimos ciclos registrados. */
export function largoPromedio(cycles: Cycle[], porDefecto: number): number {
  if (cycles.length < 2) return porDefecto;
  const fechas = [...cycles].map((c) => new Date(`${c.start_date}T00:00:00`).getTime()).sort((a, b) => a - b);
  const difs: number[] = [];
  for (let i = 1; i < fechas.length; i++) {
    const d = Math.round((fechas[i] - fechas[i - 1]) / 86400000);
    if (d >= 18 && d <= 45) difs.push(d); // fuera de ese rango suele ser un registro saltado
  }
  if (!difs.length) return porDefecto;
  return Math.round(difs.slice(-4).reduce((a, b) => a + b, 0) / Math.min(4, difs.length));
}

export function proximaRegla(ultimoInicio: string, largo: number): string {
  const d = new Date(`${ultimoInicio}T00:00:00`);
  d.setDate(d.getDate() + largo);
  const i = idiomaActual();
  const loc = i === "en" ? "en-US" : i === "pt" ? "pt-BR" : "es-CL";
  return d.toLocaleDateString(loc, { weekday: "long", day: "numeric", month: "long" });
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

export async function listCycles(): Promise<Cycle[]> {
  const { data, error } = await sb()
    .from("cycles")
    .select("id,start_date")
    .order("start_date", { ascending: false })
    .limit(24);
  check(error);
  return (data ?? []) as Cycle[];
}

export async function addCycle(start_date: string): Promise<void> {
  const { error } = await sb().from("cycles").insert({ start_date, user_id: await uid() });
  check(error);
}

export async function deleteCycle(id: string): Promise<void> {
  const { error } = await sb().from("cycles").delete().eq("id", id);
  check(error);
}

// ---------- Configuración con respaldo local ----------
export async function getCicloConfig(): Promise<CicloConfig> {
  let local: CicloConfig | null = null;
  try {
    const raw = localStorage.getItem(LS_CONFIG);
    if (raw) local = { ...CONFIG_DEFECTO, ...(JSON.parse(raw) as Partial<CicloConfig>) };
  } catch { /* nada */ }
  try {
    const { data, error } = await sb()
      .from("health_profile")
      .select("cycle_length,period_length,partner_email")
      .maybeSingle();
    if (!error && data) {
      return {
        cycle_length: data.cycle_length ?? local?.cycle_length ?? CONFIG_DEFECTO.cycle_length,
        period_length: data.period_length ?? local?.period_length ?? CONFIG_DEFECTO.period_length,
        partner_email: data.partner_email ?? local?.partner_email ?? null,
      };
    }
  } catch { /* columnas sin migrar: usamos lo local */ }
  return local ?? CONFIG_DEFECTO;
}

export async function saveCicloConfig(cfg: CicloConfig): Promise<void> {
  localStorage.setItem(LS_CONFIG, JSON.stringify(cfg));
  try {
    const user_id = await uid();
    await sb().from("health_profile").upsert({ user_id, ...cfg, updated_at: new Date().toISOString() });
  } catch { /* sin la 0036 el respaldo local basta */ }
}

/** El texto del aviso para la pareja, listo para un correo. */
export function mensajePareja(fase: Fase, dia: number, proxima: string): { asunto: string; cuerpo: string } {
  return {
    asunto: `Cómo acompañarme esta semana (fase ${fase.nombre.toLowerCase()})`,
    cuerpo:
      `Hola amor, te cuento en qué va mi ciclo para que me entiendas mejor estos días.\n\n` +
      `Voy en el día ${dia}, fase ${fase.nombre.toLowerCase()} ${fase.emoji}.\n\n` +
      `Qué me pasa: ${fase.descripcion}\n\n` +
      `Cómo apoyarme: ${fase.apoyo}\n\n` +
      `Mi próxima regla se estima alrededor del ${proxima}.\n\n` +
      `Enviado desde NucleoOS, mi sistema de vida.`,
  };
}
