import { AuthService } from '../auth.js'; // IMPORTAMOS EL SERVICIO DE AUTH

export function renderRegister() {
    const app = document.getElementById('app');
    
    app.innerHTML = `
    <div class="login-wrapper">
        <div class="login-card">
            <h2 class="login-title">CREAR CUENTA</h2>
            <p style="color: #f3dfb0; margin-bottom: 20px;">Únete a NearBuy</p>

            <form id="registerForm">
                <div class="input-group">
                    <label>Nombre de Usuario</label>
                    <input type="text" id="regUsername" required placeholder="tu_usuario">
                </div>
                <div class="input-group">
                    <label>Teléfono</label>
                    <input type="tel" id="regPhone" required placeholder="5512345678">
                </div>
                <div class="input-group">
                    <label>Contraseña</label>
                    <input type="password" id="regPassword" required placeholder="******">
                </div>
                
                <div class="login-actions">
                    <button type="submit" id="btn-register" class="btn-gold">Registrarse</button>
                </div>

                <p id="reg-error-msg" class="error-msg" style="display:none; color: #ff6b6b; margin-top: 15px;"></p>
            </form>

            <p style="margin-top: 25px; color: #f3dfb0; font-size: 0.9rem;">
                ¿Ya tienes cuenta? 
                <a href="#/login" style="color: white; font-weight: bold; text-decoration: underline;">Inicia Sesión</a>
            </p>
        </div>
    </div>
    `;

    const form = document.getElementById('registerForm');
    const errorMsg = document.getElementById('reg-error-msg');
    const btn = document.getElementById('btn-register');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        btn.innerText = 'Registrando...';
        btn.disabled = true;
        errorMsg.style.display = 'none';

        const phone = document.getElementById('regPhone').value;
        const password = document.getElementById('regPassword').value;

        // Validaciones locales rápidas antes de enviar al Backend
        if (phone.length < 10 || phone.length > 15) {
            errorMsg.innerText = "El teléfono debe tener entre 10 y 15 dígitos.";
            errorMsg.style.display = 'block';
            btn.innerText = 'Registrarse';
            btn.disabled = false;
            return;
        }

        if (password.length < 6) {
            errorMsg.innerText = "La contraseña debe tener al menos 6 caracteres.";
            errorMsg.style.display = 'block';
            btn.innerText = 'Registrarse';
            btn.disabled = false;
            return;
        }

        // Capturamos los campos del formulario
        const userData = {
            nombre_usuario: document.getElementById('regUsername').value,
            telefono: phone,
            contrasena: password,
            rol: 'cliente' // Rol por defecto al registrarse
        };

        const result = await AuthService.register(userData);

        if (result.success) {
            // El backend ahora devuelve un mensaje de éxito con Supabase Auth
            alert('¡Registro exitoso! Por favor, revisa si recibiste un correo de confirmación (si está activo) o intenta iniciar sesión.');
            window.location.hash = '#/login';
        } else {
            errorMsg.innerText = result.message;
            errorMsg.style.display = 'block';
            btn.innerText = 'Registrarse';
            btn.disabled = false;
        }
    });
}