# CAMBIOS — Bitácora del proyecto

Registro de cambios grandes del proyecto (los detalles finos están en el historial de git).

## 2026-07-10 — Renombrado a PANDERITO + identidad visual + repositorio

### 1. Renombrado Chanchito → Panderito

- **Carpetas y archivos**: `Chanchito/` → `Panderito/`, `Chanchito.slnx` → `Panderito.slnx`,
  `src/Chanchito.App` → `src/Panderito.App`, `src/Chanchito.Core` → `src/Panderito.Core`,
  `tests/Chanchito.Tests` → `tests/Panderito.Tests`, `ChanchitoDatabase.cs` → `PanderitoDatabase.cs`,
  `EstilosChanchito.xaml` → `EstilosPanderito.xaml`, `CONTEXTO/diseno_chanchito` → `diseno_panderito`.
- **Contenido**: reemplazo `Chanchito` → `Panderito` en 134 archivos de texto (namespaces, `using`,
  clases, XAML, docs). Cero referencias restantes al nombre viejo.
- **Identidad de la app**: `ApplicationTitle` = `Panderito`, `ApplicationId` = `pe.panderito.app`
  (en `Panderito.App.csproj`). ⚠️ Al cambiar el ApplicationId, Android lo instala como app nueva:
  desinstalar el APK viejo de Chanchito si estaba instalado.
- **Validación**: `dotnet test` en verde (42/42 pruebas).
- La carpeta del disco `E:\PROYECTOS_UNAS\APP_GESTOR_DINERO_CHANCHITO` conserva su nombre
  (renombrarla rompería rutas de sesiones/herramientas; el contenido ya es 100 % Panderito).

### 2. Nuevo logo e identidad visual

Concepto: **moneda dorada con la letra P, rodeada por la ronda de la junta** — los puntos blancos son
los miembros del pandero y el punto dorado superior es quien recibe el pozo en el turno actual.
Paleta tomada de `Colors.xaml`: violeta `#6D5AE6` + dorado `#FDB022→#F79009`.

- Nueva carpeta `branding/` con el logo y 6 variaciones SVG (ícono a color, monocromo blanco/violeta,
  horizontal claro/oscuro con eslogan "Tus finanzas, tu junta", vertical). Ver `branding/README.md`.
- Ícono adaptativo Android reemplazado: `Resources/AppIcon/appicon.svg` (fondo violeta) +
  `appiconfg.svg` (glifo). Splash reemplazado: `Resources/Splash/splash.svg`.
- En el `.csproj`: color de fondo del ícono y del splash actualizado de `#512BD4` (plantilla .NET)
  a `#6D5AE6` (violeta de marca); splash con `BaseSize` 192.

### 3. Repositorio GitHub

- Repo **privado** creado: `https://github.com/Jhonatan2209/PANDERITO` (cuenta Jhonatan2209, rama `master`).
- La raíz del repositorio se movió de `Chanchito/` a la carpeta completa del proyecto, para incluir
  `CONTEXTO/`, `INSTRUCCIONES/`, `branding/` y el zip del diseño original. El historial previo
  (fases 0–5) se conserva intacto.
- `.gitignore` movido a la raíz. `ACCESOS/` (credenciales personales) se excluyó inicialmente,
  pero **el usuario pidió incluirla** por ser un repo privado al que solo él accede; se versiona
  desde el mismo día. ⚠️ Por esta razón el repositorio **nunca debe hacerse público** sin antes
  retirar esa carpeta y purgar el historial.
- Documentación nueva: `README.md` (portada del repo), `CLAUDE.md` (guía rápida para Claude),
  `branding/README.md` y este `CAMBIOS.md`.

### Para clonar desde la laptop

```bash
git clone https://github.com/Jhonatan2209/PANDERITO.git
cd PANDERITO/Panderito
dotnet workload install maui-android   # si aún no está
dotnet test tests/Panderito.Tests/Panderito.Tests.csproj
```

La carpeta `ACCESOS/` viaja dentro del repo (decisión del usuario, repo privado).
