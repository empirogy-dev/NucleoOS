import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** true cuando las llaves de Supabase están configuradas en .env */
export const supabaseConfigured = Boolean(url && key);

/** Cliente de Supabase, o null si aún no hay llaves (evita crashear en dev). */
export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url as string, key as string)
  : null;
