import { AuthService } from '../auth.js'; 

window.closeAuthModal = () => {
    const modal = document.getElementById('auth-modal-overlay');
    if (modal) modal.remove();
};

window.showAuthModal = (type = 'login') => {
    window.closeAuthModal();

    const isLogin = type === 'login';

    const modal = document.createElement('div');
    modal.id = 'auth-modal-overlay';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0,0,0,0.6); z-index: 10000;
        display: flex; align-items: center; justify-content: center;
        backdrop-filter: blur(4px); padding: 15px; box-sizing: border-box;
    `;

    modal.innerHTML = `
        <div style="background-color: #2a0a0c; padding: 30px; border-radius: 30px; position: relative; width: 100%; max-width: 400px; color: white; box-shadow: 0 10px 30px rgba(0,0,0,0.5); text-align: center; max-height: 90vh; overflow-y: auto;">
            <button onclick="window.closeAuthModal()" style="position: absolute; top: 15px; right: 20px; background: none; border: none; color: white; font-size: 2rem; cursor: pointer;">&times;</button>
            
            <h2 style="margin-bottom: 20px; font-size: 1.5rem; letter-spacing: 1px; font-weight: bold; text-transform: uppercase;">
                ${isLogin ? '¡BIENVENIDO!' : 'CREAR CUENTA'}
            </h2>
            
            <form id="modalAuthForm" style="display: flex; flex-direction: column; gap: 12px; text-align: left;">
                <div>
                    <label style="display: block; margin-bottom: 5px; font-size: 1rem;">Usuario</label>
                    <input type="text" id="modalUsername" required placeholder="tu_usuario" style="width: 100%; padding: 10px 15px; border-radius: 10px; border: none; outline: none; background: #f3dfb0; color: #333; box-sizing: border-box; font-size: 1rem;">
                </div>
                
                ${!isLogin ? `
                <div>
                    <label style="display: block; margin-bottom: 5px; font-size: 1rem;">Teléfono</label>
                    <input type="tel" id="modalPhone" required placeholder="5512345678" style="width: 100%; padding: 10px 15px; border-radius: 10px; border: none; outline: none; background: #f3dfb0; color: #333; box-sizing: border-box; font-size: 1rem;">
                </div>
                ` : ''}

                <div>
                    <label style="display: block; margin-bottom: 5px; font-size: 1rem;">Contraseña</label>
                    <input type="password" id="modalPassword" required placeholder="******" style="width: 100%; padding: 10px 15px; border-radius: 10px; border: none; outline: none; background: #f3dfb0; color: #333; box-sizing: border-box; font-size: 1rem;">
                </div>
                
                <p id="modal-error-msg" style="display:none; color: #ff6b6b; margin: 0; font-size: 0.9rem; text-align: center;"></p>
                
                <button type="submit" id="modal-btn-submit" style="background: #f3dfb0; color: black; font-weight: bold; padding: 12px; border: none; border-radius: 10px; cursor: pointer; margin-top: 10px; font-size: 1.1rem; text-decoration: underline;">
                    ${isLogin ? 'Ingresar' : 'Registrarse'}
                </button>
            </form>
            
            <p style="margin-top: 20px; color: #f3dfb0; font-size: 0.9rem; text-align: center;">
                ${isLogin 
                    ? `¿No tienes cuenta? <a href="#" onclick="event.preventDefault(); window.showAuthModal('register')" style="color: white; font-weight: bold; text-decoration: underline;">Regístrate aquí</a>`
                    : `¿Ya tienes cuenta? <a href="#" onclick="event.preventDefault(); window.showAuthModal('login')" style="color: white; font-weight: bold; text-decoration: underline;">Inicia Sesión</a>`
                }
            </p>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('modalAuthForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('modal-btn-submit');
        const errorMsg = document.getElementById('modal-error-msg');
        
        btn.innerText = 'Cargando...';
        btn.disabled = true;
        errorMsg.style.display = 'none';
        
        const username = document.getElementById('modalUsername').value;
        const pass = document.getElementById('modalPassword').value;
        
        try {
            if (isLogin) {
                const result = await AuthService.login(username, pass);
                if (result.success) {
                    window.closeAuthModal();
                    if (result.role === 'admin' || result.role === 'empleado') {
                        window.location.hash = '#/pos';
                    } else {
                        const currentHash = window.location.hash;
                        window.location.hash = ''; 
                        setTimeout(() => window.location.hash = currentHash || '#/store', 10);
                    }
                } else {
                    // --- CORRECCIÓN: Limpiar mensajes técnicos ---
                    let displayMsg = result.message || "Usuario o contraseña incorrectos";
                    if (displayMsg.includes('undefined') || displayMsg.includes('rol')) {
                        displayMsg = "Esta cuenta está corrupta o fue eliminada. Por favor crea una nueva.";
                    }
                    errorMsg.innerText = displayMsg;
                    errorMsg.style.display = 'block';
                    btn.innerText = 'Ingresar';
                    btn.disabled = false;
                }
            } else {
                const phone = document.getElementById('modalPhone').value;
                if (phone.length < 10) {
                    errorMsg.innerText = "El teléfono debe tener al menos 10 números.";
                    errorMsg.style.display = 'block';
                    btn.innerText = 'Registrarse';
                    btn.disabled = false;
                    return;
                }

                const userData = { nombre_usuario: username, telefono: phone, contrasena: pass, rol: 'cliente' };
                const result = await AuthService.register(userData);
                
                if (result.success) {
                    alert('¡Registro exitoso! Ahora por favor inicia sesión con tu nueva cuenta.');
                    window.showAuthModal('login');
                } else {
                    errorMsg.innerText = result.message || "Error al registrarse. El usuario podría ya existir.";
                    errorMsg.style.display = 'block';
                    btn.innerText = 'Registrarse';
                    btn.disabled = false;
                }
            }
        } catch (error) {
            errorMsg.innerText = "Error de conexión. Inténtalo de nuevo.";
            errorMsg.style.display = 'block';
            btn.innerText = isLogin ? 'Ingresar' : 'Registrarse';
            btn.disabled = false;
        }
    });
};