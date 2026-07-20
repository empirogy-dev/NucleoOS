import { useEffect, useState } from "react";
import { CampoFecha } from "../components/CampoFecha";
import { Palette, Settings } from "lucide-react";
import { CURRENCIES, useSettings } from "../settings/SettingsProvider";
import { useAuth } from "../auth/AuthProvider";
import { ThemePicker } from "../components/ThemePicker";
import { PALETTES } from "../theme/palettes";
import { useTheme } from "../theme/ThemeProvider";
import { fechaLarga, useFechaActiva } from "../fecha/FechaActiva";
import { diasAtrasLocal, hoyLocal } from "../lib/fechas";
import { Selector } from "../components/Selector";
import { useIdioma } from "../idioma/IdiomaProvider";
import { IDIOMAS, type Idioma } from "../idioma/textos";
import { WhatsAppCard } from "../whatsapp/WhatsAppCard";
import { useModulos } from "../modulos/ModulosProvider";
import { GRUPOS_MODULOS } from "../modulos/modulos";
import { Toggle } from "../components/Toggle";

const CURRENCY_NAMES: Record<string, string> = {
  CAD: "Dólar canadiense",
  CLP: "Peso chileno",
  USD: "Dólar estadounidense",
  EUR: "Euro",
  MXN: "Peso mexicano",
  COP: "Peso colombiano",
};

export function Ajustes() {
  const { t: tr } = useIdioma();
  const { profileTableMissing } = useSettings();

  return (
    <div className="page">
      <div className="page-head">
        <div className="eyebrow"><Settings size={13} /> {tr("nav.ajustes")}</div>
        <h1>{tr("nav.ajustes")}</h1>
        <p>{tr("head.sub.ajustes")}</p>
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

      {/* El orden cuenta una historia: primero quién eres, después cómo
          trabaja la app contigo, luego por dónde te habla, y al final tu
          cuenta. */}
      <div className="grid" style={{ maxWidth: 640 }}>
        <NameCard />
        <CumpleCard />
        <MonedaCard />
        <IdiomaCard />
        <ModulosCard />
        <DiaPasadoCard />
        <WhatsAppCard />
        <TemaCard />
        <AvisosNavegadorCard />
        <ConexionesCard />
        <CuentaCard />
      </div>
    </div>
  );
}

function MonedaCard() {
  const { t: tr } = useIdioma();
  const { currency, setCurrency } = useSettings();
  const [saved, setSaved] = useState(false);

  async function onCurrency(c: string) {
    await setCurrency(c);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="card pad">
      <h3 style={{ fontSize: 15, marginBottom: 4 }}>{tr("Moneda predeterminada")}</h3>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
        {tr("Se usa en los totales y como moneda inicial de tus cuentas nuevas.")}
      </p>
      <div className="field" style={{ maxWidth: 320 }}>
        <Selector value={currency} ariaLabel="Moneda predeterminada"
          opciones={CURRENCIES.map((c) => ({ value: c, label: `${tr(CURRENCY_NAMES[c])} (${c})` }))}
          onChange={(v) => void onCurrency(v)} />
      </div>
      {saved && <span className="chip" style={{ marginTop: 4 }}>✓ {tr("Guardado")}</span>}
    </div>
  );
}

function TemaCard() {
  const { t: tr } = useIdioma();
  const { palette } = useTheme();
  const [pickerOpen, setPickerOpen] = useState(false);
  const paletteName = PALETTES.find((p) => p.key === palette)?.name ?? palette;

  return (
    <div className="card pad">
      <h3 style={{ fontSize: 15, marginBottom: 4 }}>{tr("Tema")}</h3>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
        {tr("Tema actual:")} <b style={{ color: "var(--ink)" }}>{paletteName}</b>
      </p>
      <button className="btn ghost" onClick={() => setPickerOpen(true)}>
        <Palette size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />
        {tr("Cambiar tema")}
      </button>
      {pickerOpen && <ThemePicker onClose={() => setPickerOpen(false)} />}
    </div>
  );
}

function AvisosNavegadorCard() {
  const { t: tr } = useIdioma();
  return (
    <div className="card pad">
      <h3 style={{ fontSize: 15, marginBottom: 4 }}>{tr("Avisos del navegador")}</h3>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
        {tr("Una vez al día, si hay algo urgente (un pago que vence, una cita), el navegador te avisa aunque tengas otra pestaña abierta.")}
      </p>
      <NotifPermiso />
    </div>
  );
}

function ConexionesCard() {
  const { t: tr } = useIdioma();
  return (
    <div className="card pad">
      <h3 style={{ fontSize: 15, marginBottom: 4 }}>{tr("Conexiones")}</h3>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>
        <b style={{ color: "var(--ink)" }}>Notion</b>: {tr("llegará como integración directa cuando la app tenga su capa de servidor, para exportar reportes, journaling y notas a tu espacio.")}
      </p>
      <p style={{ fontSize: 13, color: "var(--muted)" }}>
        {tr("Mientras tanto, en")} <b style={{ color: "var(--ink)" }}>{tr("nav.revision")}</b> {tr("puedes copiar cualquier reporte semanal o mensual como Markdown y pegarlo en Notion tal cual.")}
      </p>
    </div>
  );
}

function CuentaCard() {
  const { t: tr } = useIdioma();
  const { session } = useAuth();
  return (
    <div className="card pad">
      <h3 style={{ fontSize: 15, marginBottom: 4 }}>{tr("Cuenta")}</h3>
      <p style={{ fontSize: 13, color: "var(--muted)" }}>
        {tr("Sesión iniciada como")} <b style={{ color: "var(--ink)" }}>{session?.user?.email}</b>
      </p>
    </div>
  );
}

function NameCard() {
  const { t: tr } = useIdioma();
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
      <h3 style={{ fontSize: 15, marginBottom: 4 }}>{tr("Tu nombre")}</h3>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>{tr("Cómo quieres que te salude la app.")}</p>
      <form onSubmit={save} style={{ display: "flex", gap: 8, maxWidth: 380 }}>
        <input className="input-inline" value={value} onChange={(e) => setValue(e.target.value)} placeholder={tr("tu nombre")} />
        <button className="btn primary" type="submit">{tr("com.guardar")}</button>
      </form>
      {saved && <span className="chip" style={{ marginTop: 8 }}>✓ {tr("Guardado")}</span>}
      {err && <p style={{ fontSize: 12.5, color: "var(--err)", marginTop: 8 }}>{err}</p>}
    </div>
  );
}

function DiaPasadoCard() {
  const { t: tr } = useIdioma();
  const { fecha, esHoy, setFecha, volverAHoy } = useFechaActiva();
  const hoy = hoyLocal();
  const min = diasAtrasLocal(13);

  return (
    <div className="card pad">
      <h3 style={{ fontSize: 15, marginBottom: 4 }}>{tr("🕰 Registrar un día pasado")}</h3>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
        {tr("¿Desapareciste unos días pero igual entrenaste, tomaste agua o marcaste hábitos? Elige el día y toda la app registra ahí: Energía, Hábitos, comidas y estados. Al terminar, vuelve a hoy.")}
      </p>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ width: 200, flex: "none" }}>
          <CampoFecha value={fecha} onChange={(v) => { if (v) setFecha(v); }} ariaLabel="Día que quieres registrar" min={min} max={hoy} conBorrar={false} />
        </div>
        {!esHoy && (
          <button className="btn ghost" onClick={volverAHoy}>{tr("Volver a hoy")}</button>
        )}
        {!esHoy && <span className="chip">{tr("registrando el")} {fechaLarga(fecha)}</span>}
      </div>
      <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 8 }}>
        {tr("Hasta dos semanas atrás. Lo registrado suma a tus metas igual que si lo hubieras anotado ese día.")}
      </p>
    </div>
  );
}

function IdiomaCard() {
  const { idioma, setIdioma, t } = useIdioma();
  return (
    <div className="card pad">
      <h3 style={{ fontSize: 15, marginBottom: 4 }}>🌍 {t("ajustes.idioma")}</h3>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
        {t("ajustes.idiomaDesc")}
      </p>
      <div style={{ maxWidth: 240 }}>
        <Selector value={idioma} ariaLabel={t("ajustes.idioma")}
          opciones={IDIOMAS.map((i) => ({ value: i.key, label: i.label }))}
          onChange={(v) => setIdioma(v as Idioma)} />
      </div>
    </div>
  );
}

function ModulosCard() {
  const { t: tr } = useIdioma();
  const { esVisible, alternar } = useModulos();
  const total = GRUPOS_MODULOS.reduce((n, g) => n + g.modulos.length, 0);
  const visibles = GRUPOS_MODULOS.reduce((n, g) => n + g.modulos.filter((m) => esVisible(m.id)).length, 0);

  return (
    <div className="card pad">
      <h3 style={{ fontSize: 15, marginBottom: 4 }}>🧩 {tr("Tus módulos")}</h3>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
        {tr("Deja en el menú solo lo que de verdad usas. Lo que apagues desaparece de la barra lateral; tus datos quedan guardados y puedes volver a encenderlo cuando quieras. Inicio y Ajustes siempre están.")}
      </p>
      <div style={{ display: "grid", gap: 12 }}>
        {GRUPOS_MODULOS.map((g) => (
          <div key={g.seccionTkey}>
            <p style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".11em", color: "var(--muted)", fontWeight: 600, marginBottom: 2 }}>
              {tr(g.seccionTkey)}
            </p>
            <div className="mod-lista">
              {g.modulos.map((m) => (
                <Toggle key={m.id} checked={esVisible(m.id)} onChange={() => alternar(m.id)} label={tr(m.tkey)} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 12 }}>
        {visibles} {tr("de")} {total} {tr("módulos a la vista")}
      </p>
    </div>
  );
}

function CumpleCard() {
  const { t: tr } = useIdioma();
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
      <h3 style={{ fontSize: 15, marginBottom: 4 }}>{tr("Tu cumpleaños 🎂")}</h3>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
        {tr("Amor propio: la app también te celebra a ti. El día de tu cumpleaños, el Inicio se pone de fiesta.")}
      </p>
      <form onSubmit={save} style={{ display: "flex", gap: 8, maxWidth: 380 }}>
        <div style={{ flex: 1 }}><CampoFecha value={value} onChange={setValue} ariaLabel="Tu fecha de cumpleaños" /></div>
        <button className="btn primary" type="submit">{tr("com.guardar")}</button>
      </form>
      {saved && <span className="chip" style={{ marginTop: 8 }}>✓ {tr("Guardado")}</span>}
      {err && <p style={{ fontSize: 12.5, color: "var(--err)", marginTop: 8 }}>{err}</p>}
    </div>
  );
}

function NotifPermiso() {
  const { t: tr } = useIdioma();
  const soporta = "Notification" in window;
  const [estado, setEstado] = useState(soporta ? Notification.permission : "unsupported");

  if (!soporta) return <p style={{ fontSize: 12.5, color: "var(--muted)" }}>{tr("Este navegador no soporta avisos.")}</p>;
  if (estado === "granted") return <span className="chip">✓ {tr("Avisos activados")}</span>;
  if (estado === "denied") return <p style={{ fontSize: 12.5, color: "var(--muted)" }}>{tr("Los bloqueaste en el navegador. Puedes reactivarlos desde el candado de la barra de direcciones.")}</p>;
  return (
    <button className="btn ghost" onClick={async () => setEstado(await Notification.requestPermission())}>
      {tr("Activar avisos")}
    </button>
  );
}
