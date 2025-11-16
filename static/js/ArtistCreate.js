// Artist Create Wizard JavaScript
let currentStep = 1;
const totalSteps = 4;
let imageBase64 = '';

document.addEventListener('DOMContentLoaded', () => {
    setupFormValidation();
    setupFormSubmission();
});

/**
 * Navigate to next step in wizard
 */
function nextStep() {
    if (!validateCurrentStep()) {
        return;
    }

    if (currentStep < totalSteps) {
        // Hide current step
        document.querySelector(`.wizard-step[data-step="${currentStep}"]`).classList.remove('active');
        document.querySelector(`.progress-step[data-step="${currentStep}"]`).classList.remove('active');
        document.querySelector(`.progress-step[data-step="${currentStep}"]`).classList.add('completed');

        // Show next step
        currentStep++;
        document.querySelector(`.wizard-step[data-step="${currentStep}"]`).classList.add('active');
        document.querySelector(`.progress-step[data-step="${currentStep}"]`).classList.add('active');

        // Update navigation buttons
        updateNavigationButtons();

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

/**
 * Navigate to previous step in wizard
 */
function prevStep() {
    if (currentStep > 1) {
        // Hide current step
        document.querySelector(`.wizard-step[data-step="${currentStep}"]`).classList.remove('active');
        document.querySelector(`.progress-step[data-step="${currentStep}"]`).classList.remove('active');

        // Show previous step
        currentStep--;
        document.querySelector(`.wizard-step[data-step="${currentStep}"]`).classList.add('active');
        document.querySelector(`.progress-step[data-step="${currentStep}"]`).classList.remove('completed');

        // Update navigation buttons
        updateNavigationButtons();

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

/**
 * Update navigation button visibility
 */
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');

    // Show/hide previous button
    if (currentStep === 1) {
        prevBtn.style.display = 'none';
    } else {
        prevBtn.style.display = 'inline-flex';
    }

    // Show/hide next and submit buttons
    if (currentStep === totalSteps) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'inline-flex';
    } else {
        nextBtn.style.display = 'inline-flex';
        submitBtn.style.display = 'none';
    }
}

/**
 * Validate current step fields
 */
function validateCurrentStep() {
    const currentStepElement = document.querySelector(`.wizard-step[data-step="${currentStep}"]`);
    const requiredFields = currentStepElement.querySelectorAll('[required]');
    
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.classList.add('error');
            showFieldError(field, 'Este campo es obligatorio');
        } else {
            field.classList.remove('error');
            removeFieldError(field);
            
            // Validar email si es campo de email
            if (field.type === 'email' && !isValidEmail(field.value)) {
                isValid = false;
                field.classList.add('error');
                showFieldError(field, 'Email inválido');
            }
        }
    });
    
    return isValid;
}

/**
 * Setup form validation
 */
function setupFormValidation() {
    const form = document.getElementById('artist-form');
    const inputs = form.querySelectorAll('input, textarea');
    
    inputs.forEach(input => {
        input.addEventListener('blur', () => {
            if (input.hasAttribute('required') && !input.value.trim()) {
                input.classList.add('error');
                showFieldError(input, 'Este campo es obligatorio');
            } else {
                input.classList.remove('error');
                removeFieldError(input);
            }
        });
        
        input.addEventListener('input', () => {
            if (input.classList.contains('error')) {
                input.classList.remove('error');
                removeFieldError(input);
            }
        });
    });
}

/**
 * Show field error message
 */
function showFieldError(field, message) {
    removeFieldError(field);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
}

/**
 * Remove field error message
 */
function removeFieldError(field) {
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Handle image upload
 */
function handleImageUpload(event) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('La imagen es demasiado grande. Máximo 5MB', 'error');
        event.target.value = '';
        return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showNotification('Por favor selecciona una imagen válida', 'error');
        event.target.value = '';
        return;
    }
    
    // Read file and convert to base64
    const reader = new FileReader();
    
    reader.onload = (e) => {
        imageBase64 = e.target.result;
        
        // Show preview
        const preview = document.getElementById('imagePreview');
        preview.innerHTML = `<img src="${imageBase64}" alt="Preview">`;
        preview.classList.add('has-image');
    };
    
    reader.onerror = () => {
        showNotification('Error al cargar la imagen', 'error');
        event.target.value = '';
    };
    
    reader.readAsDataURL(file);
}

/**
 * Setup form submission
 */
function setupFormSubmission() {
    const form = document.getElementById('artist-form');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validateCurrentStep()) {
            return;
        }
        
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <div class="spinner-small"></div>
            Creando...
        `;
        
        try {
            const formData = {
                artisticName: document.getElementById('artisticName').value.trim(),
                artisticEmail: document.getElementById('artisticEmail').value.trim(),
                artisticBiography: document.getElementById('artisticBiography').value.trim() || '',
                artisticImage: imageBase64 || '',
                socialMediaUrl: document.getElementById('socialMediaUrl').value.trim() || null
            };
            
            const response = await fetch('/artist/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showNotification('¡Perfil de artista creado correctamente!', 'success');
                
                // Redirect to artist profile after 1.5 seconds
                setTimeout(() => {
                    window.location.href = `/artist/${data.artistId}`;
                }, 1500);
            } else {
                showNotification(data.error || 'Error al crear el perfil de artista', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="20 6 9 17 4 12" stroke-width="2"></polyline>
                    </svg>
                    Crear Perfil de Artista
                `;
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('Error al crear el perfil de artista', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="20 6 9 17 4 12" stroke-width="2"></polyline>
                </svg>
                Crear Perfil de Artista
            `;
        }
    });
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        font-size: 14px;
        font-weight: 500;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animations
if (!document.querySelector('style[data-artist-create-animations]')) {
    const style = document.createElement('style');
    style.setAttribute('data-artist-create-animations', 'true');
    style.innerHTML = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .spinner-small {
            width: 20px;
            height: 20px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            display: inline-block;
            margin-right: 8px;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}
