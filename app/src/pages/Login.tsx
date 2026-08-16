import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useIdioma } from "../idioma/IdiomaProvider";
import { IDIOMAS, type Idioma } from "../idioma/textos";
import { supabaseConfigured } from "../lib/supabase";
import { LogoAtomo } from "../components/LogoAtomo";
import { LegalModal } from "../legal/LegalModal";
import { registrarAceptacion } from "../legal/aceptacion";

export function Login() {
  const { signIn, signUp } = useAuth();
  const { t, idioma, setIdioma } = useIdioma();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  // La aceptación de los términos: obligatoria al crear la cuenta, y queda
  // registrada con su versión, porque una casilla marcada que no se guarda en
  // ninguna parte no sirve de nada.
  const [acepta, setAcepta] = useState(false);
  const [verLegal, setVerLegal] = useState<null | "terminos" | "privacidad">(null);
  const [msg, setMsg] = useState<{ kind: "err" | "ok"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    const res = mode === "in" ? await signIn(email, password) : await signUp(email, password);
    if (mode === "up" && !res.error) await registrarAceptacion();
    setBusy(false);
    if (res.error) {
      setMsg({ kind: "err", text: res.error });
    } else if (mode === "up" && "needsConfirm" in res && res.needsConfirm) {
      setMsg({ kind: "ok", text: t("login.cuentacreada") });
    }
  }

  return (
    <div className="auth-wrap">
      {verLegal && <LegalModal inicial={verLegal} onClose={() => setVerLegal(null)} />}
      <div className="auth">
        <div className="auth-brand">
          <div className="logo"><LogoAtomo size={24} /></div>
          <div>
            <b>NucleoOS</b>
            <small>{t("lema")}</small>
          </div>
        </div>

        {!supabaseConfigured ? (
          <div className="msg err" style={{ marginTop: 8 }}>
            Falta configurar Supabase. Copia <code>.env.example</code> a <code>.env</code> en la
            carpeta <code>app/</code>, pega tu <b>Project URL</b> y tu <b>anon key</b>, y reinicia
            el servidor.
          </div>
        ) : (
          <>
            <div className="tabs">
              <button className={"tab" + (mode === "in" ? " active" : "")} onClick={() => { setMode("in"); setMsg(null); }}>{t("login.entrar")}</button>
              <button className={"tab" + (mode === "up" ? " active" : "")} onClick={() => { setMode("up"); setMsg(null); }}>{t("login.crearcuenta")}</button>
            </div>

            {msg && <div className={"msg " + msg.kind}>{t(msg.text)}</div>}

            <form onSubmit={submit}>
              <div className="field">
                <label>{t("login.correo")}</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" autoComplete="email" />
              </div>
              <div className="field">
                <label>{t("login.contrasena")}</label>
                <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("login.minimo")} autoComplete={mode === "in" ? "current-password" : "new-password"} />
              </div>
              {mode === "up" && (
                <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, lineHeight: 1.5, color: "var(--ink-soft)", margin: "4px 0 2px", cursor: "pointer" }}>
                  <input type="checkbox" required checked={acepta} onChange={(e) => setAcepta(e.target.checked)}
                    style={{ width: 15, height: 15, marginTop: 2, accentColor: "var(--accent)" }} />
                  <span>
                    {t("Acepto los")}{" "}
                    <button type="button" className="linklike enlinea" style={{ fontSize: 12.5 }}
                      onClick={() => setVerLegal("terminos")}>{t("términos de servicio")}</button>
                    {" "}{t("y la")}{" "}
                    <button type="button" className="linklike enlinea" style={{ fontSize: 12.5 }}
                      onClick={() => setVerLegal("privacidad")}>{t("política de privacidad")}</button>
                    {". "}
                    <span style={{ color: "var(--muted)" }}>
                      {t("Incluye que tus boletas y cartolas se guardan en servidores en Estados Unidos.")}
                    </span>
                  </span>
                </label>
              )}
              <button className="btn primary" type="submit" disabled={busy || (mode === "up" && !acepta)} style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>
                {busy ? t("login.unmomento") : mode === "in" ? t("login.entrar") : t("login.crearcuenta")}
              </button>
            </form>
          </>
        )}

        <div className="auth-langs">
          {IDIOMAS.map((i) => (
            <button
              key={i.key}
              type="button"
              className={"auth-lang" + (idioma === i.key ? " active" : "")}
              onClick={() => setIdioma(i.key as Idioma)}
            >
              {i.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
