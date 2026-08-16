import { supabase } from "../lib/supabase";

// El llamado a borrar la cuenta.
//
// La frase y el correo viajan al servidor y se vuelven a verificar allá. Aquí
// también se piden, pero eso es para la persona, no para la seguridad: una
// validación que solo vive en el navegador no protege de nada.

export const FRASE_BORRAR = "BORRAR MI CUENTA";

export interface ResultadoBorrado {
  archivos: number;
  avisos: string[];
}

export async function borrarMiCuenta(correo: string): Promise<ResultadoBorrado> {
  if (!supabase) throw new Error("Supabase no está configurado.");
  const { data, error } = await supabase.functions.invoke("borrar-cuenta", {
    body: { confirmacion: FRASE_BORRAR, correo },
  });
  if (error) {
    // El mensaje del servidor dice qué faltó; el genérico no ayuda a nadie.
    let msg = "";
    try {
      const ctx = (error as unknown as { context?: Response }).context;
      const j = ctx ? await ctx.json() : null;
      msg = typeof j?.error === "string" ? j.error : "";
    } catch { /* cuerpo no legible */ }
    throw new Error(msg || "No pude borrar la cuenta. Intenta de nuevo.");
  }
  const r = data as { archivos?: number; avisos?: string[] };
  return { archivos: r?.archivos ?? 0, avisos: r?.avisos ?? [] };
}
