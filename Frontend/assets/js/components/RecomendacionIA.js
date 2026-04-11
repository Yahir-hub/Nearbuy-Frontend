/**
 * RecomendacionIA.js
 * Componente que muestra la recomendación de IA cuando el usuario agrega un producto al carrito.
 * Se inserta en productsview como un banner flotante temporal.
 */

import { getRecomendacion } from '../api.js';
import { state } from '../state.js';

/**
 * Muestra un banner de recomendación después de agregar un producto al carrito.
 * @param {object} productoAgregado - El producto que se acaba de agregar
 */
export async function mostrarRecomendacion(productoAgregado) {
    // Solo mostrar si el usuario está autenticado
    if (!state.isAuthenticated || !state.user?.id) return;

    try {
        const resultado = await getRecomendacion(state.user.id, String(productoAgregado.id));

        if (!resultado || !resultado.recomendacion || resultado.metodo === 'ninguno') return;

        const rec = resultado.recomendacion;
        const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

        // Eliminar banner anterior si existe
        const existing = document.getElementById('nb-ia-recomendacion');
        if (existing) existing.remove();

        const banner = document.createElement('div');
        banner.id = 'nb-ia-recomendacion';
        banner.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 16px 20px;
                max-width: 500px;
                width: 90%;
            ">
                <!-- Icono IA -->
                <div style="
                    width: 44px; height: 44px;
                    background: rgba(255,255,255,0.15);
                    border-radius: 12px;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                ">
                    <i class="fas fa-brain" style="font-size: 1.2rem; color: white;"></i>
                </div>

                <!-- Info -->
                <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 0.7rem; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">
                        ${rec.razon}
                    </div>
                    <div style="font-weight: 700; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${rec.nombre || rec.descripcion || 'Producto recomendado'}
                    </div>
                    <div style="font-size: 0.85rem; opacity: 0.9; margin-top: 2px;">
                        ${rec.precio ? money.format(rec.precio) : ''}
                    </div>
                </div>

                <!-- Botón ver -->
                <button onclick="window._nbVerRecomendacion(${rec.id})" style="
                    background: white;
                    color: var(--nb-wine, #4a1d1f);
                    border: none;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-weight: 700;
                    font-size: 0.8rem;
                    cursor: pointer;
                    flex-shrink: 0;
                    white-space: nowrap;
                ">
                    <i class="fas fa-plus"></i> Agregar
                </button>

                <!-- Cerrar -->
                <button onclick="document.getElementById('nb-ia-recomendacion').remove()" style="
                    background: none;
                    border: none;
                    color: white;
                    opacity: 0.6;
                    cursor: pointer;
                    font-size: 1rem;
                    padding: 4px;
                    flex-shrink: 0;
                ">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        banner.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%) translateY(20px);
            background: linear-gradient(135deg, #4a1d1f 0%, #6d2c30 100%);
            color: white;
            border-radius: 16px;
            z-index: 9998;
            box-shadow: 0 8px 30px rgba(74, 29, 31, 0.4);
            opacity: 0;
            transition: opacity 0.4s ease, transform 0.4s ease;
            pointer-events: auto;
        `;

        document.body.appendChild(banner);

        // Animar entrada
        requestAnimationFrame(() => {
            banner.style.opacity = '1';
            banner.style.transform = 'translateX(-50%) translateY(0)';
        });

        // Auto-cerrar después de 6 segundos
        setTimeout(() => {
            if (document.getElementById('nb-ia-recomendacion')) {
                banner.style.opacity = '0';
                banner.style.transform = 'translateX(-50%) translateY(20px)';
                setTimeout(() => banner.remove(), 400);
            }
        }, 6000);

    } catch (error) {
        console.error('[IA] Error al obtener recomendación:', error);
        // Silencioso: no mostrar nada si falla la IA
    }
}

/**
 * Handler global para agregar el producto recomendado al carrito.
 * Se registra en window para que el onclick inline funcione.
 */
window._nbVerRecomendacion = function(productoId) {
    // Buscar en los productos cargados en memoria
    if (window.currentProducts) {
        const producto = window.currentProducts.find(p => p.id === productoId);
        if (producto) {
            state.addToCart(producto);
            if (window._nbShowToast) {
                window._nbShowToast(`${producto.name} agregado al carrito`, 'success');
            }
        }
    }
    // Cerrar el banner
    const banner = document.getElementById('nb-ia-recomendacion');
    if (banner) banner.remove();
};