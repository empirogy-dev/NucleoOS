// El logo de NucleoOS: un átomo con su núcleo, dibujado en línea,
// en el mismo espíritu boho plano de la luna. El núcleo eres tú.

export function LogoAtomo({ size = 20 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="0.9"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <ellipse cx="12" cy="12" rx="10.6" ry="4.8" />
      <ellipse cx="12" cy="12" rx="10.6" ry="4.8" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="10.6" ry="4.8" transform="rotate(-60 12 12)" />
      <circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" />
      <circle cx="20.3" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
