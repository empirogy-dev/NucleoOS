# 03 — Requisitos del sistema

> **RF** = Requisito Funcional (qué debe hacer el sistema). **RNF** = Requisito No Funcional (cómo debe comportarse: calidad, seguridad, rendimiento).

---

## A. Requisitos funcionales (RF)

### Cuenta y multi-usuario
- **RF-01** El sistema debe permitir registro e inicio de sesión (email/contraseña y opción social).
- **RF-02** Cada usuario solo puede ver y editar sus propios datos (aislamiento total).
- **RF-03** El sistema debe distinguir plan **Free** y **Premium** y bloquear/permitir funciones según el plan (feature gating).
- **RF-04** El usuario debe poder cerrar sesión y usar la cuenta desde varios dispositivos con datos sincronizados.

### Tablero y navegación
- **RF-05** Debe existir un tablero de **Inicio** que agregue: visión de vida, % meta-objetivo global, áreas en riesgo, ideas activas, próximos pasos, áreas totales y avances recientes.
- **RF-06** Debe existir navegación lateral a las 7 áreas + Inicio.
- **RF-07** Cada área debe mostrar su % de progreso y su historial de avances.

### Agente de IA y voz
- **RF-08** El sistema debe capturar audio del micrófono y **transcribirlo a texto**.
- **RF-09** El agente debe **interpretar** el texto y convertirlo en una acción estructurada (ej. crear transacción, avance de meta, registro de hábito).
- **RF-10** Antes de guardar, el agente debe mostrar un **borrador editable** para que el usuario confirme.
- **RF-11** El agente debe poder **responder consultas y dar consejos** por área.
- **RF-12** El sistema debe registrar cada interacción del agente para trazabilidad y mejora.

### Finanzas (módulo Fluxney)
- **RF-13** CRUD de transacciones (ingreso/gasto/transferencia) con categoría, cuenta, fecha, descripción.
- **RF-14** CRUD de cuentas, tarjetas de crédito, deudas, categorías y metas de ahorro.
- **RF-15** Presupuestos por categoría con cálculo de gasto acumulado.
- **RF-16** OCR de recibos (foto → monto/comercio) y adjuntar imagen del recibo.
- **RF-17** Recordatorios de pagos (deudas/tarjetas) con recurrencia.
- **RF-18** Reporte mensual y tracker de ahorro.
- **RF-19** **Capa de fuentes de datos financieras** con adaptadores: `manual`, `voz`, `recibo-ocr`, `import-cartola`, y (futuro) `api-bancaria`. Toda transacción registra su `source`.
- **RF-20** (Futuro) Adaptador de conexión bancaria que importa movimientos y hace *match* con transacciones/recibos existentes.

### Objetivos
- **RF-21** Declarar visión de vida (texto).
- **RF-22** CRUD de metas con % de progreso, estado y desglose en milestones.
- **RF-23** Registro de avances con fecha y descripción.

### Salud
- **RF-24** Registrar datos base (tipo de sangre, alergias, condiciones, operaciones).
- **RF-25** CRUD de medicamentos con horarios y recordatorios.
- **RF-26** CRUD de citas médicas con recordatorios.
- **RF-27** Recordatorios de exámenes y registro de resultados/déficits.
- **RF-28** (Futuro, móvil) Integración con Apple HealthKit / Google Health Connect para frecuencia cardíaca, pasos y sueño.

### Trabajo y Proyectos
- **RF-29** CRUD de proyectos con estado y avance.
- **RF-30** Registro de trabajo diario asociado a proyecto, con duración.
- **RF-31** Cálculo de horas por proyecto y por periodo.

### Aprendizaje
- **RF-32** CRUD de cuadernos/notas.
- **RF-33** Subir material (texto/PDF/imagen) a un cuaderno (almacenamiento de archivos).
- **RF-34** Generar resumen IA del material.
- **RF-35** Búsqueda dentro de cuadernos.

### Hábitos y Rutinas
- **RF-36** Registrar hora de levantarse/acostarse.
- **RF-37** Registrar ejercicio/caminata (tipo y duración).
- **RF-38** CRUD de hábitos con marcación diaria y racha.

### Relaciones
- **RF-39** CRUD de relaciones con notas.
- **RF-40** Bandeja de tips y seguimiento por vínculo.

---

## B. Requisitos no funcionales (RNF)

### Multi-plataforma (crítico para no rehacer versiones)
- **RNF-01** Una sola base de código sirve web, móvil (iOS/Android) y escritorio (Windows/Mac/Linux). La lógica de negocio y la UI se comparten; solo cambia el "envoltorio" nativo.
- **RNF-02** El diseño debe ser **responsive** (móvil, tablet, escritorio) desde el inicio.
- **RNF-03** Las funciones nativas (micrófono, cámara, salud, notificaciones) se acceden mediante una capa de abstracción, con *fallback* en web.

### Seguridad y privacidad
- **RNF-04** Aislamiento de datos por usuario a nivel de base de datos (Row Level Security).
- **RNF-05** Datos sensibles (salud, finanzas) cifrados en tránsito (HTTPS) y en reposo.
- **RNF-06** Cumplimiento de buenas prácticas de privacidad (consentimiento, exportar y borrar mis datos).
- **RNF-07** Ningún secreto (API keys) vive en el cliente; las llamadas a IA/OCR pasan por el backend.

### Rendimiento y disponibilidad
- **RNF-08** Carga inicial de la app < 3 s en conexión normal.
- **RNF-09** Respuesta de registro (guardar) < 1 s percibido (optimista).
- **RNF-10** La transcripción de voz debe devolver borrador en < 5 s para audios cortos.

### Usabilidad y accesibilidad
- **RNF-11** Registrar algo por voz debe tomar ≤ 2 toques (abrir mic → hablar → confirmar).
- **RNF-12** Contraste y tamaños accesibles (WCAG AA), navegación por teclado en web.
- **RNF-13** Multi-idioma (español/inglés al inicio) y multi-moneda.

### Mantenibilidad y escalabilidad
- **RNF-14** Código en TypeScript, tipado y modular por área.
- **RNF-15** Modelo de datos versionado con migraciones.
- **RNF-16** La arquitectura debe permitir agregar un adaptador (banco, país, dispositivo) sin tocar el núcleo.

### Costos (relevante para solo-builder)
- **RNF-17** Infraestructura con capa gratuita al inicio (Supabase free) y costos que crecen con usuarios.
- **RNF-18** Uso de IA (voz/consejos) medido y limitado por plan para controlar costos.

---

## Matriz de trazabilidad (resumen)
| Área | Requisitos de usuario | Requisitos de sistema |
|------|-----------------------|-----------------------|
| Transversal | RU-GEN-01..07 | RF-01..12, RNF-* |
| Objetivos | RU-OBJ-01..05 | RF-21..23 |
| Finanzas | RU-FIN-01..09 | RF-13..20 |
| Salud | RU-SAL-01..06 | RF-24..28 |
| Trabajo | RU-TRA-01..04 | RF-29..31 |
| Aprendizaje | RU-APR-01..04 | RF-32..35 |
| Hábitos | RU-HAB-01..04 | RF-36..38 |
| Relaciones | RU-REL-01..03 | RF-39..40 |
