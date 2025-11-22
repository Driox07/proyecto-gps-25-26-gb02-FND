// Artist Profile Page JavaScript

// Configuration for the music microservice (defined in config.js)
const MUSIC_SERVICE_URL = PT_URL;

// Global audio player instance
let audioPlayer = null;

document.addEventListener('DOMContentLoaded', () => {
    initializeAudioPlayer();
    initTabs();
    initFollowButton();
    initCardInteractions();
});

/**
 * Initialize HTML5 audio player
 */
function initializeAudioPlayer() {
    audioPlayer = new Audio();
    audioPlayer.addEventListener('ended', () => {
        console.log('Track finished');
    });
    audioPlayer.addEventListener('error', (e) => {
        console.error('Audio player error:', e);
        alert('Error al reproducir la canción');
    });
}

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
            const endpoint = isFollowing ? `/favs/artists/${artistId}` : `/favs/artists/${artistId}`;
            const method = isFollowing ? 'DELETE' : 'POST';
            const response = await fetch(endpoint, {
                method: method,
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
        e.preventDefault();
        e.stopPropagation();
        
        // Try to get trackId from the song card
        const songCard = playButton.closest('.song-card');
        if (songCard) {
            const trackId = songCard.getAttribute('data-track-id');
            if (trackId) {
                const title = songCard.querySelector('.card-title')?.textContent || 'canción';
                console.log('Playing:', title);
                playTrack(trackId);
                return;
            }
        }
        
        // Fallback to href navigation for non-playable items
        const href = playButton.getAttribute('href');
        if (href) {
            window.location.href = href;
        }
    }
});

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

// Export functions for external use if needed
window.ArtistProfile = {
    initTabs,
    initFollowButton,
    initCardInteractions,
    showNotification,
    formatDuration
};


