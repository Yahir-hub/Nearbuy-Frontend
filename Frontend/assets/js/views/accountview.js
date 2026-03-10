import { Navbar } from '../components/Navbar.js';
import { state } from '../state.js';

export function renderProfile() {
    const app = document.getElementById('app');
    const user = state.user || { name: 'Invitado', email: 'sin correo' };

    app.innerHTML = `
        <div style="min-height: 100vh; background: var(--nb-cream);">
            ${Navbar()}
            <main style="max-width: 800px; margin: 40px auto; padding: 20px;">
                <div style="background: white; border-radius: 20px; padding: 30px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); border: 1px solid #f0e6d2;">
                    <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 30px; border-bottom: 2px solid var(--nb-cream); padding-bottom: 20px;">
                        <div style="width: 80px; height: 80px; background: var(--nb-wine); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem;">
                            ${user.name.charAt(0)}
                        </div>
                        <div>
                            <h2 style="margin: 0; color: var(--nb-wine);">${user.name}</h2>
                            <p style="margin: 0; color: #666;">${user.email}</p>
                        </div>
                    </div>

                    <h3 style="color: var(--nb-wine);">Mi Actividad</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
                        <div style="background: var(--nb-cream); padding: 20px; border-radius: 10px; text-align: center;">
                            <i class="fas fa-shopping-bag" style="color: var(--nb-wine); font-size: 1.5rem;"></i>
                            <p style="margin: 10px 0 0; font-weight: bold;">0 Pedidos</p>
                        </div>
                        <div style="background: var(--nb-cream); padding: 20px; border-radius: 10px; text-align: center;">
                            <i class="fas fa-heart" style="color: var(--nb-wine); font-size: 1.5rem;"></i>
                            <p style="margin: 10px 0 0; font-weight: bold;">0 Favoritos</p>
                        </div>
                    </div>

                    <button onclick="if(confirm('¿Cerrar sesión?')) { import('../auth.js').then(m => m.AuthService.logout()) }" style="
                        margin-top: 40px; width: 100%; padding: 12px; background: #e63946; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold;
                    ">CERRAR SESIÓN</button>
                </div>
            </main>
        </div>
    `;
}