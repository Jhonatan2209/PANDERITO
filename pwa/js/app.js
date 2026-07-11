/* ============================================================
   Panderito PWA — aplicación (router + vistas)
   SPA sin dependencias. Replica las pantallas de la app MAUI.
   ============================================================ */

const App = (() => {
  const cont = () => document.getElementById('app');

  // ---------- Utilidades ----------
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('ver');
    clearTimeout(t._tmr); t._tmr = setTimeout(() => t.classList.remove('ver'), 2200);
  }

  const capitalizar = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  function nombreMes(ref = new Date()) { return capitalizar(ref.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })); }
  function saludo() {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }
  function fechaCorta(iso) {
    const f = new Date(iso); const hoy = new Date();
    const ayer = new Date(); ayer.setDate(hoy.getDate() - 1);
    if (f.toDateString() === hoy.toDateString()) return 'Hoy';
    if (f.toDateString() === ayer.toDateString()) return 'Ayer';
    return f.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
  }
  const hoyInput = () => new Date().toISOString().slice(0, 10);

  // ---------- Estado de UI en memoria (formularios) ----------
  let form = {};
  let filtroHist = { texto: '', tipo: 'Todos' };
  let refReporte = new Date();

  // ---------- Router ----------
  const rutas = {};
  function registrar(nombre, fn) { rutas[nombre] = fn; }

  function ir(ruta, params) {
    location.hash = '#' + ruta + (params ? '?' + new URLSearchParams(params) : '');
  }

  function render() {
    const [ruta, query] = (location.hash.replace(/^#/, '') || 'inicio').split('?');
    const params = Object.fromEntries(new URLSearchParams(query || ''));
    const fn = rutas[ruta] || rutas['inicio'];
    cont().innerHTML = `<div class="vista">${fn(params)}</div>`;
    cont().scrollTop = 0; window.scrollTo(0, 0);
    marcarTab(ruta);
    const post = fn._post; if (post) post(params);
  }

  function marcarTab(ruta) {
    const mapa = {
      inicio: 'inicio', movimientos: 'movimientos', registrar: 'registrar', reportes: 'reportes',
      mas: 'mas', cuentas: 'mas', cuentaEdit: 'mas', categorias: 'mas', ajustes: 'mas', detalle: 'movimientos',
      prestamos: 'mas', prestamoNuevo: 'mas', prestamoDet: 'mas',
      panderos: 'mas', panderoNuevo: 'mas', panderoDet: 'mas',
      metas: 'mas', metaNueva: 'mas', recurrentes: 'mas', recurrenteNuevo: 'mas',
      presupuestos: 'mas', presupuestoNuevo: 'mas',
    };
    const activa = mapa[ruta] || 'inicio';
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('activo', t.dataset.ruta === activa));
  }

  // ============================================================
  //  VISTA: INICIO (Dashboard)
  // ============================================================
  registrar('inicio', () => {
    const total = Datos.saldoTotal();
    const r = Datos.resumenMes();
    const movs = Datos.movimientos().slice(0, 6);
    const ctas = Datos.cuentas(true);
    const pend = Datos.pendientes(7);

    return `
      <header class="encabezado">
        <div>
          <p class="saludo">${saludo()} 👋</p>
          <h1>Panderito</h1>
          <p class="sub">${nombreMes()}</p>
        </div>
      </header>

      <div id="banner-instalar" class="card">
        <span style="font-size:26px">📲</span>
        <div class="txt"><b>Instala Panderito</b>Agrégalo a tu pantalla de inicio y úsalo como app.</div>
        <button class="btn chico" id="btn-instalar">Instalar</button>
      </div>

      <div class="card-saldo" onclick="App.ir('cuentas')" style="cursor:pointer">
        <p class="etq">Saldo total</p>
        <p class="monto">${Moneda.fmt(total)}</p>
        <p class="cuentas-min">${ctas.length} cuenta${ctas.length === 1 ? '' : 's'} · toca para ajustar tu saldo inicial ›</p>
      </div>

      <div class="duo">
        <div class="mini">
          <p class="etq"><span class="punto ingreso"></span> Ingresos del mes</p>
          <p class="val ingreso">${Moneda.fmt(r.ingresos)}</p>
        </div>
        <div class="mini">
          <p class="etq"><span class="punto gasto"></span> Gastos del mes</p>
          <p class="val gasto">${Moneda.fmt(r.gastos)}</p>
        </div>
      </div>

      ${pend.length ? `
      <div class="seccion-tit"><h2>Pendientes 🔔</h2></div>
      <div class="lista">${pend.map((x) => `
        <div class="item">
          <span class="ic" style="background:var(--pendiente-soft);color:var(--pendiente)">${x.emo}</span>
          <span class="cuerpo"><p class="t">${esc(x.titulo)}</p><p class="s">${esc(x.detalle)}</p></span>
          <span class="monto">${Moneda.fmt(x.monto)}</span>
        </div>`).join('')}</div>` : ''}

      <div class="seccion-tit">
        <h2>Últimos movimientos</h2>
        <a href="#movimientos">Ver todos</a>
      </div>
      ${movs.length ? `<div class="lista">${movs.map(itemMovimiento).join('')}</div>`
        : estadoVacio('🐷', 'Aún no hay movimientos', 'Toca el botón dorado ＋ para registrar tu primer ingreso o gasto.')}

      <p class="pie-marca">Panderito · Tus finanzas, tu junta</p>
    `;
  });
  rutas['inicio']._post = () => { configurarBannerInstalar(); };

  function itemMovimiento(m) {
    const cat = Datos.categoria(m.categoriaId) || { nombre: 'Sin categoría', icono: '🏷️', color: '#6B7280' };
    const cta = Datos.cuenta(m.cuentaId);
    return `
      <button class="item" onclick="App.ir('detalle',{id:${m.id}})">
        <span class="ic" style="background:${cat.color}22;color:${cat.color}">${cat.icono || '🏷️'}</span>
        <span class="cuerpo">
          <p class="t">${esc(m.nota || cat.nombre)}</p>
          <p class="s">${esc(cat.nombre)} · ${cta ? esc(cta.nombre) : '—'} · ${fechaCorta(m.fecha)}</p>
        </span>
        <span class="monto ${m.tipo === 'Ingreso' ? 'ingreso' : 'gasto'}">${Moneda.conSigno(m.monto, m.tipo)}</span>
      </button>`;
  }

  function estadoVacio(emo, titulo, texto) {
    return `<div class="vacio"><div class="emo">${emo}</div><h3>${esc(titulo)}</h3><p>${esc(texto)}</p></div>`;
  }

  // ============================================================
  //  VISTA: MOVIMIENTOS (Historial)
  // ============================================================
  registrar('movimientos', () => {
    let movs = Datos.movimientos();
    if (filtroHist.tipo !== 'Todos') movs = movs.filter((m) => m.tipo === filtroHist.tipo);
    if (filtroHist.texto) {
      const q = filtroHist.texto.toLowerCase();
      movs = movs.filter((m) => {
        const cat = Datos.categoria(m.categoriaId);
        return (m.nota || '').toLowerCase().includes(q) || (cat && cat.nombre.toLowerCase().includes(q));
      });
    }
    const chips = ['Todos', 'Gasto', 'Ingreso'];
    return `
      <div class="titulo-pagina"><h1>Movimientos</h1></div>
      <div class="campo"><input class="entrada" id="buscar" placeholder="🔎 Buscar por nota o categoría" value="${esc(filtroHist.texto)}" /></div>
      <div class="chips">
        ${chips.map((c) => `<button class="chip ${filtroHist.tipo === c ? 'activo' : ''}" onclick="App.filtrarHist('${c}')">${c === 'Todos' ? 'Todos' : c + 's'}</button>`).join('')}
      </div>
      ${movs.length ? `<div class="lista">${movs.map(itemMovimiento).join('')}</div>`
        : estadoVacio('🔍', 'Sin resultados', 'No hay movimientos con ese filtro. Prueba otra búsqueda.')}
    `;
  });
  rutas['movimientos']._post = () => {
    const b = document.getElementById('buscar');
    if (b) b.oninput = (e) => { filtroHist.texto = e.target.value; const pos = e.target.selectionStart; render(); const nb = document.getElementById('buscar'); nb.focus(); nb.setSelectionRange(pos, pos); };
  };

  // ============================================================
  //  VISTA: REGISTRAR
  // ============================================================
  registrar('registrar', (params) => {
    const editando = params.id ? Datos.movimiento(Number(params.id)) : null;
    if (!form._activo) {
      if (editando) {
        form = { _activo: true, id: editando.id, tipo: editando.tipo, monto: String(editando.monto), categoriaId: editando.categoriaId, cuentaId: editando.cuentaId, fecha: editando.fecha.slice(0, 10), nota: editando.nota };
      } else {
        const cta = Datos.cuentas(true)[0];
        form = { _activo: true, id: null, tipo: 'Gasto', monto: '', categoriaId: null, cuentaId: cta ? cta.id : null, fecha: hoyInput(), nota: '' };
      }
    }
    const cats = Datos.categorias(form.tipo);
    const ctas = Datos.cuentas(true);
    return `
      <div class="titulo-pagina"><h1>${editando ? 'Editar movimiento' : 'Registrar'}</h1></div>

      <div class="toggle-tipo">
        <button class="${form.tipo === 'Gasto' ? 'sel-gasto' : ''}" onclick="App.setTipo('Gasto')">Gasto</button>
        <button class="${form.tipo === 'Ingreso' ? 'sel-ingreso' : ''}" onclick="App.setTipo('Ingreso')">Ingreso</button>
      </div>

      <div class="monto-grande">
        <span class="simbolo">S/</span>
        <input id="monto" class="${form.tipo === 'Gasto' ? 'gasto' : 'ingreso'}" type="number" inputmode="decimal" placeholder="0.00" value="${esc(form.monto)}" />
      </div>

      <div class="campo">
        <label>Categoría</label>
        <div class="grilla-cat">
          ${cats.map((c) => `
            <button class="cat-op ${form.categoriaId === c.id ? 'activo' : ''}" onclick="App.setCategoria(${c.id})">
              <span class="ic" style="background:${c.color}22;color:${c.color}">${c.icono}</span>
              <span class="n">${esc(c.nombre)}</span>
            </button>`).join('')}
        </div>
      </div>

      <div class="campo">
        <label>Cuenta</label>
        <select class="entrada" id="cuenta">
          ${ctas.map((c) => `<option value="${c.id}" ${form.cuentaId === c.id ? 'selected' : ''}>${c.icono} ${esc(c.nombre)}</option>`).join('')}
        </select>
      </div>

      <div class="campo">
        <label>Fecha</label>
        <input class="entrada" id="fecha" type="date" value="${esc(form.fecha)}" max="${hoyInput()}" />
      </div>

      <div class="campo">
        <label>Nota (opcional)</label>
        <input class="entrada" id="nota" placeholder="Ej. Almuerzo con amigos" value="${esc(form.nota)}" />
      </div>

      <button class="btn" onclick="App.guardarMov()">${editando ? '💾 Guardar cambios' : '✓ Registrar'}</button>
      <div style="height:14px"></div>
    `;
  });

  // ============================================================
  //  VISTA: DETALLE MOVIMIENTO
  // ============================================================
  registrar('detalle', (params) => {
    const m = Datos.movimiento(Number(params.id));
    if (!m) return `<div class="titulo-pagina"><button class="btn-volver" onclick="history.back()">‹</button><h1>Detalle</h1></div>${estadoVacio('❓', 'No encontrado', 'Este movimiento ya no existe.')}`;
    const cat = Datos.categoria(m.categoriaId) || { nombre: '—', icono: '🏷️', color: '#6B7280' };
    const cta = Datos.cuenta(m.cuentaId);
    return `
      <div class="titulo-pagina"><button class="btn-volver" onclick="history.back()">‹</button><h1>Detalle</h1></div>
      <div class="card" style="text-align:center;padding:26px">
        <div class="ic" style="width:64px;height:64px;border-radius:18px;margin:0 auto 12px;display:grid;place-items:center;font-size:30px;background:${cat.color}22;color:${cat.color}">${cat.icono}</div>
        <p class="monto ${m.tipo === 'Ingreso' ? 'ingreso' : 'gasto'}" style="font-size:34px;font-weight:800;margin:0">${Moneda.conSigno(m.monto, m.tipo)}</p>
        <p style="color:var(--texto-suave);margin:6px 0 0">${esc(cat.nombre)}</p>
      </div>
      <div class="card">
        ${filaDetalle('Tipo', m.tipo)}
        ${filaDetalle('Cuenta', cta ? `${cta.icono} ${cta.nombre}` : '—')}
        ${filaDetalle('Fecha', new Date(m.fecha).toLocaleDateString('es-PE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }))}
        ${filaDetalle('Nota', m.nota || '—')}
      </div>
      <button class="btn secundario" onclick="App.ir('registrar',{id:${m.id}})">✏️ Editar</button>
      <div style="height:10px"></div>
      <button class="btn peligro" onclick="App.eliminarMov(${m.id})">🗑️ Eliminar</button>
    `;
  });
  function filaDetalle(k, v) {
    return `<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--linea)"><span style="color:var(--texto-suave)">${esc(k)}</span><span style="font-weight:600;text-align:right;max-width:60%">${esc(v)}</span></div>`;
  }

  // ============================================================
  //  VISTA: REPORTES
  // ============================================================
  registrar('reportes', () => {
    const r = Datos.resumenMes(refReporte);
    const porCat = Datos.gastoPorCategoria(refReporte);
    const serie = Datos.serieMeses(6);
    const maxSerie = Math.max(1, ...serie.map((s) => s.gastos));
    const ahorro = r.ingresos - r.gastos;
    return `
      <div class="titulo-pagina"><h1>Reportes</h1></div>

      <div class="card" style="display:flex;align-items:center;justify-content:space-between">
        <button class="btn-volver" onclick="App.moverMes(-1)">‹</button>
        <b>${nombreMes(refReporte)}</b>
        <button class="btn-volver" onclick="App.moverMes(1)">›</button>
      </div>

      <div class="duo">
        <div class="mini"><p class="etq">Ingresos</p><p class="val ingreso">${Moneda.fmt(r.ingresos)}</p></div>
        <div class="mini"><p class="etq">Gastos</p><p class="val gasto">${Moneda.fmt(r.gastos)}</p></div>
      </div>
      <div class="card">
        <p class="etq" style="color:var(--texto-suave);margin:0 0 4px">${ahorro >= 0 ? 'Ahorro del mes' : 'Déficit del mes'}</p>
        <p style="font-size:26px;font-weight:800;margin:0;color:${ahorro >= 0 ? 'var(--ingreso)' : 'var(--gasto)'}">${Moneda.fmt(ahorro)}</p>
      </div>

      <div class="seccion-tit"><h2>Últimos 6 meses (gasto)</h2></div>
      <div class="card">
        <div class="barras-mes">
          ${serie.map((s) => `<div class="col"><div class="b" style="height:${Math.round(s.gastos / maxSerie * 100)}%"></div><span class="et">${esc(capitalizar(s.etiqueta))}</span></div>`).join('')}
        </div>
      </div>

      <div class="seccion-tit"><h2>Gasto por categoría</h2></div>
      ${porCat.length ? `<div class="card">${porCat.map((x) => `
        <div class="barra-cat">
          <div class="fila"><span class="izq"><span>${x.categoria.icono}</span> ${esc(x.categoria.nombre)}</span><b>${Moneda.fmt(x.monto)}</b></div>
          <div class="track"><div class="relleno" style="width:${x.pct}%;background:${x.categoria.color}"></div></div>
        </div>`).join('')}</div>`
        : estadoVacio('📊', 'Sin gastos este mes', 'Cuando registres gastos verás aquí en qué se te va el dinero.')}
    `;
  });

  // ============================================================
  //  VISTA: MÁS
  // ============================================================
  registrar('mas', () => `
    <div class="titulo-pagina"><h1>Más</h1></div>
    <div class="seccion-tit"><h2>Módulos</h2></div>
    <div class="opciones">
      ${opcion('🤝', 'Panderos', 'Juntas de ahorro rotativo', "App.ir('panderos')")}
      ${opcion('💸', 'Préstamos', 'Me deben / debo', "App.ir('prestamos')")}
      ${opcion('🎯', 'Metas de ahorro', 'Objetivos con progreso', "App.ir('metas')")}
      ${opcion('🔁', 'Pagos fijos', 'Internet, línea, alquiler, suscripciones', "App.ir('recurrentes')")}
      ${opcion('📅', 'Presupuestos', 'Límites por categoría', "App.ir('presupuestos')")}
    </div>
    <div class="seccion-tit"><h2>Configuración</h2></div>
    <div class="opciones">
      ${opcion('💳', 'Cuentas', 'Efectivo, banco, billeteras', "App.ir('cuentas')")}
      ${opcion('🏷️', 'Categorías', 'Personaliza tus categorías', "App.ir('categorias')")}
      ${opcion('⚙️', 'Ajustes', 'Tema, datos y copia de seguridad', "App.ir('ajustes')")}
    </div>
    <p class="pie-marca">Panderito PWA · v2</p>
  `);
  function opcion(ic, t, s, onclick, deshab) {
    return `<button class="opcion" ${deshab ? 'disabled' : `onclick="${onclick}"`}>
      <span class="ic">${ic}</span><span class="cuerpo"><p class="t">${esc(t)}</p><p class="s">${esc(s)}</p></span>
      ${deshab ? '<span class="fl">🔒</span>' : '<span class="fl">›</span>'}</button>`;
  }

  // ============================================================
  //  VISTA: CUENTAS
  // ============================================================
  const tipoCuentaEtq = (id) => (Datos.TIPOS_CUENTA.find((t) => t.id === id) || { etq: id }).etq;
  registrar('cuentas', () => {
    const ctas = Datos.cuentas(false);
    const total = Datos.saldoTotal();
    return `
      <div class="titulo-pagina"><button class="btn-volver" onclick="App.ir('mas')">‹</button><h1>Cuentas</h1></div>
      <div class="card-saldo"><p class="etq">Saldo total (todas las cuentas)</p><p class="monto">${Moneda.fmt(total)}</p><p class="cuentas-min">Toca una cuenta para editar su saldo o método de pago</p></div>
      <div class="lista">
        ${ctas.map((c) => {
          const saldo = Datos.saldoCuenta(c.id);
          return `<button class="item" onclick="App.ir('cuentaEdit',{id:${c.id}})">
            <span class="ic" style="background:${c.color}22;color:${c.color}">${c.icono}</span>
            <span class="cuerpo"><p class="t">${esc(c.nombre)}</p><p class="s">${esc(tipoCuentaEtq(c.tipo))}</p></span>
            <span class="monto">${Moneda.fmt(saldo)}</span>
          </button>`;
        }).join('')}
      </div>
      <button class="btn" onclick="App.ir('cuentaEdit')">＋ Nueva cuenta</button><div style="height:14px"></div>
    `;
  });
  registrar('cuentaEdit', (params) => {
    const editando = params.id ? Datos.cuenta(Number(params.id)) : null;
    const tipoActual = editando ? editando.tipo : 'Efectivo';
    const conMov = editando ? Datos.cuentaTieneMovimientos(editando.id) : false;
    return `
      <div class="titulo-pagina"><button class="btn-volver" onclick="App.ir('cuentas')">‹</button><h1>${editando ? 'Editar cuenta' : 'Nueva cuenta'}</h1></div>
      <div class="campo"><label>Nombre</label><input class="entrada" id="c-nombre" placeholder="ej. BCP, Ahorros, Yape mamá" value="${editando ? esc(editando.nombre) : ''}" /></div>
      <div class="campo"><label>Método de pago</label>
        <select class="entrada" id="c-tipo">${Datos.TIPOS_CUENTA.map((t) => `<option value="${t.id}" ${tipoActual === t.id ? 'selected' : ''}>${t.icono} ${esc(t.etq)}</option>`).join('')}</select></div>
      <div class="campo"><label>Saldo inicial (S/) — lo que ya tienes ahí</label>
        <input class="entrada" id="c-saldo" type="number" inputmode="decimal" placeholder="0.00" value="${editando ? editando.saldoInicial : ''}" />
        <p style="font-size:12px;color:var(--texto-tenue);margin:6px 2px 0">Pon aquí tu dinero actual (ej. 8000) para empezar a llevar el registro desde ese monto, sin registrar movimientos.</p></div>
      <button class="btn" onclick="App.guardarCuentaForm(${editando ? editando.id : 'null'})">${editando ? '💾 Guardar' : '✓ Crear cuenta'}</button>
      ${editando && !conMov ? `<div style="height:10px"></div><button class="btn peligro" onclick="App.borrarCuenta(${editando.id})">🗑️ Eliminar cuenta</button>` : ''}
      ${editando && conMov ? `<p style="text-align:center;color:var(--texto-tenue);font-size:13px;margin-top:12px">Tiene movimientos; no se puede eliminar (pero sí ajustar su saldo inicial).</p>` : ''}
      <div style="height:14px"></div>
    `;
  });

  // ============================================================
  //  VISTA: CATEGORÍAS
  // ============================================================
  registrar('categorias', () => {
    const gastos = Datos.categorias('Gasto');
    const ingresos = Datos.categorias('Ingreso');
    const bloque = (arr) => `<div class="lista">${arr.map((c) => `
      <div class="item">
        <span class="ic" style="background:${c.color}22;color:${c.color}">${c.icono}</span>
        <span class="cuerpo"><p class="t">${esc(c.nombre)}</p><p class="s">${Datos.categoriaTieneMovimientos(c.id) ? 'En uso' : 'Sin movimientos'}</p></span>
        ${Datos.categoriaTieneMovimientos(c.id) ? '' : `<button class="btn-volver" onclick="App.borrarCategoria(${c.id})">🗑️</button>`}
      </div>`).join('')}</div>`;
    return `
      <div class="titulo-pagina"><button class="btn-volver" onclick="App.ir('mas')">‹</button><h1>Categorías</h1></div>
      <div class="seccion-tit"><h2>Gastos</h2></div>${bloque(gastos)}
      <div class="seccion-tit"><h2>Ingresos</h2></div>${bloque(ingresos)}
    `;
  });

  // ============================================================
  //  VISTA: AJUSTES
  // ============================================================
  registrar('ajustes', () => {
    const tema = localStorage.getItem('panderito.tema') || 'sistema';
    return `
      <div class="titulo-pagina"><button class="btn-volver" onclick="App.ir('mas')">‹</button><h1>Ajustes</h1></div>
      <div class="card">
        <label style="font-weight:600;display:block;margin-bottom:10px">Tema</label>
        <div class="seg">
          <button class="${tema === 'claro' ? 'activo' : ''}" onclick="App.setTema('claro')">☀️ Claro</button>
          <button class="${tema === 'oscuro' ? 'activo' : ''}" onclick="App.setTema('oscuro')">🌙 Oscuro</button>
          <button class="${tema === 'sistema' ? 'activo' : ''}" onclick="App.setTema('sistema')">⚙️ Auto</button>
        </div>
      </div>
      <div class="seccion-tit"><h2>Recordatorios</h2></div>
      <div class="opciones">
        ${opcion('🔔', 'Activar recordatorios', 'Aviso de panderos y pagos por vencer', 'App.activarNotis()')}
        ${opcion('👀', 'Ver pendientes ahora', 'Panderos, pagos y presupuestos', 'App.mostrarPendientesNoti(true)')}
      </div>

      <div class="seccion-tit"><h2>Tus datos</h2></div>
      <div class="opciones">
        ${opcion('⬇️', 'Exportar copia (JSON)', 'Descarga un respaldo de tus datos', 'App.exportarDatos()')}
        ${opcion('🗑️', 'Borrar todo', 'Reinicia la app a cero (no se puede deshacer)', 'App.borrarTodo()')}
      </div>
      <p class="pie-marca">Tus datos se guardan solo en este dispositivo.<br/>Panderito PWA</p>
    `;
  });

  // ---------- Helpers de fecha para módulos ----------
  function diasHasta(iso) { const hoy = new Date(); hoy.setHours(0, 0, 0, 0); const f = new Date(iso); f.setHours(0, 0, 0, 0); return Math.round((f - hoy) / 86400000); }
  function fechaLarga(iso) { return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }); }
  function etiquetaEstadoPrestamo(e) { return { Pendiente: 'Pendiente', Parcial: 'Abono parcial', Pagado: '✓ Pagado' }[e] || e; }
  const FRECUENCIAS = [['Semanal', 'Semanal'], ['Quincenal', 'Quincenal'], ['Mensual', 'Mensual']];
  const opcsFrec = (sel) => FRECUENCIAS.map(([v, t]) => `<option value="${v}" ${sel === v ? 'selected' : ''}>${t}</option>`).join('');

  // ============================================================
  //  PRÉSTAMOS
  // ============================================================
  registrar('prestamos', () => {
    const meDeben = Datos.totalPendientePorTipo('PorCobrar');
    const debo = Datos.totalPendientePorTipo('PorPagar');
    const lista = Datos.prestamos();
    return `
      <div class="titulo-pagina"><button class="btn-volver" onclick="App.ir('mas')">‹</button><h1>Préstamos</h1></div>
      <div class="duo">
        <div class="mini"><p class="etq"><span class="punto ingreso"></span> Me deben</p><p class="val ingreso">${Moneda.fmt(meDeben)}</p></div>
        <div class="mini"><p class="etq"><span class="punto gasto"></span> Yo debo</p><p class="val gasto">${Moneda.fmt(debo)}</p></div>
      </div>
      ${lista.length ? `<div class="lista">${lista.map(itemPrestamo).join('')}</div>` : estadoVacio('🤝', 'Sin préstamos', 'Registra lo que te deben o lo que debes.')}
      <button class="btn" onclick="App.ir('prestamoNuevo')">＋ Nuevo préstamo</button>
      <div style="height:14px"></div>`;
  });
  function itemPrestamo(p) {
    const pend = Datos.saldoPendiente(p);
    const col = p.tipo === 'PorCobrar' ? 'var(--ingreso)' : 'var(--gasto)';
    return `<button class="item" onclick="App.ir('prestamoDet',{id:${p.id}})">
      <span class="ic" style="background:${col}22;color:${col}">${p.tipo === 'PorCobrar' ? '📥' : '📤'}</span>
      <span class="cuerpo"><p class="t">${esc(p.persona)}</p><p class="s">${p.tipo === 'PorCobrar' ? 'Me debe' : 'Le debo'} · ${etiquetaEstadoPrestamo(p.estado)}</p></span>
      <span class="monto">${Moneda.fmt(pend)}</span></button>`;
  }
  registrar('prestamoNuevo', () => `
    <div class="titulo-pagina"><button class="btn-volver" onclick="App.ir('prestamos')">‹</button><h1>Nuevo préstamo</h1></div>
    <div class="campo"><label>Persona</label><input class="entrada" id="p-persona" placeholder="ej. Juan" /></div>
    <div class="campo"><label>Monto (S/)</label><input class="entrada" id="p-monto" type="number" inputmode="decimal" placeholder="0.00" /></div>
    <div class="campo"><label>Tipo</label><select class="entrada" id="p-tipo"><option value="PorCobrar">Me deben (por cobrar)</option><option value="PorPagar">Yo debo (por pagar)</option></select></div>
    <div class="campo"><label>Fecha</label><input class="entrada" id="p-fecha" type="date" value="${hoyInput()}" /></div>
    <div class="campo"><label>Nota (opcional)</label><input class="entrada" id="p-nota" placeholder="Detalle" /></div>
    <button class="btn" onclick="App.guardarPrestamo()">✓ Registrar</button><div style="height:14px"></div>`);
  registrar('prestamoDet', (params) => {
    const p = Datos.prestamo(Number(params.id));
    if (!p) return `<div class="titulo-pagina"><button class="btn-volver" onclick="App.ir('prestamos')">‹</button><h1>Préstamo</h1></div>${estadoVacio('❓', 'No encontrado', '')}`;
    const pend = Datos.saldoPendiente(p);
    const abonos = Datos.abonosDe(p.id);
    return `
      <div class="titulo-pagina"><button class="btn-volver" onclick="App.ir('prestamos')">‹</button><h1>${esc(p.persona)}</h1></div>
      <div class="card" style="text-align:center;padding:24px">
        <p style="color:var(--texto-suave);margin:0">${p.tipo === 'PorCobrar' ? 'Te debe' : 'Le debes'}</p>
        <p style="font-size:32px;font-weight:800;margin:6px 0 0;color:${p.tipo === 'PorCobrar' ? 'var(--ingreso)' : 'var(--gasto)'}">${Moneda.fmt(pend)}</p>
        <p style="color:var(--texto-tenue);margin:6px 0 0;font-size:13px">de ${Moneda.fmt(p.monto)} · ${etiquetaEstadoPrestamo(p.estado)}</p>
      </div>
      ${p.estado !== 'Pagado' ? `<button class="btn" onclick="App.abonarPrestamo(${p.id})">＋ Registrar abono</button><div style="height:8px"></div><button class="btn secundario" onclick="App.pagarPrestamo(${p.id})">✓ Marcar como pagado</button>` : '<div class="card" style="text-align:center;color:var(--ingreso);font-weight:700">✓ Préstamo saldado</div>'}
      <div class="seccion-tit"><h2>Abonos (${abonos.length})</h2></div>
      ${abonos.length ? `<div class="lista">${abonos.map((a) => `<div class="item"><span class="ic" style="background:var(--ingreso)22;color:var(--ingreso)">💵</span><span class="cuerpo"><p class="t">${Moneda.fmt(a.monto)}</p><p class="s">${fechaCorta(a.fecha)}</p></span></div>`).join('')}</div>` : `<p style="color:var(--texto-tenue);text-align:center;padding:12px">Aún no hay abonos.</p>`}
      <div style="height:10px"></div><button class="btn peligro" onclick="App.borrarPrestamo(${p.id})">🗑️ Eliminar préstamo</button>`;
  });

  // ============================================================
  //  PANDEROS
  // ============================================================
  registrar('panderos', () => {
    const lista = Datos.panderos();
    return `
      <div class="titulo-pagina"><button class="btn-volver" onclick="App.ir('mas')">‹</button><h1>Panderos</h1></div>
      ${lista.length ? `<div class="lista">${lista.map(itemPandero).join('')}</div>` : estadoVacio('🤝', 'Sin panderos', 'Crea una junta de ahorro rotativo con tus turnos.')}
      <button class="btn" onclick="App.ir('panderoNuevo')">＋ Nuevo pandero</button><div style="height:14px"></div>`;
  });
  function itemPandero(p) {
    const r = Datos.resumenPandero(p);
    const mi = r.fechaMiTurno ? diasHasta(r.fechaMiTurno) : null;
    const cuando = mi === null ? '' : mi > 0 ? `Me toca en ${mi} día${mi === 1 ? '' : 's'}` : mi === 0 ? '¡Me toca hoy!' : 'Mi turno ya pasó';
    return `<button class="item" onclick="App.ir('panderoDet',{id:${p.id}})">
      <span class="ic" style="background:var(--primary)22;color:var(--primary)">🤝</span>
      <span class="cuerpo"><p class="t">${esc(p.nombre)}</p><p class="s">${p.numParticipantes} pers. · ${Moneda.fmt(p.cuotaMonto)}/${p.frecuencia.toLowerCase()} · ${cuando} · ${r.turnosCobrados}/${r.totalTurnos} cobrados</p></span>
      <span class="monto" style="color:var(--primary)">${Moneda.fmt(r.montoARecibir)}</span></button>`;
  }
  registrar('panderoNuevo', () => `
    <div class="titulo-pagina"><button class="btn-volver" onclick="App.ir('panderos')">‹</button><h1>Nuevo pandero</h1></div>
    <div class="campo"><label>Nombre</label><input class="entrada" id="pa-nombre" placeholder="ej. Junta de la oficina" /></div>
    <div class="campo"><label>N.º de participantes</label><input class="entrada" id="pa-num" type="number" inputmode="numeric" value="10" /></div>
    <div class="campo"><label>Cuota (S/)</label><input class="entrada" id="pa-cuota" type="number" inputmode="decimal" placeholder="0.00" /></div>
    <div class="campo"><label>Frecuencia</label><select class="entrada" id="pa-frec">${opcsFrec('Mensual')}</select></div>
    <div class="campo"><label>Fecha de inicio</label><input class="entrada" id="pa-inicio" type="date" value="${hoyInput()}" /></div>
    <div class="campo"><label>Mi turno (posición)</label><input class="entrada" id="pa-turno" type="number" inputmode="numeric" value="1" /></div>
    <div class="campo"><label>Nombres de participantes (opcional)</label>
      <textarea class="entrada" id="pa-nombres" placeholder="Un nombre por línea, en orden de turno:&#10;Juan Pérez&#10;María López&#10;Yo&#10;…"></textarea>
      <p style="font-size:12px;color:var(--texto-tenue);margin:6px 2px 0">Cada línea es un turno, en orden. Deja en blanco para autogenerar. Podrás editar cada nombre y DNI después.</p></div>
    <button class="btn" onclick="App.guardarPandero()">✓ Crear con turnos</button><div style="height:14px"></div>`);
  registrar('panderoDet', (params) => {
    const p = Datos.pandero(Number(params.id));
    if (!p) return `<div class="titulo-pagina"><button class="btn-volver" onclick="App.ir('panderos')">‹</button><h1>Pandero</h1></div>${estadoVacio('❓', 'No encontrado', '')}`;
    const r = Datos.resumenPandero(p);
    const turnos = Datos.turnosDe(p.id);
    const mi = r.fechaMiTurno ? diasHasta(r.fechaMiTurno) : null;
    return `
      <div class="titulo-pagina"><button class="btn-volver" onclick="App.ir('panderos')">‹</button><h1>${esc(p.nombre)}</h1></div>
      <div class="card-saldo"><p class="etq">Cuándo me toca</p><p class="monto" style="font-size:24px">${r.fechaMiTurno ? fechaLarga(r.fechaMiTurno) : '—'}</p><p class="cuentas-min">${mi === null ? '' : mi > 0 ? `en ${mi} días` : mi === 0 ? '¡hoy!' : 'ya pasó'} · recibiré ${Moneda.fmt(r.montoARecibir)}</p></div>
      <div class="duo">
        <div class="mini"><p class="etq">Aportado</p><p class="val">${Moneda.fmt(r.aportado)}</p></div>
        <div class="mini"><p class="etq">Turnos cobrados</p><p class="val">${r.turnosCobrados}/${r.totalTurnos}</p></div>
      </div>
      <div class="card">
        ${filaDetalle('Pozo por ronda (lo que recibes)', Moneda.fmt(r.montoARecibir))}
        ${filaDetalle('Cuota', Moneda.fmt(p.cuotaMonto) + ' / ' + p.frecuencia.toLowerCase())}
        ${filaDetalle('Participantes', String(p.numParticipantes))}
        ${filaDetalle('Total que aportarás', Moneda.fmt(p.cuotaMonto * p.numParticipantes))}
      </div>
      <button class="btn" onclick="App.pagarCuota(${p.id})">💸 Pagar cuota del mes (${Moneda.fmt(p.cuotaMonto)})</button>
      <div style="height:8px"></div>
      <button class="btn secundario" onclick="App.cobrarPozo(${p.id})">📥 Cobrar el pozo (${Moneda.fmt(r.montoARecibir)})</button>
      <p style="font-size:12px;color:var(--texto-tenue);text-align:center;margin:8px 2px 0">Pagar cuota lo registra como gasto (resta del saldo). Cobrar el pozo lo registra como ingreso (suma al saldo).</p>
      <div class="seccion-tit"><h2>Turnos</h2><span style="font-size:12px;color:var(--texto-tenue)">✏️ edita nombre/DNI</span></div>
      <div class="lista">${turnos.map((t) => `<div class="item"><span class="ic" style="background:${t.numeroTurno === p.miTurno ? 'var(--primary)22;color:var(--primary)' : 'var(--linea);color:var(--texto-suave)'}">${t.numeroTurno}</span><span class="cuerpo"><p class="t">${esc(t.nombreParticipante)}${t.numeroTurno === p.miTurno ? ' ⭐' : ''}</p><p class="s">${fechaLarga(t.fechaCobro)}${t.dni ? ' · DNI ' + esc(t.dni) : ''}</p></span><button class="btn-volver" onclick="App.editarTurno(${t.id})">✏️</button><button class="btn chico ${t.cobrado ? '' : 'secundario'}" style="margin-left:6px" onclick="App.cobrarTurno(${p.id},${t.id},${!t.cobrado})">${t.cobrado ? '✓' : 'Marcar'}</button></div>`).join('')}</div>
      <div style="height:10px"></div><button class="btn peligro" onclick="App.borrarPandero(${p.id})">🗑️ Eliminar pandero</button>`;
  });

  // ============================================================
  //  METAS DE AHORRO
  // ============================================================
  registrar('metas', () => {
    const lista = Datos.metas();
    return `
      <div class="titulo-pagina"><button class="btn-volver" onclick="App.ir('mas')">‹</button><h1>Metas de ahorro</h1></div>
      ${lista.length ? lista.map(tarjetaMeta).join('') : estadoVacio('🎯', 'Sin metas', 'Define un objetivo de ahorro y sigue tu progreso.')}
      <button class="btn" onclick="App.ir('metaNueva')">＋ Nueva meta</button><div style="height:14px"></div>`;
  });
  function tarjetaMeta(m) {
    const pct = Math.min(100, m.montoMeta > 0 ? m.montoActual / m.montoMeta * 100 : 0);
    const lograda = m.montoActual >= m.montoMeta && m.montoMeta > 0;
    return `<div class="card">
      <div class="fila" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <b>🎯 ${esc(m.nombre)}</b><span style="font-size:13px;color:var(--texto-suave)">${Math.round(pct)}%</span>
      </div>
      <div class="track" style="height:12px;border-radius:999px;background:var(--linea);overflow:hidden"><div class="relleno" style="height:100%;width:${pct}%;background:${lograda ? 'var(--ingreso)' : 'var(--primary)'}"></div></div>
      <p style="font-size:13px;color:var(--texto-suave);margin:8px 0 0">${Moneda.fmt(m.montoActual)} de ${Moneda.fmt(m.montoMeta)}${lograda ? ' · ¡Lograda! 🎉' : ''}</p>
      <div class="acciones-agente" style="display:flex;gap:8px;margin-top:12px">
        <button class="btn chico" onclick="App.abonarMeta(${m.id})">＋ Abonar</button>
        <button class="btn chico secundario" onclick="App.borrarMeta(${m.id})">🗑️ Eliminar</button>
      </div></div>`;
  }
  registrar('metaNueva', () => `
    <div class="titulo-pagina"><button class="btn-volver" onclick="App.ir('metas')">‹</button><h1>Nueva meta</h1></div>
    <div class="campo"><label>Nombre</label><input class="entrada" id="m-nombre" placeholder="ej. Viaje a Cusco" /></div>
    <div class="campo"><label>Monto meta (S/)</label><input class="entrada" id="m-meta" type="number" inputmode="decimal" placeholder="0.00" /></div>
    <div class="campo"><label>Ya tengo ahorrado (opcional)</label><input class="entrada" id="m-actual" type="number" inputmode="decimal" placeholder="0.00" /></div>
    <div class="campo"><label>Fecha objetivo (opcional)</label><input class="entrada" id="m-fecha" type="date" /></div>
    <button class="btn" onclick="App.guardarMeta()">✓ Crear meta</button><div style="height:14px"></div>`);

  // ============================================================
  //  RECURRENTES
  // ============================================================
  registrar('recurrentes', () => {
    const lista = Datos.recurrentes();
    return `
      <div class="titulo-pagina"><button class="btn-volver" onclick="App.ir('mas')">‹</button><h1>Pagos fijos</h1></div>
      ${lista.length ? `<div class="lista">${lista.map(itemRecurrente).join('')}</div>` : estadoVacio('🔁', 'Sin pagos fijos', 'Agrega pagos que se repiten: internet, línea celular, alquiler, servicios, suscripciones.')}
      <button class="btn" onclick="App.ir('recurrenteNuevo')">＋ Nuevo pago fijo</button><div style="height:14px"></div>`;
  });
  function itemRecurrente(r) {
    const cat = Datos.categoria(r.categoriaId) || { icono: '🔁', color: '#6B7280' };
    const d = diasHasta(r.proximaFecha);
    const vence = d < 0 ? `Vencido hace ${-d} día${d === -1 ? '' : 's'}` : d === 0 ? 'Vence hoy' : `Vence en ${d} día${d === 1 ? '' : 's'}`;
    return `<div class="item">
      <span class="ic" style="background:${cat.color}22;color:${cat.color}">${cat.icono}</span>
      <span class="cuerpo"><p class="t">${esc(r.nombre)}${r.proveedor ? ' · ' + esc(r.proveedor) : ''}</p><p class="s">${Moneda.fmt(r.monto)} · ${r.frecuencia.toLowerCase()} · ${vence}</p></span>
      <button class="btn chico" onclick="App.pagarRecurrente(${r.id})">Pagar</button>
      <button class="btn-volver" style="margin-left:6px" onclick="App.borrarRecurrente(${r.id})">🗑️</button></div>`;
  }
  registrar('recurrenteNuevo', () => {
    const cats = Datos.categorias('Gasto');
    const ctas = Datos.cuentas(true);
    return `
      <div class="titulo-pagina"><button class="btn-volver" onclick="App.ir('recurrentes')">‹</button><h1>Nuevo pago fijo</h1></div>
      <div class="campo"><label>Concepto</label><input class="entrada" id="r-nombre" placeholder="ej. Internet, Línea celular, Netflix" /></div>
      <div class="campo"><label>Proveedor / detalle (opcional)</label><input class="entrada" id="r-prov" placeholder="ej. Movistar, Claro, dueño del depa" /></div>
      <div class="campo"><label>Monto (S/)</label><input class="entrada" id="r-monto" type="number" inputmode="decimal" placeholder="0.00" /></div>
      <div class="campo"><label>Categoría</label><select class="entrada" id="r-cat">${cats.map((c) => `<option value="${c.id}">${c.icono} ${esc(c.nombre)}</option>`).join('')}</select></div>
      <div class="campo"><label>Cuenta</label><select class="entrada" id="r-cuenta">${ctas.map((c) => `<option value="${c.id}">${c.icono} ${esc(c.nombre)}</option>`).join('')}</select></div>
      <div class="campo"><label>Frecuencia</label><select class="entrada" id="r-frec">${opcsFrec('Mensual')}</select></div>
      <div class="campo"><label>Próximo pago</label><input class="entrada" id="r-fecha" type="date" value="${hoyInput()}" /></div>
      <button class="btn" onclick="App.guardarRecurrente()">✓ Guardar</button><div style="height:14px"></div>`;
  });

  // ============================================================
  //  PRESUPUESTOS
  // ============================================================
  registrar('presupuestos', () => {
    const lista = Datos.presupuestos();
    return `
      <div class="titulo-pagina"><button class="btn-volver" onclick="App.ir('mas')">‹</button><h1>Presupuestos</h1></div>
      ${lista.length ? lista.map(tarjetaPresupuesto).join('') : estadoVacio('📅', 'Sin presupuestos', 'Pon un límite de gasto por categoría y te avisamos al 80% y 100%.')}
      <button class="btn" onclick="App.ir('presupuestoNuevo')">＋ Nuevo presupuesto</button><div style="height:14px"></div>`;
  });
  function tarjetaPresupuesto(p) {
    const cat = Datos.categoria(p.categoriaId) || { nombre: '—', icono: '🏷️', color: '#6B7280' };
    const av = Datos.avancePresupuesto(p);
    const color = av.nivel === 'Excedido' ? 'var(--gasto)' : av.nivel === 'Alerta' ? 'var(--pendiente)' : 'var(--ingreso)';
    const aviso = av.nivel === 'Excedido' ? '🔴 Excedido' : av.nivel === 'Alerta' ? '🟡 Cerca del límite' : '🟢 En control';
    return `<div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <b>${cat.icono} ${esc(cat.nombre)}</b><span style="font-size:12px;color:${color};font-weight:700">${aviso}</span>
      </div>
      <div class="track" style="height:12px;border-radius:999px;background:var(--linea);overflow:hidden"><div style="height:100%;width:${Math.min(100, av.pct)}%;background:${color}"></div></div>
      <p style="font-size:13px;color:var(--texto-suave);margin:8px 0 0">${Moneda.fmt(av.gastado)} de ${Moneda.fmt(av.limite)} · ${p.periodo.toLowerCase()} · ${Math.round(av.pct)}%</p>
      <div style="margin-top:10px"><button class="btn chico secundario" onclick="App.borrarPresupuesto(${p.id})">🗑️ Eliminar</button></div>
    </div>`;
  }
  registrar('presupuestoNuevo', () => {
    const cats = Datos.categorias('Gasto');
    return `
      <div class="titulo-pagina"><button class="btn-volver" onclick="App.ir('presupuestos')">‹</button><h1>Nuevo presupuesto</h1></div>
      <div class="campo"><label>Categoría</label><select class="entrada" id="b-cat">${cats.map((c) => `<option value="${c.id}">${c.icono} ${esc(c.nombre)}</option>`).join('')}</select></div>
      <div class="campo"><label>Límite (S/)</label><input class="entrada" id="b-monto" type="number" inputmode="decimal" placeholder="0.00" /></div>
      <div class="campo"><label>Período</label><select class="entrada" id="b-periodo">${opcsFrec('Mensual')}</select></div>
      <p style="font-size:13px;color:var(--texto-tenue);margin:0 2px 14px">Se te avisará al llegar al 80% y al 100% del límite en el período.</p>
      <button class="btn" onclick="App.guardarPresupuesto()">✓ Guardar</button><div style="height:14px"></div>`;
  });

  // ============================================================
  //  ACCIONES
  // ============================================================
  const acciones = {
    ir,
    filtrarHist(tipo) { filtroHist.tipo = tipo; render(); },
    moverMes(delta) { refReporte = new Date(refReporte.getFullYear(), refReporte.getMonth() + delta, 1); render(); },
    setTipo(t) { form.tipo = t; form.categoriaId = null; render(); sincronizarInputsForm(); },
    setCategoria(id) { leerInputsForm(); form.categoriaId = id; render(); sincronizarInputsForm(); },
    guardarMov() {
      leerInputsForm();
      const monto = parseFloat(form.monto);
      if (!monto || monto <= 0) return toast('Ingresa un monto válido');
      if (!form.categoriaId) return toast('Elige una categoría');
      if (!form.cuentaId) return toast('Elige una cuenta');
      Datos.guardarMovimiento({
        id: form.id, monto, tipo: form.tipo,
        categoriaId: form.categoriaId, cuentaId: Number(form.cuentaId),
        fecha: new Date(form.fecha + 'T12:00:00').toISOString(), nota: form.nota || '',
      });
      const editaba = !!form.id;
      form = {};
      toast(editaba ? 'Cambios guardados ✓' : 'Movimiento registrado ✓');
      ir('inicio');
    },
    eliminarMov(id) {
      if (!confirm('¿Eliminar este movimiento? No se puede deshacer.')) return;
      Datos.eliminarMovimiento(id); toast('Movimiento eliminado'); ir('movimientos');
    },
    nuevaCuenta() {
      const nombre = prompt('Nombre de la cuenta (ej. BCP, Yape, Ahorros):');
      if (!nombre) return;
      const saldo = parseFloat(prompt('Saldo inicial (S/):', '0')) || 0;
      Datos.guardarCuenta({ nombre: nombre.trim(), tipo: 'Otra', saldoInicial: saldo, icono: '🏦', color: '#6D5AE6', activa: true });
      toast('Cuenta creada ✓'); render();
    },
    borrarCategoria(id) {
      if (!confirm('¿Eliminar esta categoría?')) return;
      if (Datos.eliminarCategoria(id)) { toast('Categoría eliminada'); render(); }
      else toast('No se puede: tiene movimientos');
    },
    // ----- Préstamos -----
    guardarPrestamo() {
      const gv = (id) => (document.getElementById(id)?.value || '').trim();
      const persona = gv('p-persona'); const monto = parseFloat(gv('p-monto'));
      if (!persona) return toast('Escribe el nombre de la persona');
      if (!monto || monto <= 0) return toast('Ingresa un monto válido');
      Datos.guardarPrestamo({ persona, monto, tipo: gv('p-tipo'), fecha: new Date(gv('p-fecha') + 'T12:00:00').toISOString(), nota: gv('p-nota'), estado: 'Pendiente' });
      toast('Préstamo registrado ✓'); ir('prestamos');
    },
    abonarPrestamo(id) {
      const p = Datos.prestamo(id); if (!p) return;
      const pend = Datos.saldoPendiente(p);
      const v = prompt(`¿Cuánto abona? (pendiente: ${Moneda.fmt(pend)})`, '');
      const monto = parseFloat(v); if (!monto || monto <= 0) return;
      Datos.registrarAbono(id, monto); toast('Abono registrado ✓'); render();
    },
    pagarPrestamo(id) { if (!confirm('¿Marcar como totalmente pagado?')) return; Datos.marcarPagadoPrestamo(id); toast('Préstamo saldado ✓'); render(); },
    borrarPrestamo(id) { if (!confirm('¿Eliminar este préstamo y sus abonos?')) return; Datos.eliminarPrestamo(id); toast('Préstamo eliminado'); ir('prestamos'); },

    // ----- Panderos -----
    guardarPandero() {
      const gv = (id) => (document.getElementById(id)?.value || '').trim();
      const nombre = gv('pa-nombre'); const num = parseInt(gv('pa-num'), 10); const cuota = parseFloat(gv('pa-cuota')); const turno = parseInt(gv('pa-turno'), 10) || 1;
      if (!nombre) return toast('Escribe un nombre');
      if (!num || num < 2) return toast('Debe haber al menos 2 participantes');
      if (!cuota || cuota <= 0) return toast('Ingresa la cuota');
      if (turno < 1 || turno > num) return toast('Tu turno debe estar entre 1 y ' + num);
      const nombres = (document.getElementById('pa-nombres')?.value || '').split('\n').map((s) => s.trim());
      Datos.crearPanderoConTurnos({ nombre, numParticipantes: num, cuotaMonto: cuota, frecuencia: gv('pa-frec'), fechaInicio: new Date(gv('pa-inicio') + 'T12:00:00').toISOString(), miTurno: turno, activo: true }, nombres);
      toast('Pandero creado ✓'); ir('panderos');
    },
    cobrarTurno(panderoId, turnoId, cobrado) { Datos.marcarCobrado(turnoId, cobrado); render(); },
    editarTurno(turnoId) {
      const t = Datos.cargar().turnos.find((x) => x.id === turnoId); if (!t) return;
      const nombre = prompt('Nombre del participante (quién se lleva este turno):', t.nombreParticipante || '');
      if (nombre === null) return;
      const dni = prompt('DNI (opcional):', t.dni || '');
      Datos.actualizarTurno(turnoId, { nombreParticipante: nombre.trim() || t.nombreParticipante, dni: (dni || '').trim() });
      toast('Participante actualizado ✓'); render();
    },
    // ----- Cuentas -----
    guardarCuentaForm(id) {
      const gv = (x) => (document.getElementById(x)?.value || '').trim();
      const nombre = gv('c-nombre'); const tipo = gv('c-tipo'); const saldo = parseFloat(gv('c-saldo')) || 0;
      if (!nombre) return toast('Escribe un nombre');
      const t = Datos.TIPOS_CUENTA.find((x) => x.id === tipo) || Datos.TIPOS_CUENTA[0];
      Datos.guardarCuenta({ id: id || null, nombre, tipo, saldoInicial: saldo, icono: t.icono, color: t.color, activa: true });
      toast(id ? 'Cuenta actualizada ✓' : 'Cuenta creada ✓'); ir('cuentas');
    },
    borrarCuenta(id) {
      if (!confirm('¿Eliminar esta cuenta?')) return;
      if (Datos.eliminarCuenta(id)) { toast('Cuenta eliminada'); ir('cuentas'); } else toast('No se puede: tiene movimientos');
    },
    borrarPandero(id) { if (!confirm('¿Eliminar este pandero y sus turnos?')) return; Datos.eliminarPandero(id); toast('Pandero eliminado'); ir('panderos'); },
    pagarCuota(id) {
      const p = Datos.pandero(id); if (!p) return;
      if (!confirm(`¿Registrar el pago de tu cuota (${Moneda.fmt(p.cuotaMonto)}) como gasto? Se descontará de tu saldo.`)) return;
      Datos.pagarCuotaPandero(id); toast('Cuota pagada y descontada ✓'); render();
    },
    cobrarPozo(id) {
      const p = Datos.pandero(id); if (!p) return;
      const r = Datos.resumenPandero(p);
      if (!confirm(`¿Registrar el cobro del pozo (${Moneda.fmt(r.montoARecibir)}) como ingreso? Se sumará a tu saldo.`)) return;
      Datos.cobrarPozoPandero(id); toast('¡Pozo cobrado y sumado! 🎉'); render();
    },

    // ----- Metas -----
    guardarMeta() {
      const gv = (id) => (document.getElementById(id)?.value || '').trim();
      const nombre = gv('m-nombre'); const metaMonto = parseFloat(gv('m-meta')); const actual = parseFloat(gv('m-actual')) || 0; const fecha = gv('m-fecha');
      if (!nombre) return toast('Escribe un nombre');
      if (!metaMonto || metaMonto <= 0) return toast('Ingresa el monto meta');
      Datos.guardarMeta({ nombre, montoMeta: metaMonto, montoActual: actual, fechaMeta: fecha ? new Date(fecha + 'T12:00:00').toISOString() : null });
      toast('Meta creada ✓'); ir('metas');
    },
    abonarMeta(id) {
      const m = Datos.meta(id); if (!m) return;
      const v = prompt(`¿Cuánto abonas a «${m.nombre}»?`, ''); const monto = parseFloat(v);
      if (!monto || monto <= 0) return;
      Datos.abonarMeta(id, monto); toast('¡Abono a tu meta! 🎯'); render();
    },
    borrarMeta(id) { if (!confirm('¿Eliminar esta meta?')) return; Datos.eliminarMeta(id); toast('Meta eliminada'); render(); },

    // ----- Recurrentes -----
    guardarRecurrente() {
      const gv = (id) => (document.getElementById(id)?.value || '').trim();
      const nombre = gv('r-nombre'); const monto = parseFloat(gv('r-monto'));
      if (!nombre) return toast('Escribe un nombre');
      if (!monto || monto <= 0) return toast('Ingresa el monto');
      Datos.guardarRecurrente({ nombre, proveedor: gv('r-prov'), monto, categoriaId: Number(gv('r-cat')), cuentaId: Number(gv('r-cuenta')), frecuencia: gv('r-frec'), proximaFecha: new Date(gv('r-fecha') + 'T12:00:00').toISOString(), activo: true });
      toast('Pago fijo guardado ✓'); ir('recurrentes');
    },
    pagarRecurrente(id) {
      const r = Datos.recurrente(id); if (!r) return;
      if (!confirm(`¿Registrar el pago de «${r.nombre}» (${Moneda.fmt(r.monto)}) y avanzar la fecha?`)) return;
      Datos.registrarPagoRecurrente(id); toast('Pago registrado ✓'); render();
    },
    borrarRecurrente(id) { if (!confirm('¿Eliminar este recurrente?')) return; Datos.eliminarRecurrente(id); toast('Recurrente eliminado'); render(); },

    // ----- Presupuestos -----
    guardarPresupuesto() {
      const gv = (id) => (document.getElementById(id)?.value || '').trim();
      const cat = Number(gv('b-cat')); const limite = parseFloat(gv('b-monto'));
      if (!cat) return toast('Elige una categoría');
      if (!limite || limite <= 0) return toast('Ingresa el límite');
      Datos.guardarPresupuesto({ categoriaId: cat, montoLimite: limite, periodo: gv('b-periodo') });
      toast('Presupuesto guardado ✓'); ir('presupuestos');
    },
    borrarPresupuesto(id) { if (!confirm('¿Eliminar este presupuesto?')) return; Datos.eliminarPresupuesto(id); toast('Presupuesto eliminado'); render(); },

    async activarNotis() {
      if (!('Notification' in window)) return toast('Tu navegador no soporta notificaciones');
      const perm = await Notification.requestPermission();
      if (perm === 'granted') { toast('Recordatorios activados 🔔'); acciones.mostrarPendientesNoti(true); }
      else toast('Permiso de notificaciones denegado');
    },
    mostrarPendientesNoti(forzar) {
      const pend = Datos.pendientes(7);
      if (!('Notification' in window) || Notification.permission !== 'granted') {
        if (forzar) return toast(pend.length ? `Tienes ${pend.length} pendiente(s). Activa recordatorios para avisos.` : 'Sin pendientes por ahora ✓');
        return;
      }
      if (!pend.length) { if (forzar) toast('Sin pendientes por ahora ✓'); return; }
      const hoyClave = new Date().toDateString();
      if (!forzar && localStorage.getItem('panderito.noti.dia') === hoyClave) return;
      localStorage.setItem('panderito.noti.dia', hoyClave);
      const p0 = pend[0];
      try {
        new Notification(`Panderito — ${pend.length} pendiente${pend.length === 1 ? '' : 's'}`, {
          body: `${p0.emo} ${p0.titulo} (${p0.detalle})`, icon: 'icons/panderito-icon.svg', tag: 'panderito-pendientes',
        });
      } catch (e) { /* algunos navegadores requieren SW para notificar */ }
    },
    setTema(t) { aplicarTema(t); render(); },
    exportarDatos() {
      const blob = new Blob([Datos.exportar()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'panderito-respaldo.json'; a.click();
      URL.revokeObjectURL(url); toast('Copia descargada ✓');
    },
    borrarTodo() {
      if (!confirm('¿Borrar TODOS tus datos y empezar de cero? No se puede deshacer.')) return;
      Datos.reiniciar(); toast('Datos reiniciados'); ir('inicio');
    },
  };

  // ---------- Sincronización de inputs del formulario de registro ----------
  function leerInputsForm() {
    const m = document.getElementById('monto'); if (m) form.monto = m.value;
    const c = document.getElementById('cuenta'); if (c) form.cuentaId = Number(c.value);
    const f = document.getElementById('fecha'); if (f) form.fecha = f.value;
    const n = document.getElementById('nota'); if (n) form.nota = n.value;
  }
  function sincronizarInputsForm() {
    const m = document.getElementById('monto'); if (m) m.value = form.monto || '';
  }

  // ---------- Tema ----------
  function aplicarTema(t) {
    localStorage.setItem('panderito.tema', t);
    let efectivo = t;
    if (t === 'sistema') efectivo = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
    document.documentElement.setAttribute('data-tema', efectivo);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', efectivo === 'oscuro' ? '#15171F' : '#6D5AE6');
  }

  // ---------- Instalación PWA ----------
  let promptInstalar = null;
  function configurarBannerInstalar() {
    const banner = document.getElementById('banner-instalar');
    const btn = document.getElementById('btn-instalar');
    if (!banner) return;
    if (promptInstalar) banner.classList.add('ver');
    if (btn) btn.onclick = async () => {
      if (!promptInstalar) return;
      promptInstalar.prompt();
      await promptInstalar.userChoice;
      promptInstalar = null; banner.classList.remove('ver');
    };
  }
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); promptInstalar = e; configurarBannerInstalar();
  });

  // ---------- Arranque ----------
  function iniciar() {
    aplicarTema(localStorage.getItem('panderito.tema') || 'sistema');
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if ((localStorage.getItem('panderito.tema') || 'sistema') === 'sistema') aplicarTema('sistema');
    });
    document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => {
      if (t.dataset.ruta === 'registrar') form = {};
      ir(t.dataset.ruta);
    }));
    window.addEventListener('hashchange', () => { if (!location.hash.startsWith('#registrar')) form = {}; render(); });
    render();
    try { acciones.mostrarPendientesNoti(false); } catch (e) { /* noop */ }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW no registrado:', e));
    }
  }

  return { ...acciones, ir, iniciar, render };
})();

document.addEventListener('DOMContentLoaded', App.iniciar);
