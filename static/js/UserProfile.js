// User Profile Page Interactivity
document.addEventListener('DOMContentLoaded', () => {
    loadLabelInfo();
    
    // Play button functionality for favorite items
    const playButtons = document.querySelectorAll('.play-button');
    playButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = button.closest('.favorite-card');
            const title = card.querySelector('.card-title').textContent;
            console.log('Playing:', title);
            // Aquí puedes añadir la lógica para reproducir la canción/álbum
            alert(`Reproduciendo: ${title}`);
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

/**
 * Load and display user's label information
 */
async function loadLabelInfo() {
    const labelContent = document.getElementById('label-content');
    
    try {
        // Get user ID from cookie or session
        const response = await fetch('/api/user/label', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            
            if (data.has_label && data.label) {
                // Usuario tiene una discográfica
                displayExistingLabel(data.label);
            } else {
                // Usuario no tiene discográfica
                displayCreateLabelButton();
            }
        } else if (response.status === 404) {
            // No tiene discográfica
            displayCreateLabelButton();
        } else {
            throw new Error('Error al cargar información de discográfica');
        }
    } catch (error) {
        console.error('Error loading label info:', error);
        labelContent.innerHTML = `
            <div class="label-error">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z" stroke-width="2"></path>
                    <line x1="12" y1="9" x2="12" y2="13" stroke-width="2"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17" stroke-width="2"></line>
                </svg>
                <p>No se pudo cargar la información de discográfica</p>
                <a href="/label/create" class="btn btn-primary">Crear Discográfica</a>
            </div>
        `;
    }
}

/**
 * Display existing label info
 * @param {Object} label - Label object with id, name, logo, etc.
 */
function displayExistingLabel(label) {
    const labelContent = document.getElementById('label-content');
    
    labelContent.innerHTML = `
        <div class="existing-label">
            <div class="label-card">
                <div class="label-logo">
                    ${label.logo ? `<img src="${label.logo}" alt="${label.name}">` : `<div class="logo-placeholder">${label.name[0].toUpperCase()}</div>`}
                </div>
                <div class="label-info">
                    <h3 class="label-name">${label.name}</h3>
                    ${label.description ? `<p class="label-description">${label.description}</p>` : ''}
                    ${label.country ? `<p class="label-meta"><strong>País:</strong> ${label.country}</p>` : ''}
                    ${label.foundationDate ? `<p class="label-meta"><strong>Fundación:</strong> ${label.foundationDate}</p>` : ''}
                </div>
                <div class="label-actions">
                    <a href="/label/${label.id}" class="btn btn-primary">Ver Discográfica</a>
                    <a href="/label/${label.id}/edit" class="btn btn-secondary">Editar</a>
                </div>
            </div>
        </div>
    `;
}

/**
 * Display create label button
 */
function displayCreateLabelButton() {
    const labelContent = document.getElementById('label-content');
    
    labelContent.innerHTML = `
        <div class="no-label">
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" stroke-width="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" stroke-width="2"></path>
                </svg>
                <h3>Aún no tienes una discográfica</h3>
                <p>Crea tu propia discográfica y comienza a gestionar tu contenido musical.</p>
                <a href="/label/create" class="btn btn-primary">Crear Mi Discográfica</a>
            </div>
        </div>
    `;
}

// Add styles for label section
function addLabelStyles() {
    if (!document.querySelector('style[data-label-styles]')) {
        const style = document.createElement('style');
        style.setAttribute('data-label-styles', 'true');
        style.innerHTML = `
            .label-section {
                padding: 60px 20px;
                background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
                border-top: 1px solid rgba(102, 126, 234, 0.1);
                border-bottom: 1px solid rgba(102, 126, 234, 0.1);
            }

            .label-container {
                max-width: 1200px;
                margin: 0 auto;
            }

            .label-header {
                text-align: center;
                margin-bottom: 40px;
            }

            .label-header h2 {
                font-size: 32px;
                font-weight: 700;
                color: #fff;
                margin-bottom: 8px;
            }

            .label-subtitle {
                font-size: 16px;
                color: rgba(255, 255, 255, 0.7);
            }

            .label-content {
                display: flex;
                justify-content: center;
            }

            .existing-label {
                width: 100%;
                max-width: 600px;
            }

            .label-card {
                display: flex;
                align-items: center;
                gap: 30px;
                padding: 30px;
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(102, 126, 234, 0.2);
                border-radius: 15px;
                backdrop-filter: blur(10px);
            }

            .label-logo {
                width: 120px;
                height: 120px;
                min-width: 120px;
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
                font-size: 48px;
                font-weight: 700;
            }

            .label-info {
                flex: 1;
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
                margin-top: 20px;
            }

            .no-label {
                width: 100%;
                max-width: 500px;
            }

            .no-label .empty-state {
                text-align: center;
                padding: 40px;
                background: rgba(255, 255, 255, 0.08);
                border: 2px dashed rgba(102, 126, 234, 0.3);
                border-radius: 15px;
                backdrop-filter: blur(10px);
            }

            .no-label .empty-state svg {
                margin-bottom: 20px;
                opacity: 0.5;
            }

            .no-label .empty-state h3 {
                font-size: 20px;
                font-weight: 600;
                color: #fff;
                margin-bottom: 12px;
            }

            .no-label .empty-state p {
                font-size: 14px;
                color: rgba(255, 255, 255, 0.7);
                margin-bottom: 24px;
                line-height: 1.6;
            }

            .label-error {
                text-align: center;
                padding: 40px;
                background: rgba(255, 255, 255, 0.08);
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
                margin-bottom: 20px;
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
                .label-section {
                    padding: 40px 20px;
                }

                .label-header h2 {
                    font-size: 24px;
                }

                .label-card {
                    flex-direction: column;
                    text-align: center;
                    gap: 20px;
                }

                .label-actions {
                    flex-direction: column;
                }

                .label-actions a {
                    width: 100%;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Add styles when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addLabelStyles);
} else {
    addLabelStyles();
}
