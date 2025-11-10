from fastapi.templating import Jinja2Templates
from fastapi import Request
from fastapi.responses import FileResponse

templates = Jinja2Templates(directory="view/templates")

class UnderSoundView():
    def get_home_page(self, request: Request):
        return templates.TemplateResponse("index.html", {"request": request})