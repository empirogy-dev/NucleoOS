import {
  Target, Wallet, HeartPulse, Briefcase, BookOpen, Repeat, Users,
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

export const AREAS: Area[] = [
  { key: "objetivos", name: "Objetivos", path: "/objetivos", color: "var(--obj)", icon: Target,
    tagline: "Tu visión de vida y las metas que la construyen.", progress: 55 },
  { key: "finanzas", name: "Finanzas", path: "/finanzas", color: "var(--fin)", icon: Wallet,
    tagline: "Gastos, presupuestos, deudas y metas de ahorro.", progress: 90 },
  { key: "salud", name: "Salud", path: "/salud", color: "var(--sal)", icon: HeartPulse,
    tagline: "Exámenes, medicamentos, dieta y tu bienestar.", progress: 25 },
  { key: "trabajo", name: "Trabajo y Proyectos", path: "/trabajo", color: "var(--tra)", icon: Briefcase,
    tagline: "Proyectos personales, tu empleo y tus horas.", progress: 10 },
  { key: "aprendizaje", name: "Aprendizaje", path: "/aprendizaje", color: "var(--apr)", icon: BookOpen,
    tagline: "Cuadernos, material y resúmenes con IA.", progress: 35 },
  { key: "habitos", name: "Hábitos y Rutinas", path: "/habitos", color: "var(--hab)", icon: Repeat,
    tagline: "Sueño, ejercicio, hábitos y mindfulness.", progress: 40 },
  { key: "relaciones", name: "Relaciones", path: "/relaciones", color: "var(--rel)", icon: Users,
    tagline: "Cultiva tus vínculos con recordatorios amables.", progress: 30 },
];
