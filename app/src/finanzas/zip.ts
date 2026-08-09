// Armar un ZIP sin librerías.
//
// Un ZIP guardado sin comprimir es solo: cada archivo con su encabezado, y al
// final un índice. Las fotos ya vienen comprimidas (JPG, PNG), así que
// comprimirlas de nuevo no ahorra nada y solo agrega una dependencia.

function tablaCrc(): Uint32Array {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
}
const CRC = tablaCrc();

function crc32(datos: Uint8Array<ArrayBuffer>): number {
  let c = 0xffffffff;
  for (let i = 0; i < datos.length; i += 1) c = CRC[(c ^ datos[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export interface ArchivoZip { nombre: string; datos: Uint8Array<ArrayBuffer> }

/** Un nombre de archivo que se pueda guardar en cualquier sistema. */
export function nombreSeguro(x: string): string {
  return x
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    // Un nombre no se lee mejor con "Prdr-John- Boruta- _75": los guiones y
    // espacios que quedaron pegados se juntan en uno y no cuelgan del borde.
    .replace(/[-\s]*-[-\s]*/g, "-")
    .replace(/^[-\s]+|[-\s]+$/g, "")
    .slice(0, 120);
}

export function armarZip(archivos: ArchivoZip[]): Blob {
  const enc = new TextEncoder();
  const partes: BlobPart[] = [];
  const indice: BlobPart[] = [];
  let desplazamiento = 0;

  const u16 = (v: DataView, p: number, n: number) => v.setUint16(p, n, true);
  const u32 = (v: DataView, p: number, n: number) => v.setUint32(p, n, true);

  for (const a of archivos) {
    const nombre = enc.encode(a.nombre);
    const suma = crc32(a.datos);

    // Encabezado local. Sin fecha real: la hora del ZIP no aporta nada aquí
    // y así el archivo sale igual cada vez que se exporta lo mismo.
    const cab = new DataView(new ArrayBuffer(30));
    u32(cab, 0, 0x04034b50);
    u16(cab, 4, 20);            // versión mínima
    u16(cab, 6, 0x0800);        // el nombre viene en UTF-8
    u16(cab, 8, 0);             // guardado, sin comprimir
    u32(cab, 14, suma);
    u32(cab, 18, a.datos.length);
    u32(cab, 22, a.datos.length);
    u16(cab, 26, nombre.length);
    partes.push(cab.buffer, nombre, a.datos);

    const ind = new DataView(new ArrayBuffer(46));
    u32(ind, 0, 0x02014b50);
    u16(ind, 4, 20);
    u16(ind, 6, 20);
    u16(ind, 8, 0x0800);
    u16(ind, 10, 0);
    u32(ind, 16, suma);
    u32(ind, 20, a.datos.length);
    u32(ind, 24, a.datos.length);
    u16(ind, 28, nombre.length);
    u32(ind, 42, desplazamiento);
    indice.push(ind.buffer, nombre);

    desplazamiento += 30 + nombre.length + a.datos.length;
  }

  const largoIndice = indice.reduce((s, p) => s + (p instanceof ArrayBuffer ? p.byteLength : (p as Uint8Array).length), 0);
  const fin = new DataView(new ArrayBuffer(22));
  u32(fin, 0, 0x06054b50);
  u16(fin, 8, archivos.length);
  u16(fin, 10, archivos.length);
  u32(fin, 12, largoIndice);
  u32(fin, 16, desplazamiento);

  return new Blob([...partes, ...indice, fin.buffer], { type: "application/zip" });
}
