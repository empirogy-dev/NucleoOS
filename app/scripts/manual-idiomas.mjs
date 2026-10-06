// ¿Dice el manual lo mismo en los cuatro idiomas?
//
// No compara las frases, que para eso están escritas a mano, sino la
// estructura: las mismas secciones, en el mismo orden, con la misma cantidad
// de párrafos, pasos y viñetas. Una traducción a la que se le cayó un paso de
// la importación de cartola no se ve rota, se ve corta, y eso no lo pilla
// nadie leyendo.
//
//   node scripts/manual-idiomas.mjs

import { build } from "esbuild";
import { readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const salida = join(tmpdir(), `manual-idiomas-${process.pid}.mjs`);
await build({
  entryPoints: ["src/manual/contenido.ts"],
  bundle: true, format: "esm", platform: "node", outfile: salida, logLevel: "silent",
});
const { MANUAL, IDIOMAS_MANUAL } = await import(salida);
rmSync(salida, { force: true });

const base = MANUAL.es;
const forma = (s) => `${s.parrafos.length}p/${(s.pasos ?? []).length}n/${(s.puntos ?? []).length}v`;

let malo = 0;
for (const idioma of IDIOMAS_MANUAL) {
  const m = MANUAL[idioma];
  const fallas = [];
  if (!m.titulo || !m.intro || !m.indice) fallas.push("falta título, intro o índice");
  if (m.secciones.length !== base.secciones.length)
    fallas.push(`${m.secciones.length} secciones, el español tiene ${base.secciones.length}`);
  base.secciones.forEach((s, i) => {
    const o = m.secciones[i];
    if (!o) return;
    if (o.id !== s.id) fallas.push(`sección ${i + 1}: id ${o.id}, se esperaba ${s.id}`);
    if (forma(o) !== forma(s)) fallas.push(`${s.id}: ${forma(o)}, el español tiene ${forma(s)}`);
    if (!o.titulo.trim()) fallas.push(`${s.id}: sin título`);
    for (const t of [...o.parrafos, ...(o.pasos ?? []), ...(o.puntos ?? [])]) {
      if (!t.trim()) fallas.push(`${s.id}: un texto vacío`);
      // El guion como puntuación está prohibido por DESIGN.md, y se cuela
      // solo al traducir, sobre todo al inglés.
      if (/[–—]/.test(t)) fallas.push(`${s.id}: lleva guion largo`);
    }
  });
  if (fallas.length) {
    malo += fallas.length;
    console.log(`${idioma}: ${fallas.length} problemas`);
    for (const f of fallas) console.log("   " + f);
  } else {
    const n = m.secciones.reduce((a, s) => a + s.parrafos.length + (s.pasos ?? []).length + (s.puntos ?? []).length, 0);
    console.log(`${idioma}: ${m.secciones.length} secciones, ${n} textos ✔`);
  }
}
if (malo) process.exit(1);
