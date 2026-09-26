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
- **Ramas:** `master` (principal; la PWA se fusionó desde `feat/pwa-web` vía PR #1 el 2026-09-26).
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
  `pwa/sw.js`** (hoy v4 → v5) para que los usuarios reciban la actualización.
- **Hosting: Vercel** (cuenta del usuario `jhonatan-god`, plan Hobby), Root
  Directory = `pwa`, con `pwa/vercel.json` y `pwa/.vercelignore`. Publica en
  cada push a `master`. Paso a paso en `pwa/README.md`. Decisión 12.

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
4. Se fusionó el PR #1 (`feat/pwa-web` → `master`).

## 6. Pendientes / ideas para próximas sesiones

- [ ] Importar el proyecto en Vercel (Root Directory = `pwa`) y probar la
      instalación en el celular; anotar aquí la URL final.
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
