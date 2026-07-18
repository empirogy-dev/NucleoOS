import { Selector } from "./Selector";

// Selector de hora 100% del tema: dos desplegables propios (hora y minutos).
// Nada nativo del navegador. Entrega y recibe "HH:MM" (24 horas).

const HORAS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTOS = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

export function CampoHora({ value, onChange, ariaLabel }: {
  value: string; // "HH:MM" o ""
  onChange: (v: string) => void;
  ariaLabel: string;
}) {
  const [h, m] = value ? value.split(":") : ["", ""];
  // Si el minuto guardado no es múltiplo de 5 (registros antiguos), se ofrece igual.
  const minutos = m && !MINUTOS.includes(m) ? [m, ...MINUTOS] : MINUTOS;

  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <Selector
        value={h}
        ariaLabel={`${ariaLabel}, hora`}
        placeholder="hora"
        opciones={HORAS.map((x) => ({ value: x, label: x }))}
        onChange={(nh) => onChange(`${nh}:${m || "00"}`)}
      />
      <span style={{ color: "var(--muted)", fontWeight: 600 }}>:</span>
      <Selector
        value={m}
        ariaLabel={`${ariaLabel}, minutos`}
        placeholder="min"
        opciones={minutos.map((x) => ({ value: x, label: x }))}
        onChange={(nm) => onChange(`${h || "00"}:${nm}`)}
      />
    </div>
  );
}
