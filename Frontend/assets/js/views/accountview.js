import { Navbar } from '../components/Navbar.js';
import { state } from '../state.js';
import { request } from '../api.js';
import { Sidebar } from '../components/Sidebar.js';

export async function renderProfile() {
    const app = document.getElementById('app');
    const user = state.user || {};
    const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
    const isAdmin    = user.rol === 'admin';
    const isEmpleado = user.rol === 'empleado';
    const isStaff    = isAdmin || isEmpleado;

    // ── Estado local ──────────────────────────────────────────────
    let usuarios      = [];      // solo admin
    let pedidosStaff  = [];      // solo empleado
    let loadingExtra  = true;
    let pedidosCliente = [];
  
    // ── Helpers ───────────────────────────────────────────────────
    function formatTelefono(tel) {
        if (!tel) return 'No registrado';
        const c = tel.replace(/\D/g, '');
        return c.length === 10 ? `${c.slice(0,3)} ${c.slice(3,6)} ${c.slice(6)}` : tel;
    }




    function getRolBadge(rol) {
        const roles = {
            admin:    { bg: '#ffebee', color: '#c62828', label: 'Administrador', icon: 'fa-shield-alt' },
            empleado: { bg: '#e3f2fd', color: '#1565c0', label: 'Empleado',      icon: 'fa-id-badge'  },
            cliente:  { bg: '#e8f5e9', color: '#2e7d32', label: 'Cliente',       icon: 'fa-user'      }
        };
        const r = roles[rol] || roles.cliente;
        return `<span style="
            display:inline-flex; align-items:center; gap:6px;
            background:${r.bg}; color:${r.color};
            padding:4px 14px; border-radius:50px;
            font-size:0.78rem; font-weight:700;
            text-transform:uppercase; letter-spacing:0.5px;">
            <i class="fas ${r.icon}" style="font-size:0.72rem;"></i>${r.label}
        </span>`;
    }

    // ── Cargar datos extra según rol ──────────────────────────────
    async function loadExtra() {
        loadingExtra = true;
        try {
            if (isAdmin) {
                const res = await request('perfil?limit=1000');
                usuarios = res?.items || [];
            } else if (isEmpleado) {
                const res = await request('pedidos/admin?limit=50');
                const todos = res?.items || [];
                // Solo pedidos donde este empleado participó
                pedidosStaff = todos.filter(p =>
                    p.id_empleado_preparador === user.id ||
                    p.id_empleado_entrega    === user.id
                );
            }
        } catch (e) {
            console.error('Error cargando datos extra:', e);
        }
        loadingExtra = false;
        await loadPedidos();
        render();
    }

    async function loadPedidos() {
        const res = await request(`pedidos/mis-pedidos?id_usuario=${state.user.id}&limit=5&offset=0`);
        pedidosCliente = res?.items || [];
        render();
    }

    // ── Tarjeta de perfil ─────────────────────────────────────────
    function renderProfileCard() {
        const isEditing = window._profileEditing || false;
        return `
        <div style="
            background:white; border-radius:20px; padding:35px;
            box-shadow:0 5px 20px rgba(0,0,0,0.05);
            border:1px solid #f0e6d2; margin-bottom:25px;
            display:flex; gap:30px; align-items:flex-start;
        ">
            <!-- Avatar -->
            <div style="
                display:flex; flex-direction:column; align-items:center;
                min-width:190px; padding-right:30px;
                border-right:2px solid #f0e6d2;
            ">
                <div style="position:relative; margin-bottom:18px;">
                    <div style="
                        width:110px; height:110px; border-radius:50%;
                        border:3px solid var(--nb-wine);
                        display:flex; align-items:center; justify-content:center;
                        background:#fdf8f0;">
                        <i class="fas fa-user" style="font-size:3rem; color:#d4c4b0;"></i>
                    </div>
                    <div style="
                        position:absolute; bottom:2px; right:2px;
                        width:32px; height:32px; background:var(--nb-wine);
                        border-radius:50%; display:flex; align-items:center; justify-content:center;
                        border:3px solid white;">
                        <i class="fas fa-camera" style="color:white; font-size:0.75rem;"></i>
                    </div>
                </div>
                <h3 style="margin:0 0 8px 0; color:var(--nb-text); font-size:1.15rem; font-weight:800; text-align:center;">
                    ${user.nombre_usuario || 'Usuario'}
                </h3>
                ${getRolBadge(user.rol)}
                <span style="
                    display:inline-flex; align-items:center; gap:5px;
                    background:var(--nb-wine); color:white;
                    padding:6px 16px; border-radius:50px;
                    font-size:0.72rem; font-weight:700;
                    text-transform:uppercase; letter-spacing:0.5px; margin-top:12px;">
                    <i class="fas fa-award" style="font-size:0.7rem;"></i> ${isEmpleado ? 'EMPLEADO NEARBUY' : isAdmin ? 'ADMIN NEARBUY' : 'MIEMBRO NEARBUY'}
                </span>
            </div>

            <!-- Info personal -->
            <div style="flex:1; min-width:0;">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px;">
                    <h2 style="margin:0; color:var(--nb-wine); font-size:1.4rem; font-weight:800;">Información Personal</h2>
                    ${!isEditing ? `
                    <button onclick="window._profileStartEdit()" style="
                        background:none; border:2px solid var(--nb-wine); color:var(--nb-wine);
                        border-radius:50px; padding:6px 18px; font-size:0.8rem;
                        font-weight:700; cursor:pointer; text-transform:uppercase;">
                        <i class="fas fa-pen"></i> Editar
                    </button>` : ''}
                </div>

                ${isEditing ? `
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
                    <div>
                        <label style="display:block; font-size:0.7rem; font-weight:700; color:var(--nb-wine); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">NOMBRE DE USUARIO</label>
                        <input id="edit-nombre" value="${user.nombre_usuario || ''}" style="
                            width:100%; box-sizing:border-box;
                            background:#faf7f2; border:2px solid var(--nb-wine);
                            border-radius:10px; padding:12px 15px;
                            font-size:0.95rem; color:var(--nb-text); font-weight:500;">
                    </div>
                    <div>
                        <label style="display:block; font-size:0.7rem; font-weight:700; color:var(--nb-wine); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">TELÉFONO</label>
                        <input id="edit-telefono" value="${user.telefono || ''}" style="
                            width:100%; box-sizing:border-box;
                            background:#faf7f2; border:2px solid var(--nb-wine);
                            border-radius:10px; padding:12px 15px;
                            font-size:0.95rem; color:var(--nb-text); font-weight:500;">
                    </div>
                </div>
                <div style="display:flex; gap:10px; margin-top:15px;">
                    <button onclick="window._profileSaveEdit()" style="
                        flex:1; background:var(--nb-wine); color:white;
                        border:none; border-radius:50px; padding:12px;
                        font-size:0.9rem; font-weight:700; cursor:pointer; text-transform:uppercase;">
                        <i class="fas fa-check"></i> Guardar
                    </button>
                    <button onclick="window._profileCancelEdit()" style="
                        flex:1; background:none; color:#666;
                        border:2px solid #ddd; border-radius:50px; padding:12px;
                        font-size:0.9rem; font-weight:700; cursor:pointer; text-transform:uppercase;">
                        Cancelar
                    </button>
                </div>
                ` : `
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
                    <div>
                        <label style="display:block; font-size:0.7rem; font-weight:700; color:var(--nb-wine); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">NOMBRE DE USUARIO</label>
                        <div style="background:#faf7f2; border:1px solid #f0e6d2; border-radius:10px; padding:12px 15px; font-size:0.95rem; color:var(--nb-text); font-weight:500;">
                            ${user.nombre_usuario || 'N/A'}
                        </div>
                    </div>
                    <div>
                        <label style="display:block; font-size:0.7rem; font-weight:700; color:var(--nb-wine); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">TELÉFONO</label>
                        <div style="background:#faf7f2; border:1px solid #f0e6d2; border-radius:10px; padding:12px 15px; font-size:0.95rem; color:var(--nb-text); font-weight:500;">
                            ${formatTelefono(user.telefono)}
                        </div>
                    </div>
                </div>
                `}
            </div>
        </div>`;
    }

    // ── Sección Admin: gestión de usuarios ────────────────────────
    function renderAdminPanel() {
        if (loadingExtra) return `
            <div style="background:white; border-radius:16px; padding:2rem; border:1px solid #f0e6d2; text-align:center; color:#999; margin-bottom:25px;">
                <i class="fas fa-spinner fa-spin" style="font-size:1.5rem; margin-bottom:8px; display:block;"></i>
                Cargando usuarios...
            </div>`;

        const rolColors = {
            admin:    { bg:'#e3f2fd', color:'#1565c0' },
            empleado: { bg:'#fff3e0', color:'#e65100' },
            cliente:  { bg:'#f5f5f5', color:'#666'    }
        };

        return `
        <div style="background:white; border-radius:16px; padding:1.5rem; border:1px solid #f0e6d2; box-shadow:0 2px 8px rgba(0,0,0,0.04); margin-bottom:25px;">
            <h3 style="color:var(--nb-wine); margin:0 0 1.2rem 0; font-size:1rem; text-transform:uppercase; letter-spacing:1px;">
                <i class="fas fa-users"></i> Gestión de Usuarios
                <span style="font-size:0.75rem; color:#999; font-weight:normal; margin-left:8px;">${usuarios.length} registrados</span>
            </h3>
            <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; font-size:0.88rem;">
                    <thead>
                        <tr style="border-bottom:2px solid var(--nb-wine); color:var(--nb-wine); font-size:0.75rem; text-transform:uppercase;">
                            <th style="padding:10px 12px; text-align:left;">Usuario</th>
                            <th style="padding:10px 12px; text-align:left;">Teléfono</th>
                            <th style="padding:10px 12px; text-align:center;">Rol</th>
                            <th style="padding:10px 12px; text-align:center;">Cambiar rol</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${usuarios.map(u => {
                            const rc = rolColors[u.rol] || rolColors.cliente;
                            const isSelf = u.id === user.id;
                            return `
                            <tr style="border-bottom:1px solid #f5f0e8;">
                                <td style="padding:10px 12px; font-weight:600; color:var(--nb-text);">
                                    ${u.nombre_usuario}
                                    ${isSelf ? '<span style="font-size:0.7rem; color:#999; font-weight:normal;"> (tú)</span>' : ''}
                                </td>
                                <td style="padding:10px 12px; color:#888;">${formatTelefono(u.telefono)}</td>
                                <td style="padding:10px 12px; text-align:center;">
                                    <span style="
                                        padding:3px 12px; border-radius:20px; font-size:0.75rem; font-weight:700;
                                        background:${rc.bg}; color:${rc.color}; text-transform:uppercase;">
                                        ${u.rol}
                                    </span>
                                </td>
                                <td style="padding:10px 12px; text-align:center;">
                                    ${isSelf ? '<em style="color:#ccc; font-size:0.8rem;">—</em>' : `
                                    <select class="change-role-select" data-id="${u.id}" style="
                                        padding:6px 10px; border:1px solid #ede0cc; border-radius:8px;
                                        font-size:0.8rem; background:#fdf3e6; color:var(--nb-text);
                                        cursor:pointer; outline:none;">
                                        <option value="cliente"  ${u.rol === 'cliente'  ? 'selected' : ''}>Cliente</option>
                                        <option value="empleado" ${u.rol === 'empleado' ? 'selected' : ''}>Empleado</option>
                                        <option value="admin"    ${u.rol === 'admin'    ? 'selected' : ''}>Admin</option>
                                    </select>`}
                                </td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
    }

    // ── Sección Empleado: stats de actividad ──────────────────────
    function renderEmpleadoStats() {
        if (loadingExtra) return `
            <div style="background:white; border-radius:16px; padding:2rem; border:1px solid #f0e6d2; text-align:center; color:#999; margin-bottom:25px;">
                <i class="fas fa-spinner fa-spin" style="font-size:1.5rem; margin-bottom:8px; display:block;"></i>
                Cargando actividad...
            </div>`;

        const preparados = pedidosStaff.filter(p => p.id_empleado_preparador === user.id).length;
        const entregados = pedidosStaff.filter(p => p.id_empleado_entrega    === user.id).length;

        const stats = [
            { icon:'fa-fire',      color:'#1565c0', value: preparados,           label:'Pedidos preparados' },
            { icon:'fa-box',       color:'#2e7d32', value: entregados,           label:'Pedidos entregados' },
        ];

        return `
        <div style="background:white; border-radius:16px; padding:1.5rem; border:1px solid #f0e6d2; box-shadow:0 2px 8px rgba(0,0,0,0.04); margin-bottom:25px;">
            <h3 style="color:var(--nb-wine); margin:0 0 1.2rem 0; font-size:1rem; text-transform:uppercase; letter-spacing:1px;">
                <i class="fas fa-chart-line"></i> Mi Actividad Reciente
            <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:12px;">
            
                ${stats.map(s => `
                <div style="background:#fdf8f0; border-radius:12px; padding:16px; text-align:center; border:1px solid #f0e6d2;">
                    <i class="fas ${s.icon}" style="font-size:1.4rem; color:${s.color}; margin-bottom:8px;"></i>
                    <p style="margin:0; font-weight:900; font-size:1.2rem; color:var(--nb-text);">${s.value}</p>
                    <p style="margin:4px 0 0 0; font-size:0.72rem; color:#999; text-transform:uppercase; letter-spacing:0.5px;">${s.label}</p>
                </div>`).join('')}
            </div>
            <div style="margin-top:12px; text-align:center;">
                <button onclick="window.location.hash='#/mis-pedidos'" style="
                    padding:8px 20px; background:none; color:var(--nb-wine);
                    border:2px solid var(--nb-wine); border-radius:20px; cursor:pointer;
                    font-weight:bold; font-size:0.85rem;">
                    <i class="fas fa-clipboard-list"></i> Ver todos los pedidos
                </button>
            </div>
        </div>`;
    }

    function renderClienteSections(pedidosCliente) {
        const totalPedidos  = pedidosCliente.length;
        const totalGastado  = pedidosCliente.reduce((s, p) => s + (p.total || 0), 0);
        const enProceso     = pedidosCliente.filter(p => p.estatus === 'pendiente' || p.estatus === 'preparando').length;

        const stats = [
            { icon:'fa-shopping-bag', color:'var(--nb-wine)', value: loadingExtra ? '...' : totalPedidos,           label:'Pedidos recientes' },
            { icon:'fa-wallet',       color:'#2e7d32',        value: loadingExtra ? '...' : money.format(totalGastado), label:'Total gastado'     },
            { icon:'fa-hourglass-half', color:'#e65100',      value: loadingExtra ? '...' : enProceso,              label:'En proceso'        }
        ];

        const links = [
            { hash:'#/store',       icon:'fa-store',          label:'Ir a la Tienda', color:'#1565c0' },
            { hash:'#/cart',        icon:'fa-shopping-cart',  label:'Mi Carrito',     color:'#2e7d32' },
            { hash:'#/mis-pedidos', icon:'fa-clipboard-list', label:'Mis Pedidos',    color:'#e65100' }
        ];

        const estatusColors = {
            pendiente:  { bg:'#fff3e0', color:'#e65100', icon:'fa-clock',        label:'Pendiente'  },
            preparando: { bg:'#e3f2fd', color:'#1565c0', icon:'fa-fire',         label:'Preparando' },
            listo:      { bg:'#e8f5e9', color:'#2e7d32', icon:'fa-check-circle', label:'Listo'      },
            entregado:  { bg:'#c8e6c9', color:'#1b5e20', icon:'fa-box',          label:'Entregado'  },
            cancelado:  { bg:'#ffebee', color:'#c62828', icon:'fa-times-circle', label:'Cancelado'  }
        };

        function formatFechaCompleta(f) {
            if (!f) return 'Sin fecha';
            return new Date(f).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
        }

        return `
        <!-- Stats -->
        <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:15px; margin-bottom:25px;">
            ${stats.map(s => `
            <div style="background:white; border-radius:16px; padding:20px 15px; text-align:center; border:1px solid #f0e6d2; box-shadow:0 2px 8px rgba(0,0,0,0.03);">
                <i class="fas ${s.icon}" style="font-size:1.4rem; color:${s.color}; margin-bottom:8px;"></i>
                <p style="margin:0; font-weight:900; font-size:1.3rem; color:var(--nb-text);">${s.value}</p>
                <p style="margin:4px 0 0 0; font-size:0.75rem; color:#999; text-transform:uppercase; letter-spacing:0.5px;">${s.label}</p>
            </div>`).join('')}
        </div>

        <!-- Accesos rápidos -->
        <h3 style="color:var(--nb-wine); font-size:0.9rem; margin-bottom:12px; text-transform:uppercase; letter-spacing:1px;">
            <i class="fas fa-bolt" style="margin-right:6px;"></i> Accesos Rápidos
        </h3>
        <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:25px;">
            ${links.map(l => `
            <div onclick="window.location.hash='${l.hash}'" style="
                background:white; border-radius:14px; padding:18px 12px;
                text-align:center; border:1px solid #f0e6d2; cursor:pointer;
                box-shadow:0 2px 8px rgba(0,0,0,0.03);"
                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(0,0,0,0.08)'"
                onmouseout="this.style.transform='none'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.03)'">
                <i class="fas ${l.icon}" style="font-size:1.5rem; color:${l.color}; margin-bottom:8px;"></i>
                <p style="margin:0; font-size:0.85rem; font-weight:600; color:var(--nb-text);">${l.label}</p>
            </div>`).join('')}
        </div>

        <!-- Pedidos recientes -->
        <div style="background:white; border-radius:20px; padding:25px; box-shadow:0 5px 20px rgba(0,0,0,0.05); border:1px solid #f0e6d2; margin-bottom:25px;">
            <h3 style="color:var(--nb-wine); font-size:0.9rem; margin:0 0 15px 0; text-transform:uppercase; letter-spacing:1px;">
                <i class="fas fa-history" style="margin-right:6px;"></i> Mis Pedidos Recientes
            </h3>
            ${loadingExtra ? `
                <div style="text-align:center; padding:30px 0; color:#999;">
                    <i class="fas fa-spinner fa-spin" style="font-size:1.5rem; margin-bottom:8px; display:block;"></i>
                    Cargando pedidos...
                </div>` 
            : pedidosCliente.length === 0 ? `
                <div style="text-align:center; padding:30px 0;">
                    <i class="fas fa-box-open" style="font-size:2.5rem; color:#eaddc5; margin-bottom:12px;"></i>
                    <p style="color:#999; font-size:0.95rem;">Aún no tienes pedidos</p>
                    <button onclick="window.location.hash='#/store'" style="
                        margin-top:12px; padding:10px 20px; background:var(--nb-wine); color:white;
                        border:none; border-radius:20px; cursor:pointer; font-size:0.85rem; font-weight:bold;">
                        Explorar Tienda
                    </button>
                </div>` 
            : `
                <div style="display:flex; flex-direction:column; gap:10px;">
                    ${pedidosCliente.map(p => {
                        const est = estatusColors[p.estatus] || { bg:'#f5f5f5', color:'#666', icon:'fa-question', label:p.estatus };
                        return `
                        <div style="background:white; border-radius:14px; border:1px solid #f0e6d2; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.03);">
                            <div style="padding:15px 18px; display:flex; align-items:center; gap:12px;">
                                <div style="width:40px; height:40px; background:${est.bg}; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                                    <i class="fas ${est.icon}" style="color:${est.color}; font-size:1rem;"></i>
                                </div>
                                <div style="flex:1; min-width:0;">
                                    <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                                        <span style="font-weight:800; color:var(--nb-wine); font-size:0.95rem;">#${p.id}</span>
                                        <span style="background:${est.bg}; color:${est.color}; padding:2px 10px; border-radius:50px; font-size:0.7rem; font-weight:700; text-transform:uppercase;">${est.label}</span>
                                    </div>
                                    <span style="color:#999; font-size:0.8rem;">${formatFechaCompleta(p.fecha_creacion)}</span>
                                </div>
                                <span style="font-weight:900; color:var(--nb-wine); font-size:1.05rem; flex-shrink:0;">${money.format(p.total)}</span>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
                <div style="text-align:center; margin-top:15px;">
                    <button onclick="window.location.hash='#/mis-pedidos'" style="
                        padding:10px 25px; background:none; color:var(--nb-wine);
                        border:2px solid var(--nb-wine); border-radius:20px; cursor:pointer;
                        font-weight:bold; font-size:0.9rem;"
                        onmouseover="this.style.background='var(--nb-wine)'; this.style.color='white'"
                        onmouseout="this.style.background='none'; this.style.color='var(--nb-wine)'">
                        Ver todos los pedidos
                    </button>
                </div>`}
        </div>`;
    }
    // ── Render principal ──────────────────────────────────────────
    function render() {
        if (isStaff) {
            // ===== Layout con Sidebar (admin/empleado) =====
            app.innerHTML = `
            <div style="display:flex; min-height:100vh; width:100vw; background:var(--nb-cream);">
                ${Sidebar('', 0)}
                <main style="flex:1; padding:2rem; overflow-y:auto; max-width:950px; margin:0 auto;">
                    ${renderProfileCard()}
                    ${isAdmin    ? renderAdminPanel()    : ''}
                    ${isEmpleado ? renderEmpleadoStats() : ''}
                </main>
            </div>
            <style>
                @keyframes profileSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @media (max-width: 700px) {
                    .profile-main-card { flex-direction: column !important; align-items: center !important; }
                    .profile-main-card > div:first-child {
                        border-right: none !important; border-bottom: 2px solid #f0e6d2;
                        padding-right: 0 !important; padding-bottom: 25px; min-width: auto !important;
                    }
                }
            </style>`;
        } else {
            // ===== Layout con Navbar (cliente) =====
            app.innerHTML = `
            <div style="width:100%; min-height:100vh; display:flex; flex-direction:column; background:var(--nb-cream);">
                <div id="nav-wrapper">${Navbar()}</div>
                <main style="flex:1; width:100%; max-width:950px; margin:0 auto; padding:2rem 20px 50px 20px;">
                    ${renderProfileCard()}
                    ${renderClienteSections(pedidosCliente)}
                    <button onclick="window._profileLogout()" style="
                        width:100%; padding:14px; background:none; color:#c62828;
                        border:2px solid #c62828; border-radius:14px; cursor:pointer;
                        font-weight:800; font-size:1rem; text-transform:uppercase;
                        letter-spacing:1px; transition:all 0.2s;
                        display:flex; align-items:center; justify-content:center; gap:10px;
                    " onmouseover="this.style.background='#c62828'; this.style.color='white'"
                    onmouseout="this.style.background='none'; this.style.color='#c62828'">
                        <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
                    </button>
                </main>
            </div>
            <style>
                @keyframes profileSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @media (max-width: 700px) {
                    .profile-main-card { flex-direction: column !important; align-items: center !important; }
                    .profile-main-card > div:first-child {
                        border-right: none !important; border-bottom: 2px solid #f0e6d2;
                        padding-right: 0 !important; padding-bottom: 25px; min-width: auto !important;
                    }
                }
            </style>`;
        }
    }

    // ── Handlers globales ─────────────────────────────────────────
    window._profileEditing = false;

    window._profileStartEdit = () => { window._profileEditing = true;  render(); };
    window._profileCancelEdit = () => { window._profileEditing = false; render(); };

    window._profileSaveEdit = async () => {
        const nombre   = document.getElementById('edit-nombre')?.value?.trim();
        const telefono = document.getElementById('edit-telefono')?.value?.trim();
        if (!nombre) { window._nbShowToast?.('El nombre no puede estar vacío', 'error'); return; }
        try {
            await request(`perfil/${user.id}`, 'PATCH', {
                nombre_usuario: nombre,
                telefono: telefono || null
            });
            const updatedUser = { ...user, nombre_usuario: nombre, telefono: telefono || null };
            state.setUser(updatedUser, state.token);
            user.nombre_usuario = nombre;
            user.telefono = telefono || null;
            window._profileEditing = false;
            render();
            window._nbShowToast?.('Perfil actualizado', 'success');
        } catch (e) {
            window._nbShowToast?.('Error al actualizar perfil', 'error');
        }
    };

    window._profileLogout = () => {
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            state.logout();
            window.location.hash = '#/login';
        }
    };

    state.subscribe(() => {
        const nav = document.getElementById('nav-wrapper');
        if (nav) nav.innerHTML = Navbar();
    });

    render();
    await loadExtra();
}