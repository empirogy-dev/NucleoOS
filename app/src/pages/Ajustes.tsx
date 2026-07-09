import { useState } from "react";
import { Palette, Settings } from "lucide-react";
import { CURRENCIES, useSettings } from "../settings/SettingsProvider";
import { useAuth } from "../auth/AuthProvider";
import { ThemePicker } from "../components/ThemePicker";
import { PALETTES } from "../theme/palettes";
import { useTheme } from "../theme/ThemeProvider";

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
        <div className="card pad">
          <h3 style={{ fontSize: 15, marginBottom: 4 }}>Moneda predeterminada</h3>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
            Se usa en los totales y como moneda inicial de tus cuentas nuevas.
          </p>
          <div className="field" style={{ maxWidth: 320 }}>
            <select value={currency} onChange={(e) => void onCurrency(e.target.value)}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c} — {CURRENCY_NAMES[c]}</option>
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
