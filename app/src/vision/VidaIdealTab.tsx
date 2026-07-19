import { useCallback, useEffect, useRef, useState } from "react";
import { useIdioma } from "../idioma/IdiomaProvider";
import { TablesMissingError } from "../finanzas/data";
import { SECCIONES_VIDA, getIdealLife, saveIdealSection } from "./suenos";

// Vida ideal: bloques guiados para describir cómo quieres vivir.
// Se guardan solos al salir de cada bloque.

export function VidaIdealTab() {
  const { t: tr } = useIdioma();
  const [contenido, setContenido] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardada, setGuardada] = useState<string | null>(null);
  const cajas = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setContenido(await getIdealLife());
      setNeedsMigration(false);
    } catch (e) {
      if (e instanceof TablesMissingError) setNeedsMigration(true);
      else setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function guardar(section: string, texto: string) {
    if ((contenido[section] ?? "") === texto) {
      // Sin cambios: igual confirmamos, para que el botón siempre responda.
      setGuardada(section);
      setTimeout(() => setGuardada(null), 1800);
      return;
    }
    setContenido((c) => ({ ...c, [section]: texto }));
    try {
      await saveIdealSection(section, texto);
      setGuardada(section);
      setTimeout(() => setGuardada(null), 1800);
    } catch (e) {
      if (e instanceof TablesMissingError) setNeedsMigration(true);
      else setError(e instanceof Error ? e.message : String(e));
    }
  }

  if (needsMigration) {
    return (
      <div className="card pad" style={{ maxWidth: 640 }}>
        <h3 style={{ marginBottom: 10 }}>Un paso pendiente en Supabase</h3>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 12 }}>
          Falta la tabla de vida ideal. Es una sola vez: abre el SQL Editor de Supabase, pega el contenido de
          <code> supabase/migrations/0019_suenos_vida_ideal.sql</code> y presiona Run.
        </p>
        <button className="btn primary" onClick={() => void reload()}>Ya lo hice, reintentar</button>
      </div>
    );
  }

  if (loading) return <p style={{ color: "var(--muted)" }}>{tr("cargando")}</p>;

  return (
    <>
      {error && <div className="card pad" style={{ borderLeft: "3px solid var(--err)", marginBottom: 14 }}>{error}</div>}
      <p style={{ fontSize: 13.5, color: "var(--ink-soft)", maxWidth: "62ch", marginBottom: 16 }}>
        {tr("Escribe en presente, como si ya vivieras así. No hay respuestas correctas y puedes volver a editarlo cuando quieras: tu vida ideal también evoluciona.")}
      </p>
      <div className="ideal-grid">
        {SECCIONES_VIDA.map((s) => (
          <div className="card panel" key={s.key}>
            <h3 style={{ marginBottom: 4 }}>{s.emoji} {tr(s.titulo)}</h3>
            <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 10 }}>{tr(s.pregunta)}</p>
            <textarea
              className="vision-edit"
              rows={4}
              ref={(el) => { cajas.current[s.key] = el; }}
              defaultValue={contenido[s.key] ?? ""}
              placeholder={tr("Escríbelo con calma…")}
              onBlur={(e) => void guardar(s.key, e.target.value)}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <button className="btn ghost" onClick={() => void guardar(s.key, cajas.current[s.key]?.value ?? "")}>
                {tr("com.guardar")}
              </button>
              {guardada === s.key && <span className="chip">✓ {tr("Guardado")}</span>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
