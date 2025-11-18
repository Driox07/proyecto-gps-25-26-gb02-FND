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
    initCart();
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
            };
            paginationContainer.appendChild(nextBtn);
        }
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
            if (artistHeader.classList.contains('active')) {
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
            if (genreHeader.classList.contains('active')) {
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
        if (genreHeader && !genreHeader.contains(e.target) && !genreContent.contains(e.target)) {
            genreHeader.classList.remove('active');
            genreContent.classList.remove('show');
        }
        if (artistHeader && !artistHeader.contains(e.target) && !artistContent.contains(e.target)) {
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
        updateDropdownText('genre', genreCheckboxes, genreSelectedText);
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
        updateDropdownText('artist', artistCheckboxes, artistSelectedText);
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
    const applyButton = document.getElementById('apply-filters');
    const resetButton = document.getElementById('reset-filters');

    if (applyButton) {
        applyButton.addEventListener('click', applyFilters);
    }

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

    // Botones de ver detalles
    const viewButtons = document.querySelectorAll('.btn-view');
    viewButtons.forEach(button => {
        button.addEventListener('click', handleViewDetails);
    });
}

/**
 * Filtra los productos según los criterios especificados
 */
function filterProducts() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const selectedGenre = document.getElementById('genre-filter').value;
    const selectedArtist = document.getElementById('artist-filter').value;
    const selectedType = document.getElementById('type-filter').value;

    const productCards = document.querySelectorAll('.product-card');
    let visibleCount = 0;

    productCards.forEach(card => {
        const productName = card.querySelector('.product-name').textContent.toLowerCase();
        const productArtist = card.querySelector('.product-artist').textContent.toLowerCase();
        const productGenre = card.getAttribute('data-genre').toLowerCase();
        const productType = card.getAttribute('data-type');

        // Verificar búsqueda
        const matchesSearch = productName.includes(searchTerm) || 
                            productArtist.includes(searchTerm);

        // Verificar género
        const matchesGenre = !selectedGenre || productGenre === selectedGenre.toLowerCase();

        // Verificar artista
        const matchesArtist = !selectedArtist || productArtist === selectedArtist.toLowerCase();

        // Verificar tipo
        const matchesType = !selectedType || productType === selectedType;

        // Mostrar u ocultar
        if (matchesSearch && matchesGenre && matchesArtist && matchesType) {
            card.style.display = '';
            card.style.animation = 'scaleIn 0.5s ease-out';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    checkNoProducts();
}

/**
 * Reinicia todos los filtros
 */
function resetFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('genre-filter').value = '';
    document.getElementById('artist-filter').value = '';
    document.getElementById('type-filter').value = '';

    // Mostrar todos los productos
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        card.style.display = '';
    });

    checkNoProducts();
}

/**
 * Maneja la adición de productos al carrito
 */
function handleAddToCart(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const productId = button.getAttribute('data-product-id');
    const productType = button.getAttribute('data-product-type');

    // Obtener datos del producto
    const card = button.closest('.product-card');
    const productName = card.querySelector('.product-name').textContent;
    const productPrice = card.querySelector('.product-price').textContent;
    const productArtist = card.querySelector('.product-artist').textContent;
    const productImage = card.querySelector('.product-image img').src;

    // Crear objeto del carrito con más datos
    const cartItem = {
        id: productId,
        type: productType,
        name: productName,
        price: productPrice,
        artist: productArtist,
        image: productImage,
        quantity: 1,
        timestamp: new Date().getTime()
    };

    // Guardar en localStorage
    let cart = JSON.parse(localStorage.getItem('oversound_cart')) || [];
    
    // Verificar si el producto ya existe en el carrito
    const existingItem = cart.find(item => item.id === productId && item.type === productType);
    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
        cart.push(cartItem);
    }
    
    localStorage.setItem('oversound_cart', JSON.stringify(cart));
    
    showNotification(`Producto añadido al carrito (${cart.length} items)`);
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
        window.scrollTo(0, parseInt(scrollPosition));
        sessionStorage.removeItem('shopScrollPosition');
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

// Observar todas las cards visibles
document.querySelectorAll('.product-card.visible').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

