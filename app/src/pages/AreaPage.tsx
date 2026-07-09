import { useLocation } from "react-router-dom";
import { AREAS } from "../areas";

export function AreaPage() {
  const loc = useLocation();
  const area = AREAS.find((a) => a.path === loc.pathname);
  if (!area) return null;
  const Icon = area.icon;

  return (
    <div className="page">
      <div className="page-head">
        <div className="eyebrow">
          <span className="adot" style={{ width: 8, height: 8, borderRadius: "50%", background: area.color, display: "inline-block" }} />
          Área
        </div>
        <h1>{area.name}</h1>
        <p>{area.tagline}</p>
      </div>

      <div className="empty">
        <div className="badge" style={{ background: area.color }}>
          <Icon size={28} strokeWidth={1.8} />
        </div>
        <h2>En construcción</h2>
        <p>Pronto vas a poder trabajar aquí: {area.tagline.toLowerCase()}</p>
        <button className="btn primary">Entendido</button>
      </div>
    </div>
  );
}
