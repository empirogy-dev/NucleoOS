# 01 — Visión y alcance

## 1. Visión de vida (norte del producto)
> "Generar ingresos desde internet, desde cualquier parte, haciendo algo que me gusta, sin sentirme esclavizado."

**NucleoOS** es la herramienta que ayuda a una persona a diseñar, organizar y hacer seguimiento de su vida completa en un solo lugar, con un asistente de IA que reduce la fricción: en vez de llenar formularios, **le hablas** y él registra, ordena y aconseja.

## 2. Problema
Hoy la vida está fragmentada en muchas apps: una para finanzas, otra para hábitos, otra para notas, otra para salud. Nada conversa entre sí, todo exige escribir manualmente, y nadie te da una visión integral ni consejos accionables. La gente abandona porque **registrar cuesta demasiado esfuerzo**.

## 3. Propuesta de valor
1. **Todo en un lugar** — 7 áreas de vida bajo un mismo techo, con un tablero global de progreso.
2. **Registro sin fricción** — hablas y la IA transcribe, entiende y guarda ("gasté 36 dólares en frutillas" → transacción registrada).
3. **Un coach personal** — el agente no solo guarda; te dice qué está bien y qué está mal según tus metas, proyectos y tu día a día, cruzando información entre áreas (mindfulness, ahorro, relaciones, salud).
4. **Seguimiento visible** — cada área muestra progreso y tendencias; el tablero de Inicio resume todo.

## 4. Usuario objetivo
- **Primario:** personas de 25–45 años que quieren ordenar su vida (finanzas, salud, hábitos, metas) y valoran el autoconocimiento y la productividad, pero se frustran con apps que exigen mucho tipeo.
- **Secundario:** emprendedores/independientes que necesitan trackear horas de trabajo, proyectos e ingresos.
- **Contexto de venta:** LatAm + mercado global de habla hispana e inglesa (multi-idioma y multi-moneda ya presentes en Fluxney).

## 5. Las 7 áreas (alcance funcional)
| Área | Núcleo | Diferenciador IA |
|------|--------|------------------|
| **Objetivos** | Visión de vida + metas por área con % de progreso | Consejos para definir y avanzar metas |
| **Finanzas** (Fluxney) | Cuentas, gastos, presupuestos, deudas, metas de ahorro, recibos | Registro por voz + match de recibos; consejos de ahorro |
| **Salud** | Psicólogo, remedios, dieta, tipo de sangre, exámenes, operaciones | Recordatorios (exámenes de sangre, déficits de hierro), vínculo con reloj (frecuencia cardíaca) |
| **Trabajo y Proyectos** | Proyectos + registro de trabajo diario y cálculo de horas | Estimación y resumen de dedicación |
| **Aprendizaje** | Cuadernos/notas tipo notebook, subir material | Resúmenes automáticos del material |
| **Hábitos y Rutinas** | Horas de levantarse/acostarse, ejercicio, caminata, tiempos | Consejos de mindfulness, yoga, flexibilidad, energía |
| **Relaciones** | Registro de vínculos + seguimiento | Bandeja de tips para mejores relaciones y apertura emocional |

**Capa transversal (vive sobre todas las áreas):**
- **Agente de IA por voz** — registrar, consultar y recibir consejos hablando.
- **Tablero de Inicio** — visión de vida, % meta-objetivo, áreas en riesgo, próximos pasos, avances recientes.
- **Seguimiento (tracking)** — historial de lo que has ido haciendo, por área y global.

## 6. Modelo de negocio: Freemium + Suscripción
| | **Free** | **Premium (suscripción)** |
|---|----------|---------------------------|
| Áreas | Todas, registro **manual** | Todas |
| Agente de voz | Limitado (ej. 10 registros/mes) | Ilimitado |
| Resúmenes IA (aprendizaje, consejos) | No / muestra | Sí |
| Conexión bancaria automática (futuro) | No | Sí |
| Sincronización con reloj / salud | No | Sí |
| Exportar datos / reportes | Básico | Completo |
| Multi-dispositivo | Sí | Sí |

> Diseño técnico: multi-usuario, aislamiento de datos por usuario y "gating" de funciones premium **desde la primera versión** (aunque los cobros se activen más tarde). Así no hay que rehacer la arquitectura para vender.

## 7. Alcance del MVP (primera versión vendible)
**Dentro:**
- Web responsive (funciona en móvil por navegador).
- Cuenta de usuario (registro/login) y datos privados por usuario.
- Tablero de Inicio + las 7 áreas con registro manual.
- Finanzas = Fluxney reusado con la UI nueva.
- Agente de voz básico para registrar en Finanzas y Objetivos ("gasté X en Y").
- Freemium con límites (aunque el cobro real puede activarse en fase posterior).

**Fuera del MVP (fases siguientes):**
- App móvil empaquetada (Capacitor) y escritorio (Tauri).
- Conexión bancaria automática (Belvo/Plaid/global).
- Sincronización con reloj inteligente / datos de salud.
- Resúmenes IA avanzados y consejos proactivos en todas las áreas.

## 8. Métricas de éxito (cómo sabemos que funciona)
- **Activación:** % de usuarios que registran algo en ≥3 áreas la primera semana.
- **Retención:** usuarios activos a 30 días (la app mostraba "5% sigue usando una app tras 30 días" como referencia del mercado a superar).
- **Fricción:** % de registros hechos por voz vs. manual (meta: la voz sube el registro).
- **Conversión:** % de free → premium.
