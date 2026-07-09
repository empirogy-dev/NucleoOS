import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";

export const CURRENCIES = ["CAD", "CLP", "USD", "EUR", "MXN", "COP"] as const;

interface SettingsCtx {
  currency: string;
  setCurrency: (c: string) => Promise<void>;
  /** true si la tabla profiles aún no existe (migración 0002 pendiente) */
  profileTableMissing: boolean;
}

const LS_KEY = "nucleoos-currency";

const Ctx = createContext<SettingsCtx>({
  currency: "CAD",
  setCurrency: async () => {},
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
  const [profileTableMissing, setMissing] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    void (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("default_currency")
        .maybeSingle();
      if (error) {
        if (tableMissing(error)) setMissing(true);
        return;
      }
      if (data?.default_currency) {
        setCurrencyState(data.default_currency);
        localStorage.setItem(LS_KEY, data.default_currency);
      }
    })();
  }, []);

  async function setCurrency(c: string) {
    setCurrencyState(c);
    localStorage.setItem(LS_KEY, c);
    if (!supabase) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase
      .from("profiles")
      .upsert({ user_id: u.user.id, default_currency: c, updated_at: new Date().toISOString() });
    if (error && tableMissing(error)) setMissing(true);
  }

  return (
    <Ctx.Provider value={{ currency, setCurrency, profileTableMissing }}>
      {children}
    </Ctx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSettings() {
  return useContext(Ctx);
}
