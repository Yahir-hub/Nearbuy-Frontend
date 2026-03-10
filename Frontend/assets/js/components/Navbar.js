import { state } from '../state.js';

export function Navbar() {
    const cartCount = state.getCartCount();

    // Función interna para manejar la búsqueda
    window.executeSearch = () => {
        const query = document.getElementById('nav-search-input').value.trim();
        if (query) {
            window.location.hash = `#/search/${encodeURIComponent(query)}`;
        }
    };

    // Manejar el Enter en el input
    window.handleSearchKey = (e) => {
        if (e.key === 'Enter') {
            window.executeSearch();
        }
    };

    return `
        <div style="height: var(--nav-height);"></div>

        <nav style="
            background-color: var(--nb-wine);
            height: var(--nav-height);
            width: 100%;
            position: fixed; 
            top: 0;
            left: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 30px 0 20px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.2);
            box-sizing: border-box;
        ">
            <div onclick="window.location.hash='#/store'" style="cursor: pointer; color: white; font-weight: bold; font-size: 1.5rem; letter-spacing: 1px; flex-shrink: 0;">
                NEARBUY
            </div>

            <div style="flex: 1; display: flex; justify-content: center; max-width: 600px; margin: 0 15px;">
                <div style="display: flex; width: 100%;">
                    <input 
                        type="text" 
                        id="nav-search-input"
                        onkeypress="window.handleSearchKey(event)"
                        placeholder="Buscar productos..." 
                        style="
                            width: 100%;
                            padding: 10px 15px;
                            border-radius: 20px 0 0 20px;
                            border: none;
                            outline: none;
                        "
                    >
                    <button onclick="window.executeSearch()" style="
                        background-color: var(--nb-gold);
                        border: none;
                        padding: 0 20px;
                        border-radius: 0 20px 20px 0;
                        cursor: pointer;
                        transition: background 0.2s;
                    ">
                        <i class="fas fa-search" style="color: var(--nb-wine);"></i>
                    </button>
                </div>
            </div>

            <div style="display: flex; gap: 25px; color: white; text-align: center; flex-shrink: 0;">
                
                <div onclick="window.location.hash = '#/cart'" style="cursor: pointer; position: relative;">
                    <i class="fas fa-shopping-cart" style="font-size: 1.3rem;"></i>
                    <span style="display: block; font-size: 0.7rem;">carrito</span>
                    ${cartCount > 0 ? `
                        <span style="
                            position: absolute; top: -5px; right: -5px;
                            background: var(--nb-gold); color: var(--nb-wine);
                            font-size: 0.7rem; font-weight: bold;
                            border-radius: 50%; width: 16px; height: 16px;
                            display: flex; align-items: center; justify-content: center;
                        ">${cartCount}</span>
                    ` : ''}
                </div>
                
                <div onclick="window.location.hash = '#/profile'" style="cursor: pointer;">
                    <i class="fas fa-user" style="font-size: 1.3rem;"></i>
                    <span style="display: block; font-size: 0.7rem;">cuenta</span>
                </div>

            </div>
        </nav>
    `;
}