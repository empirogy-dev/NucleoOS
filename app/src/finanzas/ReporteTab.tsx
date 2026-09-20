import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, TrendingDown, TrendingUp } from "lucide-react";
import { useIdioma } from "../idioma/IdiomaProvider";
import { Selector } from "../components/Selector";
import { AyudaTip } from "../components/AyudaTip";
import { sinRobarFoco } from "../components/cierreDeFondo";
import { hoyLocal, mesActualLocal } from "../lib/fechas";
import { BarraRango, ColumnasMeses, Dona } from "./Graficos";
import { ExportarReporte } from "./ExportarReporte";
import type { ResueltoTx } from "./informeFinanzas";
import {
  armarInformeFinanzas,
  plata,
  rangoDePreset,
  textoCadencia,
  type Informe,
  type Preset,
  type Tono,
} from "./reporte";
import { listarDecisiones, type DecisionSerie } from "./seriesData";
import { fmtMoney, modoPrivado, monedaDeTx, type Account, type Category, type CreditCard, type Debt, type Tx } from "./types";
import type { Etiqueta } from "./tags";

// La pestaña Reporte: el coach financiero.
//
// La pregunta que contesta no es "cuánto tengo", que ya está en Resumen. Es
// "a dónde se me está yendo, qué cambió, y qué hago con eso". Por eso el orden
// de la pantalla es el de una conversación: primero cómo cerró el periodo,
// después en qué se fue, después lo que se cobra solo sin que nadie mire,
// después lo que se ve en esos números, y al final dónde hay plata que
// recuperar. Arriba del todo, el botón de exportar, porque estos números
// existen en parte para mostrárselos a otra persona.
//
// Todo lo que se muestra aquí sale de `reporte.ts`, y lo que se exporta sale
// del mismo objeto. La pantalla y el PDF no pueden decir cosas distintas.

const PRESETS: Array<{ value: Preset; label: string }> = [
  { value: "mes", label: "Este mes" },
  { value: "mesPasado", label: "El mes pasado" },
  { value: "tres", label: "Últimos 3 meses" },
  { value: "seis", label: "Últimos 6 meses" },
  { value: "doce", label: "Últimos 12 meses" },
  { value: "anio", label: "Este año" },
  { value: "todo", label: "Todo lo registrado" },
];

const COLOR_TONO: Record<Tono, string> = {
  bien: "var(--ok)",
  ojo: "var(--warn)",
  alerta: "var(--err)",
};

const TEXTO_FRICCION: Record<string, string> = {
  baja: "Cuesta poco",
  media: "Cuesta un poco de costumbre",
  alta: "Cuesta mantenerlo",
};

export function ReporteTab({ txs, categories, accounts, cards, debts, currency, txTags, catTags }: {
  txs: Tx[];
  categories: Category[];
  accounts: Account[];
  cards: CreditCard[];
  debts: Debt[];
  currency: string;
  txTags: Map<string, Etiqueta[]>;
  catTags: Map<string, Etiqueta[]>;
}) {
  const { t: tr } = useIdioma();
  const [preset, setPreset] = useState<Preset | "custom">("tres");
  const [desdeManual, setDesdeManual] = useState(`${mesActualLocal()}-01`);
  const [hastaManual, setHastaManual] = useState(hoyLocal());
  const [exportar, setExportar] = useState(false);
  // Lo que ya se decidió en la pestaña Recurrentes: qué es suscripción, qué es
  // cuota y qué no es ninguna de las dos. Sin esto el informe contaría cargos
  // que ella ya descartó ahí al lado, y las dos pantallas dirían cosas
  // distintas. Si la tabla todavía no existe, se sigue sin ellas.
  const [decisiones, setDecisiones] = useState<DecisionSerie[]>([]);
  useEffect(() => {
    let vivo = true;
    listarDecisiones()
      .then((d) => { if (vivo) setDecisiones(d); })
      .catch(() => undefined);
    return () => { vivo = false; };
  }, []);

  const monedas = useMemo(() => {
    const set = new Set<string>([currency, ...accounts.map((a) => a.currency), ...cards.map((c) => c.currency)]);
    return [...set].filter(Boolean);
  }, [accounts, cards, currency]);
  const [moneda, setMoneda] = useState(currency);

  const primerMovimiento = useMemo(() => {
    const fechas = txs.map((t) => t.date).filter(Boolean).sort();
    return fechas[0] ?? null;
  }, [txs]);

  const rango = useMemo(() => {
    if (preset === "custom") {
      // Si alguien invierte las fechas, se ordenan solas en vez de mostrar un
      // periodo vacío que parece un error de la app.
      const a = desdeManual <= hastaManual ? desdeManual : hastaManual;
      const b = desdeManual <= hastaManual ? hastaManual : desdeManual;
      return { desde: a, hasta: b, etiqueta: `Del ${a} al ${b}` };
    }
    return rangoDePreset(preset, primerMovimiento);
  }, [preset, desdeManual, hastaManual, primerMovimiento]);

  // El ojito de Finanzas vive en un módulo, no en un estado, así que se lee
  // en cada dibujado: cuando se aprieta, la página entera se vuelve a dibujar
  // y este valor cambia, que es lo que hace que el informe se rearme tapado.
  const privado = modoPrivado();
  const fmt = (n: number) => fmtMoney(n, moneda);

  // El informe se arma dos veces con formatos distintos, y eso es a propósito.
  // En pantalla los montos pasan por `fmtMoney`, que los tapa si el modo
  // privado está encendido. En lo que se exporta tienen que ir enteros: un PDF
  // lleno de asteriscos no le sirve a nadie. Lo de la exportación se calcula
  // recién al apretar el botón.
  const armar = useCallback((money: (n: number) => string) => armarInformeFinanzas({
    txs, categories, accounts, cards, debts, decisiones,
    moneda, monedaPorDefecto: currency,
    desde: rango.desde, hasta: rango.hasta, etiqueta: rango.etiqueta,
    fmt: money,
  }), [txs, categories, accounts, cards, debts, decisiones, moneda, currency, rango]);

  const informe: Informe = useMemo(() => armar(fmt),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [armar, moneda, privado]);

  // Lo que la exportación necesita saber de cada movimiento y el informe no
  // guarda: nombres de categoría, de cuenta y etiquetas.
  const resolver = useMemo(() => {
    const catById = new Map(categories.map((c) => [c.id, c]));
    const accById = new Map(accounts.map((a) => [a.id, a]));
    const cardById = new Map(cards.map((c) => [c.id, c]));
    const porCuenta = new Map(accounts.map((a) => [a.id, a.currency]));
    const porTarjeta = new Map(cards.map((c) => [c.id, c.currency]));
    const recurrentes = new Set(informe.recurrentes.flatMap((r) => r.txIds));

    return (t: Tx): ResueltoTx => {
      const tarjeta = t.payment_source_type === "credit_card" && t.payment_source_id
        ? cardById.get(t.payment_source_id)
        : undefined;
      const cuenta = accById.get(t.account_id ?? t.payment_source_id ?? "");
      const suyas = [
        ...(txTags.get(t.id) ?? []),
        ...(t.category_id ? catTags.get(t.category_id) ?? [] : []),
      ];
      return {
        categoria: (t.category_id ? catById.get(t.category_id)?.name : null) ?? "Sin categoría",
        cuenta: tarjeta ? `${tarjeta.name}${tarjeta.last_four ? ` •••• ${tarjeta.last_four}` : ""}` : cuenta?.name ?? "",
        etiquetas: [...new Set(suyas.map((e) => e.name))].join(", "),
        moneda: monedaDeTx(t, porCuenta, porTarjeta, currency),
        recurrente: recurrentes.has(t.id),
      };
    };
  }, [categories, accounts, cards, txTags, catTags, currency, informe]);

  // La proyección de saldo: el promedio de los meses completos que ya
  // pasaron, arrastrado hacia adelante desde el saldo de hoy. No es una
  // predicción, es "si sigues igual". Los meses sin ningún movimiento no
  // entran, porque dividir por ellos bajaría el promedio a la mitad.
  const proyeccion = useMemo(() => {
    const saldo = accounts.filter((a) => a.currency === moneda).reduce((s, a) => s + Number(a.balance), 0);
    const completos = informe.tendencia
      .filter((m) => m.mes < mesActualLocal() && (m.ingresos > 0 || m.gastos > 0))
      .slice(-3);
    if (completos.length === 0) return null;
    const promIngresos = completos.reduce((s, m) => s + m.ingresos, 0) / completos.length;
    const promGastos = completos.reduce((s, m) => s + m.gastos, 0) / completos.length;
    let acumulado = saldo;
    const filas: Array<{ mes: string; saldo: number }> = [];
    const [a, m] = mesActualLocal().split("-").map(Number);
    for (let i = 1; i <= 3; i += 1) {
      acumulado = acumulado + promIngresos - promGastos;
      const d = new Date(Date.UTC(a, m - 1 + i, 1));
      filas.push({ mes: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`, saldo: acumulado });
    }
    return { filas, promIngresos, promGastos, meses: completos.length, saldo };
  }, [accounts, moneda, informe.tendencia]);

  const activos = informe.recurrentes.filter((r) => r.activa && r.tipo === "suscripcion");
  const cuotas = informe.recurrentes.filter((r) => r.activa && r.tipo === "cuota");
  const topeRecurrente = Math.max(...activos.map((r) => r.alMes), 1);
  const topeRecorte = Math.max(...informe.recortes.map((r) => r.max), 1);

  const comparar = (ahora: number, antes: number | undefined): string => {
    if (antes === undefined || antes <= 0) return tr("sin periodo anterior para comparar");
    const cambio = ((ahora - antes) / antes) * 100;
    if (Math.abs(cambio) < 1) return tr("igual que el periodo anterior");
    return cambio > 0
      ? `${Math.abs(Math.round(cambio))}% ${tr("más que el periodo anterior")}`
      : `${Math.abs(Math.round(cambio))}% ${tr("menos que el periodo anterior")}`;
  };

  return (
    <>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 16 }}>
        <div className="field" style={{ minWidth: 190, marginBottom: 0 }}>
          <label>{tr("Periodo")}</label>
          <Selector value={preset} ariaLabel={tr("Periodo")} onChange={(v) => setPreset(v as Preset | "custom")}
            opciones={[...PRESETS.map((p) => ({ value: p.value, label: tr(p.label) })),
              { value: "custom", label: tr("Fechas que yo elija") }]} />
        </div>
        {preset === "custom" && (
          <>
            <div className="field" style={{ marginBottom: 0 }}><label>{tr("Desde")}</label>
              <input type="date" value={desdeManual} onChange={(e) => setDesdeManual(e.target.value)} /></div>
            <div className="field" style={{ marginBottom: 0 }}><label>{tr("Hasta")}</label>
              <input type="date" value={hastaManual} onChange={(e) => setHastaManual(e.target.value)} /></div>
          </>
        )}
        {monedas.length > 1 && (
          <div className="field" style={{ maxWidth: 130, marginBottom: 0 }}><label>{tr("Moneda")}</label>
            <Selector value={moneda} ariaLabel={tr("Moneda")}
              opciones={monedas.map((m) => ({ value: m, label: m }))} onChange={setMoneda} /></div>
        )}
        <div style={{ flex: 1 }} />
        <button className="btn primary" {...sinRobarFoco} onClick={() => setExportar(true)}>
          <Download size={15} style={{ verticalAlign: "-2px", marginRight: 5 }} />
          {tr("Exportar")}
        </button>
      </div>

      <div className="statrow" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))" }}>
        <div className="card stat">
          <div className="k">{tr("Entró")}</div>
          <div className="v tnum" style={{ color: "var(--ok)" }}>{fmt(informe.totales.ingresos)}</div>
          <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>
            {comparar(informe.totales.ingresos, informe.anterior?.ingresos)}
          </div>
        </div>
        <div className="card stat">
          <div className="k">{tr("Salió")}</div>
          <div className="v tnum" style={{ color: "var(--err)" }}>{fmt(informe.totales.gastos)}</div>
          <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>
            {comparar(informe.totales.gastos, informe.anterior?.gastos)}
          </div>
        </div>
        <div className="card stat">
          <div className="k">{tr("Quedó")}</div>
          <div className="v tnum" style={{ color: informe.totales.neto >= 0 ? "var(--ok)" : "var(--err)" }}>
            {fmt(informe.totales.neto)}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>
            {informe.totales.tasaAhorro === null
              ? tr("sin ingresos registrados")
              : `${Math.round(informe.totales.tasaAhorro)}% ${tr("de lo que entró")}`}
          </div>
        </div>
        <div className="card stat">
          <div className="k">{tr("Gasto al mes")}
            <AyudaTip etiqueta={tr("Qué significa")}
              texto={tr("El gasto del periodo llevado a un mes, para poder comparar periodos de distinto largo. Si miras tres meses, es lo que gastas en un mes promedio.")} />
          </div>
          <div className="v tnum">{fmt(informe.totales.gastoMensual)}</div>
          <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>
            {fmt(informe.totales.gastoDiario)} {tr("por día")}
          </div>
        </div>
        <div className="card stat">
          <div className="k">{tr("Se cobra solo")}
            <AyudaTip etiqueta={tr("Qué significa")}
              texto={tr("Los cargos que se repiten sin que hagas nada: suscripciones, cuotas, servicios. Se detectan desde tus movimientos, por ritmo y monto.")} />
          </div>
          <div className="v tnum">{fmt(informe.recurrenteAlMes)}</div>
          <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>
            {activos.length} {activos.length === 1 ? tr("cargo automático") : tr("cargos automáticos")}
          </div>
        </div>
        <div className="card stat">
          <div className="k">{tr("Movimientos")}</div>
          <div className="v tnum">{informe.totales.movimientos}</div>
          <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>
            {informe.sinCategoria.cuantos > 0
              ? `${informe.sinCategoria.cuantos} ${tr("sin clasificar")}`
              : tr("todos clasificados")}
          </div>
        </div>
      </div>

      <div className="panelgrid">
        <div className="card panel">
          <h3>{tr("A dónde se fue el dinero")}</h3>
          <Dona
            datos={informe.categorias.map((c) => ({ nombre: c.nombre, valor: c.total, icono: c.icono }))}
            titulo={tr("Salió")}
            centro={fmt(informe.totales.gastos)}
            subcentro={`${informe.dias} ${tr("días")}`}
            fmt={fmt}
          />
        </div>
        <div className="card panel">
          <h3>{tr("Mes a mes")}</h3>
          <ColumnasMeses
            datos={informe.tendencia.map((m) => ({ mes: m.mes, ingresos: m.ingresos, gastos: m.gastos }))}
            fmt={fmt}
            destacado={(mes) => informe.tendencia.find((m) => m.mes === mes)?.enRango ?? true}
          />
          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 10 }}>
            {tr("Los meses atenuados quedan fuera del periodo elegido, y están para ver de dónde vienes.")}
          </p>
        </div>
      </div>

      {informe.categorias.length > 0 && (
        <div className="card panel" style={{ marginTop: 14 }}>
          <h3>{tr("Cada categoría, comparada con el periodo anterior")}</h3>
          {informe.categorias.slice(0, 12).map((c) => (
            <div className="bar" key={c.id}>
              <div className="top">
                <span className="lbl">{c.icono} {c.nombre}
                  <span style={{ color: "var(--muted)", fontSize: 11.5 }}>
                    {c.cuantos} {c.cuantos === 1 ? tr("movimiento") : tr("movimientos")}
                  </span>
                </span>
                <b className="tnum" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {fmt(c.total)}
                  {c.deltaPct !== null && Math.abs(c.deltaPct) >= 5 && (
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11.5, fontWeight: 600,
                      color: c.deltaPct > 0 ? "var(--err)" : "var(--ok)",
                    }}>
                      {c.deltaPct > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                      {Math.abs(Math.round(c.deltaPct))}%
                    </span>
                  )}
                </b>
              </div>
              <div className="track">
                <div className="fill" style={{ width: `${Math.round(c.pct)}%`, background: "var(--fin)" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card panel" style={{ marginTop: 14 }}>
        <h3>{tr("Lo que se cobra solo")}</h3>
        {activos.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 13.5 }}>
            {tr("Todavía no encuentro cargos que se repitan. Aparecen solos cuando hay dos o tres meses de movimientos cargados.")}
          </p>
        ) : (
          <>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: -6, marginBottom: 14 }}>
              {fmt(informe.recurrenteAlMes)} {tr("al mes")}, {fmt(informe.recurrenteAlAno)} {tr("al año")}.
              {" "}{tr("Es el")} {informe.totales.gastoMensual > 0
                ? Math.round(Math.min(100, (informe.gastoFijo / informe.totales.gastoMensual) * 100))
                : 0}% {tr("de lo que gastas en un mes.")}
              {cuotas.length > 0 && (
                <> {tr("Aparte se van")} {fmt(informe.cuotasAlMes)} {tr("al mes en cuotas, que sí se terminan.")}</>
              )}
            </p>
            {activos.slice(0, 10).map((r) => (
              <div className="bar" key={r.clave}>
                <div className="top">
                  <span className="lbl">{r.nombre}
                    <span style={{ color: "var(--muted)", fontSize: 11.5 }}>
                      {fmt(r.monto)} {textoCadencia(r.cadencia)}
                      {r.cambioPrecio && r.cambioPrecio > 0 ? `, ${tr("subió")} ${fmt(r.cambioPrecio)}` : ""}
                    </span>
                  </span>
                  <b className="tnum">{fmt(r.alMes)}</b>
                </div>
                <div className="track">
                  <div className="fill" style={{ width: `${Math.round((r.alMes / topeRecurrente) * 100)}%`, background: "var(--fin)" }} />
                </div>
              </div>
            ))}
            <div style={{ display: "flex", gap: 22, flexWrap: "wrap", marginTop: 16, fontSize: 12.5, color: "var(--muted)" }}>
              <span>{tr("Gasto fijo")}, <b style={{ color: "var(--ink)" }}>{fmt(informe.gastoFijo)}</b> {tr("al mes")}</span>
              <span>{tr("Gasto que decides cada vez")}, <b style={{ color: "var(--ink)" }}>{fmt(informe.gastoVariable)}</b> {tr("al mes")}</span>
            </div>
            <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 8 }}>
              {tr("Si aquí aparece algo que no es un cobro automático, márcalo en la pestaña Recurrentes y deja de contarse en este informe.")}
            </p>
          </>
        )}
      </div>

      {informe.hallazgos.length > 0 && (
        <div className="card panel" style={{ marginTop: 14 }}>
          <h3>{tr("Qué se ve en estos números")}</h3>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {informe.hallazgos.map((h) => (
              <li key={h.clave} style={{
                borderLeft: `3px solid ${COLOR_TONO[h.tono]}`,
                padding: "6px 0 6px 12px", marginBottom: 12,
              }}>
                <b style={{ fontSize: 13.5, display: "block", marginBottom: 2 }}>{h.titulo}</b>
                <span style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5 }}>{h.detalle}</span>
              </li>
            ))}
          </ul>
          <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>
            {tr("Cada observación sale de los movimientos que tienes cargados, así que cambia cuando cambian tus datos.")}
          </p>
        </div>
      )}

      {informe.recortes.length > 0 && (
        <div className="card panel" style={{ marginTop: 14 }}>
          <h3>{tr("Dónde hay plata que recuperar")}</h3>
          <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: -6, marginBottom: 16 }}>
            {tr("Rangos estimados sobre tus propios gastos. El número bajo es lo prudente, el alto es lo que se logra revisando cargo por cargo.")}
          </p>
          {informe.recortes.map((r) => (
            <BarraRango key={r.clave} min={r.min} max={r.max} tope={topeRecorte} fmt={fmt}
              etiqueta={r.titulo} nota={`${r.detalle} ${TEXTO_FRICCION[r.friccion] ?? ""}.`} />
          ))}
          <div style={{
            display: "flex", gap: 20, flexWrap: "wrap", borderTop: "1px solid var(--line)",
            paddingTop: 12, marginTop: 4, fontSize: 13,
          }}>
            <span>{tr("Todo junto, al mes")}: <b className="tnum">{fmt(informe.recorteMin)} a {fmt(informe.recorteMax)}</b></span>
            <span style={{ color: "var(--muted)" }}>
              {tr("Al año")}: <b className="tnum" style={{ color: "var(--ink)" }}>{fmt(informe.recorteMin * 12)} a {fmt(informe.recorteMax * 12)}</b>
            </span>
          </div>
        </div>
      )}

      {/* Estas tres tarjetas tienen alturas muy distintas, así que van en
          columnas que empacan hacia arriba y no en una rejilla: con la
          rejilla, la más corta dejaba un hueco muerto debajo. */}
      <div className="orden-grid orden-2col" style={{ marginTop: 14 }}>
        {informe.comercios.length > 0 && (<div className="orden-item">
          <div className="card panel">
            <h3>{tr("A quién le pagaste más")}</h3>
            {informe.comercios.slice(0, 8).map((c) => (
              <div className="txrow" key={c.nombre} style={{ padding: "8px 0" }}>
                <div className="txmeta">
                  <b>{c.nombre}</b>
                  <small>{c.cuantos} {c.cuantos === 1 ? tr("compra") : tr("compras")}, {tr("la última el")} {c.ultima}</small>
                </div>
                <b className="tnum">{fmt(c.total)}</b>
              </div>
            ))}
          </div></div>
        )}

        {proyeccion && (
          <div className="orden-item"><div className="card panel">
            <h3>{tr("Si sigues así")}</h3>
            <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 12 }}>
              {tr("Con el promedio de")} {proyeccion.meses === 1 ? tr("el último mes completo") : `${tr("los últimos")} ${proyeccion.meses} ${tr("meses completos")}`}
              {" ("}{tr("entra")} {fmt(Math.round(proyeccion.promIngresos))}, {tr("sale")} {fmt(Math.round(proyeccion.promGastos))}{"), "}
              {tr("tu saldo llegaría a")}:
            </p>
            {proyeccion.filas.map((f) => (
              <div className="txrow" key={f.mes} style={{ padding: "7px 0" }}>
                <div className="txmeta"><b style={{ fontSize: 13 }}>{f.mes}</b></div>
                <b className={"tnum txamt " + (f.saldo >= 0 ? "pos" : "neg")}>{fmt(Math.round(f.saldo))}</b>
              </div>
            ))}
            <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 10 }}>
              {tr("No es una predicción, es lo que pasaría si nada cambia.")}
            </p>
          </div></div>
        )}

        {/* De dónde salen los números. Va aquí y no escondido en una ayuda,
            porque quien exporta esto para que lo revise otra persona necesita
            poder decir qué incluye y qué no. */}
        <div className="orden-item"><div className="card panel">
          <h3>{tr("De dónde salen estos números")}</h3>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.7 }}>
            <li>{tr("Periodo")}: {informe.desde} a {informe.hasta}, {informe.dias} {tr("días")}.</li>
            <li>{tr("Moneda")}: {informe.moneda}.{informe.fueraDeMoneda > 0
              ? ` ${informe.fueraDeMoneda} ${tr("movimientos en otra moneda quedaron fuera.")}`
              : ` ${tr("Todos tus movimientos están en esta moneda.")}`}</li>
            <li>{tr("Los traspasos entre tus cuentas y los pagos de tarjeta no cuentan como gasto.")}</li>
            <li>{tr("Lo que marcaste como reembolsado tampoco cuenta.")}</li>
            {informe.sinCategoria.cuantos > 0 && (
              <li>{informe.sinCategoria.cuantos} {tr("gastos sin categoría, por")} {fmt(informe.sinCategoria.monto)}.
                {" "}{tr("Clasificarlos cambia los números de arriba.")}</li>
            )}
            {informe.repetidos.grupos > 0 && (
              <li>{informe.repetidos.grupos} {informe.repetidos.grupos === 1
                ? tr("movimiento que parece repetido, por")
                : tr("movimientos que parecen repetidos, por")} {fmt(informe.repetidos.monto)} {tr("de más.")}</li>
            )}
          </ul>
        </div></div>
      </div>

      {exportar && <ParaExportar armar={armar} moneda={moneda} resolver={resolver} onClose={() => setExportar(false)} />}
    </>
  );
}

/** El informe con los montos a la vista, calculado una sola vez al abrir la
 *  ventana de exportar y no en cada dibujado de la pestaña. */
function ParaExportar({ armar, moneda, resolver, onClose }: {
  armar: (money: (n: number) => string) => Informe;
  moneda: string;
  resolver: (t: Tx) => ResueltoTx;
  onClose: () => void;
}) {
  const informe = useMemo(() => armar((n) => plata(n, moneda)), [armar, moneda]);
  return <ExportarReporte informe={informe} resolver={resolver} onClose={onClose} />;
}
