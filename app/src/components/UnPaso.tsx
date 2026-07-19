import { useState } from "react";
import { useIdioma } from "../idioma/IdiomaProvider";
import { celebrar } from "../lib/celebrar";
import { hoyLocal } from "../lib/fechas";
import { listDayTasks, toggleDayTask, type DayTask } from "../tareas/data";
import { listHabitLogs, listHabits, toggleHabit, type Habit } from "../habitos/data";
import { abrirPomodoro } from "../foco/data";

// ¿Qué hago ahora?: contra la parálisis de decisión. La app elige por ti
// UNA sola cosa pequeña y te la muestra sola, sin listas alrededor.
// La haces, pides otra, o le pones un bloque de foco encima.

type Paso =
  | { tipo: "tarea"; texto: string; tarea: DayTask }
  | { tipo: "habito"; texto: string; habito: Habit }
  | { tipo: "micro"; texto: string };

const MICROS = [
  "Toma un vaso de agua, ahora mismo.",
  "Párate y estira los brazos 30 segundos.",
  "Tres respiraciones lentas, con los ojos cerrados.",
  "Abre la ventana y mira algo lejano un momento.",
  "Ordena UNA sola cosa que tengas a la vista.",
];

export function UnPaso() {
  const { t: tr } = useIdioma();

  const [paso, setPaso] = useState<Paso | null>(null);
  const [cargando, setCargando] = useState(false);
  const [hecha, setHecha] = useState(false);
  const [vistos, setVistos] = useState<string[]>([]);

  async function elegir(evitar: string[] = vistos) {
    setCargando(true);
    setHecha(false);
    const candidatos: Paso[] = [];
    const hoy = hoyLocal();
    try {
      const tareas = (await listDayTasks()).filter((t) => !t.done && t.date <= hoy);
      for (const t of tareas) candidatos.push({ tipo: "tarea", texto: t.title, tarea: t });
    } catch { /* sin 0033, seguimos con lo demás */ }
    try {
      const [habs, logs] = await Promise.all([listHabits(), listHabitLogs()]);
      const hechosHoy = new Set(logs.filter((l) => l.date === hoy).map((l) => l.habit_id));
      for (const h of habs.filter((x) => !hechosHoy.has(x.id))) {
        candidatos.push({ tipo: "habito", texto: `${h.icon ?? "✓"} ${h.name}`, habito: h });
      }
    } catch { /* sin hábitos, seguimos */ }
    for (const m of MICROS) candidatos.push({ tipo: "micro", texto: m });

    // Evitamos repetir lo recién mostrado, y si ya se vio todo, se reinicia.
    let pool = candidatos.filter((c) => !evitar.includes(c.texto));
    if (pool.length === 0) {
      pool = candidatos;
      setVistos([]);
    }
    const elegido = pool[Math.floor(Math.random() * pool.length)];
    setPaso(elegido);
    setVistos((v) => [...v.slice(-8), elegido.texto]);
    setCargando(false);
  }

  async function marcarHecha() {
    if (!paso) return;
    try {
      if (paso.tipo === "tarea") await toggleDayTask(paso.tarea.id, true);
      if (paso.tipo === "habito") await toggleHabit(paso.habito.id, hoyLocal(), true);
    } catch { /* si no se pudo marcar, el logro igual fue tuyo */ }
    setHecha(true);
    celebrar("chica");
  }

  return (
    <div className="card panel" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: paso ? 10 : 0 }}>
        <span style={{ fontSize: 20 }}>👉</span>
        <h3 style={{ margin: 0, flex: 1 }}>{tr("i.unpaso")}</h3>
        {!paso && (
          <button className="btn primary" disabled={cargando} onClick={() => void elegir()}>
            {cargando ? tr("i.unpaso.eligiendo") : tr("i.unpaso.btn")}
          </button>
        )}
      </div>

      {paso && (
        <>
          <p style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.4, margin: "2px 0 12px" }}>
            {hecha ? "Hecho. Eso ya cuenta. 🌱" : paso.texto}
          </p>
          {!hecha ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn primary" onClick={() => void marcarHecha()}>La hice ✓</button>
              <button className="btn ghost" onClick={() => void elegir()}>Otra cosa</button>
              {paso.tipo !== "micro" && (
                <button className="btn ghost" onClick={() => abrirPomodoro()}>Dale un bloque de foco</button>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn primary" onClick={() => void elegir()}>¿Y ahora qué?</button>
              <button className="btn ghost" onClick={() => { setPaso(null); setHecha(false); }}>Cerrar</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
