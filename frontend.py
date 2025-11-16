import uvicorn
from controller.msvc_servers import FND
from urllib.parse import urlparse

if __name__ == "__main__":
    host = urlparse(FND).hostname
    uvicorn.run("controller.oversound_controller:app", host=host, port=8000, reload=True)