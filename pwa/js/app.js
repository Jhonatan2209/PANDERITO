/* ============================================================
   Panderito PWA — aplicación (router + vistas)
   SPA sin dependencias. Replica las pantallas de la app MAUI.

   CÓMO FUNCIONA:
   - Router por hash: la URL lleva la pantalla actual (#inicio,
     #registrar, #panderoDet?id=5, ...). Cada vista se registra con
     registrar('nombre', fn) donde fn devuelve el HTML de la pantalla.
   - render() lee el hash, ejecuta la vista y pinta el resultado en
     <main id="app">. Después de cualquier cambio de datos se vuelve
     a llamar a render() para refrescar la pantalla.
   - Los botones del HTML llaman a acciones públicas vía onclick
     ("App.guardarMov()", "App.ir('cuentas')", etc.) — están en el
     objeto `acciones` casi al final del archivo.
   - Los datos SIEMPRE se leen/escriben a través de `Datos` (datos.js).

   INSTRUCCIONES para agregar una pantalla nueva:
   1) registrar('miRuta', (params) => `...html...`)
   2) agrega 'miRuta' al mapa de marcarTab() (qué pestaña se ilumina)
   3) navega hacia ella con App.ir('miRuta') o href="#miRuta"
   4) si necesita botones, agrega sus funciones al objeto `acciones`.
   ============================================================ */

const App = (() => {
  // Contenedor donde se pinta cada vista (el <main id="app"> del index.html)
  const cont = () => document.getElementById('app');

  // ---------- Versión y novedades ----------
  // AL PUBLICAR UNA VERSIÓN NUEVA: (1) sube CACHE en sw.js, (2) sube VERSION aquí
  // (mismo número) y (3) escribe en NOVEDADES lo importante para el usuario, en
  // lenguaje simple ("ahora puedes…"). El Inicio muestra la tarjeta «Novedades»
  // UNA sola vez por versión (se recuerda en localStorage al tocar «Entendido»).
  // Si una versión no trae nada que contar, deja NOVEDADES vacío y no se muestra.
  const VERSION = 'v10';
  const NOVEDADES = [
    '🤝 <b>Panderos para el grupo</b>: en cada pandero, marca quién ya pagó la cuota de la ronda y comparte la <b>situación como imagen</b> 🖼️ o texto 💬 al WhatsApp del grupo (quién cobra, quién pagó, quién falta).',
    '💼 <b>Nuevo módulo Trabajo</b> (Más → Trabajo): registra tu sueldo (mensual, por día o por hora) y tus días de trabajo; el calendario se prende y apaga con un toque y verás cuánto llevas ganado cada día. En el Inicio aparece la caja <b>Posibles ingresos</b>; cuando te paguen, «Ya me pagaron» lo convierte en ingreso real.',
    '🙋 <b>Perfil</b> (Más → Perfil): ponle tu nombre para que Panderito te salude, y tu profesión (lista o «Otro»). Opcional.',
    '📤 <b>Compartir por WhatsApp</b>: en Movimientos, toca «Hoy», «Esta semana» o «Este mes» para enviar un resumen con formato de tus gastos, ingresos o ambos.',
    '🕗 Las fechas ya salen bien de noche: antes, después de las 7 pm el gasto se guardaba con la fecha de mañana.',
    '⬆️ Ajustes → <b>Restaurar copia</b>: recupera tus datos desde un respaldo JSON (cambio de celular, etc.).',
    '🔢 Puedes escribir montos con coma: <b>12,50</b> o <b>1,234.50</b>.',
    '🤝 Panderos: «Pagar cuota» marca la ronda y «Cobrar el pozo» solo se puede una vez.',
    '⚠️ Si algo no se puede guardar o un abono supera la deuda, la app te avisa en vez de fallar en silencio.',
  ];

  // ---------- Utilidades ----------
  // esc(): escapa texto del usuario antes de meterlo al HTML
  // (previene inyección/XSS y HTML roto por caracteres como < > & " ')
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // toast(): muestra el mensajito flotante de confirmación 2.2 segundos
  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('ver');
    clearTimeout(t._tmr); t._tmr = setTimeout(() => t.classList.remove('ver'), 2200);
  }

  const capitalizar = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  // nombreMes(): "Julio de 2026" · saludo(): según la hora del día
  // fechaCorta(): "Hoy" / "Ayer" / "12 jul" · hoyInput(): fecha de hoy para <input type="date">
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
  // hoyInput(): fecha LOCAL (Perú) en formato YYYY-MM-DD. No usar toISOString():
  // eso da la fecha en UTC y de 7 pm a medianoche ya es "mañana" (bug real).
  const hoyInput = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  // fechaDesdeInput(v): convierte 'YYYY-MM-DD' del <input type=date> a ISO al
  // mediodía local. Devuelve null si está vacío o es inválido (el selector de
  // Android tiene botón "Borrar"), para que la acción avise en vez de reventar.
  function fechaDesdeInput(v) {
    if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
    const d = new Date(v + 'T12:00:00');
    return isNaN(d) ? null : d.toISOString();
  }
  const esFutura = (v) => !!v && v > hoyInput();
  // numero(v): parsea un monto escrito "a lo peruano": acepta "12,50", "1,234.50"
  // y "1.234,50". Si hay punto y coma, el ÚLTIMO separador es el decimal y el
  // otro es de miles. Si solo hay coma, es decimal. Devuelve NaN si no es número.
  const numero = (v) => {
    let s = String(v ?? '').trim().replace(/\s/g, '').replace(/[^\d.,-]/g, '');
    const hayPunto = s.includes('.'), hayComa = s.includes(',');
    if (hayPunto && hayComa) {
      if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.');
      else s = s.replace(/,/g, '');
    } else if (hayComa) {
      s = s.replace(',', '.');
    }
    return parseFloat(s);
  };
  // fondoSuave(color): fondo translúcido para íconos. Con hex se agrega "22";
  // con variables CSS (var(--ingreso)) el sufijo no funciona → color-mix.
  const fondoSuave = (col) => String(col).startsWith('#') ? col + '22' : `color-mix(in srgb, ${col} 13%, transparent)`;
  // lsGet/lsSet: localStorage protegido (en incógnito estricto puede lanzar)
  const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };

  // ---------- Estado de UI en memoria (formularios) ----------
  // form: valores a medio escribir del formulario "Registrar" (sobrevive
  // a los re-render). filtroHist: búsqueda y chip activo de Movimientos.
  // refReporte: mes que se está viendo en Reportes (se mueve con ‹ ›).
  let form = {};
  let filtroHist = { texto: '', tipo: 'Todos' };
  let refReporte = new Date();

  // ---------- Router ----------
  // rutas = { nombreDeRuta: funciónQueDevuelveHTML }. registrar() agrega
  // una vista al mapa; ir() navega cambiando el hash de la URL (lo que
  // dispara 'hashchange' → render()).
  const rutas = {};
  function registrar(nombre, fn) { rutas[nombre] = fn; }

  function ir(ruta, params) {
    location.hash = '#' + ruta + (params ? '?' + new URLSearchParams(params) : '');
  }

  // render(): corazón de la SPA. 1) separa ruta y parámetros del hash
  // (#detalle?id=3 → ruta 'detalle', params {id:'3'}), 2) ejecuta la vista
  // y pinta su HTML, 3) sube el scroll, 4) ilumina la pestaña correcta,
  // 5) ejecuta el "post-render" de la vista si definió uno (fn._post).
  function render() {
    const [ruta, query] = (location.hash.replace(/^#/, '') || 'inicio').split('?');
    const params = Object.fromEntries(new URLSearchParams(query || ''));
    const fn = rutas[ruta] || rutas['inicio'];
    cont().innerHTML = `<div class="vista">${fn(params)}</div>`;
    cont().scrollTop = 0; window.scrollTo(0, 0);
    marcarTab(ruta);
    const post = fn._post; if (post) post(params);
  }

  // marcarTab(): decide qué pestaña de la barra inferior se ve "activa"
  // según la ruta actual (las subpantallas de "Más" iluminan la pestaña Más).
  function marcarTab(ruta) {
    const mapa = {
      inicio: 'inicio', movimientos: 'movimientos', registrar: 'registrar', reportes: 'reportes',
      mas: 'mas', cuentas: 'mas', cuentaEdit: 'mas', categorias: 'mas', ajustes: 'mas', perfil: 'mas', detalle: 'movimientos',
      prestamos: 'mas', prestamoNuevo: 'mas', prestamoDet: 'mas',
      panderos: 'mas', panderoNuevo: 'mas', panderoDet: 'mas',
      trabajo: 'mas', trabajoNuevo: 'mas', trabajoDet: 'mas',
      metas: 'mas', metaNueva: 'mas', recurrentes: 'mas', recurrenteNuevo: 'mas',
      presupuestos: 'mas', presupuestoNuevo: 'mas',
    };
    const activa = mapa[ruta] || 'inicio';
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('activo', t.dataset.ruta === activa));
  }

  // ============================================================
  //  VISTA: INICIO (Dashboard)
  //  Muestra: saludo, banner de instalación PWA, tarjeta de saldo
  //  total (toca para ajustar cuentas), ingresos/gastos del mes,
  //  pendientes 🔔 (próximos 7 días) y últimos 6 movimientos.
  // ============================================================
  registrar('inicio', () => {
    const total = Datos.saldoTotal();
    const r = Datos.resumenMes();
    const movs = Datos.movimientos().slice(0, 6);
    const ctas = Datos.cuentas(true);
    const pend = Datos.pendientes(7);
    const perfil = Datos.perfil();
    const prof = Datos.profesionTexto();

    return `
      <header class="encabezado">
        <div>
          <p class="saludo">${saludo()}${perfil.nombre ? ', ' + esc(perfil.nombre) : ''} 👋</p>
          <h1>Panderito</h1>
          <p class="sub">${nombreMes()}${prof ? ' · ' + esc(prof) : ''}${perfil.nombre ? '' : ' · <a href="#perfil" style="color:var(--primary)">ponle tu nombre</a>'}</p>
        </div>
      </header>

      <div id="banner-instalar" class="card">
        <span style="font-size:26px">📲</span>
        <div class="txt"><b>Instala Panderito</b>Agrégalo a tu pantalla de inicio y úsalo como app.</div>
        <button class="btn chico" id="btn-instalar">Instalar</button>
      </div>

      ${tarjetaNovedades()}

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
      ${tarjetaPosiblesIngresos()}

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

  // tarjetaPosiblesIngresos(): caja «Posibles ingresos» del Inicio. Solo si hay
  // trabajos activos. Muestra lo ganado del mes que aún no se cobró.
  function tarjetaPosiblesIngresos() {
    const lista = Datos.trabajos(true);
    if (!lista.length) return '';
    const posible = Datos.posiblesIngresosMes();
    const todoCobrado = lista.every((t) => Datos.resumenTrabajo(t).cobrado !== null);
    return `
      <button class="mini" style="width:100%;text-align:left;margin-bottom:14px;border-left:4px solid var(--pendiente)" onclick="App.ir('trabajo')">
        <p class="etq"><span class="punto" style="background:var(--pendiente)"></span> Posibles ingresos (trabajo, este mes)</p>
        <p class="val" style="color:var(--pendiente)">${todoCobrado ? '✓ Ya cobrado' : Moneda.fmt(posible)}</p>
        <p style="font-size:12px;color:var(--texto-tenue);margin:4px 0 0">${todoCobrado ? 'El sueldo de este mes ya está en tus ingresos' : 'Ganado hasta hoy y aún no cobrado · toca para ver'}</p>
      </button>`;
  }

  // tarjetaNovedades(): se muestra en Inicio solo si esta VERSION aún no fue
  // "vista" (Entendido). Los textos de NOVEDADES son propios (no del usuario),
  // por eso se permiten <b> sin escapar.
  function tarjetaNovedades() {
    if (!NOVEDADES.length || lsGet('panderito.novedades.vista') === VERSION) return '';
    return `
      <div class="card" style="border-left:4px solid var(--primary)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <b>🆕 Novedades ${esc(VERSION)}</b>
          <span style="font-size:12px;color:var(--texto-tenue)">solo esta vez</span>
        </div>
        <ul style="margin:0 0 12px;padding-left:18px;font-size:13.5px;line-height:1.45;color:var(--texto-suave)">
          ${NOVEDADES.map((n) => `<li style="margin-bottom:6px">${n}</li>`).join('')}
        </ul>
        <button class="btn chico" onclick="App.cerrarNovedades()">Entendido ✓</button>
      </div>`;
  }

  // itemMovimiento(): fila reutilizable de un movimiento (ícono de la
  // categoría, nota, cuenta, fecha y monto en verde/rojo). Al tocarla
  // abre el detalle. Se usa en Inicio y en Movimientos.
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

  // estadoVacio(): placeholder amigable cuando una lista no tiene datos
  function estadoVacio(emo, titulo, texto) {
    return `<div class="vacio"><div class="emo">${emo}</div><h3>${esc(titulo)}</h3><p>${esc(texto)}</p></div>`;
  }

  // ============================================================
  //  VISTA: MOVIMIENTOS (Historial)
  //  Lista completa con buscador (por nota o categoría) y chips de
  //  filtro Todos/Gastos/Ingresos. El _post reconecta el input de
  //  búsqueda tras cada render conservando el cursor.
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
      <div class="chips" style="padding-top:0">
        <span style="font-size:12px;color:var(--texto-tenue);align-self:center;white-space:nowrap">📤 Compartir:</span>
        <button class="chip" onclick="App.compartirResumen('hoy')">Hoy</button>
        <button class="chip" onclick="App.compartirResumen('semana')">Esta semana</button>
        <button class="chip" onclick="App.compartirResumen('mes')">Este mes</button>
      </div>
      ${movs.length ? `<div class="lista">${movs.map(itemMovimiento).join('')}</div>`
        : estadoVacio('🔍', 'Sin resultados', 'No hay movimientos con ese filtro. Prueba otra búsqueda.')}
    `;
  });

  // ---------- Compartir resumen (WhatsApp, etc.) ----------
  // Arma un texto con formato de WhatsApp (*negritas*, emojis) con los
  // movimientos del período elegido, respetando el chip Todos/Gastos/Ingresos.
  // Se comparte con la hoja nativa del celular (navigator.share) y, si no
  // existe (PC), se abre WhatsApp Web con el texto listo. Sin PDF a propósito:
  // el texto pesa nada, se lee en el chat y no requiere librerías.
  function rangoCompartir(periodo) {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy); manana.setDate(hoy.getDate() + 1);
    if (periodo === 'hoy') return { desde: hoy, hasta: manana, titulo: 'de hoy', sub: hoy.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) };
    if (periodo === 'semana') {
      const lunes = new Date(hoy); lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
      return { desde: lunes, hasta: manana, titulo: 'de esta semana', sub: `del ${lunes.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })} al ${hoy.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}` };
    }
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    return { desde: inicioMes, hasta: manana, titulo: 'de este mes', sub: nombreMes(hoy) };
  }
  function textoResumen(periodo) {
    const { desde, hasta, titulo, sub } = rangoCompartir(periodo);
    let movs = Datos.movimientos().filter((m) => { const f = new Date(m.fecha); return f >= desde && f < hasta; });
    if (filtroHist.tipo !== 'Todos') movs = movs.filter((m) => m.tipo === filtroHist.tipo);
    const etq = filtroHist.tipo === 'Gasto' ? 'Gastos' : filtroHist.tipo === 'Ingreso' ? 'Ingresos' : 'Movimientos';
    const lineas = [`🐷 *Panderito · ${etq} ${titulo}*`, `📅 ${capitalizar(sub)}`, ''];
    if (!movs.length) { lineas.push(`Sin ${etq.toLowerCase()} en este período.`); return lineas.join('\n'); }
    const bloque = (tipo, emo, nombre) => {
      const lista = movs.filter((m) => m.tipo === tipo).slice().sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
      if (!lista.length) return 0;
      lineas.push(`${emo} *${nombre}*`);
      let total = 0;
      for (const m of lista) {
        const cat = Datos.categoria(m.categoriaId) || { nombre: 'Sin categoría', icono: '🏷️' };
        const cta = Datos.cuenta(m.cuentaId);
        const dia = periodo === 'hoy' ? '' : new Date(m.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' }) + ' · ';
        lineas.push(`${cat.icono || '•'} ${dia}${cat.nombre}${m.nota && m.nota !== cat.nombre ? ' – ' + m.nota : ''}${cta ? ' (' + cta.nombre + ')' : ''}: *${Moneda.fmt(m.monto)}*`);
        total += Number(m.monto);
      }
      lineas.push(`   ➜ Total ${nombre.toLowerCase()}: *${Moneda.fmt(total)}*`, '');
      return total;
    };
    const ing = bloque('Ingreso', '🟢', 'Ingresos');
    const gas = bloque('Gasto', '🔴', 'Gastos');
    if (filtroHist.tipo === 'Todos' && (ing || gas)) {
      const bal = Datos.r2(ing - gas);
      lineas.push(`━━━━━━━━━━━━━━`, `${bal >= 0 ? '💚' : '❤️‍🩹'} *Balance: ${bal >= 0 ? '+' : '-'} ${Moneda.fmt(Math.abs(bal))}*`);
    }
    while (lineas[lineas.length - 1] === '') lineas.pop(); // sin líneas vacías dobles antes del pie
    lineas.push('', '_Enviado desde Panderito_ 🐷');
    return lineas.join('\n');
  }
  async function compartirTexto(texto) {
    if (navigator.share) {
      try { await navigator.share({ text: texto }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    // PC / navegadores sin hoja de compartir: WhatsApp Web con el texto listo
    window.open('https://wa.me/?text=' + encodeURIComponent(texto), '_blank', 'noopener');
  }
  rutas['movimientos']._post = () => {
    const b = document.getElementById('buscar');
    if (b) b.oninput = (e) => { filtroHist.texto = e.target.value; const pos = e.target.selectionStart; render(); const nb = document.getElementById('buscar'); nb.focus(); nb.setSelectionRange(pos, pos); };
  };

  // ============================================================
  //  VISTA: REGISTRAR (crear o editar un movimiento)
  //  Doble uso: sin params crea un movimiento nuevo; con ?id=N carga
  //  ese movimiento para editarlo. El estado se guarda en `form`
  //  para no perder lo escrito cuando la vista se re-renderiza
  //  (p. ej. al cambiar Gasto↔Ingreso o elegir categoría).
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
        <input id="monto" class="${form.tipo === 'Gasto' ? 'gasto' : 'ingreso'}" type="text" inputmode="decimal" autocomplete="off" placeholder="0.00" value="${esc(form.monto)}" />
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
  //  Ficha completa de un movimiento (?id=N) con botones Editar
  //  (reabre Registrar en modo edición) y Eliminar (con confirmación).
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
  //  Navegación por mes (‹ ›), tarjetas de ingresos/gastos, ahorro o
  //  déficit del mes, gráfico de barras de los últimos 6 meses y
  //  ranking de gasto por categoría con barras proporcionales.
  // ============================================================
  registrar('reportes', () => {
    const r = Datos.resumenMes(refReporte);
    const porCat = Datos.gastoPorCategoria(refReporte);
    const serie = Datos.serieMeses(6, refReporte);
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

      <div class="seccion-tit"><h2>6 meses hasta ${esc(nombreMes(refReporte))} (gasto)</h2></div>
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
  //  VISTA: MÁS (menú de módulos y configuración)
  //  Puerta de entrada a Panderos, Préstamos, Metas, Pagos fijos,
  //  Presupuestos, Cuentas, Categorías y Ajustes.
  // ============================================================
  registrar('mas', () => `
    <div class="titulo-pagina"><h1>Más</h1></div>
    <div class="seccion-tit"><h2>Módulos</h2></div>
    <div class="opciones">
      ${opcion('💼', 'Trabajo', 'Tus días trabajados convertidos en posibles ingresos', "App.ir('trabajo')")}
      ${opcion('🤝', 'Panderos', 'Juntas de ahorro rotativo', "App.ir('panderos')")}
      ${opcion('💸', 'Préstamos', 'Me deben / debo', "App.ir('prestamos')")}
      ${opcion('🎯', 'Metas de ahorro', 'Objetivos con progreso', "App.ir('metas')")}
      ${opcion('🔁', 'Pagos fijos', 'Internet, línea, alquiler, suscripciones', "App.ir('recurrentes')")}
      ${opcion('📅', 'Presupuestos', 'Límites por categoría', "App.ir('presupuestos')")}
    </div>
    <div class="seccion-tit"><h2>Configuración</h2></div>
    <div class="opciones">
      ${opcion('🙋', 'Perfil', Datos.perfil().nombre ? `${Datos.perfil().nombre}${Datos.profesionTexto() ? ' · ' + Datos.profesionTexto() : ''}` : 'Tu nombre y profesión (opcional)', "App.ir('perfil')")}
      ${opcion('💳', 'Cuentas', 'Efectivo, banco, billeteras', "App.ir('cuentas')")}
      ${opcion('🏷️', 'Categorías', 'Personaliza tus categorías', "App.ir('categorias')")}
      ${opcion('⚙️', 'Ajustes', 'Tema, datos y copia de seguridad', "App.ir('ajustes')")}
    </div>
    <p class="pie-marca">Panderito PWA · ${esc(VERSION)}</p>
  `);
  function opcion(ic, t, s, onclick, deshab) {
    return `<button class="opcion" ${deshab ? 'disabled' : `onclick="${onclick}"`}>
      <span class="ic">${ic}</span><span class="cuerpo"><p class="t">${esc(t)}</p><p class="s">${esc(s)}</p></span>
      ${deshab ? '<span class="fl">🔒</span>' : '<span class="fl">›</span>'}</button>`;
  }

  // ============================================================
  //  VISTA: CUENTAS (métodos de pago) + editor de cuenta
  //  'cuentas': lista con saldo calculado de cada una y saldo total.
  //  'cuentaEdit': crear (sin ?id) o editar (?id=N) nombre, método de
  //  pago y SALDO INICIAL (el dinero que ya tenías al empezar a usar
  //  la app). Una cuenta con movimientos no se puede eliminar.
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
        <input class="entrada" id="c-saldo" type="text" inputmode="decimal" placeholder="0.00" value="${editando ? esc(editando.saldoInicial) : ''}" />
        <p style="font-size:12px;color:var(--texto-tenue);margin:6px 2px 0">Pon aquí tu dinero actual (ej. 8000) para empezar a llevar el registro desde ese monto, sin registrar movimientos.</p></div>
      <button class="btn" onclick="App.guardarCuentaForm(${editando ? editando.id : 'null'})">${editando ? '💾 Guardar' : '✓ Crear cuenta'}</button>
      ${editando && !conMov ? `<div style="height:10px"></div><button class="btn peligro" onclick="App.borrarCuenta(${editando.id})">🗑️ Eliminar cuenta</button>` : ''}
      ${editando && conMov ? `<p style="text-align:center;color:var(--texto-tenue);font-size:13px;margin-top:12px">Tiene movimientos; no se puede eliminar (pero sí ajustar su saldo inicial).</p>` : ''}
      <div style="height:14px"></div>
    `;
  });

  // ============================================================
  //  VISTA: CATEGORÍAS
  //  Listas separadas de Gastos e Ingresos. Solo se pueden eliminar
  //  las categorías SIN movimientos (las demás muestran "En uso").
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
  //  VISTA: PERFIL (opcional)
  //  Nombre libre (para el saludo del Inicio) y profesión: desplegable
  //  con opciones comunes en Perú + «Otro» con texto libre. Servirá de
  //  base al futuro módulo Trabajo.
  // ============================================================
  const PROFESIONES = [
    'Ingeniero/a de sistemas', 'Ingeniero/a (otra especialidad)', 'Contador/a', 'Administrador/a',
    'Docente / profesor/a', 'Médico/a o salud', 'Enfermero/a', 'Abogado/a', 'Bibliotecario/a',
    'Comerciante / negocio propio', 'Técnico/a', 'Obrero/a / operario/a', 'Transportista / taxista',
    'Agricultor/a', 'Independiente / freelance', 'Estudiante', 'Ama de casa', 'Jubilado/a', 'Otro',
  ];
  registrar('perfil', () => {
    const p = Datos.perfil();
    const esOtro = p.profesion === 'Otro';
    return `
      <div class="titulo-pagina"><button class="btn-volver" onclick="App.ir('mas')">‹</button><h1>Perfil</h1></div>
      <p style="color:var(--texto-suave);font-size:13px;margin:0 2px 14px">Todo es opcional y se guarda solo en tu celular. Tu nombre se usa para saludarte.</p>
      <div class="campo"><label>¿Cómo te llamas?</label><input class="entrada" id="pf-nombre" placeholder="ej. Jhonatan" maxlength="40" value="${esc(p.nombre)}" /></div>
      <div class="campo"><label>Profesión u ocupación</label>
        <select class="entrada" id="pf-prof" onchange="App.cambioProfesion(this.value)">
          <option value="" ${!p.profesion ? 'selected' : ''}>— Sin especificar —</option>
          ${PROFESIONES.map((x) => `<option value="${esc(x)}" ${p.profesion === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}
        </select></div>
      <div class="campo" id="pf-otro-campo" style="${esOtro ? '' : 'display:none'}"><label>Escribe tu profesión</label><input class="entrada" id="pf-otro" placeholder="ej. Diseñador gráfico" maxlength="60" value="${esc(p.profesionOtra)}" /></div>
      <button class="btn" onclick="App.guardarPerfilForm()">💾 Guardar</button>
      ${p.nombre || p.profesion ? `<div style="height:10px"></div><button class="btn secundario" onclick="App.borrarPerfil()">Limpiar perfil</button>` : ''}
      <div style="height:14px"></div>`;
  });

  // ============================================================
  //  VISTA: AJUSTES
  //  Tema (claro/oscuro/auto), recordatorios (notificaciones locales),
  //  exportar respaldo JSON y "Borrar todo" (reinicio de fábrica).
  // ============================================================
  registrar('ajustes', () => {
    const tema = lsGet('panderito.tema') || 'sistema';
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
        ${opcion('🔔', 'Activar recordatorios', 'Aviso al abrir la app: panderos y pagos por vencer', 'App.activarNotis()')}
        ${opcion('👀', 'Ver pendientes ahora', 'Panderos, pagos y presupuestos', 'App.mostrarPendientesNoti(true)')}
      </div>

      <div class="seccion-tit"><h2>Tus datos</h2></div>
      <div class="opciones">
        ${opcion('🆕', 'Ver novedades', `Qué cambió en la versión ${VERSION}`, 'App.verNovedades()')}
        ${opcion('⬇️', 'Exportar copia (JSON)', 'Descarga un respaldo de tus datos', 'App.exportarDatos()')}
        ${opcion('⬆️', 'Restaurar copia', 'Carga un respaldo JSON (reemplaza lo actual)', "document.getElementById('archivo-restaurar').click()")}
        ${opcion('🗑️', 'Borrar todo', 'Reinicia la app a cero (no se puede deshacer)', 'App.borrarTodo()')}
      </div>
      <input type="file" id="archivo-restaurar" accept=".json,application/json" style="display:none" onchange="App.importarDatos(this)" />
      ${Datos.hayCopiaCorrupta() ? `<div class="card" style="border-left:4px solid var(--pendiente)"><b>⚠️ Datos anteriores ilegibles</b><p style="margin:6px 0 0;font-size:13px;color:var(--texto-suave)">Se apartó una copia de datos que no se pudieron leer. Si perdiste información, exporta esa copia para revisarla.</p><div style="margin-top:10px"><button class="btn chico secundario" onclick="App.exportarCorrupto()">⬇️ Descargar copia apartada</button></div></div>` : ''}
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
  //  PRÉSTAMOS (3 vistas)
  //  'prestamos': totales Me deben / Yo debo + lista.
  //  'prestamoNuevo': formulario (persona, monto, tipo, fecha, nota).
  //  'prestamoDet': saldo pendiente, registrar abonos parciales,
  //  marcar como pagado o eliminar (borra también sus abonos).
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
      <span class="ic" style="background:${fondoSuave(col)};color:${col}">${p.tipo === 'PorCobrar' ? '📥' : '📤'}</span>
      <span class="cuerpo"><p class="t">${esc(p.persona)}</p><p class="s">${p.tipo === 'PorCobrar' ? 'Me debe' : 'Le debo'} · ${etiquetaEstadoPrestamo(p.estado)}</p></span>
      <span class="monto">${Moneda.fmt(pend)}</span></button>`;
  }
  registrar('prestamoNuevo', () => `
    <div class="titulo-pagina"><button class="btn-volver" onclick="App.ir('prestamos')">‹</button><h1>Nuevo préstamo</h1></div>
    <div class="campo"><label>Persona</label><input class="entrada" id="p-persona" placeholder="ej. Juan" /></div>
    <div class="campo"><label>Monto (S/)</label><input class="entrada" id="p-monto" type="text" inputmode="decimal" placeholder="0.00" /></div>
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
      ${abonos.length ? `<div class="lista">${abonos.map((a) => `<div class="item"><span class="ic" style="background:${fondoSuave('var(--ingreso)')};color:var(--ingreso)">💵</span><span class="cuerpo"><p class="t">${Moneda.fmt(a.monto)}</p><p class="s">${fechaCorta(a.fecha)}</p></span></div>`).join('')}</div>` : `<p style="color:var(--texto-tenue);text-align:center;padding:12px">Aún no hay abonos.</p>`}
      <div style="height:10px"></div><button class="btn peligro" onclick="App.borrarPrestamo(${p.id})">🗑️ Eliminar préstamo</button>`;
  });

  // ============================================================
  //  PANDEROS (3 vistas) — el módulo estrella 🤝
  //  'panderos': lista con "cuándo me toca" y pozo a recibir.
  //  'panderoNuevo': crear junta (participantes, cuota, frecuencia,
  //  mi turno y nombres opcionales, uno por línea).
  //  'panderoDet': ficha con fechas, botones "Pagar cuota" (gasto) y
  //  "Cobrar el pozo" (ingreso), y la lista de turnos donde se puede
  //  editar nombre/DNI de cada participante y marcar turnos cobrados.
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
      <span class="ic" style="background:${fondoSuave('var(--primary)')};color:var(--primary)">🤝</span>
      <span class="cuerpo"><p class="t">${esc(p.nombre)}</p><p class="s">${p.numParticipantes} pers. · ${Moneda.fmt(p.cuotaMonto)}/${p.frecuencia.toLowerCase()} · ${cuando} · ${r.turnosCobrados}/${r.totalTurnos} cobrados</p></span>
      <span class="monto" style="color:var(--primary)">${Moneda.fmt(r.montoARecibir)}</span></button>`;
  }
  registrar('panderoNuevo', () => `
    <div class="titulo-pagina"><button class="btn-volver" onclick="App.ir('panderos')">‹</button><h1>Nuevo pandero</h1></div>
    <div class="campo"><label>Nombre</label><input class="entrada" id="pa-nombre" placeholder="ej. Junta de la oficina" /></div>
    <div class="campo"><label>N.º de participantes</label><input class="entrada" id="pa-num" type="number" inputmode="numeric" value="10" /></div>
    <div class="campo"><label>Cuota (S/)</label><input class="entrada" id="pa-cuota" type="text" inputmode="decimal" placeholder="0.00" /></div>
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
      ${r.turnosCobrados < r.totalTurnos
        ? `<button class="btn" onclick="App.pagarCuota(${p.id})">💸 Pagar cuota (${Moneda.fmt(p.cuotaMonto)}) · ronda ${r.turnosCobrados + 1} de ${r.totalTurnos}</button>`
        : `<div class="card" style="text-align:center;color:var(--ingreso);font-weight:700">✓ Todas las cuotas pagadas</div>`}
      <div style="height:8px"></div>
      ${p.pozoCobrado
        ? `<div class="card" style="text-align:center;color:var(--ingreso);font-weight:700">✓ Pozo cobrado (${Moneda.fmt(r.montoARecibir)})</div>`
        : `<button class="btn secundario" onclick="App.cobrarPozo(${p.id})">📥 Cobrar el pozo (${Moneda.fmt(r.montoARecibir)})</button>`}
      <p style="font-size:12px;color:var(--texto-tenue);text-align:center;margin:8px 2px 0">Pagar cuota registra un gasto y marca la ronda como cobrada. Cobrar el pozo registra un ingreso (una sola vez).</p>
      <div class="chips" style="padding-top:4px">
        <span style="font-size:12px;color:var(--texto-tenue);align-self:center;white-space:nowrap">📤 Compartir al grupo:</span>
        <button class="chip" onclick="App.compartirPandero(${p.id},'imagen')">🖼️ Imagen</button>
        <button class="chip" onclick="App.compartirPandero(${p.id},'texto')">💬 Texto</button>
      </div>
      ${(() => {
        const ronda = Datos.rondaActual(p.id);
        if (!ronda) return '';
        const pagaron = Array.isArray(ronda.pagaron) ? ronda.pagaron : [];
        return `
      <div class="seccion-tit"><h2>Ronda ${ronda.numeroTurno}: pagos de la cuota</h2><span style="font-size:12px;color:var(--texto-tenue)">${pagaron.length}/${turnos.length} pagaron</span></div>
      <div class="card">
        <p style="font-size:12px;color:var(--texto-suave);margin:0 0 10px">Cobra <b>${esc(ronda.nombreParticipante)}</b> el ${fechaLarga(ronda.fechaCobro)}. Toca a cada participante cuando ponga su cuota.</p>
        <div class="chips" style="flex-wrap:wrap;overflow:visible">
          ${turnos.map((t) => `<button class="chip ${pagaron.includes(t.numeroTurno) ? 'activo' : ''}" onclick="App.alternarPago(${ronda.id},${t.numeroTurno})">${pagaron.includes(t.numeroTurno) ? '✓ ' : ''}${esc(t.nombreParticipante)}</button>`).join('')}
        </div>
        <p style="font-size:12px;color:var(--texto-tenue);margin:10px 2px 0">Recaudado: <b>${Moneda.fmt(pagaron.length * Number(p.cuotaMonto))}</b> de ${Moneda.fmt(r.montoARecibir)}</p>
      </div>`;
      })()}
      <div class="seccion-tit"><h2>Turnos</h2><span style="font-size:12px;color:var(--texto-tenue)">✏️ edita nombre/DNI</span></div>
      <div class="lista">${turnos.map((t) => `<div class="item"><span class="ic" style="background:${t.numeroTurno === p.miTurno ? fondoSuave('var(--primary)') + ';color:var(--primary)' : 'var(--linea);color:var(--texto-suave)'}">${t.numeroTurno}</span><span class="cuerpo"><p class="t">${esc(t.nombreParticipante)}${t.numeroTurno === p.miTurno ? ' ⭐' : ''}</p><p class="s">${fechaLarga(t.fechaCobro)}${t.dni ? ' · DNI ' + esc(t.dni) : ''}</p></span><button class="btn-volver" onclick="App.editarTurno(${t.id})">✏️</button><button class="btn chico ${t.cobrado ? '' : 'secundario'}" style="margin-left:6px" onclick="App.cobrarTurno(${p.id},${t.id},${!t.cobrado})">${t.cobrado ? '✓' : 'Marcar'}</button></div>`).join('')}</div>
      <div style="height:10px"></div><button class="btn peligro" onclick="App.borrarPandero(${p.id})">🗑️ Eliminar pandero</button>`;
  });

  // ============================================================
  //  TRABAJO (3 vistas) — días trabajados → posibles ingresos
  //  'trabajo': lista de trabajos con lo ganado del mes.
  //  'trabajoNuevo' (?id para editar): nombre, forma de pago, monto,
  //  horas/día, días de la semana por defecto, feriados pagados, cuenta.
  //  'trabajoDet': calendario del mes (toca un día para prender/apagar),
  //  ganado vs proyección, valor de tu día y tu hora, «Ya me pagaron».
  // ============================================================
  const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  let refTrabajo = new Date();
  const modoTexto = (t) => t.modo === 'Dia' ? `${Moneda.fmt(t.monto)} por día` : t.modo === 'Hora' ? `${Moneda.fmt(t.monto)} por hora · ${t.horasDia} h/día` : `${Moneda.fmt(t.monto)} al mes`;
  registrar('trabajo', () => {
    const lista = Datos.trabajos(false);
    return `
      <div class="titulo-pagina"><button class="btn-volver" onclick="App.ir('mas')">‹</button><h1>Trabajo</h1></div>
      ${lista.length ? `<div class="card-saldo"><p class="etq">Posibles ingresos de ${nombreMes()}</p><p class="monto">${Moneda.fmt(Datos.posiblesIngresosMes())}</p><p class="cuentas-min">Ganado hasta hoy y aún no cobrado</p></div>` : ''}
      ${lista.length ? `<div class="lista">${lista.map((t) => {
        const r = Datos.resumenTrabajo(t);
        const pct = r.proyeccion > 0 ? Math.min(100, r.ganado / r.proyeccion * 100) : 0;
        return `<button class="item" style="flex-wrap:wrap" onclick="App.ir('trabajoDet',{id:${t.id}})">
          <span class="ic" style="background:${fondoSuave('var(--pendiente)')};color:var(--pendiente)">💼</span>
          <span class="cuerpo"><p class="t">${esc(t.nombre)}${t.activo === false ? ' (pausado)' : ''}</p><p class="s">${modoTexto(t)} · ${r.diasContados}/${r.diasMes} días</p></span>
          <span class="monto" style="color:var(--pendiente)">${r.cobrado !== null ? '✓ cobrado' : Moneda.fmt(r.ganado)}</span>
          <span style="flex-basis:100%;height:6px;border-radius:999px;background:var(--linea);margin-top:10px;overflow:hidden"><span style="display:block;height:100%;width:${pct}%;background:var(--pendiente)"></span></span>
        </button>`;
      }).join('')}</div>` : estadoVacio('💼', 'Sin trabajos', 'Registra tu trabajo (sueldo mensual, por día o por hora) y verás cuánto llevas ganado cada día.')}
      <button class="btn" onclick="App.ir('trabajoNuevo')">＋ Nuevo trabajo</button><div style="height:14px"></div>`;
  });
  registrar('trabajoNuevo', (params) => {
    const t = params.id ? Datos.trabajo(Number(params.id)) : null;
    const dias = t ? t.dias : [1, 1, 1, 1, 1, 0, 0];
    const ctas = Datos.cuentas(true);
    const modo = t ? t.modo : 'Mensual';
    return `
      <div class="titulo-pagina"><button class="btn-volver" onclick="App.ir('${t ? 'trabajoDet' : 'trabajo'}'${t ? `,{id:${t.id}}` : ''})">‹</button><h1>${t ? 'Editar trabajo' : 'Nuevo trabajo'}</h1></div>
      <div class="campo"><label>Nombre</label><input class="entrada" id="t-nombre" placeholder="ej. Biblioteca UNAS, Taller, Freelance" value="${t ? esc(t.nombre) : esc(Datos.profesionTexto() || '')}" /></div>
      <div class="campo"><label>¿Cómo te pagan?</label>
        <select class="entrada" id="t-modo" onchange="App.cambioModoTrabajo(this.value)">
          <option value="Mensual" ${modo === 'Mensual' ? 'selected' : ''}>Sueldo mensual (planilla)</option>
          <option value="Dia" ${modo === 'Dia' ? 'selected' : ''}>Por día trabajado</option>
          <option value="Hora" ${modo === 'Hora' ? 'selected' : ''}>Por hora</option>
        </select></div>
      <div class="campo"><label id="t-monto-etq">${modo === 'Dia' ? 'Pago por día (S/)' : modo === 'Hora' ? 'Pago por hora (S/)' : 'Sueldo mensual (S/)'}</label><input class="entrada" id="t-monto" type="text" inputmode="decimal" placeholder="ej. 3000" value="${t ? esc(t.monto) : ''}" /></div>
      <div class="campo"><label>Horas por día (para calcular el valor de tu hora)</label><input class="entrada" id="t-horas" type="number" inputmode="numeric" min="1" max="24" value="${t ? t.horasDia : 8}" /></div>
      <div class="campo"><label>Días que trabajas normalmente (toca para cambiar)</label>
        <div class="dias-semana" id="t-dias">${DIAS_SEMANA.map((d, i) => `<button type="button" class="dia-chip ${dias[i] ? 'on' : ''}" data-i="${i}" onclick="this.classList.toggle('on')">${d}</button>`).join('')}</div>
        <p style="font-size:12px;color:var(--texto-tenue);margin:6px 2px 0">Por defecto lunes a viernes. Después, en el calendario, puedes prender o apagar cualquier día con un toque.</p></div>
      <div class="campo"><label style="display:flex;align-items:center;gap:10px"><input type="checkbox" id="t-feriados" ${t ? (t.feriadosPagados ? 'checked' : '') : 'checked'} style="width:20px;height:20px" /> Los feriados se me pagan (planilla formal)</label></div>
      <div class="campo"><label>Cuenta donde recibes el pago</label>
        <select class="entrada" id="t-cuenta">${ctas.map((c) => `<option value="${c.id}" ${t && t.cuentaId === c.id ? 'selected' : ''}>${c.icono} ${esc(c.nombre)}</option>`).join('')}</select></div>
      <button class="btn" onclick="App.guardarTrabajoForm(${t ? t.id : 'null'})">${t ? '💾 Guardar' : '✓ Crear trabajo'}</button>
      ${t ? `<div style="height:10px"></div><button class="btn secundario" onclick="App.pausarTrabajo(${t.id})">${t.activo === false ? '▶️ Reactivar' : '⏸️ Pausar (no contar por ahora)'}</button><div style="height:10px"></div><button class="btn peligro" onclick="App.borrarTrabajo(${t.id})">🗑️ Eliminar trabajo</button>` : ''}
      <div style="height:14px"></div>`;
  });
  registrar('trabajoDet', (params) => {
    const t = Datos.trabajo(Number(params.id));
    if (!t) return `<div class="titulo-pagina"><button class="btn-volver" onclick="App.ir('trabajo')">‹</button><h1>Trabajo</h1></div>${estadoVacio('❓', 'No encontrado', '')}`;
    const ref = refTrabajo;
    const r = Datos.resumenTrabajo(t, ref);
    const pct = r.proyeccion > 0 ? Math.min(100, r.ganado / r.proyeccion * 100) : 0;
    const y = ref.getFullYear(), m = ref.getMonth();
    const primero = new Date(y, m, 1), ultimo = new Date(y, m + 1, 0).getDate();
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const hueco = (primero.getDay() + 6) % 7; // celdas vacías antes del día 1 (semana empieza lunes)
    let celdas = '';
    for (let i = 0; i < hueco; i++) celdas += '<span class="cal-dia vacio"></span>';
    for (let d = 1; d <= ultimo; d++) {
      const f = new Date(y, m, d);
      const clave = Datos.claveDia(f);
      const plan = Datos.diaPlanificado(t, f), cuenta = Datos.diaCuenta(t, f);
      const fer = Datos.esFeriado(f);
      const cls = cuenta ? (plan ? 'on' : 'extra') : (plan ? 'falta' : 'off');
      const esHoy = f.getTime() === hoy.getTime();
      celdas += `<button class="cal-dia ${cls} ${esHoy ? 'hoy' : ''} ${fer ? 'feriado' : ''}" onclick="App.alternarDia(${t.id},'${clave}')" title="${fer ? 'Feriado' : ''}">${d}${fer ? '<i>★</i>' : ''}</button>`;
    }
    const ctas = Datos.cuentas(true);
    const esMesActual = y === hoy.getFullYear() && m === hoy.getMonth();
    return `
      <div class="titulo-pagina"><button class="btn-volver" onclick="App.ir('trabajo')">‹</button><h1>${esc(t.nombre)}</h1><button class="btn-volver" style="margin-left:auto" onclick="App.ir('trabajoNuevo',{id:${t.id}})">✏️</button></div>
      <div class="card-saldo" style="background:linear-gradient(135deg,#F79009,#DC6803);box-shadow:0 12px 30px rgba(220,104,3,.3)">
        <p class="etq">${esMesActual ? 'Ganado hasta hoy' : 'Ganado en ' + nombreMes(ref)}${r.hoyCuenta && esMesActual ? ' · hoy cuenta ✓' : ''}</p>
        <p class="monto">${Moneda.fmt(r.ganado)}</p>
        <p class="cuentas-min">de ${Moneda.fmt(r.proyeccion)} proyectados · ${r.diasContados}/${r.diasMes} días</p>
        <div style="height:8px;border-radius:999px;background:rgba(255,255,255,.25);margin-top:10px;overflow:hidden"><div style="height:100%;width:${pct}%;background:#fff"></div></div>
      </div>
      <div class="duo">
        <div class="mini"><p class="etq">Vale tu día</p><p class="val">${Moneda.fmt(r.valorDia)}</p></div>
        <div class="mini"><p class="etq">Vale tu hora</p><p class="val">${Moneda.fmt(r.valorHora)}</p></div>
      </div>
      <div class="card" style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px">
        <button class="btn-volver" onclick="App.moverMesTrabajo(-1)">‹</button><b>${nombreMes(ref)}</b><button class="btn-volver" onclick="App.moverMesTrabajo(1)">›</button>
      </div>
      <div class="card">
        <div class="cal-cab">${DIAS_SEMANA.map((d) => `<span>${d}</span>`).join('')}</div>
        <div class="cal-grid">${celdas}</div>
        <p class="cal-leyenda"><span class="sw on"></span> cuenta &nbsp; <span class="sw falta"></span> falté &nbsp; <span class="sw extra"></span> día extra &nbsp; <span class="sw off"></span> descanso &nbsp; ★ feriado</p>
        <p style="font-size:12px;color:var(--texto-tenue);margin:6px 2px 0">Toca un día para prenderlo o apagarlo. ${modoTexto(t)} · ${t.feriadosPagados ? 'feriados pagados' : 'feriados no pagados'}.</p>
      </div>
      ${r.cobrado !== null
        ? `<div class="card" style="text-align:center;color:var(--ingreso);font-weight:700">✓ Sueldo de ${nombreMes(ref)} cobrado: ${Moneda.fmt(r.cobrado)}</div>`
        : r.mesClave > hoyInput().slice(0, 7)
        ? `<div class="card" style="text-align:center;color:var(--texto-tenue)">Este mes todavía no empezó; podrás cobrarlo cuando llegue.</div>`
        : `<div class="card">
            <b>¿Ya te pagaron ${nombreMes(ref)}?</b>
            <p style="font-size:13px;color:var(--texto-suave);margin:6px 0 10px">Convierte lo ganado en un ingreso real (suma a tu saldo) y deja de contarse como «posible».</p>
            <div class="campo"><label>Monto recibido (S/)</label><input class="entrada" id="tc-monto" type="text" inputmode="decimal" value="${r.proyeccion}" /></div>
            <div class="campo"><label>Cuenta</label><select class="entrada" id="tc-cuenta">${ctas.map((c) => `<option value="${c.id}" ${t.cuentaId === c.id ? 'selected' : ''}>${c.icono} ${esc(c.nombre)}</option>`).join('')}</select></div>
            <button class="btn" onclick="App.cobrarSueldo(${t.id},'${r.mesClave}')">💰 Ya me pagaron</button>
          </div>`}
      <div style="height:14px"></div>`;
  });

  // ---------- Compartir pandero (texto e imagen) ----------
  // Texto con formato de WhatsApp y una IMAGEN dibujada con <canvas> (sin
  // librerías): cabecera violeta, datos del pandero, ronda actual con quién
  // pagó, y la tabla de turnos (quién cobra, cuándo, estado). No se incluye
  // el DNI: es un dato sensible y el resumen va a un grupo.
  function estadoTurno(t, ronda) { return t.cobrado ? 'cobró ✓' : (ronda && t.id === ronda.id) ? 'le toca ahora ➜' : 'pendiente'; }
  function textoPandero(p) {
    const r = Datos.resumenPandero(p), turnos = Datos.turnosDe(p.id), ronda = Datos.rondaActual(p.id);
    const L = [`🤝 *Pandero «${p.nombre}»*`, `👥 ${p.numParticipantes} participantes · cuota ${Moneda.fmt(p.cuotaMonto)} ${p.frecuencia.toLowerCase()} · pozo ${Moneda.fmt(r.montoARecibir)}`, `📊 Rondas cobradas: ${r.turnosCobrados}/${r.totalTurnos}`, ''];
    if (ronda) {
      const pag = Array.isArray(ronda.pagaron) ? ronda.pagaron : [];
      L.push(`🔔 *Ronda ${ronda.numeroTurno}* — cobra *${ronda.nombreParticipante}* el ${fechaLarga(ronda.fechaCobro)}`, `💵 Pagaron ${pag.length}/${turnos.length} (${Moneda.fmt(pag.length * Number(p.cuotaMonto))})`);
      const faltan = turnos.filter((t) => !pag.includes(t.numeroTurno)).map((t) => t.nombreParticipante);
      if (faltan.length) L.push(`⏳ Faltan: ${faltan.join(', ')}`);
      L.push('');
    } else L.push('🎉 *Pandero completado: todos cobraron.*', '');
    L.push('*Turnos*');
    for (const t of turnos) L.push(`${t.cobrado ? '✅' : (ronda && t.id === ronda.id) ? '➡️' : '⬜'} ${t.numeroTurno}. ${t.nombreParticipante} · ${new Date(t.fechaCobro).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })} · ${estadoTurno(t, ronda)}`);
    L.push('', '_Enviado desde Panderito_ 🐷');
    return L.join('\n');
  }
  function imagenPandero(p) {
    const r = Datos.resumenPandero(p), turnos = Datos.turnosDe(p.id), ronda = Datos.rondaActual(p.id);
    const W = 1080, filaH = 78, cab = 380, rondaH = ronda ? 190 : 120, pie = 90;
    const H = cab + rondaH + 70 + turnos.length * filaH + pie;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    const F = (peso, px) => `${peso} ${px}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
    // Fondo y cabecera
    g.fillStyle = '#F6F5FB'; g.fillRect(0, 0, W, H);
    const grad = g.createLinearGradient(0, 0, W, cab); grad.addColorStop(0, '#7D6BF0'); grad.addColorStop(1, '#5342C7');
    g.fillStyle = grad; g.fillRect(0, 0, W, cab);
    g.fillStyle = 'rgba(255,255,255,.10)'; g.beginPath(); g.arc(W - 80, 60, 220, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff'; g.font = F(800, 30); g.fillText('🤝 PANDERO', 56, 80);
    g.font = F(800, 62); g.fillText(recortar(g, p.nombre, W - 112), 56, 160);
    g.font = F(500, 30); g.fillStyle = 'rgba(255,255,255,.9)';
    g.fillText(`${p.numParticipantes} participantes · cuota ${Moneda.fmt(p.cuotaMonto)} ${p.frecuencia.toLowerCase()}`, 56, 220);
    g.fillText(`Pozo por ronda: ${Moneda.fmt(r.montoARecibir)}   ·   Rondas cobradas: ${r.turnosCobrados}/${r.totalTurnos}`, 56, 268);
    g.font = F(500, 24); g.fillStyle = 'rgba(255,255,255,.75)';
    g.fillText('Situación al ' + new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), 56, 330);
    // Ronda actual
    let y = cab + 30;
    tarjeta(g, 40, y, W - 80, rondaH - 30);
    if (ronda) {
      const pag = Array.isArray(ronda.pagaron) ? ronda.pagaron : [];
      g.fillStyle = '#6D5AE6'; g.font = F(800, 30); g.fillText(`RONDA ${ronda.numeroTurno} · cobra ${ronda.nombreParticipante}`, 72, y + 52);
      g.fillStyle = '#4B5563'; g.font = F(500, 27); g.fillText(`Fecha: ${fechaLarga(ronda.fechaCobro)}`, 72, y + 96);
      g.fillStyle = '#12B76A'; g.font = F(800, 30); g.fillText(`Pagaron ${pag.length}/${turnos.length} → ${Moneda.fmt(pag.length * Number(p.cuotaMonto))}`, 72, y + 140);
      const faltan = turnos.filter((t) => !pag.includes(t.numeroTurno)).map((t) => t.nombreParticipante);
      if (faltan.length) { g.fillStyle = '#B54708'; g.font = F(500, 25); g.fillText(recortar(g, 'Faltan: ' + faltan.join(', '), W - 500), 560, y + 140); }
    } else { g.fillStyle = '#12B76A'; g.font = F(800, 32); g.fillText('🎉 Pandero completado: todos cobraron', 72, y + 60); }
    // Tabla de turnos
    y += rondaH;
    g.fillStyle = '#6B7280'; g.font = F(700, 24);
    g.fillText('#', 72, y + 30); g.fillText('PARTICIPANTE', 130, y + 30); g.fillText('FECHA DE COBRO', 600, y + 30); g.fillText('ESTADO', 860, y + 30);
    y += 50;
    turnos.forEach((t, i) => {
      const esRonda = ronda && t.id === ronda.id;
      g.fillStyle = esRonda ? '#EEEBFF' : i % 2 ? '#FFFFFF' : '#F0EFF7'; g.fillRect(40, y, W - 80, filaH);
      g.fillStyle = t.cobrado ? '#12B76A' : esRonda ? '#6D5AE6' : '#9CA3AF'; g.beginPath(); g.arc(88, y + filaH / 2, 18, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff'; g.font = F(800, 20); g.textAlign = 'center'; g.fillText(String(t.numeroTurno), 88, y + filaH / 2 + 7); g.textAlign = 'left';
      g.fillStyle = '#111827'; g.font = F(esRonda ? 800 : 600, 28); g.fillText(recortar(g, t.nombreParticipante, 440), 130, y + filaH / 2 + 10);
      g.fillStyle = '#4B5563'; g.font = F(500, 26); g.fillText(new Date(t.fechaCobro).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }), 600, y + filaH / 2 + 10);
      g.fillStyle = t.cobrado ? '#12B76A' : esRonda ? '#6D5AE6' : '#9CA3AF'; g.font = F(700, 26); g.fillText(estadoTurno(t, ronda), 860, y + filaH / 2 + 10);
      y += filaH;
    });
    g.fillStyle = '#9CA3AF'; g.font = F(500, 24); g.fillText('Generado con Panderito · panderito.vercel.app', 56, H - 34);
    return new Promise((res) => c.toBlob(res, 'image/png'));
  }
  function tarjeta(g, x, y, w, h) { g.fillStyle = '#fff'; g.shadowColor = 'rgba(0,0,0,.08)'; g.shadowBlur = 16; g.shadowOffsetY = 6; g.beginPath(); g.roundRect(x, y, w, h, 24); g.fill(); g.shadowColor = 'transparent'; }
  function recortar(g, txt, maxW) { let s = String(txt); if (g.measureText(s).width <= maxW) return s; while (s.length > 1 && g.measureText(s + '…').width > maxW) s = s.slice(0, -1); return s + '…'; }
  async function compartirArchivo(blob, nombre, texto) {
    const archivo = new File([blob], nombre, { type: blob.type });
    if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
      try { await navigator.share({ files: [archivo], text: texto }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    // Sin hoja de compartir con archivos (PC): se descarga la imagen
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    toast('Imagen descargada; envíala al grupo ✓');
  }

  // ============================================================
  //  METAS DE AHORRO (2 vistas)
  //  'metas': tarjetas con barra de progreso, % y "¡Lograda! 🎉";
  //  botones Abonar y Eliminar. 'metaNueva': formulario de creación.
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
    <div class="campo"><label>Monto meta (S/)</label><input class="entrada" id="m-meta" type="text" inputmode="decimal" placeholder="0.00" /></div>
    <div class="campo"><label>Ya tengo ahorrado (opcional)</label><input class="entrada" id="m-actual" type="text" inputmode="decimal" placeholder="0.00" /></div>
    <div class="campo"><label>Fecha objetivo (opcional)</label><input class="entrada" id="m-fecha" type="date" /></div>
    <button class="btn" onclick="App.guardarMeta()">✓ Crear meta</button><div style="height:14px"></div>`);

  // ============================================================
  //  RECURRENTES / PAGOS FIJOS (2 vistas)
  //  'recurrentes': lista con "vence en X días" y botón Pagar (crea el
  //  gasto y avanza la fecha). 'recurrenteNuevo': concepto, proveedor,
  //  monto, categoría, cuenta, frecuencia y próximo pago.
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
      <div class="campo"><label>Monto (S/)</label><input class="entrada" id="r-monto" type="text" inputmode="decimal" placeholder="0.00" /></div>
      <div class="campo"><label>Categoría</label><select class="entrada" id="r-cat">${cats.map((c) => `<option value="${c.id}">${c.icono} ${esc(c.nombre)}</option>`).join('')}</select></div>
      <div class="campo"><label>Cuenta</label><select class="entrada" id="r-cuenta">${ctas.map((c) => `<option value="${c.id}">${c.icono} ${esc(c.nombre)}</option>`).join('')}</select></div>
      <div class="campo"><label>Frecuencia</label><select class="entrada" id="r-frec">${opcsFrec('Mensual')}</select></div>
      <div class="campo"><label>Próximo pago</label><input class="entrada" id="r-fecha" type="date" value="${hoyInput()}" /></div>
      <button class="btn" onclick="App.guardarRecurrente()">✓ Guardar</button><div style="height:14px"></div>`;
  });

  // ============================================================
  //  PRESUPUESTOS (2 vistas)
  //  'presupuestos': tarjetas por categoría con semáforo 🟢/🟡/🔴
  //  (En control / Cerca del límite ≥80% / Excedido ≥100%).
  //  'presupuestoNuevo': categoría + límite + período.
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
      <div class="campo"><label>Límite (S/)</label><input class="entrada" id="b-monto" type="text" inputmode="decimal" placeholder="0.00" /></div>
      <div class="campo"><label>Período</label><select class="entrada" id="b-periodo">${opcsFrec('Mensual')}</select></div>
      <p style="font-size:13px;color:var(--texto-tenue);margin:0 2px 14px">Se te avisará al llegar al 80% y al 100% del límite en el período.</p>
      <button class="btn" onclick="App.guardarPresupuesto()">✓ Guardar</button><div style="height:14px"></div>`;
  });

  // ============================================================
  //  ACCIONES — funciones públicas que llaman los botones (onclick)
  //  Patrón general: leer inputs → validar (toast si falta algo) →
  //  guardar vía Datos.* → toast de confirmación → render()/ir().
  //  Las eliminaciones siempre piden confirm() antes.
  // ============================================================
  const acciones = {
    ir,
    filtrarHist(tipo) { filtroHist.tipo = tipo; render(); },
    compartirResumen(periodo) { compartirTexto(textoResumen(periodo)); },
    moverMes(delta) { refReporte = new Date(refReporte.getFullYear(), refReporte.getMonth() + delta, 1); render(); },
    // setTipo lee primero los inputs para NO perder monto/fecha/nota al cambiar Gasto↔Ingreso
    setTipo(t) { leerInputsForm(); form.tipo = t; form.categoriaId = null; render(); sincronizarInputsForm(); },
    setCategoria(id) { leerInputsForm(); form.categoriaId = id; render(); sincronizarInputsForm(); },
    guardarMov() {
      leerInputsForm();
      const monto = numero(form.monto);
      if (!monto || monto <= 0) return toast('Ingresa un monto válido (ej. 12.50)');
      if (monto > 99999999) return toast('El monto es demasiado grande');
      if (!form.categoriaId) return toast('Elige una categoría');
      if (!form.cuentaId) return toast('Elige una cuenta');
      const fechaIso = fechaDesdeInput(form.fecha);
      if (!fechaIso) return toast('Elige una fecha');
      if (esFutura(form.fecha)) return toast('La fecha no puede ser futura');
      const ok = Datos.guardarMovimiento({
        id: form.id, monto, tipo: form.tipo,
        categoriaId: form.categoriaId, cuentaId: Number(form.cuentaId),
        fecha: fechaIso, nota: (form.nota || '').slice(0, 200),
      });
      if (!ok) return; // el evento 'panderito:error-guardado' ya mostró el aviso
      const editaba = !!form.id;
      form = {};
      toast(editaba ? 'Cambios guardados ✓' : 'Movimiento registrado ✓');
      ir('inicio');
    },
    eliminarMov(id) {
      if (!confirm('¿Eliminar este movimiento? No se puede deshacer.')) return;
      Datos.eliminarMovimiento(id); toast('Movimiento eliminado'); ir('movimientos');
    },
    borrarCategoria(id) {
      if (!confirm('¿Eliminar esta categoría?')) return;
      if (Datos.eliminarCategoria(id)) { toast('Categoría eliminada'); render(); }
      else toast('No se puede: está en uso (movimientos, pagos fijos o presupuestos)');
    },
    // ----- Préstamos -----
    guardarPrestamo() {
      const gv = (id) => (document.getElementById(id)?.value || '').trim();
      const persona = gv('p-persona'); const monto = numero(gv('p-monto'));
      if (!persona) return toast('Escribe el nombre de la persona');
      if (!monto || monto <= 0) return toast('Ingresa un monto válido');
      const fecha = fechaDesdeInput(gv('p-fecha')); if (!fecha) return toast('Elige una fecha');
      Datos.guardarPrestamo({ persona, monto: Datos.r2(monto), tipo: gv('p-tipo'), fecha, nota: gv('p-nota'), estado: 'Pendiente' });
      toast('Préstamo registrado ✓'); ir('prestamos');
    },
    abonarPrestamo(id) {
      const p = Datos.prestamo(id); if (!p) return;
      const pend = Datos.saldoPendiente(p);
      const v = prompt(`¿Cuánto abona? (pendiente: ${Moneda.fmt(pend)})`, '');
      if (v === null) return;
      const monto = numero(v); if (!monto || monto <= 0) return toast('Monto inválido');
      if (monto > pend + 0.005) return toast(`El abono supera lo pendiente (${Moneda.fmt(pend)})`);
      Datos.registrarAbono(id, monto); toast('Abono registrado ✓'); render();
    },
    pagarPrestamo(id) { if (!confirm('¿Marcar como totalmente pagado?')) return; Datos.marcarPagadoPrestamo(id); toast('Préstamo saldado ✓'); render(); },
    borrarPrestamo(id) { if (!confirm('¿Eliminar este préstamo y sus abonos?')) return; Datos.eliminarPrestamo(id); toast('Préstamo eliminado'); ir('prestamos'); },

    // ----- Panderos -----
    guardarPandero() {
      const gv = (id) => (document.getElementById(id)?.value || '').trim();
      const nombre = gv('pa-nombre'); const num = parseInt(gv('pa-num'), 10); const cuota = numero(gv('pa-cuota')); const turno = parseInt(gv('pa-turno'), 10) || 1;
      if (!nombre) return toast('Escribe un nombre');
      if (!num || num < 2) return toast('Debe haber al menos 2 participantes');
      if (num > 60) return toast('Máximo 60 participantes');
      if (!cuota || cuota <= 0) return toast('Ingresa la cuota');
      if (turno < 1 || turno > num) return toast('Tu turno debe estar entre 1 y ' + num);
      const fechaInicio = fechaDesdeInput(gv('pa-inicio')); if (!fechaInicio) return toast('Elige la fecha de inicio');
      const nombres = (document.getElementById('pa-nombres')?.value || '').split('\n').map((s) => s.trim());
      Datos.crearPanderoConTurnos({ nombre, numParticipantes: num, cuotaMonto: Datos.r2(cuota), frecuencia: gv('pa-frec'), fechaInicio, miTurno: turno, activo: true }, nombres);
      toast('Pandero creado ✓'); ir('panderos');
    },
    cobrarTurno(panderoId, turnoId, cobrado) { Datos.marcarCobrado(turnoId, cobrado); render(); },
    alternarPago(turnoId, numero) { Datos.alternarPagoRonda(turnoId, numero); render(); },
    async compartirPandero(id, modo) {
      const p = Datos.pandero(id); if (!p) return;
      if (modo === 'texto') return compartirTexto(textoPandero(p));
      try {
        toast('Generando imagen…');
        const blob = await imagenPandero(p);
        await compartirArchivo(blob, `pandero-${p.nombre.replace(/[^\w-]+/g, '_')}-${hoyInput()}.png`, `Pandero «${p.nombre}» · situación al ${hoyInput()}`);
      } catch (e) { console.warn(e); toast('No se pudo generar la imagen; te comparto el texto'); compartirTexto(textoPandero(p)); }
    },
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
      const nombre = gv('c-nombre'); const tipo = gv('c-tipo'); const saldo = numero(gv('c-saldo')) || 0;
      if (!nombre) return toast('Escribe un nombre');
      if (Datos.existeCuentaConNombre(nombre, id || null)) return toast('Ya tienes una cuenta con ese nombre');
      const t = Datos.TIPOS_CUENTA.find((x) => x.id === tipo) || Datos.TIPOS_CUENTA[0];
      Datos.guardarCuenta({ id: id || null, nombre, tipo, saldoInicial: saldo, icono: t.icono, color: t.color, activa: true });
      toast(id ? 'Cuenta actualizada ✓' : 'Cuenta creada ✓'); ir('cuentas');
    },
    borrarCuenta(id) {
      if (!confirm('¿Eliminar esta cuenta?')) return;
      if (Datos.eliminarCuenta(id)) { toast('Cuenta eliminada'); ir('cuentas'); } else toast('No se puede: tiene movimientos o pagos fijos');
    },
    borrarPandero(id) { if (!confirm('¿Eliminar este pandero y sus turnos?')) return; Datos.eliminarPandero(id); toast('Pandero eliminado'); ir('panderos'); },
    pagarCuota(id) {
      const p = Datos.pandero(id); if (!p) return;
      if (!confirm(`¿Registrar el pago de tu cuota (${Moneda.fmt(p.cuotaMonto)}) como gasto? Se descontará de tu saldo y se marcará la ronda.`)) return;
      const mov = Datos.pagarCuotaPandero(id);
      toast(mov ? 'Cuota pagada y descontada ✓' : 'Ya pagaste todas las cuotas de este pandero'); render();
    },
    cobrarPozo(id) {
      const p = Datos.pandero(id); if (!p) return;
      if (p.pozoCobrado) return toast('El pozo de este pandero ya fue cobrado');
      const r = Datos.resumenPandero(p);
      if (!confirm(`¿Registrar el cobro del pozo (${Moneda.fmt(r.montoARecibir)}) como ingreso? Se sumará a tu saldo (solo se puede una vez).`)) return;
      Datos.cobrarPozoPandero(id); toast('¡Pozo cobrado y sumado! 🎉'); render();
    },

    // ----- Trabajo -----
    cambioModoTrabajo(v) { const l = document.getElementById('t-monto-etq'); if (l) l.textContent = v === 'Dia' ? 'Pago por día (S/)' : v === 'Hora' ? 'Pago por hora (S/)' : 'Sueldo mensual (S/)'; },
    guardarTrabajoForm(id) {
      const gv = (x) => (document.getElementById(x)?.value || '').trim();
      const nombre = gv('t-nombre'); const monto = numero(gv('t-monto')); const horas = parseInt(gv('t-horas'), 10) || 8;
      if (!nombre) return toast('Escribe un nombre para el trabajo');
      if (!monto || monto <= 0) return toast('Ingresa el monto que te pagan');
      if (horas < 1 || horas > 24) return toast('Las horas por día deben estar entre 1 y 24');
      const dias = [...document.querySelectorAll('#t-dias .dia-chip')].map((b) => (b.classList.contains('on') ? 1 : 0));
      if (!dias.some(Boolean)) return toast('Marca al menos un día de trabajo');
      Datos.guardarTrabajo({ id: id || null, nombre, modo: gv('t-modo') || 'Mensual', monto, horasDia: horas, dias, feriadosPagados: !!document.getElementById('t-feriados')?.checked, cuentaId: Number(gv('t-cuenta')) || null });
      toast(id ? 'Trabajo actualizado ✓' : 'Trabajo creado ✓'); ir('trabajo');
    },
    pausarTrabajo(id) { const t = Datos.trabajo(id); if (!t) return; Datos.guardarTrabajo({ id, activo: t.activo === false }); toast(t.activo === false ? 'Trabajo reactivado' : 'Trabajo pausado'); ir('trabajo'); },
    borrarTrabajo(id) { if (!confirm('¿Eliminar este trabajo y su calendario? Los ingresos ya cobrados se conservan.')) return; Datos.eliminarTrabajo(id); toast('Trabajo eliminado'); ir('trabajo'); },
    moverMesTrabajo(delta) { refTrabajo = new Date(refTrabajo.getFullYear(), refTrabajo.getMonth() + delta, 1); render(); },
    alternarDia(trabajoId, clave) { Datos.alternarDiaTrabajo(trabajoId, clave); render(); },
    cobrarSueldo(trabajoId, mesClave) {
      const monto = numero(document.getElementById('tc-monto')?.value);
      if (!monto || monto <= 0) return toast('Ingresa el monto recibido');
      const cuentaId = Number(document.getElementById('tc-cuenta')?.value) || null;
      if (!confirm(`¿Registrar ${Moneda.fmt(monto)} como ingreso real de ${mesClave}?`)) return;
      const mov = Datos.cobrarTrabajo(trabajoId, mesClave, monto, cuentaId);
      toast(mov ? '¡Sueldo registrado en tus ingresos! 💰' : (mesClave > hoyInput().slice(0, 7) ? 'Ese mes todavía no empezó' : 'Ese mes ya estaba cobrado')); render();
    },

    // ----- Metas -----
    guardarMeta() {
      const gv = (id) => (document.getElementById(id)?.value || '').trim();
      const nombre = gv('m-nombre'); const metaMonto = numero(gv('m-meta')); const actual = numero(gv('m-actual')) || 0; const fecha = gv('m-fecha');
      if (!nombre) return toast('Escribe un nombre');
      if (!metaMonto || metaMonto <= 0) return toast('Ingresa el monto meta');
      if (actual < 0) return toast('Lo ahorrado no puede ser negativo');
      Datos.guardarMeta({ nombre, montoMeta: Datos.r2(metaMonto), montoActual: Datos.r2(actual), fechaMeta: fechaDesdeInput(fecha) });
      toast('Meta creada ✓'); ir('metas');
    },
    abonarMeta(id) {
      const m = Datos.meta(id); if (!m) return;
      const v = prompt(`¿Cuánto abonas a «${m.nombre}»?`, ''); if (v === null) return;
      const monto = numero(v);
      if (!monto || monto <= 0) return toast('Monto inválido');
      Datos.abonarMeta(id, monto); toast('¡Abono a tu meta! 🎯'); render();
    },
    borrarMeta(id) { if (!confirm('¿Eliminar esta meta?')) return; Datos.eliminarMeta(id); toast('Meta eliminada'); render(); },

    // ----- Recurrentes -----
    guardarRecurrente() {
      const gv = (id) => (document.getElementById(id)?.value || '').trim();
      const nombre = gv('r-nombre'); const monto = numero(gv('r-monto'));
      if (!nombre) return toast('Escribe un nombre');
      if (!monto || monto <= 0) return toast('Ingresa el monto');
      if (!Number(gv('r-cat'))) return toast('Elige una categoría');
      if (!Number(gv('r-cuenta'))) return toast('Elige una cuenta');
      const proximaFecha = fechaDesdeInput(gv('r-fecha')); if (!proximaFecha) return toast('Elige la fecha del próximo pago');
      Datos.guardarRecurrente({ nombre, proveedor: gv('r-prov'), monto: Datos.r2(monto), categoriaId: Number(gv('r-cat')), cuentaId: Number(gv('r-cuenta')), frecuencia: gv('r-frec'), proximaFecha, activo: true });
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
      const cat = Number(gv('b-cat')); const limite = numero(gv('b-monto'));
      if (!cat) return toast('Elige una categoría');
      if (!limite || limite <= 0) return toast('Ingresa el límite');
      Datos.guardarPresupuesto({ categoriaId: cat, montoLimite: Datos.r2(limite), periodo: gv('b-periodo') });
      toast('Presupuesto guardado ✓'); ir('presupuestos');
    },
    borrarPresupuesto(id) { if (!confirm('¿Eliminar este presupuesto?')) return; Datos.eliminarPresupuesto(id); toast('Presupuesto eliminado'); render(); },

    async activarNotis() {
      if (!('Notification' in window)) return toast('Tu navegador no soporta notificaciones');
      let perm;
      try { perm = await Notification.requestPermission(); } catch (e) { perm = 'denied'; }
      if (perm === 'granted') { toast('Recordatorios activados 🔔 (te avisamos al abrir la app)'); acciones.mostrarPendientesNoti(true); }
      else toast('Permiso de notificaciones denegado');
    },
    // Chrome Android NO permite `new Notification(...)` (lanza "Illegal constructor"):
    // hay que notificar a través del Service Worker (registration.showNotification).
    // El día solo se marca como "ya avisado" cuando la notificación realmente salió.
    async mostrarPendientesNoti(forzar) {
      const pend = Datos.pendientes(7);
      if (!('Notification' in window) || Notification.permission !== 'granted') {
        if (forzar) return toast(pend.length ? `Tienes ${pend.length} pendiente(s). Activa recordatorios para avisos.` : 'Sin pendientes por ahora ✓');
        return;
      }
      if (!pend.length) { if (forzar) toast('Sin pendientes por ahora ✓'); return; }
      const hoyClave = new Date().toDateString();
      if (!forzar && lsGet('panderito.noti.dia') === hoyClave) return;
      const p0 = pend[0];
      const titulo = `Panderito — ${pend.length} pendiente${pend.length === 1 ? '' : 's'}`;
      const opts = { body: `${p0.emo} ${p0.titulo} (${p0.detalle})`, icon: 'icons/panderito-icon.svg', tag: 'panderito-pendientes' };
      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          await reg.showNotification(titulo, opts);
        } else {
          new Notification(titulo, opts);
        }
        lsSet('panderito.noti.dia', hoyClave);
      } catch (e) {
        if (forzar) toast(`Tienes ${pend.length} pendiente(s) (no se pudo mostrar la notificación)`);
      }
    },
    setTema(t) { aplicarTema(t); render(); },
    // ----- Perfil -----
    cambioProfesion(v) { const c = document.getElementById('pf-otro-campo'); if (c) c.style.display = v === 'Otro' ? '' : 'none'; if (v === 'Otro') document.getElementById('pf-otro')?.focus(); },
    guardarPerfilForm() {
      const gv = (x) => (document.getElementById(x)?.value || '').trim();
      const profesion = gv('pf-prof');
      if (profesion === 'Otro' && !gv('pf-otro')) return toast('Escribe tu profesión o elige una de la lista');
      const p = Datos.guardarPerfil({ nombre: gv('pf-nombre'), profesion, profesionOtra: profesion === 'Otro' ? gv('pf-otro') : '' });
      toast(p.nombre ? `¡Listo, ${p.nombre}! ✓` : 'Perfil guardado ✓'); ir('inicio');
    },
    borrarPerfil() { if (!confirm('¿Limpiar tu nombre y profesión?')) return; Datos.guardarPerfil({}); toast('Perfil limpiado'); render(); },
    // Novedades: «Entendido» recuerda la versión vista; «Ver novedades» la vuelve a mostrar en Inicio
    cerrarNovedades() { lsSet('panderito.novedades.vista', VERSION); render(); },
    verNovedades() { try { localStorage.removeItem('panderito.novedades.vista'); } catch (e) { /* noop */ } ir('inicio'); },
    // Descarga con fecha en el nombre (no pisa respaldos anteriores); el blob se
    // libera después de que el navegador tomó el archivo.
    exportarDatos() { descargarJson(Datos.exportar(), `panderito-respaldo-${hoyInput()}.json`); toast('Copia descargada ✓'); },
    exportarCorrupto() { const t = lsGet('panderito.datos.v1.corrupto'); if (t) descargarJson(t, `panderito-datos-ilegibles-${hoyInput()}.json`); },
    // Restaurar: lee el .json elegido, valida y reemplaza (con confirmación).
    importarDatos(input) {
      const archivo = input && input.files && input.files[0];
      if (!archivo) return;
      input.value = ''; // permite volver a elegir el mismo archivo
      if (archivo.size > 20 * 1024 * 1024) return toast('El archivo es demasiado grande');
      if (!confirm(`¿Restaurar «${archivo.name}»? Esto REEMPLAZA todos tus datos actuales.`)) return;
      const lector = new FileReader();
      lector.onerror = () => toast('No se pudo leer el archivo');
      lector.onload = () => {
        const r = Datos.importar(String(lector.result || ''));
        if (!r.ok) return toast('No se restauró: ' + r.error);
        form = {}; toast(`Restaurado ✓ (${r.resumen})`); ir('inicio'); render();
      };
      lector.readAsText(archivo);
    },
    borrarTodo() {
      if (!confirm('¿Borrar TODOS tus datos y empezar de cero? No se puede deshacer.')) return;
      Datos.reiniciar(); toast('Datos reiniciados'); ir('inicio');
    },
  };

  // ---------- Sincronización de inputs del formulario de registro ----------
  // leerInputsForm(): copia lo que hay en los inputs del DOM hacia `form`
  // ANTES de re-renderizar (para no perder lo escrito).
  // sincronizarInputsForm(): devuelve el monto al input después del render.
  function leerInputsForm() {
    const m = document.getElementById('monto'); if (m) form.monto = m.value;
    const c = document.getElementById('cuenta'); if (c) form.cuentaId = Number(c.value);
    const f = document.getElementById('fecha'); if (f) form.fecha = f.value;
    const n = document.getElementById('nota'); if (n) form.nota = n.value;
  }
  function sincronizarInputsForm() {
    const m = document.getElementById('monto'); if (m) m.value = form.monto || '';
  }
  // descargarJson(texto, nombre): genera el archivo y dispara la descarga
  function descargarJson(texto, nombre) {
    const blob = new Blob([texto], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  // ---------- Tema ----------
  // aplicarTema('claro'|'oscuro'|'sistema'): guarda la preferencia,
  // resuelve 'sistema' según el SO, marca <html data-tema="..."> (el CSS
  // cambia las variables de color) y ajusta el color de la barra del navegador.
  function aplicarTema(t) {
    lsSet('panderito.tema', t);
    let efectivo = t;
    if (t === 'sistema') efectivo = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
    document.documentElement.setAttribute('data-tema', efectivo);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', efectivo === 'oscuro' ? '#15171F' : '#6D5AE6');
  }

  // ---------- Instalación PWA ----------
  // El navegador dispara 'beforeinstallprompt' cuando la app es instalable;
  // guardamos ese evento y mostramos nuestro banner "Instala Panderito".
  // Al tocar Instalar se relanza el diálogo nativo del navegador.
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
  // iniciar() corre una sola vez al cargar la página (DOMContentLoaded):
  // aplica el tema guardado, escucha cambios de tema del sistema, conecta
  // los botones de la barra inferior, engancha el router al 'hashchange',
  // pinta la primera vista, muestra la notificación diaria de pendientes
  // y registra el Service Worker (sw.js) para que funcione offline.
  function iniciar() {
    aplicarTema(lsGet('panderito.tema') || 'sistema');
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if ((lsGet('panderito.tema') || 'sistema') === 'sistema') aplicarTema('sistema');
    });
    document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => {
      const ruta = t.dataset.ruta;
      if (ruta === 'registrar') form = {};
      // Si ya estamos en esa ruta el hash no cambia y no habría 'hashchange':
      // renderizamos a mano (evita el formulario "fantasma" al tocar ＋ dos veces).
      if (location.hash.replace(/^#/, '').split('?')[0] === ruta) { render(); return; }
      ir(ruta);
    }));
    window.addEventListener('hashchange', () => { if (!location.hash.startsWith('#registrar')) form = {}; render(); });
    // Si guardar() falla (almacenamiento lleno o bloqueado) la capa de datos avisa aquí
    document.addEventListener('panderito:error-guardado', () => {
      toast('⚠️ No se pudo guardar: almacenamiento lleno o bloqueado. Exporta una copia.');
    });
    render();
    try { acciones.mostrarPendientesNoti(false); } catch (e) { /* noop */ }

    if ('serviceWorker' in navigator) {
      // Si ya había un SW controlando la página y entra uno nuevo (subimos CACHE),
      // recargamos para no mezclar JS viejo con caché nueva. En la primera visita
      // no había controlador, así que no recarga.
      const habiaControlador = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!habiaControlador) return;
        toast('Actualizando Panderito…');
        setTimeout(() => location.reload(), 900);
      });
      navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW no registrado:', e));
    }
  }

  return { ...acciones, ir, iniciar, render };
})();

document.addEventListener('DOMContentLoaded', App.iniciar);
