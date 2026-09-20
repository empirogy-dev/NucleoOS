import { useState } from "react";
import { useIdioma } from "../idioma/IdiomaProvider";
import { Selector } from "../components/Selector";
import { cierreDeFondo, sinRobarFoco } from "../components/cierreDeFondo";
import { armarZip, nombreSeguro, type ArchivoZip } from "./zip";
import {
  armarInformeHtml,
  csvCategorias,
  csvComercios,
  csvMeses,
  csvMovimientos,
  csvRecurrentes,
  descargarArchivo,
  imprimirInforme,
  type ResueltoTx,
} from "./informeFinanzas";
import type { Informe } from "./reporte";
import type { Tx } from "./types";

// Sacar el informe de la app.
//
// Existe porque el punto de tener los números ordenados es poder mostrárselos
// a alguien: un contador, un asesor, la pareja. Dentro de la app eso es
// imposible, y mandar capturas de pantalla no es un informe.

export type FormatoReporte = "informe" | "planilla" | "paquete";

export function ExportarReporte({ informe, resolver, onClose }: {
  informe: Informe;
  resolver: (t: Tx) => ResueltoTx;
  onClose: () => void;
}) {
  const { t: tr } = useIdioma();
  const [formato, setFormato] = useState<FormatoReporte>("informe");
  const [conMovimientos, setConMovimientos] = useState(true);
  const [titular, setTitular] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sufijo = nombreSeguro(`${informe.desde}-a-${informe.hasta}-${informe.moneda}`);
  const texto = (s: string) => new TextEncoder().encode(s) as Uint8Array<ArrayBuffer>;

  function exportar() {
    setBusy(true);
    setErr(null);
    try {
      if (formato === "planilla") {
        descargarArchivo(
          new Blob([csvMovimientos(informe, resolver)], { type: "text/csv;charset=utf-8" }),
          `movimientos-${sufijo}.csv`,
        );
        onClose();
        return;
      }

      const html = armarInformeHtml(informe, {
        titular: titular.trim() || undefined,
        conMovimientos,
        resolver,
      });

      if (formato === "informe") {
        imprimirInforme(html, `informe-finanzas-${sufijo}`);
        onClose();
        return;
      }

      const archivos: ArchivoZip[] = [
        { nombre: `informe-${sufijo}.html`, datos: texto(html) },
        { nombre: "movimientos.csv", datos: texto(csvMovimientos(informe, resolver)) },
        { nombre: "gasto-por-categoria.csv", datos: texto(csvCategorias(informe)) },
        { nombre: "mes-a-mes.csv", datos: texto(csvMeses(informe)) },
        { nombre: "cargos-recurrentes.csv", datos: texto(csvRecurrentes(informe)) },
        { nombre: "comercios.csv", datos: texto(csvComercios(informe)) },
        { nombre: "lee-esto-primero.txt", datos: texto(lectura(informe)) },
      ];
      descargarArchivo(armarZip(archivos), `finanzas-${sufijo}.zip`);
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const explica: Record<FormatoReporte, string> = {
    informe: tr("Una hoja con los gráficos, las tablas y las observaciones. Se abre para imprimir y desde ahí eliges Guardar como PDF. Es lo que se manda por correo."),
    planilla: tr("Los movimientos del periodo en CSV, uno por fila. Se abre en Excel y lo lee cualquier programa de contabilidad."),
    paquete: tr("Un ZIP con el informe más las planillas de categorías, meses, cargos recurrentes y comercios. Es lo que sirve para que alguien lo analice de verdad."),
  };

  return (
    <div className="tp-overlay" {...cierreDeFondo(onClose)}>
      <div className="tp" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <h3 style={{ marginBottom: 4 }}>{tr("Exportar el informe")}</h3>
        <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 14 }}>
          {informe.etiqueta}, {informe.totales.movimientos} {informe.totales.movimientos === 1 ? tr("movimiento") : tr("movimientos")} {tr("en")} {informe.moneda}.
        </p>

        <div className="field">
          <label>{tr("Formato")}</label>
          <Selector value={formato} ariaLabel={tr("Formato")} onChange={(v) => setFormato(v as FormatoReporte)}
            opciones={[
              { value: "informe", label: tr("Informe para imprimir o PDF") },
              { value: "planilla", label: tr("Planilla de movimientos") },
              { value: "paquete", label: tr("Paquete completo en ZIP") },
            ]} />
          <small style={{ color: "var(--muted)", fontSize: 12, lineHeight: 1.45, display: "block", marginTop: 6 }}>
            {explica[formato]}
          </small>
        </div>

        {formato !== "planilla" && (
          <>
            <div className="field">
              <label>{tr("A nombre de quién va")}</label>
              <input value={titular} onChange={(e) => setTitular(e.target.value)}
                placeholder={tr("Opcional, por ejemplo tu nombre o el de tu empresa")} />
            </div>
            <label style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 13, marginBottom: 14, cursor: "pointer" }}>
              <input type="checkbox" checked={conMovimientos} onChange={(e) => setConMovimientos(e.target.checked)}
                style={{ width: "auto", marginTop: 2 }} />
              <span>
                {tr("Incluir la lista completa de movimientos al final")}
                <small style={{ display: "block", color: "var(--muted)", fontSize: 11.5 }}>
                  {tr("Un contador la va a pedir igual. Sin esto el informe queda más corto.")}
                </small>
              </span>
            </label>
          </>
        )}

        {err && <p style={{ color: "var(--err)", fontSize: 13, marginBottom: 10 }}>{err}</p>}

        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 4 }}>
          <button className="btn ghost" onClick={onClose}>{tr("Cancelar")}</button>
          <button className="btn primary" {...sinRobarFoco} disabled={busy} onClick={exportar}>
            {busy ? tr("Preparando…") : tr("Exportar")}
          </button>
        </div>
      </div>
    </div>
  );
}

/** La nota que va dentro del ZIP. Quien lo abre no estuvo en esta pantalla y
 *  necesita saber qué está mirando, en qué moneda y qué NO incluye. */
function lectura(inf: Informe): string {
  return [
    `Finanzas, ${inf.etiqueta}`,
    `Periodo: del ${inf.desde} al ${inf.hasta} (${inf.dias} días).`,
    `Moneda: ${inf.moneda}. Las otras monedas no se mezclan y quedaron fuera (${inf.fueraDeMoneda} movimientos).`,
    "",
    "Qué hay en cada archivo:",
    "  informe.html: el informe completo con gráficos y observaciones. Se abre en el navegador y se imprime a PDF.",
    "  movimientos.csv: cada movimiento del periodo, con su categoría, cuenta y etiquetas.",
    "  gasto-por-categoria.csv: el total por categoría, su peso y el cambio respecto al periodo anterior.",
    "  mes-a-mes.csv: lo que entró y salió cada mes.",
    "  cargos-recurrentes.csv: los cobros que se repiten solos, con su costo al mes y al año.",
    "  comercios.csv: dónde se gastó más.",
    "",
    "Cómo se cuentan las cosas:",
    "  Los traspasos entre cuentas propias y los pagos de tarjeta no cuentan como gasto: es la misma plata moviéndose.",
    "  Lo marcado como reembolsado tampoco cuenta, porque al final lo devolvieron.",
    "  Los cargos recurrentes se detectan desde los movimientos, por ritmo y monto, no desde una lista escrita a mano.",
    "",
    `Generado el ${new Date(inf.generado).toLocaleString("es-CL")} desde NucleoOS.`,
  ].join("\n");
}
