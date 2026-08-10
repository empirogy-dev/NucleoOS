import { useState } from "react";
import { useIdioma } from "../idioma/IdiomaProvider";
import { FORMULARIO, lineasDe, type PaisImpuestos } from "./impuestos";

// Qué gasto va en cada línea del formulario.
//
// Saber que existe la línea 8521 no sirve de nada si uno no sabe qué gasto va
// ahí, y esa es justo la parte difícil. Va donde se asignan las líneas, que
// es donde surge la duda, no en otra pantalla.

export function GuiaImpuestos({ pais, titulo }: { pais: PaisImpuestos; titulo?: string }) {
  const { t: tr } = useIdioma();
  const [abierta, setAbierta] = useState(false);
  const lineas = lineasDe(pais);
  if (lineas.length === 0) return null;

  return (
    <div className="card pad" style={{ marginTop: 16 }}>
      <button type="button" className="linklike" style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}
        onClick={() => setAbierta(!abierta)}>
        {abierta ? "▾" : "▸"} 📘 {titulo ?? tr("¿Qué gasto va en cada línea?")}
      </button>
      {!abierta && (
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
          {tr("Ejemplos concretos de qué poner en cada una, y dónde están las trampas.")}
        </p>
      )}
      {abierta && (
        <>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: "8px 0 12px", lineHeight: 1.5 }}>
            {tr(FORMULARIO[pais])}
          </p>
          <div style={{ display: "grid", gap: 12 }}>
            {lineas.map((l) => (
              <div key={l.numero} style={{ fontSize: 12.5, lineHeight: 1.5 }}>
                <b style={{ fontSize: 13 }}>
                  {pais === "CA" ? `${l.numero} · ` : ""}{tr(l.es)}
                </b>
                {pais === "CA" && (
                  <span style={{ color: "var(--muted)", fontSize: 11.5 }}> · {l.oficial}</span>
                )}
                {l.ejemplos && <div style={{ color: "var(--ink-soft)" }}>{tr(l.ejemplos)}</div>}
                {l.ojo && <div style={{ color: "var(--warn)", fontSize: 11.5 }}>⚠️ {tr(l.ojo)}</div>}
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 14, lineHeight: 1.5 }}>
            {tr("Estos son ejemplos para orientarte, no una regla. NucleoOS no es un asesor tributario: la última palabra la tienes tú o tu contador.")}
          </p>
        </>
      )}
    </div>
  );
}
