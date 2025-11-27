document.addEventListener('DOMContentLoaded', function(){
    const form = document.getElementById('upload-album-form');
    const uploadBtn = document.getElementById('upload-btn');
    const messageDiv = document.getElementById('message');
    const songsSelect = document.getElementById('songs');

    // Cargar canciones del artista desde el microservicio TYA
    async function loadSongs() {
        try {
            const resp = await fetch('/api/my-songs', {
                credentials: 'same-origin'
            });
            if (resp.ok) {
                const songs = await resp.json();
                songsSelect.innerHTML = '';
                
                if (songs.length === 0) {
                    songsSelect.innerHTML = '<option value="" disabled>No tienes canciones creadas aún</option>';
                } else {
                    songs.forEach(song => {
                        const option = document.createElement('option');
                        option.value = song.songId;
                        option.textContent = song.title || `Canción ${song.songId}`;
                        songsSelect.appendChild(option);
                    });
                }
            } else {
                songsSelect.innerHTML = '<option value="" disabled>Error al cargar canciones</option>';
                console.error('Error cargando canciones:', resp.status);
            }
        } catch (err) {
            console.error('Error cargando canciones:', err);
            songsSelect.innerHTML = '<option value="" disabled>Error de conexión</option>';
        }
    }

    // Cargar las canciones al iniciar
    loadSongs();

    form.addEventListener('submit', async function(e){
        e.preventDefault();
        uploadBtn.disabled = true;
        messageDiv.style.display = 'none';

        // Recoger datos del formulario
        const formData = {
            title: document.getElementById('title').value.trim(),
            price: parseFloat(document.getElementById('price').value),
            description: document.getElementById('description').value.trim() || null,
            cover: document.getElementById('cover').value.trim() || null,
            releaseDate: document.getElementById('releaseDate').value || null
        };

        // Procesar canciones seleccionadas (multi-select)
        const selectedSongs = Array.from(songsSelect.selectedOptions)
            .map(opt => parseInt(opt.value))
            .filter(id => !isNaN(id));
        
        if (selectedSongs.length > 0) {
            formData.songs = selectedSongs;
        } else {
            messageDiv.className = 'message error';
            messageDiv.textContent = 'Debes seleccionar al menos una canción para el álbum';
            messageDiv.style.display = 'block';
            uploadBtn.disabled = false;
            return;
        }

        try{
            const resp = await fetch('/album/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
                credentials: 'same-origin'
            });
            
            const data = await resp.json();
            
            if(resp.ok){
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
                messageDiv.textContent = data.error || 'No se pudo crear el álbum.';
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
