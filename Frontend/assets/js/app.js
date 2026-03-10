import { Router } from './router.js';
import { state } from './state.js';

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    Router.init();
});

// --- PUENTE DE EVENTOS ---
// Hacemos que estas funciones sean visibles para el HTML (onclick)

window.addToCartHandler = (id) => {
    // Necesitamos encontrar el producto completo para agregarlo.
    // Como las vistas a veces no tienen el objeto producto a mano en el onclick,
    // una estrategia robusta es buscarlo en una caché o pasarlo.
    // PERO, para simplificar, asumiremos que la vista que llama a esto tiene acceso a los datos.
    
    // TRUCO: Si estamos en la vista de productos, usamos la caché de esa vista si es posible,
    // o mejor aún, hacemos que el botón pase el objeto.
    // Para no complicar el HTML string con objetos JSON, haremos esto:
    
    console.log("Intentando agregar ID:", id);
    
    // Opción A: Buscar en el estado si tuviéramos una lista global de productos (no la tenemos aún permanente).
    // Opción B (La que usaremos): Pedir los productos de nuevo o usar una variable global temporal.
    
    // Para que funcione YA, vamos a hacer un pequeño fetch rápido o buscar en la caché del componente.
    // MEJOR SOLUCIÓN RÁPIDA:
    // En las vistas (productsView.js), guardamos los productos en una variable global temporal
    // para poder buscarlos aquí.
    
    if (window.currentProducts && window.currentProducts.length > 0) {
        const product = window.currentProducts.find(p => p.id === id);
        if (product) {
            state.addToCart(product);
            // Feedback visual opcional
            // alert('Producto agregado'); 
        }
    } else {
        console.error("No se encuentran los productos cargados en memoria.");
    }
};

window.updateQty = (id, delta) => {
    state.updateQuantity(id, delta);
};

window.removeItem = (id) => {
    state.removeFromCart(id);
};