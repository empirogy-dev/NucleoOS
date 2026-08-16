// Leer un Excel antiguo (.xls) sin librerías.
//
// El .xlsx es un ZIP con XML adentro y ya lo lee `xlsx.ts`. El .xls anterior a
// 2007 es otra cosa: un sistema de archivos en miniatura (OLE2) con un stream
// binario adentro (BIFF8) hecho de registros encadenados. No se parecen en
// nada, y hay apps que todavía exportan solo así. MileIQ es una.
//
// Se escribe a mano en vez de sumar una librería porque el resto del proyecto
// ya lee ZIP y XML a mano, y porque de aquí salen kilómetros que van a una
// declaración de impuestos: prefiero código que puedo leer entero.

// ---------- El contenedor: OLE2 ----------
//
// Un .xls es un disco en miniatura. Tiene sectores de tamaño fijo, una tabla
// que dice qué sector sigue a cuál (la FAT), un directorio de "archivos", y
// una segunda tabla igual para los archivos chicos (la mini FAT). Lo que
// buscamos es un solo archivo de ahí adentro, el llamado "Workbook".

const LIBRE = 0xfffffffa; // de aquí para arriba son marcas, no sectores

interface Entrada { nombre: string; tipo: number; inicio: number; tamano: number }

function cadenaDeSectores(inicio: number, tabla: Uint32Array | number[]): number[] {
  const salida: number[] = [];
  const visto = new Set<number>();
  let n = inicio;
  while (n < LIBRE && !visto.has(n)) {
    visto.add(n);
    salida.push(n);
    n = n < tabla.length ? tabla[n] : 0xfffffffe;
  }
  return salida;
}

function leerOle(buf: ArrayBuffer): { entradas: Entrada[]; leer: (e: Entrada) => Uint8Array } {
  const v = new DataView(buf);
  const bytes = new Uint8Array(buf);
  if (bytes.length < 512 || v.getUint32(0, true) !== 0xe011cfd0) {
    throw new Error("Ese archivo no es un Excel antiguo.");
  }

  const tamSector = 1 << v.getUint16(0x1e, true);
  const tamMini = 1 << v.getUint16(0x20, true);
  const cuantasFat = v.getUint32(0x2c, true);
  const dirInicio = v.getUint32(0x30, true);
  const corteMini = v.getUint32(0x38, true);
  const miniFatInicio = v.getUint32(0x3c, true);
  const difatInicio = v.getUint32(0x44, true);
  const cuantasDifat = v.getUint32(0x48, true);

  const sector = (n: number) => bytes.subarray(512 + n * tamSector, 512 + (n + 1) * tamSector);

  // La DIFAT dice dónde están los pedazos de la FAT. Los primeros ciento nueve
  // van en la cabecera y el resto se encadena en sus propios sectores.
  const difat: number[] = [];
  for (let i = 0; i < 109; i += 1) difat.push(v.getUint32(0x4c + i * 4, true));
  let s = difatInicio;
  for (let n = 0; n < cuantasDifat && s < LIBRE; n += 1) {
    const d = sector(s);
    const dv = new DataView(d.buffer, d.byteOffset, d.byteLength);
    for (let i = 0; i < tamSector / 4 - 1; i += 1) difat.push(dv.getUint32(i * 4, true));
    s = dv.getUint32(tamSector - 4, true);
  }

  const fat: number[] = [];
  for (let i = 0; i < cuantasFat && i < difat.length; i += 1) {
    if (difat[i] >= LIBRE) continue;
    const d = sector(difat[i]);
    const dv = new DataView(d.buffer, d.byteOffset, d.byteLength);
    for (let k = 0; k < tamSector / 4; k += 1) fat.push(dv.getUint32(k * 4, true));
  }

  const juntar = (sectores: number[], tam: number) => {
    const out = new Uint8Array(sectores.length * tamSector);
    sectores.forEach((n, i) => out.set(sector(n), i * tamSector));
    return out.subarray(0, tam);
  };

  const dirs = juntar(cadenaDeSectores(dirInicio, fat), Number.MAX_SAFE_INTEGER);
  const dv = new DataView(dirs.buffer, dirs.byteOffset, dirs.byteLength);
  const entradas: Entrada[] = [];
  for (let p = 0; p + 128 <= dirs.length; p += 128) {
    const largo = dv.getUint16(p + 0x40, true);
    let nombre = "";
    for (let i = 0; i + 1 < Math.max(0, largo - 2); i += 2) {
      nombre += String.fromCharCode(dv.getUint16(p + i, true));
    }
    entradas.push({
      nombre,
      tipo: dirs[p + 0x42],
      inicio: dv.getUint32(p + 0x74, true),
      tamano: dv.getUint32(p + 0x78, true),
    });
  }

  // Los archivos chicos no viven en sectores propios: viven apretados dentro
  // de un archivo grande del directorio raíz, con su propia tabla.
  let miniStream: Uint8Array | null = null;
  let miniFat: number[] | null = null;
  const raiz = entradas.find((e) => e.tipo === 5);

  function leer(e: Entrada): Uint8Array {
    if (e.tamano >= corteMini || !raiz) return juntar(cadenaDeSectores(e.inicio, fat), e.tamano);
    if (!miniStream) miniStream = juntar(cadenaDeSectores(raiz.inicio, fat), raiz.tamano);
    if (!miniFat) {
      miniFat = [];
      for (const n of cadenaDeSectores(miniFatInicio, fat)) {
        const d = sector(n);
        const dd = new DataView(d.buffer, d.byteOffset, d.byteLength);
        for (let k = 0; k < tamSector / 4; k += 1) miniFat.push(dd.getUint32(k * 4, true));
      }
    }
    const trozos = cadenaDeSectores(e.inicio, miniFat);
    const out = new Uint8Array(trozos.length * tamMini);
    trozos.forEach((n, i) => out.set(miniStream!.subarray(n * tamMini, (n + 1) * tamMini), i * tamMini));
    return out.subarray(0, e.tamano);
  }

  return { entradas, leer };
}

// ---------- El contenido: BIFF8 ----------

interface Registro { tipo: number; datos: Uint8Array }

function registros(stream: Uint8Array): Registro[] {
  const dv = new DataView(stream.buffer, stream.byteOffset, stream.byteLength);
  const out: Registro[] = [];
  let p = 0;
  while (p + 4 <= stream.length) {
    const tipo = dv.getUint16(p, true);
    const largo = dv.getUint16(p + 2, true);
    if (p + 4 + largo > stream.length) break;
    out.push({ tipo, datos: stream.subarray(p + 4, p + 4 + largo) });
    p += 4 + largo;
  }
  return out;
}

/**
 * La tabla de textos, que puede venir partida en varios registros.
 *
 * Aquí está la trampa de todo el formato: un texto puede quedar cortado justo
 * en el borde entre dos registros, y el pedazo que sigue empieza con UN BYTE
 * nuevo que dice en qué codificación viene el resto. Leer los registros de
 * corrido, como si fueran un bloque, se come ese byte como si fuera una letra
 * y desde ahí la tabla entera queda corrida. No falla: devuelve textos
 * plausibles pero equivocados, que es bastante peor.
 */
function leerTextos(trozos: Uint8Array[]): string[] {
  let iT = 0;
  let p = 0;

  const bytes = (n: number): Uint8Array => {
    const out = new Uint8Array(n);
    let puesto = 0;
    while (puesto < n) {
      while (iT < trozos.length && p >= trozos[iT].length) { iT += 1; p = 0; }
      if (iT >= trozos.length) throw new Error("El Excel se corta antes de tiempo.");
      const toma = Math.min(trozos[iT].length - p, n - puesto);
      out.set(trozos[iT].subarray(p, p + toma), puesto);
      p += toma;
      puesto += toma;
    }
    return out;
  };
  const u8 = () => bytes(1)[0];
  const u16 = () => { const b = bytes(2); return b[0] | (b[1] << 8); };
  const u32 = () => { const b = bytes(4); return (b[0] | (b[1] << 8) | (b[2] << 16) | (b[3] << 24)) >>> 0; };

  function caracteres(cuantos: number, ancho16: boolean): string {
    let salida = "";
    let a16 = ancho16;
    while (cuantos > 0) {
      // Aquí NO se puede saltar de trozo sin más: al cruzar el corte hay que
      // consumir el byte de codificación del registro que sigue.
      if (iT < trozos.length && p >= trozos[iT].length) {
        iT += 1;
        p = 0;
        if (iT >= trozos.length) throw new Error("El Excel se corta en medio de un texto.");
        a16 = (trozos[iT][p] & 0x01) === 1;
        p += 1;
      }
      if (iT >= trozos.length) throw new Error("El Excel se corta en medio de un texto.");
      const disponibles = Math.floor((trozos[iT].length - p) / (a16 ? 2 : 1));
      if (disponibles === 0) { p = trozos[iT].length; continue; }
      const toma = Math.min(disponibles, cuantos);
      const crudo = bytes(toma * (a16 ? 2 : 1));
      for (let i = 0; i < toma; i += 1) {
        salida += String.fromCharCode(a16 ? crudo[i * 2] | (crudo[i * 2 + 1] << 8) : crudo[i]);
      }
      cuantos -= toma;
    }
    return salida;
  }

  function texto(): string {
    const n = u16();
    const flags = u8();
    const a16 = (flags & 0x01) === 1;
    const cuantosRicos = (flags & 0x08) !== 0 ? u16() : 0;
    const cuantosExtra = (flags & 0x04) !== 0 ? u32() : 0;
    const t = caracteres(n, a16);
    if (cuantosRicos) bytes(cuantosRicos * 4);
    if (cuantosExtra) bytes(cuantosExtra);
    return t;
  }

  u32();                       // cuántas referencias en total
  const unicos = u32();
  const salida: string[] = [];
  for (let i = 0; i < unicos; i += 1) salida.push(texto());
  return salida;
}

/** Un texto suelto dentro de un registro cualquiera. */
function textoSuelto(b: Uint8Array, pos: number): string {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const n = dv.getUint16(pos, true);
  const flags = b[pos + 2];
  let p = pos + 3;
  if (flags & 0x08) p += 2;
  if (flags & 0x04) p += 4;
  let out = "";
  for (let i = 0; i < n; i += 1) {
    out += String.fromCharCode(flags & 0x01 ? dv.getUint16(p + i * 2, true) : b[p + i]);
  }
  return out;
}

/** Los números chicos van comprimidos en cuatro bytes en vez de ocho. */
function numeroRk(rk: number): number {
  const entero = (rk & 0x02) !== 0;
  const porCien = (rk & 0x01) !== 0;
  let n: number;
  if (entero) {
    n = rk >> 2;
    // El bit de arriba es el signo: sin esto, un número negativo sale enorme.
    if (n & 0x20000000) n -= 0x40000000;
  } else {
    const b = new ArrayBuffer(8);
    new DataView(b).setUint32(4, rk & 0xfffffffc, true);
    n = new DataView(b).getFloat64(0, true);
  }
  return porCien ? n / 100 : n;
}

// Los formatos de fecha que Excel trae de fábrica.
const FECHAS_DE_FABRICA = new Set([
  14, 15, 16, 17, 18, 19, 20, 21, 22, 45, 46, 47,
]);

/** Excel guarda las fechas como un número de días desde 1900, con el error
 *  histórico de creer que 1900 fue bisiesto. Por eso la cuenta parte el 30 de
 *  diciembre de 1899 y no el 1 de enero de 1900. */
function fechaDeSerial(n: number): string {
  const ms = Math.round((n - 25569) * 86400000);
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return String(n);
  const iso = d.toISOString();
  return n % 1 === 0 ? iso.slice(0, 10) : `${iso.slice(0, 10)} ${iso.slice(11, 16)}`;
}

/** Lee la primera hoja de un .xls antiguo y la devuelve como filas de texto. */
export function leerXlsBuffer(buf: ArrayBuffer): string[][] {
  const { entradas, leer } = leerOle(buf);
  const libro = entradas.find((e) => e.nombre === "Workbook" || e.nombre === "Book");
  if (!libro) throw new Error("Ese Excel no tiene ninguna hoja de datos.");

  const regs = registros(leer(libro));

  // Textos
  let textos: string[] = [];
  for (let i = 0; i < regs.length; i += 1) {
    if (regs[i].tipo !== 0x00fc) continue;
    const trozos = [regs[i].datos];
    for (let j = i + 1; j < regs.length && regs[j].tipo === 0x003c; j += 1) trozos.push(regs[j].datos);
    textos = leerTextos(trozos);
    break;
  }

  // Qué estilos son fechas, para no dejar un número donde va una fecha.
  const formatos = new Map<number, string>();
  const estilos: number[] = [];
  for (const r of regs) {
    const dv = new DataView(r.datos.buffer, r.datos.byteOffset, r.datos.byteLength);
    if (r.tipo === 0x041e) formatos.set(dv.getUint16(0, true), textoSuelto(r.datos, 2));
    else if (r.tipo === 0x00e0) estilos.push(dv.getUint16(2, true));
  }
  const esFecha = (xf: number): boolean => {
    if (xf >= estilos.length) return false;
    const f = estilos[xf];
    if (FECHAS_DE_FABRICA.has(f)) return true;
    const t = formatos.get(f);
    // "0.00" y sus parientes traen una "d" de nada; se piden letras de fecha
    // que no estén dentro de un texto entre comillas.
    return !!t && /[ymdhs]/i.test(t.replace(/"[^"]*"/g, "")) && !/[#0],?[#0]/.test(t);
  };

  const celdas = new Map<string, string>();
  let maxFila = -1;
  let maxCol = -1;
  const poner = (r: number, c: number, valor: string) => {
    celdas.set(`${r}:${c}`, valor);
    if (r > maxFila) maxFila = r;
    if (c > maxCol) maxCol = c;
  };
  const ponerNumero = (r: number, c: number, xf: number, n: number) =>
    poner(r, c, esFecha(xf) ? fechaDeSerial(n) : String(n));

  for (let i = 0; i < regs.length; i += 1) {
    const { tipo, datos } = regs[i];
    if (datos.length < 6) continue;
    const dv = new DataView(datos.buffer, datos.byteOffset, datos.byteLength);
    const fila = dv.getUint16(0, true);
    const col = dv.getUint16(2, true);
    const xf = dv.getUint16(4, true);

    if (tipo === 0x00fd) {                     // texto de la tabla
      const idx = dv.getUint32(6, true);
      poner(fila, col, textos[idx] ?? "");
    } else if (tipo === 0x0204) {              // texto propio
      poner(fila, col, textoSuelto(datos, 6));
    } else if (tipo === 0x0203) {              // número de ocho bytes
      ponerNumero(fila, col, xf, dv.getFloat64(6, true));
    } else if (tipo === 0x027e) {              // número comprimido
      ponerNumero(fila, col, xf, numeroRk(dv.getUint32(6, true)));
    } else if (tipo === 0x00bd) {              // varios comprimidos seguidos
      const cuantos = Math.floor((datos.length - 6) / 6);
      for (let k = 0; k < cuantos; k += 1) {
        ponerNumero(fila, col + k, dv.getUint16(4 + k * 6, true), numeroRk(dv.getUint32(6 + k * 6, true)));
      }
    } else if (tipo === 0x0006) {              // fórmula, con su resultado guardado
      // Las dos marcas del final dicen si el resultado es un número o no.
      if (datos[12] === 0xff && datos[13] === 0xff) {
        const clase = datos[6];
        if (clase === 0 && regs[i + 1]?.tipo === 0x0207) poner(fila, col, textoSuelto(regs[i + 1].datos, 0));
        else if (clase === 1) poner(fila, col, datos[8] ? "TRUE" : "FALSE");
        else poner(fila, col, "");
      } else {
        ponerNumero(fila, col, xf, dv.getFloat64(6, true));
      }
    }
  }

  const grilla: string[][] = [];
  for (let r = 0; r <= maxFila; r += 1) {
    const fila: string[] = [];
    for (let c = 0; c <= maxCol; c += 1) fila.push((celdas.get(`${r}:${c}`) ?? "").trim());
    grilla.push(fila);
  }
  return grilla.filter((f) => f.some((celda) => celda !== ""));
}

export async function leerXls(file: File): Promise<string[][]> {
  return leerXlsBuffer(await file.arrayBuffer());
}
