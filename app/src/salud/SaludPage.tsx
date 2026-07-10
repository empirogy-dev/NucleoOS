import { useCallback, useEffect, useState } from "react";
import { HeartPulse, Plus, Trash2 } from "lucide-react";
import { AvancesArea } from "../components/AvancesArea";
import { TablesMissingError } from "../finanzas/data";
import { fmtFechaLocal, hoyLocal } from "../lib/fechas";
import {
  EXERCISE_KINDS,
  addExercise,
  deleteExercise,
  listExercise,
  listRoutine,
  saveRoutine,
  sleepHours,
  type ExerciseLog,
  type RoutineLog,
} from "../habitos/data";
import { ClinicaTab } from "./ClinicaTab";
import { RecuperacionTab } from "./RecuperacionTab";
import { getHealthProfile, type HealthProfile } from "./data";
import {
  META_AGUA_VASOS,
  NIVELES_ENERGIA,
  listEnergy,
  metaProteina,
  upsertEnergy,
  type EnergyLog,
} from "./energia";

// Energía: el combustible diario del cuerpo. Lo primero es la lectura
// rápida de hoy (sueño, agua, proteína, movimiento); lo médico vive
// en la pestaña Salud clínica.

type Tab = "hoy" | "nutricion" | "movimiento" | "sueno" | "recuperacion" | "clinica";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "hoy", label: "Hoy" },
  { key: "nutricion", label: "Nutrición" },
  { key: "movimiento", label: "Movimiento" },
  { key: "sueno", label: "Sueño" },
  { key: "recuperacion", label: "Recuperación" },
  { key: "clinica", label: "Salud clínica" },
];

export function SaludPage() {
  const [tab, setTab] = useState<Tab>("hoy");
  const [energy, setEnergy] = useState<EnergyLog[]>([]);
  const [energiaFalta, setEnergiaFalta] = useState(false);
  const [routine, setRoutine] = useState<RoutineLog[]>([]);
  const [exercise, setExercise] = useState<ExerciseLog[]>([]);
  const [habitosFalta, setHabitosFalta] = useState(false);
  const [profile, setProfile] = useState<HealthProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hoy = hoyLocal();

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    await Promise.all([
      (async () => {
        try {
          setEnergy(await listEnergy(14));
          setEnergiaFalta(false);
        } catch (e) {
          if (e instanceof TablesMissingError) setEnergiaFalta(true);
          else setError(e instanceof Error ? e.message : String(e));
        }
      })(),
      (async () => {
        try {
          const [r, ej] = await Promise.all([listRoutine(14), listExercise(30)]);
          setRoutine(r);
          setExercise(ej);
          setHabitosFalta(false);
        } catch (e) {
          if (e instanceof TablesMissingError) setHabitosFalta(true);
          else setError(e instanceof Error ? e.message : String(e));
        }
      })(),
      (async () => {
        try {
          setProfile(await getHealthProfile());
        } catch {
          /* la ficha es opcional para la meta de proteína */
        }
      })(),
    ]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const hoyLog = energy.find((e) => e.date === hoy) ?? null;
  const agua = hoyLog?.water_cups ?? 0;
  const proteina = hoyLog?.protein_g ?? 0;
  const nivel = hoyLog?.energy_level ?? null;
  const metaProt = metaProteina(profile);

  const rutinaHoy = routine.find((r) => r.date === hoy) ?? null;
  const suenoAnoche = rutinaHoy ? sleepHours(rutinaHoy) : null;
  const movimientoHoy = exercise.filter((e) => e.date === hoy).reduce((s, e) => s + e.minutes, 0);

  function mutarHoy(patch: Partial<EnergyLog>) {
    setEnergy((arr) => {
      const existe = arr.some((e) => e.date === hoy);
      if (existe) return arr.map((e) => (e.date === hoy ? { ...e, ...patch } : e));
      return [{ id: "local", date: hoy, water_cups: 0, protein_g: null, energy_level: null, note: null, ...patch }, ...arr];
    });
  }

  async function guardarHoy(patch: { water_cups?: number; protein_g?: number | null; energy_level?: number | null }) {
    mutarHoy(patch);
    try {
      await upsertEnergy(hoy, patch);
    } catch (e) {
      if (e instanceof TablesMissingError) setEnergiaFalta(true);
      else setError(e instanceof Error ? e.message : String(e));
    }
  }

  // Lectura del estado del día: cuántas señales van bien.
  const señales = [
    suenoAnoche !== null && suenoAnoche >= 7,
    agua >= META_AGUA_VASOS,
    proteina >= metaProt,
    movimientoHoy >= 30,
  ].filter(Boolean).length;
  const ESTADOS = [
    "El día recién parte. Un vaso de agua es un buen comienzo. 💧",
    "Vas despertando tu energía, sigue sumando.",
    "Buen ritmo, tu cuerpo lo nota.",
    "Muy buen día para tu cuerpo, queda poco.",
    "Día redondo: sueño, agua, proteína y movimiento. 🌟",
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div className="eyebrow"><HeartPulse size={13} /> Núcleo</div>
        <h1>Energía</h1>
        <p>El combustible de tu día: sueño, agua, proteína y movimiento. Lo médico te espera en Salud clínica.</p>
      </div>

      {error && <div className="card pad" style={{ borderLeft: "3px solid var(--err)", marginBottom: 14 }}>{error}</div>}

      {/* Lectura rápida del estado corporal, siempre visible */}
      <div className="statrow" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
        <div className="card stat"><div className="k">😴 Sueño anoche</div><div className="v tnum">{suenoAnoche !== null ? `${suenoAnoche} h` : "‥"}</div></div>
        <div className="card stat"><div className="k">💧 Agua</div><div className="v tnum">{agua} <small style={{ fontSize: 13, color: "var(--muted)" }}>de {META_AGUA_VASOS}</small></div></div>
        <div className="card stat"><div className="k">🍗 Proteína</div><div className="v tnum">{Math.round(Number(proteina))} <small style={{ fontSize: 13, color: "var(--muted)" }}>de {metaProt} g</small></div></div>
        <div className="card stat"><div className="k">🏃 Movimiento</div><div className="v tnum">{movimientoHoy} <small style={{ fontSize: 13, color: "var(--muted)" }}>min</small></div></div>
      </div>
      <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "-6px 0 16px" }}>{ESTADOS[señales]}</p>

      <div className="ftabs">
        {TABS.map((t) => (
          <button key={t.key} className={"ftab" + (tab === t.key ? " active" : "")} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {energiaFalta && (tab === "hoy" || tab === "nutricion") && (
        <div className="card pad" style={{ borderLeft: "3px solid var(--warn)", marginBottom: 14, maxWidth: 640 }}>
          <b style={{ fontSize: 14 }}>Falta la migración 0018</b>
          <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 4 }}>
            Para registrar agua, proteína y tu nivel de energía, corre
            <code> supabase/migrations/0018_energia.sql</code> en el SQL Editor de Supabase.
          </p>
          <button className="btn ghost" style={{ marginTop: 8 }} onClick={() => void reload()}>Ya la corrí, reintentar</button>
        </div>
      )}
      {habitosFalta && (tab === "hoy" || tab === "movimiento" || tab === "sueno") && (
        <div className="card pad" style={{ borderLeft: "3px solid var(--warn)", marginBottom: 14, maxWidth: 640 }}>
          <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>
            El sueño y el ejercicio usan las tablas de Hábitos: corre <code>supabase/migrations/0005_habitos.sql</code>.
          </p>
        </div>
      )}

      {loading ? (
        <p style={{ color: "var(--muted)" }}>Cargando…</p>
      ) : (
        <>
          {tab === "hoy" && (
            <HoyTab
              agua={agua} proteina={Number(proteina)} nivel={nivel} metaProt={metaProt}
              exercise={exercise.filter((e) => e.date === hoy)}
              rutinaHoy={rutinaHoy}
              deshabilitado={energiaFalta}
              onAgua={(n) => void guardarHoy({ water_cups: n })}
              onProteina={(g) => void guardarHoy({ protein_g: Math.max(0, Number(proteina) + g) })}
              onNivel={(n) => void guardarHoy({ energy_level: n })}
              onChanged={() => void reload()}
            />
          )}
          {tab === "nutricion" && <NutricionTab energy={energy} metaProt={metaProt} profile={profile} irAClinica={() => setTab("clinica")} />}
          {tab === "movimiento" && <MovimientoTab exercise={exercise} onChanged={() => void reload()} />}
          {tab === "sueno" && <SuenoTab routine={routine} onChanged={() => void reload()} />}
          {tab === "recuperacion" && <RecuperacionTab />}
          {tab === "clinica" && <ClinicaTab />}
        </>
      )}

      <AvancesArea area="salud" />
    </div>
  );
}

// ---------- Hoy ----------
function HoyTab({ agua, proteina, nivel, metaProt, exercise, rutinaHoy, deshabilitado, onAgua, onProteina, onNivel, onChanged }: {
  agua: number;
  proteina: number;
  nivel: number | null;
  metaProt: number;
  exercise: ExerciseLog[];
  rutinaHoy: RoutineLog | null;
  deshabilitado: boolean;
  onAgua: (n: number) => void;
  onProteina: (delta: number) => void;
  onNivel: (n: number) => void;
  onChanged: () => void;
}) {
  const pctProt = Math.min(100, Math.round((proteina / metaProt) * 100));

  return (
    <div className="panelgrid">
      <div style={{ display: "grid", gap: 14, alignSelf: "start" }}>
        {/* Agua */}
        <div className="card panel">
          <h3>💧 Agua</h3>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
            Toca un vaso para registrar. La meta son {META_AGUA_VASOS} vasos, unos dos litros.
          </p>
          <div className="agua-fila">
            {Array.from({ length: META_AGUA_VASOS }, (_, i) => (
              <button
                key={i}
                className={"cup" + (i < agua ? " on" : "")}
                aria-label={`Vaso ${i + 1}`}
                disabled={deshabilitado}
                onClick={() => onAgua(i + 1 === agua ? i : i + 1)}
              >
                💧
              </button>
            ))}
          </div>
          {agua >= META_AGUA_VASOS && <span className="chip" style={{ marginTop: 10 }}>✓ Meta de agua cumplida</span>}
        </div>

        {/* Proteína */}
        <div className="card panel">
          <h3>🍗 Proteína</h3>
          <div className="bar" style={{ marginBottom: 10 }}>
            <div className="top">
              <span>{Math.round(proteina)} g de {metaProt} g</span>
              <b className="tnum">{pctProt}%</b>
            </div>
            <div className="track">
              <div className="fill" style={{ width: `${pctProt}%`, background: pctProt >= 100 ? "var(--ok)" : "var(--sal)" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[10, 20, 30].map((g) => (
              <button key={g} className="btn ghost" disabled={deshabilitado} onClick={() => onProteina(g)}>+{g} g</button>
            ))}
            <button className="btn ghost" disabled={deshabilitado || proteina <= 0} onClick={() => onProteina(-10)}>-10 g</button>
          </div>
          <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 10 }}>
            Referencias: un huevo 6 g, pechuga de pollo 30 g, un yogur griego 15 g, una taza de lentejas 18 g.
          </p>
        </div>

        {/* Movimiento de hoy */}
        <MovimientoRapido exercise={exercise} onChanged={onChanged} />
      </div>

      <div style={{ display: "grid", gap: 14, alignSelf: "start" }}>
        {/* Energía percibida */}
        <div className="card panel">
          <h3>⚡ ¿Cómo está tu energía?</h3>
          <div className="moods">
            {NIVELES_ENERGIA.map((n) => (
              <button
                key={n.nivel}
                className={"moodbtn" + (nivel === n.nivel ? " active" : "")}
                title={n.label}
                disabled={deshabilitado}
                onClick={() => onNivel(n.nivel)}
              >
                {n.emoji}
              </button>
            ))}
          </div>
          {nivel !== null && (
            <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 10 }}>
              Hoy: {NIVELES_ENERGIA.find((n) => n.nivel === nivel)?.label}
            </p>
          )}
        </div>

        {/* Sueño de anoche */}
        <SuenoRapido rutinaHoy={rutinaHoy} onChanged={onChanged} />
      </div>
    </div>
  );
}

function MovimientoRapido({ exercise, onChanged }: { exercise: ExerciseLog[]; onChanged: () => void }) {
  const [kind, setKind] = useState<string>(EXERCISE_KINDS[0]);
  const [min, setMin] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!min) return;
    setBusy(true);
    await addExercise(hoyLocal(), kind, Number(min));
    setMin("");
    setBusy(false);
    onChanged();
  }

  return (
    <div className="card panel">
      <h3>🏃 Movimiento de hoy</h3>
      {exercise.map((e) => (
        <div className="txrow" key={e.id}>
          <span className="txicon">🏃</span>
          <div className="txmeta"><b>{e.kind}</b><small>{e.minutes} minutos</small></div>
          <button className="xdel" aria-label="Eliminar registro" onClick={async () => { await deleteExercise(e.id); onChanged(); }}>
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      <form onSubmit={save} style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        <select className="ms-sel" value={kind} onChange={(e) => setKind(e.target.value)} style={{ padding: "9px 10px" }}>
          {EXERCISE_KINDS.map((k) => <option key={k}>{k}</option>)}
        </select>
        <input className="input-inline" type="number" min={1} max={600} value={min} onChange={(e) => setMin(e.target.value)} placeholder="minutos" style={{ maxWidth: 110, flex: "none" }} />
        <button className="btn ghost" disabled={busy}>
          <Plus size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} /> Registrar
        </button>
      </form>
    </div>
  );
}

function SuenoRapido({ rutinaHoy, onChanged }: { rutinaHoy: RoutineLog | null; onChanged: () => void }) {
  const [bed, setBed] = useState(rutinaHoy?.bed_time?.slice(0, 5) ?? "");
  const [wake, setWake] = useState(rutinaHoy?.wake_time?.slice(0, 5) ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setBed(rutinaHoy?.bed_time?.slice(0, 5) ?? "");
    setWake(rutinaHoy?.wake_time?.slice(0, 5) ?? "");
  }, [rutinaHoy]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await saveRoutine(hoyLocal(), { bed_time: bed || null, wake_time: wake || null });
    setBusy(false);
    onChanged();
  }

  const horas = rutinaHoy ? sleepHours(rutinaHoy) : null;

  return (
    <div className="card panel">
      <h3>😴 Sueño de anoche</h3>
      {horas !== null && (
        <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 10 }}>
          Dormiste <b className="tnum">{horas} horas</b>{horas >= 7 ? ", muy bien. 🌙" : ". Intenta acostarte más temprano hoy."}
        </p>
      )}
      <form onSubmit={save}>
        <div className="frow">
          <div className="field"><label>Me acosté a las</label>
            <input type="time" value={bed} onChange={(e) => setBed(e.target.value)} /></div>
          <div className="field"><label>Desperté a las</label>
            <input type="time" value={wake} onChange={(e) => setWake(e.target.value)} /></div>
        </div>
        <button className="btn ghost" disabled={busy} style={{ width: "100%" }}>{busy ? "Guardando…" : "Guardar"}</button>
      </form>
    </div>
  );
}

// ---------- Nutrición ----------
function NutricionTab({ energy, metaProt, profile, irAClinica }: {
  energy: EnergyLog[];
  metaProt: number;
  profile: HealthProfile | null;
  irAClinica: () => void;
}) {
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return fmtFechaLocal(d);
  });
  const fmtDia = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("es-CL", { weekday: "short", day: "numeric" });
  };

  return (
    <div className="panelgrid">
      <div className="card panel" style={{ alignSelf: "start" }}>
        <h3>📈 Tu semana de nutrición</h3>
        {dias.map((d) => {
          const log = energy.find((e) => e.date === d);
          const cups = log?.water_cups ?? 0;
          const prot = Number(log?.protein_g ?? 0);
          return (
            <div key={d} style={{ padding: "8px 0", borderBottom: "1px solid var(--line-soft)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 5 }}>
                <b style={{ textTransform: "capitalize" }}>{fmtDia(d)}</b>
                <span className="tnum">💧 {cups}/{META_AGUA_VASOS} · 🍗 {Math.round(prot)} g</span>
              </div>
              <div style={{ display: "grid", gap: 3 }}>
                <div className="track" style={{ height: 5 }}>
                  <div className="fill" style={{ width: `${Math.min(100, (cups / META_AGUA_VASOS) * 100)}%`, background: "var(--info)" }} />
                </div>
                <div className="track" style={{ height: 5 }}>
                  <div className="fill" style={{ width: `${Math.min(100, (prot / metaProt) * 100)}%`, background: "var(--sal)" }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gap: 14, alignSelf: "start" }}>
        <div className="card panel">
          <h3>🎯 Tus metas</h3>
          <div className="txrow">
            <span className="txicon">💧</span>
            <div className="txmeta" style={{ whiteSpace: "normal" }}>
              <b>{META_AGUA_VASOS} vasos de agua</b>
              <small>Unos dos litros al día. Con calor o ejercicio, un poco más.</small>
            </div>
          </div>
          <div className="txrow">
            <span className="txicon">🍗</span>
            <div className="txmeta" style={{ whiteSpace: "normal" }}>
              <b>{metaProt} g de proteína</b>
              <small>
                {profile?.weight_kg
                  ? `Estimada con tu peso (${profile.weight_kg} kg por 1.2 g).`
                  : "Meta general. Registra tu peso en Salud clínica y la ajusto a tu cuerpo."}
              </small>
            </div>
          </div>
          {profile?.diet && (
            <div className="txrow">
              <span className="txicon">🥗</span>
              <div className="txmeta" style={{ whiteSpace: "normal" }}>
                <b>Tu alimentación: {profile.diet}</b>
                <small>Definida en tu ficha.</small>
              </div>
            </div>
          )}
          <button className="btn ghost" style={{ marginTop: 10 }} onClick={irAClinica}>Editar mi ficha</button>
        </div>
        <div className="tip-destacado">
          💡 La proteína reparte mejor su efecto si la distribuyes en las comidas del día en vez de concentrarla en una sola.
        </div>
      </div>
    </div>
  );
}

// ---------- Movimiento ----------
function MovimientoTab({ exercise, onChanged }: { exercise: ExerciseLog[]; onChanged: () => void }) {
  const hace7 = (() => { const d = new Date(); d.setDate(d.getDate() - 6); return fmtFechaLocal(d); })();
  const semana = exercise.filter((e) => e.date >= hace7);
  const minSemana = semana.reduce((s, e) => s + e.minutes, 0);
  const favorito = (() => {
    const cuenta = new Map<string, number>();
    for (const e of exercise) cuenta.set(e.kind, (cuenta.get(e.kind) ?? 0) + e.minutes);
    let mejor: string | null = null;
    for (const [k, v] of cuenta) if (mejor === null || v > (cuenta.get(mejor) ?? 0)) mejor = k;
    return mejor;
  })();

  return (
    <>
      <div className="statrow" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        <div className="card stat"><div className="k">Esta semana</div><div className="v tnum">{minSemana} min</div></div>
        <div className="card stat"><div className="k">Sesiones (7 días)</div><div className="v tnum">{semana.length}</div></div>
        <div className="card stat"><div className="k">Tu favorito</div><div className="v" style={{ fontSize: 19 }}>{favorito ?? "aún ninguno"}</div></div>
      </div>
      <div className="panelgrid">
        <div className="card panel" style={{ alignSelf: "start" }}>
          <h3>🏃 Últimos 30 días</h3>
          {exercise.length === 0 && (
            <p style={{ color: "var(--muted)", fontSize: 13.5 }}>
              Aún no hay movimiento registrado. Una caminata de 15 minutos ya cuenta.
            </p>
          )}
          {exercise.map((e) => (
            <div className="txrow" key={e.id}>
              <span className="txicon">🏃</span>
              <div className="txmeta"><b>{e.kind}</b><small>{e.date}, {e.minutes} minutos</small></div>
              <button className="xdel" aria-label="Eliminar registro" onClick={async () => { await deleteExercise(e.id); onChanged(); }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gap: 14, alignSelf: "start" }}>
          <RegistrarMovimiento onChanged={onChanged} />
          <div className="tip-destacado">
            💡 La meta amable son 150 minutos a la semana, unos 30 al día. No importa el deporte, importa moverte.
          </div>
        </div>
      </div>
    </>
  );
}

function RegistrarMovimiento({ onChanged }: { onChanged: () => void }) {
  const [kind, setKind] = useState<string>(EXERCISE_KINDS[0]);
  const [min, setMin] = useState("");
  const [date, setDate] = useState(hoyLocal());
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!min) return;
    setBusy(true);
    await addExercise(date, kind, Number(min));
    setMin("");
    setBusy(false);
    onChanged();
  }

  return (
    <div className="card panel">
      <h3>Registrar sesión</h3>
      <form onSubmit={save}>
        <div className="field"><label>Tipo</label>
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            {EXERCISE_KINDS.map((k) => <option key={k}>{k}</option>)}
          </select></div>
        <div className="frow">
          <div className="field"><label>Minutos</label>
            <input className="input-inline" style={{ width: "100%" }} type="number" min={1} max={600} required value={min} onChange={(e) => setMin(e.target.value)} placeholder="30" /></div>
          <div className="field"><label>Fecha</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        </div>
        <button className="btn primary" disabled={busy} style={{ width: "100%" }}>{busy ? "Guardando…" : "Guardar"}</button>
      </form>
    </div>
  );
}

// ---------- Sueño ----------
function SuenoTab({ routine, onChanged }: { routine: RoutineLog[]; onChanged: () => void }) {
  const conHoras = routine.map((r) => ({ r, h: sleepHours(r) })).filter((x): x is { r: RoutineLog; h: number } => x.h !== null);
  const promedio = conHoras.length ? Math.round((conHoras.reduce((s, x) => s + x.h, 0) / conHoras.length) * 10) / 10 : null;
  const hoy = hoyLocal();
  const rutinaHoy = routine.find((r) => r.date === hoy) ?? null;

  const fmtDia = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "short" });
  };

  return (
    <>
      <div className="statrow" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="card stat"><div className="k">Promedio (14 días)</div><div className="v tnum">{promedio !== null ? `${promedio} h` : "sin datos"}</div></div>
        <div className="card stat"><div className="k">Meta amable</div><div className="v tnum">7 a 9 h</div></div>
      </div>
      <div className="panelgrid">
        <div className="card panel" style={{ alignSelf: "start" }}>
          <h3>🌙 Bitácora de sueño</h3>
          {routine.length === 0 && (
            <p style={{ color: "var(--muted)", fontSize: 13.5 }}>
              Registra a qué hora te acuestas y despiertas, y aquí aparece tu historia de descanso.
            </p>
          )}
          {routine.map((r) => {
            const h = sleepHours(r);
            return (
              <div className="txrow" key={r.id}>
                <span className="txicon">{h !== null && h >= 7 ? "🌙" : "🌘"}</span>
                <div className="txmeta">
                  <b style={{ textTransform: "capitalize" }}>{fmtDia(r.date)}</b>
                  <small>
                    {r.bed_time ? `me acosté ${r.bed_time.slice(0, 5)}` : "sin hora de acostarse"}
                    {r.wake_time ? `, desperté ${r.wake_time.slice(0, 5)}` : ""}
                  </small>
                </div>
                {h !== null && <b className="tnum" style={{ fontSize: 13.5, color: h >= 7 ? "var(--ok)" : "var(--warn)" }}>{h} h</b>}
              </div>
            );
          })}
        </div>
        <div style={{ display: "grid", gap: 14, alignSelf: "start" }}>
          <SuenoRapido rutinaHoy={rutinaHoy} onChanged={onChanged} />
          <div className="tip-destacado">
            💡 Acostarte y despertar a la misma hora todos los días le enseña a tu cuerpo cuándo soltar. La regularidad vale más que la cantidad.
          </div>
        </div>
      </div>
    </>
  );
}
