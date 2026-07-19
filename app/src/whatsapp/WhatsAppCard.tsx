import { useCallback, useEffect, useState } from "react";
import { Send } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useIdioma } from "../idioma/IdiomaProvider";

// Núcleo por chat (docs/whatsapp/): la tarjeta del vínculo de Telegram en Ajustes.
// Las tablas wa_* sirven igual: la columna telefono guarda el chat_id.
// Genera el código de 6 dígitos, muestra el estado del vínculo, los
// switches de avisos y permite desvincular. Todo lo demás vive en el chat.

interface Vinculo {
  telefono: string;
  vinculado_en: string;
  avisos: Record<string, boolean>;
  avisos_activos: boolean;
}

const TIPOS_AVISO: Array<{ key: string; label: string }> = [
  { key: "ayuno", label: "⏳ Fin de ayuno" },
  { key: "tareas", label: "📝 Tareas del día" },
  { key: "cumples", label: "🎂 Cumpleaños" },
  { key: "pagos", label: "🔔 Pagos próximos" },
  { key: "habitos", label: "✓ Hábitos de la noche" },
];

function codigoAleatorio(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function WhatsAppCard() {
  const { t: tr } = useIdioma();
  const [vinculo, setVinculo] = useState<Vinculo | null>(null);
  const [codigo, setCodigo] = useState<string | null>(null);
  const [faltaMigracion, setFaltaMigracion] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from("wa_vinculos")
      .select("telefono,vinculado_en,avisos,avisos_activos").maybeSingle();
    if (error && /does not exist|could not find the table|PGRST205/i.test(error.message)) {
      setFaltaMigracion(true);
      return;
    }
    setVinculo((data as Vinculo) ?? null);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function generarCodigo() {
    if (!supabase) return;
    setBusy(true);
    setErr(null);
    try {
      const { data: quien } = await supabase.auth.getUser();
      if (!quien?.user) return;
      const nuevo = codigoAleatorio();
      const { error } = await supabase.from("wa_codigos").insert({
        user_id: quien.user.id,
        codigo: nuevo,
        expira_en: new Date(Date.now() + 10 * 60_000).toISOString(),
      });
      if (error) throw error;
      setCodigo(nuevo);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function cambiarAviso(key: string, valor: boolean) {
    if (!supabase || !vinculo) return;
    const avisos = { ...vinculo.avisos, [key]: valor };
    setVinculo({ ...vinculo, avisos });
    await supabase.from("wa_vinculos").update({ avisos }).neq("telefono", "");
  }

  async function desvincular() {
    if (!supabase || !vinculo) return;
    if (!window.confirm(tr("¿Desvincular tu Telegram? Tus datos en la app quedan intactos."))) return;
    await supabase.from("wa_vinculos").delete().neq("telefono", "");
    setVinculo(null);
    setCodigo(null);
  }

  if (faltaMigracion) {
    return (
      <div className="card pad">
        <h3 style={{ fontSize: 15, marginBottom: 4 }}><Send size={14} style={{ verticalAlign: "-2px" }} /> Telegram</h3>
        <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>
          {tr("Para conectar tu Telegram, corre")} <code>supabase/migrations/0051_whatsapp.sql</code> {tr("en el SQL Editor de Supabase.")}
        </p>
      </div>
    );
  }

  return (
    <div className="card pad">
      <h3 style={{ fontSize: 15, marginBottom: 4 }}><Send size={14} style={{ verticalAlign: "-2px" }} /> Telegram</h3>

      {vinculo ? (
        <>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 10 }}>
            {tr("Tu Telegram está vinculado.")}{" "}
            {tr("Cuéntale lo que hiciste y él lo registra en la app. Escríbele \"silencio\" para pausar sus avisos.")}
          </p>
          {!vinculo.avisos_activos && (
            <p style={{ fontSize: 12.5, color: "var(--warn)", marginBottom: 8 }}>
              🤫 {tr("Avisos en pausa (los apagaste desde el chat).")}
            </p>
          )}
          <div style={{ display: "grid", gap: 6, marginBottom: 12 }}>
            {TIPOS_AVISO.map((t) => (
              <label key={t.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={vinculo.avisos?.[t.key] !== false}
                  onChange={(e) => void cambiarAviso(t.key, e.target.checked)}
                />
                {tr(t.label)}
              </label>
            ))}
          </div>
          <button className="btn ghost" onClick={() => void desvincular()}>{tr("Desvincular")}</button>
        </>
      ) : (
        <>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
            {tr("Vincula tu Telegram y regístralo todo por chat o audio: \"hice 30 min de gimnasio\", \"tomé 2 vasos de agua\", \"recuérdame comprar pan\". El bot escribe en tu app por ti.")}
          </p>
          {codigo ? (
            <>
              <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 6 }}>
                {tr("Ábrele un chat al bot de NucleoOS en Telegram y mándale este mensaje (el código dura 10 minutos):")}
              </p>
              <p className="tnum" style={{ fontFamily: "var(--serif)", fontSize: 26, fontWeight: 600, letterSpacing: ".04em", marginBottom: 10 }}>
                vincular {codigo}
              </p>
            </>
          ) : (
            <button className="btn primary" disabled={busy} onClick={() => void generarCodigo()}>
              {busy ? tr("com.guardando") : tr("Generar código de vinculación")}
            </button>
          )}
          {err && <p style={{ fontSize: 12.5, color: "var(--err)", marginTop: 8 }}>{err}</p>}
        </>
      )}
    </div>
  );
}
