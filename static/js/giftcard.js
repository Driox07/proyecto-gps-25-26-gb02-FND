// Gift Card Page Functionality

document.addEventListener('DOMContentLoaded', function() {
    initializeGiftCard();
});

/**
 * Inicializa todos los componentes de la página de tarjetas regalo
 */
function initializeGiftCard() {
    setupAmountButtons();
    setupCustomAmount();
    setupMessageCounter();
    setupPurchaseButton();
    setupModalClosers();
}

/**
 * Configura los botones de montos predefinidos
 */
function setupAmountButtons() {
    const amountButtons = document.querySelectorAll('.amount-btn');
    
    amountButtons.forEach(button => {
        button.addEventListener('click', function() {
            const amount = this.dataset.amount;
            
            // Remover clase activa de todos los botones
            amountButtons.forEach(btn => btn.classList.remove('active'));
            
            // Agregar clase activa al botón clickeado
            this.classList.add('active');
            
            // Actualizar input personalizado y previsualizaciones
            document.getElementById('custom-amount').value = amount;
            updateAmountDisplay(amount);
        });
    });

    // Seleccionar primer botón por defecto
    if (amountButtons.length > 0) {
        amountButtons[1].click(); // Seleccionar €25 por defecto
    }
}

/**
 * Configura el input personalizado de monto
 */
function setupCustomAmount() {
    const customAmountInput = document.getElementById('custom-amount');
    
    customAmountInput.addEventListener('change', function() {
        const amount = parseFloat(this.value);
        
        // Validar rango
        if (amount < 5) {
            this.value = 5;
            showNotification('El monto mínimo es €5', 'warning');
        } else if (amount > 500) {
            this.value = 500;
            showNotification('El monto máximo es €500', 'warning');
        }
        
        // Actualizar display
        updateAmountDisplay(this.value);
        
        // Remover selección de botones predefinidos
        document.querySelectorAll('.amount-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    });

    customAmountInput.addEventListener('input', function() {
        const amount = parseFloat(this.value) || 0;
        if (amount > 0) {
            updateAmountDisplay(amount);
        }
    });
}

/**
 * Actualiza la visualización de montos en todos lados
 */
function updateAmountDisplay(amount) {
    const amountNum = parseFloat(amount);
    const formattedAmount = new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amountNum);

    // Actualizar vista previa de tarjeta
    document.getElementById('preview-amount').textContent = formattedAmount;

    // Actualizar resumen
    document.getElementById('summary-amount').textContent = formattedAmount;
    
    // Calcular y mostrar comisión (0 para este caso, pero puede cambiar)
    const fee = 0;
    const feeFormatted = new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(fee);
    document.getElementById('summary-fee').textContent = feeFormatted;

    // Total
    const total = amountNum + fee;
    const totalFormatted = new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(total);
    document.getElementById('summary-total').textContent = totalFormatted;
}

/**
 * Configura el contador de caracteres del mensaje
 */
function setupMessageCounter() {
    const messageTextarea = document.getElementById('gift-message');
    
    messageTextarea.addEventListener('input', function() {
        const charCount = this.value.length;
        document.getElementById('char-count').textContent = charCount;
    });
}

/**
 * Configura el botón de compra
 */
function setupPurchaseButton() {
    const purchaseBtn = document.getElementById('purchase-btn');
    
    purchaseBtn.addEventListener('click', processPurchase);
}

/**
 * Procesa la compra de la tarjeta regalo
 */
async function processPurchase() {
    const amount = parseFloat(document.getElementById('custom-amount').value);
    const email = document.getElementById('recipient-email').value;
    const message = document.getElementById('gift-message').value;

    // Validaciones
    if (amount < 5 || amount > 500) {
        showErrorModal('Por favor, selecciona un monto válido entre €5 y €500');
        return;
    }

    if (!email || !isValidEmail(email)) {
        showErrorModal('Por favor, ingresa un email válido');
        return;
    }

    // Mostrar cargando
    const purchaseBtn = document.getElementById('purchase-btn');
    const originalText = purchaseBtn.innerHTML;
    purchaseBtn.disabled = true;
    purchaseBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10"></circle><path d="M12 2C6.48 2 2 6.48 2 12"></path></svg>Procesando...';

    try {
        // Simular llamada a servidor (reemplazar con endpoint real)
        const response = await fetch('/giftcard', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: amount,
                recipient_email: email,
                message: message
            })
        });

        if (response.ok) {
            const data = await response.json();
            showSuccessModal(data.code, email);
        } else if (response.status === 401) {
            window.location.href = '/login';
        } else {
            const error = await response.json();
            showErrorModal(error.message || 'Error al procesar la compra');
        }
    } catch (error) {
        console.error('Error:', error);
        showErrorModal('Error de conexión. Por favor, intenta de nuevo.');
    } finally {
        purchaseBtn.disabled = false;
        purchaseBtn.innerHTML = originalText;
    }
}

/**
 * Valida si una cadena es un email válido
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Muestra el modal de éxito
 */
function showSuccessModal(code, email) {
    document.getElementById('modal-code').textContent = code;
    document.getElementById('modal-email').textContent = email;
    document.getElementById('confirmation-modal').style.display = 'flex';
}

/**
 * Muestra el modal de error
 */
function showErrorModal(message) {
    document.getElementById('error-message').textContent = message;
    document.getElementById('error-modal').style.display = 'flex';
}

/**
 * Cierra el modal de error
 */
function closeErrorModal() {
    document.getElementById('error-modal').style.display = 'none';
}

/**
 * Configura los botones de cerrar modal
 */
function setupModalClosers() {
    const modalCloseButtons = document.querySelectorAll('.modal-close');
    
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });

    // Cerrar modal al hacer click fuera
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    });
}

/**
 * Continúa comprando después de una compra exitosa
 */
function continueShopping() {
    document.getElementById('confirmation-modal').style.display = 'none';
    // Limpiar formulario
    document.getElementById('custom-amount').value = 50;
    document.getElementById('recipient-email').value = '';
    document.getElementById('gift-message').value = '';
    document.getElementById('char-count').textContent = '0';
    updateAmountDisplay(50);
    // Re-seleccionar botón por defecto
    document.querySelectorAll('.amount-btn')[1].click();
}

/**
 * Va a la página de inicio
 */
function goToHome() {
    window.location.href = '/';
}

/**
 * Muestra una notificación (puede integrarse con un sistema existente)
 */
function showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    // Aquí se puede integrar con un sistema de notificaciones existente
}

// Agregar animación spin si no existe
if (!document.querySelector('style[data-gift-card]')) {
    const style = document.createElement('style');
    style.setAttribute('data-gift-card', 'true');
    style.textContent = `
        @keyframes spin {
            from {
                transform: rotate(0deg);
            }
            to {
                transform: rotate(360deg);
            }
        }
    `;
    document.head.appendChild(style);
}
