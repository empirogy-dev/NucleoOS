import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Inicio } from "./pages/Inicio";
import { FinanzasPage } from "./finanzas/FinanzasPage";
import { ObjetivosPage } from "./objetivos/ObjetivosPage";
import { HabitosPage } from "./habitos/HabitosPage";
import { TrabajoPage } from "./trabajo/TrabajoPage";
import { SaludPage } from "./salud/SaludPage";
import { AprendizajePage } from "./aprendizaje/AprendizajePage";
import { RelacionesPage } from "./relaciones/RelacionesPage";
import { Ajustes } from "./pages/Ajustes";
import { Login } from "./pages/Login";
import { useAuth } from "./auth/AuthProvider";
import { SettingsProvider } from "./settings/SettingsProvider";

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
            <Route path="/trabajo" element={<TrabajoPage />} />
            <Route path="/salud" element={<SaludPage />} />
            <Route path="/aprendizaje" element={<AprendizajePage />} />
            <Route path="/relaciones" element={<RelacionesPage />} />
            <Route path="/ajustes" element={<Ajustes />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SettingsProvider>
  );
}
