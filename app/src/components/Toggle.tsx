// Interruptor del sistema de diseño: toma el color principal del tema
// elegido (--accent deriva de --pri), así que cambia solo cuando la
// persona pasa de Verde salvia a Lavanda o Menta suave.

export function Toggle({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className="sw"
      onClick={() => onChange(!checked)}
    />
  );
}
