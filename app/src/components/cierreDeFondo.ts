// Cerrar tocando el fondo está bien. Cerrarse solo, cuando la persona quiso
// apretar un botón, no.
//
// En el celular pasa así: el teclado está abierto porque acaba de escribir un
// monto, ella apunta al botón de guardar, y al tocarlo el campo pierde el
// foco, el teclado se va y la ventana entera baja. El dedo se levanta sobre el
// fondo, y el navegador reparte ese toque al ancestro común de donde empezó y
// donde terminó: el fondo. El modal se cerraba sin guardar nada.
//
// La regla que arregla eso es simple: solo se cierra si el toque EMPEZÓ y
// TERMINÓ en el fondo. De paso evita que se cierre al arrastrar para
// seleccionar un texto de adentro y soltar afuera.
//
// El dato vive en el módulo y no en un estado: los toques ocurren de a uno,
// así que un solo interruptor alcanza, y así esto se puede usar en cualquier
// parte del JSX sin las ataduras de un hook.
let empezoEnElFondo = false;

// La otra mitad del mismo problema. Si el botón se lleva el foco, el campo lo
// pierde, el teclado se va y todo se mueve justo cuando el dedo baja. Con esto
// el foco se queda donde está, no se mueve nada, y el toque llega al botón.
export const sinRobarFoco = {
  onPointerDown: (e: React.PointerEvent) => e.preventDefault(),
};

export function cierreDeFondo(onClose: () => void) {
  return {
    onPointerDown: (e: React.PointerEvent) => {
      empezoEnElFondo = e.target === e.currentTarget;
    },
    onClick: (e: React.MouseEvent) => {
      const veniaDelFondo = empezoEnElFondo;
      empezoEnElFondo = false;
      if (e.target === e.currentTarget && veniaDelFondo) onClose();
    },
  };
}
