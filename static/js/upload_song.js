document.addEventListener('DOMContentLoaded', function(){
    const form = document.getElementById('upload-song-form');
    const uploadBtn = document.getElementById('upload-btn');
    const messageDiv = document.getElementById('message');

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
            audioUrl: document.getElementById('audioUrl').value.trim(),
            cover: document.getElementById('cover').value.trim() || null,
            releaseDate: document.getElementById('releaseDate').value || null,
            albumId: document.getElementById('albumId').value ? parseInt(document.getElementById('albumId').value) : null
        };

        // Procesar géneros (IDs separados por comas)
        const genresInput = document.getElementById('genres').value.trim();
        if(genresInput){
            formData.genres = genresInput.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        }

        // Procesar colaboradores (IDs separados por comas)
        const collabsInput = document.getElementById('collaborators').value.trim();
        if(collabsInput){
            formData.collaborators = collabsInput.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        }

        try{
            const resp = await fetch('/song/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
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
