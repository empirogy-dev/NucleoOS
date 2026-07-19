# F1 — Tus pasos, Barbie (Meta WhatsApp Cloud API)

> El código ya está construido: la migración `0051_whatsapp.sql`, las Edge Functions
> `wa-entrada` y `wa-motor`, y la tarjeta de WhatsApp en Ajustes. Esto es lo que te toca
> a ti, en orden. Igual que siempre: las llaves se pegan solo en Supabase, nunca en el chat.
>
> **Cambio de proveedor:** YCloud no acepta cuentas de tu país, así que usamos la
> **API oficial de Meta directa** (WhatsApp Cloud API). Ventajas: funciona en Canadá,
> es gratis para conversaciones que tú inicias respondiendo, y trae un **número de prueba**
> para probar el bot HOY sin comprar nada. La app de tu curso enseña los mismos conceptos
> (webhook, ventana de 24 h, templates); solo cambia quién te da el número.

## 1. App de Meta con WhatsApp (15 minutos)
1. Entra a **developers.facebook.com** con tu cuenta de Facebook → My Apps → **Create App**.
2. Tipo **Business**, ponle nombre (ej. "NucleoOS").
3. En el panel de la app, busca **WhatsApp** → Set up. Meta te crea:
   - un **número de prueba** (Test number) desde el que el bot enviará mensajes,
   - un **Phone Number ID** (cópialo, lo vas a necesitar),
   - un **token temporal** de 24 horas (sirve para probar hoy).
4. En WhatsApp → API Setup, en la sección **To**, agrega TU número personal como
   destinatario de prueba (te llega un código por WhatsApp para verificarlo).
   El número de prueba solo puede escribirle a números verificados: perfecto para F1.
5. Copia también el **App Secret**: App Settings → Basic → App Secret → Show.

## 2. Secretos en Supabase (Dashboard → Edge Functions → Secrets)
Agrega cuatro secretos nuevos (GEMINI_API_KEY ya existe):

| Secreto | Valor |
|---------|-------|
| `WHATSAPP_TOKEN` | el token de acceso (el temporal de 24 h para probar; luego el permanente del paso 7) |
| `WHATSAPP_PHONE_ID` | el Phone Number ID del número de prueba |
| `META_APP_SECRET` | el App Secret de tu app de Meta |
| `WHATSAPP_VERIFY_TOKEN` | una palabra que TÚ inventas (ej. `nucleoos-2026`), la usarás en el paso 4 |

## 3. Desplegar las dos funciones (Dashboard → Edge Functions)
1. Crea la función **`wa-entrada`**, pega el contenido de
   `supabase/functions/wa-entrada/index.ts` y despliega.
   ⚠️ **Importante:** en los detalles de la función, **desactiva "Verify JWT"**
   (Meta no tiene sesión de Supabase; la seguridad la pone la firma HMAC).
2. Crea la función **`wa-motor`**, pega el contenido de
   `supabase/functions/wa-motor/index.ts` y despliega, también sin "Verify JWT"
   (se protege sola: exige tu service role key en cada llamada, solo el cron la tiene).

## 4. Conectar el webhook (en Meta)
1. En tu app de Meta: WhatsApp → **Configuration** → Webhook → Edit.
2. **Callback URL:** `https://devxnjumkapxqguasgaz.supabase.co/functions/v1/wa-entrada`
3. **Verify token:** la palabra que inventaste en el paso 2.
4. Guarda: Meta hace un GET de verificación y la función le responde. Si dice
   "verified", quedó.
5. En **Webhook fields**, suscríbete a **messages** (solo ese campo).

## 5. Migración 0051 (SQL Editor)
1. Abre `supabase/migrations/0051_whatsapp.sql`.
2. Reemplaza `PEGA_AQUI_TU_SERVICE_ROLE_KEY` por tu service role key
   (Dashboard → Settings → API → service_role). Como siempre: esa llave solo
   se pega ahí, nunca en el chat ni en GitHub.
3. Pega todo en el SQL Editor y Run.

## 6. La prueba de oro de F1 (hoy mismo, con el número de prueba)
1. En la app: **Ajustes → WhatsApp → Generar código**.
2. Desde tu WhatsApp personal, escríbele al **número de prueba** de Meta:
   `vincular 123456` (tu código).
3. El bot debe responder el saludo de bienvenida.
4. Mándale: `recuérdame comprar pan`.
5. En ~1 minuto (el cron corre cada minuto) el bot confirma,
   y la tarea aparece en el Inicio de la app. 🎉
6. Mándale un audio: "hice 30 minutos de gimnasio". Debe quedar en Energía.
7. Mándale `deshacer`: debe borrar ese registro y decírtelo.

## 7. Después de la prueba: dejarlo permanente
1. **Token permanente:** el token de prueba muere en 24 h. En
   business.facebook.com → Business Settings → Users → **System Users**, crea un
   system user (rol Admin), dale acceso a la app y genera un token con permisos
   `whatsapp_business_messaging` y `whatsapp_business_management`, sin expiración.
   Reemplaza `WHATSAPP_TOKEN` en Supabase con ese.
2. **Número real:** cuando quieras salir del número de prueba, en WhatsApp → API Setup
   agregas un número tuyo nuevo (no puede estar usado en la app normal de WhatsApp).
   Actualiza `WHATSAPP_PHONE_ID` con el del número nuevo.
3. **Templates:** en **WhatsApp Manager** (business.facebook.com → cuenta de WhatsApp →
   Message templates), crea los 6 templates de `TEMPLATES.md` (categoría Utility,
   idiomas es y en) y mándalos a aprobación. Los necesita el cartero (F5); con el
   número de prueba puedes esperar, pero mándalos apenas tengas el número real.

## Si algo no responde
- Logs de la función: Dashboard → Edge Functions → wa-entrada → Logs.
- La tabla de eventos: `select * from wa_eventos order by creado_en desc limit 20;`
- El cron: `select * from cron.job;` y sus corridas en
  `select * from net._http_response order by created desc limit 10;`
- Token vencido (24 h): el bot recibe pero no responde → renueva `WHATSAPP_TOKEN`
  (o haz de una vez el token permanente del paso 7).
