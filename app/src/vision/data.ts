import { supabase } from "../lib/supabase";
import { TablesMissingError } from "../finanzas/data";

// Visión: cada elemento del collage vive en vision_items (migración 0017)
// y las imágenes en el bucket privado "vision" (migración 0016).

export interface VisionItem {
  id: string;
  kind: "imagen" | "nota";
  path: string | null;
  content: string | null;
  color: string | null;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  z: number;
  font?: string | null; // normal, titulo o caligrafia (migración 0039)
  bold?: boolean | null; // negrita (migración 0041)
  font_size?: number | null; // tamaño de letra en px, null usa el normal (migración 0041)
  url?: string; // firmada, solo en memoria
}

const BUCKET = "vision";

function sb() {
  if (!supabase) throw new Error("Supabase no está configurado.");
  return supabase;
}

function check(error: { code?: string; message: string } | null) {
  if (!error) return;
  if (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    /does not exist|could not find the table/i.test(error.message)
  ) {
    throw new TablesMissingError();
  }
  throw new Error(error.message);
}

export async function listItems(): Promise<VisionItem[]> {
  const { data, error } = await sb().from("vision_items").select("*").order("z", { ascending: true });
  check(error);
  const items = (data ?? []) as VisionItem[];
  const rutas = items.filter((i) => i.kind === "imagen" && i.path).map((i) => i.path as string);
  if (rutas.length > 0) {
    const { data: firmadas } = await sb().storage.from(BUCKET).createSignedUrls(rutas, 3600);
    const porRuta = new Map((firmadas ?? []).map((f, i) => [rutas[i], f.signedUrl] as const));
    for (const it of items) {
      if (it.path) it.url = porRuta.get(it.path) ?? undefined;
    }
  }
  return items;
}

/** Trae al collage las imágenes subidas con la versión anterior del tablero. */
export async function sembrarDesdeBucket(): Promise<boolean> {
  const { data: u } = await sb().auth.getUser();
  if (!u.user) return false;
  const carpeta = u.user.id;
  const { data, error } = await sb().storage.from(BUCKET).list(carpeta);
  if (error) return false; // bucket aún no existe, se avisa al subir
  const archivos = (data ?? [])
    .filter((f) => f.name !== ".emptyFolderPlaceholder")
    .map((f) => `${carpeta}/${f.name}`);
  if (archivos.length === 0) return false;
  const { data: existentes, error: e2 } = await sb().from("vision_items").select("path");
  check(e2);
  const usados = new Set((existentes ?? []).map((r: { path: string | null }) => r.path));
  const nuevos = archivos.filter((p) => !usados.has(p));
  let i = 0;
  for (const path of nuevos) {
    await addItem({
      kind: "imagen",
      path,
      x: 70 + (i % 4) * 265,
      y: 70 + Math.floor(i / 4) * 215,
      w: 240,
      h: 180,
      rotation: ((i % 3) - 1) * 3,
      z: i + 1,
    });
    i += 1;
  }
  return nuevos.length > 0;
}

export async function addItem(item: Partial<VisionItem>): Promise<VisionItem> {
  const { url: _url, ...resto } = item;
  const { data, error } = await sb().from("vision_items").insert(resto).select("*").single();
  check(error);
  return data as VisionItem;
}

export async function updateItem(id: string, patch: Partial<VisionItem>) {
  const { url: _url, ...resto } = patch;
  const { error } = await sb().from("vision_items").update(resto).eq("id", id);
  check(error);
}

export async function deleteItem(item: VisionItem) {
  if (item.kind === "imagen" && item.path) {
    await sb().storage.from(BUCKET).remove([item.path]);
  }
  const { error } = await sb().from("vision_items").delete().eq("id", item.id);
  check(error);
}

export async function subirImagen(file: File): Promise<string> {
  const { data: u } = await sb().auth.getUser();
  if (!u.user) throw new Error("Sin sesión.");
  const safe = file.name.replace(/[^\w.\-()áéíóúñÁÉÍÓÚÑ ]/g, "_");
  const path = `${u.user.id}/${Date.now()}-${safe}`;
  const { error } = await sb().storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "image/jpeg",
  });
  if (error) {
    if (/bucket/i.test(error.message)) throw new Error("BUCKET_MISSING");
    throw new Error(error.message);
  }
  return path;
}
