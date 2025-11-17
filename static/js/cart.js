// Cart.js - Gestión completa del carrito de compras

document.addEventListener('DOMContentLoaded', function() {
    initializeCart();
});

/**
 * Inicializa todos los componentes del carrito
 */
function initializeCart() {
    loadCart();
    setupEventListeners();
    updateCartDisplay();
    checkAuthenticationStatus();
}

/**
 * Configura todos los event listeners
 */
function setupEventListeners() {
    // Modal de confirmación de eliminación
    const deleteModal = document.getElementById('delete-modal');
    const modalCancel = document.getElementById('modal-cancel');
    const modalConfirmDelete = document.getElementById('modal-confirm-delete');

    if (modalCancel) {
        modalCancel.addEventListener('click', closeDeleteModal);
    }
    if (modalConfirmDelete) {
        modalConfirmDelete.addEventListener('click', confirmDeleteProduct);
    }
    if (deleteModal) {
        deleteModal.addEventListener('click', function(e) {
            if (e.target === deleteModal) {
                closeDeleteModal();
            }
        });
    }

    // Modal de dirección de envío
    const shippingModal = document.getElementById('shipping-modal');
    const formCancel = document.getElementById('form-cancel');
    const shippingForm = document.getElementById('shipping-form');

    if (formCancel) {
        formCancel.addEventListener('click', closeShippingModal);
    }
    if (shippingForm) {
        shippingForm.addEventListener('submit', handleShippingSubmit);
    }
    if (shippingModal) {
        shippingModal.addEventListener('click', function(e) {
            if (e.target === shippingModal) {
                closeShippingModal();
            }
        });
    }

    // Botón de checkout
    const btnCheckout = document.getElementById('btn-checkout');
    if (btnCheckout) {
        btnCheckout.addEventListener('click', handleCheckout);
    }

    // Botón de agregar método de pago
    const btnAddPayment = document.getElementById('btn-add-payment');
    if (btnAddPayment) {
        btnAddPayment.addEventListener('click', function() {
            window.location.href = '/profile';
        });
    }
}

/**
 * Carga el carrito desde localStorage
 */
function loadCart() {
    window.currentCart = JSON.parse(localStorage.getItem('oversound_cart')) || [];
}

/**
 * Sincroniza un producto con el backend (POST /cart)
 */
async function syncAddToBackend(product) {
    try {
        const response = await fetch('/cart', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                productId: product.id,
                productType: product.type,
                quantity: product.quantity || 1,
                price: product.price
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.warn('Error sincronizando con backend:', errorData);
            // Continuar con localStorage como fallback
            return false;
        }

        console.log('Producto sincronizado con backend');
        return true;

    } catch (error) {
        console.warn('No se pudo sincronizar con backend, usando localStorage:', error);
        // Fallback a localStorage solamente
        return false;
    }
}

/**
 * Sincroniza la eliminación de un producto con el backend (DELETE /cart/{productId})
 */
async function syncRemoveFromBackend(productId) {
    try {
        const response = await fetch(`/cart/${productId}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.warn('Error eliminando del backend:', errorData);
            return false;
        }

        console.log('Producto eliminado del backend');
        return true;

    } catch (error) {
        console.warn('No se pudo eliminar del backend, usando localStorage:', error);
        return false;
    }
}

/**
 * Actualiza la visualización del carrito
 */
function updateCartDisplay() {
    const cartItems = document.getElementById('cart-items');
    const emptyCart = document.getElementById('empty-cart');
    const summaryContent = document.getElementById('summary-content');

    if (!window.currentCart || window.currentCart.length === 0) {
        // Mostrar carrito vacío
        if (cartItems) cartItems.style.display = 'none';
        if (emptyCart) emptyCart.style.display = 'flex';
        if (summaryContent) summaryContent.style.display = 'none';
        return;
    }

    // Mostrar carrito con productos
    if (cartItems) cartItems.style.display = 'flex';
    if (emptyCart) emptyCart.style.display = 'none';
    if (summaryContent) summaryContent.style.display = 'flex';

    // Renderizar productos
    cartItems.innerHTML = '';
    window.currentCart.forEach((item, index) => {
        const cartItemElement = createCartItemElement(item, index);
        cartItems.appendChild(cartItemElement);
    });

    // Actualizar resumen
    updateSummary();
}

/**
 * Crea el elemento HTML para un producto del carrito
 */
function createCartItemElement(item, index) {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.dataset.index = index;

    const quantity = item.quantity || 1;
    const price = parseFloat(item.price.toString().replace('€', '').replace(',', '.')) || 0;
    const totalPrice = (price * quantity).toFixed(2);

    // Obtener URL de imagen por defecto
    const imageUrl = item.image || 'https://via.placeholder.com/120?text=Producto';

    div.innerHTML = `
        <img src="${imageUrl}" alt="${item.name}" class="cart-item-image" onerror="this.src='https://via.placeholder.com/120?text=Sin+Imagen'">
        
        <div class="cart-item-info">
            <h3 class="cart-item-name">${item.name}</h3>
            <p class="cart-item-artist">${item.artist || 'Artista desconocido'}</p>
            <p class="cart-item-type">${item.type === 'cancion' ? 'Canción' : item.type === 'album' ? 'Álbum' : item.type}</p>
            <p class="cart-item-price">€${price.toFixed(2)}</p>
        </div>

        <div class="cart-item-controls">
            <div class="quantity-control">
                <button class="quantity-btn minus-btn" data-index="${index}">−</button>
                <input type="number" class="quantity-input" value="${quantity}" min="1" max="99" data-index="${index}">
                <button class="quantity-btn plus-btn" data-index="${index}">+</button>
            </div>
            <div class="cart-item-total">€${totalPrice}</div>
            <button class="btn-remove" data-index="${index}">Eliminar</button>
        </div>
    `;

    // Event listeners para los botones del item
    const minusBtn = div.querySelector('.minus-btn');
    const plusBtn = div.querySelector('.plus-btn');
    const quantityInput = div.querySelector('.quantity-input');
    const removeBtn = div.querySelector('.btn-remove');

    if (minusBtn) minusBtn.addEventListener('click', () => decreaseQuantity(index));
    if (plusBtn) plusBtn.addEventListener('click', () => increaseQuantity(index));
    if (quantityInput) {
        quantityInput.addEventListener('change', (e) => updateQuantity(index, parseInt(e.target.value)));
        quantityInput.addEventListener('input', (e) => {
            const value = parseInt(e.target.value) || 1;
            if (value < 1) e.target.value = 1;
            if (value > 99) e.target.value = 99;
        });
    }
    if (removeBtn) removeBtn.addEventListener('click', () => openDeleteModal(index));

    return div;
}

/**
 * Aumenta la cantidad de un producto
 */
function increaseQuantity(index) {
    if (window.currentCart[index]) {
        const maxQuantity = 99;
        const currentQty = window.currentCart[index].quantity || 1;
        if (currentQty < maxQuantity) {
            window.currentCart[index].quantity = currentQty + 1;
            saveCart();
            updateCartDisplay();
        }
    }
}

/**
 * Disminuye la cantidad de un producto
 */
function decreaseQuantity(index) {
    if (window.currentCart[index]) {
        const currentQty = window.currentCart[index].quantity || 1;
        if (currentQty > 1) {
            window.currentCart[index].quantity = currentQty - 1;
            saveCart();
            updateCartDisplay();
        }
    }
}

/**
 * Actualiza la cantidad de un producto
 */
function updateQuantity(index, newQuantity) {
    if (window.currentCart[index]) {
        newQuantity = Math.max(1, Math.min(99, newQuantity));
        window.currentCart[index].quantity = newQuantity;
        saveCart();
        updateCartDisplay();
    }
}

/**
 * Abre el modal de confirmación de eliminación
 */
function openDeleteModal(index) {
    window.deleteItemIndex = index;
    const modal = document.getElementById('delete-modal');
    const productName = window.currentCart[index]?.name || 'este producto';
    const modalMessage = document.getElementById('modal-message');

    if (modalMessage) {
        modalMessage.textContent = `¿Estás seguro de que deseas eliminar "${productName}" del carrito?`;
    }

    if (modal) {
        modal.style.display = 'flex';
        modal.style.animation = 'fadeIn 0.3s ease-out';
    }
}

/**
 * Cierra el modal de eliminación
 */
function closeDeleteModal() {
    const modal = document.getElementById('delete-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    window.deleteItemIndex = null;
}

/**
 * Confirma la eliminación del producto
 */
function confirmDeleteProduct() {
    const index = window.deleteItemIndex;
    if (index !== null && window.currentCart[index]) {
        const product = window.currentCart[index];
        const productName = product.name;
        const productId = product.id;
        
        // Eliminar del backend
        syncRemoveFromBackend(productId);
        
        // Eliminar del carrito local
        window.currentCart.splice(index, 1);
        saveCart();
        updateCartDisplay();
        closeDeleteModal();
        showNotification(`${productName} eliminado del carrito`);
    }
}

/**
 * Abre el modal de dirección de envío
 */
function openShippingModal() {
    const modal = document.getElementById('shipping-modal');
    if (modal) {
        modal.style.display = 'flex';
        modal.style.animation = 'fadeIn 0.3s ease-out';
    }
}

/**
 * Cierra el modal de dirección de envío
 */
function closeShippingModal() {
    const modal = document.getElementById('shipping-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Maneja el envío del formulario de dirección
 */
function handleShippingSubmit(e) {
    e.preventDefault();

    const formData = new FormData(document.getElementById('shipping-form'));
    const shippingInfo = {
        fullName: formData.get('full-name'),
        address: formData.get('address'),
        city: formData.get('city'),
        postalCode: formData.get('postal-code'),
        country: formData.get('country'),
        phone: formData.get('phone')
    };

    // Guardar información de envío
    localStorage.setItem('oversound_shipping', JSON.stringify(shippingInfo));

    closeShippingModal();
    showNotification('Dirección de envío confirmada');

    // Proceder con el pago (simulado)
    processPay();
}

/**
 * Maneja el proceso de checkout
 */
async function handleCheckout() {
    const btnCheckout = document.getElementById('btn-checkout');
    if (!btnCheckout || btnCheckout.disabled) return;

    // Verificar si hay productos en el carrito
    if (!window.currentCart || window.currentCart.length === 0) {
        showNotification('El carrito está vacío');
        return;
    }

    // Solicitar información de dirección
    openShippingModal();
}

/**
 * Procesa el pago enviando la compra al backend
 */
async function processPay() {
    try {
        showNotification('Procesando pago...');

        // Obtener método de pago seleccionado
        const paymentMethodId = document.getElementById('payment-method-select')?.value;
        if (!paymentMethodId) {
            showNotification('Por favor selecciona un método de pago');
            return;
        }

        const shippingInfo = JSON.parse(localStorage.getItem('oversound_shipping'));
        
        // Realizar la compra mediante POST /purchase
        const response = await fetch('/purchase', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                cartItems: window.currentCart,
                paymentMethodId: paymentMethodId,
                shippingAddress: shippingInfo
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al procesar la compra');
        }

        const purchaseData = await response.json();
        
        // Limpiar localStorage después de compra exitosa
        localStorage.removeItem('oversound_cart');
        localStorage.removeItem('oversound_shipping');
        
        showNotification('¡Compra realizada con éxito!');
        
        // Redirigir a la página principal después de 2 segundos
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);

    } catch (error) {
        console.error('Error en el pago:', error);
        showNotification(`Error: ${error.message}`);
    }
}

/**
 * Actualiza el resumen del pedido
 */
function updateSummary() {
    const subtotalElement = document.getElementById('subtotal');
    const taxElement = document.getElementById('tax');
    const totalElement = document.getElementById('total');

    let subtotal = 0;

    window.currentCart.forEach(item => {
        const quantity = item.quantity || 1;
        const price = parseFloat(item.price.toString().replace('€', '').replace(',', '.')) || 0;
        subtotal += price * quantity;
    });

    const tax = subtotal * 0.21;
    const total = subtotal + tax;

    if (subtotalElement) subtotalElement.textContent = `€${subtotal.toFixed(2)}`;
    if (taxElement) taxElement.textContent = `€${tax.toFixed(2)}`;
    if (totalElement) totalElement.textContent = `€${total.toFixed(2)}`;
}

/**
 * Guarda el carrito en localStorage
 */
function saveCart() {
    localStorage.setItem('oversound_cart', JSON.stringify(window.currentCart));
    updateCartDisplay();

    // Emitir evento personalizado para actualizar el header
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: window.currentCart }));
}

/**
 * Verifica el estado de autenticación y los métodos de pago
 */
async function checkAuthenticationStatus() {
    try {
        const response = await fetch('/payment', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });

        const checkoutSection = document.getElementById('checkout-section');
        const noPaymentMethod = document.getElementById('no-payment-method');
        const notAuthenticated = document.getElementById('not-authenticated');
        const btnCheckout = document.getElementById('btn-checkout');

        // Limpiar las vistas
        if (noPaymentMethod) noPaymentMethod.style.display = 'none';
        if (notAuthenticated) notAuthenticated.style.display = 'none';
        if (checkoutSection) checkoutSection.style.display = 'flex';

        if (response.status === 401) {
            // No autenticado
            if (checkoutSection) checkoutSection.style.display = 'none';
            if (notAuthenticated) notAuthenticated.style.display = 'block';
            if (btnCheckout) btnCheckout.disabled = true;
        } else if (response.ok) {
            const data = await response.json();
            const paymentMethods = data.payment_methods || [];

            if (paymentMethods.length === 0) {
                // Sin métodos de pago
                if (checkoutSection) checkoutSection.style.display = 'none';
                if (noPaymentMethod) noPaymentMethod.style.display = 'block';
                if (btnCheckout) btnCheckout.disabled = true;
            } else {
                // Autenticado y con métodos de pago
                if (checkoutSection) checkoutSection.style.display = 'flex';
                if (noPaymentMethod) noPaymentMethod.style.display = 'none';
                if (notAuthenticated) notAuthenticated.style.display = 'none';
                if (btnCheckout) btnCheckout.disabled = false;
            }
        } else {
            console.error('Error al verificar métodos de pago');
        }
    } catch (error) {
        console.error('Error al verificar autenticación:', error);
        
        // Mostrar sección de no autenticado por defecto
        const checkoutSection = document.getElementById('checkout-section');
        const notAuthenticated = document.getElementById('not-authenticated');
        const btnCheckout = document.getElementById('btn-checkout');

        if (checkoutSection) checkoutSection.style.display = 'none';
        if (notAuthenticated) notAuthenticated.style.display = 'block';
        if (btnCheckout) btnCheckout.disabled = true;
    }
}

/**
 * Muestra una notificación flotante
 */
function showNotification(message) {
    const notification = document.getElementById('cart-notification');
    if (!notification) return;

    const notificationText = document.getElementById('notification-text');
    if (notificationText) {
        notificationText.textContent = message;
    }

    notification.style.display = 'flex';
    notification.style.animation = 'slideInRight 0.4s ease-out';

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.4s ease-out';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 400);
    }, 3000);
}

/**
 * Manejo de eventos globales del carrito
 */
window.addEventListener('storage', function(e) {
    if (e.key === 'oversound_cart') {
        loadCart();
        updateCartDisplay();
    }
});

/**
 * Utilidades para debugging
 */
window.cartUtils = {
    getCart: () => window.currentCart,
    clearCart: () => {
        localStorage.removeItem('oversound_cart');
        window.currentCart = [];
        updateCartDisplay();
    },
    addTestProduct: () => {
        window.currentCart.push({
            id: 'test-' + Date.now(),
            type: 'cancion',
            name: 'Test Song',
            artist: 'Test Artist',
            price: '1.29',
            quantity: 1
        });
        saveCart();
    }
};
