import { type Idioma } from "./textos";

// El idioma actual para módulos que no son componentes React (la capa de
// IA, por ejemplo). Lee la misma clave que el IdiomaProvider.

export function idiomaActual(): Idioma {
  try {
    const v = localStorage.getItem("nucleoos-idioma");
    if (v === "en" || v === "pt") return v;
  } catch { /* sin navegador */ }
  return "es";
}
