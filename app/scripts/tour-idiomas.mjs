// ¿Está el tour completo en los tres idiomas?
//
// La app cae al español cuando falta una traducción, así que una frase sin
// traducir no rompe nada: simplemente le sale en español a alguien que puso
// la app en inglés, y nadie se entera hasta que lo ve un usuario. Esto lo
// revisa antes, contando cada título, cada texto y cada "para qué es".
//
//   node scripts/tour-idiomas.mjs
//
// Sale con código 1 si falta alguna, y nombra cuáles.

import { build } from "esbuild";
import { readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const salida = join(tmpdir(), `tour-idiomas-${process.pid}.mjs`);

await build({
  entryPoints: ["src/tour/guiones.ts"],
  bundle: true, format: "esm", platform: "node", outfile: salida, logLevel: "silent",
});
const { GUIONES, PROPOSITOS } = await import(salida);
rmSync(salida, { force: true });

// textos.ts es un objeto literal enorme sin dependencias: se lee con un
// import directo, sin bundle.
const salidaTextos = join(tmpdir(), `tour-textos-${process.pid}.mjs`);
await build({
  entryPoints: ["src/idioma/textos.ts"],
  bundle: true, format: "esm", platform: "node", outfile: salidaTextos, logLevel: "silent",
});
const { TEXTOS } = await import(salidaTextos);
rmSync(salidaTextos, { force: true });

// Lo que el tour pone en pantalla, todo junto.
const frases = new Set();
for (const g of Object.values(GUIONES)) {
  for (const paso of g.pasos) { frases.add(paso.titulo); frases.add(paso.texto); }
}
for (const p of Object.values(PROPOSITOS)) frases.add(p);

// Y lo que dicen los botones del motor, que no viven en los guiones.
for (const s of ["de", "Saltar", "Atrás", "Siguiente", "Listo", "Aprende a usar la app",
  "Conocer la app entera", "El recorrido completo, siete pasos cortos", "Qué es esta pantalla",
  "Esta pantalla no tiene recorrido propio", "Te muestro lo de aquí en tres o cuatro pasos",
  "Te muestro el recorrido general", "Para qué es esta sección", "Ver el recorrido",
  "paso", "pasos", "¿Primera vez? Te acompaño paso a paso."]) frases.add(s);

// En portugués "de" y "1 de 4" se escriben igual que en español, así que no
// tiene traducción propia y no es un olvido.
const iguales = { pt: new Set(["de"]) };

let malas = 0;
for (const idioma of ["en", "pt"]) {
  const faltan = [...frases].filter((f) => !TEXTOS[idioma]?.[f] && !iguales[idioma]?.has(f));
  if (faltan.length === 0) { console.log(`${idioma}: completo (${frases.size} frases)`); continue; }
  malas += faltan.length;
  console.log(`${idioma}: faltan ${faltan.length} de ${frases.size}`);
  for (const f of faltan) console.log(`   ${f.length > 90 ? f.slice(0, 90) + "…" : f}`);
}
if (malas) process.exit(1);
