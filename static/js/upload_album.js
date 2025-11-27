document.addEventListener('DOMContentLoaded', function(){
    const form = document.getElementById('upload-album-form');
    const uploadBtn = document.getElementById('upload-btn');
    const messageDiv = document.getElementById('message');
    const songSelect = document.getElementById('song-select');
    const addSongBtn = document.getElementById('add-song-btn');
    const albumSongsList = document.getElementById('album-songs');
    const coverUploadPanel = document.getElementById('cover-upload-panel');
    const coverInput = document.getElementById('cover');
    const coverInfo = document.getElementById('cover-info');

    let albumSongs = []; // Array de {songId, title}

    // Función para convertir archivo a base64
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]); // Remover el prefijo data:...
            reader.onerror = error => reject(error);
        });
    }

    // Manejar subida de cover
    coverUploadPanel.addEventListener('click', () => coverInput.click());
    coverInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            coverInfo.textContent = `Seleccionado: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
            coverInfo.style.color = '#28a745';
        } else {
            coverInfo.textContent = 'No se ha seleccionado ninguna imagen';
            coverInfo.style.color = '#666';
        }
    });

    // Cargar canciones del artista desde el microservicio TYA
    async function loadSongs() {
        try {
            const resp = await fetch('/api/my-songs', {
                credentials: 'same-origin'
            });
            if (resp.ok) {
                const songs = await resp.json();
                songSelect.innerHTML = '<option value="" disabled selected>Selecciona una canción...</option>';
                
                if (songs.length === 0) {
                    songSelect.innerHTML = '<option value="" disabled>No tienes canciones creadas aún</option>';
                } else {
                    songs.forEach(song => {
                        const option = document.createElement('option');
                        option.value = song.songId;
                        option.textContent = song.title || `Canción ${song.songId}`;
                        songSelect.appendChild(option);
                    });
                }
            } else {
                songSelect.innerHTML = '<option value="" disabled>Error al cargar canciones</option>';
                console.error('Error cargando canciones:', resp.status);
            }
        } catch (err) {
            console.error('Error cargando canciones:', err);
            songSelect.innerHTML = '<option value="" disabled>Error de conexión</option>';
        }
    }

    // Cargar las canciones al iniciar
    loadSongs();

    // Añadir canción al álbum
    addSongBtn.addEventListener('click', function() {
        const selectedSongId = parseInt(songSelect.value);
        if (!selectedSongId) return;

        const option = songSelect.querySelector(`option[value="${selectedSongId}"]`);
        if (!option) return;

        // Verificar si ya está añadida
        if (albumSongs.some(s => s.songId === selectedSongId)) {
            alert('Esta canción ya está en el álbum');
            return;
        }

        albumSongs.push({ songId: selectedSongId, title: option.textContent });
        updateAlbumSongsDisplay();
        songSelect.value = '';
    });

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
            songItem.draggable = true;
            songItem.dataset.index = index;

            songItem.innerHTML = `
                <span class="song-title">${index + 1}. ${song.title}</span>
                <button class="song-remove" data-index="${index}">Eliminar</button>
            `;

            // Evento para eliminar
            songItem.querySelector('.song-remove').addEventListener('click', function() {
                albumSongs.splice(index, 1);
                updateAlbumSongsDisplay();
            });

            // Eventos para drag and drop
            songItem.addEventListener('dragstart', handleDragStart);
            songItem.addEventListener('dragover', handleDragOver);
            songItem.addEventListener('drop', handleDrop);
            songItem.addEventListener('dragend', handleDragEnd);

            albumSongsList.appendChild(songItem);
        });
    }

    // Variables para drag and drop
    let draggedElement = null;

    function handleDragStart(e) {
        draggedElement = e.target;
        e.target.classList.add('dragging');
    }

    function handleDragOver(e) {
        e.preventDefault();
    }

    function handleDrop(e) {
        e.preventDefault();
        const target = e.target.closest('.song-item');
        if (!target || target === draggedElement) return;

        const draggedIndex = parseInt(draggedElement.dataset.index);
        const targetIndex = parseInt(target.dataset.index);

        // Reordenar array
        const [removed] = albumSongs.splice(draggedIndex, 1);
        albumSongs.splice(targetIndex, 0, removed);

        updateAlbumSongsDisplay();
    }

    function handleDragEnd(e) {
        e.target.classList.remove('dragging');
        draggedElement = null;
    }

    form.addEventListener('submit', async function(e){
        e.preventDefault();
        uploadBtn.disabled = true;
        messageDiv.style.display = 'none';

        // Validar que haya cover
        const coverFile = coverInput.files[0];
        if (!coverFile) {
            messageDiv.className = 'message error';
            messageDiv.textContent = 'Debes seleccionar una imagen de portada';
            messageDiv.style.display = 'block';
            uploadBtn.disabled = false;
            return;
        }

        // Validar que haya canciones
        if (albumSongs.length === 0) {
            messageDiv.className = 'message error';
            messageDiv.textContent = 'Debes añadir al menos una canción al álbum';
            messageDiv.style.display = 'block';
            uploadBtn.disabled = false;
            return;
        }

        try {
            // Convertir cover a base64
            const coverBase64 = await fileToBase64(coverFile);

            // Preparar datos
            const formData = {
                title: document.getElementById('title').value.trim(),
                price: parseFloat(document.getElementById('price').value),
                description: document.getElementById('description').value.trim() || null,
                releaseDate: document.getElementById('releaseDate').value || null,
                coverFile: coverBase64,
                coverExtension: coverFile.name.split('.').pop().toLowerCase(),
                songs: albumSongs.map(s => s.songId)
            };

            const resp = await fetch('/album/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
                credentials: 'same-origin'
            });
            
            const data = await resp.json();
            
            if(data.success){
                messageDiv.className = 'message success';
                messageDiv.textContent = data.message || 'Álbum creado exitosamente!';
                messageDiv.style.display = 'block';
                
                // Redirigir al álbum después de 2 segundos
                setTimeout(() => {
                    if(data.albumId){
                        window.location.href = `/album/${data.albumId}`;
                    } else {
                        window.location.href = '/artist/studio';
                    }
                }, 2000);
            } else {
                messageDiv.className = 'message error';
                messageDiv.textContent = data.message || 'No se pudo crear el álbum.';
                messageDiv.style.display = 'block';
                uploadBtn.disabled = false;
            }
        } catch(err){
            console.error('Error:', err);
            messageDiv.className = 'message error';
            messageDiv.textContent = 'Error de conexión. Intenta de nuevo.';
            messageDiv.style.display = 'block';
            uploadBtn.disabled = false;
        }
    });
});
