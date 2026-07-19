import { useEffect, useState } from "react";
import { useIdioma } from "../idioma/IdiomaProvider";
import { Pencil, Play, Plus, Trash2, X } from "lucide-react";

// Rutinas guiadas paso a paso: función ejecutiva externalizada.
// Cada paso puede llevar sus propios minutos (los pones tú): el reproductor
// muestra un paso a la vez, en grande, con cuenta regresiva y campanita.

export interface PasoRutina {
  texto: string;
  min: number | null; // null = sin tiempo, avanzas tú con el botón
}

export interface Rutina {
  id: string;
  nombre: string;
  emoji: string;
  pasos: PasoRutina[];
}

const LS = "nucleoos-rutinas";
export const MAX_PASOS = 10;

const SUGERIDAS: Rutina[] = [
  {
    id: "manana",
    nombre: "Mañana suave",
    emoji: "🌅",
    pasos: [
      { texto: "Un vaso de agua, antes que nada", min: 1 },
      { texto: "Estira la cama", min: 2 },
      { texto: "Ducha o cara lavada", min: 10 },
      { texto: "Desayuna algo con proteína", min: 15 },
      { texto: "Mira tus Tareas de hoy en el Inicio", min: 2 },
    ],
  },
  {
    id: "noche",
    nombre: "Cierre del día",
    emoji: "🌙",
    pasos: [
      { texto: "Deja el celular cargando lejos de la cama", min: 1 },
      { texto: "Pijama y dientes", min: 5 },
      { texto: "Prepara lo de mañana (ropa, bolso)", min: 5 },
      { texto: "Anota tres cosas buenas de hoy", min: 3 },
      { texto: "Luz baja y a la cama", min: null },
    ],
  },
];

function cargar(): Rutina[] {
  try {
    const raw = localStorage.getItem(LS);
    if (raw) {
      const r = JSON.parse(raw) as Array<Rutina & { pasos: Array<PasoRutina | string> }>;
      if (Array.isArray(r) && r.length > 0) {
        // Migración del formato viejo: pasos que eran texto puro pasan a objeto.
        return r.map((x) => ({
          ...x,
          pasos: x.pasos.map((p) => (typeof p === "string" ? { texto: p, min: null } : p)),
        }));
      }
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
  const { t: tr } = useIdioma();
  const [rutinas, setRutinas] = useState<Rutina[]>(cargar);
  const [activa, setActiva] = useState<Rutina | null>(null);
  const [editando, setEditando] = useState<Rutina | null>(null);

  function actualizar(rs: Rutina[]) {
    setRutinas(rs);
    guardar(rs);
  }

  if (activa) {
    return <ReproductorRutina rutina={activa} onSalir={() => setActiva(null)} />;
  }

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

  return (
    <>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14, maxWidth: "64ch" }}>
        {tr("Una rutina guiada te muestra un solo paso a la vez, en grande, con el tiempo que tú le pusiste. Nada de listas eternas: la app recuerda por ti qué viene después.")}
      </p>
      <div className="rev-grid">
        {rutinas.map((r) => {
          const totalMin = r.pasos.reduce((s, p) => s + (p.min ?? 0), 0);
          return (
            <div className="card panel" key={r.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 22 }}>{r.emoji}</span>
                <h3 style={{ margin: 0, flex: 1 }}>{tr(r.nombre)}</h3>
                <button className="xdel" aria-label="Editar rutina" style={{ width: 26, height: 26 }} onClick={() => setEditando(r)}>
                  <Pencil size={13} />
                </button>
                <button className="xdel" aria-label="Eliminar rutina" style={{ width: 26, height: 26 }}
                  onClick={() => { if (window.confirm(`${tr("¿Eliminar la rutina")} ${r.nombre}?`)) actualizar(rutinas.filter((x) => x.id !== r.id)); }}>
                  <Trash2 size={13} />
                </button>
              </div>
              <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 12 }}>
                {r.pasos.length} {tr("pasos")}{totalMin > 0 ? `, ≈${totalMin} min` : ""}. {tr("El primero:")} {r.pasos[0] ? tr(r.pasos[0].texto) : tr("sin pasos")}
              </p>
              <button className="btn primary" onClick={() => setActiva(r)}>
                <Play size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />
                Empezar
              </button>
            </div>
          );
        })}
        <div className="card panel" style={{ display: "grid", placeItems: "center", minHeight: 140 }}>
          <button className="btn ghost" onClick={() => setEditando({ id: `r${Date.now()}`, nombre: "", emoji: "✨", pasos: [] })}>
            <Plus size={15} style={{ verticalAlign: "-2px", marginRight: 5 }} />
            {tr("Nueva rutina")}
          </button>
        </div>
      </div>
    </>
  );
}

/** Reproductor: un paso a la vez, con cuenta regresiva si el paso tiene minutos. */
function ReproductorRutina({ rutina, onSalir }: { rutina: Rutina; onSalir: () => void }) {
  const { t: tr } = useIdioma();
  const [paso, setPaso] = useState(0);
  const actual = rutina.pasos[paso] ?? null;
  const [restante, setRestante] = useState<number | null>(actual?.min != null ? actual.min * 60 : null);
  const [corriendo, setCorriendo] = useState(false);
  const terminada = paso >= rutina.pasos.length;

  // Al cambiar de paso, el reloj se arma con los minutos de ese paso.
  useEffect(() => {
    const p = rutina.pasos[paso] ?? null;
    setRestante(p?.min != null ? p.min * 60 : null);
    setCorriendo(false);
  }, [paso, rutina]);

  // Cuenta regresiva del paso; al llegar a cero suena y avanza solo.
  useEffect(() => {
    if (!corriendo || restante === null || restante <= 0) return;
    const id = setInterval(() => setRestante((r) => (r === null ? null : Math.max(0, r - 1))), 1000);
    return () => clearInterval(id);
  }, [corriendo, restante]);

  useEffect(() => {
    if (corriendo && restante === 0) {
      campanita();
      setPaso((p) => p + 1);
    }
  }, [restante, corriendo]);

  const mm = restante !== null ? String(Math.floor(restante / 60)).padStart(2, "0") : "";
  const ss = restante !== null ? String(restante % 60).padStart(2, "0") : "";

  return (
    <div className="card panel" style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", padding: "34px 26px" }}>
      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>{rutina.emoji} {tr(rutina.nombre)}</p>
      <div className="sd-dots">
        {rutina.pasos.map((_, i) => (
          <span key={i} className={"sd-dot" + (i === paso ? " activo" : i < paso ? " done" : "")} />
        ))}
      </div>
      {terminada ? (
        <>
          <p style={{ fontSize: 22, fontWeight: 600, margin: "18px 0" }}>{tr("Rutina completa. 🌱")}</p>
          <p style={{ fontSize: 13.5, color: "var(--ink-soft)", marginBottom: 20 }}>
            {tr("Cada paso que diste hoy le baja la fricción al de mañana.")}
          </p>
          <button className="btn primary" onClick={onSalir}>{tr("Listo")}</button>
        </>
      ) : actual && (
        <>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: "14px 0 4px" }}>
            {tr("Paso")} {paso + 1} {tr("de")} {rutina.pasos.length}{actual.min != null ? `, ${actual.min} min` : ""}, {tr("solo esto:")}
          </p>
          <p style={{ fontSize: 24, fontWeight: 600, lineHeight: 1.35, margin: "6px 0 10px" }}>{tr(actual.texto)}</p>
          {restante !== null && (
            <div className="tnum" style={{ fontSize: 34, fontWeight: 600, color: corriendo ? "var(--ink)" : "var(--muted)", marginBottom: 14 }}>
              {mm}:{ss}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            {restante !== null && (
              <button className="btn primary" onClick={() => setCorriendo(!corriendo)}>
                {corriendo ? tr("Pausar") : tr("Empezar el reloj")}
              </button>
            )}
            <button className={restante !== null ? "btn ghost" : "btn primary"} onClick={() => { campanita(); setPaso(paso + 1); }}>
              {tr("Listo, siguiente")}
            </button>
            <button className="btn ghost" onClick={onSalir}>{tr("Salir")}</button>
          </div>
        </>
      )}
    </div>
  );
}

/** Editor: hasta 10 pasos, cada uno con su texto y sus minutos (opcionales). */
function RutinaEditor({ rutina, onSave, onCancel }: { rutina: Rutina; onSave: (r: Rutina) => void; onCancel: () => void }) {
  const { t: tr } = useIdioma();
  const [nombre, setNombre] = useState(rutina.nombre);
  const [emoji, setEmoji] = useState(rutina.emoji);
  const [pasos, setPasos] = useState<PasoRutina[]>(rutina.pasos.length > 0 ? rutina.pasos : [{ texto: "", min: null }]);

  function setPaso(i: number, patch: Partial<PasoRutina>) {
    setPasos((ps) => ps.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  }

  const validos = pasos.filter((p) => p.texto.trim().length > 0);

  return (
    <div className="card panel" style={{ maxWidth: 560 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <h3 style={{ margin: 0, flex: 1 }}>{rutina.nombre ? tr("Editar rutina") : tr("Nueva rutina")}</h3>
        <button className="xdel" aria-label="Cerrar" style={{ width: 26, height: 26 }} onClick={onCancel}><X size={14} /></button>
      </div>
      <div className="frow">
        <div className="field" style={{ width: 74 }}><label>Emoji</label>
          <input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} /></div>
        <div className="field" style={{ flex: 1 }}><label>Nombre</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={tr("Mañana suave")} autoFocus /></div>
      </div>

      <p style={{ fontSize: 11.5, color: "var(--muted)", margin: "2px 0 8px" }}>
        {tr("Pasos chiquititos (hasta")} {MAX_PASOS}), {tr("cada uno con sus minutos si quieres reloj. Sin minutos, avanzas tú con el botón.")}
      </p>
      {pasos.map((p, i) => (
        <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 11.5, color: "var(--muted)", width: 16, flex: "none" }} className="tnum">{i + 1}</span>
          <input className="input-inline" style={{ flex: 1 }} value={p.texto}
            placeholder={tr("Un paso concreto y chico")}
            onChange={(e) => setPaso(i, { texto: e.target.value })} />
          <input className="input-inline" type="number" min={1} max={120} style={{ width: 64, flex: "none" }}
            value={p.min ?? ""} placeholder="min"
            aria-label={`Minutos del paso ${i + 1}`}
            onChange={(e) => setPaso(i, { min: e.target.value ? Number(e.target.value) : null })} />
          <button className="xdel" aria-label="Quitar paso" style={{ width: 24, height: 24 }}
            onClick={() => setPasos((ps) => ps.filter((_, j) => j !== i))}>
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      {pasos.length < MAX_PASOS && (
        <button className="btn ghost" style={{ marginBottom: 12 }}
          onClick={() => setPasos((ps) => [...ps, { texto: "", min: null }])}>
          <Plus size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} /> Agregar paso
        </button>
      )}

      <button className="btn primary" style={{ width: "100%" }}
        disabled={!nombre.trim() || validos.length === 0}
        onClick={() => onSave({ ...rutina, nombre: nombre.trim(), emoji: emoji.trim() || "✨", pasos: validos.map((p) => ({ texto: p.texto.trim(), min: p.min })) })}>
        Guardar rutina
      </button>
    </div>
  );
}
