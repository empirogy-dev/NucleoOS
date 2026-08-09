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

export async function crearLinkToken(dias = 90): Promise<string> {
  const r = await llamar<{ link_token: string }>({ accion: "link_token", dias });
  return r.link_token;
}

export async function canjearToken(publicToken: string, institucion?: string): Promise<number> {
  const r = await llamar<{ nuevas: number }>({ accion: "exchange", public_token: publicToken, institucion });
  return r.nuevas ?? 0;
}

/** Reabre Plaid sobre una conexión existente para sumar las cuentas que
 *  quedaron fuera (las tarjetas suelen no venir marcadas por defecto). */
export async function tokenAgregarCuentas(id: string): Promise<string> {
  const r = await llamar<{ link_token: string }>({ accion: "agregar_cuentas", id });
  return r.link_token;
}

export async function sincronizarBanco(desdeCero = false): Promise<number> {
  const r = await llamar<{ nuevas: number }>({ accion: "sync", desde_cero: desdeCero });
  return r.nuevas ?? 0;
}

export async function desconectarBanco(id: string, borrarDatos = false): Promise<number> {
  const r = await llamar<{ borradas?: number }>({ accion: "desconectar", id, borrar: borrarDatos });
  return r.borradas ?? 0;
}

/** Carga el script de Plaid una sola vez y abre su ventana segura. Las
 *  credenciales del banco se escriben DENTRO de esa ventana, que es de
 *  Plaid: NucleoOS nunca las ve ni las puede ver. */
const LS_LINK = "nucleoos-plaid-link";

/** ¿Volvimos del sitio del banco? Plaid deja su rastro en la URL. */
export function volviendoDeOAuth(): string | null {
  try {
    if (!new URLSearchParams(window.location.search).get("oauth_state_id")) return null;
    return localStorage.getItem(LS_LINK);
  } catch {
    return null;
  }
}

export function limpiarOAuth(): void {
  try {
    localStorage.removeItem(LS_LINK);
    window.history.replaceState({}, "", window.location.pathname);
  } catch { /* sin historial: no pasa nada */ }
}

export async function abrirPlaid(linkToken: string, alTerminar: (publicToken: string, institucion?: string) => void, volviendo = false): Promise<void> {
  // El token se guarda porque el banco con OAuth se lleva a la persona a
  // su sitio: al volver hay que retomar el mismo flujo, no empezar otro.
  try { localStorage.setItem(LS_LINK, linkToken); } catch { /* sin storage */ }
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
    ...(volviendo ? { receivedRedirectUri: window.location.href } : {}),
    onSuccess: (publicToken: string, metadata: { institution?: { name?: string } }) => {
      try { localStorage.removeItem(LS_LINK); } catch { /* sin storage */ }
      alTerminar(publicToken, metadata?.institution?.name);
    },
  }).open();
}
