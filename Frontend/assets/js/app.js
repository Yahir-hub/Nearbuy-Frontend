import { Router } from './router.js';
import { state } from './state.js';
import { mostrarRecomendacion } from './components/RecomendacionIA.js'; // NUEVO: IA

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    Router.init();
});

// =========================================================
// TOAST NOTIFICATION SYSTEM
// =========================================================
function showToast(message, type = 'success') {
    // Eliminar toast anterior si existe
    const existing = document.getElementById('nb-toast');
    if (existing) existing.remove();

    const colors = {
        success: { bg: '#2e7d32', icon: 'fa-check-circle' },
        error:   { bg: '#c62828', icon: 'fa-exclamation-circle' },
        warning: { bg: '#e65100', icon: 'fa-exclamation-triangle' }
    };
    const c = colors[type] || colors.success;

    const toast = document.createElement('div');
    toast.id = 'nb-toast';
    toast.innerHTML = `
        <i class="fas ${c.icon}" style="font-size: 1.1rem;"></i>
        <span>${message}</span>
    `;
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        background: ${c.bg};
        color: white;
        padding: 12px 24px;
        border-radius: 50px;
        font-size: 0.95rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 9999;
        box-shadow: 0 6px 20px rgba(0,0,0,0.25);
        opacity: 0;
        transition: opacity 0.3s ease, transform 0.3s ease;
        pointer-events: none;
        white-space: nowrap;
    `;

    document.body.appendChild(toast);

    // Animar entrada
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    // Desaparecer después de 2.5s
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// Hacer accesible globalmente
window._nbShowToast = showToast;

// =========================================================
// PUENTE DE EVENTOS
// =========================================================

window.addToCartHandler = (id) => {
    console.log("Intentando agregar ID:", id);

    if (window.currentProducts && window.currentProducts.length > 0) {
        const product = window.currentProducts.find(p => p.id === id);
        if (product) {
            // Validar stock antes de agregar
            const existingInCart = state.cart.find(item => item.id === id);
            const currentQtyInCart = existingInCart ? existingInCart.quantity : 0;
            const stockDisponible = product.stock || 0;

            if (currentQtyInCart >= stockDisponible) {
                showToast(`Stock insuficiente. Solo hay ${stockDisponible} disponibles.`, 'warning');
                return;
            }

            state.addToCart(product);
            showToast(`${product.name} agregado al carrito`, 'success');

            // NUEVO: Disparar recomendación de IA (async, no bloquea)
            mostrarRecomendacion(product);
        }
    } else {
        console.error("No se encuentran los productos cargados en memoria.");
    }
};

window.updateQty = (id, delta) => {
    // Validar stock al incrementar desde el carrito
    if (delta > 0) {
        const item = state.cart.find(i => i.id === id);
        if (item && item.stock && item.quantity >= item.stock) {
            showToast(`Stock máximo alcanzado (${item.stock} disponibles)`, 'warning');
            return;
        }
    }
    state.updateQuantity(id, delta);
};

window.removeItem = (id) => {
    state.removeFromCart(id);
};

// =========================================================
// MÓDULO IA — Funciones de Inteligencia Artificial
// =========================================================
 
/**
 * Obtener recomendación de producto basada en búsqueda + historial del usuario.
 * @param {string} userId - UUID del usuario
 * @param {string} busqueda - Texto de búsqueda o ID del producto
 */
export async function getRecomendacion(userId, busqueda) {
    return await request(`ia/recomendacion?user_id=${encodeURIComponent(userId)}&busqueda=${encodeURIComponent(busqueda)}`);
}
 
/**
 * Obtener productos tendencia (más vendidos globalmente).
 * @param {number} limit - Cantidad de productos a obtener
 */
export async function getTendencias(limit = 10) {
    return await request(`ia/tendencias?limit=${limit}`);
}
 
/**
 * Obtener productos de baja rotación (menos vendidos).
 * @param {number} limit - Cantidad de productos a obtener
 */
export async function getBajaRotacion(limit = 10) {
    return await request(`ia/baja-rotacion?limit=${limit}`);
}