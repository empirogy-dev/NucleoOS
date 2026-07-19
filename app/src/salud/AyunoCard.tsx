import { useEffect, useState } from "react";
import { useIdioma } from "../idioma/IdiomaProvider";
import { CampoFecha } from "../components/CampoFecha";
import { CampoHora } from "../components/CampoHora";
import { hoyLocal } from "../lib/fechas";
import { ultimoBocado, type Meal } from "./comidas";

// Contador de ayuno: horas desde tu última comida, con una meta que eliges.
// Se alimenta solo de tus platos registrados, sin que anotes nada extra.

const LS_META = "nucleoos-ayuno-meta";
const LS_MANUAL = "nucleoos-ayuno-manual";
const METAS = [12, 14, 16, 18];

function metaGuardada(): number {
  const v = Number(localStorage.getItem(LS_META));
  return METAS.includes(v) ? v : 16;
}

/** La marca manual guarda el inicio del ayuno Y cuándo la hiciste.
 *  El formato viejo (solo el ISO del inicio) se sigue leyendo. */
function manualGuardado(): { inicio: Date; marcadaEn: Date } | null {
  const raw = localStorage.getItem(LS_MANUAL);
  if (!raw) return null;
  try {
    const j = JSON.parse(raw) as { i?: string; en?: string };
    if (j && j.i) {
      const inicio = new Date(j.i);
      const marcadaEn = new Date(j.en ?? j.i);
      if (!isNaN(inicio.getTime())) return { inicio, marcadaEn: isNaN(marcadaEn.getTime()) ? inicio : marcadaEn };
    }
  } catch { /* formato viejo: un ISO pelado */ }
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : { inicio: d, marcadaEn: d };
}

function guardarManual(inicio: Date) {
  localStorage.setItem(LS_MANUAL, JSON.stringify({ i: inicio.toISOString(), en: new Date().toISOString() }));
}

/** La última comida real. La marca manual es una corrección explícita:
 *  si la hiciste DESPUÉS de registrar el último plato, tu palabra manda
 *  aunque apunte hacia atrás (el plato pudo quedar con la hora en que lo
 *  anotaste, no la real). Si luego comes algo nuevo, el plato vuelve a mandar. */
function ultimaComida(meals: Meal[]): Date | null {
  const delPlato = ultimoBocado(meals);
  const manual = manualGuardado();
  if (delPlato && manual) return manual.marcadaEn > delPlato ? manual.inicio : delPlato;
  return delPlato ?? manual?.inicio ?? null;
}

export function AyunoCard({ meals }: { meals: Meal[] }) {
  const { t: tr, idioma } = useIdioma();
  const [meta, setMeta] = useState(metaGuardada);
  const [ahora, setAhora] = useState(() => Date.now());
  const [editandoHora, setEditandoHora] = useState(false);
  const [fechaManual, setFechaManual] = useState(hoyLocal());
  const [horaManual, setHoraManual] = useState("");

  // Late un minuto: el contador avanza mientras la miras.
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  function marcarAhora() {
    guardarManual(new Date());
    setAhora(Date.now());
    setEditandoHora(false);
  }

  function guardarHoraManual() {
    if (!horaManual || !fechaManual) return;
    const d = new Date(`${fechaManual}T${horaManual}`);
    if (isNaN(d.getTime()) || d.getTime() > Date.now()) return;
    guardarManual(d);
    setAhora(Date.now());
    setEditandoHora(false);
    setHoraManual("");
  }

  const formularioManual = (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button type="button" className="btn primary" onClick={marcarAhora}>⏳ {tr("Empezar mi ayuno ahora")}</button>
        <button type="button" className="btn ghost" onClick={marcarAhora}>🍴 {tr("Acabo de comer")}</button>
        <button type="button" className="btn ghost" onClick={() => setEditandoHora(!editandoHora)}>{tr("Fue a otra hora")}</button>
      </div>
      <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
        {tr("Los dos botones hacen lo mismo por dentro: el ayuno siempre parte en tu último bocado. Si comes dentro de tu ventana, el contador se reinicia, así funciona el ayuno de verdad.")}
      </p>
      {editandoHora && (
        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: "1 1 150px" }}>
            <CampoFecha compacto value={fechaManual} onChange={setFechaManual}
              ariaLabel="Día de tu última comida" max={hoyLocal()} conBorrar={false} />
          </div>
          <div style={{ flex: "1 1 150px" }}>
            <CampoHora value={horaManual} onChange={setHoraManual} ariaLabel="Hora de tu última comida" />
          </div>
          <button type="button" className="btn primary" disabled={!horaManual} onClick={guardarHoraManual}>{tr("com.guardar")}</button>
        </div>
      )}
    </div>
  );

  const ultima = ultimaComida(meals);

  if (!ultima) {
    return (
      <div className="card panel">
        <h3>⏳ {tr("Ayuno")}</h3>
        <p style={{ fontSize: 13.5, color: "var(--muted)" }}>
          {tr("Registra un plato o marca a qué hora comiste por última vez, y aquí verás cuántas horas llevas en ayuno.")}
        </p>
        {formularioManual}
      </div>
    );
  }

  const ms = Math.max(0, ahora - ultima.getTime());
  const horas = ms / 3600000;
  const h = Math.floor(horas);
  const min = Math.floor((ms % 3600000) / 60000);
  const pct = Math.min(100, (horas / meta) * 100);
  const cumplida = horas >= meta;
  const hora = ultima.toLocaleTimeString(idioma === "en" ? "en-US" : idioma === "pt" ? "pt-BR" : "es-CL", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="card panel">
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <h3 style={{ flex: 1 }}>⏳ {tr("Ayuno")}</h3>
        {cumplida && <span className="chip">{tr("meta cumplida")}</span>}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "2px 0 8px" }}>
        <b className="tnum" style={{ fontSize: 30, letterSpacing: "-.02em" }}>{h}</b>
        <span style={{ color: "var(--muted)" }}>h</span>
        <b className="tnum" style={{ fontSize: 30, letterSpacing: "-.02em" }}>{min}</b>
        <span style={{ color: "var(--muted)" }}>min</span>
        <span style={{ marginLeft: "auto", fontSize: 12.5, color: "var(--muted)" }}>{tr("meta")} {meta} h</span>
      </div>

      <div className="track" style={{ height: 8 }}>
        <div className="fill" style={{ width: `${pct}%`, background: cumplida ? "var(--sal)" : "var(--info)" }} />
      </div>

      <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "10px 0 8px" }}>
        {cumplida
          ? `${tr("Completaste tu ventana de")} ${meta} ${tr("horas")}. ${tr("Come cuando tu cuerpo lo pida, sin apuro.")}`
          : `${tr("Tu última comida fue a las")} ${hora}. ${tr("Te faltan")} ${Math.max(0, meta - h)} h ${tr("para tu meta, si es que quieres llegar.")}`}
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11.5, color: "var(--muted)" }}>{tr("Tu ventana")}</span>
        <div style={{ display: "flex", gap: 6 }}>
          {METAS.map((m) => (
            <button key={m} type="button"
              className={"pomo-chip" + (meta === m ? " on" : "")}
              onClick={() => { setMeta(m); localStorage.setItem(LS_META, String(m)); }}>
              {m} h
            </button>
          ))}
        </div>
      </div>
      {formularioManual}
      <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
        {tr("El ayuno intermitente no le sirve a todo el mundo. Esto es una guía amable, no una regla. Si tienes dudas de salud, pregúntale a tu médico.")}
      </p>
    </div>
  );
}
