import { supabase } from "../lib/supabase";

// La conexión en vivo con el banco (Plaid), vista desde la app. Todo el
// trabajo sucio (llaves, tokens, sincronización) vive en la Edge Function
// "banco": aquí solo se pide y se muestra. El token del banco JAMÁS pasa
// por el navegador.

export interface ConexionBanco {
  id: string;
  institution_name: string | null;
  status: string;
  last_sync: string | null;
}

function sb() {
  if (!supabase) throw new Error("Supabase no está configurado.");
  return supabase;
}

async function llamar<T>(cuerpo: Record<string, unknown>): Promise<T> {
  const { data, error } = await sb().functions.invoke("banco", { body: cuerpo });
  if (error) {
    // El detalle real viene en el cuerpo de la respuesta, no en el error.
    let msg = error.message;
    try {
      const ctx = (error as unknown as { context?: Response }).context;
      const j = ctx ? await ctx.json() : null;
      if (j?.error) msg = String(j.error);
    } catch { /* sin cuerpo legible */ }
    throw new Error(msg);
  }
  const j = data as { error?: string };
  if (j?.error) throw new Error(j.error);
  return data as T;
}

export async function listConexiones(): Promise<ConexionBanco[]> {
  const r = await llamar<{ conexiones: ConexionBanco[] }>({ accion: "estado" });
  return r.conexiones ?? [];
}

export async function crearLinkToken(): Promise<string> {
  const r = await llamar<{ link_token: string }>({ accion: "link_token" });
  return r.link_token;
}

export async function canjearToken(publicToken: string, institucion?: string): Promise<number> {
  const r = await llamar<{ nuevas: number }>({ accion: "exchange", public_token: publicToken, institucion });
  return r.nuevas ?? 0;
}

export async function sincronizarBanco(): Promise<number> {
  const r = await llamar<{ nuevas: number }>({ accion: "sync" });
  return r.nuevas ?? 0;
}

export async function desconectarBanco(id: string, borrarDatos = false): Promise<number> {
  const r = await llamar<{ borradas?: number }>({ accion: "desconectar", id, borrar: borrarDatos });
  return r.borradas ?? 0;
}

/** Carga el script de Plaid una sola vez y abre su ventana segura. Las
 *  credenciales del banco se escriben DENTRO de esa ventana, que es de
 *  Plaid: NucleoOS nunca las ve ni las puede ver. */
export async function abrirPlaid(linkToken: string, alTerminar: (publicToken: string, institucion?: string) => void): Promise<void> {
  await new Promise<void>((listo, falla) => {
    const w = window as unknown as { Plaid?: unknown };
    if (w.Plaid) return listo();
    const s = document.createElement("script");
    s.src = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";
    s.onload = () => listo();
    s.onerror = () => falla(new Error("No se pudo cargar Plaid."));
    document.head.appendChild(s);
  });
  const Plaid = (window as unknown as {
    Plaid: { create: (o: Record<string, unknown>) => { open: () => void } };
  }).Plaid;
  Plaid.create({
    token: linkToken,
    onSuccess: (publicToken: string, metadata: { institution?: { name?: string } }) => {
      alTerminar(publicToken, metadata?.institution?.name);
    },
  }).open();
}
