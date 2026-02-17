from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import auth, wishlists, items, reservations, ws

try:
    from app.routers import preview
    _has_preview = True
except ImportError:
    _has_preview = False


app = FastAPI(title=settings.app_name)

# Регистрируем корень и health первыми, чтобы не было 404
@app.get("/", tags=["root"])
def root():
    return {
        "message": "Social Wishlist API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


app.include_router(auth.router)
app.include_router(wishlists.router)
app.include_router(items.router)
app.include_router(reservations.router)
app.include_router(ws.router)
if _has_preview:
    app.include_router(preview.router)


@app.get("/routes", tags=["debug"])
def list_routes():
    """Диагностический эндпоинт для проверки всех доступных роутов"""
    routes = []
    for route in app.routes:
        if hasattr(route, "path") and hasattr(route, "methods"):
            routes.append({
                "path": route.path,
                "methods": list(route.methods) if route.methods else [],
            })
    return {"routes": routes, "total": len(routes)}

