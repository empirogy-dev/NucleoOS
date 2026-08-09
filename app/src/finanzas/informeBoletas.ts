// El informe de comprobantes: una tabla ordenada con sus totales, y después
// cada boleta con su foto.
//
// Se arma como una página para imprimir y de ahí sale el PDF, en vez de sumar
// una librería de PDF de medio megabyte. El motor de impresión del navegador
// ya sabe paginar, cortar bien las tablas y guardar como PDF, y lo hace mejor
// de lo que lo haría yo a mano.
//
// Las imágenes van pegadas como datos dentro del documento, no como enlaces.
// Los enlaces del bucket vencen, y una boleta que se ve hoy y mañana no, en un
// papel que uno le manda al contador, no sirve de nada.

export interface FilaInforme {
  fecha: string;
  comercio: string;
  categoria: string;
  etiquetas: string;
  monto: number;
  moneda: string;
  archivo: string;
  /** La foto ya convertida a datos. Vacío si el comprobante es un PDF. */
  imagen: string | null;
}

export interface CabezaInforme {
  titulo: string;
  filtros: string;
  generado: string;
}

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const plata = (n: number, moneda: string): string =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: moneda, currencyDisplay: "code" }).format(n);

/** Trae la imagen y la vuelve datos, para que viaje dentro del documento. */
export async function aDatos(url: string): Promise<string | null> {
  try {
    const blob = await (await fetch(url)).blob();
    return await new Promise((listo) => {
      const r = new FileReader();
      r.onload = () => listo(typeof r.result === "string" ? r.result : null);
      r.onerror = () => listo(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export function armarInforme(cabeza: CabezaInforme, filas: FilaInforme[]): string {
  // Los totales van por moneda, nunca sumados entre ellas: juntar dólares
  // canadienses con pesos chilenos daría un número que no existe.
  const totales = new Map<string, number>();
  for (const f of filas) totales.set(f.moneda, (totales.get(f.moneda) ?? 0) + f.monto);

  // Agrupadas por categoría, con su subtotal: así se lee de corrido y se
  // entiende en qué se fue la plata sin tener que sumar a mano.
  const porCategoria = new Map<string, FilaInforme[]>();
  for (const f of filas) {
    const clave = f.categoria || "Sin categoría";
    porCategoria.set(clave, [...(porCategoria.get(clave) ?? []), f]);
  }

  const tabla = [...porCategoria.entries()].map(([cat, suyas]) => {
    const sub = new Map<string, number>();
    for (const f of suyas) sub.set(f.moneda, (sub.get(f.moneda) ?? 0) + f.monto);
    return `
      <tr class="grupo"><td colspan="5">${esc(cat)}</td></tr>
      ${suyas.map((f) => `
        <tr>
          <td class="fecha">${esc(f.fecha)}</td>
          <td>${esc(f.comercio)}</td>
          <td class="tag">${esc(f.etiquetas)}</td>
          <td class="num">${esc(plata(f.monto, f.moneda))}</td>
          <td class="arch">${esc(f.archivo)}</td>
        </tr>`).join("")}
      <tr class="sub">
        <td colspan="3">Subtotal ${esc(cat)}</td>
        <td class="num" colspan="2">${[...sub.entries()].map(([m, n]) => esc(plata(n, m))).join(" · ")}</td>
      </tr>`;
  }).join("");

  const fotos = filas.map((f, i) => `
    <section class="boleta">
      <h3>${i + 1}. ${esc(f.comercio)} <span>${esc(f.fecha)} · ${esc(plata(f.monto, f.moneda))}${f.categoria ? ` · ${esc(f.categoria)}` : ""}${f.etiquetas ? ` · ${esc(f.etiquetas)}` : ""}</span></h3>
      ${f.imagen
        ? `<img src="${f.imagen}" alt="${esc(f.archivo)}">`
        : `<p class="nofoto">Este comprobante es un archivo (${esc(f.archivo)}) y no se puede pegar aquí. Va aparte.</p>`}
    </section>`).join("");

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>${esc(cabeza.titulo)}</title>
<style>
  @page { margin: 16mm; }
  * { box-sizing: border-box; }
  body { font: 12px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; color: #17202a; margin: 0; }
  header { border-bottom: 2px solid #17202a; padding-bottom: 10px; margin-bottom: 16px; }
  h1 { font-size: 19px; margin: 0 0 4px; }
  header p { margin: 0; color: #667; font-size: 11.5px; }
  table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
  th { text-align: left; border-bottom: 1.5px solid #17202a; padding: 6px 6px; font-size: 10.5px;
       text-transform: uppercase; letter-spacing: .06em; }
  td { padding: 5px 6px; border-bottom: 1px solid #e6e8ec; vertical-align: top; }
  tr.grupo td { background: #f2f4f7; font-weight: 600; padding-top: 8px; }
  tr.sub td { font-weight: 600; border-bottom: 1.5px solid #cfd4dc; }
  .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .fecha { white-space: nowrap; }
  .tag, .arch { color: #667; }
  .arch { font-size: 10.5px; word-break: break-all; }
  tfoot td { padding-top: 10px; font-size: 13px; font-weight: 700; border: 0; }
  .boleta { page-break-before: always; break-before: page; }
  .boleta h3 { font-size: 13px; margin: 0 0 8px; border-bottom: 1px solid #e6e8ec; padding-bottom: 6px; }
  .boleta h3 span { font-weight: 400; color: #667; font-size: 11.5px; }
  .boleta img { max-width: 100%; max-height: 225mm; object-fit: contain; }
  .nofoto { color: #667; font-style: italic; }
  @media screen { body { max-width: 900px; margin: 24px auto; padding: 0 20px; } }
</style></head>
<body>
  <header>
    <h1>${esc(cabeza.titulo)}</h1>
    <p>${esc(cabeza.filtros)} · ${filas.length} ${filas.length === 1 ? "comprobante" : "comprobantes"} · Generado el ${esc(cabeza.generado)}</p>
  </header>

  <table>
    <thead><tr><th>Fecha</th><th>Comercio</th><th>Etiquetas</th><th class="num">Monto</th><th>Comprobante</th></tr></thead>
    <tbody>${tabla}</tbody>
    <tfoot><tr>
      <td colspan="3">Total</td>
      <td class="num" colspan="2">${[...totales.entries()].map(([m, n]) => esc(plata(n, m))).join(" · ")}</td>
    </tr></tfoot>
  </table>

  ${fotos}
</body></html>`;
}
