document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const payload = {
            nick: form.nick.value.trim(),
            contrasena: form.contrasena.value
        };

        try {
            const loginBtn = document.getElementById('login-btn');
            const loginUrl = loginBtn.getAttribute('data-login-url');
            const res = await fetch(loginUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            const json = await res.json();
            console.log('Respuesta del servidor:', json);
            
            // Si el login es exitoso, redirigir a la página principal
            if (res.ok) {
                alert('¡Inicio de sesión exitoso!');
                window.location.href = '/';
            } else {
                // Mostrar error si el login falla
                alert('Error: ' + (json.message || 'Credenciales incorrectas'));
            }
        } catch (err) {
            console.error('Error enviando datos:', err);
            alert('Error al enviar datos: ' + (err.message || err));
        }
    });
});
