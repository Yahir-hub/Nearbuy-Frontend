import { Navbar } from '../components/Navbar.js';
import { state } from '../state.js';
import { request } from '../api.js';

// Mapa de estilos para las categorías reales del backend
const categoryStylesMap = {
    'LACTEOS': { color: '#e3f2fd', icon: 'fa-cheese' },
    'ABARROTES': { color: '#fff3e0', icon: 'fa-shopping-basket' },
    'BEBIDAS': { color: '#e0f2f1', icon: 'fa-glass-whiskey' },
    'REFRESCOS': { color: '#e0f2f1', icon: 'fa-glass-whiskey' },
    'COCA COLA': { color: '#ffebee', icon: 'fa-glass-whiskey' },
    'LIMPIEZA': { color: '#f3e5f5', icon: 'fa-soap' },
    'FRUTAS': { color: '#f1f8e9', icon: 'fa-apple-alt' },
    'VERDURA': { color: '#e8f5e9', icon: 'fa-carrot' },
    'VERDURAS': { color: '#e8f5e9', icon: 'fa-carrot' },
    'CARNES': { color: '#ffebee', icon: 'fa-drumstick-bite' },
    'FARMACIA': { color: '#e8eaf6', icon: 'fa-pills' },
    'MASCOTAS': { color: '#fff8e1', icon: 'fa-paw' },
    'BASICOS': { color: '#f5f5f5', icon: 'fa-box' },
    'CIGARROS': { color: '#eceff1', icon: 'fa-smoking' }
};

function CategoryCard(category) {
    const catNameUpper = (category.nombre || category.name || '').toUpperCase().trim();
    
    // Si la categoría tiene estilos predefinidos (como 'TODOS'), úsalos. De lo contrario, busca en el mapa.
    const style = (category.color && category.icon) 
        ? { color: category.color, icon: category.icon } 
        : (categoryStylesMap[catNameUpper] || { color: '#f5f5f5', icon: 'fa-tag' });

    return `
        <div onclick="window.location.hash = '#/store/${category.id}'" style="
            background-color: white;
            border-radius: 20px;
            padding: 30px;
            text-align: center;
            cursor: pointer;
            border: 1px solid #f0e6d2;
            box-shadow: 0 4px 15px rgba(0,0,0,0.03);
            transition: transform 0.2s, box-shadow 0.2s;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
        " onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 10px 25px rgba(0,0,0,0.08)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.03)';">
            <div style="width: 100px; height: 100px; background-color: ${style.color}; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <i class="fas ${style.icon}" style="font-size: 3rem; color: var(--nb-wine);"></i>
            </div>
            <h3 style="margin: 0; color: var(--nb-text); font-size: 1.2rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                ${category.nombre || category.name}
            </h3>
        </div>
    `;
}

export async function renderStore() {
    const app = document.getElementById('app');
    window._nbSearchProducts = null;

    state.subscribe(() => {
        const navWrapper = document.getElementById('nav-wrapper');
        if (navWrapper) navWrapper.innerHTML = Navbar();
    });

    // Renderizado base de la tienda
    app.innerHTML = `
        <style>
            @media (max-width: 768px) {
                .responsive-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)) !important; gap: 15px !important; }
                .store-title { font-size: 2rem !important; }
            }
        </style>
        <div style="width: 100%; min-height: 100vh; display: flex; flex-direction: column; background-color: var(--nb-cream);">
            <div id="nav-wrapper">${Navbar()}</div>
            <main style="flex: 1; max-width: 1200px; margin: 0 auto; width: 100%; padding: 60px 20px; box-sizing: border-box;">
                <div style="text-align: center; margin-bottom: 60px;">
                    <h1 class="store-title" style="color: var(--nb-wine); font-size: 2.8rem; margin: 0; text-transform: uppercase; letter-spacing: 2px; display: inline-block; border-bottom: 4px solid var(--nb-gold); padding-bottom: 10px;">
                        Categorías
                    </h1>
                    <p style="color: var(--nb-text); margin-top: 15px; font-size: 1.1rem; opacity: 0.8;">
                        Explora nuestros pasillos y encuentra lo que necesitas
                    </p>
                </div>
                <div id="categories-grid" class="responsive-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 30px; width: 100%;">
                    <p style="text-align: center; grid-column: 1/-1; color: #999;"><i class="fas fa-spinner fa-spin"></i> Cargando pasillos...</p>
                </div>
            </main>
        </div>
    `;

    // Cargar categorías reales del backend
    let categories = [];
    try {
        const response = await request('categorias');
        categories = response?.items || [];
    } catch (error) {
        console.log('Error al cargar categorías');
    }
    
    state.categories = categories;

    // --- MODIFICACIÓN: Agregar la categoría "TODOS" al principio de la lista --
    const allCategory = { id: 'all', nombre: 'TODOS', color: '#f5f5f5', icon: 'fa-list' }; // Usando icono genérico de lista de FontAwesome
    const displayCategories = [allCategory, ...categories];

    // Renderizar la cuadrícula de categorías
    const grid = document.getElementById('categories-grid');
    if (grid) {
        grid.innerHTML = displayCategories.map(cat => CategoryCard(cat)).join('');
    }
}