# CONTEXTO PARA CLAUDE — retomar el proyecto otro día

> **Propósito:** si eres Claude (u otra IA) y abres este proyecto en una
> sesión nueva, lee este archivo para enterarte de todo y seguir el paso
> sin repetir trabajo. Actualizado por última vez: **2026-09-26**.

---

## 1. Lo esencial en 30 segundos

- **Proyecto:** Panderito — finanzas personales para Perú (S/), en español,
  offline-first. Antes se llamaba Chanchito (renombrado 2026-07-10).
- **Dos apps:** la nativa .NET MAUI Android (`Panderito/`) y la **PWA web**
  (`pwa/`) que replica sus pantallas. También hay un scaffold de bot de
  Telegram (`bot-telegram/`).
- **Prioridad actual del usuario: la PWA** (es la que usa); la APK MAUI queda para después.
- **Rama de trabajo: `master`** (desde 2026-09-27 se hace commit y push directo;
  el usuario no quiere aprobar PRs y Claude no puede fusionarlos). `feat/pwa-web`
  ya está fusionada (PR #1 y #2) y no se usa más. Vercel publica en cada push a master.
- **Repo privado:** https://github.com/Jhonatan2209/PANDERITO —
  ⚠️ contiene `ACCESOS/` con credenciales personales: NUNCA hacerlo público,
  no leer esa carpeta salvo pedido explícito.

## 2. Qué leer y en qué orden

1. `CLAUDE.md` (raíz) — guía rápida y reglas.
2. `INSTRUCCIONES/CLAUDE.md` — instrucciones maestras (fuente de verdad).
3. Este archivo — estado más reciente.
4. `INFORMES/INFORME-PROYECTO.md` — visión completa de inicio a fin.
5. `INFORMES/INFORME-SESION-2026-09-26.md` — última sesión en detalle
   (la anterior: `INFORME-SESION-2026-07-12.md`).
6. `docs/ARQUITECTURA.md` — mapa del código .NET (solo si tocarás la app MAUI).
7. `Panderito/PROGRESO.md` y `Panderito/DECISIONES.md` — checklist y decisiones.
9. `INSTRUCCIONES/MIGRACION-Y-HERRAMIENTAS.md` — herramientas, cuentas y checklist
   de migración a otra laptop (mantenerlo al día cuando se instale algo nuevo).
8. `INSTRUCCIONES/PLAN-FASES-PWA.md` — **plan por fases acordado el 2026-09-27**:
   primero todo funcional y 100 % gratis; bot/WhatsApp/IA son mejoras posteriores.

## 3. Estado actual (2026-09-26)

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
  `pwa/sw.js`** (hoy v6 → v7) para que los usuarios reciban la actualización, y
  **sube `VERSION` en `pwa/js/app.js` + escribe las `NOVEDADES`**: el Inicio las
  muestra una sola vez por versión (pedido del usuario, 2026-09-27).
- **Auditoría 2026-09-27:** 25 casos límite detectados y 23 corregidos (fechas
  locales, restaurar copia, notificaciones vía SW, redondeo a centavos, coma
  decimal, borrado protegido, etc.). Tabla completa en el informe del 2026-09-26,
  sección 4.b. Para probar en el navegador integrado: `.claude/launch.json` → `pwa`.
- **PUBLICADA: https://panderito.vercel.app** (Vercel, cuenta `jhonatan-god`,
  proyecto `panderito`, Root Directory = `pwa`, plan Hobby). Publica sola en cada
  push a `master`. Verificado 2026-09-27: HTTPS, SW v5 registrado, manifest OK,
  `sw.js` sin caché, README/Dockerfile/ACCESOS no accesibles. Decisión 12.

### Servidor propio (Clouding.io, `187.33.148.111`)
- Cobro por horas con saldo prepago. Reservado para el bot y un futuro backend.
- Hay archivos locales **sin commit** de un intento de despliegue (Docker Compose,
  `deploy.py`, `run_compose.py`, `.github/workflows/deploy.yml`): se retoman al
  trabajar el bot. El workflow fallaría hoy (faltan secretos SSH). Detalle en el
  informe del 2026-09-26.

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

## 5. Última sesión (2026-09-26) — qué se hizo

1. Se analizó el proyecto y se ubicó el repo (no existe "chanchito" en GitHub).
2. Se detectó que `panderito.tar.gz` (con `ACCESOS/`) se había subido al
   servidor; el usuario lo borró. Ahora `*.tar.gz` está en `.gitignore`.
3. Se decidió publicar la PWA en Vercel y se preparó `pwa/vercel.json`,
   `pwa/.vercelignore`, CACHE v4 y la guía en `pwa/README.md`.
4. El usuario fusionó el PR #1 (`master` ya tiene la PWA).
5. (2026-09-27) Auditoría de casos límite con agente + 23 correcciones
   verificadas en navegador; CACHE v5; plan por fases en
   `INSTRUCCIONES/PLAN-FASES-PWA.md`; PR #2 abierto con las correcciones.

## 6. Pendientes / ideas para próximas sesiones

- [x] Vercel conectado → https://panderito.vercel.app (2026-09-27).
- [ ] Usuario: instalar desde Chrome Android y usarla unos días; reportar fallos.
- [ ] Fase B del plan (`INSTRUCCIONES/PLAN-FASES-PWA.md`): robustez + «algo no cuadra».
- [ ] Usuario: revisar logs de Apache por accesos a `ACCESOS/` y, si hubo,
      cambiar esas contraseñas.
- [ ] Implementar el bot de Telegram (IA lee yapeo/boleta → `Datos`-equivalente).
- [ ] Fase 6 (pulido) y fase 7 (build final APK) de la app MAUI.
- [ ] Mantener actualizado este archivo y los informes al final de cada sesión.

## 7. Cómo actualizar este contexto

Al terminar una sesión de trabajo:
1. Agrega un informe `INFORMES/INFORME-SESION-<fecha>.md` con lo hecho.
2. Actualiza las secciones 3, 5 y 6 de este archivo.
3. Commit en español (`docs: ...`) y push.
