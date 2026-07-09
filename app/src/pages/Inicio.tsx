import { Sparkles } from "lucide-react";
import { AREAS } from "../areas";

const color = (key: string) => AREAS.find((a) => a.key === key)?.color ?? "var(--accent)";

const AVANCES = [
  { area: "finanzas", date: "07 JUL · FINANZAS", text: "Se fusionaron los posts de Finanzas y Plutus en un solo sistema." },
  { area: "salud", date: "07 JUL · SALUD", text: "Fix del toggle kg/lb del picker de peso." },
  { area: "objetivos", date: "03 JUL · OBJETIVOS", text: "REVIEW por área completado — objetivos reales definidos." },
];

export function Inicio() {
  const META = 55;
  return (
    <div className="page">
      <div className="page-head">
        <div className="eyebrow">
          <Sparkles size={13} /> Inicio
        </div>
        <h1>Hola, Bárbara</h1>
        <p>Todas tus áreas de vida en un lugar. Esto es lo que está pasando hoy.</p>
      </div>

      <div className="card vision">
        <div className="lb">Visión de vida</div>
        <q>Generar ingresos desde internet, desde cualquier parte, haciendo algo que me gusta, sin sentirme esclavizado.</q>
      </div>

      <div className="statrow">
        <div className="card stat" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div
            className="ring"
            style={{ background: `conic-gradient(var(--accent) 0 ${META}%, var(--line) ${META}% 100%)` }}
          >
            <div className="in">
              <b className="tnum">{META}%</b>
              <span>Meta</span>
            </div>
          </div>
        </div>
        <div className="card stat"><div className="k">Áreas</div><div className="v tnum">7 / 7</div></div>
        <div className="card stat"><div className="k">Próximos pasos</div><div className="v tnum">35</div></div>
        <div className="card stat"><div className="k">En riesgo</div><div className="v tnum">0</div></div>
      </div>

      <div className="panelgrid">
        <div className="card panel">
          <h3>Progreso por área</h3>
          {AREAS.map((a) => (
            <div className="bar" key={a.key}>
              <div className="top">
                <span className="lbl"><span className="adot" style={{ background: a.color }} />{a.name}</span>
                <b className="tnum">{a.progress}%</b>
              </div>
              <div className="track">
                <div className="fill" style={{ width: `${a.progress}%`, background: a.color }} />
              </div>
            </div>
          ))}
        </div>

        <div className="card panel">
          <h3>Avances recientes</h3>
          <div className="tl">
            {AVANCES.map((v, i) => (
              <div className="row" key={i}>
                <span className="tdot" style={{ background: color(v.area) }} />
                <div className="tx"><b>{v.date}</b>{v.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card sob">
        <span className="seed">🌱</span>
        <div>
          <div className="t1">Libre de marihuana</div>
          <div className="t2 tnum">1 año · 4 meses</div>
        </div>
        <div className="hitos">
          <span className="hito">✓ THC eliminado</span>
          <span className="hito">✓ Memoria recuperada</span>
          <span className="hito next">Próximo: 18 meses</span>
        </div>
      </div>
    </div>
  );
}
