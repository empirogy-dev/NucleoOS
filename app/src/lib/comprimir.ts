// Achica una foto antes de subirla al almacenamiento. Una boleta no necesita
// los 3 o 4 MB que saca la cámara del teléfono: con el lado largo en 1600px y
// calidad JPEG 0.8 se lee perfecto y pesa unos 200 a 400 KB. Eso baja el costo
// de almacenamiento diez veces y sube más rápido. Los PDF pasan intactos, y si
// algo falla, se sube el original: comprimir nunca bloquea el guardado.

export async function comprimirImagen(file: File, maxLado = 1600, calidad = 0.8): Promise<File> {
  if (!file.type.startsWith("image/")) return file; // PDF u otro formato: tal cual
  try {
    // imageOrientation "from-image" respeta el giro EXIF, así las fotos del
    // teléfono no salen acostadas.
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * escala));
    const h = Math.max(1, Math.round(bitmap.height * escala));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    // Fondo blanco: si la imagen tenía transparencia (un PNG), no queda negra.
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", calidad));
    // Si por lo que sea no ayudó (imagen ya chica), deja el original.
    if (!blob || blob.size >= file.size) return file;
    const nombre = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], nombre, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file; // cualquier problema: se sube el original
  }
}
