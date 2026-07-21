import { useState } from "react";
import { Camera, ImagePlus, Receipt } from "lucide-react";
import { useIdioma } from "../idioma/IdiomaProvider";
import { CampoFecha } from "../components/CampoFecha";
import { Selector } from "../components/Selector";
import { analizarRecibo, blobToBase64, iaConfigured, type AnalisisRecibo } from "../lib/ia";
import { fechaRegistro } from "../lib/fechas";
import { addTransaction, TablesMissingError } from "./data";
import { fmtMoney, type Account, type Category } from "./types";

// Foto del recibo: la IA lee el gasto y lo muestra para que la persona
// confirme y corrija antes de que entre a sus finanzas. Un cerebro con
// TDAH agradece revisar antes de que algo se guarde solo.

interface Borrador {
  monto: string;
  comercio: string;
  descripcion: string;
  fecha: string;
  categoryId: string;
  accountId: string;
}

export function ReciboCard({
  categories,
  accounts,
  currency,
  onSaved,
}: {
  categories: Category[];
  accounts: Account[];
  currency: string;
  onSaved: () => void;
}) {
  const { t: tr } = useIdioma();
  const [analizando, setAnalizando] = useState(false);
  const [borrador, setBorrador] = useState<Borrador | null>(null);
  const [leido, setLeido] = useState<AnalisisRecibo | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [faltaTabla, setFaltaTabla] = useState(false);

  const gastoCats = categories.filter((c) => c.type === "expense");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setErr(tr("La foto pesa más de 8 MB. Prueba con una más liviana."));
      return;
    }
    setErr(null);
    setBorrador(null);
    setLeido(null);
    setAnalizando(true);
    try {
      const base64 = await blobToBase64(file);
      const r = await analizarRecibo(base64, file.type || "image/jpeg", gastoCats.map((c) => c.name));
      const cat = gastoCats.find((c) => c.name.toLowerCase() === r.categoria.toLowerCase());
      setLeido(r);
      setBorrador({
        monto: r.monto ? String(r.monto) : "",
        comercio: r.comercio,
        descripcion: r.descripcion,
        fecha: r.fecha || fechaRegistro(),
        categoryId: cat?.id ?? "",
        accountId: "",
      });
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setAnalizando(false);
    }
  }

  async function guardar() {
    if (!borrador) return;
    const monto = Number(borrador.monto);
    if (!monto || monto <= 0) {
      setErr(tr("Escribe un monto mayor que cero."));
      return;
    }
    setGuardando(true);
    setErr(null);
    try {
      await addTransaction(
        {
          date: borrador.fecha,
          amount: monto,
          type: "expense",
          description: borrador.descripcion.trim() || tr("Compra"),
          merchant: borrador.comercio.trim() || null,
          category_id: borrador.categoryId || null,
          account_id: borrador.accountId || null,
          destination_kind: null,
          destination_ref: null,
        },
        "recibo",
      );
      setBorrador(null);
      setLeido(null);
      onSaved();
    } catch (ex) {
      if (ex instanceof TablesMissingError) setFaltaTabla(true);
      else setErr(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setGuardando(false);
    }
  }

  function editar(campo: keyof Borrador, valor: string) {
    setBorrador((b) => (b ? { ...b, [campo]: valor } : b));
  }

  if (!iaConfigured) return null;

  return (
    <div className="card pad" style={{ marginBottom: 14 }}>
      <h3 style={{ fontSize: 15, marginBottom: 4 }}>
        <Receipt size={15} style={{ verticalAlign: "-2px", marginRight: 6 }} />
        {tr("📸 Foto del recibo")}
      </h3>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
        {tr("Fotografía tu boleta y la IA lee el monto, el comercio y la fecha. Revisas y confirmas antes de que entre a tus gastos.")}
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <label className="btn primary" style={{ cursor: "pointer" }}>
          <Camera size={15} style={{ verticalAlign: "-2px", marginRight: 6 }} />
          {analizando ? tr("Leyendo…") : tr("Tomar foto del recibo")}
          <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={onFile} disabled={analizando} />
        </label>
        <label className="btn ghost" style={{ cursor: "pointer" }}>
          <ImagePlus size={15} style={{ verticalAlign: "-2px", marginRight: 6 }} />
          {tr("Subir foto")}
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={onFile} disabled={analizando} />
        </label>
      </div>

      {analizando && (
        <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 12 }}>{tr("Leyendo tu recibo con calma… 🧾")}</p>
      )}
      {faltaTabla && (
        <p style={{ fontSize: 12.5, color: "var(--warn)", marginTop: 12 }}>
          {tr("Para guardar gastos falta correr la migración de Finanzas en Supabase.")}
        </p>
      )}
      {err && <p style={{ fontSize: 12.5, color: "var(--err)", marginTop: 12 }}>{err}</p>}

      {borrador && (
        <div style={{ marginTop: 14, borderTop: "1px solid var(--line-soft)", paddingTop: 12 }}>
          {leido && leido.monto === 0 ? (
            <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 10 }}>{leido.descripcion}</p>
          ) : (
            <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 10 }}>
              {tr("Esto leí. Corrige lo que haga falta y confirma.")}
            </p>
          )}
          <div className="frow">
            <div className="field"><label>{tr("Monto")} ({currency})</label>
              <input type="number" min="0" step="1" value={borrador.monto} onChange={(e) => editar("monto", e.target.value)} placeholder="0" autoFocus /></div>
            <div className="field"><label>{tr("Fecha")}</label>
              <CampoFecha value={borrador.fecha} onChange={(v) => editar("fecha", v || fechaRegistro())} ariaLabel={tr("Fecha")} conBorrar={false} /></div>
          </div>
          <div className="field"><label>{tr("Comercio")}</label>
            <input value={borrador.comercio} onChange={(e) => editar("comercio", e.target.value)} placeholder={tr("Nombre del local")} /></div>
          <div className="field"><label>{tr("Descripción")}</label>
            <input value={borrador.descripcion} onChange={(e) => editar("descripcion", e.target.value)} placeholder={tr("Qué compraste")} /></div>
          <div className="frow">
            <div className="field"><label>{tr("Categoría")}</label>
              <Selector value={borrador.categoryId} ariaLabel={tr("Categoría")} placeholder={tr("Sin categoría")} onChange={(v) => editar("categoryId", v)}
                opciones={[{ value: "", label: tr("Sin categoría") }, ...gastoCats.map((c) => ({ value: c.id, label: `${c.icon ?? ""} ${c.name}`.trim() }))]} /></div>
            <div className="field"><label>{tr("Cuenta")}</label>
              <Selector value={borrador.accountId} ariaLabel={tr("Cuenta")} placeholder={tr("Sin cuenta")} onChange={(v) => editar("accountId", v)}
                opciones={[{ value: "", label: tr("Sin cuenta") }, ...accounts.map((a) => ({ value: a.id, label: a.name }))]} /></div>
          </div>
          {borrador.monto && Number(borrador.monto) > 0 && (
            <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "4px 0 10px" }}>
              {tr("Se guardará como gasto de")} <b>{fmtMoney(Number(borrador.monto), currency)}</b>.
            </p>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn primary" disabled={guardando} onClick={() => void guardar()}>
              {guardando ? tr("Guardando…") : tr("Confirmar gasto")}
            </button>
            <button className="btn ghost" onClick={() => { setBorrador(null); setLeido(null); }}>{tr("Descartar")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
