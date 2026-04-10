/**
 * [MODIFICADO] router.js
 * 
 * CAMBIOS:
 * - NUEVO: window._nbRouterReload() para forzar re-render de la ruta actual
 * - NUEVO: Importar renderMisPedidos
 * - NUEVO: Ruta #/mis-pedidos → renderMisPedidos()
 * - Protección de rol: solo admin/empleado para POS/Inventario/Admin
 */

import { state } from './state.js';
import { renderProfile } from './views/accountview.js';
import { renderStore } from './views/storeview.js';
import { renderProducts } from './views/productsview.js'; 
import { renderCart } from './views/cartview.js';
import { renderCheckout } from './views/checkoutview.js';
import { renderAdmin } from './views/adminview.js';
import { renderPOS } from './views/posview.js';
import { renderReportes } from './views/reportesview.js';
import { renderInventario } from './views/inventarioview.js';
import { renderMisPedidos } from './views/mispedidosview.js';
import { renderQRVerify } from './views/qrverifyview.js';
import './components/authmodal.js';

export const Router = {
    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        window._nbRouterReload = () => this.handleRoute();
        this.handleRoute();
    },

    handleRoute() {
        let path = window.location.hash.slice(1) || '/';
        if (!path.startsWith('/')) path = '/' + path;
        
        const storeMatch = path.match(/^\/store\/(all|\d+)$/);

        // REGLA 1: Si entran a la raíz o al login viejo, mandarlos a la tienda
        if (path === '/' || path === '/login') {
            window.location.hash = '#/store';
            // Si no hay sesión, mostramos el modal flotante 
            if (!state.isAuthenticated && !sessionStorage.getItem('welcomeShown')) {
                sessionStorage.setItem('welcomeShown', 'true');
                setTimeout(() => window.showAuthModal('login'), 500);
            }
            return;
        }

        // Rutas protegidas (clientes)
        const protectedRoutes = ['/profile', '/checkout'];
        if (protectedRoutes.includes(path) && !state.isAuthenticated) {
            window.location.hash = '#/store';
            window.showAuthModal('login');
            return;
        }

        // Protección de rutas admin/empleado
        const adminRoutes = ['/pos', '/inventario', '/admin', '/reportes', '/verificar-qr'];
        if (adminRoutes.includes(path)) {
            const rol = state.user?.rol;
            if (rol !== 'admin' && rol !== 'empleado') {
                window.location.hash = '#/store';
                return;
            }
        }

        state.clearListeners();
        window._nbSearchProducts = null;

        // --- 2. LOGICA DE RENDERIZADO ---
        if (path === '/store') {
            renderStore();
        } 
        else if (storeMatch) {
            const categoryId = storeMatch[1];
            renderProducts(categoryId);
        } 
        else if (path === '/cart') {
            renderCart();
        } 
        else if (path === '/checkout') {
            renderCheckout();
        } 
        else if (path === '/admin') { 
            renderAdmin();
        }
        else if (path === '/pos') {
            renderPOS();
        }
        else if (path === '/inventario') {
            renderInventario();
        }
        else if (path === '/profile') {
            renderProfile();
        }
        else if (path === '/reportes') {
            renderReportes();
        }
        else if (path === '/mis-pedidos') {
            renderMisPedidos();
        }
        else if (path === '/verificar-qr') {
            renderQRVerify();
        }
        else {
            console.log('Ruta no encontrada:', path);
            renderStore(); 
        }
    }
};