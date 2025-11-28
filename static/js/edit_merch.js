document.addEventListener('DOMContentLoaded', function(){
    const form = document.getElementById('edit-merch-form');
    const saveBtn = document.getElementById('save-btn');
    const messageDiv = document.getElementById('message');
    const merchId = document.getElementById('merchId').value;
    const collaboratorsSelect = document.getElementById('collaborators');

    // Función para manejar cambio de archivo
    function handleFileChange(inputId, infoId, type) {
        const input = document.getElementById(inputId);
        const info = document.getElementById(infoId);
        
        input.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                info.textContent = `Seleccionado: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
                info.style.color = '#28a745';
            } else {
                info.textContent = '';
            }
        });
    }

    // Configurar manejador para la imagen de portada
    handleFileChange('cover', 'coverInfo', 'image');

    // Cargar artistas disponibles para colaborar desde el microservicio TYA
    async function loadArtists() {
        try {
            const resp = await fetch('/api/artists', {
                credentials: 'same-origin'
            });
            if (resp.ok) {
                const artists = await resp.json();
                collaboratorsSelect.innerHTML = '';
                
                if (artists.length === 0) {
                    const option = document.createElement('option');
                    option.value = '';
                    option.disabled = true;
                    option.textContent = 'No hay otros artistas disponibles';
                    collaboratorsSelect.appendChild(option);
                } else {
                    // Obtener colaboradores actuales
                    const currentCollabs = document.getElementById('currentCollaborators').value;
                    const currentCollabIds = currentCollabs ? currentCollabs.split(',').map(id => parseInt(id.trim())) : [];
                    
                    artists.forEach(artist => {
                        const option = document.createElement('option');
                        option.value = artist.artistId;
                        option.textContent = artist.artisticName || `Artista ${artist.artistId}`;
                        
                        // Marcar como seleccionado si es un colaborador actual
                        if (currentCollabIds.includes(parseInt(artist.artistId))) {
                            option.selected = true;
                        }
                        
                        collaboratorsSelect.appendChild(option);
                    });
                }
            } else {
                collaboratorsSelect.innerHTML = '<option value="" disabled>Error al cargar artistas</option>';
                console.error('Error cargando artistas:', resp.status);
            }
        } catch (err) {
            console.error('Error cargando artistas:', err);
            collaboratorsSelect.innerHTML = '<option value="" disabled>Error de conexión</option>';
        }
    }

    // Cargar artistas al iniciar
    loadArtists();

    form.addEventListener('submit', async function(e){
        e.preventDefault();
        saveBtn.disabled = true;
        saveBtn.textContent = 'Guardando...';

        // Función para convertir archivo a base64
        function fileToBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            });
        }

        // Preparar datos del formulario
        const formData = {
            title: document.getElementById('title').value.trim(),
            price: parseFloat(document.getElementById('price').value),
            description: document.getElementById('description').value.trim(),
            releaseDate: document.getElementById('releaseDate').value || null
        };

        // Procesar colaboradores seleccionados (multi-select, opcional)
        const selectedCollabs = Array.from(collaboratorsSelect.selectedOptions)
            .map(opt => parseInt(opt.value))
            .filter(id => !isNaN(id));
        formData.collaborators = selectedCollabs;

        // Procesar imagen (opcional - solo si se seleccionó una nueva)
        const coverFile = document.getElementById('cover').files[0];
        if (coverFile) {
            try {
                const coverBase64 = await fileToBase64(coverFile);
                formData.cover = coverBase64;
            } catch (error) {
                showMessage('Error al procesar la imagen', 'error');
                saveBtn.disabled = false;
                saveBtn.textContent = 'Guardar Cambios';
                return;
            }
        }
        // Si no se seleccionó nueva imagen, no se incluye 'cover' en formData (mantendrá la actual)

        try {
            const response = await fetch(`/merch/${merchId}/edit`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                showMessage('Merchandising actualizado exitosamente', 'success');

                // Redirigir después de 1.5 segundos
                setTimeout(() => {
                    window.location.href = '/artist/studio';
                }, 1500);
            } else {
                throw new Error(result.message || result.detail || 'Error al actualizar el merchandising');
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
});
