import { useState } from "react";
import { Pencil, Play, Plus, Trash2, X } from "lucide-react";

// Rutinas guiadas paso a paso: función ejecutiva externalizada.
// Como el reproductor de la sadhana pero para la vida diaria: un paso
// a la vez, en grande, sin ver la lista completa que abruma.

export interface Rutina {
  id: string;
  nombre: string;
  emoji: string;
  pasos: string[];
}

const LS = "nucleoos-rutinas";

const SUGERIDAS: Rutina[] = [
  {
    id: "manana",
    nombre: "Mañana suave",
    emoji: "🌅",
    pasos: ["Un vaso de agua, antes que nada", "Estira la cama", "Ducha o cara lavada", "Desayuna algo con proteína", "Mira tus Tareas de hoy en el Inicio"],
  },
  {
    id: "noche",
    nombre: "Cierre del día",
    emoji: "🌙",
    pasos: ["Deja el celular cargando lejos de la cama", "Pijama y dientes", "Prepara lo de mañana (ropa, bolso)", "Anota tres cosas buenas de hoy", "Luz baja y a la cama"],
  },
];

function cargar(): Rutina[] {
  try {
    const raw = localStorage.getItem(LS);
    if (raw) {
      const r = JSON.parse(raw) as Rutina[];
      if (Array.isArray(r) && r.length > 0) return r;
    }
  } catch { /* nada */ }
  return SUGERIDAS;
}

function guardar(rs: Rutina[]) {
  localStorage.setItem(LS, JSON.stringify(rs));
}

function campanita() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 659.25;
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    o.start();
    o.stop(ctx.currentTime + 0.85);
    setTimeout(() => void ctx.close(), 1000);
  } catch { /* sin audio */ }
}

export function RutinasTab() {
  const [rutinas, setRutinas] = useState<Rutina[]>(cargar);
  const [activa, setActiva] = useState<Rutina | null>(null);
  const [paso, setPaso] = useState(0);
  const [editando, setEditando] = useState<Rutina | null>(null);

  function actualizar(rs: Rutina[]) {
    setRutinas(rs);
    guardar(rs);
  }

  // ---------- Reproductor: un paso a la vez ----------
  if (activa) {
    const terminada = paso >= activa.pasos.length;
    return (
      <div className="card panel" style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", padding: "34px 26px" }}>
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>{activa.emoji} {activa.nombre}</p>
        <div className="sd-dots">
          {activa.pasos.map((_, i) => (
            <span key={i} className={"sd-dot" + (i === paso ? " activo" : i < paso ? " done" : "")} />
          ))}
        </div>
        {terminada ? (
          <>
            <p style={{ fontSize: 22, fontWeight: 600, margin: "18px 0" }}>Rutina completa. 🌱</p>
            <p style={{ fontSize: 13.5, color: "var(--ink-soft)", marginBottom: 20 }}>
              Cada paso que diste hoy le baja la fricción al de mañana.
            </p>
            <button className="btn primary" onClick={() => { setActiva(null); setPaso(0); }}>Listo</button>
          </>
        ) : (
          <>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: "14px 0 4px" }}>Paso {paso + 1} de {activa.pasos.length}, solo esto:</p>
            <p style={{ fontSize: 24, fontWeight: 600, lineHeight: 1.35, margin: "6px 0 22px" }}>{activa.pasos[paso]}</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button className="btn primary" onClick={() => { campanita(); setPaso(paso + 1); }}>Listo, siguiente</button>
              <button className="btn ghost" onClick={() => { setActiva(null); setPaso(0); }}>Salir</button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ---------- Editor ----------
  if (editando) {
    return (
      <RutinaEditor
        rutina={editando}
        onSave={(r) => {
          const idx = rutinas.findIndex((x) => x.id === r.id);
          actualizar(idx === -1 ? [...rutinas, r] : rutinas.map((x) => (x.id === r.id ? r : x)));
          setEditando(null);
        }}
        onCancel={() => setEditando(null)}
      />
    );
  }

  // ---------- Lista ----------
  return (
    <>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14, maxWidth: "64ch" }}>
        Una rutina guiada te muestra un solo paso a la vez, en grande. Nada de listas eternas: la app recuerda por ti qué viene después.
      </p>
      <div className="rev-grid">
        {rutinas.map((r) => (
          <div className="card panel" key={r.id}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>{r.emoji}</span>
              <h3 style={{ margin: 0, flex: 1 }}>{r.nombre}</h3>
              <button className="xdel" aria-label="Editar rutina" style={{ width: 26, height: 26 }} onClick={() => setEditando(r)}>
                <Pencil size={13} />
              </button>
              <button className="xdel" aria-label="Eliminar rutina" style={{ width: 26, height: 26 }}
                onClick={() => { if (window.confirm(`¿Eliminar la rutina ${r.nombre}?`)) actualizar(rutinas.filter((x) => x.id !== r.id)); }}>
                <Trash2 size={13} />
              </button>
            </div>
            <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 12 }}>
              {r.pasos.length} pasos, el primero: {r.pasos[0] ?? "sin pasos"}
            </p>
            <button className="btn primary" onClick={() => { setActiva(r); setPaso(0); }}>
              <Play size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />
              Empezar
            </button>
          </div>
        ))}
        <div className="card panel" style={{ display: "grid", placeItems: "center", minHeight: 140 }}>
          <button className="btn ghost" onClick={() => setEditando({ id: `r${Date.now()}`, nombre: "", emoji: "✨", pasos: [] })}>
            <Plus size={15} style={{ verticalAlign: "-2px", marginRight: 5 }} />
            Nueva rutina
          </button>
        </div>
      </div>
    </>
  );
}

function RutinaEditor({ rutina, onSave, onCancel }: { rutina: Rutina; onSave: (r: Rutina) => void; onCancel: () => void }) {
  const [nombre, setNombre] = useState(rutina.nombre);
  const [emoji, setEmoji] = useState(rutina.emoji);
  const [pasos, setPasos] = useState(rutina.pasos.join("\n"));

  return (
    <div className="card panel" style={{ maxWidth: 560 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <h3 style={{ margin: 0, flex: 1 }}>{rutina.nombre ? "Editar rutina" : "Nueva rutina"}</h3>
        <button className="xdel" aria-label="Cerrar" style={{ width: 26, height: 26 }} onClick={onCancel}><X size={14} /></button>
      </div>
      <div className="frow">
        <div className="field" style={{ width: 74 }}><label>Emoji</label>
          <input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} /></div>
        <div className="field" style={{ flex: 1 }}><label>Nombre</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Mañana suave" autoFocus /></div>
      </div>
      <div className="field"><label>Pasos, uno por línea, chiquitos</label>
        <textarea rows={7} value={pasos} onChange={(e) => setPasos(e.target.value)}
          placeholder={"Un vaso de agua\nEstira la cama\nDucha"} /></div>
      <button className="btn primary" style={{ width: "100%" }}
        disabled={!nombre.trim() || pasos.trim().length === 0}
        onClick={() => onSave({ ...rutina, nombre: nombre.trim(), emoji: emoji.trim() || "✨", pasos: pasos.split("\n").map((s) => s.trim()).filter(Boolean) })}>
        Guardar rutina
      </button>
    </div>
  );
}
