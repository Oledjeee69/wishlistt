## Frontend (Next.js)

Next.js‑фронтенд для социального вишлиста.

### Локальный запуск

```bash
cd frontend
npm install
npm run dev
```

Переменные окружения:

- `NEXT_PUBLIC_API_URL` — базовый URL бекенда FastAPI, например `https://api.example.com`.
- `NEXT_PUBLIC_WS_URL` — базовый WebSocket‑URL, например `wss://api.example.com/ws/wishlists`.

### Деплой

1. Залейте репозиторий на GitHub/GitLab.
2. Подключите его в Vercel и выберите папку `frontend` как проект.
3. В настройках проекта задайте переменные окружения выше.

