import { Navbar } from '../components/Navbar.js';
import { state } from '../state.js';

export function renderCheckout() {
    const app = document.getElementById('app');
    
    // 1. Guardamos el total ANTES de vaciar el carrito
    const totalPagado = state.getCartTotal() * 1.16; // Total con IVA
    const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

    // Generamos un "ID de pedido" aleatorio para el QR
    const orderId = Math.floor(Math.random() * 1000000); 
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=NearBuy_Pedido_${orderId}`;

    // 2. Vaciamos el carrito manualmente
    if (state.cart.length > 0) {
        state.cart = [];
        state.persist();
    }

    // 3. Renderizamos la pantalla de éxito con QR
    app.innerHTML = `
        <div style="width: 100%; min-height: 100vh; display: flex; flex-direction: column; background-color: var(--nb-cream);">
            
            ${Navbar()}

            <main style="
                flex: 1; 
                display: flex; 
                align-items: center; 
                justify-content: center;
                padding: 2rem;
            ">
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
                    
                    <h2 style="color: var(--nb-wine); font-size: 2rem; margin-bottom: 1.5rem; text-transform: uppercase;">
                        ¡Pago Exitoso!
                    </h2>

                    <p style="color: #666; font-size: 1.1rem; margin-bottom: 2rem;">
                        Tu pedido ha sido procesado correctamente. <br>
                        Muestra este código al recoger tu pedido.
                    </p>

                    <div style="
                        width: 200px; 
                        height: 200px; 
                        margin: 0 auto 1.5rem auto;
                        padding: 10px;
                        background: white;
                        border: 4px solid var(--nb-wine-light, #a03b41); /* Borde estilo tu imagen */
                        border-radius: 15px;
                        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                    ">
                        <img src="${qrUrl}" alt="Código QR de Pedido" style="width: 100%; height: 100%; object-fit: contain; border-radius: 5px;">
                    </div>

                    <div style="
                        background-color: var(--nb-wine);
                        color: white;
                        padding: 10px 30px;
                        border-radius: 50px;
                        display: inline-block;
                        font-size: 1.3rem;
                        font-weight: bold;
                        margin-bottom: 2.5rem;
                        box-shadow: 0 4px 10px rgba(74, 29, 31, 0.3);
                        letter-spacing: 1px;
                    ">
                        A PAGAR: ${money.format(totalPagado)}
                    </div>

                    <br>

                    <button onclick="window.location.hash='#/store'" style="
                        background-color: var(--nb-wine);
                        color: white;
                        padding: 15px 40px;
                        border: none;
                        border-radius: 50px;
                        font-size: 1.1rem;
                        font-weight: bold;
                        cursor: pointer;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        transition: transform 0.2s;
                        width: 100%;
                    " onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                        Volver a la Tienda
                    </button>
                </div>
            </main>
        </div>
    `;
}