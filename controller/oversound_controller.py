import json
from fastapi import FastAPI, Query, Request, Response
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
import os
import requests
import view.oversound_view as osv
import controller.msvc_servers as servers

app = FastAPI()
osv = osv.View()

def obtain_user_data(token: str):
    if not token:
        return None
    try:
        resp = requests.get(f"{servers.SYU}/auth", timeout=2, headers={"Accept": "application/json", "Cookie":f"oversound_auth={token}"})
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException:
        return None

def normalize_image_url(image_path: str, tya_server: str = None) -> str:
    """
    Normaliza las URLs de imágenes:
    - Si es base64 (data:image), lo devuelve tal cual
    - Si es una ruta relativa (/images/..., /static/...), la convierte a URL completa del servidor TYA
    - Si es una URL completa (http://...), la devuelve tal cual
    """
    if not image_path:
        return ""
    
    # Si ya es base64, devolverlo tal cual
    if image_path.startswith("data:image"):
        return image_path
    
    # Si ya es una URL completa, devolverla tal cual
    if image_path.startswith("http://") or image_path.startswith("https://"):
        return image_path
    
    # Si es una ruta relativa, convertirla a URL del servidor TYA
    if tya_server and (image_path.startswith("/") or image_path.startswith("images/")):
        # Eliminar /static si está presente, ya que lo añadiremos nosotros
        clean_path = image_path.replace("/static", "")
        return f"{tya_server}/static{clean_path if clean_path.startswith('/') else '/' + clean_path}"
    
    return image_path

# Configuración de CORS
origins = [
    "http://localhost:8000",
    "http://localhost:8080",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:8080",
    "http://10.1.1.4:8000",
    "http://10.1.1.4:8080",
    "http://10.1.1.2:8081",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Lista de orígenes permitidos
    allow_credentials=True,  # Permitir cookies y credenciales
    allow_methods=["*"],  # Permitir todos los métodos (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Permitir todos los headers
)

# Obtener la ruta absoluta del directorio static
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(BASE_DIR, "static")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
def index(request: Request):
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    print(userdata)
    # Load top lists and recommendations from RYE (server-side to avoid CORS and speed up page)
    top_songs = []
    top_artists = []
    rec_songs = []
    rec_artists = []

    try:
        ts = requests.get(f"{servers.RYE}/statistics/top-10-songs", timeout=3, headers={"Accept": "application/json", "Cookie": f"oversound_auth={token}"})
        if ts.ok:
            top_songs = ts.json()
    except requests.RequestException as e:
        print(f"Error fetching top songs from RYE: {e}")

    try:
        ta = requests.get(f"{servers.RYE}/statistics/top-10-artists", timeout=3, headers={"Accept": "application/json", "Cookie": f"oversound_auth={token}"})
        if ta.ok:
            top_artists = ta.json()
    except requests.RequestException as e:
        print(f"Error fetching top artists from RYE: {e}")

    try:
        rs = requests.get(f"{servers.RYE}/recommendations/song", timeout=3, headers={"Accept": "application/json", "Cookie": f"oversound_auth={token}"})
        if rs.ok:
            rec_songs = rs.json()
    except requests.RequestException as e:
        print(f"Error fetching recommended songs from RYE: {e}")

    try:
        ra = requests.get(f"{servers.RYE}/recommendations/artist", timeout=3, headers={"Accept": "application/json", "Cookie": f"oversound_auth={token}"})
        if ra.ok:
            rec_artists = ra.json()
    except requests.RequestException as e:
        print(f"Error fetching recommended artists from RYE: {e}")

    return osv.get_home_view(request, userdata, servers.SYU, servers.RYE, servers.TYA, top_songs, top_artists, rec_songs, rec_artists)

@app.get("/login")
def login_page(request: Request):
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    if userdata:
        return RedirectResponse("/")
    return osv.get_login_view(request, userdata, servers.FND)

@app.post("/login")
async def login(request: Request):
    # Se obtienen los datos del formulario
    body = await request.json()
    # Se hace un post a SYU
    resp = requests.post(
        f"{servers.SYU}/login", 
        json=body,
        timeout=2, 
        headers={"Accept": "application/json"}
    )
    response_data = resp.json()
    if resp.ok:
        response = JSONResponse(content={"message": "Login successful"})
        response.set_cookie(key="oversound_auth", value=response_data.get("session_token"), httponly=True, 
                            secure=False, samesite="lax", path="/")
        return response
    else:
        return JSONResponse(content=response_data, status_code=resp.status_code)

@app.post("/logout")
def logout(request: Request):
    try:
        token = request.cookies.get("oversound_auth")
        resp = requests.get(f"{servers.SYU}/logout", timeout=2, headers={"Accept": "applications/json", "Cookie": f"oversound_auth={token}"})
        resp.raise_for_status()
        Response.delete_cookie("session")
        return resp.json()
    except requests.RequestException:
        return Response(content=json.dumps({"error": "Couldn't connect with authentication service"}), media_type="application/json", status_code=500)

@app.get("/register")
def register_page(request: Request):
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    if userdata:
        return RedirectResponse("/")
    return osv.get_register_view(request, userdata, servers.FND)


@app.get("/forgot-password")
def forgot_password_page(request: Request):
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    if userdata:
        return RedirectResponse("/")
    return osv.get_forgot_password_view(request, userdata, servers.FND)


@app.post("/forgot-password")
async def forgot_password(request: Request):
    """
    Ruta simulada que 'envía' un correo de recuperación (simulada).
    Espera JSON: {"email": "user@example.com"} y devuelve mensaje de éxito.
    """
    try:
        body = await request.json()
    except Exception:
        # Si no es JSON, intentar form data
        form = await request.form()
        body = dict(form)

    email = body.get('email')
    if not email:
        return JSONResponse(content={"error": "Email requerido"}, status_code=400)

    # Aquí podríamos integrar con un servicio de correo. Por ahora devolvemos simulación
    return JSONResponse(content={"message": f"Se ha enviado un correo de recuperación a {email} (simulado)."}, status_code=200)

@app.post("/register")
async def register(request: Request):
    # Se obtienen los datos del formulario
    body = await request.json()
    # Se hace un post a SYU
    resp = requests.post(
        f"{servers.SYU}/register", 
        json=body,
        timeout=2, 
        headers={"Accept": "application/json"}
    )
    response_data = resp.json()
    if resp.ok:
        response = JSONResponse(content={"message": "Register successful"})
        response.set_cookie(key="oversound_auth", value=response_data.get("session_token"), httponly=True, 
                            secure=False, samesite="lax", path="/")
        return response
    else:
        return JSONResponse(content=response_data, status_code=resp.status_code)

@app.get("/shop")
def shop(request: Request, 
         genres: str = Query(default=None),
         artists: str = Query(default=None),
         order: str = Query(default="date"),
         direction: str = Query(default="desc"),
         page: int = Query(default=1)):
    """
    Renderiza la vista de la tienda con filtrado desde TYA.
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)

    try:
        # Construir parámetros de filtrado para TYA
        filter_params = {
            "order": order,
            "direction": direction,
            "page": page
        }
        
        if genres:
            filter_params["genres"] = genres
        
        if artists:
            filter_params["artists"] = artists

        # Obtener IDs filtrados desde TYA
        song_ids_resp = requests.get(
            f"{servers.TYA}/song/filter",
            params=filter_params,
            timeout=10,
            headers={"Accept": "application/json"}
        )
        song_ids = song_ids_resp.json() if song_ids_resp.ok else []
        
        album_ids_resp = requests.get(
            f"{servers.TYA}/album/filter",
            params=filter_params,
            timeout=10,
            headers={"Accept": "application/json"}
        )
        album_ids = album_ids_resp.json() if album_ids_resp.ok else []
        
        merch_ids_resp = requests.get(
            f"{servers.TYA}/merch/filter",
            params=filter_params,
            timeout=10,
            headers={"Accept": "application/json"}
        )
        merch_ids = merch_ids_resp.json() if merch_ids_resp.ok else []

        # Obtener datos completos de los productos
        songs = []
        if song_ids:
            songs_resp = requests.get(
                f"{servers.TYA}/song/list",
                params={"ids": ",".join(map(str, song_ids))},
                timeout=10,
                headers={"Accept": "application/json"}
            )
            songs = songs_resp.json() if songs_resp.ok else []

        albums = []
        if album_ids:
            albums_resp = requests.get(
                f"{servers.TYA}/album/list",
                params={"ids": ",".join(map(str, album_ids))},
                timeout=10,
                headers={"Accept": "application/json"}
            )
            albums = albums_resp.json() if albums_resp.ok else []

        merch = []
        if merch_ids:
            merch_resp = requests.get(
                f"{servers.TYA}/merch/list",
                params={"ids": ",".join(map(str, merch_ids))},
                timeout=10,
                headers={"Accept": "application/json"}
            )
            merch = merch_resp.json() if merch_resp.ok else []

        # Normalizar URLs de imágenes para todos los productos
        for song in songs:
            if song.get('cover'):
                song['cover'] = normalize_image_url(song['cover'], servers.TYA)
        
        for album in albums:
            if album.get('cover'):
                album['cover'] = normalize_image_url(album['cover'], servers.TYA)
        
        for item in merch:
            if item.get('cover'):
                item['cover'] = normalize_image_url(item['cover'], servers.TYA)

        # POST-FILTRADO: Validar que los productos realmente coincidan con los filtros seleccionados
        # Esto es necesario porque algunos productos pueden no tener todos los campos
        selected_genres = [int(g) for g in genres.split(',')] if genres else []
        selected_artists = [int(a) for a in artists.split(',')] if artists else []
        
        if selected_genres or selected_artists:
            # Filtrar canciones
            filtered_songs = []
            for song in songs:
                # Verificar artista
                if selected_artists and song.get('artistId') not in selected_artists:
                    continue
                # Verificar géneros (la canción debe tener al menos uno de los géneros seleccionados)
                if selected_genres:
                    song_genres = song.get('genres', [])
                    if not song_genres or not any(g in selected_genres for g in song_genres):
                        continue
                filtered_songs.append(song)
            songs = filtered_songs
            
            # Filtrar álbumes
            filtered_albums = []
            for album in albums:
                # Verificar artista
                if selected_artists and album.get('artistId') not in selected_artists:
                    continue
                # Verificar géneros (el álbum debe tener al menos uno de los géneros seleccionados)
                if selected_genres:
                    album_genres = album.get('genres', [])
                    if not album_genres or not any(g in selected_genres for g in album_genres):
                        continue
                filtered_albums.append(album)
            albums = filtered_albums
            
            # Filtrar merchandising (solo por artista, merch NO tiene géneros según YAML)
            filtered_merch = []
            for item in merch:
                # Verificar artista
                if selected_artists and item.get('artistId') not in selected_artists:
                    continue
                # Si se seleccionaron géneros pero merch no tiene géneros, ocultar el merch
                if selected_genres:
                    # Merchandising no tiene campo genres, así que lo ocultamos si hay filtro de género activo
                    continue
                filtered_merch.append(item)
            merch = filtered_merch

        # Obtener géneros y artistas para los filtros
        genres_resp = requests.get(f"{servers.TYA}/genres", timeout=5, headers={"Accept": "application/json"})
        all_genres = genres_resp.json() if genres_resp.ok else []
        
        # Obtener todos los artistas
        artists_resp = requests.get(
            f"{servers.TYA}/artist/filter",
            params={"order": "name", "direction": "asc"},
            timeout=10,
            headers={"Accept": "application/json"}
        )
        if artists_resp.ok:
            artist_ids = artists_resp.json()
            if artist_ids:
                artists_list_resp = requests.get(
                    f"{servers.TYA}/artist/list",
                    params={"ids": ",".join(map(str, artist_ids))},
                    timeout=10,
                    headers={"Accept": "application/json"}
                )
                all_artists = artists_list_resp.json() if artists_list_resp.ok else []
            else:
                all_artists = []
        else:
            all_artists = []

        # Crear mapeos
        artists_map = {a.get('artistId'): a.get('artisticName') for a in all_artists if isinstance(a, dict) and a.get('artistId')}
        genres_map = {g.get('id'): g.get('name') for g in all_genres if isinstance(g, dict) and g.get('id')}

        print(f"[DEBUG] Shop filtered: {len(songs)} songs, {len(albums)} albums, {len(merch)} merch")

    except Exception as e:
        print(f"Error en shop: {e}")
        import traceback
        traceback.print_exc()
        songs, albums, merch = [], [], []
        all_genres, all_artists = [], []
        artists_map, genres_map = {}, {}

    return osv.get_shop_view(
        request, userdata, 
        songs, all_genres, all_artists, albums, merch,
        artists_map, genres_map, servers.TYA
    )

@app.get("/cart")
async def get_cart(request: Request):
    """
    Endpoint del carrito que responde con HTML o JSON según el header Accept
    - Si Accept contiene 'application/json': devuelve JSON con los productos del carrito
    - Si Accept contiene 'text/html': renderiza la página HTML del carrito
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    # Obtener el header Accept
    accept_header = request.headers.get("accept", "")
    
    # Si la petición espera JSON (llamada desde JavaScript)
    if "application/json" in accept_header:
        if not userdata:
            return JSONResponse(content={"error": "No autenticado"}, status_code=401)
        
        try:
            cart_resp = requests.get(
                f"{servers.TPP}/cart",
                timeout=5,
                headers={"Accept": "application/json", "Cookie": f"oversound_auth={token}"}
            )
            cart_resp.raise_for_status()
            return JSONResponse(content=cart_resp.json(), status_code=cart_resp.status_code)
        except requests.RequestException as e:
            print(f"Error obteniendo carrito: {e}")
            return JSONResponse(content={"error": "No se pudo obtener el carrito"}, status_code=500)
    
    # Si la petición espera HTML (navegación normal)
    else:
        if not userdata:
            return RedirectResponse("/login")
        
        # Renderizar la vista del carrito
        return osv.get_cart_view(request, userdata, servers.TYA, servers.PT)

# ============ ENDPOINTS DE BÚSQUEDA ============

@app.get("/api/search/song")
def search_songs(q: str = Query(..., min_length=3)):
    """
    Busca canciones por query y devuelve los datos completos
    """
    try:
        # Buscar (devuelve lista de objetos con songId)
        search_resp = requests.get(
            f"{servers.TYA}/song/search",
            params={"q": q},
            timeout=5,
            headers={"Accept": "application/json"}
        )
        
        if not search_resp.ok:
            return JSONResponse(content=[], status_code=200)
        
        song_objects = search_resp.json()
        
        if not song_objects or len(song_objects) == 0:
            return JSONResponse(content=[], status_code=200)
        
        # Extraer IDs de los objetos
        song_ids = [obj.get('songId') for obj in song_objects if obj.get('songId')]
        
        if not song_ids:
            return JSONResponse(content=[], status_code=200)
        
        # Resolver datos completos con IDs separados por comas en el parámetro
        ids_string = ','.join(map(str, song_ids))
        list_resp = requests.get(
            f"{servers.TYA}/song/list",
            params={"ids": ids_string},
            timeout=5,
            headers={"Accept": "application/json"}
        )

        # Para el autor, resolver su nombre artístico
        fix_list = list_resp.json()
        for song in fix_list:
            artist_id = song.get('artistId')
            if artist_id:
                try:
                    artist_resp = requests.get(
                    f"{servers.TYA}/artist/{artist_id}",
                    timeout=5,
                    headers={"Accept": "application/json"}
                    )
                    if artist_resp.ok:
                        artist_data = artist_resp.json()
                        song['artistName'] = artist_data.get('artisticName', 'Artista desconocido')
                    else:
                        song['artistName'] = 'Artista desconocido'
                    
                except requests.RequestException:
                    song['artistName'] = 'Artista desconocido'
        
        if list_resp.ok:
            print(fix_list)
            return JSONResponse(content=fix_list, status_code=200)
        else:
            return JSONResponse(content=[], status_code=200)
            
    except requests.RequestException as e:
        print(f"Error buscando canciones: {e}")
        return JSONResponse(content=[], status_code=200)

@app.get("/api/search/album")
def search_albums(q: str = Query(..., min_length=3)):
    """
    Busca álbumes por query y devuelve los datos completos
    """
    try:
        # Buscar (devuelve lista de objetos con albumId)
        search_resp = requests.get(
            f"{servers.TYA}/album/search",
            params={"q": q},
            timeout=5,
            headers={"Accept": "application/json"}
        )
        
        if not search_resp.ok:
            return JSONResponse(content=[], status_code=200)
        
        album_objects = search_resp.json()
        
        if not album_objects or len(album_objects) == 0:
            return JSONResponse(content=[], status_code=200)
        
        # Extraer IDs de los objetos
        album_ids = [obj.get('albumId') for obj in album_objects if obj.get('albumId')]
        
        if not album_ids:
            return JSONResponse(content=[], status_code=200)
        
        # Resolver datos completos con IDs separados por comas en el parámetro
        ids_string = ','.join(map(str, album_ids))
        list_resp = requests.get(
            f"{servers.TYA}/album/list",
            params={"ids": ids_string},
            timeout=5,
            headers={"Accept": "application/json"}
        )
        
        # Para el autor, resolver su nombre artístico
        fix_list = list_resp.json()
        for album in fix_list:
            artist_id = album.get('artistId')
            if artist_id:
                try:
                    artist_resp = requests.get(
                    f"{servers.TYA}/artist/{artist_id}",
                    timeout=5,
                    headers={"Accept": "application/json"}
                    )
                    if artist_resp.ok:
                        artist_data = artist_resp.json()
                        album['artistName'] = artist_data.get('artisticName', 'Artista desconocido')
                    else:
                        album['artistName'] = 'Artista desconocido'
                    
                except requests.RequestException:
                    album['artistName'] = 'Artista desconocido'

        if list_resp.ok:
            print(fix_list)
            return JSONResponse(content=fix_list, status_code=200)
        else:
            return JSONResponse(content=[], status_code=200)
            
    except requests.RequestException as e:
        print(f"Error buscando álbumes: {e}")
        return JSONResponse(content=[], status_code=200)

@app.get("/api/search/artist")
def search_artists(q: str = Query(..., min_length=3)):
    """
    Busca artistas por query y devuelve los datos completos
    """
    try:
        # Buscar (devuelve lista de objetos con artistId)
        search_resp = requests.get(
            f"{servers.TYA}/artist/search",
            params={"q": q},
            timeout=5,
            headers={"Accept": "application/json"}
        )
        
        if not search_resp.ok:
            return JSONResponse(content=[], status_code=200)
        
        artist_objects = search_resp.json()
        
        if not artist_objects or len(artist_objects) == 0:
            return JSONResponse(content=[], status_code=200)
        
        # Extraer IDs de los objetos
        artist_ids = [obj.get('artistId') for obj in artist_objects if obj.get('artistId')]
        
        if not artist_ids:
            return JSONResponse(content=[], status_code=200)
        
        # Resolver datos completos con IDs separados por comas en el parámetro
        ids_string = ','.join(map(str, artist_ids))
        list_resp = requests.get(
            f"{servers.TYA}/artist/list",
            params={"ids": ids_string},
            timeout=5,
            headers={"Accept": "application/json"}
        )
        
        if list_resp.ok:
            print(list_resp.json())            
            return JSONResponse(content=list_resp.json(), status_code=200)
        else:
            return JSONResponse(content=[], status_code=200)
            
    except requests.RequestException as e:
        print(f"Error buscando artistas: {e}")
        return JSONResponse(content=[], status_code=200)

@app.get("/api/search/merch")
def search_merch(q: str = Query(..., min_length=3)):
    """
    Busca merchandising por query y devuelve los datos completos
    """
    try:
        # Buscar (devuelve lista de objetos con merchId)
        search_resp = requests.get(
            f"{servers.TYA}/merch/search",
            params={"q": q},
            timeout=5,
            headers={"Accept": "application/json"}
        )
        
        if not search_resp.ok:
            return JSONResponse(content=[], status_code=200)
        
        merch_objects = search_resp.json()
        
        if not merch_objects or len(merch_objects) == 0:
            return JSONResponse(content=[], status_code=200)
        
        # Extraer IDs de los objetos
        merch_ids = [obj.get('merchId') for obj in merch_objects if obj.get('merchId')]
        
        if not merch_ids:
            return JSONResponse(content=[], status_code=200)
        
        # Resolver datos completos con IDs separados por comas en el parámetro
        ids_string = ','.join(map(str, merch_ids))
        list_resp = requests.get(
            f"{servers.TYA}/merch/list",
            params={"ids": ids_string},
            timeout=5,
            headers={"Accept": "application/json"}
        )
        
        if list_resp.ok:
            print(list_resp.json())            
            return JSONResponse(content=list_resp.json(), status_code=200)
        else:
            return JSONResponse(content=[], status_code=200)
            
    except requests.RequestException as e:
        print(f"Error buscando merchandising: {e}")
        return JSONResponse(content=[], status_code=200)


@app.get("/giftcard")
def giftcard(request: Request):
    """
    Ruta para mostrar la página de compra de tarjetas regalo
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    return osv.get_giftcard_view(request, userdata, servers.SYU)


@app.post("/giftcard")
async def purchase_giftcard(request: Request):
    """
    Ruta para procesar la compra de una tarjeta regalo
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return JSONResponse(content={"error": "No autenticado"}, status_code=401)
    
    try:
        body = await request.json()
        
        # Validar datos
        amount = body.get('amount')
        recipient_email = body.get('recipient_email')
        message = body.get('message', '')
        
        if not amount or not isinstance(amount, (int, float)):
            return JSONResponse(content={"error": "Monto inválido"}, status_code=400)
        
        if amount < 5 or amount > 500:
            return JSONResponse(content={"error": "El monto debe estar entre €5 y €500"}, status_code=400)
        
        if not recipient_email or '@' not in recipient_email:
            return JSONResponse(content={"error": "Email inválido"}, status_code=400)
        
        if len(message) > 200:
            return JSONResponse(content={"error": "El mensaje es demasiado largo"}, status_code=400)
        
        # Generar código único de tarjeta regalo
        import uuid
        giftcard_code = str(uuid.uuid4()).upper()[:16]
        # Formatear como XXXX-XXXX-XXXX-XXXX
        giftcard_code = '-'.join([giftcard_code[i:i+4] for i in range(0, len(giftcard_code), 4)])
        
        # Aquí se podría guardar en la base de datos la tarjeta regalo
        # Por ahora, simplemente retornar el código generado
        # En producción, esto debería:
        # 1. Procesar el pago
        # 2. Guardar la tarjeta en la base de datos
        # 3. Enviar email al destinatario
        
        return JSONResponse(content={
            "message": "Tarjeta regalo comprada exitosamente",
            "code": giftcard_code,
            "amount": amount,
            "recipient_email": recipient_email
        }, status_code=200)
    
    except Exception as e:
        print(e)
        return JSONResponse(content={"error": "Error al procesar la compra"}, status_code=500)


@app.get("/terms")
def get_terms(request: Request):
    """
    Ruta para mostrar términos de uso
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    return osv.get_terms_view(request, userdata, servers.SYU)


@app.get("/privacy")
def get_privacy(request: Request):
    """
    Ruta para mostrar política de privacidad
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    return osv.get_privacy_view(request, userdata, servers.SYU)


@app.get("/cookies")
def get_cookies(request: Request):
    """
    Ruta para mostrar política de cookies
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    return osv.get_cookies_view(request, userdata, servers.SYU)


@app.get("/faq")
def get_faq(request: Request):
    """
    Ruta para mostrar preguntas frecuentes
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    return osv.get_faq_view(request, userdata, servers.SYU)


@app.get("/contact")
def get_contact(request: Request):
    """
    Ruta para mostrar formulario de contacto
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    return osv.get_contact_view(request, userdata, servers.SYU)


@app.get("/help")
def get_help(request: Request):
    """
    Ruta para mostrar centro de ayuda
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    return osv.get_help_view(request, userdata, servers.SYU)


# ===================== UPLOAD ROUTES =====================
@app.get("/song/upload")
def upload_song_page(request: Request):
    """
    Ruta para mostrar la página de subir canción
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return RedirectResponse("/login")
    
    # Verificar que el usuario sea un artista
    if not userdata.get('artistId'):
        return osv.get_error_view(request, userdata, "Debes ser un artista para subir canciones", "")
    
    return osv.get_upload_song_view(request, userdata)


@app.post("/song/upload")
async def upload_song(request: Request):
    """
    Ruta para procesar la subida de una canción
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return JSONResponse(content={"error": "No autenticado"}, status_code=401)
    
    if not userdata.get('artistId'):
        return JSONResponse(content={"error": "Debes ser un artista"}, status_code=403)
    
    try:
        body = await request.json()
        
        # Agregar el ID del artista
        body['artistId'] = userdata.get('artistId')
        
        # Enviar a TYA para crear la canción
        song_resp = requests.post(
            f"{servers.TYA}/song/upload",
            json=body,
            timeout=15,
            headers={"Accept": "application/json"}
        )
        
        if song_resp.ok:
            song_data = song_resp.json()
            return JSONResponse(content={
                "message": "Canción subida exitosamente",
                "songId": song_data.get('songId')
            })
        else:
            error_data = song_resp.json() if song_resp.text else {"error": "Error desconocido"}
            return JSONResponse(content=error_data, status_code=song_resp.status_code)
    
    except Exception as e:
        print(f"Error subiendo canción: {e}")
        return JSONResponse(content={"error": "Error al subir la canción"}, status_code=500)


@app.get("/album/upload")
def upload_album_page(request: Request):
    """
    Ruta para mostrar la página de subir álbum
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return RedirectResponse("/login")
    
    # Verificar que el usuario sea un artista
    if not userdata.get('artistId'):
        return osv.get_error_view(request, userdata, "Debes ser un artista para crear álbumes", "")
    
    return osv.get_upload_album_view(request, userdata)


@app.post("/album/upload")
async def upload_album(request: Request):
    """
    Ruta para procesar la creación de un álbum
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return JSONResponse(content={"error": "No autenticado"}, status_code=401)
    
    if not userdata.get('artistId'):
        return JSONResponse(content={"error": "Debes ser un artista"}, status_code=403)
    
    try:
        body = await request.json()
        
        # Agregar el ID del artista
        body['artistId'] = userdata.get('artistId')
        
        # Enviar a TYA para crear el álbum
        album_resp = requests.post(
            f"{servers.TYA}/album/upload",
            json=body,
            timeout=15,
            headers={"Accept": "application/json"}
        )
        
        if album_resp.ok:
            album_data = album_resp.json()
            return JSONResponse(content={
                "message": "Álbum creado exitosamente",
                "albumId": album_data.get('albumId')
            })
        else:
            error_data = album_resp.json() if album_resp.text else {"error": "Error desconocido"}
            return JSONResponse(content=error_data, status_code=album_resp.status_code)
    
    except Exception as e:
        print(f"Error creando álbum: {e}")
        return JSONResponse(content={"error": "Error al crear el álbum"}, status_code=500)


# Upload Merchandising Routes
@app.get("/merch/upload")
def upload_merch_page(request: Request):
    """
    Ruta para mostrar la página de subir merchandising
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return RedirectResponse("/login")
    
    # Verificar que el usuario sea un artista
    if not userdata.get('artistId'):
        return osv.get_error_view(request, userdata, "Debes ser un artista para subir merchandising", "")
    
    return osv.get_upload_merch_view(request, userdata)


@app.post("/merch/upload")
async def upload_merch(request: Request):
    """
    Ruta para procesar la subida de merchandising
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return JSONResponse(content={"error": "No autenticado"}, status_code=401)
    
    if not userdata.get('artistId'):
        return JSONResponse(content={"error": "Debes ser un artista"}, status_code=403)
    
    try:
        body = await request.json()
        
        # Agregar el ID del artista
        body['artistId'] = userdata.get('artistId')
        
        # Enviar a TYA para crear el merchandising
        merch_resp = requests.post(
            f"{servers.TYA}/merch/upload",
            json=body,
            timeout=15,
            headers={"Accept": "application/json"}
        )
        
        if merch_resp.ok:
            merch_data = merch_resp.json()
            return JSONResponse(content={
                "message": "Merchandising subido exitosamente",
                "merchId": merch_data.get('merchId')
            })
        else:
            error_data = merch_resp.json() if merch_resp.text else {"error": "Error desconocido"}
            return JSONResponse(content=error_data, status_code=merch_resp.status_code)
    
    except Exception as e:
        print(f"Error subiendo merchandising: {e}")
        return JSONResponse(content={"error": "Error al subir el merchandising"}, status_code=500)


@app.get("/user/{username}")
def register(request: Request, username: str):
    token = request.cookies.get("session")
    userdata = requests.get(f"{servers.SYU}/user/{username}", timeout=2, headers={"Accept": "application/json", "Cookie": f"oversound_auth={token}"})
    userdata.raise_for_status()
    return userdata.json()


@app.delete("/song/{songId}")
async def delete_song(request: Request, songId: int):
    """
    Ruta para eliminar una canción
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return JSONResponse(content={"error": "No autenticado"}, status_code=401)
    
    try:
        # Primero obtener los datos de la canción para verificar la propiedad
        song_resp = requests.get(f"{servers.TYA}/song/{songId}", timeout=2, headers={"Accept": "application/json"})
        song_resp.raise_for_status()
        song_data = song_resp.json()
        
        # Verificar que el usuario sea el artista propietario
        if userdata.get('artistId') != song_data.get('artistId'):
            return JSONResponse(content={"error": "No tienes permisos para eliminar esta canción"}, status_code=403)
        
        # Eliminar la canción
        delete_resp = requests.delete(
            f"{servers.TYA}/song/{songId}",
            timeout=5,
            headers={"Accept": "application/json", "Cookie": f"oversound_auth={token}"}
        )
        
        if delete_resp.ok:
            return JSONResponse(content={"message": "Canción eliminada exitosamente"})
        else:
            error_data = delete_resp.json() if delete_resp.text else {"error": "Error desconocido"}
            return JSONResponse(content=error_data, status_code=delete_resp.status_code)
    
    except requests.RequestException as e:
        print(f"Error eliminando canción: {e}")
        return JSONResponse(content={"error": "Error al eliminar la canción"}, status_code=500)


@app.get("/song/{songId}")
def get_song(request: Request, songId: int):
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    try:
        # Obtener información de la canción
        song_resp = requests.get(f"{servers.TYA}/song/{songId}", timeout=2, headers={"Accept": "application/json"})
        song_resp.raise_for_status()
        song_data = song_resp.json()
        
        # Resolver artista principal
        try:
            artist_resp = requests.get(f"{servers.TYA}/artist/{song_data['artistId']}", timeout=2, headers={"Accept": "application/json"})
            artist_resp.raise_for_status()
            song_data['artist'] = artist_resp.json()
        except requests.RequestException:
            song_data['artist'] = {"artistId": song_data['artistId'], "nombre": "Artista desconocido"}
        
        # Resolver colaboradores
        collaborators = []
        if song_data.get('collaborators'):
            for collab_id in song_data['collaborators']:
                try:
                    collab_resp = requests.get(f"{servers.TYA}/artist/{collab_id}", timeout=2, headers={"Accept": "application/json"})
                    collab_resp.raise_for_status()
                    collaborators.append(collab_resp.json())
                except requests.RequestException:
                    collaborators.append({"artistId": collab_id, "nombre": "Artista desconocido"})
        song_data['collaborators_data'] = collaborators
        
        # Resolver géneros
        genres = []
        if song_data.get('genres'):
            try:
                genres_resp = requests.get(f"{servers.TYA}/genres", timeout=2, headers={"Accept": "application/json"})
                genres_resp.raise_for_status()
                all_genres = genres_resp.json()
                genres = [g for g in all_genres if g['id'] in song_data['genres']]
            except requests.RequestException:
                pass
        song_data['genres_data'] = genres
        
        # Resolver álbum original si existe
        if song_data.get('albumId') is not None:
            try:
                album_resp = requests.get(f"{servers.TYA}/album/{song_data['albumId']}", timeout=2, headers={"Accept": "application/json"})
                album_resp.raise_for_status()
                album_data = album_resp.json()
                
                # Resolver artista del álbum
                try:
                    album_artist_resp = requests.get(f"{servers.TYA}/artist/{album_data['artistId']}", timeout=2, headers={"Accept": "application/json"})
                    album_artist_resp.raise_for_status()
                    album_data['artist'] = album_artist_resp.json()
                except requests.RequestException:
                    album_data['artist'] = {"artistId": album_data['artistId'], "nombre": "Artista desconocido"}
                
                song_data['original_album'] = album_data
            except requests.RequestException:
                song_data['original_album'] = None
        else:
            song_data['original_album'] = None
        
        # Resolver álbumes linkeados
        linked_albums_data = []
        if song_data.get('linked_albums'):
            for linked_album_id in song_data['linked_albums']:
                try:
                    linked_album_resp = requests.get(f"{servers.TYA}/album/{linked_album_id}", timeout=2, headers={"Accept": "application/json"})
                    linked_album_resp.raise_for_status()
                    linked_album_data = linked_album_resp.json()
                    
                    # Resolver artista del álbum linkeado
                    try:
                        linked_artist_resp = requests.get(f"{servers.TYA}/artist/{linked_album_data['artistId']}", timeout=2, headers={"Accept": "application/json"})
                        linked_artist_resp.raise_for_status()
                        linked_album_data['artist'] = linked_artist_resp.json()
                    except requests.RequestException:
                        linked_album_data['artist'] = {"artistId": linked_album_data['artistId'], "nombre": "Artista desconocido"}
                    
                    linked_albums_data.append(linked_album_data)
                except requests.RequestException:
                    pass  # Ignorar álbumes que no se puedan cargar
        song_data['linked_albums_data'] = linked_albums_data
        
        # Normalizar URLs de imágenes
        if song_data.get('cover'):
            song_data['cover'] = normalize_image_url(song_data['cover'], servers.TYA)
        if song_data.get('original_album') and song_data['original_album'].get('cover'):
            song_data['original_album']['cover'] = normalize_image_url(song_data['original_album']['cover'], servers.TYA)
        for linked_album in song_data.get('linked_albums_data', []):
            if linked_album.get('cover'):
                linked_album['cover'] = normalize_image_url(linked_album['cover'], servers.TYA)
        
        # Asegurarse de que el precio sea un número
        try:
            song_data['price'] = float(song_data.get('price', 0))
        except ValueError:
            song_data['price'] = 0.0
        
        # Determinar si está en favoritos
        isLiked = False
        if userdata:
            try:
                fav_resp = requests.get(f"{servers.SYU}/favs/songs", timeout=2, headers={"Accept": "application/json", "Cookie": f"oversound_auth={token}"})
                if fav_resp.ok:
                    fav_songs = fav_resp.json()
                    # fav_songs puede ser lista de ids (integers) o objetos con id
                    isLiked = songId in [item if isinstance(item, int) else item.get('id', 0) for item in fav_songs]
            except requests.RequestException:
                pass
        
        # Determinar si está en carrito (por ahora False, implementar después)
        inCarrito = False
        
        # Determinar tipo de usuario (0: no autenticado, 1: usuario, 2: artista)
        tipoUsuario = 0
        if userdata:
            tipoUsuario = 1  # TODO: Implementar lógica para distinguir artista

        metrics = None
        try:
            metrics_resp = requests.get(f"{servers.RYE}/statistics/metrics/song/{songId}", timeout=5)
            metrics_resp.raise_for_status()
            metrics_data = metrics_resp.json()
            print(f"[DEBUG] Metrics response data: {metrics_data}")
            metrics = {
            "sales": metrics_data.get("sales", 0),
            "downloads": metrics_data.get("downloads", 0),
            "playbacks": metrics_data.get("playbacks", 0)
            }
        except requests.RequestException as e:
            print(f"Error obteniendo métricas del artista: {e}")
            metrics = {"playbacks": 0, "sales": 0, "downloads": 0}
        
        return osv.get_song_view(request, song_data, tipoUsuario, userdata, isLiked, inCarrito, servers.SYU, metrics, servers.TYA, servers.RYE, servers.PT)
        
    except requests.RequestException as e:
        # En caso de error, mostrar página de error
        print(e)
        return osv.get_error_view(request, userdata, f"No se pudo cargar la canción", str(e))


@app.get("/song/{songId}/edit")
def get_song_edit_page(request: Request, songId: int):
    """
    Ruta para mostrar la página de edición de una canción
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return RedirectResponse("/login")
    
    # Verificar que el usuario sea un artista
    if not userdata.get('artistId'):
        return osv.get_error_view(request, userdata, "Debes ser un artista para editar canciones", "")
    
    try:
        # Obtener datos de la canción
        song_resp = requests.get(f"{servers.TYA}/song/{songId}", timeout=5, headers={"Accept": "application/json"})
        song_resp.raise_for_status()
        song_data = song_resp.json()
        
        # Verificar que el usuario sea el propietario
        if userdata.get('artistId') != song_data.get('artistId'):
            return osv.get_error_view(request, userdata, "No tienes permiso para editar esta canción", "")
        
        # Obtener géneros disponibles
        try:
            genres_resp = requests.get(f"{servers.TYA}/genres", timeout=5, headers={"Accept": "application/json"})
            genres_resp.raise_for_status()
            genres = genres_resp.json()
        except requests.RequestException:
            genres = []
        
        # Obtener artistas para colaboradores
        try:
            artists_resp = requests.get(f"{servers.TYA}/artist/list?ids=1", timeout=5, headers={"Accept": "application/json"})
            artists_resp.raise_for_status()
            artists = artists_resp.json()
        except requests.RequestException:
            artists = []
        
        song_data['genres_list'] = genres
        song_data['artists_list'] = artists
        
        return osv.get_song_edit_view(request, userdata, song_data, servers.TYA)
        
    except requests.RequestException as e:
        print(f"Error obteniendo datos de la canción: {e}")
        return osv.get_error_view(request, userdata, "No se pudo cargar los datos de la canción", str(e))


@app.patch("/song/{songId}/edit")
async def update_song(request: Request, songId: int):
    """
    Ruta para actualizar una canción
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return JSONResponse(content={"error": "No autenticado"}, status_code=401)
    
    if not userdata.get('artistId'):
        return JSONResponse(content={"error": "Debes ser un artista"}, status_code=403)
    
    try:
        # Primero verificar propiedad
        song_resp = requests.get(f"{servers.TYA}/song/{songId}", timeout=2, headers={"Accept": "application/json"})
        song_resp.raise_for_status()
        song_data = song_resp.json()
        
        if userdata.get('artistId') != song_data.get('artistId'):
            return JSONResponse(content={"error": "No tienes permiso para editar esta canción"}, status_code=403)
        
        # Obtener datos del formulario
        body = await request.json()
        
        # Enviar actualización a TYA
        update_resp = requests.patch(
            f"{servers.TYA}/song/{songId}",
            json=body,
            timeout=5,
            headers={"Accept": "application/json", "Cookie": f"oversound_auth={token}"}
        )
        update_resp.raise_for_status()
        
        return JSONResponse(content={"message": "Canción actualizada correctamente", "songId": songId}, status_code=200)
        
    except requests.RequestException as e:
        error_msg = str(e)
        try:
            error_msg = e.response.json().get('message', str(e))
        except:
            pass
        return JSONResponse(content={"message": error_msg}, status_code=500)


@app.delete("/album/{albumId}")
async def delete_album(request: Request, albumId: int):
    """
    Ruta para eliminar un álbum
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return JSONResponse(content={"error": "No autenticado"}, status_code=401)
    
    try:
        # Primero obtener los datos del álbum para verificar la propiedad
        album_resp = requests.get(f"{servers.TYA}/album/{albumId}", timeout=2, headers={"Accept": "application/json"})
        album_resp.raise_for_status()
        album_data = album_resp.json()
        
        # Verificar que el usuario sea el artista propietario
        if userdata.get('artistId') != album_data.get('artistId'):
            return JSONResponse(content={"error": "No tienes permisos para eliminar este álbum"}, status_code=403)
        
        # Eliminar el álbum
        delete_resp = requests.delete(
            f"{servers.TYA}/album/{albumId}",
            timeout=5,
            headers={"Accept": "application/json", "Cookie": f"oversound_auth={token}"}
        )
        
        if delete_resp.ok:
            return JSONResponse(content={"message": "Álbum eliminado exitosamente"})
        else:
            error_data = delete_resp.json() if delete_resp.text else {"error": "Error desconocido"}
            return JSONResponse(content=error_data, status_code=delete_resp.status_code)
    
    except requests.RequestException as e:
        print(f"Error eliminando álbum: {e}")
        return JSONResponse(content={"error": "Error al eliminar el álbum"}, status_code=500)


@app.get("/album/{albumId}")
def get_album(request: Request, albumId: int):
    """
    Ruta para mostrar un álbum específico desde la tienda
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    try:
        # Obtener información del álbum
        album_resp = requests.get(f"{servers.TYA}/album/{albumId}", timeout=2, headers={"Accept": "application/json"})
        album_resp.raise_for_status()
        album_data = album_resp.json()
        
        # Resolver artista principal del álbum
        try:
            artist_resp = requests.get(f"{servers.TYA}/artist/{album_data['artistId']}", timeout=2, headers={"Accept": "application/json"})
            artist_resp.raise_for_status()
            album_data['artist'] = artist_resp.json()
        except requests.RequestException:
            album_data['artist'] = {"artistId": album_data['artistId'], "artisticName": "Artista desconocido"}
        
        # Resolver géneros
        genres = []
        if album_data.get('genres'):
            try:
                genres_resp = requests.get(f"{servers.TYA}/genres", timeout=2, headers={"Accept": "application/json"})
                genres_resp.raise_for_status()
                all_genres = genres_resp.json()
                genres = [g for g in all_genres if g['id'] in album_data['genres']]
            except requests.RequestException:
                pass
        album_data['genres_data'] = genres
        
        # Resolver canciones del álbum usando /song/list
        songs = []
        if album_data.get('songs'):
            try:
                # Obtener todas las canciones en una sola petición
                song_ids = ','.join(str(sid) for sid in album_data['songs'])
                songs_resp = requests.get(f"{servers.TYA}/song/list?ids={song_ids}", timeout=2, headers={"Accept": "application/json"})
                songs_resp.raise_for_status()
                songs_list = songs_resp.json()
                
                # Resolver artistas de las canciones
                for song_data in songs_list:
                    try:
                        song_artist_resp = requests.get(f"{servers.TYA}/artist/{song_data['artistId']}", timeout=2, headers={"Accept": "application/json"})
                        song_artist_resp.raise_for_status()
                        song_data['artist'] = song_artist_resp.json()
                    except requests.RequestException:
                        song_data['artist'] = {"artistId": song_data['artistId'], "artisticName": "Artista desconocido"}
                    songs.append(song_data)
            except requests.RequestException:
                pass  # Si no se pueden cargar, dejar vacío
        
        # Ordenar canciones por albumOrder si existe (None se trata como 999 para ordenar al final)
        songs = sorted(songs, key=lambda x: x.get('albumOrder') if x.get('albumOrder') is not None else 999)
        album_data['songs_data'] = songs
        
        # Resolver álbumes relacionados del mismo artista usando el campo owner_albums del artista
        related_albums = []
        if album_data.get('artist') and album_data['artist'].get('owner_albums'):
            try:
                # Excluir el álbum actual y tomar máximo 6
                related_ids = [aid for aid in album_data['artist']['owner_albums'] if aid != albumId][:6]
                if related_ids:
                    related_ids_str = ','.join(str(aid) for aid in related_ids)
                    related_resp = requests.get(f"{servers.TYA}/album/list?ids={related_ids_str}", timeout=2, headers={"Accept": "application/json"})
                    related_resp.raise_for_status()
                    related_albums = related_resp.json()
            except requests.RequestException:
                pass  # Si no se pueden cargar, dejar vacío
        album_data['related_albums'] = related_albums
        
        # Normalizar URLs de imágenes
        if album_data.get('cover'):
            album_data['cover'] = normalize_image_url(album_data['cover'], servers.TYA)
        for song in album_data.get('songs_data', []):
            if song.get('cover'):
                song['cover'] = normalize_image_url(song['cover'], servers.TYA)
        for related in album_data.get('related_albums', []):
            if related.get('cover'):
                related['cover'] = normalize_image_url(related['cover'], servers.TYA)
        
        # Asegurarse de que el precio sea un número
        try:
            album_data['price'] = float(album_data.get('price', 0))
        except ValueError:
            album_data['price'] = 0.0
        
        # Calcular duración total del álbum
        total_duration = 0
        for song in songs:
            if song.get('duration'):
                try:
                    total_duration += int(song['duration'])
                except (ValueError, TypeError):
                    pass  # Si no se puede convertir, ignorar
        
        # Formatear duración total
        minutes = total_duration // 60
        seconds = total_duration % 60
        tiempo_formateado = f"{minutes}:{seconds:02d}"
        
        # Determinar si está en favoritos y carrito (por ahora False, implementar después)
        isLiked = False
        if userdata:
            try:
                fav_resp = requests.get(f"{servers.SYU}/favs/albums", timeout=2, headers={"Accept": "application/json", "Cookie": f"oversound_auth={token}"})
                if fav_resp.ok:
                    fav_albums = fav_resp.json()
                    # Manejar tanto listas de objetos como listas de IDs
                    if fav_albums and len(fav_albums) > 0:
                        if isinstance(fav_albums[0], dict):
                            # Lista de objetos con 'albumId'
                            isLiked = albumId in [fav.get('albumId') for fav in fav_albums]
                        else:
                            # Lista de IDs directamente
                            isLiked = albumId in fav_albums
            except requests.RequestException:
                pass  # Si no se pueden cargar favoritos, asumir False
        inCarrito = False
        
        # Determinar tipo de usuario (0: no autenticado, 1: usuario, 2: artista)
        tipoUsuario = 0
        if userdata:
            tipoUsuario = 1  # TODO: Implementar lógica para distinguir artista
        
        return osv.get_album_view(request, album_data, tipoUsuario, isLiked, inCarrito, tiempo_formateado, userdata, servers.PT)
        
    except requests.RequestException as e:
        # En caso de error, mostrar página de error
        return osv.get_error_view(request, userdata, f"No se pudo cargar el álbum", str(e))


@app.get("/album/{albumId}/edit")
def get_album_edit_page(request: Request, albumId: int):
    """
    Ruta para mostrar la página de edición de un álbum
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return RedirectResponse("/login")
    
    # Verificar que el usuario sea un artista
    if not userdata.get('artistId'):
        return osv.get_error_view(request, userdata, "Debes ser un artista para editar álbumes", "")
    
    try:
        # Obtener datos del álbum
        album_resp = requests.get(f"{servers.TYA}/album/{albumId}", timeout=5, headers={"Accept": "application/json"})
        album_resp.raise_for_status()
        album_data = album_resp.json()
        
        # Verificar que el usuario sea el propietario
        if userdata.get('artistId') != album_data.get('artistId'):
            return osv.get_error_view(request, userdata, "No tienes permiso para editar este álbum", "")
        
        # Obtener canciones disponibles del artista
        try:
            songs_resp = requests.get(f"{servers.TYA}/artist/{userdata.get('artistId')}/songs", timeout=5, headers={"Accept": "application/json"})
            songs_resp.raise_for_status()
            artist_songs = songs_resp.json()
        except requests.RequestException:
            artist_songs = []
        
        album_data['artist_songs'] = artist_songs
        
        return osv.get_album_edit_view(request, userdata, album_data, servers.TYA)
        
    except requests.RequestException as e:
        print(f"Error obteniendo datos del álbum: {e}")
        return osv.get_error_view(request, userdata, "No se pudo cargar los datos del álbum", str(e))


@app.patch("/album/{albumId}/edit")
async def update_album(request: Request, albumId: int):
    """
    Ruta para actualizar un álbum
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return JSONResponse(content={"error": "No autenticado"}, status_code=401)
    
    if not userdata.get('artistId'):
        return JSONResponse(content={"error": "Debes ser un artista"}, status_code=403)
    
    try:
        # Primero verificar propiedad
        album_resp = requests.get(f"{servers.TYA}/album/{albumId}", timeout=2, headers={"Accept": "application/json"})
        album_resp.raise_for_status()
        album_data = album_resp.json()
        
        if userdata.get('artistId') != album_data.get('artistId'):
            return JSONResponse(content={"error": "No tienes permiso para editar este álbum"}, status_code=403)
        
        # Obtener datos del formulario
        body = await request.json()
        
        # Enviar actualización a TYA
        update_resp = requests.patch(
            f"{servers.TYA}/album/{albumId}",
            json=body,
            timeout=5,
            headers={"Accept": "application/json", "Cookie": f"oversound_auth={token}"}
        )
        update_resp.raise_for_status()
        
        return JSONResponse(content={"message": "Álbum actualizado correctamente", "albumId": albumId}, status_code=200)
        
    except requests.RequestException as e:
        error_msg = str(e)
        try:
            error_msg = e.response.json().get('message', str(e))
        except:
            pass
        return JSONResponse(content={"message": error_msg}, status_code=500)


@app.delete("/merch/{merchId}")
async def delete_merch(request: Request, merchId: int):
    """
    Ruta para eliminar un producto de merchandising
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return JSONResponse(content={"error": "No autenticado"}, status_code=401)
    
    try:
        # Primero obtener los datos del merch para verificar la propiedad
        merch_resp = requests.get(f"{servers.TYA}/merch/{merchId}", timeout=2, headers={"Accept": "application/json"})
        merch_resp.raise_for_status()
        merch_data = merch_resp.json()
        
        # Verificar que el usuario sea el artista propietario
        if userdata.get('artistId') != merch_data.get('artistId'):
            return JSONResponse(content={"error": "No tienes permisos para eliminar este producto"}, status_code=403)
        
        # Eliminar el merchandising
        delete_resp = requests.delete(
            f"{servers.TYA}/merch/{merchId}",
            timeout=5,
            headers={"Accept": "application/json", "Cookie": f"oversound_auth={token}"}
        )
        
        if delete_resp.ok:
            return JSONResponse(content={"message": "Producto eliminado exitosamente"})
        else:
            error_data = delete_resp.json() if delete_resp.text else {"error": "Error desconocido"}
            return JSONResponse(content=error_data, status_code=delete_resp.status_code)
    
    except requests.RequestException as e:
        print(f"Error eliminando merchandising: {e}")
        return JSONResponse(content={"error": "Error al eliminar el producto"}, status_code=500)


@app.get("/merch/{merchId}")
def get_merch(request: Request, merchId: int):
    """
    Ruta para mostrar un producto de merchandising específico desde la tienda
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    try:
        # Obtener información del merch
        merch_resp = requests.get(f"{servers.TYA}/merch/{merchId}", timeout=2, headers={"Accept": "application/json"})
        merch_resp.raise_for_status()
        merch_data = merch_resp.json()
        
        # Resolver artista principal del merch
        try:
            artist_resp = requests.get(f"{servers.TYA}/artist/{merch_data['artistId']}", timeout=2, headers={"Accept": "application/json"})
            artist_resp.raise_for_status()
            merch_data['artist'] = artist_resp.json()
        except requests.RequestException:
            merch_data['artist'] = {"artistId": merch_data['artistId'], "artisticName": "Artista desconocido"}
        
        # Resolver merchandising relacionado del mismo artista usando owner_merch
        related_merch = []
        if merch_data.get('artist') and merch_data['artist'].get('owner_merch'):
            try:
                # Excluir el merch actual y tomar máximo 6
                related_ids = [mid for mid in merch_data['artist']['owner_merch'] if mid != merchId][:6]
                if related_ids:
                    related_ids_str = ','.join(str(mid) for mid in related_ids)
                    related_resp = requests.get(f"{servers.TYA}/merch/list?ids={related_ids_str}", timeout=2, headers={"Accept": "application/json"})
                    related_resp.raise_for_status()
                    related_merch = related_resp.json()
            except requests.RequestException:
                pass  # Si no se pueden cargar, dejar vacío
        merch_data['related_merch'] = related_merch
        
        # Normalizar URLs de imágenes
        if merch_data.get('cover'):
            merch_data['cover'] = normalize_image_url(merch_data['cover'], servers.TYA)
        for related in merch_data.get('related_merch', []):
            if related.get('cover'):
                related['cover'] = normalize_image_url(related['cover'], servers.TYA)
        
        # Asegurarse de que el precio sea un número
        try:
            merch_data['price'] = float(merch_data.get('price', 0))
        except ValueError:
            merch_data['price'] = 0.0
        
        # Determinar si está en favoritos y carrito (por ahora False, implementar después)
        isLiked = False
        inCarrito = False
        
        # Determinar tipo de usuario (0: no autenticado, 1: usuario, 2: artista)
        tipoUsuario = 0
        if userdata:
            tipoUsuario = 1  # TODO: Implementar lógica para distinguir artista
        
        
        return osv.get_merch_view(request, merch_data, tipoUsuario, isLiked, inCarrito, userdata, servers.SYU)
        
    except requests.RequestException as e:
        # En caso de error, mostrar página de error
        print(e)
        return osv.get_error_view(request, userdata, f"No se pudo cargar el producto de merchandising", str(e))


@app.get("/merch/{merchId}/edit")
def get_merch_edit_page(request: Request, merchId: int):
    """
    Ruta para mostrar la página de edición de un producto de merchandising
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return RedirectResponse("/login")
    
    # Verificar que el usuario sea un artista
    if not userdata.get('artistId'):
        return osv.get_error_view(request, userdata, "Debes ser un artista para editar merchandising", "")
    
    try:
        # Obtener datos del merchandising
        merch_resp = requests.get(f"{servers.TYA}/merch/{merchId}", timeout=5, headers={"Accept": "application/json"})
        merch_resp.raise_for_status()
        merch_data = merch_resp.json()
        
        # Verificar que el usuario sea el propietario
        if userdata.get('artistId') != merch_data.get('artistId'):
            return osv.get_error_view(request, userdata, "No tienes permiso para editar este producto", "")
        
        return osv.get_merch_edit_view(request, userdata, merch_data, servers.TYA)
        
    except requests.RequestException as e:
        print(f"Error obteniendo datos del merchandising: {e}")
        return osv.get_error_view(request, userdata, "No se pudo cargar los datos del producto", str(e))


@app.patch("/merch/{merchId}/edit")
async def update_merch(request: Request, merchId: int):
    """
    Ruta para actualizar un producto de merchandising
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return JSONResponse(content={"error": "No autenticado"}, status_code=401)
    
    if not userdata.get('artistId'):
        return JSONResponse(content={"error": "Debes ser un artista"}, status_code=403)
    
    try:
        # Primero verificar propiedad
        merch_resp = requests.get(f"{servers.TYA}/merch/{merchId}", timeout=2, headers={"Accept": "application/json"})
        merch_resp.raise_for_status()
        merch_data = merch_resp.json()
        
        if userdata.get('artistId') != merch_data.get('artistId'):
            return JSONResponse(content={"error": "No tienes permiso para editar este producto"}, status_code=403)
        
        # Obtener datos del formulario
        body = await request.json()
        
        # Enviar actualización a TYA
        update_resp = requests.patch(
            f"{servers.TYA}/merch/{merchId}",
            json=body,
            timeout=5,
            headers={"Accept": "application/json", "Cookie": f"oversound_auth={token}"}
        )
        update_resp.raise_for_status()
        
        return JSONResponse(content={"message": "Producto actualizado correctamente", "merchId": merchId}, status_code=200)
        
    except requests.RequestException as e:
        error_msg = str(e)
        try:
            error_msg = e.response.json().get('message', str(e))
        except:
            pass
        return JSONResponse(content={"message": error_msg}, status_code=500)


@app.get("/label/{labelId}")
def get_label(request: Request, labelId: int):
    """
    Ruta para mostrar el perfil de una discográfica
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    try:
        # Obtener información de la discográfica
        label_resp = requests.get(f"{servers.TYA}/label/{labelId}", timeout=2, headers={"Accept": "application/json"})
        label_resp.raise_for_status()
        label_data = label_resp.json()
        
        # Resolver artistas de la discográfica
        artists = []
        if label_data.get('artists'):
            for artist_id in label_data['artists']:
                try:
                    artist_resp = requests.get(f"{servers.TYA}/artist/{artist_id}", timeout=2, headers={"Accept": "application/json"})
                    artist_resp.raise_for_status()
                    artists.append(artist_resp.json())
                except requests.RequestException:
                    pass
        label_data['artists'] = artists
        label_data['artists_count'] = len(artists)
        
        # Determinar si es propietario o miembro
        is_owner = userdata and userdata.get('userId') == label_data.get('ownerId')
        is_member = userdata and userdata.get('artistId') in [a.get('artistId') for a in artists]
        
        return osv.get_label_view(request, label_data, is_owner, is_member, userdata, servers.SYU)
        
    except requests.RequestException as e:
        print(e)
        return osv.get_error_view(request, userdata, "No se pudo cargar la discográfica", str(e))


@app.get("/label/create")
def get_label_create(request: Request):
    """
    Ruta para la página de crear discográfica
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return RedirectResponse("/login")
    
    # Verificar si el usuario ya tiene una discográfica
    try:
        existing_label_resp = requests.get(f"{servers.TYA}/user/{userdata.get('userId')}/label", timeout=2, headers={"Accept": "application/json"})
        if existing_label_resp.ok:
            existing_label = existing_label_resp.json()
            if existing_label:
                return RedirectResponse(f"/label/{existing_label.get('id')}/edit")
    except requests.RequestException:
        pass
    
    return osv.get_label_create_view(request, None, userdata, servers.SYU)


@app.get("/label/{labelId}/edit")
def get_label_edit(request: Request, labelId: int):
    """
    Ruta para editar una discográfica existente
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return RedirectResponse("/login")
    
    try:
        # Obtener información de la discográfica
        label_resp = requests.get(f"{servers.TYA}/label/{labelId}", timeout=2, headers={"Accept": "application/json"})
        label_resp.raise_for_status()
        label_data = label_resp.json()
        
        # Verificar que sea propietario
        if label_data.get('ownerId') != userdata.get('userId'):
            return osv.get_error_view(request, userdata, "No tienes permisos para editar esta discográfica", "")
        
        return osv.get_label_create_view(request, label_data, userdata, servers.SYU)
        
    except requests.RequestException as e:
        print(e)
        return osv.get_error_view(request, userdata, "No se pudo cargar la discográfica", str(e))


@app.post("/label/create")
async def create_label(request: Request):
    """
    Ruta para crear una nueva discográfica
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return JSONResponse(content={"error": "No autenticado"}, status_code=401)
    
    try:
        body = await request.json()
        
        # Agregar datos del propietario
        body['ownerId'] = userdata.get('userId')
        
        # Crear la discográfica en la API
        label_resp = requests.post(
            f"{servers.TYA}/label",
            json=body,
            timeout=2,
            headers={"Accept": "application/json"}
        )
        
        if label_resp.ok:
            label_data = label_resp.json()
            return JSONResponse(content={"labelId": label_data.get('id')})
        else:
            error_data = label_resp.json()
            return JSONResponse(content=error_data, status_code=label_resp.status_code)
    
    except Exception as e:
        print(e)
        return JSONResponse(content={"error": "Error al crear la discográfica"}, status_code=500)


@app.put("/label/{labelId}/edit")
async def update_label(request: Request, labelId: int):
    """
    Ruta para actualizar una discográfica
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return JSONResponse(content={"error": "No autenticado"}, status_code=401)
    
    try:
        # Verificar que sea propietario
        label_resp = requests.get(f"{servers.TYA}/label/{labelId}", timeout=2, headers={"Accept": "application/json"})
        label_resp.raise_for_status()
        label_data = label_resp.json()
        
        if label_data.get('ownerId') != userdata.get('userId'):
            return JSONResponse(content={"error": "No tienes permisos"}, status_code=403)
        
        body = await request.json()
        
        # Actualizar la discográfica
        update_resp = requests.put(
            f"{servers.TYA}/label/{labelId}",
            json=body,
            timeout=2,
            headers={"Accept": "application/json"}
        )
        
        if update_resp.ok:
            return JSONResponse(content={"message": "Discográfica actualizada"})
        else:
            error_data = update_resp.json()
            return JSONResponse(content=error_data, status_code=update_resp.status_code)
    
    except Exception as e:
        print(e)
        return JSONResponse(content={"error": "Error al actualizar la discográfica"}, status_code=500)


@app.delete("/label/{labelId}")
async def delete_label(request: Request, labelId: int):
    """
    Ruta para eliminar una discográfica
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return JSONResponse(content={"error": "No autenticado"}, status_code=401)
    
    try:
        # Verificar que sea propietario
        label_resp = requests.get(f"{servers.TYA}/label/{labelId}", timeout=2, headers={"Accept": "application/json"})
        label_resp.raise_for_status()
        label_data = label_resp.json()
        
        if label_data.get('ownerId') != userdata.get('userId'):
            return JSONResponse(content={"error": "No tienes permisos"}, status_code=403)
        
        # Eliminar la discográfica
        delete_resp = requests.delete(
            f"{servers.TYA}/label/{labelId}",
            timeout=2,
            headers={"Accept": "application/json"}
        )
        
        if delete_resp.ok:
            return JSONResponse(content={"message": "Discográfica eliminada"})
        else:
            error_data = delete_resp.json() if delete_resp.text else {}
            return JSONResponse(content=error_data, status_code=delete_resp.status_code)
    
    except Exception as e:
        print(e)
        return JSONResponse(content={"error": "Error al eliminar la discográfica"}, status_code=500)


@app.post("/label/{labelId}/join")
async def join_label(request: Request, labelId: int):
    """
    Ruta para que un artista se una a una discográfica
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return JSONResponse(content={"error": "No autenticado"}, status_code=401)
    
    try:
        # Unirse a la discográfica
        join_resp = requests.post(
            f"{servers.TYA}/label/{labelId}/artist/{userdata.get('artistId')}",
            timeout=2,
            headers={"Accept": "application/json"}
        )
        
        if join_resp.ok:
            return JSONResponse(content={"message": "Te has unido a la discográfica"})
        else:
            error_data = join_resp.json() if join_resp.text else {}
            return JSONResponse(content=error_data, status_code=join_resp.status_code)
    
    except Exception as e:
        print(e)
        return JSONResponse(content={"error": "Error al unirse"}, status_code=500)


@app.post("/label/{labelId}/leave")
async def leave_label(request: Request, labelId: int):
    """
    Ruta para que un artista salga de una discográfica
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return JSONResponse(content={"error": "No autenticado"}, status_code=401)
    
    try:
        # Salir de la discográfica
        leave_resp = requests.delete(
            f"{servers.TYA}/label/{labelId}/artist/{userdata.get('artistId')}",
            timeout=2,
            headers={"Accept": "application/json"}
        )
        
        if leave_resp.ok:
            return JSONResponse(content={"message": "Has salido de la discográfica"})
        else:
            error_data = leave_resp.json() if leave_resp.text else {}
            return JSONResponse(content=error_data, status_code=leave_resp.status_code)
    
    except Exception as e:
        print(e)
        return JSONResponse(content={"error": "Error al salir"}, status_code=500)


@app.delete("/label/{labelId}/artist/{artistId}")
async def remove_artist_from_label(request: Request, labelId: int, artistId: int):
    """
    Ruta para que el propietario elimine un artista de la discográfica
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return JSONResponse(content={"error": "No autenticado"}, status_code=401)
    
    try:
        # Verificar que sea propietario
        label_resp = requests.get(f"{servers.TYA}/label/{labelId}", timeout=2, headers={"Accept": "application/json"})
        label_resp.raise_for_status()
        label_data = label_resp.json()
        
        if label_data.get('ownerId') != userdata.get('userId'):
            return JSONResponse(content={"error": "No tienes permisos"}, status_code=403)
        
        # Eliminar artista
        remove_resp = requests.delete(
            f"{servers.TYA}/label/{labelId}/artist/{artistId}",
            timeout=2,
            headers={"Accept": "application/json"}
        )
        
        if remove_resp.ok:
            return JSONResponse(content={"message": "Artista eliminado"})
        else:
            error_data = remove_resp.json() if remove_resp.text else {}
            return JSONResponse(content=error_data, status_code=remove_resp.status_code)
    
    except Exception as e:
        print(e)
        return JSONResponse(content={"error": "Error al eliminar artista"}, status_code=500)


@app.get("/user/label")
def get_user_label(request: Request):
    """
    Ruta para obtener la discográfica del usuario actual (si existe)
    DEPRECADO: La funcionalidad de discográficas está en proceso de descontinuación.
    Siempre devuelve que no hay discográfica sin consultar el backend.
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return JSONResponse(content={"error": "No autenticado"}, status_code=401)
    
    # Siempre devolver que no hay discográfica (funcionalidad descontinuada)
    return JSONResponse(content={"has_label": False}, status_code=200)


@app.get("/artist/{artistId}/label")
def get_artist_label(request: Request, artistId: int):
    """
    Ruta para obtener la discográfica de un artista específico
    DEPRECADO: La funcionalidad de discográficas está en proceso de descontinuación.
    Siempre devuelve que no hay discográfica sin consultar el backend.
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    # Determinar si es el propietario (para mantener compatibilidad)
    is_owner = False
    if userdata:
        is_owner = userdata.get('artistId') == artistId
    
    # Siempre devolver que no hay discográfica (funcionalidad descontinuada)
    return JSONResponse(content={
        "label": None,
        "is_owner": is_owner
    })


# ==================== USER PROFILE ROUTES ====================

@app.get("/profile")
def get_profile(request: Request):
    """
    Ruta para mostrar el perfil del usuario autenticado
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return RedirectResponse("/login")
    
    try:
        # Obtener métodos de pago del usuario
        payment_methods = []
        try:
            payment_resp = requests.get(
                f"{servers.SYU}/user/{userdata.get('userId')}/payment-methods",
                timeout=2,
                headers={"Accept": "application/json", "Cookie": f"oversound_auth={token}"}
            )
            if payment_resp.ok:
                payment_methods = payment_resp.json()
        except requests.RequestException:
            payment_methods = []
        
        # Para simplificar, asumimos datos vacíos de biblioteca y listas
        # En un caso real, se obtendrían del servidor
        canciones_biblioteca = []
        listas_completas = []
        
        return osv.get_perfil_view(
            request, 
            userdata, 
            canciones_biblioteca, 
            listas_completas,
            is_own_profile=True,
            payment_methods=payment_methods,
            syu_server=servers.SYU,
            tya_server=servers.TYA,
            pt_server=servers.PT
        )
        
    except Exception as e:
        print(e)
        return osv.get_error_view(request, userdata, "No se pudo cargar el perfil", str(e))


@app.get("/profile/{username}")
def get_user_profile(request: Request, username: str):
    """
    Ruta para mostrar el perfil público de otro usuario
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    try:
        # Obtener información del usuario
        user_resp = requests.get(
            f"{servers.SYU}/user/{username}",
            timeout=2,
            headers={"Accept": "application/json", "Cookie": f"oversound_auth={token}"}
        )
        user_resp.raise_for_status()
        user_data = user_resp.json()
        
        # Determinar si es el perfil del usuario autenticado
        is_own_profile = userdata and userdata.get('username') == username
        
        # Si es perfil propio, obtener métodos de pago
        payment_methods = []
        if is_own_profile:
            try:
                payment_resp = requests.get(
                    f"{servers.SYU}/user/{userdata.get('userId')}/payment-methods",
                    timeout=2,
                    headers={"Accept": "application/json", "Cookie": f"oversound_auth={token}"}
                )
                if payment_resp.ok:
                    payment_methods = payment_resp.json()
            except requests.RequestException:
                payment_methods = []
        
        # Para simplificar, asumimos datos vacíos de biblioteca y listas
        canciones_biblioteca = []
        listas_completas = []
        
        return osv.get_perfil_view(
            request,
            user_data,
            canciones_biblioteca,
            listas_completas,
            is_own_profile=is_own_profile,
            payment_methods=payment_methods if is_own_profile else [],
            syu_server=servers.SYU,
            tya_server=servers.TYA,
            pt_server=servers.PT
        )
        
    except requests.RequestException as e:
        return osv.get_error_view(request, userdata, "No se pudo cargar el perfil del usuario", str(e))


# ==================== PAYMENT METHODS ROUTES ====================

@app.get("/payment")
def get_payment_methods(request: Request):
    """
    Obtener métodos de pago del usuario autenticado
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return JSONResponse(content={"error": "No autenticado"}, status_code=401)
    
    try:
        # Llamar al microservicio TPP para obtener métodos de pago
        response = requests.get(
            f"{servers.TPP}/payment",
            timeout=5,
            headers={
                "Accept": "application/json",
                "Cookie": f"oversound_auth={token}"
            }
        )
        
        if response.ok:
            return JSONResponse(content=response.json(), status_code=200)
        else:
            return JSONResponse(content={"error": "No se pudo obtener los métodos de pago"}, status_code=response.status_code)
            
    except requests.RequestException as e:
        print(f"Error obteniendo métodos de pago: {e}")
        return JSONResponse(content={"error": "Error de conexión con el servicio de pagos"}, status_code=500)


@app.post("/payment")
async def add_payment_method(request: Request):
    """
    Agregar un nuevo método de pago
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return JSONResponse(content={"error": "No autenticado"}, status_code=401)
    
    try:
        # Obtener datos del body
        data = await request.json()
        
        # Extraer y validar los datos (el frontend envía camelCase)
        card_holder = data.get('cardHolder')  # camelCase del frontend
        card_number = data.get('cardNumber', '').replace(' ', '')  # camelCase del frontend
        expire_month = data.get('expireMonth')  # Ya viene como número entero
        expire_year = data.get('expireYear')  # Ya viene como año completo (ej: 2025)
        
        print(f"[DEBUG] Payment data received: cardHolder={card_holder}, cardNumber={'*'*12 + card_number[-4:] if len(card_number) >= 4 else card_number}, expireMonth={expire_month}, expireYear={expire_year}")
        
        if not card_holder or not card_number or expire_month is None or expire_year is None:
            return JSONResponse(content={"error": "Datos incompletos"}, status_code=400)
        
        # Validar mes y año
        try:
            expire_month = int(expire_month)
            expire_year = int(expire_year)
            
            # Validar mes
            if expire_month < 1 or expire_month > 12:
                raise ValueError("Mes inválido (debe estar entre 1 y 12)")
            
            # Validar año (debe ser año completo, ej: 2025)
            if expire_year < 2024 or expire_year > 2099:
                raise ValueError("Año inválido")
                
        except (ValueError, TypeError) as e:
            return JSONResponse(content={"error": f"Formato de vencimiento inválido: {str(e)}"}, status_code=400)
        
        # Preparar payload para TPP según el formato especificado (camelCase)
        # Nota: Enviamos el número de tarjeta completo (TPP lo enmascarará internamente)
        payment_data = {
            "cardHolder": card_holder,
            "cardNumber": card_number,  # Enviar número completo, no enmascarado
            "expireMonth": expire_month,
            "expireYear": expire_year
        }
        
        # Log enmascarado para seguridad
        masked_data = payment_data.copy()
        if len(card_number) >= 4:
            masked_data["cardNumber"] = "**** **** **** " + card_number[-4:]
        print(f"[DEBUG] Sending to TPP: {masked_data}")
        
        # Enviar al microservicio TPP
        response = requests.post(
            f"{servers.TPP}/payment",
            json=payment_data,
            timeout=5,
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Cookie": f"oversound_auth={token}"
            }
        )
        
        print(f"[DEBUG] TPP response status: {response.status_code}")
        print(f"[DEBUG] TPP response body: {response.text}")
        
        if response.ok:
            return JSONResponse(content=response.json(), status_code=200)
        else:
            error_msg = "No se pudo agregar el método de pago"
            try:
                error_data = response.json()
                error_msg = error_data.get('detail', error_data.get('error', error_data.get('message', error_msg)))
                print(f"[DEBUG] TPP error: {error_data}")
            except Exception as e:
                print(f"[DEBUG] Could not parse TPP error response: {e}")
                pass
            return JSONResponse(content={"error": error_msg}, status_code=response.status_code)
            
    except requests.RequestException as e:
        print(f"Error agregando método de pago: {e}")
        return JSONResponse(content={"error": "Error de conexión con el servicio de pagos"}, status_code=500)
    except Exception as e:
        print(f"Error inesperado: {e}")
        return JSONResponse(content={"error": "Error al procesar la solicitud"}, status_code=500)


@app.get("/profile/edit")
def get_profile_edit_page(request: Request):
    """
    Ruta para mostrar la página de edición de perfil de usuario
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return RedirectResponse("/login")
    
    return osv.get_user_profile_edit_view(request, userdata, servers.SYU)


@app.patch("/profile/edit")
async def update_profile(request: Request):
    """
    Ruta para actualizar el perfil de usuario
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return JSONResponse(content={"error": "No autenticado"}, status_code=401)
    
    try:
        # Obtener los datos del formulario
        form_data = await request.form()
        
        # Preparar los datos para enviar al microservicio
        update_data = {}
        
        # Campos de texto
        if form_data.get('username'):
            update_data['username'] = form_data.get('username')
        if form_data.get('name'):
            update_data['name'] = form_data.get('name')
        if form_data.get('firstLastName'):
            update_data['firstLastName'] = form_data.get('firstLastName')
        if form_data.get('secondLastName'):
            update_data['secondLastName'] = form_data.get('secondLastName')
        if form_data.get('email'):
            update_data['email'] = form_data.get('email')
        if form_data.get('biografia'):
            update_data['biografia'] = form_data.get('biografia')
        
        # Manejar imagen si se proporciona
        imagen_file = form_data.get('imagen')
        if imagen_file and hasattr(imagen_file, 'filename') and imagen_file.filename:
            # Aquí deberías subir la imagen a un servicio de almacenamiento
            # Por ahora, asumimos que el microservicio maneja la subida
            files = {'imagen': (imagen_file.filename, imagen_file.file, imagen_file.content_type)}
        else:
            files = None
        
        # Hacer PATCH al microservicio SYU
        username = userdata.get('username')
        resp = requests.patch(
            f"{servers.SYU}/user/{username}",
            data=update_data,
            files=files,
            timeout=5,
            headers={"Cookie": f"oversound_auth={token}"}
        )
        resp.raise_for_status()
        
        return JSONResponse(content={"message": "Perfil actualizado correctamente"}, status_code=200)
        
    except requests.RequestException as e:
        error_msg = str(e)
        try:
            error_msg = e.response.json().get('message', str(e))
        except:
            pass
        return JSONResponse(content={"message": error_msg}, status_code=500)


# ===================== CART ENDPOINTS =====================
@app.post("/cart")
async def add_to_cart(request: Request):
    """
    Agrega un producto al carrito del usuario autenticado
    Proxea la llamada a TPP /cart
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return JSONResponse(content={"error": "No autenticado"}, status_code=401)
    
    try:
        body = await request.json()
        # Agregar ID de usuario al body
        body['userId'] = userdata.get('userId')
        
        print(f"[DEBUG] Add to cart request body: {body}")
        
        # Enviar a TPP
        cart_resp = requests.post(
            f"{servers.TPP}/cart",
            json=body,
            timeout=2,
            headers={"Accept": "application/json", "Cookie": f"oversound_auth={token}"}
        )
        
        print(f"[DEBUG] TPP cart response status: {cart_resp.status_code}")
        print(f"[DEBUG] TPP cart response body: {cart_resp.text}")
        
        cart_resp.raise_for_status()
        return JSONResponse(content=cart_resp.json(), status_code=cart_resp.status_code)
    except requests.RequestException as e:
        print(f"Error añadiendo al carrito: {e}")
        try:
            error_detail = e.response.json() if hasattr(e, 'response') and e.response else {}
            print(f"[DEBUG] TPP cart error detail: {error_detail}")
            return JSONResponse(content={"error": error_detail.get('detail', error_detail.get('message', 'No se pudo añadir al carrito'))}, status_code=500)
        except:
            return JSONResponse(content={"error": "No se pudo añadir al carrito"}, status_code=500)


@app.delete("/cart/{product_id}")
async def remove_from_cart(request: Request, product_id: int, type: str = None):
    """
    Elimina un producto del carrito del usuario autenticado
    Proxea la llamada a TPP DELETE /cart/{productId}?type={type}
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return JSONResponse(content={"error": "No autenticado"}, status_code=401)
    
    try:
        # Construir URL con parámetro type si existe
        url = f"{servers.TPP}/cart/{product_id}"
        if type:
            url += f"?type={type}"
        
        # Enviar a TPP
        cart_resp = requests.delete(
            url,
            timeout=2,
            headers={"Accept": "application/json", "Cookie": f"oversound_auth={token}"}
        )
        cart_resp.raise_for_status()
        return JSONResponse(content=cart_resp.json(), status_code=cart_resp.status_code)
    except requests.RequestException as e:
        print(f"Error eliminando del carrito: {e}")
        return JSONResponse(content={"error": "No se pudo eliminar del carrito"}, status_code=500)


@app.post("/purchase")
async def process_purchase(request: Request):
    """
    Procesa una compra
    Proxea la llamada a TPP POST /purchase
    Body esperado: {cartId, paymentMethodId, shippingAddress}
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return JSONResponse(content={"error": "No autenticado"}, status_code=401)
    
    try:
        body = await request.json()
        # Agregar ID de usuario al body
        body['userId'] = userdata.get('userId')
        
        print(f"[DEBUG] Purchase request body: {body}")
        
        # Enviar a TPP
        purchase_resp = requests.post(
            f"{servers.TPP}/purchase",
            json=body,
            timeout=5,
            headers={"Accept": "application/json", "Cookie": f"oversound_auth={token}"}
        )
        
        print(f"[DEBUG] TPP purchase response status: {purchase_resp.status_code}")
        print(f"[DEBUG] TPP purchase response body: {purchase_resp.text}")
        
        purchase_resp.raise_for_status()
        return JSONResponse(content=purchase_resp.json(), status_code=purchase_resp.status_code)
    except requests.RequestException as e:
        print(f"Error procesando compra: {e}")
        try:
            error_detail = e.response.json() if hasattr(e, 'response') and e.response else {}
            print(f"[DEBUG] TPP error detail: {error_detail}")
            return JSONResponse(content={"error": error_detail.get('detail', error_detail.get('message', 'No se pudo procesar la compra'))}, status_code=500)
        except:
            return JSONResponse(content={"error": "No se pudo procesar la compra"}, status_code=500)


# ===================== PAYMENT METHODS ENDPOINTS =====================
@app.get("/payment")
async def get_payment_methods(request: Request):
    """
    Obtiene los métodos de pago del usuario autenticado
    Proxea la llamada a TPP GET /payment
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return JSONResponse(content={"error": "No autenticado"}, status_code=401)
    
    try:
        payment_resp = requests.get(
            f"{servers.TPP}/payment",
            timeout=2,
            headers={"Accept": "application/json", "Cookie": f"oversound_auth={token}"}
        )
        payment_resp.raise_for_status()
        return JSONResponse(content=payment_resp.json(), status_code=payment_resp.status_code)
    except requests.RequestException as e:
        print(f"Error obteniendo métodos de pago: {e}")
        return JSONResponse(content={"error": "No se pudo obtener métodos de pago"}, status_code=500)


@app.post("/payment")
async def add_payment_method(request: Request):
    """
    Agrega un nuevo método de pago
    Proxea la llamada a TPP POST /payment
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return JSONResponse(content={"error": "No autenticado"}, status_code=401)
    
    try:
        body = await request.json()
        
        payment_resp = requests.post(
            f"{servers.TPP}/payment",
            json=body,
            timeout=2,
            headers={"Accept": "application/json", "Cookie": f"oversound_auth={token}"}
        )
        payment_resp.raise_for_status()
        return JSONResponse(content=payment_resp.json(), status_code=payment_resp.status_code)
    except requests.RequestException as e:
        print(f"Error añadiendo método de pago: {e}")
        return JSONResponse(content={"error": "No se pudo añadir el método de pago"}, status_code=500)


@app.put("/payment/{payment_method_id}")
async def update_payment_method(request: Request, payment_method_id: int):
    """
    Actualiza un método de pago del usuario
    Proxea la llamada a TPP PUT /payment/{paymentMethodId}
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return JSONResponse(content={"error": "No autenticado"}, status_code=401)
    
    try:
        body = await request.json()
        
        payment_resp = requests.put(
            f"{servers.TPP}/payment/{payment_method_id}",
            json=body,
            timeout=2,
            headers={"Accept": "application/json", "Cookie": f"oversound_auth={token}"}
        )
        payment_resp.raise_for_status()
        return JSONResponse(content=payment_resp.json(), status_code=payment_resp.status_code)
    except requests.RequestException as e:
        print(f"Error actualizando método de pago: {e}")
        return JSONResponse(content={"error": "No se pudo actualizar el método de pago"}, status_code=500)


@app.delete("/payment/{payment_method_id}")
async def delete_payment_method(request: Request, payment_method_id: int):
    """
    Elimina un método de pago existente
    Proxea la llamada a TPP DELETE /payment/{paymentMethodId}
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return JSONResponse(content={"error": "No autenticado"}, status_code=401)
    
    try:
        payment_resp = requests.delete(
            f"{servers.TPP}/payment/{payment_method_id}",
            timeout=2,
            headers={"Accept": "application/json", "Cookie": f"oversound_auth={token}"}
        )
        payment_resp.raise_for_status()
        return JSONResponse(content=payment_resp.json(), status_code=payment_resp.status_code)
    except requests.RequestException as e:
        print(f"Error eliminando método de pago: {e}")
        return JSONResponse(content={"error": "No se pudo eliminar el método de pago"}, status_code=500)


# ===================== FAVORITES ENDPOINTS =====================
@app.get("/favs/{content_type}")
async def get_favorites(request: Request, content_type: str):
    """
    Obtiene la lista de favoritos del usuario por tipo de contenido
    Proxea la llamada a SYU GET /favs/{contentType}
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return JSONResponse(content={"error": "No autenticado"}, status_code=401)
    
    if content_type not in ["songs", "albums", "artists", "merch"]:
        return JSONResponse(content={"error": "Tipo de contenido inválido"}, status_code=400)
    
    try:
        fav_resp = requests.get(
            f"{servers.SYU}/favs/{content_type}",
            timeout=2,
            headers={"Accept": "application/json", "Cookie": f"oversound_auth={token}"}
        )
        fav_resp.raise_for_status()
        return JSONResponse(content=fav_resp.json(), status_code=fav_resp.status_code)
    except requests.RequestException as e:
        print(f"Error obteniendo favoritos: {e}")
        return JSONResponse(content={"error": "No se pudieron obtener los favoritos"}, status_code=500)


@app.post("/favs/{content_type}/{content_id}")
async def add_favorite(request: Request, content_type: str, content_id: int):
    """
    Agrega un elemento a favoritos (song, album, artist)
    Proxea la llamada a SYU POST /favs/{contentType}/{contentId}
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return JSONResponse(content={"error": "No autenticado"}, status_code=401)
    
    if content_type not in ["songs", "albums", "artists", "merch"]:
        return JSONResponse(content={"error": "Tipo de contenido inválido"}, status_code=400)
    
    try:
        fav_resp = requests.post(
            f"{servers.SYU}/favs/{content_type}/{content_id}",
            timeout=2,
            headers={"Accept": "application/json", "Cookie": f"oversound_auth={token}"}
        )
        fav_resp.raise_for_status()
        return JSONResponse(content=fav_resp.json(), status_code=fav_resp.status_code)
    except requests.RequestException as e:
        print(f"Error añadiendo a favoritos: {e}")
        return JSONResponse(content={"error": "No se pudo añadir a favoritos"}, status_code=500)


@app.delete("/favs/{content_type}/{content_id}")
async def remove_favorite(request: Request, content_type: str, content_id: int):
    """
    Elimina un elemento de favoritos
    Proxea la llamada a SYU DELETE /favs/{contentType}/{contentId}
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return JSONResponse(content={"error": "No autenticado"}, status_code=401)
    
    if content_type not in ["songs", "albums", "artists", "merch"]:
        return JSONResponse(content={"error": "Tipo de contenido inválido"}, status_code=400)
    
    try:
        fav_resp = requests.delete(
            f"{servers.SYU}/favs/{content_type}/{content_id}",
            timeout=2,
            headers={"Accept": "application/json", "Cookie": f"oversound_auth={token}"}
        )
        fav_resp.raise_for_status()
        return JSONResponse(content=fav_resp.json(), status_code=fav_resp.status_code)
    except requests.RequestException as e:
        print(f"Error eliminando de favoritos: {e}")
        return JSONResponse(content={"error": "No se pudo eliminar de favoritos"}, status_code=500)


# ===================== ARTIST CREATE ROUTES =====================
@app.get("/artist/create")
def artist_create_page(request: Request):
    """
    Ruta para mostrar la página de crear perfil de artista
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)

    if not userdata:
        return RedirectResponse("/login")
    
    # Verificar si el usuario ya tiene un perfil de artista
    if userdata.get('artistId'):
        return RedirectResponse(f"/artist/{userdata.get('artistId')}")
    
    return osv.get_artist_create_view(request, userdata, servers.SYU)


@app.post("/artist/create")
async def create_artist(request: Request):
    """
    Ruta para procesar la creación de un perfil de artista
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return JSONResponse(content={"error": "No autenticado"}, status_code=401)
    
    # Verificar si el usuario ya tiene un perfil de artista
    if userdata.get('artistId'):
        return JSONResponse(content={"error": "Ya tienes un perfil de artista"}, status_code=400)
    
    try:
        body = await request.json()
        
        # Agregar el ID del usuario
        body['userId'] = userdata.get('userId')
        
        # Enviar a TYA para crear el artista
        artist_resp = requests.post(
            f"{servers.TYA}/artist/upload",
            json=body,
            timeout=15,
            headers={"Accept": "application/json", "Cookie": f"oversound_auth={token}"}
        )
        
        if artist_resp.ok:
            artist_data = artist_resp.json()
            artist_id = artist_data.get('artistId')
            
            # Actualizar el usuario en SYU con el artistId
            try:
                user_update_resp = requests.patch(
                    f"{servers.SYU}/user/{userdata.get('username')}",
                    json={"artistId": artist_id},
                    timeout=5,
                    headers={"Accept": "application/json", "Cookie": f"oversound_auth={token}"}
                )
                
                if not user_update_resp.ok:
                    print(f"Advertencia: No se pudo actualizar el usuario con artistId. Status: {user_update_resp.status_code}")
                    # No fallar la operación, el artista ya fue creado
            except requests.RequestException as e:
                print(f"Advertencia: Error al actualizar usuario con artistId: {e}")
                # No fallar la operación, el artista ya fue creado
            
            return JSONResponse(content={
                "message": "Perfil de artista creado exitosamente",
                "artistId": artist_id
            })
        else:
            error_data = artist_resp.json() if artist_resp.text else {"error": "Error desconocido"}
            return JSONResponse(content=error_data, status_code=artist_resp.status_code)
    
    except Exception as e:
        print(f"Error creando perfil de artista: {e}")
        return JSONResponse(content={"error": "Error al crear el perfil de artista"}, status_code=500)


@app.get("/artist/studio")
def get_artist_studio_page(request: Request):
    """
    Ruta para mostrar la página de estudio del artista con sus canciones, álbumes y merchandising
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return RedirectResponse("/login")
    
    # Verificar que el usuario tenga un perfil de artista
    if not userdata.get('artistId'):
        return RedirectResponse("/artist/create")
    
    try:
        artist_id = userdata.get('artistId')
        
        # Obtener datos del artista
        artist_resp = requests.get(
            f"{servers.TYA}/artist/{artist_id}",
            timeout=5,
            headers={"Accept": "application/json"}
        )
        artist_resp.raise_for_status()
        artist_data = artist_resp.json()
        
        # Obtener canciones del artista
        try:
            songs_resp = requests.get(
                f"{servers.TYA}/artist/{artist_id}/songs",
                timeout=5,
                headers={"Accept": "application/json"}
            )
            songs_resp.raise_for_status()
            artist_data['songs'] = songs_resp.json()
        except requests.RequestException:
            artist_data['songs'] = []
        
        # Obtener álbumes del artista
        try:
            albums_resp = requests.get(
                f"{servers.TYA}/artist/{artist_id}/albums",
                timeout=5,
                headers={"Accept": "application/json"}
            )
            albums_resp.raise_for_status()
            artist_data['albums'] = albums_resp.json()
        except requests.RequestException:
            artist_data['albums'] = []
        
        # Obtener merchandising del artista
        try:
            merch_resp = requests.get(
                f"{servers.TPP}/artist/{artist_id}/merch",
                timeout=5,
                headers={"Accept": "application/json"}
            )
            merch_resp.raise_for_status()
            artist_data['merch'] = merch_resp.json()
        except requests.RequestException:
            artist_data['merch'] = []
        
        return osv.get_artist_studio_view(request, artist_data, userdata, servers.SYU)
        
    except requests.RequestException as e:
        print(f"Error obteniendo datos del estudio del artista: {e}")
        return osv.get_error_view(request, userdata, "No se pudo cargar el estudio del artista", str(e))

# ===================== ARTIST PROFILE ROUTES =====================
@app.get("/artist/{artistId}")
def get_artist_profile(request: Request, artistId: int):
    """
    Ruta para mostrar el perfil de un artista
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    try:
        # Obtener información del artista
        artist_resp = requests.get(
            f"{servers.TYA}/artist/{artistId}",
            timeout=15,
            headers={"Accept": "application/json"}
        )
        artist_resp.raise_for_status()
        artist_data = artist_resp.json()
        
        # Determinar si es el propio perfil
        is_own_profile = userdata and userdata.get('artistId') == artistId
        
        # Obtener canciones del artista si tiene
        if artist_data.get('owner_songs'):
            try:
                song_ids = ','.join(str(sid) for sid in artist_data['owner_songs'])
                songs_resp = requests.get(
                    f"{servers.TYA}/song/list?ids={song_ids}",
                    timeout=15,
                    headers={"Accept": "application/json"}
                )
                if songs_resp.ok:
                    artist_data['owner_songs'] = songs_resp.json()
            except requests.RequestException as e:
                print(f"Error obteniendo canciones del artista: {e}")
                artist_data['owner_songs'] = []
        
        # Obtener álbumes del artista si tiene
        if artist_data.get('owner_albums'):
            try:
                album_ids = ','.join(str(aid) for aid in artist_data['owner_albums'])
                albums_resp = requests.get(
                    f"{servers.TYA}/album/list?ids={album_ids}",
                    timeout=15,
                    headers={"Accept": "application/json"}
                )
                if albums_resp.ok:
                    artist_data['owner_albums'] = albums_resp.json()
            except requests.RequestException as e:
                print(f"Error obteniendo álbumes del artista: {e}")
                artist_data['owner_albums'] = []
        
        # Obtener merchandising del artista si tiene
        if artist_data.get('owner_merch'):
            try:
                merch_ids = ','.join(str(mid) for mid in artist_data['owner_merch'])
                merch_resp = requests.get(
                    f"{servers.TYA}/merch/list?ids={merch_ids}",
                    timeout=15,
                    headers={"Accept": "application/json"}
                )
                if merch_resp.ok:
                    artist_data['owner_merch'] = merch_resp.json()
            except requests.RequestException as e:
                print(f"Error obteniendo merchandising del artista: {e}")
                artist_data['owner_merch'] = []

        metrics = None
        try:
            metrics_resp = requests.get(f"{servers.RYE}/statistics/metrics/artist/{artistId}", timeout=5)
            metrics_resp.raise_for_status()
            metrics_data = metrics_resp.json()  # Expecting JSON like {"playbacks": 123, "songs": 5, "popularity": 12}
            metrics = {
                "playbacks": metrics_data.get("playbacks", 0),
                "songs": metrics_data.get("songs", 0),
                "popularity": metrics_data.get("popularity", None)
            }
        except requests.RequestException as e:
            print(f"Error obteniendo métricas del artista: {e}")
            metrics = {"playbacks": 0, "songs": 0, "popularity": None}
        
        return osv.get_artist_profile_view(request, artist_data, userdata, is_own_profile, servers.SYU, metrics, servers.TYA, servers.RYE, servers.PT)
        
    except requests.RequestException as e:
        print(f"Error obteniendo perfil del artista: {e}")
        return osv.get_error_view(request, userdata, "No se pudo cargar el perfil del artista", str(e))


@app.get("/artist/edit")
def get_artist_edit_page(request: Request):
    """
    Ruta para mostrar la página de edición de perfil de artista (usuario actual)
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return RedirectResponse("/login")
    
    # Verificar que el usuario tenga un perfil de artista
    if not userdata.get('artistId'):
        return RedirectResponse("/artist/create")
    
    try:
        # Obtener datos actuales del artista
        artist_resp = requests.get(
            f"{servers.TYA}/artist/{userdata.get('artistId')}",
            timeout=5,
            headers={"Accept": "application/json"}
        )
        artist_resp.raise_for_status()
        artist_data = artist_resp.json()
        
        return osv.get_artist_profile_edit_view(request, userdata, artist_data, servers.TYA)
        
    except requests.RequestException as e:
        print(f"Error obteniendo datos del artista: {e}")
        return osv.get_error_view(request, userdata, "No se pudo cargar los datos del artista", str(e))


@app.get("/artist/{artistId}/edit")
def get_specific_artist_edit_page(request: Request, artistId: int):
    """
    Ruta para mostrar la página de edición de perfil de un artista específico
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return RedirectResponse("/login")
    
    # Verificar que el usuario sea el propietario del perfil del artista
    if userdata.get('artistId') != artistId:
        return osv.get_error_view(request, userdata, "No tienes permiso para editar este perfil", "")
    
    try:
        # Obtener datos actuales del artista
        artist_resp = requests.get(
            f"{servers.TYA}/artist/{artistId}",
            timeout=5,
            headers={"Accept": "application/json"}
        )
        artist_resp.raise_for_status()
        artist_data = artist_resp.json()
        
        return osv.get_artist_profile_edit_view(request, userdata, artist_data, servers.TYA)
        
    except requests.RequestException as e:
        print(f"Error obteniendo datos del artista: {e}")
        return osv.get_error_view(request, userdata, "No se pudo cargar los datos del artista", str(e))


@app.patch("/artist/edit")
async def update_artist_profile(request: Request):
    """
    Ruta para actualizar el perfil de artista del usuario actual
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return JSONResponse(content={"error": "No autenticado"}, status_code=401)
    
    if not userdata.get('artistId'):
        return JSONResponse(content={"error": "No tienes un perfil de artista"}, status_code=403)
    
    try:
        # Obtener los datos del formulario
        form_data = await request.form()
        
        # Preparar los datos para enviar al microservicio
        update_data = {}
        
        # Campos de texto
        if form_data.get('artisticName'):
            update_data['artisticName'] = form_data.get('artisticName')
        if form_data.get('artisticEmail'):
            update_data['artisticEmail'] = form_data.get('artisticEmail')
        if form_data.get('artisticBiography'):
            update_data['artisticBiography'] = form_data.get('artisticBiography')
        if form_data.get('socialMediaUrl'):
            update_data['socialMediaUrl'] = form_data.get('socialMediaUrl')
        
        # Manejar imagen si se proporciona
        imagen_file = form_data.get('artisticImage')
        if imagen_file and hasattr(imagen_file, 'filename') and imagen_file.filename:
            # Aquí deberías subir la imagen a un servicio de almacenamiento
            # Por ahora, asumimos que el microservicio maneja la subida
            files = {'artisticImage': (imagen_file.filename, imagen_file.file, imagen_file.content_type)}
        else:
            files = None
        
        # Hacer PATCH al microservicio TYA
        artist_id = userdata.get('artistId')
        resp = requests.patch(
            f"{servers.TYA}/artist/{artist_id}",
            data=update_data,
            files=files,
            timeout=5,
            headers={"Cookie": f"oversound_auth={token}"}
        )
        resp.raise_for_status()
        
        return JSONResponse(content={
            "message": "Perfil de artista actualizado correctamente",
            "artistId": artist_id
        }, status_code=200)
        
    except requests.RequestException as e:
        error_msg = str(e)
        try:
            error_msg = e.response.json().get('message', str(e))
        except:
            pass
        return JSONResponse(content={"message": error_msg}, status_code=500)


@app.patch("/artist/{artistId}/edit")
async def update_specific_artist_profile(request: Request, artistId: int):
    """
    Ruta para actualizar el perfil de un artista específico
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return JSONResponse(content={"error": "No autenticado"}, status_code=401)
    
    # Verificar que el usuario sea el propietario del perfil
    if userdata.get('artistId') != artistId:
        return JSONResponse(content={"error": "No tienes permiso para editar este perfil"}, status_code=403)
    
    try:
        # Obtener los datos del formulario
        form_data = await request.form()
        
        # Preparar los datos para enviar al microservicio
        update_data = {}
        
        # Campos de texto
        if form_data.get('artisticName'):
            update_data['artisticName'] = form_data.get('artisticName')
        if form_data.get('artisticEmail'):
            update_data['artisticEmail'] = form_data.get('artisticEmail')
        if form_data.get('artisticBiography'):
            update_data['artisticBiography'] = form_data.get('artisticBiography')
        if form_data.get('socialMediaUrl'):
            update_data['socialMediaUrl'] = form_data.get('socialMediaUrl')
        
        # Manejar imagen si se proporciona
        imagen_file = form_data.get('artisticImage')
        if imagen_file and hasattr(imagen_file, 'filename') and imagen_file.filename:
            files = {'artisticImage': (imagen_file.filename, imagen_file.file, imagen_file.content_type)}
        else:
            files = None
        
        # Hacer PATCH al microservicio TYA
        resp = requests.patch(
            f"{servers.TYA}/artist/{artistId}",
            data=update_data,
            files=files,
            timeout=5,
            headers={"Cookie": f"oversound_auth={token}"}
        )
        resp.raise_for_status()
        
        return JSONResponse(content={
            "message": "Perfil de artista actualizado correctamente",
            "artistId": artistId
        }, status_code=200)
        
    except requests.RequestException as e:
        error_msg = str(e)
        try:
            error_msg = e.response.json().get('message', str(e))
        except:
            pass
        return JSONResponse(content={"message": error_msg}, status_code=500)


# ===================== TRACK PROVIDER ROUTES =====================
@app.get("/track/{trackId}")
async def get_track(request: Request, trackId: int):
    """
    Ruta proxy para obtener el audio de una canción desde el Proveedor de Tracks (PT)
    Obtiene el track en base64 desde PT y lo devuelve como audio
    """
    token = request.cookies.get("oversound_auth")
    
    try:
        # Obtener el track desde el microservicio PT
        track_resp = requests.get(
            f"{servers.PT}/track/{trackId}",
            timeout=10,
            headers={
                "Accept": "application/json",
                "Cookie": f"oversound_auth={token}"
            }
        )
        track_resp.raise_for_status()
        
        # La respuesta contiene {"idtrack": int, "track": "base64string"}
        track_data = track_resp.json()
        
        if not track_data.get('track'):
            return JSONResponse(content={"error": "Track no encontrado"}, status_code=404)
        
        # Decodificar el base64
        import base64
        audio_bytes = base64.b64decode(track_data['track'])
        
        # Devolver el audio como respuesta binaria
        # El tipo de contenido se determina por las primeras cabeceras del archivo
        # Por defecto usamos audio/mpeg (MP3)
        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": f"inline; filename=track_{trackId}.mp3",
                "Accept-Ranges": "bytes",
                "Cache-Control": "public, max-age=3600"
            }
        )
        
    except requests.RequestException as e:
        print(f"Error obteniendo track desde PT: {e}")
        return JSONResponse(
            content={"error": f"No se pudo obtener el track: {str(e)}"},
            status_code=500
        )
    except Exception as e:
        print(f"Error procesando track: {e}")
        return JSONResponse(
            content={"error": f"Error al procesar el track: {str(e)}"},
            status_code=500
        )


@app.post('/stats/history/songs')
async def proxy_stats_songs(request: Request):
    """Proxy para estadísticas de canciones -> reenvía a RYE/history/songs evitando CORS en el navegador"""
    token = request.cookies.get('oversound_auth')
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(content={"error": "JSON inválido"}, status_code=400)

    try:
        headers = {"Accept": "application/json", "Content-Type": "application/json"}
        if token:
            headers["Cookie"] = f"oversound_auth={token}"

        resp = requests.post(f"{servers.RYE}/history/songs", json=body, timeout=5, headers=headers)
        resp.raise_for_status()
        return JSONResponse(content=resp.json(), status_code=resp.status_code)
    except requests.RequestException as e:
        print(f"Error proxying song stats to RYE: {e}")
        # intentar devolver el body de respuesta si existe
        try:
            if 'resp' in locals() and resp is not None:
                return JSONResponse(content=resp.json(), status_code=resp.status_code)
        except Exception:
            pass
        return JSONResponse(content={"error": "No se pudo enviar la estadística"}, status_code=500)


@app.post('/stats/history/artists')
async def proxy_stats_artists(request: Request):
    """Proxy para estadísticas de artistas -> reenvía a RYE/history/artists evitando CORS en el navegador"""
    token = request.cookies.get('oversound_auth')
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(content={"error": "JSON inválido"}, status_code=400)

    try:
        headers = {"Accept": "application/json", "Content-Type": "application/json"}
        if token:
            headers["Cookie"] = f"oversound_auth={token}"

        resp = requests.post(f"{servers.RYE}/history/artists", json=body, timeout=5, headers=headers)
        resp.raise_for_status()
        return JSONResponse(content=resp.json(), status_code=resp.status_code)
    except requests.RequestException as e:
        print(f"Error proxying artist stats to RYE: {e}")
        try:
            if 'resp' in locals() and resp is not None:
                return JSONResponse(content=resp.json(), status_code=resp.status_code)
        except Exception:
            pass
        return JSONResponse(content={"error": "No se pudo enviar la estadística"}, status_code=500)




@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    return osv.get_error_view(request, userdata, "Te has columpiado con la URL", str(exc))

@app.exception_handler(500)
def internal_server_error_handler(request: Request, exc: Exception):
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    return osv.get_error_view(request, userdata, "Algo ha salido mal", str(exc))

@app.exception_handler(422)
def unproc_content_error_handler(request: Request, exce: Exception):
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    return osv.get_error_view(request, userdata, "Te has columpiado", str(exce))