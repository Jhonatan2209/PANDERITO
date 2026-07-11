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
| **Ajustes** (tema claro/oscuro/auto, exportar copia JSON, borrar todo) | ✅ |
| Instalable como PWA (offline, icono, pantalla de inicio) | ✅ |
| Panderos · Préstamos · Metas · Recurrentes · Presupuestos | ⏳ pendiente (siguiente iteración) |

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
- **Netlify / Vercel:** publica **solo la carpeta `pwa/`** como base del sitio.
- **GitHub Pages:** publica con la carpeta `pwa/` como raíz.

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
