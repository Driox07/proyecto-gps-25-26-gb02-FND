import json
from fastapi import FastAPI, Query, Request, Response

app = FastAPI()

undersound_view = UnderSoundView()
