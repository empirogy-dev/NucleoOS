# Sistema de Vida (Segundo Cerebro)

> App SaaS todo-en-uno para organizar la vida en **7 áreas** (Objetivos, Finanzas, Salud, Trabajo y Proyectos, Aprendizaje, Hábitos y Rutinas, Relaciones), con un **agente de IA por voz** que registra, aconseja y hace seguimiento. Multi-plataforma (web → móvil → escritorio) desde una sola base de código.

**Documentación completa en [`docs/`](docs/00-indice.md)** — visión, requisitos de usuario, requisitos de sistema, arquitectura y roadmap.

## Decisiones base
- **Negocio:** Freemium + suscripción (SaaS multi-usuario).
- **Plataformas:** Web primero → móvil (Capacitor) → escritorio (Tauri), una sola base de código.
- **Stack:** React 19 + TypeScript + Vite + Tailwind + Supabase (+ Claude para el agente).
- **Finanzas:** se reutiliza **Fluxney** (carpeta `Fluxney/`) como módulo, con **UI nueva**.
- **Banca:** empezar sin conexión (recibo/voz/cartola); agregar proveedores (Belvo/Plaid) como adaptadores después.

## Sistema de diseño
Leer siempre [`DESIGN.md`](DESIGN.md) antes de cualquier decisión visual o de UI. Ahí están los temas (elegibles por el usuario), colores, tipografía (Outfit títulos / Inter cuerpo), espaciado y dirección estética. No desviarse sin aprobación explícita. En modo QA, marcar cualquier código que no cumpla `DESIGN.md`.

## gstack

Este proyecto usa [gstack](https://github.com/garrytan/gstack) para trabajo asistido por IA.

- Usa `/browse` de gstack para toda navegación web.
- Flujo de sprint (7 etapas): `/office-hours` → `/plan-ceo-review` → `/plan-eng-review` → `/review` → `/qa` → `/ship` → `/retro`.
- Skills disponibles: `/spec`, `/investigate`, `/design-consultation`, `/health`, `/office-hours`, y el resto del suite gstack.

### Primeros pasos
- Idea nueva / repo vacío: `/office-hours` o `/spec`
- Código existente: `/qa` para verlo funcionar, o `/investigate`
