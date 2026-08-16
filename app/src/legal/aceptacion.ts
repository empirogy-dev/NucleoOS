import { supabase } from "../lib/supabase";
import { VERSION_LEGAL } from "./documentos";

// La constancia de que aceptó, con su versión y su fecha.
//
// Se guarda en el servidor, no en el navegador: una aceptación que vive en el
// aparato de la persona se pierde al cambiar de teléfono y no demuestra nada.
//
// Si falla, no se bloquea la creación de la cuenta. Perder la constancia es
// un problema; dejar a alguien sin poder registrarse porque una tabla no
// respondió es peor, y la constancia se puede volver a pedir después.

export async function registrarAceptacion(): Promise<void> {
  if (!supabase) return;
  try {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase.from("legal_acceptances").insert({
      user_id: data.user.id,
      version: VERSION_LEGAL,
    });
  } catch { /* sin la 0067 todavía, o sin red: no se bloquea el registro */ }
}

/** ¿Ya aceptó la versión que está vigente hoy? */
export async function aceptoLaVigente(): Promise<boolean> {
  if (!supabase) return true;
  try {
    const { data, error } = await supabase
      .from("legal_acceptances")
      .select("version")
      .eq("version", VERSION_LEGAL)
      .limit(1);
    if (error) return true; // sin la tabla, no se molesta a nadie
    return (data ?? []).length > 0;
  } catch {
    return true;
  }
}
