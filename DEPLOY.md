# Checklist de deployment de NucleoOS

> El camino para publicar la app en internet, en orden. La base de datos ya vive en Supabase (proyecto devxnjumkapxqguasgaz); lo que se publica es la app web, y se recomienda Vercel (gratis, ideal para Vite y SPA).

## 1. Antes de publicar (preparación)

- [ ] **Mover a Supabase lo que vive en el navegador** (si se salta este paso, esos datos no viajan entre dispositivos): menú de dopamina, rutinas guiadas, sesiones de Mente, estado de libros (leído / quiero leer), marca manual de ayuno, orden de las tarjetas y bloques de foco locales.
- [ ] **La llave de Gemini**: hoy viaja en el navegador (VITE_GEMINI_API_KEY). Para uso personal está bien; para el SaaS multi-usuario hay que moverla a una Edge Function de Supabase para que nadie pueda copiarla. Decidir según la etapa.
- [ ] **Confirmar las 37 migraciones aplicadas** en Supabase (0001 a 0037). La forma rápida: entrar a la app, recorrer los módulos y verificar que ninguna tarjeta pida una migración.
- [ ] **Build limpio**: `cd app && npm run build` sin errores.

## 2. Configurar Supabase para el mundo real

- [ ] **Authentication → URL Configuration**: poner el dominio final como Site URL (por ejemplo `https://nucleoos.vercel.app`) y agregarlo a Redirect URLs.
- [ ] **Authentication → Providers → Email**: activar "Confirm email" (para que las cuentas nuevas confirmen su correo).
- [ ] Verificar que RLS está activo en todas las tablas (ya lo está por migraciones) y que los buckets (material, salud, visión) son privados (ya lo son).

## 3. Publicar en Vercel

- [ ] Subir el repo a GitHub como **privado** (`git push`).
- [ ] En vercel.com: New Project → importar el repo.
- [ ] Configuración del proyecto:
  - Root Directory: `app`
  - Framework preset: Vite
  - Build command: `npm run build`
  - Output directory: `dist`
- [ ] Variables de entorno (las mismas de `app/.env`):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_GEMINI_API_KEY`
- [ ] Crear `app/vercel.json` con la regla SPA (todas las rutas sirven index.html):
  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
  ```
- [ ] Deploy, y anotar la URL que entrega Vercel.

## 4. Después de publicar

- [ ] Entrar desde la URL nueva, iniciar sesión y hacer la prueba de oro: registrar algo y verlo en Revisión → Día.
- [ ] Probar desde el celular (ahí brillan la foto del plato y la captura rápida).
- [ ] Volver a poner la URL final en Supabase si cambió (paso 2).
- [ ] Activar los avisos del navegador en Ajustes.

## 5. Fase 4 (después del lanzamiento, necesita Edge Functions)

- [ ] Correos automáticos: recordatorios del ciclo a la pareja y recorditos del lazo a quienes aceptaron.
- [ ] Notion API (export automático de Revisión) y Google Calendar (OAuth).
- [ ] Llave de Gemini al servidor (si se abre a más usuarios).
- [ ] Más adelante: app móvil (Capacitor) y escritorio (Tauri), como define el roadmap.
