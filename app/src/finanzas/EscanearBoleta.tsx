import { useEffect, useMemo, useRef, useState } from "react";
import { cierreDeFondo, sinRobarFoco } from "../components/cierreDeFondo";
import { useIdioma } from "../idioma/IdiomaProvider";
import { Camera, ImagePlus } from "lucide-react";
import { analizarBoleta, blobToBase64, iaConfigured, type AnalisisBoleta } from "../lib/ia";
import { comprimirImagen } from "../lib/comprimir";
import { hoyLocal } from "../lib/fechas";
import { addTransaction, updateTransaction } from "./data";
import { uploadRecibo } from "./recibos";
import { candidatosPara, esBuenMatch, separar } from "./matchBoleta";
import { etiquetarTx, listTags, tagsPorCategoria, type Etiqueta } from "./tags";
import { ChipsEtiquetas } from "./ChipsEtiquetas";
import { Selector } from "../components/Selector";
import { CampoFecha } from "../components/CampoFecha";
import { fmtMoney } from "./types";
import type { Account, Category, CreditCard, Tx } from "./types";

// Escanear una boleta desde la app, sin depender del coach: se toma la foto,
// la IA lee el total y la fecha, y NucleoOS propone el gasto que calza. La
// persona aprueba antes de que se toque nada: adivinar sola sería peor que
// no hacer nada.

type Paso = "leyendo" | "revisar" | "listo";

export function EscanearBoleta({ txs, categories, accounts, cards, currency, onClose, onSaved }: {
  txs: Tx[];
  categories: Category[];
  accounts: Account[];
  cards: CreditCard[];
  currency: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t: tr } = useIdioma();
  const [paso, setPaso] = useState<Paso>("leyendo");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [lectura, setLectura] = useState<AnalisisBoleta | null>(null);
  const [elegido, setElegido] = useState<string>(""); // id del gasto, o "nuevo"
  const [categoria, setCategoria] = useState("");
  const [fuente, setFuente] = useState("");
  const [monto, setMonto] = useState("");
  const [comercio, setComercio] = useState("");
  const [fecha, setFecha] = useState(hoyLocal());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [resumen, setResumen] = useState("");
  // Se recalculan solos: si ella corrige el monto o la fecha, la lista de
  // gastos posibles se rehace al instante.
  const candidatos = useMemo(
    () => (Number(monto) > 0
      ? candidatosPara(txs, { monto: Number(monto), comercio, fecha })
      : []),
    [txs, monto, comercio, fecha],
  );
  // Se muestra el mejor cerco y nada más. El resto vive detrás de un toque.
  const { principales, otros } = useMemo(() => separar(candidatos), [candidatos]);
  const [verOtros, setVerOtros] = useState(false);
  const aMostrar = verOtros ? [...principales, ...otros] : principales;
  // Sus etiquetas, para poder ponerlas sin salir del escáner.
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([]);
  const [elegidas, setElegidas] = useState<Set<string>>(new Set());
  const [tagsDeCategoria, setTagsDeCategoria] = useState<Map<string, Etiqueta[]>>(new Map());
  useEffect(() => {
    listTags().then(setEtiquetas).catch(() => setEtiquetas([]));
    tagsPorCategoria().then(setTagsDeCategoria).catch(() => setTagsDeCategoria(new Map()));
  }, []);

  function alternarEtiqueta(id: string) {
    setElegidas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    // Si la categoría que estaba puesta no pertenece a la etiqueta nueva, se
    // suelta: dejarla puesta y escondida sería guardar algo que no se ve.
    setCategoria("");
  }
  const camara = useRef<HTMLInputElement>(null);
  const galeria = useRef<HTMLInputElement>(null);

  async function leer(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const liviano = file.type.startsWith("image/") ? await comprimirImagen(file) : file;
      setArchivo(liviano);
      const b64 = await blobToBase64(liviano);
      const r = await analizarBoleta(b64, liviano.type || "image/jpeg");
      if (!r.monto) {
        setErr(tr("No pude leer el total de esa boleta. Puedes escribirlo tú abajo."));
      }
      setLectura(r);
      setMonto(r.monto ? String(r.monto) : "");
      setComercio(r.comercio);
      const f = r.fecha ?? hoyLocal();
      setFecha(f);

      // El match solo se PROPONE: se marca de entrada únicamente cuando el
      // monto calza exacto. Con un monto distinto, elige ella.
      const cands = r.monto
        ? candidatosPara(txs, { monto: r.monto, comercio: r.comercio, fecha: f })
        : [];
      setElegido(esBuenMatch(cands[0]) ? cands[0].tx.id : "nuevo");
      setVerOtros(false);
      // Si la tarjeta viene en la boleta, la fuente queda propuesta.
      if (r.ultimos4) {
        const card = cards.find((c) => c.last_four === r.ultimos4);
        if (card) setFuente(`card:${card.id}`);
      }
      setPaso("revisar");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
      setPaso("revisar");
    } finally {
      setBusy(false);
    }
  }

  async function confirmar() {
    const valor = Number(monto);
    if (!(valor > 0)) { setErr(tr("Falta el monto.")); return; }
    setBusy(true);
    setErr(null);
    try {
      let txId: string;
      if (elegido && elegido !== "nuevo") {
        // Sobre un gasto que ya existe: se completa lo que le falta.
        const tx = txs.find((t) => t.id === elegido);
        if (!tx) throw new Error(tr("Ese movimiento ya no está."));
        txId = tx.id;
        const cambios = {
          date: tx.date,
          amount: Number(tx.amount),
          type: tx.type,
          description: tx.description,
          merchant: tx.merchant || comercio.trim() || null,
          bank_ref: tx.bank_ref ?? null,
          category_id: tx.category_id ?? (categoria || null),
          account_id: tx.account_id,
          destination_kind: tx.destination_kind,
          destination_ref: tx.destination_ref,
          payment_source_type: tx.payment_source_type ?? null,
          payment_source_id: tx.payment_source_id ?? null,
        };
        await updateTransaction(tx, cambios);
        setResumen(`${tr("Boleta pegada a")} ${tx.merchant || tx.bank_ref || tx.date}`);
      } else {
        // Gasto nuevo: la boleta no calzó con nada.
        const cardId = fuente.startsWith("card:") ? fuente.slice(5) : "";
        const accId = fuente.startsWith("acc:") ? fuente.slice(4) : "";
        await addTransaction({
          date: fecha,
          amount: valor,
          type: "expense",
          description: "",
          merchant: comercio.trim() || null,
          category_id: categoria || null,
          account_id: accId || null,
          payment_source_type: cardId ? "credit_card" : accId ? "account" : null,
          payment_source_id: cardId || accId || null,
          destination_kind: null,
          destination_ref: null,
        }, "recibo");
        // addTransaction no devuelve el id: se busca el recién creado.
        const { listTransactions } = await import("./data");
        const frescas = await listTransactions(20);
        const mia = frescas.find((t) => t.date === fecha && Math.abs(Number(t.amount) - valor) < 0.005);
        if (!mia) throw new Error(tr("Se guardó el gasto pero no pude adjuntar la boleta."));
        txId = mia.id;
        setResumen(`${tr("Gasto creado")}: ${comercio.trim() || tr("boleta")} ${fmtMoney(valor, currency)}`);
      }

      // Las etiquetas se agregan, no se reemplazan: si el gasto ya traía una
      // puesta desde la lista, sigue ahí.
      for (const tagId of elegidas) {
        try { await etiquetarTx(txId, tagId); } catch { /* una etiqueta repetida no es un error */ }
      }

      if (archivo) await uploadRecibo(txId, archivo);
      setPaso("listo");
      onSaved();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setBusy(false);
    }
  }

  // La etiqueta acorta la lista de categorías. Si una etiqueta elegida no
  // tiene ninguna categoría suya todavía, no se acorta nada: dejarla con la
  // lista vacía sería un callejón sin salida.
  const todosLosGastos = categories.filter((c) => c.type !== "income");
  const deLasElegidas = elegidas.size === 0 ? [] : todosLosGastos.filter((c) =>
    (tagsDeCategoria.get(c.id) ?? []).some((e) => elegidas.has(e.id)));
  const acotadas = deLasElegidas.length > 0;
  const gastos = acotadas ? deLasElegidas : todosLosGastos;

  return (
    <div className="tp-overlay" {...cierreDeFondo(onClose)}>
      <div className="tp" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 470 }}>
        <h3 style={{ marginBottom: 4 }}>🧾 {tr("Escanear boleta")}</h3>

        {paso === "leyendo" && (
          <>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5, marginBottom: 14 }}>
              {iaConfigured
                ? tr("Toma la foto y leo el total y la fecha. Después te muestro con qué gasto calza, y tú apruebas antes de que se guarde nada.")
                : tr("La IA no está configurada, así que la boleta se adjunta sin leerla.")}
            </p>
            <input ref={camara} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={(e) => void leer(e)} />
            <input ref={galeria} type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={(e) => void leer(e)} />
            <div style={{ display: "grid", gap: 8 }}>
              <button className="btn primary" {...sinRobarFoco} disabled={busy} onClick={() => camara.current?.click()}>
                <Camera size={15} style={{ verticalAlign: "-2px", marginRight: 6 }} />
                {busy ? tr("Leyendo la boleta…") : tr("Tomar foto")}
              </button>
              <button className="btn ghost" disabled={busy} onClick={() => galeria.current?.click()}>
                <ImagePlus size={15} style={{ verticalAlign: "-2px", marginRight: 6 }} />
                {tr("Subir una que ya tengo")}
              </button>
            </div>
          </>
        )}

        {paso === "revisar" && (
          <>
            <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 12 }}>
              {lectura?.monto
                ? `${tr("Leí")}: ${fmtMoney(lectura.monto, currency)}${lectura.comercio ? `, ${lectura.comercio}` : ""}${lectura.fecha ? `, ${lectura.fecha}` : ""}${lectura.ultimos4 ? `, •••• ${lectura.ultimos4}` : ""}`
                : tr("No logré leer la boleta. Complétala tú.")}
            </p>

            <div className="frow">
              <div className="field"><label>{tr("Monto")}</label>
                <input type="number" step="any" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0" /></div>
              <div className="field"><label>{tr("Fecha")}</label>
                <CampoFecha value={fecha} onChange={setFecha} ariaLabel={tr("Fecha")} conBorrar={false} /></div>
            </div>

            {candidatos.length > 0 && (
              <>
                <p style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".11em", color: "var(--muted)", fontWeight: 600, marginBottom: 6 }}>
                  {candidatos[0].cerco === "exacto"
                    ? tr("¿Es este el gasto de esta boleta?")
                    : tr("Ninguno calza exacto. ¿Es alguno de estos?")}
                </p>
                <div style={{ display: "grid", gap: 6, marginBottom: 12 }}>
                  {aMostrar.map(({ tx, cerco }) => (
                    <button key={tx.id} type="button" className="card"
                      onClick={() => setElegido(tx.id)}
                      style={{
                        display: "flex", gap: 10, alignItems: "center", padding: "10px 12px",
                        textAlign: "left", cursor: "pointer", font: "inherit", color: "inherit",
                        border: elegido === tx.id ? "2px solid var(--accent)" : "1px solid var(--line)",
                      }}>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <b style={{ fontSize: 13.5, display: "block" }}>{tx.merchant || tx.bank_ref || tr("Gasto")}</b>
                        <small style={{ color: "var(--muted)", fontSize: 11.5 }}>
                          {tx.date}{tx.category_id ? "" : `, ${tr("sin categoría")}`}
                          {cerco === "cercano" ? `, ${tr("monto parecido")}` : cerco === "fecha" ? `, ${tr("de esos días")}` : ""}
                        </small>
                      </span>
                      <b className="tnum" style={{ fontSize: 13.5 }}>{fmtMoney(Number(tx.amount), currency)}</b>
                    </button>
                  ))}
                  {otros.length > 0 && !verOtros && (
                    <button type="button" className="linklike" style={{ fontSize: 12, justifySelf: "start" }}
                      onClick={() => setVerOtros(true)}>
                      {tr("Ver otros gastos parecidos")} ({otros.length})
                    </button>
                  )}
                  <button type="button" className="card"
                    onClick={() => setElegido("nuevo")}
                    style={{
                      padding: "10px 12px", textAlign: "left", cursor: "pointer", font: "inherit", color: "inherit",
                      border: elegido === "nuevo" ? "2px solid var(--accent)" : "1px solid var(--line)",
                    }}>
                    <b style={{ fontSize: 13.5 }}>{tr("Ninguno, crear un gasto nuevo")}</b>
                  </button>
                </div>
              </>
            )}

            {candidatos.length === 0 && Number(monto) > 0 && (
              <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 12 }}>
                {tr("No encontré un gasto parecido. Si el monto de arriba está mal, corrígelo y busco de nuevo; si no, se crea uno nuevo.")}
              </p>
            )}

            {elegido === "nuevo" && (
              <>
                <div className="field"><label>{tr("Comercio")}</label>
                  <input value={comercio} onChange={(e) => setComercio(e.target.value)} placeholder="Starlink" /></div>
                <div className="field"><label>{tr("Pagado con")}</label>
                  <Selector value={fuente} ariaLabel={tr("Pagado con")} placeholder={tr("Sin cuenta")} onChange={setFuente}
                    opciones={[
                      { value: "", label: tr("Sin cuenta") },
                      ...accounts.map((a) => ({ value: `acc:${a.id}`, label: a.name })),
                      ...cards.map((c) => ({ value: `card:${c.id}`, label: `💳 ${c.name}${c.last_four ? ` •••• ${c.last_four}` : ""}` })),
                    ]} /></div>
              </>
            )}

            {/* Primero la etiqueta, después la categoría. La etiqueta dice de
                qué vida es el gasto (personal, empresa), y con eso la lista de
                categorías se acorta a las de esa vida. Las etiquetas son de
                ella: aquí solo se eligen las que ya creó. */}
            {etiquetas.length > 0 && (
              <div className="field">
                <label>{tr("Etiquetas")}</label>
                <ChipsEtiquetas etiquetas={etiquetas} puestas={elegidas} onToggle={alternarEtiqueta} />
              </div>
            )}

            <div className="field"><label>{tr("Categoría")}</label>
              <Selector value={categoria} ariaLabel={tr("Categoría")} placeholder={tr("Sin categoría")} onChange={setCategoria}
                opciones={[{ value: "", label: tr("Sin categoría") }, ...gastos.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` }))]} />
              {acotadas && (
                <small style={{ color: "var(--muted)", fontSize: 11.5 }}>
                  {tr("Solo las categorías de esa etiqueta.")}{" "}
                  <button type="button" className="linklike" style={{ fontSize: 11.5 }} onClick={() => setElegidas(new Set())}>
                    {tr("ver todas")}
                  </button>
                </small>
              )}
            </div>

            {err && <p style={{ color: "var(--err)", fontSize: 13, marginBottom: 10 }}>{err}</p>}
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <button className="btn ghost" onClick={onClose}>{tr("Cancelar")}</button>
              <button className="btn primary" {...sinRobarFoco} disabled={busy} onClick={() => void confirmar()}>
                {busy ? tr("com.guardando") : elegido === "nuevo" ? tr("Crear el gasto") : tr("Sí, es este")}
              </button>
            </div>
          </>
        )}

        {paso === "listo" && (
          <>
            <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.55, marginBottom: 16 }}>
              ✅ {resumen}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="btn primary" {...sinRobarFoco} onClick={onClose}>{tr("Listo")}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
