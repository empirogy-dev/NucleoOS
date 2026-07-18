import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { addActivity, deleteActivity, listActivity, type ActivityEntry } from "../objetivos/data";
import { fechaRegistro } from "../lib/fechas";
import { AREAS } from "../areas";

/**
 * Avances de un área: muestra el registro transversal (activity_log)
 * filtrado por área y permite anotar un avance rápido desde aquí mismo.
 * Así, lo que registras en Dirección asignado a un área aparece en el área.
 */
export function AvancesArea({ area }: { area: string }) {
  const [items, setItems] = useState<ActivityEntry[]>([]);
  const [texto, setTexto] = useState("");
  const [ready, setReady] = useState(false);

  const reload = useCallback(async () => {
    try {
      const all = await listActivity(150);
      setItems(all.filter((a) => a.area === area));
      setReady(true);
    } catch {
      setReady(false);
    }
  }, [area]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const color = AREAS.find((a) => a.key === area)?.color ?? "var(--accent)";
  if (!ready) return null;

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    await addActivity({ area, date: fechaRegistro(), description: texto.trim() });
    setTexto("");
    void reload();
  }

  return (
    <div className="card panel" style={{ marginTop: 14 }}>
      <h3>Avances en esta área</h3>
      <form onSubmit={agregar} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input className="input-inline" value={texto} onChange={(e) => setTexto(e.target.value)}
          placeholder="¿Qué avanzaste hoy?" aria-label="Nuevo avance" />
        <button className="btn ghost" type="submit">Registrar</button>
      </form>
      {items.length === 0 && (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>
          Todavía no hay avances aquí. También puedes asignarlos desde Dirección y aparecerán en esta lista.
        </p>
      )}
      <div className="tl">
        {items.slice(0, 8).map((a) => (
          <div className="row" key={a.id}>
            <span className="tdot" style={{ background: color }} />
            <div className="tx" style={{ flex: 1 }}>
              <b>{a.date}</b>
              {a.description}
            </div>
            <button className="xdel" aria-label="Eliminar avance" style={{ width: 24, height: 24 }}
              onClick={async () => { await deleteActivity(a.id); void reload(); }}>
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
