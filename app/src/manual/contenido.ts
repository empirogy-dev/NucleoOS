import { MANUAL_ES } from "./es";
import { MANUAL_EN } from "./en";
import { MANUAL_PT } from "./pt";
import { MANUAL_FR } from "./fr";
import type { Manual } from "./tipos";

export type { Manual, SeccionManual } from "./tipos";

/** Los idiomas del manual. El francés está aquí aunque la app todavía no lo
 *  hable: un manual se puede leer antes de instalar nada, y alguien que lee
 *  en francés puede usar perfectamente la app en inglés. */
export const IDIOMAS_MANUAL = ["es", "en", "pt", "fr"] as const;
export type IdiomaManual = (typeof IDIOMAS_MANUAL)[number];

export const MANUAL: Record<IdiomaManual, Manual> = {
  es: MANUAL_ES,
  en: MANUAL_EN,
  pt: MANUAL_PT,
  fr: MANUAL_FR,
};

/** Se sube cuando el manual cambia de verdad, para que quien lo haya impreso
 *  sepa si está mirando una versión vieja. */
export const VERSION_MANUAL = "1.0";

/** El manual en el idioma de la app, con el español como respaldo. */
export function manualDe(idioma: string): Manual {
  return MANUAL[idioma as IdiomaManual] ?? MANUAL.es;
}
