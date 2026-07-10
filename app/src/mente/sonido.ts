// Señales sonoras suaves con WebAudio, generadas al vuelo, sin archivos externos.

let ctx: AudioContext | null = null;

function audio(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Un tono suave con ataque y caída lentos, nada estridente. */
export function tono(freq: number, dur = 1.1, vol = 0.09) {
  try {
    const c = audio();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    const t = c.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  } catch {
    /* sin audio disponible, la sesión sigue igual */
  }
}

/** Cada fase de la respiración tiene su nota: subir, sostener, bajar. */
export const TONO_FASE: Record<"inhala" | "sosten" | "exhala", number> = {
  inhala: 523.25, // do agudo, invita a subir
  sosten: 440,    // la, quieto
  exhala: 349.23, // fa grave, invita a soltar
};

/** Campana doble para abrir y cerrar la sesión. */
export function campana() {
  tono(660, 1.8, 0.07);
  tono(990, 1.8, 0.03);
}

// ---------- Sonido ambiental (lluvia lejana generada, en loop) ----------
let ambiente: { gain: GainNode; src: AudioBufferSourceNode } | null = null;

export function toggleAmbiente(): boolean {
  if (ambiente) {
    detenerAmbiente();
    return false;
  }
  try {
    const c = audio();
    const buf = c.createBuffer(1, c.sampleRate * 4, c.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i += 1) {
      const blanco = Math.random() * 2 - 1;
      last = (last + 0.02 * blanco) / 1.02; // ruido café: grave y calmado
      data[i] = last * 3.5;
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const gain = c.createGain();
    gain.gain.value = 0.045;
    src.connect(gain);
    gain.connect(c.destination);
    src.start();
    ambiente = { gain, src };
    return true;
  } catch {
    return false;
  }
}

export function detenerAmbiente() {
  if (!ambiente) return;
  try {
    ambiente.src.stop();
  } catch {
    /* ya estaba detenido */
  }
  ambiente = null;
}
