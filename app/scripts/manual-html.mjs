// Genera el manual público: /manual, /manual-en, /manual-pt, /manual-fr.
//
// Se arma desde el MISMO archivo que usa la app (src/manual/), por la misma
// razón que las páginas legales: un manual escrito dos veces termina diciendo
// dos cosas, y entonces no sirve para nada.
//
// Sale como HTML plano, sin JavaScript, para que se pueda leer sin cuenta,
// desde un correo, desde un buscador, o impreso en papel. Es la respuesta a
// "mándame cómo se usa esto": un enlace que abre cualquiera.

import { build } from "esbuild";
import { writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");

async function leerManual() {
  const r = await build({
    entryPoints: [join(raiz, "src", "manual", "contenido.ts")],
    bundle: true, format: "esm", write: false, platform: "neutral",
  });
  return import("data:text/javascript;base64," + Buffer.from(r.outputFiles[0].text).toString("base64"));
}

const escapar = (x) =>
  String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Lo de alrededor también va en su idioma. Un manual en francés con la
// navegación en español se ve descuidado justo donde hay que verse cuidadoso.
const CHROME = {
  es: {
    ruta: "/manual", volver: "Ir a NucleoOS", version: "Versión",
    imprimir: "Imprimir o guardar en PDF", otros: "Otros idiomas",
    pie: '¿Algo no está aquí? Escríbenos a <a href="mailto:hola@nucleoos.app">hola@nucleoos.app</a>.',
    nombre: "Español",
  },
  en: {
    ruta: "/manual-en", volver: "Go to NucleoOS", version: "Version",
    imprimir: "Print or save as PDF", otros: "Other languages",
    pie: 'Something missing here? Write to us at <a href="mailto:hola@nucleoos.app">hola@nucleoos.app</a>.',
    nombre: "English",
  },
  pt: {
    ruta: "/manual-pt", volver: "Ir para o NucleoOS", version: "Versão",
    imprimir: "Imprimir ou salvar em PDF", otros: "Outros idiomas",
    pie: 'Falta algo aqui? Escreva para <a href="mailto:hola@nucleoos.app">hola@nucleoos.app</a>.',
    nombre: "Português",
  },
  fr: {
    ruta: "/manual-fr", volver: "Aller sur NucleoOS", version: "Version",
    imprimir: "Imprimer ou enregistrer en PDF", otros: "Autres langues",
    pie: 'Quelque chose manque ici ? Écrivez-nous à <a href="mailto:hola@nucleoos.app">hola@nucleoos.app</a>.',
    nombre: "Français",
  },
};

function seccionHtml(s) {
  const pasos = s.pasos?.length
    ? `\n      <ol>${s.pasos.map((p) => `<li>${escapar(p)}</li>`).join("")}</ol>`
    : "";
  const puntos = s.puntos?.length
    ? `\n      <ul>${s.puntos.map((p) => `<li>${escapar(p)}</li>`).join("")}</ul>`
    : "";
  return `
    <section id="${escapar(s.id)}">
      <h2>${escapar(s.titulo)}</h2>
      ${s.parrafos.map((p) => `<p>${escapar(p)}</p>`).join("\n      ")}${pasos}${puntos}
    </section>`;
}

function pagina({ manual, chrome, idioma, version }) {
  const indice = manual.secciones
    .map((s) => `<li><a href="#${escapar(s.id)}">${escapar(s.titulo)}</a></li>`).join("\n      ");
  const otros = Object.entries(CHROME)
    .filter(([k]) => k !== idioma)
    .map(([, c]) => `<a href="${c.ruta}">${escapar(c.nombre)}</a>`).join(" ");
  const alternos = Object.entries(CHROME)
    .map(([k, c]) => `<link rel="alternate" hreflang="${k}" href="https://www.nucleoos.app${c.ruta}">`).join("\n");
  const aviso = manual.avisoIdioma
    ? `\n  <p class="aviso">${escapar(manual.avisoIdioma)}</p>` : "";

  return `<!doctype html>
<html lang="${idioma}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapar(manual.titulo)}</title>
<meta name="description" content="${escapar(manual.intro.slice(0, 155))}">
<link rel="canonical" href="https://www.nucleoos.app${chrome.ruta}">
${alternos}
<style>
  :root{--paper:#f7f5f0;--card:#fff;--ink:#1c2b24;--ink-soft:#3f5049;--muted:#7d8b84;
        --line:#e4e6e1;--accent:#7d9b83}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--paper);color:var(--ink);font:16px/1.68 system-ui,-apple-system,"Segoe UI",sans-serif;
       -webkit-font-smoothing:antialiased}
  .wrap{max-width:780px;margin:0 auto;padding:32px 20px 64px}
  header{display:flex;align-items:center;gap:12px;margin-bottom:28px}
  .badge{width:34px;height:34px;border-radius:10px;background:var(--accent);display:grid;place-items:center;flex:none}
  header b{font-size:17px}
  h1{font-size:28px;line-height:1.2;margin-bottom:8px}
  .version{color:var(--muted);font-size:13.5px;margin-bottom:20px}
  .intro{color:var(--ink-soft);margin-bottom:22px}
  .aviso{background:#fff;border:1px solid var(--line);border-left:3px solid var(--accent);
         border-radius:12px;padding:14px 16px;color:var(--ink-soft);font-size:14.5px;margin-bottom:22px}
  nav.arriba{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:24px;font-size:14.5px}
  nav.arriba a{color:var(--accent);font-weight:600}
  .indice{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px 22px;margin-bottom:18px}
  .indice b{display:block;font-size:11px;letter-spacing:.09em;text-transform:uppercase;color:var(--muted);margin-bottom:10px}
  .indice ol{padding-left:20px;columns:2;column-gap:30px}
  .indice li{margin-bottom:6px;font-size:14px;break-inside:avoid}
  section{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:20px 22px;margin-bottom:14px;scroll-margin-top:16px}
  h2{font-size:18px;margin-bottom:10px}
  p{color:var(--ink-soft);margin-bottom:10px}
  p:last-child{margin-bottom:0}
  ol,ul{margin-top:4px;padding-left:24px;color:var(--ink-soft)}
  li{margin-bottom:8px}
  ol li::marker{color:var(--accent);font-weight:700}
  footer{margin-top:30px;color:var(--muted);font-size:13.5px}
  a{color:var(--accent)}
  @media (max-width:700px){.indice ol{columns:1}}
  @media print{
    body{background:#fff}
    nav.arriba{display:none}
    section,.indice{border:none;border-radius:0;padding:0;margin-bottom:18px;break-inside:avoid}
    .aviso{border-radius:0}
  }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <span class="badge"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="2.3" fill="#fff"/><ellipse cx="12" cy="12" rx="9.5" ry="4" stroke="#fff" stroke-width="1.5"/><ellipse cx="12" cy="12" rx="9.5" ry="4" stroke="#fff" stroke-width="1.5" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9.5" ry="4" stroke="#fff" stroke-width="1.5" transform="rotate(120 12 12)"/></svg></span>
    <b>NucleoOS</b>
  </header>

  <h1>${escapar(manual.titulo)}</h1>
  <p class="version">${escapar(chrome.version)} ${escapar(version)}</p>
  <nav class="arriba">
    <a href="/">← ${escapar(chrome.volver)}</a>
    <span>${escapar(chrome.otros)}: ${otros}</span>
  </nav>
  <p class="intro">${escapar(manual.intro)}</p>${aviso}

  <div class="indice">
    <b>${escapar(manual.indice)}</b>
    <ol>
      ${indice}
    </ol>
  </div>
${manual.secciones.map(seccionHtml).join("\n")}
  <footer>
    ${chrome.pie}
  </footer>
</div>
</body>
</html>`;
}

const { MANUAL, IDIOMAS_MANUAL, VERSION_MANUAL } = await leerManual();
const dist = join(raiz, "dist");

for (const idioma of IDIOMAS_MANUAL) {
  const chrome = CHROME[idioma];
  const archivo = chrome.ruta.slice(1) + ".html";
  await writeFile(join(dist, archivo), pagina({
    manual: MANUAL[idioma], chrome, idioma, version: VERSION_MANUAL,
  }), "utf8");
}

console.log(`postbuild: manual publicado en ${IDIOMAS_MANUAL.length} idiomas (${IDIOMAS_MANUAL.join(", ")}) ✔`);
