import { Navbar } from '../components/Navbar.js';
import { state } from '../state.js';
import { getRecomendacion } from '../api.js';

// Set de IDs seleccionados (por defecto todos marcados)
let selectedIds = new Set();
let initialized = false;

// Cache de recomendaciones para no repetir llamadas
let _iaRecomendaciones = [];
let _iaLastCartIds = '';
let _iaCartActive = false;

async function cargarRecomendaciones() {
    if (!_iaCartActive) return;
    if (!state.isAuthenticated || !state.user?.id || state.cart.length === 0) {
        _iaRecomendaciones = [];
        renderBarraIA();
        return;
    }

    const cartIds = state.cart.map(i => i.id).sort().join(',');
    if (cartIds === _iaLastCartIds && _iaRecomendaciones.length > 0) return;
    _iaLastCartIds = cartIds;

    const recomendaciones = [];
    const idsEnCarrito = new Set(state.cart.map(i => i.id));
    const idsYaRecomendados = new Set();

    for (const item of state.cart) {
        if (recomendaciones.length >= 4) break;
        try {
            const res = await getRecomendacion(state.user.id, String(item.id));
            if (res && res.recomendacion && res.metodo !== 'ninguno') {
                const recId = res.recomendacion.id;
                if (!idsEnCarrito.has(recId) && !idsYaRecomendados.has(recId)) {
                    recomendaciones.push(res.recomendacion);
                    idsYaRecomendados.add(recId);
                }
            }
        } catch (e) {
            console.error('[IA Cart] Error:', e);
        }
    }

    _iaRecomendaciones = recomendaciones;
    if (_iaCartActive) renderBarraIA();
}

function renderBarraIA() {
    const existing = document.getElementById('nb-ia-cart-bar');
    if (existing) existing.remove();

    if (!_iaCartActive || _iaRecomendaciones.length === 0) return;

    const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

    const barra = document.createElement('div');
    barra.id = 'nb-ia-cart-bar';
    barra.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 4%;
        right: 38%;
        background: white;
        z-index: 9997;
        box-shadow: 0 -2px 15px rgba(0,0,0,0.08);
        border-top: 2px solid #f0e6d2;
        padding: 10px 20px;
        display: flex;
        align-items: center;
        gap: 12px;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
    `;

    barra.innerHTML = `
        <div style="
            flex-shrink: 0;
            display: flex;
            align-items: center;
            gap: 8px;
            padding-right: 12px;
            border-right: 1px solid #f0e6d2;
        ">
            <div style="
                width: 32px; height: 32px;
                background: linear-gradient(135deg, #4a1d1f, #6d2c30);
                border-radius: 8px;
                display: flex; align-items: center; justify-content: center;
            ">
                <i class="fas fa-brain" style="font-size: 0.8rem; color: white;"></i>
            </div>
            <span style="font-size: 0.7rem; color: var(--nb-wine); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">IA</span>
        </div>

        ${_iaRecomendaciones.map(rec => `
            <div style="
                flex-shrink: 0;
                display: flex;
                align-items: center;
                gap: 10px;
                background: #fdf8f0;
                border: 1px solid #f0e6d2;
                border-radius: 10px;
                padding: 8px 12px;
                min-width: 200px;
                max-width: 240px;
                transition: background 0.2s;
            " onmouseover="this.style.background='#f5efe3'"
               onmouseout="this.style.background='#fdf8f0'">
                
                <div style="
                    width: 38px; height: 38px;
                    border-radius: 8px;
                    background: ${rec.imagen_url ? `url('${rec.imagen_url}') center/cover` : '#f0e6d2'};
                    flex-shrink: 0;
                    display: flex; align-items: center; justify-content: center;
                ">
                    ${rec.imagen_url ? '' : '<i class="fas fa-box-open" style="color: #ccc; font-size: 0.85rem;"></i>'}
                </div>

                <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 0.6rem; color: #999; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${rec.razon}
                    </div>
                    <div style="font-weight: 700; font-size: 0.8rem; color: var(--nb-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${rec.nombre || rec.descripcion || 'Producto'}
                    </div>
                    <div style="font-size: 0.75rem; color: var(--nb-wine); font-weight: 600;">
                        ${rec.precio ? money.format(rec.precio) : ''}
                    </div>
                </div>

                <button onclick="event.stopPropagation(); window._iaAgregarDesdeCarrito(${rec.id}, '${(rec.nombre || rec.descripcion || 'Producto').replace(/'/g, "\\'")}')" style="
                    background: var(--nb-wine);
                    color: white;
                    border: none;
                    width: 28px; height: 28px;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer;
                    flex-shrink: 0;
                    font-size: 0.75rem;
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='scale(1.15)'"
                   onmouseout="this.style.transform='scale(1)'">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `).join('')}

        <button onclick="document.getElementById('nb-ia-cart-bar').remove()" style="
            background: none;
            border: none;
            color: #ccc;
            cursor: pointer;
            font-size: 0.9rem;
            padding: 6px;
            flex-shrink: 0;
            margin-left: auto;
            transition: color 0.2s;
        " onmouseover="this.style.color='var(--nb-wine)'"
           onmouseout="this.style.color='#ccc'">
            <i class="fas fa-times"></i>
        </button>
    `;

    document.body.appendChild(barra);
}

// Limpiar barra al cambiar de ruta
window.addEventListener('hashchange', () => {
    if (!window.location.hash.includes('/cart')) {
        _iaCartActive = false;
        const bar = document.getElementById('nb-ia-cart-bar');
        if (bar) bar.remove();
    }
});

window._iaAgregarDesdeCarrito = async function(productoId, nombre) {
    try {
        const { request } = await import('../api.js');
        const res = await request(`productos/${productoId}`);
        if (res && res.id) {
            const producto = {
                id: res.id,
                name: res.descripcion || res.nombre || nombre,
                price: res.precio,
                stock: res.stock,
                image: res.imagen_url || null
            };
            state.addToCart(producto);
            if (window._nbShowToast) {
                window._nbShowToast(`${producto.name} agregado al carrito`, 'success');
            }
            _iaLastCartIds = '';
            cargarRecomendaciones();
        }
    } catch (e) {
        console.error('[IA Cart] Error al agregar:', e);
    }
};

export function renderCart() {
    _iaCartActive = true;

    if (!initialized || selectedIds.size === 0) {
        selectedIds = new Set(state.cart.map(item => item.id));
        initialized = true;
    }

    selectedIds.forEach(id => {
        if (!state.cart.find(item => item.id === id)) {
            selectedIds.delete(id);
        }
    });

    window._cartToggleItem = function(id) {
        if (selectedIds.has(id)) {
            selectedIds.delete(id);
        } else {
            selectedIds.add(id);
        }
        updateHTML();
    };

    window._cartSelectAll = function() {
        state.cart.forEach(item => selectedIds.add(item.id));
        updateHTML();
    };

    window._cartDeselectAll = function() {
        selectedIds.clear();
        updateHTML();
    };

    window._cartCheckout = function() {
        window._nbSelectedCartIds = Array.from(selectedIds);
        _iaCartActive = false;
        const bar = document.getElementById('nb-ia-cart-bar');
        if (bar) bar.remove();
        window.location.hash = '#/checkout';
    };

    const updateHTML = () => {
        const app = document.getElementById('app');
        const cartItems = state.cart;
        const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

        const selectedItems = cartItems.filter(item => selectedIds.has(item.id));
        const selectedTotal = selectedItems.reduce((t, i) => t + (i.price * i.quantity), 0);
        const selectedCount = selectedItems.reduce((c, i) => c + i.quantity, 0);
        const allSelected = cartItems.length > 0 && selectedIds.size === cartItems.length;

        app.innerHTML = `
        <div style="width: 100%; min-height: 100vh; display: flex; flex-direction: column;">
            
            <div id="nav-wrapper">${Navbar()}</div>

            <main style="
                flex: 1; width: 100%; max-width: 1000px; 
                margin: 0 auto; padding: 2rem 20px;
                padding-bottom: 80px;
                display: flex; flex-direction: column;
            ">
                
                <div style="display: flex; align-items: center; margin-bottom: 2rem;">
                    <button onclick="window.history.back()" style="
                        background: none; border: none; font-size: 1.5rem; 
                        color: var(--nb-wine); cursor: pointer; display: flex; align-items: center; gap: 10px; font-weight: bold;
                    ">
                        <i class="fas fa-arrow-left"></i> Seguir Comprando
                    </button>
                </div>

                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 10px;">
                    <h2 style="color: var(--nb-wine); font-size: 2rem; margin: 0; text-transform: uppercase; letter-spacing: 1px;">
                        Tu Carrito (${state.getCartCount()} productos)
                    </h2>
                    ${cartItems.length > 0 ? `
                        <button onclick="${allSelected ? 'window._cartDeselectAll()' : 'window._cartSelectAll()'}" style="
                            background: none; border: 2px solid var(--nb-wine); color: var(--nb-wine);
                            padding: 8px 18px; border-radius: 20px; cursor: pointer;
                            font-size: 0.85rem; font-weight: 600; transition: all 0.2s;
                        " onmouseover="this.style.background='var(--nb-wine)'; this.style.color='white'"
                           onmouseout="this.style.background='none'; this.style.color='var(--nb-wine)'">
                            ${allSelected ? 'Deseleccionar todo' : 'Seleccionar todo'}
                        </button>
                    ` : ''}
                </div>

                <div style="display: flex; flex-wrap: wrap; gap: 40px;">
                    
                    <!-- COLUMNA IZQUIERDA: Items del carrito -->
                    <div style="flex: 2; min-width: 300px;">
                        ${cartItems.length === 0 ? `
                            <div style="text-align: center; padding: 40px; background: white; border-radius: 20px; border: 1px solid #f0e6d2;">
                                <i class="fas fa-shopping-basket" style="font-size: 4rem; color: #eaddc5; margin-bottom: 20px;"></i>
                                <p style="font-size: 1.2rem; color: var(--nb-wine);">Tu carrito está vacío</p>
                                <button onclick="window.location.hash='#/store'" style="
                                    margin-top: 20px; padding: 10px 20px; background: var(--nb-wine); color: white; border: none; border-radius: 20px; cursor: pointer;
                                ">Ir a la Tienda</button>
                            </div>
                        ` : `
                            <div style="background: white; border-radius: 20px; overflow: hidden; border: 1px solid #f0e6d2; box-shadow: 0 5px 15px rgba(0,0,0,0.03);">
                                ${cartItems.map(item => {
                                    const isMaxStock = item.stock && item.quantity >= item.stock;
                                    const isSelected = selectedIds.has(item.id);
                                    return `
                                    <div style="
                                        display: flex; align-items: center; 
                                        padding: 20px; border-bottom: 1px solid #fcf8f2;
                                        gap: 15px;
                                        background: ${isSelected ? 'white' : '#faf7f2'};
                                        opacity: ${isSelected ? '1' : '0.7'};
                                        transition: all 0.2s;
                                    ">
                                        <!-- Checkbox -->
                                        <div onclick="window._cartToggleItem(${item.id})" style="
                                            width: 24px; height: 24px; flex-shrink: 0;
                                            border: 2px solid ${isSelected ? 'var(--nb-wine)' : '#ccc'};
                                            border-radius: 6px; cursor: pointer;
                                            display: flex; align-items: center; justify-content: center;
                                            background: ${isSelected ? 'var(--nb-wine)' : 'white'};
                                            transition: all 0.2s;
                                        ">
                                            ${isSelected ? '<i class="fas fa-check" style="color: white; font-size: 0.7rem;"></i>' : ''}
                                        </div>

                                        <!-- Imagen -->
                                        <div style="
                                            width: 70px; height: 70px; 
                                            background-image: url('${item.image || ''}'); 
                                            background-color: #fdf3e6;
                                            background-size: cover; background-position: center;
                                            border-radius: 10px; flex-shrink: 0;
                                        "></div>

                                        <!-- Info -->
                                        <div style="flex: 1;">
                                            <h4 style="color: var(--nb-text); font-size: 1rem; margin: 0 0 5px 0;">${item.name}</h4>
                                            <p style="color: var(--nb-wine); font-weight: bold; margin: 0;">${money.format(item.price)}</p>
                                            ${isMaxStock ? `
                                                <p style="color: #e65100; font-size: 0.75rem; margin: 4px 0 0 0;">
                                                    <i class="fas fa-exclamation-triangle"></i> Stock máximo (${item.stock})
                                                </p>
                                            ` : ''}
                                        </div>

                                        <!-- Cantidad -->
                                        <div style="display: flex; align-items: center; gap: 10px; background: #fdf3e6; padding: 5px 10px; border-radius: 15px;">
                                            <button onclick="window.updateQty(${item.id}, -1)" style="
                                                width: 25px; height: 25px; background: white; border: 1px solid #eaddc5; border-radius: 50%; color: var(--nb-wine); cursor: pointer;
                                            ">-</button>
                                            <span style="font-weight: bold; width: 20px; text-align: center;">${item.quantity}</span>
                                            <button onclick="window.updateQty(${item.id}, 1)" style="
                                                width: 25px; height: 25px; 
                                                background: ${isMaxStock ? '#f5f5f5' : 'white'}; 
                                                border: 1px solid ${isMaxStock ? '#ddd' : '#eaddc5'}; 
                                                border-radius: 50%; 
                                                color: ${isMaxStock ? '#ccc' : 'var(--nb-wine)'}; 
                                                cursor: ${isMaxStock ? 'not-allowed' : 'pointer'};
                                            " ${isMaxStock ? 'disabled' : ''}>+</button>
                                        </div>

                                        <!-- Eliminar -->
                                        <button onclick="window.removeItem(${item.id})" style="
                                            background: none; border: none; color: #e63946; cursor: pointer; font-size: 1.2rem; margin-left: 5px;
                                        ">
                                            <i class="fas fa-trash-alt"></i>
                                        </button>
                                    </div>`;
                                }).join('')}
                            </div>
                        `}
                    </div>

                    <!-- COLUMNA DERECHA: Ticket -->
                    <div style="flex: 1; min-width: 280px;">
                        <div style="
                            background: white; padding: 30px; border-radius: 20px; 
                            border: 1px solid #f0e6d2;
                            box-shadow: 0 10px 25px rgba(0,0,0,0.05);
                            position: sticky; top: 100px;
                            font-family: 'Courier New', Courier, monospace;
                        ">
                            <div style="text-align: center; margin-bottom: 15px;">
                                <h3 style="color: var(--nb-wine); font-family: inherit; font-size: 1.1rem; margin: 0; letter-spacing: 2px;">
                                    ═══ NEARBUY ═══
                                </h3>
                                <p style="color: #999; font-size: 0.75rem; margin-top: 5px; font-family: inherit;">
                                    Ticket de compra
                                </p>
                            </div>

                            <div style="border-top: 2px dashed #e0d5c3; margin-bottom: 15px;"></div>

                            ${selectedItems.length > 0 ? `
                                ${selectedItems.map(item => `
                                    <div style="margin-bottom: 10px;">
                                        <div style="
                                            display: flex; justify-content: space-between;
                                            color: var(--nb-text); font-size: 0.85rem; font-family: inherit;
                                        ">
                                            <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-right: 8px;">
                                                ${item.name}
                                            </span>
                                            <span style="font-weight: bold; white-space: nowrap;">
                                                ${money.format(item.price * item.quantity)}
                                            </span>
                                        </div>
                                        <div style="color: #999; font-size: 0.75rem; font-family: inherit;">
                                            ${item.quantity} x ${money.format(item.price)}
                                        </div>
                                    </div>
                                `).join('')}

                                <div style="border-top: 2px dashed #e0d5c3; margin: 15px 0;"></div>

                                <div style="
                                    display: flex; justify-content: space-between;
                                    font-size: 1.3rem; color: var(--nb-wine);
                                    font-weight: 900; font-family: inherit; margin-bottom: 5px;
                                ">
                                    <span>TOTAL</span>
                                    <span>${money.format(selectedTotal)}</span>
                                </div>

                                <p style="font-size: 0.7rem; color: #aaa; text-align: center; margin-top: 8px; font-family: inherit;">
                                    * Precios con IVA incluido
                                </p>

                                <div style="border-top: 2px dashed #e0d5c3; margin: 15px 0;"></div>

                                <p style="font-size: 0.7rem; color: #bbb; text-align: center; font-family: inherit;">
                                    Artículos: ${selectedCount} de ${state.getCartCount()} &bull; Método: Pick-up
                                </p>
                            ` : `
                                <p style="text-align: center; color: #ccc; font-size: 0.9rem; padding: 20px 0; font-family: inherit;">
                                    ${cartItems.length === 0 ? 'Carrito vacío' : 'Selecciona artículos para cobrar'}
                                </p>
                            `}

                            ${selectedItems.length > 0 ? `
                                <button onclick="window._cartCheckout()" style="
                                    width: 100%; background-color: var(--nb-wine); color: white;
                                    padding: 15px; border: none; border-radius: 12px;
                                    font-size: 1.1rem; font-weight: bold; cursor: pointer;
                                    transition: transform 0.2s;
                                    box-shadow: 0 5px 15px rgba(74, 29, 31, 0.3);
                                    margin-top: 15px;
                                    font-family: system-ui, -apple-system, sans-serif;
                                " onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                                    Proceder al Pago (${selectedCount} artículos)
                                </button>
                            ` : cartItems.length > 0 ? `
                                <button disabled style="
                                    width: 100%; background-color: #ccc; color: white;
                                    padding: 15px; border: none; border-radius: 12px;
                                    font-size: 1.1rem; font-weight: bold; cursor: not-allowed;
                                    margin-top: 15px;
                                    font-family: system-ui, -apple-system, sans-serif;
                                ">
                                    Selecciona artículos
                                </button>
                            ` : ''}
                        </div>
                    </div>

                </div>
            </main>
        </div>
        `;
    };

    updateHTML();
    cargarRecomendaciones();

    state.subscribe(() => {
        if (!_iaCartActive) return;
        state.cart.forEach(item => {
            if (!selectedIds.has(item.id)) {
                selectedIds.add(item.id);
            }
        });
        selectedIds.forEach(id => {
            if (!state.cart.find(item => item.id === id)) {
                selectedIds.delete(id);
            }
        });
        updateHTML();
        cargarRecomendaciones();
    });
}