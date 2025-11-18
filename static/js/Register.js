document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const payload = {
            nick: form.nick.value.trim(),
            nombre: form.nombre.value.trim(),
            apellido1: form.apellido1.value.trim(),
            apellido2: form.apellido2.value.trim(),
            email: form.email.value.trim(),
            contrasena: form.contrasena.value
        };

        try {
            const registerBtn = document.getElementById('reg-btn');
            const registerUrl = registerBtn.getAttribute('data-register-url');
            const res = await fetch(registerUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            const json = await res.json();
            if(res.ok()){
                window.location.href = '/';
            }else{
                alert('Error durante el registro: ' + json.message)
            }
        } catch (err) {
            console.error('Error enviando datos:', err);
            alert('Error al enviar datos: ' + (err.message || err));
        }
    });
});
