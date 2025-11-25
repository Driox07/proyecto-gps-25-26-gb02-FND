// Configuration file for external services
// Edit this file to change service URLs without modifying other files

const CONFIG = {
    // Music Service (Track Provider Microservice)
    musicService: {
        url: typeof PT_SERVER !== 'undefined' ? PT_SERVER : 'http://localhost:8083',
    },
    
    // Audio player settings
    audioPlayer: {
        // Default volume (0 to 1)
        defaultVolume: 1.0,
        // Auto-play on page load (true/false)
        autoPlay: false,
        // Audio format: 'mp3', 'wav', 'ogg', 'flac', etc
        // The microservice will return the format based on what's stored in DB
        supportedFormats: ['mp3', 'wav', 'ogg', 'flac'],
    },
    
    // Debug settings
    debug: {
        // Enable console logging for audio player
        logging: true,
        // Log all fetch requests
        logRequests: true,
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
