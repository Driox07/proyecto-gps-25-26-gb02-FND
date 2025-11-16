// Artist Profile Page JavaScript

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initFollowButton();
    initCardInteractions();
    loadArtistLabelInfo();
});

/**
 * Initialize tab switching functionality
 */
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');

            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const activeTab = document.getElementById(`${tabName}-tab`);
            if (activeTab) {
                activeTab.classList.add('active');
            }

            // Smooth scroll to content
            activeTab?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

/**
 * Initialize follow button functionality
 */
function initFollowButton() {
    const followBtn = document.querySelector('.follow-btn');
    if (!followBtn) return;

    followBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const artistId = followBtn.getAttribute('data-artist-id');
        const isFollowing = followBtn.classList.contains('following');

        try {
            const endpoint = isFollowing ? '/api/follow/remove' : '/api/follow/add';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    artistId: parseInt(artistId)
                })
            });

            if (response.ok) {
                toggleFollowButton(followBtn, !isFollowing);
            } else {
                console.error('Error al seguir/dejar de seguir artista');
                showNotification('Error al procesar la solicitud', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('Error de conexión', 'error');
        }
    });
}

/**
 * Toggle follow button state
 * @param {HTMLElement} button - The follow button element
 * @param {boolean} isFollowing - Whether the user is now following
 */
function toggleFollowButton(button, isFollowing) {
    if (isFollowing) {
        button.classList.add('following');
        button.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M19 14c1.49-1.46 3-3.59 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 5 3 8 7 11.5S19 22 19 14z" stroke-width="2"></path>
            </svg>
            Siguiendo
        `;
        showNotification('¡Ahora sigues este artista!', 'success');
    } else {
        button.classList.remove('following');
        button.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 5v14M5 12h14" stroke-width="2" stroke-linecap="round"></path>
            </svg>
            Seguir
        `;
        showNotification('Dejaste de seguir este artista', 'info');
    }
}

/**
 * Initialize card interactions (hover effects, etc.)
 */
function initCardInteractions() {
    const cards = document.querySelectorAll('.song-card, .album-card, .merch-card');

    cards.forEach(card => {
        const playButton = card.querySelector('.play-button');
        
        // Add keyboard accessibility
        card.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && playButton) {
                playButton.click();
            }
        });

        // Add focus styles for accessibility
        playButton?.addEventListener('focus', () => {
            card.style.outline = '2px solid #667eea';
            card.style.outlineOffset = '2px';
        });

        playButton?.addEventListener('blur', () => {
            card.style.outline = 'none';
        });
    });
}

/**
 * Show notification toast
 * @param {string} message - The message to show
 * @param {string} type - The type of notification (success, error, info)
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button class="notification-close" aria-label="Cerrar notificación">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="18" y1="6" x2="6" y2="18" stroke-width="2"></line>
                    <line x1="6" y1="6" x2="18" y2="18" stroke-width="2"></line>
                </svg>
            </button>
        </div>
    `;

    // Add styles if not already in CSS
    if (!document.querySelector('style[data-notifications]')) {
        const style = document.createElement('style');
        style.setAttribute('data-notifications', 'true');
        style.innerHTML = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 16px 24px;
                border-radius: 10px;
                font-size: 14px;
                font-weight: 500;
                z-index: 10000;
                animation: slideInRight 0.3s ease-out;
                max-width: 400px;
            }

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

            .notification-content {
                display: flex;
                align-items: center;
                gap: 16px;
                justify-content: space-between;
            }

            .notification-success {
                background: #48bb78;
                color: white;
                box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
            }

            .notification-error {
                background: #f56565;
                color: white;
                box-shadow: 0 4px 12px rgba(245, 101, 101, 0.3);
            }

            .notification-info {
                background: #4299e1;
                color: white;
                box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);
            }

            .notification-close {
                background: none;
                border: none;
                color: currentColor;
                cursor: pointer;
                padding: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.2s;
                flex-shrink: 0;
            }

            .notification-close:hover {
                transform: scale(1.1);
            }

            @media (max-width: 480px) {
                .notification {
                    left: 20px;
                    right: 20px;
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Add to page
    document.body.appendChild(notification);

    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    });

    // Auto-close after 4 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }
    }, 4000);
}

/**
 * Format duration from seconds to mm:ss format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted time string
 */
function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Handle card click for navigation
 */
document.addEventListener('click', (e) => {
    const playButton = e.target.closest('.play-button');
    if (playButton) {
        const href = playButton.getAttribute('href');
        if (href) {
            window.location.href = href;
        }
    }
});

// Export functions for external use if needed
window.ArtistProfile = {
    initTabs,
    initFollowButton,
    initCardInteractions,
    showNotification,
    formatDuration
};

/**
 * Load artist's label information
 */
async function loadArtistLabelInfo() {
    const labelContent = document.getElementById('artist-label-content');
    if (!labelContent) return;

    // Get artist ID from URL or data attribute
    const artistId = getArtistIdFromPage();
    
    try {
        const response = await fetch(`/api/artist/${artistId}/label`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            
            if (data.label) {
                displayArtistLabel(data.label, data.is_owner);
            } else {
                displayArtistNoLabel(data.is_owner);
            }
        } else if (response.status === 404) {
            displayArtistNoLabel(false);
        } else {
            throw new Error('Error al cargar información de discográfica');
        }
    } catch (error) {
        console.error('Error loading artist label:', error);
        labelContent.innerHTML = `
            <div class="label-error">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z" stroke-width="2"></path>
                    <line x1="12" y1="9" x2="12" y2="13" stroke-width="2"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17" stroke-width="2"></line>
                </svg>
                <p>No se pudo cargar la información de discográfica</p>
            </div>
        `;
    }
}

/**
 * Get artist ID from page
 */
function getArtistIdFromPage() {
    // Try to get from data attribute on main element
    const mainElement = document.querySelector('.artist-main');
    if (mainElement && mainElement.dataset.artistId) {
        return mainElement.dataset.artistId;
    }
    
    // Try to get from artist name element
    const artistNameElement = document.querySelector('.artist-name');
    if (artistNameElement && artistNameElement.dataset.artistId) {
        return artistNameElement.dataset.artistId;
    }
    
    // Fallback: return null if not found
    return null;
}

/**
 * Display artist's label
 */
function displayArtistLabel(label, isOwner) {
    const labelContent = document.getElementById('artist-label-content');
    
    let ownerActions = '';
    if (isOwner) {
        ownerActions = `
            <div class="label-owner-actions">
                <a href="/label/${label.id}/edit" class="btn btn-secondary">Editar Discográfica</a>
                <button class="btn btn-danger" onclick="deleteArtistLabel('${label.id}')">Eliminar Discográfica</button>
            </div>
        `;
    }
    
    labelContent.innerHTML = `
        <div class="artist-label-display">
            <div class="label-card-artist">
                <div class="label-logo">
                    ${label.logo ? `<img src="${label.logo}" alt="${label.name}">` : `<div class="logo-placeholder">${label.name[0].toUpperCase()}</div>`}
                </div>
                <div class="label-info">
                    <h3 class="label-name">${label.name}</h3>
                    ${label.description ? `<p class="label-description">${label.description}</p>` : ''}
                    ${label.country ? `<p class="label-meta"><strong>País:</strong> ${label.country}</p>` : ''}
                    ${label.foundationDate ? `<p class="label-meta"><strong>Fundación:</strong> ${label.foundationDate}</p>` : ''}
                    ${label.artistCount ? `<p class="label-meta"><strong>Artistas:</strong> ${label.artistCount}</p>` : ''}
                </div>
                <div class="label-actions">
                    <a href="/label/${label.id}" class="btn btn-primary">Ver Discográfica Completa</a>
                    ${ownerActions}
                </div>
            </div>
        </div>
    `;
}

/**
 * Display when artist has no label
 */
function displayArtistNoLabel(isOwner) {
    const labelContent = document.getElementById('artist-label-content');
    
    let createButton = '';
    if (isOwner) {
        createButton = `<a href="/label/create" class="btn btn-primary">Crear Discográfica</a>`;
    }
    
    labelContent.innerHTML = `
        <div class="artist-no-label">
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" stroke-width="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" stroke-width="2"></path>
                </svg>
                <h3>Sin discográfica</h3>
                <p>${isOwner ? 'Aún no tienes una discográfica. ¡Crea una ahora!' : 'Este artista aún no pertenece a ninguna discográfica.'}</p>
                ${createButton}
            </div>
        </div>
    `;
}

/**
 * Delete artist label (owner only)
 */
async function deleteArtistLabel(labelId) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta discográfica? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const response = await fetch(`/label/${labelId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            showNotification('Discográfica eliminada correctamente', 'success');
            setTimeout(() => {
                loadArtistLabelInfo();
            }, 1500);
        } else if (response.status === 403) {
            showNotification('No tienes permiso para eliminar esta discográfica', 'error');
        } else {
            throw new Error('Error al eliminar discográfica');
        }
    } catch (error) {
        console.error('Error deleting label:', error);
        showNotification('Error al eliminar la discográfica', 'error');
    }
}

// Add styles for label section in artist profile
function addArtistLabelStyles() {
    if (!document.querySelector('style[data-artist-label-styles]')) {
        const style = document.createElement('style');
        style.setAttribute('data-artist-label-styles', 'true');
        style.innerHTML = `
            .label-content {
                min-height: 300px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .artist-label-display,
            .artist-no-label {
                width: 100%;
            }

            .label-card-artist {
                display: flex;
                align-items: center;
                gap: 30px;
                padding: 30px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(102, 126, 234, 0.2);
                border-radius: 15px;
                backdrop-filter: blur(10px);
            }

            .label-logo {
                width: 140px;
                height: 140px;
                min-width: 140px;
                border-radius: 12px;
                overflow: hidden;
                background: rgba(255, 255, 255, 0.1);
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .label-logo img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .logo-placeholder {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                font-size: 56px;
                font-weight: 700;
            }

            .label-name {
                font-size: 24px;
                font-weight: 700;
                color: #fff;
                margin-bottom: 12px;
            }

            .label-description {
                font-size: 14px;
                color: rgba(255, 255, 255, 0.7);
                margin-bottom: 12px;
                line-height: 1.6;
            }

            .label-meta {
                font-size: 13px;
                color: rgba(255, 255, 255, 0.6);
                margin-bottom: 6px;
            }

            .label-actions {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
                margin-top: 20px;
            }

            .label-owner-actions {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
            }

            .artist-no-label .empty-state {
                text-align: center;
                padding: 40px;
                background: rgba(255, 255, 255, 0.05);
                border: 2px dashed rgba(102, 126, 234, 0.3);
                border-radius: 15px;
                backdrop-filter: blur(10px);
            }

            .artist-no-label .empty-state svg {
                margin-bottom: 20px;
                opacity: 0.5;
            }

            .artist-no-label .empty-state h3 {
                font-size: 20px;
                font-weight: 600;
                color: #fff;
                margin-bottom: 12px;
            }

            .artist-no-label .empty-state p {
                font-size: 14px;
                color: rgba(255, 255, 255, 0.7);
                margin-bottom: 24px;
                line-height: 1.6;
            }

            .label-error {
                text-align: center;
                padding: 40px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(245, 101, 101, 0.3);
                border-radius: 15px;
                backdrop-filter: blur(10px);
            }

            .label-error svg {
                margin-bottom: 16px;
                color: #f56565;
            }

            .label-error p {
                font-size: 14px;
                color: rgba(255, 255, 255, 0.7);
            }

            .loading-spinner {
                text-align: center;
                padding: 40px;
            }

            .spinner {
                width: 40px;
                height: 40px;
                border: 3px solid rgba(102, 126, 234, 0.2);
                border-top: 3px solid #667eea;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 16px;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            .loading-spinner p {
                color: rgba(255, 255, 255, 0.6);
                font-size: 14px;
            }

            @media (max-width: 768px) {
                .label-card-artist {
                    flex-direction: column;
                    text-align: center;
                    gap: 20px;
                    padding: 20px;
                }

                .label-logo {
                    width: 120px;
                    height: 120px;
                    min-width: 120px;
                }

                .label-actions {
                    flex-direction: column;
                    width: 100%;
                }

                .label-actions a,
                .label-actions button {
                    width: 100%;
                }

                .label-owner-actions {
                    flex-direction: column;
                    width: 100%;
                }

                .label-owner-actions a,
                .label-owner-actions button {
                    width: 100%;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Add styles when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addArtistLabelStyles);
} else {
    addArtistLabelStyles();
}
