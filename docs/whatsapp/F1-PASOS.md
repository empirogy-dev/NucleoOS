# F1 — Tus pasos, Barbie

> El código ya está construido: la migración `0051_whatsapp.sql`, las Edge Functions
> `wa-entrada` y `wa-motor`, y la tarjeta de WhatsApp en Ajustes. Esto es lo que te toca
> a ti, en orden. Igual que siempre: las llaves se pegan solo en Supabase, nunca en el chat.

## 1. Cuenta YCloud (lo cubre tu curso)
1. Crea tu cuenta en **ycloud.com** y conecta un **número de WhatsApp Business**
   (puede ser un número nuevo, no tu número personal).
2. Copia tu **API Key** (YCloud → Settings → API).
3. En YCloud → Webhooks, crea un webhook apuntando a:
   `https://devxnjumkapxqguasgaz.supabase.co/functions/v1/wa-entrada`
   con el evento de **mensajes entrantes de WhatsApp**. Copia el **signing secret** del webhook.

## 2. Secretos en Supabase (Dashboard → Edge Functions → Secrets)
Agrega tres secretos nuevos (GEMINI_API_KEY ya existe):

| Secreto | Valor |
|---------|-------|
| `YCLOUD_API_KEY` | tu API key de YCloud |
| `YCLOUD_WEBHOOK_SECRET` | el signing secret del webhook |
| `YCLOUD_NUMERO` | el número del bot en formato +1XXXXXXXXXX |

## 3. Desplegar las dos funciones (Dashboard → Edge Functions)
1. Crea la función **`wa-entrada`**, pega el contenido de
   `supabase/functions/wa-entrada/index.ts` y despliega.
   ⚠️ **Importante:** en los detalles de la función, **desactiva "Verify JWT"**
   (YCloud no tiene sesión de Supabase; la seguridad la pone la firma HMAC).
2. Crea la función **`wa-motor`**, pega el contenido de
   `supabase/functions/wa-motor/index.ts` y despliega.
   Esta se queda CON "Verify JWT" desactivado también, pero se protege sola:
   exige tu service role key en cada llamada (solo el cron la tiene).

## 4. Migración 0051 (SQL Editor)
1. Abre `supabase/migrations/0051_whatsapp.sql`.
2. Reemplaza `PEGA_AQUI_TU_SERVICE_ROLE_KEY` por tu service role key
   (Dashboard → Settings → API → service_role). Como siempre: esa llave solo
   se pega ahí, nunca en el chat ni en GitHub.
3. Pega todo en el SQL Editor y Run.

## 5. Templates a Meta (¡el mismo día! demoran)
En YCloud → WhatsApp → Templates, crea los 6 templates de `TEMPLATES.md`
(categoría Utility, idiomas es y en) y mándalos a aprobación.

## 6. La prueba de oro de F1
1. En la app: **Ajustes → WhatsApp → Generar código**.
2. Desde tu teléfono, mándale al número del bot: `vincular 123456` (tu código).
3. El bot debe responder el saludo de bienvenida.
4. Mándale: `recuérdame comprar pan`.
5. En ~1 minuto (el cron del motor corre cada minuto) el bot confirma,
   y la tarea aparece en el Inicio de la app. 🎉
6. Mándale un audio: "hice 30 minutos de gimnasio". Debe quedar en Energía.
7. Mándale `deshacer`: debe borrar ese registro y decírtelo.

## Si algo no responde
- Revisa los logs de la función en Dashboard → Edge Functions → wa-entrada → Logs.
- Revisa la tabla `wa_eventos` en el SQL Editor:
  `select * from wa_eventos order by creado_en desc limit 20;`
- El cron se ve con: `select * from cron.job;` y sus corridas en
  `select * from net._http_response order by created desc limit 10;`
