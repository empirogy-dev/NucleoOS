# NucleoOS — app

App web (base para móvil y escritorio) dNucleoOS. React 19 + Vite + TypeScript.

## Correr en local
```bash
cd app
npm install
npm run dev
```
Abre http://localhost:5180

## Estado (Fase 0)
- ✅ Shell navegable: barra lateral con las 7 áreas + Inicio
- ✅ Tablero de Inicio con datos de ejemplo (visión, progreso por área, avances, tracker de sobriedad)
- ✅ Sistema de diseño aplicado (ver [`../DESIGN.md`](../DESIGN.md))
- ✅ Temas elegibles por el usuario (10 paletas, se guardan en el navegador)
- ✅ Fuentes self-hosted (Outfit + Inter)
- ✅ Autenticación + login/registro con Supabase (rutas protegidas)

> Necesita `app/.env` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (ver `.env.example`).

## Estructura
```
src/
├─ areas.ts              # las 7 áreas (nombre, color, icono, ruta)
├─ theme/                # motor de temas (paletas + ThemeProvider)
├─ components/           # Layout, Sidebar, ThemePicker
├─ pages/                # Inicio (tablero) + AreaPage (stub por área)
└─ styles/               # theme.css (tokens) + app.css (componentes)
```

Todo el color sale de variables CSS que se derivan de la paleta elegida (`theme.css`). No hardcodear colores en componentes.
