import { Navbar } from '../components/Navbar.js';
import { state } from '../state.js';
import { request } from '../api.js';

const hardcodedCategories = [
    { id: 1, name: 'LACTEOS', color: '#e3f2fd', icon: 'fa-cheese' }, 
    { id: 2, name: 'ABARROTES', color: '#fff3e0', icon: 'fa-bread-slice' },
    { id: 3, name: 'BEBIDAS', color: '#e0f2f1', icon: 'fa-wine-bottle' },
    { id: 4, name: 'LIMPIEZA', color: '#f3e5f5', icon: 'fa-soap' },
    { id: 5, name: 'FRUTAS', color: '#f1f8e9', icon: 'fa-apple-alt' },
    { id: 6, name: 'CARNES', color: '#ffebee', icon: 'fa-drumstick-bite' },
    { id: 7, name: 'FARMACIA', color: '#e8eaf6', icon: 'fa-pills' },
    { id: 8, name: 'MASCOTAS', color: '#fff8e1', icon: 'fa-dog' },
    { id: 9, name: 'PANADERIA', color: '#efebe9', icon: 'fa-cookie' },
    { id: 10, name: 'ELECTRONICA', color: '#eceff1', icon: 'fa-tv' },
    { id: 11, name: 'JUGUETES', color: '#fce4ec', icon: 'fa-gamepad' },
    { id: 12, name: 'HOGAR', color: '#e0f7fa', icon: 'fa-chair' }
];

export async function renderStore() {
    const app = document.getElementById('app');

    // FIX: Limpiar la función de búsqueda de productsview
    // para que el Navbar sepa que ya no estamos en esa vista
    window._nbSearchProducts = null;

    // Solo actualizar el Navbar cuando cambia el state
    state.subscribe(() => {
        const navWrapper = document.getElementById('nav-wrapper');
        if (navWrapper) {
            navWrapper.innerHTML = Navbar();
        }
    });

    // Intentar obtener categorías del backend real
    let categories = [];
    try {
        const response = await request('categorias');
        if (response && response.items && response.items.length > 0) {
            categories = response.items.map(cat => {
                const style = hardcodedCategories.find(h => h.id === cat.id) || 
                              hardcodedCategories.find(h => h.name === cat.nombre.toUpperCase()) || 
                              { color: '#e3f2fd', icon: 'fa-tag' };
                
                return {
                    id: cat.id,
                    name: cat.nombre.toUpperCase(),
                    color: style.color,
                    icon: style.icon
                };
            });
        } else {
            categories = hardcodedCategories;
        }
    } catch (error) {
        console.log('Error al cargar categorías, usando locales:', error.message);
        categories = hardcodedCategories;
    }

    const allCategory = { id: 'all', name: 'TODOS', color: '#f5f5f5', icon: 'fa-list' };
    const displayCategories = [allCategory, ...categories];

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
                    background-color: var(--nb-wine);
                    color: white;
                    padding: 12px 0;
                    width: 60%;
                    max-width: 600px;
                    border-radius: 50px;
                    font-size: 1.5rem;
                    text-transform: uppercase;
                    margin-bottom: 2.5rem;
                    margin-top: 1.5rem;
                    box-shadow: 0 4px 10px rgba(74, 29, 31, 0.4);
                    letter-spacing: 3px;
                    font-weight: bold;
                    text-align: center;
                ">
                    Categorías
                </div>

                <div style="
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 30px;
                    width: 100%;
                    max-width: 1000px;
                    padding: 0 20px;
                ">
                    
                    ${displayCategories.map(cat => `
                            <div onclick="window.location.hash = '#/store/${cat.id}'" style="
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            cursor: pointer;
                            transition: transform 0.2s;
                        ">
                            <div class="cat-card-hover" style="
                                width: 100%;
                                max-width: 160px;
                                aspect-ratio: 1/1;
                                background-color: ${cat.color};
                                border-radius: 25px;
                                border: 3px solid #ede0cc;
                                box-shadow: 0 5px 15px rgba(0,0,0,0.05);
                                margin-bottom: 12px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                            ">
                                <i class="fas ${cat.icon}" style="font-size: 3rem; color: var(--nb-wine);"></i>
                            </div>
                            
                            <span style="
                                font-weight: bold;
                                color: var(--nb-text);
                                font-size: 0.9rem;
                                text-transform: uppercase;
                                letter-spacing: 1px;
                                text-align: center;
                            ">${cat.name}</span>
                        </div>
                    `).join('')}

                </div>
            </main>
        </div>
    `;
}