/**
 * Favorites Management System
 * Gestiona favoritos de canciones, álbumes y artistas
 */

/**
 * Alterna el estado de favorito de una canción
 * @param {number} songId - ID de la canción
 * @param {HTMLElement} button - Botón que dispara la acción
 */
async function toggleFavoriteSong(songId, button) {
    try {
        // Determinar si ya es favorito basándose en el estado visual
        const path = button.querySelector('path');
        const isFavorited = path && path.getAttribute('fill') === 'currentColor';
        
        const method = isFavorited ? 'DELETE' : 'POST';
        const endpoint = `/favs/songs/${songId}`;
        
        const response = await fetch(endpoint, {
            method: method,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                showFavoritesNotification('Por favor inicia sesión para añadir a favoritos', 'error');
                return;
            }
            throw new Error('Error en la solicitud');
        }

        // Actualizar estado visual
        if (path) {
            if (isFavorited) {
                path.setAttribute('fill', 'none');
                showFavoritesNotification('Eliminado de favoritos', 'success');
            } else {
                path.setAttribute('fill', 'currentColor');
                showFavoritesNotification('Añadido a favoritos', 'success');
            }
        }

        // Emitir evento personalizado
        window.dispatchEvent(new CustomEvent('favoriteToggled', {
            detail: { type: 'song', id: songId, isFavorited: !isFavorited }
        }));

    } catch (error) {
        console.error('Error al cambiar estado de favorito:', error);
        showFavoritesNotification('Error al procesar la solicitud', 'error');
    }
}

/**
 * Alterna el estado de favorito de un álbum
 * @param {number} albumId - ID del álbum
 * @param {HTMLElement} button - Botón que dispara la acción
 */
async function toggleFavoriteAlbum(albumId, button) {
    try {
        const path = button.querySelector('path');
        const isFavorited = path && path.getAttribute('fill') === 'currentColor';
        
        const method = isFavorited ? 'DELETE' : 'POST';
        const endpoint = `/favs/albums/${albumId}`;
        
        const response = await fetch(endpoint, {
            method: method,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                showFavoritesNotification('Por favor inicia sesión para añadir a favoritos', 'error');
                return;
            }
            throw new Error('Error en la solicitud');
        }

        // Actualizar estado visual
        if (path) {
            if (isFavorited) {
                path.setAttribute('fill', 'none');
                showFavoritesNotification('Álbum eliminado de favoritos', 'success');
            } else {
                path.setAttribute('fill', 'currentColor');
                showFavoritesNotification('Álbum añadido a favoritos', 'success');
            }
        }

        window.dispatchEvent(new CustomEvent('favoriteToggled', {
            detail: { type: 'album', id: albumId, isFavorited: !isFavorited }
        }));

    } catch (error) {
        console.error('Error al cambiar estado de favorito del álbum:', error);
        showFavoritesNotification('Error al procesar la solicitud', 'error');
    }
}

/**
 * Alterna el estado de favorito de un artista
 * @param {number} artistId - ID del artista
 * @param {HTMLElement} button - Botón que dispara la acción
 */
async function toggleFavoriteArtist(artistId, button) {
    try {
        const path = button.querySelector('path');
        const isFavorited = path && path.getAttribute('fill') === 'currentColor';
        
        const method = isFavorited ? 'DELETE' : 'POST';
        const endpoint = `/favs/artists/${artistId}`;
        
        const response = await fetch(endpoint, {
            method: method,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                showFavoritesNotification('Por favor inicia sesión para seguir a artistas', 'error');
                return;
            }
            throw new Error('Error en la solicitud');
        }

        // Actualizar estado visual
        if (path) {
            if (isFavorited) {
                path.setAttribute('fill', 'none');
                showFavoritesNotification('Artista eliminado de favoritos', 'success');
            } else {
                path.setAttribute('fill', 'currentColor');
                showFavoritesNotification('Artista añadido a favoritos', 'success');
            }
        }

        window.dispatchEvent(new CustomEvent('favoriteToggled', {
            detail: { type: 'artist', id: artistId, isFavorited: !isFavorited }
        }));

    } catch (error) {
        console.error('Error al cambiar estado de favorito del artista:', error);
        showFavoritesNotification('Error al procesar la solicitud', 'error');
    }
}

/**
 * Alterna el estado de favorito de mercancía
 * @param {number} merchId - ID de la mercancía
 * @param {HTMLElement} button - Botón que dispara la acción
 */
async function toggleFavoriteMerch(merchId, button) {
    try {
        const path = button.querySelector('path');
        const isFavorited = path && path.getAttribute('fill') === 'currentColor';
        
        // Nota: Este endpoint puede variar según la API
        const method = isFavorited ? 'DELETE' : 'POST';
        const endpoint = `/favs/merch/${merchId}`;
        
        const response = await fetch(endpoint, {
            method: method,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                showFavoritesNotification('Por favor inicia sesión para añadir a favoritos', 'error');
                return;
            }
            // Fallback si merch favoritos no están implementados
            if (response.status === 404 || response.status === 405) {
                showFavoritesNotification('Los favoritos de mercancía aún no están disponibles', 'info');
                return;
            }
            throw new Error('Error en la solicitud');
        }

        // Actualizar estado visual
        if (path) {
            if (isFavorited) {
                path.setAttribute('fill', 'none');
                showFavoritesNotification('Mercancía eliminada de favoritos', 'success');
            } else {
                path.setAttribute('fill', 'currentColor');
                showFavoritesNotification('Mercancía añadida a favoritos', 'success');
            }
        }

        window.dispatchEvent(new CustomEvent('favoriteToggled', {
            detail: { type: 'merch', id: merchId, isFavorited: !isFavorited }
        }));

    } catch (error) {
        console.error('Error al cambiar estado de favorito de mercancía:', error);
        showFavoritesNotification('Error al procesar la solicitud', 'error');
    }
}

/**
 * Obtiene la lista de canciones favoritas del usuario
 * @returns {Promise<Array>} Array de canciones favoritas
 */
async function getFavoriteSongs() {
    try {
        const response = await fetch('/favs/songs', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener favoritos');
        }

        return await response.json();
    } catch (error) {
        console.error('Error al obtener canciones favoritas:', error);
        return [];
    }
}

/**
 * Obtiene la lista de álbumes favoritos del usuario
 * @returns {Promise<Array>} Array de álbumes favoritos
 */
async function getFavoriteAlbums() {
    try {
        const response = await fetch('/favs/albums', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener favoritos');
        }

        return await response.json();
    } catch (error) {
        console.error('Error al obtener álbumes favoritos:', error);
        return [];
    }
}

/**
 * Obtiene la lista de artistas favoritos del usuario
 * @returns {Promise<Array>} Array de artistas favoritos
 */
async function getFavoriteArtists() {
    try {
        const response = await fetch('/favs/artists', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener favoritos');
        }

        return await response.json();
    } catch (error) {
        console.error('Error al obtener artistas favoritos:', error);
        return [];
    }
}

/**
 * Obtiene la lista de mercancía favorita del usuario
 * @returns {Promise<Array>} Array de mercancía favorita
 */
async function getFavoriteMerch() {
    try {
        const response = await fetch('/favs/merch', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener favoritos');
        }

        return await response.json();
    } catch (error) {
        console.error('Error al obtener mercancía favorita:', error);
        return [];
    }
}

/**
 * Verifica si una canción es favorita del usuario actual
 * @param {number} songId - ID de la canción
 * @returns {Promise<boolean>} True si es favorita
 */
async function isSongFavorited(songId) {
    try {
        const favorites = await getFavoriteSongs();
        // SYU API returns an array of ids (integers) but some endpoints might
        // return objects with an `id` field. Be robust and accept both.
        return favorites.some(item => {
            if (typeof item === 'number') return item === songId;
            if (item && (item.id !== undefined)) return item.id === songId;
            return false;
        });
    } catch (error) {
        console.error('Error verificando si es favorito:', error);
        return false;
    }
}

/**
 * Verifica si un álbum es favorito del usuario actual
 * @param {number} albumId - ID del álbum
 * @returns {Promise<boolean>} True si es favorito
 */
async function isAlbumFavorited(albumId) {
    try {
        const favorites = await getFavoriteAlbums();
        return favorites.some(item => {
            if (typeof item === 'number') return item === albumId;
            if (item && (item.id !== undefined)) return item.id === albumId;
            return false;
        });
    } catch (error) {
        console.error('Error verificando si es favorito:', error);
        return false;
    }
}

/**
 * Verifica si una mercancía es favorita del usuario actual
 * @param {number} merchId - ID de la mercancía
 * @returns {Promise<boolean>} True si es favorita
 */
async function isMerchFavorited(merchId) {
    try {
        const favorites = await getFavoriteMerch();
        return favorites.some(item => {
            if (typeof item === 'number') return item === merchId;
            if (item && (item.id !== undefined)) return item.id === merchId;
            return false;
        });
    } catch (error) {
        console.error('Error verificando si es favorito:', error);
        return false;
    }
}

/**
 * Actualiza el estado visual de un botón de favorito
 * @param {HTMLElement} button - Botón a actualizar
 * @param {boolean} isFavorited - Si el elemento está en favoritos
 */
function updateFavoriteButtonState(button, isFavorited) {
    if (!button) return;
    
    const path = button.querySelector('path');
    if (path) {
        if (isFavorited) {
            path.setAttribute('fill', 'currentColor');
        } else {
            path.setAttribute('fill', 'none');
        }
    }
}

/**
 * Muestra una notificación para acciones de favoritos
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación: 'success', 'error', 'info'
 */
function showFavoritesNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `favorites-notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 14px 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        font-size: 14px;
        animation: slideInUp 0.3s ease-out;
        font-family: inherit;
    `;

    document.body.appendChild(notification);

    // Eliminar después de 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOutDown 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

/**
 * Inicializa event listeners para botones de favorito
 * Se debe llamar cuando el DOM esté listo
 */
async function initializeFavoriteButtons() {
    // Botones de favorito para canciones
    const favoriteSongButtons = document.querySelectorAll('[data-fav-song]');
    favoriteSongButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const songId = parseInt(button.dataset.favSong);
            toggleFavoriteSong(songId, button);
        });
    });

    // Ajustar estado visual inicial para botones de canción
    try {
        const songIds = Array.from(favoriteSongButtons).map(b => parseInt(b.dataset.favSong)).filter(Boolean);
        if (songIds.length) {
            const favs = await getFavoriteSongs();
            favoriteSongButtons.forEach(button => {
                const id = parseInt(button.dataset.favSong);
                let isFav = false;
                if (favs && favs.length) {
                    isFav = favs.some(item => (typeof item === 'number' ? item === id : (item && item.id !== undefined ? item.id === id : false)));
                }
                updateFavoriteButtonState(button, isFav);
            });
        }
    } catch (e) {
        console.warn('Error inicializando estados de canciones favoritos:', e);
    }

    // Botones de favorito para álbumes
    const favoriteAlbumButtons = document.querySelectorAll('[data-fav-album]');
    favoriteAlbumButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const albumId = parseInt(button.dataset.favAlbum);
            toggleFavoriteAlbum(albumId, button);
        });
    });

    // Ajustar estado visual inicial para botones de álbum
    try {
        const albumIds = Array.from(favoriteAlbumButtons).map(b => parseInt(b.dataset.favAlbum)).filter(Boolean);
        if (albumIds.length) {
            const favs = await getFavoriteAlbums();
            favoriteAlbumButtons.forEach(button => {
                const id = parseInt(button.dataset.favAlbum);
                let isFav = false;
                if (favs && favs.length) {
                    isFav = favs.some(item => (typeof item === 'number' ? item === id : (item && item.id !== undefined ? item.id === id : false)));
                }
                updateFavoriteButtonState(button, isFav);
            });
        }
    } catch (e) {
        console.warn('Error inicializando estados de álbumes favoritos:', e);
    }

    // Botones de favorito para artistas
    const favoriteArtistButtons = document.querySelectorAll('[data-fav-artist]');
    favoriteArtistButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const artistId = parseInt(button.dataset.favArtist);
            toggleFavoriteArtist(artistId, button);
        });
    });

    // Ajustar estado visual inicial para botones de artista
    try {
        const artistIds = Array.from(favoriteArtistButtons).map(b => parseInt(b.dataset.favArtist)).filter(Boolean);
        if (artistIds.length) {
            const favs = await getFavoriteArtists();
            favoriteArtistButtons.forEach(button => {
                const id = parseInt(button.dataset.favArtist);
                let isFav = false;
                if (favs && favs.length) {
                    isFav = favs.some(item => (typeof item === 'number' ? item === id : (item && item.id !== undefined ? item.id === id : false)));
                }
                updateFavoriteButtonState(button, isFav);
            });
        }
    } catch (e) {
        console.warn('Error inicializando estados de artistas favoritos:', e);
    }

    // Botones de favorito para mercancía
    const favoriteMerchButtons = document.querySelectorAll('[data-fav-merch]');
    favoriteMerchButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const merchId = parseInt(button.dataset.favMerch);
            toggleFavoriteMerch(merchId, button);
        });
    });

    // Ajustar estado visual inicial para botones de merch
    try {
        const merchIds = Array.from(favoriteMerchButtons).map(b => parseInt(b.dataset.favMerch)).filter(Boolean);
        if (merchIds.length) {
            const favs = await getFavoriteMerch();
            favoriteMerchButtons.forEach(button => {
                const id = parseInt(button.dataset.favMerch);
                let isFav = false;
                if (favs && favs.length) {
                    isFav = favs.some(item => (typeof item === 'number' ? item === id : (item && item.id !== undefined ? item.id === id : false)));
                }
                updateFavoriteButtonState(button, isFav);
            });
        }
    } catch (e) {
        console.warn('Error inicializando estados de mercancía favoritos:', e);
    }
}

    // Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => { initializeFavoriteButtons().catch(e => console.error(e)); });
