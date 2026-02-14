## Backend (FastAPI)

Сервис API и WebSocket для социального вишлиста.

### Стек

- FastAPI
- SQLAlchemy + Alembic
- PostgreSQL
- JWT аутентификация

### Локальный запуск (разработческий)

1. Создать и заполнить `.env` на основе `.env.example`.
2. Установить зависимости:

```bash
pip install -r requirements.txt
```

3. Применить миграции:

```bash
alembic upgrade head
```

4. Запустить приложение:

```bash
uvicorn app.main:app --reload
```

### Важные переменные окружения

- `DATABASE_URL` — строка подключения к PostgreSQL.
- `SECRET_KEY` — секрет для подписи JWT.
- `ACCESS_TOKEN_EXPIRE_MINUTES` — срок жизни access‑токена.

### Деплой (Railway/Render/Fly.io)

- Соберите и запустите контейнер из `Dockerfile`.
- Создайте managed PostgreSQL и пропишите `DATABASE_URL` в переменных окружения сервиса.
- Прогоните миграции Alembic (`alembic upgrade head`) в контейнере перед первым запуском.

