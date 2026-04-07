import { state } from '../state.js';

export function ProductCard(product) {
    const priceFormatted = new Intl.NumberFormat('es-MX', { 
        style: 'currency', 
        currency: 'MXN' 
    }).format(product.price);

    // Calcular stock disponible (stock real - cantidad en carrito)
    const enCarrito = state.cart.find(item => item.id === product.id);
    const cantidadEnCarrito = enCarrito ? enCarrito.quantity : 0;
    const stockDisponible = (product.stock || 0) - cantidadEnCarrito;
    const sinStock = stockDisponible <= 0;

    // Imagen o placeholder
    const imageStyle = product.image 
        ? `background-image: url('${product.image}');` 
        : `background-color: #fdf3e6; display: flex; align-items: center; justify-content: center;`;

    const imageContent = product.image
        ? ''
        : `<i class="fas fa-box-open" style="font-size: 3rem; color: #eaddc5;"></i>`;

    return `
        <div class="product-card" style="
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0,0,0,0.05);
            border: 1px solid #f0e6d2;
            display: flex;
            flex-direction: column;
            height: 100%;
        ">
            <div style="
                height: 180px;
                width: 100%;
                background-size: cover;
                background-position: center;
                border-bottom: 1px solid #f0e6d2;
                position: relative;
                ${imageStyle}
            ">
                ${imageContent}
                ${cantidadEnCarrito > 0 ? `
                    <div style="
                        position: absolute;
                        top: 10px;
                        right: 10px;
                        background: var(--nb-wine);
                        color: white;
                        width: 28px;
                        height: 28px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 0.8rem;
                        font-weight: bold;
                        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                    ">${cantidadEnCarrito}</div>
                ` : ''}
            </div>

            <div style="padding: 20px; display: flex; flex-direction: column; flex-grow: 1;">
                
                <!-- Indicador de stock -->
                <span style="
                    font-size: 0.7rem;
                    font-weight: 700;
                    color: ${sinStock ? '#c62828' : stockDisponible <= 3 ? '#e65100' : '#2e7d32'};
                    background: ${sinStock ? '#ffebee' : stockDisponible <= 3 ? '#fff3e0' : '#e8f5e9'};
                    padding: 4px 10px;
                    border-radius: 20px;
                    display: inline-block;
                    margin-bottom: 10px;
                    align-self: flex-start;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                ">${sinStock ? 'En tu carrito' : stockDisponible <= 3 ? `Quedan ${stockDisponible}` : `Disp: ${stockDisponible}`}</span>

                <h3 style="
                    margin: 0 0 15px 0; 
                    font-size: 1.2rem; 
                    color: var(--nb-text); 
                    flex-grow: 1;
                    line-height: 1.4;
                ">${product.name}</h3>

                <div style="
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    margin-top: auto;
                ">
                    <span style="
                        font-weight: 900; 
                        color: var(--nb-wine); 
                        font-size: 1.4rem;
                    ">${priceFormatted}</span>

                    <button 
                        onclick="${sinStock ? '' : `window.addToCartHandler(${product.id})`}"
                        ${sinStock ? 'disabled' : ''}
                        onmouseover="${sinStock ? '' : "this.style.backgroundColor='var(--nb-wine-light)'; this.style.transform='scale(1.1)';"}"
                        onmouseout="${sinStock ? '' : "this.style.backgroundColor='var(--nb-wine)'; this.style.transform='scale(1)';"}"
                        style="
                            background-color: ${sinStock ? '#ccc' : 'var(--nb-wine)'};
                            color: var(--nb-white, white);
                            border: none;
                            width: 45px;
                            height: 45px;
                            border-radius: 50%;
                            cursor: ${sinStock ? 'not-allowed' : 'pointer'};
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 1.2rem;
                            box-shadow: ${sinStock ? 'none' : '0 4px 10px rgba(74, 29, 31, 0.3)'};
                            transition: all 0.2s ease;
                    ">
                        <i class="fas ${sinStock ? 'fa-check' : 'fa-plus'}"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}