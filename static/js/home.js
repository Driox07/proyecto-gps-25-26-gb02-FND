const STATS_SERVICE_URL = typeof CONFIG !== 'undefined' ? CONFIG.statsService.url : 'http://10.1.1.2:8084'; 
// Home page interactivity
document.addEventListener('DOMContentLoaded', () => {
    // Smooth scroll for anchor links
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // Add scroll reveal animation for feature cards
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '0';
                entry.target.style.transform = 'translateY(30px)';
                
                setTimeout(() => {
                    entry.target.style.transition = 'all 0.6s ease-out';
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, 100);
                
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        card.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(card);
    });

    // Parallax effect for floating cards
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const scrolled = window.pageYOffset;
                const floatingCards = document.querySelectorAll('.floating-card');
                
                floatingCards.forEach((card, index) => {
                    const speed = 0.5 + (index * 0.1);
                    const yPos = -(scrolled * speed);
                    card.style.transform = `translateY(${yPos}px)`;
                });
                
                ticking = false;
            });
            ticking = true;
        }
    });

    // Add hover effect to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.style.transition = 'all 0.3s ease';
        });
    });

    // Counter animation for stats (if you add stats in the future)
    const animateCounter = (element, target, duration = 2000) => {
        let start = 0;
        const increment = target / (duration / 16);
        
        const updateCounter = () => {
            start += increment;
            if (start < target) {
                element.textContent = Math.ceil(start);
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target;
            }
        };
        
        updateCounter();
    };

    // Log page load for analytics (optional)
    console.log('OverSound Home Page loaded successfully');

    // ------------------------------
    loadTop10();
    loadRecommendations();
    // ------------------------------
});

//---
async function loadTop10() {
    try {
        const songsRes = await fetch(`${STATS_SERVICE_URL}/statistics/top-10-songs`, {
            credentials: "include"
        });
        const artistsRes = await fetch(`${STATS_SERVICE_URL}/statistics/top-10-artists`, {
            credentials: "include"
        });

        const songs = await songsRes.json();
        const artists = await artistsRes.json();

        renderTopSongs(songs);
        renderTopArtists(artists);

    } catch (err) {
        console.error("Error loading top lists:", err);
    }
}

function renderTopSongs(songs) {
    const container = document.getElementById("top-songs");
    container.innerHTML = songs.map(s => `
        <div class="top-card">
            <img src="${s.image || '/static/default-cover.png'}" />
            <p>${s.name}</p>
            <span>${s.genre}</span>
        </div>
    `).join('');
}

function renderTopArtists(artists) {
    const container = document.getElementById("top-artists");
    container.innerHTML = artists.map(a => `
        <div class="top-card">
            <img src="${a.image || '/static/default-artist.png'}" />
            <p>${a.name}</p>
        </div>
    `).join('');
}
//..
async function loadRecommendations() {
    try {
        const [songsRes, artistsRes] = await Promise.all([
            fetch(`${STATS_SERVICE_URL}/recommendations/song`, { credentials: 'include' }),
            fetch(`${STATS_SERVICE_URL}/recommendations/artist`, { credentials: 'include' })
        ]);

        const songs = await songsRes.json();
        const artists = await artistsRes.json();

        renderRecommendedSongs(songs);
        renderRecommendedArtists(artists);

    } catch (err) {
        console.error("Error loading recommendations:", err);
    }
}

function renderRecommendedSongs(songs) {
    const container = document.getElementById("recommended-songs");
    if (!songs || !songs.length) {
        container.innerHTML = "<p>No hay recomendaciones disponibles.</p>";
        return;
    }
    container.innerHTML = songs.map(s => `
        <div class="top-card">
            <img src="${s.image || '/static/default-cover.png'}" />
            <p>${s.name}</p>
            <span>${s.genre}</span>
        </div>
    `).join('');
}

function renderRecommendedArtists(artists) {
    const container = document.getElementById("recommended-artists");
    if (!artists || !artists.length) {
        container.innerHTML = "<p>No hay recomendaciones disponibles.</p>";
        return;
    }
    container.innerHTML = artists.map(a => `
        <div class="top-card">
            <img src="${a.image || '/static/default-artist.png'}" />
            <p>${a.name}</p>
        </div>
    `).join('');
}
