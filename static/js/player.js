// Mini Radio Player
(function(){
    const DEFAULT_SERVICE = window.PT_SERVER || window.PT_URL || window.MUSIC_SERVICE_URL || '';

    function $(id){ return document.getElementById(id); }

    const state = {
        audio: null,
        currentTrackId: null,
        currentSongId: null,
        currentArtistId: null,
        isLoading: false
    };
    // store abort controller and current objectURL for cleanup
    state.abortController = null;
    state.objectUrl = null;
    // queue support for prev/next
    state.queue = [];
    state.queueIndex = -1;

    function init(){
        state.audio = new Audio();
        state.audio.crossOrigin = 'anonymous';
        // initialize volume from storage or default
        try{
            const saved = localStorage.getItem('oversound_volume');
            const v = saved !== null ? parseFloat(saved) : 1;
            state.audio.volume = isNaN(v) ? 1 : Math.max(0, Math.min(1, v));
        }catch(e){
            state.audio.volume = 1;
        }

        state.audio.addEventListener('timeupdate', ()=>{
            const prog = $('mini-progress');
            if(state.audio.duration && !state.isLoading){
                const pct = (state.audio.currentTime / state.audio.duration) * 100;
                prog.style.width = pct + '%';
            }
            // Update time display if present
            updateTimeDisplay();
        });

        // When metadata (duration) is available, refresh the time display
        state.audio.addEventListener('loadedmetadata', ()=>{
            updateTimeDisplay();
        });

        state.audio.addEventListener('play', ()=>{
            $('mini-play').textContent = '❚❚';
        });
        state.audio.addEventListener('pause', ()=>{
            $('mini-play').textContent = '►';
        });
        state.audio.addEventListener('ended', ()=>{
            $('mini-play').textContent = '►';
        });

        // Controls
        $('mini-play').addEventListener('click', ()=>{
            if(state.audio.paused){ state.audio.play(); }
            else { state.audio.pause(); }
        });
        // Prev / Next buttons: seek backward/forward 10s
        const prevBtn = $('mini-prev');
        const nextBtn = $('mini-next');
        if(prevBtn) prevBtn.addEventListener('click', (e)=>{ e.preventDefault(); seekBackward(10); });
        if(nextBtn) nextBtn.addEventListener('click', (e)=>{ e.preventDefault(); seekForward(10); });
        // Volume controls
        const volSlider = $('mini-volume');
        const volBtn = $('mini-volume-btn');
        let prevVolume = state.audio.volume;
        if(volSlider){
            volSlider.value = state.audio.volume;
            volSlider.addEventListener('input', (e)=>{
                const val = parseFloat(e.target.value);
                if(!isNaN(val)){
                    state.audio.volume = Math.max(0, Math.min(1, val));
                    try{ localStorage.setItem('oversound_volume', state.audio.volume); }catch(_){ }
                    // update mute icon
                    if(volBtn) volBtn.textContent = state.audio.volume > 0 ? '🔊' : '🔇';
                }
            });
        }
        if(volBtn){
            volBtn.addEventListener('click', ()=>{
                if(state.audio.volume > 0){ prevVolume = state.audio.volume; state.audio.volume = 0; if(volSlider) volSlider.value = 0; try{ localStorage.setItem('oversound_volume', 0); }catch(_){}; volBtn.textContent='🔇'; }
                else { state.audio.volume = prevVolume || 1; if(volSlider) volSlider.value = state.audio.volume; try{ localStorage.setItem('oversound_volume', state.audio.volume); }catch(_){}; volBtn.textContent='🔊'; }
            });
        }

        $('mini-close').addEventListener('click', ()=>{ hide(); state.audio.pause(); state.audio.src = ''; });

        // Clicking progress seeks
        const progressContainer = $('mini-progress-container');
        progressContainer.addEventListener('click', (e)=>{
            if(!state.audio.duration) return;
            const rect = progressContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const pct = x / rect.width;
            state.audio.currentTime = pct * state.audio.duration;
        });

        // Allow external calls
        window.radioPlayer = {
            playTrack: playTrack,
            show: show,
            hide: hide,
            next: seekForward,
                prev: seekBackward
        };

        // Auto-detect clicks on elements with data-track-id
        document.addEventListener('click', (e)=>{
            const el = e.target.closest('[data-track-id]');
            if(el){
                e.preventDefault();
                const trackId = el.getAttribute('data-track-id');
                const songId = el.getAttribute('data-song-id') || el.getAttribute('data-songid') || null;
                const artistId = el.getAttribute('artist-id') || null;
                playTrack(trackId, songId, artistId);
            }
        });
    }

    function show(){
        const player = $('mini-player');
        if(player){ player.setAttribute('aria-hidden','false'); player.style.display='flex'; }
    }
    function hide(){
        const player = $('mini-player');
        if(player){ player.setAttribute('aria-hidden','true'); player.style.display='none'; }
    }

    async function playTrack(trackId, songId, artistId, options = {}){
        if(!trackId) return;
        const addToQueue = options.addToQueue !== false; // default true
        const providedTitle = options.title || null;
        const providedArtist = options.artist || null;
        const providedCover = options.cover || null;
        state.currentTrackId = trackId;
        state.currentSongId = songId || null;
        state.currentArtistId = artistId || null;

        setMeta('Cargando…','');
        setLoading(true);
        show();

        // Manage queue: push this track unless explicitly told not to
        if(addToQueue){
            const entry = { trackId: String(trackId), songId: songId || null, artistId: artistId || null, title: providedTitle, artistName: providedArtist, cover: providedCover };
            // if not at end, drop forward history
            if(state.queueIndex < state.queue.length - 1){
                state.queue = state.queue.slice(0, state.queueIndex + 1);
            }
            // Avoid pushing duplicate consecutive track
            const last = state.queue[state.queue.length - 1];
            if(!last || String(last.trackId) !== String(trackId)){
                state.queue.push(entry);
                state.queueIndex = state.queue.length - 1;
            } else {
                state.queueIndex = state.queue.length - 1;
            }
        }

        try{
            const base = DEFAULT_SERVICE || '';
            const url = base ? (base.replace(/\/$/, '') + '/track/' + trackId) : ('/track/' + trackId);

            // Abort any previous in-flight request
            if(state.abortController){
                try{ state.abortController.abort(); }catch(e){}
                state.abortController = null;
            }
            state.abortController = new AbortController();
            const signal = state.abortController.signal;

            // Prefer PT_SERVER OpenAPI which returns JSON with base64 'track' field
            let blob = null;
            let coverPathFromJson = null;
            if(base){
                // Try OpenAPI JSON response
                const jsonResp = await fetch(url, { method: 'GET', credentials: 'include', headers: { 'Accept': 'application/json' }, signal });
                if(jsonResp.ok){
                    const data = await jsonResp.json().catch(()=>null);
                    if(data){
                        if(data.track){
                            const bytes = base64ToUint8Array(data.track);
                            blob = new Blob([bytes], { type: data.mime || 'audio/mpeg' });
                        }
                        // Try common cover fields returned by services
                        if(data.cover) coverPathFromJson = data.cover;
                        if(data.song && data.song.cover) coverPathFromJson = data.song.cover;
                    }
                }
            }

            if(!blob){
                // Fallback: request raw audio stream (proxy or legacy service)
                const response = await fetch(url, { method: 'GET', credentials: 'include', headers: { 'Accept': 'audio/*' }, signal });
                if(!response.ok) throw new Error('HTTP ' + response.status);

                const contentLength = response.headers.get('Content-Length') || response.headers.get('content-length');
                const total = contentLength ? parseInt(contentLength,10) : null;
                const reader = response.body.getReader();
                const chunks = [];
                let received = 0;

                while(true){
                    const {done, value} = await reader.read();
                    if(done) break;
                    chunks.push(value);
                    received += value.length;
                    if(total){
                        const pct = Math.min(100, Math.round((received/total)*100));
                        $('mini-progress').style.width = pct + '%';
                    } else {
                        const cur = Math.min(60, Math.max(5, Math.floor((received/65536)%60)));
                        $('mini-progress').style.width = cur + '%';
                    }
                }

                blob = new Blob(chunks, { type: response.headers.get('Content-Type') || 'audio/mpeg' });
            }

            // Clean up previous object URL and pause audio before loading new source
            try{ if(state.audio){ state.audio.pause(); } }catch(e){}
            if(state.objectUrl){ URL.revokeObjectURL(state.objectUrl); state.objectUrl = null; }
            const audioUrl = URL.createObjectURL(blob);
            state.objectUrl = audioUrl;
            state.audio.src = audioUrl;

            // Determine cover URL: prefer JSON cover, then DOM, then hide
            let resolvedCover = null;
            if(coverPathFromJson) resolvedCover = resolveCoverUrl(coverPathFromJson);
            if(!resolvedCover){
                const domCover = document.querySelector('#song-cover');
                if(domCover && domCover.src) resolvedCover = domCover.src;
            }

            // Update metadata placeholders (these could be replaced with real metadata later)
            setMeta(document.querySelector('#song-title')?.textContent || ('Track ' + trackId), document.querySelector('#song-artist')?.textContent || '', resolvedCover);

            setLoading(false);
            $('mini-progress').style.width = '0%';

            try{
                await state.audio.play();
            }catch(playErr){
                // Ignore play interruptions caused by replacing src quickly
                console.warn('Audio play interrupted or failed:', playErr && playErr.message ? playErr.message : playErr);
            }

            // send stats if provided
            try{ if(window.addStats && state.currentSongId && state.currentArtistId){ window.addStats(state.currentSongId, state.currentArtistId); } }catch(e){}

        }catch(err){
            // If the fetch was aborted due to a new request, ignore silently
            const isAbort = err && (err.name === 'AbortError' || /aborted|abort/i.test(err.message || ''));
            if(isAbort){
                console.log('Track fetch aborted:', err && err.message ? err.message : err);
                setLoading(false);
                return;
            }

            console.error('Error fetching track', err);
            setLoading(false);
            alert('Error al reproducir la canción: ' + (err.message || 'Error de red'));
        }
    }

    // Play a queue entry by index without adding to queue
    async function playQueueIndex(idx){
        if(idx < 0 || idx >= state.queue.length) return;
        const entry = state.queue[idx];
        if(!entry) return;
        state.queueIndex = idx;
        // call playTrack but prevent re-adding to the queue
        await playTrack(entry.trackId, entry.songId, entry.artistId, { addToQueue: false, title: entry.title, artist: entry.artistName, cover: entry.cover });
    }

    function nextInQueue(){
        if(state.queueIndex < state.queue.length - 1){
            playQueueIndex(state.queueIndex + 1);
        } else {
            // no-op or could implement auto-next behavior
            console.log('No next track in queue');
        }
    }

    function prevInQueue(){
        if(state.queueIndex > 0){
            playQueueIndex(state.queueIndex - 1);
        } else {
            console.log('No previous track in queue');
        }
    }

    // Seek functions: move playback forward/backward by given seconds (default 10s)
    function seekForward(seconds = 10){
        if(!state.audio) return;
        try{
            const cur = state.audio.currentTime || 0;
            const dur = state.audio.duration;
            if(dur && isFinite(dur)){
                state.audio.currentTime = Math.min(dur, cur + seconds);
            } else {
                state.audio.currentTime = cur + seconds;
            }
        }catch(e){
            console.warn('seekForward error', e);
        }
    }

    function seekBackward(seconds = 10){
        if(!state.audio) return;
        try{
            const cur = state.audio.currentTime || 0;
            state.audio.currentTime = Math.max(0, cur - seconds);
        }catch(e){
            console.warn('seekBackward error', e);
        }
    }

    function setMeta(title, artist){
        const t = $('mini-player-title');
        const a = $('mini-player-artist');
        const cover = $('mini-player-cover');
        if(t) t.textContent = title || '—';
        if(a) a.textContent = artist || '';
        // If a coverUrl was provided as third arg, use it. Otherwise keep existing behaviour.
        const coverUrl = arguments.length > 2 ? arguments[2] : null;
        if(cover){
            if(coverUrl){
                cover.src = coverUrl;
                cover.style.display = 'block';
            } else if(cover.src === '' || cover.src === null || cover.src === undefined){
                cover.style.display = 'none';
            } else {
                cover.style.display = 'block';
            }
        }
    }

    function setLoading(flag){
        state.isLoading = flag;
        const loader = $('mini-loading');
        if(loader) loader.style.display = flag ? 'block' : 'none';
        const playBtn = $('mini-play');
        if(playBtn) playBtn.disabled = flag;
        // refresh time display (will show a loading indicator if appropriate)
        try{ updateTimeDisplay(); }catch(_){ }
    }

    // Utility: decode base64 to Uint8Array
    function base64ToUint8Array(base64) {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }

    // Utility: format seconds as M:SS or H:MM:SS
    function formatTime(sec){
        if(!isFinite(sec) || sec === null || sec === undefined) return '--:--';
        sec = Math.max(0, Math.floor(sec));
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        const pad = (n)=> n < 10 ? ('0' + n) : ('' + n);
        if(h > 0) return h + ':' + pad(m) + ':' + pad(s);
        return m + ':' + pad(s);
    }

    // Update the mini-player time display if element #mini-time exists
    function updateTimeDisplay(){
        const el = $('mini-time');
        if(!el || !state.audio) return;
        if(state.isLoading){
            el.textContent = '⏳';
            return;
        }
        const cur = state.audio.currentTime || 0;
        const dur = state.audio.duration;
        if(dur && isFinite(dur)){
            el.textContent = formatTime(cur) + ' / ' + formatTime(dur);
        } else {
            el.textContent = formatTime(cur) + ' / --:--';
        }
    }

    // Resolve a cover path to a usable URL.
    // The coverPath may be:
    // - an absolute URL (http(s)://)
    // - a protocol-relative URL (//...)
    // - a path starting with '/static' or '/'
    // In the latter case, prefer prefixing with TYA_SERVER if available: TYA_SERVER + '/static' + coverPath
    function resolveCoverUrl(coverPath){
        if(!coverPath) return null;
        coverPath = String(coverPath);
        if(/^https?:\/\//i.test(coverPath)) return coverPath;
        if(/^\/\//.test(coverPath)) return window.location.protocol + coverPath;
        // If already points to /static, use as-is
        if(coverPath.startsWith('/static')) return coverPath;
        // If starts with / it's likely the raw path (e.g. /song/123.png) -> use TYA_SERVER/static + path
        if(coverPath.startsWith('/')){
            if(window.TYA_SERVER) return window.TYA_SERVER.replace(/\/$/,'') + '/static' + coverPath;
            return coverPath; // fallback to server root
        }
        // If it's a relative path, try prefixing with TYA_SERVER/static/
        if(window.TYA_SERVER) return window.TYA_SERVER.replace(/\/$/,'') + '/static/' + coverPath;
        return coverPath;
    }

    // Initialize when DOM ready
    if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
