import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { TablesMissingError } from "../finanzas/data";
import { daysUntil, dueLabel } from "../finanzas/types";
import { deleteExamFile, listExamFiles, openExamFile, uploadExamFile, type ExamFile } from "./files";
import {
  BLOOD_TYPES,
  DIETAS,
  addAppointment,
  addExam,
  addMedication,
  deleteAppointment,
  deleteExam,
  deleteMedication,
  getHealthProfile,
  listAppointments,
  listExams,
  listMedications,
  saveHealthProfile,
  type Appointment,
  type HealthExam,
  type HealthProfile,
  type Medication,
} from "./data";
import { hoyLocal } from "../lib/fechas";

// Salud clínica: tu ficha, medicamentos, citas y exámenes.
// Es el archivo médico; lo diario vive en las otras pestañas de Energía.

export function ClinicaTab() {
  const [profile, setProfile] = useState<HealthProfile | null>(null);
  const [meds, setMeds] = useState<Medication[]>([]);
  const [citas, setCitas] = useState<Appointment[]>([]);
  const [exams, setExams] = useState<HealthExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<"med" | "cita" | "exam" | null>(null);

  const hoy = hoyLocal();

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, m, c, e] = await Promise.all([
        getHealthProfile(), listMedications(), listAppointments(), listExams(),
      ]);
      setProfile(p ?? { blood_type: null, allergies: null, conditions: null, surgeries: null, weight_kg: null, height_cm: null, diet: null, eye_color: null });
      setMeds(m);
      setCitas(c);
      setExams(e);
      setNeedsMigration(false);
    } catch (e) {
      if (e instanceof TablesMissingError) setNeedsMigration(true);
      else setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const proximas = citas.filter((c) => c.date >= hoy);

  if (needsMigration) {
    return (
      <div className="card pad" style={{ maxWidth: 640 }}>
        <h3 style={{ marginBottom: 10 }}>Un paso pendiente en Supabase</h3>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 12 }}>
          Faltan las tablas de Salud. Es una sola vez: abre el SQL Editor de Supabase, pega el contenido de
          <code> supabase/migrations/0007_salud.sql</code> y presiona Run.
        </p>
        <button className="btn primary" onClick={() => void reload()}>Ya lo hice, reintentar</button>
      </div>
    );
  }

  if (loading) return <p style={{ color: "var(--muted)" }}>Cargando…</p>;

  return (
    <>
      {error && <div className="card pad" style={{ borderLeft: "3px solid var(--err)", marginBottom: 14 }}>{error}</div>}
      <div className="panelgrid">
        <div style={{ display: "grid", gap: 14, alignSelf: "start" }}>
          {/* Citas */}
          <div className="card panel">
            <h3>🩺 Citas</h3>
            {proximas.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13.5 }}>Sin citas próximas.</p>}
            {proximas.map((c) => {
              const lbl = dueLabel(daysUntil(c.date));
              return (
                <div className="txrow" key={c.id}>
                  <span className="txicon">🩺</span>
                  <div className="txmeta">
                    <b>{c.title}</b>
                    <small>{c.date}{c.time ? ` a las ${c.time.slice(0, 5)}` : ""}{c.location ? `, ${c.location}` : ""}</small>
                  </div>
                  <span className="chip" style={{
                    background: lbl.tone === "warn" ? "color-mix(in srgb,var(--warn) 16%,var(--paper))" : "var(--accent-wash)",
                    color: lbl.tone === "warn" ? "var(--warn)" : "var(--accent-ink)",
                  }}>{lbl.text}</span>
                  <button className="xdel" aria-label="Eliminar cita" onClick={async () => { if (!window.confirm(`¿Eliminar la cita ${c.title}?`)) return; await deleteAppointment(c.id); void reload(); }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
            <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => setModal("cita")}>
              <Plus size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} /> Nueva cita
            </button>
          </div>

          {/* Exámenes */}
          <div className="card panel">
            <h3>🧪 Exámenes</h3>
            {exams.length === 0 && (
              <p style={{ color: "var(--muted)", fontSize: 13.5 }}>
                Anota tus exámenes pendientes (sangre, vitaminas, chequeos) y registra el resultado cuando llegue.
              </p>
            )}
            {exams.map((e) => (
              <ExamRow key={e.id} exam={e} onChanged={() => void reload()} />
            ))}
            <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => setModal("exam")}>
              <Plus size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} /> Nuevo examen
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gap: 14, alignSelf: "start" }}>
          {/* Ficha */}
          {profile && <FichaCard profile={profile} onSaved={() => void reload()} />}

          {/* Medicamentos */}
          <div className="card panel">
            <h3>💊 Medicamentos</h3>
            {meds.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13.5 }}>Sin medicamentos registrados.</p>}
            {meds.map((m) => (
              <div className="txrow" key={m.id}>
                <span className="txicon">💊</span>
                <div className="txmeta">
                  <b>{m.name}</b>
                  <small>{[m.dose, m.schedule].filter(Boolean).join(", ") || "sin horario"}</small>
                </div>
                <button className="xdel" aria-label="Eliminar medicamento" onClick={async () => { if (!window.confirm(`¿Eliminar ${m.name}?`)) return; await deleteMedication(m.id); void reload(); }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => setModal("med")}>
              <Plus size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} /> Nuevo medicamento
            </button>
          </div>
        </div>
      </div>

      {modal === "cita" && <CitaModal onClose={() => setModal(null)} onSaved={() => { setModal(null); void reload(); }} />}
      {modal === "exam" && <ExamModal onClose={() => setModal(null)} onSaved={() => { setModal(null); void reload(); }} />}
      {modal === "med" && <MedModal onClose={() => setModal(null)} onSaved={() => { setModal(null); void reload(); }} />}
    </>
  );
}

function FichaCard({ profile, onSaved }: { profile: HealthProfile; onSaved: () => void }) {
  const [blood, setBlood] = useState(profile.blood_type ?? "");
  const [allergies, setAllergies] = useState(profile.allergies ?? "");
  const [conditions, setConditions] = useState(profile.conditions ?? "");
  const [surgeries, setSurgeries] = useState(profile.surgeries ?? "");
  const [peso, setPeso] = useState(profile.weight_kg != null ? String(profile.weight_kg) : "");
  const [estatura, setEstatura] = useState(profile.height_cm != null ? String(profile.height_cm) : "");
  const [dieta, setDieta] = useState(profile.diet ?? "");
  const [ojos, setOjos] = useState(profile.eye_color ?? "");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await saveHealthProfile({
        blood_type: blood || null,
        allergies: allergies || null,
        conditions: conditions || null,
        surgeries: surgeries || null,
        weight_kg: peso ? Number(peso) : null,
        height_cm: estatura ? Number(estatura) : null,
        diet: dieta || null,
        eye_color: ojos || null,
      });
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
      setBusy(false);
      return;
    }
    setBusy(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onSaved();
  }

  return (
    <div className="card panel">
      <h3>📋 Mi ficha</h3>
      <form onSubmit={save}>
        <div className="field"><label>Tipo de sangre</label>
          <select value={blood} onChange={(e) => setBlood(e.target.value)}>
            <option value="">No lo sé</option>
            {BLOOD_TYPES.map((b) => <option key={b}>{b}</option>)}
          </select></div>
        <div className="field"><label>Alergias</label>
          <input value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="Penicilina, maní…" /></div>
        <div className="field"><label>Condiciones</label>
          <input value={conditions} onChange={(e) => setConditions(e.target.value)} placeholder="ADHD, hipotiroidismo…" /></div>
        <div className="field"><label>Operaciones</label>
          <input value={surgeries} onChange={(e) => setSurgeries(e.target.value)} placeholder="Apendicectomía (2019)…" /></div>
        <div className="frow">
          <div className="field"><label>Peso (kg)</label>
            <input type="number" min="0" step="0.1" value={peso} onChange={(e) => setPeso(e.target.value)} placeholder="62" /></div>
          <div className="field"><label>Estatura (cm)</label>
            <input type="number" min="0" step="1" value={estatura} onChange={(e) => setEstatura(e.target.value)} placeholder="165" /></div>
        </div>
        <div className="frow">
          <div className="field"><label>Alimentación</label>
            <select value={dieta} onChange={(e) => setDieta(e.target.value)}>
              <option value="">Sin definir</option>
              {DIETAS.map((d) => <option key={d}>{d}</option>)}
            </select></div>
          <div className="field"><label>Color de ojos</label>
            <input value={ojos} onChange={(e) => setOjos(e.target.value)} placeholder="café, verdes…" /></div>
        </div>
        {err && <p style={{ fontSize: 12.5, color: "var(--err)", marginBottom: 8 }}>{err}</p>}
        <button className="btn primary" disabled={busy} style={{ width: "100%" }}>{busy ? "Guardando…" : "Guardar ficha"}</button>
        {saved && <span className="chip" style={{ marginTop: 8 }}>✓ Guardada</span>}
      </form>
    </div>
  );
}

function CitaModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await addAppointment({ title, date, time: time || null, location: location || null });
    onSaved();
  }

  return (
    <ModalShell title="Nueva cita" onClose={onClose}>
      <form onSubmit={save}>
        <div className="field"><label>¿Con quién?</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Psicóloga, dentista, médica general…" autoFocus /></div>
        <div className="frow">
          <div className="field"><label>Fecha</label>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="field"><label>Hora (opcional)</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
        </div>
        <div className="field"><label>Lugar (opcional)</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Clínica, en línea…" /></div>
        <button className="btn primary" disabled={busy} style={{ width: "100%", marginTop: 4 }}>{busy ? "Guardando…" : "Guardar cita"}</button>
      </form>
    </ModalShell>
  );
}

function ExamModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [due, setDue] = useState("");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await addExam({ name, due_date: due || null, result: result || null });
    onSaved();
  }

  return (
    <ModalShell title="Nuevo examen" onClose={onClose}>
      <form onSubmit={save}>
        <div className="field"><label>Examen</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Examen de sangre, hierro, vitamina D…" autoFocus /></div>
        <div className="frow">
          <div className="field"><label>Para cuándo (opcional)</label>
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} /></div>
          <div className="field"><label>Resultado (si ya lo tienes)</label>
            <input value={result} onChange={(e) => setResult(e.target.value)} placeholder="normal, hierro bajo…" /></div>
        </div>
        <button className="btn primary" disabled={busy} style={{ width: "100%", marginTop: 4 }}>{busy ? "Guardando…" : "Guardar examen"}</button>
      </form>
    </ModalShell>
  );
}

function MedModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [schedule, setSchedule] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await addMedication({ name, dose: dose || null, schedule: schedule || null });
    onSaved();
  }

  return (
    <ModalShell title="Nuevo medicamento" onClose={onClose}>
      <form onSubmit={save}>
        <div className="field"><label>Nombre</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Levotiroxina" autoFocus /></div>
        <div className="frow">
          <div className="field"><label>Dosis (opcional)</label>
            <input value={dose} onChange={(e) => setDose(e.target.value)} placeholder="50 mg" /></div>
          <div className="field"><label>Horario (opcional)</label>
            <input value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="08:00 en ayunas" /></div>
        </div>
        <button className="btn primary" disabled={busy} style={{ width: "100%", marginTop: 4 }}>{busy ? "Guardando…" : "Guardar"}</button>
      </form>
    </ModalShell>
  );
}

export function ModalShell({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="tp-overlay" onClick={onClose}>
      <div className="tp" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 430 }}>
        <h3 style={{ marginBottom: 14 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

function ExamRow({ exam, onChanged }: { exam: HealthExam; onChanged: () => void }) {
  const [archivos, setArchivos] = useState<ExamFile[]>([]);
  const [bucketFalta, setBucketFalta] = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setArchivos(await listExamFiles(exam.id));
      setBucketFalta(false);
    } catch (e) {
      if (e instanceof Error && e.message === "BUCKET_MISSING") setBucketFalta(true);
    }
  }, [exam.id]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setSubiendo(true);
    try {
      await uploadExamFile(exam.id, file);
      await cargar();
    } catch (ex) {
      if (ex instanceof Error && ex.message === "BUCKET_MISSING") setBucketFalta(true);
    } finally {
      setSubiendo(false);
    }
  }

  const lbl = !exam.result && exam.due_date ? dueLabel(daysUntil(exam.due_date)) : null;

  return (
    <div style={{ borderBottom: "1px solid var(--line-soft)", padding: "8px 0" }}>
      <div className="txrow" style={{ borderBottom: "none", padding: "2px 0" }}>
        <span className="txicon">🧪</span>
        <div className="txmeta">
          <b>{exam.name}</b>
          <small>{exam.result ? `resultado: ${exam.result}` : exam.due_date ? `pendiente, para el ${exam.due_date}` : "pendiente"}</small>
        </div>
        {lbl && (
          <span className="chip" style={{
            background: lbl.tone === "err" ? "color-mix(in srgb,var(--err) 16%,var(--paper))" : lbl.tone === "warn" ? "color-mix(in srgb,var(--warn) 16%,var(--paper))" : "var(--accent-wash)",
            color: lbl.tone === "err" ? "var(--err)" : lbl.tone === "warn" ? "var(--warn)" : "var(--accent-ink)",
          }}>{lbl.text}</span>
        )}
        <button className="xdel" aria-label="Eliminar examen" onClick={async () => { if (!window.confirm(`¿Eliminar el examen ${exam.name}? También se pierden sus archivos adjuntos.`)) return; await deleteExam(exam.id); onChanged(); }}>
          <Trash2 size={14} />
        </button>
      </div>
      <div style={{ paddingLeft: 44 }}>
        {bucketFalta ? (
          <p style={{ fontSize: 11.5, color: "var(--muted)" }}>
            Para adjuntar el PDF del laboratorio, corre <code>supabase/migrations/0015_salud_plus.sql</code>.
          </p>
        ) : (
          <>
            {archivos.map((a) => (
              <div key={a.path} style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 0" }}>
                <button className="linklike" style={{ fontSize: 12 }} onClick={() => void openExamFile(a.path)}>📎 {a.name}</button>
                <button className="xdel" aria-label="Eliminar adjunto" style={{ width: 22, height: 22 }}
                  onClick={async () => { await deleteExamFile(a.path); void cargar(); }}>
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
            <label className="linklike" style={{ fontSize: 11.5, cursor: "pointer", color: "var(--muted)" }}>
              {subiendo ? "Subiendo…" : "📎 Adjuntar resultado (PDF o foto)"}
              <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" style={{ display: "none" }} onChange={onFile} disabled={subiendo} />
            </label>
          </>
        )}
      </div>
    </div>
  );
}
