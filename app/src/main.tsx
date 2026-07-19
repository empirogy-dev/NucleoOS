import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "./theme/ThemeProvider";
import { AuthProvider } from "./auth/AuthProvider";
import { IdiomaProvider } from "./idioma/IdiomaProvider";
import App from "./App";
import "./styles/theme.css";
import "./styles/app.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <IdiomaProvider>
          <App />
        </IdiomaProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);
