/* ============================================================
   Panderito PWA — capa de datos (offline, en el dispositivo)
   Replica el dominio de Panderito.Core: Movimiento, Categoria, Cuenta.
   Persistencia con localStorage (JSON). Sin servidor, sin internet.
   ============================================================ */

const Datos = (() => {
  const CLAVE = 'panderito.datos.v1';

  // Semilla equivalente a SembradorDatos.cs
  const CATEGORIAS_SEMILLA = [
    { nombre: 'Menú/Comida',       tipo: 'Gasto',   icono: '🍽️', color: '#F97316' },
    { nombre: 'Transporte',        tipo: 'Gasto',   icono: '🚌', color: '#3B82F6' },
    { nombre: 'Mercado',           tipo: 'Gasto',   icono: '🛒', color: '#10B981' },
    { nombre: 'Servicios',         tipo: 'Gasto',   icono: '💡', color: '#EAB308' },
    { nombre: 'Salud',             tipo: 'Gasto',   icono: '💊', color: '#EF4444' },
    { nombre: 'Entretenimiento',   tipo: 'Gasto',   icono: '🎬', color: '#8B5CF6' },
    { nombre: 'Otros',             tipo: 'Gasto',   icono: '📦', color: '#6B7280' },
    { nombre: 'Sueldo',            tipo: 'Ingreso', icono: '💼', color: '#22C55E' },
    { nombre: 'Venta',             tipo: 'Ingreso', icono: '🏷️', color: '#14B8A6' },
    { nombre: 'Préstamo recibido', tipo: 'Ingreso', icono: '🤝', color: '#F59E0B' },
    { nombre: 'Otros ingresos',    tipo: 'Ingreso', icono: '💰', color: '#84CC16' },
  ];

  let estado = null;

  function cargar() {
    if (estado) return estado;
    try {
      const bruto = localStorage.getItem(CLAVE);
      if (bruto) { estado = JSON.parse(bruto); }
    } catch (e) { estado = null; }

    if (!estado || !estado.categorias) {
      estado = {
        proximoId: 1,
        categorias: CATEGORIAS_SEMILLA.map((c) => ({ id: nuevoIdLocal(), ...c })),
        cuentas: [
          { id: 900001, nombre: 'Efectivo', tipo: 'Efectivo', saldoInicial: 0, icono: '💵', color: '#22C55E', activa: true },
        ],
        movimientos: [],
      };
      // reindexar ids de semilla de forma estable
      let n = 1;
      estado.categorias.forEach((c) => (c.id = n++));
      estado.cuentas.forEach((c) => (c.id = n++));
      estado.proximoId = n;
      guardar();
    }
    if (typeof estado.proximoId !== 'number') estado.proximoId = 1000;
    return estado;
  }

  function nuevoIdLocal() { return Math.floor(Math.random() * 1e9); }
  function nuevoId() { const e = cargar(); return e.proximoId++; }

  function guardar() {
    localStorage.setItem(CLAVE, JSON.stringify(estado));
  }

  // ---------- Categorías ----------
  function categorias(tipo) {
    const e = cargar();
    return tipo ? e.categorias.filter((c) => c.tipo === tipo) : e.categorias.slice();
  }
  function categoria(id) { return cargar().categorias.find((c) => c.id === id); }
  function guardarCategoria(cat) {
    const e = cargar();
    if (cat.id) {
      const i = e.categorias.findIndex((c) => c.id === cat.id);
      if (i >= 0) e.categorias[i] = { ...e.categorias[i], ...cat };
    } else {
      cat.id = nuevoId(); e.categorias.push(cat);
    }
    guardar(); return cat;
  }
  function categoriaTieneMovimientos(id) { return cargar().movimientos.some((m) => m.categoriaId === id); }
  function eliminarCategoria(id) {
    const e = cargar();
    if (categoriaTieneMovimientos(id)) return false;
    e.categorias = e.categorias.filter((c) => c.id !== id); guardar(); return true;
  }

  // ---------- Cuentas ----------
  function cuentas(soloActivas) {
    const e = cargar();
    return soloActivas ? e.cuentas.filter((c) => c.activa) : e.cuentas.slice();
  }
  function cuenta(id) { return cargar().cuentas.find((c) => c.id === id); }
  function guardarCuenta(cta) {
    const e = cargar();
    if (cta.id) {
      const i = e.cuentas.findIndex((c) => c.id === cta.id);
      if (i >= 0) e.cuentas[i] = { ...e.cuentas[i], ...cta };
    } else {
      cta.id = nuevoId(); if (cta.activa === undefined) cta.activa = true; e.cuentas.push(cta);
    }
    guardar(); return cta;
  }
  function cuentaTieneMovimientos(id) { return cargar().movimientos.some((m) => m.cuentaId === id); }
  function eliminarCuenta(id) {
    const e = cargar();
    if (cuentaTieneMovimientos(id)) return false;
    e.cuentas = e.cuentas.filter((c) => c.id !== id); guardar(); return true;
  }
  function saldoCuenta(id) {
    const e = cargar();
    const cta = cuenta(id); if (!cta) return 0;
    let s = Number(cta.saldoInicial) || 0;
    for (const m of e.movimientos) {
      if (m.cuentaId !== id) continue;
      s += m.tipo === 'Ingreso' ? Number(m.monto) : -Number(m.monto);
    }
    return s;
  }
  function saldoTotal() { return cuentas(true).reduce((a, c) => a + saldoCuenta(c.id), 0); }

  // ---------- Movimientos ----------
  function movimientos() {
    return cargar().movimientos.slice().sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }
  function movimiento(id) { return cargar().movimientos.find((m) => m.id === id); }
  function guardarMovimiento(mov) {
    const e = cargar();
    if (mov.id) {
      const i = e.movimientos.findIndex((m) => m.id === mov.id);
      if (i >= 0) e.movimientos[i] = { ...e.movimientos[i], ...mov };
    } else {
      mov.id = nuevoId();
      if (!mov.fecha) mov.fecha = new Date().toISOString();
      e.movimientos.push(mov);
    }
    guardar(); return mov;
  }
  function eliminarMovimiento(id) {
    const e = cargar();
    e.movimientos = e.movimientos.filter((m) => m.id !== id); guardar();
  }

  // ---------- Resúmenes ----------
  function mismoMes(fechaIso, ref) {
    const f = new Date(fechaIso);
    return f.getFullYear() === ref.getFullYear() && f.getMonth() === ref.getMonth();
  }
  function resumenMes(ref = new Date()) {
    const e = cargar();
    let ingresos = 0, gastos = 0;
    for (const m of e.movimientos) {
      if (!mismoMes(m.fecha, ref)) continue;
      if (m.tipo === 'Ingreso') ingresos += Number(m.monto);
      else gastos += Number(m.monto);
    }
    return { ingresos, gastos, balance: ingresos - gastos };
  }
  function gastoPorCategoria(ref = new Date()) {
    const e = cargar();
    const mapa = new Map();
    for (const m of e.movimientos) {
      if (m.tipo !== 'Gasto' || !mismoMes(m.fecha, ref)) continue;
      mapa.set(m.categoriaId, (mapa.get(m.categoriaId) || 0) + Number(m.monto));
    }
    const total = [...mapa.values()].reduce((a, b) => a + b, 0);
    return [...mapa.entries()]
      .map(([catId, monto]) => ({ categoria: categoria(catId), monto, pct: total ? monto / total * 100 : 0 }))
      .filter((x) => x.categoria)
      .sort((a, b) => b.monto - a.monto);
  }
  function serieMeses(n = 6) {
    const salida = [];
    const hoy = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const ref = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const r = resumenMes(ref);
      salida.push({ ref, etiqueta: ref.toLocaleDateString('es-PE', { month: 'short' }), gastos: r.gastos, ingresos: r.ingresos });
    }
    return salida;
  }

  // ---------- Utilidades de datos ----------
  function exportar() { return JSON.stringify(cargar(), null, 2); }
  function reiniciar() { localStorage.removeItem(CLAVE); estado = null; cargar(); }

  return {
    cargar, guardar,
    categorias, categoria, guardarCategoria, eliminarCategoria, categoriaTieneMovimientos,
    cuentas, cuenta, guardarCuenta, eliminarCuenta, cuentaTieneMovimientos, saldoCuenta, saldoTotal,
    movimientos, movimiento, guardarMovimiento, eliminarMovimiento,
    resumenMes, gastoPorCategoria, serieMeses,
    exportar, reiniciar,
  };
})();

// ---------- Formato de moneda (S/ Perú), equivalente a FormatoMoneda.cs ----------
const Moneda = {
  fmt(n) {
    const v = Number(n) || 0;
    return 'S/ ' + v.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },
  conSigno(n, tipo) {
    const s = tipo === 'Ingreso' ? '+' : '-';
    return s + ' ' + this.fmt(Math.abs(Number(n) || 0));
  },
};
