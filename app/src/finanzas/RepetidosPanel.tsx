import { useMemo, useState } from "react";
import { Copy, Paperclip } from "lucide-react";
import { useIdioma } from "../idioma/IdiomaProvider";
import { sinRobarFoco } from "../components/cierreDeFondo";
import { fmtMoney, type Category, type Tx } from "./types";
import { buscarRepetidos, cualConservar } from "./duplicados";
import { deleteTransaction } from "./data";
import { moverRecibos } from "./recibos";

// El mismo gasto anotado dos veces. Se junta, no se borra a ciegas: el que se
// queda hereda las boletas del que se va, porque la foto es la prueba y no se
// puede perder al limpiar.

const DE_DONDE: Record<string, string> = {
  banco: "del banco",
  cartola: "de la cartola",
  recibo: "de una boleta",
};

export function RepetidosPanel({ txs, catById, currency, conRecibo, onCambio }: {
  txs: Tx[];
  catById: Map<string, Category>;
  currency: string;
  conRecibo: Set<string>;
  onCambio: () => void;
}) {
  const { t: tr } = useIdioma();
  const [abierto, setAbierto] = useState(false);
  const [trabajando, setTrabajando] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const grupos = useMemo(() => buscarRepetidos(txs), [txs]);
  if (grupos.length === 0) return null;

  const plataDeMas = grupos.reduce((s, g) => s + g.monto * (g.txs.length - 1), 0);

  async function juntar(quedaId: string, seVanIds: string[]) {
    setTrabajando(quedaId);
    setErr(null);
    try {
      for (const id of seVanIds) {
        // Primero las boletas, después el movimiento: si algo falla a medio
        // camino, se pierde el orden pero nunca la foto.
        try { await moverRecibos(id, quedaId); } catch { /* sin bucket, se sigue */ }
        const tx = txs.find((t) => t.id === id);
        if (tx) await deleteTransaction(tx);
      }
      onCambio();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setTrabajando("");
    }
  }

  return (
    <div className="card pad" style={{ marginBottom: 14, borderColor: "var(--warn)" }}>
      <button type="button" className="linklike" style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}
        onClick={() => setAbierto(!abierto)}>
        {abierto ? "▾" : "▸"} <Copy size={13} style={{ verticalAlign: "-2px" }} />{" "}
        {grupos.length} {grupos.length === 1 ? tr("posible repetido") : tr("posibles repetidos")}
        {", "}{fmtMoney(plataDeMas, currency)} {tr("contados de más")}
      </button>

      {!abierto && (
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
          {tr("Ábrelo para revisarlos uno por uno. Nada se toca hasta que tú elijas cuál se queda.")}
        </p>
      )}

      {abierto && (
        <>
          <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "8px 0 12px", lineHeight: 1.5 }}>
            {tr("Mismo monto y fechas cercanas. Elige cuál se queda: el que elijas hereda las boletas de los otros, y los otros se borran.")}
          </p>
          {err && <p style={{ color: "var(--err)", fontSize: 13, marginBottom: 10 }}>{err}</p>}

          {grupos.map((g) => {
            const sugerido = cualConservar(g, conRecibo);
            return (
              <div key={g.clave} style={{ borderTop: "1px solid var(--line)", padding: "10px 0" }}>
                <b className="tnum" style={{ fontSize: 13.5 }}>{fmtMoney(g.monto, currency)}</b>
                <span style={{ fontSize: 12, color: "var(--muted)" }}> · {g.txs.length} {tr("veces")}</span>
                <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
                  {g.txs.map((t) => (
                    <div key={t.id} style={{
                      display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
                      fontSize: 12.5, padding: "7px 10px", borderRadius: 9,
                      border: `1px solid ${t.id === sugerido.id ? "var(--accent)" : "var(--line)"}`,
                    }}>
                      <span style={{ flex: 1, minWidth: 140 }}>
                        <b style={{ fontWeight: 600 }}>{t.merchant || t.bank_ref || t.description || tr("Movimiento")}</b>
                        <div style={{ color: "var(--muted)", fontSize: 11.5 }}>
                          {t.date}
                          {t.category_id ? `, ${catById.get(t.category_id)?.name ?? ""}` : `, ${tr("sin categoría")}`}
                          {t.source && DE_DONDE[t.source] ? `, ${tr(DE_DONDE[t.source])}` : ""}
                          {conRecibo.has(t.id) && <> · <Paperclip size={11} style={{ verticalAlign: "-1px" }} /></>}
                        </div>
                      </span>
                      <button className="btn ghost" {...sinRobarFoco} style={{ fontSize: 12, padding: "5px 12px" }}
                        disabled={Boolean(trabajando)}
                        onClick={() => {
                          const seVan = g.txs.filter((x) => x.id !== t.id);
                          if (!window.confirm(
                            `${tr("Se queda este y se borran los otros")} ${seVan.length}. ${tr("Sus boletas pasan al que se queda. ¿Seguimos?")}`,
                          )) return;
                          void juntar(t.id, seVan.map((x) => x.id));
                        }}>
                        {trabajando === t.id ? tr("com.guardando") : t.id === sugerido.id ? tr("Dejar este (sugerido)") : tr("Dejar este")}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
