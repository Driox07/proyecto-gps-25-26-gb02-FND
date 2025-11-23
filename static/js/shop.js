// Shop Page JavaScript - Custom Dropdowns & Pagination

// Estado de la paginación para cada sección
const paginationState = {
    songs: { currentPage: 1, itemsPerPage: 9 },
    albums: { currentPage: 1, itemsPerPage: 9 },
    merch: { currentPage: 1, itemsPerPage: 9 }
};

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    initCustomDropdowns();
    initFilters();
    initPagination();
    if (isAuthenticated) {
        initCart();
    }
    restoreScrollPosition();
});

// ============ PAGINATION ============
function initPagination() {
    // Inicializar paginación para cada sección
    ['songs', 'albums', 'merch'].forEach(section => {
        updatePagination(section);
    });
}

function updatePagination(section) {
    const grid = document.getElementById(`${section}-grid`);
    if (!grid) return;

    const cards = Array.from(grid.querySelectorAll('.product-card'));
    const state = paginationState[section];
    const totalPages = Math.ceil(cards.length / state.itemsPerPage);

    // Ocultar todas las cards primero
    cards.forEach(card => card.classList.remove('visible'));

    // Mostrar solo las cards de la página actual
    const start = (state.currentPage - 1) * state.itemsPerPage;
    const end = start + state.itemsPerPage;
    cards.slice(start, end).forEach(card => card.classList.add('visible'));

    // Actualizar info de página
    const pageInfo = document.getElementById(`${section}-page-info`);
    if (pageInfo && cards.length > 0) {
        pageInfo.textContent = `Página ${state.currentPage} de ${totalPages}`;
    }

    // Crear botones de paginación
    const paginationContainer = document.getElementById(`${section}-pagination`);
    if (paginationContainer && totalPages > 1) {
        paginationContainer.innerHTML = '';
        
        // Botón anterior
        if (state.currentPage > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'pagination-btn';
            prevBtn.textContent = '← Anterior';
            prevBtn.onclick = () => {
                state.currentPage--;
                updatePagination(section);
                scrollToSection(section);
            };
            paginationContainer.appendChild(prevBtn);
        }

        // Botones de página
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= state.currentPage - 1 && i <= state.currentPage + 1)) {
                const pageBtn = document.createElement('button');
                pageBtn.className = `pagination-btn ${i === state.currentPage ? 'active' : ''}`;
                pageBtn.textContent = i;
                pageBtn.onclick = () => {
                    state.currentPage = i;
                    updatePagination(section);
                    scrollToSection(section);
                };
                paginationContainer.appendChild(pageBtn);
            } else if (i === state.currentPage - 2 || i === state.currentPage + 2) {
                const dots = document.createElement('span');
                dots.className = 'pagination-dots';
                dots.textContent = '...';
                paginationContainer.appendChild(dots);
            }
        }

        // Botón siguiente
        if (state.currentPage < totalPages) {
            const nextBtn = document.createElement('button');
            nextBtn.className = 'pagination-btn';
            nextBtn.textContent = 'Siguiente →';
            nextBtn.onclick = () => {
                state.currentPage++;
                updatePagination(section);
                scrollToSection(section);
            };
            paginationContainer.appendChild(nextBtn);
        }
    }
}

function scrollToSection(section) {
    const sectionElement = document.getElementById(`${section}-section`);
    if (sectionElement) {
        sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ============ CUSTOM DROPDOWNS ============
function initCustomDropdowns() {
    // Dropdown de géneros
    const genreHeader = document.getElementById('genre-dropdown-header');
    const genreContent = document.getElementById('genre-dropdown-content');
    const genreCheckboxes = document.querySelectorAll('.genre-checkbox');
    const genreSelectedText = document.getElementById('genre-selected-text');

    if (genreHeader) {
        genreHeader.addEventListener('click', (e) => {
            e.stopPropagation();
            genreHeader.classList.toggle('active');
            genreContent.classList.toggle('show');
            
            // Cerrar el otro dropdown si está abierto
            const artistHeader = document.getElementById('artist-dropdown-header');
            const artistContent = document.getElementById('artist-dropdown-content');
            if (artistHeader && artistHeader.classList.contains('active')) {
                artistHeader.classList.remove('active');
                artistContent.classList.remove('show');
            }
        });

        genreCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                updateDropdownText('genre', genreCheckboxes, genreSelectedText);
            });
        });
    }

    // Dropdown de artistas
    const artistHeader = document.getElementById('artist-dropdown-header');
    const artistContent = document.getElementById('artist-dropdown-content');
    const artistCheckboxes = document.querySelectorAll('.artist-checkbox');
    const artistSelectedText = document.getElementById('artist-selected-text');

    if (artistHeader) {
        artistHeader.addEventListener('click', (e) => {
            e.stopPropagation();
            artistHeader.classList.toggle('active');
            artistContent.classList.toggle('show');
            
            // Cerrar el otro dropdown si está abierto
            if (genreHeader && genreHeader.classList.contains('active')) {
                genreHeader.classList.remove('active');
                genreContent.classList.remove('show');
            }
        });

        artistCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                updateDropdownText('artist', artistCheckboxes, artistSelectedText);
            });
        });
    }

    // Cerrar dropdowns al hacer click fuera
    document.addEventListener('click', (e) => {
        if (genreHeader && genreContent && 
            !genreHeader.contains(e.target) && !genreContent.contains(e.target)) {
            genreHeader.classList.remove('active');
            genreContent.classList.remove('show');
        }
        if (artistHeader && artistContent && 
            !artistHeader.contains(e.target) && !artistContent.contains(e.target)) {
            artistHeader.classList.remove('active');
            artistContent.classList.remove('show');
        }
    });

    // Preseleccionar checkboxes según URL params
    preselectFiltersFromURL();
}

function updateDropdownText(type, checkboxes, textElement) {
    const selected = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.dataset.name);
    
    if (selected.length === 0) {
        textElement.textContent = type === 'genre' ? 'Seleccionar géneros' : 'Seleccionar artistas';
    } else if (selected.length === 1) {
        textElement.textContent = selected[0];
    } else {
        textElement.textContent = `${selected.length} seleccionados`;
    }
}

function preselectFiltersFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Preseleccionar géneros
    const genresParam = urlParams.get('genres');
    if (genresParam) {
        const genreIds = genresParam.split(',');
        genreIds.forEach(id => {
            const checkbox = document.querySelector(`.genre-checkbox[value="${id}"]`);
            if (checkbox) checkbox.checked = true;
        });
        
        const genreCheckboxes = document.querySelectorAll('.genre-checkbox');
        const genreSelectedText = document.getElementById('genre-selected-text');
        if (genreCheckboxes.length && genreSelectedText) {
            updateDropdownText('genre', genreCheckboxes, genreSelectedText);
        }
    }
    
    // Preseleccionar artistas
    const artistsParam = urlParams.get('artists');
    if (artistsParam) {
        const artistIds = artistsParam.split(',');
        artistIds.forEach(id => {
            const checkbox = document.querySelector(`.artist-checkbox[value="${id}"]`);
            if (checkbox) checkbox.checked = true;
        });
        
        const artistCheckboxes = document.querySelectorAll('.artist-checkbox');
        const artistSelectedText = document.getElementById('artist-selected-text');
        if (artistCheckboxes.length && artistSelectedText) {
            updateDropdownText('artist', artistCheckboxes, artistSelectedText);
        }
    }
    
    // Preseleccionar orden
    const orderParam = urlParams.get('order');
    const orderSelect = document.getElementById('order-filter');
    if (orderParam && orderSelect) {
        orderSelect.value = orderParam;
    }
    
    // Preseleccionar dirección
    const directionParam = urlParams.get('direction');
    const directionSelect = document.getElementById('direction-filter');
    if (directionParam && directionSelect) {
        directionSelect.value = directionParam;
    }
}

// ============ FILTERS ============
function initFilters() {
    const resetButton = document.getElementById('reset-filters');

    // Los filtros de orden se aplican automáticamente
    const orderSelect = document.getElementById('order-filter');
    const directionSelect = document.getElementById('direction-filter');
    
    if (orderSelect) {
        orderSelect.addEventListener('change', applyFilters);
    }
    
    if (directionSelect) {
        directionSelect.addEventListener('change', applyFilters);
    }

    // Aplicar filtros cuando se cambian los checkboxes
    document.querySelectorAll('.genre-checkbox, .artist-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', applyFilters);
    });

    if (resetButton) {
        resetButton.addEventListener('click', resetFilters);
    }
}

function applyFilters() {
    const selectedGenres = Array.from(document.querySelectorAll('.genre-checkbox:checked'))
        .map(cb => cb.value);
    
    const selectedArtists = Array.from(document.querySelectorAll('.artist-checkbox:checked'))
        .map(cb => cb.value);
    
    const order = document.getElementById('order-filter')?.value || 'date';
    const direction = document.getElementById('direction-filter')?.value || 'desc';

    const params = new URLSearchParams();
    
    if (selectedGenres.length > 0) {
        params.append('genres', selectedGenres.join(','));
    }
    
    if (selectedArtists.length > 0) {
        params.append('artists', selectedArtists.join(','));
    }
    
    params.append('order', order);
    params.append('direction', direction);

    // Guardar posición del scroll antes de recargar
    saveScrollPosition();

    // Recargar la página con los nuevos parámetros (filtrado desde backend TYA)
    window.location.href = `/shop?${params.toString()}`;
}

function resetFilters() {
    // Desmarcar todos los checkboxes
    document.querySelectorAll('.genre-checkbox, .artist-checkbox').forEach(cb => {
        cb.checked = false;
    });

    // Resetear selects
    const orderSelect = document.getElementById('order-filter');
    const directionSelect = document.getElementById('direction-filter');
    
    if (orderSelect) orderSelect.value = 'date';
    if (directionSelect) directionSelect.value = 'desc';

    // Actualizar textos de dropdowns
    const genreSelectedText = document.getElementById('genre-selected-text');
    const artistSelectedText = document.getElementById('artist-selected-text');
    
    if (genreSelectedText) genreSelectedText.textContent = 'Seleccionar géneros';
    if (artistSelectedText) artistSelectedText.textContent = 'Seleccionar artistas';

    // Recargar sin parámetros (todos los productos desde backend)
    window.location.href = '/shop';
}

// ============ CART ============
function initCart() {
    const addToCartButtons = document.querySelectorAll('.btn-add-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', handleAddToCart);
    });
}

async function handleAddToCart(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const productId = button.getAttribute('data-product-id');
    const productType = button.getAttribute('data-product-type');

    // Crear objeto para enviar al backend
    const cartItem = {};
    
    if (productType === 'song') {
        cartItem.songId = parseInt(productId);
    } else if (productType === 'album') {
        cartItem.albumId = parseInt(productId);
    } else if (productType === 'merch') {
        cartItem.merchId = parseInt(productId);
        cartItem.unidades = 1;  // Por defecto 1 unidad para merch
    }

    try {
        const response = await fetch('/cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(cartItem)
        });

        if (response.ok) {
            const result = await response.json();
            showNotification('✅ Producto añadido al carrito');
            
            // Deshabilitar botón temporalmente para evitar doble click
            button.disabled = true;
            button.style.opacity = '0.6';
            setTimeout(() => {
                button.disabled = false;
                button.style.opacity = '1';
            }, 1000);
        } else if (response.status === 401) {
            showNotification('❌ Debes iniciar sesión para añadir productos al carrito');
            setTimeout(() => {
                window.location.href = '/login?redirect=/shop';
            }, 2000);
        } else if (response.status === 400) {
            const error = await response.json();
            showNotification(`⚠️ ${error.message || 'El producto ya está en el carrito'}`);
        } else {
            showNotification('❌ Error al añadir al carrito');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('❌ Error de conexión');
    }
}

function showNotification(message) {
    const notification = document.getElementById('cart-notification');
    const notificationText = document.getElementById('notification-text');
    
    if (notification && notificationText) {
        notificationText.textContent = message;
        notification.style.display = 'flex';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
}

// ============ SCROLL POSITION ============
function saveScrollPosition() {
    sessionStorage.setItem('shopScrollPosition', window.scrollY.toString());
}

function restoreScrollPosition() {
    const scrollPosition = sessionStorage.getItem('shopScrollPosition');
    if (scrollPosition) {
        setTimeout(() => {
            window.scrollTo(0, parseInt(scrollPosition));
            sessionStorage.removeItem('shopScrollPosition');
        }, 100);
    }
}

// ============ INTERSECTION OBSERVER (Animaciones) ============
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observar todas las cards visibles después de que se cargue la página
setTimeout(() => {
    document.querySelectorAll('.product-card.visible').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
}, 100);

// Inicializar lazy loading después de que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // ... existing code ...
    // Removed lazy image loading to avoid CORS
});