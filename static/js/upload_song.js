document.addEventListener('DOMContentLoaded', function(){
    const form = document.getElementById('upload-song-form');
    const uploadBtn = document.getElementById('upload-btn');
    const messageDiv = document.getElementById('message');
    const genresSelect = document.getElementById('genres');
    const collaboratorsSelect = document.getElementById('collaborators');
    const albumSelect = document.getElementById('albumId');

    // Cargar géneros desde el microservicio TYA
    async function loadGenres() {
        try {
            const resp = await fetch('/api/genres', {
                credentials: 'same-origin'
            });
            if (resp.ok) {
                const genres = await resp.json();
                genresSelect.innerHTML = '';
                
                if (genres.length === 0) {
                    genresSelect.innerHTML = '<option value="" disabled>No hay géneros disponibles</option>';
                } else {
                    genres.forEach(genre => {
                        const option = document.createElement('option');
                        option.value = genre.id;
                        option.textContent = genre.name;
                        genresSelect.appendChild(option);
                    });
                }
            } else {
                genresSelect.innerHTML = '<option value="" disabled>Error al cargar géneros</option>';
                console.error('Error cargando géneros:', resp.status);
            }
        } catch (err) {
            console.error('Error cargando géneros:', err);
            genresSelect.innerHTML = '<option value="" disabled>Error de conexión</option>';
        }
    }

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
                    artists.forEach(artist => {
                        const option = document.createElement('option');
                        option.value = artist.artistId;
                        option.textContent = artist.artisticName || `Artista ${artist.artistId}`;
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

    // Cargar álbumes del artista desde el microservicio TYA
    async function loadAlbums() {
        try {
            const resp = await fetch('/api/my-albums', {
                credentials: 'same-origin'
            });
            if (resp.ok) {
                const albums = await resp.json();
                // Mantener la primera opción "Sin álbum"
                albumSelect.innerHTML = '<option value="">Sin álbum (single)</option>';
                
                if (albums.length > 0) {
                    albums.forEach(album => {
                        const option = document.createElement('option');
                        option.value = album.albumId;
                        option.textContent = album.title || `Álbum ${album.albumId}`;
                        albumSelect.appendChild(option);
                    });
                } else {
                    const option = document.createElement('option');
                    option.disabled = true;
                    option.textContent = '(No tienes álbumes creados)';
                    albumSelect.appendChild(option);
                }
            } else {
                console.error('Error cargando álbumes:', resp.status);
            }
        } catch (err) {
            console.error('Error cargando álbumes:', err);
        }
    }

    // Cargar todos los datos al iniciar la página
    loadGenres();
    loadArtists();
    loadAlbums();

    form.addEventListener('submit', async function(e){
        e.preventDefault();
        uploadBtn.disabled = true;
        messageDiv.style.display = 'none';

        // Recoger datos del formulario
        const formData = {
            title: document.getElementById('title').value.trim(),
            duration: parseInt(document.getElementById('duration').value),
            price: parseFloat(document.getElementById('price').value),
            description: document.getElementById('description').value.trim() || null,
            trackId: parseInt(document.getElementById('trackId').value),
            cover: document.getElementById('cover').value.trim(),
            releaseDate: document.getElementById('releaseDate').value || null,
            albumId: albumSelect.value ? parseInt(albumSelect.value) : null
        };

        // Procesar géneros seleccionados (multi-select)
        const selectedGenres = Array.from(genresSelect.selectedOptions)
            .map(opt => parseInt(opt.value))
            .filter(id => !isNaN(id));
        
        if (selectedGenres.length > 0) {
            formData.genres = selectedGenres;
        } else {
            messageDiv.className = 'message error';
            messageDiv.textContent = 'Debes seleccionar al menos un género';
            messageDiv.style.display = 'block';
            uploadBtn.disabled = false;
            return;
        }

        // Procesar colaboradores seleccionados (multi-select, opcional)
        const selectedCollabs = Array.from(collaboratorsSelect.selectedOptions)
            .map(opt => parseInt(opt.value))
            .filter(id => !isNaN(id));
        
        if (selectedCollabs.length > 0) {
            formData.collaborators = selectedCollabs;
        }

        try{
            const resp = await fetch('/song/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
                credentials: 'same-origin'
            });
            
            const data = await resp.json();
            
            if(resp.ok){
                messageDiv.className = 'message success';
                messageDiv.textContent = data.message || 'Canción subida exitosamente!';
                messageDiv.style.display = 'block';
                
                // Redirigir al perfil del artista después de 2 segundos
                setTimeout(() => {
                    if(data.songId){
                        window.location.href = `/song/${data.songId}`;
                    } else {
                        window.location.href = '/artist/studio';
                    }
                }, 2000);
            } else {
                messageDiv.className = 'message error';
                messageDiv.textContent = data.error || 'No se pudo subir la canción.';
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
