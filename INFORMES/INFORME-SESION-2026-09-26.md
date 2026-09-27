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

## 4.b — Auditoría de casos límite y correcciones (2026-09-27, misma sesión)

Se pidió "pensar en qué podría salir mal" antes de publicar. Un revisor
independiente (agente) auditó `pwa/` y reportó **25 hallazgos** (5 graves);
se confirmaron leyendo el código y se corrigieron **23** en `datos.js`,
`app.js` y `sw.js` (CACHE → **v5**). Los otros 2 (nginx.conf) se atienden
cuando se use el servidor propio.

| # | Problema (qué le pasaba al usuario) | Corrección |
|---|---|---|
| 1 | Borrar la fecha y tocar Guardar: el botón "no hacía nada" (excepción silenciosa) | `fechaDesdeInput()` valida; toast «Elige una fecha» en los 5 formularios |
| 2 | De 7 pm a medianoche la fecha por defecto era **mañana** (se calculaba en UTC) | `hoyInput()` usa fecha local de Perú |
| 3 | Existía «Exportar copia» pero **no había forma de restaurarla** | Ajustes → **Restaurar copia** (valida el JSON, confirma, reemplaza) |
| 4 | Las notificaciones **nunca salían en Chrome Android** y la app decía que sí | Se notifican vía Service Worker (`showNotification`) |
| 5 | Al subir la versión, el SW podía guardar archivos viejos de la caché del navegador | `cache: 'reload'` en `addAll`; aviso «Actualizando…» y recarga |
| 6 | JSON corrupto → se pisaba con datos vacíos sin aviso | Se aparta en `…v1.corrupto`, la app arranca y Ajustes ofrece descargarlo |
| 7 | Almacenamiento lleno/bloqueado → el dato "se guardaba" y desaparecía al recargar | `guardar()` con try/catch + evento → toast de advertencia |
| 8 | Tocar ＋ dos veces dejaba un formulario "fantasma" que borraba lo escrito | Si ya estás en la ruta, se renderiza a mano |
| 9 | Cambiar Gasto↔Ingreso borraba monto, fecha y nota | `setTipo()` lee los inputs antes de re-renderizar |
| 10 | Abonar más de lo pendiente → «Te debe S/ -50.00» | La UI avisa y la capa de datos recorta al pendiente |
| 11 | Centavos: 2.05+1.13+0.94+0.88 = 4.999… → préstamo nunca «Pagado» | Todo monto se redondea (`r2`) y se compara con tolerancia |
| 12 | Borrar categoría/cuenta usada por pagos fijos o presupuestos → gastos huérfanos | `categoriaEnUso()` / `cuentaEnUso()`; «Pandero» no se borra |
| 13 | 31 ene + 1 mes = **3 mar** (alquiler se corría de mes) | `addMeses()` recorta al último día del mes |
| 14 | «Pagar cuota» ilimitado y «Aportado» siempre S/ 0; pozo cobrable dos veces | Pagar cuota marca la ronda; pozo una sola vez (`pozoCobrado`) |
| 15 | Movimientos del mismo día en orden inverso | Desempate por id (último registrado arriba) |
| 16 | Recordatorios solo al abrir la app sin decirlo | Texto aclara «te avisamos al abrir la app» |
| 18 | Fecha futura escrita a mano se guardaba | Toast «La fecha no puede ser futura» |
| 19 | «12,50» con coma → «monto inválido» sin explicación | Inputs `type=text inputmode=decimal` + `numero()` acepta 12,50 · 1,234.50 · 1.234,50 |
| 20 | Cuentas con nombre repetido | `existeCuentaConNombre()` |
| 21 | CSS inválido `var(--ingreso)22` → íconos sin fondo | `fondoSuave()` con `color-mix` |
| 22 | Exportar pisaba el respaldo anterior | Nombre con fecha; blob liberado después |
| 24 | Gráfico de 6 meses ignoraba el mes elegido | `serieMeses(6, refReporte)` |
| 25 | 100000 participantes congelaba la app | Máximo 60 |

Verificación: `node --check` OK en los 3 JS; **pruebas en navegador** (servidor
local + vista móvil 375 px): 15 comprobaciones de datos en verde (redondeo,
abonos, orden, borrado protegido, pandero, importar válido/inválido, arranque con
JSON corrupto) y flujo de UI (coma decimal, fecha vacía/futura, setTipo conserva
datos, doble toque en ＋, íconos con fondo). Pendiente de probar en un Android
real: notificación vía SW e instalación desde Vercel.

Se eliminó código muerto (`nuevaCuenta()`) y se agregó `.claude/launch.json`
para levantar la PWA desde el navegador integrado.

## 4.c — Publicación en Vercel (2026-09-27) ✅

El usuario importó el repo en Vercel (proyecto `panderito`, Root Directory `pwa`).
**URL: https://panderito.vercel.app**. Verificado desde aquí: HTTP 200 en todos los
archivos, `sw.js` con `Cache-Control: no-cache`, manifest con tipo correcto, cabeceras
de seguridad (HSTS, nosniff, SAMEORIGIN), `README.md`/`Dockerfile`/`nginx.conf`/`.bat`
y `ACCESOS/` responden 404, SW v5 registrado y la app renderiza en vista móvil.

## 4.d — v6 y v7: novedades por versión y compartir por WhatsApp (2026-09-27)

- **v6:** tarjeta «🆕 Novedades» en Inicio, una sola vez por versión (`VERSION` +
  `NOVEDADES` en `app.js`; «Entendido» la oculta; Ajustes → «Ver novedades»). Tarjeta de
  saldo separada de ingresos/gastos (`margin-bottom`).
- **v7:** en Movimientos, botones **Compartir: Hoy / Esta semana / Este mes** que arman un
  texto con formato de WhatsApp (negritas, emojis, totales y balance) respetando el chip
  Todos/Gastos/Ingresos, y lo envían con la hoja nativa del celular (`navigator.share`) o
  abren WhatsApp Web en la PC. Se descartó el PDF: requeriría una librería pesada y el
  texto se lee mejor en el chat. Probado en navegador (texto generado verificado).
- **Vercel bloqueaba despliegues** («Deployment was blocked») porque el correo de autor de
  los commits no estaba vinculado a GitHub → el repo usa ahora el correo personal del
  usuario (decisión 13). Verificado con despliegues exitosos.
- Nueva guía `INSTRUCCIONES/MIGRACION-Y-HERRAMIENTAS.md` (pedido del usuario).
- **v8 — Perfil** (Más → Perfil): nombre libre para el saludo del Inicio («Buenas tardes,
  Jhonatan 👋») y profesión con desplegable (19 opciones comunes en Perú) + «Otro» con
  texto libre. Opcional; se guarda en `estado.perfil` (migración automática). Base para el
  futuro **módulo Trabajo** (horas/días → posibles ingresos), pendiente de 3 respuestas
  del usuario (marcar faltas, reparto por días laborables vs 30 días, cuándo hacerlo).

## 4.e — v9: módulo Trabajo (2026-09-27)

Pedido: convertir días/horas de trabajo en «posibles ingresos». Decisiones del usuario:
calendario que se prende/apaga con un toque, patrón por defecto L–V, día completo como
unidad, prorrateo sobre los días laborables reales del mes (no 30 fijos), hacerlo ya.

Implementado (`datos.js` + `app.js` + CSS):
- Trabajos con modo Mensual / por Día / por Hora, horas por día, días de la semana,
  feriados pagados (sí/no) y cuenta de cobro. Pausar / eliminar.
- Calendario mensual (semana desde lunes): verde = cuenta, rojo tachado = falté,
  violeta = día extra, gris = descanso, ★ = feriado; navegación por meses.
- Feriados del Perú: 14 fijos + Jueves y Viernes Santo por algoritmo de Pascua.
- Tarjeta «Ganado hasta hoy / proyección», valor de tu día y de tu hora, barra de avance.
- Inicio: caja **Posibles ingresos** (ganado del mes aún no cobrado; «✓ Ya cobrado» si se cobró).
- «Ya me pagaron»: monto editable (por defecto la proyección) + cuenta → crea el ingreso
  real (categoría Sueldo) y marca el mes; no se puede cobrar dos veces.

Verificado en navegador: setiembre 2026 con S/ 3 000 L–V → 22 días planificados,
valor día S/ 136.36, hora S/ 17.05, 19 días contados al 27/09; octubre 22 días con feriado
pagado y 21 sin; Semana Santa 2026 y 2027 detectadas; toque en lunes 21 → falta, en sábado
26 → extra, segundo toque vuelve al patrón; cobro crea ingreso y deja posibles en 0; segundo
cobro rechazado; calendario cabe en 375 px (celdas de 40 px). Se corrigió un bug detectado
en la prueba: la actualización parcial de un trabajo (p. ej. pausar) borraba el monto.

## 4.f — v10: pandero compartible al grupo (2026-09-27)

Pedido: compartir la situación del pandero (quién cobró, quién pagó) como imagen al grupo
de WhatsApp. Implementado:
- **Pagos por ronda**: en el detalle del pandero, sección «Ronda N: pagos de la cuota» con
  un chip por participante; se toca cuando pone su cuota (`turno.pagaron = [n…]`). Muestra
  recaudado vs pozo. La ronda actual es el primer turno no cobrado.
- **Compartir 🖼️ Imagen**: PNG de 1080 px dibujado con `<canvas>` (cabecera violeta, datos
  del pandero, ronda actual con pagaron/faltan, tabla de turnos con estado). Se envía con
  `navigator.share({files})` (Chrome Android) o se descarga en PC. Sin DNI (dato sensible).
- **Compartir 💬 Texto**: versión WhatsApp con emojis y negritas.
- Verificado en navegador: pandero de 5 con 1 ronda cobrada y 2 pagos → texto correcto;
  PNG 1080×1120, 351 KB, nombre `pandero-<nombre>-<fecha>.png`. Se corrigió un error de
  tipeo en el canvas detectado por la prueba (ReferenceError).

## 5. Pendiente para el usuario

0. **Cerrar el PR #1** en GitHub (botón *Merge pull request*); Claude no tiene
   permiso para hacerlo. Sin esto `master` no tiene `pwa/` y Vercel no la encuentra.
1. **Importar el proyecto en Vercel** (Add New → Project → `Jhonatan2209/PANDERITO`,
   **Root Directory = `pwa`**, Framework = Other) — ver `pwa/README.md`.
2. **Seguridad del servidor:** revisar si alguien descargó `ACCESOS/` mientras estuvo allí:
   `grep -i -E "accesos|tar.gz" /var/log/apache2/access.log*`. Si aparece algún acceso,
   **cambiar las contraseñas** que había en esa carpeta. A futuro: entrar por SSH con llave
   en vez de contraseña de root.
