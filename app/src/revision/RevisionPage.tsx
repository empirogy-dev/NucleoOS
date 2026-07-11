import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ClipboardCopy, LineChart, Sparkles } from "lucide-react";
import { iaConfigured, resumenRevision } from "../lib/ia";
import {
  armarDia,
  armarResumen,
  buscarPatrones,
  diaDe,
  mesDe,
  semanaDe,
  type ModuloResumen,
  type Patron,
  type Periodo,
} from "./data";

// Revisión: la app no solo guarda, también explica.
// La agenda día a día, resúmenes por semana o mes, y patrones entre módulos.

type Tab = "dia" | "semana" | "mes" | "patrones";

export function RevisionPage() {
  const [tab, setTab] = useState<Tab>("semana");
  const [offset, setOffset] = useState(0);
  const [modulos, setModulos] = useState<ModuloResumen[]>([]);
  const [markdown, setMarkdown] = useState("");
  const [patrones, setPatrones] = useState<Patron[]>([]);
  const [loading, setLoading] = useState(true);
  const [narrativa, setNarrativa] = useState<string | null>(null);
  const [pensando, setPensando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const periodo: Periodo = tab === "dia" ? diaDe(offset) : tab === "mes" ? mesDe(offset) : semanaDe(offset);

  const cargar = useCallback(async () => {
    setLoading(true);
    setNarrativa(null);
    setError(null);
    try {
      if (tab === "patrones") {
        setPatrones(await buscarPatrones());
      } else if (tab === "dia") {
        const { modulos: m, markdown: md } = await armarDia(diaDe(offset).desde);
        setModulos(m);
        setMarkdown(md);
      } else {
        const p = tab === "mes" ? mesDe(offset) : semanaDe(offset);
        const { modulos: m, markdown: md } = await armarResumen(p);
        setModulos(m);
        setMarkdown(md);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [tab, offset]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function narrar() {
    setPensando(true);
    setError(null);
    try {
      const texto = modulos.map((m) => `${m.titulo}: ${m.lineas.map((l) => `${l.k} ${l.v}`).join(", ")}`).join("\n");
      setNarrativa(await resumenRevision(`Período: ${periodo.etiqueta}\n${texto}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPensando(false);
    }
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(markdown + (narrativa ? `\n## 🪄 Lectura del período\n${narrativa}\n` : ""));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setError("No pude copiar al portapapeles en este navegador.");
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div className="eyebrow"><LineChart size={13} /> Panorama</div>
        <h1>Revisión</h1>
        <p>Lo que registras, convertido en claridad: tu día como agenda, tu semana, tu mes y los patrones entre módulos.</p>
      </div>

      <div className="ftabs">
        <button className={"ftab" + (tab === "dia" ? " active" : "")} onClick={() => { setTab("dia"); setOffset(0); }}>Día</button>
        <button className={"ftab" + (tab === "semana" ? " active" : "")} onClick={() => { setTab("semana"); setOffset(0); }}>Semana</button>
        <button className={"ftab" + (tab === "mes" ? " active" : "")} onClick={() => { setTab("mes"); setOffset(0); }}>Mes</button>
        <button className={"ftab" + (tab === "patrones" ? " active" : "")} onClick={() => setTab("patrones")}>Patrones</button>
      </div>

      {error && <div className="card pad" style={{ borderLeft: "3px solid var(--err)", marginBottom: 14 }}>{error}</div>}

      {tab !== "patrones" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <button className="iconbtn" style={{ width: 32, height: 32 }} aria-label="Período anterior" onClick={() => setOffset(offset + 1)}>
              <ChevronLeft size={15} />
            </button>
            <b style={{ fontSize: 14 }}>{periodo.etiqueta}</b>
            <button className="iconbtn" style={{ width: 32, height: 32 }} aria-label="Período siguiente" disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - 1))}>
              <ChevronRight size={15} />
            </button>
            <span style={{ flex: 1 }} />
            {iaConfigured && (
              <button className="btn ghost" disabled={pensando || loading} onClick={() => void narrar()}>
                <Sparkles size={14} style={{ verticalAlign: "-2px", marginRight: 5 }} />
                {pensando ? "Leyendo tu período…" : "Lectura con IA"}
              </button>
            )}
            <button className="btn ghost" disabled={loading} onClick={() => void copiar()}>
              <ClipboardCopy size={14} style={{ verticalAlign: "-2px", marginRight: 5 }} />
              {copiado ? "✓ Copiado" : "Copiar para Notion"}
            </button>
          </div>

          {copiado && (
            <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: -6, marginBottom: 12 }}>
              El reporte quedó en tu portapapeles como Markdown: pégalo en Notion, en una nota o donde quieras.
            </p>
          )}

          {narrativa && (
            <div className="coach-msg" style={{ maxWidth: 720 }}>{narrativa}</div>
          )}

          {loading ? (
            <p style={{ color: "var(--muted)" }}>Reuniendo tu período…</p>
          ) : modulos.length === 0 ? (
            <div className="card pad" style={{ maxWidth: 640 }}>
              <p style={{ color: "var(--muted)", fontSize: 14 }}>
                {tab === "dia"
                  ? "Este día no tiene registros todavía. Cada comida, vaso de agua, práctica o hábito que marques queda guardado en su fecha, y esta página se convierte en tu agenda."
                  : "Aún no hay datos en este período. Todo lo que registres en los módulos aparecerá aquí, ordenado."}
              </p>
            </div>
          ) : (
            <div className="rev-grid">
              {modulos.map((m) => (
                <div className="card panel" key={m.titulo}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 20 }}>{m.emoji}</span>
                    <h3 style={{ margin: 0, flex: 1 }}>{m.titulo}</h3>
                    <Link to={m.to} style={{ fontSize: 12, color: "var(--accent-ink)", fontWeight: 600 }}>abrir</Link>
                  </div>
                  {m.lineas.map((l) => (
                    <div key={l.k} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "5px 0", borderBottom: "1px solid var(--line-soft)", fontSize: 13 }}>
                      <span style={{ color: "var(--muted)" }}>{l.k}</span>
                      <b className="tnum" style={{ textAlign: "right" }}>{l.v}</b>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "patrones" && (
        <>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14, maxWidth: "62ch" }}>
            Cruces de tus últimos 30 días. No son diagnósticos, son espejos: mientras más registres, más nítidos se ponen.
          </p>
          {loading ? (
            <p style={{ color: "var(--muted)" }}>Buscando patrones…</p>
          ) : (
            <div style={{ display: "grid", gap: 12, maxWidth: 720 }}>
              {patrones.map((p) => (
                <div className="card pad" key={p.titulo} style={{ display: "flex", gap: 12, alignItems: "flex-start", opacity: p.conDatos ? 1 : 0.75 }}>
                  <span style={{ fontSize: 22 }}>{p.emoji}</span>
                  <div>
                    <b style={{ fontSize: 14 }}>{p.titulo}</b>
                    <p style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.55, marginTop: 3 }}>{p.texto}</p>
                  </div>
                </div>
              ))}
              <p style={{ fontSize: 12.5, color: "var(--muted)" }}>
                Los patrones usan tu energía percibida como termómetro. Márcala cada día en Energía → Hoy y esto se vuelve mucho más certero.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
