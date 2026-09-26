import { useEffect, useState } from "react";

// ¿Dónde vives?
//
// Se pregunta por una razón concreta: la conexión automática con el banco
// funciona con bancos de Canadá y Estados Unidos, y de ningún otro lado. Sin
// saber el país, la app le ofrecía "conecta tu banco" a todo el mundo, y una
// persona en Chile se encontraba con una promesa que no se podía cumplir. Eso
// no es un detalle: es la app mandándote por un camino sin salida el primer
// día.
//
// Es distinto del país donde declaras impuestos (que vive en
// `finanzas/paisImpuestos.ts`). Se puede vivir en un país y declarar en otro,
// y la app ya tomó esa decisión antes. Este dice dónde estás; aquel, ante qué
// servicio rindes cuentas.

export interface Pais {
  codigo: string;
  nombre: string;
  /** La moneda que se propone al elegir este país. */
  moneda: string;
  /** El proveedor de la conexión bancaria (Plaid) cubre este país. */
  conBanco: boolean;
}

export const PAISES: Pais[] = [
  { codigo: "CL", nombre: "Chile", moneda: "CLP", conBanco: false },
  { codigo: "CA", nombre: "Canadá", moneda: "CAD", conBanco: true },
  { codigo: "US", nombre: "Estados Unidos", moneda: "USD", conBanco: true },
  { codigo: "MX", nombre: "México", moneda: "MXN", conBanco: false },
  { codigo: "CO", nombre: "Colombia", moneda: "COP", conBanco: false },
  { codigo: "AR", nombre: "Argentina", moneda: "USD", conBanco: false },
  { codigo: "ES", nombre: "España", moneda: "EUR", conBanco: false },
  { codigo: "otro", nombre: "Otro país", moneda: "USD", conBanco: false },
];

/** Los países donde hoy funciona la conexión con el banco, para poder
 *  decirlo en pantalla en vez de que se descubra a mitad de camino. */
export const PAISES_CON_BANCO = PAISES.filter((p) => p.conBanco).map((p) => p.nombre);

const CLAVE = "nucleoos-pais";
const EVENTO = "nucleoos-pais-residencia";

/** El país elegido, o null si nadie lo ha dicho todavía.
 *
 *  Nulo no se trata como "otro": mientras no se sepa, la app ofrece la
 *  conexión con el banco pero avisando con qué países funciona. Esconderla
 *  por las dudas le quitaría la función a quien sí puede usarla. */
export function paisActual(): string | null {
  try {
    const v = localStorage.getItem(CLAVE);
    return v && PAISES.some((p) => p.codigo === v) ? v : null;
  } catch {
    return null;
  }
}

export function guardarPais(codigo: string | null): void {
  try {
    if (codigo === null) localStorage.removeItem(CLAVE);
    else localStorage.setItem(CLAVE, codigo);
  } catch { /* sin navegador */ }
  window.dispatchEvent(new Event(EVENTO));
}

export function datosPais(codigo: string | null): Pais | null {
  return PAISES.find((p) => p.codigo === codigo) ?? null;
}

/** ¿Se puede conectar el banco desde aquí?
 *
 *  Tres respuestas y no dos: sí, no, y "todavía no se sabe". La tercera es la
 *  que evita esconderle la función a quien nunca contestó de dónde es. */
export function bancoDisponibleEn(codigo: string | null): boolean | null {
  const p = datosPais(codigo);
  return p ? p.conBanco : null;
}

export function usePais(): [string | null, (v: string | null) => void] {
  const [pais, setPais] = useState<string | null>(() => paisActual());
  useEffect(() => {
    const al = () => setPais(paisActual());
    window.addEventListener(EVENTO, al);
    window.addEventListener("storage", al);
    return () => {
      window.removeEventListener(EVENTO, al);
      window.removeEventListener("storage", al);
    };
  }, []);
  return [pais, (v) => { guardarPais(v); setPais(v); }];
}
