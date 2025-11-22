// Cart.js - Gestión completa del carrito de compras desde el servidor

document.addEventListener('DOMContentLoaded', function() {
    initializeCart();
});

/**
 * Inicializa todos los componentes del carrito
 */
function initializeCart() {
    loadCartFromServer();
    setupEventListeners();
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
 * Carga el carrito desde el servidor
 */
async function loadCartFromServer() {
    try {
        const response = await fetch('/cart', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            window.currentCart = await response.json();
        } else if (response.status === 401) {
            // No autenticado, carrito vacío
            window.currentCart = [];
        } else {
            console.error('Error al cargar carrito del servidor');
            window.currentCart = [];
        }
    } catch (error) {
        console.error('Error cargando carrito:', error);
        window.currentCart = [];
    }

    updateCartDisplay();
}

/**
 * Elimina un producto del servidor
 */
async function removeProductFromServer(productId, productType) {
    try {
        const response = await fetch(`/cart/${productId}?type=${productType}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Error eliminando del servidor:', errorData);
            return false;
        }

        console.log('Producto eliminado del servidor');
        return true;

    } catch (error) {
        console.error('Error eliminando producto:', error);
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

    const price = parseFloat(item.price || 0);
    const totalPrice = price.toFixed(2);

    // Obtener URL de imagen
    const imageUrl = item.cover || 'https://via.placeholder.com/120?text=Producto';

    // Determinar tipo de producto
    let productType = 'Producto';
    let productId = null;
    
    if (item.songId) {
        productType = 'song';
        productId = item.songId;
    } else if (item.albumId) {
        productType = 'album';
        productId = item.albumId;
    } else if (item.merchId) {
        productType = 'merch';
        productId = item.merchId;
    }

    const productTypeLabel = productType === 'song' ? 'Canción' : productType === 'album' ? 'Álbum' : 'Merchandising';

    div.innerHTML = `
        <img src="${imageUrl}" alt="${item.name}" class="cart-item-image" onerror="this.src='https://via.placeholder.com/120?text=Sin+Imagen'">
        
        <div class="cart-item-info">
            <h3 class="cart-item-name">${item.name}</h3>
            <p class="cart-item-type">${productTypeLabel}</p>
            <p class="cart-item-price">€${price.toFixed(2)}</p>
        </div>

        <div class="cart-item-controls">
            <div class="cart-item-total">€${totalPrice}</div>
            <button class="btn-remove" data-index="${index}" data-product-id="${productId}" data-product-type="${productType}">Eliminar</button>
        </div>
    `;

    // Event listener para el botón de eliminar
    const removeBtn = div.querySelector('.btn-remove');
    if (removeBtn) {
        removeBtn.addEventListener('click', () => openDeleteModal(index, productId, productType));
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

        // Preparar datos según el esquema de la API
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
            throw new Error(errorData.error || 'Error al procesar la compra');
        }

        const result = await response.json();
        
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
 * Calcula el total del carrito
 */
function calculateTotal() {
    let total = 0;
    window.currentCart.forEach(item => {
        const price = parseFloat(item.price || 0);
        total += price;
    });
    return total;
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
        const price = parseFloat(item.price || 0);
        subtotal += price;
    });

    const tax = subtotal * 0.21;
    const total = subtotal + tax;

    if (subtotalElement) subtotalElement.textContent = `€${subtotal.toFixed(2)}`;
    if (taxElement) taxElement.textContent = `€${tax.toFixed(2)}`;
    if (totalElement) totalElement.textContent = `€${total.toFixed(2)}`;
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
            const paymentMethods = await response.json();

            if (!paymentMethods || paymentMethods.length === 0) {
                // Sin métodos de pago
                if (checkoutSection) checkoutSection.style.display = 'none';
                if (noPaymentMethod) noPaymentMethod.style.display = 'block';
                if (btnCheckout) btnCheckout.disabled = true;
            } else {
                // Autenticado y con métodos de pago
                populatePaymentMethods(paymentMethods);
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
 * Puebla el selector de métodos de pago
 */
function populatePaymentMethods(paymentMethods) {
    const select = document.getElementById('payment-method-select');
    if (!select) return;

    select.innerHTML = '<option value="">Seleccionar método de pago</option>';
    
    paymentMethods.forEach(method => {
        const option = document.createElement('option');
        option.value = method.id || method.paymentMethodId;
        option.textContent = `${method.cardHolder} - ${method.cardNumber}`;
        select.appendChild(option);
    });
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
