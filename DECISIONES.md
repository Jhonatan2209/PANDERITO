# DECISIONES — Chanchito

Registro de decisiones tomadas ante ambigüedades (siempre la opción más simple y estándar).

1. **Microsoft.Maui.Controls fijado a 10.0.60** (en vez de `$(MauiVersion)` = 10.0.20 del workload): CommunityToolkit.Maui 14.2.0 exige Controls ≥ 10.0.60 y generaba NU1605; MAUI se distribuye por NuGet así que referenciar la versión directa es lo estándar.
2. **Advertencia NU1903 (SQLitePCLRaw.lib.e_sqlite3 2.1.11, GHSA-2m69-gcr7-jv3q)**: es la última versión publicada del bundle_green; la vulnerabilidad es del binario nativo de SQLite y no tiene fix publicado en NuGet aún. Se acepta y se documenta; app es local y de un solo usuario (riesgo bajo).
3. **Diseño de referencia**: se usa el prototipo "Bolsillo" de Claude Design (extraído en `../CONTEXTO/diseno_chanchito/`) como guía visual: paleta violeta (#6C5CE7 aprox.), verde = ingreso, rojo/coral = gasto, tarjetas redondeadas, saludo + mes en el dashboard.
4. **El nombre visible de la app es "Chanchito"** (el prototipo se llamaba "Bolsillo"); ApplicationId `pe.chanchito.app`.
