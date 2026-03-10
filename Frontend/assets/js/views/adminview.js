import { state } from '../state.js';

export function renderAdmin() {
    const app = document.getElementById('app');

    // Seguridad extra: Si un cliente intenta entrar a esta URL, lo pateamos
    if (state.user?.role !== 'admin') {
        window.location.hash = '#/store';
        return;
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
                
                <nav style="flex: 1; padding: 2rem 0; display: flex; flex-direction: column; gap: 10px;">
                    <a href="#/admin" style="padding: 15px 2rem; color: var(--nb-gold); text-decoration: none; font-weight: bold; background: rgba(255,255,255,0.05); border-left: 4px solid var(--nb-gold);">
                        <i class="fas fa-chart-line" style="margin-right: 10px;"></i> Resumen
                    </a>
                    <a href="#/admin/products" style="padding: 15px 2rem; color: white; text-decoration: none; transition: background 0.2s;">
                        <i class="fas fa-box" style="margin-right: 10px;"></i> Productos
                    </a>
                    <a href="#/admin/orders" style="padding: 15px 2rem; color: white; text-decoration: none; transition: background 0.2s;">
                        <i class="fas fa-receipt" style="margin-right: 10px;"></i> Pedidos (QR)
                    </a>
                </nav>

                <div style="padding: 2rem; border-top: 1px solid rgba(255,255,255,0.1);">
                    <button onclick="import('../auth.js').then(m => m.AuthService.logout())" style="
                        width: 100%; padding: 10px; background: none; border: 1px solid white; color: white; border-radius: 5px; cursor: pointer; transition: 0.2s;
                    " onmouseover="this.style.background='white'; this.style.color='var(--nb-wine)';" onmouseout="this.style.background='none'; this.style.color='white';">
                        <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
                    </button>
                </div>
            </aside>

            <main style="flex: 1; padding: 3rem; overflow-y: auto;">
                <h1 style="color: var(--nb-wine); font-size: 2.5rem; margin-bottom: 2rem;">Bienvenido, Administrador</h1>
                
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
                    <div style="background: white; padding: 2rem; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); border: 1px solid #f0e6d2;">
                        <h3 style="color: #666; margin-top: 0;">Ventas de Hoy</h3>
                        <p style="font-size: 2rem; color: var(--nb-wine); font-weight: bold; margin: 0;">$4,520.00</p>
                    </div>
                    <div style="background: white; padding: 2rem; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); border: 1px solid #f0e6d2;">
                        <h3 style="color: #666; margin-top: 0;">Pedidos Pendientes</h3>
                        <p style="font-size: 2rem; color: var(--nb-wine); font-weight: bold; margin: 0;">12</p>
                    </div>
                    <div style="background: white; padding: 2rem; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); border: 1px solid #f0e6d2;">
                        <h3 style="color: #666; margin-top: 0;">Productos Activos</h3>
                        <p style="font-size: 2rem; color: var(--nb-wine); font-weight: bold; margin: 0;">84</p>
                    </div>
                </div>
            </main>
        </div>
    `;
}