import { Navbar } from '../components/Navbar.js';
import { state } from '../state.js';
import { request } from '../api.js';

export function renderCheckout() {
    const app = document.getElementById('app');
    const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

    // Validación: carrito vacío → redirigir a tienda
    if (state.cart.length === 0) {
        window.location.hash = '#/store';
        return;
    }

    // Validación: usuario no autenticado → redirigir a login
    if (!state.isAuthenticated || !state.user) {
        window.location.hash = '#/login';
        return;
    }

    // Filtrar solo items seleccionados desde cartview
    const selectedIds = window._nbSelectedCartIds && window._nbSelectedCartIds.length > 0
        ? new Set(window._nbSelectedCartIds)
        : new Set(state.cart.map(item => item.id));

    const cartItems = state.cart.filter(item => selectedIds.has(item.id));
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // ========================================
    // PASO 1: Pantalla de confirmación
    // ========================================
    function renderConfirmation() {
        app.innerHTML = `
        <div style="width: 100%; min-height: 100vh; display: flex; flex-direction: column; background-color: var(--nb-cream);">
            ${Navbar()}
            <main style="flex: 1; display: flex; justify-content: center; padding: 2rem;">
                <div style="
                    background: white;
                    padding: 2.5rem;
                    border-radius: 25px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
                    border: 1px solid #f0e6d2;
                    max-width: 600px;
                    width: 100%;
                ">
                    <h2 style="color: var(--nb-wine); font-size: 1.8rem; margin-bottom: 1.5rem; text-transform: uppercase; text-align: center;">
                        Confirmar Pedido
                    </h2>

                    <p style="color: #666; text-align: center; margin-bottom: 2rem;">
                        Revisa tu pedido antes de confirmar. Podrás recogerlo en tienda.
                    </p>

                    <!-- Lista de productos -->
                    <div style="
                        background: #fdf8f0;
                        border-radius: 15px;
                        padding: 20px;
                        margin-bottom: 1.5rem;
                        border: 1px solid #f0e6d2;
                    ">
                        ${cartItems.map(item => `
                            <div style="
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                padding: 10px 0;
                                border-bottom: 1px solid #f0e6d2;
                            ">
                                <div style="flex: 1;">
                                    <span style="color: var(--nb-text); font-weight: 600;">${item.name}</span>
                                    <br>
                                    <span style="color: #999; font-size: 0.85rem;">${item.quantity} x ${money.format(item.price)}</span>
                                </div>
                                <span style="color: var(--nb-wine); font-weight: bold; font-size: 1.1rem;">
                                    ${money.format(item.price * item.quantity)}
                                </span>
                            </div>
                        `).join('')}
                    </div>

                    <!-- Total -->
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 15px 0;
                        margin-bottom: 1.5rem;
                        border-top: 2px dashed #f0e6d2;
                    ">
                        <span style="font-size: 1.4rem; color: var(--nb-wine); font-weight: 900;">Total a pagar</span>
                        <span style="font-size: 1.4rem; color: var(--nb-wine); font-weight: 900;">${money.format(total)}</span>
                    </div>

                    <p style="font-size: 0.8rem; color: #999; text-align: center; margin-bottom: 1.5rem;">
                        * Precios con IVA incluido &bull; Método: Pago en tienda (Pick-up)
                    </p>

                    <!-- Botones -->
                    <div style="display: flex; gap: 15px;">
                        <button onclick="window.location.hash='#/cart'" style="
                            flex: 1;
                            padding: 14px;
                            border: 2px solid var(--nb-wine);
                            background: white;
                            color: var(--nb-wine);
                            border-radius: 12px;
                            font-size: 1rem;
                            font-weight: bold;
                            cursor: pointer;
                        ">
                            <i class="fas fa-arrow-left"></i> Volver
                        </button>
                        <button id="btn-confirmar-pedido" onclick="window._nbConfirmarPedido()" style="
                            flex: 2;
                            padding: 14px;
                            border: none;
                            background: var(--nb-wine);
                            color: white;
                            border-radius: 12px;
                            font-size: 1rem;
                            font-weight: bold;
                            cursor: pointer;
                            box-shadow: 0 5px 15px rgba(74, 29, 31, 0.3);
                        ">
                            <i class="fas fa-check"></i> Confirmar Pedido
                        </button>
                    </div>
                </div>
            </main>
        </div>
        `;
    }

    // ========================================
    // PASO 2: Loading
    // ========================================
    function renderLoading() {
        app.innerHTML = `
        <div style="width: 100%; min-height: 100vh; display: flex; flex-direction: column; background-color: var(--nb-cream);">
            ${Navbar()}
            <main style="flex: 1; display: flex; align-items: center; justify-content: center;">
                <div style="text-align: center;">
                    <div style="
                        width: 60px; height: 60px;
                        border: 5px solid #f0e6d2;
                        border-top: 5px solid var(--nb-wine);
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 20px auto;
                    "></div>
                    <p style="color: var(--nb-wine); font-size: 1.2rem; font-weight: bold;">Procesando tu pedido...</p>
                    <p style="color: #999; margin-top: 10px;">No cierres esta página</p>
                    <style>
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    </style>
                </div>
            </main>
        </div>
        `;
    }

    // ========================================
    // PASO 3: Pantalla de éxito
    // ========================================
    function renderSuccess(pedidoId, totalPagado) {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=NearBuy_Pedido_${pedidoId}`;

        app.innerHTML = `
        <div style="width: 100%; min-height: 100vh; display: flex; flex-direction: column; background-color: var(--nb-cream);">
            ${Navbar()}
            <main style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 2rem;">
                <div style="
                    background: white;
                    padding: 3rem;
                    border-radius: 30px;
                    text-align: center;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
                    border: 1px solid #f0e6d2;
                    max-width: 450px;
                    width: 100%;
                ">
                    <div style="
                        width: 60px; height: 60px;
                        background: #e8f5e9;
                        border-radius: 50%;
                        display: flex; align-items: center; justify-content: center;
                        margin: 0 auto 1.5rem auto;
                    ">
                        <i class="fas fa-check" style="font-size: 1.8rem; color: #2e7d32;"></i>
                    </div>

                    <h2 style="color: var(--nb-wine); font-size: 1.8rem; margin-bottom: 0.5rem; text-transform: uppercase;">
                        Pedido Creado
                    </h2>

                    <p style="color: #666; font-size: 1.1rem; margin-bottom: 2rem;">
                        Pedido <strong>#${pedidoId}</strong> registrado exitosamente.<br>
                        Muestra este código al recoger tu pedido.
                    </p>

                    <div style="
                        width: 200px; height: 200px;
                        margin: 0 auto 1.5rem auto;
                        padding: 10px;
                        background: white;
                        border: 4px solid var(--nb-wine-light, #a03b41);
                        border-radius: 15px;
                        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                    ">
                        <img src="${qrUrl}" alt="Código QR del Pedido #${pedidoId}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 5px;">
                    </div>

                    <div style="
                        background-color: var(--nb-wine);
                        color: white;
                        padding: 10px 30px;
                        border-radius: 50px;
                        display: inline-block;
                        font-size: 1.3rem;
                        font-weight: bold;
                        margin-bottom: 2rem;
                        box-shadow: 0 4px 10px rgba(74, 29, 31, 0.3);
                        letter-spacing: 1px;
                    ">
                        TOTAL: ${money.format(totalPagado)}
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <button onclick="window.location.hash='#/mis-pedidos'" style="
                            width: 100%;
                            background: white;
                            color: var(--nb-wine);
                            padding: 14px;
                            border: 2px solid var(--nb-wine);
                            border-radius: 50px;
                            font-size: 1rem;
                            font-weight: bold;
                            cursor: pointer;
                            text-transform: uppercase;
                        ">
                            <i class="fas fa-list"></i> Ver Mis Pedidos
                        </button>

                        <button onclick="window.location.hash='#/store'" style="
                            width: 100%;
                            background-color: var(--nb-wine);
                            color: white;
                            padding: 14px;
                            border: none;
                            border-radius: 50px;
                            font-size: 1rem;
                            font-weight: bold;
                            cursor: pointer;
                            text-transform: uppercase;
                        ">
                            <i class="fas fa-store"></i> Volver a la Tienda
                        </button>
                    </div>
                </div>
            </main>
        </div>
        `;
    }

    // ========================================
    // PASO 4: Pantalla de error
    // ========================================
    function renderError(errorMsg) {
        app.innerHTML = `
        <div style="width: 100%; min-height: 100vh; display: flex; flex-direction: column; background-color: var(--nb-cream);">
            ${Navbar()}
            <main style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 2rem;">
                <div style="
                    background: white;
                    padding: 3rem;
                    border-radius: 30px;
                    text-align: center;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
                    border: 1px solid #f0e6d2;
                    max-width: 450px;
                    width: 100%;
                ">
                    <div style="
                        width: 60px; height: 60px;
                        background: #ffebee;
                        border-radius: 50%;
                        display: flex; align-items: center; justify-content: center;
                        margin: 0 auto 1.5rem auto;
                    ">
                        <i class="fas fa-times" style="font-size: 1.8rem; color: #c62828;"></i>
                    </div>

                    <h2 style="color: #c62828; font-size: 1.5rem; margin-bottom: 1rem;">Error al crear el pedido</h2>
                    <p style="color: #666; margin-bottom: 2rem;">${errorMsg}</p>
                    <p style="color: #999; font-size: 0.9rem; margin-bottom: 2rem;">Tu carrito no fue vaciado. Puedes intentar de nuevo.</p>

                    <button onclick="window._nbConfirmarPedido()" style="
                        width: 100%;
                        background: var(--nb-wine);
                        color: white;
                        padding: 14px;
                        border: none;
                        border-radius: 50px;
                        font-size: 1rem;
                        font-weight: bold;
                        cursor: pointer;
                        margin-bottom: 10px;
                    ">
                        <i class="fas fa-redo"></i> Intentar de nuevo
                    </button>

                    <button onclick="window.location.hash='#/cart'" style="
                        width: 100%;
                        background: white;
                        color: var(--nb-wine);
                        padding: 14px;
                        border: 2px solid var(--nb-wine);
                        border-radius: 50px;
                        font-size: 1rem;
                        font-weight: bold;
                        cursor: pointer;
                    ">
                        Volver al Carrito
                    </button>
                </div>
            </main>
        </div>
        `;
    }

    // ========================================
    // Handler principal: Confirmar pedido
    // ========================================
    window._nbConfirmarPedido = async function() {
        renderLoading();

        try {
            // FIX: Fecha naive (sin timezone) para evitar error de validación en Pydantic
            const now = new Date();
            const fechaNaive = now.getFullYear() + '-' +
                String(now.getMonth() + 1).padStart(2, '0') + '-' +
                String(now.getDate()).padStart(2, '0') + 'T' +
                String(now.getHours()).padStart(2, '0') + ':' +
                String(now.getMinutes()).padStart(2, '0') + ':' +
                String(now.getSeconds()).padStart(2, '0');

            // PASO 1: Crear el pedido en el backend
            // FIX: El codigo_qr se deja null en la creación.
            //       El QR visual en pantalla de éxito usa el ID real.
            //       No necesitamos actualizar la DB con PUT después.
            const pedidoBody = {
                id_usuario: state.user.id,
                total: total,
                estatus: "pendiente",
                metodo_pago: "pickup",
                codigo_qr: null,
                fecha_creacion: fechaNaive,
                id_empleado_preparador: null,
                id_empleado_entrega: null
            };

            console.log('[Checkout] Creando pedido:', pedidoBody);
            const pedidoResponse = await request('pedidos', 'POST', pedidoBody);
            console.log('[Checkout] Respuesta pedido:', pedidoResponse);

            // Verificar que se creó el pedido
            if (!pedidoResponse || pedidoResponse.error || !pedidoResponse.id) {
                const errMsg = pedidoResponse?.error || 'No se pudo crear el pedido';
                renderError(errMsg);
                return;
            }

            const pedidoId = pedidoResponse.id;
            console.log('[Checkout] Pedido creado con ID:', pedidoId);

            // Guardar código QR con el ID real
            const qrData = `NearBuy_Pedido_${pedidoId}`;
            await request(`pedidos/${pedidoId}`, 'PUT', { codigo_qr: `NearBuy_Pedido_${pedidoId}` }).catch(e => console.warn('QR no guardado:', e));
            // PASO 2: Crear detalles del pedido (uno por cada item del carrito)
            let detalleErrors = [];
            for (const item of cartItems) {
                try {
                    const detalleBody = {
                        id_pedido: pedidoId,
                        id_producto: item.id,
                        cantidad: item.quantity,
                        precio_unitario: item.price
                    };
                    console.log('[Checkout] Creando detalle:', detalleBody);
                    const detalleResp = await request('detalle_pedido', 'POST', detalleBody);
                    if (detalleResp && detalleResp.error) {
                        console.error(`[Checkout] Error detalle producto ${item.id}:`, detalleResp.error);
                        detalleErrors.push(item.name);
                    }
                } catch (err) {
                    console.error(`[Checkout] Error al crear detalle para producto ${item.id}:`, err);
                    detalleErrors.push(item.name);
                }
            }

            // PASO 3: Decrementar stock de cada producto (best effort)
            let stockErrors = [];
            for (const item of cartItems) {
                try {
                    console.log(`[Checkout] Descontando stock producto ${item.id}: -${item.quantity}`);
                    const stockResp = await request(`productos/${item.id}/stock`, 'PATCH', {
                        cantidad: -item.quantity
                    });
                    if (stockResp && stockResp.error) {
                        console.error(`[Checkout] Error stock producto ${item.id}:`, stockResp.error);
                        stockErrors.push(item.name);
                    }
                } catch (err) {
                    console.error(`[Checkout] Error al decrementar stock del producto ${item.id}:`, err);
                    stockErrors.push(item.name);
                }
            }

            // PASO 4: Vaciar carrito
            state.cart = [];
            state.persist();

            // PASO 5: Mostrar pantalla de éxito (QR usa el ID real del pedido)
            renderSuccess(pedidoId, total);

            // Log de errores parciales
            if (detalleErrors.length > 0) {
                console.warn('[Checkout] No se pudieron registrar detalles para:', detalleErrors);
            }
            if (stockErrors.length > 0) {
                console.warn('[Checkout] No se pudo actualizar stock de:', stockErrors);
            }

        } catch (error) {
            console.error('[Checkout] Error general:', error);
            renderError('Ocurrió un error inesperado. Intenta de nuevo.');
        }
    };

    // Renderizar la pantalla de confirmación
    renderConfirmation();
}