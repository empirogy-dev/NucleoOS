import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, PersonStanding, Plus, Trash2 } from "lucide-react";
import { AvancesArea } from "../components/AvancesArea";
import { IconField } from "../components/IconField";
import { TablesMissingError } from "../finanzas/data";
import { hoyLocal } from "../lib/fechas";
import { addExercise } from "../habitos/data";
import {
  PROGRAMAS,
  RUTINAS,
  addUserProgram,
  deleteUserProgram,
  listProgramDays,
  listUserPrograms,
  rutinaPor,
  toggleProgramDay,
  updateUserProgram,
  type DiaPrograma,
  type ProgramDay,
  type Programa,
  type Rutina,
  type TipoRutina,
  type UserProgram,
} from "./data";

// Movimiento: el cuerpo en acción. Práctica suave (yoga, movilidad),
// entrenamiento (fuerza, cardio, core) y programas guiados.
// Completar una rutina se registra solo en Energía.

type Tab = "suave" | "entrenamiento" | "programas";

const NIVEL_LABEL = { suave: "🌿 suave", medio: "💪 medio", intenso: "🔥 intenso" } as const;

export function MovimientoPage() {
  const [tab, setTab] = useState<Tab>("suave");
  const [rutina, setRutina] = useState<Rutina | null>(null);

  return (
    <div className="page">
      <div className="page-head">
        <div className="eyebrow"><PersonStanding size={13} /> Núcleo</div>
        <h1>Movimiento</h1>
        <p>Tu cuerpo en acción: práctica suave para soltar, entrenamiento para fortalecer, y retos para sostenerlo en el tiempo.</p>
      </div>

      <div className="ftabs">
        <button className={"ftab" + (tab === "suave" ? " active" : "")} onClick={() => setTab("suave")}>Práctica suave</button>
        <button className={"ftab" + (tab === "entrenamiento" ? " active" : "")} onClick={() => setTab("entrenamiento")}>Entrenamiento</button>
        <button className={"ftab" + (tab === "programas" ? " active" : "")} onClick={() => setTab("programas")}>Programas</button>
      </div>

      {(tab === "suave" || tab === "entrenamiento") && (
        <Catalogo tipo={tab} onAbrir={setRutina} />
      )}
      {tab === "programas" && <ProgramasTab onAbrirRutina={setRutina} />}

      <AvancesArea area="salud" />

      {rutina && <RutinaModal rutina={rutina} onClose={() => setRutina(null)} />}
    </div>
  );
}

// ---------- Catálogo con filtro por duración ----------
function Catalogo({ tipo, onAbrir }: { tipo: TipoRutina; onAbrir: (r: Rutina) => void }) {
  const [maxMin, setMaxMin] = useState(0); // 0 = todas
  const lista = RUTINAS.filter((r) => r.tipo === tipo && (maxMin === 0 || r.minutos <= maxMin));

  return (
    <>
      <div className="ftabs" style={{ marginBottom: 12 }}>
        {[0, 10, 15, 20].map((m) => (
          <button key={m} className={"ftab" + (maxMin === m ? " active" : "")} onClick={() => setMaxMin(m)}>
            {m === 0 ? "Todas" : `${m} min o menos`}
          </button>
        ))}
      </div>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
        {tipo === "suave"
          ? "Yoga, movilidad y estiramientos. Nada que exija, todo que suelta."
          : "Fuerza, cardio y core con lo que tienes en casa. Al completar una rutina, queda registrada en Energía."}
      </p>
      <div className="dream-grid">
        {lista.map((r) => (
          <button key={r.id} className="card dream-card" style={{ textAlign: "left", cursor: "pointer" }} onClick={() => onAbrir(r)}>
            <div className="dc-top">
              <span className="dc-emoji">{r.emoji}</span>
              <span className="chip">{r.minutos} min</span>
            </div>
            <b className="dc-title">{r.nombre}</b>
            <p className="dc-notes">{r.descripcion}</p>
            <div className="dc-foot">
              <small style={{ fontSize: 11.5, color: "var(--muted)" }}>{NIVEL_LABEL[r.nivel]}</small>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

// ---------- Reproductor de rutina ----------
function RutinaModal({ rutina, onClose }: { rutina: Rutina; onClose: () => void }) {
  const total = rutina.minutos * 60;
  const [restante, setRestante] = useState(total);
  const [corriendo, setCorriendo] = useState(false);
  const [completada, setCompletada] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!corriendo || restante <= 0) return;
    const id = setInterval(() => setRestante((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [corriendo, restante]);

  const mm = String(Math.floor(restante / 60)).padStart(2, "0");
  const ss = String(restante % 60).padStart(2, "0");
  const pct = Math.round(((total - restante) / total) * 100);

  async function completar() {
    setGuardando(true);
    setErr(null);
    try {
      await addExercise(hoyLocal(), rutina.categoria, rutina.minutos);
      setCompletada(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="tp-overlay" onClick={onClose}>
      <div className="tp" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <h3 style={{ marginBottom: 4 }}>{rutina.emoji} {rutina.nombre}</h3>
        <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 12 }}>
          {rutina.minutos} minutos, {NIVEL_LABEL[rutina.nivel]}. {rutina.descripcion}
        </p>

        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div className="tnum" style={{ fontFamily: "var(--serif)", fontSize: 40, fontWeight: 500, color: restante === 0 ? "var(--ok)" : "var(--ink)" }}>
            {restante === 0 ? "✨" : `${mm}:${ss}`}
          </div>
          <div className="track" style={{ marginTop: 8 }}>
            <div className="fill" style={{ width: `${pct}%`, background: restante === 0 ? "var(--ok)" : "var(--mov)" }} />
          </div>
        </div>

        <ol style={{ paddingLeft: 20, display: "grid", gap: 6, margin: "12px 0 16px" }}>
          {rutina.pasos.map((p) => (
            <li key={p} style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.5 }}>{p}</li>
          ))}
        </ol>

        {err && <p style={{ fontSize: 12.5, color: "var(--err)", marginBottom: 8 }}>{err}</p>}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {!completada && restante > 0 && (
            <button className="btn ghost" onClick={() => setCorriendo(!corriendo)}>
              {corriendo ? "Pausar" : restante === total ? "Iniciar temporizador" : "Continuar"}
            </button>
          )}
          {completada ? (
            <span className="chip" style={{ background: "color-mix(in srgb,var(--ok) 18%,var(--paper))", color: "var(--ok)" }}>
              🎉 Registrada en Energía como {rutina.categoria}, {rutina.minutos} min
            </span>
          ) : (
            <button className="btn primary" disabled={guardando} onClick={() => void completar()}>
              {guardando ? "Guardando…" : "Marcar completada"}
            </button>
          )}
          <span style={{ flex: 1 }} />
          <button className="btn ghost" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

// ---------- Programas ----------
function ProgramasTab({ onAbrirRutina }: { onAbrirRutina: (r: Rutina) => void }) {
  const [hechos, setHechos] = useState<ProgramDay[]>([]);
  const [propios, setPropios] = useState<UserProgram[]>([]);
  const [propiosFaltan, setPropiosFaltan] = useState(false);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ up?: UserProgram } | null>(null);

  const reload = useCallback(async () => {
    try {
      setHechos(await listProgramDays());
      setNeedsMigration(false);
    } catch (e) {
      if (e instanceof TablesMissingError) setNeedsMigration(true);
      else setError(e instanceof Error ? e.message : String(e));
    }
    try {
      setPropios(await listUserPrograms());
      setPropiosFaltan(false);
    } catch (e) {
      if (e instanceof TablesMissingError) setPropiosFaltan(true);
      else setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (needsMigration) {
    return (
      <div className="card pad" style={{ maxWidth: 640 }}>
        <h3 style={{ marginBottom: 10 }}>Un paso pendiente en Supabase</h3>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 12 }}>
          Para guardar tu progreso en los retos, corre
          <code> supabase/migrations/0021_movimiento.sql</code> en el SQL Editor de Supabase.
        </p>
        <button className="btn primary" onClick={() => void reload()}>Ya lo hice, reintentar</button>
      </div>
    );
  }

  return (
    <>
      {error && <div className="card pad" style={{ borderLeft: "3px solid var(--err)", marginBottom: 14 }}>{error}</div>}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <p style={{ fontSize: 13, color: "var(--muted)", flex: 1, minWidth: 240 }}>
          Programas de movimiento con su rutina de cada día: los sugeridos, y los tuyos propios. Para retos personales (agua, meditar, dormir temprano) está <Link to="/habitos" style={{ color: "var(--accent-ink)", fontWeight: 600 }}>Hábitos, pestaña Retos</Link>.
        </p>
        <button className="btn primary" onClick={() => setModal({})}>
          <Plus size={15} style={{ verticalAlign: "-2px", marginRight: 5 }} /> Crear mi programa
        </button>
      </div>
      {propiosFaltan && (
        <div className="card pad" style={{ borderLeft: "3px solid var(--warn)", marginBottom: 14, maxWidth: 640 }}>
          <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>
            Para crear y editar tus propios programas, corre <code>supabase/migrations/0025_programas_propios.sql</code> en el SQL Editor.
          </p>
        </div>
      )}
      <div style={{ display: "grid", gap: 14, maxWidth: 780 }}>
        {propios.map((up) => (
          <ProgramaCard key={up.id}
            programa={{ key: up.id, nombre: up.nombre, emoji: up.emoji, objetivo: up.objetivo ?? "", dias: up.dias }}
            hechos={hechos} onChanged={() => void reload()} onAbrirRutina={onAbrirRutina}
            onEditar={() => setModal({ up })}
            onEliminar={async () => {
              if (!window.confirm(`¿Eliminar el programa ${up.nombre}? Se pierde su progreso.`)) return;
              await deleteUserProgram(up.id);
              void reload();
            }}
          />
        ))}
        {PROGRAMAS.map((p) => (
          <ProgramaCard key={p.key} programa={p} hechos={hechos} onChanged={() => void reload()} onAbrirRutina={onAbrirRutina} sugerido />
        ))}
      </div>
      {modal && (
        <ProgramModal up={modal.up ?? null} onClose={() => setModal(null)} onSaved={() => { setModal(null); void reload(); }} />
      )}
    </>
  );
}

/** Crear o editar un programa propio: nombre, días y rutinas que se ciclan. */
function ProgramModal({ up, onClose, onSaved }: { up: UserProgram | null; onClose: () => void; onSaved: () => void }) {
  const [nombre, setNombre] = useState(up?.nombre ?? "");
  const [emoji, setEmoji] = useState(up?.emoji ?? "🌱");
  const [objetivo, setObjetivo] = useState(up?.objetivo ?? "");
  const [dias, setDias] = useState(String(up?.dias.length ?? 7));
  const [elegidas, setElegidas] = useState<string[]>(() =>
    up ? [...new Set(up.dias.map((d) => d.rutinaId).filter((x): x is string => Boolean(x)))] : [],
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function armarDias(n: number): DiaPrograma[] {
    return Array.from({ length: n }, (_, i) => {
      if (elegidas.length === 0) return { titulo: `Día ${i + 1}, a tu manera` };
      const r = rutinaPor(elegidas[i % elegidas.length]);
      return r ? { titulo: r.nombre, rutinaId: r.id } : { titulo: `Día ${i + 1}` };
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const n = Math.min(60, Math.max(3, Number(dias) || 7));
    const datos = { nombre, emoji, objetivo: objetivo || null, dias: armarDias(n) };
    try {
      if (up) await updateUserProgram(up.id, datos);
      else await addUserProgram(datos);
      onSaved();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
      setBusy(false);
    }
  }

  return (
    <div className="tp-overlay" onClick={onClose}>
      <div className="tp" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <h3 style={{ marginBottom: 4 }}>{up ? "Editar programa" : "Mi programa"}</h3>
        <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 14 }}>
          Elige las rutinas que quieres y se reparten en los días del programa, en orden y ciclando.
        </p>
        {err && <p style={{ fontSize: 12.5, color: "var(--err)", marginBottom: 10 }}>{err}</p>}
        <form onSubmit={save}>
          <div className="frow">
            <div className="field" style={{ flex: 1 }}><label>Nombre</label>
              <input required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Mi semana de yoga" autoFocus /></div>
            <IconField value={emoji} onChange={setEmoji} />
          </div>
          <div className="frow">
            <div className="field" style={{ flex: 1 }}><label>Objetivo</label>
              <input value={objetivo} onChange={(e) => setObjetivo(e.target.value)} placeholder="Para qué es este programa" /></div>
            <div className="field" style={{ maxWidth: 100 }}><label>Días</label>
              <input type="number" min={3} max={60} value={dias} onChange={(e) => setDias(e.target.value)} /></div>
          </div>
          <div className="field"><label>Rutinas del programa</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {RUTINAS.map((r) => {
                const on = elegidas.includes(r.id);
                return (
                  <button key={r.id} type="button" className="chip"
                    style={{ border: "none", cursor: "pointer", ...(on ? {} : { background: "var(--surface)", color: "var(--muted)" }) }}
                    aria-pressed={on}
                    onClick={() => setElegidas((prev) => (on ? prev.filter((x) => x !== r.id) : [...prev, r.id]))}>
                    {r.emoji} {r.nombre}
                  </button>
                );
              })}
            </div>
            <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 6 }}>
              Si no eliges ninguna, los días quedan libres para lo que tú quieras hacer.
            </p>
          </div>
          <button className="btn primary" disabled={busy} style={{ width: "100%", marginTop: 4 }}>
            {busy ? "Guardando…" : up ? "Guardar cambios" : "Crear programa"}
          </button>
        </form>
      </div>
    </div>
  );
}

function ProgramaCard({ programa, hechos, onChanged, onAbrirRutina, onEditar, onEliminar, sugerido }: {
  programa: Programa;
  hechos: ProgramDay[];
  onChanged: () => void;
  onAbrirRutina: (r: Rutina) => void;
  onEditar?: () => void;
  onEliminar?: () => void;
  sugerido?: boolean;
}) {
  const marcados = new Set(hechos.filter((h) => h.program_key === programa.key).map((h) => h.day));
  const total = programa.dias.length;
  const done = marcados.size;
  const pct = Math.round((done / total) * 100);
  const siguiente = programa.dias.findIndex((_, i) => !marcados.has(i + 1));

  return (
    <div className="card panel">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: 24 }}>{programa.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <b style={{ fontSize: 15 }}>{programa.nombre}</b>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>{programa.objetivo}</div>
        </div>
        {sugerido && <span className="chip" style={{ background: "var(--surface)", color: "var(--muted)" }}>sugerido</span>}
        {done === total
          ? <span className="chip" style={{ background: "color-mix(in srgb,var(--ok) 18%,var(--paper))", color: "var(--ok)" }}>🏆 Programa completo</span>
          : <span className="chip">{done} / {total} días</span>}
        {onEditar && (
          <button className="xdel" title="Editar programa" aria-label="Editar programa" onClick={onEditar}>
            <Pencil size={13} />
          </button>
        )}
        {onEliminar && (
          <button className="xdel" title="Eliminar programa" aria-label="Eliminar programa" onClick={() => void onEliminar()}>
            <Trash2 size={13} />
          </button>
        )}
      </div>
      <div className="track" style={{ margin: "8px 0 12px" }}>
        <div className="fill" style={{ width: `${pct}%`, background: done === total ? "var(--ok)" : "var(--mov)" }} />
      </div>
      {siguiente >= 0 && (
        <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 10 }}>
          Hoy te toca el día {siguiente + 1}: <b>{programa.dias[siguiente].titulo}</b>
          {programa.dias[siguiente].rutinaId && (
            <button className="linklike" style={{ display: "inline", marginLeft: 8 }}
              onClick={() => { const r = rutinaPor(programa.dias[siguiente].rutinaId as string); if (r) onAbrirRutina(r); }}>
              ver rutina
            </button>
          )}
        </p>
      )}
      <div className="habit-grid" style={{ paddingLeft: 0 }} title="Toca un día para marcarlo">
        {programa.dias.map((d, i) => {
          const dia = i + 1;
          const on = marcados.has(dia);
          return (
            <button key={dia} type="button"
              className={"hg-cell" + (on ? " on" : "")}
              style={on ? { background: "var(--mov)", borderColor: "var(--mov)" } : undefined}
              title={`Día ${dia}: ${d.titulo}`}
              aria-label={`Día ${dia}, ${d.titulo}${on ? ", hecho" : ""}`}
              onClick={async () => { await toggleProgramDay(programa.key, dia, !on); onChanged(); }} />
          );
        })}
      </div>
    </div>
  );
}
