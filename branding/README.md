# Branding de PANDERITO

Identidad visual de la app. El concepto del logo: una **moneda dorada con la letra P** rodeada por una
**ronda de puntos** que representa a los miembros de la junta/pandero de ahorro. El punto dorado en la
parte superior es el miembro que recibe el pozo en el turno actual.

## Paleta

| Color | Hex | Uso |
|---|---|---|
| Violeta primario | `#6D5AE6` | Fondo del ícono, marca |
| Violeta tinta | `#4A3FB8` | Texto del logo en fondos claros |
| Dorado | `#FDB022` → `#F79009` | Moneda central, acentos |
| Blanco | `#FFFFFF` | Letra P y puntos de la ronda |

## Archivos

| Archivo | Uso |
|---|---|
| `panderito-icon.svg` | Ícono principal a color (redes, tiendas, avatares) |
| `panderito-icon-mono-blanco.svg` | Versión monocromática blanca, para fondos oscuros o de color |
| `panderito-icon-mono-violeta.svg` | Versión monocromática violeta, para fondos claros |
| `panderito-logo-horizontal.svg` | Logo con nombre y eslogan, fondos claros (README, web) |
| `panderito-logo-horizontal-oscuro.svg` | Logo con nombre y eslogan, fondos oscuros |
| `panderito-logo-vertical.svg` | Logo apilado (splash, presentaciones) |

## Ícono de la app (Android)

El ícono adaptativo y el splash de la app viven en el proyecto MAUI y se generan en cada build:

- `Panderito/src/Panderito.App/Resources/AppIcon/appicon.svg` — fondo violeta
- `Panderito/src/Panderito.App/Resources/AppIcon/appiconfg.svg` — glifo (moneda + ronda)
- `Panderito/src/Panderito.App/Resources/Splash/splash.svg` — pantalla de carga
