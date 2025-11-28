// Header interactivity
document.addEventListener('DOMContentLoaded', () => {
    const userMenu = document.querySelector('.user-menu');
    const userButton = document.querySelector('.user-button');
    const userDropdown = document.querySelector('.user-dropdown');

    if (userMenu && userButton && userDropdown) {
        let isDropdownOpen = false;

        // Abrir dropdown con mouseenter
        userMenu.addEventListener('mouseenter', () => {
            isDropdownOpen = true;
            userDropdown.classList.add('show');
        });

        // Cerrar dropdown con mouseleave pero con pequeño delay
        userMenu.addEventListener('mouseleave', () => {
            setTimeout(() => {
                if (!userDropdown.matches(':hover')) {
                    isDropdownOpen = false;
                    userDropdown.classList.remove('show');
                }
            }, 100);
        });

        // Toggle dropdown on click
        userButton.addEventListener('click', (e) => {
            e.stopPropagation();
            isDropdownOpen = !isDropdownOpen;
            userDropdown.classList.toggle('show', isDropdownOpen);
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!userMenu.contains(e.target)) {
                isDropdownOpen = false;
                userDropdown.classList.remove('show');
            }
        });

        // Prevent dropdown from closing when clicking inside it
        userDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // Logout functionality
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const logoutUrl = logoutBtn.getAttribute('data-logout-url');
            
            try {
                const response = await fetch(logoutUrl, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                // Recargar la página independientemente de la respuesta
                window.location.reload();
            } catch (error) {
                console.error('Error al cerrar sesión:', error);
                // Recargar la página incluso si hay error
                window.location.reload();
            }
        });
    }

    // Highlight active nav link based on current page
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
            link.style.fontWeight = '600';
        }
    });

    // Smooth scroll to top when clicking brand
    const brandLink = document.querySelector('.brand-link');
    if (brandLink && brandLink.getAttribute('href') === '/') {
        brandLink.addEventListener('click', (e) => {
            if (window.location.pathname === '/') {
                e.preventDefault();
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        });
    }

    // Initialize cart badge
    updateCartBadge();

    // Listen for cart updates
    window.addEventListener('cartUpdated', updateCartBadge);

    // Initialize search functionality
    initSearch();
});

/**
 * Inicializa la funcionalidad de búsqueda
 */
function initSearch() {
    const searchInput = document.getElementById('header-search-input');
    const searchResults = document.getElementById('search-results');
    const searchClearBtn = document.getElementById('search-clear-btn');
    const searchLoading = document.getElementById('search-loading');
    const searchContent = document.getElementById('search-content');
    const searchNoResults = document.getElementById('search-no-results');

    if (!searchInput || !searchResults) return;

    let searchTimeout;
    let currentQuery = '';

    // Función para obtener la configuración de servidores
    function getServerConfig() {
        // Intentar obtener desde window.SERVER_CONFIG si está disponible
        if (window.SERVER_CONFIG && window.SERVER_CONFIG.TYA) {
            return window.SERVER_CONFIG.TYA;
        }
        // Fallback a la configuración en la página
        return 'http://localhost:8081';
    }

    // Input handler con debounce
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        currentQuery = query;

        // Mostrar/ocultar botón de limpiar
        if (query.length > 0) {
            searchClearBtn.style.display = 'flex';
        } else {
            searchClearBtn.style.display = 'none';
            searchResults.style.display = 'none';
            return;
        }

        // Buscar solo si hay al menos 3 caracteres
        if (query.length < 3) {
            searchResults.style.display = 'none';
            return;
        }

        // Cancelar búsqueda anterior
        clearTimeout(searchTimeout);

        // Mostrar loading
        searchResults.style.display = 'block';
        searchLoading.style.display = 'flex';
        searchContent.innerHTML = '';
        searchNoResults.style.display = 'none';

        // Ejecutar búsqueda después de 300ms
        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 300);
    });

    // Botón de limpiar
    if (searchClearBtn) {
        searchClearBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchClearBtn.style.display = 'none';
            searchResults.style.display = 'none';
            currentQuery = '';
        });
    }

    // Cerrar resultados al hacer click fuera
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });

    // Reabrir resultados si hay query al hacer focus
    searchInput.addEventListener('focus', () => {
        if (currentQuery.length >= 3 && searchContent.innerHTML) {
            searchResults.style.display = 'block';
        }
    });

    /**
     * Realiza la búsqueda en todos los endpoints
     */
    async function performSearch(query) {
        try {
            // Llamadas en paralelo a los endpoints del backend (proxy)
            const [songsRes, albumsRes, artistsRes, merchRes] = await Promise.allSettled([
                fetch(`/api/search/song?q=${encodeURIComponent(query)}`),
                fetch(`/api/search/album?q=${encodeURIComponent(query)}`),
                fetch(`/api/search/artist?q=${encodeURIComponent(query)}`),
                fetch(`/api/search/merch?q=${encodeURIComponent(query)}`)
            ]);

            // Extraer datos de las respuestas exitosas (ya vienen completos desde el backend)
            const songs = songsRes.status === 'fulfilled' && songsRes.value.ok 
                ? await songsRes.value.json() 
                : [];
            const albums = albumsRes.status === 'fulfilled' && albumsRes.value.ok 
                ? await albumsRes.value.json() 
                : [];
            const artists = artistsRes.status === 'fulfilled' && artistsRes.value.ok 
                ? await artistsRes.value.json() 
                : [];
            const merch = merchRes.status === 'fulfilled' && merchRes.value.ok 
                ? await merchRes.value.json() 
                : [];

            // Si no hay resultados en ninguno
            if (songs.length === 0 && albums.length === 0 && 
                artists.length === 0 && merch.length === 0) {
                searchLoading.style.display = 'none';
                searchNoResults.style.display = 'flex';
                return;
            }

            // Renderizar resultados (los datos ya vienen completos)
            searchLoading.style.display = 'none';
            renderResults(songs, albums, artists, merch);

        } catch (error) {
            console.error('Error en búsqueda:', error);
            searchLoading.style.display = 'none';
            searchNoResults.style.display = 'flex';
        }
    }

    /**
     * Renderiza los resultados de búsqueda
     */
    function renderResults(songs, albums, artists, merch) {
        searchContent.innerHTML = '';

        // Canciones
        if (songs.length > 0) {
            const songsSection = createSection('Canciones', songs, 'song');
            searchContent.appendChild(songsSection);
        }

        // Álbumes
        if (albums.length > 0) {
            const albumsSection = createSection('Álbumes', albums, 'album');
            searchContent.appendChild(albumsSection);
        }

        // Artistas
        if (artists.length > 0) {
            const artistsSection = createSection('Artistas', artists, 'artist');
            searchContent.appendChild(artistsSection);
        }

        // Merchandising
        if (merch.length > 0) {
            const merchSection = createSection('Merchandising', merch, 'merch');
            searchContent.appendChild(merchSection);
        }
    }

    /**
     * Crea una sección de resultados
     */
    function createSection(title, items, type) {
        const section = document.createElement('div');
        section.className = 'search-section';

        const titleEl = document.createElement('div');
        titleEl.className = 'search-section-title';
        titleEl.textContent = title;
        section.appendChild(titleEl);

        // Limitar a 5 resultados por sección
        const limitedItems = items.slice(0, 5);

        limitedItems.forEach(item => {
            const itemEl = createSearchItem(item, type);
            section.appendChild(itemEl);
        });

        return section;
    }

    /**
     * Crea un elemento de resultado
     */
    function createSearchItem(item, type) {
        const link = document.createElement('a');
        link.className = 'search-item';
        
        // Determinar la URL según el tipo
        let url, title, subtitle, image;
        
        if (type === 'song') {
            url = `/song/${item.songId}`;
            title = item.title;
            subtitle = item.artistName || 'Artista desconocido';
            image = getServerConfig() + "/static" + item.cover;
        } else if (type === 'album') {
            url = `/album/${item.albumId}`;
            title = item.title;
            subtitle = item.artistName || 'Artista desconocido';
            image = getServerConfig() + "/static" + item.cover;
        } else if (type === 'artist') {
            url = `/artist/${item.artistId}`;
            title = item.artisticName || 'Sin nombre';
            subtitle = 'Artista';
            image = getServerConfig() + "/static" + item.artisticImage;
        } else if (type === 'merch') {
            url = `/merch/${item.merchId}`;
            title = item.title || 'Sin título';
            subtitle = item.artistName || 'Merchandising';
            image = getServerConfig() + "/static" + item.cover;
        }

        link.href = url;
        link.addEventListener('click', () => {
            searchResults.style.display = 'none';
        });

        // Imagen
        if (image) {
            const img = document.createElement('img');
            img.className = `search-item-image ${type === 'artist' ? 'artist' : ''}`;
            img.src = image;
            img.alt = title;
            link.appendChild(img);
        } else {
            const placeholder = document.createElement('div');
            placeholder.className = `search-item-placeholder ${type === 'artist' ? 'artist' : ''}`;
            if (type === 'artist') {
                placeholder.textContent = title.charAt(0).toUpperCase();
            } else {
                placeholder.innerHTML = getIconForType(type);
            }
            link.appendChild(placeholder);
        }

        // Info
        const info = document.createElement('div');
        info.className = 'search-item-info';
        
        const titleEl = document.createElement('div');
        titleEl.className = 'search-item-title';
        titleEl.textContent = title;
        
        const subtitleEl = document.createElement('div');
        subtitleEl.className = 'search-item-subtitle';
        subtitleEl.textContent = subtitle;
        
        info.appendChild(titleEl);
        info.appendChild(subtitleEl);
        link.appendChild(info);

        // Tipo badge
        const typeBadge = document.createElement('span');
        typeBadge.className = `search-item-type ${type}`;
        typeBadge.textContent = type === 'song' ? 'Canción' 
            : type === 'album' ? 'Álbum' 
            : type === 'artist' ? 'Artista' 
            : 'Merch';
        link.appendChild(typeBadge);

        return link;
    }

    /**
     * Obtiene el icono SVG según el tipo
     */
    function getIconForType(type) {
        const icons = {
            song: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13M9 18c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zm12-2c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z"/></svg>',
            album: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>',
            artist: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
            merch: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>'
        };
        return icons[type] || '';
    }
}

/**
 * Actualiza el badge del carrito en el header
 */
async function updateCartBadge() {
    const cartBadge = document.getElementById('cart-badge');
    
    if (!cartBadge) return;

    try {
        const response = await fetch('/cart', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const cart = await response.json();
            const totalItems = cart.length;

            if (totalItems > 0) {
                cartBadge.textContent = totalItems;
                cartBadge.style.display = 'flex';
            } else {
                cartBadge.style.display = 'none';
            }
        } else {
            // Si no está autenticado o hay error, ocultar badge
            cartBadge.style.display = 'none';
        }
    } catch (error) {
        console.error('Error actualizando badge del carrito:', error);
        cartBadge.style.display = 'none';
    }
}
