import { useState } from "react";
import { Pencil } from "lucide-react";

// Menú de dopamina: tu lista personal de recompensas sanas y rápidas.
// Cuando el cerebro pide estímulo, eliges de aquí en vez de caer al scroll.

const LS = "nucleoos-dopamina";

const SUGERIDAS = [
  "Baila una canción entera",
  "Sal al sol 5 minutos",
  "Manda un audio a alguien que quieres",
  "Prepárate un té rico",
  "Acaricia a un animal (o mira videos de uno)",
  "Pon tu canción favorita a todo volumen",
  "Dibuja cualquier cosa 3 minutos",
  "Date una mini caminata a la esquina",
];

function cargarLista(): string[] {
  try {
    const raw = localStorage.getItem(LS);
    if (raw) {
      const l = JSON.parse(raw) as string[];
      if (Array.isArray(l) && l.length > 0) return l;
    }
  } catch { /* nada */ }
  return SUGERIDAS;
}

function barajar(lista: string[]): string[] {
  return [...lista].sort(() => Math.random() - 0.5);
}

/** Saca 3 de la bolsa barajada; si no alcanza, reparte una bolsa nueva sin
 *  repetir dentro de la misma tanda. Devuelve la muestra y lo que sobró. */
function sacarDeLaBolsa(bolsa: string[], lista: string[]): { muestra: string[]; bolsa: string[] } {
  const n = Math.min(3, lista.length);
  let restante = bolsa.length >= n ? bolsa : barajar(lista);
  const muestra = restante.slice(0, n);
  restante = restante.slice(n);
  return { muestra, bolsa: restante };
}

/** Bolsa barajada: no repite ninguna hasta mostrar todas, así "Muéstrame otras"
 *  no se siente en loop tan rápido con listas cortas. */
export function DopaminaCard() {
  const [lista, setLista] = useState<string[]>(cargarLista);
  const [{ muestra, bolsa }, setEstado] = useState(() => sacarDeLaBolsa(barajar(cargarLista()), cargarLista()));
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState("");

  function otraMuestra() {
    setEstado(sacarDeLaBolsa(bolsa, lista));
  }

  function guardarEdicion() {
    const limpia = borrador.split("\n").map((s) => s.trim()).filter(Boolean);
    const final = limpia.length > 0 ? limpia : SUGERIDAS;
    setLista(final);
    localStorage.setItem(LS, JSON.stringify(final));
    setEstado(sacarDeLaBolsa(barajar(final), final));
    setEditando(false);
  }

  return (
    <div className="card panel">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <h3 style={{ flex: 1, margin: 0 }}>🍬 Menú de dopamina</h3>
        <button className="xdel" aria-label="Editar mi menú" style={{ width: 26, height: 26 }}
          onClick={() => { setBorrador(lista.join("\n")); setEditando(!editando); }}>
          <Pencil size={13} />
        </button>
      </div>
      <p style={{ fontSize: 12, color: "var(--muted)", margin: "6px 0 10px" }}>
        ¿El cerebro pide estímulo? Elige de tu menú, no del scroll.
      </p>

      {editando ? (
        <>
          <textarea className="input-inline" rows={6} style={{ width: "100%", resize: "vertical" }}
            value={borrador} onChange={(e) => setBorrador(e.target.value)}
            placeholder="Una recompensa por línea" />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button className="btn primary" onClick={guardarEdicion}>Guardar</button>
            <button className="btn ghost" onClick={() => setEditando(false)}>Cancelar</button>
          </div>
        </>
      ) : (
        <>
          {muestra.map((m) => (
            <p key={m} style={{ fontSize: 13.5, padding: "7px 0", borderBottom: "1px solid var(--line-soft)" }}>{m}</p>
          ))}
          <button className="linklike" style={{ marginTop: 8 }} onClick={otraMuestra}>
            Muéstrame otras
          </button>
        </>
      )}
    </div>
  );
}
