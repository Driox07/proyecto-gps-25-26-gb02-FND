import json
from fastapi import FastAPI, Query, Request, Response
from fastapi.staticfiles import StaticFiles
import os
import requests
import view.oversound_view as osv

auth_server = "localhost:50001"


app = FastAPI()
osv = osv.View()

app.mount("/static", StaticFiles(directory='static'), name="static")

def obtain_user_data(token: str):
    if not token:
        return None
    try:
        resp = requests.get(f"http://localhost:8080/auth/{token}", timeout=2, headers={"Accept": "application/json"})
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException:
        return None

@app.get("/")
def index(request: Request):
    token = request.cookies.get("session")
    userdata = obtain_user_data(token)
    print(userdata)
    return osv.get_home_view(request, userdata)

@app.get("/login")
def login(request: Request):
    return osv.get_login_view(request)

@app.get("/register")
def register(request: Request):
    return osv.get_register_view(request)