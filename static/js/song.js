// Song Page - Interactive Features
// Configuration for the music microservice (defined in config.js)
const MUSIC_SERVICE_URL = typeof CONFIG !== 'undefined' ? CONFIG.musicService.url : 'http://localhost:8080';

// Global audio player instance
let audioPlayer = null;

document.addEventListener('DOMContentLoaded', () => {
    initializeAudioPlayer();
    setupButtonListeners();
    setupAnimations();
});

/**
 * Initialize HTML5 audio player
 */
function initializeAudioPlayer() {
    audioPlayer = new Audio();
    audioPlayer.addEventListener('ended', () => {
        console.log('Track finished');
        const playButton = document.getElementById('play-button');
        if (playButton) {
            playButton.classList.remove('playing');
        }
    });
    audioPlayer.addEventListener('error', (e) => {
        console.error('Audio player error:', e);
        alert('Error al reproducir la canción');
    });
    audioPlayer.addEventListener('play', () => {
        if (CONFIG && CONFIG.debug && CONFIG.debug.logging) {
            console.log('Audio playback started');
        }
    });
    audioPlayer.addEventListener('pause', () => {
        if (CONFIG && CONFIG.debug && CONFIG.debug.logging) {
            console.log('Audio playback paused');
        }
    });
}

/**
 * Get track ID from the button data attribute
 */
function getTrackId() {
    const playButton = document.getElementById('play-button');
    if (playButton) {
        return playButton.getAttribute('data-track-id');
    }
    return null;
}

/**
 * Fetch and play track from microservice
 */
async function playTrack(trackId) {
    if (!trackId) {
        alert('ID de canción no disponible');
        return;
    }

    try {
        const url = `${MUSIC_SERVICE_URL}/track/${trackId}`;
        
        if (CONFIG && CONFIG.debug && CONFIG.debug.logging) {
            console.log(`Fetching track from: ${url}`);
        }

        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include', // Include cookies for authentication
            headers: {
                'Accept': 'audio/*'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Get audio blob
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (CONFIG && CONFIG.debug && CONFIG.debug.logging) {
            console.log(`Audio blob received, size: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
        }
        
        // Set audio source and play
        audioPlayer.src = audioUrl;
        audioPlayer.play();
        console.log('Playing track:', trackId);

    } catch (error) {
        console.error('Error playing track:', error);
        alert(`Error al reproducir: ${error.message}`);
    }
}

/**
 * Setup button event listeners
 */
function setupButtonListeners() {
    // Play button
    const playButton = document.getElementById('play-button');
    if (playButton) {
        playButton.addEventListener('click', () => {
            const songTitle = document.getElementById('song-title').textContent;
            const trackId = getTrackId();
            
            if (!trackId) {
                alert('ID de canción no disponible');
                return;
            }
            
            if (audioPlayer.paused) {
                if (!audioPlayer.src) {
                    // Start playing new track
                    playTrack(trackId);
                } else {
                    // Resume paused track
                    audioPlayer.play();
                }
                playButton.classList.add('playing');
            } else {
                // Pause track
                audioPlayer.pause();
                playButton.classList.remove('playing');
            }
        });
    }

    // Buy button
    const buyButton = document.getElementById('buy-button');
    if (buyButton) {
        buyButton.addEventListener('click', () => {
            const songTitle = document.getElementById('song-title').textContent;
            const songPrice = document.getElementById('song-price').textContent;
            console.log('Buying song:', songTitle);
            alert(`Comprando: ${songTitle}\nPrecio: ${songPrice}\n(Funcionalidad de compra pendiente)`);
            // TODO: Implement purchase functionality
        });
    }

    // Add to cart button
    const addToCartButton = document.getElementById('add-to-cart-button');
    if (addToCartButton) {
        addToCartButton.addEventListener('click', async () => {
            const songId = getTrackId();
            const songTitle = document.getElementById('song-title').textContent;
            const songPrice = document.getElementById('song-price').textContent;
            const artistName = document.querySelector('.artist-link')?.textContent || 'Artista desconocido';
            const songCover = document.querySelector('.song-cover')?.src || 'https://via.placeholder.com/120?text=Sin+Imagen';
            
            if (!songId) {
                alert('ID de canción no disponible');
                return;
            }

            try {
                // Agregar a carrito local
                const cartItem = {
                    id: songId,
                    name: songTitle,
                    artist: artistName,
                    price: songPrice,
                    type: 'cancion',
                    image: songCover,
                    quantity: 1
                };

                let cart = JSON.parse(localStorage.getItem('oversound_cart')) || [];
                const existingItem = cart.find(item => item.id === songId);
                
                if (existingItem) {
                    existingItem.quantity += 1;
                } else {
                    cart.push(cartItem);
                }

                localStorage.setItem('oversound_cart', JSON.stringify(cart));
                
                // Intentar sincronizar con backend si el usuario está autenticado
                try {
                    await fetch('/cart', {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({
                            productId: songId,
                            productType: 'cancion',
                            quantity: 1,
                            price: songPrice
                        })
                    });
                } catch (error) {
                    console.warn('No se pudo sincronizar con backend, usando localStorage:', error);
                }

                // Emitir evento para actualizar el header
                window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }));
                
                alert(`${songTitle} añadido al carrito`);
                
            } catch (error) {
                console.error('Error al añadir al carrito:', error);
                alert('Error al añadir el producto al carrito');
            }
        });
    }

    // Favorite button
    const favoriteButton = document.getElementById('favorite-button');
    if (favoriteButton) {
        favoriteButton.addEventListener('click', () => {
            const songId = getTrackId();
            if (!songId) {
                alert('ID de canción no disponible');
                return;
            }
            toggleFavoriteSong(songId, favoriteButton);
        });
    }
}

/**
 * Setup page animations
 */
function setupAnimations() {
    // Animate sections on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '0';
                entry.target.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    entry.target.style.transition = 'all 0.6s ease-out';
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, 100);
                
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all detail sections
    const detailSections = document.querySelectorAll('.details-section');
    detailSections.forEach(section => {
        observer.observe(section);
    });

    // Animate genre tags
    const genreTags = document.querySelectorAll('.genre-tag');
    genreTags.forEach((tag, index) => {
        tag.style.opacity = '0';
        tag.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
            tag.style.transition = 'all 0.3s ease-out';
            tag.style.opacity = '1';
            tag.style.transform = 'scale(1)';
        }, 100 + (index * 50));
    });

    // Animate collaborator cards
    const collabCards = document.querySelectorAll('.collaborator-card');
    collabCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.4s ease-out';
            card.style.opacity = '1';
            card.style.transform = 'translateX(0)';
        }, 100 + (index * 75));
    });

    // Hover effect for cover
    const coverContainer = document.querySelector('.song-cover-container');
    if (coverContainer) {
        let ticking = false;
        
        coverContainer.addEventListener('mousemove', (e) => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const rect = coverContainer.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    
                    const rotateX = (y - centerY) / 20;
                    const rotateY = (centerX - x) / 20;
                    
                    coverContainer.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
                    
                    ticking = false;
                });
                ticking = true;
            }
        });
        
        coverContainer.addEventListener('mouseleave', () => {
            coverContainer.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        });
    }
}

// Log page load
console.log('OverSound Song Page loaded successfully');
