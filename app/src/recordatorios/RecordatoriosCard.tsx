import { useCallback, useEffect, useState } from "react";
import { CampoHora } from "../components/CampoHora";
import { useIdioma } from "../idioma/IdiomaProvider";
import { hoyLocal } from "../lib/fechas";
import { addRecordatorio, apagarRecordatorio, listRecordatorios, RecordatoriosFaltanError, type Recordatorio } from "./data";

// La tarjeta de recordatorios del Inicio: los mismos que maneja el bot de
// Telegram. Aquí se crean, se ven y se apagan; a su hora suenan en la app
// Y te los escribe el bot.

export function RecordatoriosCard() {
  const { t: tr } = useIdioma();
  const [lista, setLista] = useState<Recordatorio[]>([]);
  const [faltaMigracion, setFaltaMigracion] = useState(false);
  const [texto, setTexto] = useState("");
  const [hora, setHora] = useState("");
  const [diario, setDiario] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setLista(await listRecordatorios());
      setFaltaMigracion(false);
    } catch (e) {
      if (e instanceof RecordatoriosFaltanError) setFaltaMigracion(true);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim() || !hora) return;
    setBusy(true);
    setErr(null);
    try {
      await addRecordatorio(texto.trim(), hora, diario ? "diario" : "unico", hoyLocal());
      setTexto("");
      setHora("");
      await reload();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : String(e2));
    } finally {
      setBusy(false);
    }
  }

  if (faltaMigracion) {
    return (
      <div className="card panel">
        <h3>⏰ {tr("Recordatorios")}</h3>
        <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>
          {tr("Para las alarmas, corre")} <code>supabase/migrations/0052_recordatorios.sql</code> {tr("en el SQL Editor de Supabase.")}
        </p>
      </div>
    );
  }

  return (
    <div className="card panel">
      <h3>⏰ {tr("Recordatorios")}</h3>
      <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 10 }}>
        {tr("A su hora suenan aquí en la app y también te los escribe el bot de Telegram.")}
      </p>

      {lista.length === 0 && (
        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 10 }}>
          {tr("Sin recordatorios todavía. \"Tomar mis suplementos a las 14:00\" y tu cabeza queda libre.")}
        </p>
      )}
      {lista.map((r) => (
        <div className="txrow" key={r.id}>
          <span className="txicon tnum" style={{ fontSize: 12.5 }}>{r.hora}</span>
          <div className="txmeta">
            <b>{r.texto}</b>
            <small>{r.repite === "diario" ? tr("cada día") : tr("solo hoy")}</small>
          </div>
          <button className="xdel" aria-label={tr("Apagar recordatorio")}
            onClick={async () => { await apagarRecordatorio(r.id); void reload(); }}>
            ✕
          </button>
        </div>
      ))}

      <form onSubmit={crear} style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input className="input-inline" style={{ flex: "1 1 150px", minWidth: 140 }}
          value={texto} onChange={(e) => setTexto(e.target.value)}
          placeholder={tr("Tomar mis suplementos…")} />
        <div style={{ flex: "none" }}>
          <CampoHora value={hora} onChange={setHora} ariaLabel={tr("Hora del recordatorio")} />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, cursor: "pointer" }}>
          <input type="checkbox" checked={diario} onChange={(e) => setDiario(e.target.checked)} />
          {tr("cada día")}
        </label>
        <button className="btn ghost" disabled={busy || !texto.trim() || !hora}>{tr("Crear")}</button>
      </form>
      {err && <p style={{ fontSize: 12.5, color: "var(--err)", marginTop: 8 }}>{err}</p>}
    </div>
  );
}
