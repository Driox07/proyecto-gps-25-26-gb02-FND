document.addEventListener('DOMContentLoaded', function(){
    const form = document.getElementById('upload-song-form');

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

    // Configurar manejadores para archivos
    handleFileChange('audioFile', 'audioInfo', 'audio');
    handleFileChange('coverFile', 'coverInfo', 'image');

    form.addEventListener('submit', async function(e){
        e.preventDefault();
        const uploadBtn = document.getElementById('upload-btn');
        const messageDiv = document.getElementById('message');
        uploadBtn.disabled = true;
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

        if (!audioFile) {
            messageDiv.className = 'message error';
            messageDiv.textContent = 'Debes seleccionar un archivo de audio';
            messageDiv.style.display = 'block';
            uploadBtn.disabled = false;
            return;
        }

        if (!coverFile) {
            messageDiv.className = 'message error';
            messageDiv.textContent = 'Debes seleccionar una imagen de portada';
            messageDiv.style.display = 'block';
            uploadBtn.disabled = false;
            return;
        }

        try {
            const audioBase64 = await fileToBase64(audioFile);
            const coverBase64 = await fileToBase64(coverFile);

            // Procesar géneros seleccionados (multi-select)
            const selectedGenres = Array.from(document.getElementById('genres').selectedOptions)
                .map(opt => parseInt(opt.value))
                .filter(id => !isNaN(id));
            
            if (selectedGenres.length === 0) {
                messageDiv.className = 'message error';
                messageDiv.textContent = 'Debes seleccionar al menos un género';
                messageDiv.style.display = 'block';
                uploadBtn.disabled = false;
                return;
            }

            // Procesar colaboradores seleccionados (multi-select, opcional)
            const selectedCollabs = Array.from(document.getElementById('collaborators').selectedOptions)
                .map(opt => parseInt(opt.value))
                .filter(id => !isNaN(id));

            // Crear objeto JSON
            const data = {
                title: document.getElementById('title').value.trim(),
                price: parseFloat(document.getElementById('price').value),
                description: document.getElementById('description').value.trim() || null,
                releaseDate: document.getElementById('releaseDate').value || null,
                albumId: document.getElementById('albumId').value ? parseInt(document.getElementById('albumId').value) : null,
                genres: selectedGenres,
                collaborators: selectedCollabs,
                audioFile: audioBase64,
                coverFile: coverBase64,
                coverExtension: coverFile.name.split('.').pop().toLowerCase()
            };

            const resp = await fetch('/song/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
                credentials: 'same-origin'
            });
            
            const responseData = await resp.json();
            
            if(responseData.success){
                messageDiv.className = 'message success';
                messageDiv.textContent = responseData.message || 'Canción subida exitosamente!';
                messageDiv.style.display = 'block';
                
                // Redirigir al perfil del artista después de 2 segundos
                setTimeout(() => {
                    if(responseData.songId){
                        window.location.href = `/song/${responseData.songId}`;
                    } else {
                        window.location.href = '/artist/studio';
                    }
                }, 2000);
            } else {
                messageDiv.className = 'message error';
                messageDiv.textContent = responseData.message || 'No se pudo subir la canción.';
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
