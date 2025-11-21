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
});

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
