export function renderRegister() {
    const app = document.getElementById('app');
    
    app.innerHTML = `
    <div class="login-wrapper">
        <div class="login-card">
            <h2 class="login-title">CREAR CUENTA</h2>
            <p style="color: #f3dfb0; margin-bottom: 20px;">Únete a NearBuy</p>

            <form id="registerForm">
                <div class="input-group">
                    <label>Nombre Completo</label>
                    <input type="text" id="regName" required placeholder="Ej. Yahir Prz">
                </div>
                <div class="input-group">
                    <label>Correo Electrónico</label>
                    <input type="email" id="regEmail" required placeholder="tu@correo.com">
                </div>
                <div class="input-group">
                    <label>Contraseña</label>
                    <input type="password" id="regPassword" required placeholder="******">
                </div>
                
                <div class="login-actions">
                    <button type="submit" class="btn-gold">Registrarse</button>
                </div>
            </form>

            <p style="margin-top: 25px; color: #f3dfb0; font-size: 0.9rem;">
                ¿Ya tienes cuenta? 
                <a href="#/login" style="color: white; font-weight: bold; text-decoration: underline;">Inicia Sesión</a>
            </p>
        </div>
    </div>
    `;

    document.getElementById('registerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        alert('¡Cuenta creada! Ahora puedes iniciar sesión.');
        window.location.hash = '#/login';
    });
}