import json
from fastapi import FastAPI, Query, Request, Response
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
    token = request.cookies.get("session")
    userdata = obtain_user_data(token)
    print(userdata)
    return osv.get_home_view(request, userdata, servers.SYU)

@app.get("/login")
def login(request: Request):
    token = request.cookies.get("session")
    userdata = obtain_user_data(token)
    return osv.get_login_view(request, userdata, servers.SYU)

@app.post("/logout")
def logout(request: Request):
    try:
        token = request.cookies.get("session")
        resp = request.get(f"{servers.SYU}/logout/{token}", timeout=2, headers={"Accept": "applications/json"})
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException:
        return Response(content=json.dumps({"error": "Couldn't connect with authentication service"}), media_type="application/json", status_code=500)

@app.get("/register")
def register(request: Request):
    token = request.cookies.get("session")
    userdata = obtain_user_data(token)
    return osv.get_register_view(request, userdata, servers.SYU)

@app.get("/user/{nick}")
def register(request: Request, nick: str):
    userdata = request.get(f"{servers.SYU}/user/{nick}")
    
