# INFORME DE SESIÓN — 26 de septiembre de 2026

**Rama:** `feat/pwa-web` (PR #1 → `master`, lo fusiona el usuario) · **Enfoque:** publicar la
PWA en internet con HTTPS para usarla desde el celular.

---

## 1. Qué se pidió

1. Analizar las carpetas del proyecto y ubicar el repositorio en GitHub
   (el usuario no recordaba si se llamaba "chanchito" o "panderito").
2. Decidir dónde publicar la PWA: una plataforma gratis (Vercel) o el
   servidor propio en Clouding.io, y entender cómo cobra Clouding.
3. Priorizar la **PWA** (es la que se usará por ahora); la APK de MAUI queda para después.

## 2. Qué se encontró

- **Repositorio:** `https://github.com/Jhonatan2209/PANDERITO` (privado). No existe repo
  "chanchito": el proyecto se renombró a Panderito el 2026-07-10.
- `feat/pwa-web` estaba sincronizada con GitHub; **PR #1** (PWA → `master`) abierto y sin conflictos.
- **Trabajo del 18–19 de septiembre sin versionar ni documentar** (despliegue al servidor
  `187.33.148.111`): `docker-compose.yml`, `pwa/Dockerfile`, `pwa/nginx.conf`,
  `bot-telegram/Dockerfile`, `deploy.py`, `run_compose.py` (subida por SSH con paramiko),
  `.github/workflows/deploy.yml` (rsync + pm2) y `panderito.tar.gz`.
- **Problemas detectados en ese trabajo:**
  1. `panderito.tar.gz` empaquetaba **toda la raíz del repo, incluida `ACCESOS/`**, y
     `deploy.py` lo descomprimía en `/var/www/panderito` del servidor (Apache en el puerto 80).
     → **El usuario borró esos archivos del servidor en esta sesión.**
  2. Dos estrategias de despliegue que chocan: Docker Compose (nginx en 8080) vs. el workflow
     (rsync `--delete` + pm2 en otra ruta). El workflow además fallaría: el repo no tiene los
     secretos `SSH_PRIVATE_KEY` / `SSH_KNOWN_HOSTS`.
  3. El puerto 8080 no respondía: el despliegue con Docker no quedó funcionando.
  4. `run_compose.py` copia `.env.example` como `.env` → el bot arrancaría sin token real.

## 3. Decisiones

- **PWA en Vercel (plan Hobby, gratis)** con Root Directory = `pwa`. Motivos: la PWA es
  100 % estática (datos en localStorage del celular), Vercel da **HTTPS** automático
  (obligatorio para instalarla y usarla offline) y publica solo en cada push.
  El servidor propio solo se accede por IP sin HTTPS → ahí la PWA no se instala.
- **El servidor Clouding se reserva** para el bot de Telegram y el futuro backend compartido.
- Los archivos de Docker/SSH/workflow **quedan locales, sin commit**, hasta que se trabaje
  el bot (el workflow, si se sube tal cual, fallaría en cada push).
- Registrado como decisión 12 en `Panderito/DECISIONES.md`.

### Cómo cobra Clouding.io (investigado)

- **Prepago por consumo, no cuota fija:** se recarga saldo y se descuenta **por horas**
  mientras el servidor exista. El "precio mensual" que muestran es solo una aproximación
  (9 €/mes ≈ 0,012 €/hora).
- Los **5 € de regalo** con un servidor de ~9 €/mes alcanzan para unos **17 días**.
- Servidor **apagado sigue cobrando**; **archivado** solo cobra el disco SSD.
- El saldo recargado **no caduca** (blog de Clouding). No se confirmó si el saldo de
  regalo vence ni qué ocurre exactamente al llegar a 0 → revisar el panel y activar auto-recarga.

## 4. Qué se hizo

| Archivo | Cambio |
|---|---|
| `pwa/vercel.json` | **Nuevo.** `sw.js` sin caché, `Content-Type` del manifest y cabeceras de seguridad |
| `pwa/.vercelignore` | **Nuevo.** No publica `README.md`, `.bat`, `Dockerfile`, `nginx.conf` |
| `pwa/sw.js` | `CACHE` v3 → **v4** |
| `pwa/README.md` | Paso a paso para publicar en Vercel |
| `.gitignore` | Ignora `*.tar.gz`, `.venv_deploy/`, `.vercel/` |
| `Panderito/DECISIONES.md` | Decisión 12 (hosting en Vercel) |

Validación: `vercel.json` es JSON válido; `node --check pwa/sw.js` OK.

## 5. Pendiente para el usuario

0. **Cerrar el PR #1** en GitHub (botón *Merge pull request*); Claude no tiene
   permiso para hacerlo. Sin esto `master` no tiene `pwa/` y Vercel no la encuentra.
1. **Importar el proyecto en Vercel** (Add New → Project → `Jhonatan2209/PANDERITO`,
   **Root Directory = `pwa`**, Framework = Other) — ver `pwa/README.md`.
2. **Seguridad del servidor:** revisar si alguien descargó `ACCESOS/` mientras estuvo allí:
   `grep -i -E "accesos|tar.gz" /var/log/apache2/access.log*`. Si aparece algún acceso,
   **cambiar las contraseñas** que había en esa carpeta. A futuro: entrar por SSH con llave
   en vez de contraseña de root.
