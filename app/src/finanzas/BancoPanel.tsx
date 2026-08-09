import { useCallback, useEffect, useState } from "react";
import { useIdioma } from "../idioma/IdiomaProvider";
import { Landmark, RefreshCw, Trash2, Unlink } from "lucide-react";
import { Selector } from "../components/Selector";
import {
  abrirPlaid,
  canjearToken,
  crearLinkToken,
  desconectarBanco,
  listConexiones,
  limpiarOAuth,
  sincronizarBanco,
  tokenAgregarCuentas,
  volviendoDeOAuth,
  type ConexionBanco,
} from "./banco";

// El puente con el banco: conectar, ver el estado y traer lo nuevo. Las
// credenciales bancarias se escriben dentro de la ventana de Plaid, que es
// de ellos: NucleoOS nunca las ve. Aquí solo llegan los movimientos.

export function BancoPanel({ onCambio }: { onCambio: () => void }) {
  const { t: tr } = useIdioma();
  const [conexiones, setConexiones] = useState<ConexionBanco[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [disponible, setDisponible] = useState(true);
  // Cuánta historia traer del banco al conectar. Tres meses es el punto
  // dulce: suficiente para ver patrones, sin llenar la app de arqueología.
  const [dias, setDias] = useState("90");

  const cargar = useCallback(async () => {
    try {
      setConexiones(await listConexiones());
      setDisponible(true);
    } catch (e) {
      // Sin las llaves de Plaid o sin la función desplegada: el panel se
      // esconde y Finanzas sigue funcionando igual que siempre.
      if (/PLAID|no encontr|not found|Failed to send/i.test(String(e))) setDisponible(false);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Si volvemos del sitio del banco (OAuth), se retoma el mismo flujo con
  // el token guardado: para la persona es un solo movimiento continuo.
  useEffect(() => {
    const token = volviendoDeOAuth();
    if (!token) return;
    setBusy(true);
    void abrirPlaid(token, (publicToken, institucion) => {
      void (async () => {
        try {
          const nuevas = await canjearToken(publicToken, institucion);
          setMsg(`${tr("Banco conectado")}: ${nuevas} ${tr("movimientos nuevos")}.`);
          await cargar();
          onCambio();
        } catch (e) {
          setErr(e instanceof Error ? e.message : String(e));
        } finally {
          limpiarOAuth();
          setBusy(false);
        }
      })();
    }, true).catch(() => { limpiarOAuth(); setBusy(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function conectar() {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const token = await crearLinkToken(Number(dias));
      await abrirPlaid(token, (publicToken, institucion) => {
        void (async () => {
          try {
            const nuevas = await canjearToken(publicToken, institucion);
            setMsg(`${tr("Banco conectado")}: ${nuevas} ${tr("movimientos nuevos")}.`);
            await cargar();
            onCambio();
          } catch (e) {
            setErr(e instanceof Error ? e.message : String(e));
          } finally {
            setBusy(false);
          }
        })();
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  async function actualizar(desdeCero = false) {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const nuevas = await sincronizarBanco(desdeCero);
      setMsg(nuevas > 0 ? `${nuevas} ${tr("movimientos nuevos")}.` : tr("Todo al día."));
      await cargar();
      onCambio();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  if (!disponible || cargando) return null;

  return (
    <div className="card pad" style={{ marginBottom: 14, maxWidth: 720 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ width: 34, height: 34, borderRadius: 9, background: "var(--accent-wash)", display: "grid", placeItems: "center", color: "var(--accent-ink)" }}>
          <Landmark size={16} />
        </span>
        <div style={{ flex: 1, minWidth: 200 }}>
          <b style={{ fontSize: 14, display: "block" }}>{tr("Tu banco, en vivo")}</b>
          <small style={{ color: "var(--muted)" }}>
            {conexiones.length === 0
              ? tr("Conecta tu banco y los movimientos llegan solos, sin subir cartolas.")
              : conexiones.map((c) => c.institution_name ?? tr("Banco conectado")).join(", ")}
          </small>
        </div>
        {conexiones.length > 0 && (
          <button className="btn ghost" disabled={busy} onClick={() => void actualizar()}>
            <RefreshCw size={14} style={{ verticalAlign: "-2px", marginRight: 5 }} />
            {busy ? tr("com.guardando") : tr("Actualizar")}
          </button>
        )}
        <div style={{ width: 150 }}>
          <Selector compacto value={dias} ariaLabel={tr("Historial que traer")} onChange={setDias}
            opciones={[
              { value: "30", label: tr("Último mes") },
              { value: "90", label: tr("3 meses") },
              { value: "180", label: tr("6 meses") },
              { value: "365", label: tr("1 año") },
              { value: "730", label: tr("2 años") },
            ]} />
        </div>
        <button className="btn primary" disabled={busy} onClick={() => void conectar()}>
          {conexiones.length === 0 ? tr("Conectar mi banco") : tr("Conectar otro")}
        </button>
      </div>

      {conexiones.length > 0 && (
        <div style={{ marginTop: 10 }}>
          {conexiones.map((c) => (
            <div className="txrow" key={c.id}>
              <span className="txicon">🏦</span>
              <div className="txmeta">
                <b>{c.institution_name ?? tr("Banco conectado")}</b>
                <small>
                  {c.status === "activo" ? tr("Al día") : tr("Necesita que vuelvas a entrar al banco")}
                  {c.last_sync ? `, ${tr("última vez")} ${new Date(c.last_sync).toLocaleString()}` : ""}
                </small>
              </div>
              <button className="btn ghost" style={{ fontSize: 12.5, padding: "7px 12px" }}
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setErr(null);
                  try {
                    const token = await tokenAgregarCuentas(c.id);
                    await abrirPlaid(token, () => {
                      void (async () => {
                        const n = await sincronizarBanco();
                        setMsg(`${tr("Cuentas actualizadas")}: ${n} ${tr("movimientos nuevos")}.`);
                        await cargar();
                        onCambio();
                        setBusy(false);
                      })();
                    });
                  } catch (e) {
                    setErr(e instanceof Error ? e.message : String(e));
                    setBusy(false);
                  }
                }}>
                {tr("Agregar cuentas")}
              </button>
              <button className="btn ghost" style={{ fontSize: 12.5, padding: "7px 12px" }}
                onClick={async () => {
                  if (!window.confirm(tr("¿Desconectar este banco? Los movimientos ya registrados se quedan en la app."))) return;
                  await desconectarBanco(c.id, false);
                  await cargar();
                  onCambio();
                }}>
                <Unlink size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />
                {tr("Desconectar")}
              </button>
              <button className="xdel" aria-label={tr("Desconectar y borrar sus datos")} title={tr("Desconectar y borrar sus datos")}
                onClick={async () => {
                  if (!window.confirm(tr("¿Desconectar y BORRAR todo lo que trajo este banco? Se van sus cuentas, sus tarjetas y sus movimientos. Lo que registraste a mano se queda. Esto no se puede deshacer."))) return;
                  setBusy(true);
                  try {
                    const n = await desconectarBanco(c.id, true);
                    setMsg(`${tr("Banco desconectado y datos borrados")}: ${n} ${tr("movimientos")}.`);
                    await cargar();
                    onCambio();
                  } catch (e) {
                    setErr(e instanceof Error ? e.message : String(e));
                  } finally {
                    setBusy(false);
                  }
                }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {conexiones.length > 0 && (
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 10 }}>
          {tr("¿Faltan movimientos que sí ves en tu banco?")}{" "}
          <button type="button" disabled={busy}
            style={{ background: "none", border: "none", padding: 0, font: "inherit", color: "var(--accent-ink)", textDecoration: "underline", cursor: "pointer" }}
            onClick={async () => {
              if (!window.confirm(tr("Voy a pedirle al banco toda su historia de nuevo. Lo que ya está no se duplica. ¿Vamos?"))) return;
              await actualizar(true);
            }}>
            {tr("Traer todo de nuevo")}
          </button>
        </p>
      )}
      {msg && <p style={{ fontSize: 13, color: "var(--ok)", marginTop: 10 }}>{msg}</p>}
      {err && <p style={{ fontSize: 13, color: "var(--err)", marginTop: 10 }}>{err}</p>}
    </div>
  );
}
