// Cart.js - Gestión completa del carrito de compras desde el servidor
console.log('Cart.js: File loaded successfully - version with debug');

(function() {
    console.log('Cart.js: IIFE executed');

    function initCart() {
        console.log('Cart.js: initCart called');
        try {
            initializeCart();
        } catch (error) {
            console.error('Cart.js: Error in initializeCart:', error);
        }
    }

    if (document.readyState === 'loading') {
        console.log('Cart.js: DOM still loading, adding event listener');
        document.addEventListener('DOMContentLoaded', initCart);
    } else {
        console.log('Cart.js: DOM already loaded, calling initCart immediately');
        initCart();
    }
})();

/**
 * Inicializa todos los componentes del carrito
 */
function initializeCart() {
    console.log('Cart.js: Initializing cart...');
    try {
        loadCartFromServer();
        setupEventListeners();
        checkAuthenticationStatus();
    } catch (error) {
        console.error('Cart.js: Error in initializeCart:', error);
    }
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
 * Carga el carrito desde el servidor
 */
async function loadCartFromServer() {
    console.log('Cart.js: Loading cart from server...');
    try {
        const response = await fetch('/cart', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });

        console.log('Cart.js: Cart response status:', response.status);

        if (response.ok) {
            window.currentCart = await response.json();
            console.log('Cart.js: Cart loaded:', window.currentCart);
        } else if (response.status === 401) {
            console.log('Cart.js: User not authenticated, cart empty');
            // No autenticado, carrito vacío
            window.currentCart = [];
        } else {
            console.error('Cart.js: Error loading cart from server');
            window.currentCart = [];
        }
    } catch (error) {
        console.error('Cart.js: Error loading cart:', error);
        window.currentCart = [];
    }

    updateCartDisplay();
}

/**
 * Elimina un producto del servidor
 */
async function removeProductFromServer(productId, productType) {
    const url = `/cart/${productId}?type=${productType}`;
    console.log('Enviando petición DELETE a:', url);
    console.log('ProductId:', productId, 'ProductType:', productType);
    console.log('Configuración de fetch - credentials: include');
    
    // Verificar si hay cookie de auth
    const authCookie = document.cookie.split(';').find(c => c.trim().startsWith('oversound_auth='));
    console.log('Cookie oversound_auth presente:', !!authCookie);
    if (authCookie) {
        console.log('Valor de cookie (mascarado):', authCookie.split('=')[1].substring(0, 10) + '...');
    }
    
    try {
        const response = await fetch(url, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });

        console.log('Respuesta del servidor - Status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Error eliminando del servidor:', errorData);
            return false;
        }

        console.log('Producto eliminado del servidor exitosamente');
        return true;

    } catch (error) {
        console.error('Error en la petición:', error);
        return false;
    }
}

/**
 * Actualiza la visualización del carrito
 */
function updateCartDisplay() {
    console.log('Cart.js: Updating cart display, current cart:', window.currentCart);
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

    const price = parseFloat(item.price || 0);
    const totalPrice = price.toFixed(2);

    // Obtener URL de imagen
    let imageUrl = '';
    let itemCover = TYA_SERVER + '/static' + (item.cover || '');

    if (item.song_id) {
        imageUrl = (item.cover) ? itemCover : '/static/img/utils/default-song.svg';
    } else if (item.album_id) {
        imageUrl = (item.cover) ? itemCover : '/static/img/utils/default-album.svg';
    } else if (item.merch_id) {
        imageUrl = (item.cover) ? itemCover : '/static/img/utils/default-merch.svg';
    } else {
        imageUrl = '/static/img/utils/default-song.svg'; // fallback
    }

    // Determinar tipo de producto
    let productType = 'Producto';
    let productId = null;
    let typeParam = null;
    
    if (item.song_id) {
        productType = 'song';
        productId = item.song_id;
        typeParam = '0';
    } else if (item.album_id) {
        productType = 'album';
        productId = item.album_id;
        typeParam = '1';
    } else if (item.merch_id) {
        productType = 'merch';
        productId = item.merch_id;
        typeParam = '2';
    }

    const productTypeLabel = productType === 'song' ? 'Canción' : productType === 'album' ? 'Álbum' : 'Merchandising';

    div.innerHTML = `
        <img src="${imageUrl}" alt="${item.name}" class="cart-item-image">
        
        <div class="cart-item-info">
            <h3 class="cart-item-name">${item.name}</h3>
            <p class="cart-item-type">${productTypeLabel}</p>
            <p class="cart-item-price">€${price.toFixed(2)}</p>
        </div>

        <div class="cart-item-controls">
            <div class="cart-item-total">€${totalPrice}</div>
            <button class="btn-remove" data-index="${index}" data-product-id="${productId}" data-product-type="${typeParam}">Eliminar</button>
        </div>
    `;

    // Event listener para el botón de eliminar
    const removeBtn = div.querySelector('.btn-remove');
    if (removeBtn) {
        removeBtn.addEventListener('click', () => openDeleteModal(index, productId, typeParam));
    }

    return div;
}

/**
 * Abre el modal de confirmación de eliminación
 */
function openDeleteModal(index, productId, productType) {
    window.deleteItemIndex = index;
    window.deleteProductId = productId;
    window.deleteProductType = productType;
    
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
    window.deleteProductId = null;
    window.deleteProductType = null;
}

/**
 * Confirma la eliminación del producto
 */
async function confirmDeleteProduct() {
    const index = window.deleteItemIndex;
    const productId = window.deleteProductId;
    const productType = window.deleteProductType;
    
    if (index !== null && window.currentCart[index] && productId) {
        const productName = window.currentCart[index].name;
        
        // Eliminar del servidor
        const success = await removeProductFromServer(productId, productType);
        
        if (success) {
            // Recargar el carrito desde el servidor
            await loadCartFromServer();
            closeDeleteModal();
            showNotification(`${productName} eliminado del carrito`);
            
            // Emitir evento para actualizar el header
            window.dispatchEvent(new CustomEvent('cartUpdated'));
        } else {
            showNotification('Error al eliminar el producto');
            closeDeleteModal();
        }
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

    // Guardar información de envío temporalmente
    window.shippingInfo = shippingInfo;

    closeShippingModal();
    showNotification('Dirección de envío confirmada');

    // Proceder con el pago
    processPay();
}

/**
 * Maneja el proceso de checkout
 */
async function handleCheckout() {
    console.log('Cart.js: Handle checkout called');
    const btnCheckout = document.getElementById('btn-checkout');
    if (!btnCheckout || btnCheckout.disabled) {
        console.log('Cart.js: Checkout button disabled or not found');
        return;
    }

    // Verificar si hay productos en el carrito
    if (!window.currentCart || window.currentCart.length === 0) {
        console.log('Cart.js: Cart is empty');
        showNotification('El carrito está vacío');
        return;
    }

    console.log('Cart.js: Opening shipping modal');
    // Solicitar información de dirección
    openShippingModal();
}

/**
 * Procesa el pago enviando la compra al backend
 */
async function processPay() {
    console.log('Cart.js: Processing payment');
    try {
        showNotification('Procesando pago...');

        // Obtener método de pago seleccionado
        const selectedPayment = document.querySelector('input[name="payment-method"]:checked');
        console.log('Cart.js: Selected payment method element:', selectedPayment);
        if (!selectedPayment) {
            console.log('Cart.js: No payment method selected');
            showNotification('Por favor selecciona un método de pago');
            return;
        }
        const paymentMethodId = selectedPayment.value;
        console.log('Cart.js: Payment method ID:', paymentMethodId);

        // Preparar datos según el esquema de la API
        // Nota: Se usa camelCase porque el modelo Purchase de TPP tiene attribute_map
        const purchaseData = {
            purchasePrice: calculateTotal(),
            purchaseDate: new Date().toISOString(),
            paymentMethodId: parseInt(paymentMethodId),
            songIds: [],
            albumIds: [],
            merchIds: []
        };

        // Extraer IDs según tipo de producto
        window.currentCart.forEach(item => {
            if (item.songId) {
                purchaseData.songIds.push(item.songId);
            } else if (item.albumId) {
                purchaseData.albumIds.push(item.albumId);
            } else if (item.merchId) {
                purchaseData.merchIds.push(item.merchId);
            }
        });

        // Realizar la compra mediante POST /purchase
        const response = await fetch('/purchase', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(purchaseData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Cart.js: Payment failed:', errorData);
            throw new Error(errorData.message || errorData.error || 'Error al procesar la compra');
        }

        const result = await response.json();
        console.log('Cart.js: Payment successful:', result);
        
        showNotification('¡Compra realizada con éxito!');
        
        // Limpiar el carrito localmente (el backend ya lo limpia en BD)
        window.currentCart = [];
        updateCartDisplay();
        
        // Emitir evento para actualizar el contador del header
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        
        // Redirigir a la página principal después de 2 segundos
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);

    } catch (error) {
        console.error('Cart.js: Payment error:', error);
        showNotification(`Error: ${error.message}`);
    }
}

/**
 * Calcula el subtotal del carrito (sin IVA)
 */
function calculateSubtotal() {
    let subtotal = 0;
    window.currentCart.forEach(item => {
        const price = parseFloat(item.price || 0);
        subtotal += price;
    });
    return subtotal;
}

/**
 * Calcula el total del carrito (con IVA incluido)
 */
function calculateTotal() {
    const subtotal = calculateSubtotal();
    const tax = subtotal * 0.21;
    return subtotal + tax;
}

/**
 * Actualiza el resumen del pedido
 */
function updateSummary() {
    const subtotalElement = document.getElementById('subtotal');
    const taxElement = document.getElementById('tax');
    const totalElement = document.getElementById('total');

    const subtotal = calculateSubtotal();
    const tax = subtotal * 0.21;
    const total = calculateTotal();

    if (subtotalElement) subtotalElement.textContent = `€${subtotal.toFixed(2)}`;
    if (taxElement) taxElement.textContent = `€${tax.toFixed(2)}`;
    if (totalElement) totalElement.textContent = `€${total.toFixed(2)}`;
}

/**
 * Verifica el estado de autenticación y los métodos de pago
 */
async function checkAuthenticationStatus() {
    console.log('Cart.js: Checking authentication status...');
    try {
        const response = await fetch('/payment', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });

        console.log('Cart.js: Payment methods response status:', response.status);

        const checkoutSection = document.getElementById('checkout-section');
        const noPaymentMethod = document.getElementById('no-payment-method');
        const notAuthenticated = document.getElementById('not-authenticated');
        const btnCheckout = document.getElementById('btn-checkout');

        // Limpiar las vistas
        if (noPaymentMethod) noPaymentMethod.style.display = 'none';
        if (notAuthenticated) notAuthenticated.style.display = 'none';
        if (checkoutSection) checkoutSection.style.display = 'flex';

        if (response.status === 401) {
            console.log('Cart.js: User not authenticated');
            // No autenticado
            if (checkoutSection) checkoutSection.style.display = 'none';
            if (notAuthenticated) notAuthenticated.style.display = 'block';
            if (btnCheckout) btnCheckout.disabled = true;
        } else if (response.ok) {
            const paymentMethods = await response.json();
            console.log('Cart.js: Payment methods received:', paymentMethods);

            if (!paymentMethods || paymentMethods.length === 0) {
                console.log('Cart.js: No payment methods found, showing no-payment-method section');
                // Sin métodos de pago
                if (checkoutSection) checkoutSection.style.display = 'none';
                if (noPaymentMethod) noPaymentMethod.style.display = 'block';
                if (btnCheckout) btnCheckout.disabled = true;
                const paymentSection = document.getElementById('payment-selection-section');
                if (paymentSection) paymentSection.style.display = 'none';
            } else {
                console.log('Cart.js: Payment methods found, showing payment selection section');
                // Autenticado y con métodos de pago
                populatePaymentMethodsGrid(paymentMethods);
                if (checkoutSection) checkoutSection.style.display = 'flex';
                if (noPaymentMethod) noPaymentMethod.style.display = 'none';
                if (notAuthenticated) notAuthenticated.style.display = 'none';
                if (btnCheckout) btnCheckout.disabled = false;
                const paymentSection = document.getElementById('payment-selection-section');
                if (paymentSection) paymentSection.style.display = 'block';
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
 * Puebla el grid de métodos de pago con tarjetas seleccionables
 */
function populatePaymentMethodsGrid(paymentMethods) {
    console.log('Cart.js: Populating payment methods grid with', paymentMethods.length, 'methods');
    const grid = document.getElementById('payment-methods-grid');
    if (!grid) {
        console.error('Cart.js: payment-methods-grid element not found');
        return;
    }

    grid.innerHTML = paymentMethods.map((method, index) => {
        // Mapear campos de la respuesta
        const cardHolder = method.card_holder || method.cardHolder || '';
        const cardNumber = method.card_number || method.cardNumber || '';
        const expireMonth = method.expire_month || method.expireMonth || 0;
        const expireYear = method.expire_year || method.expireYear || 0;
        const id = method.id || method.paymentMethodId;
        
        // Extraer últimos 4 dígitos del cardNumber
        const lastFour = cardNumber.slice(-4);
        
        // Formatear fecha de expiración
        const expireMonthStr = String(expireMonth).padStart(2, '0');
        const expireYearStr = String(expireYear).slice(-2);
        const expiry = `${expireMonthStr}/${expireYearStr}`;
        
        // Detectar tipo de tarjeta por los primeros dígitos
        const cardType = detectCardType(cardNumber);
        
        return `
        <div class="payment-card" data-payment-id="${id}">
            <div class="card-radio">
                <input type="radio" name="payment-method" value="${id}" id="payment-${id}" ${index === 0 ? 'checked' : ''}>
                <label for="payment-${id}"></label>
            </div>
            <div class="card-details">
                <div class="card-logo">${getCardLogo(cardType)}</div>
                <div class="card-number">•••• •••• •••• ${lastFour}</div>
                <div class="card-name">${cardHolder}</div>
                <div class="card-expiry">Vence: ${expiry}</div>
                <div class="card-type">${cardType}</div>
            </div>
        </div>
    `;
    }).join('');

    console.log('Cart.js: Payment methods grid HTML generated');

    // Add event listeners for selection
    grid.querySelectorAll('.payment-card').forEach(card => {
        card.addEventListener('click', () => {
            console.log('Cart.js: Payment card clicked');
            const radio = card.querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;
                updateSelectedCard();
            }
        });
    });

    // Add event listeners for radio buttons
    grid.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', updateSelectedCard);
    });
}

/**
 * Actualiza la visualización de la tarjeta seleccionada
 */
function updateSelectedCard() {
    console.log('Cart.js: Updating selected card');
    const cards = document.querySelectorAll('.payment-card');
    cards.forEach(card => {
        card.classList.remove('selected');
    });
    
    const selectedRadio = document.querySelector('input[name="payment-method"]:checked');
    if (selectedRadio) {
        const selectedCard = selectedRadio.closest('.payment-card');
        if (selectedCard) {
            selectedCard.classList.add('selected');
            console.log('Cart.js: Selected payment method:', selectedRadio.value);
        }
    } else {
        console.log('Cart.js: No payment method selected');
    }
}

/**
 * Detecta el tipo de tarjeta basado en el número
 */
function detectCardType(cardNumber) {
    if (!cardNumber) return 'Desconocido';
    
    const number = cardNumber.replace(/\s/g, '');
    
    if (number.startsWith('4')) return 'Visa';
    if (number.startsWith('5') || number.startsWith('2')) return 'Mastercard';
    if (number.startsWith('3')) return 'American Express';
    if (number.startsWith('6')) return 'Discover';
    
    return 'Crédito';
}

/**
 * Obtiene el logo de la tarjeta
 */
function getCardLogo(cardType) {
    switch (cardType.toLowerCase()) {
        case 'visa': return 'VISA';
        case 'mastercard': return 'MC';
        case 'american express': return 'AMEX';
        case 'discover': return 'DISC';
        default: return 'CARD';
    }
}

/**
 * Muestra una notificación flotante
 */
function showNotification(message) {
    const notification = document.getElementById('cart-notification');
    if (!notification) {
        // Crear notificación si no existe
        const notif = document.createElement('div');
        notif.id = 'cart-notification';
        notif.style.cssText = 'position:fixed;top:20px;right:20px;background:#4CAF50;color:white;padding:15px 20px;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,0.1);z-index:10000;';
        notif.textContent = message;
        document.body.appendChild(notif);
        
        setTimeout(() => {
            notif.remove();
        }, 3000);
        return;
    }

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
 * Escuchar eventos de actualización del carrito
 */
window.addEventListener('cartUpdated', function() {
    loadCartFromServer();
});
