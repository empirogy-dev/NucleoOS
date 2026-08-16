// Genera las páginas públicas de términos y privacidad.
//
// Se arman desde el MISMO archivo que usa la app (src/legal/documentos.ts).
// Escribir el texto legal dos veces es la forma segura de que un día digan
// cosas distintas, y en un documento legal eso no es un detalle.
//
// Salen como HTML plano, sin JavaScript: una página legal tiene que poder
// leerse aunque los scripts fallen, aunque la lea un buscador o aunque
// alguien la abra desde un correo.

import { build } from "esbuild";
import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Lee el archivo de documentos, que está en TypeScript, sin escribir nada
 *  al disco: se transpila en memoria y se importa como datos. */
async function leerDocumentos() {
  const r = await build({
    entryPoints: [join(raiz, "src", "legal", "documentos.ts")],
    bundle: true,
    format: "esm",
    write: false,
    platform: "neutral",
  });
  const js = r.outputFiles[0].text;
  return import("data:text/javascript;base64," + Buffer.from(js).toString("base64"));
}

const escapar = (x) =>
  String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function pagina({ doc, otro, otroHref, version, lema }) {
  const secciones = doc.secciones.map((s) => `
    <section>
      <h2>${escapar(s.titulo)}</h2>
      ${s.parrafos.map((p) => `<p>${escapar(p)}</p>`).join("\n      ")}
    </section>`).join("\n");

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapar(doc.titulo)} · NucleoOS</title>
<meta name="description" content="${escapar(doc.intro.slice(0, 155))}">
<style>
  :root{--paper:#f7f5f0;--card:#fff;--ink:#1c2b24;--ink-soft:#3f5049;--muted:#7d8b84;
        --line:#e4e6e1;--accent:#7d9b83}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--paper);color:var(--ink);font:16px/1.65 system-ui,-apple-system,"Segoe UI",sans-serif;
       -webkit-font-smoothing:antialiased}
  .wrap{max-width:760px;margin:0 auto;padding:32px 20px 64px}
  header{display:flex;align-items:center;gap:12px;margin-bottom:28px}
  .badge{width:34px;height:34px;border-radius:10px;background:var(--accent);display:grid;place-items:center;flex:none}
  header b{font-size:17px}
  h1{font-size:27px;line-height:1.2;margin-bottom:6px}
  .version{color:var(--muted);font-size:13.5px;margin-bottom:22px}
  .intro{color:var(--ink-soft);margin-bottom:28px}
  nav{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:26px;font-size:14.5px}
  nav a{color:var(--accent);font-weight:600}
  section{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:20px 22px;margin-bottom:14px}
  h2{font-size:17px;margin-bottom:10px}
  p{color:var(--ink-soft);margin-bottom:10px}
  p:last-child{margin-bottom:0}
  footer{margin-top:30px;color:var(--muted);font-size:13.5px}
  a{color:var(--accent)}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <span class="badge"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="2.3" fill="#fff"/><ellipse cx="12" cy="12" rx="9.5" ry="4" stroke="#fff" stroke-width="1.5"/><ellipse cx="12" cy="12" rx="9.5" ry="4" stroke="#fff" stroke-width="1.5" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9.5" ry="4" stroke="#fff" stroke-width="1.5" transform="rotate(120 12 12)"/></svg></span>
    <b>NucleoOS</b>
  </header>

  <h1>${escapar(doc.titulo)}</h1>
  <p class="version">Versión ${escapar(version)}</p>
  <nav>
    <a href="/">← ${escapar(lema)}</a>
    <a href="${otroHref}">${escapar(otro)}</a>
  </nav>
  <p class="intro">${escapar(doc.intro)}</p>
${secciones}
  <footer>
    ¿Dudas sobre esto? Escríbenos a <a href="mailto:hola@nucleoos.app">hola@nucleoos.app</a>.
  </footer>
</div>
</body>
</html>`;
}

const { DOCUMENTOS, VERSION_LEGAL } = await leerDocumentos();
const es = DOCUMENTOS.es;
const dist = join(raiz, "dist");

await writeFile(join(dist, "terminos.html"), pagina({
  doc: es.terminos, otro: "Política de privacidad", otroHref: "/privacidad",
  version: VERSION_LEGAL, lema: "Volver a NucleoOS",
}), "utf8");

await writeFile(join(dist, "privacidad.html"), pagina({
  doc: es.privacidad, otro: "Términos de servicio", otroHref: "/terminos",
  version: VERSION_LEGAL, lema: "Volver a NucleoOS",
}), "utf8");

// El pie de la landing enlaza a las dos, para que se puedan encontrar sin
// tener una cuenta. Se hace aquí y no a mano en el HTML para que la landing
// siga siendo un solo archivo editable.
const indexPath = join(dist, "index.html");
let landing = await readFile(indexPath, "utf8");
const enlaces = `<p class="muted" style="margin-top:10px;font-size:13px">
        <a href="/terminos">Términos de servicio</a> · <a href="/privacidad">Política de privacidad</a>
      </p>`;
if (!landing.includes('href="/terminos"')) {
  landing = landing.replace('<a href="/app" data-i18n="foot.link">', `${enlaces}\n      <a href="/app" data-i18n="foot.link">`);
  await writeFile(indexPath, landing, "utf8");
}

console.log("postbuild: términos y privacidad publicados en / ✔");
