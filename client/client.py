import asyncio
import websockets
import json
import sys

async def run(user, host="127.0.0.1", port=8000):
        uri = f"ws://{host}:{port}/ws/chat"
        async with websockets.connect(uri) as ws:
            print(f"Connected as : {user} Type messages and press Enter.\n")

            async def listen():#client listening to server for messages
                while True:
                        message = await ws.recv()
                        parsed = json.loads(message)
                        if parsed.get("type") == "system":
                            print(f"[system] {parsed.get('text')}")
                        elif parsed.get("type") == "message":
                            sender = parsed.get("user")
                            text = parsed.get("text")
                            print(f"{sender}: {text}")
                        else:
                            print("recv:", parsed) 

            listener = asyncio.create_task(listen()) #client can listen as well as send messages
            while True: #makes sure message is sent only if input is not empty
                try:
                    text = await asyncio.get_event_loop().run_in_executor(None, input)
                    if text.strip() == "":
                            continue
                    msg = {"type": "message", "user": user, "text": text}
                    await ws.send(json.dumps(msg))
                except websockets.ConnectionClosed:
                        print("Connection closed while sending.")
                        break       

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python client/cli_client.py <username>")
        sys.exit(1)
    username = sys.argv[1]
    asyncio.run(run(username))
