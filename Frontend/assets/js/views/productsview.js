import { Navbar } from '../components/Navbar.js';
import { ProductCard } from '../components/productCard.js'; 
import { request } from '../api.js';
import { state } from '../state.js';

export async function renderProducts(categoryId) {
    const app = document.getElementById('app');
    
    // SUSCRIPCIÓN CORREGIDA: Solo actualizamos el interior del contenedor seguro
    state.subscribe(() => { 
        const navWrapper = document.getElementById('nav-wrapper');
        if(navWrapper) {
            navWrapper.innerHTML = Navbar(); 
        }
    });

    // Obtener productos
    let products = [];
    try {
        const response = await request('productos'); 
        // MAPEADO DE CAMPOS: Convertimos los nombres del Backend (Supabase) 
        // a los nombres que espera el componente ProductCard.
        products = response.items.map(p => ({
            id: p.id,
            name: p.nombre,       // De 'nombre' (BD) a 'name' (UI)
            price: p.precio,      // De 'precio' (BD) a 'price' (UI)
            category: p.id_categoria,
            image: p.imagen_url   // De 'imagen_url' (BD) a 'image' (UI)
        }));
        window.currentProducts = products;
    } catch (error) {
        console.error(error);
    }

    // Nombre de la categoría
    const categoryNames = {
        1: 'Lácteos', 2: 'Abarrotes', 3: 'Bebidas', 4: 'Limpieza',
        5: 'Frutas', 6: 'Carnes', 7: 'Farmacia', 8: 'Mascotas',
        9: 'Panadería', 10: 'Electrónica', 11: 'Juguetes', 12: 'Hogar'
    };
    const currentCategoryName = categoryNames[categoryId] || 'Productos';

    app.innerHTML = `
        <div style="width: 100%; min-height: 100vh; display: flex; flex-direction: column;">
            
            <div id="nav-wrapper">
                ${Navbar()}
            </div>

            <main style="
                flex: 1; 
                display: flex; 
                flex-direction: column; 
                align-items: center;
                width: 100%;
                padding-bottom: 50px;
            ">
                
                <div style="
                    width: 90%; 
                    max-width: 1200px; 
                    display: flex; 
                    align-items: center; 
                    margin-top: 2rem; 
                    margin-bottom: 2rem;
                ">
                    <button onclick="window.history.back()" style="
                        background: none; 
                        border: none; 
                        font-size: 1.5rem; 
                        color: var(--nb-wine); 
                        cursor: pointer; 
                        display: flex; 
                        align-items: center; 
                        gap: 10px;
                        font-weight: bold;
                    ">
                        <i class="fas fa-arrow-left"></i> Volver
                    </button>
                    
                    <h2 style="
                        margin-left: auto; 
                        margin-right: auto; 
                        text-transform: uppercase; 
                        color: var(--nb-wine);
                        font-size: 2rem;
                        letter-spacing: 2px;
                    ">${currentCategoryName}</h2>
                    
                    <div style="width: 100px;"></div> </div>

                <div id="products-grid-container" style="
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                    gap: 30px;
                    width: 90%;
                    max-width: 1200px;
                ">
                    ${products.length > 0 
                        ? products.map(p => ProductCard(p)).join('') 
                        : '<p style="text-align:center; width:100%; font-size: 1.2rem; color: #666;">No hay productos en esta categoría aún.</p>'
                    }
                </div>

            </main>
        </div>
    `;
}