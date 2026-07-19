import { useState } from "react";
import { celebrar } from "../lib/celebrar";
import { Check, Rocket, RotateCcw } from "lucide-react";
import { hoyLocal } from "../lib/fechas";
import { radarFacilidad } from "../lib/ia";
import { abrirPomodoro } from "../foco/data";
import { listDayTasks, toggleDayTask } from "../tareas/data";
import { listObjectives, updateMilestoneProgress } from "../objetivos/data";
import { listProjectTasks, listProjects, toggleProjectTask } from "./data";

// Despegue antiprocrastinación: escanea TODO lo pendiente (checklists de
// proyectos, próximos pasos de metas y tareas de hoy) y lo ordena del más
// fácil al más pesado. Las victorias rápidas primero: cada pendiente chico
// completado le regala impulso al siguiente. Eso es diseñar para el TDAH.

interface ItemRadar {
  id: string;
  texto: string;
  origen: string;
  tipo: "proyecto" | "meta" | "tarea";
  refId: string;
  projectId?: string;
  min?: number;
  /** Para poder deshacer un paso de meta sin perder su avance anterior. */
  progresoPrevio?: number;
}

export function Despegue() {
  const [items, setItems] = useState<ItemRadar[] | null>(null);
  const [primerPaso, setPrimerPaso] = useState("");
  const [cargando, setCargando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [hechas, setHechas] = useState(0);
  // Las victorias de esta pasada, en orden: el clic curioso se deshace.
  const [historial, setHistorial] = useState<ItemRadar[]>([]);

  async function escanear() {
    setCargando(true);
    setAviso(null);
    setHechas(0);
    setHistorial([]);
    const candidatos: ItemRadar[] = [];
    try {
      const [proyectos, pasos] = await Promise.all([listProjects(), listProjectTasks()]);
      const nombreDe = new Map(proyectos.filter((p) => p.status === "activo").map((p) => [p.id, p.name]));
      for (const t of pasos.filter((x) => !x.done && nombreDe.has(x.project_id))) {
        candidatos.push({
          id: `p${candidatos.length}`, texto: t.title, origen: `💼 ${nombreDe.get(t.project_id)}`,
          tipo: "proyecto", refId: t.id, projectId: t.project_id,
        });
      }
    } catch { /* sin checklist de proyectos, seguimos */ }
    try {
      for (const o of (await listObjectives()).filter((x) => x.status === "en_camino" || x.status === "en_riesgo")) {
        for (const m of o.milestones.filter((x) => x.progress < 100)) {
          candidatos.push({ id: `m${candidatos.length}`, texto: m.title, origen: `🧭 ${o.title}`, tipo: "meta", refId: m.id, progresoPrevio: m.progress });
        }
      }
    } catch { /* sin metas, seguimos */ }
    try {
      const hoy = hoyLocal();
      for (const t of (await listDayTasks()).filter((x) => !x.done && x.date <= hoy)) {
        candidatos.push({ id: `t${candidatos.length}`, texto: t.title, origen: "📝 Tarea de hoy", tipo: "tarea", refId: t.id });
      }
    } catch { /* sin tareas, seguimos */ }

    if (candidatos.length === 0) {
      setItems([]);
      setCargando(false);
      return;
    }
    const enviados = candidatos.slice(0, 25);
    try {
      const r = await radarFacilidad(enviados.map((c) => ({ id: c.id, texto: `${c.texto} (${c.origen})` })));
      const porId = new Map(enviados.map((c) => [c.id, c]));
      const ordenados: ItemRadar[] = [];
      for (const o of r.orden) {
        const c = porId.get(o.id);
        if (c) ordenados.push({ ...c, min: o.min });
      }
      for (const c of enviados) if (!ordenados.some((x) => x.id === c.id)) ordenados.push(c);
      setItems(ordenados);
      setPrimerPaso(r.primer_paso);
    } catch (e) {
      // Sin IA, un orden honesto igual ayuda: lo más corto de leer primero.
      setItems([...enviados].sort((a, b) => a.texto.length - b.texto.length));
      setPrimerPaso("");
      setAviso(e instanceof Error ? e.message : String(e));
    }
    setCargando(false);
  }

  async function completar(item: ItemRadar) {
    try {
      if (item.tipo === "proyecto") await toggleProjectTask(item.refId, true);
      if (item.tipo === "meta") await updateMilestoneProgress(item.refId, 100);
      if (item.tipo === "tarea") await toggleDayTask(item.refId, true);
    } catch { /* si no se pudo marcar allá, el logro igual fue tuyo */ }
    const quedan = (items ?? []).filter((x) => x.id !== item.id).length;
    // Vaciar la lista completa merece lluvia de año nuevo.
    celebrar(quedan === 0 ? "grande" : "chica");
    setItems((arr) => (arr ?? []).filter((x) => x.id !== item.id));
    setHechas((n) => n + 1);
    setHistorial((h) => [...h, item]);
  }

  /** El clic curioso tiene vuelta atrás: desmarca la última victoria en su
   *  lugar de origen y la devuelve al principio de la lista. */
  async function deshacer() {
    const item = historial[historial.length - 1];
    if (!item) return;
    try {
      if (item.tipo === "proyecto") await toggleProjectTask(item.refId, false);
      if (item.tipo === "meta") await updateMilestoneProgress(item.refId, item.progresoPrevio ?? 0);
      if (item.tipo === "tarea") await toggleDayTask(item.refId, false);
    } catch (e) {
      setAviso(e instanceof Error ? e.message : String(e));
      return;
    }
    setHistorial((h) => h.slice(0, -1));
    setItems((arr) => [item, ...(arr ?? [])]);
    setHechas((n) => Math.max(0, n - 1));
  }

  return (
    <div className="card panel" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Rocket size={18} style={{ color: "var(--accent-ink)", flex: "none" }} />
        <div style={{ flex: 1, minWidth: 180 }}>
          <h3 style={{ margin: 0 }}>Despegue: por dónde empezar</h3>
          <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "2px 0 0" }}>
            Lo más difícil es dejar el suelo: tus pendientes, del más liviano al más pesado. Las victorias rápidas crean el impulso.
          </p>
        </div>
        {items === null ? (
          <button className="btn primary" disabled={cargando} onClick={() => void escanear()}>
            {cargando ? "Preparando…" : "Despegar 🚀"}
          </button>
        ) : (
          <button className="btn ghost" disabled={cargando} onClick={() => void escanear()} aria-label="Volver a escanear">
            <RotateCcw size={14} style={{ verticalAlign: "-2px", marginRight: 5 }} />
            {cargando ? "Preparando…" : "Otra pasada"}
          </button>
        )}
      </div>

      {aviso && <p style={{ fontSize: 12, color: "var(--warn)", marginTop: 8 }}>La IA no pudo ordenar ({aviso}), así que va lo más corto primero.</p>}

      {items && items.length === 0 && (
        <div style={{ marginTop: 10 }}>
          <p style={{ fontSize: 13.5, color: "var(--muted)" }}>
            {historial.length > 0
              ? "Lista vacía a punta de victorias. Eso fue un despegue de verdad. 🚀"
              : "Nada pendiente en proyectos, metas ni tareas. O estás al día, o toca anotar el próximo paso chiquito. 🌱"}
          </p>
          {historial.length > 0 && (
            <button className="btn ghost" style={{ marginTop: 8 }} onClick={() => void deshacer()}>
              ↩︎ Deshacer la última
            </button>
          )}
        </div>
      )}

      {items && items.length > 0 && (
        <div style={{ marginTop: 12 }}>
          {hechas > 0 && (
            <p style={{ fontSize: 12.5, color: "var(--ok)", marginBottom: 8, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span>✓ {hechas} {hechas === 1 ? "victoria" : "victorias"} en esta pasada. El impulso ya está andando.</span>
              {historial.length > 0 && (
                <button className="chip" style={{ border: "none", cursor: "pointer" }} title="¿Marcaste una sin querer? La devuelvo a la lista"
                  onClick={() => void deshacer()}>
                  ↩︎ deshacer la última
                </button>
              )}
            </p>
          )}
          {items.slice(0, 6).map((it, i) => (
            <div key={it.id} className="txrow" style={i === 0 ? { background: "var(--accent-wash)", borderRadius: 10, padding: "10px 10px", border: "none" } : undefined}>
              <button className="hcheck" aria-label={`Marcar ${it.texto} como hecha`} title="La hice"
                onClick={() => void completar(it)}>
                {i === 0 ? <Check size={13} style={{ opacity: 0.35 }} /> : ""}
              </button>
              <div className="txmeta">
                <b>{i === 0 ? "👉 " : ""}{it.texto}</b>
                <small>{it.origen}{it.min ? ` · ≈${it.min} min` : ""}</small>
                {i === 0 && primerPaso && (
                  <small style={{ display: "block", color: "var(--accent-ink)", marginTop: 2 }}>
                    Primer paso de 2 minutos: {primerPaso}
                  </small>
                )}
              </div>
              <button className="chip" style={{ border: "none", cursor: "pointer", flex: "none" }}
                title="Arrancar un bloque de foco con esto"
                onClick={() => abrirPomodoro(it.projectId ? { projectId: it.projectId } : {})}>
                🎯 Foco
              </button>
            </div>
          ))}
          {items.length > 6 && (
            <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 6 }}>
              Hay {items.length - 6} más esperando, pero primero estas seis. Una a la vez.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
