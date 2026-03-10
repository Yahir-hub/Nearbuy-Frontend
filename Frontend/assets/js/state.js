/**
 * state.js
 * Manejo del estado global (Usuario + Carrito)
 */

const initialState = {
    user: null,
    isAuthenticated: false,
    token: null,
    cart: [] // <--- AQUÍ SE GUARDAN LOS PRODUCTOS
};

// Intentar recuperar sesión guardada
const savedSession = localStorage.getItem('nearbuy_session');
const startState = savedSession ? JSON.parse(savedSession) : initialState;

// Lista de suscriptores (partes de la app que escuchan cambios)
const listeners = [];

export const state = {
    ...startState,
    
    // --- SUSCRIPCIÓN (Para que la vista se actualice sola) ---
    subscribe(listener) {
        listeners.push(listener);
    },

    clearListeners() {
        // Borra todos los suscriptores anteriores para evitar "zombis"
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
        localStorage.removeItem('nearbuy_session');
        this.notify();
    },

    // --- CARRITO (LÓGICA) ---
    addToCart(product) {
        // Buscamos si ya existe el producto en el carrito
        const existingItem = this.cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity++; // Si existe, sumamos 1
        } else {
            // Si no, lo agregamos con cantidad 1
            this.cart.push({ ...product, quantity: 1 });
        }
        console.log("Carrito actualizado:", this.cart); // Para depurar
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

    persist() {
        localStorage.setItem('nearbuy_session', JSON.stringify({
            user: this.user,
            token: this.token,
            isAuthenticated: this.isAuthenticated,
            cart: this.cart
        }));
    }
};