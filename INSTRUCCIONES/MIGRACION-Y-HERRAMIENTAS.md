# MIGRACIÓN Y HERRAMIENTAS — Panderito

> **Para qué sirve este archivo:** si algún día cambias de laptop (o se pierde
> esta), aquí está TODO lo que se usó, para qué, cómo se instaló y qué hay que
> llevarse para seguir trabajando sin empezar de cero. Está pensado para que lo
> leas tú o para que se lo des a Claude en la máquina nueva.
> Última actualización: **2026-09-27**.

---

## 1. Dónde vive cada cosa (mapa)

| Qué | Dónde está | ¿Se pierde si muere la laptop? |
|---|---|---|
| **Código fuente** (app MAUI, PWA, bot, documentación) | GitHub, repo privado `Jhonatan2209/PANDERITO`, rama `master` | **No** (está en la nube) |
| **PWA publicada** | Vercel → https://panderito.vercel.app (proyecto `panderito`, root `pwa`) | **No** |
| **Tus datos de finanzas** (movimientos, panderos…) | Solo en el **celular**, dentro de Chrome (localStorage) | No dependen de la laptop. Se pierden si muere el **celular** sin respaldo → usa Ajustes → Exportar copia |
| **Credenciales personales** (`ACCESOS/`) | Dentro del repo privado | **No**, viajan con el `git clone`. Por eso el repo **jamás** debe hacerse público |
| **Memoria de Claude** (lo que Claude "recuerda" de ti y del proyecto entre sesiones) | Laptop: `C:\Users\<usuario>\.claude\projects\D--PROYECTOS-2026-PANDERITO\memory\` | **Sí** → hay que copiarla (ver §6) |
| **Servidor propio** (Clouding.io, IP `187.33.148.111`) | Nube; acceso por SSH con usuario root | No, pero **anota la contraseña/llave SSH** en `ACCESOS/` |
| Keystore de firma del APK (Fase 7, aún no existe) | Cuando se cree: fuera del repo (ej. `ACCESOS/` o un USB) | **Sí** si no se guarda aparte. Sin él no se puede actualizar la app en Google Play |
| Archivos locales sin subir (`deploy.py`, `run_compose.py`, `docker-compose.yml`, `.github/workflows/deploy.yml`, `pwa/Dockerfile`, `pwa/nginx.conf`, `bot-telegram/Dockerfile`) | Solo en esta laptop (decidimos no subirlos hasta la fase del bot) | **Sí**. Son pequeños y re-creables; si quieres conservarlos, súbelos o cópialos |

---

## 2. Herramientas instaladas en la laptop actual

| Herramienta | Versión hoy | Para qué se usó | Cómo se consigue en la laptop nueva |
|---|---|---|---|
| **Git** | 2.55 | Control de versiones; subir a GitHub | https://git-scm.com → instalar con Git Bash |
| **GitHub CLI (`gh`)** | 2.96 | Claude crea PRs, revisa despliegues, consulta el repo desde la terminal | https://cli.github.com → luego `gh auth login` |
| **Node.js** | 24 | Solo para `node --check` (validar sintaxis JS de la PWA) y, a futuro, el bot de Telegram | https://nodejs.org (LTS) |
| **Python** | 3.14 | Servidor local de la PWA (`python -m http.server`) y scripts de despliegue por SSH (`paramiko`, en `.venv_deploy/`) | https://python.org (marcar "Add to PATH") |
| **.NET SDK** | 10.0.102 | App nativa MAUI (`Panderito/`). Solo hace falta si vas a tocar la APK | Viene con **Visual Studio 2026** (workload ".NET Multi-platform App UI") o `winget install Microsoft.DotNet.SDK.10` + `dotnet workload install maui` |
| **Workloads MAUI / Android** | android 36.1.2, maui-windows 10.0.1 | Compilar Android. Traen JDK y Android SDK | Los instala Visual Studio con el workload MAUI |
| **Claude (app de escritorio, pestaña Code)** | — | Con esto se hizo todo el trabajo: leer/editar código, ejecutar comandos, probar en el navegador integrado, documentar, subir a GitHub | https://claude.ai/download → iniciar sesión con tu cuenta |
| Docker | **no instalado** aquí | Se usará en el **servidor**, no en la laptop | No hace falta en la laptop |
| Vercel CLI | **no instalado** | No hace falta: Vercel publica solo desde GitHub | No hace falta |

Configuración de git que importa (ver decisión 13 en `Panderito/DECISIONES.md`):
```bash
git config --global user.name "Jhonatan Adriano Soto"
git config --global user.email "biblioteca@unas.edu.pe"           # global (trabajo UNAS)
# SOLO dentro del repo PANDERITO (si no, Vercel bloquea los despliegues):
git config user.email "jhonatanadrianosoto@gmail.com"   # personal, vinculado a GitHub
```

---

## 3. Servicios en la nube (cuentas que debes conservar)

| Servicio | Cuenta | Para qué | Costo |
|---|---|---|---|
| **GitHub** | `Jhonatan2209` | Guarda el código; fuente de verdad. Repo privado `PANDERITO` | Gratis |
| **Vercel** | equipo `jhonatan-god` (entrar con GitHub) | Publica la PWA con HTTPS en cada push a `master`. Panel: https://vercel.com/jhonatan-god/panderito | Gratis (plan Hobby, uso personal). Una app **comercial** (taxis, empresa) requeriría plan Pro (~20 USD/mes) o tu servidor |
| **Clouding.io** | tu cuenta; servidor `187.33.148.111` (Ubuntu, Apache en :80) | Reservado para el bot de Telegram y el backend compartido (Fase D) | Prepago **por horas** (~9 €/mes si el servidor existe todo el mes; apagado también cobra; archivado solo el disco). Activa la auto-recarga |
| Telegram @BotFather | (futuro) | Crear el bot y obtener el token | Gratis |
| Anthropic API | (futuro, opcional) | Que el bot lea fotos de yapeos/boletas con IA | **De pago** por uso; alternativa gratis: registrar por texto |
| Google Play (futuro) | (futuro) | Publicar la versión Android ligera (TWA) | 25 USD **una sola vez** |

---

## 4. Cómo se trabaja el proyecto (el flujo que usamos)

1. Abrir la carpeta `D:\PROYECTOS-2026\PANDERITO` en **Claude → Code**. Claude lee `CLAUDE.md`
   y `INFORMES/CONTEXTO-PARA-CLAUDE.md` para retomar donde quedó.
2. Cambios en `pwa/` → Claude valida con `node --check`, levanta la PWA en local
   (`.claude/launch.json` → perfil `pwa`, puerto 8080) y la prueba en el navegador integrado
   con tamaño de celular (375 px).
3. Antes de publicar: subir `CACHE` en `pwa/sw.js`, `VERSION` y `NOVEDADES` en `pwa/js/app.js`
   (el Inicio muestra las novedades una vez por versión).
4. `git commit` (mensaje en español, prefijo `feat:`/`fix:`/`docs:`/`chore:`) y
   `git push origin master`. **Vercel publica solo** en ~30 s. Se verifica con:
   ```bash
   gh api repos/Jhonatan2209/PANDERITO/deployments?per_page=1
   curl -s https://panderito.vercel.app/sw.js | grep -o "panderito-pwa-v[0-9]*"
   ```
5. Al final de cada sesión: informe en `INFORMES/INFORME-SESION-<fecha>.md`, actualizar
   `INFORMES/CONTEXTO-PARA-CLAUDE.md`, y anotar decisiones en `Panderito/DECISIONES.md`.

Regla de trabajo acordada: **primero todo funcional y gratis**, todo **ligero**, y
pensar en "qué podría salir mal" antes de dar algo por hecho (`INSTRUCCIONES/PLAN-FASES-PWA.md`).

---

## 5. Lo esencial mínimo (si se pierde TODO menos las cuentas)

Con solo estas tres cosas se recupera el proyecto completo:
1. **Cuenta de GitHub** → `git clone https://github.com/Jhonatan2209/PANDERITO.git`
2. **Cuenta de Vercel** (ya conectada al repo; no hay nada que rehacer)
3. **Tu celular** con la app (o su respaldo JSON) → son tus datos reales

Lo único que se pierde de verdad sin copia es la **memoria de Claude** (§6) y el
futuro **keystore** del APK.

---

## 6. Checklist para migrar a una laptop nueva

### 6.1 Antes de dejar la laptop vieja (10 minutos)
- [ ] `cd D:\PROYECTOS-2026\PANDERITO && git status` → si hay cambios sin subir, `git add` + `commit` + `push`.
- [ ] Copiar a un USB o a tu Drive la carpeta
      `C:\Users\<usuario>\.claude\projects\D--PROYECTOS-2026-PANDERITO\memory\`
      (son archivos `.md` pequeños: lo que Claude sabe de ti, tus decisiones y preferencias).
- [ ] (Opcional) Copiar los archivos locales sin subir listados en §1.
- [ ] En el celular: Panderito → Ajustes → **Exportar copia** (por si acaso; no depende de la laptop).
- [ ] Si ya existiera `panderito.keystore`: copiarlo a un lugar seguro y anotar sus contraseñas en `ACCESOS/`.

### 6.2 En la laptop nueva (30–60 minutos, sin la app MAUI)
1. Instalar **Git**, **Node.js LTS**, **Python** y **GitHub CLI** (§2).
2. Instalar la app de escritorio de **Claude** e iniciar sesión.
3. Terminal (Git Bash):
   ```bash
   gh auth login                # GitHub → HTTPS → navegador
   mkdir -p /d/PROYECTOS-2026 && cd /d/PROYECTOS-2026
   git clone https://github.com/Jhonatan2209/PANDERITO.git
   cd PANDERITO
   git config user.email "jhonatanadrianosoto@gmail.com"
   git config user.name  "Jhonatan Adriano Soto"
   ```
4. Restaurar la memoria de Claude: abrir la carpeta del proyecto una vez en Claude → Code (eso
   crea `C:\Users\<usuario>\.claude\projects\<carpeta-del-proyecto>\`), cerrar, y copiar dentro
   de esa carpeta la subcarpeta `memory\` del USB. Si la ruta del proyecto es distinta a
   `D:\PROYECTOS-2026\PANDERITO`, el nombre de la carpeta cambia (se forma con la ruta), pero el
   contenido de `memory\` se copia igual.
5. Probar la PWA en local: `cd pwa && python -m http.server 8080` → http://localhost:8080
   (o doble clic en `pwa/LEVANTAR-PANDERITO.bat`).
6. Decirle a Claude: *"Lee CLAUDE.md e INFORMES/CONTEXTO-PARA-CLAUDE.md y retoma el proyecto"*.

### 6.3 Solo si vas a compilar la app Android (MAUI)
- Instalar **Visual Studio 2026 Community** con el workload **".NET Multi-platform App UI"**
  (incluye .NET 10, JDK y Android SDK) — o por CLI: `winget install Microsoft.DotNet.SDK.10`
  y `dotnet workload install maui`.
- Verificar: `cd Panderito && dotnet test tests/Panderito.Tests/Panderito.Tests.csproj` (42 pruebas en verde).

### 6.4 Qué NO hace falta migrar
- `bin/`, `obj/`, `.venv_deploy/`, `node_modules/`: se regeneran.
- `panderito.tar.gz`: era un paquete de despliegue viejo; está en `.gitignore` y no se usa.
- Las descargas de Claude, cachés, historial de sesiones: no son necesarias.

---

## 7. Qué se instaló y qué NO en esta sesión (para que no haya sorpresas)

- **No se instaló nada nuevo en la laptop.** Se usaron herramientas que ya tenías
  (git, gh, node, python, Claude). `paramiko` y `cryptography` ya estaban en `.venv_deploy/`
  (de tu intento de despliegue del 18–19 de septiembre).
- En el repo se **agregaron** archivos de configuración: `pwa/vercel.json`,
  `pwa/.vercelignore`, `.claude/launch.json`, `INSTRUCCIONES/PLAN-FASES-PWA.md` y este archivo.
- En la nube se **creó** el proyecto `panderito` en Vercel (lo hiciste tú desde el panel).
