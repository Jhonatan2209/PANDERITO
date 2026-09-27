# PLAN POR FASES — Panderito PWA (2026-09-27)

Regla acordada con el usuario: **primero todo funcional y 100 % gratis**; las
integraciones (WhatsApp/Telegram, IA) son **mejoras posteriores**, cuando la
app ya funcione sola. Todo debe seguir **ligero** (hoy: ~30 KB comprimidos,
sin librerías). No avanzar de fase sin cerrar la anterior.

## Fase A — Publicar y dejar funcionando (AHORA) · costo S/ 0

- [ ] Usuario: cerrar el PR #1 en GitHub (`feat/pwa-web` → `master`).
- [ ] Usuario: Vercel → Add New → Project → `PANDERITO` → Root Directory `pwa` → Deploy.
- [ ] Claude: probar la URL (HTTP 200, manifest, sw.js sin caché), anotar la URL
      en `pwa/README.md` y `INFORMES/CONTEXTO-PARA-CLAUDE.md`.
- [ ] Usuario: instalar desde Chrome en el celular («Instalar app») y usarla unos días.
- [ ] Corregir lo que falle en uso real (bugs, textos, cosas incómodas).

## Fase B — Robustez sin servidor · costo S/ 0

- [ ] Copia de seguridad fácil: exportar/importar JSON desde Ajustes ya existe;
      agregar recordatorio periódico de respaldo y compartir el archivo (Web Share API).
- [ ] Pasar de localStorage a **IndexedDB** (límite ~5 MB → cientos de MB y no se
      borra al liberar espacio). Migración automática, sin perder datos.
- [ ] `navigator.storage.persist()` para que Android no purgue los datos.
- [ ] Aviso "hay versión nueva, toca para actualizar" cuando cambie `sw.js`.
- [ ] Revisión de rendimiento en celular gama baja (Lighthouse ≥ 90 en móvil).

## Fase C — Android ligero · costo S/ 0 (o USD 25 una vez si va a Google Play)

- [ ] Generar APK con **Bubblewrap/TWA** sobre la PWA de Vercel (misma base,
      sin reescribir). Instalación directa del APK = gratis; Google Play = USD 25 una sola vez.
- [ ] La app MAUI (`Panderito/`) queda congelada como referencia; se retoma solo
      si se necesita algo nativo (p. ej. leer notificaciones de Yape).

## Fase D — Mejoras: bot y mensajería · empezar gratis

Requisito previo: **datos compartidos en la nube**, porque hoy la PWA guarda
solo en el celular y ningún bot puede escribir ahí.

- [ ] Backend gratis: **Supabase** (plan Free) o Firebase; la PWA sigue offline-first
      y sincroniza cuando hay red.
- [ ] **Telegram** (gratis): bot que recibe texto/foto y registra el movimiento.
      Hospedarlo como función en Vercel (webhook, gratis) en lugar del servidor Clouding.
- [ ] Lectura de boletas/yapeos con IA: el scaffold usa la API de Claude (**paga**).
      Para mantener S/ 0 evaluar capa gratuita de Gemini o registrar por texto
      («gasto 25 almuerzo yape») sin IA.
- [ ] **WhatsApp**: la API oficial cobra por mensaje; no es gratis. Alternativa
      gratis: enlaces `wa.me` para compartir resúmenes. Decidir cuando llegue la fase.

## Fase E — App de taxis seguros (Huánuco)

Plan aparte, se redacta al cerrar la Fase A (ver estimación de costos en
`INFORMES/INFORME-SESION-2026-09-26.md`, sección de la conversación).
