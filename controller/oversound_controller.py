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

# Exception handler para errores de validación (422)
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    return osv.get_error_view(request, userdata, "Te has columpiado con la URL")

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
        print(f"Error filtrando merchandising: {e}")
        merch_ids = []

    # Obtener datos completos del merchandising
    merch = []
    if merch_ids:
        try:
            ids_str = ",".join(map(str, merch_ids))
            merch_resp = requests.get(
                f"{servers.TYA}/merch/list",
                params={"ids": ids_str},
                timeout=5,
                headers={"Accept": "application/json"}
            )
            merch_resp.raise_for_status()
            merch = merch_resp.json()
        except requests.RequestException as e:
            print(f"Error obteniendo merchandising: {e}")
            merch = []
    
    # Renderizar vista con los datos
    print(all_genres)
    return osv.get_shop_view(request, userdata, songs, all_genres, all_artists, albums, merch)

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
        
        return osv.get_song_view(request, song_data, tipoUsuario, userdata, isLiked, inCarrito)
        
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
            album_data['artist'] = {"artistId": album_data['artistId'], "nombre": "Artista desconocido"}
        
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
        
        # Resolver canciones del álbum
        tracks = []
        if album_data.get('tracks'):
            for track_id in album_data['tracks']:
                try:
                    track_resp = requests.get(f"{servers.TYA}/song/{track_id}", timeout=2, headers={"Accept": "application/json"})
                    track_resp.raise_for_status()
                    track_data = track_resp.json()
                    
                    # Resolver artista de la canción
                    try:
                        track_artist_resp = requests.get(f"{servers.TYA}/artist/{track_data['artistId']}", timeout=2, headers={"Accept": "application/json"})
                        track_artist_resp.raise_for_status()
                        track_data['artist'] = track_artist_resp.json()
                    except requests.RequestException:
                        track_data['artist'] = {"artistId": track_data['artistId'], "nombre": "Artista desconocido"}
                    
                    tracks.append(track_data)
                except requests.RequestException:
                    pass  # Ignorar canciones que no se puedan cargar
        album_data['tracks'] = tracks
        
        # Resolver álbumes relacionados del mismo artista
        related_albums = []
        try:
            artist_albums_resp = requests.get(f"{servers.TYA}/artist/{album_data['artistId']}/albums", timeout=2, headers={"Accept": "application/json"})
            artist_albums_resp.raise_for_status()
            all_artist_albums = artist_albums_resp.json()
            # Excluir el álbum actual de los relacionados
            related_albums = [a for a in all_artist_albums if a.get('id') != albumId][:6]
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
        for track in tracks:
            if track.get('duration'):
                total_duration += track['duration']
        
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
        
        return osv.get_album_view(request, album_data, tipoUsuario, isLiked, inCarrito, tiempo_formateado)
        
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
