// User Profile Page Interactivity
document.addEventListener('DOMContentLoaded', () => {
    
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
