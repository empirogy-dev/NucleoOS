import { useMemo, useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { useIdioma } from "../idioma/IdiomaProvider";
import { Selector } from "../components/Selector";
import { sinRobarFoco } from "../components/cierreDeFondo";
import { fmtMoney, type Account, type Category, type Tx } from "./types";
import { LINEAS_T2125, resumenImpuestos } from "./impuestos";

// Los gastos del año sumados por línea del formulario de impuestos.
//
// Esto es lo que se le muestra al contador, o lo que se copia línea por línea
// si ella misma hace la declaración. La app suma; quién decide a qué línea va
// cada categoría es ella, en la pestaña Categorías.

export function ResumenImpuestosPanel({ txs, categories, accounts, currency }: {
  txs: Tx[];
  categories: Category[];
  accounts: Account[];
  currency: string;
}) {
  const { t: tr } = useIdioma();

  const anios = useMemo(() => {
    const set = new Set(txs.map((t) => t.date.slice(0, 4)).filter(Boolean));
    const hoy = String(new Date().getFullYear());
    set.add(hoy);
    return [...set].sort().reverse();
  }, [txs]);

  const monedas = useMemo(() => {
    const set = new Set<string>([currency, ...accounts.map((a) => a.currency)]);
    return [...set].filter(Boolean);
  }, [accounts, currency]);

  const [anio, setAnio] = useState(anios[0] ?? String(new Date().getFullYear()));
  const [moneda, setMoneda] = useState(currency);
  const [abierto, setAbierto] = useState(false);

  const monedaDe = useMemo(() => {
    const porCuenta = new Map(accounts.map((a) => [a.id, a.currency]));
    return (t: Tx) => (t.account_id ? porCuenta.get(t.account_id) ?? currency : currency);
  }, [accounts, currency]);

  const r = useMemo(
    () => resumenImpuestos(txs, categories, {
      desde: `${anio}-01-01`, hasta: `${anio}-12-31`, moneda, monedaDe,
    }),
    [txs, categories, anio, moneda, monedaDe],
  );

  const asignadas = categories.filter((c) => c.type === "expense" && c.tax_line).length;

  function exportar() {
    const esc = (x: string) => `"${String(x).replace(/"/g, '""')}"`;
    const filas: string[][] = [];
    for (const l of r.lineas) {
      filas.push([l.linea.numero, l.linea.oficial, "", l.total.toFixed(2), r.moneda, String(l.cuantos)]);
      for (const c of l.categorias) {
        filas.push(["", "", c.cat.name, c.total.toFixed(2), r.moneda, String(c.cuantos)]);
      }
    }
    if (r.sinLinea.length > 0) {
      filas.push(["", tr("Sin línea asignada"), "", r.totalSinLinea.toFixed(2), r.moneda, ""]);
      for (const c of r.sinLinea) {
        filas.push(["", "", c.cat?.name ?? tr("Sin categoría"), c.total.toFixed(2), r.moneda, String(c.cuantos)]);
      }
    }
    const cab = ["Line", "T2125 line name", "Category", "Amount", "Currency", "Transactions"];
    const csv = "﻿" + [cab, ...filas].map((f) => f.map(esc).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `impuestos-${anio}-${r.moneda}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  return (
    <div className="card panel" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
        <h3 style={{ flex: 1, minWidth: 190 }}>{tr("Gastos por línea de impuestos")}</h3>
        <div style={{ width: 110 }}>
          <Selector compacto value={anio} ariaLabel={tr("Año")}
            opciones={anios.map((a) => ({ value: a, label: a }))} onChange={setAnio} />
        </div>
        {monedas.length > 1 && (
          <div style={{ width: 100 }}>
            <Selector compacto value={moneda} ariaLabel={tr("Moneda")}
              opciones={monedas.map((m) => ({ value: m, label: m }))} onChange={setMoneda} />
          </div>
        )}
      </div>

      {asignadas === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.55 }}>
          {tr("Todavía ninguna categoría tiene línea de impuestos. Ve a Categorías y elige a cuál corresponde cada una: desde ahí se arma este resumen. Esa decisión es contable, así que la tomas tú o tu contador, y la app solo suma.")}
        </p>
      ) : (
        <>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <tbody>
              {r.lineas.map((l) => (
                <tr key={l.linea.numero} style={{ borderBottom: "1px solid var(--line-soft)" }}>
                  <td style={{ padding: "8px 6px 8px 0", width: 54, color: "var(--muted)", fontSize: 12 }} className="tnum">
                    {l.linea.numero}
                  </td>
                  <td style={{ padding: "8px 6px 8px 0" }}>
                    <b style={{ fontSize: 13 }}>{l.linea.oficial}</b>
                    <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
                      {l.categorias.map((c) => c.cat.name).join(", ")}
                    </div>
                    {l.linea.ojo && (
                      <div style={{ fontSize: 11.5, color: "var(--warn)", marginTop: 2 }}>⚠️ {tr(l.linea.ojo)}</div>
                    )}
                  </td>
                  <td className="tnum" style={{ padding: "8px 0", textAlign: "right", whiteSpace: "nowrap", fontWeight: 600 }}>
                    {fmtMoney(l.total, r.moneda)}
                  </td>
                </tr>
              ))}
              <tr>
                <td />
                <td style={{ padding: "10px 6px 0 0", fontWeight: 700 }}>{tr("Total")}</td>
                <td className="tnum" style={{ padding: "10px 0 0", textAlign: "right", fontWeight: 700, fontSize: 15 }}>
                  {fmtMoney(r.total, r.moneda)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Lo que quedó fuera se dice. Un resumen que esconde lo que no
              cuadró es peor que uno que lo muestra. */}
          {r.sinLinea.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <button type="button" className="linklike" style={{ fontSize: 12.5 }} onClick={() => setAbierto(!abierto)}>
                {abierto ? "▾" : "▸"} {fmtMoney(r.totalSinLinea, r.moneda)} {tr("en categorías sin línea asignada")} ({r.sinLinea.length})
              </button>
              {abierto && (
                <ul style={{ margin: "6px 0 0 14px", fontSize: 12.5, color: "var(--muted)" }}>
                  {r.sinLinea.map((c) => (
                    <li key={c.cat?.id ?? "sin"} style={{ marginBottom: 2 }}>
                      {c.cat?.name ?? tr("Sin categoría")}: {fmtMoney(c.total, r.moneda)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            <button className="btn ghost" {...sinRobarFoco} onClick={exportar}>
              <FileSpreadsheet size={14} style={{ verticalAlign: "-2px", marginRight: 5 }} />
              {tr("Exportar para el contador")}
            </button>
          </div>

          <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 10, lineHeight: 1.5 }}>
            {tr("Estos son tus gastos sumados por la línea que tú asignaste a cada categoría. NucleoOS no es un asesor tributario: revisa el resultado antes de declararlo.")}
          </p>
        </>
      )}
    </div>
  );
}

/** Cuántas líneas del formulario existen, para la ayuda de la pestaña. */
export const CUANTAS_LINEAS = LINEAS_T2125.length;
