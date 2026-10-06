// El manual de usuario, como datos.
//
// Está escrito una sola vez y se usa en dos lugares: la pantalla de Manual
// dentro de la app, y las páginas públicas que se generan al compilar
// (/manual, /manual-en, /manual-pt, /manual-fr). Son las mismas frases, así
// que no pueden decir cosas distintas.
//
// Reglas de redacción, las mismas del tour:
//
//  1. Se explica para qué sirve antes de cómo se hace. Quien lee un manual no
//     está buscando el nombre de un botón, está tratando de entender qué gana.
//  2. Nada de promesas. Si algo funciona solo en ciertos países, con ciertos
//     archivos o con cierta cantidad de datos, se dice en el mismo párrafo.
//  3. Nunca se da por sabido el vocabulario de la app. "La cartola, que es el
//     archivo de movimientos que te da el banco", todas las veces que haga
//     falta.

export interface SeccionManual {
  /** El mismo id en los cuatro idiomas: es el ancla de la página y lo que
   *  revisa la prueba de que ninguna traducción se quedó corta. */
  id: string;
  titulo: string;
  parrafos: string[];
  /** Una lista numerada, para lo que de verdad tiene orden. */
  pasos?: string[];
  /** Una lista con viñetas, para lo que no lo tiene. */
  puntos?: string[];
  /** Un esquema de la pantalla, con sus etiquetas en este idioma. El dibujo
   *  es el mismo en los cuatro; lo único que cambia son las palabras. */
  figura?: { clave: string; etiquetas: string[] };
}

export interface Manual {
  titulo: string;
  intro: string;
  /** Lo que dice el aviso de idioma, cuando el manual existe en un idioma que
   *  la app todavía no habla. */
  avisoIdioma?: string;
  indice: string;
  secciones: SeccionManual[];
}
