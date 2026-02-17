from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.realtime import manager


router = APIRouter()


async def _wishlist_ws_handler(websocket: WebSocket, wishlist_id: int) -> None:
    room = str(wishlist_id)
    await manager.connect(room, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(room, websocket)


@router.websocket("/ws/wishlists/{wishlist_id}")
async def wishlist_ws(websocket: WebSocket, wishlist_id: int):
    await _wishlist_ws_handler(websocket, wishlist_id)


@router.websocket("/ws/{wishlist_id}")
async def wishlist_ws_short(websocket: WebSocket, wishlist_id: int):
    """Алиас для /ws/4 когда NEXT_PUBLIC_WS_URL задан как wss://.../ws"""
    await _wishlist_ws_handler(websocket, wishlist_id)

