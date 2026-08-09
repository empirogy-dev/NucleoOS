import { useCallback, useEffect, useState } from "react";
import { useIdioma } from "../idioma/IdiomaProvider";
import { Landmark, RefreshCw, Unlink } from "lucide-react";
import {
  abrirPlaid,
  canjearToken,
  crearLinkToken,
  desconectarBanco,
  listConexiones,
  sincronizarBanco,
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

  async function conectar() {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const token = await crearLinkToken();
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

  async function actualizar() {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const nuevas = await sincronizarBanco();
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
              <button className="xdel" aria-label={tr("Desconectar")} title={tr("Desconectar")}
                onClick={async () => {
                  if (!window.confirm(tr("¿Desconectar este banco? Los movimientos ya registrados se quedan."))) return;
                  await desconectarBanco(c.id);
                  await cargar();
                }}>
                <Unlink size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {msg && <p style={{ fontSize: 13, color: "var(--ok)", marginTop: 10 }}>{msg}</p>}
      {err && <p style={{ fontSize: 13, color: "var(--err)", marginTop: 10 }}>{err}</p>}
    </div>
  );
}
