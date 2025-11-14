import json
from fastapi import FastAPI, Query, Request, Response
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
import requests
import view.oversound_view as osv
import controller.msvc_servers as servers

app = FastAPI()
osv = osv.View()

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

def obtain_user_data(token: str):
    if not token:
        return None
    try:
        resp = requests.get(f"{servers.SYU}/auth", timeout=2, headers={"Accept": "application/json", "Cookie":f"oversound_auth={token}"})
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException:
        return None

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
def shop(request: Request):
    """
    Ruta de la tienda - Renderiza la página de tienda con productos
    """
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    
    # DATOS DE EJEMPLO - Reemplaza estos con tus datos reales de la API
    songs = [
        {
            "id": "song-1",
            "nombre": "Midnight Dreams",
            "artista": "Luna Echo",
            "genero": "Electrónica",
            "imagen": "https://via.placeholder.com/300?text=Midnight+Dreams",
            "precio": "1.29"
        },
        {
            "id": "song-2",
            "nombre": "Ocean Waves",
            "artista": "The Surfers",
            "genero": "Indie",
            "imagen": "https://via.placeholder.com/300?text=Ocean+Waves",
            "precio": "0.99"
        },
        {
            "id": "song-3",
            "nombre": "Mountain High",
            "artista": "Mountain High",
            "genero": "Rock",
            "imagen": "https://via.placeholder.com/300?text=Mountain+High",
            "precio": "1.49"
        },
        {
            "id": "song-4",
            "nombre": "Urban Beats",
            "artista": "Urban Beats",
            "genero": "Hip-Hop",
            "imagen": "https://via.placeholder.com/300?text=Urban+Beats",
            "precio": "1.29"
        },
        {
            "id": "song-5",
            "nombre": "Summer Vibes",
            "artista": "The Surfers",
            "genero": "Indie",
            "imagen": "https://via.placeholder.com/300?text=Summer+Vibes",
            "precio": "0.99"
        },
        {
            "id": "song-6",
            "nombre": "Rock Anthem",
            "artista": "Mountain High",
            "genero": "Rock",
            "imagen": "https://via.placeholder.com/300?text=Rock+Anthem",
            "precio": "1.49"
        },
    ]
    
    albums = [
        {
            "id": "album-1",
            "nombre": "Neon Lights",
            "artista": "Luna Echo",
            "genero": "Electrónica",
            "imagen": "https://via.placeholder.com/300?text=Neon+Lights",
            "precio": "9.99"
        },
        {
            "id": "album-2",
            "nombre": "Coastal Tales",
            "artista": "The Surfers",
            "genero": "Indie",
            "imagen": "https://via.placeholder.com/300?text=Coastal+Tales",
            "precio": "8.99"
        },
        {
            "id": "album-3",
            "nombre": "Peak Experience",
            "artista": "Mountain High",
            "genero": "Rock",
            "imagen": "https://via.placeholder.com/300?text=Peak+Experience",
            "precio": "10.99"
        },
    ]
    
    genres = ["Electrónica", "Indie", "Rock", "Hip-Hop", "Pop", "Jazz"]
    artistas = ["Luna Echo", "The Surfers", "Mountain High", "Urban Beats"]
    
    # Determinar tipo de usuario (False = Fan, True = Artista)
    tipoUsuario = False
    if userdata:
        tipoUsuario = False  # Por ahora, todos como fans (implementar lógica después)
    
    return osv.get_shop_view(request, songs, genres, artistas, albums, tipoUsuario)

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
        return osv.get_error_view(request, userdata, f"No se pudo cargar la canción: {str(e)}")


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
        return osv.get_error_view(request, userdata, f"No se pudo cargar el álbum: {str(e)}")

