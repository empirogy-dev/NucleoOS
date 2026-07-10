import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { hoyLocal, mesActualLocal } from "../lib/fechas";
import { AREAS } from "../areas";
import { cargarFuentes, eventosDelMes, type EventoCal, type FuentesCal } from "./data";

const DOW = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];

function colorArea(key: string): string {
  return AREAS.find((a) => a.key === key)?.color ?? "var(--accent)";
}

function nombreArea(key: string): string {
  return AREAS.find((a) => a.key === key)?.name ?? "General";
}

function nombreMes(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const nombre = new Date(y, m - 1, 1).toLocaleDateString("es-CL", { month: "long", year: "numeric" });
  return nombre.charAt(0).toUpperCase() + nombre.slice(1);
}

function sumarMes(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Celdas del mes: semanas completas de lunes a domingo. */
function celdasDelMes(ym: string): Array<{ fecha: string; delMes: boolean }> {
  const [y, m] = ym.split("-").map(Number);
  const primero = new Date(y, m - 1, 1);
  const inicio = new Date(primero);
  const dow = (primero.getDay() + 6) % 7; // lunes = 0
  inicio.setDate(inicio.getDate() - dow);
  const celdas: Array<{ fecha: string; delMes: boolean }> = [];
  const d = new Date(inicio);
  for (let i = 0; i < 42; i += 1) {
    const fecha = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    celdas.push({ fecha, delMes: d.getMonth() === m - 1 });
    d.setDate(d.getDate() + 1);
  }
  // recorta la última semana si es toda de otro mes
  return celdas.slice(35).every((c) => !c.delMes) ? celdas.slice(0, 35) : celdas;
}

export function CalendarioPage() {
  const [ym, setYm] = useState(mesActualLocal());
  const [fuentes, setFuentes] = useState<FuentesCal | null>(null);
  const [diaAbierto, setDiaAbierto] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setFuentes(await cargarFuentes());
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const eventos = useMemo(() => (fuentes ? eventosDelMes(fuentes, ym) : []), [fuentes, ym]);
  const porDia = useMemo(() => {
    const m = new Map<string, EventoCal[]>();
    for (const e of eventos) {
      const lista = m.get(e.date) ?? [];
      lista.push(e);
      m.set(e.date, lista);
    }
    return m;
  }, [eventos]);

  const hoy = hoyLocal();
  const celdas = useMemo(() => celdasDelMes(ym), [ym]);
  const areasConEventos = useMemo(
    () => AREAS.filter((a) => eventos.some((e) => e.area === a.key)),
    [eventos],
  );

  return (
    <div className="page">
      <div className="page-head">
        <div className="eyebrow"><CalendarDays size={13} /> Transversal</div>
        <h1>Calendario</h1>
        <p>Todo lo que está pasando en tu vida, en un solo lugar: pagos, citas, cumpleaños, jornadas y avances.</p>
      </div>

      <div className="cal-head">
        <button className="iconbtn" aria-label="Mes anterior" onClick={() => setYm(sumarMes(ym, -1))}><ChevronLeft size={16} /></button>
        <h2 style={{ fontSize: 19 }}>{nombreMes(ym)}</h2>
        <button className="iconbtn" aria-label="Mes siguiente" onClick={() => setYm(sumarMes(ym, 1))}><ChevronRight size={16} /></button>
        {ym !== mesActualLocal() && (
          <button className="btn ghost" onClick={() => setYm(mesActualLocal())}>Hoy</button>
        )}
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 12.5, color: "var(--muted)" }}>
          {eventos.length === 0 ? "sin eventos este mes" : eventos.length === 1 ? "1 evento" : `${eventos.length} eventos`}
        </span>
      </div>

      {!fuentes ? (
        <p style={{ color: "var(--muted)" }}>Cargando…</p>
      ) : (
        <>
          <div className="cal-grid" style={{ marginBottom: 4 }}>
            {DOW.map((d) => <div className="cal-dow" key={d}>{d}</div>)}
          </div>
          <div className="cal-grid">
            {celdas.map(({ fecha, delMes }) => {
              const evs = porDia.get(fecha) ?? [];
              return (
                <button
                  key={fecha}
                  className={"cal-cell" + (delMes ? "" : " out") + (fecha === hoy ? " today" : "")}
                  onClick={() => evs.length > 0 && setDiaAbierto(fecha)}
                  aria-label={`Día ${fecha}${evs.length ? `, ${evs.length} eventos` : ""}`}
                >
                  <div className="cal-num">{Number(fecha.slice(8))}</div>
                  {evs.slice(0, 3).map((e) => (
                    <div className="cal-ev" key={e.id} style={{ background: `color-mix(in srgb, ${colorArea(e.area)} 16%, var(--paper))` }}>
                      {e.icon} <span className="t">{e.title}</span>
                    </div>
                  ))}
                  {evs.length > 3 && <div className="cal-more">y {evs.length - 3} más</div>}
                </button>
              );
            })}
          </div>

          {areasConEventos.length > 0 && (
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 14 }}>
              {areasConEventos.map((a) => (
                <span key={a.key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink-soft)" }}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: a.color, display: "inline-block" }} />
                  {a.name}
                </span>
              ))}
            </div>
          )}

          {eventos.length === 0 && (
            <div className="card pad" style={{ marginTop: 14 }}>
              <p style={{ color: "var(--muted)", fontSize: 14 }}>
                Este mes está despejado. Los pagos con fecha, las citas médicas, los exámenes, los cumpleaños de tus vínculos, tus jornadas de trabajo y tus avances aparecerán aquí solos.
              </p>
            </div>
          )}
        </>
      )}

      {diaAbierto && (
        <div className="tp-overlay" onClick={() => setDiaAbierto(null)}>
          <div className="tp" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <h3 style={{ marginBottom: 12 }}>
              {new Date(diaAbierto + "T00:00:00").toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}
            </h3>
            {(porDia.get(diaAbierto) ?? []).map((e) => (
              <div className="txrow" key={e.id}>
                <span className="txicon">{e.icon}</span>
                <div className="txmeta">
                  <b>{e.title}</b>
                  <small>{nombreArea(e.area)}{e.detail ? `, ${e.detail}` : ""}</small>
                </div>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: colorArea(e.area), flexShrink: 0 }} />
              </div>
            ))}
            <button className="btn ghost" style={{ marginTop: 12 }} onClick={() => setDiaAbierto(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
