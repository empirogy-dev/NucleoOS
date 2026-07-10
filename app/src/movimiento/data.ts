import { supabase } from "../lib/supabase";
import { TablesMissingError } from "../finanzas/data";

// Movimiento: práctica suave y entrenamiento, retos y tu material propio.
// Completar una rutina se registra como ejercicio, así Energía lo suma solo.

export type TipoRutina = "suave" | "entrenamiento";

export interface Rutina {
  id: string;
  nombre: string;
  emoji: string;
  tipo: TipoRutina;
  categoria: string; // se registra como tipo de ejercicio en Energía
  minutos: number;
  nivel: "suave" | "medio" | "intenso";
  descripcion: string;
  pasos: string[];
}

export const RUTINAS: Rutina[] = [
  // ---------- Práctica suave ----------
  {
    id: "yoga-manana",
    nombre: "Yoga para despertar",
    emoji: "🌅",
    tipo: "suave",
    categoria: "Yoga",
    minutos: 15,
    nivel: "suave",
    descripcion: "Secuencia lenta para sacar el cuerpo del modo cama y entrar al día con presencia.",
    pasos: [
      "Postura de la niña, 10 respiraciones lentas.",
      "Gato y vaca, 8 rondas siguiendo la respiración.",
      "Perro boca abajo, pedaleando las piernas, 1 minuto.",
      "Saludo al sol suave, 3 rondas a tu ritmo.",
      "Guerrera 2 a cada lado, 5 respiraciones.",
      "Pinza de pie con rodillas blandas, 1 minuto colgando.",
      "Torsión suave acostada a cada lado.",
      "Savasana, 2 minutos de quietud.",
    ],
  },
  {
    id: "yoga-dormir",
    nombre: "Yoga para dormir",
    emoji: "🌙",
    tipo: "suave",
    categoria: "Yoga",
    minutos: 12,
    nivel: "suave",
    descripcion: "Posturas de suelo, todas amables, para bajarle las luces al sistema nervioso.",
    pasos: [
      "Piernas en la pared, 3 minutos respirando lento.",
      "Mariposa reclinada con cojines, 2 minutos.",
      "Torsión suave acostada, 1 minuto por lado.",
      "Rodillas al pecho, meciéndote suave.",
      "Postura de la niña, 2 minutos.",
      "Savasana con una mano en el pecho y otra en el abdomen.",
    ],
  },
  {
    id: "movilidad-cadera",
    nombre: "Movilidad de cadera",
    emoji: "🦋",
    tipo: "suave",
    categoria: "Movilidad",
    minutos: 10,
    nivel: "suave",
    descripcion: "Para caderas que pasan el día sentadas. Se agradece de inmediato.",
    pasos: [
      "Círculos de cadera de pie, 10 por lado.",
      "Sentadilla profunda sostenida, 1 minuto (afírmate si necesitas).",
      "Zancada baja con cadera al suelo, 1 minuto por lado.",
      "Mariposa sentada, llevando el pecho adelante, 2 minutos.",
      "Paloma suave a cada lado, 1 minuto por lado.",
      "90 90 sentada, rotando de un lado al otro, 10 pasadas.",
    ],
  },
  {
    id: "cuello-hombros",
    nombre: "Liberar cuello y hombros",
    emoji: "🕊",
    tipo: "suave",
    categoria: "Movilidad",
    minutos: 8,
    nivel: "suave",
    descripcion: "La tensión emocional vive aquí. Esta secuencia la va soltando.",
    pasos: [
      "Hombros a las orejas, sostén 5 segundos y suelta de golpe, 5 veces.",
      "Círculos de hombros hacia atrás, 10 lentos.",
      "Oreja al hombro con la mano apoyada (sin tirar), 30 segundos por lado.",
      "Mentón al pecho y rueda la cabeza de hombro a hombro, 8 pasadas.",
      "Brazos entrelazados adelante, empuja y redondea la espalda alta.",
      "Manos entrelazadas atrás, abre el pecho y mira suave hacia arriba.",
    ],
  },
  {
    id: "estiramiento-escritorio",
    nombre: "Pausa de escritorio",
    emoji: "💻",
    tipo: "suave",
    categoria: "Movilidad",
    minutos: 6,
    nivel: "suave",
    descripcion: "Sin cambiarte de ropa y sin sudar: seis minutos que le devuelven vida al cuerpo sentado.",
    pasos: [
      "Ponte de pie y estírate hacia el techo, 5 respiraciones.",
      "Pliegue adelante con rodillas blandas, cuelga 30 segundos.",
      "Torsión de pie a cada lado, con calma.",
      "Estira muñecas y antebrazos, 20 segundos por lado.",
      "Abre el pecho con las manos atrás, 5 respiraciones.",
      "Camina 2 minutos, aunque sea por el pasillo.",
    ],
  },
  // ---------- Entrenamiento ----------
  {
    id: "fuerza-full",
    nombre: "Full body sin equipo",
    emoji: "💪",
    tipo: "entrenamiento",
    categoria: "Gimnasio",
    minutos: 20,
    nivel: "medio",
    descripcion: "Fuerza de cuerpo completo con tu propio peso. 3 rondas, descansa 1 minuto entre rondas.",
    pasos: [
      "Calienta 2 minutos: trote suave en el lugar y círculos de brazos.",
      "Sentadillas, 12 repeticiones.",
      "Flexiones (en rodillas si es necesario), 8 a 10.",
      "Zancadas alternadas, 10 por pierna.",
      "Remo con mochila cargada o botellas, 12.",
      "Plancha, 30 segundos.",
      "Repite todo 3 veces y estira 2 minutos al final.",
    ],
  },
  {
    id: "fuerza-inferior",
    nombre: "Tren inferior",
    emoji: "🦵",
    tipo: "entrenamiento",
    categoria: "Gimnasio",
    minutos: 15,
    nivel: "medio",
    descripcion: "Piernas y glúteos, la base de todo. 3 rondas con pausas cortas.",
    pasos: [
      "Sentadillas, 15 repeticiones.",
      "Puente de glúteos, 15 (sostén 2 segundos arriba).",
      "Zancadas hacia atrás, 10 por pierna.",
      "Sentadilla isométrica en la pared, 30 segundos.",
      "Elevación de talones, 20.",
      "Repite 3 rondas y estira cuádriceps e isquios al final.",
    ],
  },
  {
    id: "fuerza-superior",
    nombre: "Tren superior",
    emoji: "🏋️",
    tipo: "entrenamiento",
    categoria: "Gimnasio",
    minutos: 15,
    nivel: "medio",
    descripcion: "Brazos, pecho y espalda con el peso del cuerpo y algo que pese en casa.",
    pasos: [
      "Flexiones (versión que te acomode), 8 a 12.",
      "Remo con mochila o botellas, 12.",
      "Press de hombros con botellas, 12.",
      "Fondos de tríceps en una silla firme, 10.",
      "Curl de bíceps con lo que tengas a mano, 12.",
      "3 rondas, y al final estira pecho y hombros en el marco de una puerta.",
    ],
  },
  {
    id: "core-10",
    nombre: "Core en 10 minutos",
    emoji: "🎯",
    tipo: "entrenamiento",
    categoria: "Gimnasio",
    minutos: 10,
    nivel: "medio",
    descripcion: "Centro fuerte, espalda agradecida. Sin abdominales de manual.",
    pasos: [
      "Plancha, 30 segundos.",
      "Plancha lateral, 20 segundos por lado.",
      "Bicho muerto (dead bug), 10 por lado, lento.",
      "Bird dog, 10 por lado, sin apurarse.",
      "Plancha con toques de hombro, 16.",
      "Repite 2 rondas y termina en postura de la niña.",
    ],
  },
  {
    id: "cardio-suave",
    nombre: "Cardio amable",
    emoji: "🚶",
    tipo: "entrenamiento",
    categoria: "Caminata",
    minutos: 20,
    nivel: "suave",
    descripcion: "Caminata con propósito: el cardio más subestimado y el más sostenible.",
    pasos: [
      "5 minutos a paso normal, soltando el cuerpo.",
      "10 minutos a paso rápido, que cueste hablar de corrido.",
      "Incluye una subida o escaleras si puedes.",
      "5 minutos a paso lento para bajar el pulso.",
      "Sin audífonos, si te atreves: cuenta como meditación en movimiento.",
    ],
  },
  {
    id: "hiit-amable",
    nombre: "Intervalos 12 minutos",
    emoji: "🔥",
    tipo: "entrenamiento",
    categoria: "Gimnasio",
    minutos: 12,
    nivel: "intenso",
    descripcion: "Corto e intenso: 30 segundos de trabajo, 30 de descanso. Escucha a tu cuerpo.",
    pasos: [
      "Calienta 2 minutos moviéndote suave.",
      "30 segundos jumping jacks, 30 descanso.",
      "30 segundos sentadillas rápidas, 30 descanso.",
      "30 segundos escaladores, 30 descanso.",
      "30 segundos trote con rodillas altas, 30 descanso.",
      "Repite el circuito 2 veces y camina 2 minutos al final.",
    ],
  },
];

export function rutinaPor(id: string): Rutina | null {
  return RUTINAS.find((r) => r.id === id) ?? null;
}

// ---------- Programas (retos) ----------
export interface DiaPrograma {
  titulo: string;
  rutinaId?: string;
  descanso?: boolean;
}

export interface Programa {
  key: string;
  nombre: string;
  emoji: string;
  objetivo: string;
  dias: DiaPrograma[];
}

const SEMANA_FUERZA: DiaPrograma[] = [
  { titulo: "Full body", rutinaId: "fuerza-full" },
  { titulo: "Caminata", rutinaId: "cardio-suave" },
  { titulo: "Tren inferior", rutinaId: "fuerza-inferior" },
  { titulo: "Movilidad", rutinaId: "movilidad-cadera" },
  { titulo: "Tren superior", rutinaId: "fuerza-superior" },
  { titulo: "Core", rutinaId: "core-10" },
  { titulo: "Descanso con yoga", rutinaId: "yoga-dormir", descanso: true },
];

export const PROGRAMAS: Programa[] = [
  {
    key: "despertar-7",
    nombre: "Reto 7 días: despertar el cuerpo",
    emoji: "🌱",
    objetivo: "Una semana de práctica suave para volver a habitar el cuerpo, sin exigencia.",
    dias: [
      { titulo: "Yoga para despertar", rutinaId: "yoga-manana" },
      { titulo: "Pausa de escritorio", rutinaId: "estiramiento-escritorio" },
      { titulo: "Movilidad de cadera", rutinaId: "movilidad-cadera" },
      { titulo: "Caminata amable", rutinaId: "cardio-suave" },
      { titulo: "Cuello y hombros", rutinaId: "cuello-hombros" },
      { titulo: "Yoga para despertar", rutinaId: "yoga-manana" },
      { titulo: "Yoga para dormir", rutinaId: "yoga-dormir" },
    ],
  },
  {
    key: "fuerza-21",
    nombre: "Reto 21 días de fuerza amable",
    emoji: "💪",
    objetivo: "Tres semanas alternando fuerza, cardio y movilidad. Al día 21, el cuerpo ya lo pide solo.",
    dias: [...SEMANA_FUERZA, ...SEMANA_FUERZA, ...SEMANA_FUERZA],
  },
];

// ---------- Progreso de programas (migración 0021) ----------
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

export interface ProgramDay {
  program_key: string;
  day: number;
}

export async function listProgramDays(): Promise<ProgramDay[]> {
  const { data, error } = await sb().from("program_days").select("program_key,day");
  check(error);
  return (data ?? []) as ProgramDay[];
}

export async function toggleProgramDay(programKey: string, day: number, done: boolean): Promise<void> {
  if (done) {
    const { error } = await sb().from("program_days").insert({ program_key: programKey, day, user_id: await uid() });
    if (error && error.code !== "23505") check(error);
  } else {
    const { error } = await sb().from("program_days").delete().eq("program_key", programKey).eq("day", day);
    check(error);
  }
}

// ---------- Material propio (bucket "material") ----------
export interface MaterialFile {
  name: string;
  path: string;
}

const BUCKET = "material";

export async function listMaterial(): Promise<MaterialFile[]> {
  const { data: u } = await sb().auth.getUser();
  if (!u.user) return [];
  const { data, error } = await sb().storage.from(BUCKET).list(u.user.id, { sortBy: { column: "created_at", order: "desc" } });
  if (error) {
    if (/bucket/i.test(error.message)) throw new Error("BUCKET_MISSING");
    throw new Error(error.message);
  }
  return (data ?? [])
    .filter((f) => f.name !== ".emptyFolderPlaceholder")
    .map((f) => ({ name: f.name.replace(/^\d+-/, ""), path: `${u.user!.id}/${f.name}` }));
}

export async function uploadMaterial(file: File): Promise<void> {
  const { data: u } = await sb().auth.getUser();
  if (!u.user) throw new Error("Sin sesión.");
  const safe = file.name.replace(/[^\w.\-()áéíóúñÁÉÍÓÚÑ ]/g, "_");
  const { error } = await sb().storage.from(BUCKET).upload(`${u.user.id}/${Date.now()}-${safe}`, file, {
    contentType: file.type || "application/octet-stream",
  });
  if (error) {
    if (/bucket/i.test(error.message)) throw new Error("BUCKET_MISSING");
    throw new Error(error.message);
  }
}

export async function openMaterial(path: string): Promise<void> {
  const { data, error } = await sb().storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) throw new Error(error?.message ?? "No pude abrir el archivo.");
  window.open(data.signedUrl, "_blank", "noopener");
}

export async function deleteMaterial(path: string): Promise<void> {
  const { error } = await sb().storage.from(BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}
