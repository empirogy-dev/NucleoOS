import { hoyLocal } from "../lib/fechas";
import { supabase } from "../lib/supabase";
import { TablesMissingError } from "../finanzas/data";

export interface Relationship {
  id: string;
  name: string;
  relation: string | null;
  birthday: string | null;
  contact_every_days: number | null;
  notes: string | null;
}

export interface RelLog {
  id: string;
  relationship_id: string;
  date: string;
  description: string;
}

/** Bandeja de tips: conexión y apertura emocional. El coach de IA los hará personalizados en Fase 4. */
export const TIPS = [
  "Pregunta cómo está de verdad, y espera la segunda respuesta. La primera casi siempre es \"bien\".",
  "Un mensaje corto de \"me acordé de ti\" vale más que esperar el momento perfecto para escribir largo.",
  "Comparte algo pequeño y vulnerable tuyo primero. La apertura invita apertura.",
  "Anota lo que te cuentan (aquí mismo) y pregúntales después: \"¿cómo salió eso que me contaste?\".",
  "Agradece en voz alta. Decir \"me hizo bien hablar contigo\" fortalece el vínculo más de lo que crees.",
  "Si sientes distancia, nómbrala con cariño: \"te he echado de menos, ¿nos ponemos al día?\".",
  "Escucha sin preparar tu respuesta. Cuando terminen de hablar, respira antes de contestar.",
  "Celebra las noticias buenas de la otra persona con entusiasmo real. Eso construye confianza.",
  "No esperes a estar bien para hablar con alguien que quieres. Compartir lo difícil también conecta.",
  "Las relaciones se riegan con frecuencia, no con intensidad. Mejor cinco minutos seguidos que una hora una vez al año.",
] as const;

/** Tip del día, estable durante el día. */
export function tipDelDia(): string {
  const day = Math.floor(Date.now() / 86400000);
  return TIPS[day % TIPS.length];
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

// ---------- Vínculos ----------
export async function listRelationships(): Promise<Relationship[]> {
  const { data, error } = await sb()
    .from("relationships")
    .select("id,name,relation,birthday,contact_every_days,notes")
    .order("created_at");
  check(error);
  return (data ?? []) as Relationship[];
}

export async function addRelationship(r: {
  name: string;
  relation: string | null;
  birthday: string | null;
  contact_every_days: number | null;
}): Promise<void> {
  const { error } = await sb().from("relationships").insert({ ...r, user_id: await uid() });
  check(error);
}

export async function deleteRelationship(id: string): Promise<void> {
  const { error } = await sb().from("relationships").delete().eq("id", id);
  check(error);
}

// ---------- Interacciones ----------
export async function listRelLogs(): Promise<RelLog[]> {
  const { data, error } = await sb()
    .from("relationship_logs")
    .select("id,relationship_id,date,description")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(400);
  check(error);
  return (data ?? []) as RelLog[];
}

export async function addRelLog(relationshipId: string, date: string, description: string): Promise<void> {
  const { error } = await sb()
    .from("relationship_logs")
    .insert({ relationship_id: relationshipId, date, description, user_id: await uid() });
  check(error);
}

export async function deleteRelLog(id: string): Promise<void> {
  const { error } = await sb().from("relationship_logs").delete().eq("id", id);
  check(error);
}

// ---------- Cálculos ----------
export function daysSinceContact(relId: string, logs: RelLog[]): number | null {
  const last = logs.find((l) => l.relationship_id === relId);
  if (!last) return null;
  const d = new Date(last.date + "T00:00:00");
  const today = new Date(hoyLocal() + "T00:00:00");
  return Math.round((today.getTime() - d.getTime()) / 86400000);
}

/** true si toca reconectar (pasó la cadencia deseada, o nunca has registrado contacto). */
export function needsReconnect(r: Relationship, logs: RelLog[]): boolean {
  if (!r.contact_every_days) return false;
  const days = daysSinceContact(r.id, logs);
  return days === null || days >= r.contact_every_days;
}

/** Días hasta el próximo cumpleaños, o null. */
export function daysToBirthday(birthday: string | null): number | null {
  if (!birthday) return null;
  const today = new Date(hoyLocal() + "T00:00:00");
  const [, m, d] = birthday.split("-").map(Number);
  let next = new Date(today.getFullYear(), m - 1, d);
  if (next < today) next = new Date(today.getFullYear() + 1, m - 1, d);
  return Math.round((next.getTime() - today.getTime()) / 86400000);
}

// ---------- Acciones por tipo de vínculo (bloque D del reporte) ----------
export type TipoVinculo = "pareja" | "familia" | "amistad" | "colega" | "otro";

export const TIPO_LABELS: Record<TipoVinculo, string> = {
  pareja: "tu pareja",
  familia: "tu familia",
  amistad: "tus amistades",
  colega: "tus colegas",
  otro: "tus vínculos",
};

/** Detecta el tipo desde el texto libre de la relación (mamá, amiga, pololo...). */
export function tipoDeVinculo(relation: string | null): TipoVinculo {
  const r = (relation ?? "").toLowerCase();
  if (/(pareja|novi|espos|marido|mujer|polol)/.test(r)) return "pareja";
  if (/(mam|pap|madre|padre|abuel|herman|hij|ti[oa]|tí[oa]|prim|famil|suegr|cuñad)/.test(r)) return "familia";
  if (/(amig|amist|mejor)/.test(r)) return "amistad";
  if (/(coleg|jef[ea]|trabajo|soci[oa]|compañer|mentor)/.test(r)) return "colega";
  return "otro";
}

/** Ideas concretas por tipo de vínculo, con el espíritu de los ejemplos de la usuaria. */
export const ACCIONES: Record<TipoVinculo, string[]> = {
  pareja: [
    "Invítale a una cita sorpresa esta semana.",
    "Un regalo chico sin motivo, solo porque sí.",
    "Dile una cosa concreta que aprecias de él o ella.",
    "Planeen una escapada, aunque sea de un día.",
    "Cocinen algo rico juntos, sin apuro.",
    "Pregúntale cómo está de verdad, y escucha sin arreglar nada.",
  ],
  familia: [
    "Invítale un café y conversen sin apuro.",
    "Tiempo de calidad sin celulares de por medio.",
    "Págale el celular o dale un gustito inesperado.",
    "Sáquense una foto juntos, de esas que quedan.",
    "Pídele que te cuente una historia de su juventud.",
    "Llámale solo para saludar, sin motivo.",
  ],
  amistad: [
    "Propón un panorama concreto, con fecha incluida.",
    "Mándale un recuerdo o un meme de los suyos.",
    "Pregúntale cómo salió eso que te contó la última vez.",
    "Agenden una llamada larga como las de antes.",
    "Preséntale a alguien que le haga bien conocer.",
    "Dile por qué valoras su amistad, así tal cual.",
  ],
  colega: [
    "Reconoce su trabajo delante de otras personas.",
    "Invítale un café fuera del contexto de trabajo.",
    "Pídele consejo en algo que domina.",
    "Compártele algo útil que viste y te acordaste de él o ella.",
  ],
  otro: [
    "Manda un mensaje corto: me acordé de ti.",
    "Propón juntarse pronto, con fecha concreta.",
    "Pregúntale cómo va eso que te contó.",
    "Dale las gracias por algo específico.",
  ],
};

/** Ideas para una persona: rotan con el día y se pueden barajar. */
export function accionesPara(r: Relationship, cantidad = 3, giro = 0): string[] {
  const lista = ACCIONES[tipoDeVinculo(r.relation)];
  const dia = Math.floor(Date.now() / 86400000);
  const inicio = (dia + r.name.length + giro * cantidad) % lista.length;
  const n = Math.min(cantidad, lista.length);
  return Array.from({ length: n }, (_, i) => lista[(inicio + i) % lista.length]);
}

/** Acción del día para un tipo de vínculo (panel lateral). */
export function accionDelDia(tipo: TipoVinculo): string {
  const dia = Math.floor(Date.now() / 86400000);
  return ACCIONES[tipo][dia % ACCIONES[tipo].length];
}
