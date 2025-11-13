import json
from fastapi import FastAPI, Query, Request, Response
from fastapi.staticfiles import StaticFiles
import os
import view.oversound_view as osv

auth_server = "localhost:50001"


app = FastAPI()
osv = osv.View()

app.mount("/static", StaticFiles(directory='static'), name="static")

def auth_user(token: str):
    
    pass

@app.get("/")
def index(request: Request):
    return osv.get_home_view(request)

@app.get("/login")
def login(request: Request):
    return osv.get_login_view(request)