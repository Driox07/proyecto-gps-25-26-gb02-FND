// Shop.js - Funcionalidad de la tienda OverSound

document.addEventListener('DOMContentLoaded', function() {
    initializeShop();
});

/**
 * Inicializa todos los componentes de la tienda
 */
function initializeShop() {
    setupEventListeners();
    checkNoProducts();
}

/**
 * Configura todos los event listeners
 */
function setupEventListeners() {
    // Búsqueda
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', filterProducts);
    }

    // Filtros
    const genreFilter = document.getElementById('genre-filter');
    const artistFilter = document.getElementById('artist-filter');
    const typeFilter = document.getElementById('type-filter');
    const resetButton = document.getElementById('reset-filters');

    if (genreFilter) genreFilter.addEventListener('change', filterProducts);
    if (artistFilter) artistFilter.addEventListener('change', filterProducts);
    if (typeFilter) typeFilter.addEventListener('change', filterProducts);
    if (resetButton) resetButton.addEventListener('click', resetFilters);

    // Botones de agregar al carrito
    const addCartButtons = document.querySelectorAll('.btn-add-cart');
    addCartButtons.forEach(button => {
        button.addEventListener('click', handleAddToCart);
    });

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

    // Crear objeto del carrito
    const cartItem = {
        id: productId,
        type: productType,
        name: productName,
        price: productPrice,
        timestamp: new Date().getTime()
    };

    // Guardar en localStorage
    let cart = JSON.parse(localStorage.getItem('oversound_cart')) || [];
    cart.push(cartItem);
    localStorage.setItem('oversound_cart', JSON.stringify(cart));

    // Mostrar notificación
    showCartNotification(`${productName} añadido al carrito`);

    // Animación del botón
    animateButton(button);

    // Emitir evento personalizado para actualizar el header del carrito
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }));
}

/**
 * Muestra una notificación de carrito
 */
function showCartNotification(message) {
    const notification = document.getElementById('cart-notification');
    if (!notification) return;

    const notificationText = document.getElementById('notification-text');
    notificationText.textContent = message;

    notification.style.display = 'flex';
    notification.style.animation = 'slideInRight 0.4s ease-out';

    // Ocultar después de 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.4s ease-out';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 400);
    }, 3000);
}

/**
 * Anima el botón al hacer click
 */
function animateButton(button) {
    button.style.transform = 'scale(0.9)';
    setTimeout(() => {
        button.style.transform = 'scale(1)';
    }, 200);
}

/**
 * Maneja la visualización de detalles del producto
 */
function handleViewDetails(event) {
    event.preventDefault();
    const link = event.currentTarget;
    const href = link.getAttribute('href');
    
    // Guardar la posición de scroll
    sessionStorage.setItem('shop_scroll_position', window.scrollY);
    
    // Navegar a la página de detalles
    window.location.href = href;
}

/**
 * Verifica si hay productos visibles y muestra el mensaje correspondiente
 */
function checkNoProducts() {
    const productCards = document.querySelectorAll('.product-card');
    const visibleProducts = Array.from(productCards).filter(card => card.style.display !== 'none');
    const noProductsMessage = document.getElementById('no-products');

    if (visibleProducts.length === 0) {
        if (noProductsMessage) {
            noProductsMessage.style.display = 'flex';
        }
    } else {
        if (noProductsMessage) {
            noProductsMessage.style.display = 'none';
        }
    }
}

/**
 * Restaura la posición de scroll cuando se vuelve a la tienda
 */
window.addEventListener('load', function() {
    const scrollPosition = sessionStorage.getItem('shop_scroll_position');
    if (scrollPosition) {
        window.scrollTo(0, parseInt(scrollPosition));
        sessionStorage.removeItem('shop_scroll_position');
    }
});

/**
 * Manejo de eventos globales del carrito
 */
window.addEventListener('cartUpdated', function(event) {
    // Aquí se puede hacer cualquier acción adicional cuando el carrito se actualiza
    console.log('Carrito actualizado:', event.detail);
});

/**
 * Debugging y utilidades
 */
function getCartSummary() {
    const cart = JSON.parse(localStorage.getItem('oversound_cart')) || [];
    console.log(`Productos en carrito: ${cart.length}`);
    console.log(cart);
    return cart;
}

/**
 * Limpia el carrito (útil para testing)
 */
function clearCart() {
    localStorage.removeItem('oversound_cart');
    console.log('Carrito limpiado');
}

// Exportar funciones para acceso global
window.shopUtils = {
    filterProducts,
    resetFilters,
    getCartSummary,
    clearCart
};
