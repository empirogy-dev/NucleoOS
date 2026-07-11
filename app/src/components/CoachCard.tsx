import { useState } from "react";
import { Compass, Send } from "lucide-react";
import { consejoCoach, hablarConCoach, iaConfigured } from "../lib/ia";

// Coach conversable: mira tu estado real y además puedes contarle cómo
// te sientes o preguntarle. Pensado para TDAH: pasos chicos, cero culpa.

interface Mensaje {
  de: "yo" | "coach";
  texto: string;
}

export function CoachCard({ resumen }: { resumen: string }) {
  const [charla, setCharla] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function pedirConsejo() {
    setBusy(true);
    setErr(null);
    try {
      const consejo = await consejoCoach(resumen);
      setCharla((c) => [...c, { de: "coach", texto: consejo }]);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setBusy(false);
    }
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const mensaje = texto.trim();
    if (!mensaje) return;
    setTexto("");
    setErr(null);
    setCharla((c) => [...c, { de: "yo", texto: mensaje }]);
    setBusy(true);
    try {
      const respuesta = await hablarConCoach(resumen, charla, mensaje);
      setCharla((c) => [...c, { de: "coach", texto: respuesta }]);
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
          y reinicia el servidor.
        </p>
      ) : (
        <>
          {charla.length === 0 && !busy && (
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 10 }}>
              Cuéntale cómo te sientes o pregúntale lo que quieras: conoce tus metas, hábitos, avances y pagos.
              O pídele un consejo general con el botón.
            </p>
          )}
          {charla.map((m, i) => (
            m.de === "coach" ? (
              <div className="coach-msg" key={i}>{m.texto}</div>
            ) : (
              <div key={i} className="coach-yo">{m.texto}</div>
            )
          ))}
          {busy && <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 10 }}>Pensando…</p>}
          {err && <p style={{ fontSize: 12.5, color: "var(--err)", marginBottom: 10 }}>{err}</p>}
          <form onSubmit={enviar} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              className="input-inline"
              style={{ flex: "1 1 220px" }}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Cuéntale cómo te sientes o pregúntale algo…"
              disabled={busy}
            />
            <button className="btn primary" disabled={busy || !texto.trim()} aria-label="Enviar al coach">
              <Send size={14} style={{ verticalAlign: "-2px" }} />
            </button>
            <button type="button" className="btn ghost" disabled={busy} onClick={() => void pedirConsejo()}>
              {charla.length > 0 ? "Otro consejo" : "Pedir un consejo"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
