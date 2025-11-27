document.addEventListener('DOMContentLoaded', function(){
    const form = document.getElementById('upload-merch-form');
    const uploadBtn = document.getElementById('upload-btn');
    const messageDiv = document.getElementById('message');
    const collaboratorsSelect = document.getElementById('collaborators');

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

    // Cargar artistas al iniciar
    loadArtists();

    form.addEventListener('submit', async function(e){
        e.preventDefault();
        uploadBtn.disabled = true;
        messageDiv.style.display = 'none';

        // Recoger datos del formulario
        const formData = {
            title: document.getElementById('title').value.trim(),
            price: parseFloat(document.getElementById('price').value),
            description: document.getElementById('description').value.trim(),
            cover: document.getElementById('cover').value.trim(),
            releaseDate: document.getElementById('releaseDate').value || null
        };

        // Procesar colaboradores seleccionados (multi-select, opcional)
        const selectedCollabs = Array.from(collaboratorsSelect.selectedOptions)
            .map(opt => parseInt(opt.value))
            .filter(id => !isNaN(id));
        
        if (selectedCollabs.length > 0) {
            formData.collaborators = selectedCollabs;
        }

        try{
            const resp = await fetch('/merch/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
                credentials: 'same-origin'
            });
            
            const data = await resp.json();
            
            if(resp.ok){
                messageDiv.className = 'message success';
                messageDiv.textContent = data.message || 'Merchandising subido exitosamente!';
                messageDiv.style.display = 'block';
                
                // Redirigir al merchandising después de 2 segundos
                setTimeout(() => {
                    if(data.merchId){
                        window.location.href = `/merch/${data.merchId}`;
                    } else {
                        window.location.href = '/artist/studio';
                    }
                }, 2000);
            } else {
                messageDiv.className = 'message error';
                messageDiv.textContent = data.error || 'No se pudo subir el merchandising.';
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
