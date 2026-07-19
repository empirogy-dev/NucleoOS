import { useCallback, useEffect, useState } from "react";
import { useIdioma } from "../idioma/IdiomaProvider";
import { celebrar } from "../lib/celebrar";
import { CampoFecha } from "../components/CampoFecha";
import { Link } from "react-router-dom";
import { Flag, Pause, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { IconField } from "../components/IconField";
import { Selector } from "../components/Selector";
import { TablesMissingError } from "../finanzas/data";
import { hoyLocal } from "../lib/fechas";
import { listObjectives, updateObjective, type Objective } from "../objetivos/data";
import {
  DIAS_SEMANA,
  diasPorSemana,
  LUNES_A_VIERNES,
  RETOS_SUGERIDOS,
  TODOS_LOS_DIAS,
  addReto,
  deleteReto,
  esProgramado,
  etiquetaFrecuencia,
  listRetoLogs,
  listRetos,
  rachaReto,
  toggleRetoDay,
  updateReto,
  ventanaReto,
  type Reto,
  type RetoLog,
  type RetoSugerido,
} from "./retos";

// Retos: compromisos vivos. Eliges uno sugerido o creas el tuyo,
// lo personalizas, lo marcas día a día, y lo puedes pausar o cerrar.

export function RetosTab() {
  const { t: tr } = useIdioma();
  const [retos, setRetos] = useState<Reto[]>([]);
  const [logs, setLogs] = useState<RetoLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ reto?: Reto; base?: RetoSugerido } | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [r, l] = await Promise.all([listRetos(), listRetoLogs()]);
      setRetos(r);
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

  if (needsMigration) {
    return (
      <div className="card pad" style={{ maxWidth: 640 }}>
        <h3 style={{ marginBottom: 10 }}>Un paso pendiente en Supabase</h3>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 12 }}>
          Para tus retos, corre <code>supabase/migrations/0022_retos.sql</code> en el SQL Editor de Supabase.
        </p>
        <button className="btn primary" onClick={() => void reload()}>Ya lo hice, reintentar</button>
      </div>
    );
  }

  const enCurso = retos.filter((r) => r.status !== "terminado");
  const terminados = retos.filter((r) => r.status === "terminado");
  const nombres = new Set(enCurso.map((r) => r.title.toLowerCase()));
  const sugeridos = RETOS_SUGERIDOS.filter((s) => !nombres.has(s.title.toLowerCase()));

  return (
    <>
      <div className="ftabs">
        <span style={{ flex: 1 }} />
        <button className="btn primary" onClick={() => setModal({})}>
          <Plus size={15} style={{ verticalAlign: "-2px", marginRight: 5 }} /> {tr("Crear mi reto")}
        </button>
      </div>

      {error && <div className="card pad" style={{ borderLeft: "3px solid var(--err)", marginBottom: 14 }}>{error}</div>}
      {loading ? (
        <p style={{ color: "var(--muted)" }}>Cargando…</p>
      ) : (
        <div style={{ display: "grid", gap: 14, maxWidth: 780 }}>
          {enCurso.length === 0 && (
            <div className="card pad">
              <p style={{ color: "var(--muted)", fontSize: 14 }}>
                {tr("Un reto es un compromiso contigo por un tiempo definido: se elige, se personaliza y se trabaja día a día.")}
                Parte con uno sugerido de abajo, o crea el tuyo.
              </p>
            </div>
          )}

          {enCurso.map((r) => (
            <RetoCard key={r.id} reto={r} logs={logs} onChanged={() => void reload()} onEditar={() => setModal({ reto: r })} />
          ))}

          {sugeridos.length > 0 && (
            <div className="card panel">
              <h3>{tr("✨ Retos sugeridos")}</h3>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 10 }}>
                {tr("Toca uno y personalízalo antes de empezar: duración, días y tu porqué.")}
              </p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {sugeridos.map((s) => (
                  <button key={s.title} className="chip" style={{ border: "none", cursor: "pointer" }}
                    onClick={() => setModal({ base: s })}>
                    {s.icon} {tr(s.title)}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 12 }}>
                {tr("Tip: las sesiones de")} <Link to="/mente" style={{ color: "var(--accent-ink)", fontWeight: 600 }}>{tr("nav.mente")}</Link> {tr("y")}{" "}
                {tr("las rutinas de")} <Link to="/movimiento" style={{ color: "var(--accent-ink)", fontWeight: 600 }}>{tr("nav.movimiento")}</Link>{" "}
                {tr("son perfectas para cumplir el reto del día.")}
              </p>
            </div>
          )}

          {terminados.length > 0 && (
            <div className="card panel">
              <h3>{tr("🏆 Retos terminados")}</h3>
              {terminados.map((r) => {
                const marcados = new Set(logs.filter((l) => l.challenge_id === r.id).map((l) => l.date));
                const ventana = ventanaReto(r);
                const hechos = ventana.filter((f) => marcados.has(f)).length;
                return (
                  <div className="txrow" key={r.id}>
                    <span className="txicon">{r.icon ?? "🏆"}</span>
                    <div className="txmeta">
                      <b>{r.title}</b>
                      <small>{hechos} {tr("de")} {ventana.length} {tr("días cumplidos")}</small>
                    </div>
                    <button className="xdel" title="Retomar este reto" aria-label="Retomar reto"
                      onClick={async () => { await updateReto(r.id, { status: "activo" }); void reload(); }}>
                      <Play size={13} />
                    </button>
                    <button className="xdel" aria-label="Eliminar reto"
                      onClick={async () => { if (!window.confirm(`${tr("¿Eliminar el reto")} ${r.title}? ${tr("Se pierde su historial.")}`)) return; await deleteReto(r.id); void reload(); }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {modal && (
        <RetoModal
          reto={modal.reto ?? null}
          base={modal.base ?? null}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); void reload(); }}
        />
      )}
    </>
  );
}

function RetoCard({ reto, logs, onChanged, onEditar }: {
  reto: Reto;
  logs: RetoLog[];
  onChanged: () => void;
  onEditar: () => void;
}) {
  const { t: tr } = useIdioma();
  const hoy = hoyLocal();
  const marcados = new Set(logs.filter((l) => l.challenge_id === reto.id).map((l) => l.date));
  const ventana = ventanaReto(reto);
  const hechos = ventana.filter((f) => marcados.has(f)).length;
  const pct = ventana.length ? Math.round((hechos / ventana.length) * 100) : 0;
  const racha = rachaReto(reto, marcados);
  const pausado = reto.status === "pausado";
  const hoyProgramado = esProgramado(hoy, reto.days_mask) && ventana.includes(hoy);
  const hoyHecho = marcados.has(hoy);
  const plazoTermino = ventana.length > 0 && ventana[ventana.length - 1] < hoy;

  return (
    <div className="card panel" style={pausado ? { opacity: 0.75 } : undefined}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 24 }}>{reto.icon ?? "🎯"}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <b style={{ fontSize: 15 }}>{reto.title}</b>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            {reto.duration_days} {tr("días")}, {tr(etiquetaFrecuencia(reto.days_mask))}
            {racha > 0 ? `, ${tr("racha de")} ${racha} 🔥` : ""}
          </div>
        </div>
        {pausado && <span className="chip" style={{ background: "color-mix(in srgb,var(--muted) 16%,var(--paper))", color: "var(--muted)" }}>{tr("En pausa")}</span>}
        <button className="xdel" title="Editar reto" aria-label="Editar reto" onClick={onEditar}><Pencil size={13} /></button>
        <button className="xdel" title={pausado ? "Retomar" : "Pausar"} aria-label={pausado ? "Retomar reto" : "Pausar reto"}
          onClick={async () => { await updateReto(reto.id, { status: pausado ? "activo" : "pausado" }); onChanged(); }}>
          {pausado ? <Play size={13} /> : <Pause size={13} />}
        </button>
        <button className="xdel" title="Terminar reto" aria-label="Terminar reto"
          onClick={async () => { if (!window.confirm(`${tr("¿Cerrar el reto")} ${reto.title}? ${tr("Quedará en tus terminados.")}`)) return; await updateReto(reto.id, { status: "terminado" }); celebrar("grande"); onChanged(); }}>
          <Flag size={13} />
        </button>
        <button className="xdel" aria-label="Eliminar reto"
          onClick={async () => { if (!window.confirm(`${tr("¿Eliminar el reto")} ${reto.title}? ${tr("Se pierde su historial.")}`)) return; await deleteReto(reto.id); onChanged(); }}>
          <Trash2 size={13} />
        </button>
      </div>

      {reto.why && <p style={{ fontSize: 12.5, color: "var(--ink-soft)", fontStyle: "italic", margin: "8px 0 0" }}>“{reto.why}”</p>}

      <div className="bar" style={{ margin: "10px 0 0" }}>
        <div className="top">
          <span>{hechos} {tr("de")} {ventana.length} {tr("días")}</span>
          <b className="tnum">{pct}%</b>
        </div>
        <div className="track">
          <div className="fill" style={{ width: `${pct}%`, background: pct >= 100 ? "var(--ok)" : "var(--hab)" }} />
        </div>
      </div>

      <div className="habit-grid" style={{ paddingLeft: 0 }} title={pausado ? "Reto en pausa" : "Toca un día para marcarlo o desmarcarlo"}>
        {ventana.map((f) => (
          <button key={f} type="button"
            className={"hg-cell" + (marcados.has(f) ? " on" : "") + (f === hoy ? " today" : "")}
            aria-label={`${f}${marcados.has(f) ? ", hecho" : ""}`}
            title={f}
            disabled={pausado}
            onClick={async () => { await toggleRetoDay(reto.id, f, !marcados.has(f)); onChanged(); }} />
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
        {!pausado && hoyProgramado && !hoyHecho && (
          <button className="btn primary" onClick={async () => { await toggleRetoDay(reto.id, hoy, true); celebrar("chica"); onChanged(); }}>
            ✓ {tr("Marcar hoy")}
          </button>
        )}
        {!pausado && hoyHecho && <span className="chip" style={{ background: "color-mix(in srgb,var(--ok) 18%,var(--paper))", color: "var(--ok)" }}>✓ Hoy cumplido</span>}
        {!pausado && !hoyProgramado && !plazoTermino && <span style={{ fontSize: 12.5, color: "var(--muted)" }}>{tr("Hoy es día libre de este reto. 🌿")}</span>}
        {plazoTermino && (
          <span style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
            {tr("El plazo terminó con")} {hechos} {tr("de")} {ventana.length} {tr("días")}. {tr("Ciérralo con la banderita, o edítalo para extenderlo.")}
          </span>
        )}
      </div>
    </div>
  );
}

function RetoModal({ reto, base, onClose, onSaved }: {
  reto: Reto | null;
  base: RetoSugerido | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t: tr } = useIdioma();
  const [title, setTitle] = useState(reto?.title ?? (base?.title ? tr(base.title) : ""));
  const [icon, setIcon] = useState(reto?.icon ?? base?.icon ?? "🎯");
  const [why, setWhy] = useState(reto?.why ?? (base?.why ? tr(base.why) : ""));
  const [duracion, setDuracion] = useState(String(reto?.duration_days ?? base?.duration_days ?? 21));
  const [mask, setMask] = useState(reto?.days_mask ?? base?.days_mask ?? TODOS_LOS_DIAS);
  const [inicio, setInicio] = useState(reto?.start_date ?? hoyLocal());
  const [metas, setMetas] = useState<Objective[]>([]);
  const [metaId, setMetaId] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (reto) return; // la conexión a meta se ofrece al crear
    void (async () => {
      try {
        setMetas((await listObjectives()).filter((o) => o.status !== "lograda"));
      } catch {
        /* sin metas disponibles */
      }
    })();
  }, [reto]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (mask === 0) {
      setErr(tr("Elige al menos un día de la semana."));
      return;
    }
    setBusy(true);
    setErr(null);
    const datos = {
      title,
      icon,
      why: why || null,
      duration_days: Math.min(365, Math.max(3, Number(duracion) || 21)),
      days_mask: mask,
      start_date: inicio,
    };
    try {
      if (reto) {
        await updateReto(reto.id, datos);
      } else {
        const retoId = await addReto(datos);
        if (metaId) {
          try {
            await updateObjective(metaId, { auto_metric: "reto_dias", auto_ref: retoId, auto_target: diasPorSemana(mask) });
          } catch (ex) {
            setErr(`El reto quedó creado, pero no pude conectarlo a la meta: ${ex instanceof Error ? ex.message : String(ex)}`);
            setBusy(false);
            return;
          }
        }
      }
      onSaved();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
      setBusy(false);
    }
  }

  return (
    <div className="tp-overlay" onClick={onClose}>
      <div className="tp" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <h3 style={{ marginBottom: 4 }}>{reto ? tr("Editar reto") : tr("Nuevo reto")}</h3>
        <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 14 }}>
          {tr("Hazlo tuyo: ajusta la duración, los días y sobre todo el porqué.")}
        </p>
        {err && <p style={{ fontSize: 12.5, color: "var(--err)", marginBottom: 10 }}>{err}</p>}
        <form onSubmit={save}>
          <div className="frow">
            <div className="field" style={{ flex: 1 }}><label>El reto</label>
              <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder={tr("Caminar 20 minutos")} autoFocus /></div>
            <IconField value={icon} onChange={setIcon} />
          </div>
          <div className="field"><label>{tr("¿Por qué lo tomas?")}</label>
            <input value={why} onChange={(e) => setWhy(e.target.value)} placeholder={tr("Lo que este reto te va a regalar")} /></div>
          <div className="frow">
            <div className="field"><label>{tr("Duración (días)")}</label>
              <input type="number" min={3} max={365} value={duracion} onChange={(e) => setDuracion(e.target.value)} /></div>
            <div className="field"><label>Empieza el</label>
              <CampoFecha value={inicio} onChange={setInicio} ariaLabel="Empieza el" conBorrar={false} /></div>
          </div>
          <div className="field"><label>Frecuencia</label>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
              {DIAS_SEMANA.map((d) => (
                <button key={d.label} type="button"
                  className={"hcheck" + ((mask & d.bit) !== 0 ? " done" : "")}
                  style={{ width: 34, height: 34, fontSize: 12.5 }}
                  aria-pressed={(mask & d.bit) !== 0}
                  onClick={() => setMask((m) => m ^ d.bit)}>
                  {d.label}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <button type="button" className="chip" style={{ border: "none", cursor: "pointer" }} onClick={() => setMask(TODOS_LOS_DIAS)}>{tr("Todos los días")}</button>
              <button type="button" className="chip" style={{ border: "none", cursor: "pointer" }} onClick={() => setMask(LUNES_A_VIERNES)}>Lunes a viernes</button>
            </div>
          </div>
          {!reto && metas.length > 0 && (
            <div className="field"><label>{tr("¿A qué dirección de tu vida apunta? (opcional)")}</label>
              <Selector value={metaId} ariaLabel="Meta que alimenta este reto" placeholder={tr("Ninguna meta por ahora")} onChange={setMetaId}
                opciones={[{ value: "", label: tr("Ninguna meta por ahora") }, ...metas.map((m) => ({ value: m.id, label: m.title }))]} />
              {metaId && (
                <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 5 }}>
                  {tr("Cada día cumplido del reto hará avanzar esa meta, a tu ritmo de")} {diasPorSemana(mask)} {tr("por semana")}.
                </p>
              )}
            </div>
          )}
          <button className="btn primary" disabled={busy} style={{ width: "100%", marginTop: 6 }}>
            {busy ? tr("com.guardando") : reto ? tr("m.meta.cambios") : tr("Empezar el reto")}
          </button>
        </form>
      </div>
    </div>
  );
}
