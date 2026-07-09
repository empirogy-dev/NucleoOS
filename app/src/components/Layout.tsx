import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu, Palette } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { ThemePicker } from "./ThemePicker";
import { AREAS } from "../areas";

export function Layout() {
  const [navOpen, setNavOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const loc = useLocation();
  const current =
    loc.pathname === "/" ? "Inicio" : AREAS.find((a) => a.path === loc.pathname)?.name ?? "";

  return (
    <div className="app">
      <div className={"scrim" + (navOpen ? " show" : "")} onClick={() => setNavOpen(false)} />
      <Sidebar open={navOpen} onNavigate={() => setNavOpen(false)} />
      <div className="content">
        <header className="topbar">
          <button className="iconbtn hamb" aria-label="Menú" onClick={() => setNavOpen(true)}>
            <Menu size={18} />
          </button>
          <span className="crumb">Sistema de Vida · {current}</span>
          <span className="sp" />
          <button className="iconbtn" aria-label="Cambiar tema" title="Cambiar tema" onClick={() => setPickerOpen(true)}>
            <Palette size={18} />
          </button>
          <div className="avatar">B</div>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
      {pickerOpen && <ThemePicker onClose={() => setPickerOpen(false)} />}
    </div>
  );
}
