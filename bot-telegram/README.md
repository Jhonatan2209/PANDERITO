# Panderito Bot (Telegram) — lee yapeos/boletas con IA

Bot de Telegram que recibe la **foto de un yapeo, Plin, transferencia, boleta o factura**,
la **lee con IA (Claude, visión)** y **registra el movimiento** (monto, fecha, si es gasto o
ingreso, método, comercio/persona). Prototipo — guarda en un JSON local; luego se conectará al
backend compartido con la app/PWA.

> ⚠️ **Estado: maquetado (scaffold) — listo para continuar.** El código está completo pero aún
> **no se ha ejecutado** (faltan los tokens). No instala nada todavía.

## Qué falta para ponerlo a andar (mañana)

1. **Crear el bot en Telegram** con [@BotFather](https://t.me/BotFather) → copiar el *token*.
2. **Tener una `ANTHROPIC_API_KEY`** (console.anthropic.com). ⚠️ El uso de la API tiene costo.
3. En esta carpeta:
   ```bash
   cd bot-telegram
   cp .env.example .env      # y completar TELEGRAM_BOT_TOKEN y ANTHROPIC_API_KEY
   npm install
   npm start
   ```
4. En Telegram, abrir el bot, mandar `/start` y luego **enviar la foto** de un yapeo.

## Cómo funciona

```
Foto (Telegram)  ─►  bot descarga la imagen  ─►  Claude (visión) extrae JSON
                                                   { tipo, monto, fecha, hora,
                                                     contraparte, metodo, ... }
                                                        │
                                                        ▼
                                          se guarda el movimiento + se confirma
```

- `src/index.js` — el bot (long-polling): recibe la foto, la manda a leer y confirma.
- `src/extraerRecibo.js` — llama a Claude (`claude-opus-4-8`, visión + salida estructurada)
  y devuelve los datos del comprobante en JSON validado por esquema.
- `src/almacen.js` — guarda los movimientos en `data/movimientos.json` (prototipo).

## Roadmap (siguiente sesión)

- [ ] Ejecutar de punta a punta con tokens reales y una foto de yapeo.
- [ ] Botones de confirmación (✅ registrar / ✏️ corregir / ❌ descartar) antes de guardar.
- [ ] Elegir la **cuenta/método** (Efectivo, Yape, Plin, Banco) y **categoría** desde el chat.
- [ ] Conectar a un **backend en la nube** (Supabase/Firebase) para que app, PWA y bot compartan
      los mismos datos (hoy el bot guarda aparte, en JSON local).
- [ ] Evaluar la **captura automática de Yape** (leer notificaciones) — eso va en la **app Android
      nativa**, no en el bot ni en la web.

## Seguridad

- No subas `.env` (ya está en `.gitignore`). El token del bot y la API key son secretos.
- `TELEGRAM_ALLOWED_IDS` (opcional) restringe quién puede usar el bot.
- Leer imágenes con la API **genera costos**; tenlo presente (regla de oro del proyecto).
