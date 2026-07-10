import { AvancesArea } from "../components/AvancesArea";
import { hoyLocal, mesActualLocal } from "../lib/fechas";
import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2, Users } from "lucide-react";
import { TablesMissingError } from "../finanzas/data";
import {
  TIPS,
  addRelLog,
  addRelationship,
  daysSinceContact,
  daysToBirthday,
  deleteRelLog,
  deleteRelationship,
  listRelLogs,
  listRelationships,
  needsReconnect,
  TIPO_LABELS,
  accionDelDia,
  accionesPara,
  tipDelDia,
  tipoDeVinculo,
  type RelLog,
  type Relationship,
} from "./data";

export function RelacionesPage() {
  const [rels, setRels] = useState<Relationship[]>([]);
  const [logs, setLogs] = useState<RelLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [relModal, setRelModal] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [r, l] = await Promise.all([listRelationships(), listRelLogs()]);
      setRels(r);
      setLogs(l);
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

  const porReconectar = rels.filter((r) => needsReconnect(r, logs));
  const mes = mesActualLocal();
  const interaccionesMes = logs.filter((l) => l.date.startsWith(mes)).length;
  const cumples = rels
    .map((r) => ({ r, dias: daysToBirthday(r.birthday) }))
    .filter((x): x is { r: Relationship; dias: number } => x.dias !== null)
    .sort((a, b) => a.dias - b.dias);

  if (needsMigration) {
    return (
      <div className="page">
        <Head />
        <div className="card pad" style={{ maxWidth: 640 }}>
          <h3 style={{ marginBottom: 10 }}>Un paso pendiente en Supabase</h3>
          <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 12 }}>
            Faltan las tablas de Relaciones. Es una sola vez: abre el SQL Editor de Supabase, pega el contenido de
            <code> supabase/migrations/0010_relaciones.sql</code> y presiona Run.
          </p>
          <button className="btn primary" onClick={() => void reload()}>Ya lo hice, reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <Head />

      <div className="ftabs">
        <span style={{ flex: 1 }} />
        <button className="btn primary" onClick={() => setRelModal(true)}>
          <Plus size={15} style={{ verticalAlign: "-2px", marginRight: 5 }} />
          Nuevo vínculo
        </button>
      </div>

      {error && <div className="card pad" style={{ borderLeft: "3px solid var(--err)", marginBottom: 14 }}>{error}</div>}
      {loading ? (
        <p style={{ color: "var(--muted)" }}>Cargando…</p>
      ) : (
        <>
          <div className="statrow" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
            <div className="card stat"><div className="k">Vínculos</div><div className="v tnum">{rels.length}</div></div>
            <div className="card stat"><div className="k">Por reconectar</div><div className="v tnum" style={porReconectar.length > 0 ? { color: "var(--warn)" } : undefined}>{porReconectar.length}</div></div>
            <div className="card stat"><div className="k">Interacciones del mes</div><div className="v tnum">{interaccionesMes}</div></div>
            <div className="card stat"><div className="k">Próximo cumpleaños</div><div className="v" style={{ fontSize: 18 }}>{cumples[0] ? `🎂 ${cumples[0].r.name}, en ${cumples[0].dias} día${cumples[0].dias === 1 ? "" : "s"}` : "sin fechas"}</div></div>
          </div>

          <div className="panelgrid" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
            <div style={{ display: "grid", gap: 12, alignSelf: "start" }}>
              {rels.length === 0 && (
                <div className="card pad">
                  <p style={{ color: "var(--muted)", fontSize: 14 }}>
                    Agrega a las personas importantes de tu vida: tu mamá, tu mejor amiga, tu pareja.
                    NucleoOS te ayudará a no dejar que la distancia crezca sin querer.
                  </p>
                </div>
              )}
              {rels.map((r) => (
                <RelCard key={r.id} r={r} logs={logs} onChanged={() => void reload()} />
              ))}
            </div>

            <div className="card panel" style={{ alignSelf: "start" }}>
              <h3>💌 Tips para conectar</h3>
              <div className="tip-destacado">
                <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--accent-ink)", fontWeight: 600, marginBottom: 6 }}>Tip de hoy</div>
                {tipDelDia()}
              </div>
              {(() => {
                const tipos = [...new Set(rels.map((r) => tipoDeVinculo(r.relation)))];
                if (tipos.length === 0) {
                  return TIPS.filter((t) => t !== tipDelDia()).slice(0, 4).map((t, i) => (
                    <p key={i} style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.5, padding: "8px 0", borderBottom: "1px solid var(--line-soft)" }}>{t}</p>
                  ));
                }
                return tipos.map((tipo) => (
                  <p key={tipo} style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.5, padding: "8px 0", borderBottom: "1px solid var(--line-soft)" }}>
                    <b style={{ color: "var(--ink)" }}>Para {TIPO_LABELS[tipo]}:</b> {accionDelDia(tipo)}
                  </p>
                ));
              })()}
              <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 10 }}>
                Abre a una persona y verás ideas hechas a su medida, con el botón 🔀 para pedir otras.
              </p>
            </div>
          </div>
        </>
      )}

      <AvancesArea area="relaciones" />

      {relModal && <RelModal onClose={() => setRelModal(false)} onSaved={() => { setRelModal(false); void reload(); }} />}
    </div>
  );
}

function Head() {
  return (
    <div className="page-head">
      <div className="eyebrow"><Users size={13} /> Mi vida</div>
      <h1>Relaciones</h1>
      <p>Las personas que quieres, con recordatorios amables para no perder el hilo.</p>
    </div>
  );
}

function RelCard({ r, logs, onChanged }: { r: Relationship; logs: RelLog[]; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [nuevo, setNuevo] = useState("");
  const [giro, setGiro] = useState(0);
  const dias = daysSinceContact(r.id, logs);
  const reconectar = needsReconnect(r, logs);
  const cumple = daysToBirthday(r.birthday);
  const misLogs = logs.filter((l) => l.relationship_id === r.id);

  async function registrar(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevo.trim()) return;
    await addRelLog(r.id, hoyLocal(), nuevo.trim());
    setNuevo("");
    onChanged();
  }

  return (
    <div className="card pad">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button className="xdel" aria-label={open ? "Cerrar historial" : "Ver historial"} onClick={() => setOpen(!open)}>
          {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <b style={{ fontSize: 14.5 }}>{r.name}</b>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
            {r.relation ?? "vínculo"}
            {dias !== null ? `, último contacto hace ${dias === 0 ? "hoy mismo" : dias === 1 ? "1 día" : `${dias} días`}` : ", sin contactos registrados"}
          </div>
        </div>
        {cumple !== null && cumple <= 14 && (
          <span className="chip">🎂 {cumple === 0 ? "¡hoy!" : `en ${cumple} día${cumple === 1 ? "" : "s"}`}</span>
        )}
        {reconectar && (
          <span className="chip" style={{ background: "color-mix(in srgb,var(--rel) 20%,var(--paper))", color: "color-mix(in srgb,var(--rel) 75%,var(--ink))" }}>
            💌 tiempo de reconectar
          </span>
        )}
        <button className="xdel" aria-label="Eliminar vínculo" onClick={async () => { if (!window.confirm(`¿Eliminar a ${r.name}? Se borra su historial de interacciones.`)) return; await deleteRelationship(r.id); onChanged(); }}>
          <Trash2 size={14} />
        </button>
      </div>

      {open && (
        <div style={{ marginTop: 12, borderTop: "1px solid var(--line-soft)", paddingTop: 10 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".11em", color: "var(--muted)", fontWeight: 600 }}>
                Ideas para {r.name}
              </span>
              <button className="xdel" aria-label="Otras ideas" title="Otras ideas" style={{ width: 22, height: 22, fontSize: 12 }}
                onClick={() => setGiro(giro + 1)}>🔀</button>
            </div>
            {accionesPara(r, 3, giro).map((idea) => (
              <p key={idea} style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5, padding: "3px 0" }}>💡 {idea}</p>
            ))}
          </div>
          <form onSubmit={registrar} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input className="input-inline" value={nuevo} onChange={(e) => setNuevo(e.target.value)}
              placeholder="¿De qué hablaron? Por ejemplo: la llamé, me contó de su viaje." />
            <button className="btn ghost" type="submit">Registrar</button>
          </form>
          {misLogs.length === 0 && <p style={{ fontSize: 12.5, color: "var(--muted)" }}>Aún no registras interacciones con {r.name}.</p>}
          <div className="tl">
            {misLogs.slice(0, 6).map((l) => (
              <div className="row" key={l.id}>
                <span className="tdot" style={{ background: "var(--rel)" }} />
                <div className="tx" style={{ flex: 1 }}>
                  <b>{l.date}</b>
                  {l.description}
                </div>
                <button className="xdel" aria-label="Eliminar interacción" style={{ width: 24, height: 24 }}
                  onClick={async () => { await deleteRelLog(l.id); onChanged(); }}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RelModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [birthday, setBirthday] = useState("");
  const [cadence, setCadence] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await addRelationship({
      name,
      relation: relation || null,
      birthday: birthday || null,
      contact_every_days: cadence ? Number(cadence) : null,
    });
    onSaved();
  }

  return (
    <div className="tp-overlay" onClick={onClose}>
      <div className="tp" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 430 }}>
        <h3 style={{ marginBottom: 14 }}>Nuevo vínculo</h3>
        <form onSubmit={save}>
          <div className="frow">
            <div className="field" style={{ flex: 1 }}><label>Nombre</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Mamá" autoFocus /></div>
            <div className="field" style={{ flex: 1 }}><label>Relación</label>
              <input value={relation} onChange={(e) => setRelation(e.target.value)} placeholder="mamá, amiga, pareja…" /></div>
          </div>
          <div className="frow">
            <div className="field"><label>Cumpleaños (opcional)</label>
              <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} /></div>
            <div className="field"><label>Contacto ideal (días)</label>
              <input type="number" min="1" value={cadence} onChange={(e) => setCadence(e.target.value)} placeholder="7" /></div>
          </div>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
            Si defines cada cuántos días te gustaría tener contacto, te avisaremos con cariño cuando pase el tiempo.
          </p>
          <button className="btn primary" disabled={busy} style={{ width: "100%" }}>{busy ? "Guardando…" : "Guardar"}</button>
        </form>
      </div>
    </div>
  );
}
