import { NavLink } from "react-router-dom";
import { CalendarDays, Home, LogOut, Settings } from "lucide-react";
import { AREAS } from "../areas";
import { useAuth } from "../auth/AuthProvider";

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
          <small>Tu sistema de vida</small>
        </div>
      </div>
      <nav className="nav">
        <NavLink to="/" end className={({ isActive }) => "navitem" + (isActive ? " active" : "")} onClick={onNavigate}>
          <Home className="ico" size={18} strokeWidth={1.9} />
          Inicio
        </NavLink>
        <NavLink to="/calendario" className={({ isActive }) => "navitem" + (isActive ? " active" : "")} onClick={onNavigate}>
          <CalendarDays className="ico" size={18} strokeWidth={1.9} />
          Calendario
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
      <div className="spacer" />
      <NavLink to="/ajustes" className={({ isActive }) => "navitem" + (isActive ? " active" : "")} onClick={onNavigate}>
        <Settings className="ico" size={18} strokeWidth={1.9} />
        Ajustes
      </NavLink>
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
