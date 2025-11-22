document.addEventListener('DOMContentLoaded', function(){
    const form = document.getElementById('upload-merch-form');
    const uploadBtn = document.getElementById('upload-btn');
    const messageDiv = document.getElementById('message');

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

        // Procesar colaboradores (IDs separados por comas)
        const collabsInput = document.getElementById('collaborators').value.trim();
        if(collabsInput){
            formData.collaborators = collabsInput.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        }

        try{
            const resp = await fetch('/merch/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
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
