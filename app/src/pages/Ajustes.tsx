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
import { usePaisImpuestos } from "../finanzas/paisImpuestos";
import { useUsaAuto } from "../finanzas/usaAuto";
import { usePrefAyuno } from "../salud/ayunoPref";
import { PAISES, PAISES_CON_BANCO, datosPais, usePais } from "../settings/pais";
import { useTour } from "../tour/TourProvider";
import { TOUR_GENERAL } from "../tour/guiones";
import { reiniciarTour } from "../tour/tour";
import { LegalModal } from "../legal/LegalModal";
import { descargarMisDatos, reunirMisDatos } from "../legal/misDatos";
import { FRASE_BORRAR, borrarMiCuenta } from "../legal/borrarCuenta";
import { FORMULARIO, type PaisImpuestos } from "../finanzas/impuestos";
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
        <DatosYLegalCard />
        <PaisImpuestosCard />
        <IdiomaCard />
        <ModulosCard />
        <DiaPasadoCard />
        <WhatsAppCard />
        <TemaCard />
        <AvisosNavegadorCard />
        <ConexionesCard />
        <CuentaCard />
        <BorrarCuentaCard />
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

/** En qué país declaras impuestos. Manda sobre las líneas del formulario que
 *  aparecen en Finanzas, y no se deduce de la moneda: se puede tener cuentas
 *  en dólares y declarar en Chile. */
function PaisImpuestosCard() {
  const { t: tr } = useIdioma();
  const [pais, setPais] = usePaisImpuestos();
  const [paisVives, setPaisVives] = usePais();
  const [usaAuto, setUsaAuto] = useUsaAuto();
  const [prefAyuno, setPrefAyuno] = usePrefAyuno();
  const datos = datosPais(paisVives);
  const { iniciar } = useTour();

  return (
    <div className="card pad">
      {/* Dónde vives, que es lo que decide si la conexión con el banco se
          puede ofrecer o no. Va antes que los impuestos porque le sirve a
          todo el mundo, no solo a quien declara. */}
      <h3 style={{ fontSize: 15, marginBottom: 4 }}>{tr("País donde vives")}</h3>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12, lineHeight: 1.5 }}>
        {tr("Decide qué te puede ofrecer la app. La conexión automática con el banco funciona con bancos de")}
        {" "}{PAISES_CON_BANCO.join(" y ")}
        {tr("; en el resto de los países se importa la cartola, que hace lo mismo con un paso más.")}
      </p>
      <div className="field" style={{ maxWidth: 320 }}>
        <Selector value={paisVives ?? ""} ariaLabel={tr("País donde vives")} placeholder={tr("Elige tu país")}
          opciones={PAISES.map((p) => ({ value: p.codigo, label: tr(p.nombre) }))}
          onChange={(v) => setPaisVives(v)} />
      </div>
      {datos && (
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8, marginBottom: 18 }}>
          {datos.conBanco
            ? tr("Aquí puedes conectar tu banco desde Finanzas, en Cuentas.")
            : tr("Aquí todavía no se puede conectar el banco. En Finanzas, en Cuentas, está el botón para importar la cartola.")}
        </p>
      )}

      {/* Volver a ver el tour. Vive en esta tarjeta y no en una propia porque
          es la misma pregunta que el país: cómo se usa esto. */}
      <div style={{ borderTop: "1px solid var(--line-soft)", paddingTop: 14, marginBottom: 18 }}>
        <b style={{ fontSize: 13.5, display: "block", marginBottom: 4 }}>{tr("El recorrido guiado")}</b>
        <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 10, lineHeight: 1.5 }}>
          {tr("Te muestra para qué sirve cada parte de la app. También puedes pedirlo en cualquier pantalla con el signo de pregunta de arriba.")}
        </p>
        <button className="btn ghost" onClick={() => { reiniciarTour(); iniciar(TOUR_GENERAL); }}>
          {tr("Ver el recorrido otra vez")}
        </button>
      </div>

      <h3 style={{ fontSize: 15, marginBottom: 4 }}>{tr("País donde declaras impuestos")}</h3>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12, lineHeight: 1.5 }}>
        {tr("Define qué líneas de impuestos aparecen en Finanzas. Por ahora están hechas para Canadá y Chile; para otros países la sección queda apagada, porque una lista inventada en algo que termina en una declaración sería peor que nada.")}
      </p>
      <div className="field" style={{ maxWidth: 320 }}>
        <Selector value={pais} ariaLabel={tr("País donde declaras impuestos")}
          opciones={[
            { value: "otro", label: tr("Otro país") },
            { value: "CA", label: `🇨🇦 ${tr("Canadá")}` },
            { value: "CL", label: `🇨🇱 ${tr("Chile")}` },
          ]}
          onChange={(v) => setPais(v as PaisImpuestos)} />
      </div>
      {pais !== "otro" && (
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
          {tr(FORMULARIO[pais])}
        </p>
      )}

      {/* Vive aquí y no en Finanzas porque es la misma decisión: qué parte de
          la app tiene sentido para cómo declaras tú. */}
      <label style={{
        display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer",
        fontSize: 13, lineHeight: 1.5, marginTop: 14, paddingTop: 12,
        borderTop: "1px solid var(--line-soft)",
      }}>
        <input type="checkbox" checked={usaAuto} onChange={(e) => setUsaAuto(e.target.checked)}
          style={{ width: 15, height: 15, marginTop: 2, accentColor: "var(--accent)" }} />
        <span>
          {tr("Uso un auto para trabajar")}{" "}
          <span style={{ color: "var(--muted)" }}>
            {tr("Agrega la pestaña Auto en Finanzas, para llevar los kilómetros y poder deducir la parte de sus gastos que corresponde al trabajo. Si la apagas no se borra nada: los viajes siguen guardados.")}
          </span>
        </span>
      </label>

      {/* El ayuno es la otra función que solo le sirve a quien la practica.
          Antes el contador se encendía solo al registrar una comida, y a quien
          no ayuna le decía todos los días que estaba ayunando. */}
      <label style={{
        display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer",
        fontSize: 13, lineHeight: 1.5, marginTop: 12,
      }}>
        <input type="checkbox" checked={prefAyuno === "si"}
          onChange={(e) => setPrefAyuno(e.target.checked ? "si" : "no")}
          style={{ width: 15, height: 15, marginTop: 2, accentColor: "var(--accent)" }} />
        <span>
          {tr("Hago ayuno intermitente")}{" "}
          <span style={{ color: "var(--muted)" }}>
            {tr("Muestra el contador de horas desde tu última comida en Energía. Si lo apagas, la tarjeta desaparece y tus comidas se siguen registrando igual.")}
          </span>
        </span>
      </label>
    </div>
  );
}

/** Tus datos y los documentos: llevártelos y leerlos, sin pedir permiso. */
function DatosYLegalCard() {
  const { t: tr } = useIdioma();
  const [ver, setVer] = useState<null | "terminos" | "privacidad">(null);
  const [bajando, setBajando] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function descargar() {
    setBajando(true);
    setErr(null);
    try {
      descargarMisDatos(await reunirMisDatos());
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBajando(false);
    }
  }

  return (
    <div className="card pad">
      {ver && <LegalModal inicial={ver} onClose={() => setVer(null)} />}
      <h3 style={{ fontSize: 15, marginBottom: 4 }}>{tr("Tus datos")}</h3>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12, lineHeight: 1.5 }}>
        {tr("Todo lo que escribes en NucleoOS es tuyo y te lo puedes llevar cuando quieras, sin avisar y sin pedir permiso.")}
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn ghost" disabled={bajando} onClick={() => void descargar()}>
          {bajando ? tr("Reuniendo tus datos…") : tr("Descargar todos mis datos")}
        </button>
        <button className="btn ghost" onClick={() => setVer("terminos")}>{tr("Términos de servicio")}</button>
        <button className="btn ghost" onClick={() => setVer("privacidad")}>{tr("Política de privacidad")}</button>
      </div>
      {err && <p style={{ color: "var(--err)", fontSize: 13, marginTop: 10 }}>{err}</p>}
      <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 10, lineHeight: 1.5 }}>
        {tr("Las fotos de tus boletas se descargan aparte, desde Finanzas → Comprobantes → Exportar, con sus nombres puestos.")}
      </p>
    </div>
  );
}

/** Borrar la cuenta. Va al final, con su propio marco rojo y con los pasos
 *  separados: primero se abre, después se escribe la frase y el correo, y
 *  recién ahí el botón se enciende. Nada de esto se hace con un clic. */
function BorrarCuentaCard() {
  const { t: tr } = useIdioma();
  const { session, signOut } = useAuth();
  const correoCuenta = session?.user?.email ?? "";
  const [abierto, setAbierto] = useState(false);
  const [frase, setFrase] = useState("");
  const [correo, setCorreo] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const listo = frase.trim().toUpperCase() === FRASE_BORRAR
    && correo.trim().toLowerCase() === correoCuenta.toLowerCase();

  async function borrar() {
    if (!window.confirm(tr("Esto borra tu cuenta y todo lo que hay dentro, sin vuelta atrás. ¿Seguro?"))) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await borrarMiCuenta(correo.trim());
      if (r.avisos.length > 0) window.alert(r.avisos.join("\n"));
      await signOut();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  return (
    <div className="card pad" style={{ borderColor: "var(--err)" }}>
      <h3 style={{ fontSize: 15, marginBottom: 4 }}>{tr("Borrar mi cuenta")}</h3>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12, lineHeight: 1.55 }}>
        {tr("Se borra tu cuenta y todo lo que hay dentro: movimientos, boletas, cartolas, hábitos, notas y metas. Se corta la conexión con tu banco. No hay vuelta atrás y no podemos recuperarlo después.")}
      </p>
      <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 12, lineHeight: 1.5 }}>
        💡 {tr("Antes de borrar, descarga tus datos con el botón de arriba. Después ya no vas a poder.")}
      </p>

      {!abierto ? (
        <button className="btn ghost" style={{ borderColor: "var(--err)", color: "var(--err)" }}
          onClick={() => setAbierto(true)}>
          {tr("Quiero borrar mi cuenta")}
        </button>
      ) : (
        <>
          <div className="field" style={{ maxWidth: 340 }}>
            <label>{tr("Escribe")} {FRASE_BORRAR}</label>
            <input value={frase} onChange={(e) => setFrase(e.target.value)} placeholder={FRASE_BORRAR} />
          </div>
          <div className="field" style={{ maxWidth: 340 }}>
            <label>{tr("Escribe tu correo")}</label>
            <input value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder={correoCuenta} autoComplete="off" />
          </div>
          {err && <p style={{ color: "var(--err)", fontSize: 13, marginBottom: 10 }}>{err}</p>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn ghost" disabled={busy}
              onClick={() => { setAbierto(false); setFrase(""); setCorreo(""); setErr(null); }}>
              {tr("Cancelar")}
            </button>
            <button className="btn primary" disabled={!listo || busy}
              style={{ background: "var(--err)" }} onClick={() => void borrar()}>
              {busy ? tr("Borrando…") : tr("Borrar mi cuenta para siempre")}
            </button>
          </div>
        </>
      )}
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
