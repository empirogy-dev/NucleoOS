import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useIdioma } from "../idioma/IdiomaProvider";
import { GUIONES, TOUR_GENERAL } from "./guiones";
import { marcarHecho, marcarSaltado, type PasoTour } from "./tour";

// El motor del tour: resalta un pedazo de la pantalla y lo explica al lado.
//
// Lo único delicado aquí es el tiempo. Un paso puede vivir en otra ruta, y la
// página de destino tarda en montarse y en traer sus datos, así que el
// elemento a señalar no existe todavía cuando el paso empieza. Por eso se
// busca con reintentos y, si no aparece, el paso se salta en vez de dejar al
// tour apuntando a la nada.

interface Ctx {
  /** Arranca un tour por su clave. Si ya hay uno corriendo, lo reemplaza. */
  iniciar: (clave: string) => void;
  activo: boolean;
  /** La clave del guion que corresponde a la pantalla donde estás. */
  guionDeRuta: (ruta: string) => string | null;
}

const TourCtx = createContext<Ctx>({ iniciar: () => {}, activo: false, guionDeRuta: () => null });

// eslint-disable-next-line react-refresh/only-export-components
export function useTour() {
  return useContext(TourCtx);
}

interface Caja { top: number; left: number; width: number; height: number }

/** Cuántas veces se busca el elemento antes de rendirse, cada 120 ms. */
const INTENTOS = 14;

export function TourProvider({ children }: { children: ReactNode }) {
  const { t: tr } = useIdioma();
  const navigate = useNavigate();
  const location = useLocation();

  const [clave, setClave] = useState<string | null>(null);
  const [indice, setIndice] = useState(0);
  const [caja, setCaja] = useState<Caja | null>(null);
  const intentos = useRef(0);

  const pasos: PasoTour[] = useMemo(() => (clave ? GUIONES[clave]?.pasos ?? [] : []), [clave]);
  const paso: PasoTour | null = pasos[indice] ?? null;

  const cerrar = useCallback((terminado: boolean) => {
    if (clave && terminado) marcarHecho(clave);
    if (clave && !terminado) {
      // Saltar el general significa "no quiero tours": se respeta para todos.
      if (clave === TOUR_GENERAL) marcarSaltado();
      else marcarHecho(clave);
    }
    setClave(null);
    setIndice(0);
    setCaja(null);
  }, [clave]);

  const iniciar = useCallback((nueva: string) => {
    if (!GUIONES[nueva]) return;
    setClave(nueva);
    setIndice(0);
    setCaja(null);
    intentos.current = 0;
  }, []);

  // Llevar a la ruta del paso, si es otra.
  useEffect(() => {
    if (!paso?.ruta) return;
    if (location.pathname !== paso.ruta) navigate(paso.ruta);
  }, [paso, location.pathname, navigate]);

  // Buscar el elemento a señalar. Con reintentos, porque la página de destino
  // puede estar todavía montándose o cargando sus datos.
  useEffect(() => {
    if (!paso) return;
    if (!paso.objetivo) {
      setCaja(null);
      return;
    }
    if (paso.ruta && location.pathname !== paso.ruta) return;

    intentos.current = 0;
    let vivo = true;

    const medir = () => {
      if (!vivo) return;
      const el = document.querySelector(paso.objetivo!);
      if (!el) {
        intentos.current += 1;
        // Se rindió: este paso habla de algo que no está en pantalla (un
        // módulo escondido, una pestaña distinta). Se pasa al siguiente.
        if (intentos.current > INTENTOS) {
          setIndice((i) => (i + 1 < pasos.length ? i + 1 : i));
          if (indice + 1 >= pasos.length) cerrar(true);
          return;
        }
        window.setTimeout(medir, 120);
        return;
      }
      const r = el.getBoundingClientRect();
      // Si quedó fuera de la vista, se acerca antes de señalarlo.
      if (r.top < 8 || r.bottom > window.innerHeight - 8) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        window.setTimeout(medir, 220);
        return;
      }
      setCaja({ top: r.top, left: r.left, width: r.width, height: r.height });
    };

    medir();
    return () => { vivo = false; };
  }, [paso, location.pathname, pasos.length, indice, cerrar]);

  // Si la ventana cambia de tamaño o se desplaza, el foco sigue al elemento.
  useEffect(() => {
    if (!paso?.objetivo) return;
    const al = () => {
      const el = document.querySelector(paso.objetivo!);
      if (!el) return;
      const r = el.getBoundingClientRect();
      setCaja({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    window.addEventListener("resize", al);
    window.addEventListener("scroll", al, true);
    return () => {
      window.removeEventListener("resize", al);
      window.removeEventListener("scroll", al, true);
    };
  }, [paso]);

  // Escape cierra, las flechas avanzan y retroceden.
  useEffect(() => {
    if (!paso) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrar(false);
      if (e.key === "ArrowRight") setIndice((i) => Math.min(i + 1, pasos.length - 1));
      if (e.key === "ArrowLeft") setIndice((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [paso, pasos.length, cerrar]);

  const guionDeRuta = useCallback((ruta: string) => (GUIONES[ruta] ? ruta : null), []);

  const valor = useMemo(() => ({ iniciar, activo: paso !== null, guionDeRuta }), [iniciar, paso, guionDeRuta]);

  return (
    <TourCtx.Provider value={valor}>
      {children}
      {paso && (
        <Globo
          paso={paso}
          caja={caja}
          indice={indice}
          total={pasos.length}
          tr={tr}
          onAtras={() => setIndice((i) => Math.max(0, i - 1))}
          onSiguiente={() => {
            if (indice + 1 >= pasos.length) cerrar(true);
            else setIndice(indice + 1);
          }}
          onSaltar={() => cerrar(false)}
        />
      )}
    </TourCtx.Provider>
  );
}

const MARGEN = 10;
const ANCHO_GLOBO = 320;

function Globo({ paso, caja, indice, total, tr, onAtras, onSiguiente, onSaltar }: {
  paso: PasoTour;
  caja: Caja | null;
  indice: number;
  total: number;
  tr: (s: string) => string;
  onAtras: () => void;
  onSiguiente: () => void;
  onSaltar: () => void;
}) {
  const ultimo = indice + 1 >= total;

  // Dónde poner la ventanita. Tres casos, en orden:
  //
  //  1. El objetivo es alto (el menú lateral ocupa la pantalla entera de
  //     arriba abajo): al lado, centrado. Debajo quedaría fuera de la vista y
  //     encima taparía justo lo que se está señalando.
  //  2. Cabe debajo: debajo, que es donde el ojo sigue leyendo.
  //  3. No cabe: encima.
  const posicion = (): React.CSSProperties => {
    if (!caja) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    const alto = 210;
    const centrado = (v: number, max: number) => Math.min(Math.max(MARGEN, v), Math.max(MARGEN, max));

    if (caja.height > window.innerHeight * 0.5) {
      const aLaDerecha = caja.left + caja.width + MARGEN;
      const cabeDerecha = aLaDerecha + ANCHO_GLOBO < window.innerWidth;
      return {
        top: centrado(caja.top + caja.height / 2 - alto / 2, window.innerHeight - alto - MARGEN),
        left: cabeDerecha ? aLaDerecha : Math.max(MARGEN, caja.left - ANCHO_GLOBO - MARGEN),
      };
    }

    const abajo = caja.top + caja.height + MARGEN;
    const izquierda = centrado(
      caja.left + caja.width / 2 - ANCHO_GLOBO / 2,
      window.innerWidth - ANCHO_GLOBO - MARGEN,
    );
    return abajo + alto < window.innerHeight
      ? { top: abajo, left: izquierda }
      : { top: Math.max(MARGEN, caja.top - alto - MARGEN), left: izquierda };
  };

  return (
    <>
      {/* El velo con un agujero: es un solo div con una sombra enorme
          alrededor, que es la forma más simple de recortar un hueco sin
          dibujar cuatro rectángulos que nunca calzan del todo. */}
      <div className="tour-velo" onClick={onSaltar} style={caja ? {
        top: caja.top - 6, left: caja.left - 6,
        width: caja.width + 12, height: caja.height + 12,
      } : { top: "50%", left: "50%", width: 0, height: 0 }} />

      <div className="tour-globo" style={posicion()} role="dialog" aria-live="polite">
        <div className="tour-cuenta">{indice + 1} {tr("de")} {total}</div>
        <b className="tour-titulo">{tr(paso.titulo)}</b>
        <p className="tour-texto">{tr(paso.texto)}</p>
        <div className="tour-botones">
          <button type="button" className="btn ghost tour-saltar" onClick={onSaltar}>
            {tr("Saltar")}
          </button>
          <span style={{ flex: 1 }} />
          {indice > 0 && (
            <button type="button" className="btn ghost" onClick={onAtras}>{tr("Atrás")}</button>
          )}
          <button type="button" className="btn primary" onClick={onSiguiente} autoFocus>
            {ultimo ? tr("Listo") : tr("Siguiente")}
          </button>
        </div>
      </div>
    </>
  );
}
