// Interruptor del sistema de diseño: toma el color principal del tema
// elegido (--accent deriva de --pri), así que cambia solo cuando la
// persona pasa de Verde salvia a Lavanda o Menta suave.
//
// El interruptor va antes de la etiqueta a propósito: en una grilla de
// varias columnas, dejarlo al final lo acerca más a la palabra de la
// columna siguiente que a la suya. Toda la fila es un solo botón, así
// que se puede tocar en cualquier parte, no solo en el interruptor.

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className="swrow"
      onClick={() => onChange(!checked)}
    >
      <span className="sw" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}
