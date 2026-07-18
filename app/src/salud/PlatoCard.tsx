import { useState } from "react";
import { Camera, ImagePlus, Sparkles } from "lucide-react";
import { analizarComidaTexto, analizarPlato, blobToBase64, iaConfigured, type AnalisisPlato } from "../lib/ia";
import { TablesMissingError } from "../finanzas/data";
import { hoyLocal } from "../lib/fechas";
import { addMeal, MOMENTOS, momentoSugerido } from "./comidas";

// Tu plato: foto → estimación de macros con IA → guardado en el día.
// Es una estimación amable para acompañar hábitos, no un diagnóstico.

export function PlatoCard({ fecha, esHoy = true, onSaved }: { fecha?: string; esHoy?: boolean; onSaved: () => void }) {
  const [analizando, setAnalizando] = useState(false);
  const [resultado, setResultado] = useState<AnalisisPlato | null>(null);
  const [texto, setTexto] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [falta0020, setFalta0020] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [momento, setMomento] = useState(momentoSugerido());

  async function analizarTexto(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    setErr(null);
    setResultado(null);
    setAnalizando(true);
    try {
      setResultado(await analizarComidaTexto(texto.trim()));
      setTexto("");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setAnalizando(false);
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setErr("La foto pesa más de 8 MB. Prueba con una más liviana.");
      return;
    }
    setErr(null);
    setResultado(null);
    setAnalizando(true);
    try {
      const base64 = await blobToBase64(file);
      setResultado(await analizarPlato(base64, file.type || "image/jpeg"));
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setAnalizando(false);
    }
  }

  async function guardar() {
    if (!resultado) return;
    setGuardando(true);
    setErr(null);
    try {
      await addMeal({
        date: fecha ?? hoyLocal(),
        description: resultado.descripcion,
        kcal: resultado.kcal,
        protein_g: resultado.proteina_g,
        carbs_g: resultado.carbohidratos_g,
        fat_g: resultado.grasas_g,
        fiber_g: resultado.fibra_g,
        satiety: resultado.saciedad,
        impact: resultado.impacto || null,
        meal_type: momento,
        // En días pasados no sabemos la hora exacta: sin marca, para no
        // confundir al contador de ayuno.
        eaten_at: esHoy ? new Date().toISOString() : null,
      });
      setResultado(null);
      setMomento(momentoSugerido());
      onSaved();
    } catch (ex) {
      if (ex instanceof TablesMissingError) setFalta0020(true);
      else setErr(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="card panel">
      <h3>📸 Tu plato</h3>
      {!iaConfigured ? (
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Para estimar los macros de una foto necesito la llave de Gemini: agrega <code>VITE_GEMINI_API_KEY</code> en <code>app/.env</code>.
        </p>
      ) : (
        <>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
            Fotografía tu comida o escríbela, y te estimo calorías, proteína, carbohidratos y grasas. Es una guía, no una balanza.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <label className="btn primary" style={{ cursor: "pointer" }}>
              <Camera size={15} style={{ verticalAlign: "-2px", marginRight: 6 }} />
              {analizando ? "Analizando…" : "Tomar foto del plato"}
              <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={onFile} disabled={analizando} />
            </label>
            <label className="btn ghost" style={{ cursor: "pointer" }}>
              <ImagePlus size={15} style={{ verticalAlign: "-2px", marginRight: 6 }} />
              Subir foto
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={onFile} disabled={analizando} />
            </label>
          </div>
          <form onSubmit={analizarTexto} style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <input
              className="input-inline"
              style={{ flex: "1 1 180px" }}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="O escríbelo: una lata de atún y un huevo duro"
              disabled={analizando}
            />
            <button className="btn ghost" disabled={analizando || !texto.trim()}>
              <Sparkles size={14} style={{ verticalAlign: "-2px", marginRight: 5 }} />
              Estimar
            </button>
          </form>
          {analizando && (
            <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 12 }}>
              Mirando tu plato con calma… 🍽
            </p>
          )}
          {falta0020 && (
            <p style={{ fontSize: 12.5, color: "var(--warn)", marginTop: 12 }}>
              Para guardar comidas falta correr <code>supabase/migrations/0020_comidas.sql</code>.
            </p>
          )}
          {err && <p style={{ fontSize: 12.5, color: "var(--err)", marginTop: 12 }}>{err}</p>}
          {resultado && (
            <div style={{ marginTop: 14, borderTop: "1px solid var(--line-soft)", paddingTop: 12 }}>
              <b style={{ fontSize: 14 }}>{resultado.descripcion}</b>
              <div className="macro-fila">
                <span className="macro"><b className="tnum">{resultado.kcal}</b> kcal</span>
                <span className="macro">🍗 <b className="tnum">{resultado.proteina_g} g</b></span>
                <span className="macro">🍞 <b className="tnum">{resultado.carbohidratos_g} g</b></span>
                <span className="macro">🥑 <b className="tnum">{resultado.grasas_g} g</b></span>
                <span className="macro">🌾 <b className="tnum">{resultado.fibra_g} g</b></span>
              </div>
              <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "8px 0" }}>
                Saciedad {"●".repeat(resultado.saciedad)}{"○".repeat(5 - resultado.saciedad)}
                {resultado.impacto ? `. ${resultado.impacto}` : ""}
              </p>
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 6 }}>¿Qué comida es?</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {MOMENTOS.map((m) => (
                    <button key={m.key} type="button"
                      className={"pomo-chip" + (momento === m.key ? " on" : "")}
                      onClick={() => setMomento(m.key)}>
                      {m.emoji} {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn primary" disabled={guardando} onClick={() => void guardar()}>
                  {guardando ? "Guardando…" : "Guardar en mi día"}
                </button>
                <button className="btn ghost" onClick={() => setResultado(null)}>Descartar</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
