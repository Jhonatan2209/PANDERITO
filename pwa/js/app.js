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
    const mapa = { inicio: 'inicio', movimientos: 'movimientos', registrar: 'registrar', reportes: 'reportes', mas: 'mas', cuentas: 'mas', categorias: 'mas', ajustes: 'mas', detalle: 'movimientos' };
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

      <div class="card-saldo">
        <p class="etq">Saldo total</p>
        <p class="monto">${Moneda.fmt(total)}</p>
        <p class="cuentas-min">${ctas.length} cuenta${ctas.length === 1 ? '' : 's'} · toca «Más» para gestionarlas</p>
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
    <div class="opciones">
      ${opcion('💳', 'Cuentas', 'Efectivo, banco, billeteras', "App.ir('cuentas')")}
      ${opcion('🏷️', 'Categorías', 'Personaliza tus categorías', "App.ir('categorias')")}
      ${opcion('⚙️', 'Ajustes', 'Tema, datos y copia de seguridad', "App.ir('ajustes')")}
    </div>
    <div class="seccion-tit"><h2>Próximamente</h2></div>
    <div class="opciones" style="opacity:.6">
      ${opcion('🤝', 'Panderos', 'Juntas de ahorro rotativo', '', true)}
      ${opcion('💸', 'Préstamos', 'Me deben / debo', '', true)}
      ${opcion('🎯', 'Metas de ahorro', 'Objetivos con progreso', '', true)}
      ${opcion('🔁', 'Recurrentes', 'Pagos que se repiten', '', true)}
      ${opcion('📅', 'Presupuestos', 'Límites por categoría', '', true)}
    </div>
    <p class="pie-marca">Panderito PWA · v1</p>
  `);
  function opcion(ic, t, s, onclick, deshab) {
    return `<button class="opcion" ${deshab ? 'disabled' : `onclick="${onclick}"`}>
      <span class="ic">${ic}</span><span class="cuerpo"><p class="t">${esc(t)}</p><p class="s">${esc(s)}</p></span>
      ${deshab ? '<span class="fl">🔒</span>' : '<span class="fl">›</span>'}</button>`;
  }

  // ============================================================
  //  VISTA: CUENTAS
  // ============================================================
  registrar('cuentas', () => {
    const ctas = Datos.cuentas(false);
    return `
      <div class="titulo-pagina"><button class="btn-volver" onclick="App.ir('mas')">‹</button><h1>Cuentas</h1></div>
      <div class="lista">
        ${ctas.map((c) => {
          const saldo = Datos.saldoCuenta(c.id);
          const bloq = Datos.cuentaTieneMovimientos(c.id);
          return `<div class="item">
            <span class="ic" style="background:${c.color}22;color:${c.color}">${c.icono}</span>
            <span class="cuerpo"><p class="t">${esc(c.nombre)}</p><p class="s">${esc(c.tipo)}${bloq ? ' · con movimientos' : ''}</p></span>
            <span class="monto">${Moneda.fmt(saldo)}</span>
          </div>`;
        }).join('')}
      </div>
      <button class="btn" onclick="App.nuevaCuenta()">＋ Nueva cuenta</button>
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
      <div class="seccion-tit"><h2>Tus datos</h2></div>
      <div class="opciones">
        ${opcion('⬇️', 'Exportar copia (JSON)', 'Descarga un respaldo de tus datos', 'App.exportarDatos()')}
        ${opcion('🗑️', 'Borrar todo', 'Reinicia la app a cero (no se puede deshacer)', 'App.borrarTodo()')}
      </div>
      <p class="pie-marca">Tus datos se guardan solo en este dispositivo.<br/>Panderito PWA</p>
    `;
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

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW no registrado:', e));
    }
  }

  return { ...acciones, ir, iniciar, render };
})();

document.addEventListener('DOMContentLoaded', App.iniciar);
