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

    // Guardar posición de scroll antes de recargar
    saveScrollPosition();
    
    window.location.href = `/shop?${params.toString()}`;
}

function resetFilters() {
    saveScrollPosition();
    window.location.href = '/shop';
}

// ============ PAGINATION ============
function initPagination() {
    setupPaginationForSection('songs');
    setupPaginationForSection('albums');
    setupPaginationForSection('merch');
}

function setupPaginationForSection(sectionName) {
    const grid = document.getElementById(`${sectionName}-grid`);
    if (!grid) return;

    const allCards = Array.from(grid.querySelectorAll('.product-card'));
    const total = allCards.length;
    const state = paginationState[sectionName];
    
    if (total === 0) return;

    const totalPages = Math.ceil(total / state.itemsPerPage);
    
    // Mostrar primera página
    showPage(sectionName, 1, allCards, totalPages);
    
    // Crear controles de paginación
    createPaginationControls(sectionName, totalPages, allCards);
}

function showPage(sectionName, pageNumber, allCards, totalPages) {
    const state = paginationState[sectionName];
    state.currentPage = pageNumber;
    
    const startIndex = (pageNumber - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    
    // Ocultar todas las cards
    allCards.forEach(card => card.classList.remove('visible'));
    
    // Mostrar solo las cards de la página actual
    allCards.slice(startIndex, endIndex).forEach(card => {
        card.classList.add('visible');
    });
    
    // Actualizar info de página
    const pageInfo = document.getElementById(`${sectionName}-page-info`);
    if (pageInfo) {
        const showing = Math.min(endIndex, allCards.length);
        pageInfo.textContent = `Página ${pageNumber} de ${totalPages}`;
    }
}

function createPaginationControls(sectionName, totalPages, allCards) {
    const paginationContainer = document.getElementById(`${sectionName}-pagination`);
    if (!paginationContainer) return;
    
    paginationContainer.innerHTML = '';
    
    if (totalPages <= 1) return; // No mostrar controles si solo hay una página
    
    // Botón anterior
    const prevButton = document.createElement('button');
    prevButton.textContent = '‹ Anterior';
    prevButton.disabled = paginationState[sectionName].currentPage === 1;
    prevButton.addEventListener('click', () => {
        const currentPage = paginationState[sectionName].currentPage;
        if (currentPage > 1) {
            showPage(sectionName, currentPage - 1, allCards, totalPages);
            createPaginationControls(sectionName, totalPages, allCards);
            scrollToSection(sectionName);
        }
    });
    paginationContainer.appendChild(prevButton);
    
    // Botones de número de página
    const maxButtons = 5;
    let startPage = Math.max(1, paginationState[sectionName].currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }
    
    if (startPage > 1) {
        const firstButton = createPageButton(1, sectionName, allCards, totalPages);
        paginationContainer.appendChild(firstButton);
        
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'page-info';
            paginationContainer.appendChild(ellipsis);
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = createPageButton(i, sectionName, allCards, totalPages);
        paginationContainer.appendChild(pageButton);
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'page-info';
            paginationContainer.appendChild(ellipsis);
        }
        
        const lastButton = createPageButton(totalPages, sectionName, allCards, totalPages);
        paginationContainer.appendChild(lastButton);
    }
    
    // Botón siguiente
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Siguiente ›';
    nextButton.disabled = paginationState[sectionName].currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        const currentPage = paginationState[sectionName].currentPage;
        if (currentPage < totalPages) {
            showPage(sectionName, currentPage + 1, allCards, totalPages);
            createPaginationControls(sectionName, totalPages, allCards);
            scrollToSection(sectionName);
        }
    });
    paginationContainer.appendChild(nextButton);
}

function createPageButton(pageNumber, sectionName, allCards, totalPages) {
    const button = document.createElement('button');
    button.textContent = pageNumber;
    button.className = paginationState[sectionName].currentPage === pageNumber ? 'active' : '';
    button.addEventListener('click', () => {
        showPage(sectionName, pageNumber, allCards, totalPages);
        createPaginationControls(sectionName, totalPages, allCards);
        scrollToSection(sectionName);
    });
    return button;
}

function scrollToSection(sectionName) {
    const section = document.getElementById(`${sectionName}-section`);
    if (section) {
        const yOffset = -100; // Offset para el header
        const y = section.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
    }
}

// ============ CART ============
function initCart() {
    const addToCartButtons = document.querySelectorAll('.btn-add-cart');
    
    addToCartButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const productId = button.dataset.productId;
            const productType = button.dataset.productType;
            
            addToCart(productId, productType);
        });
    });
}

function addToCart(productId, productType) {
    let cart = JSON.parse(localStorage.getItem('oversound_cart') || '[]');
    
    // Verificar si el producto ya está en el carrito
    const existingItem = cart.find(item => 
        item.id === productId && item.type === productType
    );
    
    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
        cart.push({
            id: productId,
            type: productType,
            quantity: 1,
            addedAt: new Date().toISOString()
        });
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

