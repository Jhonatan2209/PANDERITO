<p align="center">
  <img src="branding/panderito-icon.svg" alt="Logo de Panderito" width="140"/>
</p>

<h1 align="center">PANDERITO</h1>

<p align="center"><b>Tus finanzas, tu junta.</b><br/>
App de finanzas personales con soporte de panderos (juntas de ahorro), hecha con .NET MAUI para Android.</p>

---

## ¿Qué es Panderito?

Una app para llevar el control del dinero del día a día: ingresos, gastos, cuentas, préstamos,
metas de ahorro, presupuestos, movimientos recurrentes, reportes y —lo que le da el nombre—
**panderos** (juntas de ahorro rotativo).

## Estructura del repositorio

```
├── Panderito/            # Solución .NET MAUI
│   ├── src/
│   │   ├── Panderito.App/    # App MAUI (UI, vistas, viewmodels)
│   │   └── Panderito.Core/   # Dominio, servicios y datos (SQLite)
│   └── tests/
│       └── Panderito.Tests/  # Pruebas unitarias
├── branding/             # Logo y variaciones (SVG)
├── CONTEXTO/             # Contexto y diseño de referencia
└── INSTRUCCIONES/        # Guía de desarrollo (CLAUDE.md)
```

## Requisitos

- .NET 10 SDK con el workload de MAUI (`dotnet workload install maui-android`)
- Android SDK (API 21+)

## Cómo compilar

```bash
cd Panderito
dotnet build src/Panderito.App/Panderito.App.csproj -f net10.0-android
```

Para ejecutar las pruebas:

```bash
dotnet test tests/Panderito.Tests/Panderito.Tests.csproj
```

## Identidad visual

El logo y sus variaciones están en [`branding/`](branding/README.md): una moneda dorada con la letra P
rodeada por la ronda de la junta de ahorro.

| Claro | Oscuro |
|---|---|
| ![Logo horizontal](branding/panderito-logo-horizontal.svg) | ![Logo horizontal oscuro](branding/panderito-logo-horizontal-oscuro.svg) |
