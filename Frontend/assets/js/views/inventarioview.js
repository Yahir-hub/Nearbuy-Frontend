import { state } from '../state.js';
import { request } from '../api.js';
import { Loader } from '../components/Loader.js';
import { Modal } from '../components/Modal.js';
import { Sidebar } from '../components/Sidebar.js';

// Variables de módulo para el estado local de la vista 
let allProducts = [];
let allCategories = [];
let filteredProducts = [];
let searchQuery = '';
let filterCategoryId = null;
let editingProduct = null;     // null = crear nuevo, objeto = editar existente
let showProductModal = false;
let showCategorySection = false;
let editingCategory = null;
let cajaDiaria = 0;

export async function renderInventario() {
    const app = document.getElementById('app');

    // Resetear estado local
    searchQuery = '';
    filterCategoryId = null;
    editingProduct = null;
    showProductModal = false;
    showCategorySection = false;
    editingCategory = null;

    Loader.show();
    try {
        // Cargar datos en paralelo
        const [prodRes, catRes, cajaRes] = await Promise.all([
            request('productos?limit=500'),
            request('categorias?limit=100'),
            request('reportes/ventas-diarias') 
        ]);
        allProducts = prodRes?.items || [];
        allCategories = catRes?.items || [];
        // CORRECCIÓN 1: Iniciar mostrando todos los productos en lugar de un arreglo vacío
        filteredProducts = [...allProducts];
        cajaDiaria = cajaRes?.total || 0;
    } catch (e) {
        console.error('Error cargando inventario:', e);
    }
    Loader.hide();

    renderView();

    // Suscripción para re-render en cambios de estado
    state.subscribe(() => {
        const navWrapper = document.getElementById('inv-nav-active');
        if (navWrapper) renderView();
    });
}

function renderView() {
    const app = document.getElementById('app');
    const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

    app.innerHTML = `
        <div style="display: flex; min-height: 100vh; width: 100vw; background-color: var(--nb-cream);">
            
            ${Sidebar('inventario', cajaDiaria)}

            <main style="flex: 1; padding: 2rem; overflow-y: auto;">
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h1 style="color: var(--nb-wine); font-size: 2rem; margin: 0;">
                        <i class="fas fa-boxes"></i> Gestión de Inventario
                    </h1>
                    <div style="display: flex; gap: 10px;">
                        <button id="btn-toggle-categories" style="
                            padding: 10px 20px; background: white; color: var(--nb-wine);
                            border: 2px solid var(--nb-wine); border-radius: 8px; cursor: pointer;
                            font-weight: bold; font-size: 0.9rem;
                        ">
                            <i class="fas fa-tags"></i> ${showCategorySection ? 'Ocultar' : 'Gestionar'} Categorías
                        </button>
                        <button id="btn-new-product" style="
                            padding: 10px 20px; background: var(--nb-wine); color: white;
                            border: none; border-radius: 8px; cursor: pointer;
                            font-weight: bold; font-size: 0.9rem;
                            box-shadow: 0 3px 8px rgba(74,29,31,0.3);
                        ">
                            <i class="fas fa-plus"></i> Nuevo Producto
                        </button>
                    </div>
                </div>

                ${showCategorySection ? renderCategorySection() : ''}

                <div style="display: flex; gap: 15px; margin-bottom: 1.5rem; flex-wrap: wrap; align-items: center;">
                    <input type="text" id="inv-search" placeholder="Buscar por descripción o código..." value="${searchQuery}" style="
                        flex: 1; min-width: 250px; padding: 10px 15px; border: 1px solid #ddd;
                        border-radius: 8px; font-size: 0.95rem; outline: none;
                    ">
                    <select id="inv-filter-cat" style="
                        padding: 10px 15px; border: 1px solid #ddd; border-radius: 8px;
                        font-size: 0.95rem; min-width: 180px; outline: none;
                    ">
                        <option value="">Todas las categorías</option>
                        ${allCategories.map(c => `
                            <option value="${c.id}" ${filterCategoryId == c.id ? 'selected' : ''}>${c.nombre}</option>
                        `).join('')}
                    </select>
                    <span style="color: #999; font-size: 0.85rem;">${filteredProducts.length} productos</span>
                </div>

                <div style="background: white; border-radius: 12px; overflow: hidden; border: 1px solid #f0e6d2; box-shadow: 0 3px 10px rgba(0,0,0,0.04);">
                    <table style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead>
                            <tr style="border-bottom: 2px solid var(--nb-wine); color: var(--nb-wine); font-size: 0.85rem; text-transform: uppercase;">
                                <th style="padding: 14px 16px;">Descripción</th>
                                <th style="padding: 14px 16px;">Código</th>
                                <th style="padding: 14px 16px;">Categoría</th>
                                <th style="padding: 14px 16px; text-align: center;">Stock</th>
                                <th style="padding: 14px 16px; text-align: right;">Precio</th>
                                <th style="padding: 14px 16px; text-align: center;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredProducts.length === 0 ? `
                                <tr><td colspan="6" style="padding: 40px; text-align: center; color: #ccc;">
                                    <i class="fas fa-filter" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                                    No se encontraron productos
                                </td></tr>
                            ` : filteredProducts.map(p => {
                                const cat = allCategories.find(c => c.id === p.id_categoria);
                                const stockColor = p.stock <= 5 ? '#e63946' : p.stock <= 15 ? '#ff9800' : '#4caf50';
                                return `
                                    <tr style="border-bottom: 1px solid #f5f0e8; transition: background 0.2s;" 
                                        onmouseover="this.style.background='#fdf8f0'" onmouseout="this.style.background='white'">
                                        <td style="padding: 12px 16px;">
                                            <div style="display: flex; align-items: center; gap: 10px;">
                                                <div style="width: 40px; height: 40px; border-radius: 8px; background: ${p.imagen_url ? `url('${p.imagen_url}') center/cover` : '#fdf3e6'}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                                    ${!p.imagen_url ? '<i class="fas fa-box-open" style="color: #ddd; font-size: 0.9rem;"></i>' : ''}
                                                </div>
                                                <span style="font-weight: 600; color: var(--nb-text);">${p.descripcion || 'Sin descripción'}</span>
                                            </div>
                                        </td>
                                        <td style="padding: 12px 16px; color: #999; font-size: 0.85rem;">${p.codigo || '—'}</td>
                                        <td style="padding: 12px 16px;">
                                            <span style="background: #fdf3e6; color: var(--nb-wine); padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: 600;">
                                                ${cat ? cat.nombre : 'Sin categoría'}
                                            </span>
                                        </td>
                                        <td style="padding: 12px 16px; text-align: center;">
                                            <span style="color: ${stockColor}; font-weight: bold;">${p.stock}</span>
                                        </td>
                                        <td style="padding: 12px 16px; text-align: right; font-weight: bold; color: var(--nb-wine);">
                                            ${money.format(p.precio)}
                                        </td>
                                        <td style="padding: 12px 16px; text-align: center;">
                                            <button class="btn-edit-prod" data-id="${p.id}" style="
                                                background: none; border: 1px solid var(--nb-gold); color: var(--nb-gold);
                                                padding: 6px 12px; border-radius: 6px; cursor: pointer; margin-right: 5px; font-size: 0.8rem;
                                            "><i class="fas fa-edit"></i></button>
                                            <button class="btn-delete-prod" data-id="${p.id}" data-name="${p.descripcion || p.nombre || 'producto'}" style="
                                                background: none; border: 1px solid #e63946; color: #e63946;
                                                padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.8rem;
                                            "><i class="fas fa-trash"></i></button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>

        ${showProductModal ? renderProductModal() : ''}
    `;

    bindEvents();
}

function renderCategorySection() {
    return `
        <div style="background: white; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; border: 1px solid #f0e6d2;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="color: var(--nb-wine); margin: 0;"><i class="fas fa-tags"></i> Categorías</h3>
                <button id="btn-new-category" style="
                    padding: 8px 15px; background: var(--nb-wine); color: white;
                    border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem;
                "><i class="fas fa-plus"></i> Nueva Categoría</button>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                ${allCategories.map(c => `
                    <div style="display: flex; align-items: center; gap: 8px; background: #fdf3e6; padding: 8px 14px; border-radius: 20px; border: 1px solid #ede0cc;">
                        <span style="font-weight: 600; color: var(--nb-wine); font-size: 0.9rem;">${c.nombre}</span>
                        <button class="btn-edit-cat" data-id="${c.id}" data-nombre="${c.nombre}" data-desc="${c.descripcion || ''}" style="
                            background: none; border: none; color: var(--nb-gold); cursor: pointer; font-size: 0.8rem;
                        "><i class="fas fa-edit"></i></button>
                        <button class="btn-delete-cat" data-id="${c.id}" data-nombre="${c.nombre}" style="
                            background: none; border: none; color: #e63946; cursor: pointer; font-size: 0.8rem;
                        "><i class="fas fa-trash"></i></button>
                    </div>
                `).join('')}
                ${allCategories.length === 0 ? '<span style="color: #999;">No hay categorías creadas</span>' : ''}
            </div>
        </div>
    `;
}

function renderProductModal() {
    const isEdit = editingProduct !== null;
    const p = editingProduct || {};

    return `
        <div id="product-modal-overlay" style="
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: flex; align-items: center;
            justify-content: center; z-index: 10000; backdrop-filter: blur(3px);
        ">
            <div style="
                background: white; padding: 2rem; border-radius: 16px;
                max-width: 550px; width: 90%; max-height: 90vh; overflow-y: auto;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h2 style="color: var(--nb-wine); margin: 0;">${isEdit ? 'Editar' : 'Nuevo'} Producto</h2>
                    <button id="btn-close-modal" style="background: none; border: none; font-size: 1.5rem; color: #999; cursor: pointer;">&times;</button>
                </div>
                <div style="display: flex; flex-direction: column; gap: 14px;">
                    <div>
                        <label style="font-weight: 600; font-size: 0.85rem; color: var(--nb-text); display: block; margin-bottom: 4px;">Nombre *</label>
                        <input type="text" id="pm-nombre" value="${p.nombre || ''}" placeholder="Nombre del producto" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box;">
                    </div>
                    <div>
                        <label style="font-weight: 600; font-size: 0.85rem; color: var(--nb-text); display: block; margin-bottom: 4px;">Descripción</label>
                        <textarea id="pm-descripcion" placeholder="Descripción opcional" rows="2" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box; resize: vertical;">${p.descripcion || ''}</textarea>
                    </div>
                    <div style="display: flex; gap: 12px;">
                        <div style="flex: 1;">
                            <label style="font-weight: 600; font-size: 0.85rem; color: var(--nb-text); display: block; margin-bottom: 4px;">Precio *</label>
                            <input type="number" id="pm-precio" value="${p.precio || ''}" step="0.01" min="0.01" placeholder="0.00" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box;">
                        </div>
                        <div style="flex: 1;">
                            <label style="font-weight: 600; font-size: 0.85rem; color: var(--nb-text); display: block; margin-bottom: 4px;">Stock *</label>
                            <input type="number" id="pm-stock" value="${p.stock ?? ''}" min="0" placeholder="0" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box;">
                        </div>
                    </div>
                    <div>
                        <label style="font-weight: 600; font-size: 0.85rem; color: var(--nb-text); display: block; margin-bottom: 4px;">Categoría *</label>
                        <select id="pm-categoria" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box;">
                            <option value="">Selecciona categoría</option>
                            ${allCategories.map(c => `
                                <option value="${c.id}" ${p.id_categoria === c.id ? 'selected' : ''}>${c.nombre}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div style="display: flex; gap: 12px;">
                        <div style="flex: 1;">
                            <label style="font-weight: 600; font-size: 0.85rem; color: var(--nb-text); display: block; margin-bottom: 4px;">Código</label>
                            <input type="text" id="pm-codigo" value="${p.codigo || ''}" placeholder="SKU / Barcode" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box;">
                        </div>
                        <div style="flex: 1;">
                            <label style="font-weight: 600; font-size: 0.85rem; color: var(--nb-text); display: block; margin-bottom: 4px;">Tags</label>
                            <input type="text" id="pm-tags" value="${p.tags || ''}" placeholder="etiqueta1, etiqueta2" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box;">
                        </div>
                    </div>
                    <div>
                        <label style="font-weight: 600; font-size: 0.85rem; color: var(--nb-text); display: block; margin-bottom: 4px;">URL de Imagen</label>
                        <input type="text" id="pm-imagen" value="${p.imagen_url || ''}" placeholder="https://ejemplo.com/imagen.jpg" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box;">
                    </div>
                    <button id="btn-save-product" style="
                        width: 100%; padding: 12px; background: var(--nb-wine); color: white;
                        border: none; border-radius: 8px; cursor: pointer; font-weight: bold;
                        font-size: 1rem; margin-top: 10px; box-shadow: 0 3px 8px rgba(74,29,31,0.3);
                    ">
                        <i class="fas fa-save"></i> ${isEdit ? 'Guardar Cambios' : 'Crear Producto'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

function applyFilters() {
    // CORRECCIÓN 2: Eliminamos el "if" que vaciaba la lista al estar en "Todas las categorías". 
    // Ahora simplemente filtra el array original basado en lo que se seleccione.
    filteredProducts = allProducts.filter(p => {
        const matchSearch = !searchQuery || 
            (p.descripcion && p.descripcion.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (p.codigo && p.codigo.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchCat = !filterCategoryId || p.id_categoria == filterCategoryId;
        return matchSearch && matchCat;
    });
}

function bindEvents() {
    const searchInput = document.getElementById('inv-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            applyFilters();
            renderView();
        });
    }

    const filterSelect = document.getElementById('inv-filter-cat');
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            filterCategoryId = e.target.value || null;
            applyFilters();
            renderView();
        });
    }

    const btnNew = document.getElementById('btn-new-product');
    if (btnNew) {
        btnNew.onclick = () => {
            editingProduct = null;
            showProductModal = true;
            renderView();
        };
    }

    const btnToggleCat = document.getElementById('btn-toggle-categories');
    if (btnToggleCat) {
        btnToggleCat.onclick = () => {
            showCategorySection = !showCategorySection;
            renderView();
        };
    }

    const btnClose = document.getElementById('btn-close-modal');
    if (btnClose) {
        btnClose.onclick = () => {
            showProductModal = false;
            editingProduct = null;
            renderView();
        };
    }

    const overlay = document.getElementById('product-modal-overlay');
    if (overlay) {
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                showProductModal = false;
                editingProduct = null;
                renderView();
            }
        };
    }

    const btnSave = document.getElementById('btn-save-product');
    if (btnSave) {
        btnSave.onclick = async () => {
            const nombre = document.getElementById('pm-nombre').value.trim();
            const descripcion = document.getElementById('pm-descripcion').value.trim();
            const precio = parseFloat(document.getElementById('pm-precio').value);
            const stock = parseInt(document.getElementById('pm-stock').value);
            const id_categoria = parseInt(document.getElementById('pm-categoria').value);
            const codigo = document.getElementById('pm-codigo').value.trim();
            const tags = document.getElementById('pm-tags').value.trim();
            const imagen_url = document.getElementById('pm-imagen').value.trim();

            if (!nombre || nombre.length < 3) { Modal.show('Error', 'El nombre debe tener al menos 3 caracteres', 'error'); return; }
            if (!precio || precio <= 0) { Modal.show('Error', 'El precio debe ser mayor a 0', 'error'); return; }
            if (isNaN(stock) || stock < 0) { Modal.show('Error', 'El stock no puede ser negativo', 'error'); return; }
            if (!id_categoria) { Modal.show('Error', 'Selecciona una categoría', 'error'); return; }

            const payload = { nombre, descripcion: descripcion || null, precio, stock, id_categoria, codigo: codigo || null, tags: tags || null, imagen_url: imagen_url || null };

            Loader.show();
            try {
                if (editingProduct) {
                    await request(`productos/${editingProduct.id}`, 'PUT', payload);
                    Modal.show('Éxito', 'Producto actualizado correctamente', 'success');
                } else {
                    await request('productos', 'POST', payload);
                    Modal.show('Éxito', 'Producto creado correctamente', 'success');
                }
                const prodRes = await request('productos?limit=500');
                allProducts = prodRes?.items || [];
                applyFilters();
                showProductModal = false;
                editingProduct = null;
            } catch (e) {
                Modal.show('Error', 'No se pudo guardar el producto', 'error');
            }
            Loader.hide();
            renderView();
        };
    }

    document.querySelectorAll('.btn-edit-prod').forEach(btn => {
        btn.onclick = () => {
            const id = parseInt(btn.dataset.id);
            editingProduct = allProducts.find(p => p.id === id) || null;
            showProductModal = true;
            renderView();
        };
    });

    document.querySelectorAll('.btn-delete-prod').forEach(btn => {
        btn.onclick = async () => {
            const id = parseInt(btn.dataset.id);
            const name = btn.dataset.name;
            if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
            Loader.show();
            try {
                await request(`productos/${id}`, 'DELETE');
                allProducts = allProducts.filter(p => p.id !== id);
                applyFilters();
                Modal.show('Éxito', 'Producto eliminado', 'success');
            } catch (e) {
                Modal.show('Error', 'No se pudo eliminar el producto', 'error');
            }
            Loader.hide();
            renderView();
        };
    });

    const btnNewCat = document.getElementById('btn-new-category');
    if (btnNewCat) {
        btnNewCat.onclick = async () => {
            const nombre = prompt('Nombre de la nueva categoría:');
            if (!nombre || nombre.trim().length < 3) { Modal.show('Error', 'El nombre debe tener al menos 3 caracteres', 'error'); return; }
            const desc = prompt('Descripción (opcional):') || null;
            Loader.show();
            try {
                await request('categorias', 'POST', { nombre: nombre.trim(), descripcion: desc });
                const catRes = await request('categorias?limit=100');
                allCategories = catRes?.items || [];
                Modal.show('Éxito', 'Categoría creada', 'success');
            } catch (e) {
                Modal.show('Error', 'No se pudo crear la categoría', 'error');
            }
            Loader.hide();
            renderView();
        };
    }

    document.querySelectorAll('.btn-edit-cat').forEach(btn => {
        btn.onclick = async () => {
            const id = parseInt(btn.dataset.id);
            const currentName = btn.dataset.nombre;
            const nombre = prompt('Nuevo nombre:', currentName);
            if (!nombre || nombre.trim().length < 3) return;
            Loader.show();
            try {
                await request(`categorias/${id}`, 'PUT', { nombre: nombre.trim() });
                const catRes = await request('categorias?limit=100');
                allCategories = catRes?.items || [];
                Modal.show('Éxito', 'Categoría actualizada', 'success');
            } catch (e) {
                Modal.show('Error', 'No se pudo actualizar la categoría', 'error');
            }
            Loader.hide();
            renderView();
        };
    });

    document.querySelectorAll('.btn-delete-cat').forEach(btn => {
        btn.onclick = async () => {
            const id = parseInt(btn.dataset.id);
            const nombre = btn.dataset.nombre;
            if (!confirm(`¿Eliminar categoría "${nombre}"? Los productos asociados quedarán sin categoría.`)) return;
            Loader.show();
            try {
                await request(`categorias/${id}`, 'DELETE');
                allCategories = allCategories.filter(c => c.id !== id);
                Modal.show('Éxito', 'Categoría eliminada', 'success');
            } catch (e) {
                Modal.show('Error', 'No se pudo eliminar. Puede tener productos asociados.', 'error');
            }
            Loader.hide();
            renderView();
        };
    });
}