// Label (Discográfica) Page - Interactive Features
document.addEventListener('DOMContentLoaded', () => {
    setupButtonListeners();
    setupFormHandling();
    setupAnimations();
});

/**
 * Setup button event listeners
 */
function setupButtonListeners() {
    // Join label button
    const joinButton = document.getElementById('join-label-btn');
    if (joinButton) {
        joinButton.addEventListener('click', async () => {
            const labelName = document.querySelector('.label-name').textContent;
            try {
                const response = await fetch(window.location.pathname + '/join', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    alert(`¡Te has unido a ${labelName}!`);
                    location.reload();
                } else {
                    const data = await response.json();
                    alert(data.error || 'Error al unirse a la discográfica');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error al unirse a la discográfica');
            }
        });
    }

    // Leave label button
    const leaveButton = document.getElementById('leave-label-btn');
    if (leaveButton) {
        leaveButton.addEventListener('click', async () => {
            const labelName = document.querySelector('.label-name').textContent;
            if (confirm(`¿Estás seguro de que quieres salir de ${labelName}?`)) {
                try {
                    const response = await fetch(window.location.pathname + '/leave', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        alert('Has salido de la discográfica');
                        location.reload();
                    } else {
                        const data = await response.json();
                        alert(data.error || 'Error al salir de la discográfica');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('Error al salir de la discográfica');
                }
            }
        });
    }

    // Delete label button
    const deleteButton = document.getElementById('delete-label-btn');
    if (deleteButton) {
        deleteButton.addEventListener('click', async () => {
            const labelName = document.querySelector('.label-name').textContent;
            if (confirm(`¿Estás seguro de que quieres eliminar ${labelName}? Esta acción no se puede deshacer.`)) {
                try {
                    const response = await fetch(window.location.pathname, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        alert('Discográfica eliminada correctamente');
                        window.location.href = '/';
                    } else {
                        const data = await response.json();
                        alert(data.error || 'Error al eliminar la discográfica');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('Error al eliminar la discográfica');
                }
            }
        });
    }

    // Remove artist buttons
    const removeArtistBtns = document.querySelectorAll('.remove-artist-btn');
    removeArtistBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const artistId = btn.dataset.artistId;
            const artistName = btn.closest('.artist-card').querySelector('.card-title').textContent;
            
            if (confirm(`¿Estás seguro de que quieres eliminar a ${artistName} de la discográfica?`)) {
                try {
                    const response = await fetch(window.location.pathname + `/artist/${artistId}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        btn.closest('.artist-card').remove();
                    } else {
                        const data = await response.json();
                        alert(data.error || 'Error al eliminar el artista');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('Error al eliminar el artista');
                }
            }
        });
    });
}

/**
 * Setup form handling
 */
function setupFormHandling() {
    const form = document.getElementById('label-form');
    if (!form) return;

    // Character count for textarea
    const textarea = document.getElementById('label-description');
    const charCount = document.getElementById('char-count');
    
    if (textarea && charCount) {
        textarea.addEventListener('input', () => {
            charCount.textContent = textarea.value.length;
        });
        // Initialize character count
        charCount.textContent = textarea.value.length;
    }

    // Logo preview
    const logoInput = document.getElementById('label-logo');
    const newLogoPreview = document.getElementById('new-logo-preview');
    const newPreviewImg = document.getElementById('new-preview-img');

    if (logoInput) {
        logoInput.addEventListener('input', () => {
            if (logoInput.value) {
                newPreviewImg.src = logoInput.value;
                newPreviewImg.onload = () => {
                    newLogoPreview.style.display = 'flex';
                };
                newPreviewImg.onerror = () => {
                    newLogoPreview.style.display = 'none';
                };
            } else {
                newLogoPreview.style.display = 'none';
            }
        });
    }

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        try {
            const url = window.location.pathname.includes('/edit') 
                ? window.location.pathname 
                : '/label/create';
            
            const method = window.location.pathname.includes('/edit') ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const result = await response.json();
                alert(method === 'POST' ? '¡Discográfica creada!' : '¡Cambios guardados!');
                window.location.href = '/label/' + (result.labelId || result.id);
            } else {
                const error = await response.json();
                alert(error.error || 'Error al guardar la discográfica');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al guardar la discográfica');
        }
    });
}

/**
 * Setup page animations
 */
function setupAnimations() {
    // Animate cards on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '0';
                entry.target.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    entry.target.style.transition = 'all 0.6s ease-out';
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 50);
                
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all cards
    const cards = document.querySelectorAll('.artist-card, .content-section');
    cards.forEach(card => {
        observer.observe(card);
    });

    // Fade in on page load
    const header = document.querySelector('.label-header-content');
    if (header) {
        header.style.opacity = '0';
        setTimeout(() => {
            header.style.transition = 'opacity 0.6s ease-out';
            header.style.opacity = '1';
        }, 100);
    }
}

// Log page load
console.log('OverSound Label Page loaded successfully');
