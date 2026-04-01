import { state } from './state.js';
import { request } from './api.js';

export const AuthService = {
    async login(nombre_usuario, contrasena) {
        try {
            const response = await request('auth/login', 'POST', { nombre_usuario, contrasena });
            // FastAPI devuelve: { access_token, token_type, perfil }
            const { access_token, perfil } = response;
            state.setUser(perfil, access_token);
            return { success: true, role: perfil.rol || 'client' }; // Asumiendo que perfil tiene rol
        } catch (error) {
            return { success: false, message: error.message || 'Error en login' };
        }
    },

    async register(userData) {
        try {
            // Llamada al nuevo endpoint de registro en el backend
            await request('auth/register', 'POST', userData);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message || 'Error en registro' };
        }
    },

    logout() {
        state.logout();
        window.location.hash = '#/login';
    }
};