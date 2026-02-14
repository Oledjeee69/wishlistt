from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.realtime import manager


router = APIRouter()


@router.websocket("/ws/wishlists/{wishlist_id}")
async def wishlist_ws(websocket: WebSocket, wishlist_id: int):
    room = str(wishlist_id)
    await manager.connect(room, websocket)
    try:
        while True:
            # Клиент может отправлять «ping» или вообще ничего — мы слушаем,
            # чтобы соединение не падало.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(room, websocket)

