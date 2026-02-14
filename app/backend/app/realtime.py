from typing import Dict, List

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        # room_id -> list[WebSocket]
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, room: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.setdefault(room, []).append(websocket)

    def disconnect(self, room: str, websocket: WebSocket) -> None:
        if room in self.active_connections:
            self.active_connections[room] = [
                ws for ws in self.active_connections[room] if ws is not websocket
            ]
            if not self.active_connections[room]:
                del self.active_connections[room]

    async def broadcast(self, room: str, message: dict) -> None:
        if room not in self.active_connections:
            return
        dead: List[WebSocket] = []
        for connection in self.active_connections[room]:
            try:
                await connection.send_json(message)
            except Exception:
                dead.append(connection)
        for ws in dead:
            self.disconnect(room, ws)


manager = ConnectionManager()

