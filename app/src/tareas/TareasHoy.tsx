import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { hoyLocal } from "../lib/fechas";
import { TablesMissingError } from "../finanzas/data";
import {
  addDayTask,
  deleteDayTask,
  listDayTasks,
  moveDayTaskToToday,
  toggleDayTask,
  type DayTask,
} from "./data";

// El checklist del día en el Inicio: cosas sueltas que no son hábito
// ni meta (hacer la cama, lavar la ropa), anotadas para no olvidarlas.

export function TareasHoy() {
  const [tareas, setTareas] = useState<DayTask[]>([]);
  const [nueva, setNueva] = useState("");
  const [needsMigration, setNeedsMigration] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      setTareas(await listDayTasks());
      setNeedsMigration(false);
      setError(null);
    } catch (e) {
      if (e instanceof TablesMissingError) setNeedsMigration(true);
      else setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const hoy = hoyLocal();
  const deHoy = tareas.filter((t) => t.date === hoy);
  const pendientesAyer = tareas.filter((t) => t.date < hoy && !t.done);
  const listas = deHoy.filter((t) => t.done).length;

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    if (!nueva.trim() || busy) return;
    setBusy(true);
    try {
      await addDayTask(nueva.trim());
      setNueva("");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (needsMigration) {
    return (
      <div className="card panel">
        <h3>📝 Tareas de hoy</h3>
        <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>
          Para estrenar el checklist del día falta un paso en Supabase: corre
          <code> supabase/migrations/0033_tareas_dia.sql</code> en el SQL Editor y listo.
        </p>
        <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => void reload()}>Ya lo hice, reintentar</button>
      </div>
    );
  }

  return (
    <div className="card panel">
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <h3 style={{ flex: 1 }}>📝 Tareas de hoy</h3>
        {deHoy.length > 0 && (
          <span className="chip">{listas} de {deHoy.length}</span>
        )}
      </div>

      <form onSubmit={agregar} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input className="input-inline" value={nueva} onChange={(e) => setNueva(e.target.value)}
          placeholder="Hacer la cama, lavar la ropa, llamar al banco…" />
        <button className="btn ghost" type="submit" disabled={busy}>Anotar</button>
      </form>

      {error && <p style={{ fontSize: 12.5, color: "var(--err)", marginBottom: 8 }}>{error}</p>}

      {deHoy.length === 0 && pendientesAyer.length === 0 && (
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Anota lo suelto del día para sacarlo de tu cabeza. No es rutina ni meta, es solo hoy.
        </p>
      )}

      {deHoy.map((t) => (
        <TareaFila key={t.id} t={t} onChanged={() => void reload()} />
      ))}

      {pendientesAyer.length > 0 && (
        <>
          <p style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".11em", color: "var(--muted)", fontWeight: 600, margin: "12px 0 4px" }}>
            Quedaron de otros días
          </p>
          {pendientesAyer.map((t) => (
            <TareaFila key={t.id} t={t} deOtroDia onChanged={() => void reload()} />
          ))}
        </>
      )}
    </div>
  );
}

function TareaFila({ t, deOtroDia = false, onChanged }: { t: DayTask; deOtroDia?: boolean; onChanged: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 0", borderBottom: "1px solid var(--line-soft)" }}>
      <button
        aria-label={t.done ? "Desmarcar tarea" : "Marcar tarea lista"}
        onClick={async () => { await toggleDayTask(t.id, !t.done); onChanged(); }}
        style={{
          width: 19, height: 19, borderRadius: 6, cursor: "pointer", flex: "none",
          border: `1.5px solid ${t.done ? "var(--accent)" : "var(--line)"}`,
          background: t.done ? "var(--accent)" : "transparent",
          color: "#fff", fontSize: 11, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
        {t.done ? "✓" : ""}
      </button>
      <span style={{
        flex: 1, fontSize: 13.5, minWidth: 0,
        color: t.done ? "var(--muted)" : "var(--ink)",
        textDecoration: t.done ? "line-through" : "none",
      }}>
        {t.title}
      </span>
      {deOtroDia && (
        <button className="chip" style={{ border: "none", cursor: "pointer" }}
          onClick={async () => { await moveDayTaskToToday(t.id); onChanged(); }}>
          pasar a hoy
        </button>
      )}
      <button className="xdel" aria-label="Eliminar tarea" style={{ width: 24, height: 24 }}
        onClick={async () => { await deleteDayTask(t.id); onChanged(); }}>
        <Trash2 size={12} />
      </button>
    </div>
  );
}
