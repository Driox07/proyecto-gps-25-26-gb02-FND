import uvicorn
import os

if __name__ == "__main__":
    uvicorn.run("controller.oversound_controller:app", host=os.getenv("SERVER_IP", "127.0.0.1"), port=os.getenv("SERVER_PORT", "8000"), reload=True)