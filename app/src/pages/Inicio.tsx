import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Sparkles } from "lucide-react";
import { AREAS } from "../areas";
import { useAuth } from "../auth/AuthProvider";
import { useSettings } from "../settings/SettingsProvider";
import { TablesMissingError, listAccounts, listCategories, listReminders, listTransactions } from "../finanzas/data";
import { daysUntil, dueLabel, fmtMoney, nextOccurrence, type Account, type Category, type Reminder, type Tx } from "../finanzas/types";
import { listActivity, listObjectives, type ActivityEntry, type Objective } from "../objetivos/data";

export function Inicio() {
  const { session } = useAuth();
  const { currency, displayName, lifeVision, updateProfile } = useSettings();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [finReady, setFinReady] = useState(false);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [objReady, setObjReady] = useState(false);

  const [editingVision, setEditingVision] = useState(false);
  const [visionDraft, setVisionDraft] = useState("");
  const [visionErr, setVisionErr] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const [a, c, t, r] = await Promise.all([listAccounts(), listCategories(), listTransactions(50), listReminders()]);
      setAccounts(a);
      setCategories(c);
      setTxs(t);
      setReminders(r);
      setFinReady(true);
    } catch (e) {
      if (e instanceof TablesMissingError) setFinReady(false);
    }
    try {
      const [act, obj] = await Promise.all([listActivity(10), listObjectives()]);
      setActivity(act);
      setObjectives(obj);
      setObjReady(true);
    } catch {
      setObjReady(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const nombre = displayName || (session?.user?.email ?? "").split("@")[0] || "Hola";
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const month = new Date().toISOString().slice(0, 7);
  const monthTxs = txs.filter((t) => t.date.startsWith(month));
  const gastosMes = monthTxs.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const balanceTotal = accounts.reduce((s, a) => s + Number(a.balance), 0);

  const gastoPorCatId = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of monthTxs) {
      if (t.type !== "expense" || !t.category_id) continue;
      m.set(t.category_id, (m.get(t.category_id) ?? 0) + Number(t.amount));
    }
    return m;
  }, [monthTxs]);

  const presupuestosAlLimite = categories.filter((c) => {
    const b = Number(c.budget);
    if (!(c.type === "expense" && b > 0)) return false;
    return (gastoPorCatId.get(c.id) ?? 0) >= b * 0.9;
  }).length;

  async function saveVision() {
    setVisionErr(null);
    const err = await updateProfile({ life_vision: visionDraft.trim() });
    if (err) setVisionErr(err);
    else setEditingVision(false);
  }

  return (
    <div className="page">
      <div className="page-head">
        <div className="eyebrow"><Sparkles size={13} /> Inicio</div>
        <h1>Hola, {nombre}</h1>
        <p>Todas tus áreas de vida en un lugar. Esto es lo que está pasando hoy.</p>
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

      {/* Stats reales (Finanzas) */}
      <div className="statrow" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
        <div className="card stat"><div className="k">Balance total</div><div className="v tnum">{finReady ? fmtMoney(balanceTotal, accounts[0]?.currency ?? currency) : "…"}</div></div>
        <div className="card stat"><div className="k">Gastos del mes</div><div className="v tnum" style={{ color: "var(--err)" }}>{finReady ? fmtMoney(gastosMes, accounts[0]?.currency ?? currency) : "…"}</div></div>
        <div className="card stat"><div className="k">Movimientos del mes</div><div className="v tnum">{finReady ? monthTxs.length : "…"}</div></div>
        <div className="card stat"><div className="k">Presupuestos al límite</div><div className="v tnum" style={presupuestosAlLimite > 0 ? { color: "var(--warn)" } : undefined}>{finReady ? presupuestosAlLimite : "…"}</div></div>
      </div>

      {/* Próximos pagos — siempre visibles (ADHD-friendly) */}
      {reminders.length > 0 && (
        <div className="card panel" style={{ marginBottom: 16 }}>
          <h3>🔔 Próximos pagos</h3>
          {[...reminders]
            .map((r) => ({ r, next: nextOccurrence(r) }))
            .sort((a, b) => a.next.localeCompare(b.next))
            .slice(0, 3)
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
      )}

      <div className="panelgrid">
        {/* Estado de las áreas */}
        <div className="card panel">
          <h3>Tus áreas</h3>
          {AREAS.map((a) => {
            let badge: React.ReactNode = <span style={{ marginLeft: "auto", fontSize: 11.5, color: "var(--muted)" }}>próximamente</span>;
            if (a.key === "finanzas" && finReady) {
              badge = <span className="chip" style={{ marginLeft: "auto" }}>{monthTxs.length} mov. este mes</span>;
            } else if (a.key === "objetivos" && objReady) {
              const n = objectives.length;
              badge = <span className="chip" style={{ marginLeft: "auto" }}>{n === 1 ? "1 meta" : `${n} metas`}</span>;
            }
            return (
              <Link to={a.path} key={a.key} className="area-row">
                <span className="adot" style={{ width: 9, height: 9, borderRadius: "50%", background: a.color, flexShrink: 0 }} />
                <span className="area-name">{a.name}</span>
                {badge}
              </Link>
            );
          })}
        </div>

        {/* Actividad reciente unificada: transacciones + avances de todas las áreas */}
        <div className="card panel">
          <h3>Actividad reciente</h3>
          {(() => {
            const items: Array<{ key: string; date: string; areaKey: string; areaLabel: string; text: string }> = [];
            for (const t of txs.slice(0, 10)) {
              const cat = t.category_id ? catById.get(t.category_id) : undefined;
              items.push({
                key: `tx-${t.id}`,
                date: t.date,
                areaKey: "finanzas",
                areaLabel: "Finanzas",
                text: `${t.type === "expense" ? "Gasto" : "Ingreso"}${cat ? ` en ${cat.name}` : ""}: ${t.description || "sin descripción"} (${fmtMoney(Number(t.amount), accounts[0]?.currency ?? currency)})`,
              });
            }
            for (const a of activity) {
              const area = AREAS.find((x) => x.key === a.area);
              items.push({
                key: `act-${a.id}`,
                date: a.date,
                areaKey: a.area,
                areaLabel: area?.name ?? "Objetivos",
                text: a.description,
              });
            }
            items.sort((x, y) => y.date.localeCompare(x.date));
            if (items.length === 0) {
              return (
                <p style={{ color: "var(--muted)", fontSize: 13.5 }}>
                  Tu actividad aparecerá aquí. Empieza registrando algo en <Link to="/finanzas" style={{ color: "var(--accent-ink)", textDecoration: "underline" }}>Finanzas</Link> o un avance en <Link to="/objetivos" style={{ color: "var(--accent-ink)", textDecoration: "underline" }}>Objetivos</Link>.
                </p>
              );
            }
            return items.slice(0, 6).map((it) => {
              const area = AREAS.find((x) => x.key === it.areaKey);
              return (
                <div className="tl" key={it.key}>
                  <div className="row">
                    <span className="tdot" style={{ background: area?.color ?? "var(--accent)" }} />
                    <div className="tx">
                      <b>{it.areaLabel}, {it.date}</b>
                      {it.text}
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* Tracker de sobriedad (se hará configurable en el bloque de Salud) */}
      <div className="card sob">
        <span className="seed">🌱</span>
        <div>
          <div className="t1">Libre de marihuana</div>
          <div className="t2 tnum">1 año y 4 meses</div>
        </div>
        <div className="hitos">
          <span className="hito">✓ THC eliminado</span>
          <span className="hito">✓ Memoria recuperada</span>
          <span className="hito next">Próximo: 18 meses</span>
        </div>
      </div>
    </div>
  );
}
