import { NavLink } from "react-router-dom";
import { Home } from "lucide-react";
import { AREAS } from "../areas";

export function Sidebar({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  return (
    <aside className={"sidebar" + (open ? " open" : "")}>
      <div className="brand">
        <div className="logo">SV</div>
        <div>
          <b>Sistema de Vida</b>
          <small>Tu segundo cerebro</small>
        </div>
      </div>
      <nav className="nav">
        <NavLink to="/" end className={({ isActive }) => "navitem" + (isActive ? " active" : "")} onClick={onNavigate}>
          <Home className="ico" size={18} strokeWidth={1.9} />
          Inicio
        </NavLink>
        {AREAS.map((a) => {
          const Icon = a.icon;
          return (
            <NavLink
              key={a.key}
              to={a.path}
              className={({ isActive }) => "navitem" + (isActive ? " active" : "")}
              onClick={onNavigate}
            >
              <Icon className="ico" size={18} strokeWidth={1.9} />
              {a.name}
              <span className="dot" style={{ background: a.color }} />
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
