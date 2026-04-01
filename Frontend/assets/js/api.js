/**
 * api.js
 * Wrapper para fetch que maneja errores y mocks.
 */
import { Modal } from './components/Modal.js'; // IMPORTAMOS EL COMPONENTE MODAL

// CONFIGURACIÓN
const API_BASE_URL = 'http://127.0.0.1:8000'; // Puerto común para Flask/FastAPI/Django
const USE_MOCK = false; // <--- CAMBIA A FALSE CUANDO TENGAS EL BACKEND

// SIMULACIÓN DE DATOS (MOCKS)
const mockDB = {
    'login': (data) => {
        // ... (tu login existente)
        if (data.email === 'admin@nearbuy.com' && data.password === '123456') {
             return { 
                success: true, 
                data: { 
                    token: 'mock-jwt-token-123', 
                    user: { id: 1, name: 'Amo Yahir', role: 'admin', email: 'admin@nearbuy.com' } 
                } 
            };
        }
        return { success: false, error: 'Credenciales inválidas' };
    },
    // NUEVO ENDPOINT
    'productos': () => {
        return {
            success: true,
            data: [
                { id: 1, name: 'Coca Cola 600ml', price: 18.00, category: 'Bebidas', image: 'https://via.placeholder.com/150' },
                { id: 2, name: 'Sabritas Sal', price: 15.00, category: 'Snacks', image: 'https://via.placeholder.com/150' },
                { id: 3, name: 'Emperador Chocolate', price: 22.50, category: 'Galletas', image: 'https://via.placeholder.com/150' },
                { id: 4, name: 'Agua Ciel 1L', price: 12.00, category: 'Bebidas', image: 'https://via.placeholder.com/150' },
                { id: 5, name: 'Maruchan', price: 14.00, category: 'Comida', image: 'https://via.placeholder.com/150' },
            ]
        };
    }
};

/**
 * Realiza peticiones HTTP unificadas.
 */
export async function request(endpoint, method = 'GET', body = null) {
    console.log(`[API] ${method} ${endpoint}`, body);

    // MODO MOCK (Para desarrollo sin backend)
    if (USE_MOCK) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const mockResponse = mockDB[endpoint];
                if (mockResponse) {
                    const result = mockResponse(body);
                    result.success ? resolve(result.data) : reject(new Error(result.error));
                } else {
                    reject(new Error(`Endpoint ${endpoint} no simulado`));
                }
            }, 800); // Simula latencia de red
        });
    }

    // MODO REAL (Conexión a Python)
    try {
        const headers = { 'Content-Type': 'application/json' };
        
        // Inyectar Token si existe (Importación dinámica para evitar ciclos)
        const { state } = await import('./state.js');
        if (state.token) headers['Authorization'] = `Bearer ${state.token}`;

        const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const mensaje = errorData.detail || errorData.message || 'Error desconocido en el servidor';
            
            // MOSTRAR MODAL DE ERROR AUTOMÁTICAMENTE
            Modal.show('¡Error!', mensaje, 'error');
            
            throw new Error(mensaje);
        }

        return await response.json();

    } catch (error) {
        console.error('[API Error]:', error);
        
        // Si el error es por conexión (Fetch falló)
        if (error.message === 'Failed to fetch') {
            Modal.show('Sin Conexión', 'No pudimos contactar con el servidor. ¿Está encendido el backend?', 'error');
        }
        
        throw error;
    }
}