import { NavLink } from "react-router-dom";
import { Brain, CalendarDays, Home, LineChart, LogOut, PersonStanding, Sparkles, X, type LucideIcon } from "lucide-react";
import { areaPor } from "../areas";
import { useAuth } from "../auth/AuthProvider";
import { useIdioma } from "../idioma/IdiomaProvider";
import { useModulos } from "../modulos/ModulosProvider";
import { LogoAtomo } from "./LogoAtomo";

interface Item {
  tkey: string; // llave del diccionario: el menú habla el idioma elegido
  path: string;
  icon: LucideIcon;
  color?: string;
  end?: boolean;
}

// Arquitectura del menú: primero el pulso diario, luego el núcleo
// (cuerpo, mente, orden), luego el resto de la vida, y al final la inspiración.
const PANORAMA: Item[] = [
  { tkey: "nav.inicio", path: "/", icon: Home, end: true },
  { tkey: "nav.calendario", path: "/calendario", icon: CalendarDays },
  { tkey: "nav.revision", path: "/revision", icon: LineChart },
];

const NUCLEO: Item[] = [
  { ...areaPor("salud"), tkey: "area.salud" },
  { tkey: "nav.mente", path: "/mente", icon: Brain, color: "var(--men)" },
  { tkey: "nav.movimiento", path: "/movimiento", icon: PersonStanding, color: "var(--mov)" },
  { ...areaPor("habitos"), tkey: "area.habitos" },
];

const VIDA: Item[] = ["relaciones", "objetivos", "trabajo", "finanzas", "aprendizaje"].map((k) => ({ ...areaPor(k), tkey: `area.${k}` }));

const INSPIRACION: Item[] = [
  { tkey: "nav.vision", path: "/vision", icon: Sparkles, color: "var(--obj)" },
];

function Seccion({ label, items, onNavigate }: { label: string; items: Item[]; onNavigate: () => void }) {
  const { t } = useIdioma();
  const { esVisible } = useModulos();
  const visibles = items.filter((it) => esVisible(it.path));
  if (visibles.length === 0) return null; // sección entera escondida: ni el título
  return (
    <>
      <div className="nav-label">{label}</div>
      {visibles.map((it) => {
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
            {t(it.tkey)}
            {it.color && <span className="dot" style={{ background: it.color }} />}
          </NavLink>
        );
      })}
    </>
  );
}

export function Sidebar({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const { session, signOut } = useAuth();
  const { t } = useIdioma();
  const email = session?.user?.email ?? "";
  const initial = email ? email[0].toUpperCase() : "?";
  return (
    <aside className={"sidebar" + (open ? " open" : "")}>
      <div className="brand">
        <div className="logo"><LogoAtomo size={22} /></div>
        <div>
          <b>NucleoOS</b>
          <small>{t("lema")}</small>
        </div>
        <button className="side-close" aria-label={t("topbar.cerrarmenu")} onClick={onNavigate}>
          <X size={15} />
        </button>
      </div>
      <nav className="nav">
        <Seccion label={t("sec.panorama")} items={PANORAMA} onNavigate={onNavigate} />
        <Seccion label={t("sec.nucleo")} items={NUCLEO} onNavigate={onNavigate} />
        <Seccion label={t("sec.mivida")} items={VIDA} onNavigate={onNavigate} />
        <Seccion label={t("sec.inspiracion")} items={INSPIRACION} onNavigate={onNavigate} />
      </nav>
      <div className="spacer" />
      <div className="side-acct">
        <div className="ava">{initial}</div>
        <div className="meta" title={email}>{email}</div>
        <button className="logout" aria-label={t("topbar.cerrarsesion")} title={t("topbar.cerrarsesion")} onClick={() => signOut()}>
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
