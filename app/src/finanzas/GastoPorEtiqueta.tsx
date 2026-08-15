import { useMemo, useState } from "react";
import { useIdioma } from "../idioma/IdiomaProvider";
import { Selector } from "../components/Selector";
import { fmtMoney, monedaDeTx, type Account, type CreditCard, type Tx } from "./types";
import type { Etiqueta } from "./tags";

// Cuánto te cuesta cada parte de tu vida, al mes.
//
// Ella tiene un negocio que todavía no factura y varias suscripciones
// pagándose solas: Supabase, Vercel, Hostinger, el dominio. Cada una parece
// poca cosa por separado, y juntas son el número que decide si el negocio
// aguanta o no. Ese número no existía en ninguna parte.
//
// El promedio se saca sobre los meses que de verdad tienen movimientos, no
// sobre doce: dividir por meses en los que todavía no existía el gasto daría
// un promedio más bajo que la realidad, justo al revés de lo que conviene.

interface Fila {
  etiqueta: Etiqueta;
  mes: number;
  anio: number;
  promedio: number;
  cuantos: number;
}

export function GastoPorEtiqueta({ txs, accounts, cards, currency, etiquetas, txTags, catTags }: {
  txs: Tx[];
  accounts: Account[];
  cards: CreditCard[];
  currency: string;
  etiquetas: Etiqueta[];
  txTags: Map<string, Etiqueta[]>;
  catTags: Map<string, Etiqueta[]>;
}) {
  const { t: tr } = useIdioma();
  const [moneda, setMoneda] = useState(currency);

  const monedas = useMemo(() => {
    const set = new Set<string>([currency, ...accounts.map((a) => a.currency), ...cards.map((c) => c.currency)]);
    return [...set].filter(Boolean);
  }, [accounts, cards, currency]);

  const hoy = new Date();
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
  const anioActual = String(hoy.getFullYear());

  const filas: Fila[] = useMemo(() => {
    const porCuenta = new Map(accounts.map((a) => [a.id, a.currency]));
    const porTarjeta = new Map(cards.map((c) => [c.id, c.currency]));

    // Un gasto lleva las etiquetas suyas y las de su categoría: poner
    // "Empirogy" en la categoría Software tiene que alcanzar.
    const etiquetasDe = (t: Tx): string[] => [
      ...(txTags.get(t.id) ?? []),
      ...(t.category_id ? catTags.get(t.category_id) ?? [] : []),
    ].map((e) => e.id);

    const gastos = txs.filter((t) =>
      t.type === "expense"
      // Lo reembolsado no te cuesta: te devolvieron la plata.
      && !t.reimbursed
      && monedaDeTx(t, porCuenta, porTarjeta, currency) === moneda
      && t.date.startsWith(anioActual));

    return etiquetas.map((etiqueta) => {
      const suyos = gastos.filter((t) => etiquetasDe(t).includes(etiqueta.id));
      const anio = suyos.reduce((s, t) => s + Number(t.amount), 0);
      const mes = suyos.filter((t) => t.date.startsWith(mesActual)).reduce((s, t) => s + Number(t.amount), 0);
      const meses = new Set(suyos.map((t) => t.date.slice(0, 7))).size;
      return { etiqueta, mes, anio, promedio: meses > 0 ? anio / meses : 0, cuantos: suyos.length };
    })
      .filter((f) => f.cuantos > 0)
      .sort((a, b) => b.anio - a.anio);
  }, [txs, accounts, cards, etiquetas, txTags, catTags, currency, moneda, anioActual, mesActual]);

  if (etiquetas.length === 0 || filas.length === 0) return null;
  // Una categoría con dos etiquetas suma en las dos, así que un total general
  // aquí sería mentira. Cada fila se lee sola.

  return (
    <div className="card panel" style={{ marginTop: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
        <h3 style={{ flex: 1, minWidth: 180 }}>{tr("Cuánto te cuesta cada cosa")}</h3>
        {monedas.length > 1 && (
          <div style={{ width: 100 }}>
            <Selector compacto value={moneda} ariaLabel={tr("Moneda")}
              opciones={monedas.map((m) => ({ value: m, label: m }))} onChange={setMoneda} />
          </div>
        )}
      </div>
      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12, lineHeight: 1.5 }}>
        {tr("Los gastos de este año agrupados por etiqueta. El promedio se saca sobre los meses que tienen movimientos, no sobre doce.")}
      </p>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)" }}>
            <th style={{ textAlign: "left", padding: "0 6px 6px 0" }}>{tr("Etiqueta")}</th>
            <th style={{ textAlign: "right", padding: "0 6px 6px" }}>{tr("Este mes")}</th>
            <th style={{ textAlign: "right", padding: "0 6px 6px" }}>{tr("Al mes")}</th>
            <th style={{ textAlign: "right", padding: "0 0 6px 6px" }}>{tr("En el año")}</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.etiqueta.id} style={{ borderTop: "1px solid var(--line-soft)" }}>
              <td style={{ padding: "8px 6px 8px 0" }}>
                <span className="chip" style={f.etiqueta.color
                  ? { background: f.etiqueta.color, color: "#fff" }
                  : undefined}>{f.etiqueta.name}</span>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                  {f.cuantos} {f.cuantos === 1 ? tr("gasto") : tr("gastos")}
                </div>
              </td>
              <td className="tnum" style={{ textAlign: "right", padding: "8px 6px", whiteSpace: "nowrap" }}>
                {fmtMoney(f.mes, moneda)}
              </td>
              <td className="tnum" style={{ textAlign: "right", padding: "8px 6px", whiteSpace: "nowrap", fontWeight: 700 }}>
                {fmtMoney(f.promedio, moneda)}
              </td>
              <td className="tnum" style={{ textAlign: "right", padding: "8px 0 8px 6px", whiteSpace: "nowrap", color: "var(--muted)" }}>
                {fmtMoney(f.anio, moneda)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 10, lineHeight: 1.5 }}>
        {tr("La columna del medio es la que importa: eso es lo que tienes que facturar cada mes solo para empatar.")}
      </p>
    </div>
  );
}
