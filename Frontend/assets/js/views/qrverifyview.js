import { Sidebar } from '../components/Sidebar.js';
import { request } from '../api.js';

export async function renderQRVerify() {
    const app = document.getElementById('app');
    let cajaDiaria = 0;
    
    try {
        const cajaRes = await request('reportes/ventas-diarias');
        cajaDiaria = cajaRes?.total || 0;
    } catch(e) {}

    let scanResult = null; // { pedido, detalles } o { error }
    let scanning = false;
    let stream = null;

    const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

    const estatusColors = {
        pendiente:  { bg: '#fff3e0', color: '#e65100', label: 'Pendiente' },
        preparando: { bg: '#e3f2fd', color: '#1565c0', label: 'Preparando' },
        listo:      { bg: '#e8f5e9', color: '#2e7d32', label: 'Listo' },
        entregado:  { bg: '#c8e6c9', color: '#1b5e20', label: 'Entregado' },
        cancelado:  { bg: '#ffebee', color: '#c62828', label: 'Cancelado' }
    };

    // ========================================
    // Buscar pedido por código QR
    // ========================================
    async function buscarPorQR(codigo) {
        if (!codigo?.trim()) return;
        // Extraer ID del formato NearBuy_Pedido_123
        const match = codigo.trim().match(/NearBuy_Pedido_(\d+)/i);
        const pedidoId = match ? match[1] : codigo.trim();

        try {
            const pedido = await request(`pedidos/${pedidoId}`);
            if (!pedido || pedido.error) {
                scanResult = { error: `No se encontró el pedido con código: ${codigo}` };
                render();
                return;
            }
            const detallesRes = await request(`detalle_pedido/pedido/${pedido.id}`);
            const detalles = detallesRes?.items || [];
            scanResult = { pedido, detalles };
        } catch(e) {
            scanResult = { error: `Error al buscar el pedido: ${e.message}` };
        }
        render();
    }

    // ========================================
    // Cámara / QR Scanner
    // ========================================
    async function startCamera() {
        scanning = true;
        render();
        await new Promise(r => setTimeout(r, 100));

        // Cargar jsQR si no está y esperar
        if (!window.jsQR) {
            await new Promise((resolve, reject) => {
                const s = document.createElement('script');
                s.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
                s.onload = resolve;
                s.onerror = reject;
                document.head.appendChild(s);
            });
        }

        const video = document.getElementById('qr-video');
        if (!video) return;

        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            video.srcObject = stream;
            await video.play();
            scanFrame();
        } catch(e) {
            scanResult = { error: 'No se pudo acceder a la cámara: ' + e.message };
            scanning = false;
            render();
        }
    }

    function stopCamera() {
        if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
        scanning = false;
        render();
    }

    function scanFrame() {
        if (!scanning) return;
        const video = document.getElementById('qr-video');
        const canvas = document.getElementById('qr-canvas');
        if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
            requestAnimationFrame(scanFrame);
            return;
        }
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Usar jsQR si está disponible
        if (window.jsQR) {
            const code = window.jsQR(imageData.data, imageData.width, imageData.height);
            if (code?.data) {
                stopCamera();
                document.getElementById('qr-input').value = code.data;
                buscarPorQR(code.data);
                return;
            }
        }
        requestAnimationFrame(scanFrame);
    }

    // ========================================
    // Render
    // ========================================
    function render() {
        app.innerHTML = `
        <div style="display:flex; min-height:100vh; width:100vw; background:var(--nb-cream);">
            ${Sidebar('verificar', cajaDiaria)}
            <main style="flex:1; padding:2rem; overflow-y:auto; max-width:700px;">
                <h1 style="color:var(--nb-wine); font-size:1.8rem; text-transform:uppercase; letter-spacing:2px; margin-bottom:1.5rem;">
                    <i class="fas fa-qrcode"></i> Verificar Pedido
                </h1>

                <!-- Input manual + botón cámara -->
                <div style="background:white; border-radius:16px; padding:1.5rem; border:1px solid #f0e6d2; margin-bottom:1.5rem; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
                    <p style="color:#666; font-size:0.9rem; margin-bottom:1rem;">
                        Escanea el QR del cliente o ingresa el código manualmente.
                    </p>
                    <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                        <div style="flex:1; min-width:200px; position:relative;">
                            <i class="fas fa-qrcode" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#bbb;"></i>
                            <input id="qr-input" type="text" placeholder="NearBuy_Pedido_123 o ID del pedido..."
                                style="width:100%; padding:12px 12px 12px 38px; border:2px solid var(--nb-wine); border-radius:10px; font-size:1rem; outline:none; box-sizing:border-box;"
                                onkeydown="if(event.key==='Enter') window._nbVerificarQR()">
                        </div>
                        <button onclick="window._nbVerificarQR()" style="
                            padding:12px 20px; background:var(--nb-wine); color:white; border:none;
                            border-radius:10px; font-weight:700; cursor:pointer; font-size:0.9rem; white-space:nowrap;
                        "><i class="fas fa-search"></i> Buscar</button>
                        <button onclick="window._nbToggleCamera()" style="
                            padding:12px 20px; background:${scanning ? '#e63946' : 'white'}; color:${scanning ? 'white' : 'var(--nb-wine)'};
                            border:2px solid ${scanning ? '#e63946' : 'var(--nb-wine)'}; border-radius:10px;
                            font-weight:700; cursor:pointer; font-size:0.9rem; white-space:nowrap;
                        "><i class="fas fa-${scanning ? 'stop' : 'camera'}"></i> ${scanning ? 'Detener' : 'Cámara'}</button>
                    </div>

                    <!-- Video cámara -->
                    ${scanning ? `
                    <div style="margin-top:1rem; position:relative; border-radius:12px; overflow:hidden; border:3px solid var(--nb-wine);">
                        <video id="qr-video" style="width:100%; display:block;" playsinline></video>
                        <canvas id="qr-canvas" style="display:none;"></canvas>
                        <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; pointer-events:none;">
                            <div style="width:200px; height:200px; border:3px solid var(--nb-gold, #f0c040); border-radius:12px; box-shadow:0 0 0 9999px rgba(0,0,0,0.4);"></div>
                        </div>
                        <p style="text-align:center; color:#666; font-size:0.8rem; padding:8px;">Apunta al código QR del cliente</p>
                    </div>
                    ` : ''}
                </div>

                <!-- Resultado -->
                ${scanResult ? renderResultado() : ''}
            </main>
        </div>`;

        // Reiniciar cámara si estaba activa
        if (scanning) {
            setTimeout(() => {
                const video = document.getElementById('qr-video');
                if (video && stream) { video.srcObject = stream; video.play(); }
            }, 50);
        }

      
    }

    function renderResultado() {
        if (scanResult.error) return `
        <div style="background:white; border-radius:16px; padding:1.5rem; border:2px solid #ffebee; text-align:center;">
            <i class="fas fa-exclamation-circle" style="font-size:2.5rem; color:#c62828; margin-bottom:1rem;"></i>
            <p style="color:#c62828; font-weight:bold; font-size:1.1rem;">${scanResult.error}</p>
            <button onclick="window._nbLimpiarVerificacion()" style="margin-top:1rem; padding:10px 24px; background:none; border:2px solid #c62828; color:#c62828; border-radius:50px; cursor:pointer; font-weight:700;">
                Intentar de nuevo
            </button>
        </div>`;

        const { pedido, detalles } = scanResult;
        const estatus = estatusColors[pedido.estatus] || { bg:'#f5f5f5', color:'#666', label: pedido.estatus };
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${pedido.codigo_qr || 'NearBuy_Pedido_' + pedido.id}`;

        return `
        <div style="background:white; border-radius:16px; border:2px solid #e8f5e9; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.06);">
            <!-- Header verde -->
            <div style="background:#e8f5e9; padding:1rem 1.5rem; display:flex; align-items:center; gap:12px;">
                <i class="fas fa-check-circle" style="font-size:1.8rem; color:#2e7d32;"></i>
                <div>
                    <p style="margin:0; font-weight:900; color:#2e7d32; font-size:1.1rem;">Pedido Verificado</p>
                    <p style="margin:0; color:#388e3c; font-size:0.85rem;">El código QR corresponde a un pedido válido</p>
                </div>
            </div>

            <div style="padding:1.5rem;">
                <!-- Info pedido + QR -->
                <div style="display:flex; gap:1.5rem; flex-wrap:wrap; margin-bottom:1.5rem;">
                    <div style="flex:1; min-width:200px;">
                        <h3 style="color:var(--nb-wine); margin:0 0 1rem 0; font-size:1.3rem;">Pedido #${pedido.id}</h3>
                        <div style="display:grid; gap:8px;">
                            <div style="display:flex; justify-content:space-between; font-size:0.9rem;">
                                <span style="color:#888;">Cliente</span>
                                <span style="font-weight:700; color:var(--nb-text);">${pedido.cliente_nombre || 'N/A'}</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; font-size:0.9rem;">
                                <span style="color:#888;">Teléfono</span>
                                <span style="font-weight:700;">${pedido.cliente_telefono || 'N/A'}</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; font-size:0.9rem;">
                                <span style="color:#888;">Total</span>
                                <span style="font-weight:900; color:var(--nb-wine); font-size:1.1rem;">${money.format(pedido.total)}</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.9rem;">
                                <span style="color:#888;">Estatus</span>
                                <span style="background:${estatus.bg}; color:${estatus.color}; padding:4px 12px; border-radius:50px; font-size:0.8rem; font-weight:bold;">${estatus.label}</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; font-size:0.9rem;">
                                <span style="color:#888;">Método</span>
                                <span style="font-weight:600;">${pedido.metodo_pago || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    <div style="display:flex; flex-direction:column; align-items:center; gap:6px;">
                        <img src="${qrUrl}" style="width:120px; height:120px; border:3px solid var(--nb-wine); border-radius:10px; padding:4px;">
                        <span style="font-size:0.72rem; color:#888;">QR del pedido</span>
                    </div>
                </div>

                <!-- Productos -->
                <div style="background:#fdf8f2; border-radius:12px; padding:1rem; border:1px solid #f0e6d2; margin-bottom:1.5rem;">
                    <p style="font-weight:bold; color:var(--nb-wine); margin:0 0 0.8rem 0; font-size:0.9rem;">
                        <i class="fas fa-box-open"></i> Productos (${detalles.length})
                    </p>
                    ${detalles.length === 0
                        ? `<p style="color:#999; font-size:0.85rem;">Sin detalles</p>`
                        : detalles.map(d => `
                        <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #f0e6d2; font-size:0.9rem;">
                            <span style="color:#444;">${d.nombre_producto || 'Producto #' + d.id_producto}</span>
                            <span style="color:#888;">${d.cantidad} x $${Number(d.precio_unitario).toFixed(2)}</span>
                            <span style="font-weight:bold; color:var(--nb-wine);">$${(d.cantidad * d.precio_unitario).toFixed(2)}</span>
                        </div>`).join('')}
                </div>

                <!-- Botones acción -->
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                    <button onclick="window._nbLimpiarVerificacion()" style="
                        flex:1; padding:12px; background:none; border:2px solid #ddd; color:#666;
                        border-radius:50px; font-weight:700; cursor:pointer; font-size:0.9rem;
                    "><i class="fas fa-qrcode"></i> Verificar otro</button>
                    ${pedido.estatus === 'listo' || pedido.estatus === 'pendiente' ? `
                    <button onclick="window._nbEntregarDesdeVerificacion(${pedido.id})" style="
                        flex:2; padding:12px; background:var(--nb-wine); color:white; border:none;
                        border-radius:50px; font-weight:700; cursor:pointer; font-size:0.9rem;
                    "><i class="fas fa-check"></i> Marcar como Entregado</button>
                    ` : ''}
                </div>
            </div>
        </div>`;
    }

    // ========================================
    // Window functions
    // ========================================
    window._nbVerificarQR = function() {
        const val = document.getElementById('qr-input')?.value;
        buscarPorQR(val);
    };

    window._nbToggleCamera = function() {
        if (scanning) stopCamera();
        else startCamera();
    };

    window._nbLimpiarVerificacion = function() {
        scanResult = null;
        if (scanning) stopCamera();
        render();
        setTimeout(() => document.getElementById('qr-input')?.focus(), 100);
    };

    window._nbEntregarDesdeVerificacion = async function(pedidoId) {
        // Cargar empleados
        let empleados = [];
        try {
            const res = await request('perfil?limit=50&offset=0');
            empleados = (res?.items || []).filter(e => e.rol === 'admin' || e.rol === 'empleado');
        } catch(e) {}

        const modalHtml = `
        <div id="modal-entrega-qr" style="
            position:fixed; inset:0; background:rgba(0,0,0,0.5);
            display:flex; align-items:center; justify-content:center; z-index:9999;
        ">
            <div style="background:white; border-radius:20px; padding:2rem; width:380px; max-width:90vw; box-shadow:0 20px 60px rgba(0,0,0,0.2);">
                <h3 style="color:var(--nb-wine); margin:0 0 1.5rem 0; font-size:1.2rem;">
                    <i class="fas fa-check-circle"></i> Confirmar Entrega — Pedido #${pedidoId}
                </h3>
                <div style="margin-bottom:1rem;">
                    <label style="display:block; font-size:0.75rem; font-weight:700; color:var(--nb-wine); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">
                        <i class="fas fa-user-cog"></i> Preparó
                    </label>
                    <select id="qr-modal-preparador" style="width:100%; padding:10px; border:1px solid #f0e6d2; border-radius:10px; font-size:0.9rem; background:#faf7f2; outline:none; box-sizing:border-box;">
                        <option value="">— Sin asignar —</option>
                        ${empleados.map(e => `<option value="${e.id}">${e.nombre_usuario} (${e.rol})</option>`).join('')}
                    </select>
                </div>
                <div style="margin-bottom:1.5rem;">
                    <label style="display:block; font-size:0.75rem; font-weight:700; color:var(--nb-wine); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">
                        <i class="fas fa-user-check"></i> Entregó
                    </label>
                    <select id="qr-modal-entrega" style="width:100%; padding:10px; border:1px solid #f0e6d2; border-radius:10px; font-size:0.9rem; background:#faf7f2; outline:none; box-sizing:border-box;">
                        <option value="">— Sin asignar —</option>
                        ${empleados.map(e => `<option value="${e.id}">${e.nombre_usuario} (${e.rol})</option>`).join('')}
                    </select>
                </div>
                <div style="display:flex; gap:10px;">
                    <button onclick="window._nbConfirmarEntregaQR(${pedidoId})" style="
                        flex:1; background:var(--nb-wine); color:white; border:none;
                        border-radius:50px; padding:12px; font-weight:700; font-size:0.9rem; cursor:pointer;
                    "><i class="fas fa-check"></i> Confirmar</button>
                    <button onclick="document.getElementById('modal-entrega-qr').remove()" style="
                        flex:1; background:none; color:#666; border:2px solid #ddd;
                        border-radius:50px; padding:12px; font-weight:700; font-size:0.9rem; cursor:pointer;
                    ">Cancelar</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    };

    window._nbConfirmarEntregaQR = async function(pedidoId) {
        const preparador = document.getElementById('qr-modal-preparador')?.value || null;
        const entrega = document.getElementById('qr-modal-entrega')?.value || null;
        try {
            await request(`pedidos/${pedidoId}/estatus?estatus=entregado`, 'PATCH');
            await request(`pedidos/${pedidoId}`, 'PUT', {
                id_empleado_preparador: preparador || null,
                id_empleado_entrega: entrega || null
            });
            scanResult.pedido.estatus = 'entregado';
            document.getElementById('modal-entrega-qr')?.remove();
            render();
            window._nbShowToast?.('Pedido entregado correctamente', 'success');
        } catch(e) {
            window._nbShowToast?.('Error al confirmar entrega', 'error');
        }
    };
    render();
}