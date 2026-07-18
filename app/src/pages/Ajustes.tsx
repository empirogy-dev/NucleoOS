import { useEffect, useState } from "react";
import { Palette, Settings } from "lucide-react";
import { CURRENCIES, useSettings } from "../settings/SettingsProvider";
import { useAuth } from "../auth/AuthProvider";
import { ThemePicker } from "../components/ThemePicker";
import { PALETTES } from "../theme/palettes";
import { useTheme } from "../theme/ThemeProvider";
import { fechaLarga, useFechaActiva } from "../fecha/FechaActiva";
import { diasAtrasLocal, hoyLocal } from "../lib/fechas";

const CURRENCY_NAMES: Record<string, string> = {
  CAD: "Dólar canadiense",
  CLP: "Peso chileno",
  USD: "Dólar estadounidense",
  EUR: "Euro",
  MXN: "Peso mexicano",
  COP: "Peso colombiano",
};

export function Ajustes() {
  const { currency, setCurrency, profileTableMissing } = useSettings();
  const { session } = useAuth();
  const { palette } = useTheme();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const paletteName = PALETTES.find((p) => p.key === palette)?.name ?? palette;

  async function onCurrency(c: string) {
    await setCurrency(c);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="page">
      <div className="page-head">
        <div className="eyebrow"><Settings size={13} /> Ajustes</div>
        <h1>Ajustes</h1>
        <p>Tu espacio, a tu manera.</p>
      </div>

      {profileTableMissing && (
        <div className="card pad" style={{ borderLeft: "3px solid var(--warn)", marginBottom: 14, maxWidth: 640 }}>
          <b style={{ fontSize: 14 }}>Falta la migración 0002</b>
          <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 4 }}>
            Para que tus ajustes se guarden en la nube (y no solo en este navegador), corre
            <code> supabase/migrations/0002_perfil.sql</code> en el SQL Editor de Supabase, igual que la anterior.
            Mientras tanto, tu moneda se guarda localmente.
          </p>
        </div>
      )}

      <div className="grid" style={{ maxWidth: 640 }}>
        <NameCard />
        <CumpleCard />
        <DiaPasadoCard />
        <div className="card pad">
          <h3 style={{ fontSize: 15, marginBottom: 4 }}>Moneda predeterminada</h3>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
            Se usa en los totales y como moneda inicial de tus cuentas nuevas.
          </p>
          <div className="field" style={{ maxWidth: 320 }}>
            <select value={currency} onChange={(e) => void onCurrency(e.target.value)}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{CURRENCY_NAMES[c]} ({c})</option>
              ))}
            </select>
          </div>
          {saved && <span className="chip" style={{ marginTop: 4 }}>✓ Guardado</span>}
        </div>

        <div className="card pad">
          <h3 style={{ fontSize: 15, marginBottom: 4 }}>Tema</h3>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
            Tema actual: <b style={{ color: "var(--ink)" }}>{paletteName}</b>
          </p>
          <button className="btn ghost" onClick={() => setPickerOpen(true)}>
            <Palette size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />
            Cambiar tema
          </button>
        </div>

        <div className="card pad">
          <h3 style={{ fontSize: 15, marginBottom: 4 }}>Avisos del navegador</h3>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
            Una vez al día, si hay algo urgente (un pago que vence, una cita), el navegador te avisa aunque tengas otra pestaña abierta.
          </p>
          <NotifPermiso />
        </div>

        <div className="card pad">
          <h3 style={{ fontSize: 15, marginBottom: 4 }}>Conexiones</h3>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>
            <b style={{ color: "var(--ink)" }}>Notion</b>: llegará como integración directa cuando la app tenga su capa de servidor (Fase 4),
            para exportar reportes, journaling y notas a tu espacio.
          </p>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>
            Mientras tanto, en <b style={{ color: "var(--ink)" }}>Revisión</b> puedes copiar cualquier reporte semanal o mensual
            como Markdown y pegarlo en Notion tal cual.
          </p>
        </div>

        <div className="card pad">
          <h3 style={{ fontSize: 15, marginBottom: 4 }}>Cuenta</h3>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>
            Sesión iniciada como <b style={{ color: "var(--ink)" }}>{session?.user?.email}</b>
          </p>
        </div>
      </div>

      {pickerOpen && <ThemePicker onClose={() => setPickerOpen(false)} />}
    </div>
  );
}

function NameCard() {
  const { displayName, updateProfile } = useSettings();
  const [value, setValue] = useState(displayName);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => setValue(displayName), [displayName]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const res = await updateProfile({ display_name: value.trim() });
    if (res) setErr(res);
    else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="card pad">
      <h3 style={{ fontSize: 15, marginBottom: 4 }}>Tu nombre</h3>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>Cómo quieres que te salude la app.</p>
      <form onSubmit={save} style={{ display: "flex", gap: 8, maxWidth: 380 }}>
        <input className="input-inline" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Bárbara" />
        <button className="btn primary" type="submit">Guardar</button>
      </form>
      {saved && <span className="chip" style={{ marginTop: 8 }}>✓ Guardado</span>}
      {err && <p style={{ fontSize: 12.5, color: "var(--err)", marginTop: 8 }}>{err}</p>}
    </div>
  );
}

function DiaPasadoCard() {
  const { fecha, esHoy, setFecha, volverAHoy } = useFechaActiva();
  const hoy = hoyLocal();
  const min = diasAtrasLocal(13);

  return (
    <div className="card pad">
      <h3 style={{ fontSize: 15, marginBottom: 4 }}>🕰 Registrar un día pasado</h3>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
        ¿Desapareciste unos días pero igual entrenaste, tomaste agua o marcaste hábitos? Elige el día y toda la app registra ahí: Energía, Hábitos, Movimiento, Mente, Tareas y más. Un aviso te acompaña hasta que vuelvas a hoy.
      </p>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <input type="date" className="input-inline" style={{ width: 160, flex: "none" }}
          value={fecha} min={min} max={hoy}
          onChange={(e) => { if (e.target.value) setFecha(e.target.value); }}
          aria-label="Día que quieres registrar" />
        {!esHoy && (
          <button className="btn ghost" onClick={volverAHoy}>Volver a hoy</button>
        )}
        {!esHoy && <span className="chip">registrando el {fechaLarga(fecha)}</span>}
      </div>
      <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 8 }}>
        Hasta dos semanas atrás. Lo registrado suma a tus metas igual que si lo hubieras anotado ese día.
      </p>
    </div>
  );
}

function CumpleCard() {
  const { birthday, updateProfile } = useSettings();
  const [value, setValue] = useState(birthday);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => setValue(birthday), [birthday]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const res = await updateProfile({ birthday: value || null });
    if (res) setErr(res);
    else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="card pad">
      <h3 style={{ fontSize: 15, marginBottom: 4 }}>Tu cumpleaños 🎂</h3>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
        Amor propio: la app también te celebra a ti. El día de tu cumpleaños, el Inicio se pone de fiesta.
      </p>
      <form onSubmit={save} style={{ display: "flex", gap: 8, maxWidth: 380 }}>
        <input className="input-inline" type="date" value={value} onChange={(e) => setValue(e.target.value)} aria-label="Tu fecha de cumpleaños" />
        <button className="btn primary" type="submit">Guardar</button>
      </form>
      {saved && <span className="chip" style={{ marginTop: 8 }}>✓ Guardado</span>}
      {err && <p style={{ fontSize: 12.5, color: "var(--err)", marginTop: 8 }}>{err}</p>}
    </div>
  );
}

function NotifPermiso() {
  const soporta = "Notification" in window;
  const [estado, setEstado] = useState(soporta ? Notification.permission : "unsupported");

  if (!soporta) return <p style={{ fontSize: 12.5, color: "var(--muted)" }}>Este navegador no soporta avisos.</p>;
  if (estado === "granted") return <span className="chip">✓ Avisos activados</span>;
  if (estado === "denied") return <p style={{ fontSize: 12.5, color: "var(--muted)" }}>Los bloqueaste en el navegador. Puedes reactivarlos desde el candado de la barra de direcciones.</p>;
  return (
    <button className="btn ghost" onClick={async () => setEstado(await Notification.requestPermission())}>
      Activar avisos
    </button>
  );
}
