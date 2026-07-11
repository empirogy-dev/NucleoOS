// Luna plana dibujada con SVG y colores del tema, nada de emojis 3D.
// La sombra es un círculo desplazado según la fase, recortado a la luna.

// Vista del hemisferio norte: la creciente se ilumina por la derecha
// y la menguante por la izquierda.
const OFFSETS: Record<string, number> = {
  "Luna nueva": 0,          // sombra completa
  "Creciente": -10,         // hilo de luz a la derecha
  "Cuarto creciente": -16,  // mitad derecha iluminada
  "Gibosa creciente": -24,  // casi llena, sombra a la izquierda
  "Luna llena": 40,         // sin sombra
  "Gibosa menguante": 24,   // casi llena, sombra a la derecha
  "Cuarto menguante": 16,   // mitad izquierda iluminada
  "Menguante": 10,          // hilo de luz a la izquierda
};

export function LunaFase({ nombre, size = 52 }: { nombre: string; size?: number }) {
  const dx = OFFSETS[nombre] ?? 0;
  const id = `luna-${nombre.replace(/\s/g, "-")}-${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" role="img" aria-label={nombre} style={{ display: "block" }}>
      <defs>
        <clipPath id={id}>
          <circle cx="16" cy="16" r="14" />
        </clipPath>
      </defs>
      {/* cara iluminada, plana */}
      <circle cx="16" cy="16" r="14" fill="color-mix(in srgb, var(--sal) 55%, var(--paper))" />
      {/* sombra de la fase */}
      <g clipPath={`url(#${id})`}>
        <circle cx={16 + dx} cy="16" r="14" fill="color-mix(in srgb, var(--ink) 72%, var(--paper))" />
      </g>
      {/* borde suave */}
      <circle cx="16" cy="16" r="14" fill="none" stroke="color-mix(in srgb, var(--ink) 30%, var(--paper))" strokeWidth="1.2" />
    </svg>
  );
}
