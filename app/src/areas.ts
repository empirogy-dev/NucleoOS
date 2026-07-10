import {
  Compass, Wallet, HeartPulse, Briefcase, BookOpen, Repeat, Users,
  type LucideIcon,
} from "lucide-react";

export interface Area {
  key: string;
  name: string;
  path: string;
  color: string; // CSS var
  icon: LucideIcon;
  tagline: string;
  progress: number; // 0-100 (datos de ejemplo por ahora)
}

// Orden según prioridades de vida: cuerpo, orden, vínculos, dirección, recursos.
export const AREAS: Area[] = [
  { key: "salud", name: "Energía", path: "/salud", color: "var(--sal)", icon: HeartPulse,
    tagline: "Tu cuerpo: ficha, citas, medicamentos y exámenes.", progress: 25 },
  { key: "habitos", name: "Hábitos", path: "/habitos", color: "var(--hab)", icon: Repeat,
    tagline: "Sueño, ejercicio y las rutinas que te ordenan.", progress: 40 },
  { key: "relaciones", name: "Relaciones", path: "/relaciones", color: "var(--rel)", icon: Users,
    tagline: "Cultiva tus vínculos con recordatorios amables.", progress: 30 },
  { key: "objetivos", name: "Dirección", path: "/objetivos", color: "var(--obj)", icon: Compass,
    tagline: "Tu visión de vida y las metas que la construyen.", progress: 55 },
  { key: "trabajo", name: "Trabajo", path: "/trabajo", color: "var(--tra)", icon: Briefcase,
    tagline: "Proyectos personales, tu empleo y tus horas.", progress: 10 },
  { key: "finanzas", name: "Finanzas", path: "/finanzas", color: "var(--fin)", icon: Wallet,
    tagline: "Gastos, presupuestos, deudas y metas de ahorro.", progress: 90 },
  { key: "aprendizaje", name: "Aprendizaje", path: "/aprendizaje", color: "var(--apr)", icon: BookOpen,
    tagline: "Cuadernos, material y resúmenes con IA.", progress: 35 },
];

export function areaPor(key: string): Area {
  const a = AREAS.find((x) => x.key === key);
  if (!a) throw new Error(`Área desconocida: ${key}`);
  return a;
}
