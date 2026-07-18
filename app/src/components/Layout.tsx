import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Menu, Palette, Settings } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { NotifBell } from "./NotifBell";
import { ThemePicker } from "./ThemePicker";
import { Pomodoro } from "./Pomodoro";
import { CapturaRapida } from "./CapturaRapida";
import { fechaLarga, useFechaActiva } from "../fecha/FechaActiva";
import { AREAS } from "../areas";
import { useAuth } from "../auth/AuthProvider";
import { useSettings } from "../settings/SettingsProvider";

const NOMBRES: Record<string, string> = {
  "/": "Inicio",
  "/calendario": "Calendario",
  "/revision": "Revisión",
  "/mente": "Mente",
  "/movimiento": "Movimiento",
  "/vision": "Visión",
  "/ajustes": "Ajustes",
};

export function Layout() {
  const [navOpen, setNavOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const loc = useLocation();
  const { session } = useAuth();
  const { displayName } = useSettings();
  const { fecha, esHoy, volverAHoy } = useFechaActiva();
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
        {!esHoy && (
          <div className="fecha-banner">
            🕰 Estás registrando el <b>{fechaLarga(fecha)}</b>. Todo lo que marques se guarda en ese día.
            <button className="chip" style={{ border: "none", cursor: "pointer", marginLeft: 10 }} onClick={volverAHoy}>
              volver a hoy
            </button>
          </div>
        )}
        <main>
          <Outlet />
        </main>
      </div>
      <Pomodoro />
      <CapturaRapida />
      {pickerOpen && <ThemePicker onClose={() => setPickerOpen(false)} />}
    </div>
  );
}
