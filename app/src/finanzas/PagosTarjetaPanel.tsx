import { useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { useIdioma } from "../idioma/IdiomaProvider";
import { sinRobarFoco } from "../components/cierreDeFondo";
import { fmtMoney, type CreditCard, type Tx } from "./types";
import { updateTransaction } from "./data";

// Pagar la tarjeta no es un ingreso.
//
// El banco publica el pago dos veces: sale de la cuenta corriente y entra a la
// tarjeta. El lado de la tarjeta entraba como INGRESO, así que un pago de 800
// se veía como si hubiera ganado 800. Ya no pasa con lo que llega nuevo, pero
// lo que entró antes sigue mal, y son montos grandes: dejarlos así deforma
// todos los totales del mes.

const ES_PAGO = /\b(payment|paiement|pago|pmt)\b/i;

export function pagosMalClasificados(txs: Tx[], cards: CreditCard[]): Tx[] {
  const esTarjeta = new Set(cards.map((c) => c.id));
  return txs.filter((t) =>
    t.type === "income"
    && t.payment_source_type === "credit_card"
    && t.payment_source_id != null
    && esTarjeta.has(t.payment_source_id)
    && ES_PAGO.test(`${t.merchant ?? ""} ${t.bank_ref ?? ""} ${t.description ?? ""}`));
}

export function PagosTarjetaPanel({ txs, cards, currency, onCambio }: {
  txs: Tx[];
  cards: CreditCard[];
  currency: string;
  onCambio: () => void;
}) {
  const { t: tr } = useIdioma();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const malos = useMemo(() => pagosMalClasificados(txs, cards), [txs, cards]);
  if (malos.length === 0) return null;

  const total = malos.reduce((s, t) => s + Number(t.amount), 0);

  async function arreglar() {
    setBusy(true);
    setErr(null);
    try {
      for (const t of malos) {
        await updateTransaction(t, {
          date: t.date,
          amount: Number(t.amount),
          type: "transfer",
          description: t.description,
          merchant: t.merchant,
          bank_ref: t.bank_ref ?? null,
          // Una transferencia no lleva categoría de gasto ni de ingreso.
          category_id: null,
          account_id: null,
          destination_kind: "card",
          destination_ref: t.payment_source_id ?? null,
          payment_source_type: t.payment_source_type ?? null,
          payment_source_id: t.payment_source_id ?? null,
        });
      }
      onCambio();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card pad" style={{ marginBottom: 14, borderColor: "var(--warn)" }}>
      <b style={{ fontSize: 13.5 }}>
        <ArrowLeftRight size={13} style={{ verticalAlign: "-2px" }}/>{" "}
        {malos.length} {malos.length === 1 ? tr("pago de tarjeta contado como ingreso") : tr("pagos de tarjeta contados como ingreso")}
      </b>
      <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "6px 0 10px", lineHeight: 1.5 }}>
        {tr("Pagar tu tarjeta no es ganar plata: es mover lo tuyo de un bolsillo a otro. Estos suman")}{" "}
        <b className="tnum" style={{ color: "var(--ink)" }}>{fmtMoney(total, currency)}</b>{" "}
        {tr("a tus ingresos y no deberían. Al pasarlos a transferencia dejan de contar como ingreso y bajan lo que le debes a la tarjeta.")}
      </p>
      {err && <p style={{ color: "var(--err)", fontSize: 13, marginBottom: 8 }}>{err}</p>}
      <button className="btn ghost" {...sinRobarFoco} disabled={busy} onClick={() => void arreglar()}>
        {busy ? tr("com.guardando") : tr("Pasarlos a transferencia")}
      </button>
    </div>
  );
}
