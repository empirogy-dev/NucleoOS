import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileText, Trash2 } from "lucide-react";
import { useIdioma } from "../idioma/IdiomaProvider";
import { Selector } from "../components/Selector";
import { listTodosRecibos, signedUrlsRecibos, openRecibo, deleteRecibo, type ReciboItem } from "./recibos";
import { fmtMoney, monedaDeTx, type Account, type Category, type CreditCard, type Tx } from "./types";
import { updateTransaction } from "./data";
import type { Etiqueta } from "./tags";
import { ExportarBoletas, type ItemExportable } from "./ExportarBoletas";

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

export function ComprobantesTab({ txs, categories, accounts, cards, currency, onCambio, etiquetas, txTags, catTags }: {
  txs: Tx[];
  categories: Category[];
  accounts: Account[];
  cards: CreditCard[];
  currency: string;
  /** Para poder recategorizar aquí mismo y que la lista se refresque. */
  onCambio: () => void;
  etiquetas: Etiqueta[];
  txTags: Map<string, Etiqueta[]>;
  catTags: Map<string, Etiqueta[]>;
}) {
  const { t: tr } = useIdioma();
  const [items, setItems] = useState<ReciboItem[]>([]);
  const [urls, setUrls] = useState<Map<string, string>>(new Map());
  const [cargando, setCargando] = useState(true);
  const [fMes, setFMes] = useState("all");
  const [fCat, setFCat] = useState("all");
  const [fTag, setFTag] = useState("all");
  const [orden, setOrden] = useState<"fecha" | "categoria">("fecha");
  const [exportando, setExportando] = useState(false);

  const txById = useMemo(() => new Map(txs.map((t) => [t.id, t])), [txs]);
  const accById = useMemo(() => new Map(accounts.map((a) => [a.id, a.currency])), [accounts]);
  const cardById = useMemo(() => new Map(cards.map((c) => [c.id, c.currency])), [cards]);
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
          currency: tx ? monedaDeTx(tx, accById, cardById, currency) : currency,
          monto: tx ? Number(tx.amount) : 0,
        };
      })
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [items, txById, catById, accById, currency]);

  // Por fecha para revisar el mes, por categoría para entregar ordenado.
  const ordenadas = useMemo(() => {
    if (orden === "fecha") return filas;
    return [...filas].sort((a, b) => {
      const ca = a.cat?.name ?? "￿";  // lo sin categoría, al final
      const cb = b.cat?.name ?? "￿";
      return ca.localeCompare(cb) || b.fecha.localeCompare(a.fecha);
    });
  }, [filas, orden]);

  const meses = useMemo(() => {
    const set = new Set(filas.map((f) => f.fecha.slice(0, 7)).filter(Boolean));
    return [...set].sort().reverse();
  }, [filas]);

  // La etiqueta de una boleta viene de dos lados: la que ella le puso al
  // gasto, y la que lleva su categoría. Poner "empresa" en Bencina tiene que
  // alcanzar para que la boleta de bencina salga en el filtro de empresa,
  // sin marcarla una por una.
  const etiquetasDe = (f: Fila): string[] => [
    ...(f.tx ? txTags.get(f.tx.id) ?? [] : []),
    ...(f.tx?.category_id ? catTags.get(f.tx.category_id) ?? [] : []),
  ].map((e) => e.id);

  const visibles = ordenadas.filter((f) => {
    if (fTag !== "all" && !etiquetasDe(f).includes(fTag)) return false;
    if (fMes !== "all" && f.fecha.slice(0, 7) !== fMes) return false;
    if (fCat === "none" && f.tx?.category_id) return false;
    if (fCat !== "all" && fCat !== "none" && f.tx?.category_id !== fCat) return false;
    return true;
  });

  // Una boleta puede quedar sin su movimiento, por ejemplo si el gasto se
  // borró después. En pantalla se muestra igual, marcada, para poder verla y
  // decidir. Pero fuera de la exportación: una fila con fecha vacía y monto
  // cero en lo que uno le manda al contador no es un dato, es basura.
  const huerfanas = visibles.filter((f) => !f.tx);
  const exportables = visibles.filter((f) => f.tx);

  function sufijoArchivo(): string {
    const etiqueta = fTag === "all" ? "" : `-${(etiquetas.find((e) => e.id === fTag)?.name ?? "").toLowerCase().replace(/\s+/g, "-")}`;
    return (fMes === "all" ? "todos" : fMes) + etiqueta;
  }

  function etiquetasNombre(f: Fila): string {
    return [...new Set([
      ...(f.tx ? txTags.get(f.tx.id) ?? [] : []),
      ...(f.tx?.category_id ? catTags.get(f.tx.category_id) ?? [] : []),
    ].map((e) => e.name))].join(", ");
  }

  function paraExportar(): ItemExportable[] {
    return exportables.map((f) => ({
      path: f.item.path,
      archivo: f.item.name,
      esImagen: f.item.isImage,
      fecha: f.fecha,
      comercio: f.tx?.merchant || f.tx?.description || f.tx?.bank_ref || tr("Movimiento"),
      categoria: f.cat ? `${f.cat.icon ?? ""} ${f.cat.name}`.trim() : "",
      etiquetas: etiquetasNombre(f),
      monto: f.monto,
      moneda: f.currency,
    }));
  }

  function textoFiltros(): string {
    return [
      fMes === "all" ? tr("Todos los meses") : nombreMes(fMes),
      fCat === "all" ? null : fCat === "none" ? tr("Sin categoría") : categories.find((c) => c.id === fCat)?.name,
      fTag === "all" ? null : etiquetas.find((e) => e.id === fTag)?.name,
    ].filter(Boolean).join(" · ");
  }

  function nombreMes(ym: string): string {
    const [y, m] = ym.split("-").map(Number);
    return `${MESES[m] ? MESES[m].charAt(0).toUpperCase() + MESES[m].slice(1) : m} ${y}`;
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
        {etiquetas.length > 0 && (
          <div style={{ width: 175 }}>
            <Selector compacto value={fTag} ariaLabel={tr("Filtrar por etiqueta")}
              opciones={[
                { value: "all", label: tr("Todas las etiquetas") },
                ...etiquetas.map((e) => ({ value: e.id, label: e.name })),
              ]}
              onChange={setFTag} />
          </div>
        )}
        <div style={{ width: 165 }}>
          <Selector compacto value={orden} ariaLabel={tr("Ordenar")}
            opciones={[
              { value: "fecha", label: tr("Por fecha") },
              { value: "categoria", label: tr("Por categoría") },
            ]}
            onChange={(v) => setOrden(v as "fecha" | "categoria")} />
        </div>
        <span style={{ flex: 1 }} />
        <button className="btn ghost" onClick={() => setExportando(true)} disabled={exportables.length === 0}>
          <Download size={14} style={{ verticalAlign: "-2px", marginRight: 5 }} />
          {tr("Exportar")}
        </button>
      </div>

      <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "2px 0 12px" }}>
        {visibles.length} {visibles.length === 1 ? tr("comprobante") : tr("comprobantes")}
        {huerfanas.length > 0 && (
          <>, {huerfanas.length} {tr("sin movimiento, quedan fuera de la exportación.")}</>
        )}
      </p>

      <div className="comp-grid">
        {visibles.map((f) => (
          <div className="card pad comp-card" key={f.item.path} style={{ position: "relative" }}>
            <button className="xdel" aria-label={tr("Eliminar comprobante")}
              style={{ position: "absolute", top: 6, right: 6, zIndex: 1 }}
              onClick={async () => {
                if (!window.confirm(`${tr("¿Eliminar este comprobante?")} ${f.item.name}`)) return;
                await deleteRecibo(f.item.path);
                await cargar();
                onCambio();
              }}><Trash2 size={13} /></button>
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
                {f.tx
                  ? `${f.fecha}${f.cat ? `, ${f.cat.icon ?? ""} ${f.cat.name}`.trimEnd() : ""}`
                  : tr("sin movimiento asociado")}
              </small>
              {f.tx && <div className="tnum" style={{ fontSize: 13, marginTop: 2 }}>{fmtMoney(f.monto, f.currency)}</div>}
              {f.tx && (
                <div style={{ marginTop: 6 }}>
                  <Selector compacto value={f.tx.category_id ?? ""} ariaLabel={tr("Categoría")}
                    placeholder={tr("Sin categoría")}
                    opciones={[
                      { value: "", label: tr("Sin categoría") },
                      ...categories
                        .filter((c) => (f.tx!.type === "income" ? c.type === "income" : c.type !== "income"))
                        .map((c) => ({ value: c.id, label: `${c.icon ?? ""} ${c.name}`.trim() })),
                    ]}
                    onChange={async (v) => {
                      const tx = f.tx!;
                      await updateTransaction(tx, {
                        date: tx.date,
                        amount: Number(tx.amount),
                        type: tx.type,
                        description: tx.description,
                        merchant: tx.merchant,
                        bank_ref: tx.bank_ref ?? null,
                        category_id: v || null,
                        account_id: tx.account_id,
                        destination_kind: tx.destination_kind,
                        destination_ref: tx.destination_ref,
                        payment_source_type: tx.payment_source_type ?? null,
                        payment_source_id: tx.payment_source_id ?? null,
                      });
                      onCambio();
                    }} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {exportando && (
        <ExportarBoletas
          items={paraExportar()}
          filtros={textoFiltros()}
          sufijo={sufijoArchivo()}
          onClose={() => setExportando(false)}
        />
      )}
    </>
  );
}
