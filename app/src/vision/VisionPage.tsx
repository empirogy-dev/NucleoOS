import { useState } from "react";
import { Sparkles } from "lucide-react";
import { CollageTab } from "./CollageTab";
import { SuenosTab } from "./SuenosTab";
import { VidaIdealTab } from "./VidaIdealTab";

// Visión: el espacio de la inspiración. Sueños (bucket list),
// el collage visual y la descripción de tu vida ideal.
// Regla: si es "algún día quiero esto", vive aquí.
// Cuando se vuelve decisión, pasa a Dirección.

type Tab = "suenos" | "collage" | "ideal";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "suenos", label: "Sueños" },
  { key: "collage", label: "Visual board" },
  { key: "ideal", label: "Vida ideal" },
];

export function VisionPage() {
  const [tab, setTab] = useState<Tab>("suenos");

  return (
    <div className="page" style={{ maxWidth: 1320 }}>
      <div className="page-head">
        <div className="eyebrow"><Sparkles size={13} /> Inspiración</div>
        <h1>Visión</h1>
        <p>Lo que imaginas, deseas y quieres vivir. Aquí nada es obligación: cuando un sueño madura, lo conviertes en meta y pasa a Dirección.</p>
      </div>

      <div className="ftabs">
        {TABS.map((t) => (
          <button key={t.key} className={"ftab" + (tab === t.key ? " active" : "")} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {tab === "suenos" && <SuenosTab />}
      {tab === "collage" && <CollageTab />}
      {tab === "ideal" && <VidaIdealTab />}
    </div>
  );
}
