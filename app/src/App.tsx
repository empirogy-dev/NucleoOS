import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Inicio } from "./pages/Inicio";
import { AreaPage } from "./pages/AreaPage";
import { AREAS } from "./areas";

export default function App() {
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
