import { useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { useIdioma } from "../idioma/IdiomaProvider";
import { sinRobarFoco } from "../components/cierreDeFondo";
import { fmtMoney, type Account, type CreditCard, type Tx } from "./types";
import { enlazarReflejos, marcarTransferencias } from "./data";
import { buscarParesDeTransferencia, type ParTransferencia } from "./paresTransferencia";

// Los pagos de tarjeta que quedaron contados dos veces.
//
// Cada par es un gasto y un ingreso que no existieron: la plata solo se movió
// de un bolsillo tuyo a otro. Mientras estén sueltos, el mes muestra más
// gastos y más ingresos de los reales.
//
// Se arreglan los dos lados juntos, siempre. Convertir solo la salida dejaría
// el ingreso falso ahí, que es la mitad del problema y la que más deforma:
// un pago de 400 contado como sueldo.

export function ParesPanel({ txs, accounts, cards, currency, onCambio }: {
  txs: Tx[];
  accounts: Account[];
  cards: CreditCard[];
  currency: string;
  onCambio: () => void;
}) {
  const { t: tr } = useIdioma();
  const [ocupado, setOcupado] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const { pares, sinPareja } = useMemo(
    () => buscarParesDeTransferencia(txs, accounts, cards),
    [txs, accounts, cards],
  );

  if (pares.length === 0 && sinPareja.length === 0) return null;

  async function arreglar(lista: ParTransferencia[]) {
    setOcupado(true);
    setErr(null);
    try {
      for (const p of lista) {
        // La salida pasa a ser la transferencia de verdad, con su destino.
        // Va por updateTransaction para que la deuda de la tarjeta baje.
        await marcarTransferencias([p.salida], "card", p.tarjetaId);
        // Y la entrada queda como su reflejo: se sigue viendo en la cartola
        // de la tarjeta, pero deja de contar como ingreso.
        await marcarTransferencias([p.entrada], "card", p.tarjetaId);
        await enlazarReflejos(p.salida.id, [p.entrada.id]);
      }
      onCambio();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setOcupado(false);
    }
  }

  const total = pares.reduce((s, p) => s + p.monto, 0);

  return (
    <div className="card pad" style={{ marginBottom: 14, borderLeft: "3px solid var(--warn)" }}>
      <h3 style={{ fontSize: 15, marginBottom: 6 }}>
        <ArrowLeftRight size={15} style={{ verticalAlign: "-2px", marginRight: 6 }} />
        {pares.length > 0
          ? `${pares.length} ${pares.length === 1 ? tr("pago de tarjeta contado dos veces") : tr("pagos de tarjeta contados dos veces")}`
          : tr("Plata que entró a una tarjeta")}
      </h3>

      {pares.length > 0 && (
        <>
          <p style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.6, marginBottom: 12, maxWidth: "70ch" }}>
            {tr("El banco publica el pago dos veces: sale de la cuenta y entra a la tarjeta. Sueltos, el mes cuenta un gasto y un ingreso que no existieron. Los emparejé por monto y fecha, no por el nombre, porque el nombre que les pone el banco no dice que sean un pago.")}
          </p>

          {pares.map((p) => (
            <div key={p.entrada.id} style={{
              borderTop: "1px solid var(--line-soft)", padding: "9px 0", fontSize: 13,
              display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap",
            }}>
              <b className="tnum" style={{ minWidth: 92, whiteSpace: "nowrap" }}>
                {fmtMoney(p.monto, currency)}
              </b>
              <span style={{ flex: 1, minWidth: 200, color: "var(--ink-soft)", lineHeight: 1.5 }}>
                {p.salida.date} · {p.salida.merchant || p.salida.bank_ref || tr("sin nombre")}
                <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
                  {tr("entró a")} {p.tarjetaNombre} {tr("el")} {p.entrada.date}
                  {p.entrada.category_id && <> · {tr("hoy cuenta como ingreso")}</>}
                  {p.dias > 0 && <> · {p.dias} {p.dias === 1 ? tr("día de diferencia") : tr("días de diferencia")}</>}
                </div>
              </span>
              <button className="btn ghost" {...sinRobarFoco} disabled={ocupado}
                style={{ fontSize: 12, padding: "5px 11px" }}
                onClick={() => void arreglar([p])}>{tr("Enlazar")}</button>
            </div>
          ))}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, alignItems: "center" }}>
            <button className="btn primary" {...sinRobarFoco} disabled={ocupado}
              onClick={() => void arreglar(pares)}>
              {ocupado ? tr("com.guardando") : `${tr("Enlazar las")} ${pares.length}`}
            </button>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              {tr("Son")} {fmtMoney(total, currency)} {tr("que hoy están contados dos veces.")}
            </span>
          </div>
        </>
      )}

      {sinPareja.length > 0 && (
        <p style={{
          fontSize: 12, color: "var(--muted)", lineHeight: 1.55,
          marginTop: pares.length > 0 ? 12 : 0, maxWidth: "70ch",
        }}>
          {sinPareja.length} {sinPareja.length === 1
            ? tr("movimiento entró a una tarjeta y cuenta como ingreso, pero no le encontré la salida:")
            : tr("movimientos entraron a una tarjeta y cuentan como ingreso, pero no les encontré la salida:")}{" "}
          {sinPareja.slice(0, 3).map((t) =>
            `${t.merchant || t.bank_ref || t.date} ${fmtMoney(Number(t.amount), currency)}`).join(", ")}
          {sinPareja.length > 3 ? "…" : ""}.{" "}
          {tr("Casi siempre son devoluciones de una compra. No los toco: convertirlos en transferencia sería inventarles un origen.")}
        </p>
      )}

      {err && <p style={{ fontSize: 12.5, color: "var(--err)", marginTop: 10 }}>{err}</p>}
    </div>
  );
}
