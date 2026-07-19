import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useIdioma } from "../idioma/IdiomaProvider";
import { supabaseConfigured } from "../lib/supabase";
import { LogoAtomo } from "../components/LogoAtomo";

export function Login() {
  const { signIn, signUp } = useAuth();
  const { t } = useIdioma();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "err" | "ok"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    const res = mode === "in" ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (res.error) {
      setMsg({ kind: "err", text: res.error });
    } else if (mode === "up" && "needsConfirm" in res && res.needsConfirm) {
      setMsg({ kind: "ok", text: t("login.cuentacreada") });
    }
  }

  return (
    <div className="auth-wrap">
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

            {msg && <div className={"msg " + msg.kind}>{msg.text}</div>}

            <form onSubmit={submit}>
              <div className="field">
                <label>{t("login.correo")}</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" autoComplete="email" />
              </div>
              <div className="field">
                <label>{t("login.contrasena")}</label>
                <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("login.minimo")} autoComplete={mode === "in" ? "current-password" : "new-password"} />
              </div>
              <button className="btn primary" type="submit" disabled={busy} style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>
                {busy ? t("login.unmomento") : mode === "in" ? t("login.entrar") : t("login.crearcuenta")}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
