import { cierreDeFondo } from "../components/cierreDeFondo";
import { useIdioma } from "../idioma/IdiomaProvider";
import { idiomaActual } from "../idioma/actual";
import { DOCUMENTOS, IDIOMAS_TRADUCIDOS, VERSION_LEGAL } from "./documentos";

// Los documentos sin salir de donde estás.
//
// Se abre desde la pantalla de crear cuenta: si hay que aceptar algo, hay que
// poder leerlo ahí mismo. Mandar a la persona a otra página, con el formulario
// a medio llenar, es la forma segura de que nadie lo lea.

export function LegalModal({ inicial, onClose }: {
  inicial: "terminos" | "privacidad";
  onClose: () => void;
}) {
  const { t: tr } = useIdioma();
  const idioma = idiomaActual();
  const docs = DOCUMENTOS[idioma] ?? DOCUMENTOS.es;
  const doc = inicial === "terminos" ? docs.terminos : docs.privacidad;
  const traducido = IDIOMAS_TRADUCIDOS.includes(idioma);

  return (
    <div className="tp-overlay" {...cierreDeFondo(onClose)}>
      <div className="tp" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620 }}>
        <h3 style={{ marginBottom: 2 }}>{doc.titulo}</h3>
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>{tr("Versión")} {VERSION_LEGAL}</p>

        {!traducido && (
          <p style={{ fontSize: 12.5, color: "var(--warn)", marginBottom: 12, lineHeight: 1.5 }}>
            {tr("Estos documentos todavía no están traducidos a tu idioma, así que se muestran en inglés. La versión en español y en inglés son las que valen.")}
          </p>
        )}

        <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 16 }}>{doc.intro}</p>
        {doc.secciones.map((s) => (
          <section key={s.titulo} style={{ marginBottom: 18 }}>
            <h4 style={{ fontSize: 14, marginBottom: 6 }}>{s.titulo}</h4>
            {s.parrafos.map((p, i) => (
              <p key={i} style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-soft)", marginBottom: 7 }}>{p}</p>
            ))}
          </section>
        ))}

        <button className="btn primary" style={{ width: "100%", marginTop: 4 }} onClick={onClose}>
          {tr("Cerrar")}
        </button>
      </div>
    </div>
  );
}
