# Checklist de deployment de NucleoOS

## 0. Prueba completa antes de publicar (que todo funcione)

La pasada de verificación, módulo por módulo. Si algo falla o pide migración, se arregla antes de seguir.

- [ ] **Prueba de oro**: registrar una tarea en Inicio y dos vasos de agua en Energía, y verlos en Revisión → Día.
- [ ] **Inicio**: visión editable, Tareas de hoy (anotar, dividir con ✂️, marcar), "¿No sabes por dónde empezar?", pulso con números, brújula con el mismo % que Dirección, menú de dopamina.
- [ ] **Pomodoro** ⏱: bloque de 15 min ligado a un proyecto, campana al terminar, el bloque aparece en Trabajo y en Revisión.
- [ ] **Captura rápida** ⚡: anotar un pensamiento y encontrarlo en Tareas de hoy.
- [ ] **Energía**: agua, proteína, plato por foto y por texto con su momento, balance calórico con objetivo, ayuno (automático y manual), sueño, ciclo con fase y aviso a la pareja, ficha guardando sexo y actividad.
- [ ] **Hábitos**: marcar uno (se pinta con su color), cuadrícula anclada al primer día (las marcas viejas se ven), reto con racha, rutina guiada paso a paso, y el automarcado: registrar gimnasio marca el hábito de gimnasio.
- [ ] **Movimiento**: rutina y workout libre (con la guardia antiduplicados), suma minutos en Energía.
- [ ] **Mente**: una práctica con campana, sadhana, diario, luna boho e insights.
- [ ] **Relaciones**: tip a lo ancho, personas arrastrables, guía por vínculo, lazo mutuo (correo, invitación, recordito), libros al pie.
- [ ] **Dirección**: meta automática avanzando (por movimiento, hábito, reto, avances u horas de proyecto), editable, misma cifra que el Inicio.
- [ ] **Trabajo**: proyecto con checklist que recalcula el %, jornada registrada, bloques de foco visibles.
- [ ] **Finanzas**: gasto nuevo, categorizar (sale de la bandeja), dividir con ✂️, presupuestos.
- [ ] **Aprendizaje**: nota en cuaderno, Biblioteca con estados (Mi lista y Leídos).
- [ ] **Visión**: collage editable y sueños guardados.
- [ ] **Revisión**: Día, Semana, Mes, Patrones, lectura con IA y Copiar para Notion.
- [ ] **Ajustes**: nombre, cumpleaños, registrar un día pasado (banner y volver a hoy), tema, avisos.
- [ ] **Celular**: foto del plato con cámara, menú hamburguesa, todo en una columna.

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
