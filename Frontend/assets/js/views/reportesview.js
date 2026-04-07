/**
 * [NUEVO] reportesview.js
 * Vista de reportes para admin/empleado.
 * 
 * Secciones:
 * - Resumen del día (total ventas, número de ventas)
 * - Ventas semanales (tabla con totales por día)
 * - Ventas mensuales (resumen)
 * - Productos más vendidos (top 10)
 */

import { state } from '../state.js';
import { request } from '../api.js';
import { Loader } from '../components/Loader.js';
import { Modal } from '../components/Modal.js';
import { Sidebar } from '../components/Sidebar.js';



let ventasDiarias = null;
let ventasSemanales = null;
let ventasMensuales = null;
let topProductos = [];
let allProducts = [];
let cajaDiaria = 0;

export async function renderReportes() {
    const app = document.getElementById('app');

    Loader.show();
    try {
        const [diaRes, semRes, mesRes, topRes, prodRes] = await Promise.all([
            request('reportes/ventas-diarias'),
            request('reportes/ventas-semanales'),
            request('reportes/ventas-mensuales'),
            request('reportes/productos-mas-vendidos?limit=10'),
            request('productos?limit=500')
        ]);
        ventasDiarias = diaRes || {};
        ventasSemanales = semRes || {};
        ventasMensuales = mesRes || {};
        topProductos = topRes?.productos || [];
        allProducts = prodRes?.items || [];
        cajaDiaria = diaRes?.total || 0;
    } catch (e) {
        console.error('Error cargando reportes:', e);
    }
    Loader.hide();

    renderView();
}


function renderView() {
    const app = document.getElementById('app');
    const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

    const ventasDiaTotal = ventasDiarias?.total || 0;
    const ventasDiaCount = ventasDiarias?.ventas?.length || 0;
    const ventasSemTotal = ventasSemanales?.total || 0;
    const ventasSemCount = ventasSemanales?.ventas?.length || 0;
    const ventasMesTotal = ventasMensuales?.total || 0;
    const ventasMesCount = ventasMensuales?.ventas?.length || 0;

    // Agrupar ventas semanales por día
    const ventasPorDia = {};
    if (ventasSemanales?.ventas) {
        ventasSemanales.ventas.forEach(v => {
            const fecha = v.fecha_creacion ? v.fecha_creacion.split('T')[0] : 'Sin fecha';
            if (!ventasPorDia[fecha]) ventasPorDia[fecha] = { count: 0, total: 0 };
            ventasPorDia[fecha].count++;
            ventasPorDia[fecha].total += v.total || 0;
        });
    }

    const diasOrdenados = Object.keys(ventasPorDia).sort().reverse();

    app.innerHTML = `
        <div style="display: flex; min-height: 100vh; width: 100vw; background-color: var(--nb-cream);">
            
            ${Sidebar('reportes', cajaDiaria)}

            <main style="flex: 1; padding: 2rem; overflow-y: auto;">
                
                <h1 style="color: var(--nb-wine); font-size: 2rem; margin: 0 0 2rem 0;">
                    <i class="fas fa-chart-bar"></i> Reportes de Ventas
                </h1>

                <!-- TARJETAS RESUMEN -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.2rem; margin-bottom: 2rem;">
                    
                    <!-- Ventas del día -->
                    <div style="background: white; border-radius: 12px; padding: 1.5rem; border: 1px solid #f0e6d2; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 1rem;">
                            <div style="width: 45px; height: 45px; border-radius: 10px; background: #e8f5e9; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-calendar-day" style="color: #2e7d32; font-size: 1.2rem;"></i>
                            </div>
                            <div>
                                <div style="font-size: 0.75rem; color: #999; text-transform: uppercase; letter-spacing: 1px;">Ventas Hoy</div>
                                <div style="font-size: 0.8rem; color: #666;">${ventasDiaCount} venta${ventasDiaCount !== 1 ? 's' : ''}</div>
                            </div>
                        </div>
                        <div style="font-size: 1.8rem; font-weight: 900; color: #2e7d32;">${money.format(ventasDiaTotal)}</div>
                    </div>

                    <!-- Ventas de la semana -->
                    <div style="background: white; border-radius: 12px; padding: 1.5rem; border: 1px solid #f0e6d2; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 1rem;">
                            <div style="width: 45px; height: 45px; border-radius: 10px; background: #e3f2fd; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-calendar-week" style="color: #1565c0; font-size: 1.2rem;"></i>
                            </div>
                            <div>
                                <div style="font-size: 0.75rem; color: #999; text-transform: uppercase; letter-spacing: 1px;">Esta Semana</div>
                                <div style="font-size: 0.8rem; color: #666;">${ventasSemCount} venta${ventasSemCount !== 1 ? 's' : ''}</div>
                            </div>
                        </div>
                        <div style="font-size: 1.8rem; font-weight: 900; color: #1565c0;">${money.format(ventasSemTotal)}</div>
                    </div>

                    <!-- Ventas del mes -->
                    <div style="background: white; border-radius: 12px; padding: 1.5rem; border: 1px solid #f0e6d2; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 1rem;">
                            <div style="width: 45px; height: 45px; border-radius: 10px; background: #fff3e0; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-calendar-alt" style="color: #e65100; font-size: 1.2rem;"></i>
                            </div>
                            <div>
                                <div style="font-size: 0.75rem; color: #999; text-transform: uppercase; letter-spacing: 1px;">Este Mes</div>
                                <div style="font-size: 0.8rem; color: #666;">${ventasMesCount} venta${ventasMesCount !== 1 ? 's' : ''}</div>
                            </div>
                        </div>
                        <div style="font-size: 1.8rem; font-weight: 900; color: #e65100;">${money.format(ventasMesTotal)}</div>
                    </div>

                    <!-- Promedio por venta -->
                    <div style="background: white; border-radius: 12px; padding: 1.5rem; border: 1px solid #f0e6d2; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 1rem;">
                            <div style="width: 45px; height: 45px; border-radius: 10px; background: #fce4ec; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-receipt" style="color: var(--nb-wine); font-size: 1.2rem;"></i>
                            </div>
                            <div>
                                <div style="font-size: 0.75rem; color: #999; text-transform: uppercase; letter-spacing: 1px;">Ticket Promedio</div>
                                <div style="font-size: 0.8rem; color: #666;" title="Total del mes ÷ número de ventas completadas/entregadas">del mes · ${ventasMesCount} ventas</div>
                            </div>
                        </div>
                        <div style="font-size: 1.8rem; font-weight: 900; color: var(--nb-wine);">
                            ${ventasMesCount > 0 ? money.format(ventasMesTotal / ventasMesCount) : '$0.00'}
                        </div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                    
                    <!-- VENTAS POR DÍA (SEMANA) -->
                    <div style="background: white; border-radius: 12px; padding: 1.5rem; border: 1px solid #f0e6d2;">
                        <h3 style="color: var(--nb-wine); margin: 0 0 1rem 0; font-size: 1rem;">
                            <i class="fas fa-list"></i> Desglose Semanal
                        </h3>
                        ${diasOrdenados.length === 0 ? `
                            <p style="color: #ccc; text-align: center; padding: 20px;">Sin ventas esta semana</p>
                        ` : `
                            <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                                <thead>
                                    <tr style="border-bottom: 2px solid var(--nb-wine); color: var(--nb-wine); font-size: 0.75rem; text-transform: uppercase;">
                                        <th style="padding: 8px; text-align: left;">Fecha</th>
                                        <th style="padding: 8px; text-align: center;">Ventas</th>
                                        <th style="padding: 8px; text-align: right;">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${diasOrdenados.map(fecha => {
                                        const dia = ventasPorDia[fecha];
                                        const fechaFormateada = new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
                                        return `
                                            <tr style="border-bottom: 1px solid #f5f0e8;">
                                                <td style="padding: 10px 8px; font-weight: 600;">${fechaFormateada}</td>
                                                <td style="padding: 10px 8px; text-align: center; color: #666;">${dia.count}</td>
                                                <td style="padding: 10px 8px; text-align: right; font-weight: bold; color: var(--nb-wine);">${money.format(dia.total)}</td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                                <tfoot>
                                    <tr style="border-top: 2px solid var(--nb-wine);">
                                        <td style="padding: 10px 8px; font-weight: bold; color: var(--nb-wine);">Total</td>
                                        <td style="padding: 10px 8px; text-align: center; font-weight: bold;">${ventasSemCount}</td>
                                        <td style="padding: 10px 8px; text-align: right; font-weight: 900; color: var(--nb-wine); font-size: 1rem;">${money.format(ventasSemTotal)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        `}
                    </div>

                    <!-- TOP PRODUCTOS MÁS VENDIDOS -->
                    <div style="background: white; border-radius: 12px; padding: 1.5rem; border: 1px solid #f0e6d2;">
                        <h3 style="color: var(--nb-wine); margin: 0 0 1rem 0; font-size: 1rem;">
                            <i class="fas fa-trophy"></i> Top 10 Productos Más Vendidos
                        </h3>
                        ${topProductos.length === 0 ? `
                            <p style="color: #ccc; text-align: center; padding: 20px;">Sin datos de ventas</p>
                        ` : `
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                ${topProductos.map((item, i) => {
                                    const prod = allProducts.find(p => p.id === item.id_producto);
                                    const nombre = prod?.descripcion || prod?.nombre || `Producto #${item.id_producto}`;
                                    const maxQty = topProductos[0]?.cantidad_vendida || 1;
                                    const barWidth = Math.max((item.cantidad_vendida / maxQty) * 100, 8);
                                    const medals = ['🥇', '🥈', '🥉'];
                                    const medal = i < 3 ? medals[i] : `<span style="color: #999; font-size: 0.8rem; font-weight: bold;">${i + 1}</span>`;
                                    return `
                                        <div style="display: flex; align-items: center; gap: 10px;">
                                            <div style="width: 28px; text-align: center; font-size: 1.1rem; flex-shrink: 0;">${medal}</div>
                                            <div style="flex: 1; min-width: 0;">
                                                <div style="font-size: 0.8rem; font-weight: 600; color: var(--nb-text); margin-bottom: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                                    ${nombre}
                                                </div>
                                                <div style="height: 8px; background: #f5f0e8; border-radius: 4px; overflow: hidden;">
                                                    <div style="height: 100%; width: ${barWidth}%; background: var(--nb-wine); border-radius: 4px; transition: width 0.5s;"></div>
                                                </div>
                                            </div>
                                            <div style="font-weight: bold; color: var(--nb-wine); font-size: 0.85rem; flex-shrink: 0; min-width: 50px; text-align: right;">
                                                ${item.cantidad_vendida} uds
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        `}
                    </div>
                </div>

                <!-- BARRA VISUAL DE VENTAS DE LA SEMANA -->
                ${diasOrdenados.length > 0 ? `
                    <div style="background: white; border-radius: 12px; padding: 1.5rem; border: 1px solid #f0e6d2; margin-top: 1.5rem;">
                        <h3 style="color: var(--nb-wine); margin: 0 0 1.5rem 0; font-size: 1rem;">
                            <i class="fas fa-chart-bar"></i> Ventas Diarias (Últimos 7 días)
                        </h3>
                        <div style="display: flex; align-items: flex-end; gap: 12px; height: 180px; padding: 0 10px;">
                            ${diasOrdenados.reverse().map(fecha => {
                                const dia = ventasPorDia[fecha];
                                const maxTotal = Math.max(...Object.values(ventasPorDia).map(d => d.total), 1);
                                const barHeight = Math.max((dia.total / maxTotal) * 150, 4);
                                const fechaCorta = new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' });
                                const esHoy = fecha === new Date().toISOString().split('T')[0];
                                return `
                                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px;">
                                        <span style="font-size: 0.7rem; color: var(--nb-wine); font-weight: bold;">${money.format(dia.total)}</span>
                                        <div style="
                                            width: 100%; max-width: 50px; height: ${barHeight}px;
                                            background: ${esHoy ? 'var(--nb-wine)' : 'var(--nb-wine-light)'};
                                            border-radius: 6px 6px 0 0; transition: height 0.5s;
                                            opacity: ${esHoy ? '1' : '0.6'};
                                        "></div>
                                        <span style="font-size: 0.65rem; color: ${esHoy ? 'var(--nb-wine)' : '#999'}; font-weight: ${esHoy ? 'bold' : 'normal'};">${fechaCorta}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}

            </main>
        </div>
    `;
}


