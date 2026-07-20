import { useCallback, useEffect, useState } from "react";
import { useIdioma } from "../idioma/IdiomaProvider";
import { CampoFecha } from "../components/CampoFecha";
import { Mail, Trash2 } from "lucide-react";
import { hoyLocal } from "../lib/fechas";
import { TablesMissingError } from "../finanzas/data";
import { getHealthProfile } from "./data";
import {
  CONFIG_DEFECTO,
  addCycle,
  deleteCycle,
  diaDelCiclo,
  faseDe,
  getCicloConfig,
  largoPromedio,
  listCycles,
  mensajePareja,
  proximaRegla,
  saveCicloConfig,
  type CicloConfig,
  type Cycle,
} from "./ciclo";

// Ciclo menstrual: fase hormonal, qué necesitas en cada una, predicción
// de la próxima regla y el aviso para tu pareja.

export function CicloTab() {
  const { t: tr } = useIdioma();
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [cfg, setCfg] = useState<CicloConfig>(CONFIG_DEFECTO);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [otraFecha, setOtraFecha] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(hoyLocal());
  const [pareja, setPareja] = useState("");
  const [civil, setCivil] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cs, c] = await Promise.all([listCycles(), getCicloConfig()]);
      setCycles(cs);
      setCfg(c);
      setPareja(c.partner_email ?? "");
      setNeedsMigration(false);
      try {
        setCivil((await getHealthProfile())?.civil_status ?? null);
      } catch { /* sin ficha, se asume sin definir */ }
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

  async function registrar(fecha: string) {
    try {
      await addCycle(fecha);
      setOtraFecha(false);
      setFechaInicio(hoyLocal());
      await reload();
    } catch (e) {
      if (e instanceof TablesMissingError) setNeedsMigration(true);
      else setError(e instanceof Error ? e.message : String(e));
    }
  }

  if (needsMigration) {
    return (
      <div className="card pad" style={{ maxWidth: 640 }}>
        <h3 style={{ marginBottom: 10 }}>Un paso pendiente en Supabase</h3>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 12 }}>
          Para el calendario del ciclo falta correr <code>supabase/migrations/0036_ciclo.sql</code> en el SQL Editor.
        </p>
        <button className="btn primary" onClick={() => void reload()}>Ya lo hice, reintentar</button>
      </div>
    );
  }

  if (loading) return <p style={{ color: "var(--muted)" }}>Cargando…</p>;

  const ultimo = cycles[0] ?? null;
  const largo = largoPromedio(cycles, cfg.cycle_length);
  const dia = ultimo ? diaDelCiclo(ultimo.start_date) : null;
  const fase = dia !== null ? faseDe(((dia - 1) % largo) + 1, { ...cfg, cycle_length: largo }) : null;
  const proxima = ultimo ? proximaRegla(ultimo.start_date, largo) : null;

  const registrarBloque = (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      <button className="btn primary" onClick={() => void registrar(hoyLocal())}>{tr("🩸 Empezó mi período hoy")}</button>
      <button className="btn ghost" onClick={() => setOtraFecha(!otraFecha)}>{tr("Fue otro día")}</button>
      {otraFecha && (
        <>
          <div style={{ width: 180, flex: "none" }}>
            <CampoFecha compacto value={fechaInicio} onChange={setFechaInicio} ariaLabel="Fecha de inicio del período" max={hoyLocal()} conBorrar={false} />
          </div>
          <button className="btn ghost" onClick={() => void registrar(fechaInicio)}>{tr("com.guardar")}</button>
        </>
      )}
    </div>
  );

  return (
    <>
      {error && <div className="card pad" style={{ borderLeft: "3px solid var(--err)", marginBottom: 14 }}>{error}</div>}

      {!ultimo ? (
        <div className="card panel" style={{ maxWidth: 640 }}>
          <h3>{tr("🌙 Tu ciclo")}</h3>
          <p style={{ fontSize: 13.5, color: "var(--ink-soft)", marginBottom: 12 }}>
            {tr("Registra cuándo empezó tu última regla y NucleoOS te dirá en qué fase hormonal vas, qué necesitas en cada una y cuándo se estima la próxima. Tu energía no es pareja todo el mes, y eso no es un defecto: es un ciclo.")}
          </p>
          {registrarBloque}
        </div>
      ) : (
        <div className="panelgrid" style={{ alignItems: "start" }}>
          <div style={{ display: "grid", gap: 14 }}>
            {/* Fase actual */}
            {fase && dia !== null && (
              <div className="card panel">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 26 }}>{fase.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0 }}>{tr("Día")} {dia}, {tr("fase")} {tr(fase.nombre).toLowerCase()}</h3>
                    <p style={{ fontSize: 12, color: "var(--muted)" }}>{tr("ciclo de")} ≈{largo} {tr("días")}{cycles.length >= 2 ? `, ${tr("calculado con tu historial")}` : ""}</p>
                  </div>
                </div>

                {/* La línea del ciclo con sus fases */}
                <div style={{ display: "flex", height: 9, borderRadius: 999, overflow: "hidden", margin: "6px 0 4px" }}>
                  <div style={{ width: `${(cfg.period_length / largo) * 100}%`, background: "var(--rel)" }} title="Menstrual" />
                  <div style={{ flex: 1, background: "var(--sec)" }} title="Folicular" />
                  <div style={{ width: `${(3 / largo) * 100}%`, background: "var(--sal)" }} title="Ovulatoria" />
                  <div style={{ width: `${(Math.max(0, largo - Math.max(cfg.period_length + 2, largo - 14) - 1) / largo) * 100}%`, background: "var(--tra)" }} title="Lútea" />
                </div>
                <div style={{ position: "relative", height: 14 }}>
                  <span style={{ position: "absolute", left: `${Math.min(99, (((dia - 1) % largo) / largo) * 100)}%`, transform: "translateX(-50%)", fontSize: 11 }}>▲</span>
                </div>

                <p style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.6, marginBottom: 8 }}>{tr(fase.descripcion)}</p>
                <p style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.6 }}>
                  <b>{tr("Qué te hace bien ahora:")}</b> {tr(fase.paraTi)}
                </p>
                {proxima && (
                  <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 10 }}>
                    {tr("Tu próxima regla se estima alrededor del")} <b>{proxima}</b>. {tr("Es una estimación, tu cuerpo manda.")}
                  </p>
                )}
              </div>
            )}

            {/* Registrar */}
            <div className="card panel">
              <h3>🩸 {tr("Registrar")}</h3>
              {registrarBloque}
              {cycles.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <p style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".11em", color: "var(--muted)", fontWeight: 600, marginBottom: 4 }}>{tr("Historial")}</p>
                  {cycles.slice(0, 6).map((c, i) => {
                    const sig = cycles[i - 1];
                    const dur = sig ? Math.round((new Date(`${sig.start_date}T00:00:00`).getTime() - new Date(`${c.start_date}T00:00:00`).getTime()) / 86400000) : null;
                    return (
                      <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid var(--line-soft)", fontSize: 13 }}>
                        <span style={{ flex: 1 }}>{c.start_date}</span>
                        {dur !== null && <span className="tnum" style={{ color: "var(--muted)", fontSize: 12 }}>{dur} {tr("días")}</span>}
                        <button className="xdel" aria-label="Eliminar registro" style={{ width: 24, height: 24 }}
                          onClick={async () => { await deleteCycle(c.id); void reload(); }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gap: 14, alignContent: "start" }}>
            {/* Pareja: solo si en tu ficha dice que la hay. Soltera, esta sección no existe. */}
            {civil === null || civil === "" ? (
              <div className="card panel">
                <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                  💌 {tr("¿Tienes pareja? Márcalo en tu ficha (Salud clínica → Estado civil) y aquí podrás mandarle avisos de tu fase para que te acompañe mejor. Si estás soltera, márcalo también y esta sección desaparece.")}
                </p>
              </div>
            ) : civil === "en_pareja" && (
            <div className="card panel">
              <h3>{tr("💌 Tu pareja, tu equipo")}</h3>
              <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 10 }}>
                {tr("Guarda su correo y mándale un aviso con tu fase actual y cómo apoyarte. Cuando la app esté en internet, estos avisos le llegarán solos.")}
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input className="input-inline" type="email" style={{ flex: "1 1 170px" }}
                  value={pareja} onChange={(e) => setPareja(e.target.value)}
                  placeholder={tr("el correo de tu pareja")} />
                <button className="btn ghost" onClick={() => void saveCicloConfig({ ...cfg, partner_email: pareja.trim() || null }).then(reload)}>
                  {tr("com.guardar")}
                </button>
              </div>
              {fase && dia !== null && proxima && (
                <a
                  className="btn primary"
                  style={{ display: "inline-block", marginTop: 10, textDecoration: "none" }}
                  href={(() => {
                    const m = mensajePareja(fase, dia, proxima);
                    return `mailto:${encodeURIComponent(pareja.trim())}?subject=${encodeURIComponent(m.asunto)}&body=${encodeURIComponent(m.cuerpo)}`;
                  })()}
                  onClick={(e) => { if (!pareja.trim()) { e.preventDefault(); setError(tr("Primero escribe el correo de tu pareja.")); } }}
                >
                  <Mail size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />
                  {tr("Avísale cómo acompañarte")}
                </a>
              )}
            </div>
            )}

            {/* Ajustes del ciclo */}
            <div className="card panel">
              <h3>{tr("⚙️ Tu ciclo, tus números")}</h3>
              <div className="frow">
                <div className="field"><label>{tr("Largo del ciclo (días)")}</label>
                  <input type="number" min={18} max={45} value={cfg.cycle_length}
                    onChange={(e) => setCfg({ ...cfg, cycle_length: Number(e.target.value) || 28 })} /></div>
                <div className="field"><label>{tr("Días de regla")}</label>
                  <input type="number" min={2} max={10} value={cfg.period_length}
                    onChange={(e) => setCfg({ ...cfg, period_length: Number(e.target.value) || 5 })} /></div>
              </div>
              <button className="btn ghost" style={{ width: "100%" }}
                onClick={() => void saveCicloConfig({ ...cfg, partner_email: pareja.trim() || null }).then(reload)}>
                {tr("com.guardar")}
              </button>
              <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 8 }}>
                {tr("Con dos o más reglas registradas, el largo se calcula solo con tu historial y estos números pasan a ser el respaldo.")}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
