document.addEventListener('DOMContentLoaded', function(){
    const form = document.getElementById('edit-song-form');
    const songIdElement = document.getElementById('songId');
    if (!songIdElement) {
        console.error('songId element not found');
        return;
    }
    const songId = songIdElement.value;

    // Función para manejar cambio de archivo
    function handleFileChange(inputId, infoId, type) {
        const input = document.getElementById(inputId);
        const info = document.getElementById(infoId);
        
        input.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                info.innerHTML = `<div class="current-cover"><p>Nueva portada seleccionada:</p><img src="${URL.createObjectURL(file)}" alt="Nueva portada" style="max-width: 200px; border-radius: 8px; margin-top: 10px;"></div>`;
                info.style.color = '#28a745';
            } else {
                // Restaurar la portada actual
                const currentCover = document.querySelector('.current-cover');
                if (currentCover) {
                    info.innerHTML = currentCover.outerHTML;
                } else {
                    info.textContent = 'No hay portada actual';
                }
            }
        });
    }

    // Configurar manejadores para archivos
    handleFileChange('audioFile', 'audioInfo', 'audio');
    handleFileChange('coverFile', 'coverInfo', 'image');

    form.addEventListener('submit', async function(e){
        e.preventDefault();
        const saveBtn = document.getElementById('save-btn');
        const messageDiv = document.getElementById('message');
        saveBtn.disabled = true;
        messageDiv.style.display = 'none';

        // Función para convertir archivo a base64
        function fileToBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result.split(',')[1]); // Remover el prefijo data:...
                reader.onerror = error => reject(error);
            });
        }

        // Obtener archivos y convertir a base64
        const audioFile = document.getElementById('audioFile').files[0];
        const coverFile = document.getElementById('coverFile').files[0];

        // Verificar que los elementos del formulario existan
        const titleEl = document.getElementById('title');
        const priceEl = document.getElementById('price');
        const descriptionEl = document.getElementById('description');
        const releaseDateEl = document.getElementById('releaseDate');
        const genresEl = document.getElementById('genres');
        const collaboratorsEl = document.getElementById('collaborators');

        let missingElements = [];
        if (!titleEl) missingElements.push('Título');
        if (!priceEl) missingElements.push('Precio');
        if (!descriptionEl) missingElements.push('Descripción');
        if (!releaseDateEl) missingElements.push('Fecha de lanzamiento');
        if (!genresEl) missingElements.push('Géneros');
        if (!collaboratorsEl) missingElements.push('Colaboradores');

        if (missingElements.length > 0) {
            messageDiv.className = 'message error';
            messageDiv.textContent = 'Elementos del formulario faltantes: ' + missingElements.join(', ') + '. Los campos obligatorios son: Título, Precio, Géneros.';
            messageDiv.style.display = 'block';
            saveBtn.disabled = false;
            return;
        }

        try {
            let audioBase64 = null;
            if (audioFile) {
                audioBase64 = await fileToBase64(audioFile);
            }

            let coverBase64 = null;
            let coverExtension = null;
            if (coverFile) {
                coverBase64 = await fileToBase64(coverFile);
                coverExtension = coverFile.name.split('.').pop().toLowerCase();
            }

            // Procesar géneros seleccionados (multi-select)
            const selectedGenres = Array.from(genresEl.selectedOptions)
                .map(opt => parseInt(opt.value))
                .filter(id => !isNaN(id));
            
            // Procesar colaboradores seleccionados (multi-select, opcional)
            const selectedCollabs = Array.from(collaboratorsEl.selectedOptions)
                .map(opt => parseInt(opt.value))
                .filter(id => !isNaN(id));

            // Verificar campos obligatorios
            let missingFields = [];
            if (titleEl.value.trim() === '') missingFields.push('Título');
            if (priceEl.value === '' || isNaN(parseFloat(priceEl.value)) || parseFloat(priceEl.value) <= 0) missingFields.push('Precio (debe ser un número positivo)');
            if (selectedGenres.length === 0) missingFields.push('Géneros');

            if (missingFields.length > 0) {
                messageDiv.className = 'message error';
                messageDiv.textContent = 'Los siguientes campos son obligatorios: ' + missingFields.join(', ');
                messageDiv.style.display = 'block';
                saveBtn.disabled = false;
                return;
            }

            // Crear objeto JSON
            const data = {
                title: titleEl.value.trim(),
                price: parseFloat(priceEl.value),
                description: descriptionEl.value.trim() || null,
                releaseDate: releaseDateEl.value || null,
                genres: selectedGenres,
                collaborators: selectedCollabs
            };

            if (audioBase64) {
                data.audioFile = audioBase64;
            }

            if (coverBase64) {
                data.coverFile = coverBase64;
                data.coverExtension = coverExtension;
            }

            const resp = await fetch(`/song/${songId}/edit`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
                credentials: 'same-origin'
            });
            
            const responseData = await resp.json();
            
            if(responseData.message && resp.ok){
                messageDiv.className = 'message success';
                messageDiv.textContent = responseData.message || 'Canción actualizada exitosamente!';
                messageDiv.style.display = 'block';
                
                // Redirigir al perfil del artista después de 2 segundos
                setTimeout(() => {
                    window.location.href = `/song/${songId}`;
                }, 2000);
            } else {
                messageDiv.className = 'message error';
                messageDiv.textContent = responseData.message || 'No se pudo actualizar la canción.';
                messageDiv.style.display = 'block';
                saveBtn.disabled = false;
            }
        } catch(err){
            console.error('Error:', err);
            messageDiv.className = 'message error';
            messageDiv.textContent = 'Error de conexión. Intenta de nuevo.';
            messageDiv.style.display = 'block';
            saveBtn.disabled = false;
        }
    });
});
