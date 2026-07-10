import { useState } from "react";
import { Compass } from "lucide-react";
import { consejoCoach, iaConfigured } from "../lib/ia";

// Coach v1: la primera versión del corazón de NucleoOS. Recibe un resumen
// del estado real de la vida del usuario y pide a la IA una devolución
// cálida y accionable. En la fase del agente será proactivo y por voz.

export function CoachCard({ resumen }: { resumen: string }) {
  const [consejo, setConsejo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function pedir() {
    setBusy(true);
    setErr(null);
    try {
      setConsejo(await consejoCoach(resumen));
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card panel" style={{ marginBottom: 16 }}>
      <h3><Compass size={14} style={{ verticalAlign: "-2px" }} /> Tu coach</h3>
      {!iaConfigured ? (
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Para activar el coach, agrega tu llave gratuita de Gemini como VITE_GEMINI_API_KEY en app/.env
          (la misma de los resúmenes de Aprendizaje) y reinicia el servidor.
        </p>
      ) : (
        <>
          {consejo && <div className="coach-msg">{consejo}</div>}
          {err && <p style={{ fontSize: 12.5, color: "var(--err)", marginBottom: 10 }}>{err}</p>}
          {!consejo && !busy && (
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 10 }}>
              Tu coach mira tus metas, hábitos, avances y pagos, y te dice qué va bien, qué necesita atención y
              qué paso pequeño dar hoy.
            </p>
          )}
          <button className="btn ghost" disabled={busy} onClick={() => void pedir()}>
            {busy ? "Pensando…" : consejo ? "Pedir otro consejo" : "Pedir un consejo"}
          </button>
        </>
      )}
    </div>
  );
}
