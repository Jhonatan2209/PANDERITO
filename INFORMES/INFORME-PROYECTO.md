# INFORME GENERAL DEL PROYECTO PANDERITO

**Fecha del informe:** 12 de julio de 2026
**Autor:** Documentado con Claude Code
**Repositorio:** privado — https://github.com/Jhonatan2209/PANDERITO (rama de trabajo actual: `feat/pwa-web`)

---

## 1. ¿Qué es Panderito?

**Panderito** es una app de **finanzas personales** pensada para Perú (moneda S/),
en español, **offline-first** (funciona sin internet) y con un módulo distintivo:
los **panderos** (juntas de ahorro rotativo, también llamadas "juntas" o "roscas").

Lema: **"Tus finanzas, tu junta."**

Historia breve:

| Fecha | Hito |
|---|---|
| (inicio) | El proyecto nació con el nombre **Chanchito** |
| 2026-07-10 | Se renombró a **Panderito** (nuevo logo: moneda dorada con "P" rodeada por la ronda del pandero) |
| 2026-07-10/11 | Se creó la **versión web PWA** (carpeta `pwa/`) instalable y offline |
| 2026-07-11 | Se completaron los módulos de la PWA (panderos, préstamos, metas, recurrentes, presupuestos) y las novedades v3 (métodos de pago, saldo inicial, avisos) |
| 2026-07-11 | Scaffold del **bot de Telegram** (lee yapeos/boletas con IA y registra el movimiento) |
| 2026-07-12 | Esta sesión: levantamiento en localhost, comentado del código y documentación (INFORMES, LEVANTAR-PANDERO, MANUAL) |

## 2. Estructura del repositorio

```
D:\PROYECTOS-2026\PANDERITO
├── Panderito/                  # Solución .NET (app nativa Android)
│   ├── src/Panderito.App/      # App MAUI net10.0-android (UI, ViewModels, Resources)
│   ├── src/Panderito.Core/     # Dominio, servicios, SQLite (sin dependencia de MAUI)
│   └── tests/Panderito.Tests/  # xUnit — 42 pruebas (deben estar siempre en verde)
├── pwa/                        # ★ Versión web PWA (la que se levanta con localhost)
│   ├── index.html              # Página única (SPA)
│   ├── css/estilos.css         # Estilos, paleta, tema claro/oscuro
│   ├── js/datos.js             # Capa de datos (localStorage) + formato de moneda
│   ├── js/app.js               # Router + vistas + acciones
│   ├── sw.js                   # Service Worker (cache offline)
│   ├── manifest.webmanifest    # Metadatos de instalación PWA
│   └── icons/                  # Íconos SVG (normal y maskable)
├── bot-telegram/               # Scaffold del bot de Telegram (IA lee yapeos/boletas)
├── branding/                   # Logo SVG y variaciones
├── CONTEXTO/                   # Prototipo de diseño "Bolsillo" (referencia visual)
├── INSTRUCCIONES/              # CLAUDE.md maestro + LEVANTAR-PANDERO.txt
├── INFORMES/                   # ★ Esta carpeta: informes y MANUAL de usuario
├── ACCESOS/                    # ⚠️ Credenciales personales (repo privado; NUNCA publicar)
├── docs/ARQUITECTURA.md        # Mapa del código para IAs y desarrolladores
├── CAMBIOS.md                  # Bitácora de cambios grandes
└── CLAUDE.md                   # Guía rápida para Claude
```

## 3. La versión PWA (carpeta `pwa/`) — de inicio a fin

### 3.1 Filosofía

- **Sin servidor, sin cuentas, sin internet.** Todos los datos viven en el
  `localStorage` del navegador del dispositivo, bajo la clave `panderito.datos.v1`.
- **Un solo HTML.** `index.html` tiene el contenedor `<main id="app">` y la barra
  de pestañas; el JavaScript pinta cada pantalla ahí (SPA con router por hash).
- **Instalable.** Gracias a `manifest.webmanifest` + `sw.js`, el navegador ofrece
  "Instalar app" y luego funciona offline con ícono propio.
- **Cero dependencias.** No usa frameworks ni librerías: JS puro, CSS puro.

### 3.2 Arquitectura en dos capas

1. **`js/datos.js` — capa de datos (módulo global `Datos`)**
   - Guarda TODO el estado en un solo objeto JSON en localStorage:
     `{ proximoId, categorias, cuentas, movimientos, prestamos, abonos,
     panderos, turnos, metas, recurrentes, presupuestos }`.
   - Expone funciones CRUD por colección (`guardarMovimiento`, `prestamos()`,
     `crearPanderoConTurnos`, `avancePresupuesto`, etc.).
   - Incluye la primera semilla (categorías típicas peruanas y cuentas
     Efectivo/Yape/Plin/Banco) y migraciones suaves para no perder datos
     de versiones anteriores.
   - `Moneda` formatea soles: `Moneda.fmt(1234.5)` → `"S/ 1,234.50"`.

2. **`js/app.js` — capa de aplicación (módulo global `App`)**
   - **Router por hash:** `#inicio`, `#registrar`, `#panderoDet?id=5`, etc.
     `render()` ejecuta la vista de la ruta actual y pinta su HTML.
   - **Vistas:** cada pantalla es una función registrada con
     `registrar('nombre', fn)` que devuelve un template string HTML.
   - **Acciones:** los botones llaman `App.algo()` (objeto `acciones`):
     leen inputs → validan → llaman a `Datos.*` → toast → re-render.
   - Además maneja: tema claro/oscuro/auto, banner de instalación PWA,
     notificaciones locales de pendientes y registro del Service Worker.

### 3.3 Módulos funcionales (todos completos ✅)

| Módulo | Pantallas | Qué hace |
|---|---|---|
| Inicio | `inicio` | Saldo total, ingresos/gastos del mes, pendientes 🔔, últimos movimientos |
| Registrar | `registrar` | Gasto/ingreso con monto grande, categoría en grilla, cuenta, fecha, nota; también edita |
| Movimientos | `movimientos`, `detalle` | Historial con búsqueda y filtros; detalle con editar/eliminar |
| Reportes | `reportes` | Navegación por mes, ahorro/déficit, barras de 6 meses, gasto por categoría |
| Cuentas | `cuentas`, `cuentaEdit` | Métodos de pago (Efectivo/Yape/Plin/Banco/Tarjeta) con saldo inicial y saldo calculado |
| Categorías | `categorias` | Gastos e ingresos; solo se eliminan las que no tienen movimientos |
| Préstamos | `prestamos`, `prestamoNuevo`, `prestamoDet` | Me deben / Yo debo, abonos parciales, marcar pagado |
| Panderos | `panderos`, `panderoNuevo`, `panderoDet` | Juntas con turnos automáticos, nombres/DNI por turno, pagar cuota (gasto) y cobrar pozo (ingreso) |
| Metas | `metas`, `metaNueva` | Objetivos de ahorro con progreso % y abonos |
| Pagos fijos | `recurrentes`, `recurrenteNuevo` | Internet, alquiler, suscripciones; "vence en X días" y pago con avance de fecha |
| Presupuestos | `presupuestos`, `presupuestoNuevo` | Límite por categoría con semáforo 🟢/🟡(80%)/🔴(100%) |
| Ajustes | `ajustes` | Tema, recordatorios, exportar respaldo JSON, borrar todo |

### 3.4 Reglas de negocio clave

- El **saldo de una cuenta nunca se guarda**: se calcula
  `saldoInicial + ingresos − gastos` de esa cuenta (no se desincroniza).
- **Un presupuesto por categoría** (si se crea otro, actualiza el existente).
- Categorías y cuentas **con movimientos no se pueden eliminar**.
- El pandero se conecta al saldo real con la categoría especial «Pandero»:
  pagar cuota = gasto; cobrar pozo = ingreso.
- Frecuencias soportadas en toda la app: Semanal (+7 días),
  Quincenal (+15 días), Mensual (+1 mes).

## 4. Cómo se levanta la app

Ver el paso a paso completo en **`INSTRUCCIONES/LEVANTAR-PANDERO.txt`**. Resumen:

```bash
cd D:\PROYECTOS-2026\PANDERITO\pwa
python -m http.server 8080 --bind 127.0.0.1
# abrir http://localhost:8080
```

Levantada y verificada en esta sesión (12-07-2026): la página respondió
HTTP 200 y todos los recursos (css, js, manifest, sw, íconos) cargan bien.
Nota: localhost funciona en cualquier router (no depende del wifi);
para verla desde el celular sí se usa la IP local de la PC (ver Opción B del TXT).

## 5. Documentación disponible

| Documento | Contenido |
|---|---|
| `INFORMES/INFORME-PROYECTO.md` | Este informe: visión completa de inicio a fin |
| `INFORMES/INFORME-SESION-2026-07-12.md` | Qué se hizo exactamente en esta sesión |
| `INFORMES/CONTEXTO-PARA-CLAUDE.md` | Contexto para que Claude retome el trabajo otro día |
| `INFORMES/MANUAL.docx` | Manual de usuario paso a paso, módulo por módulo |
| `INSTRUCCIONES/LEVANTAR-PANDERO.txt` | Cómo levantar la app (localhost, celular, internet) |
| `docs/ARQUITECTURA.md` | Mapa del código .NET/MAUI |
| `CAMBIOS.md` | Bitácora histórica de cambios grandes |

## 6. Seguridad y cuidados

- ⚠️ La carpeta `ACCESOS/` contiene credenciales personales del usuario.
  Está versionada **porque el repo es privado**; el repositorio **jamás debe
  hacerse público** sin vaciarla primero.
- Al publicar la PWA en internet, desplegar **únicamente la carpeta `pwa/`**.
- Los datos del usuario final nunca salen de su dispositivo (localStorage);
  el respaldo es manual vía Ajustes → Exportar copia (JSON).

## 7. Pendientes conocidos del proyecto

- App MAUI: fases 0–5 completas; faltan **fase 6 (pulido)** y **fase 7 (build final)** — ver `Panderito/PROGRESO.md`.
- Bot de Telegram: solo scaffold; falta conectar la IA y el registro real.
- PWA: para instalación offline completa en celular se necesita despliegue HTTPS (Netlify/Vercel/GitHub Pages con base `pwa/`).
