import { useEffect, useState } from "react";
import { useIdioma } from "../idioma/IdiomaProvider";
import { CURRENCIES, useSettings } from "../settings/SettingsProvider";
import { useModulos } from "../modulos/ModulosProvider";
import { MODOS_INICIO, ocultosDeModo, type ModoInicio } from "../modulos/modulos";
import { Selector } from "../components/Selector";

// La bienvenida de la primera entrada: quién eres, qué quieres ordenar
// primero, y en qué moneda. Cuatro pantallas cortas y adentro, porque un
// cerebro TDAH y TDA no quiere un tour de doce pasos: quiere empezar. Todo
// lo elegido se cambia después en Ajustes, nada es para siempre.

const LS_KEY = "nucleoos-onboarding";
const LS_MODO_PENDIENTE = "nucleoos-modo-pendiente";

/** Por dónde empezar según lo que eligió: dos o tres cosas concretas, no un
 *  manual. La primera lleva el peso, las otras son el camino. */
const PRIMEROS_PASOS: Record<string, string[]> = {
  todo: ["paso.todo.1", "paso.todo.2", "paso.todo.3"],
  finanzas: ["paso.fin.1", "paso.fin.2", "paso.fin.3"],
  cuerpo: ["paso.cuerpo.1", "paso.cuerpo.2", "paso.cuerpo.3"],
  mente: ["paso.mente.1", "paso.mente.2", "paso.mente.3"],
};

export function Onboarding() {
  const { t: tr } = useIdioma();
  const { displayName, updateProfile, setCurrency } = useSettings();
  const { reemplazar } = useModulos();

  const [visible, setVisible] = useState(() => !localStorage.getItem(LS_KEY));
  const [paso, setPaso] = useState<1 | 2 | 3 | 4>(1);
  const [nombre, setNombre] = useState("");
  const [tocado, setTocado] = useState(false);
  // Si vienes de la landing de finanzas (?modo=finanzas), ese modo parte elegido.
  const [modo, setModo] = useState(() => localStorage.getItem(LS_MODO_PENDIENTE) ?? "todo");
  const [moneda, setMoneda] = useState("CAD");
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

  const elegido: ModoInicio = MODOS_INICIO.find((m) => m.key === modo) ?? MODOS_INICIO[0];
  // La moneda solo se pregunta a quien va a ver Finanzas: al resto le sobra.
  const conFinanzas = !elegido.visibles || elegido.visibles.includes("/finanzas");

  async function guardarYSeguir() {
    setBusy(true);
    try {
      if (nombre.trim()) await updateProfile({ display_name: nombre.trim() });
      if (conFinanzas) await setCurrency(moneda);
      reemplazar(ocultosDeModo(elegido));
      // La zona horaria del navegador: la usan el coach y el corte del día.
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz) localStorage.setItem("nucleoos-timezone", tz);
      } catch { /* sin zona: se usa la del sistema */ }
      localStorage.setItem(LS_KEY, "hecho");
      localStorage.removeItem(LS_MODO_PENDIENTE);
    } catch {
      /* sin red, la bienvenida no bloquea: todo se puede poner en Ajustes */
    } finally {
      setBusy(false);
      setPaso(4);
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
              <button className="btn primary" onClick={() => (conFinanzas ? setPaso(3) : void guardarYSeguir())}>
                {tr("Seguir")}
              </button>
            </div>
          </>
        )}

        {paso === 3 && (
          <>
            <h3 style={{ marginBottom: 6 }}>{tr("¿En qué moneda manejas tu plata?")}</h3>
            <p style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.55, marginBottom: 14 }}>
              {tr("Es tu moneda principal. Si tienes cuentas en otro país, cada una lleva la suya y NucleoOS nunca las mezcla.")}
            </p>
            <div className="field"><label>{tr("Moneda")}</label>
              <Selector value={moneda} ariaLabel={tr("Moneda")} onChange={setMoneda}
                opciones={CURRENCIES.map((c) => ({ value: c, label: c }))} /></div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
              <button className="btn ghost" onClick={() => setPaso(2)}>{tr("Volver")}</button>
              <button className="btn primary" disabled={busy} onClick={() => void guardarYSeguir()}>
                {busy ? tr("com.guardando") : tr("Seguir")}
              </button>
            </div>
          </>
        )}

        {paso === 4 && (
          <>
            <h3 style={{ marginBottom: 6 }}>
              {nombre.trim() ? `${tr("Todo listo")}, ${nombre.trim()} 🌱` : `${tr("Todo listo")} 🌱`}
            </h3>
            <p style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.55, marginBottom: 12 }}>
              {tr("No tienes que llenar nada de golpe. Con empezar por una cosa basta:")}
            </p>
            <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
              {(PRIMEROS_PASOS[modo] ?? PRIMEROS_PASOS.todo).map((k, i) => (
                <div key={k} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: "50%", flex: "none",
                    background: i === 0 ? "var(--accent)" : "var(--accent-wash)",
                    color: i === 0 ? "#fff" : "var(--accent-ink)",
                    display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700,
                  }}>{i + 1}</span>
                  <span style={{ fontSize: 13.5, color: i === 0 ? "var(--ink)" : "var(--ink-soft)", lineHeight: 1.5 }}>
                    {tr(k)}
                  </span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 14 }}>
              {tr("Todo lo que elegiste ahora se cambia cuando quieras en Ajustes.")}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="btn primary" onClick={() => setVisible(false)}>{tr("Entrar")}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
