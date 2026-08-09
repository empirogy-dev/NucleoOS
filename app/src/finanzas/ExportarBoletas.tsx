import { useState } from "react";
import { cierreDeFondo, sinRobarFoco } from "../components/cierreDeFondo";
import { useIdioma } from "../idioma/IdiomaProvider";
import { Selector } from "../components/Selector";
import { signedUrlsRecibos } from "./recibos";
import { aDatos, armarInforme, type FilaInforme } from "./informeBoletas";
import { armarZip, nombreSeguro, type ArchivoZip } from "./zip";

// Exportar las boletas, con opciones, porque no se entregan igual para todo.
// Al contador le sirve la hoja con las fotos y una planilla limpia. Para el
// archivo propio sirve la carpeta con cada foto renombrada, que es lo que hoy
// no existe: los archivos se llaman 17863025482646107842346591362745.jpg y así
// no se puede encontrar nada.

export type Formato = "informe" | "planilla" | "carpeta";
export type Orden = "fecha" | "categoria" | "comercio";

/** Lo que la pestaña le pasa por cada comprobante, ya resuelto. */
export interface ItemExportable {
  path: string;
  archivo: string;
  esImagen: boolean;
  fecha: string;
  comercio: string;
  categoria: string;
  etiquetas: string;
  monto: number;
  moneda: string;
}

const plata = (n: number) => n.toFixed(2);

function ordenar(items: ItemExportable[], orden: Orden): ItemExportable[] {
  const copia = [...items];
  if (orden === "fecha") return copia.sort((a, b) => b.fecha.localeCompare(a.fecha));
  if (orden === "comercio") return copia.sort((a, b) => a.comercio.localeCompare(b.comercio) || b.fecha.localeCompare(a.fecha));
  // Lo sin categoría al final, no mezclado en la C.
  return copia.sort((a, b) =>
    (a.categoria || "￿").localeCompare(b.categoria || "￿") || b.fecha.localeCompare(a.fecha));
}

function descargar(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 6000);
}

export function ExportarBoletas({ items, filtros, sufijo, onClose }: {
  items: ItemExportable[];
  filtros: string;
  sufijo: string;
  onClose: () => void;
}) {
  const { t: tr } = useIdioma();
  const [formato, setFormato] = useState<Formato>("informe");
  const [orden, setOrden] = useState<Orden>("fecha");
  const [paso, setPaso] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function planilla(lista: ItemExportable[]): string {
    const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
    const cab = ["Fecha", "Comercio", "Categoría", "Etiquetas", "Monto", "Moneda", "Comprobante"];
    const filas = lista.map((i) =>
      [i.fecha, i.comercio, i.categoria, i.etiquetas, plata(i.monto), i.moneda, i.archivo].map(esc).join(","));
    // Con BOM y con punto decimal: así lo abre bien Excel y lo lee bien
    // cualquier programa de contabilidad.
    return "﻿" + [cab.map(esc).join(","), ...filas].join("\r\n");
  }

  /** El nombre con el que la foto queda guardada y se puede encontrar. */
  function nombreDeArchivo(i: ItemExportable): string {
    const ext = i.archivo.includes(".") ? i.archivo.slice(i.archivo.lastIndexOf(".")) : "";
    const base = nombreSeguro(`${i.fecha || "sin-fecha"}_${i.comercio}_${plata(i.monto)}-${i.moneda}`);
    // Agrupadas en carpetas por categoría cuando ese es el orden elegido:
    // así el ZIP ya llega ordenado al abrirlo.
    const carpeta = orden === "categoria" ? `${nombreSeguro(i.categoria || "Sin categoría")}/` : "";
    return `${carpeta}${base}${ext}`;
  }

  async function exportar() {
    setBusy(true);
    setErr(null);
    try {
      const lista = ordenar(items, orden);

      if (formato === "planilla") {
        descargar(new Blob([planilla(lista)], { type: "text/csv;charset=utf-8" }), `comprobantes-${sufijo}.csv`);
        onClose();
        return;
      }

      // Los dos formatos que llevan las fotos necesitan bajarlas primero.
      setPaso(tr("Bajando las boletas…"));
      const urls = await signedUrlsRecibos(lista.map((i) => i.path));

      if (formato === "informe") {
        const filas: FilaInforme[] = [];
        for (const i of lista) {
          const url = i.esImagen ? urls.get(i.path) : undefined;
          filas.push({
            fecha: i.fecha, comercio: i.comercio, categoria: i.categoria, etiquetas: i.etiquetas,
            monto: i.monto, moneda: i.moneda, archivo: i.archivo,
            imagen: url ? await aDatos(url) : null,
          });
        }
        const html = armarInforme(
          { titulo: tr("Comprobantes"), filtros, generado: new Date().toLocaleDateString() },
          filas,
        );
        const v = window.open("", "_blank");
        if (!v) {
          descargar(new Blob([html], { type: "text/html" }), `comprobantes-${sufijo}.html`);
        } else {
          v.document.write(html);
          v.document.close();
          v.focus();
          setTimeout(() => v.print(), 400);
        }
        onClose();
        return;
      }

      // Carpeta: cada boleta con nombre legible, más la planilla adentro.
      const archivos: ArchivoZip[] = [];
      let n = 0;
      for (const i of lista) {
        n += 1;
        setPaso(`${tr("Bajando las boletas…")} ${n}/${lista.length}`);
        const url = urls.get(i.path);
        if (!url) continue;
        try {
          const datos = new Uint8Array(await (await fetch(url)).arrayBuffer());
          archivos.push({ nombre: nombreDeArchivo(i), datos });
        } catch { /* una boleta que no baja no bota la exportación entera */ }
      }
      archivos.push({ nombre: "comprobantes.csv", datos: new TextEncoder().encode(planilla(lista)) });

      if (archivos.length <= 1) throw new Error(tr("No pude bajar ninguna boleta. Revisa tu conexión."));
      descargar(armarZip(archivos), `comprobantes-${sufijo}.zip`);
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      setPaso("");
    }
  }

  const explica: Record<Formato, string> = {
    informe: tr("Una hoja con la tabla ordenada y cada boleta con su foto. Se abre para imprimir y desde ahí eliges Guardar como PDF. Es lo que se entrega."),
    planilla: tr("Solo los datos, en CSV. Se abre en Excel y lo lee cualquier programa de contabilidad o de impuestos. Sin las fotos."),
    carpeta: tr("Un ZIP con la foto de cada boleta, renombrada con su fecha, comercio y monto, más la planilla adentro. Es lo que sirve para tu propio archivo."),
  };

  return (
    <div className="tp-overlay" {...cierreDeFondo(onClose)}>
      <div className="tp" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <h3 style={{ marginBottom: 4 }}>📤 {tr("Exportar comprobantes")}</h3>
        <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 14 }}>
          {items.length} {items.length === 1 ? tr("comprobante") : tr("comprobantes")}
          {filtros ? `, ${filtros}` : ""}
        </p>

        <div className="field">
          <label>{tr("Formato")}</label>
          <Selector value={formato} ariaLabel={tr("Formato")} onChange={(v) => setFormato(v as Formato)}
            opciones={[
              { value: "informe", label: tr("Informe con las fotos") },
              { value: "planilla", label: tr("Planilla") },
              { value: "carpeta", label: tr("Carpeta con las fotos") },
            ]} />
          <small style={{ color: "var(--muted)", fontSize: 12, lineHeight: 1.45, display: "block", marginTop: 6 }}>
            {explica[formato]}
          </small>
        </div>

        <div className="field">
          <label>{tr("Ordenar por")}</label>
          <Selector value={orden} ariaLabel={tr("Ordenar por")} onChange={(v) => setOrden(v as Orden)}
            opciones={[
              { value: "fecha", label: tr("Fecha") },
              { value: "categoria", label: tr("Categoría") },
              { value: "comercio", label: tr("Comercio") },
            ]} />
          {formato === "carpeta" && orden === "categoria" && (
            <small style={{ color: "var(--muted)", fontSize: 12 }}>
              {tr("Cada categoría queda en su propia carpeta dentro del ZIP.")}
            </small>
          )}
        </div>

        {err && <p style={{ color: "var(--err)", fontSize: 13, marginBottom: 10 }}>{err}</p>}

        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 4 }}>
          <button className="btn ghost" onClick={onClose}>{tr("Cancelar")}</button>
          <button className="btn primary" {...sinRobarFoco} disabled={busy || items.length === 0} onClick={() => void exportar()}>
            {busy ? (paso || tr("com.guardando")) : tr("Exportar")}
          </button>
        </div>
      </div>
    </div>
  );
}
