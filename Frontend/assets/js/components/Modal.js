
/**
 * Modal.js
 * Componente para mostrar alertas y mensajes de error estilizados.
 */
export const Modal = {
    /**
     * Muestra un modal en pantalla.
     * @param {string} title - Título del modal.
     * @param {string} message - Mensaje a mostrar.
     * @param {string} type - Tipo: 'info', 'success', 'error', 'warning'.
     */
    show(title, message, type = 'info') {
        // Eliminar modal anterior si existe
        this.hide();

        const colors = {
            info: '#2196f3',
            success: '#4caf50',
            error: '#f44336',
            warning: '#ff9800'
        };

        const modalHtml = `
            <div id="nb-modal-overlay" style="
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.6); display: flex; align-items: center;
                justify-content: center; z-index: 10000; backdrop-filter: blur(4px);
            ">
                <div style="
                    background: white; padding: 30px; border-radius: 15px;
                    max-width: 400px; width: 90%; text-align: center;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                    border-top: 10px solid ${colors[type] || colors.info};
                ">
                    <h2 style="margin-top: 0; color: #333;">${title}</h2>
                    <p style="color: #666; margin-bottom: 25px; line-height: 1.5;">${message}</p>
                    <button onclick="Modal.hide()" style="
                        background: ${colors[type] || colors.info}; color: white;
                        border: none; padding: 12px 30px; border-radius: 8px;
                        cursor: pointer; font-weight: bold; font-size: 1rem;
                    ">Cerrar</button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Hacer que la función hide sea accesible globalmente para el botón onclick
        window.Modal = this;
    },

    hide() {
        const modal = document.getElementById('nb-modal-overlay');
        if (modal) modal.remove();
    }
};