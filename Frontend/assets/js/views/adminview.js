import { state } from '../state.js';
import { request } from '../api.js'; // Necesario para obtener y actualizar usuarios

export async function renderAdmin() {
    const app = document.getElementById('app');

    // Seguridad extra: Si un cliente intenta entrar a esta URL, lo pateamos
    if (state.user?.rol !== 'admin') {
        window.location.hash = '#/store';
        return;
    }

    // --- CARGAR USUARIOS DESDE EL BACKEND ---
    let usuarios = [];
    try {
        const response = await request('perfil');
        usuarios = response.items || [];
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
    }


    app.innerHTML = `
        <div style="display: flex; min-height: 100vh; width: 100vw; background-color: var(--nb-cream);">
            
            <aside style="
                width: 250px; 
                background-color: var(--nb-wine); 
                color: white; 
                display: flex; 
                flex-direction: column;
                box-shadow: 4px 0 10px rgba(0,0,0,0.2);
            ">
                <div style="padding: 2rem; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <h2 style="margin: 0; font-size: 1.5rem; letter-spacing: 2px;">NEARBUY</h2>
                    <span style="font-size: 0.8rem; color: var(--nb-gold);">Panel de Administración</span>
                </div>
                
                <nav id="admin-nav" style="flex: 1; padding: 2rem 0; display: flex; flex-direction: column; gap: 10px;">
                    <a href="#/admin" class="nav-link active" style="padding: 15px 2rem; color: var(--nb-gold); text-decoration: none; font-weight: bold; background: rgba(255,255,255,0.05); border-left: 4px solid var(--nb-gold);">
                        <i class="fas fa-users" style="margin-right: 10px;"></i> Usuarios
                    </a>
                    <a href="#/store" style="padding: 15px 2rem; color: white; text-decoration: none; transition: background 0.2s;">
                        <i class="fas fa-shopping-bag" style="margin-right: 10px;"></i> Ver Tienda
                    </a>
                </nav>

                <div style="padding: 2rem; border-top: 1px solid rgba(255,255,255,0.1);">
                    <button id="admin-logout-btn" style="
                        width: 100%; padding: 10px; background: none; border: 1px solid white; color: white; border-radius: 5px; cursor: pointer; transition: 0.2s;
                    " onmouseover="this.style.background='white'; this.style.color='var(--nb-wine)';" onmouseout="this.style.background='none'; this.style.color='white';">
                        <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
                    </button>
                </div>
            </aside>

            <main style="flex: 1; padding: 3rem; overflow-y: auto;">
                <h1 style="color: var(--nb-wine); font-size: 2.5rem; margin-bottom: 2rem;">Gestión de Usuarios</h1>
                
                <div style="background: white; padding: 2rem; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); border: 1px solid #f0e6d2;">
                    <table style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead>
                            <tr style="border-bottom: 2px solid var(--nb-wine); color: var(--nb-wine);">
                                <th style="padding: 12px;">Usuario</th>
                                <th style="padding: 12px;">Teléfono</th>
                                <th style="padding: 12px;">Rol Actual</th>
                                <th style="padding: 12px;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${usuarios.map(user => `
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 12px;">${user.nombre_usuario}</td>
                                    <td style="padding: 12px;">${user.telefono}</td>
                                    <td style="padding: 12px;">
                                        <span style="
                                            padding: 4px 12px; 
                                            border-radius: 20px; 
                                            font-size: 0.8rem;
                                            background: ${user.rol === 'admin' ? '#e3f2fd' : '#f5f5f5'};
                                            color: ${user.rol === 'admin' ? '#1976d2' : '#666'};
                                            font-weight: bold;
                                        ">${user.rol.toUpperCase()}</span>
                                    </td>
                                    <td style="padding: 12px;">
                                        ${user.id !== state.user.id ? `
                                            <button class="change-role-btn" data-id="${user.id}" data-role="${user.rol}" style="
                                                background: var(--nb-wine);
                                                color: white;
                                                border: none;
                                                padding: 8px 15px;
                                                border-radius: 5px;
                                                cursor: pointer;
                                                font-size: 0.8rem;
                                            ">
                                                Hacer ${user.rol === 'admin' ? 'Cliente' : 'Admin'}
                                            </button>
                                        ` : '<em style="color: #999;">Tú (Admin)</em>'}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    `;

    // --- LÓGICA DE EVENTOS ---
    
    // 1. Cerrar Sesión
    document.getElementById('admin-logout-btn').onclick = async () => {
        const { AuthService } = await import('../auth.js');
        AuthService.logout();
    };

    // 2. Cambiar Rol
    document.querySelectorAll('.change-role-btn').forEach(btn => {
        btn.onclick = async () => {
            const userId = btn.getAttribute('data-id');
            const currentRole = btn.getAttribute('data-role');
            const newRole = currentRole === 'admin' ? 'cliente' : 'admin';

            if (confirm(`¿Estás seguro de cambiar el rol de este usuario a ${newRole}?`)) {
                try {
                    // Usamos el nuevo endpoint PATCH que creamos en el backend
                    await request(`perfil/${userId}/rol?rol=${newRole}`, 'PATCH');
                    alert('Rol actualizado con éxito');
                    renderAdmin(); // Recargar la vista
                } catch (error) {
                    console.error('Error al actualizar rol:', error);
                }
            }
        };
    });
}