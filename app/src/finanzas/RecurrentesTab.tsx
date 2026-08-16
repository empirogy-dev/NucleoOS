import { useEffect, useMemo, useState } from "react";
import { X, RefreshCw, CalendarClock, TrendingUp, EyeOff, Repeat, Pencil } from "lucide-react";
import { useIdioma } from "../idioma/IdiomaProvider";
import { AyudaTip } from "../components/AyudaTip";
import { cierreDeFondo } from "../components/cierreDeFondo";
import { fmtMoney, monedaDeTx, type Account, type Category, type CreditCard, type Tx } from "./types";
import type { Etiqueta } from "./tags";
import { analizarRecurrentes, progresoCuotas, serieElegida, type Cadencia, type Serie } from "./recurrentes";
import {
  decisionDe, guardarDecision, listarDecisiones, olvidarDecision,
  type DecisionSerie,
} from "./seriesData";

// Lo que se te cobra solo: suscripciones y compras en cuotas.
//
// Las dos cosas viven juntas a propósito. La pregunta que se contesta aquí es
// una sola, "¿qué se me viene todos los meses?", y separarlas en dos pantallas
// obligaría a sumar de cabeza para responderla.
//
// Nada de esto se anota a mano. Las series salen de los cargos que ya están,
// y lo único que se pregunta es lo que la app no puede saber: cuántas cuotas
// son en total.

const CADENCIA_TEXTO: Record<Cadencia, string> = {
  semanal: "cada semana",
  quincenal: "cada dos semanas",
  mensual: "al mes",
  bimestral: "cada dos meses",
  trimestral: "cada tres meses",
  semestral: "cada seis meses",
  anual: "al año",
};

interface Fila {
  serie: Serie;
  decision: DecisionSerie | null;
  /** El ritmo lo reconoció la app sola. Si no, hace falta que la persona lo
   *  confirme antes de contarla en los totales. */
  detectada: boolean;
  /** Las fechas caen con un ritmo reconocible aunque falte evidencia. Sin
   *  esto, cuatro compras del mismo monto en fechas al azar se ofrecerían
   *  como suscripción, y eso es ruido, no una sugerencia. */
  conRitmo: boolean;
  nombre: string;
  etiquetas: Etiqueta[];
  categoria: Category | null;
}

/** Cuántas sugerencias se muestran de las que la app no reconoció sola.
 *  Todas serían cientos, y una lista de cientos no la revisa nadie. */
const TOPE_CANDIDATAS = 12;

export function RecurrentesTab({
  txs, accounts, cards, categories, currency, txTags, catTags, onVerMovimientos,
  cargarDecisiones = listarDecisiones,
}: {
  txs: Tx[];
  accounts: Account[];
  cards: CreditCard[];
  categories: Category[];
  currency: string;
  txTags: Map<string, Etiqueta[]>;
  catTags: Map<string, Etiqueta[]>;
  onVerMovimientos: (s: Serie, nombre: string) => void;
  /** De dónde salen las decisiones ya tomadas. Se puede cambiar para poder
   *  probar la pantalla sin base de datos detrás. */
  cargarDecisiones?: () => Promise<DecisionSerie[]>;
}) {
  const { t: tr } = useIdioma();
  const [decisiones, setDecisiones] = useState<DecisionSerie[]>([]);
  const [preguntando, setPreguntando] = useState<Fila | null>(null);
  const [verParadas, setVerParadas] = useState(false);
  const [verIgnoradas, setVerIgnoradas] = useState(false);
  const [fTag, setFTag] = useState("all");
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => { void cargarDecisiones().then(setDecisiones); }, [cargarDecisiones]);
  const recargar = () => { void cargarDecisiones().then(setDecisiones); };

  const todas: Fila[] = useMemo(() => {
    const porCuenta = new Map(accounts.map((a) => [a.id, a.currency]));
    const porTarjeta = new Map(cards.map((c) => [c.id, c.currency]));
    const catPorId = new Map(categories.map((c) => [c.id, c]));
    const opts = { monedaDe: (t: Tx) => monedaDeTx(t, porCuenta, porTarjeta, currency) };
    const txPorId = new Map(txs.map((t) => [t.id, t]));

    // Primero las series que la persona armó a mano eligiendo sus cargos.
    // Esos cargos se apartan y NO entran al detector: así los que quedan se
    // vuelven a agrupar solos y pueden formar su propia serie, que es
    // justamente lo que pasa cuando un intermediario cobra dos cosas.
    const aMano: Array<{ serie: Serie; detectada: boolean; conRitmo: boolean; decision: DecisionSerie }> = [];
    const apartados = new Set<string>();
    for (const d of decisiones) {
      if (!d.tx_ids?.length) continue;
      const cargos = d.tx_ids.map((id) => txPorId.get(id)).filter((t): t is Tx => !!t);
      const e = serieElegida(d.clave, cargos, opts);
      if (!e) continue;
      for (const t of cargos) apartados.add(t.id);
      aMano.push({ ...e, decision: d });
    }

    const detectadas = analizarRecurrentes(txs.filter((t) => !apartados.has(t.id)), opts)
      .map((e) => ({ ...e, decision: decisionDe(e.serie, decisiones) }));

    return [...aMano, ...detectadas]
      .sort((a, b) => b.serie.alAno - a.serie.alAno)
      .map(({ serie, detectada, conRitmo, decision }) => {
      // Un cargo lleva sus etiquetas y las de su categoría: si Software es de
      // Empirogy, todo lo que caiga ahí es de Empirogy sin marcarlo uno a uno.
      // Se miran TODOS los cargos de la serie y no solo el último: basta con
      // haber etiquetado uno para que la serie entera quede etiquetada.
      const unicas = new Map<string, Etiqueta>();
      for (const t of serie.txs) {
        for (const e of txTags.get(t.id) ?? []) unicas.set(e.id, e);
        for (const e of (t.category_id ? catTags.get(t.category_id) ?? [] : [])) unicas.set(e.id, e);
      }
      return {
        serie,
        decision,
        detectada,
        conRitmo,
        nombre: decision?.name?.trim() || serie.nombre,
        etiquetas: [...unicas.values()],
        categoria: serie.categoriaId ? catPorId.get(serie.categoriaId) ?? null : null,
      };
    });
  }, [txs, accounts, cards, categories, currency, decisiones, txTags, catTags]);

  // Dos series del mismo comercio con el mismo nombre son indistinguibles en
  // pantalla, y eso pasa de verdad: Klarna cobra las cuotas de la antena y el
  // internet, las dos veces diciendo "Klarna". Cuando el nombre se repite y
  // nadie le puso uno propio, se le agrega el monto, que es lo que las separa.
  const conNombreUnico: Fila[] = useMemo(() => {
    const cuantos = new Map<string, number>();
    for (const f of todas) cuantos.set(f.nombre, (cuantos.get(f.nombre) ?? 0) + 1);
    return todas.map((f) => (
      cuantos.get(f.nombre)! > 1 && !f.decision?.name?.trim()
        ? { ...f, nombre: `${f.nombre} · ${fmtMoney(f.serie.monto, f.serie.currency)}` }
        : f));
  }, [todas]);

  // Las etiquetas que de verdad aparecen aquí. Ofrecer las que no tienen nada
  // que filtrar solo agrega botones que no hacen nada.
  const etiquetasPresentes = useMemo(() => {
    const mapa = new Map<string, Etiqueta>();
    for (const f of conNombreUnico) for (const e of f.etiquetas) mapa.set(e.id, e);
    return [...mapa.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [conNombreUnico]);

  const filas = useMemo(
    () => (fTag === "all"
      ? conNombreUnico
      : conNombreUnico.filter((f) => f.etiquetas.some((e) => e.id === fTag))),
    [conNombreUnico, fTag],
  );

  const cuotas = filas.filter((f) => f.decision?.kind === "installments" && f.decision.installments_total);
  const ignoradas = filas.filter((f) => f.decision?.kind === "ignored");
  // Una serie cuenta como suscripción si la app reconoció el ritmo o si la
  // persona dijo que lo es. Lo segundo hace falta: hay suscripciones con dos
  // cobros, o a las que les cambian el monto todos los meses, y la app no
  // puede reconocerlas por su cuenta.
  const suscripciones = filas.filter((f) =>
    f.decision?.kind !== "installments" && f.decision?.kind !== "ignored"
    && (f.detectada || f.decision?.kind === "subscription"));
  const activas = suscripciones.filter((f) => f.serie.activa);
  const paradas = suscripciones.filter((f) => !f.serie.activa);

  // Las que se repiten pero sin un ritmo claro. Se muestran para confirmar,
  // no se cuentan en ningún total mientras nadie las confirme.
  const candidatasTodas = filas
    .filter((f) => !f.detectada && f.conRitmo && !f.decision && f.serie.txs.length >= 2);
  const candidatas = candidatasTodas.slice(0, TOPE_CANDIDATAS);

  // Los totales se cuentan por moneda: sumar dólares con pesos da un número
  // que no existe. Se muestra el de la moneda principal y, si hay otras, cada
  // una en su línea.
  const totales = useMemo(() => {
    const mapa = new Map<string, { alMes: number; alAno: number }>();
    for (const f of activas) {
      const cur = f.serie.currency;
      const t = mapa.get(cur) ?? { alMes: 0, alAno: 0 };
      t.alMes += f.serie.alMes;
      t.alAno += f.serie.alAno;
      mapa.set(cur, t);
    }
    return [...mapa.entries()].sort((a, b) => b[1].alAno - a[1].alAno);
  }, [activas]);

  const porPagar = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const f of cuotas) {
      const p = progresoCuotas(f.serie, f.decision!.installments_total!);
      if (p.completa) continue;
      mapa.set(f.serie.currency, (mapa.get(f.serie.currency) ?? 0) + p.montoRestante);
    }
    return [...mapa.entries()].sort((a, b) => b[1] - a[1]);
  }, [cuotas]);

  // Cuánto de esto es de cada etiqueta: el número que contesta "¿cuánto me
  // cuesta Empirogy al mes?" sin sacar la calculadora.
  const porEtiqueta = useMemo(() => {
    const mapa = new Map<string, { etiqueta: Etiqueta; alMes: number; cuantas: number }>();
    for (const f of activas) {
      for (const e of f.etiquetas) {
        const v = mapa.get(e.id) ?? { etiqueta: e, alMes: 0, cuantas: 0 };
        v.alMes += f.serie.alMes;
        v.cuantas += 1;
        mapa.set(e.id, v);
      }
    }
    return [...mapa.values()].sort((a, b) => b.alMes - a.alMes);
  }, [activas]);

  async function marcar(f: Fila, kind: "subscription" | "installments" | "ignored",
                        total?: number, nombre?: string | null, cargos?: string[] | null) {
    try {
      await guardarDecision(f.serie,
        { kind, installments_total: total ?? null, name: nombre ?? null, tx_ids: cargos ?? null },
        f.decision);
      recargar();
      setPreguntando(null);
    } catch (e) {
      setAviso(e instanceof Error ? e.message : String(e));
    }
  }

  async function deshacer(f: Fila) {
    if (!f.decision) return;
    try {
      await olvidarDecision(f.decision);
      recargar();
    } catch (e) {
      setAviso(e instanceof Error ? e.message : String(e));
    }
  }

  if (todas.length === 0) {
    return (
      <div className="card pad">
        <h3 style={{ marginBottom: 8 }}>{tr("Todavía no encuentro nada que se repita")}</h3>
        <p style={{ color: "var(--muted)", fontSize: 13.5, lineHeight: 1.6 }}>
          {tr("Para reconocer una suscripción hacen falta al menos tres cobros del mismo comercio por el mismo monto, más o menos cada mes. En cuanto los tengas van a aparecer solos aquí, sin que anotes nada.")}
        </p>
      </div>
    );
  }

  return (
    <>
      {aviso && (
        <div className="card pad" style={{ borderLeft: "3px solid var(--warn)", marginBottom: 14, fontSize: 13.5 }}>
          {aviso}
          {/^(relation|could not find|.*does not exist)/i.test(aviso) && (
            <> {tr("Falta correr la migración 0068.")}</>
          )}
        </div>
      )}

      {/* El filtro por etiqueta manda sobre todo lo que sigue, totales
          incluidos: con Empirogy puesto, "se te cobra al mes" es lo que te
          cobra Empirogy al mes y no lo que te cobra todo junto. */}
      {etiquetasPresentes.length > 0 && (
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 14, alignItems: "center" }}>
          <button type="button" className={"btn " + (fTag === "all" ? "primary" : "ghost")}
            style={{ fontSize: 12.5, padding: "6px 13px" }} onClick={() => setFTag("all")}>
            {tr("Todas")}
          </button>
          {etiquetasPresentes.map((e) => (
            <button key={e.id} type="button" className={"btn " + (fTag === e.id ? "primary" : "ghost")}
              style={fTag === e.id && e.color
                ? { fontSize: 12.5, padding: "6px 13px", background: e.color, borderColor: e.color }
                : { fontSize: 12.5, padding: "6px 13px" }}
              onClick={() => setFTag(e.id)}>
              {e.name}
            </button>
          ))}
        </div>
      )}

      {filas.length === 0 && (
        <div className="card pad" style={{ marginBottom: 14 }}>
          <p style={{ color: "var(--muted)", fontSize: 13.5 }}>
            {tr("Con esa etiqueta no hay nada que se repita.")}
          </p>
        </div>
      )}

      <div className="statrow" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <div className="card stat">
          <div className="k">
            {tr("Se te cobra al mes")}
            <AyudaTip etiqueta={tr("Qué significa")} texto={tr("La suma de todo lo que se cobra solo, llevado a un mes. Un cobro anual se divide en doce y uno semanal se multiplica, para que todo se pueda comparar en la misma escala.")} />
          </div>
          <div className="v tnum">
            {totales.length === 0
              ? fmtMoney(0, currency)
              : totales.map(([cur, t]) => <span key={cur} style={{ display: "block" }}>{fmtMoney(t.alMes, cur)}</span>)}
          </div>
        </div>
        <div className="card stat">
          <div className="k">
            {tr("En un año")}
            <AyudaTip etiqueta={tr("Qué significa")} texto={tr("Lo mismo de al lado multiplicado por doce. Es el número que conviene mirar antes de decidir si algo vale la pena: nueve dólares al mes suenan a nada y son ciento ocho al año.")} />
          </div>
          <div className="v tnum" style={{ color: "var(--warn)" }}>
            {totales.length === 0
              ? fmtMoney(0, currency)
              : totales.map(([cur, t]) => <span key={cur} style={{ display: "block" }}>{fmtMoney(t.alAno, cur)}</span>)}
          </div>
        </div>
        <div className="card stat">
          <div className="k">
            {tr("Cuotas por pagar")}
            <AyudaTip etiqueta={tr("Qué significa")} texto={tr("Lo que te falta de las compras en cuotas: las cuotas que quedan por su monto. Esta plata ya la debes aunque todavía no salga de tu cuenta.")} />
          </div>
          <div className="v tnum" style={{ color: porPagar.length ? "var(--err)" : undefined }}>
            {porPagar.length === 0
              ? fmtMoney(0, currency)
              : porPagar.map(([cur, v]) => <span key={cur} style={{ display: "block" }}>{fmtMoney(v, cur)}</span>)}
          </div>
        </div>
        <div className="card stat">
          <div className="k">{tr("Suscripciones activas")}</div>
          <div className="v tnum">{activas.length}</div>
        </div>
      </div>

      {porEtiqueta.length > 0 && (
        <div className="card panel" style={{ marginBottom: 14 }}>
          <h3 style={{ marginBottom: 10 }}>{tr("De esto, cada etiqueta cuesta")}</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {porEtiqueta.map((v) => (
              <div key={v.etiqueta.id} style={{
                border: "1px solid var(--line)", borderRadius: 12, padding: "8px 12px", minWidth: 0,
              }}>
                <span className="chip" style={v.etiqueta.color ? { background: v.etiqueta.color, color: "#fff" } : undefined}>
                  {v.etiqueta.name}
                </span>
                <div className="tnum" style={{ fontWeight: 700, marginTop: 5, whiteSpace: "nowrap" }}>
                  {fmtMoney(v.alMes, currency)} <span style={{ fontWeight: 400, color: "var(--muted)", fontSize: 12 }}>{tr("al mes")}</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>
                  {v.cuantas} {v.cuantas === 1 ? tr("suscripción") : tr("suscripciones")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {cuotas.length > 0 && (
        <div className="card panel" style={{ marginBottom: 14 }}>
          <h3 style={{ marginBottom: 4 }}>{tr("Compras en cuotas")}</h3>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14, lineHeight: 1.5 }}>
            {tr("Cuántas van y cuántas quedan. Las cuotas pagadas se cuentan desde los cargos que llegaron de verdad, no desde el calendario.")}
          </p>
          {cuotas.map((f) => {
            const p = progresoCuotas(f.serie, f.decision!.installments_total!);
            return (
              <div key={f.serie.clave} className="bar" style={{ marginBottom: 16 }}>
                <div className="top" style={{ alignItems: "flex-start", gap: 10 }}>
                  <span className="lbl" style={{ flexWrap: "wrap" }}>
                    <b style={{ color: "var(--ink)" }}>{f.nombre}</b>
                    {p.completa && <span className="chip" style={{ background: "var(--ok)", color: "#fff" }}>{tr("pagada")}</span>}
                  </span>
                  {/* "4 / 12 cuotas" y no "van 4 de 12": el orden de las
                      palabras cambia en cada idioma, el de los números no. */}
                  <b className="tnum" style={{ whiteSpace: "nowrap" }}>
                    {p.pagadas} / {p.total} {tr("cuotas")}
                  </b>
                </div>
                <div className="track">
                  <div className="fill" style={{
                    width: `${Math.round((p.pagadas / p.total) * 100)}%`,
                    background: p.completa ? "var(--ok)" : "var(--fin)",
                  }} />
                </div>
                <div style={{
                  display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap",
                  fontSize: 12, color: "var(--muted)", marginTop: 6,
                }}>
                  <span>
                    {fmtMoney(f.serie.monto, f.serie.currency)} {tr(CADENCIA_TEXTO[f.serie.cadencia])}
                    {" · "}{tr("total")} {fmtMoney(p.montoTotal, f.serie.currency)}
                  </span>
                  <span>
                    {p.completa
                      ? tr("Ya no te la cobran más.")
                      : <>{tr("te faltan")} <b className="tnum" style={{ color: "var(--err)" }}>{fmtMoney(p.montoRestante, f.serie.currency)}</b>{tr(", última el")} {p.termina}</>}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                  <button className="btn ghost" style={{ fontSize: 12, padding: "5px 11px" }}
                    onClick={() => setPreguntando(f)}>{tr("Nombre y cuotas")}</button>
                  <button className="btn ghost" style={{ fontSize: 12, padding: "5px 11px" }}
                    onClick={() => onVerMovimientos(f.serie, f.nombre)}>{tr("Ver los cargos")}</button>
                  <button className="btn ghost" style={{ fontSize: 12, padding: "5px 11px" }}
                    onClick={() => void deshacer(f)}>{tr("No son cuotas")}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="card panel" style={{ marginBottom: 14 }}>
        <h3 style={{ marginBottom: 4 }}>{tr("Suscripciones activas")}</h3>
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12, lineHeight: 1.5 }}>
          {tr("Salen solas de tus cargos: mismo comercio, mismo monto, mismo ritmo. Las más caras al año van primero, porque ahí es donde conviene decidir.")}
        </p>
        {activas.length === 0 && (
          <p style={{ color: "var(--muted)", fontSize: 13 }}>{tr("Ninguna activa ahora mismo.")}</p>
        )}
        {activas.map((f) => (
          <FilaSerie key={f.serie.clave} f={f} tr={tr}
            onEditar={() => setPreguntando(f)}
            onIgnorar={() => void marcar(f, "ignored")}
            onVer={() => onVerMovimientos(f.serie, f.nombre)} />
        ))}
      </div>

      {candidatas.length > 0 && (
        <div className="card panel" style={{ marginBottom: 14 }}>
          <h3 style={{ marginBottom: 4 }}>{tr("¿Falta alguna?")}</h3>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12, lineHeight: 1.5 }}>
            {tr("Estos cargos se repiten pero sin un ritmo lo bastante claro para darlos por seguros: pueden ser pocos todavía, o venir con montos que cambian. Confírmalos tú y pasan a contar en los totales.")}
          </p>
          {candidatas.map((f) => (
            <FilaSerie key={f.serie.clave} f={f} tr={tr} candidata
              onSuscripcion={() => void marcar(f, "subscription")}
              onEditar={() => setPreguntando(f)}
              onIgnorar={() => void marcar(f, "ignored")}
              onVer={() => onVerMovimientos(f.serie, f.nombre)} />
          ))}
          {candidatasTodas.length > candidatas.length && (
            <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 10, lineHeight: 1.5 }}>
              {tr("Hay")} {candidatasTodas.length - candidatas.length} {tr("más que no se muestran, de menor monto. Si te falta una en particular, márcala desde el lápiz de cualquiera de sus movimientos.")}
            </p>
          )}
        </div>
      )}

      {paradas.length > 0 && (
        <div className="card panel" style={{ marginBottom: 14 }}>
          <button className="linklike" style={{ fontSize: 13.5, fontWeight: 600 }}
            onClick={() => setVerParadas(!verParadas)}>
            {verParadas ? "▾ " : "▸ "}{paradas.length} {paradas.length === 1 ? tr("que dejó de cobrarse") : tr("que dejaron de cobrarse")}
          </button>
          {verParadas && (
            <>
              <p style={{ fontSize: 12, color: "var(--muted)", margin: "8px 0 12px", lineHeight: 1.5 }}>
                {tr("Se cobraban con ritmo y el último cargo ya quedó atrás. O la cancelaste, o dejaron de poder cobrarte y conviene revisarlo.")}
              </p>
              {paradas.map((f) => (
                <FilaSerie key={f.serie.clave} f={f} tr={tr} apagada
                  onEditar={() => setPreguntando(f)}
                  onIgnorar={() => void marcar(f, "ignored")}
                  onVer={() => onVerMovimientos(f.serie, f.nombre)} />
              ))}
            </>
          )}
        </div>
      )}

      {ignoradas.length > 0 && (
        <div className="card panel">
          <button className="linklike" style={{ fontSize: 13.5, fontWeight: 600 }}
            onClick={() => setVerIgnoradas(!verIgnoradas)}>
            {verIgnoradas ? "▾ " : "▸ "}{ignoradas.length} {tr("que marcaste como no suscripción")}
          </button>
          {verIgnoradas && (
            <div style={{ marginTop: 10 }}>
              {ignoradas.map((f) => (
                <div key={f.serie.clave} style={{
                  display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap",
                  padding: "8px 0", borderTop: "1px solid var(--line-soft)", fontSize: 13,
                }}>
                  <span style={{ flex: 1, minWidth: 140, color: "var(--muted)" }}>{f.nombre}</span>
                  <span className="tnum" style={{ color: "var(--muted)" }}>{fmtMoney(f.serie.monto, f.serie.currency)}</span>
                  <button className="btn ghost" style={{ fontSize: 12, padding: "5px 11px" }}
                    onClick={() => void deshacer(f)}>{tr("Volver a mostrarla")}</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {preguntando && (
        <ModalSerie f={preguntando} tr={tr}
          onClose={() => setPreguntando(null)}
          onGuardar={(kind, total, nombre, cargos) =>
            void marcar(preguntando, kind, total ?? undefined, nombre, cargos)} />
      )}
    </>
  );
}

function FilaSerie({ f, tr, apagada, candidata, onSuscripcion, onEditar, onIgnorar, onVer }: {
  f: Fila;
  tr: (k: string) => string;
  apagada?: boolean;
  /** Todavía no está confirmada: los montos se muestran como estimación y no
   *  suman en ningún total. */
  candidata?: boolean;
  onSuscripcion?: () => void;
  onEditar: () => void;
  onIgnorar: () => void;
  onVer: () => void;
}) {
  const s = f.serie;
  const subio = s.montoAnterior !== null && s.monto > s.montoAnterior;

  return (
    <div style={{
      borderTop: "1px solid var(--line-soft)", padding: "12px 0",
      opacity: apagada ? 0.72 : 1,
    }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 170 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
            <b style={{ fontSize: 14 }}>{f.nombre}</b>
            {f.etiquetas.map((e) => (
              <span key={e.id} className="chip" style={e.color ? { background: e.color, color: "#fff" } : undefined}>
                {e.name}
              </span>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span>{f.categoria ? `${f.categoria.icon ?? ""} ${f.categoria.name}` : tr("Sin categoría")}</span>
            <span>{s.txs.length} {s.txs.length === 1 ? tr("cargo") : tr("cargos")}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <CalendarClock size={11} />
              {apagada || candidata
                ? <>{tr("el último")} {s.ultima}</>
                : <>{tr("el próximo")} {s.proxima}</>}
            </span>
          </div>
          {subio && (
            <div style={{ fontSize: 11.5, color: "var(--warn)", marginTop: 4, display: "flex", alignItems: "center", gap: 5 }}>
              <TrendingUp size={12} />
              {tr("te subió el precio:")} {fmtMoney(s.montoAnterior!, s.currency)} → {fmtMoney(s.monto, s.currency)}
            </div>
          )}
        </div>
        <div style={{ textAlign: "right", minWidth: 0 }}>
          <div className="tnum" style={{ fontWeight: 700, fontSize: 15, whiteSpace: "nowrap" }}>
            {fmtMoney(s.monto, s.currency)}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--muted)", whiteSpace: "nowrap" }}>
            {s.montoVariable
              ? tr("el último cargo")
              : candidata ? tr("el último cargo") : tr(CADENCIA_TEXTO[s.cadencia])}
          </div>
          {s.montoVariable && (
            <div className="tnum" style={{ fontSize: 11.5, color: "var(--muted)", whiteSpace: "nowrap", marginTop: 2 }}>
              {tr("cambia, promedio")} {fmtMoney(s.promedio, s.currency)}
            </div>
          )}
          {!candidata && s.cadencia !== "anual" && (
            <div className="tnum" style={{ fontSize: 11.5, color: "var(--warn)", whiteSpace: "nowrap", marginTop: 2 }}>
              {fmtMoney(s.alAno, s.currency)} {tr("al año")}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
        {onSuscripcion && (
          <button className="btn ghost" style={{ fontSize: 12, padding: "5px 11px" }} onClick={onSuscripcion}>
            <Repeat size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />
            {tr("Sí, es una suscripción")}
          </button>
        )}
        <button className="btn ghost" style={{ fontSize: 12, padding: "5px 11px" }} onClick={onEditar}>
          <Pencil size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />
          {tr("Nombre y tipo")}
        </button>
        <button className="btn ghost" style={{ fontSize: 12, padding: "5px 11px" }} onClick={onVer}>
          {tr("Ver los cargos")}
        </button>
        <button className="btn ghost" style={{ fontSize: 12, padding: "5px 11px" }} onClick={onIgnorar}>
          <EyeOff size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />
          {tr("No es una suscripción")}
        </button>
      </div>
    </div>
  );
}

/** Ponerle nombre a una serie y decir si es suscripción o compra en cuotas.
 *
 *  El nombre no es un adorno: cuando un intermediario cobra dos cosas, los
 *  dos cargos dicen lo mismo ("Klarna") y en pantalla son indistinguibles.
 *  Poder llamarlas "Antena Starlink" e "Internet Starlink" es lo que hace que
 *  la lista se entienda de un vistazo. */
function ModalSerie({ f, tr, onClose, onGuardar }: {
  f: Fila;
  tr: (k: string) => string;
  onClose: () => void;
  onGuardar: (kind: "subscription" | "installments", total: number | null, nombre: string | null,
              cargos: string[] | null) => void;
}) {
  const [kind, setKind] = useState<"subscription" | "installments">(
    f.decision?.kind === "installments" ? "installments" : "subscription");
  const [texto, setTexto] = useState(String(f.decision?.installments_total ?? ""));
  const [nombre, setNombre] = useState(f.decision?.name ?? "");
  // Qué cargos son de esta serie. Empiezan todos marcados, que es lo que la
  // app dedujo; desmarcar es la forma de decir "ese es de otra cosa".
  const [elegidos, setElegidos] = useState<Set<string>>(
    () => new Set(f.serie.txs.map((t) => t.id)));
  const [verCargos, setVerCargos] = useState(false);
  const yaVan = elegidos.size;
  const separando = elegidos.size !== f.serie.txs.length;
  const n = Number(texto);
  const valido = Number.isInteger(n) && n >= 2 && n <= 120;
  // Poner menos cuotas de las que ya llegaron no puede ser: son cargos reales.
  const suficiente = !valido || n >= yaVan;
  const puedeGuardar = yaVan >= 2 && (kind === "subscription" || (valido && suficiente));

  const atajos = [3, 4, 6, 12, 24].filter((x) => x >= yaVan);

  return (
    <div className="tp-overlay" {...cierreDeFondo(onClose)}>
      <div className="tp" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <h3>{tr("Editar esto que se repite")}</h3>
          <button className="xdel" aria-label={tr("com.cerrar")} onClick={onClose}><X size={14} /></button>
        </div>
        <p style={{ lineHeight: 1.55 }}>
          {/* El nombre crudo, no el de la lista: ese ya trae el monto pegado
              cuando hay dos series del mismo comercio, y aquí saldría dos
              veces seguidas. */}
          <b>{f.decision?.name?.trim() || f.serie.nombre}</b>
          {" · "}{fmtMoney(f.serie.monto, f.serie.currency)} {tr(CADENCIA_TEXTO[f.serie.cadencia])}
          <br />
          {yaVan} {yaVan === 1 ? tr("cargo") : tr("cargos")}, {tr("desde el")} {f.serie.primera}.
        </p>

        <div className="field" style={{ marginTop: 12 }}>
          <label htmlFor="serie-nombre">{tr("Nombre")}</label>
          <input id="serie-nombre" type="text" maxLength={60} value={nombre}
            placeholder={f.serie.nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "4px 0 12px" }}>
          <button type="button" className={"btn " + (kind === "subscription" ? "primary" : "ghost")}
            style={{ fontSize: 13, padding: "6px 14px" }}
            onClick={() => setKind("subscription")}>{tr("Suscripción")}</button>
          <button type="button" className={"btn " + (kind === "installments" ? "primary" : "ghost")}
            style={{ fontSize: 13, padding: "6px 14px" }}
            onClick={() => setKind("installments")}>{tr("Compra en cuotas")}</button>
        </div>

        {/* Separar dos cosas que el mismo comercio cobra a la vez.
            Klarna cobra las cuotas de la antena y el internet mensual por
            montos casi iguales, y ninguna regla puede adivinar cuál es cuál.
            Los que se desmarcan vuelven a la lista y arman su propia serie. */}
        <button type="button" className="linklike" style={{ fontSize: 12.5, fontWeight: 600 }}
          onClick={() => setVerCargos(!verCargos)}>
          {verCargos ? "▾ " : "▸ "}{tr("¿Están todos los cargos correctos?")}
        </button>
        {verCargos && (
          <div style={{ marginTop: 8, border: "1px solid var(--line)", borderRadius: 10, padding: "8px 10px" }}>
            <p style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 8, lineHeight: 1.5 }}>
              {tr("Desmarca los que no sean de esto. Vuelven a la lista y pueden formar su propia serie, que es lo que hay que hacer cuando un mismo cobrador te cobra dos cosas distintas.")}
            </p>
            <div style={{ maxHeight: 190, overflowY: "auto" }}>
              {f.serie.txs.map((t) => (
                <label key={t.id} style={{
                  display: "flex", alignItems: "center", gap: 8, fontSize: 12.5,
                  padding: "5px 0", cursor: "pointer",
                }}>
                  <input type="checkbox" checked={elegidos.has(t.id)}
                    style={{ width: 15, height: 15, accentColor: "var(--accent)", flex: "none" }}
                    onChange={(e) => setElegidos((s) => {
                      const n2 = new Set(s);
                      if (e.target.checked) n2.add(t.id); else n2.delete(t.id);
                      return n2;
                    })} />
                  <span style={{ flex: 1, minWidth: 0 }}>{t.date}</span>
                  <span className="tnum" style={{ whiteSpace: "nowrap" }}>
                    {fmtMoney(Number(t.amount), f.serie.currency)}
                  </span>
                </label>
              ))}
            </div>
            {yaVan < 2 && (
              <p style={{ fontSize: 12, color: "var(--err)", marginTop: 6 }}>
                {tr("Deja al menos dos cargos: con uno solo no hay nada que se repita.")}
              </p>
            )}
          </div>
        )}

        {kind === "installments" && (
          <>
            {atajos.length > 0 && (
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>
                {atajos.map((x) => (
                  <button key={x} type="button"
                    className={"btn " + (n === x ? "primary" : "ghost")}
                    style={{ fontSize: 13, padding: "6px 14px" }}
                    onClick={() => setTexto(String(x))}>{x}</button>
                ))}
              </div>
            )}
            <div className="field">
              <label htmlFor="cuotas-total">{tr("Total de cuotas")}</label>
              <input id="cuotas-total" type="number" min={Math.max(2, yaVan)} max={120} inputMode="numeric"
                value={texto} onChange={(e) => setTexto(e.target.value)} />
            </div>
            {valido && suficiente && (
              <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 4, lineHeight: 1.55 }}>
                {(() => {
                  // Con cargos desmarcados el cálculo se hace sobre los que
                  // quedan, no sobre los que la app había juntado. Y no se
                  // promete una fecha final, porque el ritmo se recalcula
                  // recién cuando la serie queda separada.
                  const p = progresoCuotas({ ...f.serie, txs: f.serie.txs.filter((t) => elegidos.has(t.id)) }, n);
                  if (p.completa) return tr("Con eso ya la terminaste de pagar.");
                  const base = `${tr("Quedarían")} ${p.restantes} ${p.restantes === 1 ? tr("cuota") : tr("cuotas")}`
                    + ` = ${fmtMoney(p.montoRestante, f.serie.currency)}.`;
                  return separando ? base : `${base} ${tr("La última caería el")} ${p.termina}.`;
                })()}
              </p>
            )}
            {!suficiente && (
              <p style={{ fontSize: 12.5, color: "var(--err)", marginTop: 4 }}>
                {tr("No pueden ser menos de las que ya te cobraron:")} {yaVan}.
              </p>
            )}
          </>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
          <button className="btn ghost" onClick={onClose}>{tr("Cancelar")}</button>
          <button className="btn primary" disabled={!puedeGuardar}
            onClick={() => onGuardar(kind, kind === "installments" ? n : null, nombre.trim() || null,
              separando ? [...elegidos] : null)}>
            <RefreshCw size={13} style={{ verticalAlign: "-2px", marginRight: 5 }} />
            {tr("com.guardar")}
          </button>
        </div>
      </div>
    </div>
  );
}
