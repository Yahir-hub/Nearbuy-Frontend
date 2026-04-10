import { state } from '../state.js'; 

export function Navbar() {
    const cartCount = state.getCartCount();

    window.executeSearch = () => {
        const input = document.getElementById('nav-search-input');
        if (!input) return;
        const query = input.value.trim();
        if (!query) return;

        const inProductsView = typeof window._nbSearchProducts === 'function' 
            && window.location.hash.startsWith('#/store/');

        if (inProductsView) {
            window._nbSearchProducts(query);
            return;
        }

        window._nbPendingSearch = query;
        const currentHash = window.location.hash;
        if (currentHash === '#/store/all') {
            if (typeof window._nbRouterReload === 'function') window._nbRouterReload();
        } else {
            window.location.hash = '#/store/all';
        }
    };

    window.handleSearchInput = (e) => {
        if (typeof window._nbSearchProducts === 'function') {
            window._nbSearchProducts(e.target.value);
        }
    };

    window.handleSearchKey = (e) => {
        if (e.key === 'Enter') {
            window.executeSearch();
        }
    };

    return `
        <style>
            .nb-navbar { padding: 0 30px 0 20px; }
            .nb-nav-brand { font-size: 1.5rem; }
            .nb-search-wrapper { max-width: 600px; margin: 0 15px; }
            .nav-label { display: block; font-size: 0.7rem; }
            
            /* MAGIA PARA CELULAR CORREGIDA */
            @media (max-width: 768px) {
                .nb-navbar { padding: 0 15px !important; }
                .nb-nav-brand { font-size: 1.1rem !important; }
                .nb-search-wrapper { margin: 0 8px !important; }
                .nb-search-wrapper input { padding: 8px 12px !important; font-size: 0.85rem !important; }
                .nb-nav-icons { gap: 15px !important; }
                /* Ocultamos SOLO las palabras, respetando la bolita del carrito */
                .nav-label { display: none !important; } 
            }
        </style>
        
        <div style="height: var(--nav-height);"></div>
        <nav class="nb-navbar" style="
            background-color: var(--nb-wine); height: var(--nav-height); width: 100%;
            position: fixed; top: 0; left: 0; z-index: 9999; display: flex; align-items: center; justify-content: space-between;
            box-shadow: 0 4px 6px rgba(0,0,0,0.2); box-sizing: border-box;
        ">
            <div class="nb-nav-brand" onclick="window.location.hash='#/store'" style="cursor: pointer; color: white; font-weight: bold; letter-spacing: 1px; flex-shrink: 0;">
                NEARBUY
            </div>

            <div class="nb-search-wrapper" style="flex: 1; display: flex; justify-content: center;">
                <div style="display: flex; width: 100%;">
                    <input type="text" id="nav-search-input" oninput="window.handleSearchInput(event)" onkeydown="window.handleSearchKey(event)" placeholder="Buscar..." style="width: 100%; padding: 10px 15px; border-radius: 20px 0 0 20px; border: none; outline: none;">
                    <button onclick="window.executeSearch()" style="background-color: var(--nb-gold); border: none; padding: 0 15px; border-radius: 0 20px 20px 0; cursor: pointer; transition: background 0.2s;">
                        <i class="fas fa-search" style="color: var(--nb-wine);"></i>
                    </button>
                </div>
            </div>

            <div class="nb-nav-icons" style="display: flex; gap: 25px; color: white; text-align: center; flex-shrink: 0;">
                <div onclick="window.location.hash = '#/cart'" style="cursor: pointer; position: relative;">
                    <i class="fas fa-shopping-cart" style="font-size: 1.3rem;"></i>
                    <span class="nav-label">carrito</span>
                    ${cartCount > 0 ? `<span style="position: absolute; top: -5px; right: -5px; background: var(--nb-gold); color: var(--nb-wine); font-size: 0.7rem; font-weight: bold; border-radius: 50%; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center;">${cartCount}</span>` : ''}
                </div>
                <div onclick="window.location.hash = '#/profile'" style="cursor: pointer;">
                    <i class="fas fa-user" style="font-size: 1.3rem;"></i>
                    <span class="nav-label">cuenta</span>
                </div>
            </div>
        </nav>
    `;
}