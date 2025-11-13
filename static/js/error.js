// Error Page - Interactive Features
document.addEventListener('DOMContentLoaded', () => {
    setupAnimations();
    setupNavigationTracking();
});

/**
 * Setup page animations
 */
function setupAnimations() {
    // Animate error icon on load
    const errorIcon = document.querySelector('.error-icon');
    if (errorIcon) {
        errorIcon.style.opacity = '0';
        errorIcon.style.transform = 'scale(0.5) rotate(-180deg)';
        
        setTimeout(() => {
            errorIcon.style.transition = 'all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            errorIcon.style.opacity = '1';
            errorIcon.style.transform = 'scale(1) rotate(0deg)';
        }, 200);
    }

    // Animate suggestion links
    const suggestionLinks = document.querySelectorAll('.error-suggestions a');
    suggestionLinks.forEach((link, index) => {
        link.style.opacity = '0';
        link.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            link.style.transition = 'all 0.5s ease-out';
            link.style.opacity = '1';
            link.style.transform = 'translateX(0)';
        }, 500 + (index * 100));
    });

    // Enhanced floating animation for notes
    const floatingNotes = document.querySelectorAll('.floating-note');
    floatingNotes.forEach((note, index) => {
        note.style.opacity = '0';
        
        setTimeout(() => {
            note.style.transition = 'opacity 1s ease-in';
            note.style.opacity = '0.2';
        }, index * 400);
    });
}

/**
 * Setup navigation tracking
 */
function setupNavigationTracking() {
    // Log error page view for analytics
    const errorMessage = document.querySelector('.error-message p');
    if (errorMessage) {
        console.log('Error page displayed:', errorMessage.textContent);
    }

    // Add click tracking to suggestion links
    const suggestionLinks = document.querySelectorAll('.error-suggestions a');
    suggestionLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            console.log('User navigated to:', link.href);
        });
    });

    // Track back button usage
    const backButton = document.querySelector('.btn-primary');
    if (backButton) {
        backButton.addEventListener('click', () => {
            console.log('User clicked back button');
        });
    }
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // ESC key - go back
    if (e.key === 'Escape') {
        window.history.back();
    }
    
    // H key - go home
    if (e.key === 'h' || e.key === 'H') {
        window.location.href = '/';
    }
});

// Log page load
console.log('OverSound Error Page loaded');
