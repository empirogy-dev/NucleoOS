import { useState } from "react";
import { useIdioma } from "../idioma/IdiomaProvider";
import { idiomaActual } from "../idioma/actual";
import { DOCUMENTOS, IDIOMAS_TRADUCIDOS, VERSION_LEGAL, type Documento } from "./documentos";

// Los términos y la política, para leerlos completos.
//
// Se llega desde Ajustes, desde el pie de la landing y desde la pantalla de
// crear cuenta. Un documento que hay que aceptar tiene que poder leerse antes
// de aceptarlo, sin salir de donde estás.

function Texto({ doc }: { doc: Documento }) {
  return (
    <>
      <h2 style={{ fontSize: 20, marginBottom: 8 }}>{doc.titulo}</h2>
      <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6, marginBottom: 20 }}>{doc.intro}</p>
      {doc.secciones.map((s) => (
        <section key={s.titulo} style={{ marginBottom: 22 }}>
          <h3 style={{ fontSize: 15, marginBottom: 8 }}>{s.titulo}</h3>
          {s.parrafos.map((p, i) => (
            <p key={i} style={{ fontSize: 14, lineHeight: 1.65, color: "var(--ink-soft)", marginBottom: 8 }}>{p}</p>
          ))}
        </section>
      ))}
    </>
  );
}

export function LegalPage({ inicial = "terminos" }: { inicial?: "terminos" | "privacidad" }) {
  const { t: tr } = useIdioma();
  const [cual, setCual] = useState<"terminos" | "privacidad">(inicial);
  const idioma = idiomaActual();
  const docs = DOCUMENTOS[idioma] ?? DOCUMENTOS.es;
  const traducido = IDIOMAS_TRADUCIDOS.includes(idioma);

  return (
    <div className="page">
      <div className="page-head">
        <h1>{tr("Términos y privacidad")}</h1>
        <p>{tr("Versión")} {VERSION_LEGAL}</p>
      </div>

      {/* Hacer pasar un idioma por otro en un documento legal sería peor que
          decir que todavía no está traducido. */}
      {!traducido && (
        <div className="card pad" style={{ marginBottom: 14, borderLeft: "3px solid var(--warn)" }}>
          <p style={{ fontSize: 13.5, lineHeight: 1.6 }}>
            {tr("Estos documentos todavía no están traducidos a tu idioma, así que se muestran en inglés. La versión en español y en inglés son las que valen.")}
          </p>
        </div>
      )}

      <div className="seg" style={{ maxWidth: 420, marginBottom: 18 }}>
        <button className={"segbtn" + (cual === "terminos" ? " active" : "")} onClick={() => setCual("terminos")}>
          {tr("Términos de servicio")}
        </button>
        <button className={"segbtn" + (cual === "privacidad" ? " active" : "")} onClick={() => setCual("privacidad")}>
          {tr("Política de privacidad")}
        </button>
      </div>

      <div className="card pad" style={{ maxWidth: 780 }}>
        <Texto doc={cual === "terminos" ? docs.terminos : docs.privacidad} />
        <p style={{ fontSize: 12.5, color: "var(--muted)", borderTop: "1px solid var(--line)", paddingTop: 14 }}>
          {tr("¿Dudas sobre esto? Escríbenos a")} <b>hola@nucleoos.app</b>.
        </p>
      </div>
    </div>
  );
}
