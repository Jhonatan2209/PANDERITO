# CONTEXTO PARA CLAUDE — retomar el proyecto otro día

> **Propósito:** si eres Claude (u otra IA) y abres este proyecto en una
> sesión nueva, lee este archivo para enterarte de todo y seguir el paso
> sin repetir trabajo. Actualizado por última vez: **2026-07-12**.

---

## 1. Lo esencial en 30 segundos

- **Proyecto:** Panderito — finanzas personales para Perú (S/), en español,
  offline-first. Antes se llamaba Chanchito (renombrado 2026-07-10).
- **Dos apps:** la nativa .NET MAUI Android (`Panderito/`) y la **PWA web**
  (`pwa/`) que replica sus pantallas. También hay un scaffold de bot de
  Telegram (`bot-telegram/`).
- **Rama de trabajo actual:** `feat/pwa-web` (la principal es `master`).
- **Repo privado:** https://github.com/Jhonatan2209/PANDERITO —
  ⚠️ contiene `ACCESOS/` con credenciales personales: NUNCA hacerlo público,
  no leer esa carpeta salvo pedido explícito.

## 2. Qué leer y en qué orden

1. `CLAUDE.md` (raíz) — guía rápida y reglas.
2. `INSTRUCCIONES/CLAUDE.md` — instrucciones maestras (fuente de verdad).
3. Este archivo — estado más reciente.
4. `INFORMES/INFORME-PROYECTO.md` — visión completa de inicio a fin.
5. `INFORMES/INFORME-SESION-2026-07-12.md` — última sesión en detalle.
6. `docs/ARQUITECTURA.md` — mapa del código .NET (solo si tocarás la app MAUI).
7. `Panderito/PROGRESO.md` y `Panderito/DECISIONES.md` — checklist y decisiones.

## 3. Estado actual (2026-07-12)

### PWA (`pwa/`) — COMPLETA y funcionando
- Todos los módulos listos: Inicio, Registrar, Movimientos, Detalle, Reportes,
  Cuentas (con saldo inicial y métodos de pago), Categorías, Préstamos,
  Panderos (con turnos, nombres/DNI, pagar cuota/cobrar pozo), Metas,
  Pagos fijos, Presupuestos, Ajustes (tema/exportar/borrar), avisos 🔔.
- **Todo el código está comentado en español** con detalles e instrucciones
  (cabeceras de cada archivo explican cómo funciona y cómo extenderlo).
- Se levanta con: `cd pwa && python -m http.server 8080 --bind 127.0.0.1`
  → http://localhost:8080 (paso a paso en `INSTRUCCIONES/LEVANTAR-PANDERO.txt`).
- Datos en localStorage clave `panderito.datos.v1`; sin servidor.
- Si cambias cualquier archivo de `pwa/`, **sube la versión de `CACHE` en
  `pwa/sw.js`** (v3 → v4) para que los usuarios reciban la actualización.

### App MAUI (`Panderito/`)
- Fases 0–5 completas, 42 pruebas xUnit en verde. Faltan fase 6 (pulido)
  y fase 7 (build final). Comandos:
  `cd Panderito && dotnet test tests/Panderito.Tests/Panderito.Tests.csproj`.

### Bot de Telegram (`bot-telegram/`)
- Solo scaffold (commit 2770394): la idea es que lea capturas de yapeos y
  boletas con IA y registre el movimiento. Falta implementar.

## 4. Convenciones de trabajo (resumen de reglas)

- Commits **pequeños y en español** con prefijos `feat:` / `fix:` / `test:` /
  `docs:` / `chore:`. No avanzar con build o pruebas en rojo.
- Decisión ambigua → opción más simple y estándar + anotarla en
  `Panderito/DECISIONES.md`. Cambios grandes → anotar en `CAMBIOS.md`.
- Paleta: violeta `#6D5AE6`, tinta `#4A3FB8`, dorado `#FDB022→#F79009`,
  verde ingreso `#12B76A`, rojo gasto `#F04438`.
- El usuario prefiere **explicaciones paso a paso en español** y que se
  documente lo que se hace (carpeta `INFORMES/`).

## 5. Última sesión (2026-07-12) — qué se hizo

1. Se levantó la PWA en `http://localhost:8080` (verificada con HTTP 200).
2. Se comentó a detalle TODO el código de `pwa/` (sin cambiar lógica;
   `node --check` OK en los 3 JS).
3. Se creó `INSTRUCCIONES/LEVANTAR-PANDERO.txt` (cómo levantar la app).
4. Se creó la carpeta `INFORMES/` con: INFORME-PROYECTO.md,
   INFORME-SESION-2026-07-12.md, este CONTEXTO-PARA-CLAUDE.md y MANUAL.docx
   (manual de usuario módulo por módulo).
5. Se hizo commit y push a `feat/pwa-web`.

## 6. Pendientes / ideas para próximas sesiones

- [ ] Desplegar `pwa/` con HTTPS (Netlify/Vercel/GitHub Pages, base = `pwa/`,
      nunca la raíz del repo) para instalación PWA completa en el celular.
- [ ] Implementar el bot de Telegram (IA lee yapeo/boleta → `Datos`-equivalente).
- [ ] Fase 6 (pulido) y fase 7 (build final APK) de la app MAUI.
- [ ] Mantener actualizado este archivo y los informes al final de cada sesión.

## 7. Cómo actualizar este contexto

Al terminar una sesión de trabajo:
1. Agrega un informe `INFORMES/INFORME-SESION-<fecha>.md` con lo hecho.
2. Actualiza las secciones 3, 5 y 6 de este archivo.
3. Commit en español (`docs: ...`) y push.
