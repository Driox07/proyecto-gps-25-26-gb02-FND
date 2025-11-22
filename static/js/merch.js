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

    // Buy button - Redirige al carrito
    const buyButton = document.getElementById('buy-button');
    if (buyButton) {
        buyButton.addEventListener('click', () => {
            window.location.href = '/cart';
        });
    }

    // Add to cart button
    const addToCartButton = document.getElementById('add-to-cart-button');
    if (addToCartButton) {
        addToCartButton.addEventListener('click', async () => {
            const merchName = document.getElementById('merch-name').textContent;
            
            // Obtener ID de merch desde el URL
            const merchId = window.location.pathname.split('/').pop();
            
            if (!merchId || isNaN(parseInt(merchId))) {
                alert('ID de producto no disponible');
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
                        albumId: null,
                        merchId: parseInt(merchId),
                        unidades: 1
                    })
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error('Error del servidor al añadir al carrito:', errorData);
                    alert(`Error al añadir al carrito: ${errorData.error || 'Error desconocido'}`);
                    return;
                }

                // Emitir evento para actualizar el header
                window.dispatchEvent(new CustomEvent('cartUpdated'));
                
                alert(`${merchName} añadido al carrito`);
                
            } catch (error) {
                console.error('Error al añadir al carrito:', error);
                alert('Error al añadir el producto al carrito');
            }
        });
    }

    // Favorite button
    const favoriteButton = document.getElementById('favorite-button');
    if (favoriteButton) {
        // If the element has data-fav-merch, favorites.js will already attach
        // the handler — avoid duplicate listeners which cause double requests
        if (!favoriteButton.dataset || !favoriteButton.dataset.favMerch) {
            favoriteButton.addEventListener('click', () => {
                const merchId = window.location.pathname.split('/').pop();
                if (!merchId) {
                    alert('ID de mercancía no disponible');
                    return;
                }
                if (typeof toggleFavoriteMerch === 'function') {
                    toggleFavoriteMerch(parseInt(merchId), favoriteButton);
                } else {
                    alert('Los favoritos de mercancía aún no están disponibles');
                }
            });
        }
    }

    // Delete button
    const deleteButton = document.getElementById('delete-merch-button');
    if (deleteButton) {
        deleteButton.addEventListener('click', async () => {
            const merchId = deleteButton.getAttribute('data-merch-id');
            if (!merchId) {
                alert('ID de producto no disponible');
                return;
            }
            
            if (confirm('¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.')) {
                try {
                    const response = await fetch(`/merch/${merchId}`, {
                        method: 'DELETE',
                        credentials: 'include',
                        headers: {
                            'Accept': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        alert('Producto eliminado exitosamente');
                        window.location.href = '/shop';
                    } else {
                        const error = await response.json();
                        alert(`Error al eliminar el producto: ${error.message || 'Error desconocido'}`);
                    }
                } catch (error) {
                    console.error('Error eliminando producto:', error);
                    alert('Error al eliminar el producto');
                }
            }
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
