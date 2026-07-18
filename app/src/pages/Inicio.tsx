import { hoyLocal, mesActualLocal } from "../lib/fechas";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Sparkles } from "lucide-react";
import { AREAS } from "../areas";
import { CoachCard } from "../components/CoachCard";
import { OrdenGrid } from "../components/OrdenGrid";
import { useAuth } from "../auth/AuthProvider";
import { useSettings } from "../settings/SettingsProvider";
import { TablesMissingError, listAccounts, listReminders, listTransactions } from "../finanzas/data";
import { daysUntil, dueLabel, fmtMoney, nextOccurrence, type Account, type Reminder, type Tx } from "../finanzas/types";
import { METRICAS_AUTO, cargarFuentes, listObjectives, metaAutoEsperado, progresoDe, valorAuto, type ActivityEntry, type Fuentes, type Objective } from "../objetivos/data";
import { listHabitLogs, listHabits, listRoutine, sleepHours, type ExerciseLog, type Habit, type HabitLog, type RoutineLog } from "../habitos/data";
import { type RetoLog } from "../habitos/retos";
import { listSesiones } from "../mente/practicas";
import { META_AGUA_VASOS, listEnergy, metaProteina, type EnergyLog } from "../salud/energia";
import { listMeals, totalesDia, type Meal } from "../salud/comidas";
import { getHealthProfile, type HealthProfile } from "../salud/data";
import { listProjects, type Project } from "../trabajo/data";
import { SOBRIETY_MILESTONES, daysSince, humanizeDays, listAppointments, listSobriety, type Appointment, type Sobriety } from "../salud/data";
import { listEntries, type Entry } from "../aprendizaje/data";
import { listRelLogs, listRelationships, needsReconnect, type RelLog, type Relationship } from "../relaciones/data";
import { TareasHoy } from "../tareas/TareasHoy";
import { UnPaso } from "../components/UnPaso";
import { DopaminaCard } from "../components/DopaminaCard";
import { abrirPomodoro, bloquesHoyLocal } from "../foco/data";

export function Inicio() {
  const { session } = useAuth();
  const { currency, displayName, lifeVision, birthday, updateProfile } = useSettings();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [finReady, setFinReady] = useState(false);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [objReady, setObjReady] = useState(false);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [habReady, setHabReady] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [traReady, setTraReady] = useState(false);
  const [sobriety, setSobriety] = useState<Sobriety[]>([]);
  const [citas, setCitas] = useState<Appointment[]>([]);
  const [salReady, setSalReady] = useState(false);
  const [notas, setNotas] = useState<Entry[]>([]);
  const [aprReady, setAprReady] = useState(false);
  const [rels, setRels] = useState<Relationship[]>([]);
  const [relLogs, setRelLogs] = useState<RelLog[]>([]);
  const [relReady, setRelReady] = useState(false);
  const [routine, setRoutine] = useState<RoutineLog[]>([]);
  const [exercise, setExercise] = useState<ExerciseLog[]>([]);
  const [energy, setEnergy] = useState<EnergyLog[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [retoLogs, setRetoLogs] = useState<RetoLog[]>([]);
  const [workLogsF, setWorkLogsF] = useState<Fuentes["workLogs"]>([]);
  const [focusBlocksF, setFocusBlocksF] = useState<Fuentes["focusBlocks"]>([]);
  const [perfil, setPerfil] = useState<HealthProfile | null>(null);

  const [editingVision, setEditingVision] = useState(false);
  const [visionDraft, setVisionDraft] = useState("");
  const [visionErr, setVisionErr] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const [a, t, r] = await Promise.all([listAccounts(), listTransactions(50), listReminders()]);
      setAccounts(a);
      setTxs(t);
      setReminders(r);
      setFinReady(true);
    } catch (e) {
      if (e instanceof TablesMissingError) setFinReady(false);
    }
    try {
      setObjectives(await listObjectives());
      setObjReady(true);
    } catch {
      setObjReady(false);
    }
    // Las fuentes del progreso automático se cargan con las mismas ventanas
    // que usa Dirección: la brújula y las metas deben decir lo mismo.
    try {
      const f = await cargarFuentes();
      setActivity(f.avances);
      setExercise(f.ejercicio);
      setRetoLogs(f.retoLogs);
      setWorkLogsF(f.workLogs);
      setFocusBlocksF(f.focusBlocks);
    } catch { /* fuentes opcionales */ }
    try {
      const [h, hl] = await Promise.all([listHabits(), listHabitLogs()]);
      setHabits(h);
      setHabitLogs(hl);
      setHabReady(true);
    } catch {
      setHabReady(false);
    }
    try {
      setProjects(await listProjects());
      setTraReady(true);
    } catch {
      setTraReady(false);
    }
    try {
      const [s, c] = await Promise.all([listSobriety(), listAppointments()]);
      setSobriety(s);
      setCitas(c);
      setSalReady(true);
    } catch {
      setSalReady(false);
    }
    try {
      setNotas(await listEntries());
      setAprReady(true);
    } catch {
      setAprReady(false);
    }
    try {
      const [r, rl] = await Promise.all([listRelationships(), listRelLogs()]);
      setRels(r);
      setRelLogs(rl);
      setRelReady(true);
    } catch {
      setRelReady(false);
    }
    // Pulso del día (cada fuente es opcional, sin drama si falta).
    try {
      setRoutine(await listRoutine(3));
    } catch { /* sin tablas de rutina */ }
    try {
      setEnergy(await listEnergy(2));
    } catch { /* sin la 0018 */ }
    try {
      setMeals(await listMeals(2));
    } catch { /* sin la 0020 */ }
    try {
      setPerfil(await getHealthProfile());
    } catch { /* sin ficha */ }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const nombre = displayName || (session?.user?.email ?? "").split("@")[0] || "Hola";

  const month = mesActualLocal();
  const monthTxs = txs.filter((t) => t.date.startsWith(month));

  // El Inicio habla de tu avance de vida, no de plata (bloque B del reporte).
  const avancesMes = activity.filter((a) => a.date.startsWith(month)).length;
  const metasEnCamino = objectives.filter((o) => o.status === "en_camino").length;
  // Las fuentes del progreso automático: las mismas ventanas que Dirección.
  const fuentes: Fuentes = { ejercicio: exercise, sesiones: listSesiones(), habitLogs, retoLogs, avances: activity, workLogs: workLogsF, focusBlocks: focusBlocksF };
  const globalPct = objectives.length
    ? Math.round(objectives.reduce((s, o) => s + progresoDe(o, fuentes), 0) / objectives.length)
    : null;
  const hechosHoy = new Set(habitLogs.filter((l) => l.date === hoyLocal()).map((l) => l.habit_id)).size;

  // ---------- Pulso del día ----------
  const hoyStr = hoyLocal();
  const rutinaHoy = routine.find((r) => r.date === hoyStr);
  const suenoAnoche = rutinaHoy ? sleepHours(rutinaHoy) : null;
  const energiaHoy = energy.find((e) => e.date === hoyStr);
  const agua = energiaHoy?.water_cups ?? 0;
  const proteinaHoy = Math.round(Number(energiaHoy?.protein_g ?? 0) + totalesDia(meals, hoyStr).proteina);
  const metaProt = metaProteina(perfil);
  const movHoy = exercise.filter((e) => e.date === hoyStr).reduce((s, e) => s + e.minutes, 0);
  const sesionesMenteHoy = listSesiones().filter((s) => s.fecha === hoyStr).length;

  // ---------- Brújula: una meta que empuja hoy ----------
  // A propósito muestra solo UNA (la de fecha más próxima): un cerebro TDAH
  // con diez metas a la vista no avanza en ninguna. Las demás siguen enteras
  // en Dirección, esto es solo dónde poner el ojo hoy.
  const activasOrdenadas = objectives
    .filter((o) => o.status === "en_camino" || o.status === "en_riesgo")
    .sort((a, b) => (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999"));
  const brujula = activasOrdenadas[0] ?? null;
  const otrasActivas = Math.max(0, activasOrdenadas.length - 1);
  const brujulaPct = brujula ? progresoDe(brujula, fuentes) : 0;
  const brujulaPaso = brujula?.milestones.find((m) => m.progress < 100) ?? null;
  const brujulaMetrica = brujula?.auto_metric ? METRICAS_AUTO.find((m) => m.key === brujula.auto_metric) : null;
  const fechaLarga = (() => {
    const f = new Date().toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });
    return f.charAt(0).toUpperCase() + f.slice(1);
  })();

  // El avance por área usa el progreso REAL de cada meta, incluido el
  // automático: si tu gimnasio empuja "Estar en forma", la barra lo muestra.
  function avanceArea(key: string): number | null {
    const objs = objectives.filter((o) => o.area === key);
    if (objs.length === 0) return null;
    return Math.round(objs.reduce((s, o) => s + progresoDe(o, fuentes), 0) / objs.length);
  }

  const resumenCoach = [
    lifeVision ? `Visión de vida: "${lifeVision}"` : "Aún no escribe su visión de vida.",
    objectives.length
      ? `Metas: ${objectives.length} en total, avance promedio ${globalPct}%, ${metasEnCamino} en camino${objectives.filter((o) => o.status === "en_riesgo").length ? `, en riesgo: ${objectives.filter((o) => o.status === "en_riesgo").map((o) => o.title).slice(0, 2).join(", ")}` : ""}.`
      : "Todavía no define metas.",
    `Avances registrados este mes: ${avancesMes}.`,
    habits.length ? `Hábitos de hoy: ${hechosHoy} de ${habits.length} cumplidos.` : "Sin hábitos creados aún.",
    projects.filter((p) => p.status === "activo").length ? `Proyectos activos: ${projects.filter((p) => p.status === "activo").map((p) => p.name).slice(0, 3).join(", ")}.` : "",
    citas.filter((c) => c.date >= hoyLocal()).length ? `Citas de salud próximas: ${citas.filter((c) => c.date >= hoyLocal()).length}.` : "",
    sobriety[0] ? `Sobriedad: libre de ${sobriety[0].substance} hace ${humanizeDays(daysSince(sobriety[0].start_date))}.` : "",
    rels.filter((r) => needsReconnect(r, relLogs)).length ? `Vínculos por reconectar: ${rels.filter((r) => needsReconnect(r, relLogs)).map((r) => r.name).slice(0, 3).join(", ")}.` : "",
  ].filter(Boolean).join("\n");

  async function saveVision() {
    setVisionErr(null);
    const err = await updateProfile({ life_vision: visionDraft.trim() });
    if (err) setVisionErr(err);
    else setEditingVision(false);
  }

  return (
    <div className="page">
      <div className="page-head">
        <div className="eyebrow"><Sparkles size={13} /> {fechaLarga}</div>
        {birthday && birthday.slice(5) === hoyStr.slice(5) ? (
          <>
            <h1>¡Feliz cumpleaños, {nombre}! 🎂</h1>
            <p>Hoy el sistema celebra a su núcleo: tú. Regálate algo lindo y un día a tu ritmo.</p>
          </>
        ) : (
          <>
            <h1>Hola, {nombre}</h1>
            <p>Tu día de un vistazo: el pulso del cuerpo, tu brújula y tus áreas.</p>
          </>
        )}
      </div>

      {/* Visión de vida (real, editable) */}
      <div className="card vision">
        <div className="lb" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          Visión de vida
          {!editingVision && (
            <button className="xdel" aria-label="Editar visión" style={{ width: 24, height: 24 }}
              onClick={() => { setVisionDraft(lifeVision); setEditingVision(true); }}>
              <Pencil size={12} />
            </button>
          )}
        </div>
        {editingVision ? (
          <div>
            <textarea className="vision-edit" rows={3} value={visionDraft} autoFocus
              placeholder="¿Cómo quieres que sea tu vida? Escríbelo con tus palabras…"
              onChange={(e) => setVisionDraft(e.target.value)} />
            {visionErr && <p style={{ fontSize: 12.5, color: "var(--err)", marginTop: 6 }}>{visionErr}</p>}
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button className="btn primary" onClick={() => void saveVision()}>Guardar</button>
              <button className="btn ghost" onClick={() => setEditingVision(false)}>Cancelar</button>
            </div>
          </div>
        ) : lifeVision ? (
          <q>{lifeVision}</q>
        ) : (
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Aún no escribes tu visión de vida. Es el norte de todo el sistema. Escríbela con el lápiz. ✏️
          </p>
        )}
      </div>

      {/* Pulso del día: señales vivas, cada una te lleva a su módulo */}
      <div className="pulso">
        <Link to="/salud" className="card stat"><div className="k">😴 Sueño</div><div className="v tnum">{suenoAnoche !== null ? `${suenoAnoche} h` : "‥"}</div></Link>
        <Link to="/salud" className="card stat"><div className="k">💧 Agua</div><div className="v tnum">{agua}<small style={{ fontSize: 12, color: "var(--muted)" }}> de {META_AGUA_VASOS}</small></div></Link>
        <Link to="/salud" className="card stat"><div className="k">🍗 Proteína</div><div className="v tnum">{proteinaHoy}<small style={{ fontSize: 12, color: "var(--muted)" }}> de {metaProt} g</small></div></Link>
        <Link to="/movimiento" className="card stat"><div className="k">🏃 Movimiento</div><div className="v tnum">{movHoy}<small style={{ fontSize: 12, color: "var(--muted)" }}> min</small></div></Link>
        <Link to="/mente" className="card stat"><div className="k">🕊 Mente</div><div className="v tnum">{sesionesMenteHoy}<small style={{ fontSize: 12, color: "var(--muted)" }}> {sesionesMenteHoy === 1 ? "sesión" : "sesiones"}</small></div></Link>
        <Link to="/habitos" className="card stat"><div className="k">✓ Hábitos</div><div className="v tnum">{habReady ? `${hechosHoy}/${habits.length}` : "…"}</div></Link>
        <button className="card stat" style={{ textAlign: "left", cursor: "pointer", border: "1px solid var(--line)", font: "inherit" }}
          onClick={() => abrirPomodoro()} title="Abrir el pomodoro">
          <div className="k">🎯 Foco</div>
          <div className="v tnum">{bloquesHoyLocal()}<small style={{ fontSize: 12, color: "var(--muted)" }}> {bloquesHoyLocal() === 1 ? "bloque" : "bloques"}</small></div>
        </button>
      </div>

      {/* Contra la parálisis: una sola cosa a la vez */}
      <UnPaso />

      {/* Brújula: la meta que empuja hoy */}
      {brujula && (
        <div className="card panel" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>🧭</span>
            <h3 style={{ margin: 0, flex: 1 }}>Tu brújula</h3>
            <Link to="/objetivos" style={{ fontSize: 12, color: "var(--accent-ink)", fontWeight: 600 }}>ver todas</Link>
          </div>
          <b style={{ fontSize: 15 }}>{brujula.title}</b>
          {otrasActivas > 0 && (
            <span style={{ fontSize: 11.5, color: "var(--muted)", marginLeft: 8 }}>
              y {otrasActivas} {otrasActivas === 1 ? "meta más en camino" : "metas más en camino"}
            </span>
          )}
          <div className="bar" style={{ margin: "8px 0 0" }}>
            <div className="top">
              <span>
                {brujulaMetrica && brujula.auto_target
                  ? `⚡ ${valorAuto(brujula, fuentes)} de ≈${metaAutoEsperado(brujula)} ${brujulaMetrica.unidad}`
                  : brujula.deadline ? `para el ${brujula.deadline}` : "en camino"}
              </span>
              <b className="tnum">{brujulaPct}%</b>
            </div>
            <div className="track"><div className="fill" style={{ width: `${brujulaPct}%`, background: "var(--obj)" }} /></div>
          </div>
          <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 8 }}>
            {brujulaPaso
              ? `Siguiente paso: ${brujulaPaso.title}`
              : brujulaMetrica
                ? `Se alimenta de ${brujulaMetrica.fuente}: un registro de hoy ya la empuja.`
                : "Ábrela en Dirección y ponle pasos o una conexión automática."}
          </p>
        </div>
      )}

      <CoachCard resumen={resumenCoach} />

      {/* Orden pensado para que las columnas queden parejas: lo alto primero. */}
      <OrdenGrid clave="inicio-v2" dosColumnas bloques={(() => {
        const prio = ["tareas", "areas", "pagos", "avances", "dopamina", "sobriedad"];
        const b = [
        { id: "tareas", el: <TareasHoy /> },
        { id: "dopamina", el: <DopaminaCard /> },
        ...(reminders.length > 0 ? [{ id: "pagos", el: (
        <div className="card panel">
          <h3>🔔 Próximo pago</h3>
          {[...reminders]
            .map((r) => ({ r, next: nextOccurrence(r) }))
            .sort((a, b) => a.next.localeCompare(b.next))
            .slice(0, 1)
            .map(({ r, next }) => {
              const lbl = dueLabel(daysUntil(next));
              return (
                <div className="txrow" key={r.id}>
                  <span className="txicon">{r.category === "creditCard" ? "💳" : r.category === "debt" ? "🏦" : "🔔"}</span>
                  <div className="txmeta">
                    <b>{r.title}</b>
                    <small>{next}{r.amount ? `, ${fmtMoney(Number(r.amount), accounts[0]?.currency ?? currency)}` : ""}</small>
                  </div>
                  <span className="chip" style={{
                    background: lbl.tone === "err" ? "color-mix(in srgb,var(--err) 16%,var(--paper))" : lbl.tone === "warn" ? "color-mix(in srgb,var(--warn) 16%,var(--paper))" : "var(--accent-wash)",
                    color: lbl.tone === "err" ? "var(--err)" : lbl.tone === "warn" ? "var(--warn)" : "var(--accent-ink)",
                  }}>{lbl.text}</span>
                </div>
              );
            })}
          <Link to="/finanzas" style={{ fontSize: 12.5, color: "var(--accent-ink)", textDecoration: "underline", display: "inline-block", marginTop: 8 }}>
            Ver todos en Finanzas, pestaña Deudas y tarjetas
          </Link>
        </div>
        ) }] : []),
        { id: "areas", el: (
        <div className="card panel">
          <h3>Tus áreas</h3>
          {AREAS.map((a) => {
            let badge: React.ReactNode = <span style={{ marginLeft: "auto", fontSize: 11.5, color: "var(--muted)" }}>próximamente</span>;
            if (a.key === "finanzas" && finReady) {
              badge = <span className="chip" style={{ marginLeft: "auto" }}>{monthTxs.length} mov. este mes</span>;
            } else if (a.key === "objetivos" && objReady) {
              const n = objectives.length;
              badge = <span className="chip" style={{ marginLeft: "auto" }}>{n === 1 ? "1 meta" : `${n} metas`}</span>;
            } else if (a.key === "habitos" && habReady) {
              const hoyStr = hoyLocal();
              const hechos = new Set(habitLogs.filter((l) => l.date === hoyStr).map((l) => l.habit_id)).size;
              badge = <span className="chip" style={{ marginLeft: "auto" }}>{hechos} / {habits.length} hoy</span>;
            } else if (a.key === "trabajo" && traReady) {
              const n = projects.filter((p) => p.status === "activo").length;
              badge = <span className="chip" style={{ marginLeft: "auto" }}>{n === 1 ? "1 proyecto activo" : `${n} proyectos activos`}</span>;
            } else if (a.key === "salud" && salReady) {
              const hoyStr = hoyLocal();
              const prox = citas.filter((c) => c.date >= hoyStr).length;
              badge = <span className="chip" style={{ marginLeft: "auto" }}>{prox === 1 ? "1 cita próxima" : `${prox} citas próximas`}</span>;
            } else if (a.key === "aprendizaje" && aprReady) {
              badge = <span className="chip" style={{ marginLeft: "auto" }}>{notas.length === 1 ? "1 nota" : `${notas.length} notas`}</span>;
            } else if (a.key === "relaciones" && relReady) {
              const n = rels.filter((r) => needsReconnect(r, relLogs)).length;
              badge = n > 0
                ? <span className="chip" style={{ marginLeft: "auto", background: "color-mix(in srgb,var(--rel) 20%,var(--paper))", color: "color-mix(in srgb,var(--rel) 75%,var(--ink))" }}>💌 {n} por reconectar</span>
                : <span className="chip" style={{ marginLeft: "auto" }}>{rels.length === 1 ? "1 vínculo" : `${rels.length} vínculos`}</span>;
            }
            const pct = avanceArea(a.key);
            return (
              <Link to={a.path} key={a.key} className="area-row" style={{ display: "block" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="adot" style={{ width: 9, height: 9, borderRadius: "50%", background: a.color, flexShrink: 0 }} />
                  <span className="area-name">{a.name}</span>
                  {pct !== null
                    ? <b className="tnum" style={{ marginLeft: "auto", fontSize: 13 }}>{pct}%</b>
                    : badge}
                </div>
                <div className="track" style={{ marginTop: 7 }}>
                  <div className="fill" style={{ width: `${pct ?? 0}%`, background: a.color }} />
                </div>
              </Link>
            );
          })}
        </div>
        ) },
        { id: "avances", el: (
        <div className="card panel">
          <h3>Avances recientes</h3>
          {activity.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 13.5 }}>
              Cada avance que registres en <Link to="/objetivos" style={{ color: "var(--accent-ink)", textDecoration: "underline" }}>Dirección</Link> o en cualquier área aparecerá aquí: tu historia hacia tu mejor versión.
            </p>
          ) : (
            activity.slice(0, 6).map((a) => {
              const area = AREAS.find((x) => x.key === a.area);
              return (
                <div className="tl" key={a.id}>
                  <div className="row">
                    <span className="tdot" style={{ background: area?.color ?? "var(--accent)" }} />
                    <div className="tx">
                      <b>{area?.name ?? "Dirección"}, {a.date}</b>
                      {a.description}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        ) },
        ...(sobriety.length > 0 ? [{ id: "sobriedad", el: (
          <div style={{ display: "grid", gap: 12 }}>
      {sobriety.map((s) => {
        const dias = daysSince(s.start_date);
        const logrados = SOBRIETY_MILESTONES.filter((m) => dias >= m.days);
        const proximo = SOBRIETY_MILESTONES.find((m) => dias < m.days);
        return (
          <div className="card sob" key={s.id}>
            <span className="seed">🌱</span>
            <div>
              <div className="t1">Libre de {s.substance}</div>
              <div className="t2 tnum">{humanizeDays(dias)}</div>
            </div>
            <div className="hitos">
              {logrados.slice(-2).map((m) => <span className="hito" key={m.days}>✓ {m.label}</span>)}
              {proximo ? <span className="hito next">Próximo: {proximo.label}</span> : <span className="hito">🎉 Más de 2 años</span>}
            </div>
          </div>
        );
      })}
          </div>
        ) }] : []),
        ];
        return b.sort((x, y) => prio.indexOf(x.id) - prio.indexOf(y.id));
      })()} />
    </div>
  );
}
