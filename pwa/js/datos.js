/* ============================================================
   Panderito PWA — capa de datos (offline, en el dispositivo)
   Replica el dominio de Panderito.Core: Movimiento, Categoria, Cuenta.
   Persistencia con localStorage (JSON). Sin servidor, sin internet.

   CÓMO FUNCIONA:
   - Todo el estado de la app vive en UN solo objeto JSON guardado
     bajo la clave 'panderito.datos.v1' de localStorage.
   - Forma del estado: { proximoId, categorias[], cuentas[],
     movimientos[], prestamos[], abonos[], panderos[], turnos[],
     metas[], recurrentes[], presupuestos[] }.
   - Cada colección usa ids numéricos autoincrementales (proximoId).
   - Este módulo expone el objeto global `Datos` (patrón IIFE/módulo):
     app.js SOLO habla con los datos a través de estas funciones,
     nunca toca localStorage directamente.
   - `Moneda` (al final) formatea montos en soles peruanos (S/).

   INSTRUCCIONES:
   - Para agregar una colección nueva: inclúyela en el bucle de
     migración de cargar(), crea sus funciones CRUD y expórtalas
     en el return del final.
   - Cualquier cambio de datos debe terminar llamando a guardar().
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

  // Tipos de cuenta / método de pago (enum TipoCuenta) con ícono y color sugeridos
  const TIPOS_CUENTA = [
    { id: 'Efectivo', etq: 'Efectivo', icono: '💵', color: '#22C55E' },
    { id: 'Yape', etq: 'Yape', icono: '💜', color: '#742D8B' },
    { id: 'Plin', etq: 'Plin', icono: '💙', color: '#0EA5B7' },
    { id: 'Banco', etq: 'Cuenta bancaria / transferencia', icono: '🏦', color: '#1E40AF' },
    { id: 'Tarjeta', etq: 'Tarjeta', icono: '💳', color: '#6D5AE6' },
  ];

  // Estado en memoria (caché). Se llena una sola vez desde localStorage
  // en cargar(); después todas las funciones trabajan sobre este objeto.
  let estado = null;

  // cargar(): lee el JSON de localStorage (o crea los datos semilla la
  // primera vez) y aplica "migraciones": agrega colecciones y la
  // categoría "Pandero" si vienen de una versión anterior, sin perder nada.
  function cargar() {
    if (estado) return estado;
    let bruto = null;
    try {
      bruto = localStorage.getItem(CLAVE);
      if (bruto) { estado = JSON.parse(bruto); }
    } catch (e) { estado = null; }

    if (!estado || !Array.isArray(estado.categorias)) {
      // Si había algo guardado pero está corrupto, NO lo pisamos: se conserva
      // una copia en otra clave para poder rescatarlo (Ajustes → Restaurar).
      if (bruto) { try { localStorage.setItem(CLAVE + '.corrupto', bruto); } catch (e) { /* sin espacio */ } }
      estado = {
        proximoId: 1,
        categorias: CATEGORIAS_SEMILLA.map((c) => ({ id: nuevoIdLocal(), ...c })),
        cuentas: [
          { id: 900001, nombre: 'Efectivo', tipo: 'Efectivo', saldoInicial: 0, icono: '💵', color: '#22C55E', activa: true },
          { id: 900002, nombre: 'Yape', tipo: 'Yape', saldoInicial: 0, icono: '💜', color: '#742D8B', activa: true },
          { id: 900003, nombre: 'Plin', tipo: 'Plin', saldoInicial: 0, icono: '💙', color: '#0EA5B7', activa: true },
          { id: 900004, nombre: 'Banco', tipo: 'Banco', saldoInicial: 0, icono: '🏦', color: '#1E40AF', activa: true },
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
    // Saneo: toda colección debe ser un array (también las básicas, por si un
    // respaldo viejo o editado a mano trae algo raro → evita pantalla en blanco).
    for (const col of ['cuentas', 'movimientos', 'prestamos', 'abonos', 'panderos', 'turnos', 'metas', 'recurrentes', 'presupuestos', 'trabajos', 'diasTrabajo', 'cobrosTrabajo', 'creditos']) {
      if (!Array.isArray(estado[col])) estado[col] = [];
    }
    // Perfil del usuario (nombre y profesión, opcionales): objeto, no array
    if (!estado.perfil || typeof estado.perfil !== 'object' || Array.isArray(estado.perfil)) {
      estado.perfil = { nombre: '', profesion: '', profesionOtra: '' };
    }
    // Categoría "Pandero" (gasto e ingreso) para conectar panderos con el saldo
    let cambiado = false;
    for (const tipo of ['Gasto', 'Ingreso']) {
      if (!estado.categorias.some((c) => c.nombre === 'Pandero' && c.tipo === tipo)) {
        estado.categorias.push({ id: estado.proximoId++, nombre: 'Pandero', tipo, icono: '🤝', color: '#6D5AE6' });
        cambiado = true;
      }
    }
    // Categoría «Cuotas y créditos» (gasto): cuotas de tarjeta y de créditos bancarios
    if (!estado.categorias.some((c) => c.nombre === 'Cuotas y créditos' && c.tipo === 'Gasto')) {
      estado.categorias.push({ id: estado.proximoId++, nombre: 'Cuotas y créditos', tipo: 'Gasto', icono: '💳', color: '#B54708' });
      cambiado = true;
    }
    if (cambiado) guardar();
    return estado;
  }

  // nuevoIdLocal(): id aleatorio provisional usado solo al crear la semilla
  // (luego cargar() los reindexa 1,2,3...). nuevoId(): id definitivo autoincremental.
  function nuevoIdLocal() { return Math.floor(Math.random() * 1e9); }
  function nuevoId() { const e = cargar(); return e.proximoId++; }

  // guardar(): persiste TODO el estado en localStorage. Debe llamarse
  // después de cada modificación (todas las funciones de abajo lo hacen).
  // Si el almacenamiento está lleno (QuotaExceededError) o bloqueado (modo
  // incógnito estricto), NO se lanza excepción: se avisa a la UI con un evento
  // para mostrar un toast y se devuelve false.
  function guardar() {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(estado));
      return true;
    } catch (e) {
      document.dispatchEvent(new CustomEvent('panderito:error-guardado', { detail: e }));
      return false;
    }
  }

  // r2(): redondea a centavos. Todo monto se guarda redondeado para que las
  // sumas cuadren (evita 4.999999999 y comparaciones que fallan por 1e-16).
  const r2 = (x) => Math.round((Number(x) || 0) * 100) / 100;

  // ---------- Categorías ----------
  // CRUD de categorías de gasto/ingreso. Regla: una categoría con
  // movimientos NO se puede eliminar (protege el historial).
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
  // Una categoría está "en uso" si la referencian movimientos, pagos fijos o
  // presupuestos. Las categorías «Pandero» son del sistema y no se borran.
  function categoriaEnUso(id) {
    const e = cargar();
    return categoriaTieneMovimientos(id)
      || e.recurrentes.some((r) => r.categoriaId === id)
      || e.presupuestos.some((p) => p.categoriaId === id)
      || e.creditos.some((c) => c.categoriaId === id);
  }
  function eliminarCategoria(id) {
    const e = cargar();
    const c = categoria(id);
    if (!c || c.nombre === 'Pandero' || c.nombre === 'Cuotas y créditos' || categoriaEnUso(id)) return false;
    e.categorias = e.categorias.filter((x) => x.id !== id); guardar(); return true;
  }

  // ---------- Cuentas (métodos de pago) ----------
  // Efectivo, Yape, Plin, Banco, Tarjeta... El saldo de una cuenta NO se
  // guarda: se CALCULA = saldoInicial + ingresos - gastos de esa cuenta.
  // Así nunca se desincroniza con los movimientos.
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
    if (cta.saldoInicial !== undefined) cta.saldoInicial = r2(cta.saldoInicial);
    guardar(); return cta;
  }
  // Nombre repetido (sin distinguir mayúsculas), ignorando la propia cuenta al editar
  function existeCuentaConNombre(nombre, exceptoId) {
    const n = String(nombre || '').trim().toLowerCase();
    return cargar().cuentas.some((c) => c.id !== exceptoId && String(c.nombre).trim().toLowerCase() === n);
  }
  function cuentaTieneMovimientos(id) { return cargar().movimientos.some((m) => m.cuentaId === id); }
  function cuentaEnUso(id) {
    const e = cargar();
    return cuentaTieneMovimientos(id) || e.recurrentes.some((r) => r.cuentaId === id) || e.trabajos.some((t) => t.cuentaId === id) || e.creditos.some((c) => c.cuentaId === id);
  }
  function eliminarCuenta(id) {
    const e = cargar();
    if (cuentaEnUso(id)) return false;
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
    return r2(s);
  }
  function saldoTotal() { return r2(cuentas(true).reduce((a, c) => a + saldoCuenta(c.id), 0)); }

  // ---------- Movimientos (ingresos y gastos) ----------
  // El corazón de la app. Cada movimiento: { id, monto, tipo:'Gasto'|'Ingreso',
  // categoriaId, cuentaId, fecha (ISO), nota }. Se listan del más reciente al más antiguo.
  // Orden: fecha más reciente primero; a igual fecha, el registrado último
  // primero (desempate por id) para que lo recién guardado aparezca arriba.
  function movimientos() {
    return cargar().movimientos.slice().sort((a, b) => (new Date(b.fecha) - new Date(a.fecha)) || (b.id - a.id));
  }
  function movimiento(id) { return cargar().movimientos.find((m) => m.id === id); }
  function guardarMovimiento(mov) {
    const e = cargar();
    mov.monto = r2(mov.monto);
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
    e.movimientos = e.movimientos.filter((m) => m.id !== id);
    // Si era el ingreso de un sueldo cobrado, el mes vuelve a quedar "por cobrar"
    // (si no, el Inicio diría «ya cobrado» sin que exista el ingreso).
    if (Array.isArray(e.cobrosTrabajo)) e.cobrosTrabajo = e.cobrosTrabajo.filter((c) => c.movimientoId !== id);
    guardar();
  }

  // ---------- Resúmenes (alimentan Inicio y Reportes) ----------
  // resumenMes: totales de ingresos/gastos/balance de un mes.
  // gastoPorCategoria: cuánto se gastó en cada categoría (con % del total).
  // serieMeses: últimos N meses para el gráfico de barras.
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
    return { ingresos: r2(ingresos), gastos: r2(gastos), balance: r2(ingresos - gastos) };
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
  function serieMeses(n = 6, hasta = new Date()) {
    const salida = [];
    const hoy = new Date(hasta);
    for (let i = n - 1; i >= 0; i--) {
      const ref = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const r = resumenMes(ref);
      salida.push({ ref, etiqueta: ref.toLocaleDateString('es-PE', { month: 'short' }), gastos: r.gastos, ingresos: r.ingresos });
    }
    return salida;
  }

  // ---------- Helpers de fechas / frecuencia ----------
  // siguienteFecha: avanza una fecha según la frecuencia (Semanal +7d,
  // Quincenal +15d, Mensual +1 mes). fechaDelTurno: fecha del turno N
  // de un pandero contando desde la fecha de inicio.
  function addDias(fecha, n) { const d = new Date(fecha); d.setDate(d.getDate() + n); return d; }
  // addMeses: si el día no existe en el mes destino se usa el último día de
  // ese mes (31 ene + 1 mes = 28/29 feb, no 3 mar). Así un alquiler del 31
  // no se corre al mes siguiente después del primer pago.
  function addMeses(fecha, n) {
    const d = new Date(fecha);
    const dia = d.getDate();
    d.setDate(1); d.setMonth(d.getMonth() + n);
    const ultimo = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(dia, ultimo));
    return d;
  }
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
  // Préstamo: { persona, monto, tipo:'PorCobrar'(me deben)|'PorPagar'(yo debo),
  // fecha, nota, estado:'Pendiente'|'Parcial'|'Pagado' }.
  // Los abonos son pagos parciales; el estado se recalcula con cada abono.
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
  function totalAbonado(prestamoId) { return r2(cargar().abonos.filter((a) => a.prestamoId === prestamoId).reduce((s, a) => s + Number(a.monto), 0)); }
  function saldoPendiente(p) { return Math.max(0, r2(Number(p.monto) - totalAbonado(p.id))); }
  // Comparación con tolerancia de medio centavo (evita "S/ 0.00 pendiente" con estado Parcial)
  function calcularEstadoPrestamo(monto, total) { if (total <= 0.005) return 'Pendiente'; if (total >= monto - 0.005) return 'Pagado'; return 'Parcial'; }
  // El abono nunca supera lo pendiente: se recorta al saldo (la UI además avisa).
  function registrarAbono(prestamoId, monto, fecha) {
    const e = cargar(); const p = prestamo(prestamoId); if (!p) return;
    const pend = saldoPendiente(p);
    const m = Math.min(r2(monto), pend);
    if (m <= 0) return p;
    e.abonos.push({ id: nuevoId(), prestamoId, monto: m, fecha: fecha || new Date().toISOString() });
    p.estado = calcularEstadoPrestamo(Number(p.monto), totalAbonado(prestamoId));
    guardar(); return p;
  }
  function marcarPagadoPrestamo(prestamoId) {
    const p = prestamo(prestamoId); if (!p) return;
    const pend = saldoPendiente(p);
    if (pend > 0.005) return registrarAbono(prestamoId, pend);
    p.estado = 'Pagado'; guardar(); return p;
  }
  function totalPendientePorTipo(tipo) {
    return prestamos().filter((p) => p.tipo === tipo && p.estado !== 'Pagado').reduce((s, p) => s + saldoPendiente(p), 0);
  }

  // ---------- Panderos (juntas de ahorro rotativo) ----------
  // Pandero: { nombre, numParticipantes, cuotaMonto, frecuencia,
  // fechaInicio, miTurno, activo }. Al crearlo se generan sus TURNOS:
  // uno por participante, con fecha de cobro calculada según la frecuencia.
  // "Pagar cuota" registra un GASTO y "Cobrar el pozo" un INGRESO
  // (categoría «Pandero»), así el pandero afecta el saldo real.
  function panderos() { return cargar().panderos.slice(); }
  function pandero(id) { return cargar().panderos.find((p) => p.id === id); }
  function generarTurnos(p, nombres) {
    const turnos = [];
    for (let i = 0; i < p.numParticipantes; i++) {
      const numero = i + 1;
      const nom = nombres && nombres[i] && String(nombres[i]).trim()
        ? String(nombres[i]).trim()
        : (numero === p.miTurno ? 'Yo' : `Participante ${numero}`);
      turnos.push({ id: nuevoId(), panderoId: p.id, numeroTurno: numero,
        nombreParticipante: nom, dni: '',
        fechaCobro: fechaDelTurno(p.fechaInicio, p.frecuencia, i), cobrado: false });
    }
    return turnos;
  }
  function crearPanderoConTurnos(p, nombres) {
    const e = cargar(); p.id = nuevoId(); if (p.activo === undefined) p.activo = true;
    if (!p.fechaInicio) p.fechaInicio = new Date().toISOString();
    e.panderos.push(p); e.turnos.push(...generarTurnos(p, nombres)); guardar(); return p;
  }
  function turnosDe(panderoId) { return cargar().turnos.filter((t) => t.panderoId === panderoId).sort((a, b) => a.numeroTurno - b.numeroTurno); }
  function marcarCobrado(turnoId, cobrado) { const e = cargar(); const t = e.turnos.find((x) => x.id === turnoId); if (t) { t.cobrado = cobrado; guardar(); } }
  function actualizarTurno(turnoId, datos) { const e = cargar(); const t = e.turnos.find((x) => x.id === turnoId); if (t) { Object.assign(t, datos); guardar(); } return t; }
  // Pagos de una ronda: en cada turno (ronda) se anota qué participantes ya
  // pusieron su cuota → turno.pagaron = [numeroTurno, ...]. Sirve para el
  // organizador y para el resumen que se comparte al grupo ("quién pagó").
  function alternarPagoRonda(turnoId, numeroParticipante) {
    const e = cargar(); const t = e.turnos.find((x) => x.id === turnoId); if (!t) return;
    if (!Array.isArray(t.pagaron)) t.pagaron = [];
    const i = t.pagaron.indexOf(numeroParticipante);
    if (i >= 0) t.pagaron.splice(i, 1); else t.pagaron.push(numeroParticipante);
    guardar(); return t;
  }
  // Ronda actual = primer turno aún no cobrado (null si el pandero terminó)
  function rondaActual(panderoId) { return turnosDe(panderoId).find((t) => !t.cobrado) || null; }
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
  function categoriaPanderoId(tipo) { const c = cargar().categorias.find((x) => x.nombre === 'Pandero' && x.tipo === tipo); return c ? c.id : null; }
  // Pagar la cuota del pandero => gasto que descuenta del saldo. Además marca
  // como "cobrado" el turno pendiente más antiguo: en un pandero cada ronda
  // todos pagan y uno cobra, así "Aportado" y "Turnos cobrados" avanzan juntos.
  // Si ya se pagaron todas las rondas, no registra nada (devuelve null).
  function pagarCuotaPandero(panderoId, cuentaId) {
    const p = pandero(panderoId); if (!p) return null;
    const turnoPend = turnosDe(p.id).find((t) => !t.cobrado);
    if (!turnoPend) return null;
    const cta = cuentaId || (cuentas(true)[0] && cuentas(true)[0].id);
    turnoPend.cobrado = true;
    return guardarMovimiento({ monto: Number(p.cuotaMonto), tipo: 'Gasto', categoriaId: categoriaPanderoId('Gasto'), cuentaId: cta, fecha: new Date().toISOString(), nota: 'Cuota pandero ' + p.nombre });
  }
  // Cobrar el pozo (cuando te toca) => ingreso que suma al saldo. Solo una vez
  // por pandero: queda marcado en p.pozoCobrado y la UI deshabilita el botón.
  function cobrarPozoPandero(panderoId, cuentaId) {
    const p = pandero(panderoId); if (!p || p.pozoCobrado) return null;
    const r = resumenPandero(p);
    const cta = cuentaId || (cuentas(true)[0] && cuentas(true)[0].id);
    p.pozoCobrado = true;
    return guardarMovimiento({ monto: r.montoARecibir, tipo: 'Ingreso', categoriaId: categoriaPanderoId('Ingreso'), cuentaId: cta, fecha: new Date().toISOString(), nota: 'Cobré pandero ' + p.nombre });
  }

  // ---------- Metas de ahorro ----------
  // Meta: { nombre, montoMeta, montoActual, fechaMeta }. abonarMeta()
  // suma al progreso; la UI muestra % y celebra al llegar al 100%.
  function metas() { return cargar().metas.slice(); }
  function meta(id) { return cargar().metas.find((m) => m.id === id); }
  function guardarMeta(m) {
    const e = cargar();
    if (m.id) { const i = e.metas.findIndex((x) => x.id === m.id); if (i >= 0) e.metas[i] = { ...e.metas[i], ...m }; }
    else { m.id = nuevoId(); if (m.montoActual === undefined) m.montoActual = 0; e.metas.push(m); }
    guardar(); return m;
  }
  function abonarMeta(id, monto) { const m = meta(id); if (!m) return; m.montoActual = r2(Number(m.montoActual) + Number(monto)); guardar(); return m; }
  function eliminarMeta(id) { const e = cargar(); e.metas = e.metas.filter((m) => m.id !== id); guardar(); }

  // ---------- Gastos recurrentes (pagos fijos) ----------
  // Recurrente: { nombre, proveedor, monto, categoriaId, cuentaId,
  // frecuencia, proximaFecha, activo }. registrarPagoRecurrente() crea
  // el gasto del período y AVANZA proximaFecha a la siguiente fecha.
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

  // ---------- Presupuestos (límite de gasto por categoría) ----------
  // Presupuesto: { categoriaId, montoLimite, periodo:'Semanal'|'Quincenal'|'Mensual' }.
  // Solo puede existir UN presupuesto por categoría. avancePresupuesto()
  // suma lo gastado en el período vigente y devuelve el nivel:
  // Normal (<80%), Alerta (80-99%) o Excedido (>=100%).
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

  // ---------- Pendientes (para avisos) ----------
  // Junta en una sola lista lo que requiere atención en los próximos
  // `dias`: panderos por cobrar, pagos fijos por vencer/vencidos y
  // presupuestos en Alerta/Excedido. Alimenta la sección "Pendientes 🔔"
  // del Inicio y las notificaciones locales.
  function pendientes(dias = 7) {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const diasHasta = (iso) => Math.round((new Date(new Date(iso).setHours(0, 0, 0, 0)) - hoy) / 86400000);
    const items = [];
    for (const p of panderos()) {
      const r = resumenPandero(p);
      if (!r.fechaMiTurno) continue;
      const d = diasHasta(r.fechaMiTurno);
      if (d >= 0 && d <= dias) items.push({ tipo: 'pandero', titulo: `Te toca el pandero «${p.nombre}»`, detalle: d === 0 ? 'es hoy' : `en ${d} día${d === 1 ? '' : 's'}`, monto: r.montoARecibir, dias: d, emo: '🤝' });
    }
    for (const r of recurrentes()) {
      const d = diasHasta(r.proximaFecha);
      if (d <= dias) items.push({ tipo: 'recurrente', id: r.id, titulo: r.nombre, detalle: d < 0 ? `vencido hace ${-d} día${d === -1 ? '' : 's'}` : d === 0 ? 'vence hoy' : `vence en ${d} día${d === 1 ? '' : 's'}`, monto: r.monto, dias: d, emo: '🔁' });
    }
    for (const c of creditos(true)) {
      const f = proximaCuotaFecha(c); if (!f) continue;
      const d = diasHasta(f);
      if (d <= dias) items.push({ tipo: 'credito', id: c.id, titulo: `Cuota ${c.cuotasPagadas + 1}/${c.numCuotas} · ${c.nombre}`, detalle: d < 0 ? `vencida hace ${-d} día${d === -1 ? '' : 's'}` : d === 0 ? 'vence hoy' : `vence en ${d} día${d === 1 ? '' : 's'}`, monto: montoCuota(c, c.cuotasPagadas + 1), dias: d, emo: '💳' });
    }
    for (const p of presupuestos()) {
      const av = avancePresupuesto(p);
      if (av.nivel !== 'Normal') { const cat = categoria(p.categoriaId); items.push({ tipo: 'presupuesto', titulo: `Presupuesto ${cat ? cat.nombre : ''}`, detalle: av.nivel === 'Excedido' ? 'excedido' : 'cerca del límite', monto: av.gastado, dias: 0, emo: av.nivel === 'Excedido' ? '🔴' : '🟡' }); }
    }
    return items.sort((a, b) => a.dias - b.dias);
  }

  // ---------- Cuotas y créditos (tarjeta en cuotas, crédito bancario, tienda) ----------
  // Crédito: { id, nombre, entidad, tipo:'Tarjeta'|'Credito', montoTotal (TODO lo que
  //   pagarás, con intereses), precioContado (opcional, para ver el costo del
  //   financiamiento), numCuotas, cuotaMonto, primeraFecha (ISO), categoriaId,
  //   cuentaId (de dónde sale el pago), cuotasPagadas, activo, nota }.
  //
  // MODELO ELEGIDO (decisión 15): la compra NO se registra como gasto el día que
  // la haces; se registra un GASTO por cada CUOTA cuando la pagas (visión de
  // flujo de caja: "es un gasto mensual"). La deuda pendiente se muestra aparte
  // como «Deudas en cuotas». Así el saldo real de tus cuentas siempre cuadra y
  // no se cuenta doble (ni la compra ni el pago de la tarjeta).
  function creditos(soloActivos) { const e = cargar(); const l = soloActivos ? e.creditos.filter((c) => c.activo !== false) : e.creditos.slice(); return l.sort((a, b) => new Date(proximaCuotaFecha(a) || 0) - new Date(proximaCuotaFecha(b) || 0)); }
  function credito(id) { return cargar().creditos.find((c) => c.id === id); }
  function guardarCredito(c) {
    const e = cargar();
    let final;
    if (c.id) { const i = e.creditos.findIndex((x) => x.id === c.id); if (i < 0) return null; final = { ...e.creditos[i], ...c }; e.creditos[i] = final; }
    else { final = { tipo: 'Tarjeta', activo: true, cuotasPagadas: 0, ...c, id: nuevoId() }; e.creditos.push(final); }
    final.numCuotas = Math.max(1, parseInt(final.numCuotas, 10) || 1);
    final.montoTotal = r2(final.montoTotal);
    final.cuotaMonto = r2(final.cuotaMonto || final.montoTotal / final.numCuotas);
    if (final.precioContado !== undefined && final.precioContado !== null && final.precioContado !== '') final.precioContado = r2(final.precioContado); else final.precioContado = null;
    if (!final.primeraFecha) final.primeraFecha = new Date().toISOString();
    guardar(); return final;
  }
  function eliminarCredito(id) { const e = cargar(); e.creditos = e.creditos.filter((c) => c.id !== id); guardar(); }
  // Cuota k (1-based) vence k-1 meses después de la primera fecha (respeta fin de mes)
  function fechaCuota(c, k) { return addMeses(new Date(c.primeraFecha), k - 1).toISOString(); }
  function proximaCuotaFecha(c) { return c.cuotasPagadas >= c.numCuotas ? null : fechaCuota(c, c.cuotasPagadas + 1); }
  // Monto de la cuota k: la última absorbe el redondeo para que la suma sea exacta
  function montoCuota(c, k) { return k === c.numCuotas ? r2(c.montoTotal - c.cuotaMonto * (c.numCuotas - 1)) : c.cuotaMonto; }
  function saldoCredito(c) { let s = 0; for (let k = c.cuotasPagadas + 1; k <= c.numCuotas; k++) s += montoCuota(c, k); return r2(s); }
  function costoFinanciamiento(c) { return c.precioContado ? r2(c.montoTotal - c.precioContado) : null; }
  function deudaTotalCreditos() { return r2(creditos(true).reduce((s, c) => s + saldoCredito(c), 0)); }
  // Pagar la cuota que sigue: crea el GASTO (categoría del crédito) y avanza.
  function pagarCuotaCredito(id, fecha, cuentaId) {
    const c = credito(id); if (!c || c.cuotasPagadas >= c.numCuotas) return null;
    const k = c.cuotasPagadas + 1;
    const activas = cuentas(true);
    const cta = activas.some((x) => x.id === cuentaId) ? cuentaId : activas.some((x) => x.id === c.cuentaId) ? c.cuentaId : (activas[0] && activas[0].id);
    const cat = categoria(c.categoriaId) ? c.categoriaId : (cargar().categorias.find((x) => x.nombre === 'Cuotas y créditos' && x.tipo === 'Gasto') || {}).id;
    const mov = guardarMovimiento({ monto: montoCuota(c, k), tipo: 'Gasto', categoriaId: cat, cuentaId: cta, fecha: fecha || new Date().toISOString(), nota: `Cuota ${k}/${c.numCuotas} · ${c.nombre}`, creditoId: c.id, numeroCuota: k });
    c.cuotasPagadas = k; guardar(); return mov;
  }
  // Deshacer la última cuota pagada (se equivocó): borra el gasto y retrocede
  function deshacerCuotaCredito(id) {
    const e = cargar(); const c = credito(id); if (!c || c.cuotasPagadas <= 0) return false;
    const k = c.cuotasPagadas;
    const mov = e.movimientos.find((m) => m.creditoId === c.id && m.numeroCuota === k);
    if (mov) e.movimientos = e.movimientos.filter((m) => m.id !== mov.id);
    c.cuotasPagadas = k - 1; guardar(); return true;
  }

  // ---------- Perfil ----------
  // { nombre, profesion, profesionOtra }. Todo opcional. `profesion` es una de
  // las opciones del desplegable o 'Otro' (y entonces vale `profesionOtra`).
  // profesionTexto() devuelve lo que se muestra. Servirá también al módulo Trabajo.
  function perfil() { return { ...cargar().perfil }; }
  function guardarPerfil(p) {
    const e = cargar();
    e.perfil = {
      nombre: String(p.nombre || '').trim().slice(0, 40),
      profesion: String(p.profesion || '').trim().slice(0, 60),
      profesionOtra: String(p.profesionOtra || '').trim().slice(0, 60),
    };
    guardar(); return e.perfil;
  }
  function profesionTexto() { const p = cargar().perfil; return p.profesion === 'Otro' ? p.profesionOtra : p.profesion; }

  // ---------- Trabajo (horas/días de trabajo → posibles ingresos) ----------
  // Trabajo: { id, nombre, modo:'Mensual'|'Dia'|'Hora', monto, horasDia,
  //   dias:[L,M,X,J,V,S,D] (1 = se trabaja por defecto), feriadosPagados,
  //   cuentaId, activo }.
  // diasTrabajo: excepciones al patrón, una por día tocado en el calendario:
  //   { id, trabajoId, fecha:'YYYY-MM-DD', cuenta:true|false }.
  // cobrosTrabajo: { id, trabajoId, mes:'YYYY-MM', movimientoId, monto } —
  //   registra que el sueldo de ese mes ya se convirtió en ingreso real.
  //
  // REGLAS DE CÁLCULO (decididas con el usuario, 2026-09-27):
  // - La unidad es el DÍA COMPLETO. valorDia = sueldo mensual ÷ días planificados
  //   del mes (patrón + feriados pagados), o el monto por día, o monto×horas.
  // - Un feriado que cae en día de patrón cuenta como pagado si feriadosPagados
  //   (planilla formal); si no, no cuenta. Feriado en fin de semana no cuenta.
  // - Tocar un día en el calendario invierte su estado (falta ↔ día extra).
  // - Ganado del mes = valorDia × días que cuentan hasta hoy (inclusive).
  // - Proyección = valorDia × días que cuentan en todo el mes.

  // Feriados nacionales del Perú: fijos + Jueves y Viernes Santo (Pascua calculada).
  const FERIADOS_FIJOS = ['01-01', '05-01', '06-07', '06-29', '07-23', '07-28', '07-29', '08-06', '08-30', '10-08', '11-01', '12-08', '12-09', '12-25'];
  function pascua(anio) { // algoritmo de Meeus/Jones/Butcher (calendario gregoriano)
    const a = anio % 19, b = Math.floor(anio / 100), c = anio % 100, d = Math.floor(b / 4), e = b % 4;
    const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(anio, mes - 1, dia);
  }
  const claveDia = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const cacheFeriados = {};
  function feriadosDe(anio) {
    if (cacheFeriados[anio]) return cacheFeriados[anio];
    const set = new Set(FERIADOS_FIJOS.map((md) => `${anio}-${md}`));
    const p = pascua(anio);
    set.add(claveDia(addDias(p, -3))); // Jueves Santo
    set.add(claveDia(addDias(p, -2))); // Viernes Santo
    return (cacheFeriados[anio] = set);
  }
  function esFeriado(d) { return feriadosDe(d.getFullYear()).has(claveDia(d)); }

  function trabajos(soloActivos) { const e = cargar(); return soloActivos ? e.trabajos.filter((t) => t.activo !== false) : e.trabajos.slice(); }
  function trabajo(id) { return cargar().trabajos.find((t) => t.id === id); }
  // Acepta actualizaciones parciales ({ id, activo:false }): primero se mezcla
  // con lo guardado y DESPUÉS se normaliza, para no pisar monto/días con vacíos.
  function guardarTrabajo(t) {
    const e = cargar();
    let final;
    if (t.id) {
      const i = e.trabajos.findIndex((x) => x.id === t.id);
      if (i < 0) return null;
      final = { ...e.trabajos[i], ...t };
      e.trabajos[i] = final;
    } else {
      final = { activo: true, feriadosPagados: true, modo: 'Mensual', ...t, id: nuevoId() };
      e.trabajos.push(final);
    }
    final.monto = r2(final.monto); final.horasDia = Number(final.horasDia) || 8;
    if (!Array.isArray(final.dias) || final.dias.length !== 7) final.dias = [1, 1, 1, 1, 1, 0, 0];
    guardar(); return final;
  }
  function eliminarTrabajo(id) {
    const e = cargar();
    e.trabajos = e.trabajos.filter((t) => t.id !== id);
    e.diasTrabajo = e.diasTrabajo.filter((x) => x.trabajoId !== id);
    e.cobrosTrabajo = e.cobrosTrabajo.filter((x) => x.trabajoId !== id);
    guardar();
  }
  // ¿Cuenta este día según el PATRÓN (sin excepciones)? Índice L=0 … D=6.
  function diaPlanificado(t, d) {
    const idx = (d.getDay() + 6) % 7;
    if (!t.dias[idx]) return false;
    if (esFeriado(d)) return !!t.feriadosPagados;
    return true;
  }
  function excepcionDe(trabajoId, clave) { return cargar().diasTrabajo.find((x) => x.trabajoId === trabajoId && x.fecha === clave); }
  // ¿Cuenta este día en la realidad? (excepción manda sobre el patrón)
  function diaCuenta(t, d) {
    const ex = excepcionDe(t.id, claveDia(d));
    return ex ? !!ex.cuenta : diaPlanificado(t, d);
  }
  // Tocar un día: si ya había excepción se quita (vuelve al patrón); si no, se
  // crea con el estado contrario al patrón.
  function alternarDiaTrabajo(trabajoId, clave) {
    const e = cargar(); const t = trabajo(trabajoId); if (!t) return;
    const i = e.diasTrabajo.findIndex((x) => x.trabajoId === trabajoId && x.fecha === clave);
    if (i >= 0) e.diasTrabajo.splice(i, 1);
    else e.diasTrabajo.push({ id: nuevoId(), trabajoId, fecha: clave, cuenta: !diaPlanificado(t, new Date(clave + 'T12:00:00')) });
    guardar();
  }
  function valorDiaTrabajo(t, ref = new Date()) {
    if (t.modo === 'Dia') return r2(t.monto);
    if (t.modo === 'Hora') return r2(t.monto * (Number(t.horasDia) || 8));
    // Mensual: sueldo ÷ días planificados del mes de referencia
    const y = ref.getFullYear(), m = ref.getMonth();
    const ultimo = new Date(y, m + 1, 0).getDate();
    let plan = 0;
    for (let d = 1; d <= ultimo; d++) if (diaPlanificado(t, new Date(y, m, d))) plan++;
    return plan ? r2(t.monto / plan) : 0;
  }
  // Resumen del mes de `ref` para un trabajo: ganado hasta hoy, proyección, días.
  function resumenTrabajo(t, ref = new Date()) {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const y = ref.getFullYear(), m = ref.getMonth();
    const ultimo = new Date(y, m + 1, 0).getDate();
    const valorDia = valorDiaTrabajo(t, ref);
    let contados = 0, planTotal = 0, contadosHastaHoy = 0, hoyCuenta = false;
    for (let d = 1; d <= ultimo; d++) {
      const f = new Date(y, m, d);
      const cuenta = diaCuenta(t, f);
      if (cuenta) { planTotal++; if (f <= hoy) contadosHastaHoy++; }
      if (diaPlanificado(t, f)) contados++;
      if (cuenta && f.getTime() === hoy.getTime()) hoyCuenta = true;
    }
    const mesClave = `${y}-${String(m + 1).padStart(2, '0')}`;
    const cobro = cargar().cobrosTrabajo.find((c) => c.trabajoId === t.id && c.mes === mesClave);
    // En modo Mensual se prorratea sobre el sueldo completo (sueldo × días/planificados)
    // para que, sin faltas ni extras, la proyección sea EXACTAMENTE el sueldo (no 2999.92).
    const importe = (n) => (t.modo === 'Mensual' && contados > 0) ? r2(t.monto * n / contados) : r2(valorDia * n);
    return {
      valorDia, valorHora: r2(valorDia / (Number(t.horasDia) || 8)),
      ganado: importe(contadosHastaHoy), proyeccion: importe(planTotal),
      diasContados: contadosHastaHoy, diasMes: planTotal, diasPatron: contados, hoyCuenta,
      mesClave, cobrado: cobro ? cobro.monto : null, cobro,
    };
  }
  // Total "posibles ingresos" del mes actual: lo ganado en trabajos activos
  // que todavía NO se cobraron (al cobrar pasa a ser ingreso real).
  function posiblesIngresosMes() {
    let total = 0;
    for (const t of trabajos(true)) { const r = resumenTrabajo(t); if (r.cobrado === null) total += r.ganado; }
    return r2(total);
  }
  // «Ya me pagaron»: crea el INGRESO real (categoría Sueldo si existe) y deja
  // constancia del cobro del mes para no contarlo dos veces.
  function cobrarTrabajo(trabajoId, mesClave, monto, cuentaId) {
    const e = cargar(); const t = trabajo(trabajoId); if (!t) return null;
    if (e.cobrosTrabajo.some((c) => c.trabajoId === trabajoId && c.mes === mesClave)) return null;
    if (!(r2(monto) > 0)) return null;
    // No se cobra un mes que aún no empezó (protege contra el ‹ › del calendario)
    const hoyClave = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    if (mesClave > hoyClave) return null;
    const cat = e.categorias.find((c) => c.tipo === 'Ingreso' && c.nombre === 'Sueldo') || e.categorias.find((c) => c.tipo === 'Ingreso');
    // La cuenta debe existir y estar activa; si no, cae a la primera activa
    const activas = cuentas(true);
    const existe = (id) => id && activas.some((c) => c.id === id);
    const cta = existe(cuentaId) ? cuentaId : existe(t.cuentaId) ? t.cuentaId : (activas[0] && activas[0].id);
    if (!cta) return null;
    const mov = guardarMovimiento({ monto: r2(monto), tipo: 'Ingreso', categoriaId: cat ? cat.id : null, cuentaId: cta, fecha: new Date().toISOString(), nota: `Sueldo ${t.nombre} · ${mesClave}` });
    e.cobrosTrabajo.push({ id: nuevoId(), trabajoId, mes: mesClave, movimientoId: mov.id, monto: r2(monto) });
    guardar(); return mov;
  }

  // ---------- Utilidades de datos ----------
  // exportar(): devuelve TODO el estado como JSON legible (para el
  // respaldo descargable de Ajustes). reiniciar(): borra todo y vuelve
  // a crear los datos semilla (usado por "Borrar todo").
  function exportar() { return JSON.stringify(cargar(), null, 2); }
  function reiniciar() { localStorage.removeItem(CLAVE); estado = null; cargar(); }
  // importar(texto): restaura un respaldo JSON exportado por la app.
  // Valida la forma mínima antes de reemplazar nada. Devuelve { ok, error, resumen }.
  function importar(texto) {
    let obj;
    try { obj = JSON.parse(texto); } catch (e) { return { ok: false, error: 'El archivo no es un JSON válido.' }; }
    if (!obj || typeof obj !== 'object') return { ok: false, error: 'El archivo no tiene datos.' };
    for (const col of ['categorias', 'cuentas', 'movimientos']) {
      if (!Array.isArray(obj[col])) return { ok: false, error: `Falta la lista «${col}»: no parece un respaldo de Panderito.` };
    }
    const previo = localStorage.getItem(CLAVE);
    try {
      localStorage.setItem(CLAVE, JSON.stringify(obj));
    } catch (e) { return { ok: false, error: 'No hay espacio para guardar el respaldo.' }; }
    estado = null; cargar(); // cargar() aplica migraciones y saneo
    if (previo) { try { localStorage.setItem(CLAVE + '.anterior', previo); } catch (e) { /* opcional */ } }
    return { ok: true, resumen: `${estado.movimientos.length} movimientos, ${estado.cuentas.length} cuentas` };
  }
  // hayCopiaCorrupta(): true si cargar() apartó datos ilegibles (para avisar en Ajustes)
  function hayCopiaCorrupta() { try { return !!localStorage.getItem(CLAVE + '.corrupto'); } catch (e) { return false; } }

  // API pública del módulo: SOLO estas funciones son visibles desde app.js.
  return {
    cargar, guardar, siguienteFecha, fechaDelTurno, TIPOS_CUENTA,
    categorias, categoria, guardarCategoria, eliminarCategoria, categoriaTieneMovimientos, categoriaEnUso,
    cuentas, cuenta, guardarCuenta, eliminarCuenta, cuentaTieneMovimientos, cuentaEnUso, existeCuentaConNombre, saldoCuenta, saldoTotal,
    movimientos, movimiento, guardarMovimiento, eliminarMovimiento,
    resumenMes, gastoPorCategoria, serieMeses,
    // Préstamos
    prestamos, prestamo, guardarPrestamo, eliminarPrestamo, abonosDe, totalAbonado,
    saldoPendiente, registrarAbono, marcarPagadoPrestamo, totalPendientePorTipo,
    // Panderos
    panderos, pandero, crearPanderoConTurnos, turnosDe, marcarCobrado, actualizarTurno, eliminarPandero, resumenPandero,
    alternarPagoRonda, rondaActual,
    pagarCuotaPandero, cobrarPozoPandero,
    // Pendientes / avisos
    pendientes,
    // Metas
    metas, meta, guardarMeta, abonarMeta, eliminarMeta,
    // Recurrentes
    recurrentes, recurrente, guardarRecurrente, eliminarRecurrente, registrarPagoRecurrente,
    // Presupuestos
    presupuestos, presupuesto, presupuestoDeCategoria, guardarPresupuesto, eliminarPresupuesto, avancePresupuesto,
    // Cuotas y créditos
    creditos, credito, guardarCredito, eliminarCredito, fechaCuota, proximaCuotaFecha, montoCuota,
    saldoCredito, costoFinanciamiento, deudaTotalCreditos, pagarCuotaCredito, deshacerCuotaCredito,
    // Perfil
    perfil, guardarPerfil, profesionTexto,
    // Trabajo
    trabajos, trabajo, guardarTrabajo, eliminarTrabajo, diaPlanificado, diaCuenta, excepcionDe,
    alternarDiaTrabajo, valorDiaTrabajo, resumenTrabajo, posiblesIngresosMes, cobrarTrabajo, esFeriado, claveDia,
    exportar, importar, reiniciar, hayCopiaCorrupta, r2,
  };
})();

// ---------- Formato de moneda (S/ Perú), equivalente a FormatoMoneda.cs ----------
// Moneda.fmt(1234.5) → "S/ 1,234.50" · Moneda.conSigno(50,'Gasto') → "- S/ 50.00"
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
