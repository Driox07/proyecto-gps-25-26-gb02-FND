// Album Page Functionality

document.addEventListener('DOMContentLoaded', function() {
    initializeAlbumPage();
});

/**
 * Inicializa todos los componentes de la página de álbum
 */
function initializeAlbumPage() {
    setupAlbumEventListeners();
}

/**
 * Configura todos los event listeners del álbum
 */
function setupAlbumEventListeners() {
    // Botón de compra del álbum
    const buyAlbumButton = document.getElementById('buy-album-button');
    if (buyAlbumButton) {
        buyAlbumButton.addEventListener('click', handleBuyAlbum);
    }

    // Botón de añadir al carrito
    const addToCartButton = document.getElementById('add-to-cart-album-button');
    if (addToCartButton) {
        addToCartButton.addEventListener('click', handleAddAlbumToCart);
    }

    // Botón de favoritos
    const favoriteButton = document.getElementById('favorite-album-button');
    if (favoriteButton) {
        favoriteButton.addEventListener('click', handleToggleFavorite);
    }

    // Botón de play del álbum
    const playButtonAlbum = document.getElementById('play-button-album');
    if (playButtonAlbum) {
        playButtonAlbum.addEventListener('click', handlePlayAlbum);
    }

    // Botones de play de las canciones
    const trackPlayButtons = document.querySelectorAll('.track-play-btn');
    trackPlayButtons.forEach(button => {
        button.addEventListener('click', handleTrackPlay);
    });

    // Clicks en géneros
    const genreTags = document.querySelectorAll('.genre-tag');
    genreTags.forEach(tag => {
        tag.addEventListener('click', function() {
            const genreId = this.getAttribute('data-genre-id');
            if (genreId) {
                window.location.href = `/search?genre=${genreId}`;
            }
        });
    });
}

/**
 * Maneja la compra del álbum completo
 */
function handleBuyAlbum(event) {
    event.preventDefault();
    
    const albumTitle = document.querySelector('.album-title').textContent;
    const albumPrice = document.getElementById('album-price').textContent;
    
    // Obtener información del álbum de la página
    const albumData = {
        id: getAlbumIdFromUrl(),
        type: 'album',
        name: albumTitle,
        price: albumPrice,
        timestamp: new Date().getTime()
    };

    // Aquí se puede implementar un carrito más avanzado
    // O redirigir directamente a prepaid con el álbum
    console.log('Compra de álbum:', albumData);
    
    showNotification('Redirigiendo a pago...', 'info');
    
    // Redirigir a prepaid o a la página de pago
    setTimeout(() => {
        // En producción, aquí iría la lógica real de checkout
        // window.location.href = '/prepaid';
    }, 1000);
}

/**
 * Maneja la adición del álbum al carrito
 */
function handleAddAlbumToCart(event) {
    event.preventDefault();
    
    const albumTitle = document.querySelector('.album-title').textContent;
    const albumArtist = document.querySelector('.album-artist a').textContent;
    const albumPrice = document.getElementById('album-price').textContent;
    const albumCover = document.querySelector('.album-cover').src;
    
    // Crear objeto del carrito para el álbum
    const cartItem = {
        id: getAlbumIdFromUrl(),
        type: 'album',
        name: albumTitle,
        artist: albumArtist,
        price: parseFloat(albumPrice.replace('€', '')),
        image: albumCover,
        timestamp: new Date().getTime()
    };

    // Guardar en localStorage
    let cart = JSON.parse(localStorage.getItem('oversound_cart')) || [];
    
    // Verificar si el álbum ya está en el carrito
    const itemExists = cart.some(item => item.id === cartItem.id && item.type === 'album');
    
    if (itemExists) {
        showNotification('Este álbum ya está en tu carrito', 'warning');
        return;
    }

    cart.push(cartItem);
    localStorage.setItem('oversound_cart', JSON.stringify(cart));

    showNotification(`${albumTitle} añadido al carrito`, 'success');
    
    // Animar el botón
    animateButton(event.currentTarget);

    // Emitir evento para actualizar el header
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }));
}

/**
 * Maneja el toggle de favoritos
 */
function handleToggleFavorite(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const isFavorited = button.classList.toggle('favorited');

    if (isFavorited) {
        showNotification('Álbum añadido a favoritos', 'success');
        button.style.fill = '#ff6b6b';
        button.style.color = '#ff6b6b';
    } else {
        showNotification('Álbum eliminado de favoritos', 'info');
        button.style.fill = 'none';
        button.style.color = 'white';
    }

    animateButton(button);
}

/**
 * Maneja la reproducción del álbum
 */
function handlePlayAlbum(event) {
    event.preventDefault();
    showNotification('Reproducción del álbum iniciada', 'info');
    console.log('Reproduciendo álbum completo');
}

/**
 * Maneja la reproducción de una canción específica
 */
function handleTrackPlay(event) {
    event.preventDefault();
    const trackItem = event.currentTarget.closest('.track-item');
    const trackName = trackItem.querySelector('.track-name a').textContent;
    
    showNotification(`Reproduciendo: ${trackName}`, 'info');
    console.log('Reproduciendo canción:', trackName);
}

/**
 * Obtiene el ID del álbum de la URL
 */
function getAlbumIdFromUrl() {
    const path = window.location.pathname;
    const match = path.match(/\/album\/(\d+)/);
    return match ? match[1] : 'unknown';
}

/**
 * Anima el botón
 */
function animateButton(button) {
    const originalScale = button.style.transform;
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
        button.style.transform = originalScale || 'scale(1)';
    }, 150);
}

/**
 * Muestra notificaciones
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        padding: 16px 24px;
        border-radius: 12px;
        color: white;
        font-weight: 600;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: slideInRight 0.4s ease-out;
        ${type === 'success' ? 'background: #48bb78;' : ''}
        ${type === 'error' ? 'background: #f56565;' : ''}
        ${type === 'warning' ? 'background: #ed8936;' : ''}
        ${type === 'info' ? 'background: #667eea;' : ''}
    `;
    
    document.body.appendChild(notification);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

/**
 * Resaltado de pistas al hover
 */
const trackItems = document.querySelectorAll('.track-item');
trackItems.forEach(item => {
    item.addEventListener('mouseenter', function() {
        this.style.background = '#f0f3ff';
    });
    
    item.addEventListener('mouseleave', function() {
        this.style.background = 'white';
    });
});

// Agregar estilos para animaciones dinámicas
const style = document.createElement('style');
if (!document.querySelector('style[data-album-animation]')) {
    style.setAttribute('data-album-animation', 'true');
    style.textContent = `
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(400px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        @keyframes slideOutRight {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(400px);
            }
        }
        
        .btn-icon.favorited {
            fill: #ff6b6b;
            color: #ff6b6b;
        }
    `;
    document.head.appendChild(style);
}

