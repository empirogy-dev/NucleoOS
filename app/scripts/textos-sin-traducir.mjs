// ¿Qué le sale en español a alguien que puso la app en inglés?
//
// La app cae al español cuando falta una traducción, así que un olvido no
// rompe nada: simplemente aparece una frase en español en medio de una
// pantalla en inglés, y nadie se entera hasta que lo ve un usuario. Así se
// encontró la guía de impuestos del T2125, en español, con la app en inglés.
//
//   node scripts/textos-sin-traducir.mjs            resumen por archivo
//   node scripts/textos-sin-traducir.mjs <archivo>  las frases de ese archivo
//   node scripts/textos-sin-traducir.mjs --claves   solo las que usan tr()
//
// Busca dos problemas distintos, que se arreglan distinto:
//
//   1. CLAVES SIN TRADUCIR: el código llama a tr("...") pero el diccionario
//      no tiene la entrada en inglés o en portugués. Se arregla agregando la
//      entrada en src/idioma/textos.ts.
//   2. TEXTO CRUDO: una frase en español que nunca pasa por tr(), ni en el
//      JSX ni en un archivo de datos. Se arregla envolviéndola y luego
//      traduciéndola.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { build } from "esbuild";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";

const IDIOMAS = ["en", "pt"];

// Archivos donde el español convive con los otros idiomas a propósito, cada
// uno con su propio revisor: no son olvidos.
// Archivos de datos cuyo texto se pinta con tr(valor): el literal vive aquí
// y la traducción en el diccionario. El escáner no puede verlo siguiendo la
// variable, así que se revisan a mano: cada campo de esta lista tiene que
// existir en el diccionario, en los dos idiomas.
const DATOS_CON_TR = [
  { modulo: "src/finanzas/impuestos.ts",
    saca: (m) => [
      ...Object.values(m.LINEAS_POR_PAIS).flat().flatMap((l) => [l.es, l.ejemplos, l.ojo]),
      ...Object.values(m.NOMBRE_PAIS), ...Object.values(m.FORMULARIO),
    ] },
  { modulo: "src/habitos/RutinasTab.tsx",
    saca: (m) => m.SUGERIDAS.flatMap((r) => [r.nombre, ...r.pasos.map((p) => p.texto)]) },
  { modulo: "src/salud/RecuperacionTab.tsx", saca: (m) => m.IDEAS_DESCANSO.map((d) => d.texto) },
  { modulo: "src/whatsapp/WhatsAppCard.tsx", saca: (m) => m.MOMENTOS.flatMap((x) => [x.label, x.desc]) },
];

const APARTE = [
  "src/idioma/",            // el diccionario mismo
  "src/tour/guiones.ts",    // se traduce al pintarlo, lo revisa tour-idiomas
  "src/manual/",            // un archivo por idioma, lo revisa manual-idiomas
  "src/legal/documentos.ts", // un documento por idioma
];

const archivos = [];
(function anda(d) {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) { anda(p); continue; }
    if (/\.(tsx|ts)$/.test(p) && !/\.d\.ts$/.test(p)) archivos.push(p);
  }
})("src");

const mirar = archivos.filter((a) => !APARTE.some((x) => a.startsWith(x)));

// ---------- El diccionario ----------
const tmp = join(tmpdir(), `textos-${process.pid}.mjs`);
await build({ entryPoints: ["src/idioma/textos.ts"], bundle: true, format: "esm",
  platform: "node", outfile: tmp, logLevel: "silent" });
const { TEXTOS } = await import(tmp);
rmSync(tmp, { force: true });

// Una clave que es solo un número, un símbolo o el trozo de una clave armada
// a pedazos (tr("tab.men." + k)) no es una frase que alguien lea.
const claveDeVerdad = (k) =>
  !/^[\d\s.,:%+-]*$/.test(k) && !/\.$/.test(k) && !/^[a-z]+\.[a-z.]*$/.test(k);

// ---------- 1. Claves que se usan pero no están traducidas ----------
const claves = new Map();
for (const a of mirar) {
  const s = readFileSync(a, "utf8");
  for (const re of [/\btr\(\s*"((?:[^"\\]|\\.)*)"/g, /\btr\(\s*'((?:[^'\\]|\\.)*)'/g]) {
    for (const m of s.matchAll(re)) {
      // La clave del diccionario es el texto ya sin escapes: una frase con
      // comillas dentro se escribe \" en el código y " en el diccionario.
      let k = m[1];
      try { k = JSON.parse('"' + m[1].replace(/"/g, '\\"') + '"'); } catch { /* como venga */ }
      if (!claves.has(k)) claves.set(k, new Set());
      claves.get(k).add(a);
    }
  }
}

// ---------- Las frases de los archivos de datos declarados ----------
const datosDeclarados = new Map();   // modulo -> [frases]
for (const d of DATOS_CON_TR) {
  const t2 = join(tmpdir(), `dato-${process.pid}-${datosDeclarados.size}.mjs`);
  await build({ entryPoints: [d.modulo], bundle: true, format: "esm",
    platform: "node", outfile: t2, logLevel: "silent",
    define: { "import.meta.env": "{}" } });
  const mod = await import(t2);
  rmSync(t2, { force: true });
  datosDeclarados.set(d.modulo, d.saca(mod).filter(Boolean));
}
const yaRevisadas = new Set([...datosDeclarados.values()].flat());

// ---------- 2. Texto en español que nunca pasa por tr() ----------
const ACENTOS = /[áéíóúñÁÉÍÓÚÑ¿¡]/;
// Nombres propios de lugares: se escriben igual en los tres idiomas.
const LUGARES = /^(Chile|Argentina|Brasil|Uruguay|Paraguay|Bolivia|Perú|Colombia|Ecuador|Venezuela|Panamá|Costa Rica|Nicaragua|Honduras|El Salvador|Guatemala|México|Cuba|España|Canadá|Estados Unidos)\b/;
const COMUNES = /\b(de|la|el|los|las|que|tu|tus|un|una|para|con|por|en|se|no|sin|más|lo|al|del|es|son|está|están|hay|tiene|tienes|puedes|cuando|como|donde|esto|esta|este|ya|todo|toda|cada|desde|hasta|pero|si|te|le|su|sus|mi|mis|aquí|así|solo|también)\b/i;
function pareceTexto(s) {
  const t = s.trim();
  if (t.length < 4) return false;
  if (!/[a-záéíóúñ]/i.test(t)) return false;
  if (/^[a-z]+([A-Z][a-z]*)+$/.test(t)) return false;   // identificadorEnCamello
  if (/^[\w.-]+$/.test(t)) return false;
  if (LUGARES.test(t)) return false;                 // clave.con.puntos
  if (/^(https?:|\/|#|data:|var\(|--)/.test(t)) return false;
  // Un trozo de código que quedó dentro de un > ... < por casualidad.
  if (/\b(const|let|useState|function|return|=>|null|undefined)\b|===|\)\s*;/.test(t)) return false;
  return ACENTOS.test(t) || (COMUNES.test(t) && t.split(/\s+/).length >= 2);
}

const crudos = [];
for (const a of mirar) {
  const bruto = readFileSync(a, "utf8");
  // Los comentarios son para quien programa, no para quien usa.
  const s = bruto.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
                 .replace(/(^|[^:])\/\/[^\n]*/g, (m, p) => p + " ".repeat(m.length - p.length));
  const lineaDe = (i) => s.slice(0, i).split("\n").length;
  const anota = (i, tipo, texto) => {
    const t = texto.trim().replace(/\s+/g, " ");
    if (pareceTexto(t) && !claves.has(t) && !yaRevisadas.has(t))
      crudos.push({ archivo: a, linea: lineaDe(i), tipo, texto: t });
  };
  for (const m of s.matchAll(/>([^<>{}]{4,})</g)) anota(m.index, "jsx", m[1]);
  for (const m of s.matchAll(/\b(placeholder|title|aria-label|alt|ariaLabel|label)\s*=\s*(["'])((?:[^"'\\]|\\.)*)\2/g)) anota(m.index, m[1], m[3]);
  for (const m of s.matchAll(/\b(placeholder|title|aria-label|alt|ariaLabel|label)\s*=\s*\{\s*(["'`])((?:[^"'`\\]|\\.)*)\2\s*\}/g)) anota(m.index, m[1], m[3]);
  for (const m of s.matchAll(/\b(label|texto|titulo|nombre|descripcion|ejemplos|ojo|oficial|es|mensaje|ayuda|sub|pie|porQue|resumen|como|nota|detalle|pregunta|frase)\s*:\s*(["'])((?:[^"'\\]|\\.)*)\2/g)) anota(m.index, "dato", m[3]);
}

// ---------- 3. Los archivos de datos que se traducen con tr(valor) ----------
const datosSinTraducir = [];
for (const [modulo, frases] of datosDeclarados) {
  for (const texto of frases) {
    for (const i of IDIOMAS) if (!TEXTOS[i]?.[texto]) datosSinTraducir.push({ modulo, idioma: i, texto });
  }
}

// ---------- Lo que se muestra ----------
const arg = process.argv[2];
const faltan = {};
for (const i of IDIOMAS) faltan[i] = [...claves.keys()].filter((k) => claveDeVerdad(k) && !TEXTOS[i]?.[k]);

if (arg && arg !== "--claves") {
  const dentro = (a) => a.includes(arg);
  console.log(`\n--- ${arg}\n`);
  for (const i of IDIOMAS) {
    const ks = faltan[i].filter((k) => [...claves.get(k)].some(dentro));
    if (ks.length) {
      console.log(`claves sin ${i} (${ks.length}):`);
      for (const k of ks) console.log("   " + JSON.stringify(k));
    }
  }
  const cs = crudos.filter((c) => dentro(c.archivo));
  if (cs.length) {
    console.log(`\ntexto crudo (${cs.length}):`);
    for (const c of cs) console.log(`   ${c.archivo}:${c.linea} [${c.tipo}] ${JSON.stringify(c.texto)}`);
  }
  process.exit(0);
}

console.log(`archivos revisados: ${mirar.length} (fuera: ${APARTE.join(", ")})`);
console.log(`claves usadas con tr(): ${claves.size}`);
for (const i of IDIOMAS) console.log(`   sin ${i}: ${faltan[i].length}`);
if (arg === "--claves") {
  for (const i of IDIOMAS) {
    console.log(`\n--- sin ${i}`);
    for (const k of faltan[i]) console.log("   " + JSON.stringify(k));
  }
  process.exit(0);
}
console.log(`texto crudo en español, sin pasar por tr(): ${crudos.length}`);
if (datosSinTraducir.length) {
  console.log(`\ndatos que se pintan con tr(valor) y no están en el diccionario: ${datosSinTraducir.length}`);
  for (const d of datosSinTraducir.slice(0, 20)) console.log(`   [${d.idioma}] ${d.modulo} ${JSON.stringify(d.texto.slice(0, 70))}`);
} else {
  console.log(`datos que se pintan con tr(valor): completos (${DATOS_CON_TR.map((d) => d.modulo).join(", ")})`);
}
console.log("");

const por = {};
for (const i of IDIOMAS) for (const k of faltan[i]) for (const a of claves.get(k)) {
  por[a] ??= { claves: new Set(), crudo: 0 };
  por[a].claves.add(k);
}
for (const c of crudos) { por[c.archivo] ??= { claves: new Set(), crudo: 0 }; por[c.archivo].crudo++; }
const filas = Object.entries(por).map(([a, v]) => [a, v.claves.size, v.crudo])
  .sort((x, y) => (y[1] + y[2]) - (x[1] + x[2]));
console.log("  clave  crudo  archivo");
for (const [a, k, c] of filas) console.log(String(k).padStart(7), String(c).padStart(6), " " + a);
