import { useMemo, useState } from "react";
import { Copy, Paperclip } from "lucide-react";
import { useIdioma } from "../idioma/IdiomaProvider";
import { sinRobarFoco } from "../components/cierreDeFondo";
import { fmtMoney, type Category, type Tx } from "./types";
import { buscarRepetidos, cualConservar, type GrupoRepetido } from "./duplicados";
import { deleteTransaction } from "./data";
import { moverRecibos } from "./recibos";

// El mismo gasto anotado dos veces. Se junta, no se borra a ciegas: el que se
// queda hereda las boletas del que se va, porque la foto es la prueba y no se
// puede perder al limpiar.

const CLAVE = "nucleoos-fin-no-repetidos";

/** La firma de un grupo: sus ids ordenados. Si cambia alguno, vuelve a
 *  preguntar, que es lo correcto: ya no es el mismo grupo. */
const firma2 = (ids: string[]) => [...ids].sort().join("|");
const firma = (txs: GrupoRepetido["txs"]) => firma2(txs.map((t) => t.id));

const DE_DONDE: Record<string, string> = {
  banco: "del banco",
  cartola: "de la cartola",
  recibo: "de una boleta",
};

export function RepetidosPanel({ txs, catById, currency, conRecibo, fuenteDe, onCambio }: {
  txs: Tx[];
  catById: Map<string, Category>;
  currency: string;
  conRecibo: Set<string>;
  /** De qué cuenta o tarjeta salió. Con cinco cuentas, "del banco" no dice
   *  nada, y sin saber cuál es no se puede decidir cuál se queda. */
  fuenteDe: (t: Tx) => string | null;
  onCambio: () => void;
}) {
  const { t: tr } = useIdioma();
  const [abierto, setAbierto] = useState(false);
  const [trabajando, setTrabajando] = useState("");
  const [err, setErr] = useState<string | null>(null);

  // Los grupos que ella ya revisó y dijo que no son repetidos. Se guardan
  // por los ids del grupo, así no vuelven a aparecer nunca más, y viajan a
  // sus otros aparatos.
  const [descartados, setDescartados] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(CLAVE) ?? "[]") as string[]; } catch { return []; }
  });

  // Por defecto se exige que el comercio se parezca, que es lo que evita
  // acusar dos gastos distintos del mismo monto. Pero un mismo gasto puede
  // llegar con dos nombres que no se parecen en nada, así que hay una segunda
  // pasada más amplia que ella activa cuando la necesita.
  const [amplio, setAmplio] = useState(false);
  const grupos = useMemo(
    () => buscarRepetidos(txs, 4, !amplio).filter((g) => !descartados.includes(firma(g.txs))),
    [txs, descartados, amplio],
  );

  function noSonRepetidos(ids: string[]) {
    const next = [...descartados, firma2(ids)];
    setDescartados(next);
    localStorage.setItem(CLAVE, JSON.stringify(next));
  }

  const hay = grupos.length > 0;
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
    <div className="card pad" style={{ marginBottom: 14, borderColor: hay ? "var(--warn)" : "var(--line)" }}>
      <button type="button" className="linklike" style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}
        onClick={() => setAbierto(!abierto)}>
        {abierto ? "▾" : "▸"} <Copy size={13} style={{ verticalAlign: "-2px" }} />{" "}
        {hay
          ? <>{grupos.length} {grupos.length === 1 ? tr("posible repetido") : tr("posibles repetidos")}{", "}{fmtMoney(plataDeMas, currency)} {tr("contados de más")}</>
          : tr("Buscar gastos repetidos")}
      </button>

      {!abierto && (
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
          {hay
            ? tr("Ábrelo para revisarlos uno por uno. Nada se toca hasta que tú elijas cuál se queda.")
            : tr("No encontré ninguno con las reglas de siempre. Ábrelo para buscar más amplio.")}
        </p>
      )}

      {abierto && (
        <>
          <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "8px 0 12px", lineHeight: 1.5 }}>
            {tr("Mismo monto, mismo comercio y fechas cercanas. Elige cuál se queda: el que elijas hereda las boletas de los otros, y los otros se borran.")}
          </p>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 12, color: "var(--ink-soft)", marginBottom: 10, cursor: "pointer", lineHeight: 1.45 }}>
            <input type="checkbox" checked={amplio} onChange={(e) => setAmplio(e.target.checked)}
              style={{ width: 15, height: 15, marginTop: 2, accentColor: "var(--accent)" }} />
            <span>
              {tr("Buscar también con nombres distintos.")}{" "}
              <span style={{ color: "var(--muted)" }}>
                {tr("Encuentra el mismo gasto cuando llega con dos nombres que no se parecen, como Starlink cobrado por Klarna. Trae más candidatos falsos: revísalos uno por uno.")}
              </span>
            </span>
          </label>
          {err && <p style={{ color: "var(--err)", fontSize: 13, marginBottom: 10 }}>{err}</p>}
          {!hay && (
            <p style={{ fontSize: 13, color: "var(--ok)" }}>
              ✓ {amplio
                ? tr("Tampoco con la búsqueda amplia: no hay gastos repetidos.")
                : tr("Ninguno repetido. Si sospechas de uno que llegó con otro nombre, marca la casilla de arriba.")}
            </p>
          )}

          {grupos.map((g) => {
            const sugerido = cualConservar(g, conRecibo);
            return (
              <div key={g.clave} style={{ borderTop: "1px solid var(--line)", padding: "10px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <b className="tnum" style={{ fontSize: 13.5 }}>{fmtMoney(g.monto, currency)}</b>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>· {g.txs.length} {tr("veces")}</span>
                  <span style={{ flex: 1 }} />
                  {/* Que dos gastos cuesten lo mismo no los hace el mismo
                      gasto. Si ella dice que no, no se vuelve a preguntar. */}
                  <button type="button" className="linklike" style={{ fontSize: 12 }}
                    onClick={() => noSonRepetidos(g.txs.map((t) => t.id))}>
                    {tr("No son repetidos, déjalos")}
                  </button>
                </div>
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
                          {fuenteDe(t) ? `, ${fuenteDe(t)}` : ""}
                          {t.source && DE_DONDE[t.source] ? `, ${tr(DE_DONDE[t.source])}` : ""}
                          {conRecibo.has(t.id) && <> · <Paperclip size={11} style={{ verticalAlign: "-1px" }} /></>}
                        </div>
                      </span>
                      <button className="btn ghost" {...sinRobarFoco} style={{ fontSize: 12, padding: "5px 12px" }}
                        disabled={Boolean(trabajando)}
                        onClick={() => {
                          const seVan = g.txs.filter((x) => x.id !== t.id);
                          // Un movimiento del banco borrado no vuelve: el
                          // banco lleva su propia marca de por dónde va y no
                          // repite lo que ya entregó. Se avisa antes.
                          const delBanco = seVan.filter((x) => x.source === "banco" || x.source === "cartola");
                          const aviso = delBanco.length > 0
                            ? `\n\n⚠️ ${tr("Uno de los que se borra vino del banco, y esos no vuelven a bajar solos. Conviene quedarse con el del banco.")}`
                            : "";
                          if (!window.confirm(
                            `${tr("Se queda este y se borran los otros")} ${seVan.length}. ${tr("Sus boletas pasan al que se queda. ¿Seguimos?")}${aviso}`,
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
