import { fmtFechaLocal, hoyLocal } from "../lib/fechas";
import { useIdioma } from "../idioma/IdiomaProvider";
import { CATEGORIAS_MENTE, PRACTICAS, listSesiones, type Sesion } from "./practicas";

// Insights de Mente: qué te dice tu propia práctica.
// Todo se calcula de tus sesiones, sin juicio, solo espejo.

function hace(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return fmtFechaLocal(d);
}

function rachaDias(sesiones: Sesion[]): number {
  const fechas = new Set(sesiones.map((s) => s.fecha));
  const d = new Date();
  if (!fechas.has(hoyLocal())) d.setDate(d.getDate() - 1);
  let racha = 0;
  while (fechas.has(fmtFechaLocal(d))) {
    racha += 1;
    d.setDate(d.getDate() - 1);
  }
  return racha;
}

export function InsightsTab() {
  const { t: tr } = useIdioma();
  const sesiones = listSesiones();

  const semana = sesiones.filter((s) => s.fecha >= hace(6));
  const semanaAnterior = sesiones.filter((s) => s.fecha >= hace(13) && s.fecha < hace(6));
  const minSemana = semana.reduce((a, s) => a + s.minutos, 0);
  const minAnterior = semanaAnterior.reduce((a, s) => a + s.minutos, 0);
  const racha = rachaDias(sesiones);

  // Práctica favorita de los últimos 30 días.
  const cuenta = new Map<string, number>();
  for (const s of sesiones.filter((x) => x.fecha >= hace(29))) {
    cuenta.set(s.nombre, (cuenta.get(s.nombre) ?? 0) + 1);
  }
  let favorita: string | null = null;
  for (const [nombre, n] of cuenta) {
    if (favorita === null || n > (cuenta.get(favorita) ?? 0)) favorita = nombre;
  }

  // Sesiones por categoría (30 días).
  const porCategoria = new Map<string, number>();
  for (const s of sesiones.filter((x) => x.fecha >= hace(29))) {
    const practica = PRACTICAS.find((p) => p.id === s.id);
    const key = s.id.startsWith("sadhana") ? "sadhana" : practica?.categoria ?? "mindfulness";
    porCategoria.set(key, (porCategoria.get(key) ?? 0) + 1);
  }
  const categorias = [
    ...CATEGORIAS_MENTE.map((c) => ({ ...c, n: porCategoria.get(c.key) ?? 0 })),
    { key: "sadhana", emoji: "🕉", label: "Sadhana", descripcion: "Tu práctica central.", n: porCategoria.get("sadhana") ?? 0 },
  ];
  const maxCat = Math.max(1, ...categorias.map((c) => c.n));
  const masVisitada = categorias.reduce((a, b) => (b.n > a.n ? b : a));

  // Minutos por semana, últimas 4 semanas (cada semana son 7 días hacia atrás).
  const barras = Array.from({ length: 4 }, (_, i) => {
    const ini = hace(6 + i * 7);
    const fin = hace(i * 7);
    const del = sesiones.filter((s) => s.fecha >= ini && s.fecha <= fin);
    return { etiqueta: i === 0 ? tr("Esta semana") : i === 1 ? tr("Hace 1 semana") : `${tr("Hace")} ${i} ${tr("semanas")}`, minutos: del.reduce((a, s) => a + s.minutos, 0) };
  });
  const maxMin = Math.max(1, ...barras.map((b) => b.minutos));

  if (sesiones.length === 0) {
    return (
      <div className="card pad" style={{ maxWidth: 640 }}>
        <p style={{ color: "var(--muted)", fontSize: 14 }}>
          {tr("Aún no hay sesiones registradas, así que no hay espejo que mostrar. Después de tus primeras prácticas, aquí verás tus ritmos, tu práctica favorita y hacia dónde se inclina tu mente.")}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="statrow" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
        <div className="card stat"><div className="k">{tr("Minutos esta semana")}</div><div className="v tnum">{minSemana}</div></div>
        <div className="card stat"><div className="k">{tr("Semana anterior")}</div><div className="v tnum">{minAnterior}</div></div>
        <div className="card stat"><div className="k">{tr("Racha de práctica")}</div><div className="v tnum">{racha > 0 ? `🔥 ${racha}` : "0"} <small style={{ fontSize: 13, color: "var(--muted)" }}>{tr("días")}</small></div></div>
        <div className="card stat"><div className="k">{tr("Tu favorita")}</div><div className="v" style={{ fontSize: 17 }}>{favorita ? tr(favorita) : tr("aún ninguna")}</div></div>
      </div>

      <div className="panelgrid">
        <div className="card panel" style={{ alignSelf: "start" }}>
          <h3>{tr("🧭 Hacia dónde se inclina tu mente")}</h3>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
            {tr("Sesiones por vía en los últimos 30 días.")}
          </p>
          {categorias.map((c) => (
            <div className="bar" key={c.key}>
              <div className="top">
                <span className="lbl">{tr(c.label)}</span>
                <b className="tnum">{c.n}</b>
              </div>
              <div className="track">
                <div className="fill" style={{ width: `${(c.n / maxCat) * 100}%`, background: "var(--men)" }} />
              </div>
            </div>
          ))}
          {masVisitada.n > 0 && (
            <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 12, lineHeight: 1.5 }}>
              {tr("Tu vía más visitada es")} <b>{tr(masVisitada.label)}</b>. {tr(masVisitada.descripcion)} {tr("Eso también es información: tu mente sabe qué está buscando.")}
            </p>
          )}
        </div>

        <div className="card panel" style={{ alignSelf: "start" }}>
          <h3>{tr("📈 Tu ritmo de práctica")}</h3>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
            {tr("Minutos por semana, las últimas cuatro.")}
          </p>
          {barras.map((b) => (
            <div className="bar" key={b.etiqueta}>
              <div className="top">
                <span>{b.etiqueta}</span>
                <b className="tnum">{b.minutos} min</b>
              </div>
              <div className="track">
                <div className="fill" style={{ width: `${(b.minutos / maxMin) * 100}%`, background: "var(--men)" }} />
              </div>
            </div>
          ))}
          <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 12, lineHeight: 1.5 }}>
            {minSemana >= minAnterior
              ? tr("Vas sosteniendo o subiendo tu práctica. La constancia le gana a la intensidad. 🌱")
              : tr("Esta semana bajó un poco. Sin culpa: una sesión de dos minutos hoy ya reactiva el ritmo.")}
          </p>
        </div>
      </div>
    </>
  );
}
