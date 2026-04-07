

import { state } from '../state.js';
import { request } from '../api.js';
import { Loader } from '../components/Loader.js';
import { Modal } from '../components/Modal.js';
import { Sidebar } from '../components/Sidebar.js';

// Estado local de la vista
let allProducts = [];
let allCategories = [];
let pendingOrders = [];
let cajaDiaria = 0;
let selectedCategory = null;   // null = no mostrar productos hasta que se filtre
let catalogProducts = [];
let lastScanMessage = '';
let lastScanType = '';
let empleados = [];            // Lista de admin/empleados disponibles
let selectedPreparador = null; // UUID del empleado que prepara
let selectedEntrega = null;    // UUID del empleado que entrega

export async function renderPOS() {
    const app = document.getElementById('app');

    Loader.show();
    try {
        const [prodRes, catRes, ordersRes, cajaRes, perfilRes] = await Promise.all([
            request('productos?limit=2000'),
            request('categorias?limit=150'),
            request('pedidos/admin?limit=50&estatus=pendiente'),
            request('reportes/ventas-diarias'),
            request('perfil?limit=1000')
        ]);
        allProducts = prodRes?.items || [];
        allCategories = catRes?.items || [];
        pendingOrders = ordersRes?.items || [];
        cajaDiaria = cajaRes?.total || 0;

        // Filtrar solo admin y empleados
        const allPerfiles = perfilRes?.items || [];
        empleados = allPerfiles.filter(p => p.rol === 'admin' || p.rol === 'empleado');

        // Por defecto, el usuario actual es preparador y entrega
        selectedPreparador = state.user?.id || null;
        selectedEntrega = state.user?.id || null;

        const preparandoRes = await request('pedidos/admin?limit=50&estatus=preparando');
        if (preparandoRes?.items) {
            pendingOrders = [...pendingOrders, ...(preparandoRes.items)];
        }

        catalogProducts = [...allProducts];
    } catch (e) {
        console.error('Error cargando POS:', e);
    }
    Loader.hide();

    renderPOSView();

    const pollInterval = setInterval(async () => {
        if (!document.getElementById('pos-layout')) {
            clearInterval(pollInterval);
            return;
        }
        try {
            const [ordersRes, preparandoRes] = await Promise.all([
                request('pedidos/admin?limit=50&estatus=pendiente'),
                request('pedidos/admin?limit=50&estatus=preparando')
            ]);
            pendingOrders = [
                ...(ordersRes?.items || []),
                ...(preparandoRes?.items || [])
            ];
            renderPOSView();
        } catch (e) {
            console.error('Error actualizando pedidos:', e);
        }
    }, 30000);



    state.subscribe(() => {
        const posContainer = document.getElementById('pos-layout');
        if (posContainer) renderPOSView();
    });
}




function renderPOSView() {
    const app = document.getElementById('app');
    const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
    const posItems = state.posCart || [];
    const posTotal = state.getPOSTotal();
    const posCount = state.getPOSCount();

    if (selectedCategory === null) {
        catalogProducts = [];
    } else if (selectedCategory === 'all') {
        catalogProducts = [...allProducts];
    } else {
        catalogProducts = allProducts.filter(p => p.id_categoria == selectedCategory);
    }

    app.innerHTML = `
        <div id="pos-layout" style="display: flex; min-height: 100vh; width: 100vw; background-color: var(--nb-cream);">
            
            ${Sidebar('pos', cajaDiaria)}

            <!-- ==================== CENTRO ==================== -->
            <main style="flex: 1; padding: 1.5rem; overflow-y: auto; display: flex; flex-direction: column; gap: 1.5rem;">
                
                <!-- ============ REGISTRO DE VENTA POR CÓDIGO DE BARRAS ============ -->
                <div style="background: white; border-radius: 12px; padding: 1.2rem; border: 1px solid #f0e6d2; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; gap: 15px;">
                        <h3 style="margin: 0; color: var(--nb-wine); font-size: 1.1rem; flex-shrink: 0;">
                            <i class="fas fa-barcode"></i> Registro de Venta
                        </h3>
                        
                        <div style="flex: 1; max-width: 400px; display: flex; gap: 8px; align-items: center;">
                            <div style="flex: 1; position: relative;">
                                <i class="fas fa-barcode" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #bbb;"></i>
                                <input type="text" id="barcode-input" placeholder="Escanear o escribir código..." 
                                    autocomplete="off" autofocus
                                    style="
                                        width: 100%; padding: 10px 12px 10px 38px; border: 2px solid var(--nb-wine);
                                        border-radius: 8px; font-size: 1rem; font-weight: 600; outline: none;
                                        box-sizing: border-box;
                                    ">
                            </div>
                            <button id="btn-manual-add" title="Buscar y agregar" style="
                                padding: 10px 14px; background: var(--nb-wine); color: white; border: none;
                                border-radius: 8px; cursor: pointer; font-size: 1rem; flex-shrink: 0;
                            "><i class="fas fa-plus-circle"></i></button>
                        </div>

                        <span style="
                            background: var(--nb-wine); color: white; padding: 6px 14px; border-radius: 20px;
                            font-size: 0.85rem; font-weight: bold; flex-shrink: 0;
                        ">${posCount} item${posCount !== 1 ? 's' : ''}</span>
                    </div>

                    ${lastScanMessage ? `
                        <div style="
                            padding: 8px 14px; border-radius: 6px; margin-bottom: 10px; font-size: 0.85rem; font-weight: 600;
                            background: ${lastScanType === 'success' ? '#e8f5e9' : '#ffebee'};
                            color: ${lastScanType === 'success' ? '#2e7d32' : '#c62828'};
                            display: flex; align-items: center; gap: 8px;
                        ">
                            <i class="fas ${lastScanType === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                            ${lastScanMessage}
                        </div>
                    ` : ''}

                    <div style="max-height: 300px; overflow-y: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                            <thead>
                                <tr style="border-bottom: 2px solid var(--nb-wine); color: var(--nb-wine); text-transform: uppercase; font-size: 0.75rem; position: sticky; top: 0; background: white;">
                                    <th style="padding: 10px 12px; text-align: left;">Descripción</th>
                                    <th style="padding: 10px 12px; text-align: left;">Código</th>
                                    <th style="padding: 10px 12px; text-align: center;">Cantidad</th>
                                    <th style="padding: 10px 12px; text-align: right;">P. Unit.</th>
                                    <th style="padding: 10px 12px; text-align: right;">Subtotal</th>
                                    <th style="padding: 10px 12px; text-align: center;">Quitar</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${posItems.length === 0 ? `
                                    <tr><td colspan="6" style="padding: 30px; text-align: center; color: #ccc;">
                                        <i class="fas fa-barcode" style="font-size: 2rem; margin-bottom: 8px; display: block;"></i>
                                        Escanea un código de barras o selecciona del catálogo
                                    </td></tr>
                                ` : posItems.map((item, i) => `
                                    <tr style="border-bottom: 1px solid #f5f0e8; ${i === posItems.length - 1 ? 'background: #fdf8f0;' : ''}">
                                        <td style="padding: 10px 12px; font-weight: 600; color: var(--nb-text);">${item.name}</td>
                                        <td style="padding: 10px 12px; color: #888; font-family: monospace; font-size: 0.85rem;">${getProductCode(item.id)}</td>
                                        <td style="padding: 10px 12px; text-align: center;">
                                            <div style="display: inline-flex; align-items: center; gap: 6px; background: #fdf3e6; padding: 3px 8px; border-radius: 15px;">
                                                <button class="sale-qty-btn" data-id="${item.id}" data-delta="-1" style="width: 22px; height: 22px; border-radius: 50%; border: 1px solid #ede0cc; background: white; cursor: pointer; font-size: 0.75rem; color: var(--nb-wine); font-weight: bold;">−</button>
                                                <span style="font-weight: bold; min-width: 24px; text-align: center; font-size: 1rem;">${item.quantity}</span>
                                                <button class="sale-qty-btn" data-id="${item.id}" data-delta="1" style="width: 22px; height: 22px; border-radius: 50%; border: 1px solid #ede0cc; background: white; cursor: pointer; font-size: 0.75rem; color: var(--nb-wine); font-weight: bold;">+</button>
                                            </div>
                                        </td>
                                        <td style="padding: 10px 12px; text-align: right; color: #666;">${money.format(item.price)}</td>
                                        <td style="padding: 10px 12px; text-align: right; font-weight: bold; color: var(--nb-wine);">${money.format(item.price * item.quantity)}</td>
                                        <td style="padding: 10px 12px; text-align: center;">
                                            <button class="sale-remove-btn" data-id="${item.id}" style="background: none; border: none; color: #e63946; cursor: pointer; font-size: 0.9rem;" title="Quitar"><i class="fas fa-times-circle"></i></button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    ${posItems.length > 0 ? `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 12px; margin-top: 10px; background: var(--nb-wine); border-radius: 8px; color: white;">
                            <span style="font-size: 1.1rem; font-weight: 600;">
                                <i class="fas fa-receipt"></i> Total (${posCount} artículo${posCount !== 1 ? 's' : ''})
                            </span>
                            <span style="font-size: 1.4rem; font-weight: 900; letter-spacing: 1px;">${money.format(posTotal)}</span>
                        </div>
                    ` : ''}
                </div>

                <!-- ============ CATÁLOGO RÁPIDO ============ -->
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3 style="margin: 0; color: var(--nb-text); font-size: 1rem;">
                            <i class="fas fa-th"></i> Catálogo Rápido
                            <span style="font-size: 0.75rem; color: #999; font-weight: normal; margin-left: 8px;">(selecciona una categoría)</span>
                        </h3>
                        <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                            <button class="pos-cat-btn" data-cat="all" style="padding: 5px 12px; border-radius: 20px; border: 1px solid ${selectedCategory === 'all' ? 'var(--nb-wine)' : '#ddd'}; background: ${selectedCategory === 'all' ? 'var(--nb-wine)' : 'white'}; color: ${selectedCategory === 'all' ? 'white' : 'var(--nb-text)'}; cursor: pointer; font-size: 0.75rem; font-weight: 600;">Todos</button>
                            ${allCategories.map(c => `
                                <button class="pos-cat-btn" data-cat="${c.id}" style="padding: 5px 12px; border-radius: 20px; border: 1px solid ${selectedCategory == c.id ? 'var(--nb-wine)' : '#ddd'}; background: ${selectedCategory == c.id ? 'var(--nb-wine)' : 'white'}; color: ${selectedCategory == c.id ? 'white' : 'var(--nb-text)'}; cursor: pointer; font-size: 0.75rem; font-weight: 600;">${c.nombre}</button>
                            `).join('')}
                        </div>
                    </div>
                    ${selectedCategory === null ? `
                        <div style="text-align: center; padding: 30px; color: #ccc;">
                            <i class="fas fa-hand-pointer" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                            <p style="font-size: 0.9rem; margin: 0;">Selecciona una categoría para ver los productos</p>
                        </div>
                    ` : `
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px;">
                            ${catalogProducts.map(p => `
                                <div class="pos-prod-card" data-id="${p.id}" style="background: white; border-radius: 10px; padding: 10px; border: 1px solid #f0e6d2; cursor: pointer; transition: all 0.15s; text-align: center; ${p.stock <= 0 ? 'opacity: 0.4; pointer-events: none;' : ''}" onmouseover="this.style.boxShadow='0 4px 12px rgba(74,29,31,0.15)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.boxShadow='none'; this.style.transform='none'">
                                    <div style="width: 50px; height: 50px; margin: 0 auto 6px; border-radius: 8px; background: ${p.imagen_url ? `url('${p.imagen_url}') center/cover` : '#fdf3e6'}; display: flex; align-items: center; justify-content: center;">
                                        ${!p.imagen_url ? '<i class="fas fa-box-open" style="color: #ddd; font-size: 0.9rem;"></i>' : ''}
                                    </div>
                                    <div style="font-weight: 600; font-size: 0.75rem; color: var(--nb-text); margin-bottom: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.descripcion || 'Sin descripción'}</div>
                                    <div style="font-weight: bold; color: var(--nb-wine); font-size: 0.85rem;">${money.format(p.precio)}</div>
                                    <div style="font-size: 0.65rem; color: ${p.stock <= 5 ? '#e63946' : '#aaa'}; margin-top: 2px;">${p.stock <= 0 ? 'Agotado' : p.stock + ' disp.'}</div>
                                </div>
                            `).join('')}
                            ${catalogProducts.length === 0 ? '<p style="color: #999; grid-column: 1/-1; text-align: center; padding: 15px; font-size: 0.85rem;">Sin productos en esta categoría</p>' : ''}
                        </div>
                    `}
                </div>
            </main>

            <!-- ==================== PANEL DERECHO ==================== -->
            <aside style="width: 310px; background: white; border-left: 1px solid #f0e6d2; display: flex; flex-direction: column; flex-shrink: 0; overflow-y: auto;">
                
                <div style="padding: 1.2rem; border-bottom: 1px solid #f0e6d2;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3 style="margin: 0; font-size: 0.95rem; color: var(--nb-text);"><i class="fas fa-box"></i> Pedidos Pendientes</h3>
                        ${pendingOrders.length > 0 ? `<span style="background: #4caf50; color: white; padding: 2px 10px; border-radius: 10px; font-size: 0.7rem; font-weight: bold;">${pendingOrders.length} NUEVOS</span>` : ''}
                    </div>
                    ${pendingOrders.length === 0 
                    ? `<p style="color: #ccc; text-align: center; font-size: 0.8rem; padding: 8px 0;">Sin pedidos pendientes</p>` 
                    : pendingOrders.slice(0, 4).map(order => {
                        const hora = order.fecha_creacion ? new Date(order.fecha_creacion).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '--:--';
                        return `
                        <div style="background: #fdf8f0; border-radius: 8px; padding: 10px; margin-bottom: 6px; border: 1px solid #f0e6d2;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                <span style="font-weight: bold; font-size: 0.85rem;">#ORD-${order.id}</span>
                                <span style="font-size: 0.65rem; font-weight: bold; padding: 2px 8px; border-radius: 10px; background: ${order.estatus === 'pendiente' ? '#fff3e0' : '#e8f5e9'}; color: ${order.estatus === 'pendiente' ? '#e65100' : '#2e7d32'};">${order.estatus.charAt(0).toUpperCase() + order.estatus.slice(1)}</span>
                            </div>
                            <div style="font-size: 0.8rem; font-weight:600; color: var(--nb-text); margin-bottom: 3px;">
                                <i class="fas fa-user" style="font-size:0.7rem; color:#bbb;"></i> ${order.cliente_nombre || 'Cliente'}
                            </div>
                            <div style="font-size: 0.75rem; color: #888; margin-bottom: 8px;">
                                ${money.format(order.total)} · ${hora}
                                ${order.cliente_telefono ? `· ${order.cliente_telefono}` : ''}
                            </div>
                            <button onclick="window.location.hash='#/mis-pedidos'" style="
                                width:100%; padding:6px; background:none; border:1px solid var(--nb-wine);
                                color:var(--nb-wine); border-radius:6px; cursor:pointer; font-size:0.8rem; font-weight:600;
                            "><i class="fas fa-external-link-alt"></i> Ver pedido</button>
                        </div>`;
                    }).join('')}
                </div>

                <div style="flex: 1; padding: 1.2rem; display: flex; flex-direction: column;">
                    <h3 style="margin: 0 0 0.8rem 0; font-size: 0.95rem; color: var(--nb-text);"><i class="fas fa-receipt"></i> Resumen</h3>
                    <div style="flex: 1; overflow-y: auto; margin-bottom: 1rem;">
                        ${posItems.length === 0 ? `<p style="color: #ccc; text-align: center; font-size: 0.8rem; padding: 15px 0;">Sin productos</p>` : posItems.map(item => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #f5f0e8;">
                                <div style="font-size: 0.8rem; font-weight: 600; color: var(--nb-text);">${item.name} <span style="color: #999;">x${item.quantity}</span></div>
                                <span style="font-weight: bold; color: var(--nb-wine); font-size: 0.85rem;">${money.format(item.price * item.quantity)}</span>
                            </div>
                        `).join('')}
                    </div>

                    <div style="border-top: 2px dashed #f0e6d2; padding-top: 1rem;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #999; font-size: 0.8rem;">
                            <span>Subtotal</span><span>${money.format(posTotal)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; font-size: 1.3rem; font-weight: 900; color: var(--nb-text);">
                            <span>Total</span><span>${money.format(posTotal)}</span>
                        </div>

                        <!-- SELECTOR DE EMPLEADOS -->
                        <div style="margin-bottom: 10px;">
                            <label style="font-size: 0.7rem; color: #999; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">
                                <i class="fas fa-user-cog"></i> Preparó
                            </label>
                            <select id="select-preparador" style="
                                width: 100%; padding: 8px; border: 1px solid #ede0cc; border-radius: 8px;
                                font-size: 0.85rem; background: #fdf3e6; color: var(--nb-text); outline: none; box-sizing: border-box;
                            ">
                                ${empleados.map(e => `
                                    <option value="${e.id}" ${e.id === selectedPreparador ? 'selected' : ''}>
                                        ${e.nombre_usuario} (${e.rol})
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        <div style="margin-bottom: 12px;">
                            <label style="font-size: 0.7rem; color: #999; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">
                                <i class="fas fa-user-check"></i> Entregó
                            </label>
                            <select id="select-entrega" style="
                                width: 100%; padding: 8px; border: 1px solid #ede0cc; border-radius: 8px;
                                font-size: 0.85rem; background: #fdf3e6; color: var(--nb-text); outline: none; box-sizing: border-box;
                            ">
                                ${empleados.map(e => `
                                    <option value="${e.id}" ${e.id === selectedEntrega ? 'selected' : ''}>
                                        ${e.nombre_usuario} (${e.rol})
                                    </option>
                                `).join('')}
                            </select>
                        </div>

                        <div style="background: #fdf3e6; border: 1px solid #ede0cc; border-radius: 10px; padding: 10px; text-align: center; margin-bottom: 10px; font-weight: bold; color: var(--nb-wine); font-size: 0.9rem;">
                            <i class="fas fa-money-bill-wave"></i> Efectivo
                        </div>
                        <button id="btn-finalizar-venta" style="width: 100%; padding: 13px; background: var(--nb-wine); color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 1rem; box-shadow: 0 4px 10px rgba(74,29,31,0.3); ${posItems.length === 0 ? 'opacity: 0.5; pointer-events: none;' : ''}">
                            <i class="fas fa-cash-register"></i> Finalizar Venta
                        </button>
                        ${posItems.length > 0 ? `
                            <button id="btn-limpiar-venta" style="width: 100%; padding: 10px; background: none; color: #e63946; border: 1px solid #e63946; border-radius: 10px; cursor: pointer; font-size: 0.85rem; margin-top: 8px; font-weight: 600;">
                                <i class="fas fa-trash"></i> Cancelar Venta
                            </button>
                        ` : ''}
                    </div>
                </div>
            </aside>
        </div>
    `;

    bindPOSEvents();

    // Auto-focus en el campo de código de barras
    const barcodeInput = document.getElementById('barcode-input');
    if (barcodeInput) barcodeInput.focus();
}




function findProductByBarcode(code) {
    if (!code) return null;
    const normalized = code.trim().toLowerCase();
    // 1. Búsqueda exacta por código de barras
    const byCode = allProducts.find(p => p.codigo && p.codigo.trim().toLowerCase() === normalized);
    if (byCode) return byCode;
    // 2. Por ID numérico
    const byId = allProducts.find(p => String(p.id) === normalized);
    if (byId) return byId;
    // 3. Búsqueda parcial por descripción
    const byDesc = allProducts.find(p => p.descripcion && p.descripcion.toLowerCase().includes(normalized));
    if (byDesc) return byDesc;
    return null;
}

function getProductCode(productId) {
    const p = allProducts.find(prod => prod.id === productId);
    return p?.codigo || '—';
}

function processBarcodeScan(code) {
    if (!code || !code.trim()) return;
    const product = findProductByBarcode(code.trim());
    const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

    if (!product) {
        lastScanMessage = `Producto no encontrado: "${code}"`;
        lastScanType = 'error';
        renderPOSView();
        return;
    }
    if (product.stock <= 0) {
        lastScanMessage = `"${product.descripcion || product.nombre}" está agotado`;
        lastScanType = 'error';
        renderPOSView();
        return;
    }
    const inCart = state.posCart.find(i => i.id === product.id);
    const currentQty = inCart ? inCart.quantity : 0;
    if (currentQty >= product.stock) {
        lastScanMessage = `Stock insuficiente para "${product.descripcion || product.nombre}" (máx: ${product.stock})`;
        lastScanType = 'error';
        renderPOSView();
        return;
    }

    state.addToPOS(product);
    lastScanMessage = `✓ ${product.descripcion || product.nombre} — ${money.format(product.precio)} (x${currentQty + 1})`;
    lastScanType = 'success';
}


function bindPOSEvents() {
    // Campo de código de barras
    const barcodeInput = document.getElementById('barcode-input');
    if (barcodeInput) {
        barcodeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                processBarcodeScan(barcodeInput.value);
                barcodeInput.value = '';
            }
        });
        // Mantener focus para lectores de código
        document.addEventListener('click', (e) => {
            const tag = e.target.tagName.toLowerCase();
            if (tag !== 'button' && tag !== 'input' && tag !== 'select' && tag !== 'a') {
                setTimeout(() => { const inp = document.getElementById('barcode-input'); if (inp) inp.focus(); }, 50);
            }
        });
    }

    // Botón manual
    const btnManual = document.getElementById('btn-manual-add');
    if (btnManual) {
        btnManual.onclick = () => {
            const input = document.getElementById('barcode-input');
            if (input && input.value.trim()) { processBarcodeScan(input.value); input.value = ''; input.focus(); }
        };
    }

    // Selección de empleados (guardar en variables locales para persistir entre re-renders)
    const selPrep = document.getElementById('select-preparador');
    if (selPrep) {
        selPrep.onchange = () => { selectedPreparador = selPrep.value; };
    }
    const selEnt = document.getElementById('select-entrega');
    if (selEnt) {
        selEnt.onchange = () => { selectedEntrega = selEnt.value; };
    }

    // Filtro categoría
    document.querySelectorAll('.pos-cat-btn').forEach(btn => {
        btn.onclick = () => { selectedCategory = btn.dataset.cat === 'all' ? 'all' : parseInt(btn.dataset.cat); renderPOSView(); };
    });

    // Click en catálogo
    document.querySelectorAll('.pos-prod-card').forEach(card => {
        card.onclick = () => {
            const id = parseInt(card.dataset.id);
            const product = allProducts.find(p => p.id === id);
            if (!product) return;
            const inCart = state.posCart.find(i => i.id === id);
            if (inCart && inCart.quantity >= product.stock) { Modal.show('Stock insuficiente', `Solo hay ${product.stock} unidades`, 'warning'); return; }
            state.addToPOS(product);
            const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
            lastScanMessage = `✓ ${product.descripcion || product.nombre} — ${money.format(product.precio)}`;
            lastScanType = 'success';
        };
    });

    // Cantidad en tabla
    document.querySelectorAll('.sale-qty-btn').forEach(btn => {
        btn.onclick = () => {
            const id = parseInt(btn.dataset.id);
            const delta = parseInt(btn.dataset.delta);
            if (delta > 0) {
                const product = allProducts.find(p => p.id === id);
                const inCart = state.posCart.find(i => i.id === id);
                if (product && inCart && inCart.quantity >= product.stock) { Modal.show('Stock insuficiente', `Solo hay ${product.stock} unidades`, 'warning'); return; }
            }
            state.updatePOSQuantity(id, delta);
            lastScanMessage = ''; lastScanType = '';
        };
    });

    // Quitar de tabla
    document.querySelectorAll('.sale-remove-btn').forEach(btn => {
        btn.onclick = () => { state.removeFromPOS(parseInt(btn.dataset.id)); lastScanMessage = ''; lastScanType = ''; };
    });

    // Completar pedido
    document.querySelectorAll('.btn-order-complete').forEach(btn => {
        btn.onclick = async () => {
            const orderId = parseInt(btn.dataset.id);
            if (!confirm(`¿Marcar #ORD-${orderId} como entregado?`)) return;
            Loader.show();
            try {
                await request(`pedidos/${orderId}/estatus?estatus=entregado`, 'PATCH');
                pendingOrders = pendingOrders.filter(o => o.id !== orderId);
                const cajaRes = await request('reportes/ventas-diarias');
                cajaDiaria = cajaRes?.total || 0;
                Modal.show('Éxito', `Pedido #ORD-${orderId} entregado`, 'success');
            } catch (e) { Modal.show('Error', 'No se pudo actualizar', 'error'); }
            Loader.hide();
            renderPOSView();
        };
    });

    // Cancelar venta
    const btnLimpiar = document.getElementById('btn-limpiar-venta');
    if (btnLimpiar) {
        btnLimpiar.onclick = () => { if (confirm('¿Cancelar la venta actual?')) { state.clearPOS(); lastScanMessage = ''; lastScanType = ''; } };
    }

    // Finalizar venta
    const btnFinalizar = document.getElementById('btn-finalizar-venta');
    if (btnFinalizar) {
        btnFinalizar.onclick = async () => {
            const items = state.posCart;
            if (items.length === 0) return;
            const total = state.getPOSTotal();
            const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
            if (!confirm(`¿Finalizar venta por ${money.format(total)}?`)) return;

            Loader.show();
            try {
                // Leer empleados seleccionados de los dropdowns
                const preparadorId = document.getElementById('select-preparador')?.value || state.user.id;
                const entregaId = document.getElementById('select-entrega')?.value || state.user.id;

                const pedidoRes = await request('pedidos', 'POST', {
                    id_usuario: state.user.id,
                    total,
                    estatus: 'entregado',
                    metodo_pago: 'efectivo',
                    id_empleado_preparador: preparadorId,
                    id_empleado_entrega: entregaId
                });
                if (!pedidoRes || !pedidoRes.id) throw new Error('No se pudo crear el pedido');
                const pedidoId = pedidoRes.id;

                for (const item of items) {
                    await request('detalle_pedido', 'POST', { id_pedido: pedidoId, id_producto: item.id, cantidad: item.quantity, precio_unitario: item.price });
                }
                for (const item of items) {
                    await request(`productos/${item.id}/stock`, 'PATCH', { cantidad: -item.quantity });
                }

                state.clearPOS();
                const [prodRes, cajaRes] = await Promise.all([request('productos?limit=500'), request('reportes/ventas-diarias')]);
                allProducts = prodRes?.items || [];
                cajaDiaria = cajaRes?.total || 0;
                catalogProducts = [];
                selectedCategory = null;
                lastScanMessage = `Venta #${pedidoId} completada — ${money.format(total)}`;
                lastScanType = 'success';
                Modal.show('Venta Exitosa', `Venta #${pedidoId} por ${money.format(total)}`, 'success');
            } catch (e) {
                console.error('Error al finalizar venta:', e);
                Modal.show('Error', 'Error al procesar la venta', 'error');
            }
            Loader.hide();
            renderPOSView();
        };
    }
}