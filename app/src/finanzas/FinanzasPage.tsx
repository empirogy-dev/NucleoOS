import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, Wallet } from "lucide-react";
import {
  TablesMissingError,
  addAccount,
  addCategory,
  addTransaction,
  deleteAccount,
  deleteCategory,
  deleteTransaction,
  listAccounts,
  listTransactions,
  seedCategoriesIfEmpty,
  updateCategoryBudget,
} from "./data";
import { CURRENCIES, useSettings } from "../settings/SettingsProvider";
import { fmtMoney, type Account, type Category, type Tx } from "./types";

type TabKey = "resumen" | "transacciones" | "cuentas" | "categorias";

export function FinanzasPage() {
  const [tab, setTab] = useState<TabKey>("resumen");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<"tx" | "account" | "category" | null>(null);
  const [budgetCat, setBudgetCat] = useState<Category | null>(null);
  const { currency: defaultCurrency } = useSettings();

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, c, t] = await Promise.all([listAccounts(), seedCategoriesIfEmpty(), listTransactions()]);
      setAccounts(a);
      setCategories(c);
      setTxs(t);
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

  const month = new Date().toISOString().slice(0, 7);
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
            Ya lo hice — reintentar
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
            ["cuentas", "Cuentas"],
            ["categorias", "Categorías"],
          ] as Array<[TabKey, string]>
        ).map(([k, label]) => (
          <button key={k} className={"ftab" + (tab === k ? " active" : "")} onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
        <span style={{ flex: 1 }} />
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
                          {fmtMoney(spent, currency)} / {fmtMoney(budget, currency)}{over ? " · pasado" : ""}
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
                        {c.type === "expense" && Number(c.budget) > 0 ? ` · presupuesto ${fmtMoney(Number(c.budget), currency)}` : ""}
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
    </div>
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
    <Modal title={`Presupuesto · ${cat.icon ?? ""} ${cat.name}`} onClose={onClose}>
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
        <small>{t.date} · {cat?.name ?? "Sin categoría"}{acc ? ` · ${acc.name}` : ""}{t.source !== "manual" ? ` · ${t.source}` : ""}</small>
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
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
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
              <option value="">— Sin categoría —</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select></div>
          <div className="field"><label>Cuenta</label>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              <option value="">— Sin cuenta —</option>
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
