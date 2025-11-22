document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('edit-song-form');
    const saveBtn = document.getElementById('save-btn');
    const messageDiv = document.getElementById('message');
    const songId = document.getElementById('songId').value;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        saveBtn.disabled = true;
        saveBtn.textContent = 'Guardando...';
        
        // Preparar datos del formulario
        const formData = {
            title: document.getElementById('title').value.trim(),
            duration: parseInt(document.getElementById('duration').value),
            price: parseFloat(document.getElementById('price').value),
            description: document.getElementById('description').value.trim() || null,
            cover: document.getElementById('cover').value.trim(),
            releaseDate: document.getElementById('releaseDate').value || null
        };
        
        // Validar campos requeridos
        if (!formData.title || !formData.duration || !formData.price || !formData.cover) {
            showMessage('Por favor, completa todos los campos obligatorios', 'error');
            saveBtn.disabled = false;
            saveBtn.textContent = 'Guardar Cambios';
            return;
        }
        
        // Procesar géneros
        const genresInput = document.getElementById('genres').value.trim();
        if (genresInput) {
            formData.genres = genresInput.split(',')
                .map(id => parseInt(id.trim()))
                .filter(id => !isNaN(id));
            
            if (formData.genres.length === 0) {
                showMessage('Los géneros deben ser IDs numéricos válidos', 'error');
                saveBtn.disabled = false;
                saveBtn.textContent = 'Guardar Cambios';
                return;
            }
        } else {
            showMessage('Debes especificar al menos un género', 'error');
            saveBtn.disabled = false;
            saveBtn.textContent = 'Guardar Cambios';
            return;
        }
        
        // Procesar colaboradores (opcional)
        const collabsInput = document.getElementById('collaborators').value.trim();
        if (collabsInput) {
            formData.collaborators = collabsInput.split(',')
                .map(id => parseInt(id.trim()))
                .filter(id => !isNaN(id));
        } else {
            formData.collaborators = [];
        }
        
        try {
            const response = await fetch(`/song/${songId}/edit`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showMessage('Canción actualizada exitosamente', 'success');
                
                // Redirigir después de 1.5 segundos
                setTimeout(() => {
                    window.location.href = '/artist/studio';
                }, 1500);
            } else {
                throw new Error(result.message || result.detail || 'Error al actualizar la canción');
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage(error.message || 'Error de conexión con el servidor', 'error');
            
            saveBtn.disabled = false;
            saveBtn.textContent = 'Guardar Cambios';
        }
    });
    
    // Función auxiliar para mostrar mensajes
    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        
        // Scroll hacia el mensaje
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    // Preview de imagen al cambiar la URL
    const coverInput = document.getElementById('cover');
    coverInput.addEventListener('change', () => {
        const url = coverInput.value.trim();
        let previewContainer = document.querySelector('.preview-container');
        
        if (url) {
            if (!previewContainer) {
                previewContainer = document.createElement('div');
                previewContainer.className = 'preview-container';
                coverInput.parentElement.appendChild(previewContainer);
            }
            
            previewContainer.innerHTML = `<img src="${url}" alt="Vista previa" onerror="this.style.display='none'">`;
        } else if (previewContainer) {
            previewContainer.remove();
        }
    });
});
