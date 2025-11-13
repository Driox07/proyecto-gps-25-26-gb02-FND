// Header interactivity
document.addEventListener('DOMContentLoaded', () => {
    const userMenu = document.querySelector('.user-menu');
    const userButton = document.querySelector('.user-button');
    const userDropdown = document.querySelector('.user-dropdown');

    if (userButton && userDropdown) {
        // Toggle dropdown on click (opcional, ya que hover funciona)
        userButton.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (userMenu && !userMenu.contains(e.target)) {
                userDropdown.classList.remove('show');
            }
        });

        // Prevent dropdown from closing when clicking inside it
        userDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
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
});
