import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DEFAULT_PALETTE } from "./palettes";

interface ThemeCtx {
  palette: string;
  setPalette: (key: string) => void;
}

const Ctx = createContext<ThemeCtx>({ palette: DEFAULT_PALETTE, setPalette: () => {} });

const STORAGE_KEY = "sv-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [palette, setPaletteState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_PALETTE;
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-pal", palette);
    localStorage.setItem(STORAGE_KEY, palette);
  }, [palette]);

  return (
    <Ctx.Provider value={{ palette, setPalette: setPaletteState }}>
      {children}
    </Ctx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  return useContext(Ctx);
}
