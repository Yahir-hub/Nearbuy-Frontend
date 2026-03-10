import { Navbar } from '../components/Navbar.js';
import { state } from '../state.js';

const categories = [
    { id: 1, name: 'LACTEOS', color: '#e3f2fd', icon: 'fa-cheese' }, 
    { id: 2, name: 'ABARROTES', color: '#fff3e0', icon: 'fa-bread-slice' },
    { id: 3, name: 'BEBIDAS', color: '#e0f2f1', icon: 'fa-wine-bottle' },
    { id: 4, name: 'LIMPIEZA', color: '#f3e5f5', icon: 'fa-soap' },
    { id: 5, name: 'FRUTAS', color: '#f1f8e9', icon: 'fa-apple-alt' },
    { id: 6, name: 'CARNES', color: '#ffebee', icon: 'fa-drumstick-bite' },
    { id: 7, name: 'FARMACIA', color: '#e8eaf6', icon: 'fa-pills' },
    { id: 8, name: 'MASCOTAS', color: '#fff8e1', icon: 'fa-dog' },
    { id: 9, name: 'PANADERIA', color: '#efebe9', icon: 'fa-cookie' },
    { id: 10, name: 'ELECTRONICA', color: '#eceff1', icon: 'fa-tv' },
    { id: 11, name: 'JUGUETES', color: '#fce4ec', icon: 'fa-gamepad' },
    { id: 12, name: 'HOGAR', color: '#e0f7fa', icon: 'fa-chair' }
];

export function renderStore() {
    const app = document.getElementById('app');
    state.subscribe(() => { renderStore(); });

    app.innerHTML = `
        <div style="width: 100%; min-height: 100vh; display: flex; flex-direction: column;">
            
            ${Navbar()}

            <main style="
                flex: 1; 
                display: flex; 
                flex-direction: column; 
                align-items: center;
                width: 100%;
                padding-bottom: 50px;
            ">
                
                <div style="
                    background-color: var(--nb-wine);
                    color: white;
                    padding: 12px 0;
                    width: 60%;
                    max-width: 600px;
                    border-radius: 50px;
                    font-size: 1.5rem;
                    text-transform: uppercase;
                    margin-bottom: 2.5rem;
                    margin-top: 1.5rem;
                    box-shadow: 0 4px 10px rgba(74, 29, 31, 0.4);
                    letter-spacing: 3px;
                    font-weight: bold;
                    text-align: center;
                ">
                    Categorías
                </div>

                <div style="
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 30px;
                    width: 100%;
                    max-width: 1000px;
                    padding: 0 20px; /* Padding interno seguro */
                ">
                    
                    ${categories.map(cat => `
                            <div onclick="window.location.hash = '#/store/${cat.id}'" style="
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            cursor: pointer;
                            transition: transform 0.2s;
                        ">
                            <div class="cat-card-hover" style="
                                width: 100%;
                                max-width: 160px; /* Límite máximo */
                                aspect-ratio: 1/1; /* Siempre cuadrado */
                                background-color: ${cat.color};
                                border-radius: 25px;
                                border: 3px solid #ede0cc;
                                box-shadow: 0 5px 15px rgba(0,0,0,0.05);
                                margin-bottom: 12px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                            ">
                                <i class="fas ${cat.icon}" style="font-size: 3rem; color: var(--nb-wine);"></i>
                            </div>
                            
                            <span style="
                                font-weight: bold;
                                color: var(--nb-text);
                                font-size: 0.9rem;
                                text-transform: uppercase;
                                letter-spacing: 1px;
                                text-align: center;
                            ">${cat.name}</span>
                        </div>
                    `).join('')}

                </div>
            </main>
        </div>
    `;
}