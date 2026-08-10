import { useMemo, useState } from "react";
import { Unlink } from "lucide-react";
import { useIdioma } from "../idioma/IdiomaProvider";
import { Selector } from "../components/Selector";
import { sinRobarFoco } from "../components/cierreDeFondo";
import { fmtMoney, type Account, type CreditCard, type Tx } from "./types";
import { reasignarFuente } from "./data";

// Movimientos que quedaron colgando.
//
// Al borrar una cuenta o una tarjeta, sus movimientos NO se borran: la
// columna que los une no tiene llave foránea. Quedan apuntando a algo que ya
// no existe, así que dejan de salir en los filtros y parecen perdidos. No lo
// están, y esto los devuelve a donde corresponde.

export function HuerfanosPanel({ txs, accounts, cards, currency, onCambio }: {
  txs: Tx[];
  accounts: Account[];
  cards: CreditCard[];
  currency: string;
  onCambio: () => void;
}) {
  const { t: tr } = useIdioma();
  const [destinos, setDestinos] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const grupos = useMemo(() => {
    const vivos = new Set<string>([...accounts.map((a) => a.id), ...cards.map((c) => c.id)]);
    const porFuente = new Map<string, Tx[]>();
    for (const t of txs) {
      const fuente = t.payment_source_id ?? t.account_id;
      if (!fuente || vivos.has(fuente)) continue;
      porFuente.set(fuente, [...(porFuente.get(fuente) ?? []), t]);
    }
    return [...porFuente.entries()]
      .map(([fuente, lista]) => ({ fuente, txs: lista }))
      .sort((a, b) => b.txs.length - a.txs.length);
  }, [txs, accounts, cards]);

  if (grupos.length === 0) return null;

  async function mover(fuente: string, lista: Tx[]) {
    const destino = destinos[fuente];
    if (!destino) return;
    setBusy(fuente);
    setErr(null);
    try {
      const esTarjeta = cards.some((c) => c.id === destino);
      await reasignarFuente(lista.map((t) => t.id), destino, esTarjeta);
      onCambio();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="card pad" style={{ marginBottom: 14, borderColor: "var(--warn)" }}>
      <b style={{ fontSize: 13.5 }}>
        <Unlink size={13} style={{ verticalAlign: "-2px" }} />{" "}
        {tr("Movimientos de una cuenta que ya no existe")}
      </b>
      <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "6px 0 12px", lineHeight: 1.5 }}>
        {tr("Se borró la cuenta o la tarjeta, pero sus movimientos siguen aquí: no se perdió nada. Solo hay que decirles a cuál pertenecen ahora, y vuelven a aparecer en los filtros y en los totales.")}
      </p>
      {err && <p style={{ color: "var(--err)", fontSize: 13, marginBottom: 8 }}>{err}</p>}

      {grupos.map((g) => {
        const total = g.txs.reduce((s, t) => s + Number(t.amount), 0);
        const desde = g.txs.map((t) => t.date).sort()[0];
        const hasta = g.txs.map((t) => t.date).sort().slice(-1)[0];
        return (
          <div key={g.fuente} style={{ borderTop: "1px solid var(--line)", paddingTop: 10, marginTop: 10 }}>
            <div style={{ fontSize: 13 }}>
              <b>{g.txs.length} {g.txs.length === 1 ? tr("movimiento") : tr("movimientos")}</b>
              <span style={{ color: "var(--muted)" }}>
                {" · "}{fmtMoney(total, currency)}{" · "}{desde} {tr("a")} {hasta}
              </span>
            </div>
            {/* Los primeros, para reconocer de cuál cuenta eran. */}
            <div style={{ fontSize: 11.5, color: "var(--muted)", margin: "3px 0 8px" }}>
              {g.txs.slice(0, 3).map((t) => t.merchant || t.bank_ref || t.description || tr("Movimiento")).join(", ")}
              {g.txs.length > 3 ? "…" : ""}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ width: 240 }}>
                <Selector compacto value={destinos[g.fuente] ?? ""} ariaLabel={tr("Moverlos a")}
                  placeholder={tr("Moverlos a…")}
                  opciones={[
                    ...accounts.map((a) => ({ value: a.id, label: `${a.name}${a.bank_name ? ` · ${a.bank_name}` : ""}` })),
                    ...cards.map((c) => ({ value: c.id, label: `💳 ${c.name}${c.last_four ? ` ••••${c.last_four}` : ""}` })),
                  ]}
                  onChange={(v) => setDestinos((p) => ({ ...p, [g.fuente]: v }))} />
              </div>
              <button className="btn ghost" {...sinRobarFoco}
                disabled={!destinos[g.fuente] || busy === g.fuente}
                onClick={() => void mover(g.fuente, g.txs)}>
                {busy === g.fuente ? tr("com.guardando") : tr("Moverlos")}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
