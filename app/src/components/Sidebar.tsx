import { NavLink } from "react-router-dom";
import { Brain, CalendarDays, Home, LineChart, LogOut, PersonStanding, Sparkles, type LucideIcon } from "lucide-react";
import { areaPor } from "../areas";
import { useAuth } from "../auth/AuthProvider";

interface Item {
  name: string;
  path: string;
  icon: LucideIcon;
  color?: string;
  end?: boolean;
}

// Arquitectura del menú: primero el pulso diario, luego el núcleo
// (cuerpo, mente, orden), luego el resto de la vida, y al final la inspiración.
const PANORAMA: Item[] = [
  { name: "Inicio", path: "/", icon: Home, end: true },
  { name: "Calendario", path: "/calendario", icon: CalendarDays },
  { name: "Revisión", path: "/revision", icon: LineChart },
];

const NUCLEO: Item[] = [
  areaPor("salud"),
  { name: "Mente", path: "/mente", icon: Brain, color: "var(--men)" },
  { name: "Movimiento", path: "/movimiento", icon: PersonStanding, color: "var(--mov)" },
  areaPor("habitos"),
];

const VIDA: Item[] = ["relaciones", "objetivos", "trabajo", "finanzas", "aprendizaje"].map(areaPor);

const INSPIRACION: Item[] = [
  { name: "Visión", path: "/vision", icon: Sparkles, color: "var(--obj)" },
];

function Seccion({ label, items, onNavigate }: { label: string; items: Item[]; onNavigate: () => void }) {
  return (
    <>
      <div className="nav-label">{label}</div>
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <NavLink
            key={it.path}
            to={it.path}
            end={it.end}
            className={({ isActive }) => "navitem" + (isActive ? " active" : "")}
            onClick={onNavigate}
          >
            <Icon className="ico" size={18} strokeWidth={1.9} />
            {it.name}
            {it.color && <span className="dot" style={{ background: it.color }} />}
          </NavLink>
        );
      })}
    </>
  );
}

export function Sidebar({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const { session, signOut } = useAuth();
  const email = session?.user?.email ?? "";
  const initial = email ? email[0].toUpperCase() : "?";
  return (
    <aside className={"sidebar" + (open ? " open" : "")}>
      <div className="brand">
        <div className="logo">N</div>
        <div>
          <b>NucleoOS</b>
          <small>El sistema operativo de tu vida</small>
        </div>
      </div>
      <nav className="nav">
        <Seccion label="Panorama" items={PANORAMA} onNavigate={onNavigate} />
        <Seccion label="Núcleo" items={NUCLEO} onNavigate={onNavigate} />
        <Seccion label="Mi vida" items={VIDA} onNavigate={onNavigate} />
        <Seccion label="Inspiración" items={INSPIRACION} onNavigate={onNavigate} />
      </nav>
      <div className="spacer" />
      <div className="side-acct">
        <div className="ava">{initial}</div>
        <div className="meta" title={email}>{email}</div>
        <button className="logout" aria-label="Cerrar sesión" title="Cerrar sesión" onClick={() => signOut()}>
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
