// Selector de hora con el estilo de la app: dos selects (hora y minutos)
// en vez del input time nativo, cuyo panel azul del navegador no se puede
// restylear con CSS. Entrega y recibe "HH:MM" (24 horas), igual que antes.

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

  function set(nh: string, nm: string) {
    if (!nh) { onChange(""); return; }
    onChange(`${nh}:${nm || "00"}`);
  }

  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <select className="ms-sel" style={{ padding: "9px 26px 9px 10px", flex: 1 }} value={h}
        aria-label={`${ariaLabel}, hora`} onChange={(e) => set(e.target.value, m)}>
        <option value="">--</option>
        {HORAS.map((x) => <option key={x} value={x}>{x}</option>)}
      </select>
      <span style={{ color: "var(--muted)", fontWeight: 600 }}>:</span>
      <select className="ms-sel" style={{ padding: "9px 26px 9px 10px", flex: 1 }} value={m}
        aria-label={`${ariaLabel}, minutos`} onChange={(e) => set(h || "00", e.target.value)}>
        <option value="">--</option>
        {minutos.map((x) => <option key={x} value={x}>{x}</option>)}
      </select>
    </div>
  );
}
