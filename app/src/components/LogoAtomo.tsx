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
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <ellipse cx="12" cy="12" rx="8.6" ry="3.9" />
      <ellipse cx="12" cy="12" rx="8.6" ry="3.9" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="8.6" ry="3.9" transform="rotate(-60 12 12)" />
      <circle cx="12" cy="12" r="2.1" fill="currentColor" stroke="none" />
      <circle cx="18.8" cy="7.4" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
