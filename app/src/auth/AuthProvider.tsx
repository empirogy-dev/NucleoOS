import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { bajarDeLaNube } from "../lib/nube";

interface AuthCtx {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string; needsConfirm?: boolean }>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  session: null,
  loading: true,
  signIn: async () => ({}),
  signUp: async () => ({}),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(async ({ data }) => {
      // Antes de mostrar la app, el espejo de la nube baja tus datos del
      // navegador (Mente, libros, rutinas...) para que cualquier
      // dispositivo parta con lo mismo.
      if (data.session) await bajarDeLaNube();
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_IN" && s) {
        // Login recién hecho: bajar el espejo antes de soltar las páginas.
        setLoading(true);
        void bajarDeLaNube().finally(() => {
          setSession(s);
          setLoading(false);
        });
        return;
      }
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    if (!supabase) return { error: "Supabase no está configurado." };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message };
  }

  async function signUp(email: string, password: string) {
    if (!supabase) return { error: "Supabase no está configurado." };
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    // Si Supabase pide confirmación por correo, no hay sesión todavía.
    return { needsConfirm: !data.session };
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
  }

  return (
    <Ctx.Provider value={{ session, loading, signIn, signUp, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(Ctx);
}
