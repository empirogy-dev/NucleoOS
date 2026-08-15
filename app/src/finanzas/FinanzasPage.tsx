import { IconField } from "../components/IconField";
import { cierreDeFondo, sinRobarFoco } from "../components/cierreDeFondo";
import { useIdioma } from "../idioma/IdiomaProvider";
import { idiomaActual } from "../idioma/actual";
import { CampoFecha } from "../components/CampoFecha";
import { fmtFechaLocal, hoyLocal, mesActualLocal } from "../lib/fechas";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, Eye, EyeOff, Paperclip, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { MetasDeArea } from "../components/MetasDeArea";
import { Selector } from "../components/Selector";
import { listReciboTxIds, listRecibos, uploadRecibo, deleteRecibo, openRecibo, type ReciboFile } from "./recibos";
import { comprimirImagen } from "../lib/comprimir";
import { PALETA_TAGS, addTag, deleteTag, desetiquetarCategoria, desetiquetarTx, etiquetarCategoria, etiquetarTx, listTags, tagsPorCategoria, tagsPorTransaccion, updateTag, type Etiqueta } from "./tags";
import { ChipsEtiquetas } from "./ChipsEtiquetas";
import { RepetidosPanel } from "./RepetidosPanel";
import { GastoPorEtiqueta } from "./GastoPorEtiqueta";
import { PagosTarjetaPanel } from "./PagosTarjetaPanel";
import { AccionesMasivas, PorRevisarAgrupado } from "./PorRevisarAgrupado";
import { HuerfanosPanel } from "./HuerfanosPanel";
import { lineasDe } from "./impuestos";
import { usePaisImpuestos } from "./paisImpuestos";
import { GuiaImpuestos } from "./GuiaImpuestos";
import { ResumenImpuestosPanel } from "./ResumenImpuestos";
import { ComprobantesTab } from "./ComprobantesTab";
import { addCartola, deleteCartola, listCartolas, openCartola, type Cartola } from "./statements";
import { BancoPanel } from "./BancoPanel";
import { EscanearBoleta } from "./EscanearBoleta";
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
  marcarBoletaNoAplica,
  marcarReembolsado,
  ultimaTransaccion,
  updateCategoryTaxLine,
  saldoDeuda,
  saldoTarjeta,
  deleteDebt,
  deleteGoal,
  deleteReminder,
  deleteTransaction,
  firmaMovimiento,
  firmaTx,
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
  monedaDeTx,
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

type TabKey = "resumen" | "transacciones" | "cuentas" | "deudas" | "metas" | "etiquetas" | "categorias" | "reporte";

export function FinanzasPage() {
  const [paisImpuestos] = usePaisImpuestos();
  const [tab, setTab] = useState<TabKey>("resumen");
  // El ojito: con el modo privado activo, todos los montos se enmascaran.
  const [privado, setPrivado] = useState(modoPrivado());
  const { t: tr } = useIdioma();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [debtsCrudas, setDebts] = useState<Debt[]>([]);
  const [cardsCrudas, setCards] = useState<CreditCard[]>([]);
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
  const [reciboTx, setReciboTx] = useState<Tx | null>(null);
  const [reciboIds, setReciboIds] = useState<Set<string>>(new Set());
  // Etiquetas (0057): que movimiento estas etiquetando, el catalogo y el mapa por transaccion.
  const [tagTx, setTagTx] = useState<Tx | null>(null);
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([]);
  const [txTags, setTxTags] = useState<Map<string, Etiqueta[]>>(new Map());
  // Las etiquetas de cada categoría: lo que separa lo personal de lo de la empresa.
  const [catTags, setCatTags] = useState<Map<string, Etiqueta[]>>(new Map());
  const [cartolas, setCartolas] = useState<Cartola[]>([]);
  const [escaneando, setEscaneando] = useState(false);
  // Con muchos pendientes conviene empezar agrupado.
  const [agrupado, setAgrupado] = useState(true);
  const [vistaTx, setVistaTx] = useState<"revisar" | "sinboleta" | "archivo" | "comprobantes" | "cartolas">("revisar");
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
    // Qué movimientos ya tienen boleta adjunta, para el clip en su fila.
    setReciboIds(await listReciboTxIds());
    // Etiquetas: opcionales hasta correr la 0057, la pestaña vive igual sin ellas.
    try {
      const [ets, mapa, porCat] = await Promise.all([listTags(), tagsPorTransaccion(), tagsPorCategoria()]);
      setEtiquetas(ets);
      setTxTags(mapa);
      setCatTags(porCat);
    } catch { /* sin la 0057 todavía */ }
    try {
      setCartolas(await listCartolas());
    } catch { /* sin la 0057 todavía */ }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const accById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  // El saldo de cada deuda y de cada tarjeta sale de sus movimientos, no de
  // un número guardado. Se calcula una vez aquí y baja ya corregido a todas
  // las pantallas. En las tarjetas del banco manda el banco.
  const debts = useMemo(
    () => debtsCrudas.map((d) => ({ ...d, balance: saldoDeuda(d, txs) })),
    [debtsCrudas, txs],
  );
  const cards = useMemo(
    () => cardsCrudas.map((c) => ({ ...c, balance: saldoTarjeta(c, txs).saldo })),
    [cardsCrudas, txs],
  );

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
  const [fTag, setFTag] = useState("all");
  const filteredTxs = useMemo(() => {
    const q = fq.trim().toLowerCase();
    return txs.filter((t) => {
      if (fType !== "all" && t.type !== fType) return false;
      if (fCat !== "all" && t.category_id !== (fCat === "none" ? null : fCat)) return false;
      if (fTag !== "all" && !(txTags.get(t.id) ?? []).some((e) => e.id === fTag)) return false;
      if (fAcc !== "all") {
        // La tarjeta de crédito es fuente de pago, no cuenta. Sin esto,
        // filtrar por una tarjeta no devolvía NADA, aunque tuviera cien
        // movimientos.
        const enOrigen = t.account_id === fAcc || t.payment_source_id === fAcc;
        const enDestino = (t.destination_ref ?? t.destination_account_id) === fAcc;
        if (!enOrigen && !enDestino) return false;
      }
      if (q) {
        // Se busca por lo que la persona escribiría: el nombre, el monto o la
        // fecha. El monto no estaba, así que buscar "156.79" no encontraba
        // nada aunque el movimiento estuviera ahí en pantalla. Y se acepta
        // tanto el punto como la coma, porque uno escribe como le sale.
        const monto = Number(t.amount);
        const texto = [
          t.description,
          t.merchant,
          t.bank_ref,
          t.category_id ? catById.get(t.category_id)?.name : "",
          t.account_id ? accById.get(t.account_id)?.name : "",
          t.payment_source_id ? cards.find((c) => c.id === t.payment_source_id)?.name : "",
          t.date,
          monto.toFixed(2),
          monto.toFixed(2).replace(".", ","),
          String(monto),
        ].filter(Boolean).join(" ").toLowerCase();
        // Y se busca por palabras sueltas: "amazon 156.79" encuentra igual,
        // no importa el orden en que se escriban.
        const partes = q.split(/\s+/).filter(Boolean);
        if (!partes.every((parte) => texto.includes(parte))) return false;
      }
      return true;
    });
  }, [txs, fq, fType, fCat, fAcc, fTag, txTags, catById, accById, cards]);

  const month = mesActualLocal();
  const monthTxs = txs.filter((t) => t.date.startsWith(month));
  const gastos = monthTxs.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const currency = accounts[0]?.currency ?? defaultCurrency;

  const budgetCats = categories.filter((c) => c.type === "expense" && Number(c.budget) > 0 && !c.exclude_from_budget);

  // Los presupuestos ordenados por etiqueta. Una categoría con dos etiquetas
  // sale en las dos: la bencina es personal y de la empresa a la vez, y
  // esconderla de una de las dos vistas sería mentir. Lo que no tiene etiqueta
  // va al final, sin título, tal como se veía antes.
  const gruposPresupuesto = (() => {
    const usadas = etiquetas.filter((e) =>
      budgetCats.some((c) => (catTags.get(c.id) ?? []).some((x) => x.id === e.id)));
    const grupos = usadas.map((e) => {
      const cats = budgetCats.filter((c) => (catTags.get(c.id) ?? []).some((x) => x.id === e.id));
      const resumenes = cats.map((c) => resumenPresupuesto(c, txs, month));
      const gastado = resumenes.reduce((s, r) => s + r.gastado, 0);
      const tope = resumenes.reduce((s, r) => s + r.disponible, 0);
      return { clave: e.id, etiqueta: e, cats, gastado, tope, excedido: gastado > tope };
    });
    const sueltas = budgetCats.filter((c) => (catTags.get(c.id) ?? []).length === 0);
    if (sueltas.length > 0) {
      grupos.push({ clave: "sin-etiqueta", etiqueta: null as unknown as Etiqueta, cats: sueltas, gastado: 0, tope: 0, excedido: false });
    }
    return grupos;
  })();

  // Cada moneda vive aparte: sumar CAD con CLP daría un número mentiroso.
  // La regla vive en un solo lugar (monedaDeTx en types): había dos copias y
  // una se quedó atrás, que es como los gastos de tarjeta terminaron
  // reportando la moneda equivocada.
  const curDeCuenta = new Map(accounts.map((a) => [a.id, a.currency || defaultCurrency]));
  const curDeTarjeta = new Map(cards.map((c) => [c.id, c.currency || defaultCurrency]));
  const monedaDeMovimiento = (t: Tx): string => monedaDeTx(t, curDeCuenta, curDeTarjeta, defaultCurrency);
  const monedas = [...new Set([
    ...accounts.map((a) => a.currency || defaultCurrency),
    ...cards.map((c) => c.currency || defaultCurrency),
  ])];
  const porMoneda = monedas.map((cur) => {
    const bal = accounts.filter((a) => (a.currency || defaultCurrency) === cur).reduce((s, a) => s + Number(a.balance), 0);
    // Solo lo que de verdad se debe. Una tarjeta con saldo negativo está
    // pagada de más: eso es plata a favor, no una deuda, y restarla de lo que
    // debes en otras tarjetas da un número que no existe. La pestaña Deudas
    // ya contaba así, y aquí decía otra cosa: 84 contra 6.416.
    const deu = cards.filter((c) => (c.currency || defaultCurrency) === cur)
      .reduce((s, c) => s + Math.max(0, Number(c.balance)), 0)
      + (cur === currency ? debts.reduce((s, d) => s + Math.max(0, Number(d.balance)), 0) : 0);
    const ing = monthTxs.filter((t) => t.type === "income" && monedaDeMovimiento(t) === cur).reduce((s, t) => s + Number(t.amount), 0);
    const gas = monthTxs.filter((t) => t.type === "expense" && monedaDeMovimiento(t) === cur).reduce((s, t) => s + Number(t.amount), 0);
    return { cur, balance: bal, deuda: deu, patrimonio: bal - deu, ingresos: ing, gastos: gas };
  });

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
          <button className="btn primary" {...sinRobarFoco} style={{ marginTop: 16 }} onClick={() => void reload()}>
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
            ["cuentas", "Cuentas"],
            ["deudas", "Deudas y tarjetas"],
            ["metas", "Metas"],
            ["etiquetas", "Etiquetas"],
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
        <button className="btn primary" {...sinRobarFoco} onClick={() => setModal("tx")}>
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
                <div className="card stat"><div className="k">{tr("stat.fin.balance")}</div><div className="v tnum">
                  {porMoneda.map((m) => <span key={m.cur} style={{ display: "block" }}>{fmtMoney(m.balance, m.cur)}</span>)}
                </div></div>
                <div className="card stat"><div className="k">{tr("stat.fin.deuda")}</div><div className="v tnum">
                  {porMoneda.map((m) => <span key={m.cur} style={{ display: "block", color: m.deuda > 0 ? "var(--err)" : undefined }}>{fmtMoney(m.deuda, m.cur)}</span>)}
                </div></div>
                <div className="card stat"><div className="k">{tr("stat.fin.patrimonio")}</div><div className="v tnum">
                  {porMoneda.map((m) => <span key={m.cur} style={{ display: "block", color: m.patrimonio >= 0 ? "var(--ok)" : "var(--err)" }}>{fmtMoney(m.patrimonio, m.cur)}</span>)}
                </div></div>
                <div className="card stat"><div className="k">{tr("stat.fin.ingresos")}</div><div className="v tnum" style={{ color: "var(--ok)" }}>
                  {porMoneda.filter((m) => m.ingresos > 0 || m.cur === currency).map((m) => <span key={m.cur} style={{ display: "block" }}>{fmtMoney(m.ingresos, m.cur)}</span>)}
                </div></div>
                <div className="card stat"><div className="k">{tr("stat.fin.gastos")}</div><div className="v tnum" style={{ color: "var(--err)" }}>
                  {porMoneda.filter((m) => m.gastos > 0 || m.cur === currency).map((m) => <span key={m.cur} style={{ display: "block" }}>{fmtMoney(m.gastos, m.cur)}</span>)}
                </div></div>
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
                {gruposPresupuesto.map((g) => (
                  <div key={g.clave} style={{ marginBottom: g.etiqueta ? 14 : 0 }}>
                    {/* Agrupados por etiqueta: lo personal por un lado y lo de
                        la empresa por otro, cada uno con su total, que es la
                        pregunta que uno se hace de verdad a fin de mes. */}
                    {g.etiqueta && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "10px 0 6px" }}>
                        <span className="chip" style={g.etiqueta.color
                          ? { background: g.etiqueta.color, color: "#fff", borderColor: g.etiqueta.color }
                          : undefined}>{g.etiqueta.name}</span>
                        <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
                        <b className="tnum" style={{ fontSize: 12.5, color: g.excedido ? "var(--err)" : "var(--muted)" }}>
                          {fmtMoney(g.gastado, currency)} / {fmtMoney(g.tope, currency)}
                        </b>
                      </div>
                    )}
                {g.cats.map((c) => {
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
                ))}
              </div>
              <GastoPorEtiqueta txs={txs} accounts={accounts} cards={cards}
                currency={currency} etiquetas={etiquetas} txTags={txTags} catTags={catTags} />
            </>
          )}

          {tab === "transacciones" && (() => {
            // Consolidación de gastos: lo sin categoría espera en la bandeja,
            // y al categorizarlo pasa solo al archivo mensual.
            // Con una búsqueda escrita, las bandejas estorban: lo que se
            // quiere es el movimiento, esté donde esté.
            const buscando = fq.trim().length > 0;
            const pendientes = filteredTxs.filter((t) => t.type !== "transfer" && !t.category_id);
            // Un gasto está listo cuando tiene categoría Y su comprobante.
            // Categorizado no basta: para los impuestos, un gasto sin boleta
            // no sirve. Por eso el Archivo ya no los deja pasar.
            //
            // Y hay una salida, porque si no la bandeja no llegaría nunca a
            // cero: Spotify, Google One o el interés del banco no van a tener
            // boleta jamás, y una bandeja que no baja se deja de mirar.
            const listo = (t: Tx) =>
              t.type !== "expense" || reciboIds.has(t.id) || Boolean(t.receipt_waived);
            const archivadas = filteredTxs.filter((t) =>
              t.type === "transfer" || (Boolean(t.category_id) && listo(t)));
            const sinBoleta = filteredTxs.filter((t) =>
              t.type === "expense" && Boolean(t.category_id) && !listo(t));
            return (
            <>
              <HuerfanosPanel txs={txs} accounts={accounts} cards={cards} currency={currency} onCambio={() => void reload()} />
              <PagosTarjetaPanel txs={txs} cards={cards} currency={currency} onCambio={() => void reload()} />
              <RepetidosPanel txs={txs} catById={catById} currency={currency}
                conRecibo={reciboIds}
                fuenteDe={(t) => {
                  if (t.payment_source_type === "credit_card") {
                    const c = cards.find((x) => x.id === t.payment_source_id);
                    return c ? `💳 ${c.name}${c.last_four ? ` ••••${c.last_four}` : ""}` : null;
                  }
                  return t.account_id ? accById.get(t.account_id)?.name ?? null : null;
                }}
                onCambio={() => void reload()} />
              <div className="seg" style={{ maxWidth: 560 }}>
                <button className={"segbtn" + (vistaTx === "revisar" ? " active" : "")} onClick={() => setVistaTx("revisar")}>
                  📥 {tr("Por revisar")}{pendientes.length > 0 ? ` (${pendientes.length})` : ""}
                </button>
                <button className={"segbtn" + (vistaTx === "sinboleta" ? " active" : "")} onClick={() => setVistaTx("sinboleta")}>
                  📎 {tr("Sin boleta")}{sinBoleta.length > 0 ? ` (${sinBoleta.length})` : ""}
                </button>
                <button className={"segbtn" + (vistaTx === "archivo" ? " active" : "")} onClick={() => setVistaTx("archivo")}>
                  🗂 {tr("Archivo")}
                </button>
                <button className={"segbtn" + (vistaTx === "comprobantes" ? " active" : "")} onClick={() => setVistaTx("comprobantes")}>
                  🧾 {tr("Comprobantes")}
                </button>
                <button className={"segbtn" + (vistaTx === "cartolas" ? " active" : "")} onClick={() => setVistaTx("cartolas")}>
                  🏦 {tr("Cartolas")}{cartolas.length > 0 ? ` (${cartolas.length})` : ""}
                </button>
              </div>
              {vistaTx !== "comprobantes" && vistaTx !== "cartolas" && (
              <div className="filterbar">
                <div className="searchbox" style={{ minWidth: 200 }}>
                  <input value={fq} onChange={(e) => setFq(e.target.value)} placeholder={tr("Buscar movimientos…")} aria-label="Buscar movimientos" />
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
                      ...accounts.map((a) => ({
                        value: a.id,
                        label: [a.name, a.bank_name, a.currency].filter(Boolean).join(" · "),
                      })),
                      ...cards.map((c) => ({
                        value: c.id,
                        label: `💳 ${[c.name, c.bank, c.last_four ? `••••${c.last_four}` : null, c.currency].filter(Boolean).join(" · ")}`,
                      })),
                    ]}
                    onChange={setFAcc} />
                </div>
                {etiquetas.length > 0 && (
                  <div style={{ width: 185 }}>
                    <Selector compacto value={fTag} ariaLabel={tr("Filtrar por etiqueta")}
                      opciones={[
                        { value: "all", label: tr("Todas las etiquetas") },
                        ...etiquetas.map((e) => ({ value: e.id, label: `🏷 ${e.name}` })),
                      ]}
                      onChange={setFTag} />
                  </div>
                )}
              </div>
              )}
              {vistaTx !== "comprobantes" && vistaTx !== "cartolas" && fTag !== "all" && (() => {
                // El total de la etiqueta filtrada: esto ES el reporte para
                // impuestos (todos los gastos del negocio, de una mirada).
                const et = etiquetas.find((e) => e.id === fTag);
                const gastosEt = filteredTxs.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
                const ingresosEt = filteredTxs.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
                return (
                  <div className="card pad" style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", padding: "10px 16px", marginBottom: 12 }}>
                    <b style={{ fontSize: 13.5 }}>🏷 {et?.name}</b>
                    <small style={{ color: "var(--muted)" }}>{filteredTxs.length} {tr("movimientos")}</small>
                    <span style={{ flex: 1 }} />
                    {gastosEt > 0 && <small className="tnum" style={{ color: "var(--err)", fontWeight: 600 }}>{tr("Gastos")} −{fmtMoney(gastosEt, currency)}</small>}
                    {ingresosEt > 0 && <small className="tnum" style={{ color: "var(--ok)", fontWeight: 600 }}>{tr("Ingresos")} +{fmtMoney(ingresosEt, currency)}</small>}
                  </div>
                );
              })()}
              {vistaTx === "comprobantes" && (
                <ComprobantesTab txs={txs} categories={categories} accounts={accounts} cards={cards} currency={currency} onCambio={() => void reload()} etiquetas={etiquetas} txTags={txTags} catTags={catTags} />
              )}
              {vistaTx === "cartolas" && (
                <div className="card pad" style={{ maxWidth: 720 }}>
                  <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
                    {tr("Cada cartola que subes queda archivada con su cuenta y su mes, con el archivo original para cuando lo pidan.")}
                  </p>
                  {cartolas.length === 0 && (
                    <p style={{ fontSize: 13.5, color: "var(--muted)" }}>{tr("Aún no hay cartolas archivadas. Sube una con el botón Subir cartola.")}</p>
                  )}
                  {cartolas.map((c) => {
                    const fuenteNombre = c.credit_card_id
                      ? `💳 ${cards.find((x) => x.id === c.credit_card_id)?.name ?? tr("Tarjeta")}`
                      : accById.get(c.account_id ?? "")?.name ?? tr("Sin cuenta");
                    const [y, m] = c.period_month.split("-").map(Number);
                    const nombreMes = new Date(y, m - 1, 1).toLocaleDateString(locDeIdiomaFin(), { month: "long", year: "numeric" });
                    return (
                      <div className="txrow" key={c.id}>
                        <span className="txicon">🏦</span>
                        <div className="txmeta">
                          <b>{fuenteNombre}</b>
                          <small>{nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)}, {c.transactions_count} {tr("movimientos")}{c.file_name ? `, ${c.file_name}` : ""}</small>
                        </div>
                        {c.file_path && (
                          <button className="btn ghost" onClick={() => void openCartola(c).catch((e) => window.alert(String(e)))}>{tr("Ver")}</button>
                        )}
                        <button className="xdel" aria-label={tr("Eliminar cartola")}
                          onClick={async () => {
                            if (!window.confirm(tr("¿Eliminar esta cartola del archivo? Los movimientos importados no se tocan."))) return;
                            await deleteCartola(c);
                            setCartolas(await listCartolas());
                          }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              {/* Buscar NO se salta la bandeja. Antes mostraba todo junto y
                  eso confundía: uno está en Por revisar y le aparecían
                  movimientos ya archivados. Cada bandeja filtra lo suyo, y si
                  hay resultados en otras, se dice y se puede saltar allá. */}
              {buscando && vistaTx !== "comprobantes" && vistaTx !== "cartolas" && (() => {
                const aqui = vistaTx === "revisar" ? pendientes.length
                  : vistaTx === "sinboleta" ? sinBoleta.length
                  : archivadas.length;
                const otras = [
                  { k: "revisar" as const, n: pendientes.length, t: tr("Por revisar") },
                  { k: "sinboleta" as const, n: sinBoleta.length, t: tr("Sin boleta") },
                  { k: "archivo" as const, n: archivadas.length, t: tr("Archivo") },
                ].filter((x) => x.k !== vistaTx && x.n > 0);
                const enVista = vistaTx === "revisar" ? pendientes
                  : vistaTx === "sinboleta" ? sinBoleta : archivadas;
                return (
                  <>
                  {/* Arreglar en bloque lo que la búsqueda encontró. Es la
                      salida cuando algo quedó mal en masa: se busca, se ve lo
                      que salió, y se corrige de una vez. */}
                  {enVista.length > 1 && (
                    <AccionesMasivas lista={enVista} categories={categories} accounts={accounts}
                      cards={cards} debts={debts} goals={goals} onCambio={() => void reload()} />
                  )}
                  <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 10 }}>
                    {aqui} {aqui === 1 ? tr("resultado aquí") : tr("resultados aquí")}
                    {otras.length > 0 && (
                      <>
                        {". "}{tr("También hay en")}{" "}
                        {otras.map((x, i) => (
                          <span key={x.k}>
                            {i > 0 ? ", " : ""}
                            <button type="button" className="linklike" style={{ fontSize: 12.5 }}
                              onClick={() => setVistaTx(x.k)}>{x.t} ({x.n})</button>
                          </span>
                        ))}
                      </>
                    )}
                  </p>
                  </>
                );
              })()}
              {vistaTx === "revisar" && (
                <div className="card pad">
                  {pendientes.length === 0 ? (
                    <p style={{ color: "var(--muted)", fontSize: 14 }}>
                      🎉 Bandeja limpia: todo está categorizado y descansando en el Archivo. Consolidación al día.
                    </p>
                  ) : (
                    <>
                      {/* Agrupado por comercio es lo que hace posible una
                          bandeja de doscientos: se decide una vez por
                          comercio, no una vez por movimiento. */}
                      <div className="seg" style={{ maxWidth: 340, marginBottom: 10, display: buscando ? "none" : undefined }}>
                        <button className={"segbtn" + (agrupado ? " active" : "")} onClick={() => setAgrupado(true)}>
                          {tr("Por comercio")}
                        </button>
                        <button className={"segbtn" + (!agrupado ? " active" : "")} onClick={() => setAgrupado(false)}>
                          {tr("Uno por uno")}
                        </button>
                      </div>
                      {agrupado && !buscando ? (
                        <PorRevisarAgrupado txs={pendientes} categories={categories} accounts={accounts} cards={cards} debts={debts} goals={goals} currency={currency}
                          onCambio={() => void reload()} />
                      ) : (
                        <>
                          <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 8 }}>
                            {tr("Abre el lápiz y ahí está todo: categoría, etiquetas, con qué se pagó y la boleta. Guardas una vez y sale de la bandeja.")}
                          </p>
                          {pendientes.map((t) => (
                            <TxRow key={t.id} t={t} catById={catById} accById={accById} currency={currency} resolveDest={resolveDest}
                              onEdit={() => setEditTx(t)}
                              hasRecibo={reciboIds.has(t.id)}
                              tags={txTags.get(t.id)}
                              cardName={t.payment_source_type === "credit_card" ? cards.find((c) => c.id === t.payment_source_id)?.name ?? null : null}
                              onDelete={async () => { if (!window.confirm("¿Eliminar este movimiento? El saldo de la cuenta se ajustará.")) return; await deleteTransaction(t); void reload(); }} />
                          ))}
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
              {vistaTx === "sinboleta" && (
                <div className="card pad">
                  {sinBoleta.length === 0 ? (
                    <p style={{ color: "var(--muted)", fontSize: 14 }}>
                      📎 {tr("Todos los gastos categorizados tienen su boleta. Eso es lo que necesitas para los impuestos.")}
                    </p>
                  ) : (
                    <>
                      <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 8 }}>
                        {tr("Estos ya tienen categoría, pero les falta el comprobante. Abre el lápiz y adjúntalo, o marca ahí mismo que no necesita boleta.")}
                      </p>
                      {sinBoleta.map((t) => (
                        <div key={t.id}>
                          <TxRow t={t} catById={catById} accById={accById} currency={currency} resolveDest={resolveDest}
                            onEdit={() => setEditTx(t)}
                            hasRecibo={false}
                            tags={txTags.get(t.id)}
                            cardName={t.payment_source_type === "credit_card" ? cards.find((c) => c.id === t.payment_source_id)?.name ?? null : null} />

                        </div>
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
                          <span className="mes-tot">
                            {ingresosMes > 0 && <small className="tnum" style={{ color: "var(--ok)" }}>+{fmtMoney(ingresosMes, currency)}</small>}
                            {gastosMes > 0 && <small className="tnum" style={{ color: "var(--err)" }}>−{fmtMoney(gastosMes, currency)}</small>}
                          </span>
                        </button>
                        {abierto && lista.map((t) => (
                          <TxRow key={t.id} t={t} catById={catById} accById={accById} currency={currency} resolveDest={resolveDest}
                            onEdit={() => setEditTx(t)}
                            hasRecibo={reciboIds.has(t.id)}
                            tags={txTags.get(t.id)}
                            cardName={t.payment_source_type === "credit_card" ? cards.find((c) => c.id === t.payment_source_id)?.name ?? null : null}
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

          {tab === "etiquetas" && (() => {
            const anio = hoyLocal().slice(0, 4);
            const stats = etiquetas.map((e) => {
              const mias = txs.filter((t) => (txTags.get(t.id) ?? []).some((x) => x.id === e.id));
              const delAnio = mias.filter((t) => t.date.startsWith(anio));
              return {
                e,
                n: mias.length,
                gastos: delAnio.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0),
                ingresos: delAnio.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0),
              };
            });
            return (
              <div className="card pad" style={{ maxWidth: 720 }}>
                <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
                  {tr("Tus etiquetas cruzan categorías: negocio, personal, impuestos. Los totales son de este año, y Ver la abre filtrada en Transacciones.")}
                </p>
                {stats.length === 0 && (
                  <p style={{ fontSize: 13.5, color: "var(--muted)" }}>
                    {tr("Aún no hay etiquetas. Créalas desde el 🏷 de cualquier movimiento, con tus nombres y colores.")}
                  </p>
                )}
                {stats.map(({ e, n, gastos, ingresos }) => (
                  <div className="txrow" key={e.id}>
                    <span style={{ width: 14, height: 14, borderRadius: "50%", background: e.color ?? "var(--accent)", flex: "none" }} />
                    <div className="txmeta">
                      <b>{e.name}</b>
                      <small>{n} {tr("movimientos")}</small>
                    </div>
                    {gastos > 0 && <small className="tnum" style={{ color: "var(--err)", fontWeight: 600 }}>−{fmtMoney(gastos, currency)}</small>}
                    {ingresos > 0 && <small className="tnum" style={{ color: "var(--ok)", fontWeight: 600 }}>+{fmtMoney(ingresos, currency)}</small>}
                    <button className="btn ghost" onClick={() => { setFTag(e.id); setVistaTx("archivo"); setTab("transacciones"); }}>
                      {tr("Ver")}
                    </button>
                  </div>
                ))}
              </div>
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
                  const desglose = saldoTarjeta(c, txs);
                  const usado = Number(c.balance);
                  const limite = Number(c.credit_limit ?? 0);
                  // Nunca menos de cero: un cupo usado en negativo no existe.
                  const pct = limite > 0 ? Math.max(0, Math.min(100, Math.round((usado / limite) * 100))) : 0;
                  return (
                    <div className="card pad" key={c.id}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 18 }}>💳</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <b style={{ fontSize: 14 }}>{c.name}</b>
                          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{c.bank ?? ""}{c.last_four ? ` •••• ${c.last_four}` : ""}</div>
                        </div>
                        <button className="xdel" aria-label="Editar tarjeta" title="Editar" onClick={() => setEditCard(c)}><Pencil size={14} /></button>
                        <button className="xdel" aria-label="Eliminar tarjeta" onClick={async () => {
                          // Los movimientos NO se borran con la tarjeta, pero
                          // quedan colgando y desaparecen de los filtros. Se
                          // dice antes, y se dice cuántos son.
                          const suyos = txs.filter((t) => t.payment_source_id === c.id).length;
                          const aviso = suyos > 0
                            ? `

${suyos} ${suyos === 1 ? tr("movimiento queda") : tr("movimientos quedan")} ${tr("sin tarjeta. No se borran: los vas a poder devolver desde el aviso que aparece en Transacciones.")}`
                            : "";
                          if (!window.confirm(`${tr("¿Eliminar la tarjeta")} ${c.name}? ${tr("También se borra su recordatorio de pago.")}${aviso}`)) return;
                          await deleteCard(c.id);
                          void reload();
                        }}><Trash2 size={14} /></button>
                      </div>
                      <div className="tnum" style={{ fontFamily: "var(--serif)", fontSize: 19, fontWeight: 500, color: usado < 0 ? "var(--err)" : undefined }}>
                        {fmtMoney(usado, c.currency)}
                      </div>
                      {/* De dónde sale ese número. Cuando un saldo se ve raro,
                          ver la cuenta completa es la diferencia entre
                          arreglarlo y adivinar. */}
                      {!desglose.delBanco && (desglose.cargos > 0 || desglose.pagos > 0) && (
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, lineHeight: 1.5 }}>
                          {tr("Partías en")} {fmtMoney(desglose.inicial, c.currency)}
                          {" · "}{tr("compraste")} {fmtMoney(desglose.cargos, c.currency)}
                          {" · "}{tr("pagaste")} {fmtMoney(desglose.pagos, c.currency)}
                        </div>
                      )}
                      {desglose.delBanco && (
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                          {tr("Saldo entregado por el banco")}
                        </div>
                      )}
                      {usado < 0 && (
                        <div style={{ fontSize: 11.5, color: "var(--err)", marginTop: 4, lineHeight: 1.45 }}>
                          ⚠️ {tr("Saldo negativo: hay pagos anotados dos veces, o falta el saldo con el que partiste. Ábrela con el lápiz y corrige el saldo inicial.")}
                        </div>
                      )}
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
            <>
              <ResumenImpuestosPanel txs={txs} categories={categories} accounts={accounts} cards={cards} currency={currency} />
              <ReporteTab txs={txs} categories={categories} accounts={accounts} cards={cards} currency={currency} />
            </>
          )}

          {tab === "cuentas" && (
            <>
              <BancoPanel onCambio={() => void reload()} />
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
                <Plus size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} /> {tr("Agregar cuenta")}
              </button>

              {cards.length > 0 && (
                <div className="card pad" style={{ marginTop: 18, maxWidth: 720 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                    <b style={{ fontSize: 13.5 }}>💳 {tr("Tus tarjetas")}</b>
                    <small style={{ color: "var(--muted)", flex: 1, minWidth: 200 }}>
                      {tr("Se pueden usar para pagar igual que una cuenta, pero su deuda vive en Deudas y tarjetas.")}
                    </small>
                    <button className="btn ghost" style={{ fontSize: 12.5, padding: "7px 12px" }} onClick={() => setTab("deudas")}>
                      {tr("Ver deudas y tarjetas")}
                    </button>
                  </div>
                  {cards.map((c) => {
                    const cupo = Number(c.credit_limit ?? 0);
                    const usado = Number(c.balance);
                    const pct = cupo > 0 ? Math.min(100, Math.round((usado / cupo) * 100)) : 0;
                    return (
                      <div className="txrow" key={c.id}>
                        <span className="txicon">💳</span>
                        <div className="txmeta">
                          <b>{c.name}{c.last_four ? ` •••• ${c.last_four}` : ""}</b>
                          <small>
                            {tr("Debes")} {fmtMoney(usado, c.currency ?? currency)}
                            {cupo > 0 ? `, ${pct}% ${tr("del cupo")}` : ""}
                            {c.due_date ? `, ${tr("pagas el")} ${c.due_date}` : ""}
                          </small>
                        </div>
                        {cupo > 0 && (
                          <div className="track" style={{ width: 90, flex: "none" }}>
                            <div className="fill" style={{ width: `${pct}%`, background: pct >= 80 ? "var(--err)" : "var(--accent)" }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {tab === "categorias" && (
            <>
              <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))" }}>
                {categories.map((c) => (
                  <div className="card" key={c.id} style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
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
                    {/* La etiqueta puesta aquí vale para todo lo que caiga en
                        esta categoría: así se separa lo personal de lo de la
                        empresa sin marcar gasto por gasto. */}
                    {/* A qué línea del formulario de impuestos suma esta
                        categoría. Vacío por defecto: la decisión es contable
                        y la toma ella, la app solo suma. */}
                    {c.type === "expense" && lineasDe(paisImpuestos).length > 0 && (
                      <div style={{ flexBasis: "100%", minWidth: 0 }}>
                        <Selector compacto value={c.tax_line ?? ""} ariaLabel={tr("Línea de impuestos")}
                          placeholder={tr("Sin línea de impuestos")}
                          opciones={[
                            { value: "", label: tr("Sin línea de impuestos") },
                            ...lineasDe(paisImpuestos).map((l) => ({
                              value: l.numero,
                              // En Chile el código es de la app, no de un
                              // formulario: mostrarlo confundiría.
                              label: paisImpuestos === "CA" ? `${l.es} · ${l.numero}` : l.es,
                            })),
                          ]}
                          onChange={async (v) => { await updateCategoryTaxLine(c.id, v || null); void reload(); }} />
                      </div>
                    )}
                    {etiquetas.length > 0 && (
                      <div style={{ flexBasis: "100%", minWidth: 0 }}>
                        <ChipsEtiquetas
                          etiquetas={etiquetas}
                          puestas={new Set((catTags.get(c.id) ?? []).map((e) => e.id))}
                          tamano={11}
                          onToggle={async (tagId) => {
                            const puesta = (catTags.get(c.id) ?? []).some((e) => e.id === tagId);
                            if (puesta) await desetiquetarCategoria(c.id, tagId);
                            else await etiquetarCategoria(c.id, tagId);
                            setCatTags(await tagsPorCategoria());
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button className="btn ghost" style={{ marginTop: 14 }} onClick={() => setModal("category")}>
                <Plus size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} /> {tr("Agregar categoría")}
              </button>
              <GuiaImpuestos pais={paisImpuestos} />
            </>
          )}
        </>
      )}

      {(modal === "tx" || editTx) && (
        <TxModal key={editTx?.id ?? "nuevo"} categories={categories} accounts={accounts}
          etiquetas={etiquetas} tagsActuales={editTx ? txTags.get(editTx.id) ?? [] : []}
          yaTieneBoleta={editTx ? reciboIds.has(editTx.id) : false}
          onVerBoletas={editTx ? () => { const t = editTx; setEditTx(null); setReciboTx(t); } : undefined}
          onDividir={editTx ? () => { const t = editTx; setEditTx(null); setSplitTx(t); } : undefined}
          cards={cards} debts={debts} goals={goals} edit={editTx}
          onEscanear={() => { setModal(null); setEscaneando(true); }}
          onClose={() => { setModal(null); setEditTx(null); }}
          onSaved={() => { setModal(null); setEditTx(null); void reload(); }} />
      )}
      {splitTx && (
        <SplitModal tx={splitTx} categories={categories} currency={accById.get(splitTx.account_id ?? "")?.currency ?? currency}
          onClose={() => setSplitTx(null)}
          onSaved={() => { setSplitTx(null); void reload(); }} />
      )}
      {escaneando && (
        <EscanearBoleta txs={txs} categories={categories} accounts={accounts} cards={cards} currency={currency} conRecibo={reciboIds}
          onClose={() => setEscaneando(false)}
          onSaved={() => { void reload(); }} />
      )}
      {tagTx && (
        <EtiquetasModal tx={tagTx} etiquetas={etiquetas} asignadas={(txTags.get(tagTx.id) ?? []).map((e) => e.id)}
          onClose={() => setTagTx(null)}
          onChanged={() => {
            void Promise.all([listTags(), tagsPorTransaccion()]).then(([ets, mapa]) => {
              setEtiquetas(ets);
              setTxTags(mapa);
            }).catch(() => undefined);
          }} />
      )}
      {reciboTx && (
        <ReciboModal tx={reciboTx}
          onClose={() => setReciboTx(null)}
          onChanged={() => { void listReciboTxIds().then(setReciboIds); }} />
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
        <ImportModal accounts={accounts} cards={cards} categories={categories} existing={txs} currency={currency}
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

// Un reporte es de UNA moneda. Sumar dólares canadienses con pesos chilenos
// da un número que no existe en ninguna parte, y peor: se ve razonable.
function ReporteTab({ txs, categories, accounts, cards, currency }: {
  txs: Tx[];
  categories: Category[];
  accounts: Account[];
  cards: CreditCard[];
  currency: string;
}) {
  const { t: tr } = useIdioma();
  const [ym, setYm] = useState(mesActualLocal());
  const prev = monthAdd(ym, -1);
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const monedas = useMemo(() => {
    const set = new Set<string>([currency, ...accounts.map((a) => a.currency), ...cards.map((c) => c.currency)]);
    return [...set].filter(Boolean);
  }, [accounts, cards, currency]);
  const [moneda, setMoneda] = useState(currency);

  // Solo los movimientos de esta moneda, y el saldo solo de sus cuentas.
  const suyos = useMemo(() => {
    const porCuenta = new Map(accounts.map((a) => [a.id, a.currency]));
    const porTarjeta = new Map(cards.map((c) => [c.id, c.currency]));
    return txs.filter((t) => monedaDeTx(t, porCuenta, porTarjeta, currency) === moneda);
  }, [txs, accounts, cards, currency, moneda]);

  const balance = useMemo(
    () => accounts.filter((a) => a.currency === moneda).reduce((s, a) => s + Number(a.balance), 0),
    [accounts, moneda],
  );

  // Proyección de flujo de caja (portada de Fluxney): promedio de los últimos
  // 3 meses con arrastre de saldo hacia los próximos 3 meses.
  const proyeccion = useMemo(() => {
    const hoyMes = mesActualLocal();
    const mesesBase = [monthAdd(hoyMes, -1), monthAdd(hoyMes, -2), monthAdd(hoyMes, -3)];
    const conDatos = mesesBase.filter((m) => suyos.some((t) => t.date.startsWith(m)));
    if (conDatos.length === 0) return null;
    const suma = (m: string, tipo: "income" | "expense") =>
      suyos.filter((t) => t.date.startsWith(m) && t.type === tipo).reduce((s, t) => s + Number(t.amount), 0);
    const promIngresos = conDatos.reduce((s, m) => s + suma(m, "income"), 0) / conDatos.length;
    const promGastos = conDatos.reduce((s, m) => s + suma(m, "expense"), 0) / conDatos.length;
    let saldo = balance;
    const filas: Array<{ mes: string; saldo: number }> = [];
    for (let i = 1; i <= 3; i += 1) {
      saldo = saldo + promIngresos - promGastos;
      filas.push({ mes: monthAdd(hoyMes, i), saldo });
    }
    return { filas, promIngresos, promGastos, mesesUsados: conDatos.length };
  }, [suyos, balance]);

  function totals(month: string) {
    const rows = suyos.filter((t) => t.date.startsWith(month));
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
      <div className="frow" style={{ maxWidth: 460, marginBottom: 16 }}>
        <div className="field"><label>{tr("Mes del reporte")}</label>
          <input type="month" value={ym} onChange={(e) => setYm(e.target.value)} /></div>
        {monedas.length > 1 && (
          <div className="field" style={{ maxWidth: 150 }}><label>{tr("Moneda")}</label>
            <Selector value={moneda} ariaLabel={tr("Moneda")}
              opciones={monedas.map((m) => ({ value: m, label: m }))} onChange={setMoneda} /></div>
        )}
      </div>
      <div className="statrow" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        <div className="card stat">
          <div className="k">{tr("Ingresos")}</div>
          <div className="v tnum" style={{ color: "var(--ok)" }}>{fmtMoney(actual.ingresos, moneda)}</div>
          <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>{deltaText(actual.ingresos, anterior.ingresos)}</div>
        </div>
        <div className="card stat">
          <div className="k">{tr("Gastos")}</div>
          <div className="v tnum" style={{ color: "var(--err)" }}>{fmtMoney(actual.gastos, moneda)}</div>
          <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>{deltaText(actual.gastos, anterior.gastos)}</div>
        </div>
        <div className="card stat">
          <div className="k">{tr("Resultado del mes")}</div>
          <div className="v tnum" style={{ color: actual.neto >= 0 ? "var(--ok)" : "var(--err)" }}>{fmtMoney(actual.neto, moneda)}</div>
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
              <b className="tnum">{fmtMoney(total, moneda)}</b>
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
            Si sigues como en {proyeccion.mesesUsados === 1 ? "el último mes" : `los últimos ${proyeccion.mesesUsados} meses`} (ingresos {fmtMoney(Math.round(proyeccion.promIngresos), moneda)} y gastos {fmtMoney(Math.round(proyeccion.promGastos), moneda)} al mes), tu saldo arrastrado sería:
          </p>
          {proyeccion.filas.map((f) => (
            <div className="txrow" key={f.mes} style={{ padding: "7px 0" }}>
              <div className="txmeta"><b style={{ fontSize: 13 }}>{f.mes}</b></div>
              <b className={"tnum txamt " + (f.saldo >= 0 ? "pos" : "neg")}>{fmtMoney(Math.round(f.saldo), moneda)}</b>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function locDeIdiomaFin(): string {
  const i = idiomaActual();
  return i === "en" ? "en-US" : i === "pt" ? "pt-BR" : "es-CL";
}

function ImportModal({ accounts, cards, categories, existing, currency, onClose, onSaved }: {
  accounts: Account[];
  cards: CreditCard[];
  categories: Category[];
  existing: Tx[];
  currency: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t: tr } = useIdioma();
  const [fuenteImp, setFuenteImp] = useState(accounts[0] ? `acc:${accounts[0].id}` : "");
  const accountId = fuenteImp.startsWith("acc:") ? fuenteImp.slice(4) : "";
  const cardImpId = fuenteImp.startsWith("card:") ? fuenteImp.slice(5) : "";
  const [mesCartola, setMesCartola] = useState(mesActualLocal());
  const [archivos, setArchivos] = useState<File[]>([]);
  const [rows, setRows] = useState<Array<StatementImportRow & { dup: boolean }> | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [tipoArchivo, setTipoArchivo] = useState<"csv" | "ofx" | "pdf" | "xlsx">("csv");
  const [leyendo, setLeyendo] = useState(false);
  const [paso, setPaso] = useState("");
  const [excluidos, setExcluidos] = useState<Set<string>>(new Set());
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ imported: number; excluidos: number } | null>(null);

  const dups = rows ? rows.filter((r) => r.dup).length : 0;
  const incluidas = rows ? rows.filter((r) => !excluidos.has(r.id)) : [];

  // Varias cartolas de una vez: el mes se arma de más de un archivo (la
  // cuenta, la tarjeta, el mes partido en dos descargas). Hacerlo de a uno
  // significaba abrir la ventana seis veces.
  const TOPE_ARCHIVOS = 6;

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const elegidos = [...(e.target.files ?? [])].slice(0, TOPE_ARCHIVOS);
    if (elegidos.length === 0) return;
    setErr(null);
    setRows(null);
    setResult(null);
    setLeyendo(true);
    try {
      // El detector de repetidos vale para TODOS los archivos juntos: si el
      // mismo movimiento viene en dos descargas, entra una sola vez.
      const yaEstan = new Set(existing.map(firmaTx));
      const vistas = new Set<string>();
      const todas: Array<StatementImportRow & { dup: boolean }> = [];
      const avisos: string[] = [];
      const fallaron: string[] = [];
      let tipo: "csv" | "ofx" | "pdf" | "xlsx" = "csv";

      for (const [i, file] of elegidos.entries()) {
        setPaso(`${file.name} (${i + 1}/${elegidos.length})`);
        try {
          const parsed = await parseStatementFile(file, categories);
          tipo = parsed.fileType;
          avisos.push(...parsed.warnings);
          for (const r of parsed.rows) {
            const firma = firmaMovimiento(r.date, r.amount, r.description);
            const dup = yaEstan.has(firma) || vistas.has(firma);
            vistas.add(firma);
            // El id lleva el número del archivo: dos archivos distintos
            // pueden traer su propia fila 3 y no deben pisarse.
            todas.push({ ...r, id: `a${i}-${r.id}`, dup });
          }
        } catch (ex) {
          // Un archivo que falla no bota a los demás: se dice cuál fue.
          const msg = ex instanceof StatementImportError && ex.humano ? tr(ex.message)
            : ex instanceof StatementImportError && ex.code === "UNRECOGNIZED_COLUMNS"
              ? tr("No reconocí las columnas del archivo. Exporta la cartola de tu banco como CSV con columnas de fecha, descripción y monto, e intenta de nuevo.")
              : tr("No pude leer el archivo. Verifica que sea la cartola en formato CSV, OFX, QFX o PDF de tu banco.");
          fallaron.push(`${file.name}: ${msg}`);
        }
      }

      if (todas.length === 0) {
        setErr(fallaron.join(" | ") || tr("No encontré movimientos en esos archivos."));
        return;
      }
      if (fallaron.length > 0) setErr(fallaron.join(" | "));

      // Ordenadas por fecha, no por archivo: se revisa como un solo mes.
      todas.sort((a, b) => b.date.localeCompare(a.date));
      setRows(todas);
      setTipoArchivo(tipo);
      setWarnings(avisos);
      setExcluidos(new Set(todas.filter((r) => r.dup).map((r) => r.id)));
    } finally {
      setLeyendo(false);
      setPaso("");
    }
  }

  function alternar(id: string) {
    setExcluidos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function doImport() {
    if (!rows) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await importStatementRows(incluidas, accountId || null, categories, cardImpId || null);
      // La cartola queda archivada con su fuente, su mes y el archivo original.
      try {
        // Cada archivo se guarda por separado: el archivo de cartolas tiene
        // que reflejar lo que ella descargó del banco, no una suma.
        for (const f of archivos) {
          await addCartola({
            file: f,
            account_id: accountId || null,
            credit_card_id: cardImpId || null,
            period_month: mesCartola,
            transactions_count: archivos.length === 1 ? res.imported : 0,
          });
        }
      } catch { /* sin la 0057, el import igual vale */ }
      setResult({ imported: res.imported, excluidos: rows.length - incluidas.length });
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={tr("Importar cartola")} onClose={onClose}>
      {result ? (
        <div>
          <p style={{ fontSize: 14.5, marginBottom: 6 }}>
            {tr("Se importaron")} <b>{result.imported}</b> {tr("movimientos.")}
            {result.excluidos > 0 && <> {tr("Dejaste fuera")} {result.excluidos} {tr("repetidos.")}</>}
          </p>
          <button className="btn primary" {...sinRobarFoco} style={{ width: "100%", marginTop: 10 }} onClick={onSaved}>{tr("Listo")}</button>
        </div>
      ) : (
        <>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
            {tr("Descarga tus cartolas del banco y súbelas aquí, de a una o varias juntas. Si es CSV, OFX o QFX la leo tal cual; si es PDF la lee la IA y tú revisas antes de importar. En cualquier caso miro cuáles ya tienes y marco los repetidos para que no entren dos veces.")}
          </p>
          <div className="frow">
            <div className="field"><label>{tr("¿De qué cuenta o tarjeta es?")}</label>
              <Selector value={fuenteImp} ariaLabel={tr("¿De qué cuenta o tarjeta es?")} placeholder={tr("Elige una")} onChange={setFuenteImp}
                opciones={[
                  ...accounts.map((a) => ({ value: `acc:${a.id}`, label: a.name })),
                  ...cards.map((c) => ({ value: `card:${c.id}`, label: `💳 ${c.name}${c.last_four ? ` •••• ${c.last_four}` : ""}` })),
                ]} /></div>
            <div className="field"><label>{tr("Mes de la cartola")}</label>
              <input type="month" className="input-inline" value={mesCartola} onChange={(e) => setMesCartola(e.target.value)} aria-label={tr("Mes de la cartola")} /></div>
          </div>
          <div className="field"><label>{tr("Archivo")}</label>
            <input type="file" multiple accept=".csv,.ofx,.qfx,.pdf,.xlsx,text/csv,application/pdf" disabled={!fuenteImp || !mesCartola} onChange={(e) => { setArchivos([...(e.target.files ?? [])].slice(0, TOPE_ARCHIVOS)); void onFile(e); }} />
            <small style={{ color: "var(--muted)", fontSize: 11.5 }}>
              {tr("Puedes elegir varios de una vez, hasta")} {TOPE_ARCHIVOS}.
            </small></div>
          {(!fuenteImp || !mesCartola) && (
            <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 10 }}>{tr("Primero elige la cuenta o tarjeta y el mes: así la cartola queda bien archivada.")}</p>
          )}
          {leyendo && (
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 10 }}>
              {tr("Leyendo la cartola…")}{paso ? ` ${paso}` : ""}
            </p>
          )}
          {err && <div className="alert err" style={{ marginBottom: 10 }}>{err}</div>}
          {rows && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 13.5, marginBottom: 2 }}>
                {tr("Encontré")} <b>{rows.length}</b> {tr("movimientos.")}
                {tipoArchivo !== "pdf" && warnings.length > 0 && <> {warnings.length} {tr("filas no se pudieron leer.")}</>}
              </p>
              {tipoArchivo === "pdf" && (
                <p style={{ fontSize: 12.5, color: "var(--warn)", marginBottom: 8 }}>
                  ⚠️ {tr("Esta cartola la leyó la IA desde un PDF. Revisa los montos y las fechas antes de importar.")}
                </p>
              )}
              {dups > 0 ? (
                <p style={{ fontSize: 12.5, color: "var(--warn)", marginBottom: 8 }}>
                  ⚠️ {dups} {dups === 1 ? tr("ya está en el sistema, lo dejé sin marcar.") : tr("ya están en el sistema, los dejé sin marcar.")} {tr("Márcalos solo si quieres importarlos igual.")}
                </p>
              ) : (
                <p style={{ fontSize: 12.5, color: "var(--ok)", marginBottom: 8 }}>✓ {tr("Ninguno está repetido.")}</p>
              )}
              <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid var(--line)", borderRadius: 10, padding: "4px 10px" }}>
                {rows.map((r) => (
                  <label key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", cursor: "pointer", borderBottom: "1px solid var(--line-soft)" }}>
                    <input type="checkbox" checked={!excluidos.has(r.id)} onChange={() => alternar(r.id)} style={{ flex: "none" }} />
                    <div className="txmeta" style={{ flex: 1, minWidth: 0 }}>
                      <b style={{ fontSize: 12.5 }}>{r.description || tr("Sin descripción")}</b>
                      <small>{r.date}{r.category ? `, ${r.category}` : ""}{r.dup ? ` · ${tr("ya está")}` : ""}</small>
                    </div>
                    <b className={"tnum txamt " + (r.type === "expense" ? "neg" : "pos")} style={{ fontSize: 12.5, flex: "none" }}>
                      {r.type === "expense" ? "−" : "+"}{fmtMoney(Math.abs(r.amount), currency)}
                    </b>
                  </label>
                ))}
              </div>
            </div>
          )}
          <button className="btn primary" {...sinRobarFoco} style={{ width: "100%" }} disabled={!rows || busy || incluidas.length === 0} onClick={() => void doImport()}>
            {busy ? tr("Importando…") : rows ? `${tr("Importar")} ${incluidas.length} ${tr("movimientos")}` : tr("Elige un archivo primero")}
          </button>
        </>
      )}
    </Modal>
  );
}

function DebtModal({ currency, edit, onClose, onSaved }: { currency: string; edit?: Debt | null; onClose: () => void; onSaved: () => void }) {
  const { t: tr } = useIdioma();
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
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder={tr("Crédito de consumo")} autoFocus /></div>
        <div className="field"><label>Institución (opcional)</label>
          <input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder={tr("Banco…")} /></div>
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
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={tr("Cuotas restantes, condiciones…")} /></div>
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>💡 Si pones fecha de pago, se crea solo un recordatorio mensual.</p>
        <button className="btn primary" {...sinRobarFoco} disabled={busy} style={{ width: "100%" }}>{busy ? "Guardando…" : "Guardar"}</button>
      </form>
    </Modal>
  );
}

function CardModal({ currency, edit, onClose, onSaved }: { currency: string; edit?: CreditCard | null; onClose: () => void; onSaved: () => void }) {
  const { t: tr } = useIdioma();
  const [name, setName] = useState(edit?.name ?? "");
  const [bank, setBank] = useState(edit?.bank ?? "");
  const [lastFour, setLastFour] = useState(edit?.last_four ?? "");
  const [limit, setLimit] = useState(edit?.credit_limit != null ? String(edit.credit_limit) : "");
  const [balance, setBalance] = useState(edit ? String(edit.balance) : "");
  const [minPay, setMinPay] = useState(edit?.min_payment != null ? String(edit.min_payment) : "");
  const [dueDate, setDueDate] = useState(edit?.due_date ?? "");
  const [apr, setApr] = useState(edit?.apr != null ? String(edit.apr) : "");
  const [moneda, setMoneda] = useState(edit?.currency ?? currency);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const payload = {
      name, bank: bank || null, last_four: lastFour || null,
      credit_limit: limit ? Number(limit) : null, balance: Number(balance || 0),
      min_payment: minPay ? Number(minPay) : null, due_date: dueDate || null,
      apr: apr ? Number(apr) : null,
      currency: moneda,
    };
    if (edit) await updateCard(edit.id, payload);
    else await addCard(payload);
    onSaved();
  }

  return (
    <Modal title={edit ? "Editar tarjeta de crédito" : "Agregar tarjeta de crédito"} onClose={onClose}>
      <form onSubmit={save}>
        <div className="field"><label>Moneda</label>
          <Selector value={moneda} ariaLabel="Moneda de la tarjeta" onChange={setMoneda}
            opciones={CURRENCIES.map((c) => ({ value: c, label: c }))} /></div>
        <div className="field"><label>Nombre</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder={tr("Visa")} autoFocus /></div>
        <div className="frow">
          <div className="field"><label>Banco (opcional)</label>
            <input value={bank} onChange={(e) => setBank(e.target.value)} /></div>
          <div className="field" style={{ width: 110 }}><label>Últimos 4</label>
            <input maxLength={4} value={lastFour} onChange={(e) => setLastFour(e.target.value.replace(/\D/g, ""))} placeholder={tr("1234")} /></div>
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
          <input type="number" min="0" step="any" value={apr} onChange={(e) => setApr(e.target.value)} placeholder={tr("21.99")} /></div>
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>💡 Si pones fecha de pago, se crea solo un recordatorio mensual. El interés alimenta el plan para salir de deudas.</p>
        <button className="btn primary" {...sinRobarFoco} disabled={busy} style={{ width: "100%" }}>{busy ? "Guardando…" : "Guardar"}</button>
      </form>
    </Modal>
  );
}

function ReminderModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { t: tr } = useIdioma();
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
          <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder={tr("Plan del celular")} autoFocus /></div>
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
        <button className="btn primary" {...sinRobarFoco} disabled={busy} style={{ width: "100%", marginTop: 4 }}>{busy ? "Guardando…" : "Guardar"}</button>
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
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder={tr("Viaje a Chile")} autoFocus /></div>
          <IconField value={icon} onChange={setIcon} />
        </div>
        <div className="frow">
          <div className="field"><label>{tr("m.gol.monto")}</label>
            <input type="number" required min="1" step="any" value={target} onChange={(e) => setTarget(e.target.value)} placeholder={tr("2000")} /></div>
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
        <button className="btn primary" {...sinRobarFoco} disabled={busy} style={{ width: "100%", marginTop: 4 }}>{busy ? "Guardando…" : edit ? "Guardar" : "Crear meta"}</button>
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
  const { t: tr } = useIdioma();
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
          <input type="number" required min="1" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={tr("100")} autoFocus /></div>
        <div className="field"><label>Desde la cuenta</label>
          <Selector value={accountId} ariaLabel="Cuenta de origen del aporte" placeholder={tr("Sin cuenta (solo anota el avance)")} onChange={setAccountId}
            opciones={[{ value: "", label: "Sin cuenta (solo anota el avance)" }, ...accounts.map((a) => ({ value: a.id, label: a.name }))]} /></div>
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
          Con una cuenta elegida, el aporte queda como transferencia: descuenta de la cuenta y suma a la meta.
        </p>
        <button className="btn primary" {...sinRobarFoco} disabled={busy} style={{ width: "100%", marginTop: 4 }}>{busy ? "Guardando…" : "Aportar"}</button>
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
  const { t: tr } = useIdioma();
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
          <input type="number" min="0" step="any" value={value} onChange={(e) => setValue(e.target.value)} placeholder={tr("300000")} autoFocus /></div>
        <button className="btn primary" {...sinRobarFoco} disabled={busy} style={{ width: "100%", marginTop: 4 }}>{busy ? "Guardando…" : "Guardar"}</button>
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

function TxRow({ t, catById, accById, currency, resolveDest, onDelete, onEdit, hasRecibo, tags, cardName }: {
  t: Tx;
  catById: Map<string, Category>;
  accById: Map<string, Account>;
  currency: string;
  resolveDest?: (t: Tx) => string | null;
  onDelete?: () => void;
  onEdit?: () => void;
  hasRecibo?: boolean;
  tags?: Etiqueta[];
  cardName?: string | null;
}) {
  const { t: tr } = useIdioma();
  const cat = t.category_id ? catById.get(t.category_id) : undefined;
  const acc = t.account_id ? accById.get(t.account_id) : undefined;
  const dest = resolveDest ? resolveDest(t) : null;
  const esTransfer = t.type === "transfer";
  const neg = t.type === "expense";
  return (
    <div className="txrow" style={t.mirror_of ? { opacity: .58 } : undefined}>
      <span className="txicon">{esTransfer ? "🔁" : cat?.icon ?? (neg ? "💸" : "💰")}</span>
      <div className="txmeta">
        <b>{t.merchant || t.description || t.bank_ref || cat?.name || (esTransfer ? "Transferencia" : neg ? "Gasto" : "Ingreso")}</b>
        <small>
          {t.merchant && t.description ? `${t.description}, ` : ""}{t.date}
          {esTransfer
            ? `, transferencia${acc ? ` desde ${acc.name}` : ""}${dest ? ` hacia ${dest}` : ""}`
            : `, ${cat?.name ?? "sin categoría"}${acc ? `, ${acc.name}` : cardName ? `, 💳 ${cardName}` : ""}`}
          {t.source !== "manual" ? `, ${t.source}` : ""}
          {t.reimbursed ? `, ${tr("reembolsado")}` : ""}
          {t.mirror_of ? `, ${tr("el otro lado del mismo traspaso")}` : ""}
        </small>
        {tags && tags.length > 0 && (
          <span style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 3 }}>
            {tags.map((e) => (
              <small key={e.id} style={{ fontSize: 10.5, padding: "1px 7px", borderRadius: 99, background: `color-mix(in srgb, ${e.color ?? "var(--accent)"} 18%, var(--paper))`, color: "var(--ink-soft)", border: "1px solid var(--line-soft)" }}>
                {e.name}
              </small>
            ))}
          </span>
        )}
      </div>
      <b className={"tnum txamt " + (esTransfer ? "neutral" : neg ? "neg" : "pos")}>{esTransfer ? "⇄ " : neg ? "−" : "+"}{fmtMoney(Number(t.amount), acc?.currency ?? currency)}</b>
      {/* Un clip, una etiqueta, una tijera, un lápiz y un basurero por fila
          no es un sistema, es un laberinto. Todo eso vive ahora DENTRO de la
          ventana de editar. Aquí queda lo que de verdad es distinto: abrir y
          borrar. El clip solo se muestra como señal de que ya tiene boleta. */}
      {hasRecibo && (
        <span className="xdel" title={tr("Tiene boleta")} style={{ color: "var(--accent-ink)", cursor: "default" }}>
          <Paperclip size={13} />
        </span>
      )}
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
  const { t: tr } = useIdioma();
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
            <Selector compacto value={p.category_id} ariaLabel={`Categoría de la parte ${i + 1}`} placeholder={tr("Sin categoría")}
              opciones={[{ value: "", label: "Sin categoría" }, ...cats.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` }))]}
              onChange={(v) => cambiar(i, { category_id: v })} />
          </div>
          <input className="input-inline tnum" type="number" min="0" step="any" style={{ maxWidth: 95, flex: "none" }} value={p.amount}
            placeholder={tr("monto")} aria-label={`Monto de la parte ${i + 1}`} onChange={(e) => cambiar(i, { amount: e.target.value })} />
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
      <button className="btn primary" {...sinRobarFoco} style={{ width: "100%" }} disabled={!puedeGuardar || busy} onClick={() => void guardar()}>
        {busy ? "Dividiendo…" : `Dividir en ${listas.length || 2} movimientos`}
      </button>
    </Modal>
  );
}

function TxModal({ categories, accounts, cards, debts, goals, edit, etiquetas, tagsActuales, yaTieneBoleta, onVerBoletas, onDividir, onEscanear, onClose, onSaved }: {
  categories: Category[];
  accounts: Account[];
  cards: CreditCard[];
  debts: Debt[];
  goals: Goal[];
  edit?: Tx | null;
  /** Las etiquetas de ella, y las que este movimiento ya tiene puestas. */
  etiquetas: Etiqueta[];
  tagsActuales: Etiqueta[];
  /** ¿Este movimiento ya tiene boleta? Para no pedirla dos veces. */
  yaTieneBoleta?: boolean;
  /** Ver las boletas que ya tiene, y dividir el gasto en partes. Antes eran
   *  dos íconos más en la fila; ahora viven aquí. */
  onVerBoletas?: () => void;
  onDividir?: () => void;
  /** Atajo a la foto de la boleta: registrar sin escribir nada. */
  onEscanear?: () => void;
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
  // Las etiquetas aquí mismo: separar lo personal de lo de la empresa es
  // parte de anotar el gasto, no un segundo viaje por otro botón.
  const [tagsElegidas, setTagsElegidas] = useState<Set<string>>(
    () => new Set(tagsActuales.map((e) => e.id)));
  // La boleta, en la misma ventana. Antes eran tres viajes para un solo
  // gasto: el clip para la foto, el lápiz para la categoría y otra pantalla
  // para la etiqueta. Con casi trescientos movimientos por revisar, eso no
  // se sostiene.
  const [boleta, setBoleta] = useState<File | null>(null);
  const [sinBoletaNunca, setSinBoletaNunca] = useState(Boolean(edit?.receipt_waived));
  // "Me lo reembolsaron": el gasto y su boleta se guardan, pero no cuenta
  // para impuestos ni para el presupuesto, porque al final no lo pagaste tú.
  const [reembolsado, setReembolsado] = useState(Boolean(edit?.reimbursed));
  const fotoRef = useRef<HTMLInputElement>(null);
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
  // La fuente del pago: "acc:<id>" o "card:<id>". Un gasto puede salir de
  // una cuenta o de una tarjeta de crédito; transferencias, solo de cuentas.
  const [fuente, setFuente] = useState(() =>
    edit
      ? (edit.payment_source_type === "credit_card" && edit.payment_source_id
          ? `card:${edit.payment_source_id}`
          : edit.account_id ? `acc:${edit.account_id}` : "")
      : (accounts[0] ? `acc:${accounts[0].id}` : ""));
  const accountId = fuente.startsWith("acc:") ? fuente.slice(4) : "";
  const cardId = fuente.startsWith("card:") ? fuente.slice(5) : "";
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
        payment_source_type: (cardId ? "credit_card" : accountId ? "account" : null) as "account" | "credit_card" | null,
        payment_source_id: cardId || accountId || null,
        destination_kind: type === "transfer" ? destKind : null,
        destination_ref: type === "transfer" ? destRef : null,
      };
      if (edit) await updateTransaction(edit, payload);
      else await addTransaction(payload);

      // Las etiquetas: se aplica solo la diferencia, para no borrar y volver
      // a escribir lo que ya estaba bien.
      const idTx = edit?.id ?? (await ultimaTransaccion(payload.date, Number(payload.amount)));
      if (idTx) {
        const antes = new Set(tagsActuales.map((e) => e.id));
        for (const tagId of tagsElegidas) if (!antes.has(tagId)) await etiquetarTx(idTx, tagId);
        for (const tagId of antes) if (!tagsElegidas.has(tagId)) await desetiquetarTx(idTx, tagId);
        if (boleta) {
          const liviano = boleta.type.startsWith("image/") ? await comprimirImagen(boleta) : boleta;
          await uploadRecibo(idTx, liviano);
        }
        if (sinBoletaNunca !== Boolean(edit?.receipt_waived)) {
          await marcarBoletaNoAplica(idTx, sinBoletaNunca);
        }
        if (reembolsado !== Boolean(edit?.reimbursed)) {
          await marcarReembolsado([idTx], reembolsado);
        }
      }
      // La regla se ofrece al renombrar O al categorizar: transacciones
      // frecuentes (el traspaso a la tarjeta, el súper) se automatizan solas.
      if (esDelBanco && recordar && (merchant.trim() || categoryId)) {
        const nombreRegla = merchant.trim() || edit?.merchant || patronDesde(textoOriginal);
        if (nombreRegla) {
          // La regla también recuerda QUÉ ES. Sin esto, marcar el pago de la
          // tarjeta como transferencia servía solo para ese movimiento y los
          // del mes siguiente volvían a entrar como ingreso.
          await saveMerchantRule(
            textoOriginal,
            nombreRegla,
            type === "transfer" ? null : (categoryId || null),
            { tipo: type, destinoKind: type === "transfer" ? destKind : null, destinoRef: type === "transfer" ? destRef : null },
          );
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
      {!edit && onEscanear && (
        <>
          <button type="button" className="btn ghost" style={{ width: "100%", marginBottom: 10 }} onClick={onEscanear}>
            <Camera size={15} style={{ verticalAlign: "-2px", marginRight: 6 }} />
            {tr("Con una foto de la boleta")}
          </button>
          <p style={{ fontSize: 11.5, color: "var(--muted)", textAlign: "center", marginBottom: 12 }}>
            {tr("o escríbelo tú")}
          </p>
        </>
      )}
      <div className="seg">
        <button className={"segbtn" + (type === "expense" ? " active" : "")} onClick={() => setType("expense")} type="button">{tr("m.tx.gasto")}</button>
        <button className={"segbtn" + (type === "income" ? " active" : "")} onClick={() => setType("income")} type="button">{tr("m.tx.ingreso")}</button>
        <button className={"segbtn" + (type === "transfer" ? " active" : "")} onClick={() => setType("transfer")} type="button">{tr("m.tx.transfer")}</button>
      </div>
      {err && <div className="msg err" style={{ fontSize: 12.5, padding: "8px 10px", borderRadius: 8, background: "color-mix(in srgb,var(--err) 12%,var(--paper))", borderLeft: "3px solid var(--err)", marginBottom: 10 }}>{err}</div>}
      <form onSubmit={save}>
        <div className="field"><label>{tr("m.tx.monto")}</label>
          <input type="number" required min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={tr("36000")} autoFocus /></div>
        <div className="field"><label>{tr("m.tx.comercio")}</label>
          <input value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder={tr("Costco, Netflix, la farmacia…")} /></div>
        <div className="field"><label>{tr("m.tx.desc")}</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={tr("qué fue, en tus palabras")} /></div>
        {esDelBanco && (merchant.trim() !== "" || categoryId !== "") && (
          <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 12, cursor: "pointer", lineHeight: 1.45 }}>
            <input type="checkbox" checked={recordar} onChange={(e) => setRecordar(e.target.checked)} style={{ width: 15, height: 15, marginTop: 2, accentColor: "var(--accent)" }} />
            <span>
              Automatizar: cuando llegue un movimiento parecido a "{textoOriginal.slice(0, 40)}{textoOriginal.length > 40 ? "…" : ""}",
              {merchant.trim() ? <> llamarlo <b>{merchant.trim()}</b> y</> : ""}{" "}
              {type === "transfer"
                ? <>tratarlo como <b>transferencia</b> hacia el mismo destino.</>
                : "usar esta categoría solo."}{" "}
              También se aplica a los que ya tienes: solo apruebas, no repites el trabajo.
            </span>
          </label>
        )}
        <div className="frow">
          {type !== "transfer" && (
            <div className="field"><label>{tr("m.tx.categoria")}</label>
              <Selector value={categoryId} ariaLabel="Categoría" placeholder={tr("Sin categoría")} onChange={setCategoryId}
                opciones={[{ value: "", label: "Sin categoría" }, ...cats.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` }))]} /></div>
          )}
          <div className="field">
            {/* En un ingreso no se "paga con": se RECIBE en. Y un reembolso
                vuelve a la tarjeta con la que se compró, así que las tarjetas
                también tienen que estar en la lista. Sin eso, la plata que
                devuelve Amazon quedaba en el aire, sin cuenta ni tarjeta. */}
            <label>{type === "transfer" ? tr("Desde la cuenta") : type === "income" ? tr("Recibido en") : tr("Pagado con")}</label>
            <Selector value={fuente}
              ariaLabel={type === "income" ? tr("Recibido en") : tr("Pagado con")}
              placeholder={tr("Sin cuenta")}
              onChange={setFuente}
              opciones={[
                { value: "", label: tr("Sin cuenta") },
                ...accounts.map((a) => ({ value: `acc:${a.id}`, label: a.name })),
                ...(type !== "transfer"
                  ? cards.map((c) => ({ value: `card:${c.id}`, label: `💳 ${c.name}${c.last_four ? ` •••• ${c.last_four}` : ""}` }))
                  : []),
              ]} /></div>
          {type === "transfer" && (
            <div className="field"><label>Hacia</label>
              <Selector value={destino} ariaLabel="Destino de la transferencia" placeholder={tr("Fuera de la app (otro banco)")} onChange={setDestino}
                opciones={[
                  { value: "", label: "Fuera de la app (otro banco)" },
                  ...accounts.filter((a) => a.id !== accountId).map((a) => ({ value: `account:${a.id}`, label: `🏦 ${a.name}` })),
                  ...cards.map((c) => ({ value: `card:${c.id}`, label: `💳 ${c.name}${c.last_four ? ` •••• ${c.last_four}` : ""}` })),
                  ...debts.map((d) => ({ value: `debt:${d.id}`, label: `📉 ${d.name}` })),
                  ...goals.map((g) => ({ value: `goal:${g.id}`, label: `${g.icon ?? "🎯"} ${g.name}` })),
                ]} /></div>
          )}
        </div>
        {/* Las etiquetas, aquí mismo. Antes había que salir a otro botón, y
            una etiqueta que cuesta un viaje aparte no se pone nunca. */}
        {type !== "transfer" && etiquetas.length > 0 && (
          <div className="field"><label>{tr("Etiquetas")}</label>
            <ChipsEtiquetas etiquetas={etiquetas} puestas={tagsElegidas}
              onToggle={(id) => setTagsElegidas((prev) => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              })} />
          </div>
        )}
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
        {/* La boleta, en la misma ventana. Antes eran tres viajes para un
            solo gasto: el clip para la foto, el lápiz para la categoría y
            otra pantalla para la etiqueta. */}
        {type !== "transfer" && (
          <div className="field"><label>{tr("Boleta")}</label>
            <input ref={fotoRef} type="file" accept="image/*,application/pdf" hidden
              onChange={(e) => { setBoleta(e.target.files?.[0] ?? null); e.target.value = ""; }} />
            {boleta ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
                <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  📎 {boleta.name}
                </span>
                <button type="button" className="linklike" style={{ fontSize: 12 }} onClick={() => setBoleta(null)}>
                  {tr("quitar")}
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="btn ghost" style={{ fontSize: 12.5, padding: "7px 14px" }}
                  onClick={() => fotoRef.current?.click()}>
                  <Paperclip size={13} style={{ verticalAlign: "-2px", marginRight: 5 }} />
                  {yaTieneBoleta ? tr("Agregar otra") : tr("Adjuntar la boleta")}
                </button>
                {yaTieneBoleta && onVerBoletas && (
                  <button type="button" className="btn ghost" style={{ fontSize: 12.5, padding: "7px 14px" }}
                    onClick={onVerBoletas}>{tr("Ver las que tiene")}</button>
                )}
              </div>
            )}
            {!yaTieneBoleta && !boleta && edit && (
              <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--ink-soft)", marginTop: 8, cursor: "pointer" }}>
                <input type="checkbox" checked={sinBoletaNunca} onChange={(e) => setSinBoletaNunca(e.target.checked)}
                  style={{ width: 15, height: 15, accentColor: "var(--accent)" }} />
                {tr("Esta no necesita boleta")}
              </label>
            )}
          </div>
        )}
        {type === "expense" && (
          <label style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 12, cursor: "pointer", lineHeight: 1.45 }}>
            <input type="checkbox" checked={reembolsado} onChange={(e) => setReembolsado(e.target.checked)}
              style={{ width: 15, height: 15, marginTop: 2, accentColor: "var(--accent)" }} />
            <span>
              {tr("Me lo reembolsaron")}{" "}
              <span style={{ color: "var(--muted)" }}>
                {tr("Se queda con su boleta y su categoría, pero no cuenta para tus impuestos ni para tu presupuesto: al final no lo pagaste tú.")}
              </span>
            </span>
          </label>
        )}
        {edit && onDividir && type !== "transfer" && (
          <button type="button" className="btn ghost" style={{ fontSize: 12.5, padding: "7px 14px", marginBottom: 12 }}
            onClick={onDividir}>
            ✂️ {tr("Dividir en varias categorías")}
          </button>
        )}
        <div className="field"><label>Fecha</label>
          <CampoFecha value={date} onChange={setDate} ariaLabel="Fecha" conBorrar={false} /></div>
        <button className="btn primary" {...sinRobarFoco} disabled={busy} style={{ width: "100%", marginTop: 4 }}>{busy ? "Guardando…" : "Guardar"}</button>
      </form>
    </Modal>
  );
}

function AccountModal({ edit, onClose, onSaved }: { edit?: Account | null; onClose: () => void; onSaved: () => void }) {
  const { t: tr } = useIdioma();
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
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder={tr("Cuenta corriente")} autoFocus /></div>
        <div className="field"><label>Banco (opcional)</label>
          <input value={bank} onChange={(e) => setBank(e.target.value)} placeholder={tr("Banco Estado")} /></div>
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
          <input type="number" step="any" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder={tr("0")} /></div>
        <button className="btn primary" {...sinRobarFoco} disabled={busy} style={{ width: "100%", marginTop: 4 }}>{busy ? "Guardando…" : "Guardar"}</button>
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
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder={tr("Mascotas")} autoFocus /></div>
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
              <input type="number" min="0" step="any" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder={tr("300")} /></div>
            <div className="field"><label>Modo de presupuesto</label>
              <Selector value={budgetMode} ariaLabel="Modo de presupuesto" placeholder={tr("Sin modo")} onChange={setBudgetMode}
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
        <button className="btn primary" {...sinRobarFoco} disabled={busy} style={{ width: "100%", marginTop: 4 }}>{busy ? "Guardando…" : "Guardar"}</button>
      </form>
    </Modal>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="tp-overlay" {...cierreDeFondo(onClose)}>
      <div className="tp" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 430 }}>
        <h3 style={{ marginBottom: 14 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

/** Boletas de una transacción: ver, adjuntar (elige foto o archivo, luego
 *  Guarda) y borrar. El adjuntar es en dos pasos, con su botón Guardar,
 *  para que quede claro que la boleta entró. */
function ReciboModal({ tx, onClose, onChanged }: { tx: Tx; onClose: () => void; onChanged: () => void }) {
  const { t: tr } = useIdioma();
  const [archivos, setArchivos] = useState<ReciboFile[]>([]);
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [bucketFalta, setBucketFalta] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pendiente, setPendiente] = useState<File | null>(null);
  const [previo, setPrevio] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setArchivos(await listRecibos(tx.id));
    } catch (ex) {
      if (ex instanceof Error && ex.message === "BUCKET_MISSING") setBucketFalta(true);
      else setErr(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setCargando(false);
    }
  }, [tx.id]);

  useEffect(() => { void cargar(); }, [cargar]);
  // La vista previa de imagen se libera cuando cambia o se cierra.
  useEffect(() => () => { if (previo) URL.revokeObjectURL(previo); }, [previo]);

  // Paso 1: elegir el archivo (o sacar la foto). Todavía NO sube: queda listo
  // para que la persona apriete Guardar.
  function elegir(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setErr(tr("El archivo pesa más de 10 MB. Prueba con uno más liviano."));
      return;
    }
    setErr(null);
    if (previo) URL.revokeObjectURL(previo);
    setPrevio(file.type.startsWith("image/") ? URL.createObjectURL(file) : null);
    setPendiente(file);
  }

  function quitarPendiente() {
    if (previo) URL.revokeObjectURL(previo);
    setPrevio(null);
    setPendiente(null);
  }

  // Paso 2: Guardar sube lo elegido a la nube.
  async function guardar() {
    if (!pendiente) return;
    setSubiendo(true);
    setErr(null);
    try {
      await uploadRecibo(tx.id, await comprimirImagen(pendiente));
      quitarPendiente();
      await cargar();
      onChanged();
    } catch (ex) {
      if (ex instanceof Error && ex.message === "BUCKET_MISSING") setBucketFalta(true);
      else setErr(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setSubiendo(false);
    }
  }

  const titulo = tx.merchant || tx.description || tx.bank_ref || tr("Boletas");

  return (
    <Modal title={`🧾 ${titulo}`} onClose={onClose}>
      {bucketFalta ? (
        <p style={{ fontSize: 13, color: "var(--warn)" }}>
          {tr("Para adjuntar boletas falta correr")} <code>supabase/migrations/0053_recibos.sql</code> {tr("en el SQL Editor de Supabase.")}
        </p>
      ) : (
        <>
          <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 12 }}>
            {tr("Guarda aquí la foto o el PDF de la boleta de este movimiento, para tener el respaldo a mano.")}
          </p>
          {cargando ? (
            <p style={{ fontSize: 13, color: "var(--muted)" }}>{tr("cargando")}</p>
          ) : archivos.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              {archivos.map((a) => (
                <div key={a.path} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", borderBottom: "1px solid var(--line-soft)" }}>
                  <button className="linklike" style={{ fontSize: 13, flex: 1, textAlign: "left" }} onClick={() => void openRecibo(a.path)}>📎 {a.name}</button>
                  <button className="xdel" aria-label={tr("Eliminar boleta")} style={{ width: 24, height: 24 }}
                    onClick={async () => { if (!window.confirm(tr("¿Eliminar esta boleta?"))) return; await deleteRecibo(a.path); await cargar(); onChanged(); }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {err && <p style={{ fontSize: 12.5, color: "var(--err)", marginBottom: 10 }}>{err}</p>}

          {pendiente ? (
            // Paso 2: ya eligió, muestra lo que va a guardar y el botón Guardar.
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", marginBottom: 10 }}>
                {previo
                  ? <img src={previo} alt={tr("Vista previa de la boleta")} style={{ width: 46, height: 46, objectFit: "cover", borderRadius: "var(--r-sm)", border: "1px solid var(--line)" }} />
                  : <span style={{ fontSize: 26 }}>📄</span>}
                <span style={{ fontSize: 13, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pendiente.name}</span>
                <button className="xdel" aria-label={tr("Quitar")} style={{ width: 24, height: 24 }} onClick={quitarPendiente} disabled={subiendo}><Trash2 size={12} /></button>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn primary" {...sinRobarFoco} style={{ flex: 1 }} disabled={subiendo} onClick={() => void guardar()}>
                  {subiendo ? tr("Guardando…") : tr("com.guardar")}
                </button>
                <button className="btn ghost" onClick={quitarPendiente} disabled={subiendo}>{tr("Descartar")}</button>
              </div>
            </div>
          ) : (
            // Paso 1: elegir cómo adjuntar. En el celular, "Tomar foto" abre la cámara.
            <>
              <p style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 6 }}>{tr("Adjuntar boleta")}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <label className="btn primary" style={{ cursor: "pointer" }}>
                  <Camera size={15} style={{ verticalAlign: "-2px", marginRight: 6 }} />
                  {tr("Tomar foto")}
                  <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={elegir} />
                </label>
                <label className="btn ghost" style={{ cursor: "pointer" }}>
                  <Paperclip size={15} style={{ verticalAlign: "-2px", marginRight: 6 }} />
                  {tr("Subir archivo")}
                  <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" style={{ display: "none" }} onChange={elegir} />
                </label>
              </div>
              <button className="btn ghost" style={{ width: "100%", marginTop: 14 }} onClick={onClose}>{tr("Listo")}</button>
            </>
          )}
        </>
      )}
    </Modal>
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
            value={extra} onChange={(e) => setExtra(e.target.value)} placeholder={tr("100")} aria-label="Dinero extra mensual" />
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

/** Etiquetas de un movimiento: tocar un chip lo pone o lo quita al instante.
 *  El catálogo es 100% de la usuaria: ella crea, renombra, cambia el color
 *  y elimina. Aquí no se sugiere nada, cada quien nombra su mundo. */
function EtiquetasModal({ tx, etiquetas, asignadas, onClose, onChanged }: {
  tx: Tx;
  etiquetas: Etiqueta[];
  asignadas: string[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const { t: tr } = useIdioma();
  const [marcadas, setMarcadas] = useState<Set<string>>(() => new Set(asignadas));
  const [nueva, setNueva] = useState("");
  const [nuevaColor, setNuevaColor] = useState<string>(PALETA_TAGS[0]);
  const [editando, setEditando] = useState<Etiqueta | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editColor, setEditColor] = useState<string>(PALETA_TAGS[0]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [faltaMigracion, setFaltaMigracion] = useState(false);

  function atrapar(e: unknown) {
    if (e instanceof TablesMissingError) setFaltaMigracion(true);
    else setErr(e instanceof Error ? e.message : String(e));
  }

  async function alternar(tagId: string) {
    const estaba = marcadas.has(tagId);
    setMarcadas((prev) => {
      const next = new Set(prev);
      if (estaba) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
    try {
      if (estaba) await desetiquetarTx(tx.id, tagId);
      else await etiquetarTx(tx.id, tagId);
      onChanged();
    } catch (e) { atrapar(e); }
  }

  async function crear() {
    if (!nueva.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const et = await addTag(nueva, nuevaColor);
      await etiquetarTx(tx.id, et.id);
      setMarcadas((prev) => new Set(prev).add(et.id));
      setNueva("");
      onChanged();
    } catch (e) { atrapar(e); } finally { setBusy(false); }
  }

  async function guardarEdicion() {
    if (!editando || !editNombre.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await updateTag(editando.id, { name: editNombre, color: editColor });
      setEditando(null);
      onChanged();
    } catch (e) { atrapar(e); } finally { setBusy(false); }
  }

  async function eliminar(et: Etiqueta) {
    if (!window.confirm(`${tr("¿Eliminar esta etiqueta? Se quitará de todos los movimientos.")}\n\n${et.name}`)) return;
    try {
      await deleteTag(et.id);
      if (editando?.id === et.id) setEditando(null);
      onChanged();
    } catch (e) { atrapar(e); }
  }

  function Paleta({ valor, onElegir }: { valor: string; onElegir: (c: string) => void }) {
    return (
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }} role="radiogroup" aria-label={tr("Color de la etiqueta")}>
        {PALETA_TAGS.map((c) => (
          <button key={c} type="button" role="radio" aria-checked={valor === c} aria-label={c}
            onClick={() => onElegir(c)}
            style={{
              width: 22, height: 22, borderRadius: "50%", background: c, cursor: "pointer",
              border: valor === c ? "2px solid var(--ink)" : "2px solid transparent",
            }} />
        ))}
      </div>
    );
  }

  return (
    <div className="tp-overlay" {...cierreDeFondo(onClose)}>
      <div className="tp" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <h3 style={{ marginBottom: 4 }}>🏷 {tr("Etiquetas")}</h3>
        <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 12 }}>
          {tx.merchant || tx.description || tx.date}
        </p>

        {faltaMigracion ? (
          <p style={{ fontSize: 13.5, color: "var(--ink-soft)", marginBottom: 12 }}>
            {tr("Falta la migración 0057 (supabase/migrations/0057_finanzas_pro.sql). Córrela en el SQL Editor y vuelve a intentar.")}
          </p>
        ) : (
          <>
            {etiquetas.length === 0 && (
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
                {tr("Aún no tienes etiquetas. Crea las tuyas abajo: negocio, personal, impuestos, viajes, lo que a ti te sirva.")}
              </p>
            )}
            {etiquetas.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                {etiquetas.map((e) => {
                  const activa = marcadas.has(e.id);
                  return (
                    <span key={e.id} style={{ display: "inline-flex", alignItems: "center" }}>
                      <button className="pomo-chip" onClick={() => void alternar(e.id)}
                        style={activa ? { background: `color-mix(in srgb, ${e.color ?? "var(--accent)"} 26%, var(--paper))`, borderColor: "transparent", fontWeight: 600 } : undefined}>
                        {activa ? "✓ " : ""}{e.name}
                      </button>
                      <button className="xdel" aria-label={`${tr("Editar etiqueta")} ${e.name}`} title={tr("Editar etiqueta")}
                        onClick={() => { setEditando(e); setEditNombre(e.name); setEditColor(e.color ?? PALETA_TAGS[0]); }}>
                        <Pencil size={11} />
                      </button>
                      <button className="xdel" aria-label={`${tr("Eliminar etiqueta")} ${e.name}`} title={tr("Eliminar etiqueta")}
                        onClick={() => void eliminar(e)}>
                        <Trash2 size={11} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {editando ? (
              <div style={{ border: "1px solid var(--line-soft)", borderRadius: 12, padding: 12, marginBottom: 4, display: "grid", gap: 10 }}>
                <p style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".11em", color: "var(--muted)", fontWeight: 600 }}>
                  {tr("Editar etiqueta")}
                </p>
                <input className="input-inline" value={editNombre} maxLength={40}
                  onChange={(e) => setEditNombre(e.target.value)} aria-label={tr("Nombre de la etiqueta")} />
                <Paleta valor={editColor} onElegir={setEditColor} />
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button className="btn ghost" onClick={() => setEditando(null)}>{tr("Cancelar")}</button>
                  <button className="btn primary" {...sinRobarFoco} disabled={busy || !editNombre.trim()} onClick={() => void guardarEdicion()}>
                    {tr("com.guardar")}
                  </button>
                </div>
              </div>
            ) : (
              <form style={{ display: "grid", gap: 10 }}
                onSubmit={(e) => { e.preventDefault(); void crear(); }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="input-inline" style={{ flex: 1 }} value={nueva} maxLength={40}
                    onChange={(e) => setNueva(e.target.value)} placeholder={tr("Nueva etiqueta…")} aria-label={tr("Nueva etiqueta…")} />
                  <button className="btn primary" {...sinRobarFoco} disabled={busy || !nueva.trim()}>{tr("Crear")}</button>
                </div>
                <Paleta valor={nuevaColor} onElegir={setNuevaColor} />
              </form>
            )}
          </>
        )}

        {err && <p style={{ color: "var(--err)", fontSize: 13, marginTop: 10 }}>{err}</p>}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
          <button className="btn ghost" onClick={onClose}>{tr("Listo")}</button>
        </div>
      </div>
    </div>
  );
}
