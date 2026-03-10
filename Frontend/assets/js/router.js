import { state } from './state.js';
import { renderLogin } from './views/loginview.js'; 
import { renderRegister } from './views/registerview.js';
import { renderProfile } from './views/accountview.js';
import { renderStore } from './views/storeview.js';
import { renderProducts } from './views/productsview.js'; 
import { renderCart } from './views/cartview.js';
import { renderCheckout } from './views/checkoutview.js';
import { renderAdmin } from './views/adminview.js';

export const Router = {
    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    },

    handleRoute() {
        let path = window.location.hash.slice(1) || '/';
        
        const storeMatch = path.match(/^\/store\/(\d+)$/);

        // --- 1. AGREGAR /register A RUTAS PÚBLICAS ---
        const publicRoutes = ['/login', '/', '/register'];
        const isPublic = publicRoutes.includes(path);

        // Si no es pública y no está autenticado, al login
        if (!isPublic && !state.isAuthenticated) {
            window.location.hash = '#/login';
            return;
        }

        // Si ya está autenticado e intenta ir a login o register, a la tienda
        if (isPublic && state.isAuthenticated && (path === '/login' || path === '/register')) {
            window.location.hash = '#/store';
            return;
        }

        state.clearListeners();

        const app = document.getElementById('app');

        // --- 2. LOGICA DE RENDERIZADO ---
        if (path === '/' || path === '/login') {
            renderLogin();
        } 
        else if (path === '/register') {
            renderRegister(); // <--- AHORA SÍ RECONOCE ESTA RUTA
        }
        else if (path === '/store') {
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
        else if (path === '/profile') {
            renderProfile();
        }
        else {
            console.log('Ruta no encontrada:', path);
            renderStore(); 
        }
    }
};