# F1 — Tus pasos, Barbie (Telegram)

> El código ya está construido: la migración `0051_whatsapp.sql`, las Edge Functions
> `wa-entrada` y `wa-motor`, y la tarjeta de Telegram en Ajustes. Esto es lo que te toca
> a ti, en orden. Con Telegram son 20 minutos y **todo es gratis, para siempre**.
>
> **Historia del proveedor:** YCloud no aceptó tu país y Meta cobra por los avisos
> proactivos (poco, pero cobra) y pide harta burocracia. Telegram: bot en 5 minutos,
> $0 por mensaje sin límite, sin templates ni ventana de 24 horas, y el Cartero puede
> escribirte cuando quiera. WhatsApp queda como canal premium futuro del SaaS
> (su código vive en el historial de git, listo para revivir).

## 1. Crear tu bot con BotFather (5 minutos)
1. En Telegram, busca **@BotFather** (el oficial, con check azul) y ábrele chat.
2. Mándale `/newbot`.
3. Nombre visible: `NucleoOS` (o el que quieras).
4. Username: algo como `NucleoOSBot` o `nucleoos_bot` (debe terminar en "bot").
5. BotFather te responde con el **token** (algo como `123456789:AAF...`). Cópialo.
6. Opcional bonito: `/setuserpic` para ponerle el ícono del átomo, y
   `/setdescription` con "El escriba de tu vida. Cuéntame lo que hiciste y lo registro en NucleoOS."

## 2. Secretos en Supabase (Dashboard → Edge Functions → Secrets)
Agrega dos secretos nuevos (GEMINI_API_KEY ya existe):

| Secreto | Valor |
|---------|-------|
| `TELEGRAM_BOT_TOKEN` | el token que te dio BotFather |
| `TELEGRAM_SECRET` | una palabra que TÚ inventas (ej. `nucleoos-cartero-2026`) |

## 3. Desplegar las dos funciones (Dashboard → Edge Functions)
1. Crea la función **`wa-entrada`**, pega el contenido de
   `supabase/functions/wa-entrada/index.ts` y despliega.
   ⚠️ **Importante:** en los detalles de la función, **desactiva "Verify JWT"**
   (Telegram no tiene sesión de Supabase; la seguridad la pone el secret token).
2. Crea la función **`wa-motor`**, pega el contenido de
   `supabase/functions/wa-motor/index.ts` y despliega, también sin "Verify JWT"
   (se protege sola: exige tu service role key, solo el cron la tiene).

## 4. Conectar el webhook (un solo comando)
Abre esta URL en el navegador (reemplaza TU_TOKEN y TU_SECRET por los del paso 2):

```
https://api.telegram.org/botTU_TOKEN/setWebhook?url=https://devxnjumkapxqguasgaz.supabase.co/functions/v1/wa-entrada&secret_token=TU_SECRET&allowed_updates=["message"]
```

Debe responder `{"ok":true,"result":true,"description":"Webhook was set"}`.

## 5. Migración 0051 (SQL Editor)
1. Abre `supabase/migrations/0051_whatsapp.sql`.
2. Reemplaza `PEGA_AQUI_TU_SERVICE_ROLE_KEY` por tu service role key
   (Dashboard → Settings → API → service_role). Como siempre: esa llave solo
   se pega ahí, nunca en el chat ni en GitHub.
3. Pega todo en el SQL Editor y Run.

## 6. La prueba de oro (hoy mismo)
1. En la app: **Ajustes → Telegram → Generar código**.
2. En Telegram, busca tu bot por su username, dale **Start** y mándale:
   `vincular 123456` (tu código).
3. El bot debe responder el saludo de bienvenida.
4. Mándale: `recuérdame comprar pan`.
5. En ~1 minuto (el cron corre cada minuto) el bot confirma,
   y la tarea aparece en el Inicio de la app. 🎉
6. Mándale un audio: "hice 30 minutos de gimnasio". Debe quedar en Energía.
7. Mándale `deshacer`: debe borrar ese registro y decírtelo.

## Si algo no responde
- ¿Llegan los webhooks?: abre
  `https://api.telegram.org/botTU_TOKEN/getWebhookInfo`
  (muestra la URL registrada y el último error, si hay).
- Logs de la función: Dashboard → Edge Functions → wa-entrada → Logs.
- La tabla de eventos: `select * from wa_eventos order by creado_en desc limit 20;`
- El cron: `select * from cron.job;` y sus corridas en
  `select * from net._http_response order by created desc limit 10;`
