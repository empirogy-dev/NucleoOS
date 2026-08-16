import { useEffect, useMemo, useState } from "react";
import { X, RefreshCw, CalendarClock, TrendingUp, EyeOff, Repeat } from "lucide-react";
import { useIdioma } from "../idioma/IdiomaProvider";
import { AyudaTip } from "../components/AyudaTip";
import { cierreDeFondo } from "../components/cierreDeFondo";
import { fmtMoney, monedaDeTx, type Account, type Category, type CreditCard, type Tx } from "./types";
import type { Etiqueta } from "./tags";
import { buscarRecurrentes, progresoCuotas, type Cadencia, type Serie } from "./recurrentes";
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
  nombre: string;
  etiquetas: Etiqueta[];
  categoria: Category | null;
}

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
  onVerMovimientos: (s: Serie) => void;
  /** De dónde salen las decisiones ya tomadas. Se puede cambiar para poder
   *  probar la pantalla sin base de datos detrás. */
  cargarDecisiones?: () => Promise<DecisionSerie[]>;
}) {
  const { t: tr } = useIdioma();
  const [decisiones, setDecisiones] = useState<DecisionSerie[]>([]);
  const [preguntando, setPreguntando] = useState<Fila | null>(null);
  const [verParadas, setVerParadas] = useState(false);
  const [verIgnoradas, setVerIgnoradas] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => { void cargarDecisiones().then(setDecisiones); }, [cargarDecisiones]);
  const recargar = () => { void cargarDecisiones().then(setDecisiones); };

  const filas: Fila[] = useMemo(() => {
    const porCuenta = new Map(accounts.map((a) => [a.id, a.currency]));
    const porTarjeta = new Map(cards.map((c) => [c.id, c.currency]));
    const catPorId = new Map(categories.map((c) => [c.id, c]));

    return buscarRecurrentes(txs, {
      monedaDe: (t) => monedaDeTx(t, porCuenta, porTarjeta, currency),
    }).map((serie) => {
      const decision = decisionDe(serie, decisiones);
      // Un cargo lleva sus etiquetas y las de su categoría: si Software es de
      // Empirogy, todo lo que caiga ahí es de Empirogy sin marcarlo uno a uno.
      const ultima = serie.txs[serie.txs.length - 1];
      const propias = txTags.get(ultima.id) ?? [];
      const deCat = ultima.category_id ? catTags.get(ultima.category_id) ?? [] : [];
      const unicas = new Map([...propias, ...deCat].map((e) => [e.id, e]));
      return {
        serie,
        decision,
        nombre: decision?.name?.trim() || serie.nombre,
        etiquetas: [...unicas.values()],
        categoria: serie.categoriaId ? catPorId.get(serie.categoriaId) ?? null : null,
      };
    });
  }, [txs, accounts, cards, categories, currency, decisiones, txTags, catTags]);

  const cuotas = filas.filter((f) => f.decision?.kind === "installments" && f.decision.installments_total);
  const ignoradas = filas.filter((f) => f.decision?.kind === "ignored");
  const suscripciones = filas.filter((f) =>
    f.decision?.kind !== "installments" && f.decision?.kind !== "ignored");
  const activas = suscripciones.filter((f) => f.serie.activa);
  const paradas = suscripciones.filter((f) => !f.serie.activa);

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
                        total?: number, nombre?: string | null) {
    try {
      await guardarDecision(f.serie,
        { kind, installments_total: total ?? null, name: nombre ?? null }, f.decision);
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

  if (filas.length === 0) {
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
                    onClick={() => setPreguntando(f)}>{tr("Cambiar el número de cuotas")}</button>
                  <button className="btn ghost" style={{ fontSize: 12, padding: "5px 11px" }}
                    onClick={() => onVerMovimientos(f.serie)}>{tr("Ver los cargos")}</button>
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
            onCuotas={() => setPreguntando(f)}
            onIgnorar={() => void marcar(f, "ignored")}
            onVer={() => onVerMovimientos(f.serie)} />
        ))}
      </div>

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
                  onCuotas={() => setPreguntando(f)}
                  onIgnorar={() => void marcar(f, "ignored")}
                  onVer={() => onVerMovimientos(f.serie)} />
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
        <ModalCuotas f={preguntando} tr={tr}
          onClose={() => setPreguntando(null)}
          onGuardar={(n, nombre) => void marcar(preguntando, "installments", n, nombre)} />
      )}
    </>
  );
}

function FilaSerie({ f, tr, apagada, onCuotas, onIgnorar, onVer }: {
  f: Fila;
  tr: (k: string) => string;
  apagada?: boolean;
  onCuotas: () => void;
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
              {apagada ? <>{tr("el último")} {s.ultima}</> : <>{tr("el próximo")} {s.proxima}</>}
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
            {tr(CADENCIA_TEXTO[s.cadencia])}
          </div>
          {s.cadencia !== "anual" && (
            <div className="tnum" style={{ fontSize: 11.5, color: "var(--warn)", whiteSpace: "nowrap", marginTop: 2 }}>
              {fmtMoney(s.alAno, s.currency)} {tr("al año")}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
        <button className="btn ghost" style={{ fontSize: 12, padding: "5px 11px" }} onClick={onCuotas}>
          <Repeat size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />
          {tr("Es una compra en cuotas")}
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

/** Lo único que hay que preguntar: cuántas cuotas son en total. */
function ModalCuotas({ f, tr, onClose, onGuardar }: {
  f: Fila;
  tr: (k: string) => string;
  onClose: () => void;
  onGuardar: (n: number, nombre: string | null) => void;
}) {
  const yaVan = f.serie.txs.length;
  const [texto, setTexto] = useState(String(f.decision?.installments_total ?? ""));
  const [nombre, setNombre] = useState(f.decision?.name ?? "");
  const n = Number(texto);
  const valido = Number.isInteger(n) && n >= 2 && n <= 120;
  // Poner menos cuotas de las que ya llegaron no puede ser: son cargos reales.
  const suficiente = !valido || n >= yaVan;

  const atajos = [3, 4, 6, 12, 24].filter((x) => x >= yaVan);

  return (
    <div className="tp-overlay" {...cierreDeFondo(onClose)}>
      <div className="tp" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <h3>{tr("¿En cuántas cuotas?")}</h3>
          <button className="xdel" aria-label={tr("com.cerrar")} onClick={onClose}><X size={14} /></button>
        </div>
        <p style={{ lineHeight: 1.55 }}>
          <b>{f.nombre}</b>{" · "}{fmtMoney(f.serie.monto, f.serie.currency)} {tr(CADENCIA_TEXTO[f.serie.cadencia])}
          <br />
          {tr("Ya llegaron")} <b>{yaVan}</b> {yaVan === 1 ? tr("cuota") : tr("cuotas")}. {tr("Dime el total y calculo lo que falta.")}
        </p>

        {atajos.length > 0 && (
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", margin: "12px 0" }}>
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

        {/* El nombre del banco suele ser ilegible. Aquí, que es donde se está
            mirando la compra, es el momento natural de arreglarlo. */}
        <div className="field">
          <label htmlFor="cuotas-nombre">{tr("Ponle un nombre (opcional)")}</label>
          <input id="cuotas-nombre" type="text" maxLength={60} value={nombre}
            placeholder={f.serie.nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>

        {valido && suficiente && (
          <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 10, lineHeight: 1.55 }}>
            {(() => {
              const p = progresoCuotas(f.serie, n);
              return p.completa
                ? tr("Con eso ya la terminaste de pagar.")
                : `${tr("Quedarían")} ${p.restantes} ${p.restantes === 1 ? tr("cuota") : tr("cuotas")}`
                  + ` = ${fmtMoney(p.montoRestante, f.serie.currency)}. ${tr("La última caería el")} ${p.termina}.`;
            })()}
          </p>
        )}
        {!suficiente && (
          <p style={{ fontSize: 12.5, color: "var(--err)", marginTop: 10 }}>
            {tr("No pueden ser menos de las que ya te cobraron:")} {yaVan}.
          </p>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
          <button className="btn ghost" onClick={onClose}>{tr("Cancelar")}</button>
          <button className="btn primary" disabled={!valido || !suficiente} onClick={() => onGuardar(n, nombre.trim() || null)}>
            <RefreshCw size={13} style={{ verticalAlign: "-2px", marginRight: 5 }} />
            {tr("com.guardar")}
          </button>
        </div>
      </div>
    </div>
  );
}
