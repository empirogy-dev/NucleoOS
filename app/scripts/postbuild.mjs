// Después de compilar, intercambia quién manda en la raíz del dominio.
//
// Vercel sirve los archivos estáticos ANTES de aplicar las reglas de
// reescritura, así que mientras exista dist/index.html, la raíz siempre
// mostraría la aplicación. Por eso aquí:
//   dist/index.html (la app)  →  dist/app.html   (se sirve en /app)
//   dist/home.html (la landing) →  dist/index.html (se sirve en /)
//
// Los assets no se rompen: el HTML compilado los referencia con rutas
// absolutas (/assets/...), que no dependen del nombre del archivo.

import { rename, access } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dist = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const existe = async (p) => access(p).then(() => true).catch(() => false);

const appHtml = join(dist, "index.html");
const landing = join(dist, "home.html");
const destinoApp = join(dist, "app.html");

if (!(await existe(landing))) {
  console.error("postbuild: falta dist/home.html (la landing). ¿Sigue en app/public/home.html?");
  process.exit(1);
}
if (!(await existe(appHtml))) {
  console.error("postbuild: falta dist/index.html (la app compilada).");
  process.exit(1);
}

await rename(appHtml, destinoApp);   // la app pasa a /app.html
await rename(landing, appHtml);      // la landing queda como index.html
console.log("postbuild: landing en / y aplicación en /app ✔");
