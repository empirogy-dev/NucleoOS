import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileText } from "lucide-react";
import { useIdioma } from "../idioma/IdiomaProvider";
import { Selector } from "../components/Selector";
import { listTodosRecibos, signedUrlsRecibos, openRecibo, type ReciboItem } from "./recibos";
import { fmtMoney, type Account, type Category, type Tx } from "./types";

// Biblioteca de comprobantes: todas las boletas en un solo lugar, cada una
// junto a su gasto (fecha, comercio, categoría, monto). Bookkeeping en línea:
// filtra por mes y categoría, y exporta el período para tus impuestos.

interface Fila {
  item: ReciboItem;
  tx: Tx | undefined;
  fecha: string;
  cat: Category | undefined;
  currency: string;
  monto: number;
}

const MESES = ["", "enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export function ComprobantesTab({ txs, categories, accounts, currency }: {
  txs: Tx[];
  categories: Category[];
  accounts: Account[];
  currency: string;
}) {
  const { t: tr } = useIdioma();
  const [items, setItems] = useState<ReciboItem[]>([]);
  const [urls, setUrls] = useState<Map<string, string>>(new Map());
  const [cargando, setCargando] = useState(true);
  const [fMes, setFMes] = useState("all");
  const [fCat, setFCat] = useState("all");

  const txById = useMemo(() => new Map(txs.map((t) => [t.id, t])), [txs]);
  const accById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const cargar = useCallback(async () => {
    setCargando(true);
    const lista = await listTodosRecibos();
    setItems(lista);
    // Miniaturas de las imágenes, en lote.
    const rutas = lista.filter((i) => i.isImage).map((i) => i.path);
    setUrls(await signedUrlsRecibos(rutas));
    setCargando(false);
  }, []);

  useEffect(() => { void cargar(); }, [cargar]);

  const filas: Fila[] = useMemo(() => {
    return items
      .map((item) => {
        const tx = txById.get(item.txId);
        const fecha = tx?.date ?? "";
        return {
          item,
          tx,
          fecha,
          cat: tx?.category_id ? catById.get(tx.category_id) : undefined,
          currency: (tx?.account_id ? accById.get(tx.account_id)?.currency : undefined) ?? currency,
          monto: tx ? Number(tx.amount) : 0,
        };
      })
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [items, txById, catById, accById, currency]);

  const meses = useMemo(() => {
    const set = new Set(filas.map((f) => f.fecha.slice(0, 7)).filter(Boolean));
    return [...set].sort().reverse();
  }, [filas]);

  const visibles = filas.filter((f) => {
    if (fMes !== "all" && f.fecha.slice(0, 7) !== fMes) return false;
    if (fCat === "none" && f.tx?.category_id) return false;
    if (fCat !== "all" && fCat !== "none" && f.tx?.category_id !== fCat) return false;
    return true;
  });

  function nombreMes(ym: string): string {
    const [y, m] = ym.split("-").map(Number);
    return `${MESES[m] ? MESES[m].charAt(0).toUpperCase() + MESES[m].slice(1) : m} ${y}`;
  }

  function exportarCSV() {
    const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
    const cab = [tr("Fecha"), tr("Comercio"), tr("Categoría"), tr("Monto"), tr("Moneda"), tr("Comprobante")];
    const lineas = visibles.map((f) =>
      [
        f.fecha,
        f.tx?.merchant || f.tx?.description || f.tx?.bank_ref || "",
        f.cat?.name ?? "",
        String(f.monto),
        f.currency,
        f.item.name,
      ].map(esc).join(","),
    );
    const csv = "﻿" + [cab.map(esc).join(","), ...lineas].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const suf = fMes === "all" ? "todos" : fMes;
    a.download = `comprobantes-nucleoos-${suf}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (cargando) return <p style={{ color: "var(--muted)" }}>{tr("cargando")}</p>;

  if (items.length === 0) {
    return (
      <div className="card pad">
        <p style={{ color: "var(--muted)", fontSize: 13.5 }}>
          {tr("Aquí se juntan todas tus boletas. Adjunta la primera desde el clip de cualquier movimiento en Transacciones y aparecerá acá.")}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="filterbar">
        <div style={{ width: 180 }}>
          <Selector compacto value={fMes} ariaLabel={tr("Filtrar por mes")}
            opciones={[{ value: "all", label: tr("Todos los meses") }, ...meses.map((m) => ({ value: m, label: nombreMes(m) }))]}
            onChange={setFMes} />
        </div>
        <div style={{ width: 185 }}>
          <Selector compacto value={fCat} ariaLabel={tr("Filtrar por categoría")}
            opciones={[
              { value: "all", label: tr("Todas las categorías") },
              { value: "none", label: tr("Sin categoría") },
              ...categories.map((c) => ({ value: c.id, label: `${c.icon ?? ""} ${c.name}`.trim() })),
            ]}
            onChange={setFCat} />
        </div>
        <span style={{ flex: 1 }} />
        <button className="btn ghost" onClick={exportarCSV} disabled={visibles.length === 0}>
          <Download size={14} style={{ verticalAlign: "-2px", marginRight: 5 }} />
          {tr("Exportar para taxes")}
        </button>
      </div>

      <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "2px 0 12px" }}>
        {visibles.length} {visibles.length === 1 ? tr("comprobante") : tr("comprobantes")}
      </p>

      <div className="comp-grid">
        {visibles.map((f) => (
          <div className="card pad comp-card" key={f.item.path}>
            <button className="comp-thumb" onClick={() => void openRecibo(f.item.path)} aria-label={tr("Ver comprobante")}>
              {f.item.isImage && urls.get(f.item.path)
                ? <img src={urls.get(f.item.path)} alt={f.item.name} loading="lazy" />
                : <span className="comp-pdf"><FileText size={26} /></span>}
            </button>
            <div style={{ minWidth: 0 }}>
              <b style={{ fontSize: 13.5, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {f.tx?.merchant || f.tx?.description || f.tx?.bank_ref || tr("Movimiento")}
              </b>
              <small style={{ color: "var(--muted)", fontSize: 12 }}>
                {f.fecha}{f.cat ? `, ${f.cat.icon ?? ""} ${f.cat.name}`.trimEnd() : ""}
              </small>
              {f.tx && <div className="tnum" style={{ fontSize: 13, marginTop: 2 }}>{fmtMoney(f.monto, f.currency)}</div>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
