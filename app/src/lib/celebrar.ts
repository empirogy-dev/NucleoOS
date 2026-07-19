// El cañón de serpentinas de NucleoOS: celebración visual instantánea
// cuando concretas un logro. Para un cerebro TDAH la recompensa inmediata
// no es adorno, es el circuito que hace que quieras volver a lograr.
// Sin librerías: un canvas encima de todo que se limpia solo.

interface Papelito {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ancho: number;
  alto: number;
  color: string;
  giro: number;
  vgiro: number;
  balanceo: number;
}

function coloresDelTema(): string[] {
  const s = getComputedStyle(document.documentElement);
  const leer = (v: string) => s.getPropertyValue(v).trim();
  return [
    leer("--accent") || "#7fa88b",
    leer("--ok") || "#5f9e6e",
    leer("--warn") || "#d9a34a",
    leer("--sal") || "#c98a76",
    leer("--obj") || "#5e8f86",
    leer("--men") || "#9a86c9",
    "#f2d06b",
  ].filter(Boolean);
}

let activo = false;

/** Lanza la celebración: "chica" para victorias del día a día,
 *  "grande" para retos logrados y metas cumplidas (lluvia de año nuevo). */
export function celebrar(intensidad: "chica" | "grande" = "chica"): void {
  if (activo && intensidad === "chica") return; // no apilar ráfagas chicas
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  activo = true;
  canvas.style.cssText = "position:fixed;inset:0;width:100vw;height:100dvh;pointer-events:none;z-index:9999";
  const escala = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = window.innerWidth * escala;
  canvas.height = window.innerHeight * escala;
  ctx.scale(escala, escala);
  document.body.appendChild(canvas);

  const colores = coloresDelTema();
  const W = window.innerWidth;
  const H = window.innerHeight;
  const papelitos: Papelito[] = [];
  const cantidad = intensidad === "grande" ? 160 : 60;

  for (let i = 0; i < cantidad; i++) {
    // Dos cañones desde abajo, como serpentina de año nuevo.
    const desdeIzquierda = i % 2 === 0;
    const x = desdeIzquierda ? W * 0.12 : W * 0.88;
    const angulo = (desdeIzquierda ? -60 : -120) * (Math.PI / 180) + (Math.random() - 0.5) * 0.9;
    const fuerza = (intensidad === "grande" ? 15 : 11) + Math.random() * 7;
    papelitos.push({
      x,
      y: H + 10,
      vx: Math.cos(angulo) * fuerza,
      vy: Math.sin(angulo) * fuerza,
      ancho: 5 + Math.random() * 6,
      alto: 8 + Math.random() * 10,
      color: colores[Math.floor(Math.random() * colores.length)],
      giro: Math.random() * Math.PI,
      vgiro: (Math.random() - 0.5) * 0.3,
      balanceo: Math.random() * Math.PI * 2,
    });
  }

  const inicio = performance.now();
  const duracion = intensidad === "grande" ? 3400 : 2000;

  function cuadro(t: number) {
    if (!ctx) return;
    const pasado = t - inicio;
    ctx.clearRect(0, 0, W, H);
    const desvanecer = Math.max(0, 1 - Math.max(0, pasado - duracion * 0.6) / (duracion * 0.4));
    for (const p of papelitos) {
      p.vy += 0.25; // gravedad
      p.vx *= 0.99;
      p.balanceo += 0.1;
      p.x += p.vx + Math.sin(p.balanceo) * 0.8;
      p.y += p.vy;
      p.giro += p.vgiro;
      ctx.save();
      ctx.globalAlpha = desvanecer;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.giro);
      ctx.scale(1, Math.sin(p.balanceo) * 0.7 + 0.3 || 0.3); // efecto papelito girando
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.ancho / 2, -p.alto / 2, p.ancho, p.alto);
      ctx.restore();
    }
    if (pasado < duracion) {
      requestAnimationFrame(cuadro);
    } else {
      canvas.remove();
      activo = false;
    }
  }
  requestAnimationFrame(cuadro);
}
