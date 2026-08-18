import type { Account, CreditCard, Tx } from "./types";

// Las dos caras de una transferencia que el banco publicó por separado.
//
// Cuando pagas la tarjeta desde la cuenta corriente, el banco publica dos
// movimientos: la plata que sale de la cuenta y la plata que entra a la
// tarjeta. Son el mismo movimiento visto dos veces. Si quedan sueltos, el
// mes cuenta un gasto Y un ingreso que no existieron, y todos los totales
// se deforman.
//
// El detector viejo los buscaba por el NOMBRE: que dijera "payment" o
// "pago". Y los suyos se llaman "[CW] TF 0005191238144544123" y
// "Bmo Transit", así que no los encontraba ninguno. Peor: "Bmo Transit" es
// también como llega su sueldo, así que la regla que ella creó una vez para
// el sueldo marcó el pago de la tarjeta como Sueldo, y un pago de 400 se
// contó como si hubiera ganado 400.
//
// Por eso esto no mira el nombre. Mira lo único que no miente: sale plata de
// una cuenta, entra el mismo monto a una tarjeta, con pocos días de
// diferencia. Y se apoya en algo que siempre es cierto: a una tarjeta de
// crédito no le entra un sueldo. Lo único que le entra es un pago o la
// devolución de una compra.

export interface ParTransferencia {
  /** El lado de la cuenta: de aquí salió la plata. Es el que se conserva. */
  salida: Tx;
  /** El lado de la tarjeta: aquí llegó. Queda como reflejo del otro. */
  entrada: Tx;
  tarjetaId: string;
  tarjetaNombre: string;
  monto: number;
  /** Días entre una y otra, para poder mostrar por qué se emparejaron. */
  dias: number;
}

const aDias = (f: string): number => new Date(`${f}T00:00:00Z`).getTime() / 86400000;

/** Plata que entró a una tarjeta contada como ingreso.
 *
 *  A una tarjeta de crédito no le entra un sueldo: lo que le entra es un pago
 *  tuyo o la devolución de una compra. Así que cualquiera de estas está mal
 *  clasificada, se llame como se llame. */
export function ingresosEnTarjeta(txs: Tx[], cards: CreditCard[]): Tx[] {
  const esTarjeta = new Set(cards.map((c) => c.id));
  return txs.filter((t) =>
    t.type === "income"
    && !t.mirror_of
    && t.payment_source_type === "credit_card"
    && t.payment_source_id != null
    && esTarjeta.has(t.payment_source_id));
}

/**
 * Empareja cada entrada a una tarjeta con la salida que la pagó.
 *
 * Se exige el mismo monto y pocos días de diferencia, y que la salida venga
 * de una cuenta de verdad. Un gasto pagado CON la tarjeta no puede ser el
 * otro lado: la plata tiene que haber salido de una cuenta.
 *
 * Lo que no encuentra pareja no se toca. Casi siempre es la devolución de una
 * compra, y convertirla en transferencia sería inventarle un origen.
 */
export function buscarParesDeTransferencia(
  txs: Tx[],
  accounts: Account[],
  cards: CreditCard[],
  ventanaDias = 5,
): { pares: ParTransferencia[]; sinPareja: Tx[] } {
  const esCuenta = new Set(accounts.map((a) => a.id));
  const nombreTarjeta = new Map(cards.map((c) => [c.id, c.last_four ? `${c.name} ••••${c.last_four}` : c.name]));

  const entradas = ingresosEnTarjeta(txs, cards);
  const salidas = txs.filter((t) =>
    t.type === "expense"
    && !t.mirror_of
    && ((t.account_id && esCuenta.has(t.account_id))
      || (t.payment_source_type === "account" && t.payment_source_id && esCuenta.has(t.payment_source_id))));

  const usadas = new Set<string>();
  const pares: ParTransferencia[] = [];
  const sinPareja: Tx[] = [];

  for (const entrada of entradas) {
    const monto = Number(entrada.amount);
    // La más cercana en el tiempo entre las del mismo monto: si hizo dos
    // pagos iguales en la misma semana, cada uno se queda con el suyo.
    const candidata = salidas
      .filter((s) => !usadas.has(s.id) && Math.abs(Number(s.amount) - monto) < 0.005
        && Math.abs(aDias(s.date) - aDias(entrada.date)) <= ventanaDias)
      .sort((a, b) =>
        Math.abs(aDias(a.date) - aDias(entrada.date)) - Math.abs(aDias(b.date) - aDias(entrada.date)))[0];

    if (!candidata) { sinPareja.push(entrada); continue; }
    usadas.add(candidata.id);
    const tarjetaId = String(entrada.payment_source_id);
    pares.push({
      salida: candidata,
      entrada,
      tarjetaId,
      tarjetaNombre: nombreTarjeta.get(tarjetaId) ?? "la tarjeta",
      monto,
      dias: Math.round(Math.abs(aDias(candidata.date) - aDias(entrada.date))),
    });
  }

  // Los más caros primero: ahí es donde un doble conteo se nota.
  pares.sort((a, b) => b.monto - a.monto);
  return { pares, sinPareja };
}
