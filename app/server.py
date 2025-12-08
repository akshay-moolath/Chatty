from fastapi import FastAPI, WebSocket
from fastapi.responses import FileResponse
import json
import asyncio
from fastapi.staticfiles import StaticFiles



app = FastAPI()

@app.get("/")# connecting static pages to url/endpoint
def home():
    return FileResponse("static/index.html")

app.mount("/static", StaticFiles(directory="static"), name="static")

clients = set()

async def broadcast(text: str):
    for client in list(clients):
        try:
            await client.send_text(text)
        except Exception:
            clients.discard(client)



@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):

    await websocket.accept()

    clients.add(websocket)

    await websocket.send_text(json.dumps({"type": "system", "text": "Welcome to the chat!"}))

    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            text = json.dumps(msg)
            await broadcast(text)
    except:
        clients.discard(websocket)
        print("Client disconnected.")
