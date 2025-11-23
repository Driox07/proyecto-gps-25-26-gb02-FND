// User Profile Page Interactivity

// Configuration for the music microservice (defined in config.js)
const MUSIC_SERVICE_URL = PT_URL;

// Global audio player instance
let audioPlayer = null;

document.addEventListener('DOMContentLoaded', () => {
    initializeAudioPlayer();
    loadArtistInfo();
    loadPaymentMethods();
    setupPaymentMethodsModal();
    
    // Play button functionality for favorite items
    const playButtons = document.querySelectorAll('.play-button');
    playButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = button.closest('.favorite-card');
            const title = card.querySelector('.card-title').textContent;
            const trackId = card.getAttribute('data-track-id');
            
            if (trackId) {
                console.log('Playing:', title);
                playTrack(trackId);
            } else {
                alert('Esta canción no tiene un track disponible');
            }
        });
    });

    // Card click functionality
    const favoriteCards = document.querySelectorAll('.favorite-card');
    favoriteCards.forEach(card => {
        card.addEventListener('click', () => {
            const title = card.querySelector('.card-title').textContent;
            console.log('Clicked on:', title);
            // Aquí puedes añadir la lógica para navegar al detalle
            // window.location.href = `/detalle/${id}`;
        });
    });

    // Animate cards on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '0';
                entry.target.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    entry.target.style.transition = 'all 0.5s ease-out';
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, 50);
                
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all favorite cards
    favoriteCards.forEach((card, index) => {
        card.style.transitionDelay = `${index * 0.05}s`;
        observer.observe(card);
    });

    // Add smooth scroll behavior for anchor links
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // Edit profile image hover effect
    const profileImage = document.querySelector('.profile-image-container');
    if (profileImage) {
        profileImage.addEventListener('mouseenter', () => {
            profileImage.style.transform = 'scale(1.05)';
            profileImage.style.transition = 'transform 0.3s ease';
        });

        profileImage.addEventListener('mouseleave', () => {
            profileImage.style.transform = 'scale(1)';
        });
    }

    // Count animation for category counts
    const categoryCount = document.querySelectorAll('.category-count');
    categoryCount.forEach(countElement => {
        const target = parseInt(countElement.textContent);
        let current = 0;
        const increment = target / 30;
        
        const updateCount = () => {
            current += increment;
            if (current < target) {
                countElement.textContent = Math.ceil(current);
                requestAnimationFrame(updateCount);
            } else {
                countElement.textContent = target;
            }
        };
        
        // Start animation when element is visible
        const countObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    updateCount();
                    countObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        countObserver.observe(countElement);
    });

    console.log('User Profile page loaded successfully');
});

// ==================== PAYMENT METHODS FUNCTIONALITY ====================

/**
 * Load and display user's payment methods
 */
async function loadPaymentMethods() {
    const grid = document.getElementById('payment-methods-grid');
    if (!grid) return;

    try {
        const response = await fetch(`${TPP_SERVER}/payment`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const paymentMethods = await response.json();
            
            if (paymentMethods && paymentMethods.length > 0) {
                displayPaymentMethods(paymentMethods);
            } else {
                displayEmptyPaymentState();
            }
        } else if (response.status === 401) {
            grid.innerHTML = '';
        } else {
            throw new Error('Error al cargar métodos de pago');
        }
    } catch (error) {
        console.error('Error loading payment methods:', error);
        grid.innerHTML = `
            <div class="empty-payments">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" stroke-width="2"></rect>
                    <line x1="1" y1="10" x2="23" y2="10" stroke-width="2"></line>
                </svg>
                <p>Error al cargar métodos de pago</p>
            </div>
        `;
    }
}

/**
 * Display payment methods cards
 */
function displayPaymentMethods(methods) {
    const grid = document.getElementById('payment-methods-grid');
    grid.innerHTML = methods.map(method => {
        // Mapear campos de la respuesta
        const cardHolder = method.card_holder || '';
        const cardNumber = method.card_number || '';
        const expireMonth = method.expire_month || 0;
        const expireYear = method.expire_year || 0;
        const id = method.id;
        
        // Extraer últimos 4 dígitos del cardNumber
        const lastFour = cardNumber.slice(-4);
        
        // Formatear fecha de expiración
        const expireMonthStr = String(expireMonth).padStart(2, '0');
        const expireYearStr = String(expireYear).slice(-2);
        const expiry = `${expireMonthStr}/${expireYearStr}`;
        
        // Detectar tipo de tarjeta por los primeros dígitos
        const cardType = detectCardType(cardNumber);
        
        return `
        <div class="payment-card" data-payment-id="${id}">
            <div class="payment-card-header">
                <div class="card-logo">${getCardLogo(cardType)}</div>
                <div class="card-actions">
                    <button class="card-action-btn delete-btn" title="Eliminar" data-payment-id="${id}">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline points="3 6 5 6 21 6" stroke-width="2"></polyline>
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke-width="2"></path>
                            <line x1="10" y1="11" x2="10" y2="17" stroke-width="2"></line>
                            <line x1="14" y1="11" x2="14" y2="17" stroke-width="2"></line>
                        </svg>
                    </button>
                </div>
            </div>
            
            <div class="payment-card-number">•••• •••• •••• ${lastFour}</div>
            
            <div class="payment-card-info">
                <div class="card-holder">
                    <div class="info-label">Titular</div>
                    <div class="info-value">${cardHolder}</div>
                </div>
                <div class="card-expiry">
                    <div class="info-label">Vencimiento</div>
                    <div class="info-value">${expiry}</div>
                </div>
            </div>
            
            <div style="display: flex; gap: 8px; align-items: center;">
                <span class="card-type-badge">${cardType}</span>
            </div>
        </div>
    `;
    }).join('');

    // Add event listeners for actions
    grid.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deletePaymentMethod(btn.dataset.paymentId);
        });
    });
}

/**
 * Display empty state for payment methods
 */
function displayEmptyPaymentState() {
    const grid = document.getElementById('payment-methods-grid');
    grid.innerHTML = `
        <div class="empty-payments">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" stroke-width="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10" stroke-width="2"></line>
            </svg>
            <p>No tienes métodos de pago agregados</p>
        </div>
    `;
}

/**
 * Get card type logo
 */
/**
 * Detect card type from card number
 */
function detectCardType(cardNumber) {
    // Limpiar el número (quitar espacios, asteriscos, etc)
    const cleanNumber = cardNumber.replace(/[^0-9]/g, '');
    
    if (cleanNumber.startsWith('4')) {
        return 'Visa';
    } else if (cleanNumber.startsWith('5')) {
        return 'Mastercard';
    } else if (cleanNumber.startsWith('3')) {
        return 'American Express';
    }
    return 'Tarjeta';
}

/**
 * Get card logo based on card type
 */
function getCardLogo(cardType) {
    const logos = {
        'Visa': '💳',
        'Mastercard': '💳',
        'American Express': '💳',
        'Tarjeta': '💳'
    };
    return logos[cardType] || '💳';
}

/**
 * Setup payment methods modal
 */
function setupPaymentMethodsModal() {
    const modalOverlay = document.getElementById('payment-modal-overlay');
    const addBtn = document.getElementById('add-payment-btn');
    const closeBtn = document.getElementById('modal-close');
    const paymentForm = document.getElementById('payment-form');

    if (!modalOverlay || !addBtn) return;

    // Open modal
    addBtn.addEventListener('click', () => {
        modalOverlay.classList.add('active');
        if (paymentForm) paymentForm.reset();
    });

    // Close modal
    closeBtn?.addEventListener('click', () => {
        modalOverlay.classList.remove('active');
    });

    // Close on overlay click
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.classList.remove('active');
        }
    });

    // Format card number
    const cardNumberInput = document.getElementById('card-number');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\s/g, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formattedValue;
        });
    }

    // Format expiry
    const cardExpiryInput = document.getElementById('card-expiry');
    if (cardExpiryInput) {
        cardExpiryInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }

    // Format CVV (only numbers)
    const cardCvvInput = document.getElementById('card-cvv');
    if (cardCvvInput) {
        cardCvvInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 3);
        });
    }

    // Submit form
    if (paymentForm) {
        paymentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await addPaymentMethod();
        });
    }
}

/**
 * Add new payment method
 */
async function addPaymentMethod() {
    const cardName = document.getElementById('card-name').value;
    const cardNumber = document.getElementById('card-number').value;
    const cardExpiry = document.getElementById('card-expiry').value;
    const cardCvv = document.getElementById('card-cvv').value;
    const cardType = document.getElementById('card-type').value;
    const isDefault = document.getElementById('set-default').checked;

    // Basic validation
    if (!cardName || !cardNumber || !cardExpiry || !cardCvv) {
        showNotification('Por favor completa todos los campos', 'error');
        return;
    }

    if (cardNumber.replace(/\s/g, '').length < 13) {
        showNotification('Número de tarjeta inválido', 'error');
        return;
    }

    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        showNotification('Formato de vencimiento inválido (MM/YY)', 'error');
        return;
    }

    if (cardCvv.length < 3) {
        showNotification('CVV inválido', 'error');
        return;
    }

    try {
        // Parsear fecha de expiración MM/YY
        const [expireMonth, expireYear] = cardExpiry.split('/').map(v => v.trim());
        const fullYear = parseInt('20' + expireYear); // Convertir YY a 20YY
        const month = parseInt(expireMonth);

        // Validar mes
        if (month < 1 || month > 12) {
            showNotification('Mes de expiración inválido', 'error');
            return;
        }

        const response = await fetch('/payment', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                cardHolder: cardName,       // camelCase como espera TPP
                cardNumber: cardNumber,     // camelCase como espera TPP
                expireMonth: month,         // Número entero (1-12)
                expireYear: fullYear        // Año completo (ej: 2025)
            })
        });

        if (response.ok) {
            showNotification('Tarjeta agregada correctamente', 'success');
            document.getElementById('payment-modal-overlay').classList.remove('active');
            document.getElementById('payment-form').reset();
            loadPaymentMethods();
        } else {
            const data = await response.json();
            showNotification(data.message || data.error || 'Error al agregar tarjeta', 'error');
        }
    } catch (error) {
        console.error('Error adding payment method:', error);
        showNotification('Error al agregar tarjeta: ' + error.message, 'error');
    }
}

/**
 * Delete payment method
 */
async function deletePaymentMethod(paymentId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este método de pago?')) {
        return;
    }

    try {
        const response = await fetch(`${TPP_SERVER}/payment/${paymentId}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            showNotification('Método de pago eliminado correctamente', 'success');
            loadPaymentMethods();
        } else {
            const data = await response.json();
            showNotification(data.error || 'Error al eliminar tarjeta', 'error');
        }
    } catch (error) {
        console.error('Error deleting payment method:', error);
        showNotification('Error al eliminar tarjeta', 'error');
    }
}

// Función setDefaultPaymentMethod eliminada - no soportada por backend TPP

/**
 * Show notification message
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#667eea'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 2000;
        animation: slideInRight 0.3s ease-out;
        font-weight: 500;
    `;

    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add notification animation styles
if (!document.querySelector('style[data-notification-styles]')) {
    const style = document.createElement('style');
    style.setAttribute('data-notification-styles', 'true');
    style.innerHTML = `
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(100px);
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
                transform: translateX(100px);
            }
        }
    `;
    document.head.appendChild(style);
}



// ==================== ARTIST FUNCTIONALITY ====================

/**
 * Load artist info
 */
async function loadArtistInfo() {
    const artistContent = document.getElementById('artist-content');
    if (!artistContent) {
        console.log('Artist content element not found');
        return;
    }

    console.log('Loading artist info...');
    console.log('userData:', window.userData);
    console.log('SYU_URL:', SYU_URL, 'TYA_URL:', TYA_URL);

    // Verificar si el usuario tiene artistId
    if (!window.userData || !window.userData.artistId) {
        console.log('No artistId found for user. userData:', window.userData);
        displayNoArtist();
        return;
    }

    console.log('Artist ID found:', window.userData.artistId);

    // Si tiene artistId, cargar información del artista
    try {
        const url = `${TYA_URL}/artist/${window.userData.artistId}`;
        console.log('Fetching artist data from:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        console.log('Response status:', response.status);

        if (response.ok) {
            const artistData = await response.json();
            console.log('Artist data loaded:', artistData);
            displayExistingArtist(artistData);
        } else {
            console.log('Response not OK, displaying no artist');
            displayNoArtist();
        }
    } catch (error) {
        console.error('Error loading artist info:', error);
        displayArtistError();
    }
    
    // TODO: Cuando TYA implemente el endpoint /artist/by-user/{userId}, descomentar:
    /*
    try {
        // Primero necesitamos obtener el userId del usuario autenticado
        // Esto debería venir del data.userdata en el template
        const userId = window.userData?.userId; // Asume que userData está disponible globalmente
        
        if (!userId) {
            displayNoArtist();
            return;
        }
        
        // Hacer petición directa al microservicio TYA
        const response = await fetch(`${TYA_URL}/artist/by-user/${userId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const artistData = await response.json();
            displayExistingArtist(artistData);
        } else if (response.status === 404) {
            displayNoArtist();
        } else {
            displayArtistError();
        }
    } catch (error) {
        console.error('Error loading artist info:', error);
        displayArtistError();
    }
    */
}

/**
 * Display existing artist info
 */
function displayExistingArtist(artist) {
    const artistContent = document.getElementById('artist-content');
    if (!artistContent) return;

    artistContent.innerHTML = `
        <div class="existing-artist">
            <div class="artist-card">
                <div class="artist-avatar">
                    ${artist.profileImage ? 
                        `<img src="${artist.profileImage}" alt="${artist.artisticName}">` :
                        `<div class="avatar-placeholder">${artist.artisticName ? artist.artisticName[0].toUpperCase() : 'A'}</div>`
                    }
                </div>
                <div class="artist-info">
                    <h3 class="artist-name">${artist.artisticName || 'Sin nombre artístico'}</h3>
                    ${artist.biography ? `<p class="artist-description">${artist.biography}</p>` : ''}
                    <div class="artist-stats">
                        <div class="stat-item">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M9 18V5l12-2v13M9 18c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zm12-2c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z" stroke-width="2"/>
                            </svg>
                            <span>${artist.owner_songs?.length || 0} canciones</span>
                        </div>
                        <div class="stat-item">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="12" cy="12" r="10" stroke-width="2"></circle>
                                <circle cx="12" cy="12" r="3" stroke-width="2"></circle>
                            </svg>
                            <span>${artist.owner_albums?.length || 0} álbumes</span>
                        </div>
                        ${artist.labelId ? `
                        <div class="stat-item">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke-width="2"></path>
                                <circle cx="9" cy="7" r="4" stroke-width="2"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke-width="2"></path>
                            </svg>
                            <span>Discográfica asociada</span>
                        </div>
                        ` : ''}
                    </div>
                    <div class="artist-actions">
                        <a href="/artist/studio" class="btn btn-primary">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke-width="2"></path>
                            </svg>
                            Ir al Estudio
                        </a>
                        <a href="/artist/${artist.artistId}" class="btn btn-secondary">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke-width="2"></path>
                                <circle cx="12" cy="12" r="3" stroke-width="2"></circle>
                            </svg>
                            Ver Perfil Público
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Display no artist state
 */
function displayNoArtist() {
    const artistContent = document.getElementById('artist-content');
    if (!artistContent) return;

    artistContent.innerHTML = `
        <div class="no-artist">
            <div class="empty-state">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M9 18V5l12-2v13M9 18c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zm12-2c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z"/>
                </svg>
                <h3>No tienes un perfil de artista</h3>
                <p>Crea tu perfil de artista para poder subir canciones, álbumes y gestionar tu contenido musical.</p>
                <a href="/artist/create" class="btn btn-primary">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <line x1="12" y1="5" x2="12" y2="19" stroke-width="2"></line>
                        <line x1="5" y1="12" x2="19" y2="12" stroke-width="2"></line>
                    </svg>
                    Crear Perfil de Artista
                </a>
            </div>
        </div>
    `;
}

/**
 * Display artist error state
 */
function displayArtistError() {
    const artistContent = document.getElementById('artist-content');
    if (!artistContent) return;

    artistContent.innerHTML = `
        <div class="artist-error">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p>No se pudo cargar la información del artista</p>
            <button class="btn btn-secondary" onclick="loadArtistInfo()">Reintentar</button>
        </div>
    `;
}

// Add styles for artist section
function addArtistStyles() {
    if (!document.querySelector('style[data-artist-styles]')) {
        const style = document.createElement('style');
        style.setAttribute('data-artist-styles', 'true');
        style.innerHTML = `
            .artist-section {
                padding: 60px 20px;
                background: linear-gradient(135deg, rgba(118, 75, 162, 0.05) 0%, rgba(237, 100, 166, 0.05) 100%);
                border-top: 1px solid rgba(118, 75, 162, 0.1);
                border-bottom: 1px solid rgba(118, 75, 162, 0.1);
            }

            .artist-container {
                max-width: 1200px;
                margin: 0 auto;
            }

            .artist-header {
                text-align: center;
                margin-bottom: 40px;
            }

            .artist-header h2 {
                font-size: 32px;
                font-weight: 700;
                color: #fff;
                margin-bottom: 8px;
            }

            .artist-subtitle {
                font-size: 16px;
                color: rgba(255, 255, 255, 0.7);
            }

            .artist-content {
                display: flex;
                justify-content: center;
            }

            .existing-artist {
                width: 100%;
                max-width: 700px;
            }

            .artist-card {
                display: flex;
                align-items: center;
                gap: 30px;
                padding: 30px;
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(118, 75, 162, 0.2);
                border-radius: 15px;
                backdrop-filter: blur(10px);
            }

            .artist-avatar {
                width: 120px;
                height: 120px;
                min-width: 120px;
                border-radius: 50%;
                overflow: hidden;
                background: rgba(255, 255, 255, 0.1);
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .artist-avatar img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .avatar-placeholder {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #764ba2 0%, #ed64a6 100%);
                color: white;
                font-size: 48px;
                font-weight: 700;
            }

            .artist-info {
                flex: 1;
            }

            .artist-name {
                font-size: 24px;
                font-weight: 700;
                color: #fff;
                margin-bottom: 12px;
            }

            .artist-description {
                font-size: 14px;
                color: rgba(255, 255, 255, 0.7);
                margin-bottom: 16px;
                line-height: 1.6;
            }

            .artist-stats {
                display: flex;
                flex-wrap: wrap;
                gap: 16px;
                margin-bottom: 20px;
            }

            .stat-item {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 13px;
                color: rgba(255, 255, 255, 0.7);
            }

            .stat-item svg {
                color: #764ba2;
            }

            .artist-actions {
                display: flex;
                gap: 12px;
                margin-top: 20px;
            }

            .no-artist {
                width: 100%;
                max-width: 500px;
            }

            .no-artist .empty-state {
                text-align: center;
                padding: 40px;
                background: rgba(255, 255, 255, 0.08);
                border: 2px dashed rgba(118, 75, 162, 0.3);
                border-radius: 15px;
                backdrop-filter: blur(10px);
            }

            .no-artist .empty-state svg {
                margin-bottom: 20px;
                opacity: 0.5;
            }

            .no-artist .empty-state h3 {
                font-size: 20px;
                font-weight: 600;
                color: #fff;
                margin-bottom: 12px;
            }

            .no-artist .empty-state p {
                font-size: 14px;
                color: rgba(255, 255, 255, 0.7);
                margin-bottom: 24px;
                line-height: 1.6;
            }

            .artist-error {
                text-align: center;
                padding: 40px;
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(245, 101, 101, 0.3);
                border-radius: 15px;
                backdrop-filter: blur(10px);
            }

            .artist-error svg {
                margin-bottom: 16px;
                color: #f56565;
            }

            .artist-error p {
                font-size: 14px;
                color: rgba(255, 255, 255, 0.7);
                margin-bottom: 20px;
            }

            @media (max-width: 768px) {
                .artist-section {
                    padding: 40px 20px;
                }

                .artist-header h2 {
                    font-size: 24px;
                }

                .artist-card {
                    flex-direction: column;
                    text-align: center;
                    gap: 20px;
                }

                .artist-actions {
                    flex-direction: column;
                }

                .artist-actions a {
                    width: 100%;
                }

                .artist-stats {
                    justify-content: center;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Add artist styles when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addArtistStyles);
} else {
    addArtistStyles();
}

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
