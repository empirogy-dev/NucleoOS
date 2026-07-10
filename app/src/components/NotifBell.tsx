import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { hoyLocal } from "../lib/fechas";
import { listReminders } from "../finanzas/data";
import { daysUntil, nextOccurrence } from "../finanzas/types";
import { listAppointments } from "../salud/data";
import { listRelLogs, listRelationships, daysToBirthday, needsReconnect } from "../relaciones/data";
import { listHabitLogs, listHabits } from "../habitos/data";

// Centro de notificaciones (bloque F): para una persona con ADHD los
// recordatorios son parte central. Todo lo urgente, visible en un lugar,
// mas un aviso del navegador una vez al día si lo permites.

interface Aviso {
  id: string;
  icon: string;
  texto: string;
  detalle: string;
  to: string;
  urgente: boolean;
}

export function NotifBell() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const cargar = useCallback(async () => {
    const hoy = hoyLocal();
    const lista: Aviso[] = [];
    const seguro = async (fn: () => Promise<void>) => { try { await fn(); } catch { /* área sin migrar */ } };

    await Promise.all([
      seguro(async () => {
        for (const r of await listReminders()) {
          const next = nextOccurrence(r);
          const d = daysUntil(next);
          if (d > 2) continue;
          lista.push({
            id: `pago-${r.id}`,
            icon: r.category === "creditCard" ? "💳" : r.category === "debt" ? "🏦" : "🔔",
            texto: r.title,
            detalle: d < 0 ? `vencido hace ${-d} día${d === -1 ? "" : "s"}` : d === 0 ? "vence hoy" : d === 1 ? "vence mañana" : `vence en ${d} días`,
            to: "/finanzas",
            urgente: d <= 0,
          });
        }
      }),
      seguro(async () => {
        for (const c of await listAppointments()) {
          const d = daysUntil(c.date);
          if (d < 0 || d > 1) continue;
          lista.push({
            id: `cita-${c.id}`,
            icon: "🩺",
            texto: c.title,
            detalle: d === 0 ? `hoy${c.time ? ` a las ${c.time.slice(0, 5)}` : ""}` : "mañana",
            to: "/salud",
            urgente: d === 0,
          });
        }
      }),
      seguro(async () => {
        const [rels, logs] = await Promise.all([listRelationships(), listRelLogs()]);
        for (const r of rels) {
          const cumple = daysToBirthday(r.birthday);
          if (cumple !== null && cumple <= 3) {
            lista.push({
              id: `cumple-${r.id}`,
              icon: "🎂",
              texto: `Cumpleaños de ${r.name}`,
              detalle: cumple === 0 ? "¡es hoy!" : cumple === 1 ? "mañana" : `en ${cumple} días`,
              to: "/relaciones",
              urgente: cumple === 0,
            });
          }
        }
        const reconectar = rels.filter((r) => needsReconnect(r, logs));
        if (reconectar.length > 0) {
          lista.push({
            id: "reconectar",
            icon: "💌",
            texto: reconectar.length === 1 ? `Tiempo de reconectar con ${reconectar[0].name}` : `${reconectar.length} vínculos esperan noticias tuyas`,
            detalle: "un mensaje corto basta",
            to: "/relaciones",
            urgente: false,
          });
        }
      }),
      seguro(async () => {
        const [habits, logs] = await Promise.all([listHabits(), listHabitLogs()]);
        const hechos = new Set(logs.filter((l) => l.date === hoy).map((l) => l.habit_id));
        const pendientes = habits.filter((h) => !hechos.has(h.id));
        if (habits.length > 0 && pendientes.length > 0) {
          lista.push({
            id: "habitos",
            icon: "🔄",
            texto: pendientes.length === 1 ? `Te falta marcar ${pendientes[0].name}` : `Te faltan ${pendientes.length} hábitos de hoy`,
            detalle: "un toque y quedan en la racha",
            to: "/habitos",
            urgente: false,
          });
        }
      }),
    ]);

    lista.sort((a, b) => Number(b.urgente) - Number(a.urgente));
    setAvisos(lista);

    // Aviso del navegador, una vez al día, solo con lo urgente.
    const urgentes = lista.filter((a) => a.urgente);
    const marca = localStorage.getItem("nucleoos-aviso-dia");
    if (urgentes.length > 0 && marca !== hoy && "Notification" in window && Notification.permission === "granted") {
      new Notification("NucleoOS", {
        body: urgentes.slice(0, 3).map((a) => `${a.icon} ${a.texto}, ${a.detalle}`).join("\n"),
      });
      localStorage.setItem("nucleoos-aviso-dia", hoy);
    }
  }, []);

  useEffect(() => {
    void cargar();
    const id = setInterval(() => void cargar(), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [cargar]);

  useEffect(() => {
    function fuera(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, []);

  const urgentes = avisos.filter((a) => a.urgente).length;

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button className="iconbtn" aria-label={`Notificaciones${avisos.length ? `, ${avisos.length} pendientes` : ""}`} onClick={() => setOpen(!open)}>
        <Bell size={18} />
        {avisos.length > 0 && (
          <span className={"notif-badge" + (urgentes > 0 ? " urgente" : "")}>{avisos.length}</span>
        )}
      </button>
      {open && (
        <div className="notif-pop">
          <div style={{ fontSize: 13, fontWeight: 600, padding: "4px 6px 10px" }}>Notificaciones</div>
          {avisos.length === 0 && (
            <p style={{ fontSize: 12.5, color: "var(--muted)", padding: "0 6px 8px" }}>
              Todo al día. Nada urgente por ahora. 🌿
            </p>
          )}
          {avisos.map((a) => (
            <Link key={a.id} to={a.to} className="notif-item" onClick={() => setOpen(false)}>
              <span style={{ fontSize: 16 }}>{a.icon}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <b style={{ display: "block", fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.texto}</b>
                <small style={{ fontSize: 11, color: a.urgente ? "var(--err)" : "var(--muted)" }}>{a.detalle}</small>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
