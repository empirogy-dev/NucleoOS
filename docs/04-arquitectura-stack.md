# 04 — Arquitectura y stack tecnológico

## 1. Principio rector
> **Escribir una vez, correr en web + móvil + escritorio.** Toda decisión se toma para maximizar el código compartido y evitar "versiones paralelas". Aprovechamos que Fluxney y NucleoOS ya son **React + Supabase**.

## 2. Stack recomendado

| Capa | Tecnología | Por qué |
|------|-----------|---------|
| **UI / Frontend** | React 19 + **TypeScript** + Vite + Tailwind | Es lo que ya usa Fluxney. Rápido, tipado, enorme ecosistema. |
| **Componentes** | shadcn/ui + Radix (ya presentes) | Base sólida para la **UI nueva** unificada. |
| **Estado de servidor** | TanStack Query (agregar) | Cache, sincronización y estados de carga sin reinventar. |
| **Ruteo** | react-router 7 (ya presente) | — |
| **Backend / BaaS** | **Supabase** (ya usado) | Postgres + Auth multi-usuario + Storage + Row Level Security + Edge Functions. Ideal para solo-builder y para SaaS. |
| **Móvil (iOS/Android)** | **Capacitor** | Empaqueta **el mismo build web** en apps nativas. Da acceso a micrófono, cámara, salud, notificaciones. Cero reescritura de UI. |
| **Escritorio (Win/Mac/Linux)** | **Tauri** | Empaqueta la misma web en apps de escritorio livianas (más liviano que Electron). |
| **Voz → texto** | On-device (gratis) → **Groq Whisper** de respaldo | Ver [07-costos-servicios-ia.md](07-costos-servicios-ia.md). Nativo/navegador ahorra casi todo el costo. |
| **Agente / coach IA** | **Capa agnóstica de proveedor**: Gemini Flash-Lite / DeepSeek (barato) · Claude (premium) | Un adaptador por proveedor; se cambia sin tocar la app. Interpreta lenguaje → acción + consejos de coach. |
| **Almacenamiento de recibos** | **Local-first** (dispositivo + sync) + **Cloudflare R2** (respaldo premium) | Recibos en el celular/computador del usuario; la nube solo guarda el índice. Egress $0 en R2. Abarata mucho. |
| **Agente por WhatsApp** (pospuesto) | **Meta WhatsApp Cloud API** | Registrar mandando audio/foto a WhatsApp. Idea guardada para más adelante, no en el MVP. |
| **Cobros** | **Stripe** (web) + **RevenueCat** (móvil) | Suscripción/freemium; RevenueCat unifica cobros de App Store/Play Store. |
| **Salud / reloj** | Capacitor Health → Apple HealthKit / Google Health Connect | Solo en móvil; frecuencia cardíaca, pasos, sueño. |
| **Calendario / Google** (Fase 4) | **Google Calendar API** (OAuth) como adaptador | El módulo Calendario agrega eventos internos; Google se suma como fuente externa de solo lectura primero. |
| **Banca (futuro)** | Adaptadores: Belvo (LatAm), Plaid (USA)… | Se enchufan a la capa de fuentes financieras sin tocar el núcleo. |

### ¿Por qué no React Native / Flutter?
Porque ya tienes una app web React funcional (Fluxney). **Capacitor + Tauri reutilizan ese código tal cual**; React Native o Flutter obligarían a reescribir la UI. La ruta elegida es la de menor retrabajo, que es justo tu objetivo.

## 3. Diagrama de arquitectura (alto nivel)

```
        ┌───────────────────────────────────────────────┐
        │        UNA BASE DE CÓDIGO (React + TS)         │
        │  UI unificada · 7 áreas · Agente · Tablero     │
        └───────────────────────────────────────────────┘
              │              │                │
        ┌─────▼────┐   ┌─────▼─────┐   ┌──────▼──────┐
        │   Web    │   │  Capacitor │   │    Tauri    │
        │(navegador)│  │(iOS/Android)│  │ (escritorio)│
        └─────┬────┘   └─────┬─────┘   └──────┬──────┘
              └──────────────┼────────────────┘
                             │ (API / SDK)
                   ┌─────────▼──────────┐
                   │      SUPABASE      │
                   │ Auth · Postgres(RLS)│
                   │ Storage · Edge Fns  │
                   └─────────┬──────────┘
             ┌───────────────┼───────────────┐
        ┌──────────▼─────────┐  ┌────▼────┐  ┌────▼─────┐
        │ CAPA DE IA         │  │  Voz    │  │ Stripe / │
        │ (agnóstica)        │  │on-device│  │RevenueCat│
        │ Gemini·DeepSeek·   │  │ / Groq  │  └──────────┘
        │ GLM·Claude(premium)│  └─────────┘
        └────────────────────┘
        Almacenamiento local-first + Cloudflare R2 (respaldo)
                 (futuro) Belvo / Plaid / HealthKit / WhatsApp
```

## 4. Modelo de datos (Supabase / Postgres)
Un solo proyecto Supabase. Todas las tablas llevan `user_id` con **Row Level Security** (cada quien ve lo suyo).

**Núcleo / transversal**
- `profiles` (usuario, plan free/premium, idioma, moneda, tema)
- `life_vision` (visión de vida)
- `activity_log` (avances/eventos de cualquier área — alimenta "avances recientes")
- `ai_conversations` (historial del agente: entrada de voz/texto, acción resultante)

**Finanzas (reutiliza Fluxney)** — `transactions`, `accounts`, `credit_cards`, `debts`, `categories`, `goals` (ahorro), `reminders`.
- Se añade a `transactions` el campo **`source`** (`manual|voz|recibo|cartola|banco`) → es la **capa de adaptadores** que permite sumar banca global después sin rehacer nada.

**Otras áreas**
- Objetivos: `objectives`, `objective_milestones`
- Salud: `health_profile`, `medications`, `appointments`, `health_exams`, `health_metrics` (reloj)
- Trabajo: `projects`, `work_logs`
- Aprendizaje: `notebooks`, `notebook_entries`, `uploads`
- Hábitos: `habits`, `habit_logs`, `routine_logs` (sueño/ejercicio)
- Relaciones: `relationships`, `relationship_logs`, `tips`

## 5. Cómo se responde tu pregunta de la banca
Empezamos con `source ∈ {manual, voz, recibo, cartola}`. Cuando quieras banca automática (global), se agrega un **adaptador** que:
1. Se conecta al proveedor del país (Belvo/Plaid/otro).
2. Trae los movimientos.
3. Los inserta como `transactions` con `source=banco` y hace *match* con recibos/voz existentes.

El resto de la app **no cambia**, porque todos consumen la misma tabla `transactions`. Por eso "ir global después" es trabajo **acotado y aditivo**, no una reescritura.

## 6. Seguridad (resumen)
- Row Level Security en todas las tablas.
- API keys de Claude/Whisper/Stripe **solo** en Edge Functions (nunca en el cliente).
- Datos de salud y finanzas cifrados en tránsito y reposo (Supabase lo provee).
- Funciones de "exportar mis datos" y "borrar mi cuenta".

## 7. Estructura de carpetas propuesta (monorepo simple)
```
nucleoos/
├─ src/
│  ├─ app/            # shell, layout, navegación, tablero Inicio
│  ├─ areas/
│  │  ├─ finanzas/    # ← Fluxney migrado aquí (UI nueva)
│  │  ├─ objetivos/
│  │  ├─ salud/
│  │  ├─ trabajo/
│  │  ├─ aprendizaje/
│  │  ├─ habitos/
│  │  └─ relaciones/
│  ├─ agent/          # captura de voz, cliente del agente, borradores
│  ├─ lib/            # supabase, auth, currency, i18n, theme (de Fluxney)
│  └─ ui/             # design system unificado (shadcn)
├─ supabase/          # migraciones, edge functions (agente, ocr, stripe)
├─ capacitor.config   # móvil
└─ src-tauri/         # escritorio
```
