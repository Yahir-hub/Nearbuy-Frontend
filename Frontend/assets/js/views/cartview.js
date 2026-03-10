import { Navbar } from '../components/Navbar.js';
import { state } from '../state.js';

export function renderCart() {
    const updateHTML = () => {
        const app = document.getElementById('app');
        const cartItems = state.cart;
        const total = state.getCartTotal();
        const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

        app.innerHTML = `
        <div style="width: 100%; min-height: 100vh; display: flex; flex-direction: column;">
            
            ${Navbar()}

            <main style="
                flex: 1; 
                width: 100%; 
                max-width: 1000px; 
                margin: 0 auto; 
                padding: 2rem 20px;
                display: flex;
                flex-direction: column;
            ">
                
                <div style="display: flex; align-items: center; margin-bottom: 2rem;">
                    <button onclick="window.history.back()" style="
                        background: none; border: none; font-size: 1.5rem; 
                        color: var(--nb-wine); cursor: pointer; display: flex; align-items: center; gap: 10px; font-weight: bold;
                    ">
                        <i class="fas fa-arrow-left"></i> Seguir Comprando
                    </button>
                </div>

                <h2 style="color: var(--nb-wine); font-size: 2rem; margin-bottom: 1.5rem; text-transform: uppercase; letter-spacing: 1px;">
                    Tu Carrito (${state.getCartCount()} productos)
                </h2>

                <div style="display: flex; flex-wrap: wrap; gap: 40px;">
                    
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
                                ${cartItems.map(item => `
                                    <div style="
                                        display: flex; 
                                        align-items: center; 
                                        padding: 20px; 
                                        border-bottom: 1px solid #fcf8f2;
                                        gap: 20px;
                                    ">
                                        <div style="
                                            width: 80px; height: 80px; 
                                            background-image: url('${item.image || ''}'); 
                                            background-color: #fdf3e6;
                                            background-size: cover; background-position: center;
                                            border-radius: 10px; flex-shrink: 0;
                                        "></div>

                                        <div style="flex: 1;">
                                            <h4 style="color: var(--nb-text); font-size: 1.1rem; margin-bottom: 5px;">${item.name}</h4>
                                            <p style="color: var(--nb-wine-light); font-weight: bold;">${money.format(item.price)}</p>
                                        </div>

                                        <div style="display: flex; align-items: center; gap: 10px; background: #fdf3e6; padding: 5px 10px; border-radius: 15px;">
                                            <button onclick="window.updateQty(${item.id}, -1)" style="
                                                width: 25px; height: 25px; background: white; border: 1px solid #eaddc5; border-radius: 50%; color: var(--nb-wine); cursor: pointer;
                                            ">-</button>
                                            <span style="font-weight: bold; width: 20px; text-align: center;">${item.quantity}</span>
                                            <button onclick="window.updateQty(${item.id}, 1)" style="
                                                width: 25px; height: 25px; background: white; border: 1px solid #eaddc5; border-radius: 50%; color: var(--nb-wine); cursor: pointer;
                                            ">+</button>
                                        </div>

                                        <button onclick="window.removeItem(${item.id})" style="
                                            background: none; border: none; color: #e63946; cursor: pointer; font-size: 1.2rem; margin-left: 10px;
                                        ">
                                            <i class="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>

                    <div style="flex: 1; min-width: 280px;">
                        <div style="
                            background: white; 
                            padding: 30px; 
                            border-radius: 20px; 
                            border: 1px solid #f0e6d2;
                            box-shadow: 0 10px 25px rgba(0,0,0,0.05);
                            position: sticky; top: 100px;
                        ">
                            <h3 style="color: var(--nb-wine); border-bottom: 2px dashed #f0e6d2; padding-bottom: 15px; margin-bottom: 20px;">Resumen</h3>
                            
                            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #666;">
                                <span>Subtotal</span>
                                <span>${money.format(total)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; color: #666;">
                                <span>Impuestos (16%)</span>
                                <span>${money.format(total * 0.16)}</span>
                            </div>

                            <div style="display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 1.5rem; color: var(--nb-wine); font-weight: 900;">
                                <span>Total</span>
                                <span>${money.format(total * 1.16)}</span>
                            </div>

                            <button onclick="window.location.hash='#/checkout'" style="
                                width: 100%;
                                background-color: var(--nb-wine);
                                color: white;
                                padding: 15px;
                                border: none;
                                border-radius: 12px;
                                font-size: 1.1rem;
                                font-weight: bold;
                                cursor: pointer;
                                transition: transform 0.2s;
                                box-shadow: 0 5px 15px rgba(74, 29, 31, 0.3);
                            " onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                                Proceder al Pago
                            </button>
                        </div>
                    </div>

                </div>
            </main>
        </div>
        `;
    };

    updateHTML();

    state.subscribe(() => {
        updateHTML();
    });
}