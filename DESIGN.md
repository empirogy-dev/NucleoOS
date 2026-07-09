# Sistema de diseño — Sistema de Vida

> Fuente de verdad del diseño. **Leer este archivo antes de cualquier decisión visual o de UI.** No desviarse sin aprobación explícita de la usuaria.

## Contexto de producto
- **Qué es:** app SaaS todo-en-uno para organizar la vida en 7 áreas, con un coach de IA por voz.
- **Para quién:** personas 25–45 que quieren ordenar su vida con calma; emprendedores independientes.
- **Espacio:** life OS / segundo cerebro / bienestar (peers: Sunsama, Notion, Finch, Stoic).
- **Tipo:** web app (dashboard) → móvil (Capacitor) → escritorio (Tauri), una sola base de código.

## Dirección estética
- **Dirección:** Santuario cálido con claridad total — "paz armónica, nada grita".
- **Nivel de decoración:** mínimo/intencional. Tipografía y espacio hacen el trabajo; texturas y sombras muy sutiles.
- **Mood:** cálido, sereno, personal, claro. Colores lavados (pigmento en acuarela), nada saturado.
- **Anti-slop:** sin degradados morados, sin grillas de 3 íconos en círculos, sin todo centrado, sin tarjetas infladas. La personalidad vive en el color cálido, el espacio y el layout.

## Temas (elegibles por el usuario) — RU-GEN-09
La app trae una **biblioteca de temas** y cada usuario elige el suyo (o crea uno). **Cada tema define solo 5 colores**; el resto se deriva con `color-mix`. Agregar un tema = 1 línea.

**Tokens crudos por tema:** `--paper` (fondo), `--ink` (texto), `--pri` (principal/acento), `--sec` (secundario), `--acc` (acento cálido).

**Tema por defecto: Verde salvia** — `--paper:#F7F3EA · --ink:#2F3A35 · --pri:#8FAF9B · --sec:#C7D7C2 · --acc:#D9A38F`

Biblioteca inicial (10 paletas):
| Tema | Fondo | Principal | Secundario | Texto | Acento |
|------|-------|-----------|------------|-------|--------|
| **Verde salvia** (default) | #F7F3EA | #8FAF9B | #C7D7C2 | #2F3A35 | #D9A38F |
| Azul niebla | #FAFAF7 | #A9C7D8 | #DCEBF2 | #263B45 | #E8D9C5 |
| Lavanda | #F5F4F8 | #B8A9D9 | #E3DDF2 | #373142 | #E6B8C4 |
| Arena + azul profundo | #F3EDE2 | #365B6D | #D8CFC0 | #24292B | #8AA399 |
| Menta suave | #FBFDFB | #A8D8C5 | #D6F0E7 | #243C35 | #F2C6A0 |
| Rosa polvo | #F8F1EA | #D9A7A0 | #F0D6D2 | #3B2F2C | #A8B89E |
| Azul cielo + eucalipto | #F2F8FA | #91C7D9 | #9DBEAE | #2C3E45 | #F3DEA2 |
| Verde suave (mono) | #F3F8F4 | #78A88C | #CFE3D5 | #1F3A2E | #BFD89E |
| Azul grisáceo + lavanda | #F1F5F7 | #7FA6B8 | #C8C3E0 | #25323A | #D8AFC0 |
| Tierra suave + oliva | #FAF4E8 | #8E9F7D | #D8B59C | #342C24 | #D9C178 |

**Derivados (calculados, no hardcodear):**
```
--surface: color-mix(in srgb, var(--paper) 58%, #fff);
--card:    color-mix(in srgb, var(--paper) 24%, #fff);
--line:    color-mix(in srgb, var(--ink) 13%, var(--paper));
--ink-soft:color-mix(in srgb, var(--ink) 74%, var(--paper));
--muted:   color-mix(in srgb, var(--ink) 46%, var(--paper));
--accent:  var(--pri);
--accent-ink:  color-mix(in srgb, var(--pri) 52%, var(--ink));
--accent-wash: color-mix(in srgb, var(--pri) 26%, var(--paper));
```

## Color de las 7 áreas (sistema FIJO, no cambia con el tema)
Identidad constante: un área siempre tiene su color, para reconocerla de un vistazo. Tonos suaves y desaturados que conviven con cualquier tema. Usar solo como acentos (puntos, barras de progreso, encabezados de sección), nunca como fondos grandes.
| Área | Color |
|------|-------|
| Objetivos | #6FA79A |
| Finanzas | #84B183 |
| Salud | #D2B36E |
| Trabajo y Proyectos | #9E96C9 |
| Aprendizaje | #84A9C6 |
| Hábitos y Rutinas | #C795AE |
| Relaciones | #CF9E77 |

**Semánticos (suaves):** ok #6BA783 · warn #C69A4D · error #C57A68 · info #6E9BB5.

## Tipografía
- **Títulos:** **Outfit Medium (500)** — geométrica, redondeada, amable. `letter-spacing: -0.02em`.
- **Cuerpo / UI:** **Inter Regular (400)**, 500 para labels. (Elección de la usuaria; Inter es muy común pero clarísima — la personalidad la dan color+layout. Alternativa de 1 línea si se quiere menos común: Switzer o General Sans.)
- **Números (finanzas, horas):** Inter con `font-variant-numeric: tabular-nums`.
- **Carga:** self-hosted vía woff2 (Outfit + Inter). No usar CDN de fuentes en producción; incrustar/servir localmente.
- **Escala (px):** 12 · 13.5 · 15 · 18 · 23 · 34 · 50. Cuerpo base 16, line-height 1.55; títulos line-height 1.1.

## Espaciado
- **Base:** 8px (medios pasos de 4px). **Densidad:** espaciosa (mucho aire = calma + claridad).
- **Escala:** 2 · 4 · 8 · 16 · 24 · 32 · 48 · 64.

## Layout
- **Enfoque:** grid-disciplinado para la app (barra lateral con 7 áreas + Inicio, contenido en tarjetas), híbrido para marketing.
- **Ancho máx contenido:** ~1080px. **Barra lateral:** ~210px.
- **Radios:** sm 8px · md 14px · lg 20px · full 999px.
- **Sombras:** muy suaves (`0 1px 2px + 0 10px 30px` a baja opacidad).

## Motion
- **Enfoque:** intencional y calmado. Sin rebotes.
- **Transiciones de tema:** background/color 0.35s ease.
- **Easing:** entrar ease-out · salir ease-in · mover ease-in-out.
- **Duración:** micro 50–100ms · corta 150–250ms · media 250–400ms.
- Respetar `prefers-reduced-motion`.

## Modo oscuro
Se deriva por cada tema al construir: `--paper` → neutro oscuro cálido/frío según el tema, `--ink` → claro, acentos +10–15% de brillo, mezclas de derivados hacia el fondo oscuro en vez de blanco. Mantener contraste AA.

## Accesibilidad
- Contraste texto/fondo AA. Foco visible (outline teal 2px). Navegación por teclado en web. Objetivos táctiles ≥40px en móvil.

## Registro de decisiones
| Fecha | Decisión | Razón |
|-------|----------|-------|
| 2026-07-09 | Sistema de diseño inicial | Creado con /design-consultation. Dirección "santuario cálido, claridad total". |
| 2026-07-09 | Temas elegibles por el usuario (10 paletas, motor color-mix) | Idea de la usuaria: que cada persona ponga sus colores; evita rehacer y da diferenciación. |
| 2026-07-09 | Default Verde salvia · Títulos Outfit Medium · Cuerpo Inter Regular | Elección de la usuaria. |
| 2026-07-09 | 7 colores de área fijos (no cambian con el tema) | Reconocer cada área de un vistazo. |
