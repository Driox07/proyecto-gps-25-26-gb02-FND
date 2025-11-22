// Artist Profile Edit JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initImageUpload();
    initCharacterCounters();
    initFormValidation();
    initFormSubmission();
});

/**
 * Initialize image upload and preview
 */
function initImageUpload() {
    const imageInput = document.getElementById('artist-image');
    const imagePreview = document.querySelector('.image-preview');
    
    if (imageInput && imagePreview) {
        imageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            
            if (file) {
                // Validate file size (5MB)
                if (file.size > 5 * 1024 * 1024) {
                    showNotification('La imagen no puede superar los 5MB', 'error');
                    imageInput.value = '';
                    return;
                }
                
                // Validate file type
                if (!file.type.startsWith('image/')) {
                    showNotification('Por favor selecciona una imagen válida', 'error');
                    imageInput.value = '';
                    return;
                }
                
                // Show preview
                const reader = new FileReader();
                reader.onload = function(event) {
                    imagePreview.innerHTML = `<img src="${event.target.result}" alt="Vista previa" id="image-preview">`;
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

/**
 * Initialize character counters for textareas
 */
function initCharacterCounters() {
    const biography = document.getElementById('artisticBiography');
    const bioCounter = document.getElementById('char-count');
    
    if (biography && bioCounter) {
        biography.addEventListener('input', function() {
            const current = this.value.length;
            const max = this.maxLength;
            bioCounter.textContent = `${current}/${max}`;
            
            if (current > max * 0.9) {
                bioCounter.style.color = '#ff6b6b';
            } else {
                bioCounter.style.color = 'rgba(255, 255, 255, 0.6)';
            }
        });
        
        // Initial count
        biography.dispatchEvent(new Event('input'));
    }
}

/**
 * Initialize form validation
 */
function initFormValidation() {
    const form = document.getElementById('edit-artist-form');
    
    if (form) {
        const inputs = form.querySelectorAll('input[required], textarea[required]');
        
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(this);
            });
            
            input.addEventListener('input', function() {
                if (this.classList.contains('error')) {
                    validateField(this);
                }
            });
        });
        
        // Special validation for URL
        const socialMediaInput = document.getElementById('socialMediaUrl');
        if (socialMediaInput) {
            socialMediaInput.addEventListener('blur', function() {
                validateURL(this);
            });
        }
    }
}

/**
 * Validate a single field
 */
function validateField(field) {
    const formGroup = field.closest('.form-group');
    
    if (!field.checkValidity()) {
        formGroup.classList.add('error');
        
        let errorMessage = formGroup.querySelector('.error-message');
        if (!errorMessage) {
            errorMessage = document.createElement('span');
            errorMessage.className = 'error-message';
            field.parentNode.appendChild(errorMessage);
        }
        
        if (field.validity.valueMissing) {
            errorMessage.textContent = 'Este campo es obligatorio';
        } else if (field.validity.typeMismatch) {
            errorMessage.textContent = 'Por favor introduce un email válido';
        } else {
            errorMessage.textContent = 'Valor inválido';
        }
        
        return false;
    } else {
        formGroup.classList.remove('error');
        return true;
    }
}

/**
 * Validate URL field
 */
function validateURL(field) {
    if (!field.value) return true; // Optional field
    
    const formGroup = field.closest('.form-group');
    
    try {
        new URL(field.value);
        formGroup.classList.remove('error');
        return true;
    } catch (e) {
        formGroup.classList.add('error');
        
        let errorMessage = formGroup.querySelector('.error-message');
        if (!errorMessage) {
            errorMessage = document.createElement('span');
            errorMessage.className = 'error-message';
            field.parentNode.appendChild(errorMessage);
        }
        errorMessage.textContent = 'Por favor introduce una URL válida (ej: https://ejemplo.com)';
        return false;
    }
}

/**
 * Initialize form submission
 */
function initFormSubmission() {
    const form = document.getElementById('edit-artist-form');
    const submitBtn = document.getElementById('save-button');
    const cancelBtn = document.getElementById('cancel-button');
    
    if (form && submitBtn) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Validate all fields
            const requiredInputs = form.querySelectorAll('input[required], textarea[required]');
            let isValid = true;
            
            requiredInputs.forEach(input => {
                if (!validateField(input)) {
                    isValid = false;
                }
            });
            
            // Validate URL if provided
            const socialMediaInput = document.getElementById('socialMediaUrl');
            if (socialMediaInput && socialMediaInput.value) {
                if (!validateURL(socialMediaInput)) {
                    isValid = false;
                }
            }
            
            if (!isValid) {
                showNotification('Por favor corrige los errores del formulario', 'error');
                return;
            }
            
            // Prepare form data
            const formData = new FormData(form);
            
            // Show loading state
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            
            try {
                const response = await fetch('/artist/edit', {
                    method: 'PATCH',
                    body: formData,
                    credentials: 'include'
                });
                
                if (response.ok) {
                    showNotification('Perfil de artista actualizado correctamente', 'success');
                    
                    // Get artist ID from response or form data
                    const result = await response.json();
                    const artistId = result.artistId;
                    
                    // Redirect after short delay
                    setTimeout(() => {
                        window.location.href = `/artist/${artistId}`;
                    }, 1500);
                } else {
                    const error = await response.json();
                    showNotification(error.message || 'Error al actualizar el perfil', 'error');
                    
                    // Remove loading state
                    submitBtn.classList.remove('loading');
                    submitBtn.disabled = false;
                }
            } catch (error) {
                console.error('Error updating artist profile:', error);
                showNotification('Error de conexión. Por favor intenta de nuevo', 'error');
                
                // Remove loading state
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        });
    }
    
    // Cancel button
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (hasFormChanges()) {
                if (confirm('¿Estás seguro de que quieres descartar los cambios?')) {
                    // Get artist ID from hidden field or data attribute
                    const artistId = document.querySelector('[data-artist-id]')?.dataset.artistId;
                    if (artistId) {
                        window.location.href = `/artist/${artistId}`;
                    } else {
                        window.location.href = '/';
                    }
                }
            } else {
                const artistId = document.querySelector('[data-artist-id]')?.dataset.artistId;
                if (artistId) {
                    window.location.href = `/artist/${artistId}`;
                } else {
                    window.location.href = '/';
                }
            }
        });
    }
}

/**
 * Check if form has changes
 */
function hasFormChanges() {
    const form = document.getElementById('edit-artist-form');
    if (!form) return false;
    
    const inputs = form.querySelectorAll('input, textarea');
    let hasChanges = false;
    
    inputs.forEach(input => {
        if (input.type === 'file') {
            if (input.files.length > 0) {
                hasChanges = true;
            }
        } else {
            if (input.value !== input.defaultValue) {
                hasChanges = true;
            }
        }
    });
    
    return hasChanges;
}

/**
 * Show notification message
 */
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Add slideOut animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
