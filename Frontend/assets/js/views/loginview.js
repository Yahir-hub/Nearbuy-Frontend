import { AuthService } from '../auth.js';

export function renderLogin() {
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <div class="login-wrapper">
            <div class="login-card">
                <h2 class="login-title">¡BIENVENIDO!</h2>
                
                <form id="loginForm">
                    <div class="input-group">
                        <label>Usuario</label>
                        <input type="email" id="email" required placeholder="tu@correo.com">
                    </div>
                    
                    <div class="input-group">
                        <label>Contraseña</label>
                        <input type="password" id="password" required placeholder="******">
                    </div>

                    <div class="login-actions">
                        <button type="submit" id="btn-login" class="btn-gold">
                            Ingresar
                        </button>
                    </div>
                    
                    <p id="error-msg" class="error-msg" style="display:none; color: #ff6b6b; margin-top: 15px;"></p>
                </form>

                <p style="margin-top: 25px; color: #f3dfb0; font-size: 0.9rem;">
                    ¿No tienes cuenta? 
                    <a href="#/register" style="color: white; font-weight: bold; text-decoration: underline; cursor: pointer;">
                        Regístrate aquí
                    </a>
                </p>
            </div>
        </div>
    `;

    // Lógica del evento de envío
    const form = document.getElementById('loginForm');
    const errorMsg = document.getElementById('error-msg');
    const btn = document.getElementById('btn-login');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        btn.innerText = 'Cargando...';
        btn.disabled = true;
        errorMsg.style.display = 'none';

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Llamada al servicio de autenticación
        const result = await AuthService.login(email, password);

        if (result.success) {
            // Redirección basada en el rol (Admin o Cliente)
            if (result.role === 'admin') {
                window.location.hash = '#/admin';
            } else {
                window.location.hash = '#/store';
            }
        } else {
            errorMsg.innerText = result.message;
            errorMsg.style.display = 'block';
            btn.innerText = 'Ingresar';
            btn.disabled = false;
        }
    });
}