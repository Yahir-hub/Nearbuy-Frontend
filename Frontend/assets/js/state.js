/**
 * [MODIFICADO] state.js
 * Manejo del estado global (Usuario + Carrito Web + Carrito POS)
 * 
 * CAMBIOS:
 * - Nuevo: posCart[] para ventas en punto de venta físico (separado del cart web)
 * - Nuevos métodos: addToPOS(), removeFromPOS(), updatePOSQuantity(), getPOSTotal(), getPOSCount(), clearPOS()
 * - persist() ahora incluye posCart
 */

const initialState = {
    user: null,
    isAuthenticated: false,
    token: null,
    cart: [],     // Carrito de la tienda web (pick-up)
    posCart: []   // NUEVO: Carrito del punto de venta físico
};

// Intentar recuperar sesión guardada
const savedSession = localStorage.getItem('nearbuy_session');
const startState = savedSession ? JSON.parse(savedSession) : initialState;

// Asegurar que posCart exista en sesiones antiguas guardadas sin este campo
if (!startState.posCart) {
    startState.posCart = [];
}

// Lista de suscriptores (partes de la app que escuchan cambios)
const listeners = [];

export const state = {
    ...startState,
    
    // --- SUSCRIPCIÓN (Para que la vista se actualice sola) ---
    subscribe(listener) {
        listeners.push(listener);
    },

    clearListeners() {
        listeners.length = 0;
    },

    notify() {
        listeners.forEach(listener => listener(this));
        this.persist();
    },

    // --- USUARIO ---
    setUser(user, token) {
        this.user = user;
        this.token = token;
        this.isAuthenticated = !!user;
        this.notify();
    },

    logout() {
        this.user = null;
        this.token = null;
        this.isAuthenticated = false;
        this.cart = [];
        this.posCart = [];
        localStorage.removeItem('nearbuy_session');
        this.notify();
    },

    // =========================================================
    // CARRITO WEB (TIENDA ONLINE — sin cambios)
    // =========================================================
    addToCart(product) {
        const existingItem = this.cart.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            this.cart.push({ ...product, quantity: 1 });
        }
        console.log("Carrito web actualizado:", this.cart);
        this.notify();
    },

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.notify();
    },

    updateQuantity(productId, change) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                this.removeFromCart(productId);
            } else {
                this.notify();
            }
        }
    },

    getCartCount() {
        return this.cart.reduce((count, item) => count + item.quantity, 0);
    },

    getCartTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    // =========================================================
    // CARRITO POS (PUNTO DE VENTA FÍSICO — NUEVO)
    // =========================================================
    addToPOS(product) {
        const existingItem = this.posCart.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            // Guardamos id, descripción (como name), precio, stock, imagen
            this.posCart.push({
                id: product.id,
                name: product.descripcion || product.nombre || product.name || 'Sin descripción',
                price: product.precio || product.price,
                stock: product.stock,
                image: product.imagen_url || product.image || null,
                quantity: 1
            });
        }
        console.log("Carrito POS actualizado:", this.posCart);
        this.notify();
    },

    removeFromPOS(productId) {
        this.posCart = this.posCart.filter(item => item.id !== productId);
        this.notify();
    },

    updatePOSQuantity(productId, change) {
        const item = this.posCart.find(item => item.id === productId);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                this.removeFromPOS(productId);
            } else {
                this.notify();
            }
        }
    },

    getPOSCount() {
        return this.posCart.reduce((count, item) => count + item.quantity, 0);
    },

    getPOSTotal() {
        return this.posCart.reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    clearPOS() {
        this.posCart = [];
        this.notify();
    },

    // --- PERSISTENCIA ---
    persist() {
        localStorage.setItem('nearbuy_session', JSON.stringify({
            user: this.user,
            token: this.token,
            isAuthenticated: this.isAuthenticated,
            cart: this.cart,
            posCart: this.posCart   // NUEVO: persistir carrito POS
        }));
    }
};