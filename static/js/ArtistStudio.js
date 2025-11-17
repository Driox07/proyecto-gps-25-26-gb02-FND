// Artist Studio Page JavaScript

document.addEventListener('DOMContentLoaded', () => {
    initNavTabs();
    initDeleteButtons();
    updateStats();
});

/**
 * Initialize navigation tabs
 */
function initNavTabs() {
    const navTabs = document.querySelectorAll('.nav-tab');
    const contentSections = document.querySelectorAll('.content-section');

    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const sectionId = tab.getAttribute('data-section');

            // Remove active class from all tabs and sections
            navTabs.forEach(t => t.classList.remove('active'));
            contentSections.forEach(section => section.classList.remove('active'));

            // Add active class to clicked tab and corresponding section
            tab.classList.add('active');
            const activeSection = document.getElementById(`${sectionId}-section`);
            if (activeSection) {
                activeSection.classList.add('active');
                // Smooth scroll to content
                activeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

/**
 * Initialize delete buttons with confirmation
 */
function initDeleteButtons() {
    const deleteButtons = document.querySelectorAll('.delete-btn');

    deleteButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const id = btn.getAttribute('data-id');
            const type = btn.getAttribute('data-type');

            // Show confirmation dialog
            if (confirm(`¿Estás seguro de que quieres eliminar este ${type}? Esta acción no se puede deshacer.`)) {
                try {
                    const endpoint = type === 'song' ? `/song/${id}` : type === 'album' ? `/album/${id}` : `/merch/${id}`;
                    const response = await fetch(endpoint, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });

                    if (response.ok) {
                        // Remove item from DOM with animation
                        const itemElement = btn.closest('.song-item, .album-card-studio, .merch-card-studio');
                        if (itemElement) {
                            itemElement.style.animation = 'slideOut 0.3s ease-out';
                            setTimeout(() => {
                                itemElement.remove();
                                updateStats();
                                showNotification(`${type} eliminado correctamente`, 'success');
                            }, 300);
                        }
                    } else {
                        showNotification(`Error al eliminar el ${type}`, 'error');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    showNotification('Error de conexión', 'error');
                }
            }
        });
    });
}

/**
 * Update statistics from DOM
 */
function updateStats() {
    const stats = {
        songs: document.querySelectorAll('.song-item').length,
        albums: document.querySelectorAll('.album-card-studio').length,
        merch: document.querySelectorAll('.merch-card-studio').length,
        views: 0 // This would be fetched from API in a real scenario
    };

    // Update stat cards
    Object.entries(stats).forEach(([key, value]) => {
        const statElement = document.querySelector(`[data-stat="${key}"]`);
        if (statElement) {
            // Animate number change
            animateNumber(statElement, parseInt(statElement.textContent), value);
        }
    });
}

/**
 * Animate number change
 * @param {HTMLElement} element - The element containing the number
 * @param {number} startValue - Starting number
 * @param {number} endValue - Ending number
 */
function animateNumber(element, startValue, endValue) {
    const duration = 500;
    const startTime = Date.now();

    const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = Math.floor(startValue + (endValue - startValue) * progress);

        element.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };

    animate();
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

            @keyframes slideOut {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(100%);
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
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    });

    // Auto-close after 4 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease-out';
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
 * Format price
 * @param {number} price - Price in euros
 * @returns {string} Formatted price string
 */
function formatPrice(price) {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR'
    }).format(price);
}

// Export functions for external use if needed
window.ArtistStudio = {
    initNavTabs,
    initDeleteButtons,
    updateStats,
    showNotification,
    formatDuration,
    formatPrice
};
