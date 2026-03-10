export function ProductCard(product) {
    // 1. Formatear precio a moneda MXN
    const priceFormatted = new Intl.NumberFormat('es-MX', { 
        style: 'currency', 
        currency: 'MXN' 
    }).format(product.price);

    // 2. Placeholder de imagen si no hay una real
    // Usamos un color sólido crema si no hay imagen para que se vea limpio
    const imageStyle = product.image 
        ? `background-image: url('${product.image}');` 
        : `background-color: #fdf3e6; display: flex; align-items: center; justify-content: center;`;

    const imageContent = product.image
        ? ''
        : `<i class="fas fa-box-open" style="font-size: 3rem; color: #eaddc5;"></i>`;

    // 3. Retornar HTML con los nuevos colores temáticos
    return `
        <div class="product-card" style="
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0,0,0,0.05);
            border: 1px solid #f0e6d2; /* Borde crema sutil */
            display: flex;
            flex-direction: column;
            height: 100%; /* Para que todas las tarjetas tengan la misma altura */
        ">
            <div style="
                height: 180px;
                width: 100%;
                background-size: cover;
                background-position: center;
                border-bottom: 1px solid #f0e6d2;
                ${imageStyle}
            ">
                ${imageContent}
            </div>

            <div style="padding: 20px; display: flex; flex-direction: column; flex-grow: 1;">
                
                <span style="
                    font-size: 0.75rem;
                    font-weight: 800;
                    color: var(--nb-wine); /* Texto Vino */
                    background-color: #fdf3e6; /* Fondo Crema */
                    border: 1px solid #ede0cc; /* Borde Crema más oscuro */
                    padding: 6px 12px;
                    border-radius: 30px;
                    display: inline-block;
                    margin-bottom: 12px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    align-self: flex-start;
                ">${product.category}</span>

                <h3 style="
                    margin: 0 0 15px 0; 
                    font-size: 1.2rem; 
                    color: var(--nb-text); 
                    flex-grow: 1; /* Empuja el footer hacia abajo */
                    line-height: 1.4;
                ">${product.name}</h3>

                <div style="
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    margin-top: auto; /* Se pega al fondo */
                ">
                    <span style="
                        font-weight: 900; 
                        color: var(--nb-wine); 
                        font-size: 1.4rem;
                    ">${priceFormatted}</span>

                    <button 
                        onclick="window.addToCartHandler(${product.id})"
                        onmouseover="this.style.backgroundColor='var(--nb-wine-light)'; this.style.transform='scale(1.1)';"
                        onmouseout="this.style.backgroundColor='var(--nb-wine)'; this.style.transform='scale(1)';"
                        style="
                            background-color: var(--nb-wine); /* Fondo Vino */
                            color: var(--nb-white); /* Icono Blanco */
                            border: none;
                            width: 45px;
                            height: 45px;
                            border-radius: 50%; /* Círculo perfecto */
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 1.2rem;
                            box-shadow: 0 4px 10px rgba(74, 29, 31, 0.3); /* Sombra vino */
                            transition: all 0.2s ease;
                    ">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}