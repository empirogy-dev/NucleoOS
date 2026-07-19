import { supabase } from "./supabase";

// Espejo en la nube (migración 0044): las claves importantes del navegador
// se respaldan en Supabase y te siguen a cualquier dispositivo. Al iniciar
// sesión se bajan (la nube manda), y cada cambio local se sube solo. Si la
// nube falla o la migración no está, la app sigue funcionando igual: el
// espejo es una mejora, nunca un bloqueo.

export const CLAVES_NUBE: string[] = [
  "nucleoos-mente", // historial de sesiones y prácticas de Mente
  "nucleoos-libros-estado", // libros marcados: leídos y mi lista, con fechas
  "nucleoos-rutinas", // rutinas guiadas con sus pasos y minutos
  "nucleoos-dopamina", // tu menú de dopamina
  "nucleoos-pomodoro-hechos", // bloques de foco de hoy
  "nucleoos-sync-ejercicio", // memoria del automarcado de hábitos
  "nucleoos-ayuno-meta", // horas de ayuno elegidas
  "nucleoos-ayuno-manual", // inicio manual del ayuno
  "nucleoos-ciclo-config", // configuración del ciclo
  "nucleoos-objetivo-cal", // objetivo calórico
];

// Guardamos los métodos originales para leer y escribir sin eco:
// las bajadas de la nube no deben volver a subirse.
const setOriginal = localStorage.setItem.bind(localStorage);
const removeOriginal = localStorage.removeItem.bind(localStorage);

function subir(key: string, raw: string | null) {
  if (!supabase) return;
  const sb = supabase;
  void sb.auth
    .getSession()
    .then(({ data }) => {
      if (!data.session) return;
      return sb
        .from("user_kv")
        .upsert(
          { user_id: data.session.user.id, key, value: { raw }, updated_at: new Date().toISOString() },
          { onConflict: "user_id,key" },
        );
    })
    .then(() => undefined)
    .catch(() => undefined); // sin la 0044 o sin red: el navegador sigue mandando
}

// El espejo se instala al cargar el módulo: cualquier escritura a una clave
// de la lista se sube a la nube, sin que cada componente tenga que saberlo.
localStorage.setItem = (key: string, value: string) => {
  setOriginal(key, value);
  if (CLAVES_NUBE.includes(key)) subir(key, value);
};
localStorage.removeItem = (key: string) => {
  removeOriginal(key);
  if (CLAVES_NUBE.includes(key)) subir(key, null);
};

let bajada = false;

/** Baja las claves de la nube al navegador. Se llama al conocer la sesión.
 *  Si una clave existe local pero no en la nube (primer login después de
 *  la migración), se sube para no perder nada. */
export async function bajarDeLaNube(): Promise<void> {
  if (bajada || !supabase) return;
  bajada = true;
  try {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) {
      bajada = false;
      return;
    }
    const { data, error } = await supabase.from("user_kv").select("key,value");
    if (error) return; // la 0044 aún no se corre: sin espejo por ahora
    const enNube = new Map<string, string | null>(
      (data ?? []).map((r: { key: string; value: { raw?: string | null } }) => [r.key, r.value?.raw ?? null]),
    );
    for (const k of CLAVES_NUBE) {
      if (enNube.has(k)) {
        const v = enNube.get(k) ?? null;
        if (v === null) removeOriginal(k);
        else setOriginal(k, v);
      } else {
        const local = localStorage.getItem(k);
        if (local !== null) subir(k, local);
      }
    }
  } catch {
    /* sin red o sin tabla: la app sigue con lo local */
  }
}
