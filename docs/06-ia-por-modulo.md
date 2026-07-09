# 06 — IA por módulo (investigación 2026)

> Basado en investigación de los mejores productos con IA en cada dominio (julio 2026). Cada propuesta indica su prioridad sugerida y en qué se apoya. Estas ideas se integran como nuevas historias de usuario en [02-requisitos-usuario.md](02-requisitos-usuario.md).

## La idea rectora: el agente ve TODO
El diferenciador del Sistema de Vida frente a apps sueltas es que **un solo agente observa las 7 áreas a la vez**. Eso habilita consejos imposibles para una app aislada:
- "Dormiste mal 4 noches y tu foco en Trabajo bajó — ¿bajamos la carga esta semana?"
- "Gastaste 30% más este mes; tu meta de ahorro quedó en riesgo, ¿la ajustamos?"
- "Llevas 3 semanas sin ver a tu mamá y marcaste esa relación como prioritaria."

**Resumen semanal de vida (Audio Overview propio):** el agente genera un "podcast" de 2 minutos que te cuenta cómo estuvo tu semana en todas las áreas y qué ajustar. (Inspirado en NotebookLM aplicado a tus propios datos.)

---

## Objetivos
| Idea IA | Qué hace | Prioridad |
|---------|----------|-----------|
| **Desglose SMART automático** | Dices una meta grande y el agente la parte en milestones concretos y medibles. | P1 |
| **Coach de metas** | Revisa el progreso, detecta metas estancadas o "en riesgo" y sugiere el siguiente paso. | P1 |
| **Check-in por voz** | El agente te pregunta cómo vas (semanal) y actualiza avances con lo que respondes. | P2 |
| **Asignación de tiempo real vs planeado** | Muestra cuánto tiempo dedicaste realmente a cada meta (conecta con Trabajo/Hábitos). | P2 |
| **Vision board / infografía** | Convierte tu visión de vida en un tablero visual motivador. | P2 |

*Apoyo: Goals Wizard (SMART goals con GPT-5, milestones, time log), GoalsOnTrack, Betterworks Goal Assist, Coach.me.*

---

## Trabajo y Proyectos
| Idea IA | Qué hace | Prioridad |
|---------|----------|-----------|
| **Captura automática de tiempo** (escritorio) | Detecta en qué apps/documentos trabajaste y lo asigna solo al proyecto correcto — resuelve "calcular mejor mis horas" **sin escribir nada**. | P1 |
| **Registro por voz** | "Hoy trabajé 2 horas en el proyecto X" → queda registrado. | P1 |
| **Bienestar laboral** | Registras cómo te sentiste en el trabajo y el coach detecta tendencias ("llevas 2 semanas con el ánimo bajo los lunes"). | P1 |
| **Focus Score / anti context-switching** | Mide tu calidad de foco, cuántas veces te distraes y cuándo rindes mejor; avisa de riesgo de burnout. | P2 |
| **Horas facturables por proyecto/cliente** | Timesheet automático; conecta con Finanzas para calcular ingresos por proyecto. | P2 |
| **Estimación asistida** | El agente estima cuánto tomará un proyecto según tu historial. | P2 |

*Apoyo: Rize (Focus Quality Score, categorización automática, "recuperan 20% más horas"), Timely, TimeCamp (agente de timesheet), Hubstaff.*

---

## Aprendizaje (estilo NotebookLM)
| Idea IA | Qué hace | Prioridad |
|---------|----------|-----------|
| **Respuestas fundamentadas en TU material (RAG con citas)** | El agente responde solo desde tus cuadernos, con citas, sin inventar. | P1 |
| **Genera formatos de estudio de un clic** | Resumen, guía de estudio, mapa mental, flashcards, quiz, tabla de datos, infografía. | P1 |
| **Audio Overview** | Convierte tus apuntes en un "podcast" de 2 voces que puedes escuchar; puedes interrumpir y preguntar por voz. | P2 |
| **Conexión entre múltiples fuentes** | No trata cada archivo aislado: encuentra relaciones y arma un resumen unificado. | P2 |
| **Subir cualquier fuente** | PDF, web, imagen, audio, video → todo se vuelve consultable. Multi-idioma. | P1 |
| **Chat con tus cuadernos** | Pregúntale a lo que subiste. | P1 |

*Apoyo: Google NotebookLM 2026 (Audio/Video Overview, Mind Maps, quizzes, flashcards, source-grounded RAG, 80+ idiomas, conexión entre fuentes).*

---

## Hábitos y Rutinas
| Idea IA | Qué hace | Prioridad |
|---------|----------|-----------|
| **Coach conductual sin culpa** | Analiza tus patrones, detecta fricción y sugiere micro-ajustes e "identity shifts" (estilo Hábitos Atómicos). | P1 |
| **Predicción de ruptura de racha** | Te avisa cuándo es probable que falles un hábito y actúa antes. | P2 |
| **Horario óptimo por hábito** | Sugiere la mejor hora para cada hábito según cuándo sí lo cumples. | P2 |
| **Rutina personalizada** | Eliges meta (mejor sueño, foco, fitness, mindfulness) → plan diario a medida. | P1 |
| **Contenido guiado** | Mindfulness, CBT/estoicismo, yoga, respiración, "conexión con el corazón", flexibilidad y energía — lo que pediste. | P2 |
| **Gamificación ligera** | XP, rachas y misiones generadas por IA para sostener la motivación. | P2 |
| **Tracker de sobriedad** | Dejar una adicción con días limpios, hitos de recuperación física reales ("a los 30 días tu memoria mejora") y celebraciones — estilo apps de sobriedad. Vive entre Salud y Hábitos. | P1 |

*Apoyo: BeeDone (coach + gamificación), BeBetterHabits (habits vía Claude), Habit AI (coach conductual diario, tailored routine builder), Way of Life (predicción de rachas), Stoic (CBT/estoicismo), Habitica (gamificación).*

---

## Relaciones (Personal CRM con IA)
| Idea IA | Qué hace | Prioridad |
|---------|----------|-----------|
| **Recordatorios amables** | Nudges suaves para reconectar y mantener relaciones orgánicas, según la importancia del vínculo — sin presión ni culpa. | P1 |
| **Línea de tiempo por voz** | "Hablé con mi mamá del viaje" → queda registrado en el historial de ese vínculo. | P1 |
| **Recuerda los detalles** | Cumpleaños, familia, gustos, regalos, temas pendientes, cómo se conocieron. | P1 |
| **Prep antes de ver a alguien** | El agente te resume: "la última vez hablaron de X; su cumple es en 5 días." | P2 |
| **Tips de comunicación / apertura emocional** | Consejos personalizados por vínculo para abrirte y conectar mejor — lo que pediste. | P1 |
| **Borrador de mensaje en tu voz** | Sugiere qué escribir para retomar el contacto. | P2 |
| **(Futuro) Integración** | WhatsApp / calendario para no tener que registrar a mano. | P2 |

*Apoyo: Dex (Copilot, keep-in-touch, timeline), folk, Clay, Keep AI, Rings.ai — todos convergen en: recordatorios de cadencia, timeline de interacciones, memoria de detalles y borradores de mensaje.*

---

## Impacto en prioridades
Varias de estas ideas suben el valor de módulos que estaban en "básico" para el MVP:
- **Aprendizaje** con estilo NotebookLM y **Relaciones** como personal CRM son diferenciadores fuertes de venta → vale la pena que su versión con IA llegue en **Fase 4**, no más tarde.
- La **captura automática de tiempo** en Trabajo es un "wow" concreto para emprendedores → candidata a Fase 4.

## Fuentes
- NotebookLM: [blog.google](https://blog.google/innovation-and-ai/products/notebooklm-audio-overviews/) · [DigitalOcean](https://www.digitalocean.com/resources/articles/what-is-notebooklm) · [notebooklm.google](https://notebooklm.google/audio)
- Hábitos con IA: [BeeDone](https://beedone.co/en/blog/best-ai-habit-tracking-apps-2026/) · [Reclaim](https://reclaim.ai/blog/habit-tracker-apps) · [KnowAIUse](https://knowaiuse.com/ai-habit-tracker-apps-that-actually-stick/)
- Personal CRM: [Dex](https://getdex.com/blog/personal-crm-for-networking/) · [folk](https://www.folk.app/articles/best-ai-personal-crm) · [Rings.ai](https://www.rings.ai/blog/personal-crm)
- Tiempo/Proyectos: [The Digital Project Manager](https://thedigitalprojectmanager.com/tools/best-ai-time-tracking-software/) · [Rize](https://rize.io/l/ai-time-tracker) · [Hubstaff](https://hubstaff.com/blog/best-ai-time-tracking-software/)
- Metas/OKR: [Reclaim](https://reclaim.ai/blog/goal-tracker-apps) · [ClickUp](https://clickup.com/blog/goal-tracking-apps/) · [Goals Wizard](https://apps.apple.com/in/app/goals-2026-ai-goal-tracker/id901800555)
