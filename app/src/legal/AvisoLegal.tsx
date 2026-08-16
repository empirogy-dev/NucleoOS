import { useEffect, useState } from "react";
import { useIdioma } from "../idioma/IdiomaProvider";
import { LegalModal } from "./LegalModal";
import { aceptoLaVigente, registrarAceptacion } from "./aceptacion";

// La barra que pide aceptar la versión vigente.
//
// El propio documento dice: "si cambiamos algo importante, te lo mostraremos
// dentro de la app y te pediremos aceptarlo de nuevo". Prometer eso y no
// tener dónde mostrarlo es una promesa vacía, así que esto lo cumple.
//
// No bloquea la app a propósito. Interrumpir a alguien a mitad de lo que está
// haciendo para exigirle que lea un documento consigue que no lo lea y que
// acepte por salir del paso. Se queda arriba, visible, hasta que decida.

export function AvisoLegal() {
  const { t: tr } = useIdioma();
  const [falta, setFalta] = useState(false);
  const [ver, setVer] = useState<null | "terminos" | "privacidad">(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let vivo = true;
    aceptoLaVigente().then((ya) => { if (vivo) setFalta(!ya); }).catch(() => {});
    return () => { vivo = false; };
  }, []);

  if (!falta) return null;

  async function aceptar() {
    setGuardando(true);
    await registrarAceptacion();
    setFalta(false);
  }

  return (
    <>
      {ver && <LegalModal inicial={ver} onClose={() => setVer(null)} />}
      <div className="card pad" style={{
        margin: "0 0 14px", borderLeft: "3px solid var(--accent)",
        display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap",
      }}>
        <span style={{ flex: 1, minWidth: 220, fontSize: 13, lineHeight: 1.55 }}>
          {tr("Actualizamos los términos y la política de privacidad.")}{" "}
          <button type="button" className="linklike enlinea" style={{ fontSize: 13 }}
            onClick={() => setVer("terminos")}>{tr("Léelos aquí")}</button>
          {" · "}
          <button type="button" className="linklike enlinea" style={{ fontSize: 13 }}
            onClick={() => setVer("privacidad")}>{tr("Política de privacidad")}</button>
        </span>
        <button className="btn primary" disabled={guardando} onClick={() => void aceptar()}>
          {guardando ? tr("com.guardando") : tr("Entendido, acepto")}
        </button>
      </div>
    </>
  );
}
