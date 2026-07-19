import { OrdenGrid } from "../components/OrdenGrid";
import { useIdioma } from "../idioma/IdiomaProvider";
import { CampoFecha } from "../components/CampoFecha";
import { Link } from "react-router-dom";
import { librosDe } from "../aprendizaje/biblioteca";
import { MetasDeArea } from "../components/MetasDeArea";
import { fechaRegistro, mesActualLocal } from "../lib/fechas";
import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Mail, Plus, Trash2, Users } from "lucide-react";
import { TablesMissingError } from "../finanzas/data";
import {
  ACCIONES,
  addRelLog,
  addRelationship,
  daysSinceContact,
  daysToBirthday,
  deleteRelLog,
  deleteRelationship,
  listRelLogs,
  listRelationships,
  needsReconnect,
  updateRelationship,
  accionesPara,
  cienciaDelDia,
  tipDelDia,
  type RelLog,
  type Relationship,
  type TipoVinculo,
} from "./data";

/** Guía visible por tipo de vínculo: eliges pareja, hijos, familia... y aparecen todos los consejos. */
const GUIA_TIPOS: Array<{ key: TipoVinculo; label: string }> = [
  { key: "pareja", label: "Pareja" },
  { key: "hijos", label: "Hijos" },
  { key: "familia", label: "Familia" },
  { key: "amistad", label: "Amistades" },
  { key: "colega", label: "Colegas" },
];

export function RelacionesPage() {
  const { t: tr } = useIdioma();

  const [rels, setRels] = useState<Relationship[]>([]);
  const [logs, setLogs] = useState<RelLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [relModal, setRelModal] = useState(false);
  const [guiaTipo, setGuiaTipo] = useState<TipoVinculo>("pareja");
  const [guiaAbierta, setGuiaAbierta] = useState(false);

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
          {tr("Nuevo vínculo")}
        </button>
      </div>

      {error && <div className="card pad" style={{ borderLeft: "3px solid var(--err)", marginBottom: 14 }}>{error}</div>}
      {loading ? (
        <p style={{ color: "var(--muted)" }}>{tr("cargando")}</p>
      ) : (
        <>
          <div className="statrow" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
            <div className="card stat"><div className="k">{tr("Vínculos")}</div><div className="v tnum">{rels.length}</div></div>
            <div className="card stat"><div className="k">{tr("Por reconectar")}</div><div className="v tnum" style={porReconectar.length > 0 ? { color: "var(--warn)" } : undefined}>{porReconectar.length}</div></div>
            <div className="card stat"><div className="k">{tr("Interacciones del mes")}</div><div className="v tnum">{interaccionesMes}</div></div>
            <div className="card stat"><div className="k">{tr("Próximo cumpleaños")}</div><div className="v" style={{ fontSize: 18 }}>{cumples[0] ? `🎂 ${cumples[0].r.name}, ${tr("en")} ${cumples[0].dias} ${cumples[0].dias === 1 ? tr("día") : tr("días")}` : tr("sin fechas")}</div></div>
          </div>

          <MetasDeArea area="relaciones" />

          {/* Franja del tip, a lo ancho */}
          <div className="tip-destacado" style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--accent-ink)", fontWeight: 600, marginBottom: 6 }}>{tr("Tip de hoy")}</div>
            {tr(tipDelDia())}
          </div>

          <div className="panelgrid" style={{ alignItems: "start" }}>
            {/* Personas como lista ancha, arrastrables por prioridad */}
            <div>
              {rels.length === 0 ? (
                <div className="card pad">
                  <p style={{ color: "var(--muted)", fontSize: 14 }}>
                    {tr("Agrega a las personas importantes de tu vida: tu mamá, tu mejor amiga, tu pareja. NucleoOS te ayudará a no dejar que la distancia crezca sin querer.")}
                  </p>
                </div>
              ) : (
                <>
                  {rels.length > 1 && (
                    <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
                      {tr("Arrastra desde el agarre ⋮ para ordenar a tus personas por prioridad.")}
                    </p>
                  )}
                  <OrdenGrid clave="relaciones-personas" lista bloques={rels.map((r) => ({
                    id: r.id,
                    el: <RelCard r={r} logs={logs} onChanged={() => void reload()} />,
                  }))} />
                </>
              )}
            </div>

            {/* Guía y ciencia en su columna fija */}
            <div style={{ display: "grid", gap: 14, alignContent: "start" }}>
              <div className="card panel">
                <h3>{tr("💌 Guía para conectar")}</h3>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "4px 0 10px" }}>
                  {GUIA_TIPOS.map((t) => (
                    <button key={t.key} className={"ftab" + (guiaTipo === t.key ? " active" : "")}
                      style={{ padding: "6px 13px", fontSize: 12.5 }}
                      onClick={() => setGuiaTipo(t.key)}>
                      {tr(t.label)}
                    </button>
                  ))}
                </div>
                {(guiaAbierta ? ACCIONES[guiaTipo] : ACCIONES[guiaTipo].slice(0, 5)).map((idea) => (
                  <p key={idea} style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.55, padding: "7px 0", borderBottom: "1px solid var(--line-soft)" }}>
                    {tr(idea)}
                  </p>
                ))}
                {ACCIONES[guiaTipo].length > 5 && (
                  <button className="linklike" style={{ marginTop: 8 }} onClick={() => setGuiaAbierta(!guiaAbierta)}>
                    {guiaAbierta ? tr("Ver menos") : `${tr("Ver las")} ${ACCIONES[guiaTipo].length} ${tr("ideas")}`}
                  </button>
                )}
                <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 10 }}>
                  {tr("Y al abrir a una persona, sus ideas llegan hechas a su medida.")}
                </p>
              </div>
              <div className="card panel">
                <h3>{tr("🔬 Tu red de apoyo, según la ciencia")}</h3>
                <p style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.6 }}>
                  {tr(cienciaDelDia())}
                </p>
                <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 10 }}>
                  {tr("Cada día aparece un hallazgo distinto de la investigación en relaciones: Harvard, Gottman, Hall y más.")}
                </p>
                <div style={{ borderTop: "1px solid var(--line-soft)", marginTop: 10, paddingTop: 10 }}>
                  <p style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".11em", color: "var(--muted)", fontWeight: 600, marginBottom: 5 }}>
                    {tr("PARA PROFUNDIZAR")}
                  </p>
                  {librosDe("relaciones").slice(0, 3).map((l) => (
                    <p key={l.id} style={{ fontSize: 12.5, color: "var(--ink-soft)", padding: "3px 0" }}>
                      {l.emoji} <b>{l.titulo}</b>, {l.autor}
                    </p>
                  ))}
                  <Link to="/aprendizaje" style={{ fontSize: 12, color: "var(--accent-ink)", textDecoration: "underline" }}>
                    {tr("Ver los")} {librosDe("relaciones").length} {tr("libros en la Biblioteca")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}


      {relModal && <RelModal onClose={() => setRelModal(false)} onSaved={() => { setRelModal(false); void reload(); }} />}
    </div>
  );
}

function Head() {
  const { t: tr } = useIdioma();
  return (
    <div className="page-head">
      <div className="eyebrow"><Users size={13} /> {tr("sec.mivida")}</div>
      <h1>{tr("area.relaciones")}</h1>
      <p>{tr("head.sub.relaciones")}</p>
    </div>
  );
}

function RelCard({ r, logs, onChanged }: { r: Relationship; logs: RelLog[]; onChanged: () => void }) {
  const { t: tr } = useIdioma();
  const [open, setOpen] = useState(false);
  const [nuevo, setNuevo] = useState("");
  const [giro, setGiro] = useState(0);
  const [correo, setCorreo] = useState(r.email ?? "");
  const [lazoErr, setLazoErr] = useState<string | null>(null);

  async function cambiarLazo(patch: Partial<Pick<Relationship, "email" | "reminders_status">>) {
    setLazoErr(null);
    try {
      await updateRelationship(r.id, patch);
      onChanged();
    } catch (e) {
      setLazoErr(e instanceof Error ? e.message : String(e));
    }
  }

  const invitacion = (() => {
    const asunto = `¿Te gustaría cuidar nuestro lazo conmigo?`;
    const cuerpo =
      `Hola ${r.name}, uso una app que se llama NucleoOS para cuidar a las personas que quiero, y tú eres una de ellas.\n\n` +
      `La app puede mandarte de vez en cuando recorditos chiquitos para cuidar nuestro lazo (ideas para juntarnos, acordarnos la una de la otra, esas cosas). ` +
      `La gracia es que el lazo es de a dos, así que primero te pregunto: ¿te gustaría recibirlos?\n\n` +
      `Respóndeme con un sí o un no, cualquiera de los dos está perfecto. ❤️`;
    return `mailto:${encodeURIComponent(correo.trim())}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
  })();

  const recordito = (() => {
    const idea = accionesPara(r, 1, giro)[0] ?? "juntarnos pronto";
    const asunto = `Un recordito de nuestro lazo 💌`;
    const cuerpo =
      `Hola ${r.name}, me acordé de ti.\n\n` +
      `Idea de esta semana para nosotras: ${idea}\n\n` +
      `Enviado desde NucleoOS. Tú aceptaste recibir estos recorditos, si ya no los quieres solo dímelo.`;
    return `mailto:${encodeURIComponent(correo.trim())}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
  })();
  const dias = daysSinceContact(r.id, logs);
  const reconectar = needsReconnect(r, logs);
  const cumple = daysToBirthday(r.birthday);
  const misLogs = logs.filter((l) => l.relationship_id === r.id);

  async function registrar(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevo.trim()) return;
    await addRelLog(r.id, fechaRegistro(), nuevo.trim());
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
            {r.relation ?? tr("vínculo")}
            {dias !== null ? `, ${tr("último contacto hace")} ${dias === 0 ? tr("hoy mismo") : dias === 1 ? `1 ${tr("día")}` : `${dias} ${tr("días")}`}` : `, ${tr("sin contactos registrados")}`}
          </div>
        </div>
        {cumple !== null && cumple <= 14 && (
          <span className="chip">🎂 {cumple === 0 ? tr("¡hoy!") : `${tr("en")} ${cumple} ${cumple === 1 ? tr("día") : tr("días")}`}</span>
        )}
        {reconectar && (
          <span className="chip" style={{ background: "color-mix(in srgb,var(--rel) 20%,var(--paper))", color: "color-mix(in srgb,var(--rel) 75%,var(--ink))" }}>
            💌 {tr("tiempo de reconectar")}
          </span>
        )}
        <button className="xdel" aria-label="Eliminar vínculo" onClick={async () => { if (!window.confirm(`${tr("¿Eliminar a")} ${r.name}? ${tr("Se borra su historial de interacciones.")}`)) return; await deleteRelationship(r.id); onChanged(); }}>
          <Trash2 size={14} />
        </button>
      </div>

      {open && (
        <div style={{ marginTop: 12, borderTop: "1px solid var(--line-soft)", paddingTop: 10 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".11em", color: "var(--muted)", fontWeight: 600 }}>
                {tr("Ideas para")} {r.name}
              </span>
              <button className="chip" style={{ border: "none", cursor: "pointer" }}
                aria-label="Pedir otras ideas" onClick={() => setGiro(giro + 1)}>
                🔀 {tr("Otras ideas")}
              </button>
            </div>
            {accionesPara(r, 3, giro).map((idea) => (
              <p key={idea} style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5, padding: "3px 0" }}>💡 {tr(idea)}</p>
            ))}
          </div>
          {/* El lazo es de a dos: correo y consentimiento para los recorditos */}
          <div style={{ background: "var(--surface)", borderRadius: "var(--r-md)", padding: "10px 12px", marginBottom: 12 }}>
            <p style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".11em", color: "var(--muted)", fontWeight: 600, marginBottom: 6 }}>
              {tr("El lazo es de a dos")}
            </p>
            {r.reminders_status === "acepta" ? (
              <>
                <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 8 }}>
                  {r.name} {tr("aceptó recibir recorditos para cuidar el lazo. 💛 Cuando la app esté en internet le llegarán solos; por ahora se los mandas tú con un clic.")}
                </p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <a className="btn primary" style={{ textDecoration: "none" }} href={recordito}>
                    <Mail size={13} style={{ verticalAlign: "-2px", marginRight: 5 }} />
                    {tr("Mándale un recordito")}
                  </a>
                  <button className="chip" style={{ border: "none", cursor: "pointer" }}
                    onClick={() => void cambiarLazo({ reminders_status: "declina" })}>
                    {tr("ya no los quiere")}
                  </button>
                </div>
              </>
            ) : r.reminders_status === "invitada" ? (
              <>
                <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 8 }}>
                  {tr("Le preguntaste a")} {r.name} {tr("si quiere recibir recorditos. ¿Qué te respondió?")}
                </p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button className="btn ghost" onClick={() => void cambiarLazo({ reminders_status: "acepta" })}>{tr("Dijo que sí 💛")}</button>
                  <button className="btn ghost" onClick={() => void cambiarLazo({ reminders_status: "declina" })}>{tr("Prefirió que no")}</button>
                  <a className="chip" style={{ textDecoration: "none" }} href={invitacion}>{tr("reenviar invitación")}</a>
                </div>
              </>
            ) : r.reminders_status === "declina" ? (
              <p style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
                {r.name} {tr("prefirió no recibir recorditos, y está perfecto: el cariño no se obliga.")}{" "}
                <button className="linklike" style={{ display: "inline" }} onClick={() => void cambiarLazo({ reminders_status: "sin_invitar" })}>
                  {tr("¿Cambió de opinión?")}
                </button>
              </p>
            ) : (
              <>
                <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 8 }}>
                  {tr("Cuidar el lazo no es carga de una sola persona. Guarda su correo e invítala: ella decide si quiere recibir recorditos.")}
                </p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <input className="input-inline" type="email" style={{ flex: "1 1 160px" }}
                    value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder={tr("su correo")} />
                  <button className="btn ghost" disabled={!correo.trim()}
                    onClick={() => void cambiarLazo({ email: correo.trim() })}>
                    {tr("com.guardar")}
                  </button>
                  {r.email && (
                    <a className="btn primary" style={{ textDecoration: "none" }} href={invitacion}
                      onClick={() => void cambiarLazo({ reminders_status: "invitada" })}>
                      <Mail size={13} style={{ verticalAlign: "-2px", marginRight: 5 }} />
                      {tr("Invitarla")}
                    </a>
                  )}
                </div>
              </>
            )}
            {lazoErr && <p style={{ fontSize: 12, color: "var(--err)", marginTop: 6 }}>{lazoErr}</p>}
          </div>

          <form onSubmit={registrar} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input className="input-inline" value={nuevo} onChange={(e) => setNuevo(e.target.value)}
              placeholder={tr("¿De qué hablaron? Por ejemplo: la llamé, me contó de su viaje.")} />
            <button className="btn ghost" type="submit">{tr("btn.registrar")}</button>
          </form>
          {misLogs.length === 0 && <p style={{ fontSize: 12.5, color: "var(--muted)" }}>{tr("Aún no registras interacciones con")} {r.name}.</p>}
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
  const { t: tr } = useIdioma();
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
        <h3 style={{ marginBottom: 14 }}>{tr("Nuevo vínculo")}</h3>
        <form onSubmit={save}>
          <div className="frow">
            <div className="field" style={{ flex: 1 }}><label>{tr("com.nombre")}</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder={tr("Mamá")} autoFocus /></div>
            <div className="field" style={{ flex: 1 }}><label>{tr("Relación")}</label>
              <input value={relation} onChange={(e) => setRelation(e.target.value)} placeholder={tr("mamá, amiga, pareja…")} /></div>
          </div>
          <div className="frow">
            <div className="field"><label>{tr("Cumpleaños (opcional)")}</label>
              <CampoFecha value={birthday} onChange={setBirthday} ariaLabel="Cumpleaños" /></div>
            <div className="field"><label>{tr("Contacto ideal (días)")}</label>
              <input type="number" min="1" value={cadence} onChange={(e) => setCadence(e.target.value)} placeholder="7" /></div>
          </div>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
            {tr("Si defines cada cuántos días te gustaría tener contacto, te avisaremos con cariño cuando pase el tiempo.")}
          </p>
          <button className="btn primary" disabled={busy} style={{ width: "100%" }}>{busy ? tr("com.guardando") : tr("com.guardar")}</button>
        </form>
      </div>
    </div>
  );
}
