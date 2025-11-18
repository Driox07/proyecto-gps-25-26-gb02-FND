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

# Configuración de CORS
origins = [
    "http://localhost:8000",
    "http://localhost:8080",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:8080",
    "http://10.1.1.4:8000",
    "http://10.1.1.4:8080"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Lista de orígenes permitidos
    allow_credentials=True,  # Permitir cookies y credenciales
    allow_methods=["*"],  # Permitir todos los métodos (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Permitir todos los headers
)

app.mount("/static", StaticFiles(directory='static'), name="static")

@app.get("/")
def index(request: Request):
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    print(userdata)
    return osv.get_home_view(request, userdata, servers.SYU)

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
def shop(request: Request, artists: str = Query(default=None), genres: str = Query(default=None), 
         order: str = Query(default="date"), direction: str = Query(default="desc")):

    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)

    # Construir parámetros para las peticiones
    filter_params = {
        "order": order,
        "direction": direction
    }
    if genres:
        filter_params["genres"] = genres
    if artists:
        filter_params["artists"] = artists

    # Obtener géneros disponibles
    try:
        genres_resp = requests.get(f"{servers.TYA}/genres", timeout=5, headers={"Accept": "application/json"})
        genres_resp.raise_for_status()
        all_genres = genres_resp.json()
    except requests.RequestException as e:
        print(f"Error obteniendo géneros: {e}")
        all_genres = []
    
    # Obtener los artistas (ID's)
    try:
        artist_ids_resp = requests.get(f"{servers.TYA}/artist/filter", timeout=5, headers={"Accept": "application/json"})
        artist_ids_resp.raise_for_status()
        artist_ids = artist_ids_resp.json()
    except requests.RequestException as e:
        print(f"Error obteniendo IDs de artistas: {e}")
        artist_ids = []
    
    # Resolver ID's de los artistas
    all_artists = []
    if artist_ids:
        try:
            ids_str = ",".join(map(str, artist_ids))
            artists_resp = requests.get(
                f"{servers.TYA}/artist/list",
                params={"ids": ids_str},
                timeout=5,
                headers={"Accept": "application/json"}
            )
            artists_resp.raise_for_status()
            all_artists = artists_resp.json()
        except requests.RequestException as e:
            print(f"Error obteniendo artistas: {e}")
            all_artists = []

    # Obtener las canciones (ID's)
    try:
        song_filter_resp = requests.get(
            f"{servers.TYA}/song/filter",
            params=filter_params,
            timeout=5,
            headers={"Accept": "application/json"}
        )
        song_filter_resp.raise_for_status()
        song_ids = song_filter_resp.json()
    except requests.RequestException as e:
        print(f"Error filtrando canciones: {e}")
        song_ids = []

    # Resolver ID's de las canciones
    songs = []
    if song_ids:
        try:
            ids_str = ",".join(map(str, song_ids))
            songs_resp = requests.get(
                f"{servers.TYA}/song/list",
                params={"ids": ids_str},
                timeout=5,
                headers={"Accept": "application/json"}
            )
            songs_resp.raise_for_status()
            songs = songs_resp.json()
        except requests.RequestException as e:
            print(f"Error obteniendo canciones: {e}")
            songs = []

    # Obtener los albumes (ID's)
    try:
        album_filter_resp = requests.get(
            f"{servers.TYA}/album/filter",
            params=filter_params,
            timeout=5,
            headers={"Accept": "application/json"}
        )
        album_filter_resp.raise_for_status()
        album_ids = album_filter_resp.json()
    except requests.RequestException as e:
        print(f"Error filtrando álbumes: {e}")
        album_ids = []

    # Resolver ID's de los albumes
    albums = []
    if album_ids:
        try:
            ids_str = ",".join(map(str, album_ids))
            albums_resp = requests.get(
                f"{servers.TYA}/album/list",
                params={"ids": ids_str},
                timeout=5,
                headers={"Accept": "application/json"}
            )
            albums_resp.raise_for_status()
            albums = albums_resp.json()
        except requests.RequestException as e:
            print(f"Error obteniendo álbumes: {e}")
            albums = []

    # Obtener IDs de merchandising filtrado
    try:
        merch_filter_resp = requests.get(
            f"{servers.TYA}/merch/filter",
            params=filter_params,
            timeout=5,
            headers={"Accept": "application/json"}
        )
        merch_filter_resp.raise_for_status()
        merch_ids = merch_filter_resp.json()
    except requests.RequestException as e:
        return osv.get_error_view(request, userdata, f"No se pudo cargar el perfil del artista: {str(e)}")


@app.get("/cart")
def cart(request: Request):
    """
    Ruta del carrito - Renderiza la página del carrito
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    return osv.get_cart_view(request, userdata, servers.SYU)


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


@app.get("/user/{nick}")
def register(request: Request, nick: str):
    token = request.cookies.get("session")
    userdata = requests.get(f"{servers.SYU}/user/{nick}", timeout=2, headers={"Accept": "application/json", "Cookie": f"oversound_auth={token}"})
    userdata.raise_for_status()
    return userdata.json()


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
        
        # Asegurarse de que el precio sea un número
        try:
            song_data['price'] = float(song_data.get('price', 0))
        except ValueError:
            song_data['price'] = 0.0
        
        # Determinar si está en favoritos y carrito (por ahora False, implementar después)
        isLiked = False
        inCarrito = False
        
        # Determinar tipo de usuario (0: no autenticado, 1: usuario, 2: artista)
        tipoUsuario = 0
        if userdata:
            tipoUsuario = 1  # TODO: Implementar lógica para distinguir artista
        
        return osv.get_song_view(request, song_data, tipoUsuario, userdata, isLiked, inCarrito, servers.SYU)
        
    except requests.RequestException as e:
        # En caso de error, mostrar página de error
        print(e)
        return osv.get_error_view(request, userdata, f"No se pudo cargar la canción")


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
        
        # Ordenar canciones por albumOrder si existe
        songs = sorted(songs, key=lambda x: x.get('albumOrder', 999))
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
        
        # Asegurarse de que el precio sea un número
        try:
            album_data['price'] = float(album_data.get('price', 0))
        except ValueError:
            album_data['price'] = 0.0
        
        # Calcular duración total del álbum
        total_duration = 0
        for song in songs:
            if song.get('duration'):
                total_duration += song['duration']
        
        # Formatear duración total
        minutes = total_duration // 60
        seconds = total_duration % 60
        tiempo_formateado = f"{minutes}:{seconds:02d}"
        
        # Determinar si está en favoritos y carrito (por ahora False, implementar después)
        isLiked = False
        inCarrito = False
        
        # Determinar tipo de usuario (0: no autenticado, 1: usuario, 2: artista)
        tipoUsuario = 0
        if userdata:
            tipoUsuario = 1  # TODO: Implementar lógica para distinguir artista
        
        return osv.get_album_view(request, album_data, tipoUsuario, isLiked, inCarrito, tiempo_formateado, userdata, servers.SYU)
        
    except requests.RequestException as e:
        # En caso de error, mostrar página de error
        return osv.get_error_view(request, userdata, f"No se pudo cargar el álbum")

@app.exception_handler(500)
def internal_server_error_handler(request: Request, exc: Exception):
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    return osv.get_error_view(request, userdata, "Algo ha salido mal")

@app.exception_handler(422)
def unproc_content_error_handler(request: Request, exce: Exception):
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    return osv.get_error_view(request, userdata, "Te has columpiado")

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
        return osv.get_error_view(request, userdata, f"No se pudo cargar el producto de merchandising")


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
        is_owner = userdata and userdata.get('labelId') == labelId
        is_member = userdata and artist_id in [a.get('artistId') for a in artists] if 'artist_id' in locals() else False
        
        return osv.get_label_view(request, label_data, is_owner, is_member, userdata, servers.SYU)
        
    except requests.RequestException as e:
        print(e)
        return osv.get_error_view(request, userdata, "No se pudo cargar la discográfica")


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
            return osv.get_error_view(request, userdata, "No tienes permisos para editar esta discográfica")
        
        return osv.get_label_create_view(request, label_data, userdata, servers.SYU)
        
    except requests.RequestException as e:
        print(e)
        return osv.get_error_view(request, userdata, "No se pudo cargar la discográfica")


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
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return JSONResponse(content={"error": "No autenticado"}, status_code=401)
    
    try:
        # Obtener la discográfica del usuario (por userId)
        label_resp = requests.get(
            f"{servers.TYA}/user/{userdata.get('userId')}/label",
            timeout=2,
            headers={"Accept": "application/json"}
        )
        
        if label_resp.ok:
            label_data = label_resp.json()
            return JSONResponse(content={
                "has_label": True,
                "label": label_data
            })
        elif label_resp.status_code == 404:
            return JSONResponse(content={"has_label": False}, status_code=200)
        else:
            return JSONResponse(
                content={"error": "Error al obtener discográfica"},
                status_code=label_resp.status_code
            )
    
    except Exception as e:
        print(e)
        return JSONResponse(content={"error": "Error al obtener discográfica"}, status_code=500)


@app.get("/artist/{artistId}/label")
def get_artist_label(request: Request, artistId: int):
    """
    Ruta para obtener la discográfica de un artista específico
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    try:
        # Obtener la discográfica del artista
        label_resp = requests.get(
            f"{servers.TYA}/artist/{artistId}/label",
            timeout=2,
            headers={"Accept": "application/json"}
        )
        
        if label_resp.ok:
            label_data = label_resp.json()
            
            # Determinar si el usuario actual es propietario
            is_owner = False
            if userdata:
                is_owner = label_data.get('ownerId') == userdata.get('userId')
            
            return JSONResponse(content={
                "label": label_data,
                "is_owner": is_owner
            })
        elif label_resp.status_code == 404:
            # Artista sin discográfica - determinar si es el propietario
            is_owner = False
            if userdata:
                is_owner = userdata.get('artistId') == artistId
            
            return JSONResponse(content={
                "label": None,
                "is_owner": is_owner
            })
        else:
            return JSONResponse(
                content={"error": "Error al obtener discográfica"},
                status_code=label_resp.status_code
            )
    
    except Exception as e:
        print(e)
        return JSONResponse(content={"error": "Error al obtener discográfica"}, status_code=500)


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
            tya_server=servers.TYA
        )
        
    except Exception as e:
        print(e)
        return osv.get_error_view(request, userdata, "No se pudo cargar el perfil")


@app.get("/profile/{nick}")
def get_user_profile(request: Request, nick: str):
    """
    Ruta para mostrar el perfil público de otro usuario
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    try:
        # Obtener información del usuario
        user_resp = requests.get(
            f"{servers.SYU}/user/{nick}",
            timeout=2,
            headers={"Accept": "application/json", "Cookie": f"oversound_auth={token}"}
        )
        user_resp.raise_for_status()
        user_data = user_resp.json()
        
        # Determinar si es el perfil del usuario autenticado
        is_own_profile = userdata and userdata.get('nick') == nick
        
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
            tya_server=servers.TYA
        )
        
    except requests.RequestException as e:
        return osv.get_error_view(request, userdata, "No se pudo cargar el perfil del usuario")


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
        
        # Enviar a TPP
        cart_resp = requests.post(
            f"{servers.TPP}/cart",
            json=body,
            timeout=2,
            headers={"Accept": "application/json", "Cookie": f"oversound_auth={token}"}
        )
        cart_resp.raise_for_status()
        return JSONResponse(content=cart_resp.json(), status_code=cart_resp.status_code)
    except requests.RequestException as e:
        print(f"Error añadiendo al carrito: {e}")
        return JSONResponse(content={"error": "No se pudo añadir al carrito"}, status_code=500)


@app.delete("/cart/{product_id}")
async def remove_from_cart(request: Request, product_id: int):
    """
    Elimina un producto del carrito del usuario autenticado
    Proxea la llamada a TPP DELETE /cart/{productId}
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return JSONResponse(content={"error": "No autenticado"}, status_code=401)
    
    try:
        # Enviar a TPP
        cart_resp = requests.delete(
            f"{servers.TPP}/cart/{product_id}",
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
        
        # Enviar a TPP
        purchase_resp = requests.post(
            f"{servers.TPP}/purchase",
            json=body,
            timeout=5,
            headers={"Accept": "application/json", "Cookie": f"oversound_auth={token}"}
        )
        purchase_resp.raise_for_status()
        return JSONResponse(content=purchase_resp.json(), status_code=purchase_resp.status_code)
    except requests.RequestException as e:
        print(f"Error procesando compra: {e}")
        return JSONResponse(content={"error": "No se pudo procesar la compra"}, status_code=500)


# ===================== PAYMENT METHODS ENDPOINTS =====================
@app.get("/payment")
async def get_payment_methods(request: Request):
    """
    Obtiene los métodos de pago del usuario autenticado
    Proxea la llamada a SYU GET /payment
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return JSONResponse(content={"error": "No autenticado"}, status_code=401)
    
    try:
        payment_resp = requests.get(
            f"{servers.SYU}/payment",
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
    Proxea la llamada a SYU POST /payment
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return JSONResponse(content={"error": "No autenticado"}, status_code=401)
    
    try:
        body = await request.json()
        
        payment_resp = requests.post(
            f"{servers.SYU}/payment",
            json=body,
            timeout=2,
            headers={"Accept": "application/json", "Cookie": f"oversound_auth={token}"}
        )
        payment_resp.raise_for_status()
        return JSONResponse(content=payment_resp.json(), status_code=payment_resp.status_code)
    except requests.RequestException as e:
        print(f"Error añadiendo método de pago: {e}")
        return JSONResponse(content={"error": "No se pudo añadir el método de pago"}, status_code=500)


@app.delete("/payment/{payment_method_id}")
async def delete_payment_method(request: Request, payment_method_id: int):
    """
    Elimina un método de pago existente
    Proxea la llamada a SYU DELETE /payment/{paymentMethodId}
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    if not userdata:
        return JSONResponse(content={"error": "No autenticado"}, status_code=401)
    
    try:
        payment_resp = requests.delete(
            f"{servers.SYU}/payment/{payment_method_id}",
            timeout=2,
            headers={"Accept": "application/json", "Cookie": f"oversound_auth={token}"}
        )
        payment_resp.raise_for_status()
        return JSONResponse(content=payment_resp.json(), status_code=payment_resp.status_code)
    except requests.RequestException as e:
        print(f"Error eliminando método de pago: {e}")
        return JSONResponse(content={"error": "No se pudo eliminar el método de pago"}, status_code=500)


# ===================== FAVORITES ENDPOINTS =====================
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
    
    if content_type not in ["songs", "albums", "artists"]:
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
    
    if content_type not in ["songs", "albums", "artists"]:
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

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    return osv.get_error_view(request, userdata, "Te has columpiado con la URL")