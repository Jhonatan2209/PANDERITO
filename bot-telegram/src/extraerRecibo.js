// Lee una imagen de yapeo / boleta / factura con Claude (visión) y extrae los
// datos del movimiento en JSON estructurado. Usa el SDK oficial de Anthropic.
//
// Modelo: claude-opus-4-8 (visión + salida estructurada).
// La clave se toma de la variable de entorno ANTHROPIC_API_KEY.

const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic(); // lee ANTHROPIC_API_KEY del entorno

// Esquema de salida — Claude devuelve exactamente esta forma.
const ESQUEMA = {
  type: 'object',
  properties: {
    esRecibo: { type: 'boolean', description: 'true si la imagen es un yapeo, boleta, factura o comprobante de pago' },
    tipo: { type: 'string', enum: ['Gasto', 'Ingreso'], description: 'Gasto si el usuario pagó/envió dinero; Ingreso si recibió dinero' },
    monto: { type: 'number', description: 'Monto en números, sin símbolo de moneda' },
    moneda: { type: 'string', description: 'Código o símbolo de la moneda (ej. PEN, S/)' },
    fecha: { type: 'string', description: 'Fecha del comprobante en formato YYYY-MM-DD si es legible; si no, cadena vacía' },
    hora: { type: 'string', description: 'Hora del comprobante (HH:MM) si es legible; si no, cadena vacía' },
    contraparte: { type: 'string', description: 'Nombre del comercio o persona (a quién se pagó o de quién se recibió)' },
    metodo: { type: 'string', description: 'Método/canal: Yape, Plin, Transferencia, Efectivo, Tarjeta, etc.' },
    categoriaSugerida: { type: 'string', description: 'Categoría sugerida (ej. Comida, Transporte, Servicios, Sueldo)' },
    notas: { type: 'string', description: 'Cualquier detalle relevante (número de operación, glosa)' },
    confianza: { type: 'number', description: 'Confianza de 0 a 1 en que la lectura es correcta' },
  },
  required: ['esRecibo', 'tipo', 'monto', 'moneda', 'fecha', 'contraparte', 'metodo', 'confianza'],
  additionalProperties: false,
};

const INSTRUCCION = `Eres un asistente de finanzas personales en Perú. Te envían la foto de un
comprobante (un yapeo, un Plin, una transferencia, una boleta o una factura). Extrae los datos
del movimiento y decide si para el DUEÑO de la app es un Gasto (pagó/envió dinero) o un Ingreso
(recibió dinero). Los montos suelen estar en soles (S/ = PEN). Si un dato no se ve con claridad,
déjalo vacío en vez de inventarlo, y baja la confianza. Si la imagen NO es un comprobante de pago,
pon esRecibo=false y el resto en valores neutros.`;

/**
 * @param {string} base64  Imagen codificada en base64 (sin el prefijo data:).
 * @param {string} mediaType  ej. 'image/jpeg' o 'image/png'.
 * @returns {Promise<object>} Datos extraídos según ESQUEMA.
 */
async function extraerRecibo(base64, mediaType) {
  const respuesta = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 1024,
    output_config: { format: { type: 'json_schema', schema: ESQUEMA } },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: INSTRUCCION },
        ],
      },
    ],
  });

  const bloque = respuesta.content.find((b) => b.type === 'text');
  return JSON.parse(bloque ? bloque.text : '{}');
}

module.exports = { extraerRecibo, ESQUEMA };
