import { IconField } from "../components/IconField";
import { useIdioma } from "../idioma/IdiomaProvider";
import { CampoFecha } from "../components/CampoFecha";
import { fmtFechaLocal, hoyLocal, mesActualLocal } from "../lib/fechas";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Pencil, Plus, Scissors, Trash2, Wallet } from "lucide-react";
import { MetasDeArea } from "../components/MetasDeArea";
import { Selector } from "../components/Selector";
import { ReciboCard } from "./ReciboCard";
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
  patronDesde,
  sugerenciaComercio,
  saveMerchantRule,
  splitTransaction,
  listAccounts,
  listCards,
  listDebts,
  listGoals,
  listReminders,
  listTransactions,
  seedCategoriesIfEmpty,
  updateAccount,
  updateCard,
  updateCategory,
  updateCategoryBudget,
  updateDebt,
  updateGoal,
  updateTransaction,
} from "./data";
import { StatementImportError, parseStatementFile, type StatementImportRow } from "./statementImport";
import { interesMensual, ordenarDeudas, simularPlan, type Estrategia } from "./debtPlan";
import { modoDe, resumenPresupuesto } from "./budgeting";
import { CURRENCIES, useSettings } from "../settings/SettingsProvider";
import {
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_LABELS,
  BUDGET_MODE_LABELS,
  daysUntil,
  dueLabel,
  fmtMoney,
  modoPrivado,
  setModoPrivado,
  nextOccurrence,
  type Account,
  type Category,
  type CreditCard,
  type Debt,
  type Goal,
  type Reminder,
  type Tx,
} from "./types";
import { listObjectives, updateObjective, type Objective } from "../objetivos/data";

type TabKey = "resumen" | "transacciones" | "metas" | "deudas" | "cuentas" | "categorias" | "reporte";

export function FinanzasPage() {
  const [tab, setTab] = useState<TabKey>("resumen");
  // El ojito: con el modo privado activo, todos los montos se enmascaran.
  const [privado, setPrivado] = useState(modoPrivado());
  const { t: tr } = useIdioma();

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
  const [editTx, setEditTx] = useState<Tx | null>(null);
  const [splitTx, setSplitTx] = useState<Tx | null>(null);
  const [vistaTx, setVistaTx] = useState<"revisar" | "archivo">("revisar");
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [editCard, setEditCard] = useState<CreditCard | null>(null);
  const [editDebt, setEditDebt] = useState<Debt | null>(null);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [metasDireccion, setMetasDireccion] = useState<Objective[]>([]);
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
    // Metas de Dirección del área Finanzas: para que una meta de ahorro
    // nueva pueda empujarlas desde su creación. Opcional, sin drama si falta.
    try {
      setMetasDireccion((await listObjectives()).filter((o) => o.status !== "lograda" && o.area === "finanzas"));
    } catch { /* Dirección sin migrar */ }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const accById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  const resolveDest = useCallback((t: Tx): string | null => {
    const kind = t.destination_kind ?? (t.destination_account_id ? "account" : null);
    const ref = t.destination_ref ?? t.destination_account_id;
    if (!kind || !ref) return null;
    if (kind === "account") return accById.get(ref)?.name ?? null;
    if (kind === "card") { const c = cards.find((x) => x.id === ref); return c ? `la tarjeta ${c.name}` : null; }
    if (kind === "debt") { const d = debts.find((x) => x.id === ref); return d ? `la deuda ${d.name}` : null; }
    const g = goals.find((x) => x.id === ref);
    return g ? `la meta ${g.name}` : null;
  }, [accById, cards, debts, goals]);

  // Filtros de la pestaña Transacciones (como en Fluxney)
  const [fq, setFq] = useState("");
  const [mesesAbiertos, setMesesAbiertos] = useState<Set<string>>(() => new Set([mesActualLocal()]));
  const [fType, setFType] = useState<"all" | Tx["type"]>("all");
  const [fCat, setFCat] = useState("all");
  const [fAcc, setFAcc] = useState("all");
  const filteredTxs = useMemo(() => {
    const q = fq.trim().toLowerCase();
    return txs.filter((t) => {
      if (fType !== "all" && t.type !== fType) return false;
      if (fCat !== "all" && t.category_id !== (fCat === "none" ? null : fCat)) return false;
      if (fAcc !== "all") {
        const enOrigen = t.account_id === fAcc;
        const enDestino = (t.destination_ref ?? t.destination_account_id) === fAcc;
        if (!enOrigen && !enDestino) return false;
      }
      if (q) {
        const texto = [
          t.description,
          t.merchant,
          t.bank_ref,
          t.category_id ? catById.get(t.category_id)?.name : "",
          t.account_id ? accById.get(t.account_id)?.name : "",
        ].filter(Boolean).join(" ").toLowerCase();
        if (!texto.includes(q)) return false;
      }
      return true;
    });
  }, [txs, fq, fType, fCat, fAcc, catById, accById]);

  const month = mesActualLocal();
  const monthTxs = txs.filter((t) => t.date.startsWith(month));
  const ingresos = monthTxs.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const gastos = monthTxs.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const balanceTotal = accounts.reduce((s, a) => s + Number(a.balance), 0);
  const currency = accounts[0]?.currency ?? defaultCurrency;

  const budgetCats = categories.filter((c) => c.type === "expense" && Number(c.budget) > 0 && !c.exclude_from_budget);
  const deudaTotal = debts.reduce((s, d) => s + Number(d.balance), 0) + cards.reduce((s, c) => s + Number(c.balance), 0);
  const patrimonio = balanceTotal - deudaTotal;

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
        ).map(([k]) => (
          <button key={k} className={"ftab" + (tab === k ? " active" : "")} onClick={() => setTab(k)}>
            {tr("tab.fin." + k)}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        <button className="btn ghost" title={privado ? "Mostrar los montos" : "Ocultar los montos para mostrar la app sin mostrar tu plata"}
          aria-label={privado ? "Mostrar los montos" : "Ocultar los montos"}
          onClick={() => { setModoPrivado(!privado); setPrivado(!privado); }}>
          {privado ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
        <button className="btn ghost" onClick={() => setModal("import")}>{tr("btn.importarcartola")}</button>
        <button className="btn primary" onClick={() => setModal("tx")}>
          <Plus size={15} style={{ verticalAlign: "-2px", marginRight: 5 }} />
          {tr("btn.registrar")}
        </button>
      </div>

      {error && <div className="card pad" style={{ borderLeft: "3px solid var(--err)", marginBottom: 14 }}>{error}</div>}
      {loading ? (
        <p style={{ color: "var(--muted)" }}>{tr("cargando")}</p>
      ) : (
        <>
          {tab === "resumen" && (
            <>
              <div className="statrow" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
                <div className="card stat"><div className="k">{tr("stat.fin.balance")}</div><div className="v tnum">{fmtMoney(balanceTotal, currency)}</div></div>
                <div className="card stat"><div className="k">{tr("stat.fin.deuda")}</div><div className="v tnum" style={deudaTotal > 0 ? { color: "var(--err)" } : undefined}>{fmtMoney(deudaTotal, currency)}</div></div>
                <div className="card stat"><div className="k">{tr("stat.fin.patrimonio")}</div><div className="v tnum" style={{ color: patrimonio >= 0 ? "var(--ok)" : "var(--err)" }}>{fmtMoney(patrimonio, currency)}</div></div>
                <div className="card stat"><div className="k">{tr("stat.fin.ingresos")}</div><div className="v tnum" style={{ color: "var(--ok)" }}>{fmtMoney(ingresos, currency)}</div></div>
                <div className="card stat"><div className="k">{tr("stat.fin.gastos")}</div><div className="v tnum" style={{ color: "var(--err)" }}>{fmtMoney(gastos, currency)}</div></div>
              </div>
              <div className="panelgrid">
                <div className="card panel">
                  <h3>{tr("Gasto por categoría (este mes)")}</h3>
                  {gastoPorCategoria.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13.5 }}>Aún no hay gastos este mes. Usa "Registrar" para empezar.</p>}
                  {gastoPorCategoria.map(({ cat, total }) => (
                    <div className="bar" key={cat?.id ?? "otros"}>
                      <div className="top">
                        <span className="lbl">{cat?.icon} {cat?.name ?? tr("Sin categoría")}</span>
                        <b className="tnum">{fmtMoney(total, currency)}</b>
                      </div>
                      <div className="track">
                        <div className="fill" style={{ width: `${gastos ? Math.round((total / gastos) * 100) : 0}%`, background: "var(--fin)" }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="card panel">
                  <h3>{tr("Últimos movimientos")}</h3>
                  {txs.slice(0, 6).map((t) => (
                    <TxRow key={t.id} t={t} catById={catById} accById={accById} currency={currency} resolveDest={resolveDest} />
                  ))}
                  {txs.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13.5 }}>Nada aún por aquí.</p>}
                </div>
              </div>

              <div className="card panel" style={{ marginTop: 14 }}>
                <h3>{tr("Presupuestos del mes")}</h3>
                {budgetCats.length === 0 && (
                  <p style={{ color: "var(--muted)", fontSize: 13.5 }}>
                    {tr("Aún no defines presupuestos. Ve a")} <b>{tr("tab.fin.categorias")}</b> {tr("y asigna un tope mensual con el lápiz ✎.")}
                  </p>
                )}
                {budgetCats.map((c) => {
                  const r = resumenPresupuesto(c, txs, month);
                  const pct = Math.min(100, Math.round(r.pct));
                  const enAlerta = !r.excedido && r.pct >= r.umbral;
                  return (
                    <div className="bar" key={c.id}>
                      <div className="top">
                        <span className="lbl">
                          {c.icon} {c.name}
                          {r.arrastre > 0 && <span className="chip" style={{ marginLeft: 6, fontSize: 10 }}>arrastre +{fmtMoney(r.arrastre, currency)}</span>}
                        </span>
                        <b className="tnum" style={r.excedido ? { color: "var(--err)" } : enAlerta ? { color: "var(--warn)" } : undefined}>
                          {fmtMoney(r.gastado, currency)} / {fmtMoney(r.disponible, currency)}{r.excedido ? ", te pasaste" : enAlerta ? ", cerca del tope" : ""}
                        </b>
                      </div>
                      <div className="track">
                        <div className="fill" style={{ width: `${pct}%`, background: r.excedido ? "var(--err)" : enAlerta ? "var(--warn)" : "var(--fin)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {tab === "transacciones" && (() => {
            // Consolidación de gastos: lo sin categoría espera en la bandeja,
            // y al categorizarlo pasa solo al archivo mensual.
            const pendientes = filteredTxs.filter((t) => t.type !== "transfer" && !t.category_id);
            const archivadas = filteredTxs.filter((t) => t.type === "transfer" || Boolean(t.category_id));
            return (
            <>
              <ReciboCard categories={categories} accounts={accounts} currency={currency} onSaved={() => void reload()} />
              <div className="seg" style={{ maxWidth: 440 }}>
                <button className={"segbtn" + (vistaTx === "revisar" ? " active" : "")} onClick={() => setVistaTx("revisar")}>
                  📥 Por revisar{pendientes.length > 0 ? ` (${pendientes.length})` : ""}
                </button>
                <button className={"segbtn" + (vistaTx === "archivo" ? " active" : "")} onClick={() => setVistaTx("archivo")}>
                  🗂 Archivo
                </button>
              </div>
              <div className="filterbar">
                <div className="searchbox" style={{ minWidth: 200 }}>
                  <input value={fq} onChange={(e) => setFq(e.target.value)} placeholder="Buscar movimientos…" aria-label="Buscar movimientos" />
                </div>
                <div style={{ width: 150 }}>
                  <Selector compacto value={fType} ariaLabel="Filtrar por tipo"
                    opciones={[
                      { value: "all", label: "Todos los tipos" },
                      { value: "expense", label: "Gastos" },
                      { value: "income", label: "Ingresos" },
                      { value: "transfer", label: "Transferencias" },
                    ]}
                    onChange={(v) => setFType(v as typeof fType)} />
                </div>
                <div style={{ width: 185 }}>
                  <Selector compacto value={fCat} ariaLabel="Filtrar por categoría"
                    opciones={[
                      { value: "all", label: "Todas las categorías" },
                      { value: "none", label: "Sin categoría" },
                      ...categories.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` })),
                    ]}
                    onChange={setFCat} />
                </div>
                <div style={{ width: 210 }}>
                  <Selector compacto value={fAcc} ariaLabel="Filtrar por cuenta o tarjeta"
                    opciones={[
                      { value: "all", label: "Todas las cuentas y tarjetas" },
                      ...accounts.map((a) => ({ value: a.id, label: a.name })),
                      ...cards.map((c) => ({ value: c.id, label: `💳 ${c.name}` })),
                    ]}
                    onChange={setFAcc} />
                </div>
              </div>
              {vistaTx === "revisar" && (
                <div className="card pad">
                  {pendientes.length === 0 ? (
                    <p style={{ color: "var(--muted)", fontSize: 14 }}>
                      🎉 Bandeja limpia: todo está categorizado y descansando en el Archivo. Consolidación al día.
                    </p>
                  ) : (
                    <>
                      <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 8 }}>
                        Ponles categoría con el lápiz (o divídelas con la tijera) y se archivan solas.
                      </p>
                      {pendientes.map((t) => (
                        <TxRow key={t.id} t={t} catById={catById} accById={accById} currency={currency} resolveDest={resolveDest}
                          onEdit={() => setEditTx(t)}
                          onSplit={() => setSplitTx(t)}
                          onDelete={async () => { if (!window.confirm("¿Eliminar este movimiento? El saldo de la cuenta se ajustará.")) return; await deleteTransaction(t); void reload(); }} />
                      ))}
                    </>
                  )}
                </div>
              )}
              {vistaTx === "archivo" && (
              <div className="card pad">
                {txs.length === 0 && <p style={{ color: "var(--muted)" }}>Sin transacciones. Presiona "Registrar" para la primera.</p>}
                {txs.length > 0 && archivadas.length === 0 && <p style={{ color: "var(--muted)" }}>Aún no hay movimientos archivados: categoriza los de la bandeja y llegan solos aquí.</p>}
                {(() => {
                  // Agrupadas por mes para que la lista no sea gigante (pedido de la usuaria).
                  const grupos = new Map<string, Tx[]>();
                  for (const t of archivadas) {
                    const k = t.date.slice(0, 7);
                    const lista = grupos.get(k) ?? [];
                    lista.push(t);
                    grupos.set(k, lista);
                  }
                  return [...grupos.entries()].map(([mes, lista]) => {
                    const abierto = mesesAbiertos.has(mes);
                    const gastosMes = lista.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
                    const ingresosMes = lista.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
                    const [y, m] = mes.split("-").map(Number);
                    const nombre = new Date(y, m - 1, 1).toLocaleDateString("es-CL", { month: "long", year: "numeric" });
                    return (
                      <div key={mes}>
                        <button type="button" className="mes-head" aria-expanded={abierto}
                          onClick={() => {
                            const next = new Set(mesesAbiertos);
                            if (abierto) next.delete(mes);
                            else next.add(mes);
                            setMesesAbiertos(next);
                          }}>
                          <span className="mes-flecha">{abierto ? "▾" : "▸"}</span>
                          <b>{nombre.charAt(0).toUpperCase() + nombre.slice(1)}</b>
                          <small>{lista.length === 1 ? "1 movimiento" : `${lista.length} movimientos`}</small>
                          <span style={{ flex: 1 }} />
                          {ingresosMes > 0 && <small className="tnum" style={{ color: "var(--ok)" }}>+{fmtMoney(ingresosMes, currency)}</small>}
                          {gastosMes > 0 && <small className="tnum" style={{ color: "var(--err)" }}>−{fmtMoney(gastosMes, currency)}</small>}
                        </button>
                        {abierto && lista.map((t) => (
                          <TxRow key={t.id} t={t} catById={catById} accById={accById} currency={currency} resolveDest={resolveDest}
                            onEdit={() => setEditTx(t)}
                            onSplit={t.type !== "transfer" ? () => setSplitTx(t) : undefined}
                            onDelete={async () => { if (!window.confirm("¿Eliminar este movimiento? El saldo de la cuenta se ajustará.")) return; await deleteTransaction(t); void reload(); }} />
                        ))}
                      </div>
                    );
                  });
                })()}
              </div>
              )}
            </>
            );
          })()}

          {tab === "metas" && (
            <>
              {/* Las metas de Dirección del área Finanzas viven aquí, junto a
                  las de ahorro: son la misma historia contada en dos niveles. */}
              <MetasDeArea area="finanzas" />
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
                        <button className="xdel" aria-label="Editar meta" title="Editar" onClick={() => setEditGoal(g)}><Pencil size={14} /></button>
                        <button className="xdel" aria-label="Eliminar meta" onClick={async () => { if (!window.confirm(`¿Eliminar la meta ${g.name}?`)) return; await deleteGoal(g.id); void reload(); }}><Trash2 size={14} /></button>
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
              {(debts.length > 0 || cards.some((c) => Number(c.balance) > 0)) && (
                <PlanDeudas debts={debts} cards={cards} currency={currency} />
              )}

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
                        <button className="xdel" aria-label="Eliminar recordatorio" onClick={async () => { if (!window.confirm(`¿Eliminar el recordatorio "${r.title}"?`)) return; await deleteReminder(r.id); void reload(); }}><Trash2 size={14} /></button>
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
                        <button className="xdel" aria-label="Editar tarjeta" title="Editar" onClick={() => setEditCard(c)}><Pencil size={14} /></button>
                        <button className="xdel" aria-label="Eliminar tarjeta" onClick={async () => { if (!window.confirm(`¿Eliminar la tarjeta ${c.name}? También se borra su recordatorio de pago.`)) return; await deleteCard(c.id); void reload(); }}><Trash2 size={14} /></button>
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
                        <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{d.institution ?? ""}{d.interest_rate ? `, ${d.interest_rate}% ${tr("de interés")}` : ""}</div>
                      </div>
                      <button className="xdel" aria-label="Editar deuda" title="Editar" onClick={() => setEditDebt(d)}><Pencil size={14} /></button>
                      <button className="xdel" aria-label="Eliminar deuda" onClick={async () => { if (!window.confirm(`¿Eliminar la deuda ${d.name}? También se borra su recordatorio de pago.`)) return; await deleteDebt(d.id); void reload(); }}><Trash2 size={14} /></button>
                    </div>
                    <div className="tnum" style={{ fontFamily: "var(--serif)", fontSize: 19, fontWeight: 500 }}>{fmtMoney(Number(d.balance), d.currency)}</div>
                    {d.min_payment != null && <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 6 }}>pago mínimo {fmtMoney(Number(d.min_payment), d.currency)}</div>}
                    {d.notes && <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>📝 {d.notes}</div>}
                  </div>
                ))}
              </div>
              <button className="btn ghost" style={{ marginTop: 12 }} onClick={() => setModal("debt")}>
                <Plus size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} /> Agregar deuda
              </button>
            </>
          )}

          {tab === "reporte" && (
            <ReporteTab txs={txs} categories={categories} currency={currency} balance={balanceTotal} />
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
                        <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{[ACCOUNT_TYPE_LABELS[a.account_type] ?? a.account_type, a.bank_name].filter(Boolean).join(", ")}</div>
                      </div>
                      <button className="xdel" aria-label="Editar cuenta" title="Editar" onClick={() => setEditAccount(a)}><Pencil size={14} /></button>
                      <button className="xdel" aria-label="Eliminar cuenta" onClick={async () => { if (!window.confirm(`¿Eliminar la cuenta ${a.name}? Sus transacciones quedarán sin cuenta asociada.`)) return; await deleteAccount(a.id); void reload(); }}><Trash2 size={14} /></button>
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
                        {c.type === "income" ? tr("Ingreso") : c.type === "savings" ? tr("Ahorro") : tr("Gasto")}
                        {c.type === "expense" && Number(c.budget) > 0 ? `, ${tr("presupuesto")} ${fmtMoney(Number(c.budget), currency)}` : ""}
                        {c.budget_mode ? `, ${tr(BUDGET_MODE_LABELS[modoDe(c)]).toLowerCase()}` : ""}
                        {c.rollover_fund ? `, ${tr("con arrastre")}` : ""}
                        {c.exclude_from_budget ? `, ${tr("fuera del presupuesto")}` : ""}
                      </div>
                    </div>
                    {c.type === "expense" && (
                      <button className="xdel" aria-label="Editar presupuesto" title="Presupuesto mensual" onClick={() => setBudgetCat(c)}><Wallet size={14} /></button>
                    )}
                    <button className="xdel" aria-label="Editar categoría" title="Editar" onClick={() => setEditCat(c)}><Pencil size={14} /></button>
                    <button className="xdel" aria-label="Eliminar categoría" onClick={async () => { if (!window.confirm(`${tr("¿Eliminar la categoría")} ${c.name}?`)) return; await deleteCategory(c.id); void reload(); }}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
              <button className="btn ghost" style={{ marginTop: 14 }} onClick={() => setModal("category")}>
                <Plus size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} /> {tr("Agregar categoría")}
              </button>
            </>
          )}
        </>
      )}

      {(modal === "tx" || editTx) && (
        <TxModal key={editTx?.id ?? "nuevo"} categories={categories} accounts={accounts}
          cards={cards} debts={debts} goals={goals} edit={editTx}
          onClose={() => { setModal(null); setEditTx(null); }}
          onSaved={() => { setModal(null); setEditTx(null); void reload(); }} />
      )}
      {splitTx && (
        <SplitModal tx={splitTx} categories={categories} currency={accById.get(splitTx.account_id ?? "")?.currency ?? currency}
          onClose={() => setSplitTx(null)}
          onSaved={() => { setSplitTx(null); void reload(); }} />
      )}
      {(modal === "account" || editAccount) && (
        <AccountModal key={editAccount?.id ?? "nueva"} edit={editAccount}
          onClose={() => { setModal(null); setEditAccount(null); }}
          onSaved={() => { setModal(null); setEditAccount(null); void reload(); }} />
      )}
      {(modal === "category" || editCat) && (
        <CategoryModal key={editCat?.id ?? "nueva"} edit={editCat}
          onClose={() => { setModal(null); setEditCat(null); }}
          onSaved={() => { setModal(null); setEditCat(null); void reload(); }} />
      )}
      {budgetCat && (
        <BudgetModal cat={budgetCat} currency={currency} onClose={() => setBudgetCat(null)}
          onSaved={() => { setBudgetCat(null); void reload(); }} />
      )}
      {(modal === "goal" || editGoal) && (
        <GoalModal key={editGoal?.id ?? "nueva"} edit={editGoal} metasDireccion={metasDireccion}
          onClose={() => { setModal(null); setEditGoal(null); }}
          onSaved={() => { setModal(null); setEditGoal(null); void reload(); }} />
      )}
      {contributeGoal && (
        <ContributeModal goal={contributeGoal} accounts={accounts} currency={currency} onClose={() => setContributeGoal(null)}
          onSaved={() => { setContributeGoal(null); void reload(); }} />
      )}
      {(modal === "debt" || editDebt) && (
        <DebtModal key={editDebt?.id ?? "nueva"} currency={defaultCurrency} edit={editDebt}
          onClose={() => { setModal(null); setEditDebt(null); }}
          onSaved={() => { setModal(null); setEditDebt(null); void reload(); }} />
      )}
      {(modal === "card" || editCard) && (
        <CardModal key={editCard?.id ?? "nueva"} currency={defaultCurrency} edit={editCard}
          onClose={() => { setModal(null); setEditCard(null); }}
          onSaved={() => { setModal(null); setEditCard(null); void reload(); }} />
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

function ReporteTab({ txs, categories, currency, balance }: { txs: Tx[]; categories: Category[]; currency: string; balance: number }) {
  const { t: tr } = useIdioma();
  const [ym, setYm] = useState(mesActualLocal());
  const prev = monthAdd(ym, -1);
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // Proyección de flujo de caja (portada de Fluxney): promedio de los últimos
  // 3 meses con arrastre de saldo hacia los próximos 3 meses.
  const proyeccion = useMemo(() => {
    const hoyMes = mesActualLocal();
    const mesesBase = [monthAdd(hoyMes, -1), monthAdd(hoyMes, -2), monthAdd(hoyMes, -3)];
    const conDatos = mesesBase.filter((m) => txs.some((t) => t.date.startsWith(m)));
    if (conDatos.length === 0) return null;
    const suma = (m: string, tipo: "income" | "expense") =>
      txs.filter((t) => t.date.startsWith(m) && t.type === tipo).reduce((s, t) => s + Number(t.amount), 0);
    const promIngresos = conDatos.reduce((s, m) => s + suma(m, "income"), 0) / conDatos.length;
    const promGastos = conDatos.reduce((s, m) => s + suma(m, "expense"), 0) / conDatos.length;
    let saldo = balance;
    const filas: Array<{ mes: string; saldo: number }> = [];
    for (let i = 1; i <= 3; i += 1) {
      saldo = saldo + promIngresos - promGastos;
      filas.push({ mes: monthAdd(hoyMes, i), saldo });
    }
    return { filas, promIngresos, promGastos, mesesUsados: conDatos.length };
  }, [txs, balance]);

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
          <div className="k">{tr("Ingresos")}</div>
          <div className="v tnum" style={{ color: "var(--ok)" }}>{fmtMoney(actual.ingresos, currency)}</div>
          <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>{deltaText(actual.ingresos, anterior.ingresos)}</div>
        </div>
        <div className="card stat">
          <div className="k">{tr("Gastos")}</div>
          <div className="v tnum" style={{ color: "var(--err)" }}>{fmtMoney(actual.gastos, currency)}</div>
          <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>{deltaText(actual.gastos, anterior.gastos)}</div>
        </div>
        <div className="card stat">
          <div className="k">{tr("Resultado del mes")}</div>
          <div className="v tnum" style={{ color: actual.neto >= 0 ? "var(--ok)" : "var(--err)" }}>{fmtMoney(actual.neto, currency)}</div>
          <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>{actual.rows.length} {tr("movimientos")}</div>
        </div>
      </div>
      <div className="card panel">
        <h3>{tr("Gasto por categoría")}</h3>
        {porCategoria.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13.5 }}>{tr("Sin gastos en este mes.")}</p>}
        {porCategoria.map(({ cat, total }) => (
          <div className="bar" key={cat?.id ?? "sin"}>
            <div className="top">
              <span className="lbl">{cat?.icon} {cat?.name ?? tr("Sin categoría")}</span>
              <b className="tnum">{fmtMoney(total, currency)}</b>
            </div>
            <div className="track">
              <div className="fill" style={{ width: `${actual.gastos ? Math.round((total / actual.gastos) * 100) : 0}%`, background: "var(--fin)" }} />
            </div>
          </div>
        ))}
      </div>

      {proyeccion && (
        <div className="card panel" style={{ marginTop: 14 }}>
          <h3>🔮 Proyección de saldo</h3>
          <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 12 }}>
            Si sigues como en {proyeccion.mesesUsados === 1 ? "el último mes" : `los últimos ${proyeccion.mesesUsados} meses`} (ingresos {fmtMoney(Math.round(proyeccion.promIngresos), currency)} y gastos {fmtMoney(Math.round(proyeccion.promGastos), currency)} al mes), tu saldo arrastrado sería:
          </p>
          {proyeccion.filas.map((f) => (
            <div className="txrow" key={f.mes} style={{ padding: "7px 0" }}>
              <div className="txmeta"><b style={{ fontSize: 13 }}>{f.mes}</b></div>
              <b className={"tnum txamt " + (f.saldo >= 0 ? "pos" : "neg")}>{fmtMoney(Math.round(f.saldo), currency)}</b>
            </div>
          ))}
        </div>
      )}
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
            <Selector value={accountId} ariaLabel="Cuenta de destino" placeholder="Sin cuenta" onChange={setAccountId}
              opciones={[{ value: "", label: "Sin cuenta" }, ...accounts.map((a) => ({ value: a.id, label: a.name }))]} /></div>
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

function DebtModal({ currency, edit, onClose, onSaved }: { currency: string; edit?: Debt | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(edit?.name ?? "");
  const [institution, setInstitution] = useState(edit?.institution ?? "");
  const [balance, setBalance] = useState(edit ? String(edit.balance) : "");
  const [rate, setRate] = useState(edit?.interest_rate != null ? String(edit.interest_rate) : "");
  const [minPay, setMinPay] = useState(edit?.min_payment != null ? String(edit.min_payment) : "");
  const [dueDate, setDueDate] = useState(edit?.due_date ?? "");
  const [notes, setNotes] = useState(edit?.notes ?? "");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const payload = {
      name, institution: institution || null, balance: Number(balance || 0),
      interest_rate: rate ? Number(rate) : null, min_payment: minPay ? Number(minPay) : null,
      due_date: dueDate || null, currency: edit?.currency ?? currency,
      notes: notes.trim() || null,
    };
    if (edit) await updateDebt(edit.id, payload);
    else await addDebt(payload);
    onSaved();
  }

  return (
    <Modal title={edit ? "Editar deuda" : "Agregar deuda"} onClose={onClose}>
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
            <CampoFecha value={dueDate} onChange={setDueDate} ariaLabel="Próximo pago" /></div>
        </div>
        <div className="field"><label>Notas (opcional)</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Cuotas restantes, condiciones…" /></div>
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>💡 Si pones fecha de pago, se crea solo un recordatorio mensual.</p>
        <button className="btn primary" disabled={busy} style={{ width: "100%" }}>{busy ? "Guardando…" : "Guardar"}</button>
      </form>
    </Modal>
  );
}

function CardModal({ currency, edit, onClose, onSaved }: { currency: string; edit?: CreditCard | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(edit?.name ?? "");
  const [bank, setBank] = useState(edit?.bank ?? "");
  const [lastFour, setLastFour] = useState(edit?.last_four ?? "");
  const [limit, setLimit] = useState(edit?.credit_limit != null ? String(edit.credit_limit) : "");
  const [balance, setBalance] = useState(edit ? String(edit.balance) : "");
  const [minPay, setMinPay] = useState(edit?.min_payment != null ? String(edit.min_payment) : "");
  const [dueDate, setDueDate] = useState(edit?.due_date ?? "");
  const [apr, setApr] = useState(edit?.apr != null ? String(edit.apr) : "");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const payload = {
      name, bank: bank || null, last_four: lastFour || null,
      credit_limit: limit ? Number(limit) : null, balance: Number(balance || 0),
      min_payment: minPay ? Number(minPay) : null, due_date: dueDate || null,
      apr: apr ? Number(apr) : null,
      currency: edit?.currency ?? currency,
    };
    if (edit) await updateCard(edit.id, payload);
    else await addCard(payload);
    onSaved();
  }

  return (
    <Modal title={edit ? "Editar tarjeta de crédito" : "Agregar tarjeta de crédito"} onClose={onClose}>
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
            <CampoFecha value={dueDate} onChange={setDueDate} ariaLabel="Próximo pago" /></div>
        </div>
        <div className="field"><label>Interés anual % (opcional)</label>
          <input type="number" min="0" step="any" value={apr} onChange={(e) => setApr(e.target.value)} placeholder="21.99" /></div>
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>💡 Si pones fecha de pago, se crea solo un recordatorio mensual. El interés alimenta el plan para salir de deudas.</p>
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
            <CampoFecha value={date} onChange={setDate} ariaLabel="Fecha" conBorrar={false} /></div>
        </div>
        <div className="field"><label>Se repite</label>
          <Selector value={recurrence} ariaLabel="Recurrencia del pago"
            opciones={[
              { value: "monthly", label: "Cada mes" },
              { value: "biweekly", label: "Cada 2 semanas" },
              { value: "oneTime", label: "Solo una vez" },
            ]}
            onChange={(v) => setRecurrence(v as typeof recurrence)} /></div>
        <button className="btn primary" disabled={busy} style={{ width: "100%", marginTop: 4 }}>{busy ? "Guardando…" : "Guardar"}</button>
      </form>
    </Modal>
  );
}

function GoalModal({ edit, metasDireccion, onClose, onSaved }: { edit?: Goal | null; metasDireccion: Objective[]; onClose: () => void; onSaved: () => void }) {
  const { t: tr } = useIdioma();

  const [name, setName] = useState(edit?.name ?? "");
  const [target, setTarget] = useState(edit ? String(edit.target_amount) : "");
  const [current, setCurrent] = useState(edit ? String(edit.current_amount) : "");
  const [deadline, setDeadline] = useState(edit?.deadline ?? "");
  const [icon, setIcon] = useState(edit?.icon ?? "🎯");
  // El puente hacia Dirección: qué meta de vida empuja este ahorro.
  const [objetivoId, setObjetivoId] = useState(edit ? (metasDireccion.find((o) => o.auto_metric === "ahorro_meta" && o.auto_ref === edit.id)?.id ?? "") : "");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    let goalId: string;
    if (edit) {
      await updateGoal(edit.id, {
        name,
        target_amount: Number(target),
        current_amount: Number(current || 0),
        deadline: deadline || null,
        icon,
      });
      goalId = edit.id;
    } else {
      goalId = await addGoal({ name, target_amount: Number(target), deadline: deadline || null, icon });
    }
    if (objetivoId) {
      // La meta de Dirección elegida pasa a alimentarse de este ahorro.
      await updateObjective(objetivoId, { auto_metric: "ahorro_meta", auto_target: null, auto_ref: goalId });
    }
    onSaved();
  }

  return (
    <Modal title={edit ? tr("m.gol.editar") : tr("m.gol.nueva")} onClose={onClose}>
      <form onSubmit={save}>
        <div className="frow">
          <div className="field" style={{ flex: 1 }}><label>{tr("com.nombre")}</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Viaje a Chile" autoFocus /></div>
          <IconField value={icon} onChange={setIcon} />
        </div>
        <div className="frow">
          <div className="field"><label>{tr("m.gol.monto")}</label>
            <input type="number" required min="1" step="any" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="2000" /></div>
          {edit && (
            <div className="field"><label>{tr("m.gol.llevo")}</label>
              <input type="number" min="0" step="any" value={current} onChange={(e) => setCurrent(e.target.value)} /></div>
          )}
        </div>
        <div className="field"><label>Fecha límite (opcional)</label>
          <CampoFecha value={deadline} onChange={setDeadline} ariaLabel="Fecha límite" /></div>
        {metasDireccion.length > 0 && (
          <div className="field">
            <label>{tr("m.gol.empuja")}</label>
            <Selector value={objetivoId} ariaLabel="Meta de Dirección que este ahorro empuja"
              opciones={[{ value: "", label: "Ninguna, este ahorro va solo" }, ...metasDireccion.map((o) => ({ value: o.id, label: `🧭 ${o.title}` }))]}
              onChange={setObjetivoId} />
            {objetivoId && (
              <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                💡 Cada aporte que hagas aquí hará avanzar esa meta en Dirección: su porcentaje será el dinero real aportado.
              </p>
            )}
          </div>
        )}
        <button className="btn primary" disabled={busy} style={{ width: "100%", marginTop: 4 }}>{busy ? "Guardando…" : edit ? "Guardar" : "Crear meta"}</button>
      </form>
    </Modal>
  );
}

function ContributeModal({ goal, accounts, currency, onClose, onSaved }: {
  goal: Goal;
  accounts: Account[];
  currency: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const falta = Math.max(0, Number(goal.target_amount) - Number(goal.current_amount));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const monto = Math.abs(Number(amount));
    if (accountId) {
      // Como en Fluxney: el aporte queda como transferencia hacia la meta,
      // descuenta de la cuenta y la meta avanza por los efectos del movimiento.
      await addTransaction({
        date: hoyLocal(),
        amount: monto,
        type: "transfer",
        description: `Aporte a ${goal.name}`,
        merchant: null,
        category_id: null,
        account_id: accountId,
        destination_kind: "goal",
        destination_ref: goal.id,
      });
    } else {
      await contributeToGoal(goal.id, monto);
    }
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
        <div className="field"><label>Desde la cuenta</label>
          <Selector value={accountId} ariaLabel="Cuenta de origen del aporte" placeholder="Sin cuenta (solo anota el avance)" onChange={setAccountId}
            opciones={[{ value: "", label: "Sin cuenta (solo anota el avance)" }, ...accounts.map((a) => ({ value: a.id, label: a.name }))]} /></div>
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
          Con una cuenta elegida, el aporte queda como transferencia: descuenta de la cuenta y suma a la meta.
        </p>
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
  const { t: tr } = useIdioma();
  return (
    <div className="page-head">
      <div className="eyebrow">
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--fin)", display: "inline-block" }} /> {tr("sec.mivida")}
      </div>
      <h1>{tr("area.finanzas")}</h1>
      <p>{tr("head.sub.finanzas")}</p>
    </div>
  );
}

function TxRow({ t, catById, accById, currency, resolveDest, onDelete, onEdit, onSplit }: {
  t: Tx;
  catById: Map<string, Category>;
  accById: Map<string, Account>;
  currency: string;
  resolveDest?: (t: Tx) => string | null;
  onDelete?: () => void;
  onEdit?: () => void;
  onSplit?: () => void;
}) {
  const cat = t.category_id ? catById.get(t.category_id) : undefined;
  const acc = t.account_id ? accById.get(t.account_id) : undefined;
  const dest = resolveDest ? resolveDest(t) : null;
  const esTransfer = t.type === "transfer";
  const neg = t.type === "expense";
  return (
    <div className="txrow">
      <span className="txicon">{esTransfer ? "🔁" : cat?.icon ?? (neg ? "💸" : "💰")}</span>
      <div className="txmeta">
        <b>{t.merchant || t.description || t.bank_ref || cat?.name || (esTransfer ? "Transferencia" : neg ? "Gasto" : "Ingreso")}</b>
        <small>
          {t.merchant && t.description ? `${t.description}, ` : ""}{t.date}
          {esTransfer
            ? `, transferencia${acc ? ` desde ${acc.name}` : ""}${dest ? ` hacia ${dest}` : ""}`
            : `, ${cat?.name ?? "sin categoría"}${acc ? `, ${acc.name}` : ""}`}
          {t.source !== "manual" ? `, ${t.source}` : ""}
        </small>
      </div>
      <b className={"tnum txamt " + (esTransfer ? "neutral" : neg ? "neg" : "pos")}>{esTransfer ? "⇄ " : neg ? "−" : "+"}{fmtMoney(Number(t.amount), acc?.currency ?? currency)}</b>
      {onSplit && <button className="xdel" aria-label="Dividir boleta" title="Dividir en categorías" onClick={onSplit}><Scissors size={13} /></button>}
      {onEdit && <button className="xdel" aria-label="Editar" title="Editar" onClick={onEdit}><Pencil size={14} /></button>}
      {onDelete && <button className="xdel" aria-label="Eliminar" onClick={onDelete}><Trash2 size={14} /></button>}
    </div>
  );
}

/** Divide una boleta: cada parte con su categoría y monto, sumando el total exacto. */
function SplitModal({ tx, categories, currency, onClose, onSaved }: {
  tx: Tx;
  categories: Category[];
  currency: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  interface Parte { description: string; category_id: string; amount: string }
  const [partes, setPartes] = useState<Parte[]>([
    { description: tx.description || tx.merchant || "", category_id: tx.category_id ?? "", amount: "" },
    { description: "", category_id: "", amount: "" },
  ]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const total = Number(tx.amount);
  const suma = partes.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const restante = Math.round((total - suma) * 100) / 100;
  const listas = partes.filter((p) => Number(p.amount) > 0);
  const puedeGuardar = restante === 0 && listas.length >= 2 && listas.every((p) => p.description.trim());

  function cambiar(i: number, patch: Partial<Parte>) {
    setPartes((prev) => prev.map((p, x) => (x === i ? { ...p, ...patch } : p)));
  }

  async function guardar() {
    setBusy(true);
    setErr(null);
    try {
      await splitTransaction(tx, listas.map((p) => ({
        description: p.description.trim(),
        category_id: p.category_id || null,
        amount: Number(p.amount),
      })));
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  const cats = categories.filter((c) => (tx.type === "expense" ? c.type !== "income" : c.type === "income"));

  return (
    <Modal title="✂️ Dividir la boleta" onClose={onClose}>
      <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 12 }}>
        {tx.merchant || tx.description || "Movimiento"} por <b className="tnum" style={{ color: "var(--ink)" }}>{fmtMoney(total, currency)}</b>.
        Reparte el total entre categorías y cada parte irá a su presupuesto. El saldo de la cuenta no cambia.
      </p>
      {partes.map((p, i) => (
        <div key={i} style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input className="input-inline" style={{ flex: "1 1 120px" }} value={p.description} placeholder={i === 0 ? "Calcetines" : "Frutillas"}
            aria-label={`Descripción de la parte ${i + 1}`} onChange={(e) => cambiar(i, { description: e.target.value })} />
          <div style={{ width: 145, flex: "none" }}>
            <Selector compacto value={p.category_id} ariaLabel={`Categoría de la parte ${i + 1}`} placeholder="Sin categoría"
              opciones={[{ value: "", label: "Sin categoría" }, ...cats.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` }))]}
              onChange={(v) => cambiar(i, { category_id: v })} />
          </div>
          <input className="input-inline tnum" type="number" min="0" step="any" style={{ maxWidth: 95, flex: "none" }} value={p.amount}
            placeholder="monto" aria-label={`Monto de la parte ${i + 1}`} onChange={(e) => cambiar(i, { amount: e.target.value })} />
          {restante > 0 && !p.amount && (
            <button type="button" className="linklike" style={{ fontSize: 11.5 }} onClick={() => cambiar(i, { amount: String(restante) })}>
              el resto
            </button>
          )}
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "4px 0 12px", flexWrap: "wrap" }}>
        <button type="button" className="btn ghost" onClick={() => setPartes((prev) => [...prev, { description: "", category_id: "", amount: "" }])}>
          <Plus size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} /> Otra parte
        </button>
        <span style={{ flex: 1 }} />
        <span className="chip" style={restante !== 0 ? { background: "color-mix(in srgb,var(--warn) 16%,var(--paper))", color: "var(--warn)" } : undefined}>
          {restante === 0 ? "✓ Suma exacta" : restante > 0 ? `Faltan ${fmtMoney(restante, currency)}` : `Sobran ${fmtMoney(-restante, currency)}`}
        </span>
      </div>
      {err && <p style={{ fontSize: 12.5, color: "var(--err)", marginBottom: 10 }}>{err}</p>}
      <button className="btn primary" style={{ width: "100%" }} disabled={!puedeGuardar || busy} onClick={() => void guardar()}>
        {busy ? "Dividiendo…" : `Dividir en ${listas.length || 2} movimientos`}
      </button>
    </Modal>
  );
}

function TxModal({ categories, accounts, cards, debts, goals, edit, onClose, onSaved }: {
  categories: Category[];
  accounts: Account[];
  cards: CreditCard[];
  debts: Debt[];
  goals: Goal[];
  edit?: Tx | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const destinoInicial = edit
    ? (edit.destination_kind && edit.destination_ref
        ? `${edit.destination_kind}:${edit.destination_ref}`
        : edit.destination_account_id
          ? `account:${edit.destination_account_id}`
          : "")
    : "";
  const [type, setType] = useState<Tx["type"]>(edit?.type ?? "expense");
  const { t: tr } = useIdioma();
  const [amount, setAmount] = useState(edit ? String(edit.amount) : "");
  const esDelBanco = Boolean(edit && (edit.source === "cartola" || edit.source === "banco"));
  // La firma del banco: bank_ref (0043), o la descripción en filas antiguas.
  const textoOriginal = edit ? (edit.bank_ref ?? edit.description ?? "") : "";
  // El texto crudo del banco NO es la descripción: en movimientos del banco
  // la descripción parte vacía (o con lo que tú escribiste) y el comercio
  // parte con la sugerencia limpia ("[PR]SEPHORA KELOWNA BC" → "Sephora Kelowna").
  const [description, setDescription] = useState(() =>
    edit ? (esDelBanco && edit.description === textoOriginal ? "" : edit.description ?? "") : "");
  const [merchant, setMerchant] = useState(() =>
    edit?.merchant ? edit.merchant : esDelBanco ? sugerenciaComercio(textoOriginal) : "");
  const [recordar, setRecordar] = useState(true);
  const [categoryId, setCategoryId] = useState(edit?.category_id ?? "");
  const [accountId, setAccountId] = useState(edit ? (edit.account_id ?? "") : (accounts[0]?.id ?? ""));
  const [destino, setDestino] = useState(destinoInicial);
  const [date, setDate] = useState(edit?.date ?? hoyLocal());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const cats = categories.filter((c) => (type === "income" ? c.type === "income" : c.type !== "income"));
  const [destKind, destRef] = destino ? (destino.split(":") as [Tx["destination_kind"], string]) : [null, null];

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (type === "transfer" && destKind === "account" && destRef === accountId) {
      setErr("La cuenta de origen y la de destino no pueden ser la misma.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const payload = {
        date,
        amount: Math.abs(Number(amount)),
        type,
        description,
        merchant: merchant.trim() || null,
        // Filas importadas antes de la 0043: sellamos su firma del banco
        // en bank_ref para que los duplicados y las reglas sigan funcionando.
        ...(esDelBanco && edit && !edit.bank_ref && textoOriginal ? { bank_ref: textoOriginal } : {}),
        category_id: type === "transfer" ? null : (categoryId || null),
        account_id: accountId || null,
        destination_kind: type === "transfer" ? destKind : null,
        destination_ref: type === "transfer" ? destRef : null,
      };
      if (edit) await updateTransaction(edit, payload);
      else await addTransaction(payload);
      // La regla se ofrece al renombrar O al categorizar: transacciones
      // frecuentes (el traspaso a la tarjeta, el súper) se automatizan solas.
      if (esDelBanco && recordar && (merchant.trim() || categoryId)) {
        const nombreRegla = merchant.trim() || edit?.merchant || patronDesde(textoOriginal);
        if (nombreRegla) {
          await saveMerchantRule(textoOriginal, nombreRegla, type === "transfer" ? null : (categoryId || null));
        }
      }
      onSaved();
    } catch (ex) {
      const msg = ex instanceof Error ? ex.message : String(ex);
      setErr(/destination_kind|destination_ref/.test(msg)
        ? "Falta la migración 0011 en Supabase (supabase/migrations/0011_transferencias.sql)."
        : /bank_ref/.test(msg)
          ? "Falta la migración 0043 en Supabase (supabase/migrations/0043_texto_banco.sql)."
          : /merchant/.test(msg)
            ? "Falta la migración 0013 en Supabase (supabase/migrations/0013_comercios.sql)."
            : msg);
      setBusy(false);
    }
  }

  return (
    <Modal title={edit ? tr("m.tx.editar") : tr("m.tx.registrar")} onClose={onClose}>
      <div className="seg">
        <button className={"segbtn" + (type === "expense" ? " active" : "")} onClick={() => setType("expense")} type="button">{tr("m.tx.gasto")}</button>
        <button className={"segbtn" + (type === "income" ? " active" : "")} onClick={() => setType("income")} type="button">{tr("m.tx.ingreso")}</button>
        <button className={"segbtn" + (type === "transfer" ? " active" : "")} onClick={() => setType("transfer")} type="button">{tr("m.tx.transfer")}</button>
      </div>
      {err && <div className="msg err" style={{ fontSize: 12.5, padding: "8px 10px", borderRadius: 8, background: "color-mix(in srgb,var(--err) 12%,var(--paper))", borderLeft: "3px solid var(--err)", marginBottom: 10 }}>{err}</div>}
      <form onSubmit={save}>
        <div className="field"><label>{tr("m.tx.monto")}</label>
          <input type="number" required min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="36000" autoFocus /></div>
        <div className="field"><label>{tr("m.tx.comercio")}</label>
          <input value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="Amazon, Spice Sex, Metro…" /></div>
        <div className="field"><label>{tr("m.tx.desc")}</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="el internet, frutillas, regalo…" /></div>
        {esDelBanco && (merchant.trim() !== "" || categoryId !== "") && (
          <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 12, cursor: "pointer", lineHeight: 1.45 }}>
            <input type="checkbox" checked={recordar} onChange={(e) => setRecordar(e.target.checked)} style={{ width: 15, height: 15, marginTop: 2, accentColor: "var(--accent)" }} />
            <span>
              Automatizar: cuando llegue un movimiento parecido a "{textoOriginal.slice(0, 40)}{textoOriginal.length > 40 ? "…" : ""}",
              {merchant.trim() ? <> llamarlo <b>{merchant.trim()}</b> y</> : ""} usar esta categoría solo. También se aplica a los que ya tienes: solo apruebas, no categorizas de nuevo.
            </span>
          </label>
        )}
        <div className="frow">
          {type !== "transfer" && (
            <div className="field"><label>{tr("m.tx.categoria")}</label>
              <Selector value={categoryId} ariaLabel="Categoría" placeholder="Sin categoría" onChange={setCategoryId}
                opciones={[{ value: "", label: "Sin categoría" }, ...cats.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` }))]} /></div>
          )}
          <div className="field"><label>{type === "transfer" ? "Desde la cuenta" : "Cuenta"}</label>
            <Selector value={accountId} ariaLabel="Cuenta" placeholder="Sin cuenta" onChange={setAccountId}
              opciones={[{ value: "", label: "Sin cuenta" }, ...accounts.map((a) => ({ value: a.id, label: a.name }))]} /></div>
          {type === "transfer" && (
            <div className="field"><label>Hacia</label>
              <Selector value={destino} ariaLabel="Destino de la transferencia" placeholder="Fuera de la app (otro banco)" onChange={setDestino}
                opciones={[
                  { value: "", label: "Fuera de la app (otro banco)" },
                  ...accounts.filter((a) => a.id !== accountId).map((a) => ({ value: `account:${a.id}`, label: `🏦 ${a.name}` })),
                  ...cards.map((c) => ({ value: `card:${c.id}`, label: `💳 ${c.name}${c.last_four ? ` •••• ${c.last_four}` : ""}` })),
                  ...debts.map((d) => ({ value: `debt:${d.id}`, label: `📉 ${d.name}` })),
                  ...goals.map((g) => ({ value: `goal:${g.id}`, label: `${g.icon ?? "🎯"} ${g.name}` })),
                ]} /></div>
          )}
        </div>
        {type === "transfer" && (
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
            {destKind === "card" ? "El pago de la tarjeta baja lo que le debes (su saldo usado)."
              : destKind === "debt" ? "El abono baja el saldo de la deuda."
              : destKind === "goal" ? "El aporte suma al avance de la meta."
              : destKind === "account" ? "Mueve el dinero entre tus cuentas."
              : "Solo se descuenta de la cuenta de origen."}
            {" "}Una transferencia no cuenta como gasto ni ingreso.
          </p>
        )}
        <div className="field"><label>Fecha</label>
          <CampoFecha value={date} onChange={setDate} ariaLabel="Fecha" conBorrar={false} /></div>
        <button className="btn primary" disabled={busy} style={{ width: "100%", marginTop: 4 }}>{busy ? "Guardando…" : "Guardar"}</button>
      </form>
    </Modal>
  );
}

function AccountModal({ edit, onClose, onSaved }: { edit?: Account | null; onClose: () => void; onSaved: () => void }) {
  const { currency: defaultCurrency } = useSettings();
  const [name, setName] = useState(edit?.name ?? "");
  const [bank, setBank] = useState(edit?.bank_name ?? "");
  const [type, setType] = useState(edit?.account_type ?? "Checking");
  const [balance, setBalance] = useState(edit ? String(edit.balance) : "");
  const [currency, setCurrency] = useState(edit?.currency ?? defaultCurrency);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const payload = { name, bank_name: bank || null, account_type: type, balance: Number(balance || 0), currency };
    if (edit) await updateAccount(edit.id, payload);
    else await addAccount(payload);
    onSaved();
  }

  return (
    <Modal title={edit ? "Editar cuenta" : "Agregar cuenta"} onClose={onClose}>
      <form onSubmit={save}>
        <div className="field"><label>Nombre</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Cuenta corriente" autoFocus /></div>
        <div className="field"><label>Banco (opcional)</label>
          <input value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Banco Estado" /></div>
        <div className="frow">
          <div className="field"><label>Tipo</label>
            <Selector value={type} ariaLabel="Tipo de cuenta" onChange={setType}
              opciones={ACCOUNT_TYPES.map((t) => ({ value: t, label: ACCOUNT_TYPE_LABELS[t] }))} /></div>
          <div className="field"><label>Moneda</label>
            <Selector value={currency} ariaLabel="Moneda de la cuenta" onChange={setCurrency}
              opciones={CURRENCIES.map((c) => ({ value: c, label: c }))} /></div>
        </div>
        {type === "Credit Card" && (
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
            Con la tarjeta como cuenta puedes pagar con ella (sus gastos dejan el saldo en negativo) y recibir transferencias cuando la pagas. En Deudas y tarjetas puedes llevar además su cupo y fecha de pago.
          </p>
        )}
        <div className="field"><label>{edit ? "Saldo" : "Saldo inicial"}</label>
          <input type="number" step="any" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="0" /></div>
        <button className="btn primary" disabled={busy} style={{ width: "100%", marginTop: 4 }}>{busy ? "Guardando…" : "Guardar"}</button>
      </form>
    </Modal>
  );
}

function CategoryModal({ edit, onClose, onSaved }: { edit?: Category | null; onClose: () => void; onSaved: () => void }) {
  const { t: tr } = useIdioma();
  const [name, setName] = useState(edit?.name ?? "");
  const [type, setType] = useState<Category["type"]>(edit?.type ?? "expense");
  const [icon, setIcon] = useState(edit?.icon ?? "🏷️");
  const [budgetMode, setBudgetMode] = useState(edit?.budget_mode ?? "");
  const [budget, setBudget] = useState(edit?.budget != null ? String(edit.budget) : "");
  const [rollover, setRollover] = useState(Boolean(edit?.rollover_fund));
  const [exclude, setExclude] = useState(Boolean(edit?.exclude_from_budget));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      if (edit) {
        await updateCategory(edit.id, {
          name, type, icon,
          budget: budget ? Number(budget) : null,
          budget_mode: budgetMode || null,
          exclude_from_budget: exclude,
          rollover_fund: rollover,
        });
      } else {
        await addCategory({ name, type, icon });
      }
      onSaved();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
      setBusy(false);
    }
  }

  return (
    <Modal title={edit ? "Editar categoría" : "Agregar categoría"} onClose={onClose}>
      {err && <div className="alert err" style={{ marginBottom: 10 }}>{err}</div>}
      <form onSubmit={save}>
        <div className="frow">
          <div className="field" style={{ flex: 1 }}><label>{tr("com.nombre")}</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Mascotas" autoFocus /></div>
          <IconField value={icon} onChange={setIcon} />
        </div>
        <div className="field"><label>Tipo</label>
          <Selector value={type} ariaLabel="Tipo de categoría"
            opciones={[
              { value: "expense", label: "Gasto" },
              { value: "income", label: "Ingreso" },
              { value: "savings", label: "Ahorro" },
            ]}
            onChange={(v) => setType(v as Category["type"])} /></div>
        {edit && type === "expense" && (
          <>
            <div className="field"><label>Presupuesto mensual (vacío para quitarlo)</label>
              <input type="number" min="0" step="any" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="300" /></div>
            <div className="field"><label>Modo de presupuesto</label>
              <Selector value={budgetMode} ariaLabel="Modo de presupuesto" placeholder="Sin modo" onChange={setBudgetMode}
                opciones={[
                  { value: "", label: "Sin modo" },
                  { value: "fixed", label: "Fijo (mismo monto cada mes, como el arriendo)" },
                  { value: "flexible", label: "Flexible (varía mes a mes, como la comida)" },
                  { value: "variable", label: "Variable (gastos no mensuales)" },
                ]} /></div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "var(--ink-soft)", marginBottom: 12, cursor: "pointer" }}>
              <input type="checkbox" checked={exclude} onChange={(e) => setExclude(e.target.checked)} style={{ width: 16, height: 16, accentColor: "var(--accent)" }} />
              Excluir del presupuesto (no aparece en los paneles del mes)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "var(--ink-soft)", marginBottom: 12, cursor: "pointer" }}>
              <input type="checkbox" checked={rollover} onChange={(e) => setRollover(e.target.checked)} style={{ width: 16, height: 16, accentColor: "var(--accent)" }} />
              Fondo de arrastre (lo no gastado se acumula para los meses siguientes)
            </label>
          </>
        )}
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

function PlanDeudas({ debts, cards, currency }: { debts: Debt[]; cards: CreditCard[]; currency: string }) {
  const { t: tr } = useIdioma();
  const [estrategia, setEstrategia] = useState<Estrategia>("avalanche");
  const [extra, setExtra] = useState("");

  // Las tarjetas con saldo usado también son deuda: entran al plan con su interés (APR).
  const todas: Debt[] = useMemo(() => [
    ...debts,
    ...cards
      .filter((c) => Number(c.balance) > 0)
      .map((c) => ({
        id: c.id,
        name: `Tarjeta ${c.name}`,
        institution: c.bank,
        balance: c.balance,
        interest_rate: c.apr,
        min_payment: c.min_payment,
        due_date: c.due_date,
        currency: c.currency,
        notes: null,
      })),
  ], [debts, cards]);

  const extraNum = Math.max(0, Number(extra) || 0);
  const totalDeuda = todas.reduce((s, d) => s + Number(d.balance), 0);
  const minimoMensual = todas.reduce((s, d) => s + Number(d.min_payment ?? 0), 0);
  const interesMes = todas.reduce((s, d) => s + interesMensual(d), 0);
  const orden = useMemo(() => ordenarDeudas(todas, estrategia), [todas, estrategia]);
  const plan = useMemo(() => simularPlan(todas, extraNum, estrategia), [todas, extraNum, estrategia]);
  const planSinExtra = useMemo(() => simularPlan(todas, 0, estrategia), [todas, estrategia]);

  function meses(n: number): string {
    if (n < 12) return n === 1 ? "1 mes" : `${n} meses`;
    const a = Math.floor(n / 12);
    const m = n % 12;
    const anios = a === 1 ? "1 año" : `${a} años`;
    return m > 0 ? `${anios} y ${m === 1 ? "1 mes" : `${m} meses`}` : anios;
  }

  return (
    <>
      <div className="statrow" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
        <div className="card stat"><div className="k">{tr("stat.fin.deuda")}</div><div className="v tnum" style={{ color: "var(--err)" }}>{fmtMoney(totalDeuda, currency)}</div></div>
        <div className="card stat"><div className="k">{tr("Mínimo mensual")}</div><div className="v tnum">{fmtMoney(minimoMensual, currency)}</div></div>
        <div className="card stat"><div className="k">{tr("Interés del mes")}</div><div className="v tnum" style={{ color: "var(--warn)" }}>{fmtMoney(Math.round(interesMes), currency)}</div></div>
        <div className="card stat"><div className="k">{tr("Interés anual estimado")}</div><div className="v tnum" style={{ color: "var(--warn)" }}>{fmtMoney(Math.round(interesMes * 12), currency)}</div></div>
      </div>

      <div className="card panel" style={{ marginBottom: 14 }}>
        <h3>{tr("🧭 Plan para salir de deudas")}</h3>
        <div className="seg" style={{ maxWidth: 520 }}>
          <button type="button" className={"segbtn" + (estrategia === "avalanche" ? " active" : "")} onClick={() => setEstrategia("avalanche")}>{tr("Avalancha")}</button>
          <button type="button" className={"segbtn" + (estrategia === "snowball" ? " active" : "")} onClick={() => setEstrategia("snowball")}>{tr("Bola de nieve")}</button>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "8px 0 12px" }}>
          {estrategia === "avalanche"
            ? tr("Avalancha: ataca primero la deuda con mayor interés. Pagas menos intereses en total.")
            : tr("Bola de nieve: ataca primero la deuda más chica. Ganas motivación con cada deuda saldada.")}
        </p>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
          <label style={{ fontSize: 13, color: "var(--ink-soft)", fontWeight: 500 }}>{tr("Dinero extra al mes:")}</label>
          <input className="input-inline" style={{ maxWidth: 140, flex: "none" }} type="number" min="0" step="any"
            value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="100" aria-label="Dinero extra mensual" />
        </div>
        {orden.map((d, i) => (
          <div className="txrow" key={d.id} style={{ padding: "8px 0" }}>
            <span className="txicon" style={{ fontWeight: 700, fontSize: 13 }}>{i + 1}</span>
            <div className="txmeta">
              <b>{d.name}{i === 0 && extraNum > 0 ? " ← aplica aquí el extra" : ""}</b>
              <small>
                {fmtMoney(Number(d.balance), currency)}
                {d.interest_rate ? `, ${d.interest_rate}% ${tr("de interés")}, ${fmtMoney(Math.round(interesMensual(d)), currency)} ${tr("al mes en intereses")}` : `, ${tr("sin interés registrado")}`}
              </small>
            </div>
          </div>
        ))}
        <div style={{ borderTop: "1px solid var(--line-soft)", marginTop: 10, paddingTop: 10, fontSize: 13, color: "var(--ink-soft)", display: "grid", gap: 4 }}>
          {planSinExtra.inalcanzable ? (
            <span style={{ color: "var(--err)" }}>Con los pagos mínimos actuales la deuda no baja. Registra los pagos mínimos de cada deuda o agrega dinero extra.</span>
          ) : (
            <span>Pagando solo los mínimos: libre de deudas en <b>{meses(planSinExtra.meses)}</b>, pagando {fmtMoney(planSinExtra.interesesTotales, currency)} en intereses.</span>
          )}
          {extraNum > 0 && !plan.inalcanzable && (
            <span style={{ color: "var(--ok)" }}>
              Con {fmtMoney(extraNum, currency)} extra al mes: libre en <b>{meses(plan.meses)}</b>, pagando {fmtMoney(plan.interesesTotales, currency)} en intereses.
              {planSinExtra.interesesTotales > plan.interesesTotales && !planSinExtra.inalcanzable
                ? ` Te ahorras ${fmtMoney(planSinExtra.interesesTotales - plan.interesesTotales, currency)}.`
                : ""}
            </span>
          )}
        </div>
      </div>
    </>
  );
}
