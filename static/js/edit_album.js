document.addEventListener('DOMContentLoaded', function(){
    const form = document.getElementById('edit-album-form');
    const albumIdElement = document.getElementById('albumId');
    if (!albumIdElement) {
        console.error('albumId element not found');
        return;
    }
    const albumId = albumIdElement.value;
    const songSelect = document.getElementById('song-select');
    const addSongBtn = document.getElementById('add-song-btn');
    const albumSongsList = document.getElementById('album-songs');
    let albumSongs = []; // Array de {songId, title, duration}
    let allSongs = []; // Array de todas las canciones disponibles

    // Cargar canciones existentes desde el data attribute
    const existingSongsData = albumSongsList.getAttribute('data-existing-songs');
    if (existingSongsData) {
        try {
            albumSongs = JSON.parse(existingSongsData);
            updateAlbumSongsDisplay();
        } catch (e) {
            console.error('Error parsing existing songs:', e);
        }
    }

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
    handleFileChange('coverFile', 'coverInfo', 'image');

    // Cargar canciones disponibles
    loadSongs();

    // Event listener para añadir canción
    addSongBtn.addEventListener('click', function() {
        const selectedSongId = songSelect.value;
        if (!selectedSongId) return;
        
        const selectedOption = songSelect.querySelector(`option[value="${selectedSongId}"]`);
        if (!selectedOption) return;
        
        const songTitle = selectedOption.textContent.split(' (')[0];
        const durationMatch = selectedOption.textContent.match(/\((\d+):(\d+)\)/);
        const duration = durationMatch ? parseInt(durationMatch[1]) * 60 + parseInt(durationMatch[2]) : 0;
        
        // Verificar si ya está añadida
        if (albumSongs.some(s => s.songId == selectedSongId)) {
            alert('Esta canción ya está en el álbum');
            return;
        }
        
        albumSongs.push({ songId: parseInt(selectedSongId), title: songTitle, duration: duration });
        updateAlbumSongsDisplay();
        updateSongSelect();
        
        // Reset select
        songSelect.value = '';
    });

    // Event listener para remover canciones
    albumSongsList.addEventListener('click', function(e) {
        if (e.target.classList.contains('song-remove')) {
            const songId = parseInt(e.target.getAttribute('data-song-id'));
            albumSongs = albumSongs.filter(s => s.songId !== songId);
            updateAlbumSongsDisplay();
            updateSongSelect();
        }
    });

    // Función para cargar las canciones del artista
    async function loadSongs() {
        try {
            const resp = await fetch('/api/my-songs', {
                credentials: 'same-origin'
            });
            if (resp.ok) {
                const songs = await resp.json();
                allSongs = songs; // Guardar todas las canciones
                updateSongSelect();
            } else {
                songSelect.innerHTML = '<option value="" disabled>Error al cargar canciones</option>';
                console.error('Error cargando canciones:', resp.status);
            }
        } catch (err) {
            console.error('Error cargando canciones:', err);
            songSelect.innerHTML = '<option value="" disabled>Error de conexión</option>';
        }
    }

    // Función para actualizar el select de canciones
    function updateSongSelect() {
        songSelect.innerHTML = '<option value="" disabled selected>Selecciona una canción...</option>';
        
        if (allSongs.length === 0) {
            songSelect.innerHTML = '<option value="" disabled>No tienes canciones creadas aún</option>';
        } else {
            allSongs.forEach(song => {
                if (!albumSongs.some(s => s.songId == song.songId)) {
                    const option = document.createElement('option');
                    option.value = song.songId;
                    option.textContent = `${song.title} (${Math.floor(song.duration / 60)}:${String(song.duration % 60).padStart(2, '0')})`;
                    songSelect.appendChild(option);
                }
            });
        }
    }

    // Actualizar la visualización de las canciones del álbum
    function updateAlbumSongsDisplay() {
        if (albumSongs.length === 0) {
            albumSongsList.innerHTML = '<p style="color: #999; font-style: italic;">No hay canciones añadidas aún</p>';
            return;
        }

        albumSongsList.innerHTML = '';
        albumSongs.forEach((song, index) => {
            const songItem = document.createElement('div');
            songItem.className = 'song-item';
            songItem.innerHTML = `
                <div class="song-info">
                    <span class="song-title">${song.title}</span>
                    <span class="song-duration">(${Math.floor(song.duration / 60)}:${String(song.duration % 60).padStart(2, '0')})</span>
                </div>
                <button type="button" class="song-remove" data-song-id="${song.songId}">Eliminar</button>
            `;
            albumSongsList.appendChild(songItem);
        });
    }

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
                collaborators: selectedCollabs,
                songs: albumSongs.map(s => s.songId)
            };

            if (coverBase64) {
                data.coverFile = coverBase64;
                data.coverExtension = coverExtension;
            }

            const resp = await fetch(`/album/${albumId}/edit`, {
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
                messageDiv.textContent = responseData.message || 'Álbum actualizado exitosamente!';
                messageDiv.style.display = 'block';
                
                // Redirigir al perfil del artista después de 2 segundos
                setTimeout(() => {
                    window.location.href = `/album/${albumId}`;
                }, 2000);
            } else {
                messageDiv.className = 'message error';
                messageDiv.textContent = responseData.message || 'No se pudo actualizar el álbum.';
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