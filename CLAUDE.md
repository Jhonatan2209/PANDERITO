# PANDERITO — Guía rápida para Claude

App de **finanzas personales** en .NET MAUI (.NET 10, Android) — offline-first, SQLite, español, Perú (S/).
Antes se llamaba **Chanchito**; el 2026-07-10 se renombró a **Panderito** (ver `CAMBIOS.md`).

## Lee esto primero

1. **`INSTRUCCIONES/CLAUDE.md`** — instrucciones maestras del proyecto (reglas de trabajo, stack, fases, spec completa). Es la fuente de verdad.
2. **`Panderito/PROGRESO.md`** — checklist vivo de fases: qué está hecho y qué falta (fases 0–5 completas; faltan 6 pulido y 7 build final).
3. **`Panderito/DECISIONES.md`** — decisiones tomadas ante ambigüedades; agrega aquí cada nueva decisión.
4. **`CAMBIOS.md`** — bitácora de cambios grandes (renombrado, logo, repositorio).
5. **`docs/ARQUITECTURA.md`** — mapa del código: capas, entidades, servicios, viewmodels y receta para agregar pantallas. Léelo antes de tocar código.
6. **`INFORMES/CONTEXTO-PARA-CLAUDE.md`** — estado más reciente del proyecto y de la última sesión; léelo para retomar el trabajo sin repetir nada. Los informes por sesión y el manual de usuario (`MANUAL.docx`) están en `INFORMES/`.
7. **`INSTRUCCIONES/PLAN-FASES-PWA.md`** — plan por fases vigente: primero la PWA funcional y 100 % gratis (Vercel); bot Telegram/WhatsApp e IA vienen después, como mejoras. Todo debe seguir ligero.
8. **`INSTRUCCIONES/MIGRACION-Y-HERRAMIENTAS.md`** — qué herramientas y cuentas se usan, para qué, y el checklist para migrar a otra laptop sin perder nada.
9. **`INSTRUCCIONES/LEVANTAR-PANDERO.txt`** — paso a paso para levantar la PWA (`pwa/`) en localhost, red local o internet.

## Estructura

```
├── Panderito/                  # Solución .NET (Panderito.slnx)
│   ├── src/Panderito.App/      # App MAUI net10.0-android (UI, ViewModels, Resources)
│   ├── src/Panderito.Core/     # Dominio, servicios, SQLite (net10.0, sin dependencia de MAUI)
│   └── tests/Panderito.Tests/  # xUnit (42 pruebas, deben estar siempre en verde)
├── branding/                   # Logo SVG y variaciones (ver branding/README.md)
├── CONTEXTO/                   # Prototipo de diseño "Bolsillo" (referencia visual)
├── INSTRUCCIONES/              # CLAUDE.md maestro
└── ACCESOS/                    # ⚠️ Credenciales personales del usuario — incluida en el repo por decisión suya (repo PRIVADO); no leerla salvo pedido explícito y el repo jamás debe hacerse público sin vaciarla
```

## Datos clave

- **Nombre visible**: Panderito · **ApplicationId**: `pe.panderito.app` · namespaces `Panderito.App` / `Panderito.Core`.
- **Repositorio**: privado, `https://github.com/Jhonatan2209/PANDERITO`, rama `master`. La raíz del repo es esta carpeta.
- **Paleta**: violeta primario `#6D5AE6`, tinta `#4A3FB8`, dorado `#FDB022→#F79009`, verde ingreso `#12B76A`, rojo gasto `#F04438` (definida en `Resources/Styles/Colors.xaml`).
- **Logo**: moneda dorada con letra P rodeada por la ronda de la junta de ahorro (pandero). Fuente editable en `branding/`; el ícono de la app en `Resources/AppIcon/`.

## Comandos habituales

```bash
cd Panderito
dotnet test tests/Panderito.Tests/Panderito.Tests.csproj              # pruebas (rápido)
dotnet build src/Panderito.App/Panderito.App.csproj -f net10.0-android # build de la app
```

## Reglas esenciales (resumen de INSTRUCCIONES/CLAUDE.md)

- Commits pequeños, en español, con prefijos `feat:` / `fix:` / `test:` / `chore:`.
- No avanzar de fase con build o pruebas en rojo.
- Toda decisión ambigua → la opción más simple y estándar, anotada en `DECISIONES.md`.
- Nunca subir secretos de firma (keystore, contraseñas de firma). Excepción decidida por el usuario: `ACCESOS/` sí se versiona porque el repo es privado y solo él tiene acceso; por eso el repo **no debe hacerse público**.
