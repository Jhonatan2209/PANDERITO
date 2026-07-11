# ARQUITECTURA de Panderito — mapa del código para IAs y desarrolladores

> Objetivo: que cualquier IA (Claude u otra) o desarrollador entienda el código en 5 minutos
> sin tener que abrir archivo por archivo. Complementa a `../CLAUDE.md` (guía rápida) y a
> `../INSTRUCCIONES/CLAUDE.md` (spec completa del proyecto).

## Visión general

App de finanzas personales **offline-first** (sin servidor, sin login, un solo usuario) para Android,
en español y soles peruanos (S/). Patrón **MVVM** estricto: la lógica vive en `Panderito.Core`
(biblioteca .NET pura, testeable, sin dependencia de MAUI) y la UI en `Panderito.App` (MAUI).

```
┌─────────────────────────────┐      ┌──────────────────────────────┐
│ Panderito.App (net10-android)│ ───▶ │ Panderito.Core (net10.0)     │
│  Views XAML + code-behind    │  DI  │  ViewModels · Services       │
│  Converters · Servicios UI   │      │  Models · Data (SQLite)      │
└─────────────────────────────┘      └──────────────────────────────┘
                                          ▲ probado por
                                     Panderito.Tests (xUnit, 42 pruebas)
```

## Panderito.Core — dominio y lógica (sin MAUI)

### `Models/` — entidades SQLite (sqlite-net-pcl, atributos `[Table]`/`[PrimaryKey]`)

| Entidad | Qué representa |
|---|---|
| `Movimiento` | Gasto o ingreso: monto, fecha, categoría, cuenta, nota |
| `Categoria` | Categoría con ícono y color hex (11 sembradas por defecto) |
| `Cuenta` | Efectivo, banco o billetera (Yape/Plin); el saldo se **calcula**, no se guarda |
| `Prestamo` + `AbonoPrestamo` | Préstamos "me deben / debo" con abonos parciales |
| `Pandero` + `TurnoPandero` | Junta de ahorro rotativa: cuota, participantes, turnos con fechas |
| `MetaAhorro` | Meta con monto objetivo y acumulado |
| `GastoRecurrente` | Pago periódico con próxima fecha de vencimiento |
| `Presupuesto` | Límite de gasto por categoría y período |
| Enums | `TipoMovimiento`, `TipoCuenta`, `TipoPrestamo`, `EstadoPrestamo`, `Frecuencia` |

### `Data/` — acceso a datos

- `PanderitoDatabase` — conexión SQLite única con **inicialización perezosa**; la ruta del `.db3`
  la inyecta el head MAUI (`FileSystem.AppDataDirectory`), por eso Core es testeable con archivos temporales.
- `Repository<T>` — CRUD genérico sobre esa conexión.
- `SembradorDatos` — primer arranque: 11 categorías + cuenta "Efectivo".

### `Services/` — reglas de negocio (todas con pruebas)

| Servicio | Responsabilidad |
|---|---|
| `ServicioSaldos` | Saldo por cuenta y total (suma de movimientos) |
| `ServicioMovimientos` | Filtros de historial, datos de dona y tendencias para reportes |
| `ServicioPresupuestos` | Gasto vs límite por período; alertas al 80 % y 100 % |
| `ServicioPanderos` | Generación de turnos, "cuándo me toca", aportado vs pozo |
| `ServicioPrestamos` | Abonos parciales, saldo pendiente, cambio de estado |
| `ServicioRecurrentes` | Próximos vencimientos; registrar pago crea movimiento y avanza la fecha |
| `ServicioExportacion` | Exporta movimientos a CSV (UTF-8 con BOM para Excel) |
| `FormatoMoneda` | Formato `S/` con cultura es-PE |

### `ViewModels/` — uno por pantalla (CommunityToolkit.Mvvm)

`BaseViewModel` (estado ocupado/título) + 24 concretos que espejan las Views
(Dashboard, Registro, Historial, Detalles, listas y pantallas de edición por módulo).
Interfaces `INavegador` (navegación/diálogos) e `IApariencia` (tema) permiten a los VMs
navegar y cambiar tema **sin conocer MAUI**; la App las implementa.

## Panderito.App — capa MAUI (solo UI)

- `MauiProgram.cs` — arranque y **registro DI** de BD (con ruta Android), servicios, VMs y páginas.
- `AppShell.xaml` — TabBar de 5 tabs: Inicio · Movimientos · Registrar · Reportes · Más; rutas de detalle registradas ahí.
- `Views/` — 23 pantallas XAML; code-behind mínimo (solo recibe el VM por constructor).
- `Servicios/` — `NavegadorShell : INavegador` (Shell + diálogos) y `AparienciaApp : IApariencia` (tema persistido en Preferences).
- `Converters/` — `MonedaConverter` (S/), `MontoConSignoConverter` (+/− con color), `ColorHexConverter`.
- `Resources/Styles/` — `Colors.xaml` (paleta claro/oscuro, fuente de verdad de colores) y `EstilosPanderito.xaml` (tarjetas, botones, chips).
- `Resources/AppIcon/` y `Resources/Splash/` — ícono adaptativo y splash generados desde los SVG del logo (fuentes editables en `/branding`).

## Panderito.Tests — xUnit

`BaseDeDatosTemporal` crea una BD SQLite en archivo temporal por prueba. Cubre: repositorio y seed,
saldos, movimientos/reportes, presupuestos, panderos, préstamos, exportación CSV y formato de moneda.
**Regla del proyecto: nunca dejar pruebas en rojo.**

## Convenciones

- Todo en **español**: clases, propiedades, commits, comentarios y UI.
- Comentarios XML `/// <summary>` en servicios, datos y clases no triviales.
- Decisiones ante ambigüedad → `Panderito/DECISIONES.md`; avance por fases → `Panderito/PROGRESO.md`.
- Colores SIEMPRE desde `Colors.xaml` (violeta primario `#6D5AE6`); no hardcodear hex en las vistas.

## Cómo agregar una pantalla nueva (receta)

1. Modelo/servicio en Core si hay lógica nueva (+ prueba en Tests).
2. ViewModel en `Core/ViewModels` heredando `BaseViewModel`.
3. Página XAML en `App/Views` (binding al VM, estilos de `EstilosPanderito.xaml`).
4. Registrar VM y página en `MauiProgram.cs`; ruta en `AppShell.xaml` o `Routing.RegisterRoute`.
5. `dotnet test` en verde antes del commit.
