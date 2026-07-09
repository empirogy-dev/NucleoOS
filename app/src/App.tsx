import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Inicio } from "./pages/Inicio";
import { AreaPage } from "./pages/AreaPage";
import { Login } from "./pages/Login";
import { useAuth } from "./auth/AuthProvider";
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
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Inicio />} />
          {AREAS.map((a) => (
            <Route key={a.key} path={a.path} element={<AreaPage />} />
          ))}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
