# NucleoOS — Documentación del proyecto

> App todo-en-uno para organizar la vida en 7 áreas (Objetivos, Finanzas, Salud, Trabajo y Proyectos, Aprendizaje, Hábitos y Rutinas, Relaciones), con un **agente de IA por voz** que registra, aconseja y hace seguimiento.

## Decisiones base (tomadas)
- **Modelo de negocio:** Freemium + suscripción (SaaS multi-usuario).
- **Orden de plataformas:** Web primero → móvil (iOS/Android) → escritorio, desde **una sola base de código**.
- **Finanzas:** se reutiliza **Fluxney** como módulo, con **UI nueva**.
- **Banca:** empezamos sin conexión bancaria (recibo/voz/cartola); se agrega después vía "adaptadores".

## Índice
| # | Documento | Qué contiene |
|---|-----------|--------------|
| 01 | [Visión y alcance](01-vision-alcance.md) | Problema, usuario, propuesta de valor, modelo freemium, alcance MVP |
| 02 | [Requisitos de usuario (RUS)](02-requisitos-usuario.md) | Historias de usuario por área — qué puede hacer la persona |
| 03 | [Requisitos del sistema](03-requisitos-sistema.md) | Requisitos funcionales (RF) y no funcionales (RNF) |
| 04 | [Arquitectura y stack](04-arquitectura-stack.md) | Tecnología, estrategia multi-plataforma, modelo de datos, voz/IA, banca |
| 05 | [Roadmap y fases](05-roadmap-fases.md) | Fases del ciclo de vida, hitos, MVP → v1 → v2 |
| 06 | [IA por módulo](06-ia-por-modulo.md) | Investigación 2026: qué funciones de IA agregar a cada área (coach) |
| 07 | [Costos y servicios de IA](07-costos-servicios-ia.md) | Proveedores económicos de voz/IA, almacenamiento local-first, WhatsApp, costo estimado |
| WA | Agente de WhatsApp: [brief](whatsapp/BRIEF.md) · [arquitectura](whatsapp/ARQUITECTURA-OBJETIVO.md) · [blueprint](whatsapp/BLUEPRINT.md) · [user stories](whatsapp/USER-STORIES.md) · [seguridad](whatsapp/SECURITY-AUDIT.md) | El escriba y el cartero de NucleoOS por WhatsApp: registrar por chat y avisos proactivos, con plan de construcción por fases |

## Cómo usamos gstack junto a estos docs
- `/spec` → convierte una historia de usuario de este doc en una especificación ejecutable antes de programar.
- `/office-hours` → afinar el enfoque de producto cuando dudemos de alcance.
- `/plan-eng-review` → revisar el plan técnico de cada fase.
- `/qa`, `/review`, `/ship` → construir, revisar y publicar cada entrega.
