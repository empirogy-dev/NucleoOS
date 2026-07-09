import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Inicio } from "./pages/Inicio";
import { AreaPage } from "./pages/AreaPage";
import { FinanzasPage } from "./finanzas/FinanzasPage";
import { ObjetivosPage } from "./objetivos/ObjetivosPage";
import { HabitosPage } from "./habitos/HabitosPage";
import { Ajustes } from "./pages/Ajustes";
import { Login } from "./pages/Login";
import { useAuth } from "./auth/AuthProvider";
import { SettingsProvider } from "./settings/SettingsProvider";
import { AREAS } from "./areas";

export default function App() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-wrap">
        <div className="auth-loading">Cargando…</div>
      </div>
    );
  }

  if (!session) return <Login />;

  return (
    <SettingsProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Inicio />} />
            <Route path="/finanzas" element={<FinanzasPage />} />
            <Route path="/objetivos" element={<ObjetivosPage />} />
            <Route path="/habitos" element={<HabitosPage />} />
            <Route path="/ajustes" element={<Ajustes />} />
            {AREAS.filter((a) => !["finanzas", "objetivos", "habitos"].includes(a.key)).map((a) => (
              <Route key={a.key} path={a.path} element={<AreaPage />} />
            ))}
          </Route>
        </Routes>
      </BrowserRouter>
    </SettingsProvider>
  );
}
