// Leer un Excel (.xlsx) sin librerías.
//
// Un .xlsx es un ZIP con XML adentro. El navegador ya sabe descomprimir
// (DecompressionStream) y ya sabe leer XML (DOMParser), así que no hace falta
// sumarle un megabyte de dependencia a la app para abrir la cartola del banco.
//
// Se devuelve la primera hoja como una grilla de texto, y de ahí para arriba
// manda el mismo lector de CSV de siempre: así el reconocimiento de columnas,
// el mapeo y el detector de repetidos son exactamente los mismos.

interface Entrada { nombre: string; metodo: number; inicio: number; comprimido: number }

function leerZip(buf: ArrayBuffer): Entrada[] {
  const v = new DataView(buf);
  const bytes = new Uint8Array(buf);

  // El final del directorio central se busca desde atrás: puede traer un
  // comentario de hasta 64 KB pegado al final.
  let fin = -1;
  for (let i = bytes.length - 22; i >= 0 && i > bytes.length - 65558; i -= 1) {
    if (v.getUint32(i, true) === 0x06054b50) { fin = i; break; }
  }
  if (fin === -1) throw new Error("Ese archivo no es un Excel válido.");

  const cuantas = v.getUint16(fin + 10, true);
  let p = v.getUint32(fin + 16, true);
  const entradas: Entrada[] = [];

  for (let n = 0; n < cuantas; n += 1) {
    if (v.getUint32(p, true) !== 0x02014b50) break;
    const metodo = v.getUint16(p + 10, true);
    const comprimido = v.getUint32(p + 20, true);
    const largoNombre = v.getUint16(p + 28, true);
    const largoExtra = v.getUint16(p + 30, true);
    const largoComentario = v.getUint16(p + 32, true);
    const local = v.getUint32(p + 42, true);
    const nombre = new TextDecoder().decode(bytes.subarray(p + 46, p + 46 + largoNombre));

    // El encabezado local repite los largos, y son los que valen para saber
    // dónde empiezan los datos de verdad.
    const nombreLocal = v.getUint16(local + 26, true);
    const extraLocal = v.getUint16(local + 28, true);
    entradas.push({ nombre, metodo, inicio: local + 30 + nombreLocal + extraLocal, comprimido });

    p += 46 + largoNombre + largoExtra + largoComentario;
  }
  return entradas;
}

async function sacar(buf: ArrayBuffer, e: Entrada): Promise<string> {
  const crudo = new Uint8Array(buf, e.inicio, e.comprimido);
  if (e.metodo === 0) return new TextDecoder().decode(crudo);
  if (e.metodo !== 8) throw new Error("Ese Excel usa una compresión que no puedo abrir.");
  const flujo = new Blob([crudo]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Response(flujo).text();
}

/** La letra de la columna (A, B, ... AA) a su número. */
function columnaDe(ref: string): number {
  const letras = ref.replace(/\d+/g, "");
  let n = 0;
  for (const ch of letras) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

/** Lee la primera hoja de un .xlsx y la devuelve como filas de texto. */
export async function leerXlsx(file: File): Promise<string[][]> {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("Este navegador no puede abrir archivos Excel. Exporta la cartola como CSV.");
  }
  const buf = await file.arrayBuffer();
  const entradas = leerZip(buf);

  const hojas = entradas
    .filter((e) => /^xl\/worksheets\/sheet\d+\.xml$/.test(e.nombre))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, undefined, { numeric: true }));
  if (hojas.length === 0) throw new Error("Ese Excel no tiene ninguna hoja de datos.");

  const dom = new DOMParser();

  // Los textos no viven en la hoja: viven en una tabla aparte, y la celda
  // guarda solo el número de la fila de esa tabla.
  const compartidas: string[] = [];
  const tabla = entradas.find((e) => e.nombre === "xl/sharedStrings.xml");
  if (tabla) {
    const xml = dom.parseFromString(await sacar(buf, tabla), "application/xml");
    for (const si of Array.from(xml.getElementsByTagName("si"))) {
      // El texto de una celda puede venir partido en varios trozos con formato.
      const trozos = Array.from(si.getElementsByTagName("t")).map((t) => t.textContent ?? "");
      compartidas.push(trozos.join(""));
    }
  }

  const xml = dom.parseFromString(await sacar(buf, hojas[0]), "application/xml");
  const filas: string[][] = [];

  for (const row of Array.from(xml.getElementsByTagName("row"))) {
    const fila: string[] = [];
    for (const c of Array.from(row.getElementsByTagName("c"))) {
      const donde = columnaDe(c.getAttribute("r") ?? "");
      const tipo = c.getAttribute("t");
      let valor = "";
      if (tipo === "s") {
        const i = Number(c.getElementsByTagName("v")[0]?.textContent ?? "-1");
        valor = compartidas[i] ?? "";
      } else if (tipo === "inlineStr") {
        valor = Array.from(c.getElementsByTagName("t")).map((t) => t.textContent ?? "").join("");
      } else {
        valor = c.getElementsByTagName("v")[0]?.textContent ?? "";
      }
      if (donde >= 0) {
        while (fila.length < donde) fila.push("");
        fila[donde] = valor.trim();
      }
    }
    filas.push(fila);
  }

  return filas.filter((f) => f.some((celda) => celda !== ""));
}

/** La grilla vuelta texto CSV, para que la lea el lector de siempre. */
export function grillaACsv(filas: string[][]): string {
  return filas
    .map((f) => f.map((celda) => `"${celda.replace(/"/g, '""')}"`).join(","))
    .join("\n");
}
