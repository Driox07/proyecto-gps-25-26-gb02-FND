// Album Page Functionality

// Configuration for the music microservice (defined in config.js)
const MUSIC_SERVICE_URL = PT_URL;

// Global audio player instance for album page
let audioPlayer = null;
let currentTrackIndex = -1;
let albumTracks = [];

document.addEventListener('DOMContentLoaded', function() {
    initializeAlbumPage();
});

/**
 * Inicializa todos los componentes de la página de álbum
 */
function initializeAlbumPage() {
    initializeAudioPlayer();
    setupAlbumEventListeners();
}

/**
 * Initialize HTML5 audio player
 */
function initializeAudioPlayer() {
    audioPlayer = new Audio();
    audioPlayer.addEventListener('ended', () => {
        console.log('Track finished');
        // Auto-play next track in album
        playNextTrack();
    });
    audioPlayer.addEventListener('error', (e) => {
        console.error('Audio player error:', e);
        alert('Error al reproducir la canción');
    });
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
        // Avoid double attaching handlers when favorites.js already handles
        // buttons with data-fav-album
        if (!favoriteButton.dataset || !favoriteButton.dataset.favAlbum) {
            favoriteButton.addEventListener('click', handleToggleFavorite);
        }
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
    
    // Botón de eliminar álbum
    const deleteAlbumButton = document.getElementById('delete-album-button');
    if (deleteAlbumButton) {
        deleteAlbumButton.addEventListener('click', handleDeleteAlbum);
    }
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
async function handleAddAlbumToCart(event) {
    event.preventDefault();
    
    const albumId = getAlbumIdFromUrl();
    const albumTitle = document.querySelector('.album-title').textContent;
    
    if (!albumId || albumId === 'unknown') {
        showNotification('ID de álbum no disponible', 'error');
        return;
    }

    try {
        const response = await fetch('/cart', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                songId: null,
                albumId: parseInt(albumId),
                merchId: null,
                unidades: null
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Error del servidor al añadir al carrito:', errorData);
            showNotification(`Error: ${errorData.error || 'No se pudo añadir al carrito'}`, 'error');
            return;
        }

        showNotification(`${albumTitle} añadido al carrito`, 'success');
        
        // Animar el botón
        animateButton(event.currentTarget);

        // Emitir evento para actualizar el header
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        
    } catch (error) {
        console.error('Error al añadir al carrito:', error);
        showNotification('Error al añadir al carrito', 'error');
    }
}

/**
 * Maneja el toggle de favoritos
 */
function handleToggleFavorite(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const albumId = getAlbumIdFromUrl();
    
    if (!albumId || albumId === 'unknown') {
        showNotification('ID de álbum no disponible', 'error');
        return;
    }
    
    if (typeof toggleFavoriteAlbum === 'function') {
        toggleFavoriteAlbum(parseInt(albumId), button);
    } else {
        // Fallback to old behavior
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
}

/**
 * Maneja la eliminación del álbum
 */
async function handleDeleteAlbum(event) {
    event.preventDefault();
    const button = document.getElementById('delete-album-button');
    const albumId = button.getAttribute('data-album-id');
    
    if (!albumId) {
        showNotification('ID de álbum no disponible', 'error');
        return;
    }
    
    if (confirm('¿Estás seguro de que deseas eliminar este álbum? Esta acción no se puede deshacer.')) {
        try {
            const response = await fetch(`/album/${albumId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                showNotification('Álbum eliminado exitosamente', 'success');
                setTimeout(() => {
                    window.location.href = '/shop';
                }, 1500);
            } else {
                const error = await response.json();
                showNotification(`Error: ${error.message || 'Error desconocido'}`, 'error');
            }
        } catch (error) {
            console.error('Error eliminando álbum:', error);
            showNotification('Error al eliminar el álbum', 'error');
        }
    }
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
    const trackId = trackItem.getAttribute('data-track-id');
    
    if (!trackId) {
        alert('ID de canción no disponible');
        return;
    }
    
    // Build album tracks array for auto-play
    buildAlbumTracksArray();
    
    // Find current track index
    currentTrackIndex = albumTracks.findIndex(t => t.trackId === trackId);
    
    showNotification(`Reproduciendo: ${trackName}`, 'info');
    playTrack(trackId);
}

/**
 * Build album tracks array from DOM
 */
function buildAlbumTracksArray() {
    if (albumTracks.length > 0) return; // Already built
    
    const trackItems = document.querySelectorAll('.track-item');
    albumTracks = Array.from(trackItems).map(item => ({
        trackId: item.getAttribute('data-track-id'),
        name: item.querySelector('.track-name a').textContent
    }));
}

/**
 * Play next track in album
 */
function playNextTrack() {
    if (currentTrackIndex < 0 || currentTrackIndex >= albumTracks.length - 1) {
        console.log('No more tracks to play');
        return;
    }
    
    currentTrackIndex++;
    const nextTrack = albumTracks[currentTrackIndex];
    
    if (nextTrack && nextTrack.trackId) {
        showNotification(`Reproduciendo: ${nextTrack.name}`, 'info');
        playTrack(nextTrack.trackId);
    }
}

/**
 * Fetch and play track from microservice
 */
async function playTrack(trackId) {
    if (!trackId) {
        alert('ID de canción no disponible');
        return;
    }

    try {
        const url = `${MUSIC_SERVICE_URL}/track/${trackId}`;
        
        if (CONFIG && CONFIG.debug && CONFIG.debug.logging) {
            console.log(`Fetching track from: ${url}`);
        }

        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'audio/*'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Get audio blob
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (CONFIG && CONFIG.debug && CONFIG.debug.logging) {
            console.log(`Audio blob received, size: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
        }
        
        // Set audio source and play
        audioPlayer.src = audioUrl;
        audioPlayer.play();
        console.log('Playing track:', trackId);

    } catch (error) {
        console.error('Error playing track:', error);
        alert(`Error al reproducir: ${error.message}`);
    }
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

