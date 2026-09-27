// Almacén local de prototipo: guarda los movimientos en un archivo JSON.
// (Más adelante se reemplazará por el backend compartido con la app/PWA.)

const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'data');
const ARCHIVO = path.join(DIR, 'movimientos.json');

function cargar() {
  try {
    return JSON.parse(fs.readFileSync(ARCHIVO, 'utf8'));
  } catch (e) {
    return [];
  }
}

function guardar(lista) {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(ARCHIVO, JSON.stringify(lista, null, 2), 'utf8');
}

/** Agrega un movimiento y devuelve el registro guardado (con id y fecha de registro). */
function agregarMovimiento(mov) {
  const lista = cargar();
  const registro = { id: Date.now(), registradoEn: new Date().toISOString(), ...mov };
  lista.push(registro);
  guardar(lista);
  return registro;
}

module.exports = { cargar, agregarMovimiento, ARCHIVO };
