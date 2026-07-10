import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDownToLine, ArrowUpToLine, ImagePlus, RotateCcw, RotateCw, Sparkles, StickyNote, Trash2 } from "lucide-react";
import { TablesMissingError } from "../finanzas/data";
import { addItem, deleteItem, listItems, sembrarDesdeBucket, subirImagen, updateItem, type VisionItem } from "./data";

// Tablero de visión como collage libre: arrastra, gira, superpón y anota.
// El lienzo mide siempre lo mismo, así tu collage se ve igual en cualquier pantalla.

const ANCHO = 1200;
const ALTO = 760;
const COLORES_NOTA = ["#F6E7B2", "#F3D5C8", "#DCE8D5", "#D8E3F0", "#EBDCF0"];

type Arrastre = {
  modo: "mover" | "tamano";
  id: string;
  x0: number;
  y0: number;
  orig: { x: number; y: number; w: number; h: number };
};

export function VisionPage() {
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
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
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

  async function nuevaNota() {
    try {
      const z = items.length > 0 ? Math.max(...items.map((i) => i.z)) + 1 : 1;
      const nota = await addItem({
        kind: "nota",
        content: "Escribe aquí tu frase",
        color: COLORES_NOTA[items.filter((i) => i.kind === "nota").length % COLORES_NOTA.length],
        x: 120 + (items.length % 5) * 36,
        y: 120 + (items.length % 4) * 30,
        w: 210,
        h: 120,
        rotation: -2,
        z,
      });
      setItems((arr) => [...arr, nota]);
      setSel(nota.id);
      setEditando(nota.id);
    } catch (e) {
      if (e instanceof TablesMissingError) setNeedsMigration(true);
      else setErr(e instanceof Error ? e.message : String(e));
    }
  }

  if (needsMigration) {
    return (
      <div className="page">
        <Head />
        <div className="card pad" style={{ maxWidth: 640 }}>
          <h3 style={{ marginBottom: 10 }}>Un paso pendiente en Supabase</h3>
          <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 12 }}>
            Falta la tabla del collage. Es una sola vez: abre el SQL Editor de Supabase, pega el contenido de
            <code> supabase/migrations/0017_vision_canvas.sql</code> y presiona Run. Si tampoco has corrido la 0016 (el bucket de imágenes), córrela primero.
          </p>
          <button className="btn primary" onClick={() => void cargar()}>Ya lo hice, reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: 1320 }}>
      <Head />

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
          <span style={{ flex: 1 }} />
          <button className="vc-tool peligro" title="Eliminar" onClick={() => void eliminar()}><Trash2 size={15} /></button>
        </div>
      )}

      <div className="vcanvas-scroll">
        <div
          className="vcanvas"
          style={{ width: ANCHO, height: ALTO }}
          onPointerDown={() => { setSel(null); setEditando(null); }}
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
                background: it.kind === "nota" ? it.color ?? COLORES_NOTA[0] : undefined,
              }}
              onPointerDown={(e) => empezar(e, it, "mover")}
              onPointerMove={mover}
              onPointerUp={soltar}
              onDoubleClick={() => { if (it.kind === "nota") { setSel(it.id); setEditando(it.id); } }}
            >
              {it.kind === "imagen" ? (
                it.url
                  ? <img src={it.url} alt="Imagen de tu tablero de visión" draggable={false} loading="lazy" />
                  : <div className="vc-cargando">🖼️</div>
              ) : editando === it.id ? (
                <textarea
                  autoFocus
                  defaultValue={it.content ?? ""}
                  onPointerDown={(e) => e.stopPropagation()}
                  onBlur={(e) => {
                    const content = e.target.value;
                    mutar(it.id, { content });
                    void persistir(it.id, { content });
                    setEditando(null);
                  }}
                />
              ) : (
                <span className="vc-texto">{it.content}</span>
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
      <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 10 }}>
        Toca un elemento para seleccionarlo: arriba aparecen sus controles. Arrastra para moverlo, usa la esquina para el tamaño y doble clic en una nota para editar su texto. Todo se guarda solo.
      </p>
    </div>
  );
}

function Head() {
  return (
    <div className="page-head">
      <div className="eyebrow"><Sparkles size={13} /> Inspiración</div>
      <h1>Visión</h1>
      <p>El collage de la vida que estás construyendo: imágenes, frases y sueños, ordenados a tu manera. Míralo seguido.</p>
    </div>
  );
}
