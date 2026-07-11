// Bot de Telegram de Panderito.
// Flujo: el usuario envía la foto de un yapeo/boleta -> el bot la lee con IA (Claude)
// -> extrae monto, fecha, tipo (gasto/ingreso), etc. -> la registra y confirma.
//
// Requisitos (ver .env.example): TELEGRAM_BOT_TOKEN y ANTHROPIC_API_KEY.
// Ejecutar: npm install && npm start

try { require('dotenv/config'); } catch (e) { /* opcional: usa variables de entorno del sistema */ }

const https = require('https');
const TelegramBot = require('node-telegram-bot-api');
const { extraerRecibo } = require('./extraerRecibo');
const { agregarMovimiento } = require('./almacen');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const PERMITIDOS = (process.env.TELEGRAM_ALLOWED_IDS || '')
  .split(',').map((s) => s.trim()).filter(Boolean);

if (!TOKEN) { console.error('Falta TELEGRAM_BOT_TOKEN (ver .env.example).'); process.exit(1); }
if (!ANTHROPIC_KEY) { console.error('Falta ANTHROPIC_API_KEY (ver .env.example).'); process.exit(1); }

const bot = new TelegramBot(TOKEN, { polling: true });
const fmt = (n) => 'S/ ' + Number(n || 0).toFixed(2);
const autorizado = (id) => PERMITIDOS.length === 0 || PERMITIDOS.includes(String(id));

// Descarga un archivo de Telegram y lo devuelve en base64.
function descargarBase64(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const trozos = [];
      res.on('data', (d) => trozos.push(d));
      res.on('end', () => resolve(Buffer.concat(trozos).toString('base64')));
      res.on('error', reject);
    }).on('error', reject);
  });
}

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id,
    '🐷 *Panderito Bot*\n\nEnvíame la *foto* de un yapeo, boleta o factura y la registro por ti ' +
    '(monto, fecha, si es gasto o ingreso). También puedo leer transferencias y recibos.',
    { parse_mode: 'Markdown' });
});

bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;
  if (!autorizado(msg.from.id)) return bot.sendMessage(chatId, 'No estás autorizado para usar este bot.');

  try {
    await bot.sendChatAction(chatId, 'typing');
    // Telegram manda varias resoluciones; tomamos la más grande.
    const foto = msg.photo[msg.photo.length - 1];
    const enlace = await bot.getFileLink(foto.file_id);
    const base64 = await descargarBase64(enlace);

    const datos = await extraerRecibo(base64, 'image/jpeg');

    if (!datos.esRecibo) {
      return bot.sendMessage(chatId, 'No parece un comprobante de pago 🤔. Envíame la foto de un yapeo, boleta o factura.');
    }

    const registro = agregarMovimiento({
      monto: datos.monto,
      tipo: datos.tipo,
      metodo: datos.metodo,
      contraparte: datos.contraparte,
      categoria: datos.categoriaSugerida || '',
      fecha: datos.fecha || new Date().toISOString().slice(0, 10),
      hora: datos.hora || '',
      notas: datos.notas || '',
      confianza: datos.confianza,
      origen: 'telegram',
    });

    const emoji = datos.tipo === 'Ingreso' ? '📥' : '📤';
    const resumen =
      `${emoji} *${datos.tipo}* registrado\n\n` +
      `*Monto:* ${fmt(datos.monto)}\n` +
      `*Método:* ${datos.metodo || '—'}\n` +
      `*Con:* ${datos.contraparte || '—'}\n` +
      `*Categoría:* ${datos.categoriaSugerida || '—'}\n` +
      `*Fecha:* ${datos.fecha || '—'} ${datos.hora || ''}\n` +
      (datos.confianza < 0.6 ? '\n⚠️ _Lectura poco clara, revisa los datos._' : '') +
      `\n\n_id ${registro.id}_`;

    bot.sendMessage(chatId, resumen, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('Error procesando foto:', err);
    bot.sendMessage(chatId, '😕 No pude leer la imagen. Intenta con una foto más nítida.');
  }
});

console.log('Panderito Bot en marcha. Envía una foto por Telegram para probar.');
