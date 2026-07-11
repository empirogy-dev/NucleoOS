// Luna estilo boho: crecientes de tinta sólida con puntas afiladas,
// dibujadas con arcos de distinto radio, como ilustración de tatuaje.
// Vista del hemisferio norte: la creciente se ilumina por la derecha
// y la menguante por la izquierda.

type Forma = "nueva" | "sliver" | "cuarto" | "gibosa" | "llena";

const FORMAS: Record<string, { forma: Forma; luzIzquierda: boolean }> = {
  "Luna nueva": { forma: "nueva", luzIzquierda: false },
  "Creciente": { forma: "sliver", luzIzquierda: false },
  "Cuarto creciente": { forma: "cuarto", luzIzquierda: false },
  "Gibosa creciente": { forma: "gibosa", luzIzquierda: false },
  "Luna llena": { forma: "llena", luzIzquierda: false },
  "Gibosa menguante": { forma: "gibosa", luzIzquierda: true },
  "Cuarto menguante": { forma: "cuarto", luzIzquierda: true },
  "Menguante": { forma: "sliver", luzIzquierda: true },
};

// Crecientes con luz a la IZQUIERDA; la derecha se logra espejando.
// Arco exterior por el borde izquierdo de la luna, arco interior más
// amplio que vuelve arriba: eso afila las puntas.
const PATH_SLIVER = "M18 3.5 A12.5 12.5 0 0 0 18 28.5 A13.4 13.4 0 0 1 18 3.5 Z";
const PATH_CUARTO = "M18 3.5 A12.5 12.5 0 0 0 18 28.5 A17.5 17.5 0 0 1 18 3.5 Z";

export function LunaFase({ nombre, size = 52, dots = false }: { nombre: string; size?: number; dots?: boolean }) {
  const { forma, luzIzquierda } = FORMAS[nombre] ?? { forma: "llena" as Forma, luzIzquierda: false };
  const tinta = "color-mix(in srgb, var(--ink) 88%, var(--paper))";
  const espejo = luzIzquierda ? undefined : "translate(36 0) scale(-1 1)";
  const id = `luna-${nombre.replace(/\s/g, "-")}-${size}`;

  return (
    <svg width={size} height={size} viewBox="0 0 36 32" role="img" aria-label={nombre} style={{ display: "block" }}>
      {forma === "nueva" && (
        <circle cx="18" cy="16" r="11.8" fill="none" stroke={tinta} strokeWidth="1.6" opacity="0.75" />
      )}
      {forma === "llena" && <circle cx="18" cy="16" r="12.5" fill={tinta} />}
      {forma === "sliver" && <path d={PATH_SLIVER} fill={tinta} transform={espejo} />}
      {forma === "cuarto" && <path d={PATH_CUARTO} fill={tinta} transform={espejo} />}
      {forma === "gibosa" && (
        <>
          <defs>
            <mask id={id}>
              <circle cx="18" cy="16" r="12.5" fill="white" />
              {/* mordida suave con un círculo más amplio */}
              <circle cx={luzIzquierda ? 44 : -8} cy="16" r="15.5" fill="black" />
            </mask>
          </defs>
          <circle cx="18" cy="16" r="12.5" fill={tinta} mask={`url(#${id})`} />
        </>
      )}
      {/* puntitos boho de compañía */}
      {dots && (
        <>
          <circle cx="3" cy="19.5" r="1.2" fill={tinta} opacity="0.85" />
          <circle cx="33.2" cy="10.5" r="1.5" fill={tinta} opacity="0.85" />
          <circle cx="31.4" cy="23.5" r="0.9" fill={tinta} opacity="0.6" />
        </>
      )}
    </svg>
  );
}
