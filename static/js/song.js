// Song Page - Interactive Features
document.addEventListener('DOMContentLoaded', () => {
    setupButtonListeners();
    setupAnimations();
});

/**
 * Setup button event listeners
 */
function setupButtonListeners() {
    // Play button
    const playButton = document.getElementById('play-button');
    if (playButton) {
        playButton.addEventListener('click', () => {
            const songTitle = document.getElementById('song-title').textContent;
            console.log('Playing song:', songTitle);
            alert(`Reproduciendo: ${songTitle}\n(Funcionalidad de reproducción pendiente)`);
            // TODO: Implement actual playback functionality
        });
    }

    // Buy button
    const buyButton = document.getElementById('buy-button');
    if (buyButton) {
        buyButton.addEventListener('click', () => {
            const songTitle = document.getElementById('song-title').textContent;
            const songPrice = document.getElementById('song-price').textContent;
            console.log('Buying song:', songTitle);
            alert(`Comprando: ${songTitle}\nPrecio: ${songPrice}\n(Funcionalidad de compra pendiente)`);
            // TODO: Implement purchase functionality
        });
    }

    // Add to cart button
    const addToCartButton = document.getElementById('add-to-cart-button');
    if (addToCartButton) {
        addToCartButton.addEventListener('click', () => {
            const songTitle = document.getElementById('song-title').textContent;
            console.log('Adding to cart:', songTitle);
            alert(`Añadido al carrito: ${songTitle}`);
            // TODO: Implement add to cart functionality
        });
    }

    // Favorite button
    const favoriteButton = document.getElementById('favorite-button');
    if (favoriteButton) {
        let isFavorite = false;
        favoriteButton.addEventListener('click', () => {
            const songTitle = document.getElementById('song-title').textContent;
            isFavorite = !isFavorite;
            const path = favoriteButton.querySelector('path');
            
            if (isFavorite) {
                path.setAttribute('fill', 'currentColor');
                alert(`${songTitle} añadido a favoritos`);
            } else {
                path.setAttribute('fill', 'none');
                alert(`${songTitle} eliminado de favoritos`);
            }
            // TODO: Implement favorite functionality with backend
        });
    }
}

/**
 * Setup page animations
 */
function setupAnimations() {
    // Animate sections on scroll
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
                    entry.target.style.transition = 'all 0.6s ease-out';
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, 100);
                
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all detail sections
    const detailSections = document.querySelectorAll('.details-section');
    detailSections.forEach(section => {
        observer.observe(section);
    });

    // Animate genre tags
    const genreTags = document.querySelectorAll('.genre-tag');
    genreTags.forEach((tag, index) => {
        tag.style.opacity = '0';
        tag.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
            tag.style.transition = 'all 0.3s ease-out';
            tag.style.opacity = '1';
            tag.style.transform = 'scale(1)';
        }, 100 + (index * 50));
    });

    // Animate collaborator cards
    const collabCards = document.querySelectorAll('.collaborator-card');
    collabCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.4s ease-out';
            card.style.opacity = '1';
            card.style.transform = 'translateX(0)';
        }, 100 + (index * 75));
    });

    // Hover effect for cover
    const coverContainer = document.querySelector('.song-cover-container');
    if (coverContainer) {
        let ticking = false;
        
        coverContainer.addEventListener('mousemove', (e) => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const rect = coverContainer.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    
                    const rotateX = (y - centerY) / 20;
                    const rotateY = (centerX - x) / 20;
                    
                    coverContainer.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
                    
                    ticking = false;
                });
                ticking = true;
            }
        });
        
        coverContainer.addEventListener('mouseleave', () => {
            coverContainer.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        });
    }
}

// Log page load
console.log('OverSound Song Page loaded successfully');
