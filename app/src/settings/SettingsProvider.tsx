import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";

export const CURRENCIES = ["CAD", "CLP", "USD", "EUR", "MXN", "COP"] as const;

interface SettingsCtx {
  currency: string;
  displayName: string;
  lifeVision: string;
  setCurrency: (c: string) => Promise<void>;
  updateProfile: (p: { display_name?: string; life_vision?: string }) => Promise<string | null>;
  /** true si la tabla profiles aún no existe (migración 0002 pendiente) */
  profileTableMissing: boolean;
}

const LS_KEY = "nucleoos-currency";

const Ctx = createContext<SettingsCtx>({
  currency: "CAD",
  displayName: "",
  lifeVision: "",
  setCurrency: async () => {},
  updateProfile: async () => null,
  profileTableMissing: false,
});

function tableMissing(err: { code?: string; message: string } | null): boolean {
  if (!err) return false;
  return (
    err.code === "42P01" ||
    err.code === "PGRST205" ||
    /does not exist|could not find the table/i.test(err.message)
  );
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<string>(
    () => localStorage.getItem(LS_KEY) ?? "CAD"
  );
  const [displayName, setDisplayName] = useState("");
  const [lifeVision, setLifeVision] = useState("");
  const [profileTableMissing, setMissing] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    void (async () => {
      const { data, error } = await supabase.from("profiles").select("*").maybeSingle();
      if (error) {
        if (tableMissing(error)) setMissing(true);
        return;
      }
      if (data) {
        if (data.default_currency) {
          setCurrencyState(data.default_currency);
          localStorage.setItem(LS_KEY, data.default_currency);
        }
        setDisplayName(data.display_name ?? "");
        setLifeVision(data.life_vision ?? "");
      }
    })();
  }, []);

  async function upsert(patch: Record<string, unknown>): Promise<string | null> {
    if (!supabase) return "Supabase no está configurado.";
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return "Sin sesión.";
    const { error } = await supabase
      .from("profiles")
      .upsert({ user_id: u.user.id, ...patch, updated_at: new Date().toISOString() });
    if (error) {
      if (tableMissing(error)) {
        setMissing(true);
        return "Falta la migración 0002 (tabla profiles).";
      }
      if (/life_vision/.test(error.message)) {
        return "Falta la migración 0003 (columna life_vision). Córrela en el SQL Editor.";
      }
      return error.message;
    }
    return null;
  }

  async function setCurrency(c: string) {
    setCurrencyState(c);
    localStorage.setItem(LS_KEY, c);
    await upsert({ default_currency: c });
  }

  async function updateProfile(p: { display_name?: string; life_vision?: string }) {
    const err = await upsert(p);
    if (!err) {
      if (p.display_name !== undefined) setDisplayName(p.display_name);
      if (p.life_vision !== undefined) setLifeVision(p.life_vision);
    }
    return err;
  }

  return (
    <Ctx.Provider value={{ currency, displayName, lifeVision, setCurrency, updateProfile, profileTableMissing }}>
      {children}
    </Ctx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSettings() {
  return useContext(Ctx);
}
