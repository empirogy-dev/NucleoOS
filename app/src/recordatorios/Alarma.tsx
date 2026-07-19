import { useEffect, useState } from "react";
import { useIdioma } from "../idioma/IdiomaProvider";
import { hoyLocal } from "../lib/fechas";
import { listRecordatorios, type Recordatorio } from "./data";

// La alarma de la app: mientras NucleoOS esté abierta (en cualquier página),
// revisa cada medio minuto si un recordatorio llegó a su hora y entonces
// suena, notifica al navegador y muestra un aviso en pantalla. El bot de
// Telegram avisa por su lado: doble campana, que para el TDAH nunca sobra.

const LS_AVISADOS = "nucleoos-recordatorios-avisados";
const VENTANA_MIN = 30; // cuánto hacia atrás se considera "recién vencido"

function minutosDe(hhmm: string): number {
  const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : -1;
}

function avisadosHoy(): Set<string> {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_AVISADOS) ?? "{}") as { dia?: string; ids?: string[] };
    if (raw.dia !== hoyLocal()) return new Set();
    return new Set(raw.ids ?? []);
  } catch {
    return new Set();
  }
}

function marcarAvisado(id: string) {
  const ids = avisadosHoy();
  ids.add(id);
  localStorage.setItem(LS_AVISADOS, JSON.stringify({ dia: hoyLocal(), ids: [...ids] }));
}

/** Tres campanitas suaves, con el mismo espíritu de las rutinas guiadas. */
function sonar() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.35, 0.7].forEach((t, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = [880, 1108, 1318][i];
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.55);
    });
  } catch { /* sin audio no se cae nada */ }
}

export function Alarma() {
  const { t: tr } = useIdioma();
  const [sonando, setSonando] = useState<Recordatorio | null>(null);

  useEffect(() => {
    let vivo = true;

    async function revisar() {
      try {
        const lista = await listRecordatorios();
        const ahoraDate = new Date();
        const ahora = ahoraDate.getHours() * 60 + ahoraDate.getMinutes();
        const hoy = hoyLocal();
        const ya = avisadosHoy();
        for (const r of lista) {
          if (ya.has(r.id)) continue;
          if (r.repite === "unico" && r.fecha !== hoy) continue;
          const cuando = minutosDe(r.hora);
          if (cuando < 0 || ahora < cuando || ahora - cuando > VENTANA_MIN) continue;
          if (!vivo) return;
          marcarAvisado(r.id);
          sonar();
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("⏰ NucleoOS", { body: r.texto });
          }
          setSonando(r);
        }
      } catch { /* sin la 0052 o sin red, la app sigue tranquila */ }
    }

    void revisar();
    const id = setInterval(() => void revisar(), 30_000);
    return () => { vivo = false; clearInterval(id); };
  }, []);

  if (!sonando) return null;

  return (
    <div
      role="alert"
      style={{
        position: "fixed", left: "50%", bottom: 24, transform: "translateX(-50%)",
        zIndex: 200, maxWidth: "min(92vw, 420px)", width: "max-content",
        background: "var(--paper)", border: "1px solid var(--line)",
        borderLeft: "4px solid var(--accent)", borderRadius: "var(--r-md)",
        boxShadow: "0 10px 30px rgba(0,0,0,.18)", padding: "14px 16px",
        display: "flex", alignItems: "center", gap: 12,
      }}
    >
      <span style={{ fontSize: 22 }}>⏰</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <b style={{ fontSize: 14 }}>{sonando.texto}</b>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>{sonando.hora}{sonando.repite === "diario" ? ` · ${tr("cada día")}` : ""}</div>
      </div>
      <button className="btn primary" onClick={() => setSonando(null)}>{tr("Listo")}</button>
    </div>
  );
}
