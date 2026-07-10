import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Menu, Palette, Settings } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { NotifBell } from "./NotifBell";
import { ThemePicker } from "./ThemePicker";
import { AREAS } from "../areas";
import { useAuth } from "../auth/AuthProvider";
import { useSettings } from "../settings/SettingsProvider";

const NOMBRES: Record<string, string> = {
  "/": "Inicio",
  "/calendario": "Calendario",
  "/mente": "Mente",
  "/vision": "Visión",
  "/ajustes": "Ajustes",
};

export function Layout() {
  const [navOpen, setNavOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const loc = useLocation();
  const { session } = useAuth();
  const { displayName } = useSettings();
  const inicial = (displayName || session?.user?.email || "?").trim().charAt(0).toUpperCase();
  const current = NOMBRES[loc.pathname] ?? AREAS.find((a) => a.path === loc.pathname)?.name ?? "";

  return (
    <div className="app">
      <div className={"scrim" + (navOpen ? " show" : "")} onClick={() => setNavOpen(false)} />
      <Sidebar open={navOpen} onNavigate={() => setNavOpen(false)} />
      <div className="content">
        <header className="topbar">
          <button className="iconbtn hamb" aria-label="Menú" onClick={() => setNavOpen(true)}>
            <Menu size={18} />
          </button>
          <span className="crumb">NucleoOS: {current}</span>
          <span className="sp" />
          <NotifBell />
          <button className="iconbtn" aria-label="Cambiar tema" title="Cambiar tema" onClick={() => setPickerOpen(true)}>
            <Palette size={18} />
          </button>
          <Link to="/ajustes" className="iconbtn" aria-label="Ajustes" title="Ajustes">
            <Settings size={18} />
          </Link>
          <div className="avatar">{inicial}</div>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
      {pickerOpen && <ThemePicker onClose={() => setPickerOpen(false)} />}
    </div>
  );
}
