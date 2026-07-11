# CLAUDE.md — Instrucciones maestras para construir "Panderito"
### App de finanzas personales en .NET MAUI (.NET 10) — offline-first, SQLite, español, Perú (S/)

Este archivo es tu guía completa, Claude Code. Léelo entero antes de empezar y síguelo de principio a fin.
El objetivo final es: **una app Android funcional, con su APK firmado, pruebas unitarias en verde y un reporte de validación**.

---

## 0. Cómo debes trabajar (reglas de operación)

1. **Trabaja por fases, en orden** (ver sección 12). No pases a la siguiente fase sin terminar y validar la anterior.
2. Mantén dos archivos vivos en la raíz del repo:
   - `PROGRESO.md`: checklist de tareas; marca lo completado y la fecha.
   - `DECISIONES.md`: cada vez que tengas que asumir algo ambiguo, elige la opción **más simple y estándar** y anótala aquí con una línea de justificación.
3. **Commits pequeños y frecuentes**, en español, con mensajes claros (`feat:`, `fix:`, `test:`, `chore:`).
4. Después de **cada fase**: ejecuta `dotnet build` y `dotnet test`. **No avances si hay errores o pruebas rojas.**
5. **No inventes** paquetes ni APIs. Si un paquete NuGet o método no existe o falla, verifica el nombre/versión y corrige; documenta el cambio en `DECISIONES.md`.
6. **Nunca subas secretos** (keystore, contraseñas) al repositorio. Agrégalos a `.gitignore`.
7. Si te bloqueas con algo que no puedes resolver solo (ej. falta de SDK que requiere instalación manual del sistema), **detente, documéntalo claramente en `PROGRESO.md`** y deja el resto lo más avanzado posible.
8. Al terminar, genera `REPORTE_VALIDACION.md` (sección 13) y deja el APK en una ruta clara.

---

## 1. Objetivo y alcance

Construir **Panderito**, una app móvil de finanzas personales para registrar **gastos e ingresos** y llevar control de **cuentas, préstamos, panderos, metas de ahorro, gastos recurrentes y presupuestos**.

- **Offline-first**: funciona 100 % sin internet. Todos los datos se guardan localmente en **SQLite**.
- **Sin login ni servidor.** Es una app personal de un solo usuario en el dispositivo.
- Idioma: **español**. Moneda: **Soles (S/)**. Contexto: **Perú** (billeteras Yape/Plin, categoría "menú", panderos, préstamos entre personas).
- Plataforma principal: **Android**. (iOS/Windows quedan como objetivo secundario opcional, no bloqueante.)

Fuera de alcance en esta primera versión: sincronización en la nube, backend, multiusuario, conexión bancaria automática. (Dejar la arquitectura preparada para agregar un backend opcional a futuro, pero **no** implementarlo.)

---

## 2. Stack técnico y versiones

- **.NET 10 SDK** y **.NET MAUI 10**.
- Target principal: `net10.0-android`.
- Lenguaje: **C#** con `Nullable` habilitado y `ImplicitUsings` habilitado.
- Patrón: **MVVM** con `CommunityToolkit.Mvvm` (source generators: `[ObservableProperty]`, `[RelayCommand]`).
- Persistencia: **SQLite** con `sqlite-net-pcl`.
- Helpers de UI/toolkit: `CommunityToolkit.Maui`.
- Pruebas: **xUnit**.
- Inyección de dependencias: la nativa de MAUI (`MauiProgram` + `builder.Services`).

### Paquetes NuGet
- `sqlite-net-pcl`
- `SQLitePCLRaw.bundle_green`
- `CommunityToolkit.Mvvm`
- `CommunityToolkit.Maui`
- (En el proyecto de pruebas) `xunit`, `xunit.runner.visualstudio`, `Microsoft.NET.Test.Sdk`

---

## 3. Requisitos del entorno (verificar ANTES de codificar)

Ejecuta y confirma. Si algo falta e **puede** instalarse por CLI, instálalo; si requiere intervención del sistema (JDK/Android SDK completos), documenta la instrucción exacta en `PROGRESO.md`.

```bash
dotnet --info                      # Debe reportar SDK 10.x
dotnet workload install maui       # Instala el workload de MAUI (incluye android)
dotnet workload list               # Confirma que 'maui' / 'maui-android' aparece
```

Para compilar Android también se necesita **JDK 17+** y el **Android SDK** (normalmente vienen con el workload de MAUI o con Visual Studio). Verifica:

```bash
java -version
# Si usas el Android SDK del workload, confirma ANDROID_HOME o la ruta del sdkmanager.
```

Si faltan licencias del SDK de Android, acepta con `sdkmanager --licenses` (o `android sdk`), según disponibilidad.

> Nota para el usuario: en tu PC tienes SQL Server y MariaDB, pero **no hacen falta** aquí. SQLite es embebido (un archivo dentro de la app) y viene con el paquete NuGet; no se instala nada de servidor.

---

## 4. Arquitectura y estructura de carpetas

Usa una **biblioteca de dominio separada** para que la lógica sea testeable sin el "head" de MAUI.

```
Panderito/
├─ CLAUDE.md
├─ PROGRESO.md
├─ DECISIONES.md
├─ REPORTE_VALIDACION.md        (se genera al final)
├─ .gitignore
├─ Panderito.sln
├─ src/
│  ├─ Panderito.Core/           (class library, net10.0 — SIN dependencia de MAUI)
│  │  ├─ Models/                (entidades + enums)
│  │  ├─ Data/                  (conexión SQLite + repositorios)
│  │  ├─ Services/              (lógica de negocio: cálculos, presupuestos, panderos)
│  │  └─ ViewModels/            (CommunityToolkit.Mvvm)
│  └─ Panderito.App/            (proyecto MAUI, net10.0-android — referencia a Core)
│     ├─ Views/                 (XAML de cada pantalla)
│     ├─ Converters/            (IValueConverter)
│     ├─ Resources/             (Styles, Colors, Fonts, imágenes/íconos)
│     ├─ AppShell.xaml          (navegación con tabs inferiores)
│     └─ MauiProgram.cs         (registro de DI)
└─ tests/
   └─ Panderito.Tests/          (xUnit, net10.0 — referencia a Core)
```

Comandos de andamiaje sugeridos:

```bash
mkdir Panderito && cd Panderito
dotnet new sln -n Panderito
dotnet new classlib -n Panderito.Core -o src/Panderito.Core -f net10.0
dotnet new maui     -n Panderito.App  -o src/Panderito.App
dotnet new xunit    -n Panderito.Tests -o tests/Panderito.Tests -f net10.0

dotnet sln add src/Panderito.Core src/Panderito.App tests/Panderito.Tests
dotnet add src/Panderito.App reference src/Panderito.Core
dotnet add tests/Panderito.Tests reference src/Panderito.Core

# Paquetes
dotnet add src/Panderito.Core package sqlite-net-pcl
dotnet add src/Panderito.Core package SQLitePCLRaw.bundle_green
dotnet add src/Panderito.Core package CommunityToolkit.Mvvm
dotnet add src/Panderito.App  package CommunityToolkit.Maui
```

> El proyecto MAUI debe dejarse compilando **solo para `net10.0-android`** en esta primera versión (ajusta `<TargetFrameworks>` para no romper el build por falta de SDK de iOS/Windows).

---

## 5. Modelo de datos (SQLite)

Crea estas entidades en `Panderito.Core/Models`. Usa `[PrimaryKey, AutoIncrement]` en los `Id`. Los enums guárdalos como `int`.

**Enums:** `TipoMovimiento { Gasto, Ingreso, Transferencia }`, `TipoCuenta { Efectivo, Yape, Plin, Banco, Tarjeta }`, `TipoPrestamo { PorCobrar, PorPagar }`, `EstadoPrestamo { Pendiente, Parcial, Pagado }`, `Frecuencia { Semanal, Quincenal, Mensual }`.

- **Cuenta**: `Id, Nombre, Tipo (TipoCuenta), SaldoInicial (decimal), Icono, ColorHex, Activa (bool)`.
- **Categoria**: `Id, Nombre, TipoMovimiento (Gasto/Ingreso), Icono, ColorHex`.
- **Movimiento**: `Id, Monto (decimal), Tipo (TipoMovimiento), CategoriaId, CuentaId, Fecha (DateTime), Nota, RutaFoto (string nullable)`.
- **Prestamo**: `Id, Persona, Monto (decimal), Tipo (TipoPrestamo), Fecha, FechaVencimiento (nullable), Estado (EstadoPrestamo), Nota`.
- **AbonoPrestamo**: `Id, PrestamoId, Monto, Fecha` (para pagos parciales).
- **Pandero**: `Id, Nombre, NumParticipantes (int), CuotaMonto (decimal), Frecuencia, FechaInicio, MiTurno (int), Activo (bool)`.
- **TurnoPandero**: `Id, PanderoId, NumeroTurno (int), NombreParticipante, FechaCobro (DateTime), Cobrado (bool)`.
- **MetaAhorro**: `Id, Nombre, MontoMeta (decimal), MontoActual (decimal), FechaMeta (nullable), CuentaId (nullable)`.
- **GastoRecurrente**: `Id, Nombre, Monto (decimal), CategoriaId, CuentaId, Frecuencia, ProximaFecha (DateTime), Activo (bool)`.
- **Presupuesto**: `Id, CategoriaId, MontoLimite (decimal), Periodo (Frecuencia, default Mensual)`.

**Capa de datos:** una clase `PanderitoDatabase` con `SQLiteAsyncConnection` (inicialización perezosa, ruta `FileSystem.AppDataDirectory`). Un **repositorio genérico** `Repository<T>` con `GetAllAsync / GetByIdAsync / SaveAsync / DeleteAsync`, y repositorios/servicios específicos donde haga falta lógica. Al primer arranque, **sembrar** (seed) categorías por defecto (Menú/Comida, Transporte, Mercado, Servicios, Salud, Entretenimiento, Otros; y para ingresos: Sueldo, Venta, Préstamo recibido, Otros) y una cuenta "Efectivo".

---

## 6. Funcionalidades por módulo

1. **Inicio/Dashboard:** saldo total (suma de saldos de cuentas ± movimientos), tarjetas "Ingresos vs Gastos del mes", gráfico de gastos por categoría, lista de últimos movimientos, accesos rápidos.
2. **Registro rápido:** monto (teclado numérico protagonista), tipo Gasto/Ingreso, categoría, cuenta, fecha (default hoy), nota, foto de boleta opcional. Objetivo: guardar en < 10 segundos.
3. **Cuentas:** CRUD de cuentas/billeteras con saldo calculado.
4. **Categorías:** CRUD con ícono y color.
5. **Préstamos:** vistas "Me deben" / "Debo", con estado, abonos parciales y marcar como pagado.
6. **Pandero:** CRUD de panderos; al crear, generar automáticamente los `TurnoPandero` según número de participantes y frecuencia; resaltar "cuándo me toca a mí"; mostrar aportado vs. a recibir.
7. **Metas de ahorro:** CRUD con barra de progreso y % alcanzado.
8. **Gastos recurrentes/servicios:** CRUD; mostrar próximos pagos ordenados por fecha.
9. **Presupuestos:** límite por categoría con barra de avance y alerta al superar el 80 % / 100 %.
10. **Reportes:** gasto por categoría (dona), tendencia mensual (barras), comparativo mes actual vs. anterior.
11. **Historial:** lista completa con búsqueda y filtros (fecha, categoría, cuenta, tipo).
12. **Ajustes:** tema claro/oscuro, moneda (default S/), seguridad con PIN/biométrico (opcional), exportar a CSV, respaldo/restaurar la base.

---

## 7. Pantallas y navegación

Navegación con **AppShell** y **TabBar inferior** de 5 destinos: **Inicio · Movimientos · (FAB + central) · Reportes · Más**. El "Más" agrupa Cuentas, Préstamos, Pandero, Metas, Recurrentes, Presupuestos y Ajustes.

Pantallas (Views) a implementar: Onboarding, Dashboard, RegistroMovimiento, DetalleMovimiento, Historial, Cuentas + Detalle, Prestamos + Detalle, Panderos + Detalle, Metas + Detalle, Presupuestos, Reportes, Ajustes, y **estados vacíos** en cada listado.

> Si dispones de mockups de Claude Design, respétalos como referencia visual. Si no, aplica los principios de la sección 8.

---

## 8. Requisitos no funcionales

- **Offline total.** Ninguna función debe requerir red.
- **Modo claro y oscuro**, con `AppThemeBinding` y una paleta en `Resources/Styles/Colors.xaml`. Semántica: verde = ingreso, rojo/coral = gasto, ámbar = pendiente.
- **Formato de moneda** siempre en Soles: `S/ #,##0.00` con `CultureInfo("es-PE")`.
- **Rendimiento:** todo acceso a BD es `async`; usa `ObservableCollection` y `CollectionView`.
- **Robustez:** manejo de errores con try/catch en la capa de datos; nunca crashear por dato faltante.
- **Accesibilidad:** contraste adecuado, objetivos táctiles ≥ 44 px.

---

## 9. Estándares de código

- `Nullable` e `ImplicitUsings` activados.
- ViewModels heredan de `ObservableObject`; comandos con `[RelayCommand]`; propiedades con `[ObservableProperty]`.
- **Nada de lógica de negocio en el code-behind** de las Views. El code-behind solo enlaza el ViewModel (por DI).
- Registrar Views, ViewModels y servicios en `MauiProgram` (DI).
- Nombres en español para el dominio (Movimiento, Cuenta, Prestamo…) y convenciones C# estándar (PascalCase).
- Un archivo por clase. Métodos cortos y con nombre claro.

---

## 10. Pruebas (xUnit, en `Panderito.Tests`)

Escribe pruebas unitarias sobre `Panderito.Core` (que no depende de MAUI). Cubre como mínimo:

- **Repositorios/Data:** guardar, leer, actualizar y borrar cada entidad (usa una BD SQLite en archivo temporal o `:memory:`).
- **Cálculos de saldo:** saldo de cuenta = saldo inicial + ingresos − gastos.
- **Presupuestos:** detección de umbrales 80 % y 100 %.
- **Pandero:** que la generación de turnos cree N turnos correctos y calcule bien "aportado vs. a recibir".
- **Préstamos:** que los abonos parciales cambien el estado a Parcial/Pagado correctamente.

Meta: **todas las pruebas en verde** antes de considerar el build listo.

```bash
dotnet test
```

---

## 11. Build y generación del APK

### Build de desarrollo (APK firmado con clave debug, sirve para probar en el celular)
```bash
dotnet build src/Panderito.App -f net10.0-android -c Debug
# El APK queda en: src/Panderito.App/bin/Debug/net10.0-android/*-Signed.apk
```

### APK de release firmado (para distribuir/instalar de forma estable)
1. Crear **una vez** un keystore (NO lo subas al repo; guárdalo aparte):
```bash
keytool -genkeypair -v -keystore panderito.keystore -alias panderito \
  -keyalg RSA -keysize 2048 -validity 10000
```
2. Publicar como APK firmado (usa variables de entorno para las contraseñas, no las escribas en claro):
```bash
dotnet publish src/Panderito.App -f net10.0-android -c Release \
  -p:AndroidPackageFormat=apk \
  -p:AndroidKeyStore=true \
  -p:AndroidSigningKeyStore=panderito.keystore \
  -p:AndroidSigningKeyAlias=panderito \
  -p:AndroidSigningStorePass=$STOREPASS \
  -p:AndroidSigningKeyPass=$KEYPASS
# El APK queda bajo: src/Panderito.App/bin/Release/net10.0-android/publish/
```
3. **Localiza y copia el .apk final** a `./artefactos/Panderito.apk` y anota la ruta exacta en `REPORTE_VALIDACION.md`.

`ApplicationId` sugerido: `pe.panderito.app`. Versión: `1.0.0` (VersionCode 1).

---

## 12. Plan de trabajo por fases

Marca cada fase en `PROGRESO.md` al completarla (con build + tests en verde).

- **Fase 0 — Entorno:** verificar SDK/workload/JDK (sección 3). Crear solución y proyectos (sección 4). Primer commit.
- **Fase 1 — Dominio y datos:** entidades, enums, `PanderitoDatabase`, repositorios, seed. Pruebas de datos.
- **Fase 2 — Servicios y ViewModels:** lógica de saldos, presupuestos, panderos, préstamos. Pruebas de servicios.
- **Fase 3 — Shell + tema + estilos:** navegación con tabs, FAB, Colors.xaml claro/oscuro, converters, formato S/.
- **Fase 4 — Pantallas núcleo:** Dashboard, Registro rápido, Historial, Detalle. App usable de punta a punta.
- **Fase 5 — Módulos:** Cuentas, Préstamos, Pandero, Metas, Recurrentes, Presupuestos, Reportes, Ajustes.
- **Fase 6 — Pulido:** estados vacíos, validaciones de formularios, manejo de errores, exportar CSV.
- **Fase 7 — Build + validación:** APK debug y release firmados, smoke test (sección 13), `REPORTE_VALIDACION.md`.

---

## 13. Validación y "Definition of Done"

### Validación automática (hazla tú, Claude Code)
- [ ] `dotnet build` sin errores ni warnings críticos (Debug y Release).
- [ ] `dotnet test` con **todas** las pruebas en verde.
- [ ] APK debug y APK release firmado generados; rutas anotadas.
- [ ] **Smoke test en emulador SI hay uno disponible:**
  ```bash
  adb devices                              # confirma emulador/dispositivo
  adb install -r ./artefactos/Panderito.apk
  adb shell monkey -p pe.panderito.app -c android.intent.category.LAUNCHER 1
  adb logcat -d | grep -iE "panderito|AndroidRuntime|FATAL"   # revisar crashes
  ```
  Verifica que la app **abre sin crashear**, que se puede registrar un movimiento y que persiste tras reabrir. Captura la salida en el reporte. Si **no** hay emulador, indícalo claramente.
- [ ] Generar `REPORTE_VALIDACION.md` con: resumen de fases completadas, resultado de tests (nº pasados), rutas de los APK, resultado del smoke test, y la **lista de checks manuales pendientes** (abajo).

### Validación manual (la hace el usuario en su teléfono — inclúyela en el reporte como checklist)
- [ ] Instalar el APK en un Android real y abrir la app.
- [ ] Registrar un gasto y un ingreso; verificar que el saldo cambia.
- [ ] Crear una cuenta, un préstamo, un pandero y una meta; verificar que persisten al cerrar y reabrir.
- [ ] Cambiar entre modo claro y oscuro.
- [ ] Revisar que los montos se muestran como `S/ …`.

**La tarea se considera terminada** cuando todo lo automático está en verde, ambos APK existen y el `REPORTE_VALIDACION.md` está completo con la checklist manual para el usuario.

---

## 14. Entregables finales

1. Código fuente completo compilando (solución `Panderito.sln`).
2. `./artefactos/Panderito.apk` (release firmado) y el APK debug.
3. Pruebas unitarias en verde.
4. `README.md` con: qué es la app, requisitos, cómo compilar, cómo generar el APK y cómo instalarlo.
5. `PROGRESO.md`, `DECISIONES.md` y `REPORTE_VALIDACION.md` actualizados.

> Recordatorio: no subas `panderito.keystore` ni contraseñas al repositorio. Verifica el `.gitignore` (bin/, obj/, *.keystore, *.db3, artefactos/).
