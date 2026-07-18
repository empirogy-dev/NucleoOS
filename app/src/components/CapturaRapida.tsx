import { useEffect, useRef, useState } from "react";
import { Zap } from "lucide-react";
import { addDayTask } from "../tareas/data";
import { TablesMissingError } from "../finanzas/data";

// Captura rápida global: atrapa el pensamiento antes de que se esfume.
// Un toque, escribes, Enter, y quedó en Tareas de hoy. Sin categorías,
// sin fecha, sin decisiones. El cerebro TDAH suelta y sigue.

export function CapturaRapida() {
  const [abierta, setAbierta] = useState(false);
  const [texto, setTexto] = useState("");
  const [estado, setEstado] = useState<"idle" | "guardando" | "ok" | "err">("idle");
  const [errMsg, setErrMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (abierta) inputRef.current?.focus();
  }, [abierta]);

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault();
    const t = texto.trim();
    if (!t || estado === "guardando") return;
    setEstado("guardando");
    try {
      await addDayTask(t);
      setTexto("");
      setEstado("ok");
      // La ventanita queda abierta por si vienen más pensamientos en cadena.
      setTimeout(() => setEstado((s) => (s === "ok" ? "idle" : s)), 2200);
    } catch (e) {
      setErrMsg(e instanceof TablesMissingError
        ? "Falta la migración 0033 (tareas del día) en Supabase."
        : e instanceof Error ? e.message : String(e));
      setEstado("err");
    }
  }

  return (
    <>
      <button
        className="captura-fab"
        aria-label={abierta ? "Cerrar captura rápida" : "Anotar algo rápido"}
        title="Anota lo que te pasó por la cabeza"
        onClick={() => { setAbierta((v) => !v); setEstado("idle"); }}
      >
        <Zap size={17} />
      </button>

      {abierta && (
        <form className="captura-panel" onSubmit={guardar}>
          <p className="captura-lb">Suéltalo aquí antes de que se escape</p>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              ref={inputRef}
              className="input-inline"
              style={{ flex: 1 }}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape") setAbierta(false); }}
              placeholder="pagar la luz, idea para el regalo…"
            />
            <button className="btn primary" disabled={estado === "guardando" || !texto.trim()}>
              {estado === "guardando" ? "…" : "Va"}
            </button>
          </div>
          {estado === "ok" && <p className="captura-ok">✓ Quedó en Tareas de hoy. Sigue en lo tuyo.</p>}
          {estado === "err" && <p className="captura-err">{errMsg}</p>}
        </form>
      )}
    </>
  );
}
