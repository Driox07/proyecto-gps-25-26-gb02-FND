// Merch Page - Interactive Features
document.addEventListener('DOMContentLoaded', () => {
    setupButtonListeners();
    setupAnimations();
});

/**
 * Setup button event listeners
 */
function setupButtonListeners() {
    // View button
    const viewButton = document.getElementById('view-button');
    if (viewButton) {
        viewButton.addEventListener('click', () => {
            const merchName = document.getElementById('merch-name').textContent;
            console.log('Viewing merch:', merchName);
            // TODO: Implement image gallery/lightbox functionality
        });
    }

    // Buy button
    const buyButton = document.getElementById('buy-button');
    if (buyButton) {
        buyButton.addEventListener('click', () => {
            const merchName = document.getElementById('merch-name').textContent;
            const merchPrice = document.getElementById('merch-price').textContent;
            console.log('Buying merch:', merchName);
            alert(`Comprando: ${merchName}\nPrecio: ${merchPrice}\n(Funcionalidad de compra pendiente)`);
            // TODO: Implement purchase functionality
        });
    }

    // Add to cart button
    const addToCartButton = document.getElementById('add-to-cart-button');
    if (addToCartButton) {
        addToCartButton.addEventListener('click', () => {
            const merchName = document.getElementById('merch-name').textContent;
            console.log('Adding to cart:', merchName);
            alert(`Añadido al carrito: ${merchName}`);
            // TODO: Implement add to cart functionality
        });
    }

    // Favorite button
    const favoriteButton = document.getElementById('favorite-button');
    if (favoriteButton) {
        let isFavorite = false;
        favoriteButton.addEventListener('click', () => {
            const merchName = document.getElementById('merch-name').textContent;
            isFavorite = !isFavorite;
            const path = favoriteButton.querySelector('path');
            
            if (isFavorite) {
                path.setAttribute('fill', 'currentColor');
                alert(`${merchName} añadido a favoritos`);
            } else {
                path.setAttribute('fill', 'none');
                alert(`${merchName} eliminado de favoritos`);
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

    // Animate spec items
    const specItems = document.querySelectorAll('.spec-item');
    specItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            item.style.transition = 'all 0.3s ease-out';
            item.style.opacity = '1';
            item.style.transform = 'translateX(0)';
        }, 100 + (index * 50));
    });

    // Animate related merch cards
    const relatedCards = document.querySelectorAll('.related-merch-card');
    relatedCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.9)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.4s ease-out';
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
        }, 100 + (index * 75));
    });

    // Hover effect for merch image
    const imageContainer = document.querySelector('.merch-image-container');
    if (imageContainer) {
        let ticking = false;
        
        imageContainer.addEventListener('mousemove', (e) => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const rect = imageContainer.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    
                    const rotateX = (y - centerY) / 20;
                    const rotateY = (centerX - x) / 20;
                    
                    imageContainer.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
                    
                    ticking = false;
                });
                ticking = true;
            }
        });
        
        imageContainer.addEventListener('mouseleave', () => {
            imageContainer.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        });
    }
}

// Log page load
console.log('OverSound Merch Page loaded successfully');
