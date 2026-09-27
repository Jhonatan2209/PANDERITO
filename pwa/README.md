# Panderito PWA — versión web instalable

Réplica **web** de la app Panderito (originalmente .NET MAUI para Android), pensada para
usarse desde el **celular** como app instalable (PWA). Funciona **sin internet** y guarda los
datos **solo en el dispositivo** (localStorage) — no hay servidor ni cuenta.

> **Tus finanzas, tu junta.** Ingresos, gastos, cuentas, categorías y reportes, con la misma
> identidad visual (violeta + moneda dorada) del proyecto original.

## ¿Qué incluye esta versión?

| Pantalla | Estado |
|---|---|
| **Inicio** (saldo total, ingresos/gastos del mes, últimos movimientos) | ✅ |
| **Registrar** (gasto/ingreso, monto, categoría, cuenta, fecha, nota) | ✅ |
| **Movimientos** (búsqueda + filtros Todos/Gastos/Ingresos) | ✅ |
| **Detalle de movimiento** (ver, editar, eliminar) | ✅ |
| **Reportes** (navegación por mes, ahorro/déficit, 6 meses, gasto por categoría) | ✅ |
| **Cuentas** (lista con saldo calculado, crear) | ✅ |
| **Categorías** (gastos/ingresos, eliminar las libres) | ✅ |
| **Préstamos** (Me deben/Yo debo, abonos parciales, marcar pagado) | ✅ |
| **Panderos** (crear con turnos automáticos, "cuándo me toca", marcar cobrado) | ✅ |
| **Metas de ahorro** (progreso %, abonar, "¡Lograda! 🎉") | ✅ |
| **Recurrentes** (próximos pagos, "vence en X días", registrar pago) | ✅ |
| **Presupuestos** (límite por categoría, alertas 80%/100%) | ✅ |
| **Ajustes** (tema claro/oscuro/auto, exportar copia JSON, borrar todo) | ✅ |
| Instalable como PWA (offline, icono, pantalla de inicio) | ✅ |

### Novedades (v3)

- **Métodos de pago**: cuentas semilla Efectivo, Yape, Plin y Banco; cada cuenta es editable (nombre, tipo, ícono) y se usa igual en todo (ingresos, gastos, pagos fijos).
- **Saldo inicial**: pon el dinero que ya tienes (ej. S/ 8000) en cada cuenta y empieza a llevar el registro desde ahí, sin sustentar movimientos. Se ajusta tocando la tarjeta de saldo o la cuenta.
- **Panderos conectados al saldo**: botón *Pagar cuota* (gasto que resta del saldo, categoría «Pandero») y *Cobrar el pozo* (ingreso que suma al saldo). Desglose del pozo, total a aportar y **nombres/DNI de participantes** editables por turno.
- **Pagos fijos** (recurrentes) con proveedor/detalle (internet, línea celular, alquiler…).
- **Pendientes 🔔** en el inicio + **recordatorios** (notificación local): panderos por cobrar, pagos por vencer y presupuestos en alerta.
- Arreglos de UI: input de fecha compacto, selects con estilo propio.

## Cómo probarlo

### En la PC
```bash
cd pwa
python -m http.server 8080
# abre http://localhost:8080
```

### En el celular (misma red Wi-Fi)
1. En la PC: `python -m http.server 8080 --bind 0.0.0.0` dentro de la carpeta `pwa/`.
2. En el celular (misma Wi-Fi), abre `http://<IP-de-tu-PC>:8080` — por ejemplo `http://192.168.18.27:8080`.
3. Menú del navegador → **«Agregar a pantalla de inicio»** / **«Instalar app»**.

> ⚠️ Por HTTP en la red local el PWA funciona, pero la **instalación offline completa exige
> HTTPS**. Para la experiencia PWA total, despliégalo (ver abajo).

### Desplegar en internet (HTTPS, recomendado para instalar en el celular)

**Opción elegida: Vercel (plan Hobby, gratis)** — ver decisión 12 en `Panderito/DECISIONES.md`.

> 🌐 **URL pública: https://panderito.vercel.app** (publicada el 2026-09-27; se actualiza sola con cada push a `master`).
> En el celular: abrir esa URL en Chrome → menú ⋮ → **Instalar app** / **Agregar a pantalla de inicio**.

1. En vercel.com → **Add New… → Project** → importar el repo **`Jhonatan2209/PANDERITO`**
   (si no aparece: *Adjust GitHub App Permissions* y dar acceso a ese repo).
2. **Root Directory: `pwa`** ← obligatorio (así nunca se publica `ACCESOS/`).
3. **Framework Preset: Other**, sin Build Command ni Output Directory (son archivos estáticos).
4. **Deploy**. Cada `git push` a `master` publica solo; las otras ramas generan previews.

Archivos de Vercel dentro de `pwa/`:
- **`vercel.json`** — cabeceras: `sw.js` sin caché (para que las actualizaciones lleguen al
  celular), tipo correcto del manifest y cabeceras de seguridad básicas.
- **`.vercelignore`** — no publica `README.md`, `LEVANTAR-PANDERITO.bat`, `Dockerfile` ni `nginx.conf`.

Otras opciones: **Netlify** (misma idea, base = `pwa/`) o **GitHub Pages** (en repos privados
requiere GitHub Pro).

> 🔒 **Seguridad:** despliega **únicamente la carpeta `pwa/`**, nunca la raíz del repo.
> El repositorio contiene una carpeta `ACCESOS/` con datos sensibles; publicar la raíz la
> expondría. Mantén el repositorio **privado**.

## Cómo está hecho (sin dependencias ni build)
- **HTML + CSS + JavaScript puro** — no requiere Node ni compilación.
- **`js/datos.js`** — capa de datos (localStorage) que replica el dominio de `Panderito.Core`
  (Movimiento, Categoria, Cuenta) y las mismas categorías/cuenta semilla que `SembradorDatos.cs`.
- **`js/app.js`** — router por hash + todas las vistas.
- **`css/estilos.css`** — sistema de diseño con la paleta de `Colors.xaml` (claro/oscuro).
- **`sw.js` + `manifest.webmanifest`** — offline e instalación.
- **Moneda:** S/ (Perú, `es-PE`), igual que `FormatoMoneda.cs`.

## Relación con la app MAUI original
Esta PWA **no reemplaza** la app .NET MAUI (`Panderito/`), es una **réplica web** paralela y
autónoma para acceso rápido desde el navegador/celular. Comparten diseño y modelo de datos,
pero cada una guarda sus datos por separado.
