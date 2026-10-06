import { useMemo, useState } from "react";
import { BookOpen, Printer, Search } from "lucide-react";
import { useIdioma } from "../idioma/IdiomaProvider";
import { manualDe, VERSION_MANUAL } from "./contenido";
import type { SeccionManual } from "./tipos";

// El manual completo, dentro de la app.
//
// Lo mismo que se publica en nucleoos.app/manual, en el idioma de la persona.
// Hay dos razones para tenerlo también aquí y no solo afuera: se consulta sin
// perder la sesión, y el buscador sirve para quien no sabe cómo se llama lo
// que está buscando, que es casi todo el mundo la primera semana.

function textosDe(s: SeccionManual): string[] {
  return [s.titulo, ...s.parrafos, ...(s.pasos ?? []), ...(s.puntos ?? [])];
}

export function ManualPage() {
  const { t: tr, idioma } = useIdioma();
  const manual = manualDe(idioma);
  const [busca, setBusca] = useState("");

  const q = busca.trim().toLowerCase();
  const secciones = useMemo(() => {
    if (!q) return manual.secciones;
    return manual.secciones.filter((s) =>
      textosDe(s).some((t) => t.toLowerCase().includes(q)));
  }, [manual, q]);

  // La dirección pública, para compartirle el manual a alguien que todavía no
  // tiene cuenta. En desarrollo apunta igual al dominio: no hay otra copia.
  const publico = idioma === "es" ? "/manual" : `/manual-${idioma}`;

  return (
    <div className="page">
      <div className="page-head">
        <div className="eyebrow"><BookOpen size={13} /> {tr("Ayuda")}</div>
        <h1>{manual.titulo}</h1>
        <p>{manual.intro}</p>
      </div>

      <div className="manual-barra">
        <div className="searchbox" style={{ flex: 1, minWidth: 220 }}>
          <Search size={15} />
          <input value={busca} onChange={(e) => setBusca(e.target.value)}
            placeholder={tr("Buscar en el manual...")} aria-label={tr("Buscar en el manual...")} />
        </div>
        <button className="btn ghost" onClick={() => window.print()}>
          <Printer size={15} style={{ verticalAlign: "-2px", marginRight: 6 }} />
          {tr("Imprimir o guardar en PDF")}
        </button>
      </div>

      {!q && (
        <nav className="card pad manual-indice" aria-label={manual.indice}>
          <b className="lb">{manual.indice}</b>
          <ol>
            {manual.secciones.map((s) => (
              <li key={s.id}><a href={`#man-${s.id}`}>{s.titulo}</a></li>
            ))}
          </ol>
        </nav>
      )}

      {q && secciones.length === 0 && (
        <p style={{ color: "var(--muted)" }}>
          {tr("Nada con esa palabra. Prueba con una más corta, o escríbenos.")}
        </p>
      )}

      {secciones.map((s) => (
        <section key={s.id} id={`man-${s.id}`} className="card pad manual-sec">
          <h2>{s.titulo}</h2>
          {s.parrafos.map((p, i) => <p key={i}>{p}</p>)}
          {s.pasos && (
            <ol className="manual-pasos">
              {s.pasos.map((p, i) => <li key={i}>{p}</li>)}
            </ol>
          )}
          {s.puntos && (
            <ul className="manual-puntos">
              {s.puntos.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          )}
        </section>
      ))}

      <p className="manual-pie">
        {tr("Versión")} {VERSION_MANUAL}. {tr("Este mismo manual está publicado en")}{" "}
        <a href={publico} target="_blank" rel="noreferrer">nucleoos.app{publico}</a>
        {", "}{tr("para compartírselo a alguien que todavía no tiene cuenta.")}
      </p>
    </div>
  );
}
