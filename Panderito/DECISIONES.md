# DECISIONES — Panderito

Registro de decisiones tomadas ante ambigüedades (siempre la opción más simple y estándar).

1. **Microsoft.Maui.Controls fijado a 10.0.60** (en vez de `$(MauiVersion)` = 10.0.20 del workload): CommunityToolkit.Maui 14.2.0 exige Controls ≥ 10.0.60 y generaba NU1605; MAUI se distribuye por NuGet así que referenciar la versión directa es lo estándar.
2. **Advertencia NU1903 (SQLitePCLRaw.lib.e_sqlite3 2.1.11, GHSA-2m69-gcr7-jv3q)**: es la última versión publicada del bundle_green; la vulnerabilidad es del binario nativo de SQLite y no tiene fix publicado en NuGet aún. Se acepta y se documenta; app es local y de un solo usuario (riesgo bajo).
3. **Diseño de referencia**: se usa el prototipo "Bolsillo" de Claude Design (extraído en `../CONTEXTO/diseno_panderito/`) como guía visual: paleta violeta (#6C5CE7 aprox.), verde = ingreso, rojo/coral = gasto, tarjetas redondeadas, saludo + mes en el dashboard.
4. **El nombre visible de la app es "Panderito"** (el prototipo se llamaba "Bolsillo"); ApplicationId `pe.panderito.app`.
5. **Transferencias fuera del MVP**: el enum `TipoMovimiento.Transferencia` existe (para futuro), pero el modelo `Movimiento` de la spec no tiene cuenta destino, así que el registro rápido solo ofrece Gasto/Ingreso y las transferencias no afectan saldos.
6. **ViewModels concretos se implementan junto a sus pantallas** (fases 4–5) para validarlos con la UI real; en Fase 2 queda `BaseViewModel` y toda la lógica de negocio en servicios testeados.
7. **Períodos de presupuesto**: Semanal = lunes a domingo; Quincenal = día 1–15 y 16–fin de mes; Mensual = mes calendario.
8. **Pandero**: "aportado" = cuota × turnos ya cobrados (marcados); "a recibir" = cuota × número de participantes. Fechas de turnos: +7 días (semanal), +15 días (quincenal), +1 mes (mensual) desde la fecha de inicio.
9. **Renombrado a "Panderito" (2026-07-10)**: por pedido del usuario la app pasó de Chanchito a Panderito en todo el código (proyectos, namespaces, `ApplicationId` = `pe.panderito.app`). Al cambiar el ApplicationId, Android la trata como app nueva: hay que desinstalar el APK viejo. Detalle completo en `../CAMBIOS.md`.
10. **Logo (2026-07-10)**: moneda dorada con letra P rodeada por la ronda de la junta (puntos = miembros; el dorado superior = quien recibe el pozo). Se eligió aludir al pandero —módulo distintivo de la app y origen del nombre— en vez de un chanchito/alcancía. Fuentes SVG en `../branding/`; ícono adaptativo y splash en `Resources/AppIcon/` y `Resources/Splash/`.
11. **Raíz del repositorio movida (2026-07-10)**: el repo git ahora abarca toda la carpeta del proyecto (no solo `Panderito/`) para versionar también `CONTEXTO/`, `INSTRUCCIONES/` y `branding/`. `ACCESOS/` (credenciales reales) se excluye vía `.gitignore`. Remoto privado: `https://github.com/Jhonatan2209/PANDERITO`.
