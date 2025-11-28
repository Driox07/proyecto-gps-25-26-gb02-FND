document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('edit-album-form');
    const saveBtn = document.getElementById('save-btn');
    const messageDiv = document.getElementById('message');
    const albumId = document.getElementById('albumId').value;
    
    // Cargar canciones del artista
    loadSongs();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        saveBtn.disabled = true;
        saveBtn.textContent = 'Guardando...';
        
        // Preparar datos del formulario
        const formData = {
            title: document.getElementById('title').value.trim(),
            price: parseFloat(document.getElementById('price').value),
            description: document.getElementById('description').value.trim() || null,
            cover: document.getElementById('cover').value.trim(),
            releaseDate: document.getElementById('releaseDate').value || null
        };
        
        // Validar campos requeridos
        if (!formData.title || !formData.price || !formData.cover) {
            showMessage('Por favor, completa todos los campos obligatorios', 'error');
            saveBtn.disabled = false;
            saveBtn.textContent = 'Guardar Cambios';
            return;
        }
        
        // Procesar canciones
        const songsSelect = document.getElementById('songs');
        const selectedSongs = Array.from(songsSelect.selectedOptions).map(opt => parseInt(opt.value));
        
        if (selectedSongs.length === 0) {
            showMessage('Un álbum debe contener al menos una canción', 'error');
            saveBtn.disabled = false;
            saveBtn.textContent = 'Guardar Cambios';
            return;
        }
        
        formData.songs = selectedSongs;
        
        try {
            const response = await fetch(`/album/${albumId}/edit`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showMessage('Álbum actualizado exitosamente', 'success');
                
                // Redirigir después de 1.5 segundos
                setTimeout(() => {
                    window.location.href = '/artist/studio';
                }, 1500);
            } else {
                throw new Error(result.message || result.detail || 'Error al actualizar el álbum');
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
    
    // Función para cargar las canciones del artista
    async function loadSongs() {
        const songsSelect = document.getElementById('songs');
        
        try {
            const response = await fetch('/api/my-songs', {
                credentials: 'same-origin'
            });
            
            if (response.ok) {
                const songs = await response.json();
                songsSelect.innerHTML = '';
                
                if (songs.length === 0) {
                    songsSelect.innerHTML = '<option value="">No tienes canciones disponibles</option>';
                    return;
                }
                
                // Obtener las canciones actuales del álbum del input hidden o data attribute
                const currentSongsInput = document.getElementById('songs');
                const currentSongs = currentSongsInput.dataset.currentSongs ? 
                    currentSongsInput.dataset.currentSongs.split(',').map(id => parseInt(id)) : [];
                
                songs.forEach(song => {
                    const option = document.createElement('option');
                    option.value = song.songId;
                    option.textContent = `${song.title} ${song.duration ? '(' + Math.floor(song.duration/60) + ':' + String(song.duration%60).padStart(2,'0') + ')' : ''}`;
                    
                    // Preseleccionar si la canción está en el álbum actual
                    if (currentSongs.includes(song.songId)) {
                        option.selected = true;
                    }
                    
                    songsSelect.appendChild(option);
                });
            } else {
                songsSelect.innerHTML = '<option value="">Error al cargar canciones</option>';
            }
        } catch (error) {
            console.error('Error cargando canciones:', error);
            songsSelect.innerHTML = '<option value="">Error de conexión</option>';
        }
    }
});