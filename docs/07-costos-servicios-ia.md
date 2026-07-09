# 07 — Costos y servicios de IA (investigación 2026)

> Objetivo: elegir servicios **económicos** para no gastar de más con pocos usuarios, y diseñar la app para **cambiar de proveedor sin reescribir** (igual que los adaptadores bancarios).

## Principio clave: capa de IA agnóstica de proveedor
Toda llamada a IA (voz, coach, resúmenes) pasa por **una capa interna con adaptadores**. La app pide "transcribe esto" o "analiza esto"; el adaptador decide qué proveedor usar. Así puedes empezar con lo más barato y cambiar a otro (o a Claude) sin tocar el resto de la app. **Ningún proveedor queda incrustado en el código.**

---

## 1. Voz → texto (transcripción)
La transcripción de voz corta es **muy barata**, y en móvil/navegador puede ser **gratis**.

| Opción | Precio aprox. | Nota |
|--------|---------------|------|
| **En el dispositivo** (Web Speech API en navegador / Speech nativo en móvil) | **$0** | Gratis, sin enviar audio a la nube. Es la opción por defecto. |
| **Groq** (Whisper Large v3 Turbo) | ~$0.0006/min | El más barato en la nube (~$0.60 por 1.000 min). Respaldo ideal. |
| Deepgram Nova-3 | ~$0.0036/min | Buena precisión. |
| OpenAI Whisper | ~$0.006/min | Estándar, económico. |
| Gemini (audio) | ~$0.037/min | Más caro para solo transcribir, pero puede **transcribir + entender** en una sola llamada. |

**Recomendación:** on-device primero (gratis) → Groq como respaldo cuando se necesite más precisión. Casi $0.

---

## 2. Agente / coach (el modelo que entiende y aconseja)
Aquí estaba tu duda con Claude. Comparación de los económicos (por millón de tokens, entrada/salida):

| Modelo | Entrada | Salida | Nota |
|--------|---------|--------|------|
| **DeepSeek V4 Flash** | $0.14 | $0.28 | El más barato de nivel "frontera"; caché hasta −98%. |
| **Gemini 2.5 Flash-Lite** | $0.10 | $0.40 | Muy barato **y con nivel gratis** en Google AI Studio. |
| GLM-4.6 (Z.ai) | $0.43 | $1.74 | La opción que mencionaste; sólida, media. |
| Gemini 2.5 Flash | $0.30 | $2.50 | Más capaz, algo más caro. |
| Claude Haiku 4.5 | $1.00 | $5.00 | El más caro del grupo económico (pero igual centavos con poco volumen). |

**Nivel gratis de Google AI Studio:** Gemini 2.5 Flash gratis, hasta **1M tokens/día y 60 solicitudes/min** — suficiente para el MVP con pocos usuarios (ojo: en el nivel gratis Google puede usar los datos para entrenar, así que para datos sensibles se pasa al pago).

**Recomendación:** empezar con **Gemini Flash-Lite** (o el nivel gratis) para el coach; **DeepSeek V4 Flash** como alternativa aún más barata. Dejar **Claude** solo como opción "premium" para tareas donde quieras la mejor calidad. Todo detrás de la capa agnóstica, así lo cambias cuando quieras.

---

## 3. Almacenamiento de recibos y archivos (tu idea local-first)
Tu intuición es correcta: **guardar en el dispositivo del usuario sale mucho más barato que la nube.** Es un patrón real y probado en 2026 ("local-first").

**Cómo funciona:**
- Los recibos/archivos se guardan **en el celular y en el computador del usuario** (base local tipo SQLite + archivos).
- Se **sincronizan** entre los dispositivos del propio usuario (celular → computador).
- La nube solo guarda un índice liviano (metadatos), no las imágenes pesadas → casi no consume almacenamiento pagado.

**Herramientas:** ElectricSQL, Turso o SQLite-Sync (sincronización sin conflictos, con Supabase/Postgres detrás).

**Si además quieres respaldo en la nube (plan premium):**
| Proveedor | Almacenamiento | Egress (descarga) | Nota |
|-----------|----------------|-------------------|------|
| **Cloudflare R2** | $0.015/GB | **$0 (gratis)** | Mejor para imágenes que se ven seguido; 10 GB gratis. |
| Backblaze B2 | $0.006/GB | Gratis vía Cloudflare | El almacenamiento más barato. |
| Supabase Storage | incluido (1 GB gratis) | 5 GB gratis, luego $0.09/GB | Cómodo porque ya usamos Supabase. |

**Recomendación:** local-first por defecto (barato y privado) + **Cloudflare R2** como respaldo opcional para premium (egress gratis evita sorpresas). El *egress* (descarga), no el almacenamiento, es lo que suele encarecer — por eso R2/B2.

---

## 4. Tu agente por WhatsApp *(pospuesto — decisión de la usuaria)*
> Se deja para más adelante: es buena idea pero suma complejidad y no es necesaria para el MVP. Registro por voz dentro de la app cubre la misma necesidad al inicio.

Idea válida y muy usable (registrar hablándole a WhatsApp). Opciones para cuando se retome:

| Opción | Costo | Nota |
|--------|-------|------|
| **Meta WhatsApp Cloud API** (oficial) | Mensajes iniciados por el usuario en ventana de 24h: nivel de servicio gratuito / muy bajo | Recomendada: legal y estable. Ideal si la usuaria le escribe a la app. |
| Twilio (sobre WhatsApp) | +$0.005/mensaje | Más fácil de integrar, un poco más caro. |
| Self-host (Baileys / whatsapp-web.js en un VPS $5–10/mes) | Solo el VPS | Lo más barato pero **contra los términos de Meta**; riesgo de baneo. No recomendado para producto de venta. |

**Recomendación:** usar la **API oficial de Meta** para tu propio agente de WhatsApp. La usuaria le manda un audio/foto por WhatsApp → tu agente lo procesa → lo guarda en la app. Encaja perfecto con la capa de voz e IA de arriba.

---

## 5. ¿Cuánto costaría de verdad al inicio?
Estimación mensual (voz on-device + Gemini Flash-Lite + local-first):

| Usuarios | Voz | Agente/coach | Almacenamiento | **Total aprox.** |
|----------|-----|--------------|----------------|------------------|
| **2 (inicio)** | $0 (on-device) | ~$0 (nivel gratis) | $0 (local/free) | **≈ $0–1 / mes** |
| 100 | $0 | ~$5–15 | ~$1–5 (R2) | **≈ $10–25 / mes** |
| 1.000 | ~$5 (respaldo Groq) | ~$40–80 | ~$10–20 | **≈ $60–120 / mes** |

A esto se suma Supabase (gratis al inicio, **$25/mes** el plan Pro cuando crezcas) y, si usas WhatsApp propio, un VPS opcional ($5–10/mes).

**Conclusión:** con pocos usuarios **no gastas $500** — gastas cerca de **$0**. Los costos crecen solo cuando crecen los usuarios (y para entonces ya cobras premium). El diseño agnóstico te deja bajar costos cambiando de proveedor cuando quieras.

---

## Fuentes
- Voz: [SiliconFlow — STT más baratos 2026](https://www.siliconflow.com/articles/en/the-cheapest-speech-to-text-ai-provider) · [EdenAI](https://www.edenai.co/post/best-speech-to-text-apis)
- Modelos: [GLM pricing](https://felloai.com/glm-pricing/) · [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing) · [DeepSeek pricing](https://api-docs.deepseek.com/quick_start/pricing/) · [Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing) · [Google AI Studio free tier](https://pecollective.com/tools/gemini-free-tier-guide/)
- Almacenamiento: [Supabase pricing](https://supabase.com/pricing) · [Cloudflare R2](https://developers.cloudflare.com/r2/pricing/) · [Backblaze B2](https://www.backblaze.com/cloud-storage/pricing) · [Turso local-first](https://turso.tech/local-first)
- WhatsApp: [Twilio WhatsApp pricing](https://www.twilio.com/en-us/whatsapp/pricing) · [respond.io](https://respond.io/blog/whatsapp-business-api-pricing) · [Baileys self-host](https://valebyte.com/en/blog/whatsapp-bot-on-vps-via-baileys-free-instead-of-whatsapp-business-api/)
