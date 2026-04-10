import { Navbar } from '../components/Navbar.js';
import { ProductCard } from '../components/productCard.js';
import { request, getProductosPorCategoria, getProductos } from '../api.js';
import { state } from '../state.js';

let _currentRenderId = 0;

export async function renderProducts(categoryIdFromUrl) {
    const app = document.getElementById('app');
    const myRenderId = ++_currentRenderId;

    app.innerHTML = `
        <style>
            .products-layout {
                display: flex;
                flex-direction: row;
                max-width: 1300px;
                margin: 0 auto;
                width: 100%;
                padding: 40px 20px;
                box-sizing: border-box;
                gap: 40px;
            }
            .products-sidebar {
                width: 250px;
                background-color: #f9f9f9;
                padding: 30px;
                border-radius: 12px;
                border: 1px solid #f0e6d2;
                flex-shrink: 0;
                align-self: flex-start;
                position: sticky;
                top: 120px;
            }
            .sidebar-categories-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .products-main {
                flex: 1;
                min-width: 0;
            }
            
            /* Magia para Celular */
            @media (max-width: 768px) {
                .products-layout {
                    flex-direction: column;
                    padding: 20px 15px;
                    gap: 20px;
                }
                .products-sidebar {
                    width: 100%;
                    position: static;
                    padding: 15px;
                }
                .sidebar-categories-list {
                    flex-direction: row;
                    overflow-x: auto;
                    padding-bottom: 10px;
                }
                .sidebar-categories-list > div {
                    white-space: nowrap;
                    flex-shrink: 0;
                }
                
                /* AQUÍ ESTÁ LA MODIFICACIÓN: 2 productos por fila en celular */
                .responsive-products-grid {
                    grid-template-columns: repeat(2, 1fr) !important;
                    gap: 15px !important;
                }
                .category-title {
                    font-size: 1.8rem !important;
                }
            }
        </style>

        <div style="width: 100%; min-height: 100vh; display: flex; flex-direction: column; background-color: var(--nb-cream);">
            <div id="nav-wrapper">${Navbar()}</div>
            <div class="products-layout">
                
                <aside id="sidebar-container" class="products-sidebar">
                    <p style="text-align: center; color: #999;"><i class="fas fa-spinner fa-spin"></i></p>
                </aside>

                <main class="products-main">
                    <div style="display: flex; align-items: center; margin-bottom: 30px; border-bottom: 2px solid var(--nb-wine); padding-bottom: 15px;">
                        <h1 id="category-title" class="category-title" style="color: var(--nb-wine); font-size: 2.2rem; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Cargando...</h1>
                    </div>
                    
                    <div id="products-grid-container" class="responsive-products-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 25px; width: 100%;">
                        <p style="text-align: center; grid-column: 1/-1; color: #999;"><i class="fas fa-spinner fa-spin"></i> Cargando productos...</p>
                    </div>
                </main>
            </div>
        </div>
    `;

    let allProducts = [];
    let categories = state.categories || [];
    let currentCategoryName = 'Productos';

    try {
        if (categories.length === 0) {
            const catRes = await request('categorias');
            categories = catRes?.items || [];
            state.categories = categories;
        }

        let response;
        if (categoryIdFromUrl === 'all') {
            response = await getProductos();
            currentCategoryName = 'TODOS';
        } else {
            const catIdNum = parseInt(categoryIdFromUrl);
            response = await getProductosPorCategoria(catIdNum);
            const catObj = categories.find(c => c.id === catIdNum);
            if (catObj) currentCategoryName = catObj.nombre;
        }

        if (myRenderId !== _currentRenderId) return;

        if (response && response.items) {
            allProducts = response.items.filter(p => p.stock > 0).map(p => ({
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
        if (myRenderId !== _currentRenderId) return;
    }

    let currentSearch = '';

    function renderSidebar() {
        const container = document.getElementById('sidebar-container');
        if (!container) return;

        const isAllActive = categoryIdFromUrl === 'all';
        
        const categoryIconMap = {
            'LACTEOS': 'fa-cheese',
            'ABARROTES': 'fa-shopping-basket',
            'BEBIDAS': 'fa-glass-whiskey',
            'REFRESCOS': 'fa-glass-whiskey',
            'COCA COLA': 'fa-glass-whiskey',
            'LIMPIEZA': 'fa-soap',
            'FRUTAS': 'fa-apple-alt',
            'VERDURA': 'fa-carrot',
            'VERDURAS': 'fa-carrot',
            'CARNES': 'fa-drumstick-bite',
            'FARMACIA': 'fa-pills',
            'MASCOTAS': 'fa-paw',
            'BASICOS': 'fa-box',
            'CIGARROS': 'fa-smoking'
        };

        let html = `
            <div style="display: flex; align-items: center; margin-bottom: 20px; gap: 10px;">
                <button onclick="window.location.hash='#/store'" style="
                    background: none; border: none; font-size: 1.2rem; color: var(--nb-wine); 
                    cursor: pointer; display: flex; align-items: center; padding: 0; 
                " title="Volver a la tienda principal">
                    <i class="fas fa-arrow-left"></i>
                </button>
                <h3 style="color: var(--nb-text); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; margin: 0;">Categorías</h3>
            </div>
            <div class="sidebar-categories-list">
                <div onclick="window.location.hash='#/store/all'" style="
                    padding: 12px 15px; border-radius: 8px; cursor: pointer; 
                    display: flex; align-items: center; gap: 12px; font-size: 0.95rem;
                    background-color: ${isAllActive ? 'var(--nb-wine)' : 'transparent'};
                    color: ${isAllActive ? 'white' : 'var(--nb-text)'};
                    font-weight: ${isAllActive ? 'bold' : 'normal'};
                ">
                    <i class="fas fa-th-large" style="width: 20px; text-align: center; font-size: 1rem;"></i> Todas
                </div>
        `;

        categories.forEach(cat => {
            const isActive = String(cat.id) === String(categoryIdFromUrl);
            const catNameUpper = (cat.nombre || '').toUpperCase().trim();
            const icon = categoryIconMap[catNameUpper] || 'fa-tag';

            html += `
                <div onclick="window.location.hash='#/store/${cat.id}'" style="
                    padding: 12px 15px; border-radius: 8px; cursor: pointer; 
                    display: flex; align-items: center; gap: 12px; font-size: 0.95rem;
                    background-color: ${isActive ? 'var(--nb-wine)' : 'transparent'};
                    color: ${isActive ? 'white' : 'var(--nb-text)'};
                    font-weight: ${isActive ? 'bold' : 'normal'};
                ">
                    <i class="fas ${icon}" style="width: 20px; text-align: center; font-size: 1rem;"></i> ${cat.nombre}
                </div>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;
    }

    function renderGrid() {
        const container = document.getElementById('products-grid-container');
        const titleElement = document.getElementById('category-title');
        if (!container) return;

        if (titleElement) titleElement.innerText = currentCategoryName;

        let filtered = allProducts;
        if (currentSearch) {
            filtered = allProducts.filter(p => p.name.toLowerCase().includes(currentSearch));
        }

        container.innerHTML = filtered.length > 0
            ? filtered.map(p => ProductCard(p)).join('')
            : '<div style="text-align: center; padding: 50px; background: white; border-radius: 12px; border: 2px dashed #ccc; grid-column: 1/-1;"><i class="fas fa-box-open" style="font-size: 3rem; color: #ccc; margin-bottom: 15px;"></i><p style="color: #666;">No hay productos disponibles de momento.</p></div>';
    }

    renderSidebar();
    renderGrid();

    window._nbSearchProducts = function(value) {
        currentSearch = (value || '').toLowerCase().trim();
        renderGrid();
        const navInput = document.getElementById('nav-search-input');
        if (navInput && navInput.value !== value) {
            navInput.value = value || '';
        }
    };

    state.subscribe(() => {
        if (myRenderId !== _currentRenderId) return;
        const navWrapper = document.getElementById('nav-wrapper');
        if (navWrapper) {
            navWrapper.innerHTML = Navbar();
            if (currentSearch) {
                const navInput = document.getElementById('nav-search-input');
                if (navInput) navInput.value = currentSearch;
            }
        }
        renderGrid();
    });
}