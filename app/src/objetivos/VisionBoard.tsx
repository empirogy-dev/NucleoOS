import { useCallback, useEffect, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";

// Tablero de visión: imágenes de lo que quieres proyectar a futuro.
// Viven en el bucket privado "vision" (migración 0016).

interface Imagen {
  path: string;
  url: string;
}

const BUCKET = "vision";

export function VisionBoard() {
  const [imagenes, setImagenes] = useState<Imagen[]>([]);
  const [bucketFalta, setBucketFalta] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!supabase) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const carpeta = u.user.id;
    const { data, error } = await supabase.storage.from(BUCKET).list(carpeta);
    if (error) {
      if (/bucket/i.test(error.message)) setBucketFalta(true);
      return;
    }
    setBucketFalta(false);
    const rutas = (data ?? [])
      .filter((f) => f.name !== ".emptyFolderPlaceholder")
      .map((f) => `${carpeta}/${f.name}`);
    if (rutas.length === 0) {
      setImagenes([]);
      return;
    }
    const { data: firmadas } = await supabase.storage.from(BUCKET).createSignedUrls(rutas, 3600);
    setImagenes((firmadas ?? []).flatMap((f, i) => (f.signedUrl ? [{ path: rutas[i], url: f.signedUrl }] : [])));
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !supabase) return;
    if (file.size > 8 * 1024 * 1024) {
      setErr("La imagen pesa más de 8 MB. Prueba con una más liviana.");
      return;
    }
    setSubiendo(true);
    setErr(null);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const safe = file.name.replace(/[^\w.\-()áéíóúñÁÉÍÓÚÑ ]/g, "_");
    const { error } = await supabase.storage.from(BUCKET).upload(
      `${u.user.id}/${Date.now()}-${safe}`,
      file,
      { contentType: file.type || "image/jpeg" },
    );
    setSubiendo(false);
    if (error) {
      if (/bucket/i.test(error.message)) setBucketFalta(true);
      else setErr(error.message);
      return;
    }
    void cargar();
  }

  async function eliminar(path: string) {
    if (!supabase) return;
    await supabase.storage.from(BUCKET).remove([path]);
    void cargar();
  }

  return (
    <div className="card panel" style={{ marginBottom: 16 }}>
      <h3>🖼️ Tablero de visión</h3>
      {bucketFalta ? (
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Para tu tablero de visión, corre <code>supabase/migrations/0016_vision_board.sql</code> en el SQL Editor.
        </p>
      ) : (
        <>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
            Imágenes de lo que quieres proyectar: el viaje, la casa, la vida que estás construyendo. Míralo seguido.
          </p>
          {err && <p style={{ fontSize: 12.5, color: "var(--err)", marginBottom: 8 }}>{err}</p>}
          <div className="vb-grid">
            {imagenes.map((img) => (
              <div className="vb-item" key={img.path}>
                <img src={img.url} alt="Imagen de tu tablero de visión" loading="lazy" />
                <button className="vb-del" aria-label="Eliminar imagen"
                  onClick={() => { if (window.confirm("¿Sacar esta imagen del tablero?")) void eliminar(img.path); }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <label className="vb-add" title="Agregar imagen">
              <ImagePlus size={20} />
              <span>{subiendo ? "Subiendo…" : "Agregar"}</span>
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={onFile} disabled={subiendo} />
            </label>
          </div>
        </>
      )}
    </div>
  );
}
