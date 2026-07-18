import { useCallback, useEffect, useState } from "react";
import { HeartPulse, Plus, Trash2 } from "lucide-react";
import { OrdenGrid } from "../components/OrdenGrid";
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
import { PlatoCard } from "./PlatoCard";
import { GUIAS_NUTRICION } from "./nutricionGuias";
import { deleteMeal, listMeals, momentoDe, totalesDia, type Meal } from "./comidas";
import { getHealthProfile, type HealthProfile } from "./data";
import {
  META_AGUA_VASOS,
  NIVELES_ENERGIA,
  OBJETIVOS_CAL,
  estimarKcal,
  getObjetivoCal,
  listEnergy,
  metaCalorias,
  metaProteina,
  setObjetivoCal,
  upsertEnergy,
  type EnergyLog,
  type ObjetivoCal,
} from "./energia";
import { useSettings } from "../settings/SettingsProvider";
import { AyunoCard } from "./AyunoCard";
import { CicloTab } from "./CicloTab";
import { useFechaActiva } from "../fecha/FechaActiva";
import { CampoHora } from "../components/CampoHora";
import { MetasDeArea } from "../components/MetasDeArea";
import { Selector } from "../components/Selector";
import { esProgramado, listRetos, toggleRetoDay } from "../habitos/retos";

// Energía: el combustible diario del cuerpo. Lo primero es la lectura
// rápida de hoy (sueño, agua, proteína, movimiento); lo médico vive
// en la pestaña Salud clínica.

type Tab = "hoy" | "nutricion" | "movimiento" | "sueno" | "ciclo" | "recuperacion" | "clinica";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "hoy", label: "Hoy" },
  { key: "nutricion", label: "Nutrición" },
  { key: "movimiento", label: "Movimiento" },
  { key: "sueno", label: "Sueño" },
  { key: "ciclo", label: "Ciclo" },
  { key: "recuperacion", label: "Recuperación" },
  { key: "clinica", label: "Salud clínica" },
];

export function SaludPage() {
  const { birthday } = useSettings();
  const [tab, setTab] = useState<Tab>("hoy");
  const [energy, setEnergy] = useState<EnergyLog[]>([]);
  const [energiaFalta, setEnergiaFalta] = useState(false);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [routine, setRoutine] = useState<RoutineLog[]>([]);
  const [exercise, setExercise] = useState<ExerciseLog[]>([]);
  const [habitosFalta, setHabitosFalta] = useState(false);
  const [profile, setProfile] = useState<HealthProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // La pestaña Hoy registra en la fecha activa global (se elige en Ajustes):
  // si desapareciste unos días pero igual entrenaste, eso también cuenta.
  const { fecha: hoy, esHoy } = useFechaActiva();

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
      (async () => {
        try {
          setMeals(await listMeals(7));
        } catch {
          /* sin la 0020 aún no hay comidas, el aviso vive en la tarjeta del plato */
        }
      })(),
    ]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Si la ficha dice masculino, la pestaña Ciclo desaparece; si estabas en ella, te vas a Hoy.
  useEffect(() => {
    if (tab === "ciclo" && profile?.sex === "masculino") setTab("hoy");
  }, [tab, profile?.sex]);

  const hoyLog = energy.find((e) => e.date === hoy) ?? null;
  const agua = hoyLog?.water_cups ?? 0;
  const protManual = Number(hoyLog?.protein_g ?? 0);
  const totHoy = totalesDia(meals, hoy);
  const proteina = protManual + totHoy.proteina;
  const nivel = hoyLog?.energy_level ?? null;
  const metaProt = metaProteina(profile);

  const rutinaHoy = routine.find((r) => r.date === hoy) ?? null;
  const suenoAnoche = rutinaHoy ? sleepHours(rutinaHoy) : null;
  const pesoKg = profile?.weight_kg ?? null;
  const edad = birthday
    ? Math.floor((Date.now() - new Date(`${birthday}T00:00:00`).getTime()) / (365.25 * 86400000))
    : null;
  const ejercicioHoy = exercise.filter((e) => e.date === hoy);
  const movimientoHoy = ejercicioHoy.reduce((s, e) => s + e.minutes, 0);
  const kcalHoy = ejercicioHoy.reduce((s, e) => s + estimarKcal(e.kind, e.minutes, pesoKg), 0);

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
    // Al completar la meta de agua, el reto de agua (si existe) se marca solo.
    if (patch.water_cups === META_AGUA_VASOS) {
      try {
        const retosAgua = (await listRetos()).filter(
          (r) => r.status === "activo" && /agua/i.test(r.title) && esProgramado(hoy, r.days_mask),
        );
        for (const r of retosAgua) await toggleRetoDay(r.id, hoy, true);
      } catch {
        /* sin retos migrados, el agua sigue funcionando igual */
      }
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
        <div className="card stat"><div className="k">🏃 Movimiento</div><div className="v tnum">{movimientoHoy} <small style={{ fontSize: 13, color: "var(--muted)" }}>min{kcalHoy > 0 ? `, ≈${kcalHoy} kcal` : ""}</small></div></div>
      </div>
      <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "-6px 0 16px" }}>{ESTADOS[señales]}</p>

      <MetasDeArea area="salud" />

      <div className="ftabs">
        {TABS.filter((t) => t.key !== "ciclo" || profile?.sex !== "masculino").map((t) => (
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
            <>
              <HoyTab
                agua={agua} proteina={proteina} protComidas={totHoy.proteina} nivel={nivel} metaProt={metaProt}
                exercise={ejercicioHoy}
                pesoKg={pesoKg}
                rutinaHoy={rutinaHoy}
                fecha={hoy}
                esHoy={esHoy}
                deshabilitado={energiaFalta}
                onAgua={(n) => void guardarHoy({ water_cups: n })}
                onProteina={(g) => void guardarHoy({ protein_g: Math.max(0, protManual + g) })}
                onNivel={(n) => void guardarHoy({ energy_level: n })}
                onChanged={() => void reload()}
              />
            </>
          )}
          {tab === "nutricion" && (
            <NutricionTab energy={energy} meals={meals} metaProt={metaProt} profile={profile} quemadasHoy={kcalHoy} edad={edad}
              irAClinica={() => setTab("clinica")} onChanged={() => void reload()} />
          )}
          {tab === "movimiento" && <MovimientoTab exercise={exercise} pesoKg={pesoKg} onChanged={() => void reload()} />}
          {tab === "sueno" && <SuenoTab routine={routine} onChanged={() => void reload()} />}
          {tab === "ciclo" && <CicloTab />}
          {tab === "recuperacion" && <RecuperacionTab />}
          {tab === "clinica" && <ClinicaTab onProfileSaved={() => { void getHealthProfile().then(setProfile).catch(() => undefined); }} />}
        </>
      )}

    </div>
  );
}

// ---------- Hoy ----------
function HoyTab({ agua, proteina, protComidas, nivel, metaProt, exercise, pesoKg, rutinaHoy, fecha, esHoy, deshabilitado, onAgua, onProteina, onNivel, onChanged }: {
  agua: number;
  proteina: number;
  protComidas: number;
  nivel: number | null;
  metaProt: number;
  exercise: ExerciseLog[];
  pesoKg: number | null;
  rutinaHoy: RoutineLog | null;
  fecha: string;
  esHoy: boolean;
  deshabilitado: boolean;
  onAgua: (n: number) => void;
  onProteina: (delta: number) => void;
  onNivel: (n: number) => void;
  onChanged: () => void;
}) {
  const pctProt = Math.min(100, Math.round((proteina / metaProt) * 100));

  const bloqueAgua = (
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
          <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 10 }}>
            El agua vive aquí, independiente de tus retos. Eso sí, si tienes un reto de agua activo, al llegar a los {META_AGUA_VASOS} vasos se marca solo. 💧
          </p>
        </div>
  );

  const bloqueProteina = (
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
            {protComidas > 0
              ? `${protComidas} g vienen de tus platos registrados. Los botones suman lo demás.`
              : "Referencias: un huevo 6 g, pechuga de pollo 30 g, un yogur griego 15 g, una taza de lentejas 18 g."}
          </p>
        </div>
  );

  const bloqueNivel = (
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
  );

  return (
    <>
      <p style={{ fontSize: 12, color: "var(--muted)", margin: "-4px 0 12px" }}>
        Ordena las tarjetas a tu gusto: pasa el mouse por una y arrastra desde el agarre ⋮ de la esquina.
      </p>
      <OrdenGrid
        clave="energia-hoy"
        bloques={[
          { id: "agua", el: bloqueAgua },
          { id: "proteina", el: bloqueProteina },
          { id: "plato", el: <PlatoCard fecha={fecha} esHoy={esHoy} onSaved={onChanged} /> },
          { id: "movimiento", el: <MovimientoRapido exercise={exercise} pesoKg={pesoKg} fecha={fecha} onChanged={onChanged} /> },
          { id: "nivel", el: bloqueNivel },
          { id: "sueno", el: <SuenoRapido rutinaHoy={rutinaHoy} fecha={fecha} onChanged={onChanged} /> },
        ]}
      />
    </>
  );
}

function MovimientoRapido({ exercise, pesoKg, fecha, onChanged }: { exercise: ExerciseLog[]; pesoKg: number | null; fecha: string; onChanged: () => void }) {
  const [kind, setKind] = useState<string>(EXERCISE_KINDS[0]);
  const [min, setMin] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!min) return;
    setBusy(true);
    await addExercise(fecha, kind, Number(min));
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
          <div className="txmeta"><b>{e.kind}</b><small>{e.minutes} minutos, ≈{estimarKcal(e.kind, e.minutes, pesoKg)} kcal</small></div>
          <button className="xdel" aria-label="Eliminar registro" onClick={async () => { await deleteExercise(e.id); onChanged(); }}>
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      <form onSubmit={save} style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 130px", minWidth: 120 }}>
          <Selector value={kind} ariaLabel="Tipo de ejercicio" onChange={setKind}
            opciones={EXERCISE_KINDS.map((k) => ({ value: k, label: k }))} />
        </div>
        <input className="input-inline" type="number" min={1} max={600} value={min} onChange={(e) => setMin(e.target.value)} placeholder="minutos" style={{ maxWidth: 110, flex: "none" }} />
        <button className="btn ghost" disabled={busy}>
          <Plus size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} /> Registrar
        </button>
      </form>
    </div>
  );
}

function SuenoRapido({ rutinaHoy, fecha = hoyLocal(), onChanged }: { rutinaHoy: RoutineLog | null; fecha?: string; onChanged: () => void }) {
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
    await saveRoutine(fecha, { bed_time: bed || null, wake_time: wake || null });
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
            <CampoHora value={bed} onChange={setBed} ariaLabel="Hora de acostarse" /></div>
          <div className="field"><label>Desperté a las</label>
            <CampoHora value={wake} onChange={setWake} ariaLabel="Hora de despertar" /></div>
        </div>
        <button className="btn ghost" disabled={busy} style={{ width: "100%" }}>{busy ? "Guardando…" : "Guardar"}</button>
      </form>
    </div>
  );
}

// ---------- Nutrición ----------
function NutricionTab({ energy, meals, metaProt, profile, quemadasHoy, edad, irAClinica, onChanged }: {
  energy: EnergyLog[];
  meals: Meal[];
  metaProt: number;
  profile: HealthProfile | null;
  quemadasHoy: number;
  edad: number | null;
  irAClinica: () => void;
  onChanged: () => void;
}) {
  const hoy = hoyLocal();
  const tot = totalesDia(meals, hoy);
  const comidasHoy = meals.filter((m) => m.date === hoy);
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
    <>
    <OrdenGrid clave="energia-nutricion" bloques={[
      { id: "balance", el: (
        <BalanceCalorico profile={profile} edad={edad} comido={tot.kcal} quemadas={quemadasHoy} irAClinica={irAClinica} />
      ) },
      { id: "ayuno", el: <AyunoCard meals={meals} /> },
      { id: "comidas", el: (
      <div className="card panel">
        <h3>🍽 Tus comidas de hoy</h3>
        {comidasHoy.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 13.5 }}>
            Aún no hay platos registrados hoy. Usa la foto del plato en la pestaña Hoy y el acumulado aparece aquí.
          </p>
        ) : (
          <>
            {comidasHoy.map((m) => (
              <div className="txrow" key={m.id}>
                <span className="txicon">{momentoDe(m.meal_type)?.emoji ?? "🍽"}</span>
                <div className="txmeta">
                  <b>{m.description}</b>
                  <small>
                    {momentoDe(m.meal_type) ? `${momentoDe(m.meal_type)!.label}, ` : ""}
                    {m.kcal ?? 0} kcal, 🍗 {Math.round(m.protein_g ?? 0)} g, 🍞 {Math.round(m.carbs_g ?? 0)} g, 🥑 {Math.round(m.fat_g ?? 0)} g
                  </small>
                </div>
                <button className="xdel" aria-label="Eliminar comida" onClick={async () => { await deleteMeal(m.id); onChanged(); }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <div className="macro-fila" style={{ marginTop: 10 }}>
              <span className="macro"><b className="tnum">{tot.kcal}</b> kcal</span>
              <span className="macro">🍗 <b className="tnum">{tot.proteina} g</b></span>
              <span className="macro">🍞 <b className="tnum">{tot.carbos} g</b></span>
              <span className="macro">🥑 <b className="tnum">{tot.grasas} g</b></span>
              <span className="macro">🌾 <b className="tnum">{tot.fibra} g</b></span>
            </div>
            {quemadasHoy > 0 && (
              <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 10 }}>
                🔥 En movimiento quemaste ≈{quemadasHoy} kcal hoy: balance ≈{tot.kcal - quemadasHoy} kcal. Es una estimación para ver la tendencia, no una balanza.
              </p>
            )}
          </>
        )}
      </div>
      ) },
      { id: "semana", el: (
      <div className="card panel">
        <h3>📈 Tu semana de nutrición</h3>
        {dias.map((d) => {
          const log = energy.find((e) => e.date === d);
          const cups = log?.water_cups ?? 0;
          const prot = Number(log?.protein_g ?? 0) + totalesDia(meals, d).proteina;
          return (
            <div key={d} style={{ padding: "8px 0", borderBottom: "1px solid var(--line-soft)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 5 }}>
                <b style={{ textTransform: "capitalize" }}>{fmtDia(d)}</b>
                <span className="tnum">💧 {cups} de {META_AGUA_VASOS}, 🍗 {Math.round(prot)} g</span>
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
      ) },
      { id: "metas", el: (
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
                  ? profile.activity_level
                    ? `Calculada con tu peso y tu nivel de actividad. Si cambias de ritmo, actualízalo en la ficha.`
                    : `Estimada con tu peso. Dime qué tan activa eres en la ficha y la afino: quien entrena a diario necesita hasta 2 g por kilo.`
                  : "Meta general. Registra tu peso y tu nivel de actividad en Salud clínica y la calculo a tu medida."}
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
      ) },
      { id: "tip", el: (
        <div className="tip-destacado" style={{ marginBottom: 0 }}>
          💡 La proteína reparte mejor su efecto si la distribuyes en las comidas del día en vez de concentrarla en una sola.
        </div>
      ) },
    ]} />

    {/* Capa educativa: guías breves, humanas y aplicables */}
    <div style={{ marginTop: 18 }}>
      <h3 style={{ fontSize: 16, marginBottom: 4 }}>🌱 Aprende, sin moralismos</h3>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
        Mini guías para entender tu comida y aplicar cambios chicos. Toca una para abrirla.
      </p>
      <div className="guia-grid">
        {GUIAS_NUTRICION.map((g) => <GuiaCard key={g.id} guia={g} />)}
      </div>
    </div>
    </>
  );
}

function BalanceCalorico({ profile, edad, comido, quemadas, irAClinica }: {
  profile: HealthProfile | null;
  edad: number | null;
  comido: number;
  quemadas: number;
  irAClinica: () => void;
}) {
  const [objetivo, setObjetivo] = useState<ObjetivoCal>(getObjetivoCal());
  const mantencion = metaCalorias(profile, edad);

  if (mantencion === null) {
    return (
      <div className="card panel">
        <h3>🔥 Balance calórico de hoy</h3>
        <p style={{ fontSize: 13.5, color: "var(--muted)" }}>
          Para decirte cuántas calorías comer al día y si vas en déficit, necesito tu peso y tu estatura.
          Con tu nivel de actividad y tu sexo el cálculo queda aún más fino.
        </p>
        <button className="btn ghost" style={{ marginTop: 10 }} onClick={irAClinica}>Completar mi ficha</button>
      </div>
    );
  }

  const obj = OBJETIVOS_CAL.find((o) => o.key === objetivo) ?? OBJETIVOS_CAL[1];
  const meta = mantencion + obj.ajuste;
  const restante = meta - comido;
  const balance = comido - mantencion;
  const pct = Math.min(100, Math.round((comido / meta) * 100));

  return (
    <div className="card panel">
      <h3>🔥 Balance calórico de hoy</h3>
      <div className="seg" style={{ marginBottom: 12 }}>
        {OBJETIVOS_CAL.map((o) => (
          <button key={o.key} className={`segbtn ${objetivo === o.key ? "active" : ""}`}
            onClick={() => { setObjetivo(o.key); setObjetivoCal(o.key); }}>
            {o.label}
          </button>
        ))}
      </div>
      <p style={{ fontSize: 13.5, marginBottom: 8 }}>
        Tu meta de hoy: <b className="tnum">{meta} kcal</b>, {obj.nota}.
        Tu mantención es <b className="tnum">{mantencion}</b> kcal.
      </p>
      <div className="track" style={{ height: 8 }}>
        <div className="fill" style={{ width: `${pct}%`, background: restante >= 0 ? "var(--sal)" : "var(--warn, #d97706)" }} />
      </div>
      <div className="macro-fila" style={{ marginTop: 10 }}>
        <span className="macro">Comido <b className="tnum">{comido}</b></span>
        <span className="macro">{restante >= 0 ? "Te quedan" : "Te pasaste por"} <b className="tnum">{Math.abs(restante)}</b></span>
        {quemadas > 0 && <span className="macro">Movimiento <b className="tnum">≈{quemadas}</b></span>}
      </div>
      <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 10 }}>
        {balance < 0
          ? `Hoy vas ${Math.abs(balance)} kcal por debajo de tu mantención: eso es déficit calórico.`
          : balance === 0
            ? "Hoy vas justo en tu mantención."
            : `Hoy vas ${balance} kcal por sobre tu mantención: superávit.`}
        {" "}Registra todas tus comidas para que el número sea real.
      </p>
      <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 6 }}>
        Tu mantención ya considera tu nivel de actividad, por eso lo quemado en movimiento se muestra aparte, como referencia. Es una estimación para guiarte, no un examen de laboratorio.
      </p>
    </div>
  );
}

function GuiaCard({ guia }: { guia: (typeof GUIAS_NUTRICION)[number] }) {
  const [open, setOpen] = useState(false);
  return (
    <button className={"card guia-card" + (open ? " open" : "")} onClick={() => setOpen(!open)}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 22 }}>{guia.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <b style={{ fontSize: 14, display: "block" }}>{guia.titulo}</b>
          <small style={{ fontSize: 12.5, color: "var(--muted)" }}>{guia.resumen}</small>
        </div>
        <span style={{ color: "var(--muted)", fontSize: 12 }}>{open ? "▴" : "▾"}</span>
      </div>
      {open && (
        <ul style={{ marginTop: 10, paddingLeft: 18, display: "grid", gap: 6, textAlign: "left" }}>
          {guia.consejos.map((c) => (
            <li key={c} style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5 }}>{c}</li>
          ))}
        </ul>
      )}
    </button>
  );
}

// ---------- Movimiento ----------
function MovimientoTab({ exercise, pesoKg, onChanged }: { exercise: ExerciseLog[]; pesoKg: number | null; onChanged: () => void }) {
  const hace7 = (() => { const d = new Date(); d.setDate(d.getDate() - 6); return fmtFechaLocal(d); })();
  const semana = exercise.filter((e) => e.date >= hace7);
  const minSemana = semana.reduce((s, e) => s + e.minutes, 0);
  const kcalSemana = semana.reduce((s, e) => s + estimarKcal(e.kind, e.minutes, pesoKg), 0);
  const favorito = (() => {
    const cuenta = new Map<string, number>();
    for (const e of exercise) cuenta.set(e.kind, (cuenta.get(e.kind) ?? 0) + e.minutes);
    let mejor: string | null = null;
    for (const [k, v] of cuenta) if (mejor === null || v > (cuenta.get(mejor) ?? 0)) mejor = k;
    return mejor;
  })();

  return (
    <>
      <div className="statrow" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
        <div className="card stat"><div className="k">Esta semana</div><div className="v tnum">{minSemana} min</div></div>
        <div className="card stat"><div className="k">Kcal (7 días)</div><div className="v tnum">≈{kcalSemana}</div></div>
        <div className="card stat"><div className="k">Sesiones (7 días)</div><div className="v tnum">{semana.length}</div></div>
        <div className="card stat"><div className="k">Tu favorito</div><div className="v" style={{ fontSize: 19 }}>{favorito ?? "aún ninguno"}</div></div>
      </div>
      <OrdenGrid clave="energia-movimiento" bloques={[
        { id: "lista", el: (
        <div className="card panel">
          <h3>🏃 Últimos 30 días</h3>
          {exercise.length === 0 && (
            <p style={{ color: "var(--muted)", fontSize: 13.5 }}>
              Aún no hay movimiento registrado. Una caminata de 15 minutos ya cuenta.
            </p>
          )}
          {exercise.map((e) => (
            <div className="txrow" key={e.id}>
              <span className="txicon">🏃</span>
              <div className="txmeta"><b>{e.kind}</b><small>{e.date}, {e.minutes} minutos, ≈{estimarKcal(e.kind, e.minutes, pesoKg)} kcal</small></div>
              <button className="xdel" aria-label="Eliminar registro" onClick={async () => { await deleteExercise(e.id); onChanged(); }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
        ) },
        { id: "registrar", el: <RegistrarMovimiento onChanged={onChanged} /> },
        { id: "tip", el: (
          <div className="tip-destacado" style={{ marginBottom: 0 }}>
            💡 La meta amable son 150 minutos a la semana, unos 30 al día. No importa el deporte, importa moverte.
          </div>
        ) },
      ]} />
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
      <OrdenGrid clave="energia-sueno" bloques={[
        { id: "bitacora", el: (
        <div className="card panel">
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
        ) },
        { id: "registrar", el: <SuenoRapido rutinaHoy={rutinaHoy} onChanged={onChanged} /> },
        { id: "tip", el: (
          <div className="tip-destacado" style={{ marginBottom: 0 }}>
            💡 Acostarte y despertar a la misma hora todos los días le enseña a tu cuerpo cuándo soltar. La regularidad vale más que la cantidad.
          </div>
        ) },
      ]} />
    </>
  );
}
