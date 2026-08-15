import { useMemo, useState } from "react";
import { useIdioma } from "../idioma/IdiomaProvider";
import { Selector } from "../components/Selector";
import { fmtMoney, type Account, type Category, type CreditCard, type Debt, type Goal, type Tx } from "./types";
import { categorizarVarias, marcarTransferencias, patronDesde, sugerenciaComercio } from "./data";

// Categorizar de a montones, no de a uno.
//
// Doscientos cuarenta movimientos por revisar no son doscientas cuarenta
// decisiones: son como sesenta comercios que se repiten. Sportchek cuatro
// veces, los cargos de interés todos los meses, el supermercado cada semana.
// Decidir una vez por comercio y que se aplique a todos sus movimientos es
// la diferencia entre terminar la tarea y abandonarla a los quince.

export interface Grupo {
  clave: string;
  nombre: string;
  txs: Tx[];
  total: number;
}

export function agruparPorComercio(txs: Tx[]): Grupo[] {
  const mapa = new Map<string, Tx[]>();
  for (const t of txs) {
    const crudo = t.merchant || t.bank_ref || t.description || "";
    // El patrón deja fuera los números, que es lo que hace que dos compras
    // del mismo local con distinto folio caigan juntas.
    const clave = patronDesde(crudo) || crudo.toLowerCase() || t.id;
    mapa.set(clave, [...(mapa.get(clave) ?? []), t]);
  }
  return [...mapa.entries()]
    .map(([clave, lista]) => ({
      clave,
      nombre: lista[0].merchant || sugerenciaComercio(lista[0].bank_ref ?? lista[0].description ?? "") || clave,
      txs: lista,
      total: lista.reduce((s, t) => s + Number(t.amount), 0),
    }))
    // Los que más se repiten primero: ahí está el ahorro de trabajo.
    .sort((a, b) => b.txs.length - a.txs.length || b.total - a.total);
}

const ES_TRANSFERENCIA = "__transferencia__";

export function PorRevisarAgrupado({ txs, categories, accounts, cards, debts, goals, currency, onCambio }: {
  txs: Tx[];
  categories: Category[];
  accounts: Account[];
  cards: CreditCard[];
  debts: Debt[];
  goals: Goal[];
  currency: string;
  onCambio: () => void;
}) {
  const { t: tr } = useIdioma();
  const [busy, setBusy] = useState("");
  const [abierto, setAbierto] = useState("");
  // Qué grupos están esperando que ella diga a dónde va la transferencia.
  const [comoTransfer, setComoTransfer] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const grupos = useMemo(() => agruparPorComercio(txs), [txs]);
  const repetidos = grupos.filter((g) => g.txs.length > 1).length;

  async function transferir(g: Grupo, destino: string) {
    setBusy(g.clave);
    setErr(null);
    try {
      // "fuera" es plata que se va a otro banco: no tiene destino adentro.
      const [kind, ref] = destino === "fuera" ? [null, null] : destino.split(":");
      await marcarTransferencias(g.txs.map((t) => t.id), kind, ref ?? null);
      setComoTransfer((p) => p.filter((x) => x !== g.clave));
      onCambio();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("");
    }
  }

  async function categorizar(g: Grupo, categoryId: string) {
    if (!categoryId) return;
    // Un traspaso a la tarjeta no es un gasto: primero se pregunta a dónde va.
    if (categoryId === ES_TRANSFERENCIA) {
      setComoTransfer((p) => [...p, g.clave]);
      return;
    }
    setBusy(g.clave);
    setErr(null);
    try {
      await categorizarVarias(g.txs.map((t) => t.id), categoryId);
      onCambio();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("");
    }
  }

  return (
    <>
      <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 10, lineHeight: 1.5 }}>
        {txs.length} {tr("movimientos en")} <b style={{ color: "var(--ink)" }}>{grupos.length}</b> {tr("comercios")}
        {repetidos > 0 && <>, {repetidos} {tr("se repiten")}</>}
        {". "}
        {tr("Elige la categoría del comercio y se aplica a todos sus movimientos de una vez.")}
      </p>
      {err && <p style={{ color: "var(--err)", fontSize: 13, marginBottom: 8 }}>{err}</p>}

      {grupos.map((g) => {
        const cats = categories.filter((c) =>
          g.txs[0].type === "income" ? c.type === "income" : c.type !== "income");
        return (
          <div key={g.clave} style={{ borderBottom: "1px solid var(--line-soft)", padding: "10px 0" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ flex: 1, minWidth: 150 }}>
                <b style={{ fontSize: 13.5 }}>{g.nombre}</b>
                <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
                  {g.txs.length === 1
                    ? g.txs[0].date
                    : <>{g.txs.length} {tr("movimientos")} · {g.txs[0].date} {tr("al")} {g.txs[g.txs.length - 1].date}</>}
                </div>
              </span>
              <b className="tnum" style={{ fontSize: 13.5, whiteSpace: "nowrap" }}>
                {fmtMoney(g.total, currency)}
              </b>
              <div style={{ width: 210 }}>
                {comoTransfer.includes(g.clave) ? (
                  // A dónde va la plata. Sin esto, marcar transferencia sería
                  // sacar el movimiento de los gastos y dejarlo en el aire.
                  <Selector compacto value="" ariaLabel={tr("¿Hacia dónde?")}
                    placeholder={busy === g.clave ? tr("com.guardando") : tr("¿Hacia dónde?")}
                    opciones={[
                      { value: "fuera", label: tr("Fuera de la app (otro banco)") },
                      ...cards.map((c) => ({ value: `card:${c.id}`, label: `💳 ${c.name}${c.last_four ? ` ••••${c.last_four}` : ""}` })),
                      ...accounts.map((a) => ({ value: `account:${a.id}`, label: `🏦 ${a.name}` })),
                      ...debts.map((d) => ({ value: `debt:${d.id}`, label: `📉 ${d.name}` })),
                      ...goals.map((x) => ({ value: `goal:${x.id}`, label: `${x.icon ?? "🎯"} ${x.name}` })),
                    ]}
                    onChange={(v) => void transferir(g, v)} />
                ) : (
                  <Selector compacto value="" ariaLabel={tr("Ponerle categoría")}
                    placeholder={busy === g.clave ? tr("com.guardando") : tr("Ponerle categoría…")}
                    opciones={[
                      // Arriba de todo, porque un traspaso entre lo tuyo no es
                      // ninguna de las categorías de abajo.
                      { value: ES_TRANSFERENCIA, label: `⇄ ${tr("Es una transferencia")}` },
                      ...cats.map((c) => ({ value: c.id, label: `${c.icon ?? ""} ${c.name}`.trim() })),
                    ]}
                    onChange={(v) => void categorizar(g, v)} />
                )}
                {comoTransfer.includes(g.clave) && (
                  <button type="button" className="linklike" style={{ fontSize: 11.5, marginTop: 3 }}
                    onClick={() => setComoTransfer((p) => p.filter((x) => x !== g.clave))}>
                    {tr("cancelar")}
                  </button>
                )}
              </div>
            </div>
            {g.txs.length > 1 && (
              <>
                <button type="button" className="linklike" style={{ fontSize: 11.5, marginTop: 4 }}
                  onClick={() => setAbierto(abierto === g.clave ? "" : g.clave)}>
                  {abierto === g.clave ? "▾" : "▸"} {tr("Ver los")} {g.txs.length}
                </button>
                {abierto === g.clave && (
                  <div style={{ margin: "6px 0 0 12px" }}>
                    {g.txs.map((t) => (
                      <div key={t.id} style={{ display: "flex", gap: 8, fontSize: 11.5, padding: "2px 0", color: "var(--muted)" }}>
                        <span className="tnum" style={{ whiteSpace: "nowrap" }}>{t.date}</span>
                        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {t.bank_ref || t.description || t.merchant}
                        </span>
                        <span className="tnum">{fmtMoney(Number(t.amount), currency)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
      <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 12, lineHeight: 1.5 }}>
        {tr("Para el resto (la boleta, las etiquetas, dividir el gasto) abre el lápiz en la vista de uno por uno.")}
      </p>
    </>
  );
}
