import { state } from '../state.js';


export function Sidebar(active, cajaDia = null) {
    const links = [
        { hash: '#/pos',         icon: 'fa-cash-register', label: 'Ventas POS',  key: 'pos' },
        { hash: '#/inventario',  icon: 'fa-boxes',         label: 'Inventario',  key: 'inventario' },
        { hash: '#/mis-pedidos', icon: 'fa-globe',         label: 'Pedidos Web', key: 'pedidos' },
        { hash: '#/reportes',    icon: 'fa-chart-bar',     label: 'Reportes',    key: 'reportes' },
        { hash: '#/verificar-qr', icon: 'fa-qrcode', label: 'Verificar QR', key: 'verificar' },
        
    ];

    const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

    window._sidebarLogout = () => {
        if (confirm('¿Cerrar sesión?')) {
            state.logout();
            window.location.hash = '#/login';
        }
    };

    return `
    <aside style="
        width: 230px; background-color: var(--nb-wine); color: white;
        display: flex; flex-direction: column;
        box-shadow: 4px 0 10px rgba(0,0,0,0.2); flex-shrink: 0;
    ">
        <div style="padding: 1.5rem; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <h2 style="margin: 0; font-size: 1.4rem; letter-spacing: 2px; cursor: pointer;"
                onclick="window.location.hash='#/store'">NEARBUY</h2>
        </div>
        <div style="padding: 1rem 1.5rem 0.5rem; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.4);">
            Menú Principal
        </div>
        <nav style="display: flex; flex-direction: column; gap: 2px; padding: 0.5rem 0;">
            ${links.map(l => `
                <a href="${l.hash}" style="
                    padding: 12px 1.5rem;
                    color: ${active === l.key ? 'var(--nb-gold)' : 'white'};
                    text-decoration: none;
                    font-weight: ${active === l.key ? 'bold' : 'normal'};
                    background: ${active === l.key ? 'rgba(255,255,255,0.08)' : 'none'};
                    border-left: 4px solid ${active === l.key ? 'var(--nb-gold)' : 'transparent'};
                    font-size: 0.9rem; display: flex; align-items: center; gap: 10px;
                ">
                    <i class="fas ${l.icon}" style="width: 18px; text-align: center;"></i> ${l.label}
                </a>
            `).join('')}
        </nav>

        <!-- Caja del día -->
        <div style="
            margin: 0 1rem 0.8rem 1rem;
            background: rgba(255,255,255,0.08);
            border-radius: 10px;
            padding: 0.9rem 1rem;
            border: 1px solid rgba(255,255,255,0.12);
        ">
            <div style="font-size: 0.68rem; text-transform: uppercase; letter-spacing: 1.5px; color: rgba(255,255,255,0.45); margin-bottom: 4px;">
                Caja del día
            </div>
            <div style="font-size: 1.35rem; font-weight: 900; color: var(--nb-gold, #f0c040);">
                ${cajaDia !== null ? money.format(cajaDia) : '—'}
            </div>
            <div style="font-size: 0.72rem; color: rgba(255,255,255,0.4); margin-top: 2px;">
                Pedidos entregados y listos
            </div>
        </div>
                
        <!-- Cuenta del usuario y tienda -->
                <div style="
                    margin: 0 1rem 0.8rem 1rem;
                    background: rgba(255,255,255,0.06);
                    border-radius: 10px;
                    border: 1px solid rgba(255,255,255,0.1);
                    overflow: hidden;
                ">
                    <div onclick="window.location.hash='#/profile'" style="
                        padding: 0.8rem 1rem; cursor: pointer;
                        display: flex; align-items: center; gap: 10px;
                        transition: background 0.15s;
                    " onmouseover="this.style.background='rgba(255,255,255,0.08)'"
                    onmouseout="this.style.background='none'">
                        <div style="
                            width: 34px; height: 34px; border-radius: 50%;
                            background: rgba(255,255,255,0.15);
                            display: flex; align-items: center; justify-content: center;
                            flex-shrink: 0;
                        ">
                            <i class="fas fa-user" style="font-size: 0.9rem; color: rgba(255,255,255,0.8);"></i>
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-size: 0.85rem; font-weight: 700; color: white; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                ${state.user?.nombre_usuario || 'Usuario'}
                            </div>
                            <div style="font-size: 0.7rem; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.5px;">
                                ${state.user?.rol || ''}
                            </div>
                        </div>
                        <i class="fas fa-chevron-right" style="font-size: 0.65rem; color: rgba(255,255,255,0.3);"></i>
                    </div>
                    <div style="border-top: 1px solid rgba(255,255,255,0.08); padding: 0.5rem 1rem; display: flex; gap: 6px;">
                        <button onclick="window.location.hash='#/store'" style="
                            flex: 1; padding: 6px; background: none;
                            border: 1px solid rgba(255,255,255,0.2);
                            color: rgba(255,255,255,0.7); border-radius: 6px; cursor: pointer; font-size: 0.75rem;
                        "><i class="fas fa-store"></i> Tienda</button>
                        <button onclick="window._sidebarLogout()" style="
                            flex: 1; padding: 6px; background: none;
                            border: 1px solid rgba(255,255,255,0.2);
                            color: rgba(255,255,255,0.7); border-radius: 6px; cursor: pointer; font-size: 0.75rem;
                        "><i class="fas fa-sign-out-alt"></i> Salir</button>
                    </div>
                </div>
    </aside>
    `;
}