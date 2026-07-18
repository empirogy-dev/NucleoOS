import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { cargarFuentes, listObjectives, progresoDe, type Fuentes, type Objective } from "../objetivos/data";
import { AREAS } from "../areas";

// Las metas de un área también viven en su página: si tu meta es de
// Finanzas, la ves en Finanzas avanzando, no solo en Dirección.

export function MetasDeArea({ area }: { area: string }) {
  const [metas, setMetas] = useState<Objective[]>([]);
  const [fuentes, setFuentes] = useState<Fuentes | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [objs, f] = await Promise.all([listObjectives(), cargarFuentes()]);
        setMetas(objs.filter((o) => o.area === area && (o.status === "en_camino" || o.status === "en_riesgo")));
        setFuentes(f);
      } catch { /* sin metas migradas, la tarjeta no aparece */ }
    })();
  }, [area]);

  if (metas.length === 0 || !fuentes) return null;
  const color = AREAS.find((a) => a.key === area)?.color ?? "var(--obj)";

  return (
    <div className="card panel" style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 17 }}>🧭</span>
        <h3 style={{ margin: 0, flex: 1 }}>{metas.length === 1 ? "Tu meta de esta área" : "Tus metas de esta área"}</h3>
        <Link to="/objetivos" style={{ fontSize: 12, color: "var(--accent-ink)", fontWeight: 600 }}>abrir en Dirección</Link>
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {metas.map((o) => {
          const pct = progresoDe(o, fuentes);
          return (
            <div key={o.id}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13, marginBottom: 4 }}>
                <b>{o.title}</b>
                <b className="tnum">{pct}%</b>
              </div>
              <div className="track" style={{ height: 6 }}>
                <div className="fill" style={{ width: `${pct}%`, background: color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
