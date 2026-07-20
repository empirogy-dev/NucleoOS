import { useCallback, useEffect, useState } from "react";
import { Send } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useIdioma } from "../idioma/IdiomaProvider";
import { Selector } from "../components/Selector";

// Núcleo por chat (docs/whatsapp/): la tarjeta del vínculo de Telegram en Ajustes.
// Las tablas wa_* sirven igual: la columna telefono guarda el chat_id.
// Genera el código de 6 dígitos, muestra el estado del vínculo, los
// la zona horaria y permite desvincular. Los avisos llegan todos: se pausan
// desde el propio chat con "silencio". Todo lo demás vive en el chat.

interface Vinculo {
  telefono: string;
  vinculado_en: string;
  timezone: string;
  avisos_activos: boolean;
}

// Zonas horarias frecuentes, en formato IANA. La del navegador se detecta
// sola y se agrega a la lista si no estuviera: esto es solo para elegir a
// mano cuando alguien viaja o su navegador miente.
const ZONAS: Array<{ value: string; label: string }> = [
  { value: "America/Santiago", label: "Chile (Santiago)" },
  { value: "America/Argentina/Buenos_Aires", label: "Argentina (Buenos Aires)" },
  { value: "America/Sao_Paulo", label: "Brasil (São Paulo)" },
  { value: "America/Montevideo", label: "Uruguay (Montevideo)" },
  { value: "America/Asuncion", label: "Paraguay (Asunción)" },
  { value: "America/La_Paz", label: "Bolivia (La Paz)" },
  { value: "America/Lima", label: "Perú (Lima)" },
  { value: "America/Bogota", label: "Colombia (Bogotá)" },
  { value: "America/Guayaquil", label: "Ecuador (Guayaquil)" },
  { value: "America/Caracas", label: "Venezuela (Caracas)" },
  { value: "America/Panama", label: "Panamá" },
  { value: "America/Costa_Rica", label: "Costa Rica" },
  { value: "America/Managua", label: "Nicaragua (Managua)" },
  { value: "America/Tegucigalpa", label: "Honduras (Tegucigalpa)" },
  { value: "America/El_Salvador", label: "El Salvador" },
  { value: "America/Guatemala", label: "Guatemala" },
  { value: "America/Mexico_City", label: "México (Ciudad de México)" },
  { value: "America/Tijuana", label: "México (Tijuana)" },
  { value: "America/Havana", label: "Cuba (La Habana)" },
  { value: "America/Santo_Domingo", label: "República Dominicana" },
  { value: "America/Puerto_Rico", label: "Puerto Rico" },
  { value: "America/New_York", label: "Estados Unidos (Nueva York)" },
  { value: "America/Chicago", label: "Estados Unidos (Chicago)" },
  { value: "America/Denver", label: "Estados Unidos (Denver)" },
  { value: "America/Los_Angeles", label: "Estados Unidos (Los Ángeles)" },
  { value: "America/Toronto", label: "Canadá (Toronto)" },
  { value: "America/Vancouver", label: "Canadá (Vancouver)" },
  { value: "Europe/Madrid", label: "España (Madrid)" },
];

/** La zona horaria de esta persona, según su propio navegador. */
function zonaDelNavegador(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** La hora que se ve ahora mismo en esa zona, para que la elección sea obvia. */
function horaEn(tz: string): string {
  try {
    return new Intl.DateTimeFormat([], { timeZone: tz, hour: "2-digit", minute: "2-digit" }).format(new Date());
  } catch {
    return "";
  }
}

function codigoAleatorio(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Las zonas de la lista, más la guardada y la del navegador si no estuvieran:
 *  nadie se queda sin poder elegir la suya. */
function opcionesZona(actual: string): Array<{ value: string; label: string }> {
  const lista = [...ZONAS];
  for (const tz of [actual, zonaDelNavegador()]) {
    if (tz && !lista.some((z) => z.value === tz)) lista.unshift({ value: tz, label: tz });
  }
  return lista;
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
      .select("telefono,vinculado_en,timezone,avisos_activos").maybeSingle();
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
      // La zona horaria viaja con el código: el bot la copia al vínculo y así
      // "hoy" y "ayer" son los de esta persona, viva donde viva.
      const { error } = await supabase.from("wa_codigos").insert({
        user_id: quien.user.id,
        codigo: nuevo,
        timezone: zonaDelNavegador(),
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

  async function cambiarZona(timezone: string) {
    if (!supabase || !vinculo) return;
    setVinculo({ ...vinculo, timezone });
    await supabase.from("wa_vinculos").update({ timezone }).neq("telefono", "");
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
          {/* Zona horaria: de esto dependen "hoy", "ayer" y las horas de silencio. */}
          <div className="field" style={{ marginBottom: 12 }}>
            <label>{tr("Tu zona horaria")}</label>
            <Selector
              value={vinculo.timezone}
              ariaLabel={tr("Tu zona horaria")}
              opciones={opcionesZona(vinculo.timezone)}
              onChange={(v) => void cambiarZona(v)}
            />
            <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 6 }}>
              {tr("Ahí son las")} {horaEn(vinculo.timezone)}. {tr("De esto dependen tu \"hoy\" y las horas en que el bot se queda callado.")}
            </p>
            {vinculo.timezone !== zonaDelNavegador() && (
              <button className="linklike" style={{ marginTop: 6 }} onClick={() => void cambiarZona(zonaDelNavegador())}>
                {tr("Usar la de este dispositivo")} ({zonaDelNavegador()})
              </button>
            )}
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
