import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDownToLine, ArrowUpToLine, ImagePlus, RotateCcw, RotateCw, Sparkles, StickyNote, Trash2, Type } from "lucide-react";
import { TablesMissingError } from "../finanzas/data";
import { addItem, deleteItem, listItems, sembrarDesdeBucket, subirImagen, updateItem, type VisionItem } from "./data";

// Tablero de visión como collage libre: arrastra, gira, superpón y anota.
// El lienzo mide siempre lo mismo, así tu collage se ve igual en cualquier pantalla.

const ANCHO = 1200;
const ALTO = 760;
const COLORES_NOTA = ["#F6E7B2", "#F3D5C8", "#DCE8D5", "#D8E3F0", "#EBDCF0"];

/** Tipos de letra para las notas (migración 0039). */
const FUENTES: Array<{ key: string; label: string; css: string }> = [
  { key: "normal", label: "Aa", css: "var(--sans)" },
  { key: "titulo", label: "Aa", css: "var(--serif)" },
  { key: "caligrafia", label: "Aa", css: "'Segoe Script', 'Bradley Hand', 'Comic Sans MS', cursive" },
];

export function cssDeFuente(key: string | null | undefined): string {
  return FUENTES.find((f) => f.key === key)?.css ?? FUENTES[0].css;
}

type Arrastre = {
  modo: "mover" | "tamano";
  id: string;
  x0: number;
  y0: number;
  orig: { x: number; y: number; w: number; h: number };
};

export function CollageTab() {
  const [items, setItems] = useState<VisionItem[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [editando, setEditando] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [bucketFalta, setBucketFalta] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const drag = useRef<Arrastre | null>(null);
  // En pantallas angostas el lienzo se escala completo para verse entero
  // (nada se corta); el arrastre compensa la escala al mover.
  const marco = useRef<HTMLDivElement>(null);
  const [escala, setEscala] = useState(1);

  useEffect(() => {
    function medir() {
      const w = marco.current?.clientWidth ?? ANCHO;
      setEscala(Math.min(1, w / ANCHO));
    }
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, []);

  const cargar = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      await sembrarDesdeBucket();
      setItems(await listItems());
      setNeedsMigration(false);
    } catch (e) {
      if (e instanceof TablesMissingError) setNeedsMigration(true);
      else setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  function mutar(id: string, patch: Partial<VisionItem>) {
    setItems((arr) => arr.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  async function persistir(id: string, patch: Partial<VisionItem>) {
    try {
      await updateItem(id, patch);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 1500);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  function empezar(e: React.PointerEvent, it: VisionItem, modo: Arrastre["modo"]) {
    if (editando === it.id) return;
    e.preventDefault();
    e.stopPropagation();
    setSel(it.id);
    drag.current = { modo, id: it.id, x0: e.clientX, y0: e.clientY, orig: { x: it.x, y: it.y, w: it.w, h: it.h } };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function mover(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.x0) / escala;
    const dy = (e.clientY - d.y0) / escala;
    if (d.modo === "mover") {
      mutar(d.id, {
        x: Math.min(ANCHO - 80, Math.max(-d.orig.w + 80, d.orig.x + dx)),
        y: Math.min(ALTO - 60, Math.max(0, d.orig.y + dy)),
      });
    } else {
      mutar(d.id, {
        w: Math.min(900, Math.max(90, d.orig.w + dx)),
        h: Math.min(700, Math.max(70, d.orig.h + dy)),
      });
    }
  }

  function soltar() {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    const it = items.find((i) => i.id === d.id);
    if (!it) return;
    if (d.modo === "mover") void persistir(d.id, { x: it.x, y: it.y });
    else void persistir(d.id, { w: it.w, h: it.h });
  }

  const seleccionado = items.find((i) => i.id === sel) ?? null;

  // Guardar SIEMPRE al cerrar el editor: si se cierra tocando el lienzo,
  // el textarea se desmonta antes de que su blur alcance a guardar, y el
  // texto editado se perdía. Por eso el cierre pasa siempre por aquí.
  function cerrarEdicion() {
    if (!editando) return;
    const it = items.find((i) => i.id === editando);
    if (it) void persistir(it.id, { content: it.content ?? "" });
    setEditando(null);
  }

  function rotar(delta: number) {
    if (!seleccionado) return;
    const rotation = seleccionado.rotation + delta;
    mutar(seleccionado.id, { rotation });
    void persistir(seleccionado.id, { rotation });
  }

  function capa(alFrente: boolean) {
    if (!seleccionado || items.length === 0) return;
    const z = alFrente ? Math.max(...items.map((i) => i.z)) + 1 : Math.min(...items.map((i) => i.z)) - 1;
    mutar(seleccionado.id, { z });
    void persistir(seleccionado.id, { z });
  }

  function pintar(color: string) {
    if (!seleccionado || seleccionado.kind !== "nota") return;
    mutar(seleccionado.id, { color });
    void persistir(seleccionado.id, { color });
  }

  async function cambiarFuente(font: string) {
    if (!seleccionado || seleccionado.kind !== "nota") return;
    mutar(seleccionado.id, { font });
    try {
      await updateItem(seleccionado.id, { font });
      setGuardado(true);
      setTimeout(() => setGuardado(false), 1500);
    } catch {
      setErr("Para guardar el tipo de letra falta la migración 0039 (supabase/migrations/0039_estado_civil_y_fuentes.sql).");
    }
  }

  /** Negrita y tamaño de letra (migración 0041). */
  async function cambiarEstilo(patch: Partial<VisionItem>) {
    if (!seleccionado || seleccionado.kind !== "nota") return;
    mutar(seleccionado.id, patch);
    try {
      await updateItem(seleccionado.id, patch);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 1500);
    } catch {
      setErr("Para guardar negrita y tamaño de letra falta la migración 0041 (supabase/migrations/0041_vision_texto.sql).");
    }
  }

  async function eliminar() {
    if (!seleccionado) return;
    if (!window.confirm(seleccionado.kind === "nota" ? "¿Sacar esta nota del collage?" : "¿Sacar esta imagen del collage?")) return;
    try {
      await deleteItem(seleccionado);
      setItems((arr) => arr.filter((i) => i.id !== seleccionado.id));
      setSel(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setErr("La imagen pesa más de 8 MB. Prueba con una más liviana.");
      return;
    }
    setSubiendo(true);
    setErr(null);
    try {
      const path = await subirImagen(file);
      const z = items.length > 0 ? Math.max(...items.map((i) => i.z)) + 1 : 1;
      const nuevo = await addItem({
        kind: "imagen",
        path,
        x: 90 + (items.length % 5) * 40,
        y: 90 + (items.length % 4) * 34,
        w: 260,
        h: 195,
        rotation: 0,
        z,
      });
      setItems(await listItems());
      setSel(nuevo.id);
    } catch (ex) {
      if (ex instanceof Error && ex.message === "BUCKET_MISSING") setBucketFalta(true);
      else if (ex instanceof TablesMissingError) setNeedsMigration(true);
      else setErr(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setSubiendo(false);
    }
  }

  async function nuevaNota(suelto = false) {
    try {
      const z = items.length > 0 ? Math.max(...items.map((i) => i.z)) + 1 : 1;
      // El texto suelto es una nota sin fondo (color "none"): puras letras
      // sobre el lienzo, con letra de títulos, negrita y tamaño grande.
      const nota = await addItem({
        kind: "nota",
        content: suelto ? "Tu frase en grande" : "Escribe aquí tu frase",
        color: suelto ? "none" : COLORES_NOTA[items.filter((i) => i.kind === "nota").length % COLORES_NOTA.length],
        x: 120 + (items.length % 5) * 36,
        y: 120 + (items.length % 4) * 30,
        w: suelto ? 320 : 210,
        h: suelto ? 90 : 120,
        rotation: suelto ? 0 : -2,
        z,
        ...(suelto ? { font: "titulo", bold: true, font_size: 27 } : {}),
      });
      setItems((arr) => [...arr, nota]);
      setSel(nota.id);
      setEditando(nota.id);
    } catch (e) {
      if (e instanceof TablesMissingError) setNeedsMigration(true);
      else if (e instanceof Error && /bold|font_size/.test(e.message)) setErr("Para el texto suelto falta la migración 0041 (supabase/migrations/0041_vision_texto.sql).");
      else setErr(e instanceof Error ? e.message : String(e));
    }
  }

  if (needsMigration) {
    return (
      <div className="card pad" style={{ maxWidth: 640 }}>
        <h3 style={{ marginBottom: 10 }}>Un paso pendiente en Supabase</h3>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 12 }}>
          Falta la tabla del collage. Es una sola vez: abre el SQL Editor de Supabase, pega el contenido de
          <code> supabase/migrations/0017_vision_canvas.sql</code> y presiona Run. Si tampoco has corrido la 0016 (el bucket de imágenes), córrela primero.
        </p>
        <button className="btn primary" onClick={() => void cargar()}>Ya lo hice, reintentar</button>
      </div>
    );
  }

  return (
    <>
      <div className="ftabs">
        <label className="btn primary" style={{ cursor: "pointer" }}>
          <ImagePlus size={15} style={{ verticalAlign: "-2px", marginRight: 6 }} />
          {subiendo ? "Subiendo…" : "Agregar imagen"}
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={onFile} disabled={subiendo} />
        </label>
        <button className="btn ghost" onClick={() => void nuevaNota()}>
          <StickyNote size={15} style={{ verticalAlign: "-2px", marginRight: 6 }} />
          Agregar nota
        </button>
        <button className="btn ghost" onClick={() => void nuevaNota(true)}>
          <Type size={15} style={{ verticalAlign: "-2px", marginRight: 6 }} />
          Agregar texto
        </button>
        <span style={{ flex: 1 }} />
        {guardado && <span className="chip">✓ Guardado</span>}
      </div>

      {bucketFalta && (
        <div className="card pad" style={{ borderLeft: "3px solid var(--warn)", marginBottom: 14, maxWidth: 640 }}>
          <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>
            Para subir imágenes falta el bucket: corre <code>supabase/migrations/0016_vision_board.sql</code> en el SQL Editor.
          </p>
        </div>
      )}
      {err && <div className="card pad" style={{ borderLeft: "3px solid var(--err)", marginBottom: 14 }}>{err}</div>}

      {seleccionado && (
        <div className="vc-toolbar">
          <button className="vc-tool" title="Traer al frente" onClick={() => capa(true)}><ArrowUpToLine size={15} /></button>
          <button className="vc-tool" title="Enviar atrás" onClick={() => capa(false)}><ArrowDownToLine size={15} /></button>
          <button className="vc-tool" title="Girar a la izquierda" onClick={() => rotar(-8)}><RotateCcw size={15} /></button>
          <button className="vc-tool" title="Girar a la derecha" onClick={() => rotar(8)}><RotateCw size={15} /></button>
          {seleccionado.kind === "nota" && COLORES_NOTA.map((c) => (
            <button key={c} className="vc-color" style={{ background: c }} title="Color de la nota" onClick={() => pintar(c)} />
          ))}
          {seleccionado.kind === "nota" && FUENTES.map((f) => (
            <button key={f.key} className="vc-tool"
              title={f.key === "normal" ? "Letra normal" : f.key === "titulo" ? "Letra de títulos" : "Letra de caligrafía"}
              style={{ fontFamily: f.css, fontSize: 14, width: "auto", padding: "0 9px", outline: (seleccionado.font ?? "normal") === f.key ? "2px solid var(--accent)" : "none" }}
              onClick={() => void cambiarFuente(f.key)}>
              {f.label}
            </button>
          ))}
          {seleccionado.kind === "nota" && (
            <>
              <button className="vc-tool" title={seleccionado.bold ? "Quitar negrita" : "Negrita"}
                style={{ fontWeight: 800, fontSize: 14, outline: seleccionado.bold ? "2px solid var(--accent)" : "none" }}
                onClick={() => void cambiarEstilo({ bold: !seleccionado.bold })}>
                B
              </button>
              <button className="vc-tool" title="Letra más chica" style={{ fontSize: 11.5, width: "auto", padding: "0 8px" }}
                onClick={() => void cambiarEstilo({ font_size: Math.max(11, (seleccionado.font_size ?? 15) - 3) })}>
                A−
              </button>
              <button className="vc-tool" title="Letra más grande" style={{ fontSize: 14, width: "auto", padding: "0 8px" }}
                onClick={() => void cambiarEstilo({ font_size: Math.min(64, (seleccionado.font_size ?? 15) + 3) })}>
                A+
              </button>
              <button className="vc-tool" title={seleccionado.color === "none" ? "Ponerle fondo de nota" : "Dejar el texto suelto, sin fondo"}
                style={{ fontSize: 11.5, width: "auto", padding: "0 9px", outline: seleccionado.color === "none" ? "2px solid var(--accent)" : "none" }}
                onClick={() => pintar(seleccionado.color === "none" ? COLORES_NOTA[0] : "none")}>
                Sin fondo
              </button>
            </>
          )}
          <span style={{ flex: 1 }} />
          <button className="vc-tool peligro" title="Eliminar" onClick={() => void eliminar()}><Trash2 size={15} /></button>
        </div>
      )}

      <div className="vcanvas-scroll" ref={marco} style={{ overflow: escala < 1 ? "hidden" : "auto" }}>
        <div style={{ width: ANCHO * escala, height: ALTO * escala }}>
        <div
          className="vcanvas"
          style={{ width: ANCHO, height: ALTO, transform: `scale(${escala})`, transformOrigin: "top left" }}
          onPointerDown={() => { cerrarEdicion(); setSel(null); }}
        >
          {loading && <p style={{ color: "var(--muted)", padding: 20 }}>Cargando tu collage…</p>}
          {!loading && items.length === 0 && (
            <div className="vc-vacio">
              <Sparkles size={22} />
              <p>Tu lienzo está listo. Sube imágenes de lo que proyectas, agrégales frases y arma tu collage: todo se puede mover, girar y superponer.</p>
            </div>
          )}
          {items.map((it) => (
            <div
              key={it.id}
              className={"vc-item" + (sel === it.id ? " sel" : "") + (it.kind === "nota" ? " nota" : "")}
              style={{
                left: it.x,
                top: it.y,
                width: it.w,
                height: it.h,
                transform: `rotate(${it.rotation}deg)`,
                zIndex: it.z + 10,
                // Las imágenes van sin fondo ni sombra de caja: un PNG
                // transparente se ve como sticker, no como tarjeta. El texto
                // suelto (color "none") tampoco lleva fondo: puras letras.
                background: it.kind === "nota" && it.color !== "none" ? it.color ?? COLORES_NOTA[0] : "transparent",
                boxShadow: it.kind === "imagen" || it.color === "none" ? "none" : undefined,
              }}
              onPointerDown={(e) => empezar(e, it, "mover")}
              onPointerMove={mover}
              onPointerUp={soltar}
              onDoubleClick={() => { if (it.kind === "nota") { setSel(it.id); setEditando(it.id); } }}
            >
              {it.kind === "imagen" ? (
                it.url
                  ? <img src={it.url} alt="Imagen de tu tablero de visión" draggable={false} loading="lazy" style={{ objectFit: "contain" }} />
                  : <div className="vc-cargando">🖼️</div>
              ) : editando === it.id ? (
                <textarea
                  autoFocus
                  value={it.content ?? ""}
                  style={{ fontFamily: cssDeFuente(it.font), fontWeight: it.bold ? 700 : undefined, fontSize: it.font_size ?? undefined }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onChange={(e) => mutar(it.id, { content: e.target.value })}
                  onBlur={() => cerrarEdicion()}
                />
              ) : (
                <span className="vc-texto" style={{ fontFamily: cssDeFuente(it.font), fontWeight: it.bold ? 700 : undefined, fontSize: it.font_size ?? undefined }}>{it.content}</span>
              )}
              {sel === it.id && (
                <div
                  className="vc-handle"
                  title="Arrastra para cambiar el tamaño"
                  onPointerDown={(e) => empezar(e, it, "tamano")}
                  onPointerMove={mover}
                  onPointerUp={soltar}
                />
              )}
            </div>
          ))}
        </div>
        </div>
      </div>
      <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 10 }}>
        Toca un elemento para seleccionarlo: arriba aparecen sus controles. Arrastra para moverlo, usa la esquina para el tamaño y doble clic en una nota para editar su texto. Todo se guarda solo.
      </p>
    </>
  );
}
