import { Navbar } from '../components/Navbar.js';
import { state } from '../state.js';
import { request } from '../api.js';
import { Sidebar } from '../components/Sidebar.js';
import { AuthService } from '../auth.js'; // Añadido para validar la contraseña 

export async function renderProfile() {
    const app = document.getElementById('app');
    
    // Si no hay sesión (usuario borrado o no logueado), redirigir
    if (!state.isAuthenticated || !state.user) {
        window.location.hash = '#/login';
        return;
    }

    const user = state.user || {};
    const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
    const isAdmin    = user.rol === 'admin';
    const isEmpleado = user.rol === 'empleado';
    const isStaff    = isAdmin || isEmpleado;

    let usuarios      = [];      
    let pedidosStaff  = [];      
    let loadingExtra  = true;
    let pedidosCliente = [];
  
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
        return `<span style="display:inline-flex; align-items:center; gap:6px; background:${r.bg}; color:${r.color}; padding:4px 14px; border-radius:50px; font-size:0.78rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">
            <i class="fas ${r.icon}" style="font-size:0.72rem;"></i>${r.label}
        </span>`;
    }

    async function loadExtra() {
        loadingExtra = true;
        try {
            if (isAdmin) {
                const res = await request('perfil?limit=1000');
                usuarios = res?.items || [];
            } else if (isEmpleado) {
                const res = await request('pedidos/admin?limit=50');
                const todos = res?.items || [];
                pedidosStaff = todos.filter(p => p.id_empleado_preparador === user.id || p.id_empleado_entrega === user.id);
            }
        } catch (e) {
            console.error('Error cargando datos extra:', e);
        }
        loadingExtra = false;
        await loadPedidos();
        render();
    }

    async function loadPedidos() {
        if (!state.user || !state.user.id) {
            pedidosCliente = [];
            render();
            return;
        }
        const res = await request(`pedidos/mis-pedidos?id_usuario=${state.user.id}&limit=5&offset=0`);
        pedidosCliente = res?.items || [];
        render();
    }

    function renderProfileCard() {
        const isEditing = window._profileEditing || false;
        return `
        <div class="profile-main-card" style="background:white; border-radius:20px; padding:35px; box-shadow:0 5px 20px rgba(0,0,0,0.05); border:1px solid #f0e6d2; margin-bottom:25px; display:flex; gap:30px; align-items:flex-start;">
            <div style="display:flex; flex-direction:column; align-items:center; min-width:190px; padding-right:30px; border-right:2px solid #f0e6d2;">
                <div style="position:relative; margin-bottom:18px;">
                    <div style="width:110px; height:110px; border-radius:50%; border:3px solid var(--nb-wine); display:flex; align-items:center; justify-content:center; background:#fdf8f0;">
                        <i class="fas fa-user" style="font-size:3rem; color:#d4c4b0;"></i>
                    </div>
                    <div style="position:absolute; bottom:0px; right:-5px; width:40px; height:40px; background:white; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.15); overflow:hidden;">
                        <img src="assets/img/insignia.jpg" alt="Verificado" style="width:100%; height:100%; object-fit:cover;">
                    </div>
                </div>
                <h3 style="margin:0 0 8px 0; color:var(--nb-text); font-size:1.15rem; font-weight:800; text-align:center;">
                    ${user.nombre_usuario || 'Usuario'}
                </h3>
                ${getRolBadge(user.rol)}
                <span style="display:inline-flex; align-items:center; gap:5px; background:var(--nb-wine); color:white; padding:6px 16px; border-radius:50px; font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; margin-top:12px;">
                    <i class="fas fa-award" style="font-size:0.7rem;"></i> ${isEmpleado ? 'EMPLEADO NEARBUY' : isAdmin ? 'ADMIN NEARBUY' : 'MIEMBRO NEARBUY'}
                </span>
            </div>

            <div style="flex:1; min-width:0; width: 100%;">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px;">
                    <h2 style="margin:0; color:var(--nb-wine); font-size:1.4rem; font-weight:800;">Información Personal</h2>
                    ${!isEditing ? `<button onclick="window._profileStartEdit()" style="background:none; border:2px solid var(--nb-wine); color:var(--nb-wine); border-radius:50px; padding:6px 18px; font-size:0.8rem; font-weight:700; cursor:pointer; text-transform:uppercase;"><i class="fas fa-pen"></i> Editar</button>` : ''}
                </div>

                ${isEditing ? `
                <div class="mobile-stack" style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
                    <div><label style="display:block; font-size:0.7rem; font-weight:700; color:var(--nb-wine); text-transform:uppercase; margin-bottom:6px;">NOMBRE DE USUARIO</label><input id="edit-nombre" value="${user.nombre_usuario || ''}" style="width:100%; box-sizing:border-box; background:#faf7f2; border:2px solid var(--nb-wine); border-radius:10px; padding:12px 15px; font-size:0.95rem; color:var(--nb-text); font-weight:500;"></div>
                    <div><label style="display:block; font-size:0.7rem; font-weight:700; color:var(--nb-wine); text-transform:uppercase; margin-bottom:6px;">TELÉFONO</label><input id="edit-telefono" value="${user.telefono || ''}" style="width:100%; box-sizing:border-box; background:#faf7f2; border:2px solid var(--nb-wine); border-radius:10px; padding:12px 15px; font-size:0.95rem; color:var(--nb-text); font-weight:500;"></div>
                </div>
                <div class="mobile-actions" style="display:flex; gap:10px; margin-top:15px;">
                    <button onclick="window._profileSaveEdit()" style="flex:1; background:var(--nb-wine); color:white; border:none; border-radius:50px; padding:12px; font-size:0.9rem; font-weight:700; cursor:pointer; text-transform:uppercase;"><i class="fas fa-check"></i> Guardar</button>
                    <button onclick="window._profileCancelEdit()" style="flex:1; background:none; color:#666; border:2px solid #ddd; border-radius:50px; padding:12px; font-size:0.9rem; font-weight:700; cursor:pointer; text-transform:uppercase;">Cancelar</button>
                </div>
                ` : `
                <div class="mobile-stack" style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
                    <div><label style="display:block; font-size:0.7rem; font-weight:700; color:var(--nb-wine); text-transform:uppercase; margin-bottom:6px;">NOMBRE DE USUARIO</label><div style="background:#faf7f2; border:1px solid #f0e6d2; border-radius:10px; padding:12px 15px; font-size:0.95rem; color:var(--nb-text); font-weight:500;">${user.nombre_usuario || 'N/A'}</div></div>
                    <div><label style="display:block; font-size:0.7rem; font-weight:700; color:var(--nb-wine); text-transform:uppercase; margin-bottom:6px;">TELÉFONO</label><div style="background:#faf7f2; border:1px solid #f0e6d2; border-radius:10px; padding:12px 15px; font-size:0.95rem; color:var(--nb-text); font-weight:500;">${formatTelefono(user.telefono)}</div></div>
                </div>
                `}
            </div>
        </div>`;
    }

    function renderAdminPanel() {
        if (loadingExtra) return `<div style="text-align:center; padding:2rem;"><i class="fas fa-spinner fa-spin"></i> Cargando usuarios...</div>`;
        return `
        <div style="background:white; border-radius:16px; padding:1.5rem; border:1px solid #f0e6d2; margin-bottom:25px;">
            <h3 style="color:var(--nb-wine); margin:0 0 1.2rem 0; font-size:1rem; text-transform:uppercase;"><i class="fas fa-users"></i> Gestión de Usuarios</h3>
            <table style="width:100%; border-collapse:collapse; font-size:0.88rem;">
                <tr style="border-bottom:2px solid var(--nb-wine); color:var(--nb-wine);"><th style="padding:10px; text-align:left;">Usuario</th><th style="padding:10px; text-align:center;">Rol</th></tr>
                ${usuarios.map(u => `
                <tr style="border-bottom:1px solid #eee;">
                    <td style="padding:10px;">${u.nombre_usuario}</td>
                    <td style="padding:10px; text-align:center; font-weight:bold; text-transform:uppercase;">${u.rol}</td>
                </tr>`).join('')}
            </table>
        </div>`;
    }

    function renderEmpleadoStats() {
        if (loadingExtra) return `<div style="text-align:center;"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>`;
        const preparados = pedidosStaff.filter(p => p.id_empleado_preparador === user.id).length;
        return `
        <div style="background:white; border-radius:16px; padding:1.5rem; border:1px solid #f0e6d2; margin-bottom:25px;">
            <h3 style="color:var(--nb-wine); margin:0 0 1.2rem 0; font-size:1rem; text-transform:uppercase;"><i class="fas fa-chart-line"></i> Mi Actividad</h3>
            <div style="background:#fdf8f0; border-radius:12px; padding:16px; text-align:center;">
                <i class="fas fa-fire" style="font-size:1.4rem; color:#1565c0; margin-bottom:8px;"></i>
                <p style="margin:0; font-weight:900; font-size:1.2rem;">${preparados}</p>
                <p style="margin:0; font-size:0.72rem; color:#999; text-transform:uppercase;">Pedidos preparados</p>
            </div>
        </div>`;
    }

    function renderClienteSections(pedidosCliente) {
        return `
        <h3 style="color:var(--nb-wine); font-size:0.9rem; margin-bottom:12px; text-transform:uppercase;">Accesos Rápidos</h3>
        <div class="mobile-stack" style="display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:25px;">
            <div onclick="window.location.hash='#/store'" style="background:white; border-radius:14px; padding:18px 12px; text-align:center; border:1px solid #f0e6d2; cursor:pointer;"><i class="fas fa-store" style="font-size:1.5rem; color:#1565c0; margin-bottom:8px;"></i><p style="margin:0; font-size:0.85rem; font-weight:600;">Tienda</p></div>
            <div onclick="window.location.hash='#/cart'" style="background:white; border-radius:14px; padding:18px 12px; text-align:center; border:1px solid #f0e6d2; cursor:pointer;"><i class="fas fa-shopping-cart" style="font-size:1.5rem; color:#2e7d32; margin-bottom:8px;"></i><p style="margin:0; font-size:0.85rem; font-weight:600;">Carrito</p></div>
            <div onclick="window.location.hash='#/mis-pedidos'" style="background:white; border-radius:14px; padding:18px 12px; text-align:center; border:1px solid #f0e6d2; cursor:pointer;"><i class="fas fa-clipboard-list" style="font-size:1.5rem; color:#e65100; margin-bottom:8px;"></i><p style="margin:0; font-size:0.85rem; font-weight:600;">Mis Pedidos</p></div>
        </div>
        <div style="background:white; border-radius:20px; padding:25px; border:1px solid #f0e6d2; margin-bottom:25px;">
            <h3 style="color:var(--nb-wine); font-size:0.9rem; margin:0 0 15px 0; text-transform:uppercase;"><i class="fas fa-history"></i> Mis Pedidos Recientes</h3>
            ${pedidosCliente.length === 0 ? `<p style="text-align:center; color:#999;">Aún no tienes pedidos</p>` : pedidosCliente.map(p => `
                <div style="padding:15px; border-bottom:1px solid #f0e6d2; display:flex; justify-content:space-between; align-items:center;">
                    <div><strong>#${p.id}</strong> <span style="font-size:0.8rem; color:#888;">· ${p.estatus}</span></div>
                    <strong style="color:var(--nb-wine);">${money.format(p.total)}</strong>
                </div>
            `).join('')}
        </div>`;
    }

    function render() {
        app.innerHTML = `
            <style>
                @media (max-width: 768px) {
                    .profile-main-card { flex-direction: column !important; align-items: center !important; padding: 20px !important; }
                    .profile-main-card > div:first-child { border-right: none !important; border-bottom: 2px solid #f0e6d2; padding-right: 0 !important; padding-bottom: 20px; margin-bottom: 20px; width: 100%; }
                    .mobile-stack { grid-template-columns: 1fr !important; }
                    .mobile-actions { flex-direction: column; }
                    .account-buttons-container { flex-direction: column-reverse; gap: 10px !important; }
                }
            </style>
            <div style="width:100%; min-height:100vh; display:flex; flex-direction:column; background:var(--nb-cream);">
                <div id="nav-wrapper">${Navbar()}</div>
                <main style="flex:1; width:100%; max-width:950px; margin:0 auto; padding:2rem 20px 50px 20px;">
                    ${renderProfileCard()}
                    
                    ${isAdmin    ? renderAdminPanel()    : ''}
                    ${isEmpleado ? renderEmpleadoStats() : ''}
                    ${!isStaff   ? renderClienteSections(pedidosCliente) : ''}
                    
                    <div class="account-buttons-container" style="display: flex; gap: 20px; margin-top: 30px; flex-wrap: wrap;">
                        <button onclick="window._profileShowDeleteConfirm()" style="
                            flex: 1; min-width: 160px; padding: 14px; background: none; 
                            color: #c62828; border: 2px solid #c62828; border-radius: 14px; 
                            cursor: pointer; font-weight: 800; text-transform: uppercase;
                            transition: background 0.2s, color 0.2s;
                        " onmouseover="this.style.background='#c62828'; this.style.color='white'" onmouseout="this.style.background='none'; this.style.color='#c62828'">
                            <i class="fas fa-user-slash"></i> Eliminar Cuenta
                        </button>
                        
                        <button onclick="window._profileLogout()" style="
                            flex: 1; min-width: 160px; padding: 14px; background: #c62828; 
                            color: white; border: 2px solid #c62828; border-radius: 14px; 
                            cursor: pointer; font-weight: 800; text-transform: uppercase;
                            transition: opacity 0.2s;
                        " onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
                            <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
                        </button>
                    </div>
                </main>
            </div>
        `;
    }

    window._profileEditing = false;
    window._profileStartEdit = () => { window._profileEditing = true;  render(); };
    window._profileCancelEdit = () => { window._profileEditing = false; render(); };

    window._profileSaveEdit = async () => {
        const nombre = document.getElementById('edit-nombre')?.value?.trim();
        const telefono = document.getElementById('edit-telefono')?.value?.trim();
        try {
            await request(`perfil/${user.id}`, 'PATCH', { nombre_usuario: nombre, telefono: telefono || null });
            state.user.nombre_usuario = nombre;
            state.user.telefono = telefono || null;
            window._profileEditing = false;
            render();
            alert('Perfil actualizado');
        } catch (e) {
            alert('Error al actualizar perfil');
        }
    };

    window._profileLogout = () => {
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            state.logout();
            window.location.hash = '#/login';
        }
    };

    // --- NUEVA LÓGICA DE ELIMINACIÓN EN DOS PASOS ---

    window._profileCloseDeleteModal = () => {
        const modal = document.getElementById('delete-modal-overlay');
        if (modal) modal.remove();
    };

    // Paso 1: Mostrar la advertencia original
    window._profileShowDeleteConfirm = () => {
        const modal = document.createElement('div');
        modal.id = 'delete-modal-overlay';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.7); z-index: 20000;
            display: flex; align-items: center; justify-content: center;
            backdrop-filter: blur(5px); padding: 15px; box-sizing: border-box;
        `;

        modal.innerHTML = `
            <div id="delete-modal-content" style="background-color: #2a0a0c; padding: 40px; border-radius: 25px; max-width: 450px; width: 100%; color: white; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.5); border: 2px solid #f3dfb0;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3.5rem; color: #ff6b6b; margin-bottom: 20px; display: block;"></i>
                
                <h2 style="margin: 0 0 15px 0; color: #f3dfb0; font-size: 1.8rem; text-transform: uppercase; letter-spacing: 1px;">¿Eliminar Cuenta?</h2>
                
                <p style="margin: 0 0 30px 0; color: white; font-size: 1.1rem; line-height: 1.5; opacity: 0.9;">
                    Esta acción es irreversible. Se borrarán todos tus datos, historial de pedidos y carrito. <br><strong>¿Estás completamente seguro de continuar?</strong>
                </p>
                
                <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                    <button onclick="window._profileCloseDeleteModal()" style="
                        flex: 1; min-width: 140px; padding: 12px; background: #f3dfb0; 
                        color: #2a0a0c; border: none; border-radius: 10px; font-weight: bold; 
                        cursor: pointer; text-transform: uppercase; font-size: 0.9rem;
                    ">
                        <i class="fas fa-arrow-left"></i> Regresar
                    </button>
                    
                    <button onclick="window._profileStepTwoDelete()" style="
                        flex: 1; min-width: 140px; padding: 12px; background: #c62828; 
                        color: white; border: none; border-radius: 10px; font-weight: bold; 
                        cursor: pointer; text-transform: uppercase; font-size: 0.9rem;
                    ">
                        <i class="fas fa-trash-alt"></i> Sí, Eliminar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    };

    // Paso 2: Cambiar la ventana para pedir la contraseña
    window._profileStepTwoDelete = () => {
        const content = document.getElementById('delete-modal-content');
        if (!content) return;
        
        content.innerHTML = `
            <i class="fas fa-lock" style="font-size: 3.5rem; color: #f3dfb0; margin-bottom: 20px; display: block;"></i>
            
            <h2 style="margin: 0 0 15px 0; color: #f3dfb0; font-size: 1.5rem; text-transform: uppercase; letter-spacing: 1px;">Confirmar Identidad</h2>
            
            <p style="margin: 0 0 20px 0; color: white; font-size: 1rem; opacity: 0.9;">
                Por seguridad, ingresa tu contraseña para confirmar la eliminación de la cuenta.
            </p>
            
            <input type="password" id="delete-confirm-password" placeholder="Tu contraseña" style="
                width: 100%; padding: 12px 15px; border-radius: 10px; border: none; outline: none; 
                background: #f3dfb0; color: #333; box-sizing: border-box; font-size: 1rem; 
                margin-bottom: 10px; text-align: center; font-family: sans-serif;
            ">
            
            <p id="delete-error-msg" style="display:none; color: #ff6b6b; margin: 0 0 15px 0; font-size: 0.9rem;"></p>
            
            <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                <button onclick="window._profileCloseDeleteModal()" style="
                    flex: 1; min-width: 140px; padding: 12px; background: #f3dfb0; 
                    color: #2a0a0c; border: none; border-radius: 10px; font-weight: bold; 
                    cursor: pointer; text-transform: uppercase; font-size: 0.9rem;
                ">
                    Cancelar
                </button>
                
                <button id="btn-final-delete" onclick="window._profileExecuteDelete()" style="
                    flex: 1; min-width: 140px; padding: 12px; background: #c62828; 
                    color: white; border: none; border-radius: 10px; font-weight: bold; 
                    cursor: pointer; text-transform: uppercase; font-size: 0.9rem;
                ">
                    Eliminar Definitivamente
                </button>
            </div>
        `;
    };

    // Paso 3: Validar contraseña y ejecutar la eliminación
    window._profileExecuteDelete = async () => {
        const passInput = document.getElementById('delete-confirm-password').value;
        const errorMsg = document.getElementById('delete-error-msg');
        const btn = document.getElementById('btn-final-delete');

        if (!passInput) {
            errorMsg.innerText = "Por favor, ingresa tu contraseña.";
            errorMsg.style.display = "block";
            return;
        }

        btn.innerText = "Verificando...";
        btn.disabled = true;
        errorMsg.style.display = "none";

        try {
            // Validamos que la contraseña sea correcta usando el servicio de Login
            const usernameToVerify = state.user.nombre_usuario || state.user.username;
            const verification = await AuthService.login(usernameToVerify, passInput);

            if (!verification.success) {
                errorMsg.innerText = "Contraseña incorrecta. Inténtalo de nuevo.";
                errorMsg.style.display = "block";
                btn.innerText = "Eliminar Definitivamente";
                btn.disabled = false;
                return;
            }

            // Si la contraseña es correcta, llamamos al backend para borrar la cuenta
            btn.innerText = 'Eliminando...';
            await request(`perfil/${user.id}`, 'DELETE');
            
            window._profileCloseDeleteModal();
            state.logout();
            alert('Tu cuenta ha sido eliminada exitosamente. Lamentamos verte partir.');
            window.location.hash = '#/register'; 

        } catch (e) {
            console.error('Error eliminando cuenta:', e);
            errorMsg.innerText = "Hubo un error al intentar eliminar la cuenta.";
            errorMsg.style.display = "block";
            btn.innerText = 'Eliminar Definitivamente';
            btn.disabled = false;
        }
    };

    state.subscribe(() => {
        const nav = document.getElementById('nav-wrapper');
        if (nav) nav.innerHTML = Navbar();
    });

    render();
    await loadExtra();
}