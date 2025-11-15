// Help Pages JS - FAQ, Contact, Help Center
document.addEventListener('DOMContentLoaded', function() {
    initializeHelpPage();
    initializeFAQ();
    initializeSearch();
    initializeContactForm();
    initializeCategories();
});

/**
 * Initialize help page functionality
 */
function initializeHelpPage() {
    console.log('Help page initialized');
}

/**
 * Initialize FAQ accordion functionality
 */
function initializeFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        if (question) {
            question.addEventListener('click', () => {
                toggleFAQItem(item, faqItems);
            });

            // Keyboard navigation
            question.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleFAQItem(item, faqItems);
                }
            });

            // Make focusable
            question.setAttribute('tabindex', '0');
            question.setAttribute('role', 'button');
        }
    });

    // Check for URL hash and open that FAQ item
    const hash = window.location.hash;
    if (hash) {
        const element = document.querySelector(hash);
        if (element && element.classList.contains('faq-item')) {
            openFAQItem(element);
            setTimeout(() => {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }
    }
}

/**
 * Toggle FAQ item
 */
function toggleFAQItem(item, allItems) {
    const isActive = item.classList.contains('active');
    
    if (isActive) {
        closeFAQItem(item);
    } else {
        // Close other items in same category
        const category = item.closest('[data-category]');
        if (category) {
            category.querySelectorAll('.faq-item.active').forEach(activeItem => {
                if (activeItem !== item) {
                    closeFAQItem(activeItem);
                }
            });
        }
        openFAQItem(item);
    }
}

/**
 * Open FAQ item
 */
function openFAQItem(item) {
    item.classList.add('active');
    const answer = item.querySelector('.faq-answer');
    if (answer) {
        answer.style.maxHeight = answer.scrollHeight + 'px';
    }
}

/**
 * Close FAQ item
 */
function closeFAQItem(item) {
    item.classList.remove('active');
    const answer = item.querySelector('.faq-answer');
    if (answer) {
        answer.style.maxHeight = '0';
    }
}

/**
 * Initialize search functionality
 */
function initializeSearch() {
    const searchInput = document.querySelector('.search-input');
    
    if (!searchInput) return;

    // Add debounce to search
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const query = this.value.toLowerCase().trim();
        
        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 300);
    });

    // Clear search on Escape
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            this.value = '';
            clearSearch();
        }
    });
}

/**
 * Perform search
 */
function performSearch(query) {
    if (!query) {
        clearSearch();
        return;
    }

    const faqItems = document.querySelectorAll('.faq-item');
    let resultsCount = 0;

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question h3');
        const answer = item.querySelector('.faq-answer');
        const text = (question?.textContent + ' ' + answer?.textContent).toLowerCase();

        if (text.includes(query)) {
            item.style.display = 'block';
            item.classList.add('search-highlight');
            resultsCount++;
        } else {
            item.style.display = 'none';
            item.classList.remove('search-highlight');
        }
    });

    // Show results count
    showSearchResults(query, resultsCount);
}

/**
 * Clear search results
 */
function clearSearch() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        item.style.display = 'block';
        item.classList.remove('search-highlight');
    });
    removeSearchResults();
}

/**
 * Show search results notification
 */
function showSearchResults(query, count) {
    removeSearchResults();

    if (count === 0) {
        const notification = document.createElement('div');
        notification.className = 'search-results-notification no-results';
        notification.innerHTML = `No se encontraron resultados para "${query}"`;
        notification.style.cssText = `
            text-align: center;
            padding: 20px;
            background: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 8px;
            margin: 20px 0;
            color: #856404;
        `;
        
        const container = document.querySelector('.faq-items') || document.querySelector('.help-container');
        if (container) {
            container.insertBefore(notification, container.firstChild);
        }
    }
}

/**
 * Remove search results notification
 */
function removeSearchResults() {
    const notification = document.querySelector('.search-results-notification');
    if (notification) {
        notification.remove();
    }
}

/**
 * Initialize contact form
 */
function initializeContactForm() {
    const form = document.querySelector('.contact-form form');
    
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const data = Object.fromEntries(formData);

        // Validate form
        if (!validateContactForm(data)) {
            return;
        }

        // Show loading state
        const submitBtn = this.querySelector('[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';

        try {
            // Simulate form submission
            // In production, this would send to an API endpoint
            await simulateFormSubmission(data);
            
            showNotification('¡Mensaje enviado correctamente!', 'success');
            this.reset();
        } catch (error) {
            showNotification('Error al enviar el mensaje. Por favor, intenta de nuevo.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

/**
 * Validate contact form
 */
function validateContactForm(data) {
    const errors = [];

    if (!data.name || data.name.trim().length < 2) {
        errors.push('El nombre debe tener al menos 2 caracteres');
    }

    if (!data.email || !isValidEmail(data.email)) {
        errors.push('Por favor, ingresa un email válido');
    }

    if (!data.subject || data.subject.trim().length < 3) {
        errors.push('El asunto debe tener al menos 3 caracteres');
    }

    if (!data.message || data.message.trim().length < 10) {
        errors.push('El mensaje debe tener al menos 10 caracteres');
    }

    if (errors.length > 0) {
        errors.forEach(error => showNotification(error, 'error'));
        return false;
    }

    return true;
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Simulate form submission
 */
function simulateFormSubmission(data) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // In production, make actual API call here
            console.log('Form data:', data);
            resolve();
        }, 1500);
    });
}

/**
 * Initialize category filters
 */
function initializeCategories() {
    const categoryButtons = document.querySelectorAll('.category-button');
    
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            filterByCategory(category, categoryButtons);
        });
    });
}

/**
 * Filter items by category
 */
function filterByCategory(selectedCategory, buttons) {
    // Update active button
    buttons.forEach(btn => btn.classList.remove('active'));
    if (selectedCategory) {
        document.querySelector(`[data-category="${selectedCategory}"]`)?.classList.add('active');
    }

    // Filter FAQ items
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        if (!selectedCategory || item.getAttribute('data-category') === selectedCategory) {
            item.style.display = 'block';
            item.classList.add('fade-in');
        } else {
            item.style.display = 'none';
        }
    });

    // Smooth animation
    addFadeInAnimation();
}

/**
 * Add fade-in animation CSS
 */
function addFadeInAnimation() {
    if (document.querySelector('style[data-animations="help"]')) return;

    const style = document.createElement('style');
    style.setAttribute('data-animations', 'help');
    style.innerHTML = `
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .fade-in {
            animation: fadeIn 0.3s ease-out;
        }

        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(30px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        .notification {
            animation: slideInRight 0.3s ease;
        }

        .search-highlight {
            background: rgba(102, 126, 234, 0.05);
            border-left: 3px solid #667eea;
        }
    `;

    document.head.appendChild(style);
}

/**
 * Show notification toast
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = message;
    
    const bgColor = type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#667eea';
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        max-width: 400px;
        word-wrap: break-word;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

/**
 * Accessibility: Keyboard navigation
 */
document.addEventListener('keydown', function(e) {
    // Skip to main content on Alt+M
    if (e.altKey && e.code === 'KeyM') {
        const mainContent = document.querySelector('.help-main') || document.querySelector('main');
        if (mainContent) {
            mainContent.focus();
        }
    }
});
