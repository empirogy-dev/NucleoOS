# 02 — Requisitos de usuario (RUS)

> Historias de usuario en formato: **"Como [usuario] quiero [acción] para [beneficio]"**.
> Cada una tiene un ID (`RU-AREA-##`), prioridad (**P0** = MVP, **P1** = v1, **P2** = después) y criterios de aceptación.

---

## Transversal (cuenta, agente de voz, tablero)

| ID | Historia | Prioridad |
|----|----------|-----------|
| RU-GEN-01 | Como persona quiero **crear una cuenta e iniciar sesión** para que mis datos sean privados y me sigan en cualquier dispositivo. | P0 |
| RU-GEN-02 | Como usuaria quiero un **tablero de Inicio** con mi visión de vida, % meta-objetivo, áreas en riesgo, ideas activas, próximos pasos y avances recientes, para ver todo de un vistazo. | P0 |
| RU-GEN-03 | Como usuaria quiero **hablarle a la app** y que transcriba y entienda lo que dije para registrar sin escribir. | P0 |
| RU-GEN-04 | Como usuaria quiero que el agente **me pregunte o confirme** cuando no entienda ("¿esto fue un gasto o un ingreso?") para evitar errores. | P1 |
| RU-GEN-05 | Como usuaria quiero **pedirle consejos al agente** por área ("¿cómo mejoro mi ahorro?") y recibir respuestas accionables. | P1 |
| RU-GEN-06 | Como usuaria quiero **cambiar idioma y moneda** para usar la app en mi contexto. | P0 (ya existe en Fluxney) |
| RU-GEN-07 | Como usuaria quiero un **modo claro/oscuro** para mi comodidad. | P1 (ya existe en Fluxney) |
| RU-GEN-08 | Como usuaria quiero un **coach de IA** que me diga qué está bien y qué está mal según mis metas, proyectos y mi día a día, y que cruce información entre áreas. | P1 |
| RU-GEN-09 | Como usuaria quiero **elegir mi propio tema de color** entre varias paletas calmadas (y ajustarlo), para que la app se sienta como un espacio personal mío. | P1 |

> **Las funciones de IA por módulo** (coach de metas, NotebookLM de aprendizaje, personal CRM de relaciones, captura de tiempo, hábitos, etc.) están detalladas y aprobadas en [06-ia-por-modulo.md](06-ia-por-modulo.md) y planificadas en la Fase 4. Los servicios y costos de IA, en [07-costos-servicios-ia.md](07-costos-servicios-ia.md).

**Criterio de aceptación RU-GEN-03 (voz):** al presionar el botón de micrófono y decir *"gasté 36 dólares en frutillas"*, la app muestra un borrador con `monto=36, categoría=frutas/comida, tipo=gasto` para confirmar y guardar.

---

## Objetivos

| ID | Historia | Prioridad |
|----|----------|-----------|
| RU-OBJ-01 | Como usuaria quiero **declarar mi visión de vida** en texto para que sea el norte del sistema. | P0 |
| RU-OBJ-02 | Como usuaria quiero **crear metas por área** con % de progreso y estado ("en camino", "en riesgo"). | P0 |
| RU-OBJ-03 | Como usuaria quiero **desglosar una meta en pasos/milestones** con su propio avance. | P1 |
| RU-OBJ-04 | Como usuaria quiero **registrar avances** con fecha y descripción para ver mi historia de progreso. | P0 |
| RU-OBJ-05 | Como usuaria quiero **recibir consejos** del agente para definir y avanzar mis metas. | P2 |

---

## Finanzas (Fluxney)

| ID | Historia | Prioridad |
|----|----------|-----------|
| RU-FIN-01 | Como usuaria quiero **registrar ingresos y gastos** con categoría, cuenta y fecha. | P0 (existe) |
| RU-FIN-02 | Como usuaria quiero **registrar un gasto por voz** y que se cree la transacción. | P0 |
| RU-FIN-03 | Como usuaria quiero **fotografiar un recibo** y que se extraiga el monto y comercio (OCR). | P0 (existe) |
| RU-FIN-04 | Como usuaria quiero **presupuestos por categoría** y ver cuánto llevo gastado. | P0 (existe) |
| RU-FIN-05 | Como usuaria quiero gestionar **cuentas, tarjetas de crédito y deudas** con recordatorios de pago. | P0 (existe) |
| RU-FIN-06 | Como usuaria quiero **metas de ahorro** y ver mi avance. | P0 (existe) |
| RU-FIN-07 | Como usuaria quiero un **reporte mensual** de mis finanzas. | P1 (existe) |
| RU-FIN-08 | Como usuaria quiero **conectar mi banco** y que los movimientos se importen y hagan *match* con mis recibos. | P2 (adaptador futuro) |
| RU-FIN-09 | Como usuaria quiero **importar la cartola** (PDF/archivo) del banco manualmente mientras no haya conexión automática. | P1 (existe base) |

---

## Salud

| ID | Historia | Prioridad |
|----|----------|-----------|
| RU-SAL-01 | Como usuaria quiero registrar **datos base de salud** (tipo de sangre, alergias, condiciones, operaciones). | P1 |
| RU-SAL-02 | Como usuaria quiero llevar **medicamentos/remedios** con horarios y recordatorios de toma. | P1 |
| RU-SAL-03 | Como usuaria quiero registrar **citas** (psicólogo, médico) y recibir recordatorios. | P1 |
| RU-SAL-04 | Como usuaria quiero registrar mi **dieta** y notas de alimentación. | P2 |
| RU-SAL-05 | Como usuaria quiero **recordatorios de exámenes** (ej. examen de sangre) y registrar resultados/déficits (ej. hierro). | P1 |
| RU-SAL-06 | Como usuaria quiero **vincular mi reloj inteligente** para traer frecuencia cardíaca, pasos y sueño. | P2 (móvil) |
| RU-SAL-07 | Como usuaria quiero **trackear una adicción que estoy dejando** (ej. marihuana, alcohol, cigarro): días limpios, hitos de recuperación del cuerpo ("tu memoria mejoró", "ya no hay THC en tu cuerpo") y premios semanales, para sentir que voy ganando. | P1 |

---

## Trabajo y Proyectos
> Conviven dos cosas distintas: **proyectos personales** (lo que quieres desarrollar) y tu **empleo/trabajo** (dónde trabajas, tu jornada y cómo te sientes ahí).

| ID | Historia | Prioridad |
|----|----------|-----------|
| RU-TRA-01 | Como usuaria quiero **crear proyectos personales** que quiero desarrollar, con estado y avance. | P0 |
| RU-TRA-02 | Como usuaria quiero **registrar mi empleo/trabajo** y llevar el registro de mi jornada (fui al trabajo, qué hice hoy). | P0 |
| RU-TRA-03 | Como usuaria quiero **registrar cómo me sentí en el trabajo** (¿feliz?, ánimo del día) para ver mi bienestar laboral en el tiempo. | P1 |
| RU-TRA-04 | Como usuaria quiero **registrar el trabajo del día** por proyecto para calcular mis horas. | P1 |
| RU-TRA-05 | Como usuaria quiero ver **total de horas** por proyecto y por periodo. | P1 |
| RU-TRA-06 | Como usuaria quiero **registrar por voz** lo que trabajé o cómo me sentí hoy. | P2 |

---

## Aprendizaje

| ID | Historia | Prioridad |
|----|----------|-----------|
| RU-APR-01 | Como usuaria quiero **cuadernos/notas** (estilo notebook) para organizar lo que aprendo. | P0 |
| RU-APR-02 | Como usuaria quiero **subir material** (texto, PDF, imagen) a un cuaderno. | P1 |
| RU-APR-03 | Como usuaria quiero que la IA **me haga un resumen** del material subido. | P1 |
| RU-APR-04 | Como usuaria quiero **buscar** dentro de mis cuadernos. | P2 |

---

## Hábitos y Rutinas

| ID | Historia | Prioridad |
|----|----------|-----------|
| RU-HAB-01 | Como usuaria quiero registrar **hora de levantarme y acostarme** para ver mi rutina de sueño. | P0 |
| RU-HAB-02 | Como usuaria quiero registrar **ejercicio y caminata** (tipo y tiempo dedicado). | P0 |
| RU-HAB-03 | Como usuaria quiero **crear hábitos** y marcar su cumplimiento diario (racha). | P1 |
| RU-HAB-04 | Como usuaria quiero **consejos de mindfulness, yoga, flexibilidad y energía** para mi bienestar. | P2 |

---

## Relaciones

| ID | Historia | Prioridad |
|----|----------|-----------|
| RU-REL-01 | Como usuaria quiero **registrar mis relaciones** importantes y notas sobre ellas. | P1 |
| RU-REL-02 | Como usuaria quiero una **bandeja de tips** para mejorar mis relaciones y abrirme emocionalmente. | P1 |
| RU-REL-03 | Como usuaria quiero **hacer seguimiento** (tracking) de cómo voy cultivando cada vínculo. | P2 |
| RU-REL-04 | Como usuaria quiero **recordatorios amables** para mantener mis relaciones orgánicas (nudges suaves para reconectar, sin presión). | P1 |

---

## Trazabilidad
Cada requisito de usuario se conecta con uno o más requisitos del sistema (ver [03-requisitos-sistema.md](03-requisitos-sistema.md)) y se planifica en una fase del [roadmap](05-roadmap-fases.md). Antes de programar cada bloque, se detalla con `/spec` de gstack.
