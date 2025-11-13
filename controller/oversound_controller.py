import json
from fastapi import FastAPI, Query, Request, Response
from fastapi.responses import RedirectResponse
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
        resp = requests.get(f"{servers.SYU}/auth/{token}", timeout=2, headers={"Accept": "application/json"})
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
def login(request: Request):
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    if userdata:
        return RedirectResponse("/")
    return osv.get_login_view(request, userdata, servers.SYU)

@app.post("/logout")
def logout(request: Request):
    try:
        token = request.cookies.get("oversound_auth")
        resp = request.get(f"{servers.SYU}/logout/{token}", timeout=2, headers={"Accept": "applications/json"})
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException:
        return Response(content=json.dumps({"error": "Couldn't connect with authentication service"}), media_type="application/json", status_code=500)

@app.get("/register")
def register(request: Request):
    token = request.cookies.get("oversound_auth")
    userdata = obtain_user_data(token)
    if userdata:
        return RedirectResponse("/")
    return osv.get_register_view(request, userdata, servers.SYU)

@app.get("/user/{nick}")
def register(request: Request, nick: str):
    token = request.cookies.get("session")
    userdata = requests.get(f"{servers.SYU}/user/{nick}", timeout=2, headers={"Accept": "application/json", "Cookie": f"session={token}"})
    userdata.raise_for_status()
    print(userdata.json())
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

