import { Navbar } from '../components/Navbar.js';
import { Sidebar } from '../components/Sidebar.js';
import { state } from '../state.js';
import { request } from '../api.js';

let expandedPedidoId = null;
let detallesCache = {};
let pedidos = [];
let todosPedidos = [];
let filtroEstatus = 'pendiente';
let filtroFecha = '';
let filtroUsuario = '';
let empleados = [];
let cajaDiaria = 0;



// Cargar empleados para el modal
async function loadEmpleados() {
    try {
        const res = await request('perfil?limit=50&offset=0');
        empleados = (res?.items || []).filter(e => e.rol === 'admin' || e.rol === 'empleado');
    } catch(e) {
        console.error('Error cargando empleados:', e);
    }
}


export async function renderMisPedidos() {
    const app = document.getElementById('app');
    const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
    const isStaff = state.user?.rol === 'admin' || state.user?.rol === 'empleado';

    
    let loading = true;
    const estatusColors = {
        pendiente:  { bg: '#fff3e0', color: '#e65100', label: 'Pendiente' },
        entregado:  { bg: '#c8e6c9', color: '#1b5e20', label: 'Entregado' },
        cancelado:  { bg: '#ffebee', color: '#c62828', label: 'Cancelado' }
    };

    
    // Filtros visibles en tabs (sin preparando y listo)
    const estatusTabs = ['pendiente', 'entregado', 'cancelado'];

    // ========================================
    // Caja del día
    // ========================================
    function calcularCajaDia() {
        const hoy = new Date().toDateString();
        return pedidos
            .filter(p =>
                (p.estatus === 'entregado' || p.estatus === 'listo') &&
                new Date(p.fecha_creacion).toDateString() === hoy
            )
            .reduce((sum, p) => sum + Number(p.total), 0);
    }

    // ========================================
    // Cargar pedidos
    // ========================================
    async function loadPedidos() {
        loading = true;
        render();
        try {
            let response;
            if (isStaff) {
                response = await request(`pedidos/admin?limit=100&offset=0`); // sin filtro estatus
            } else {
                response = await request(`pedidos/mis-pedidos?id_usuario=${state.user.id}&limit=100&offset=0`);
            }
            todosPedidos = response?.items || (Array.isArray(response) ? response : []);
            pedidos = [...todosPedidos];
        } catch (e) {
            console.error('Error al cargar pedidos:', e);
            pedidos = [];
            todosPedidos = [];
        }
        loading = false;
        render();
    }

    // ========================================
    // Filtrar pedidos localmente
    // ========================================
    function getPedidosFiltrados() {
        const result= todosPedidos.filter(p => {
            if (filtroEstatus !== 'todos' && p.estatus !== filtroEstatus) return false;
            if (filtroUsuario) {
                const nombre = (p.cliente_nombre || '').toLowerCase();
                if (!nombre.includes(filtroUsuario.toLowerCase())) return false;
            }
            if (filtroFecha) {
                const fechaPedido = new Date(p.fecha_creacion).toISOString().slice(0, 10);
                if (fechaPedido !== filtroFecha) return false;
            }
            return true;
        });
        console.log('filtroEstatus:', filtroEstatus, 'resultado:', result.length);
        return result;
    }

    // ========================================
    // Cargar detalles
    // ========================================
    async function loadDetalles(pedidoId) {
        if (detallesCache[pedidoId]) return detallesCache[pedidoId];
        try {
            const response = await request(`detalle_pedido/pedido/${pedidoId}`);
            const items = response?.items || response || [];
            detallesCache[pedidoId] = items;
            return items;
        } catch (e) {
            console.error(`Error detalles pedido ${pedidoId}:`, e);
            return [];
        }
    }

    window._nbCancelarPedido = async function(pedidoId) {
        if (!confirm(`¿Cancelar el pedido #${pedidoId}? Se regresará el stock.`)) return;
        try {
            const detalles = await loadDetalles(pedidoId);
            await request(`pedidos/${pedidoId}/estatus?estatus=cancelado`, 'PATCH');
            for (const item of detalles) {
                await request(`productos/${item.id_producto}/stock`, 'PATCH', { cantidad: item.cantidad });
            }
            delete detallesCache[pedidoId];
            pedidos = pedidos.map(p => p.id === pedidoId ? { ...p, estatus: 'cancelado' } : p);
            render();
            window._nbShowToast?.('Pedido cancelado y stock restaurado', 'success');
        } catch (e) {
            window._nbShowToast?.('Error al cancelar el pedido', 'error');
        }
    };

    window._nbCambiarEstatus = async function(pedidoId, nuevoEstatus) {
        if (nuevoEstatus === 'entregado') {
            // Mostrar modal para seleccionar empleados
            const modalHtml = `
            <div id="modal-entrega" style="
                position: fixed; inset: 0; background: rgba(0,0,0,0.5);
                display: flex; align-items: center; justify-content: center; z-index: 9999;
            ">
                <div style="background: white; border-radius: 20px; padding: 2rem; width: 380px; max-width: 90vw; box-shadow: 0 20px 60px rgba(0,0,0,0.2);">
                    <h3 style="color: var(--nb-wine); margin: 0 0 1.5rem 0; font-size: 1.2rem;">
                        <i class="fas fa-check-circle"></i> Confirmar Entrega — Pedido #${pedidoId}
                    </h3>

                    <div style="margin-bottom: 1rem;">
                        <label style="display:block; font-size:0.75rem; font-weight:700; color:var(--nb-wine); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">
                            <i class="fas fa-user-cog"></i> Preparó
                        </label>
                        <select id="modal-preparador" style="width:100%; padding:10px; border:1px solid #f0e6d2; border-radius:10px; font-size:0.9rem; background:#faf7f2; outline:none; box-sizing:border-box;">
                            <option value="">— Sin asignar —</option>
                            ${empleados.map(e => `<option value="${e.id}">${e.nombre_usuario} (${e.rol})</option>`).join('')}
                        </select>
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                        <label style="display:block; font-size:0.75rem; font-weight:700; color:var(--nb-wine); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">
                            <i class="fas fa-user-check"></i> Entregó
                        </label>
                        <select id="modal-entrega-emp" style="width:100%; padding:10px; border:1px solid #f0e6d2; border-radius:10px; font-size:0.9rem; background:#faf7f2; outline:none; box-sizing:border-box;">
                            <option value="">— Sin asignar —</option>
                            ${empleados.map(e => `<option value="${e.id}">${e.nombre_usuario} (${e.rol})</option>`).join('')}
                        </select>
                    </div>

                    <div style="display:flex; gap:10px;">
                        <button onclick="window._nbConfirmarEntrega(${pedidoId})" style="
                            flex:1; background:var(--nb-wine); color:white; border:none;
                            border-radius:50px; padding:12px; font-weight:700; font-size:0.9rem;
                            cursor:pointer; text-transform:uppercase;
                        "><i class="fas fa-check"></i> Confirmar</button>
                        <button onclick="document.getElementById('modal-entrega').remove()" style="
                            flex:1; background:none; color:#666; border:2px solid #ddd;
                            border-radius:50px; padding:12px; font-weight:700; font-size:0.9rem; cursor:pointer;
                        ">Cancelar</button>
                    </div>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            return;
        }

        // Para otros estatus, cambiar directo
        try {
            await request(`pedidos/${pedidoId}/estatus?estatus=${nuevoEstatus}`, 'PATCH');
            const pedido = pedidos.find(p => p.id === pedidoId);
            if (pedido) pedido.estatus = nuevoEstatus;
            render();
        } catch (e) {
            console.error('Error al cambiar estatus:', e);
        }
    };

    window._nbConfirmarEntrega = async function(pedidoId) {
        const preparador = document.getElementById('modal-preparador')?.value || null;
        const entrega = document.getElementById('modal-entrega-emp')?.value || null;

        try {
            // Cambiar estatus
            await request(`pedidos/${pedidoId}/estatus?estatus=entregado`, 'PATCH');

            // Guardar empleados
            await request(`pedidos/${pedidoId}`, 'PUT', {
                id_empleado_preparador: preparador || null,
                id_empleado_entrega: entrega || null
            });

            const pedido = pedidos.find(p => p.id === pedidoId);
            if (pedido) {
                pedido.estatus = 'entregado';
                pedido.id_empleado_preparador = preparador;
                pedido.id_empleado_entrega = entrega;
            }

            document.getElementById('modal-entrega')?.remove();
            render();
            window._nbShowToast?.('Pedido marcado como entregado', 'success');
        } catch(e) {
            console.error('Error al confirmar entrega:', e);
            window._nbShowToast?.('Error al confirmar entrega', 'error');
        }
    };

    window._nbToggleDetalles = async function(pedidoId) {
        if (expandedPedidoId === pedidoId) { expandedPedidoId = null; render(); return; }
        expandedPedidoId = pedidoId;
        const detalles = await loadDetalles(pedidoId);
        detallesCache[pedidoId] = detalles;
        console.log('cache guardado:', detallesCache[pedidoId]);
        render();
    };

    window._nbFiltrarEstatus = function(estatus) {
        console.log('filtrando por:', estatus);
        filtroEstatus = estatus;
        expandedPedidoId = null;
        detallesCache = {};
        loadPedidos();
    };

    window._nbFiltrarFecha = function(fecha) {
        filtroFecha = fecha;
        render();
    };

    window._nbFiltrarUsuario = function(nombre) {
        filtroUsuario = nombre;
        render();
    };

    function formatFecha(fechaStr) {
        if (!fechaStr) return 'Sin fecha';
        try {
            return new Date(fechaStr).toLocaleDateString('es-MX', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch { return fechaStr; }
    }

    // ========================================
    // Render principal
    // ========================================
    function render() {
        const title = isStaff ? 'Todos los Pedidos' : 'Mis Pedidos';
        const pedidosFiltrados = getPedidosFiltrados();

        if (isStaff) {
            app.innerHTML = `
            <div data-view="mispedidos" style="display: flex; min-height: 100vh; width: 100vw; background: var(--nb-cream);">
                ${Sidebar('pedidos', calcularCajaDia())}
                <main style="flex: 1; overflow-y: auto; padding: 2rem;">
                    <h1 style="color: var(--nb-wine); font-size: 1.8rem; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 1.5rem;">
                        <i class="fas fa-globe"></i> ${title}
                    </h1>

                    ${renderFiltros()}
                    ${renderFiltrosExtra()}

                    ${loading ? renderLoadingState() : ''}
                    ${!loading && pedidosFiltrados.length === 0 ? renderEmptyState() : ''}
                    ${!loading && pedidosFiltrados.length > 0 ? renderPedidosList(pedidosFiltrados) : ''}
                </main>
            </div>`;
        } else {
            app.innerHTML = `
            <div data-view="mispedidos" style="width: 100%; min-height: 100vh; display: flex; flex-direction: column; background: var(--nb-cream);">
                ${Navbar()}
                <main style="flex: 1; width: 100%; max-width: 1000px; margin: 0 auto; padding: 2rem 20px;">
                    <div style="display: flex; align-items: center; margin-bottom: 1.5rem; gap: 15px;">
                        <button onclick="window.history.back()" style="
                            background: none; border: none; font-size: 1.3rem;
                            color: var(--nb-wine); cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: bold;
                        "><i class="fas fa-arrow-left"></i> Volver</button>
                        <h2 style="margin: 0 auto; text-transform: uppercase; color: var(--nb-wine); font-size: 1.8rem; letter-spacing: 2px;">${title}</h2>
                        <div style="width: 80px;"></div>
                    </div>

                    ${loading ? renderLoadingState() : ''}
                    ${!loading && pedidosFiltrados.length === 0 ? renderEmptyState() : ''}
                    ${!loading && pedidosFiltrados.length > 0 ? renderPedidosList(pedidosFiltrados) : ''}
                </main>
            </div>`;
        }
    }

    // ========================================
    // Tabs de estatus (staff)
    // ========================================
    function renderFiltros() {
        const tabs = [
            { key: 'todos', label: 'Todos' },
            ...estatusTabs.map(e => ({ key: e, label: estatusColors[e]?.label || e }))
        ];
        return `
        <div style="display: flex; gap: 8px; margin-bottom: 1rem; flex-wrap: wrap;">
            ${tabs.map(tab => {
                const isActive = filtroEstatus === tab.key;
                return `
                <button onclick="window._nbFiltrarEstatus('${tab.key}')" style="
                    padding: 8px 18px; border-radius: 50px;
                    border: 2px solid ${isActive ? 'var(--nb-wine)' : '#ede0cc'};
                    background: ${isActive ? 'var(--nb-wine)' : 'white'};
                    color: ${isActive ? 'white' : 'var(--nb-text)'};
                    font-weight: ${isActive ? 'bold' : 'normal'};
                    font-size: 0.9rem; cursor: pointer;
                ">${tab.label}</button>`;
            }).join('')}
        </div>`;
    }

    // ========================================
    // Filtros extra: fecha y usuario (staff)
    // ========================================
    function renderFiltrosExtra() {
        return `
        <div style="display: flex; gap: 12px; margin-bottom: 1.5rem; flex-wrap: wrap; align-items: center;">
            <div style="display: flex; align-items: center; gap: 8px; background: white; border: 1px solid #f0e6d2; border-radius: 10px; padding: 8px 14px;">
                <i class="fas fa-calendar" style="color: var(--nb-wine); font-size: 0.85rem;"></i>
                <input
                    type="date"
                    value="${filtroFecha}"
                    onchange="window._nbFiltrarFecha(this.value)"
                    style="border: none; outline: none; font-size: 0.9rem; color: var(--nb-text); background: transparent; cursor: pointer;"
                >
                ${filtroFecha ? `
                <button onclick="window._nbFiltrarFecha('')" style="
                    background: none; border: none; color: #999; cursor: pointer; font-size: 0.85rem; padding: 0;
                "><i class="fas fa-times"></i></button>` : ''}
            </div>

            <div style="display: flex; align-items: center; gap: 8px; background: white; border: 1px solid #f0e6d2; border-radius: 10px; padding: 8px 14px; flex: 1; min-width: 180px; max-width: 280px;">
                <i class="fas fa-user" style="color: var(--nb-wine); font-size: 0.85rem;"></i>
                <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value="${filtroUsuario}"
                    oninput="window._nbFiltrarUsuario(this.value)"
                    style="border: none; outline: none; font-size: 0.9rem; color: var(--nb-text); background: transparent; width: 100%;"
                >
                ${filtroUsuario ? `
                <button onclick="window._nbFiltrarUsuario(''); document.querySelector('input[placeholder=\\'Buscar cliente...\\']').value=''" style="
                    background: none; border: none; color: #999; cursor: pointer; font-size: 0.85rem; padding: 0;
                "><i class="fas fa-times"></i></button>` : ''}
            </div>
        </div>`;
    }

    function renderLoadingState() {
        return `
        <div style="text-align: center; padding: 60px 0;">
            <div style="width:50px;height:50px;border:4px solid #f0e6d2;border-top:4px solid var(--nb-wine);border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 15px;"></div>
            <p style="color:#999;">Cargando pedidos...</p>
            <style>@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>
        </div>`;
    }

    function renderEmptyState() {
        return `
        <div style="text-align: center; padding: 60px 0;">
            <i class="fas fa-box-open" style="font-size: 4rem; color: #eaddc5; margin-bottom: 20px;"></i>
            <p style="color: var(--nb-wine); font-size: 1.2rem; font-weight: bold;">
                ${isStaff ? 'No hay pedidos con este filtro' : 'Aún no tienes pedidos'}
            </p>
            ${!isStaff ? `<button onclick="window.location.hash='#/store'" style="margin-top:20px;padding:12px 25px;background:var(--nb-wine);color:white;border:none;border-radius:20px;cursor:pointer;font-weight:bold;">Ir a la Tienda</button>` : ''}
        </div>`;
    }

    function renderPedidosList(lista) {
        return `
        <div style="display: flex; flex-direction: column; gap: 15px;">
            ${lista.map(pedido => renderPedidoCard(pedido)).join('')}
        </div>`;
    }

    function renderPedidoCard(pedido) {
        const estatus = estatusColors[pedido.estatus] || { bg: '#f5f5f5', color: '#666', label: pedido.estatus };
        const isExpanded = expandedPedidoId === pedido.id;

        return `
        <div style="background:white;border-radius:18px;border:1px solid #f0e6d2;box-shadow:0 4px 12px rgba(0,0,0,0.04);overflow:hidden;">
            <div onclick="window._nbToggleDetalles(${pedido.id})" style="padding:20px;cursor:pointer;display:flex;align-items:center;gap:15px;flex-wrap:wrap;">
                <div style="flex:1;min-width:150px;">
                    <span style="font-weight:900;color:var(--nb-wine);font-size:1.2rem;">Pedido #${pedido.id}</span>
                    <br>
                    <span style="color:#999;font-size:0.85rem;">${formatFecha(pedido.fecha_creacion)}</span>
                    ${isStaff && pedido.cliente_nombre ? `
                    <br><span style="color:#888;font-size:0.82rem;">
                        <i class="fas fa-user" style="font-size:0.75rem;"></i> ${pedido.cliente_nombre}
                        ${pedido.cliente_telefono ? `· ${pedido.cliente_telefono}` : ''}
                    </span>` : ''}
                </div>
                <div style="background:${estatus.bg};color:${estatus.color};padding:6px 16px;border-radius:50px;font-weight:bold;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.5px;">
                    ${estatus.label}
                </div>
                <div style="font-weight:900;color:var(--nb-wine);font-size:1.2rem;min-width:100px;text-align:right;">
                    ${money.format(pedido.total)}
                </div>
                <i class="fas fa-chevron-${isExpanded ? 'up' : 'down'}" style="color:var(--nb-wine);font-size:1rem;"></i>
            </div>

            ${isExpanded ? `
            <div style="padding:0 20px 20px 20px;border-top:1px solid #f0e6d2;">
                <div style="display:flex;gap:20px;flex-wrap:wrap;padding:15px 0;color:#666;font-size:0.9rem;">
                    <span><strong>Método:</strong> ${pedido.metodo_pago || 'N/A'}</span>
                </div>
                ${isStaff ? `
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:15px;flex-wrap:wrap;">
                    <span style="font-weight:bold;color:var(--nb-text);font-size:0.9rem;">Cambiar estatus:</span>
                    ${['pendiente', 'entregado', 'cancelado'].map(opt => {
                        const c = estatusColors[opt];
                        const isCurrent = pedido.estatus === opt;
                        return `<button onclick="event.stopPropagation();window._nbCambiarEstatus(${pedido.id},'${opt}')" ${isCurrent ? 'disabled' : ''} style="padding:5px 14px;border-radius:50px;border:1px solid ${isCurrent ? c.color : '#ddd'};background:${isCurrent ? c.bg : 'white'};color:${isCurrent ? c.color : '#666'};font-size:0.8rem;font-weight:${isCurrent ? 'bold' : 'normal'};cursor:${isCurrent ? 'default' : 'pointer'};">${c.label}</button>`;
                    }).join('')}
                </div>` : ''}
                ${renderDetalleExpandido(pedido)}
            </div>` : ''}
        </div>`;
    }

    function renderDetalleExpandido(pedido) {
        const detalles = detallesCache[pedido.id] || [];
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=NearBuy_Pedido_${pedido.id}`;
        const puedeCancel = !isStaff && (pedido.estatus === 'pendiente' || pedido.estatus === 'preparando');

        const itemsHtml = detalles.length === 0
            ? `<p style="color:#999;font-size:0.9rem;">Sin detalles disponibles</p>`
            : detalles.map(item => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #f5ede0;">
                    <span style="color:#444;font-size:0.95rem;">${item.nombre_producto}</span>
                    <span style="color:#888;font-size:0.9rem;">${item.cantidad} x $${Number(item.precio_unitario).toFixed(2)}</span>
                    <span style="font-weight:bold;color:var(--nb-wine);">$${(item.cantidad * item.precio_unitario).toFixed(2)}</span>
                </div>`).join('');

        return `
        <div style="background:#fdf8f2;border:1px solid #f0e6d2;border-radius:12px;padding:1.2rem;margin-top:1rem;display:flex;flex-wrap:wrap;gap:1.5rem;align-items:flex-start;">
            <div style="flex:1;min-width:220px;">
                <p style="font-weight:bold;color:var(--nb-wine);margin-bottom:0.6rem;">
                    <i class="fas fa-box-open"></i> Productos del pedido
                </p>
                ${itemsHtml}
            </div>
            <div style="display:flex;flex-direction:column;align-items:center;gap:0.8rem;">
                <div style="background:white;border:3px solid var(--nb-wine);border-radius:12px;padding:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                    <img src="${qrUrl}" alt="QR Pedido #${pedido.id}" style="width:160px;height:160px;display:block;">
                </div>
                <span style="font-size:0.78rem; color:#888;">Muestra este QR en tienda</span>
                <div style="
                    background:#fdf8f2; border:1px dashed #c9a96e; border-radius:8px;
                    padding:6px 12px; font-family:monospace; font-size:0.8rem;
                    color:var(--nb-wine); font-weight:bold; text-align:center; letter-spacing:0.5px;
                ">
                    NearBuy_Pedido_${pedido.id}
                </div>
                ${puedeCancel ? `
                <button onclick="window._nbCancelarPedido(${pedido.id})" style="background:white;color:#c0392b;border:2px solid #c0392b;border-radius:50px;padding:8px 20px;font-size:0.85rem;font-weight:bold;cursor:pointer;text-transform:uppercase;letter-spacing:0.5px;width:100%;">
                    <i class="fas fa-times-circle"></i> Cancelar Pedido
                </button>` : ''}
            </div>
        </div>`;
    }

    
    await loadEmpleados();
    await loadPedidos();
    // Polling para clientes: refrescar cada 30 segundos
    if (!isStaff) {
        const pollInterval = setInterval(async () => {
            if (!document.getElementById('app')?.querySelector('[data-view="mispedidos"]')) {
                clearInterval(pollInterval);
                return;
            }
            try {
                const response = await request(`pedidos/mis-pedidos?id_usuario=${state.user.id}&limit=100&offset=0`);
                todosPedidos = response?.items || [];
                render();
            } catch(e) {}
        }, 10000);
    }
}