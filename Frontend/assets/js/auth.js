import { state } from './state.js';

export const AuthService = {
    async login(email, password) {
        return new Promise((resolve) => {
            // Simulamos una espera de medio segundo (como si fuera al servidor)
            setTimeout(() => {
                if (!email || !password) {
                    resolve({ success: false, message: 'Por favor, llena todos los campos.' });
                    return;
                }

                // LÓGICA DE ROLES
                if (email === 'admin@nearbuy.com' && password === '123456') {
                    // Es Administrador
                    state.setUser({ email, role: 'admin', name: 'Administrador' }, 'token-admin-123');
                    resolve({ success: true, role: 'admin' });
                } else {
                    // Es un Cliente normal (cualquier otro correo)
                    state.setUser({ email, role: 'client', name: 'Cliente' }, 'token-client-456');
                    resolve({ success: true, role: 'client' });
                }
            }, 500);
        });
    },

    logout() {
        state.logout();
        window.location.hash = '#/login';
    }
};