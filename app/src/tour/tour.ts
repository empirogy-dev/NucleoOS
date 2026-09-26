// El tour guiado: la app explicándose sola.
//
// Nació de una frase de una amiga de la usuaria, que bajó NucleoOS y preguntó
// "ya, ¿y ahora qué hago?". No sabía subir la cartola ni para qué servía. La
// app tiene catorce módulos y ninguno se presenta: la bienvenida pregunta tres
// cosas y te suelta en una pantalla llena de tarjetas.
//
// Reglas que se siguen en todo el tour:
//
//  1. Se puede saltar en cualquier paso, y saltarlo se respeta. Quien dice que
//     no quiere el tour general tampoco quiere que le salten doce tours de
//     módulo después.
//  2. Un paso que apunta a algo que no está en pantalla no se muestra vacío ni
//     deja el tour colgado: se salta solo. Los módulos se pueden esconder, así
//     que eso pasa todos los días.
//  3. Ningún paso pide hacer nada para poder seguir. Es una explicación, no un
//     trámite.

export interface PasoTour {
  id: string;
  /** La ruta donde vive el paso. El tour navega solo hasta ahí. */
  ruta?: string;
  /** Selector del elemento a señalar. Sin él, el paso sale al medio de la
   *  pantalla, que es lo que corresponde para abrir y para cerrar. */
  objetivo?: string;
  titulo: string;
  texto: string;
}

export interface Guion {
  clave: string;
  pasos: PasoTour[];
}

// ---------- Qué tours ya se vieron ----------

const CLAVE = "nucleoos-tour";
const EVENTO = "nucleoos-tour";

export interface EstadoTour {
  /** Las claves de los tours ya vistos hasta el final. */
  hechos: string[];
  /** Saltó el tour general. Entonces no le aparece ninguno solo, nunca más,
   *  hasta que lo pida desde Ajustes o desde el botón de ayuda. */
  saltado: boolean;
}

const VACIO: EstadoTour = { hechos: [], saltado: false };

export function estadoTour(): EstadoTour {
  try {
    const raw = localStorage.getItem(CLAVE);
    if (!raw) return VACIO;
    const j = JSON.parse(raw) as Partial<EstadoTour>;
    return {
      hechos: Array.isArray(j.hechos) ? j.hechos.filter((x): x is string => typeof x === "string") : [],
      saltado: Boolean(j.saltado),
    };
  } catch {
    return VACIO;
  }
}

function guardar(e: EstadoTour): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(e));
  } catch { /* sin navegador */ }
  window.dispatchEvent(new Event(EVENTO));
}

export function marcarHecho(clave: string): void {
  const e = estadoTour();
  if (e.hechos.includes(clave)) return;
  guardar({ ...e, hechos: [...e.hechos, clave] });
}

export function marcarSaltado(): void {
  guardar({ ...estadoTour(), saltado: true });
}

/** Volver a empezar de cero: el tour general y todos los de módulo. */
export function reiniciarTour(): void {
  guardar(VACIO);
}

export function yaVisto(clave: string): boolean {
  return estadoTour().hechos.includes(clave);
}

/** ¿Corresponde que este tour aparezca solo?
 *
 *  Solo si no se vio antes, no se saltó el general, y el general ya pasó: un
 *  tour de módulo antes de saber qué es la app llega en el peor momento. */
export function correspondeSolo(clave: string, claveGeneral: string): boolean {
  const e = estadoTour();
  if (e.saltado || e.hechos.includes(clave)) return false;
  return clave === claveGeneral ? false : e.hechos.includes(claveGeneral);
}

export const EVENTO_TOUR = EVENTO;

// ---------- El puente con la bienvenida ----------
//
// El onboarding vive fuera del router y el tour necesita navegar, así que no
// se pueden llamar directamente. La bienvenida deja esta nota al terminar, y
// el tour la recoge apenas la app está montada.

const PENDIENTE = "nucleoos-tour-pendiente";

export function pedirTourGeneral(): void {
  try {
    localStorage.setItem(PENDIENTE, "1");
  } catch { /* sin navegador */ }
}

/** ¿Quedó un tour pedido? Preguntarlo lo consume: solo arranca una vez. */
export function tomarTourPendiente(): boolean {
  try {
    if (localStorage.getItem(PENDIENTE) !== "1") return false;
    localStorage.removeItem(PENDIENTE);
    return true;
  } catch {
    return false;
  }
}
