import { useEffect, useState } from "react";
import { useIdioma } from "../idioma/IdiomaProvider";
import { useSettings } from "../settings/SettingsProvider";
import { useModulos } from "../modulos/ModulosProvider";
import { MODOS_INICIO, ocultosDeModo } from "../modulos/modulos";

// La bienvenida de la primera entrada: tu nombre y qué quieres ordenar
// primero. Dos pantallas y adentro, porque un cerebro TDAH no quiere un
// tour de doce pasos: quiere empezar. Todo lo elegido se cambia después
// en Ajustes, nada es para siempre.

const LS_KEY = "nucleoos-onboarding";
const LS_MODO_PENDIENTE = "nucleoos-modo-pendiente";

export function Onboarding() {
  const { t: tr } = useIdioma();
  const { displayName, updateProfile } = useSettings();
  const { reemplazar } = useModulos();

  const [visible, setVisible] = useState(() => !localStorage.getItem(LS_KEY));
  const [paso, setPaso] = useState<1 | 2>(1);
  const [nombre, setNombre] = useState("");
  const [tocado, setTocado] = useState(false);
  // Si vienes de la landing de finanzas (?modo=finanzas), ese modo parte elegido.
  const [modo, setModo] = useState(() => localStorage.getItem(LS_MODO_PENDIENTE) ?? "todo");
  const [busy, setBusy] = useState(false);

  // Cuenta antigua: si el perfil ya tiene nombre y la persona aún no tocó
  // nada, la bienvenida no corresponde. Se marca hecha y no vuelve.
  useEffect(() => {
    if (visible && displayName && !tocado) {
      localStorage.setItem(LS_KEY, "hecho");
      setVisible(false);
    }
  }, [displayName, visible, tocado]);

  if (!visible) return null;

  async function terminar() {
    setBusy(true);
    try {
      if (nombre.trim()) await updateProfile({ display_name: nombre.trim() });
      const elegido = MODOS_INICIO.find((m) => m.key === modo) ?? MODOS_INICIO[0];
      reemplazar(ocultosDeModo(elegido));
      localStorage.setItem(LS_KEY, "hecho");
      localStorage.removeItem(LS_MODO_PENDIENTE);
    } catch {
      /* sin red, la bienvenida no bloquea: el nombre se puede poner en Ajustes */
    } finally {
      setVisible(false);
    }
  }

  return (
    <div className="tp-overlay" style={{ zIndex: 90 }}>
      <div className="tp" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        {paso === 1 && (
          <>
            <h3 style={{ marginBottom: 6 }}>{tr("Hola, bienvenida a NucleoOS 🌱")}</h3>
            <p style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.55, marginBottom: 14 }}>
              {tr("Este es tu lugar para ordenar la vida sin pelear con tu cabeza. Primero lo primero: ¿cómo te llamamos?")}
            </p>
            <div className="field"><label>{tr("Tu nombre")}</label>
              <input value={nombre} autoFocus maxLength={40}
                onChange={(e) => { setNombre(e.target.value); setTocado(true); }}
                onKeyDown={(e) => { if (e.key === "Enter" && nombre.trim()) setPaso(2); }}
                placeholder={tr("Como te gusta que te digan")} /></div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <button className="btn primary" disabled={!nombre.trim()} onClick={() => { setTocado(true); setPaso(2); }}>
                {tr("Seguir")}
              </button>
            </div>
          </>
        )}
        {paso === 2 && (
          <>
            <h3 style={{ marginBottom: 6 }}>{tr("¿Qué quieres ordenar primero?")}</h3>
            <p style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.55, marginBottom: 14 }}>
              {tr("El menú muestra solo lo que elijas, para que nada te grite. El resto se enciende cuando tú quieras, en Ajustes → Módulos.")}
            </p>
            <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
              {MODOS_INICIO.map((m) => (
                <button key={m.key} type="button" className="card"
                  onClick={() => { setModo(m.key); setTocado(true); }}
                  style={{
                    display: "flex", gap: 12, alignItems: "center", padding: "12px 14px",
                    textAlign: "left", cursor: "pointer", font: "inherit", color: "inherit",
                    border: modo === m.key ? "2px solid var(--accent)" : "1px solid var(--line)",
                  }}>
                  <span style={{ fontSize: 22 }}>{m.emoji}</span>
                  <span style={{ flex: 1 }}>
                    <b style={{ display: "block", fontSize: 14 }}>{tr(m.tkey)}</b>
                    <small style={{ color: "var(--muted)", fontSize: 12 }}>{tr(m.dkey)}</small>
                  </span>
                  {modo === m.key && <span style={{ color: "var(--accent-ink)", fontWeight: 700 }}>✓</span>}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button className="btn ghost" onClick={() => setPaso(1)}>{tr("Volver")}</button>
              <button className="btn primary" disabled={busy} onClick={() => void terminar()}>
                {busy ? tr("com.guardando") : tr("Empezar")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
