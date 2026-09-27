# PLAN POR FASES — Panderito PWA (2026-09-27)

Regla acordada con el usuario: **primero todo funcional y 100 % gratis**; las
integraciones (WhatsApp/Telegram, IA) son **mejoras posteriores**, cuando la
app ya funcione sola. Todo debe seguir **ligero** (hoy: ~30 KB comprimidos,
sin librerías). No avanzar de fase sin cerrar la anterior.

## Fase A — Publicar y dejar funcionando (AHORA) · costo S/ 0

- [x] PR #1 y #2 fusionados; desde ahora se trabaja directo en `master`.
- [x] Vercel conectado (proyecto `panderito`, root `pwa`) → **https://panderito.vercel.app**
- [x] Claude: URL probada (200, manifest, sw.js no-cache, archivos internos 404) y anotada (2026-09-27).
- [x] Auditoría de 25 casos límite → 23 corregidos (v5).
- [ ] Usuario: instalar desde Chrome en el celular («Instalar app») y usarla unos días.
- [ ] Corregir lo que falle en uso real (bugs, textos, cosas incómodas).

## Fase B — Robustez sin servidor · costo S/ 0

- [x] Compartir por WhatsApp (v7): resumen con formato de gastos/ingresos de hoy, semana o mes
      desde Movimientos (Web Share API; en PC abre WhatsApp Web). PDF descartado por peso.
- [ ] Copia de seguridad fácil: exportar/importar JSON desde Ajustes ya existe;
      agregar recordatorio periódico de respaldo y compartir el archivo (Web Share API).
- [ ] Pasar de localStorage a **IndexedDB** (límite ~5 MB → cientos de MB y no se
      borra al liberar espacio). Migración automática, sin perder datos.
- [ ] `navigator.storage.persist()` para que Android no purgue los datos.
- [ ] Aviso "hay versión nueva, toca para actualizar" cuando cambie `sw.js`.
- [ ] Revisión de rendimiento en celular gama baja (Lighthouse ≥ 90 en móvil).

### B.2 — «Algo no cuadra»: análisis local, sin servidor ni IA de pago (pedido 2026-09-27)

La app no debe ser solo un guardador de montos: debe **relacionar, detectar y avisar**.
Todo se calcula en el celular con reglas simples sobre los datos existentes (`Datos`),
y aparece en la sección Pendientes 🔔 del Inicio con un botón para resolverlo.

- [ ] **Cuadre de caja**: el usuario escribe el saldo real que ve en Yape/efectivo/banco;
      la app lo compara con el calculado y, si difiere, ofrece crear un «ajuste» y avisa
      «te faltan S/ X por registrar». Es la verificación más valiosa.
- [ ] **Saldo negativo** en una cuenta → «gastaste más de lo que tenías: falta un ingreso
      o el saldo inicial está mal».
- [ ] **Posible duplicado**: mismo monto, cuenta y categoría en menos de 2 minutos.
- [ ] **Gasto atípico**: monto > 3× el promedio de esa categoría (¿un cero de más?).
- [ ] **Fecha futura** o muy antigua en un movimiento nuevo.
- [ ] **Préstamos**: abonos que superan el monto; préstamo «por cobrar» sin movimiento desde hace 60 días.
- [ ] **Panderos**: pasó la fecha de tu turno y no marcaste el cobro; cuotas pagadas ≠ turnos transcurridos.
- [ ] **Pagos fijos vencidos** hace más de N días; mes con gastos pero sin ningún ingreso.
- [ ] **Tendencia**: «este mes gastas 40 % más que tu promedio en Menú/Comida».
- [ ] Cada aviso se puede **descartar** («está bien así») para no molestar dos veces.

## Fase C — Android ligero · costo S/ 0 (o USD 25 una vez si va a Google Play)

- [ ] Generar APK con **Bubblewrap/TWA** sobre la PWA de Vercel (misma base,
      sin reescribir). Instalación directa del APK = gratis; Google Play = USD 25 una sola vez.
- [ ] La app MAUI (`Panderito/`) queda congelada como referencia; se retoma solo
      si se necesita algo nativo (p. ej. leer notificaciones de Yape).

## Fase D — Mejoras: bot y mensajería · empezar gratis

Requisito previo: **datos compartidos en la nube**, porque hoy la PWA guarda
solo en el celular y ningún bot puede escribir ahí.

- [ ] Backend en el **servidor propio Clouding** (el usuario aceptó pagar ~9 €/mes
      para tener su entorno): PocketBase o Postgres + API pequeña, con Docker.
      Alternativa si se quiere S/ 0: Supabase Free. La PWA sigue offline-first y
      sincroniza cuando hay red.
- [ ] **Telegram** (gratis): bot que recibe texto/foto y registra el movimiento,
      corriendo en el servidor Clouding (Docker, `bot-telegram/`).
- [ ] Dominio propio (~USD 10/año) + HTTPS gratis (Let's Encrypt) en el servidor,
      necesario para exponer la API al celular. La PWA se queda en Vercel.
- [ ] Lectura de boletas/yapeos con IA: el scaffold usa la API de Claude (**paga**).
      Para mantener S/ 0 evaluar capa gratuita de Gemini o registrar por texto
      («gasto 25 almuerzo yape») sin IA.
- [ ] **WhatsApp**: la API oficial cobra por mensaje; no es gratis. Alternativa
      gratis: enlaces `wa.me` para compartir resúmenes. Decidir cuando llegue la fase.

## Fase E — App de taxis seguros (Huánuco)

Plan aparte, se redacta al cerrar la Fase A (ver estimación de costos en
`INFORMES/INFORME-SESION-2026-09-26.md`, sección de la conversación).
