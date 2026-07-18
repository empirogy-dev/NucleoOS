// Fechas en hora LOCAL del usuario.
// Nunca usar new Date().toISOString() para obtener "hoy": eso devuelve la
// fecha en UTC y, por ejemplo en Canadá después de las 8 de la tarde, ya es
// "mañana" en UTC. Eso corría gastos, hábitos y rachas al día siguiente.

/** Formatea una fecha como YYYY-MM-DD usando la zona horaria local. */
export function fmtFechaLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Hoy en hora local, como YYYY-MM-DD. */
export function hoyLocal(): string {
  return fmtFechaLocal(new Date());
}

/** Hace n días, en hora local. */
export function diasAtrasLocal(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return fmtFechaLocal(d);
}

/** Mes actual en hora local, como YYYY-MM. */
export function mesActualLocal(): string {
  return hoyLocal().slice(0, 7);
}

// ---------- Modo "día pasado" (global) ----------
// Si desapareciste unos días pero igual entrenaste y tomaste agua, puedes
// poner la app en ese día desde Ajustes (o Energía) y todo lo que registres
// se guarda ahí. Este es el interruptor global que leen los módulos al guardar.

let fechaActiva: string | null = null;

export function setFechaActivaGlobal(fecha: string | null) {
  fechaActiva = fecha && fecha !== hoyLocal() ? fecha : null;
}

/** La fecha en la que se registra ahora: hoy, o el día pasado elegido. */
export function fechaRegistro(): string {
  return fechaActiva ?? hoyLocal();
}
