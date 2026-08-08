// Módulos que la persona puede esconder desde Ajustes, para que la app
// muestre solo lo que le sirve. Inicio y Ajustes nunca se esconden: son la
// casa y el panel de control. Esconder un módulo lo saca del menú; su página
// sigue existiendo por si un enlace la abre, no se borra nada.

export interface Modulo {
  id: string; // estable, es también la ruta
  tkey: string; // llave del diccionario para el nombre
}

export interface GrupoModulos {
  seccionTkey: string;
  modulos: Modulo[];
}

export const GRUPOS_MODULOS: GrupoModulos[] = [
  {
    seccionTkey: "sec.panorama",
    modulos: [
      { id: "/calendario", tkey: "nav.calendario" },
      { id: "/revision", tkey: "nav.revision" },
    ],
  },
  {
    seccionTkey: "sec.nucleo",
    modulos: [
      { id: "/salud", tkey: "area.salud" },
      { id: "/mente", tkey: "nav.mente" },
      { id: "/movimiento", tkey: "nav.movimiento" },
      { id: "/habitos", tkey: "area.habitos" },
    ],
  },
  {
    seccionTkey: "sec.mivida",
    modulos: [
      { id: "/relaciones", tkey: "area.relaciones" },
      { id: "/objetivos", tkey: "area.objetivos" },
      { id: "/trabajo", tkey: "area.trabajo" },
      { id: "/finanzas", tkey: "area.finanzas" },
      { id: "/aprendizaje", tkey: "area.aprendizaje" },
    ],
  },
  {
    seccionTkey: "sec.inspiracion",
    modulos: [{ id: "/vision", tkey: "nav.vision" }],
  },
];

// Todas las rutas que se pueden esconder, para validar lo que baja de la nube.
export const IDS_MODULOS: string[] = GRUPOS_MODULOS.flatMap((g) => g.modulos.map((m) => m.id));

export const LS_MODULOS_OCULTOS = "nucleoos-modulos-ocultos";

export function leerOcultos(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_MODULOS_OCULTOS);
    if (raw) {
      const arr = JSON.parse(raw) as unknown;
      if (Array.isArray(arr)) return new Set(arr.filter((x): x is string => IDS_MODULOS.includes(x)));
    }
  } catch {
    /* dato corrupto: empezamos sin nada oculto */
  }
  return new Set();
}

export function guardarOcultos(ocultos: Set<string>): void {
  try {
    localStorage.setItem(LS_MODULOS_OCULTOS, JSON.stringify([...ocultos]));
  } catch {
    /* sin almacenamiento: no pasa nada grave */
  }
}

// ---------- Modos de inicio (onboarding) ----------
// Cada modo dice qué módulos quedan VISIBLES al partir. No borra nada:
// el resto se esconde del menú y se puede encender en Ajustes cuando quiera.

export interface ModoInicio {
  key: string;
  emoji: string;
  tkey: string; // nombre del modo en el diccionario
  dkey: string; // descripción corta en el diccionario
  visibles: string[] | null; // null = todos
}

export const MODOS_INICIO: ModoInicio[] = [
  { key: "todo", emoji: "🧭", tkey: "modo.todo", dkey: "modo.todo.d", visibles: null },
  { key: "finanzas", emoji: "💰", tkey: "modo.finanzas", dkey: "modo.finanzas.d", visibles: ["/finanzas", "/calendario"] },
  { key: "cuerpo", emoji: "⚡", tkey: "modo.cuerpo", dkey: "modo.cuerpo.d", visibles: ["/salud", "/movimiento", "/habitos", "/calendario", "/revision"] },
  { key: "mente", emoji: "🧠", tkey: "modo.mente", dkey: "modo.mente.d", visibles: ["/mente", "/habitos", "/calendario", "/revision", "/vision"] },
];

/** Los módulos que ese modo esconde (para pasarle al proveedor). */
export function ocultosDeModo(modo: ModoInicio): string[] {
  if (!modo.visibles) return [];
  return IDS_MODULOS.filter((id) => !modo.visibles!.includes(id));
}
