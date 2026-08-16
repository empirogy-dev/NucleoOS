import { supabase } from "../lib/supabase";

// Llevarte todo lo tuyo.
//
// No es un extra: es un derecho, y en Canadá y en Chile la ley lo respalda.
// Se descarga un solo archivo JSON con todo lo que la app guarda de la
// persona, tabla por tabla, más la lista de sus archivos.
//
// Se lee con la sesión de ella, así que las mismas reglas por fila que
// protegen sus datos garantizan que aquí no venga nada de nadie más.

const TABLAS = [
  "accounts", "categories", "transactions", "credit_cards", "debts", "goals",
  "reminders", "tags", "transaction_tags", "category_tags", "statements",
  "merchant_rules", "bank_connections", "habits", "habit_logs", "objectives",
  "notes", "meals", "sleep_logs", "exercises", "user_kv", "legal_acceptances",
];

export interface MisDatos {
  generado: string;
  cuenta: { id: string; email: string | null; creada: string | undefined };
  tablas: Record<string, unknown[]>;
  archivos: string[];
  noDisponibles: string[];
}

export async function reunirMisDatos(): Promise<MisDatos> {
  if (!supabase) throw new Error("Supabase no está configurado.");
  const { data: quien } = await supabase.auth.getUser();
  if (!quien.user) throw new Error("Sin sesión.");

  const tablas: Record<string, unknown[]> = {};
  const noDisponibles: string[] = [];
  for (const t of TABLAS) {
    const { data, error } = await supabase.from(t).select("*");
    // Una tabla que no existe en esta instalación no es un error para ella.
    if (error) { noDisponibles.push(t); continue; }
    tablas[t] = data ?? [];
  }

  // Los archivos: se listan los nombres, no el contenido. Las fotos se bajan
  // desde Comprobantes, que ya arma el ZIP con nombres legibles.
  const archivos: string[] = [];
  try {
    const { data: carpetas } = await supabase.storage.from("recibos").list(quien.user.id, { limit: 2000 });
    for (const c of carpetas ?? []) {
      if (c.id !== null) continue;
      const { data: dentro } = await supabase.storage.from("recibos").list(`${quien.user.id}/${c.name}`);
      for (const f of dentro ?? []) {
        if (f.name !== ".emptyFolderPlaceholder") archivos.push(`${c.name}/${f.name}`);
      }
    }
  } catch { /* sin bucket: la lista queda vacía */ }

  // Sin new Date() en el nombre: la fecha la pone quien descarga.
  return {
    generado: new Date().toISOString(),
    cuenta: {
      id: quien.user.id,
      email: quien.user.email ?? null,
      creada: quien.user.created_at,
    },
    tablas,
    archivos,
    noDisponibles,
  };
}

export function descargarMisDatos(datos: MisDatos): void {
  const blob = new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nucleoos-mis-datos-${datos.generado.slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
