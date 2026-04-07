import { Navbar } from '../components/Navbar.js';
import { ProductCard } from '../components/productCard.js';
import { request, getProductosPorCategoria, getProductos } from '../api.js';
import { state } from '../state.js';

// Guard contra ejecuciones concurrentes
let _currentRenderId = 0;

export async function renderProducts(categoryId) {
    const app = document.getElementById('app');
    

    // Cada llamada obtiene un ID único. Si otra llamada inicia antes de que esta termine,
    // esta se descarta al detectar que su ID ya no es el actual.
    const myRenderId = ++_currentRenderId;

    let allProducts = [];
    let currentCategoryName = 'Productos';

    try {
        let response;

        if (categoryId === 'all') {
            response = await getProductos();
            currentCategoryName = 'Todos los Productos';
        } else {
            response = await getProductosPorCategoria(categoryId);

            const catResponse = await request(`categorias/${categoryId}`);
            if (catResponse && catResponse.nombre) {
                currentCategoryName = catResponse.nombre;
            }
        }

        // Si otra llamada a renderProducts ya inició, abortar esta
        if (myRenderId !== _currentRenderId) {
            console.log('[productsview] Render descartado (ID obsoleto)');
            return;
        }

        if (response && response.items) {
            allProducts = response.items
                .filter(p => p.stock > 0)
                .map(p => ({
                    id: p.id,
                    name: p.nombre || p.descripcion || 'Sin nombre',
                    price: p.precio,
                    category: p.id_categoria,
                    image: p.imagen_url,
                    stock: p.stock
                }));
            window.currentProducts = allProducts;
        }
    } catch (error) {
        console.error('Error al cargar productos o categoría:', error);
        // Si fue descartado durante el await, salir
        if (myRenderId !== _currentRenderId) return;
    }

    // Verificar una vez más antes de renderizar el DOM
    if (myRenderId !== _currentRenderId) return;

    // Variable para guardar el texto de búsqueda actual
    let currentSearch = '';

    // Función para renderizar solo el grid
    function renderGrid() {
        const container = document.getElementById('products-grid-container');
        if (!container) return;

        let filtered = allProducts;
        if (currentSearch) {
            filtered = allProducts.filter(p => p.name.toLowerCase().includes(currentSearch));
        }

        container.innerHTML = filtered.length > 0
            ? filtered.map(p => ProductCard(p)).join('')
            : '<p style="text-align:center; width:100%; font-size: 1.2rem; color: #666;">No se encontraron productos.</p>';
    }

    // Función global que el Navbar usa para filtrar en vivo
    window._nbSearchProducts = function(value) {
        currentSearch = (value || '').toLowerCase().trim();
        renderGrid();

        // Sincronizar el input del navbar si existe
        const navInput = document.getElementById('nav-search-input');
        if (navInput && navInput.value !== value) {
            navInput.value = value || '';
        }
    };

    // Suscripción: actualiza navbar + grid cuando cambia el state (carrito)
    state.subscribe(() => {
        // Si este render ya fue reemplazado, no hacer nada
        if (myRenderId !== _currentRenderId) return;

        const navWrapper = document.getElementById('nav-wrapper');
        if (navWrapper) {
            navWrapper.innerHTML = Navbar();
            // Restaurar texto de búsqueda en el input del navbar después de re-render
            if (currentSearch) {
                const navInput = document.getElementById('nav-search-input');
                if (navInput) navInput.value = currentSearch;
            }
        }
        renderGrid();
    });

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
                    
                    <div style="width: 100px;"></div>
                </div>

                <div id="products-grid-container" style="
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                    gap: 30px;
                    width: 90%;
                    max-width: 1200px;
                ">
                    ${
                        allProducts.length > 0
                            ? allProducts.map((p) => ProductCard(p)).join('')
                            : '<p style="text-align:center; width:100%; font-size: 1.2rem; color: #666;">No hay productos disponibles en esta categoría.</p>'
                    }
                </div>

            </main>
        </div>
    `;

    // Si hay una búsqueda pendiente (viene de otra vista via Navbar), aplicarla
    if (window._nbPendingSearch) {
        const pendingQuery = window._nbPendingSearch;
        window._nbPendingSearch = null;
        // Aplicar búsqueda y poner el texto en el input
        window._nbSearchProducts(pendingQuery);
        const navInput = document.getElementById('nav-search-input');
        if (navInput) navInput.value = pendingQuery;
    }
}