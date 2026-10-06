// Los dibujos del manual.
//
// Son esquemas, no capturas de pantalla, y es a propósito. Una captura
// envejece con el primer cambio de color y obliga a rehacerla en cada idioma
// porque lleva texto adentro. Un esquema dice dónde está cada cosa y por qué,
// que es lo que alguien perdido necesita, se imprime bien en blanco y negro,
// y sus etiquetas viajan en el idioma del manual como cualquier otra frase.
//
// Cada figura recibe sus etiquetas ya traducidas y devuelve el SVG como
// texto, porque se pinta en dos lugares: la pantalla de Manual dentro de la
// app y las páginas públicas que se generan al compilar.

const esc = (s: string) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Un número en un círculo, para los pasos de una figura. */
const bolita = (x: number, y: number, n: number) => `
    <circle cx="${x}" cy="${y}" r="11" class="fig-bol" />
    <text x="${x}" y="${y + 4}" class="fig-num">${n}</text>`;

const marco = (x: number, y: number, w: number, h: number, extra = "") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8"`
  + (extra.includes("class=") ? ` ${extra}` : ` class="fig-caja" ${extra}`) + `/>`;

/** Una nota al margen. El texto se acomoda solo: la misma frase mide muy
 *  distinto en español, inglés, portugués y francés, y en SVG el texto no
 *  corta línea por su cuenta. */
const nota = (x: number, y: number, w: number, h: number, texto: string, clase = "") => `
    <foreignObject x="${x}" y="${y}" width="${w}" height="${h}">
      <div xmlns="http://www.w3.org/1999/xhtml" class="fig-nota ${clase}">${esc(texto)}</div>
    </foreignObject>`;

export interface Figura {
  /** Qué dibujo es. Las etiquetas vienen del manual, ya traducidas. */
  clave: string;
  etiquetas: string[];
}

type Dibujo = { alto: number; ancho: number; etiquetas: number; pinta: (e: string[]) => string };

export const FIGURAS: Record<string, Dibujo> = {
  // Dónde está cada cosa en la pantalla: el menú, la barra de arriba con sus
  // cuatro botones, el título con su signo de pregunta, y las tarjetas.
  pantalla: {
    ancho: 640, alto: 320, etiquetas: 4,
    pinta: (e) => `
    ${marco(4, 4, 632, 212)}
    ${marco(14, 14, 128, 192, 'class="fig-caja fig-suave"')}
    <text x="26" y="36" class="fig-tit">NucleoOS</text>
    ${[0, 1, 2, 3, 4].map((i) => `<rect x="26" y="${50 + i * 24}" width="${i === 2 ? 88 : 72}" height="9" rx="4.5" class="fig-barra" />`).join("")}
    ${bolita(78, 186, 1)}
    ${marco(154, 14, 472, 34, 'class="fig-caja fig-suave"')}
    ${[0, 1, 2, 3].map((i) => `<circle cx="${538 + i * 24}" cy="31" r="9" class="fig-punto" />`).join("")}
    ${bolita(512, 31, 2)}
    <rect x="168" y="66" width="140" height="13" rx="6.5" class="fig-barra fig-fuerte" />
    <circle cx="326" cy="72" r="11" class="fig-bol" />
    <text x="326" y="76" class="fig-num">?</text>
    ${bolita(354, 72, 3)}
    ${[0, 1, 2, 3].map((i) => marco(168 + (i % 2) * 232, 96 + Math.floor(i / 2) * 52, 212, 40, 'class="fig-caja fig-suave"')).join("")}
    ${bolita(20, 240, 1)}${nota(38, 228, 172, 70, e[0])}
    ${bolita(236, 240, 2)}${nota(254, 228, 172, 70, e[1])}
    ${bolita(452, 240, 3)}${nota(470, 228, 166, 70, e[2])}
    ${nota(8, 292, 624, 26, e[3], "fig-pie")}`,
  },

  // La ventana de importar cartola, con sus cuatro momentos numerados.
  cartola: {
    ancho: 640, alto: 310, etiquetas: 4,
    pinta: (e) => `
    ${marco(248, 4, 388, 292)}
    <rect x="248" y="4" width="388" height="26" rx="8" class="fig-barra fig-fuerte" />
    ${marco(262, 44, 178, 30, 'class="fig-caja fig-suave"')}
    ${marco(448, 44, 176, 30, 'class="fig-caja fig-suave"')}
    ${bolita(236, 59, 1)}
    ${nota(8, 40, 212, 54, e[0])}
    ${marco(262, 88, 362, 36, 'class="fig-caja fig-suave" stroke-dasharray="5 4"')}
    ${bolita(236, 106, 2)}
    ${nota(8, 88, 212, 54, e[1])}
    ${marco(262, 138, 362, 90, 'class="fig-caja fig-suave"')}
    ${[0, 1, 2, 3].map((i) => `
      <rect x="274" y="${150 + i * 20}" width="12" height="12" rx="3" class="fig-caja" />
      <rect x="294" y="${153 + i * 20}" width="${186 - i * 16}" height="7" rx="3.5" class="fig-barra" />
      <rect x="548" y="${153 + i * 20}" width="58" height="7" rx="3.5" class="fig-barra ${i === 2 ? "fig-aviso" : ""}" />`).join("")}
    ${bolita(236, 183, 3)}
    ${nota(8, 150, 212, 70, e[2])}
    ${marco(262, 244, 362, 32, 'class="fig-caja fig-fuerte"')}
    ${bolita(236, 260, 4)}
    ${nota(8, 242, 212, 54, e[3])}`,
  },

  // Las pestañas de Finanzas, agrupadas por para qué sirven.
  "finanzas-tabs": {
    ancho: 640, alto: 150, etiquetas: 4,
    pinta: (e) => {
      const anchos = [58, 76, 58, 82, 92, 52, 60, 92];
      const grupos = [[0, 1], [2, 5], [6, 7]];
      const x: number[] = [];
      anchos.reduce((acc, w, i) => { x[i] = acc; return acc + w + 6; }, 8);
      const tabs = anchos.map((w, i) =>
        marco(x[i], 44, w, 30, i === 0 ? 'class="fig-caja fig-destacado"' : 'class="fig-caja fig-suave"')).join("");
      const llaves = grupos.map(([a, b], g) => {
        const x1 = x[a], x2 = x[b] + anchos[b];
        return `
        <path d="M ${x1} 82 L ${x1} 90 L ${x2} 90 L ${x2} 82" class="fig-llave" />
        ${nota(x1, 96, x2 - x1, 80, e[g + 1], "fig-centro")}`;
      }).join("");
      return `
      <text x="8" y="28" class="fig-txt">${esc(e[0])}</text>
      ${tabs}${llaves}`;
    },
  },

  // Cómo lo que registras en cada módulo termina en Revisión y sale como un
  // informe que se le puede entregar a otra persona.
  revision: {
    ancho: 640, alto: 270, etiquetas: 3,
    pinta: (e) => {
      const mods = [0, 1, 2, 3, 4];
      const cajas = mods.map((i) => marco(8, 8 + i * 38, 140, 28, 'class="fig-caja fig-suave"')).join("");
      const flechas = mods.map((i) => `<path d="M 152 ${22 + i * 38} C 190 ${22 + i * 38}, 200 98, 240 98" class="fig-flecha" />`).join("");
      return `
      ${cajas}
      ${flechas}
      ${marco(244, 66, 150, 64, 'class="fig-caja fig-destacado"')}
      <text x="319" y="104" class="fig-txt" text-anchor="middle">${esc(e[1])}</text>
      <path d="M 398 98 L 454 98" class="fig-flecha" />
      ${marco(458, 50, 110, 96)}
      ${[0, 1, 2, 3].map((i) => `<rect x="474" y="${66 + i * 19}" width="${78 - i * 12}" height="8" rx="4" class="fig-barra" />`).join("")}
      ${nota(8, 208, 190, 58, e[0])}
      ${nota(430, 160, 170, 90, e[2])}`;
    },
  },
};

/** El SVG completo de una figura, listo para pegar en la página. */
export function dibujar(f: Figura): string {
  const d = FIGURAS[f.clave];
  if (!d) return "";
  const et = Array.from({ length: d.etiquetas }, (_, i) => f.etiquetas[i] ?? "");
  return `<svg class="manual-fig" viewBox="0 0 ${d.ancho} ${d.alto}" role="img" `
    + `aria-label="${esc(et.join(". "))}" xmlns="http://www.w3.org/2000/svg">${d.pinta(et)}</svg>`;
}

/** Cuántas etiquetas espera cada figura, para que el revisor compruebe que
 *  ninguna traducción se quedó con menos. */
export const ETIQUETAS_POR_FIGURA: Record<string, number> =
  Object.fromEntries(Object.entries(FIGURAS).map(([k, v]) => [k, v.etiquetas]));
