import { useMemo, useState } from "react";
import { useIdioma } from "../idioma/IdiomaProvider";
import { Selector } from "../components/Selector";
import { fmtMoney, type Account, type Category, type CreditCard, type Debt, type Goal, type Tx } from "./types";
import { categorizarVarias, marcarTransferencias, marcarTransferenciasEntrantes, patronDesde, sugerenciaComercio } from "./data";

// Categorizar de a montones, no de a uno.
//
// Doscientos cuarenta movimientos por revisar no son doscientas cuarenta
// decisiones: son como sesenta comercios que se repiten. Sportchek cuatro
// veces, los cargos de interés todos los meses, el supermercado cada semana.
// Decidir una vez por comercio y que se aplique a todos sus movimientos es
// la diferencia entre terminar la tarea y abandonarla a los quince.

export interface Subgrupo {
  texto: string;
  txs: Tx[];
  total: number;
}

export interface Grupo {
  clave: string;
  nombre: string;
  txs: Tx[];
  total: number;
  /** El mismo comercio puede esconder destinos distintos. Los traspasos de su
   *  banco se llaman todos "[CW] TF", pero el número largo termina en los
   *  cuatro dígitos de la tarjeta que recibe: unos van a la 4123 y otros a la
   *  6360. Juntarlos en una sola decisión los mandaría todos al lugar
   *  equivocado. */
  subgrupos: Subgrupo[];
}

/** La tarjeta que el texto del banco está nombrando, si la nombra.
 *  Se exige que un número del texto TERMINE en sus cuatro dígitos: así
 *  "0005191238144544123" encuentra la tarjeta 4123 y no una coincidencia
 *  suelta en medio de otro número. */
export function tarjetaEnElTexto(texto: string, cards: CreditCard[]): CreditCard | undefined {
  const numeros = texto.match(/\d{4,}/g) ?? [];
  return cards.find((c) => c.last_four && numeros.some((n) => n.endsWith(c.last_four as string)));
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
    .map(([clave, lista]) => {
      // Dentro del grupo, por el texto exacto del banco: ahí es donde se ve
      // que dos traspasos con el mismo nombre van a tarjetas distintas.
      const porTexto = new Map<string, Tx[]>();
      for (const t of lista) {
        const texto = (t.bank_ref || t.description || t.merchant || "").trim();
        porTexto.set(texto, [...(porTexto.get(texto) ?? []), t]);
      }
      const subgrupos = [...porTexto.entries()]
        .map(([texto, suyas]) => ({ texto, txs: suyas, total: suyas.reduce((s, t) => s + Number(t.amount), 0) }))
        .sort((a, b) => b.txs.length - a.txs.length);
      return {
        clave,
        nombre: lista[0].merchant || sugerenciaComercio(lista[0].bank_ref ?? lista[0].description ?? "") || clave,
        txs: lista,
        total: lista.reduce((s, t) => s + Number(t.amount), 0),
        subgrupos,
      };
    })
    // Los que más se repiten primero: ahí está el ahorro de trabajo.
    .sort((a, b) => b.txs.length - a.txs.length || b.total - a.total);
}

const ES_TRANSFERENCIA = "__transferencia__";

/** Los mismos dos selectores, sueltos, para aplicar a cualquier lista de
 *  movimientos. Se usa en los grupos y también sobre los resultados de una
 *  búsqueda, que es como se arregla en bloque algo que quedó mal. */
export function AccionesMasivas(props: {
  lista: Tx[];
  categories: Category[];
  accounts: Account[];
  cards: CreditCard[];
  debts: Debt[];
  goals: Goal[];
  onCambio: () => void;
}) {
  const { t: tr } = useIdioma();
  const { lista, categories, accounts, cards, debts, goals, onCambio } = props;
  const [transf, setTransf] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  if (lista.length === 0) return null;

  const entra = lista[0].type === "income";
  const cats = categories.filter((c) => (entra ? c.type === "income" : c.type !== "income"));
  const sugerida = tarjetaEnElTexto(lista[0].bank_ref ?? lista[0].description ?? "", cards);

  async function aplicar(v: string) {
    if (!v) return;
    if (v === ES_TRANSFERENCIA) { setTransf(true); return; }
    setBusy(true);
    setErr(null);
    try {
      if (transf) {
        if (entra) {
          // Llegó: el destino es donde cayó, y ella elige de dónde vino.
          await marcarTransferenciasEntrantes(lista, v === "fuera" ? null : v.split(":")[1]);
        } else {
          const [kind, ref] = v === "fuera" ? [null, null] : v.split(":");
          await marcarTransferencias(lista.map((t) => t.id), kind, ref ?? null);
        }
      } else {
        await categorizarVarias(lista.map((t) => t.id), v);
      }
      setTransf(false);
      onCambio();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
      <span style={{ fontSize: 12.5, color: "var(--muted)" }}>
        {tr("Aplicar a los")} <b style={{ color: "var(--ink)" }}>{lista.length}</b> {tr("resultados:")}
      </span>
      <div style={{ width: 230 }}>
        <Selector compacto value="" ariaLabel={transf ? (entra ? tr("¿De dónde viene?") : tr("¿Hacia dónde?")) : tr("Ponerle categoría")}
          placeholder={busy ? tr("com.guardando") : transf ? (entra ? tr("¿De dónde viene?") : tr("¿Hacia dónde?")) : tr("Ponerle categoría…")}
          opciones={transf ? [
            ...(sugerida ? [{ value: `card:${sugerida.id}`, label: `💳 ${sugerida.name} ••••${sugerida.last_four} · ${tr("la del texto")}` }] : []),
            { value: "fuera", label: tr("Fuera de la app (otro banco)") },
            ...cards.filter((c) => c.id !== sugerida?.id).map((c) => ({ value: `card:${c.id}`, label: `💳 ${c.name}${c.last_four ? ` ••••${c.last_four}` : ""}` })),
            ...accounts.map((a) => ({ value: `account:${a.id}`, label: `🏦 ${a.name}` })),
            ...debts.map((d) => ({ value: `debt:${d.id}`, label: `📉 ${d.name}` })),
            ...goals.map((x) => ({ value: `goal:${x.id}`, label: `${x.icon ?? "🎯"} ${x.name}` })),
          ] : [
            { value: ES_TRANSFERENCIA, label: `⇄ ${tr("Es una transferencia")}` },
            ...cats.map((c) => ({ value: c.id, label: `${c.icon ?? ""} ${c.name}`.trim() })),
          ]}
          onChange={(v) => void aplicar(v)} />
      </div>
      {transf && (
        <button type="button" className="linklike" style={{ fontSize: 12 }} onClick={() => setTransf(false)}>
          {tr("cancelar")}
        </button>
      )}
      {err && <span style={{ color: "var(--err)", fontSize: 12.5 }}>{err}</span>}
    </div>
  );
}

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

  async function transferir(clave: string, lista: Tx[], destino: string) {
    setBusy(clave);
    setErr(null);
    try {
      if (lista[0].type === "income") {
        // Llegó: el destino es la cuenta donde cayó, y ella elige el origen.
        await marcarTransferenciasEntrantes(lista, destino === "fuera" ? null : destino.split(":")[1]);
      } else {
        // "fuera" es plata que se va a otro banco: no tiene destino adentro.
        const [kind, ref] = destino === "fuera" ? [null, null] : destino.split(":");
        await marcarTransferencias(lista.map((t) => t.id), kind, ref ?? null);
      }
      setComoTransfer((p) => p.filter((x) => x !== clave));
      onCambio();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("");
    }
  }

  async function categorizar(clave: string, lista: Tx[], categoryId: string) {
    if (!categoryId) return;
    // Un traspaso a la tarjeta no es un gasto: primero se pregunta a dónde va.
    if (categoryId === ES_TRANSFERENCIA) {
      setComoTransfer((p) => [...p, clave]);
      return;
    }
    setBusy(clave);
    setErr(null);
    try {
      await categorizarVarias(lista.map((t) => t.id), categoryId);
      onCambio();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("");
    }
  }

  /** El mismo par de selectores, para un grupo o para un subgrupo. */
  function Acciones({ clave, lista, cats }: { clave: string; lista: Tx[]; cats: Category[] }) {
    // Si el banco nombra la tarjeta en el texto, se propone esa.
    const sugerida = tarjetaEnElTexto(lista[0].bank_ref ?? lista[0].description ?? "", cards);
    // Si la plata LLEGA, la pregunta es de dónde viene: hacia dónde ya se
    // sabe, es la cuenta donde cayó.
    const entra = lista[0].type === "income";
    const pregunta = entra ? tr("¿De dónde viene?") : tr("¿Hacia dónde?");
    return (
      <div style={{ width: 215 }}>
        {comoTransfer.includes(clave) ? (
          <>
            <Selector compacto value="" ariaLabel={pregunta}
              placeholder={busy === clave ? tr("com.guardando") : pregunta}
              opciones={[
                ...(sugerida
                  ? [{ value: `card:${sugerida.id}`, label: `💳 ${sugerida.name} ••••${sugerida.last_four} · ${tr("la del texto")}` }]
                  : []),
                { value: "fuera", label: tr("Fuera de la app (otro banco)") },
                ...cards.filter((c) => c.id !== sugerida?.id)
                  .map((c) => ({ value: `card:${c.id}`, label: `💳 ${c.name}${c.last_four ? ` ••••${c.last_four}` : ""}` })),
                ...accounts.map((a) => ({ value: `account:${a.id}`, label: `🏦 ${a.name}` })),
                ...debts.map((d) => ({ value: `debt:${d.id}`, label: `📉 ${d.name}` })),
                ...goals.map((x) => ({ value: `goal:${x.id}`, label: `${x.icon ?? "🎯"} ${x.name}` })),
              ]}
              onChange={(v) => void transferir(clave, lista, v)} />
            <button type="button" className="linklike" style={{ fontSize: 11.5, marginTop: 3 }}
              onClick={() => setComoTransfer((p) => p.filter((x) => x !== clave))}>
              {tr("cancelar")}
            </button>
          </>
        ) : (
          <Selector compacto value="" ariaLabel={tr("Ponerle categoría")}
            placeholder={busy === clave ? tr("com.guardando") : tr("Ponerle categoría…")}
            opciones={[
              { value: ES_TRANSFERENCIA, label: `⇄ ${tr("Es una transferencia")}` },
              ...cats.map((c) => ({ value: c.id, label: `${c.icon ?? ""} ${c.name}`.trim() })),
            ]}
            onChange={(v) => void categorizar(clave, lista, v)} />
        )}
      </div>
    );
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
              {g.subgrupos.length > 1 ? (
                // Con más de un destino adentro, un botón que los mande a
                // todos al mismo lado es una trampa: se ve arriba, se usa, y
                // se lleva movimientos que iban a otra parte. Se decide abajo.
                <span style={{ fontSize: 11.5, color: "var(--warn)", width: 215, textAlign: "right" }}>
                  {tr("Se decide abajo, uno por destino")}
                </span>
              ) : (
                <Acciones clave={g.clave} lista={g.txs} cats={cats} />
              )}
            </div>
            {/* El mismo nombre con destinos distintos: se parten y cada
                parte se decide sola. Sin esto, los 30 que van a una tarjeta y
                los 4 que van a otra terminaban todos en la misma. */}
            {g.subgrupos.length > 1 && (
              <div style={{ margin: "8px 0 0 12px", display: "grid", gap: 8 }}>
                <div style={{ fontSize: 11.5, color: "var(--warn)" }}>
                  ⚠️ {tr("Estos no van todos al mismo lado:")}
                </div>
                {g.subgrupos.map((sg) => {
                  const tarjeta = tarjetaEnElTexto(sg.texto, cards);
                  return (
                    <div key={sg.texto} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ flex: 1, minWidth: 140, fontSize: 12 }}>
                        <b>{sg.txs.length}</b>{" "}
                        {sg.txs.length === 1 ? tr("movimiento") : tr("movimientos")}
                        {tarjeta && <> · 💳 {tarjeta.name} ••••{tarjeta.last_four}</>}
                        <div style={{ color: "var(--muted)", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {sg.texto}
                        </div>
                      </span>
                      <b className="tnum" style={{ fontSize: 12.5, whiteSpace: "nowrap" }}>{fmtMoney(sg.total, currency)}</b>
                      <Acciones clave={`${g.clave}::${sg.texto}`} lista={sg.txs} cats={cats} />
                    </div>
                  );
                })}
              </div>
            )}
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
