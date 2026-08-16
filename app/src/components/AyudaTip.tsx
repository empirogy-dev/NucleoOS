import { useEffect, useRef, useState } from "react";

// Un signo de pregunta que explica un número.
//
// Se abre al tocarlo, no al pasar el mouse por encima: en el celular no hay
// mouse, y una explicación que solo aparece con hover no existe para la mitad
// de la gente. Se cierra tocando fuera o con Escape.

export function AyudaTip({ texto, etiqueta }: { texto: string; etiqueta: string }) {
  const [abierto, setAbierto] = useState(false);
  // Hacia qué lado se abre. Se decide midiendo: pegado al borde derecho de la
  // pantalla, un globo anclado a la izquierda se sale. Una media query por
  // ancho de pantalla no basta, porque depende de dónde esté la tarjeta.
  const [alaIzquierda, setAlaIzquierda] = useState(false);
  const caja = useRef<HTMLSpanElement>(null);
  const globo = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!abierto || !globo.current) return;
    const r = globo.current.getBoundingClientRect();
    // 8px de aire con el borde, para que no quede pegado.
    if (r.right > window.innerWidth - 8) setAlaIzquierda(true);
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false);
    };
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape") setAbierto(false); };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", escape);
    };
  }, [abierto]);

  return (
    <span ref={caja} style={{ position: "relative", display: "inline-flex", verticalAlign: "middle" }}>
      <button type="button" className="ayuda-tip" aria-label={etiqueta} aria-expanded={abierto}
        onClick={() => { setAlaIzquierda(false); setAbierto(!abierto); }}>?</button>
      {abierto && (
        <span ref={globo} role="tooltip" className={"ayuda-pop" + (alaIzquierda ? " izq" : "")}>{texto}</span>
      )}
    </span>
  );
}
