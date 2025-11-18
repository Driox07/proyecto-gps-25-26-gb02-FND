document.addEventListener('DOMContentLoaded', function(){
    const form = document.getElementById('forgot-form');
    const emailInput = document.getElementById('email');
    const btn = document.getElementById('send-btn');
    const messageDiv = document.getElementById('message');

    form.addEventListener('submit', async function(e){
        e.preventDefault();
        const email = emailInput.value.trim();
        if(!email) return;
        btn.disabled = true;
        messageDiv.style.display = 'none';

        try{
            const resp = await fetch('/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await resp.json();
            if(resp.ok){
                // Mostrar mensaje de éxito (simulado)
                messageDiv.className = 'message success';
                messageDiv.textContent = data.message || 'Se ha enviado el correo (simulado). Revisa tu bandeja.';
                messageDiv.style.display = 'block';
                // Opcional: ocultar el formulario
                form.style.display = 'none';
            } else {
                messageDiv.className = 'message error';
                messageDiv.textContent = data.error || 'No se pudo enviar el correo.';
                messageDiv.style.display = 'block';
            }
        } catch(err){
            messageDiv.className = 'message error';
            messageDiv.textContent = 'Error de conexión. Intenta de nuevo.';
            messageDiv.style.display = 'block';
        } finally{
            btn.disabled = false;
        }
    });
});