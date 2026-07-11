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
    // Colecciones agregadas en versiones posteriores (no perder datos previos)
    for (const col of ['prestamos', 'abonos', 'panderos', 'turnos', 'metas', 'recurrentes', 'presupuestos']) {
      if (!Array.isArray(estado[col])) estado[col] = [];
    }
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

  // ---------- Helpers de fechas / frecuencia ----------
  function addDias(fecha, n) { const d = new Date(fecha); d.setDate(d.getDate() + n); return d; }
  function addMeses(fecha, n) { const d = new Date(fecha); d.setMonth(d.getMonth() + n); return d; }
  function siguienteFecha(fechaIso, frecuencia) {
    const d = new Date(fechaIso);
    if (frecuencia === 'Semanal') return addDias(d, 7).toISOString();
    if (frecuencia === 'Quincenal') return addDias(d, 15).toISOString();
    return addMeses(d, 1).toISOString();
  }
  function fechaDelTurno(fechaInicioIso, frecuencia, indice) {
    const d = new Date(fechaInicioIso);
    if (frecuencia === 'Semanal') return addDias(d, 7 * indice).toISOString();
    if (frecuencia === 'Quincenal') return addDias(d, 15 * indice).toISOString();
    return addMeses(d, indice).toISOString();
  }

  // ---------- Préstamos ----------
  function prestamos() { return cargar().prestamos.slice().sort((a, b) => new Date(b.fecha) - new Date(a.fecha)); }
  function prestamo(id) { return cargar().prestamos.find((p) => p.id === id); }
  function guardarPrestamo(p) {
    const e = cargar();
    if (p.id) { const i = e.prestamos.findIndex((x) => x.id === p.id); if (i >= 0) e.prestamos[i] = { ...e.prestamos[i], ...p }; }
    else { p.id = nuevoId(); if (!p.fecha) p.fecha = new Date().toISOString(); if (!p.estado) p.estado = 'Pendiente'; e.prestamos.push(p); }
    guardar(); return p;
  }
  function eliminarPrestamo(id) { const e = cargar(); e.prestamos = e.prestamos.filter((p) => p.id !== id); e.abonos = e.abonos.filter((a) => a.prestamoId !== id); guardar(); }
  function abonosDe(prestamoId) { return cargar().abonos.filter((a) => a.prestamoId === prestamoId).sort((a, b) => new Date(b.fecha) - new Date(a.fecha)); }
  function totalAbonado(prestamoId) { return cargar().abonos.filter((a) => a.prestamoId === prestamoId).reduce((s, a) => s + Number(a.monto), 0); }
  function saldoPendiente(p) { return Number(p.monto) - totalAbonado(p.id); }
  function calcularEstadoPrestamo(monto, total) { if (total <= 0) return 'Pendiente'; if (total >= monto) return 'Pagado'; return 'Parcial'; }
  function registrarAbono(prestamoId, monto, fecha) {
    const e = cargar(); const p = prestamo(prestamoId); if (!p) return;
    e.abonos.push({ id: nuevoId(), prestamoId, monto: Number(monto), fecha: fecha || new Date().toISOString() });
    p.estado = calcularEstadoPrestamo(Number(p.monto), totalAbonado(prestamoId));
    guardar(); return p;
  }
  function marcarPagadoPrestamo(prestamoId) {
    const p = prestamo(prestamoId); if (!p) return;
    const pend = saldoPendiente(p);
    if (pend > 0) return registrarAbono(prestamoId, pend);
    p.estado = 'Pagado'; guardar(); return p;
  }
  function totalPendientePorTipo(tipo) {
    return prestamos().filter((p) => p.tipo === tipo && p.estado !== 'Pagado').reduce((s, p) => s + saldoPendiente(p), 0);
  }

  // ---------- Panderos ----------
  function panderos() { return cargar().panderos.slice(); }
  function pandero(id) { return cargar().panderos.find((p) => p.id === id); }
  function generarTurnos(p) {
    const turnos = [];
    for (let i = 0; i < p.numParticipantes; i++) {
      const numero = i + 1;
      turnos.push({ id: nuevoId(), panderoId: p.id, numeroTurno: numero,
        nombreParticipante: numero === p.miTurno ? 'Yo' : `Participante ${numero}`,
        fechaCobro: fechaDelTurno(p.fechaInicio, p.frecuencia, i), cobrado: false });
    }
    return turnos;
  }
  function crearPanderoConTurnos(p) {
    const e = cargar(); p.id = nuevoId(); if (p.activo === undefined) p.activo = true;
    if (!p.fechaInicio) p.fechaInicio = new Date().toISOString();
    e.panderos.push(p); e.turnos.push(...generarTurnos(p)); guardar(); return p;
  }
  function turnosDe(panderoId) { return cargar().turnos.filter((t) => t.panderoId === panderoId).sort((a, b) => a.numeroTurno - b.numeroTurno); }
  function marcarCobrado(turnoId, cobrado) { const e = cargar(); const t = e.turnos.find((x) => x.id === turnoId); if (t) { t.cobrado = cobrado; guardar(); } }
  function eliminarPandero(id) { const e = cargar(); e.panderos = e.panderos.filter((p) => p.id !== id); e.turnos = e.turnos.filter((t) => t.panderoId !== id); guardar(); }
  function resumenPandero(p) {
    const lista = turnosDe(p.id);
    const cobrados = lista.filter((t) => t.cobrado).length;
    const miTurno = lista.find((t) => t.numeroTurno === p.miTurno);
    return {
      aportado: Number(p.cuotaMonto) * cobrados,
      cuotasPagadas: cobrados,
      montoARecibir: Number(p.cuotaMonto) * p.numParticipantes,
      fechaMiTurno: miTurno ? miTurno.fechaCobro : null,
      turnosCobrados: cobrados,
      totalTurnos: lista.length,
    };
  }

  // ---------- Metas de ahorro ----------
  function metas() { return cargar().metas.slice(); }
  function meta(id) { return cargar().metas.find((m) => m.id === id); }
  function guardarMeta(m) {
    const e = cargar();
    if (m.id) { const i = e.metas.findIndex((x) => x.id === m.id); if (i >= 0) e.metas[i] = { ...e.metas[i], ...m }; }
    else { m.id = nuevoId(); if (m.montoActual === undefined) m.montoActual = 0; e.metas.push(m); }
    guardar(); return m;
  }
  function abonarMeta(id, monto) { const m = meta(id); if (!m) return; m.montoActual = Number(m.montoActual) + Number(monto); guardar(); return m; }
  function eliminarMeta(id) { const e = cargar(); e.metas = e.metas.filter((m) => m.id !== id); guardar(); }

  // ---------- Gastos recurrentes ----------
  function recurrentes() { return cargar().recurrentes.filter((r) => r.activo !== false).sort((a, b) => new Date(a.proximaFecha) - new Date(b.proximaFecha)); }
  function recurrente(id) { return cargar().recurrentes.find((r) => r.id === id); }
  function guardarRecurrente(r) {
    const e = cargar();
    if (r.id) { const i = e.recurrentes.findIndex((x) => x.id === r.id); if (i >= 0) e.recurrentes[i] = { ...e.recurrentes[i], ...r }; }
    else { r.id = nuevoId(); if (r.activo === undefined) r.activo = true; if (!r.proximaFecha) r.proximaFecha = new Date().toISOString(); e.recurrentes.push(r); }
    guardar(); return r;
  }
  function eliminarRecurrente(id) { const e = cargar(); e.recurrentes = e.recurrentes.filter((r) => r.id !== id); guardar(); }
  function registrarPagoRecurrente(id, fecha) {
    const r = recurrente(id); if (!r) return;
    guardarMovimiento({ monto: Number(r.monto), tipo: 'Gasto', categoriaId: r.categoriaId, cuentaId: r.cuentaId, fecha: fecha || new Date().toISOString(), nota: r.nombre });
    r.proximaFecha = siguienteFecha(r.proximaFecha, r.frecuencia); guardar(); return r;
  }

  // ---------- Presupuestos ----------
  function presupuestos() { return cargar().presupuestos.slice(); }
  function presupuesto(id) { return cargar().presupuestos.find((p) => p.id === id); }
  function presupuestoDeCategoria(categoriaId) { return cargar().presupuestos.find((p) => p.categoriaId === categoriaId); }
  function guardarPresupuesto(p) {
    const e = cargar();
    // Un presupuesto por categoría: si ya existe, se actualiza
    const existente = e.presupuestos.find((x) => x.categoriaId === p.categoriaId && x.id !== p.id);
    if (existente) { existente.montoLimite = Number(p.montoLimite); existente.periodo = p.periodo; guardar(); return existente; }
    if (p.id) { const i = e.presupuestos.findIndex((x) => x.id === p.id); if (i >= 0) e.presupuestos[i] = { ...e.presupuestos[i], ...p }; }
    else { p.id = nuevoId(); if (!p.periodo) p.periodo = 'Mensual'; e.presupuestos.push(p); }
    guardar(); return p;
  }
  function eliminarPresupuesto(id) { const e = cargar(); e.presupuestos = e.presupuestos.filter((p) => p.id !== id); guardar(); }
  function rangoDelPeriodo(periodo, fecha = new Date()) {
    const f = new Date(fecha);
    if (periodo === 'Semanal') {
      const diasDesdeLunes = ((f.getDay() + 6) % 7);
      const lunes = addDias(new Date(f.getFullYear(), f.getMonth(), f.getDate()), -diasDesdeLunes);
      return { desde: lunes, hasta: addDias(lunes, 7) };
    }
    if (periodo === 'Quincenal') {
      const inicioMes = new Date(f.getFullYear(), f.getMonth(), 1);
      return f.getDate() <= 15
        ? { desde: inicioMes, hasta: addDias(inicioMes, 15) }
        : { desde: addDias(inicioMes, 15), hasta: addMeses(inicioMes, 1) };
    }
    const primerDia = new Date(f.getFullYear(), f.getMonth(), 1);
    return { desde: primerDia, hasta: addMeses(primerDia, 1) };
  }
  function avancePresupuesto(p, fechaRef = new Date()) {
    const { desde, hasta } = rangoDelPeriodo(p.periodo, fechaRef);
    const gastado = cargar().movimientos
      .filter((m) => m.tipo === 'Gasto' && m.categoriaId === p.categoriaId && new Date(m.fecha) >= desde && new Date(m.fecha) < hasta)
      .reduce((s, m) => s + Number(m.monto), 0);
    const limite = Number(p.montoLimite);
    const pct = limite <= 0 ? 0 : gastado / limite * 100;
    const nivel = pct >= 100 ? 'Excedido' : pct >= 80 ? 'Alerta' : 'Normal';
    return { gastado, limite, pct, nivel };
  }

  // ---------- Utilidades de datos ----------
  function exportar() { return JSON.stringify(cargar(), null, 2); }
  function reiniciar() { localStorage.removeItem(CLAVE); estado = null; cargar(); }

  return {
    cargar, guardar, siguienteFecha, fechaDelTurno,
    categorias, categoria, guardarCategoria, eliminarCategoria, categoriaTieneMovimientos,
    cuentas, cuenta, guardarCuenta, eliminarCuenta, cuentaTieneMovimientos, saldoCuenta, saldoTotal,
    movimientos, movimiento, guardarMovimiento, eliminarMovimiento,
    resumenMes, gastoPorCategoria, serieMeses,
    // Préstamos
    prestamos, prestamo, guardarPrestamo, eliminarPrestamo, abonosDe, totalAbonado,
    saldoPendiente, registrarAbono, marcarPagadoPrestamo, totalPendientePorTipo,
    // Panderos
    panderos, pandero, crearPanderoConTurnos, turnosDe, marcarCobrado, eliminarPandero, resumenPandero,
    // Metas
    metas, meta, guardarMeta, abonarMeta, eliminarMeta,
    // Recurrentes
    recurrentes, recurrente, guardarRecurrente, eliminarRecurrente, registrarPagoRecurrente,
    // Presupuestos
    presupuestos, presupuesto, presupuestoDeCategoria, guardarPresupuesto, eliminarPresupuesto, avancePresupuesto,
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
