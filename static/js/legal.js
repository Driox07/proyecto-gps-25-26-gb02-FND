// Legal Pages JS - Terms, Privacy, Cookies
document.addEventListener('DOMContentLoaded', function() {
    initializeLegalPage();
});

function initializeLegalPage() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                // Highlight the section
                highlightSection(target);
            }
        });
    });

    // Print button functionality
    const printButtons = document.querySelectorAll('[data-action="print"]');
    printButtons.forEach(btn => {
        btn.addEventListener('click', () => printLegalDocument());
    });

    // Copy to clipboard for contact info
    const copyButtons = document.querySelectorAll('[data-action="copy"]');
    copyButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const text = this.getAttribute('data-text');
            if (text) {
                copyToClipboard(text);
                showNotification('Copiado al portapapeles', 'success');
            }
        });
    });

    // Add back to top functionality
    addBackToTopButton();
}

/**
 * Highlight a section temporarily
 */
function highlightSection(element) {
    element.classList.add('section-highlight');
    setTimeout(() => {
        element.classList.remove('section-highlight');
    }, 2000);
}

/**
 * Print the legal document
 */
function printLegalDocument() {
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<!DOCTYPE html>');
    printWindow.document.write('<html><head><title>Documento</title>');
    printWindow.document.write('<style>');
    printWindow.document.write('body { font-family: Arial, sans-serif; line-height: 1.6; }');
    printWindow.document.write('h2 { color: #333; border-bottom: 2px solid #667eea; margin-top: 20px; }');
    printWindow.document.write('h3 { color: #555; margin-top: 15px; }');
    printWindow.document.write('p { color: #666; }');
    printWindow.document.write('</style></head><body>');
    printWindow.document.write(document.querySelector('.legal-content').innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}

/**
 * Copy text to clipboard
 */
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
            .then(() => {
                console.log('Texto copiado:', text);
            })
            .catch(err => {
                console.error('Error al copiar:', err);
                fallbackCopyToClipboard(text);
            });
    } else {
        fallbackCopyToClipboard(text);
    }
}

/**
 * Fallback for older browsers
 */
function fallbackCopyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}

/**
 * Add back to top button
 */
function addBackToTopButton() {
    const backToTopBtn = document.createElement('button');
    backToTopBtn.className = 'back-to-top';
    backToTopBtn.innerHTML = '↑';
    backToTopBtn.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        font-size: 24px;
        cursor: pointer;
        display: none;
        z-index: 999;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        transition: all 0.3s ease;
    `;

    document.body.appendChild(backToTopBtn);

    // Show/hide button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopBtn.style.display = 'block';
        } else {
            backToTopBtn.style.display = 'none';
        }
    });

    // Scroll to top on click
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Hover effect
    backToTopBtn.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.1)';
    });

    backToTopBtn.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });
}

/**
 * Show notification toast
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#48bb78' : '#667eea'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: slideInRight 0.3s ease;
        z-index: 1000;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

/**
 * Add animations CSS to document if not already present
 */
function addAnimations() {
    if (document.querySelector('style[data-animations="legal"]')) return;

    const style = document.createElement('style');
    style.setAttribute('data-animations', 'legal');
    style.innerHTML = `
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

        @keyframes slideOutRight {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(30px);
            }
        }

        @keyframes highlight {
            0% {
                background-color: transparent;
            }
            50% {
                background-color: rgba(102, 126, 234, 0.1);
            }
            100% {
                background-color: transparent;
            }
        }

        .section-highlight {
            animation: highlight 0.6s ease-out;
        }

        .section-highlight {
            padding: 20px;
            margin: -20px;
            border-left: 4px solid #667eea;
        }
    `;

    document.head.appendChild(style);
}

// Call animations on load
addAnimations();

// Accessibility: Add keyboard navigation
document.addEventListener('keydown', function(e) {
    // Alt + Top: Go to top
    if (e.altKey && e.code === 'Home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // Escape: Close any open modals/notifications
    if (e.code === 'Escape') {
        const notifications = document.querySelectorAll('[class*="notification"]');
        notifications.forEach(n => n.remove());
    }
});
