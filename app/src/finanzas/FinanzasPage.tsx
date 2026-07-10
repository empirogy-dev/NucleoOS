import { fmtFechaLocal, hoyLocal, mesActualLocal } from "../lib/fechas";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, Wallet } from "lucide-react";
import {
  TablesMissingError,
  addAccount,
  addCard,
  addCategory,
  addDebt,
  addGoal,
  addReminder,
  addTransaction,
  contributeToGoal,
  deleteAccount,
  deleteCard,
  deleteCategory,
  deleteDebt,
  deleteGoal,
  deleteReminder,
  deleteTransaction,
  importStatementRows,
  listAccounts,
  listCards,
  listDebts,
  listGoals,
  listReminders,
  listTransactions,
  seedCategoriesIfEmpty,
  updateCategoryBudget,
} from "./data";
import { StatementImportError, parseStatementFile, type StatementImportRow } from "./statementImport";
import { CURRENCIES, useSettings } from "../settings/SettingsProvider";
import {
  daysUntil,
  dueLabel,
  fmtMoney,
  nextOccurrence,
  type Account,
  type Category,
  type CreditCard,
  type Debt,
  type Goal,
  type Reminder,
  type Tx,
} from "./types";

type TabKey = "resumen" | "transacciones" | "metas" | "deudas" | "cuentas" | "categorias" | "reporte";

export function FinanzasPage() {
  const [tab, setTab] = useState<TabKey>("resumen");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<"tx" | "account" | "category" | "goal" | "debt" | "card" | "reminder" | "import" | null>(null);
  const [budgetCat, setBudgetCat] = useState<Category | null>(null);
  const [contributeGoal, setContributeGoal] = useState<Goal | null>(null);
  const { currency: defaultCurrency } = useSettings();

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, c, t, g, d, cc, r] = await Promise.all([
        listAccounts(), seedCategoriesIfEmpty(), listTransactions(1000), listGoals(),
        listDebts(), listCards(), listReminders(),
      ]);
      setAccounts(a);
      setCategories(c);
      setTxs(t);
      setGoals(g);
      setDebts(d);
      setCards(cc);
      setReminders(r);
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

  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const accById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  const month = mesActualLocal();
  const monthTxs = txs.filter((t) => t.date.startsWith(month));
  const ingresos = monthTxs.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const gastos = monthTxs.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const balanceTotal = accounts.reduce((s, a) => s + Number(a.balance), 0);
  const currency = accounts[0]?.currency ?? defaultCurrency;

  const gastoPorCatId = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of monthTxs) {
      if (t.type !== "expense" || !t.category_id) continue;
      m.set(t.category_id, (m.get(t.category_id) ?? 0) + Number(t.amount));
    }
    return m;
  }, [monthTxs]);

  const budgetCats = categories.filter((c) => c.type === "expense" && Number(c.budget) > 0);

  const gastoPorCategoria = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of monthTxs) {
      if (t.type !== "expense") continue;
      const key = t.category_id ?? "otros";
      m.set(key, (m.get(key) ?? 0) + Number(t.amount));
    }
    return [...m.entries()]
      .map(([id, total]) => ({ cat: catById.get(id), total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [monthTxs, catById]);

  if (needsMigration) {
    return (
      <div className="page">
        <Head />
        <div className="card pad" style={{ maxWidth: 640 }}>
          <h3 style={{ marginBottom: 10 }}>Un paso pendiente en Supabase</h3>
          <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 12 }}>
            Faltan las tablas de finanzas. Es una sola vez:
          </p>
          <ol style={{ fontSize: 14, color: "var(--ink-soft)", paddingLeft: 20, display: "grid", gap: 6 }}>
            <li>Abre tu proyecto en Supabase → <b>SQL Editor</b>.</li>
            <li>Copia el contenido de <code>supabase/migrations/0001_finanzas.sql</code> (está en el repo).</li>
            <li>Pégalo y presiona <b>Run</b>.</li>
          </ol>
          <button className="btn primary" style={{ marginTop: 16 }} onClick={() => void reload()}>
            Ya lo hice, reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <Head />

      <div className="ftabs">
        {(
          [
            ["resumen", "Resumen"],
            ["transacciones", "Transacciones"],
            ["metas", "Metas"],
            ["deudas", "Deudas y tarjetas"],
            ["cuentas", "Cuentas"],
            ["categorias", "Categorías"],
            ["reporte", "Reporte"],
          ] as Array<[TabKey, string]>
        ).map(([k, label]) => (
          <button key={k} className={"ftab" + (tab === k ? " active" : "")} onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        <button className="btn ghost" onClick={() => setModal("import")}>Importar cartola</button>
        <button className="btn primary" onClick={() => setModal("tx")}>
          <Plus size={15} style={{ verticalAlign: "-2px", marginRight: 5 }} />
          Registrar
        </button>
      </div>

      {error && <div className="card pad" style={{ borderLeft: "3px solid var(--err)", marginBottom: 14 }}>{error}</div>}
      {loading ? (
        <p style={{ color: "var(--muted)" }}>Cargando…</p>
      ) : (
        <>
          {tab === "resumen" && (
            <>
              <div className="statrow" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                <div className="card stat"><div className="k">Balance total</div><div className="v tnum">{fmtMoney(balanceTotal, currency)}</div></div>
                <div className="card stat"><div className="k">Ingresos del mes</div><div className="v tnum" style={{ color: "var(--ok)" }}>{fmtMoney(ingresos, currency)}</div></div>
                <div className="card stat"><div className="k">Gastos del mes</div><div className="v tnum" style={{ color: "var(--err)" }}>{fmtMoney(gastos, currency)}</div></div>
              </div>
              <div className="panelgrid">
                <div className="card panel">
                  <h3>Gasto por categoría (este mes)</h3>
                  {gastoPorCategoria.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13.5 }}>Aún no hay gastos este mes. Usa "Registrar" para empezar.</p>}
                  {gastoPorCategoria.map(({ cat, total }) => (
                    <div className="bar" key={cat?.id ?? "otros"}>
                      <div className="top">
                        <span className="lbl">{cat?.icon} {cat?.name ?? "Sin categoría"}</span>
                        <b className="tnum">{fmtMoney(total, currency)}</b>
                      </div>
                      <div className="track">
                        <div className="fill" style={{ width: `${gastos ? Math.round((total / gastos) * 100) : 0}%`, background: "var(--fin)" }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="card panel">
                  <h3>Últimos movimientos</h3>
                  {txs.slice(0, 6).map((t) => (
                    <TxRow key={t.id} t={t} catById={catById} accById={accById} currency={currency} />
                  ))}
                  {txs.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13.5 }}>Nada aún por aquí.</p>}
                </div>
              </div>

              <div className="card panel" style={{ marginTop: 14 }}>
                <h3>Presupuestos del mes</h3>
                {budgetCats.length === 0 && (
                  <p style={{ color: "var(--muted)", fontSize: 13.5 }}>
                    Aún no defines presupuestos. Ve a <b>Categorías</b> y asigna un tope mensual con el lápiz ✎.
                  </p>
                )}
                {budgetCats.map((c) => {
                  const spent = gastoPorCatId.get(c.id) ?? 0;
                  const budget = Number(c.budget);
                  const pct = Math.min(100, Math.round((spent / budget) * 100));
                  const over = spent > budget;
                  return (
                    <div className="bar" key={c.id}>
                      <div className="top">
                        <span className="lbl">{c.icon} {c.name}</span>
                        <b className="tnum" style={over ? { color: "var(--err)" } : undefined}>
                          {fmtMoney(spent, currency)} / {fmtMoney(budget, currency)}{over ? ", te pasaste" : ""}
                        </b>
                      </div>
                      <div className="track">
                        <div className="fill" style={{ width: `${pct}%`, background: over ? "var(--err)" : "var(--fin)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {tab === "transacciones" && (
            <div className="card pad">
              {txs.length === 0 && <p style={{ color: "var(--muted)" }}>Sin transacciones. Presiona "Registrar" para la primera.</p>}
              {txs.map((t) => (
                <TxRow key={t.id} t={t} catById={catById} accById={accById} currency={currency}
                  onDelete={async () => { await deleteTransaction(t); void reload(); }} />
              ))}
            </div>
          )}

          {tab === "metas" && (
            <>
              <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))" }}>
                {goals.map((g) => {
                  const target = Number(g.target_amount);
                  const current = Number(g.current_amount);
                  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
                  const done = current >= target && target > 0;
                  return (
                    <div className="card pad" key={g.id}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <span style={{ fontSize: 22 }}>{g.icon ?? "🎯"}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <b style={{ fontSize: 14 }}>{g.name}</b>
                          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
                            {g.deadline ? `para el ${g.deadline}` : "sin fecha límite"}
                          </div>
                        </div>
                        <button className="xdel" aria-label="Eliminar meta" onClick={async () => { await deleteGoal(g.id); void reload(); }}><Trash2 size={14} /></button>
                      </div>
                      <div className="bar" style={{ marginBottom: 10 }}>
                        <div className="top">
                          <span className="tnum">{fmtMoney(current, currency)} / {fmtMoney(target, currency)}</span>
                          <b className="tnum" style={done ? { color: "var(--ok)" } : undefined}>{pct}%</b>
                        </div>
                        <div className="track">
                          <div className="fill" style={{ width: `${pct}%`, background: done ? "var(--ok)" : "var(--fin)" }} />
                        </div>
                      </div>
                      {done ? (
                        <span className="chip" style={{ background: "color-mix(in srgb,var(--ok) 18%,var(--paper))", color: "var(--ok)" }}>🎉 ¡Meta lograda!</span>
                      ) : (
                        <button className="btn ghost" style={{ width: "100%" }} onClick={() => setContributeGoal(g)}>Aportar</button>
                      )}
                    </div>
                  );
                })}
              </div>
              {goals.length === 0 && (
                <p style={{ color: "var(--muted)", marginBottom: 14 }}>
                  Sin metas todavía. Crea la primera: juntar para un viaje, un fondo de emergencia, lo que sueñes. 🌱
                </p>
              )}
              <button className="btn ghost" style={{ marginTop: goals.length ? 14 : 0 }} onClick={() => setModal("goal")}>
                <Plus size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} /> Nueva meta
              </button>
            </>
          )}

          {tab === "deudas" && (
            <>
              {/* Próximos pagos */}
              <div className="card panel" style={{ marginBottom: 14 }}>
                <h3>🔔 Próximos pagos</h3>
                {reminders.length === 0 && (
                  <p style={{ color: "var(--muted)", fontSize: 13.5 }}>
                    Sin recordatorios. Se crean solos al agregar una deuda o tarjeta con fecha de pago. También puedes agregar uno manual, como el celular o el arriendo.
                  </p>
                )}
                {[...reminders]
                  .map((r) => ({ r, next: nextOccurrence(r) }))
                  .sort((a, b) => a.next.localeCompare(b.next))
                  .map(({ r, next }) => {
                    const d = daysUntil(next);
                    const lbl = dueLabel(d);
                    return (
                      <div className="txrow" key={r.id}>
                        <span className="txicon">{r.category === "creditCard" ? "💳" : r.category === "debt" ? "🏦" : "🔔"}</span>
                        <div className="txmeta">
                          <b>{r.title}</b>
                          <small>{next}{r.recurrence === "monthly" ? ", mensual" : r.recurrence === "biweekly" ? ", quincenal" : ""}{r.amount ? `, ${fmtMoney(Number(r.amount), currency)}` : ""}</small>
                        </div>
                        <span className="chip" style={{
                          background: lbl.tone === "err" ? "color-mix(in srgb,var(--err) 16%,var(--paper))" : lbl.tone === "warn" ? "color-mix(in srgb,var(--warn) 16%,var(--paper))" : "var(--accent-wash)",
                          color: lbl.tone === "err" ? "var(--err)" : lbl.tone === "warn" ? "var(--warn)" : "var(--accent-ink)",
                        }}>{lbl.text}</span>
                        <button className="xdel" aria-label="Eliminar recordatorio" onClick={async () => { await deleteReminder(r.id); void reload(); }}><Trash2 size={14} /></button>
                      </div>
                    );
                  })}
                <button className="btn ghost" style={{ marginTop: 12 }} onClick={() => setModal("reminder")}>
                  <Plus size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} /> Recordatorio manual
                </button>
              </div>

              {/* Tarjetas */}
              <h3 style={{ fontSize: 15, margin: "4px 0 10px" }}>Tarjetas de crédito</h3>
              <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))" }}>
                {cards.map((c) => {
                  const usado = Number(c.balance);
                  const limite = Number(c.credit_limit ?? 0);
                  const pct = limite > 0 ? Math.min(100, Math.round((usado / limite) * 100)) : 0;
                  return (
                    <div className="card pad" key={c.id}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 18 }}>💳</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <b style={{ fontSize: 14 }}>{c.name}</b>
                          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{c.bank ?? ""}{c.last_four ? ` •••• ${c.last_four}` : ""}</div>
                        </div>
                        <button className="xdel" aria-label="Eliminar tarjeta" onClick={async () => { await deleteCard(c.id); void reload(); }}><Trash2 size={14} /></button>
                      </div>
                      <div className="tnum" style={{ fontFamily: "var(--serif)", fontSize: 19, fontWeight: 500 }}>{fmtMoney(usado, c.currency)}</div>
                      {limite > 0 && (
                        <div className="bar" style={{ marginTop: 8, marginBottom: 0 }}>
                          <div className="top"><span>usado del cupo</span><b className="tnum">{pct}%</b></div>
                          <div className="track"><div className="fill" style={{ width: `${pct}%`, background: pct >= 80 ? "var(--err)" : "var(--fin)" }} /></div>
                        </div>
                      )}
                      {c.due_date && <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 8 }}>paga el día {new Date(c.due_date + "T00:00:00").getDate()} de cada mes</div>}
                    </div>
                  );
                })}
              </div>
              <button className="btn ghost" style={{ margin: "12px 0 20px" }} onClick={() => setModal("card")}>
                <Plus size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} /> Agregar tarjeta
              </button>

              {/* Deudas */}
              <h3 style={{ fontSize: 15, margin: "4px 0 10px" }}>Deudas</h3>
              <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))" }}>
                {debts.map((d) => (
                  <div className="card pad" key={d.id}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: 18 }}>🏦</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <b style={{ fontSize: 14 }}>{d.name}</b>
                        <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{d.institution ?? ""}{d.interest_rate ? `, ${d.interest_rate}% de interés` : ""}</div>
                      </div>
                      <button className="xdel" aria-label="Eliminar deuda" onClick={async () => { await deleteDebt(d.id); void reload(); }}><Trash2 size={14} /></button>
                    </div>
                    <div className="tnum" style={{ fontFamily: "var(--serif)", fontSize: 19, fontWeight: 500 }}>{fmtMoney(Number(d.balance), d.currency)}</div>
                    {d.min_payment != null && <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 6 }}>pago mínimo {fmtMoney(Number(d.min_payment), d.currency)}</div>}
                  </div>
                ))}
              </div>
              <button className="btn ghost" style={{ marginTop: 12 }} onClick={() => setModal("debt")}>
                <Plus size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} /> Agregar deuda
              </button>
            </>
          )}

          {tab === "reporte" && (
            <ReporteTab txs={txs} categories={categories} currency={currency} />
          )}

          {tab === "cuentas" && (
            <>
              <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))" }}>
                {accounts.map((a) => (
                  <div className="card pad" key={a.id}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <span style={{ width: 34, height: 34, borderRadius: 9, background: "var(--accent-wash)", display: "grid", placeItems: "center", color: "var(--accent-ink)" }}><Wallet size={16} /></span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <b style={{ fontSize: 14 }}>{a.name}</b>
                        <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{a.bank_name ?? a.account_type}</div>
                      </div>
                      <button className="xdel" aria-label="Eliminar cuenta" onClick={async () => { await deleteAccount(a.id); void reload(); }}><Trash2 size={14} /></button>
                    </div>
                    <div className="tnum" style={{ fontFamily: "var(--serif)", fontSize: 21, fontWeight: 500 }}>{fmtMoney(Number(a.balance), a.currency)}</div>
                  </div>
                ))}
              </div>
              <button className="btn ghost" style={{ marginTop: 14 }} onClick={() => setModal("account")}>
                <Plus size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} /> Agregar cuenta
              </button>
            </>
          )}

          {tab === "categorias" && (
            <>
              <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))" }}>
                {categories.map((c) => (
                  <div className="card" key={c.id} style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{c.icon ?? "🏷️"}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <b style={{ fontSize: 13.5 }}>{c.name}</b>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>
                        {c.type === "income" ? "Ingreso" : c.type === "savings" ? "Ahorro" : "Gasto"}
                        {c.type === "expense" && Number(c.budget) > 0 ? `, presupuesto ${fmtMoney(Number(c.budget), currency)}` : ""}
                      </div>
                    </div>
                    {c.type === "expense" && (
                      <button className="xdel" aria-label="Editar presupuesto" title="Presupuesto mensual" onClick={() => setBudgetCat(c)}><Pencil size={14} /></button>
                    )}
                    <button className="xdel" aria-label="Eliminar categoría" onClick={async () => { await deleteCategory(c.id); void reload(); }}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
              <button className="btn ghost" style={{ marginTop: 14 }} onClick={() => setModal("category")}>
                <Plus size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} /> Agregar categoría
              </button>
            </>
          )}
        </>
      )}

      {modal === "tx" && (
        <TxModal categories={categories} accounts={accounts} onClose={() => setModal(null)}
          onSaved={() => { setModal(null); void reload(); }} />
      )}
      {modal === "account" && (
        <AccountModal onClose={() => setModal(null)} onSaved={() => { setModal(null); void reload(); }} />
      )}
      {modal === "category" && (
        <CategoryModal onClose={() => setModal(null)} onSaved={() => { setModal(null); void reload(); }} />
      )}
      {budgetCat && (
        <BudgetModal cat={budgetCat} currency={currency} onClose={() => setBudgetCat(null)}
          onSaved={() => { setBudgetCat(null); void reload(); }} />
      )}
      {modal === "goal" && (
        <GoalModal onClose={() => setModal(null)} onSaved={() => { setModal(null); void reload(); }} />
      )}
      {contributeGoal && (
        <ContributeModal goal={contributeGoal} currency={currency} onClose={() => setContributeGoal(null)}
          onSaved={() => { setContributeGoal(null); void reload(); }} />
      )}
      {modal === "debt" && (
        <DebtModal currency={defaultCurrency} onClose={() => setModal(null)} onSaved={() => { setModal(null); void reload(); }} />
      )}
      {modal === "card" && (
        <CardModal currency={defaultCurrency} onClose={() => setModal(null)} onSaved={() => { setModal(null); void reload(); }} />
      )}
      {modal === "reminder" && (
        <ReminderModal onClose={() => setModal(null)} onSaved={() => { setModal(null); void reload(); }} />
      )}
      {modal === "import" && (
        <ImportModal accounts={accounts} categories={categories} existing={txs} currency={currency}
          onClose={() => setModal(null)} onSaved={() => { setModal(null); void reload(); }} />
      )}
    </div>
  );
}

function monthAdd(ym: string, delta: number): string {
  const d = new Date(ym + "-01T00:00:00");
  d.setMonth(d.getMonth() + delta);
  return fmtFechaLocal(d).slice(0, 7);
}

function ReporteTab({ txs, categories, currency }: { txs: Tx[]; categories: Category[]; currency: string }) {
  const [ym, setYm] = useState(mesActualLocal());
  const prev = monthAdd(ym, -1);
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  function totals(month: string) {
    const rows = txs.filter((t) => t.date.startsWith(month));
    const ingresos = rows.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const gastos = rows.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    return { rows, ingresos, gastos, neto: ingresos - gastos };
  }

  const actual = totals(ym);
  const anterior = totals(prev);

  function deltaText(a: number, b: number): string {
    if (b === 0) return a === 0 ? "igual que el mes anterior" : "sin datos del mes anterior";
    const pct = Math.round(((a - b) / b) * 100);
    if (pct === 0) return "igual que el mes anterior";
    return pct > 0 ? `${pct}% más que el mes anterior` : `${-pct}% menos que el mes anterior`;
  }

  const porCategoria = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of actual.rows) {
      if (t.type !== "expense") continue;
      m.set(t.category_id ?? "sin", (m.get(t.category_id ?? "sin") ?? 0) + Number(t.amount));
    }
    return [...m.entries()]
      .map(([id, total]) => ({ cat: id === "sin" ? undefined : catById.get(id), total }))
      .sort((a, b) => b.total - a.total);
  }, [actual.rows, catById]);

  return (
    <>
      <div className="field" style={{ maxWidth: 220, marginBottom: 16 }}>
        <label>Mes del reporte</label>
        <input type="month" value={ym} onChange={(e) => setYm(e.target.value)} />
      </div>
      <div className="statrow" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        <div className="card stat">
          <div className="k">Ingresos</div>
          <div className="v tnum" style={{ color: "var(--ok)" }}>{fmtMoney(actual.ingresos, currency)}</div>
          <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>{deltaText(actual.ingresos, anterior.ingresos)}</div>
        </div>
        <div className="card stat">
          <div className="k">Gastos</div>
          <div className="v tnum" style={{ color: "var(--err)" }}>{fmtMoney(actual.gastos, currency)}</div>
          <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>{deltaText(actual.gastos, anterior.gastos)}</div>
        </div>
        <div className="card stat">
          <div className="k">Resultado del mes</div>
          <div className="v tnum" style={{ color: actual.neto >= 0 ? "var(--ok)" : "var(--err)" }}>{fmtMoney(actual.neto, currency)}</div>
          <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>{actual.rows.length} movimientos</div>
        </div>
      </div>
      <div className="card panel">
        <h3>Gasto por categoría</h3>
        {porCategoria.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13.5 }}>Sin gastos en este mes.</p>}
        {porCategoria.map(({ cat, total }) => (
          <div className="bar" key={cat?.id ?? "sin"}>
            <div className="top">
              <span className="lbl">{cat?.icon} {cat?.name ?? "Sin categoría"}</span>
              <b className="tnum">{fmtMoney(total, currency)}</b>
            </div>
            <div className="track">
              <div className="fill" style={{ width: `${actual.gastos ? Math.round((total / actual.gastos) * 100) : 0}%`, background: "var(--fin)" }} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function ImportModal({ accounts, categories, existing, currency, onClose, onSaved }: {
  accounts: Account[];
  categories: Category[];
  existing: Tx[];
  currency: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [rows, setRows] = useState<StatementImportRow[] | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);
    setRows(null);
    setResult(null);
    try {
      const parsed = await parseStatementFile(file, categories);
      setRows(parsed.rows);
      setWarnings(parsed.warnings);
    } catch (ex) {
      if (ex instanceof StatementImportError && ex.code === "UNRECOGNIZED_COLUMNS") {
        setErr("No reconocí las columnas del archivo. Exporta la cartola de tu banco como CSV con columnas de fecha, descripción y monto, e intenta de nuevo.");
      } else {
        setErr("No pude leer el archivo. Verifica que sea la cartola en formato CSV, OFX o QFX de tu banco.");
      }
    }
  }

  async function doImport() {
    if (!rows) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await importStatementRows(rows, accountId || null, categories, existing);
      setResult(res);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Importar cartola" onClose={onClose}>
      {result ? (
        <div>
          <p style={{ fontSize: 14.5, marginBottom: 6 }}>
            Se importaron <b>{result.imported}</b> movimientos.
            {result.skipped > 0 && <> Se omitieron {result.skipped} que ya estaban registrados.</>}
          </p>
          <button className="btn primary" style={{ width: "100%", marginTop: 10 }} onClick={onSaved}>Listo</button>
        </div>
      ) : (
        <>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
            Descarga la cartola desde tu banco (CSV, OFX o QFX) y súbela aquí. Los movimientos repetidos se omiten solos.
          </p>
          <div className="field"><label>Cuenta de destino</label>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              <option value="">Sin cuenta</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select></div>
          <div className="field"><label>Archivo</label>
            <input type="file" accept=".csv,.ofx,.qfx,text/csv" onChange={onFile} /></div>
          {err && <div className="alert err" style={{ marginBottom: 10 }}>{err}</div>}
          {rows && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 13.5, marginBottom: 8 }}>
                Encontré <b>{rows.length}</b> movimientos.{warnings.length > 0 && <> Hubo {warnings.length} filas que no se pudieron leer.</>}
              </p>
              <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid var(--line)", borderRadius: 10, padding: "4px 10px" }}>
                {rows.slice(0, 12).map((r) => (
                  <div className="txrow" key={r.id} style={{ padding: "7px 0" }}>
                    <div className="txmeta">
                      <b style={{ fontSize: 12.5 }}>{r.description || "Sin descripción"}</b>
                      <small>{r.date}{r.category ? `, ${r.category}` : ""}</small>
                    </div>
                    <b className={"tnum txamt " + (r.type === "expense" ? "neg" : "pos")} style={{ fontSize: 12.5 }}>
                      {r.type === "expense" ? "−" : "+"}{fmtMoney(Math.abs(r.amount), currency)}
                    </b>
                  </div>
                ))}
                {rows.length > 12 && <p style={{ fontSize: 12, color: "var(--muted)", padding: "6px 0" }}>y {rows.length - 12} más…</p>}
              </div>
            </div>
          )}
          <button className="btn primary" style={{ width: "100%" }} disabled={!rows || busy} onClick={() => void doImport()}>
            {busy ? "Importando…" : rows ? `Importar ${rows.length} movimientos` : "Elige un archivo primero"}
          </button>
        </>
      )}
    </Modal>
  );
}

function DebtModal({ currency, onClose, onSaved }: { currency: string; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [balance, setBalance] = useState("");
  const [rate, setRate] = useState("");
  const [minPay, setMinPay] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await addDebt({
      name, institution: institution || null, balance: Number(balance || 0),
      interest_rate: rate ? Number(rate) : null, min_payment: minPay ? Number(minPay) : null,
      due_date: dueDate || null, currency,
    });
    onSaved();
  }

  return (
    <Modal title="Agregar deuda" onClose={onClose}>
      <form onSubmit={save}>
        <div className="field"><label>Nombre</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Crédito de consumo" autoFocus /></div>
        <div className="field"><label>Institución (opcional)</label>
          <input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Banco…" /></div>
        <div className="frow">
          <div className="field"><label>Saldo adeudado</label>
            <input type="number" required min="0" step="any" value={balance} onChange={(e) => setBalance(e.target.value)} /></div>
          <div className="field"><label>Interés % (opcional)</label>
            <input type="number" min="0" step="any" value={rate} onChange={(e) => setRate(e.target.value)} /></div>
        </div>
        <div className="frow">
          <div className="field"><label>Pago mínimo (opcional)</label>
            <input type="number" min="0" step="any" value={minPay} onChange={(e) => setMinPay(e.target.value)} /></div>
          <div className="field"><label>Próximo pago (opcional)</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
        </div>
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>💡 Si pones fecha de pago, se crea solo un recordatorio mensual.</p>
        <button className="btn primary" disabled={busy} style={{ width: "100%" }}>{busy ? "Guardando…" : "Guardar"}</button>
      </form>
    </Modal>
  );
}

function CardModal({ currency, onClose, onSaved }: { currency: string; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [bank, setBank] = useState("");
  const [lastFour, setLastFour] = useState("");
  const [limit, setLimit] = useState("");
  const [balance, setBalance] = useState("");
  const [minPay, setMinPay] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await addCard({
      name, bank: bank || null, last_four: lastFour || null,
      credit_limit: limit ? Number(limit) : null, balance: Number(balance || 0),
      min_payment: minPay ? Number(minPay) : null, due_date: dueDate || null, currency,
    });
    onSaved();
  }

  return (
    <Modal title="Agregar tarjeta de crédito" onClose={onClose}>
      <form onSubmit={save}>
        <div className="field"><label>Nombre</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Visa" autoFocus /></div>
        <div className="frow">
          <div className="field"><label>Banco (opcional)</label>
            <input value={bank} onChange={(e) => setBank(e.target.value)} /></div>
          <div className="field" style={{ width: 110 }}><label>Últimos 4</label>
            <input maxLength={4} value={lastFour} onChange={(e) => setLastFour(e.target.value.replace(/\D/g, ""))} placeholder="1234" /></div>
        </div>
        <div className="frow">
          <div className="field"><label>Cupo (opcional)</label>
            <input type="number" min="0" step="any" value={limit} onChange={(e) => setLimit(e.target.value)} /></div>
          <div className="field"><label>Usado</label>
            <input type="number" min="0" step="any" value={balance} onChange={(e) => setBalance(e.target.value)} /></div>
        </div>
        <div className="frow">
          <div className="field"><label>Pago mínimo (opcional)</label>
            <input type="number" min="0" step="any" value={minPay} onChange={(e) => setMinPay(e.target.value)} /></div>
          <div className="field"><label>Próximo pago (opcional)</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
        </div>
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>💡 Si pones fecha de pago, se crea solo un recordatorio mensual.</p>
        <button className="btn primary" disabled={busy} style={{ width: "100%" }}>{busy ? "Guardando…" : "Guardar"}</button>
      </form>
    </Modal>
  );
}

function ReminderModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(hoyLocal());
  const [recurrence, setRecurrence] = useState<"oneTime" | "monthly" | "biweekly">("monthly");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await addReminder({
      title, amount: amount ? Number(amount) : null, date, recurrence, category: "custom",
    });
    onSaved();
  }

  return (
    <Modal title="Recordatorio de pago" onClose={onClose}>
      <form onSubmit={save}>
        <div className="field"><label>¿Qué hay que pagar?</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Plan del celular" autoFocus /></div>
        <div className="frow">
          <div className="field"><label>Monto (opcional)</label>
            <input type="number" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
          <div className="field"><label>Fecha</label>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} /></div>
        </div>
        <div className="field"><label>Se repite</label>
          <select value={recurrence} onChange={(e) => setRecurrence(e.target.value as typeof recurrence)}>
            <option value="monthly">Cada mes</option>
            <option value="biweekly">Cada 2 semanas</option>
            <option value="oneTime">Solo una vez</option>
          </select></div>
        <button className="btn primary" disabled={busy} style={{ width: "100%", marginTop: 4 }}>{busy ? "Guardando…" : "Guardar"}</button>
      </form>
    </Modal>
  );
}

function GoalModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [icon, setIcon] = useState("🎯");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await addGoal({ name, target_amount: Number(target), deadline: deadline || null, icon });
    onSaved();
  }

  return (
    <Modal title="Nueva meta de ahorro" onClose={onClose}>
      <form onSubmit={save}>
        <div className="frow">
          <div className="field" style={{ flex: 1 }}><label>Nombre</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Viaje a Chile" autoFocus /></div>
          <div className="field" style={{ width: 84 }}><label>Ícono</label>
            <input value={icon} onChange={(e) => setIcon(e.target.value)} /></div>
        </div>
        <div className="field"><label>Monto objetivo</label>
          <input type="number" required min="1" step="any" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="2000" /></div>
        <div className="field"><label>Fecha límite (opcional)</label>
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></div>
        <button className="btn primary" disabled={busy} style={{ width: "100%", marginTop: 4 }}>{busy ? "Guardando…" : "Crear meta"}</button>
      </form>
    </Modal>
  );
}

function ContributeModal({ goal, currency, onClose, onSaved }: {
  goal: Goal;
  currency: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const falta = Math.max(0, Number(goal.target_amount) - Number(goal.current_amount));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await contributeToGoal(goal.id, Math.abs(Number(amount)));
    onSaved();
  }

  return (
    <Modal title={`Aportar a ${goal.icon ?? "🎯"} ${goal.name}`} onClose={onClose}>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
        Te faltan <b className="tnum" style={{ color: "var(--ink)" }}>{fmtMoney(falta, currency)}</b> para lograrla.
      </p>
      <form onSubmit={save}>
        <div className="field"><label>Monto a aportar</label>
          <input type="number" required min="1" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100" autoFocus /></div>
        <button className="btn primary" disabled={busy} style={{ width: "100%", marginTop: 4 }}>{busy ? "Guardando…" : "Aportar"}</button>
      </form>
    </Modal>
  );
}

function BudgetModal({ cat, currency, onClose, onSaved }: {
  cat: Category;
  currency: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [value, setValue] = useState(cat.budget ? String(cat.budget) : "");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const n = Number(value);
    await updateCategoryBudget(cat.id, n > 0 ? n : null);
    onSaved();
  }

  return (
    <Modal title={`Presupuesto de ${cat.icon ?? ""} ${cat.name}`} onClose={onClose}>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
        Tope mensual en {currency}. Déjalo vacío (o 0) para quitar el presupuesto.
      </p>
      <form onSubmit={save}>
        <div className="field"><label>Monto mensual</label>
          <input type="number" min="0" step="any" value={value} onChange={(e) => setValue(e.target.value)} placeholder="300000" autoFocus /></div>
        <button className="btn primary" disabled={busy} style={{ width: "100%", marginTop: 4 }}>{busy ? "Guardando…" : "Guardar"}</button>
      </form>
    </Modal>
  );
}

function Head() {
  return (
    <div className="page-head">
      <div className="eyebrow">
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--fin)", display: "inline-block" }} /> Área
      </div>
      <h1>Finanzas</h1>
      <p>Gastos, presupuestos, deudas y metas de ahorro.</p>
    </div>
  );
}

function TxRow({ t, catById, accById, currency, onDelete }: {
  t: Tx;
  catById: Map<string, Category>;
  accById: Map<string, Account>;
  currency: string;
  onDelete?: () => void;
}) {
  const cat = t.category_id ? catById.get(t.category_id) : undefined;
  const acc = t.account_id ? accById.get(t.account_id) : undefined;
  const neg = t.type === "expense";
  return (
    <div className="txrow">
      <span className="txicon">{cat?.icon ?? (neg ? "💸" : "💰")}</span>
      <div className="txmeta">
        <b>{t.description || cat?.name || (neg ? "Gasto" : "Ingreso")}</b>
        <small>{t.date}, {cat?.name ?? "sin categoría"}{acc ? `, ${acc.name}` : ""}{t.source !== "manual" ? `, ${t.source}` : ""}</small>
      </div>
      <b className={"tnum txamt " + (neg ? "neg" : "pos")}>{neg ? "−" : "+"}{fmtMoney(Number(t.amount), acc?.currency ?? currency)}</b>
      {onDelete && <button className="xdel" aria-label="Eliminar" onClick={onDelete}><Trash2 size={14} /></button>}
    </div>
  );
}

function TxModal({ categories, accounts, onClose, onSaved }: {
  categories: Category[];
  accounts: Account[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [type, setType] = useState<Tx["type"]>("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [date, setDate] = useState(hoyLocal());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const cats = categories.filter((c) => (type === "income" ? c.type === "income" : c.type !== "income"));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await addTransaction({
        date,
        amount: Math.abs(Number(amount)),
        type,
        description,
        category_id: categoryId || null,
        account_id: accountId || null,
      });
      onSaved();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
      setBusy(false);
    }
  }

  return (
    <Modal title="Registrar movimiento" onClose={onClose}>
      <div className="seg">
        <button className={"segbtn" + (type === "expense" ? " active" : "")} onClick={() => setType("expense")} type="button">Gasto</button>
        <button className={"segbtn" + (type === "income" ? " active" : "")} onClick={() => setType("income")} type="button">Ingreso</button>
      </div>
      {err && <div className="msg err" style={{ fontSize: 12.5, padding: "8px 10px", borderRadius: 8, background: "color-mix(in srgb,var(--err) 12%,var(--paper))", borderLeft: "3px solid var(--err)", marginBottom: 10 }}>{err}</div>}
      <form onSubmit={save}>
        <div className="field"><label>Monto</label>
          <input type="number" required min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="36000" autoFocus /></div>
        <div className="field"><label>Descripción</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Frutillas y frambuesas" /></div>
        <div className="frow">
          <div className="field"><label>Categoría</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Sin categoría</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select></div>
          <div className="field"><label>Cuenta</label>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              <option value="">Sin cuenta</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select></div>
        </div>
        <div className="field"><label>Fecha</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <button className="btn primary" disabled={busy} style={{ width: "100%", marginTop: 4 }}>{busy ? "Guardando…" : "Guardar"}</button>
      </form>
    </Modal>
  );
}

function AccountModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { currency: defaultCurrency } = useSettings();
  const [name, setName] = useState("");
  const [bank, setBank] = useState("");
  const [type, setType] = useState("Checking");
  const [balance, setBalance] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await addAccount({ name, bank_name: bank || null, account_type: type, balance: Number(balance || 0), currency });
    onSaved();
  }

  return (
    <Modal title="Agregar cuenta" onClose={onClose}>
      <form onSubmit={save}>
        <div className="field"><label>Nombre</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Cuenta corriente" autoFocus /></div>
        <div className="field"><label>Banco (opcional)</label>
          <input value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Banco Estado" /></div>
        <div className="frow">
          <div className="field"><label>Tipo</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="Checking">Corriente</option>
              <option value="Savings">Ahorro</option>
              <option value="Cash">Efectivo</option>
              <option value="Investment">Inversión</option>
            </select></div>
          <div className="field"><label>Moneda</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select></div>
        </div>
        <div className="field"><label>Saldo inicial</label>
          <input type="number" step="any" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="0" /></div>
        <button className="btn primary" disabled={busy} style={{ width: "100%", marginTop: 4 }}>{busy ? "Guardando…" : "Guardar"}</button>
      </form>
    </Modal>
  );
}

function CategoryModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<Category["type"]>("expense");
  const [icon, setIcon] = useState("🏷️");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await addCategory({ name, type, icon });
    onSaved();
  }

  return (
    <Modal title="Agregar categoría" onClose={onClose}>
      <form onSubmit={save}>
        <div className="frow">
          <div className="field" style={{ flex: 1 }}><label>Nombre</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Mascotas" autoFocus /></div>
          <div className="field" style={{ width: 84 }}><label>Ícono</label>
            <input value={icon} onChange={(e) => setIcon(e.target.value)} /></div>
        </div>
        <div className="field"><label>Tipo</label>
          <select value={type} onChange={(e) => setType(e.target.value as Category["type"])}>
            <option value="expense">Gasto</option>
            <option value="income">Ingreso</option>
            <option value="savings">Ahorro</option>
          </select></div>
        <button className="btn primary" disabled={busy} style={{ width: "100%", marginTop: 4 }}>{busy ? "Guardando…" : "Guardar"}</button>
      </form>
    </Modal>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="tp-overlay" onClick={onClose}>
      <div className="tp" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 430 }}>
        <h3 style={{ marginBottom: 14 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}
