from fastapi.templating import Jinja2Templates
from fastapi import Request
from API_KEYS import API_CREDENTIALS

templates = Jinja2Templates(directory="view/templates") # Esta ruta es la que se va a usar para renderizar las plantillas
apicreds = API_CREDENTIALS() # Cargamos las credenciales de la API de Firebase

class View():

    def __init__(self): 
        pass

    # Esta función se va a usar para renderizar la template home.html
    def get_home_view(self, request: Request, userdata: dict, syu_server: str):
        data = {"userdata": userdata, "syu_server": syu_server}
        return templates.TemplateResponse("home.html", {"request" : request, "data": data})
    
    # Renderizar la template login.html
    def get_login_view(self, request: Request, userdata: dict, fnd_server: str):
        data = {"userdata": userdata, "fnd_server": fnd_server}
        return templates.TemplateResponse("login.html", {"request": request, "data": data})

    # Renderizar la template register.html
    def get_register_view(self, request: Request, userdata: dict, fnd_server: str):
        data = {"userdata": userdata, "fnd_server": fnd_server}
        return templates.TemplateResponse("register.html", {"request": request, "data": data})

    # Renderizar la template de recuperación de contraseña
    def get_forgot_password_view(self, request: Request, userdata: dict, fnd_server: str):
        data = {"userdata": userdata, "fnd_server": fnd_server}
        return templates.TemplateResponse("forgot_password.html", {"request": request, "data": data})
    
    # Renderizar la template de subir canción
    def get_upload_song_view(self, request: Request, userdata: dict):
        data = {"userdata": userdata}
        return templates.TemplateResponse("upload_song.html", {"request": request, "data": data})
    
    # Renderizar la template de subir álbum
    def get_upload_album_view(self, request: Request, userdata: dict):
        data = {"userdata": userdata}
        return templates.TemplateResponse("upload_album.html", {"request": request, "data": data})
    
    # Renderizar la template de subir merchandising
    def get_upload_merch_view(self, request: Request, userdata: dict):
        data = {"userdata": userdata}
        return templates.TemplateResponse("upload_merch.html", {"request": request, "data": data})
    
    # Renderizar la template de error
    def get_error_view(self, request: Request, userdata: dict, error_message: str, error_details: str = ""):
        data = {"userdata": userdata, "error_message": error_message, "error_details": error_details}
        return templates.TemplateResponse("error.html", {"request": request, "data": data})

    # Renderizar la template shop.html
    def get_shop_view(self, request: Request, userdata: dict, songs, genres, artistas, albums, merch):
        data = {"userdata": userdata, "songs": songs, "genres": genres, "artistas": artistas, "albums": albums, "merch": merch}
        return templates.TemplateResponse("shop.html", {"request": request, "data": data})

    # Esta función se va a usar para renderizar la template songs.html
    def get_upload_song_view(self, request: Request):
        return templates.TemplateResponse("music/upload-song.html", {"request": request})
    
    def get_songs_view(self, request: Request, songs):
        return templates.TemplateResponse("main/index.html", {"request" :request, "songs" : songs})
    
    def get_song_view(self, request: Request, song_info : dict, tipoUsuario: int, user, isLiked: bool, inCarrito: bool, syu_server: str = None):
        data = {"userdata": user, "syu_server": syu_server, "song": song_info}
        return templates.TemplateResponse("song.html", {"request": request, "data": data, "tipoUsuario": tipoUsuario, "isLiked": isLiked, "inCarrito": inCarrito})

    def get_edit_song_view(self, request: Request, song_info):
        return templates.TemplateResponse("music/song-edit.html", {"request": request, "song": song_info})    

    # Renderizar la template logut.html
    def get_logout_view(self, request: Request):
        return templates.TemplateResponse("auth/logout.html", {"request": request, "API_CREDENTIALS" : apicreds })

    # Renderizar la template profile.html
    # Necesita un user_info completo, no se contempla otro caso.
    def get_perfil_view(self, request: Request, usuario_data, canciones_biblioteca, listas_completas, is_own_profile: bool = False, payment_methods: list = None, syu_server: str = None, tya_server: str = None):
        if payment_methods is None:
            payment_methods = []
        data = {"userdata": usuario_data, "syu_server": syu_server}
        return templates.TemplateResponse("user_profile.html", {
            "request": request,
            "data": data,
            "user": usuario_data,
            "canciones_biblioteca": canciones_biblioteca,
            "listas_completas": listas_completas,
            "is_own_profile": is_own_profile,
            "payment_methods": payment_methods,
            "syu_server": syu_server,
            "tya_server": tya_server,
            "API_CREDENTIALS" : apicreds
        })
    
    # Renderizar la template faqs.html
    def get_faqs_view(self, request: Request, faqs):
        return templates.TemplateResponse("main/faqs.html", {"request": request, "faqs": faqs })
    
    # Renderizar la template album-edit.html
    def get_album_edit_view(self, request: Request, album_info : dict, songs: list[dict]):
        return templates.TemplateResponse("music/album-edit.html", {"request": request, "album": album_info, "songs": songs})

    # Renderizar la template upload-album.html
    def get_upload_album_view(self, request: Request, songs: list[dict]):
        return templates.TemplateResponse("music/upload-album.html", {"request": request , "songs": songs}) 
    
    # Renderizar la template album.html
    def get_album_view(self, request: Request, album_info : dict, tipoUsuario : int, isLiked: bool, inCarrito: bool, tiempo_formateado: str, userdata: dict = None, syu_server: str = None):
        data = {"userdata": userdata, "syu_server": syu_server}
        return templates.TemplateResponse("album.html", {"request": request, "data": data, "album": album_info, "tipoUsuario": tipoUsuario, "isLiked": isLiked, "inCarrito": inCarrito, "duracion_total": tiempo_formateado})
    
    # Renderizar la template header.html
    def get_header_view(self, request: Request, user_info : dict):
        return templates.TemplateResponse("includes/header.html", {"request": request, "user": user_info})
    
    # Renderizar la template footer.html
    def get_footer_view(self, request: Request, user_info : dict):
        return templates.TemplateResponse("includes/footer.html", {"request": request, "user": user_info})

    # Renderizar la template about.html
    def get_about_view(self, request: Request):
        return templates.TemplateResponse("main/about.html", {"request" : request})

    # Renderizar la template contact.html
    def get_contact_view(self, request : Request): 
        return templates.TemplateResponse("main/contact.html", {"request" : request})
        
    # Renderizar la template carrito.html
    def get_carrito_view(self, request: Request, carrito : dict):
        return templates.TemplateResponse("shop/cart.html", {"request": request, "carrito": carrito})

    # Renderizar la template prepaid.html
    def get_prepaid_view(self, request: Request, carrito : dict):
        return templates.TemplateResponse("shop/prepaid.html", {"request": request, "carrito": carrito})
    
    # Renderizar la template tpv.html
    def get_tpv_view(self, request: Request):
        return templates.TemplateResponse("shop/tpv.html", {"request": request})
    
    # Renderizar la template studio.html
    def get_studio_view(self, request: Request, songs: list[dict], albums: list[dict], user: dict):
        return templates.TemplateResponse("user/studio.html", {"request": request, "songs": songs, "albums": albums, "user" : user})
    
    # Renderizar la template artista.html
    def get_artista_view(self, request: Request, artista: dict, singles: list[dict], albums: list[dict], songs: list[dict], tipoUsuario: int):
        return templates.TemplateResponse("shop/artista.html", {"request": request, "artista" : artista, "singles" : singles, "albums" : albums, "songs" : songs, "tipoUsuario" : tipoUsuario})    
    
    # Esta función se va a usar para renderizar la template index.html
    def get_play_view(self, request: Request): 
        return templates.TemplateResponse("includes/radio.html", {"request" : request})

    # Renderizar la template purchased.html
    def get_purchased_view(self, request: Request, user, songs):
        return templates.TemplateResponse("shop/purchased.html", {"request": request, "usuario": user, "songs": songs})
    
    # Renderizar la template search.html
    def get_search_view(self, request: Request, all_items : list[dict]):
        return templates.TemplateResponse("main/search.html", {"request": request, "items": all_items})
    
    # Renderizar la template artist_profile.html
    def get_artist_profile_view(self, request: Request, artist: dict, userdata: dict, is_own_profile: bool, syu_server: str = None):
        data = {"userdata": userdata, "syu_server": syu_server}
        return templates.TemplateResponse("artist_profile.html", {
            "request": request,
            "data": data,
            "artist": artist,
            "is_own_profile": is_own_profile
        })
    
    # Renderizar la template artist_studio.html
    def get_artist_studio_view(self, request: Request, artist: dict, userdata: dict, syu_server: str = None):
        data = {"userdata": userdata, "syu_server": syu_server}
        return templates.TemplateResponse("artist_studio.html", {
            "request": request,
            "data": data,
            "artist": artist
        })
    
    # Renderizar la template terms.html
    def get_terms_view(self, request: Request, userdata: dict, syu_server: str = None):
        from datetime import datetime
        data = {"userdata": userdata, "syu_server": syu_server}
        last_updated = datetime.now().strftime("%d de %B de %Y")
        return templates.TemplateResponse("terms.html", {
            "request": request,
            "data": data,
            "last_updated": last_updated
        })
    
    # Renderizar la template privacy.html
    def get_privacy_view(self, request: Request, userdata: dict, syu_server: str = None):
        from datetime import datetime
        data = {"userdata": userdata, "syu_server": syu_server}
        last_updated = datetime.now().strftime("%d de %B de %Y")
        return templates.TemplateResponse("privacy.html", {
            "request": request,
            "data": data,
            "last_updated": last_updated
        })
    
    # Renderizar la template cookies.html
    def get_cookies_view(self, request: Request, userdata: dict, syu_server: str = None):
        from datetime import datetime
        data = {"userdata": userdata, "syu_server": syu_server}
        last_updated = datetime.now().strftime("%d de %B de %Y")
        return templates.TemplateResponse("cookies.html", {
            "request": request,
            "data": data,
            "last_updated": last_updated
        })
    
    # Renderizar la template faq.html
    def get_faq_view(self, request: Request, userdata: dict, syu_server: str = None):
        from datetime import datetime
        data = {"userdata": userdata, "syu_server": syu_server}
        last_updated = datetime.now().strftime("%d de %B de %Y")
        return templates.TemplateResponse("faq.html", {
            "request": request,
            "data": data,
            "last_updated": last_updated
        })
    
    # Renderizar la template contact.html
    def get_contact_view(self, request: Request, userdata: dict, syu_server: str = None):
        from datetime import datetime
        data = {"userdata": userdata, "syu_server": syu_server}
        last_updated = datetime.now().strftime("%d de %B de %Y")
        return templates.TemplateResponse("contact.html", {
            "request": request,
            "data": data,
            "last_updated": last_updated
        })
    
    # Renderizar la template help.html
    def get_help_view(self, request: Request, userdata: dict, syu_server: str = None):
        from datetime import datetime
        data = {"userdata": userdata, "syu_server": syu_server}
        last_updated = datetime.now().strftime("%d de %B de %Y")
        return templates.TemplateResponse("help.html", {
            "request": request,
            "data": data,
            "last_updated": last_updated
        })
    
    # Renderizar la template merch.html
    def get_merch_view(self, request: Request, merch_info : dict, tipoUsuario : int, isLiked: bool, inCarrito: bool, userdata: dict = None, syu_server: str = None):
        data = {"userdata": userdata, "syu_server": syu_server, "merch": merch_info}
        return templates.TemplateResponse("merch.html", {"request": request, "data": data, "tipoUsuario": tipoUsuario, "isLiked": isLiked, "inCarrito": inCarrito})
    
    # Renderizar la template cart.html
    def get_cart_view(self, request: Request, userdata: dict = None, syu_server: str = None):
        data = {"userdata": userdata, "syu_server": syu_server}
        return templates.TemplateResponse("cart.html", {"request": request, "data": data})
    
    # Renderizar la template label.html
    def get_label_view(self, request: Request, label_info : dict, is_owner: bool, is_member: bool, userdata: dict = None, syu_server: str = None):
        data = {"userdata": userdata, "syu_server": syu_server}
        return templates.TemplateResponse("label.html", {"request": request, "data": data, "label": label_info, "is_owner": is_owner, "is_member": is_member})
    
    # Renderizar la template label_create.html
    def get_label_create_view(self, request: Request, label_info : dict = None, userdata: dict = None, syu_server: str = None):
        data = {"userdata": userdata, "syu_server": syu_server}
        return templates.TemplateResponse("label_create.html", {"request": request, "data": data, "label": label_info})
    
    # Renderizar la template giftcard.html
    def get_giftcard_view(self, request: Request, userdata: dict, syu_server: str = None):
        data = {"userdata": userdata, "syu_server": syu_server}
        return templates.TemplateResponse("giftcard.html", {"request": request, "data": data})
    
    # Renderizar la template artist_create.html
    def get_artist_create_view(self, request: Request, userdata: dict = None, syu_server: str = None):
        data = {"userdata": userdata, "syu_server": syu_server}
        return templates.TemplateResponse("artist_create.html", {"request": request, "data": data})