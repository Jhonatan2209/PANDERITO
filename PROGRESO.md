# PROGRESO — Chanchito

Checklist de fases (ver CLAUDE.md sección 12). Se marca cada fase solo con `dotnet build` y `dotnet test` en verde.

- [x] **Fase 0 — Entorno y andamiaje** (2026-07-03)
  - [x] Verificado: .NET SDK 10.0.301, workload `maui` 10.0.20, JDK 17 (`C:\Android\jdk`), Android SDK platform 36 + build-tools 36.0.0 (`C:\Android\android-sdk`).
  - [x] Solución `Chanchito.sln` con `Chanchito.Core` (net10.0), `Chanchito.App` (net10.0-android) y `Chanchito.Tests` (xUnit).
  - [x] Paquetes: sqlite-net-pcl 1.9.172, SQLitePCLRaw.bundle_green 2.1.11, CommunityToolkit.Mvvm 8.4.2, CommunityToolkit.Maui 14.2.0.
  - [x] `.gitignore`, primer build y commit.
- [x] **Fase 1 — Dominio y datos** (2026-07-03)
  - [x] 5 enums + 10 entidades en `Chanchito.Core/Models`.
  - [x] `ChanchitoDatabase` (SQLiteAsyncConnection, init perezosa, ruta inyectada), `Repository<T>`, `SembradorDatos` (11 categorías + cuenta Efectivo).
  - [x] 6 pruebas de datos en verde (CRUD de todas las entidades + seed idempotente).
- [x] **Fase 2 — Servicios y ViewModels** (2026-07-03)
  - [x] ServicioSaldos, ServicioPresupuestos (umbrales 80/100 %), ServicioPanderos (turnos + resumen), ServicioPrestamos (abonos + estados), ServicioMovimientos (filtros, dona, tendencia), ServicioRecurrentes.
  - [x] BaseViewModel (CommunityToolkit.Mvvm); los VMs concretos se crean junto a sus pantallas (fases 4–5).
  - [x] 34 pruebas en verde.
- [x] **Fase 3 — Shell + tema + estilos** (2026-07-03)
  - [x] Colors.xaml con paleta del prototipo Bolsillo (claro/oscuro) + EstilosChanchito.xaml (tarjetas, botones, chips, montos).
  - [x] AppShell con TabBar de 5 tabs (Inicio · Movimientos · Registrar · Reportes · Más) e íconos SVG propios.
  - [x] Converters: MonedaConverter (S/ es-PE), MontoConSignoConverter, ColorHexConverter. FormatoMoneda en Core con pruebas.
  - [x] DI registrada en MauiProgram (BD, servicios, páginas).
- [x] **Fase 4 — Pantallas núcleo** (2026-07-03)
  - [x] Dashboard: saludo + mes, tarjeta de saldo total, ingresos vs gastos del mes, últimos movimientos, acceso rápido a registrar.
  - [x] Registro rápido: toggle Gasto/Ingreso, monto protagonista, categoría/cuenta/fecha/nota, validaciones.
  - [x] Historial: búsqueda por nota, chips Todos/Gastos/Ingresos, filtros por categoría y cuenta, estado vacío.
  - [x] Detalle de movimiento con eliminación (confirmación previa). Ruta `detalleMovimiento` registrada.
  - [x] INavegador (Core) + NavegadorShell (App). ViewModels: Dashboard, RegistroMovimiento, Historial, DetalleMovimiento.
- [ ] **Fase 5 — Módulos**
- [ ] **Fase 6 — Pulido**
- [ ] **Fase 7 — Build + validación**

## Bloqueos
(ninguno por ahora)
