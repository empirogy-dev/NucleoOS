import { useState } from "react";
import { useIdioma } from "../idioma/IdiomaProvider";
import { Selector } from "../components/Selector";
import { cierreDeFondo, sinRobarFoco } from "../components/cierreDeFondo";
import { armarZip, nombreSeguro, type ArchivoZip } from "../finanzas/zip";
import { descargarArchivo, imprimirInforme } from "../informes/base";
import {
  armarInformeBienestarHtml, csvDiaADia, csvHabitos, csvMetas, csvMovimiento, csvSemanas, lectura,
} from "./informeBienestar";
import type { InformeBienestar } from "./bienestar";

// Sacar el informe de bienestar de la app.
//
// La ventana tiene una decisión que la de finanzas no tiene: el texto del
// diario. Va apagado siempre, y al encenderlo se dice en una línea qué
// significa. Nadie debería mandarle a otra persona lo que escribió en sus
// peores días sin haberlo decidido de verdad.

export type FormatoBienestar = "informe" | "planilla" | "paquete";

export function ExportarBienestar({ informe, conTextoDiario, onCambiarTextoDiario, onClose }: {
  informe: InformeBienestar;
  conTextoDiario: boolean;
  onCambiarTextoDiario: (v: boolean) => void;
  onClose: () => void;
}) {
  const { t: tr } = useIdioma();
  const [formato, setFormato] = useState<FormatoBienestar>("informe");
  const [conDiaADia, setConDiaADia] = useState(true);
  const [titular, setTitular] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sufijo = nombreSeguro(`${informe.desde}-a-${informe.hasta}`);
  const texto = (s: string) => new TextEncoder().encode(s) as Uint8Array<ArrayBuffer>;

  function exportar() {
    setBusy(true);
    setErr(null);
    try {
      if (formato === "planilla") {
        descargarArchivo(
          new Blob([csvDiaADia(informe)], { type: "text/csv;charset=utf-8" }),
          `bienestar-dia-a-dia-${sufijo}.csv`,
        );
        onClose();
        return;
      }

      const html = armarInformeBienestarHtml(informe, {
        titular: titular.trim() || undefined,
        conDiaADia,
      });

      if (formato === "informe") {
        imprimirInforme(html, `informe-bienestar-${sufijo}`);
        onClose();
        return;
      }

      const archivos: ArchivoZip[] = [
        { nombre: `informe-${sufijo}.html`, datos: texto(html) },
        { nombre: "dia-a-dia.csv", datos: texto(csvDiaADia(informe)) },
        { nombre: "semana-a-semana.csv", datos: texto(csvSemanas(informe)) },
        { nombre: "habitos.csv", datos: texto(csvHabitos(informe)) },
        { nombre: "movimiento.csv", datos: texto(csvMovimiento(informe)) },
        { nombre: "metas.csv", datos: texto(csvMetas(informe)) },
        { nombre: "lee-esto-primero.txt", datos: texto(lectura(informe)) },
      ];
      descargarArchivo(armarZip(archivos), `bienestar-${sufijo}.zip`);
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const explica: Record<FormatoBienestar, string> = {
    informe: tr("Una hoja con los gráficos, las tablas y las observaciones. Se abre para imprimir y desde ahí eliges Guardar como PDF. Es lo que se lleva a una consulta."),
    planilla: tr("Una fila por día, en CSV: sueño, energía, movimiento, hábitos y lo demás. Se abre en Excel y sirve para analizarlo aparte."),
    paquete: tr("Un ZIP con el informe más las planillas de día a día, semanas, hábitos, movimiento y metas, y una nota que explica cómo leer los datos."),
  };

  return (
    <div className="tp-overlay" {...cierreDeFondo(onClose)}>
      <div className="tp" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 470 }}>
        <h3 style={{ marginBottom: 4 }}>{tr("Exportar el informe")}</h3>
        <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 14 }}>
          {informe.etiqueta}, {tr("con registros en")} {informe.diasConAlgo} {tr("de")} {informe.dias} {tr("días")}.
        </p>

        <div className="field">
          <label>{tr("Formato")}</label>
          <Selector value={formato} ariaLabel={tr("Formato")} onChange={(v) => setFormato(v as FormatoBienestar)}
            opciones={[
              { value: "informe", label: tr("Informe para imprimir o PDF") },
              { value: "planilla", label: tr("Planilla del día a día") },
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
                placeholder={tr("Opcional, por ejemplo tu nombre")} />
            </div>
            <label style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 13, marginBottom: 12, cursor: "pointer" }}>
              <input type="checkbox" checked={conDiaADia} onChange={(e) => setConDiaADia(e.target.checked)}
                style={{ width: "auto", marginTop: 2 }} />
              <span>
                {tr("Incluir el día a día completo al final")}
                <small style={{ display: "block", color: "var(--muted)", fontSize: 11.5 }}>
                  {tr("Una fila por día. Es lo que permite mirar una semana concreta en vez de solo los promedios.")}
                </small>
              </span>
            </label>
          </>
        )}

        {/* El diario aparte, con su propio aviso: es lo más íntimo que guarda
            la app y no debería salir sin una decisión consciente. */}
        <label style={{
          display: "flex", gap: 9, alignItems: "flex-start", fontSize: 13, marginBottom: 14,
          cursor: "pointer", border: "1px solid var(--line)", borderRadius: "var(--r-sm)", padding: "10px 12px",
          background: conTextoDiario ? "var(--accent-wash)" : undefined,
        }}>
          <input type="checkbox" checked={conTextoDiario} onChange={(e) => onCambiarTextoDiario(e.target.checked)}
            style={{ width: "auto", marginTop: 2 }} />
          <span>
            {tr("Incluir lo que escribiste en el diario")}
            <small style={{ display: "block", color: "var(--muted)", fontSize: 11.5 }}>
              {conTextoDiario
                ? tr("El texto completo de cada entrada va dentro del informe. Míralo antes de mandarlo.")
                : tr("Sin esto solo se cuenta cuántas veces escribiste, nunca lo que dice.")}
            </small>
          </span>
        </label>

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
