import { useRef, useState } from "react";
import { GripVertical } from "lucide-react";

// Cuadrícula reordenable: cada tarjeta se arrastra desde su agarre (⋮)
// y el orden queda guardado por página. Didáctico y tuyo.

export interface Bloque {
  id: string;
  el: React.ReactNode;
}

export function OrdenGrid({ clave, bloques }: { clave: string; bloques: Bloque[] }) {
  const ids = bloques.map((b) => b.id);
  const [guardado, setGuardado] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(`nucleoos-orden-${clave}`);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });
  const arrastrando = useRef<string | null>(null);
  const [habilitado, setHabilitado] = useState<string | null>(null);
  const [enVuelo, setEnVuelo] = useState<string | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);

  // Orden efectivo: lo guardado primero, las tarjetas nuevas al final.
  const orden = [...guardado.filter((id) => ids.includes(id)), ...ids.filter((id) => !guardado.includes(id))];
  const porId = new Map(bloques.map((b) => [b.id, b.el]));

  function soltar(destino: string) {
    const origen = arrastrando.current;
    arrastrando.current = null;
    setSobre(null);
    setEnVuelo(null);
    setHabilitado(null);
    if (!origen || origen === destino) return;
    const sin = orden.filter((x) => x !== origen);
    const idx = sin.indexOf(destino);
    const nuevo = [...sin.slice(0, idx), origen, ...sin.slice(idx + (orden.indexOf(origen) < orden.indexOf(destino) ? 1 : 0))];
    localStorage.setItem(`nucleoos-orden-${clave}`, JSON.stringify(nuevo));
    setGuardado(nuevo);
  }

  return (
    <div className="orden-grid">
      {orden.map((id) => (
        <div
          key={id}
          className={"orden-item" + (enVuelo === id ? " arrastrando" : "") + (sobre === id && enVuelo !== id ? " destino" : "")}
          draggable={habilitado === id}
          onDragStart={(e) => {
            arrastrando.current = id;
            setEnVuelo(id);
            e.dataTransfer.effectAllowed = "move";
          }}
          onDragEnd={() => {
            arrastrando.current = null;
            setEnVuelo(null);
            setSobre(null);
            setHabilitado(null);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (sobre !== id) setSobre(id);
          }}
          onDragLeave={() => {
            if (sobre === id) setSobre(null);
          }}
          onDrop={(e) => {
            e.preventDefault();
            soltar(id);
          }}
        >
          <span
            className="orden-grip"
            title="Arrastra para reordenar"
            onMouseDown={() => setHabilitado(id)}
            onMouseUp={() => setHabilitado(null)}
          >
            <GripVertical size={15} />
          </span>
          {porId.get(id)}
        </div>
      ))}
    </div>
  );
}
