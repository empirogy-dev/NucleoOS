# 05 — Roadmap y fases del ciclo de vida

> Metodología: **iterativa e incremental** (entregas pequeñas y usables). Cada fase pasa por el ciclo de gstack: `spec → plan → build → /review → /qa → /ship`.

## Mapa general

```
FASE 0  Fundaciones        →  FASE 1  MVP web         →  FASE 2  Voz + IA
   (base + diseño)             (7 áreas manual)           (agente que registra)
        │                            │                          │
        ▼                            ▼                          ▼
FASE 3  Móvil + Escritorio  →  FASE 4  Salud/Reloj +    →  FASE 5  Banca global
   (Capacitor + Tauri)           Aprendizaje IA             + monetización
```

---

## FASE 0 — Fundaciones y diseño *(base para todo lo demás)*
**Objetivo:** dejar el esqueleto técnico y visual sobre el que se construye todo.
- Crear el proyecto unificado (React+TS+Vite+Tailwind+Supabase) y traer las libs base de Fluxney (auth, currency, i18n, theme).
- Definir el **design system / UI nueva** (con `/design-consultation` de gstack) — paleta, tipografía, componentes.
- Montar el **shell**: navegación de 7 áreas + tablero de Inicio (con datos de ejemplo).
- Configurar Supabase: auth, tablas núcleo (`profiles`, `life_vision`, `activity_log`) con RLS.
- **Entregable:** app web navegable, con login, tablero vacío y las 7 secciones esqueleto.
- **Requisitos cubiertos:** RF-01, RF-02, RF-05, RF-06, RNF-01, RNF-02, RNF-04.
- **Estado:** ✅ Diseño ([`DESIGN.md`](../DESIGN.md)) + ✅ shell navegable con las 7 áreas, tablero de Inicio y temas de usuario (carpeta [`app/`](../app)). ⏳ Falta: auth + login con Supabase.

## FASE 1 — MVP web: las 7 áreas con registro manual
**Objetivo:** que la app sea **útil** aunque todo se registre a mano.
- **Finanzas:** migrar Fluxney al shell con la UI nueva (aquí está el grueso del valor y ya está casi listo). Añadir el campo `source`.
- **Objetivos:** visión de vida + metas con % + avances.
- **Trabajo:** proyectos + registro de trabajo.
- **Hábitos:** sueño, ejercicio/caminata, hábitos con racha.
- **Salud / Aprendizaje / Relaciones:** versión básica (registro manual y listados).
- Tablero de Inicio conectado a datos reales (progreso por área, avances recientes).
- **Entregable:** primera versión **usable y demostrable** (tu propio uso + primeras pruebas con usuarios).
- **Requisitos:** RU/RF marcados **P0**.

## FASE 2 — Agente de voz que registra (+ coach básico)
**Objetivo:** el diferenciador — hablar en vez de escribir, y un coach que responde.
- Captura de micrófono + transcripción **on-device (gratis)**, con Groq de respaldo.
- **Capa de IA agnóstica** (Gemini Flash-Lite / DeepSeek al inicio): texto → acción estructurada + **borrador editable**.
- **Coach básico:** el agente comenta lo que registras según tus metas ("este gasto te aleja de tu meta de ahorro").
- Integrar voz primero en **Finanzas** ("gasté 36 en frutillas") y **Objetivos** (avances), luego resto de áreas.
- (Pospuesto) canal por **WhatsApp** — buena idea, se retoma más adelante.
- Registrar interacciones en `ai_conversations`.
- **Entregable:** registrar por voz + primeras devoluciones del coach.
- **Requisitos:** RU-GEN-03/04/08, RF-08..12, RU-FIN-02. Costos: ver [07](07-costos-servicios-ia.md).

## FASE 3 — Móvil + Escritorio (misma base)
**Objetivo:** llevar la app a los tres formatos sin reescribir.
- Empaquetar con **Capacitor** (iOS/Android): micrófono, cámara (recibos), notificaciones nativas.
- Empaquetar con **Tauri** (Windows/Mac/Linux).
- Ajustes responsive finos y navegación táctil.
- **Entregable:** apps instalables en teléfono y computador.
- **Requisitos:** RNF-01, RNF-03; publicación en tiendas.

## FASE 4 — El coach completo: IA por módulo (ver [06](06-ia-por-modulo.md))
**Objetivo:** desplegar las funciones de IA investigadas que hacen al producto vendible.
- **Coach transversal:** consejos que cruzan áreas ("dormiste mal → tu foco bajó"); resumen semanal de vida en audio.
- **Aprendizaje estilo NotebookLM:** subir material, chat con citas, resumen/guía/mapa mental/flashcards/quiz.
- **Relaciones (personal CRM):** recordatorios "mantente en contacto", línea de tiempo por voz, memoria de detalles, tips de apertura emocional.
- **Trabajo:** captura automática de tiempo (escritorio) + Focus Score.
- **Hábitos:** coach conductual, rutina personalizada, contenido guiado (mindfulness, yoga, respiración).
- **Objetivos:** desglose SMART automático + coach de metas.
- **Salud:** medicamentos, citas, exámenes con recordatorios; datos base; **sincronización con reloj** (HealthKit/Health Connect).
- **Requisitos:** todas las historias de IA del doc [06](06-ia-por-modulo.md) + RF-24..28, RF-33..35.

## FASE 5 — Banca global + monetización
**Objetivo:** cerrar el modelo de negocio y la automatización financiera.
- **Cobros:** Stripe (web) + RevenueCat (móvil); activar el gating Free/Premium real.
- **Adaptadores bancarios:** empezar por un proveedor (Belvo LatAm o Plaid USA) y sumar más; *match* automático con recibos.
- Exportar datos, reportes premium, analítica de conversión.
- **Requisitos:** RF-03, RF-19/20, RU-FIN-08.

---

## Ciclo de vida por cada entrega (cómo trabajamos cada fase)
1. **Especificación** — `/spec`: convertir la historia de usuario en spec ejecutable (criterios de aceptación claros).
2. **Diseño** — UI en el design system; `/plan-design-review`.
3. **Plan técnico** — `/plan-eng-review`: modelo de datos, componentes, riesgos.
4. **Construcción** — implementar por vertical (una función end-to-end a la vez).
5. **Revisión** — `/review` (código) y `/qa` (funciona de verdad en el navegador).
6. **Publicación** — `/ship`: pruebas, versión, changelog, deploy.
7. **Retro** — `/retro`: qué mejorar antes de la siguiente fase.

## Riesgos y mitigaciones
| Riesgo | Mitigación |
|--------|-----------|
| Alcance enorme (7 áreas) abruma | Fases pequeñas; Finanzas ya está casi lista → victoria temprana. |
| Costos de IA (voz/consejos) | Límites por plan (RNF-18); nativo en móvil para transcripción. |
| Cobros en tiendas (comisión 30%) | RevenueCat + ofrecer suscripción también por web (Stripe). |
| Datos sensibles (salud/finanzas) | RLS + cifrado + exportar/borrar datos desde el día 1. |
| "Rehacer versiones" | Una base de código (Capacitor/Tauri) + capa de adaptadores. |

## Próximo paso inmediato sugerido
Arrancar **Fase 0** con `/design-consultation` (definir la UI nueva) en paralelo a crear el proyecto unificado y traer las bases de Fluxney. ¿Lo empezamos?
