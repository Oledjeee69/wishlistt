# Инструкция по деплою

## Деплой бэкенда на Railway

### Вариант 1: Через веб-интерфейс Railway (рекомендуется)

1. Зайдите на [railway.app](https://railway.app) и войдите в аккаунт
2. Нажмите "New Project"
3. Выберите "Deploy from GitHub repo" (если репозиторий на GitHub) или "Empty Project"
4. Если выбрали GitHub:
   - Выберите ваш репозиторий
   - Укажите Root Directory: `backend`
   - Railway автоматически определит Dockerfile
5. Если выбрали Empty Project:
   - Нажмите "Add Service" → "GitHub Repo"
   - Выберите репозиторий и укажите Root Directory: `backend`
6. Добавьте PostgreSQL:
   - В проекте нажмите "New" → "Database" → "PostgreSQL"
   - Railway автоматически создаст базу и переменную `DATABASE_URL`
7. Настройте переменные окружения:
   - В настройках сервиса (Settings → Variables) добавьте:
     - `SECRET_KEY` - сгенерируйте через: `openssl rand -hex 32`
     - `ACCESS_TOKEN_EXPIRE_MINUTES=60` (опционально)
   - `DATABASE_URL` уже будет установлен автоматически из PostgreSQL сервиса
8. Запустите миграции:
   - В настройках сервиса найдите "Deploy" или "Settings"
   - В разделе "Deploy" добавьте команду для запуска миграций:
     - Command: `alembic upgrade head`
     - Или выполните вручную через Railway CLI или в консоли контейнера
9. Дождитесь деплоя - Railway автоматически соберет Docker образ и запустит приложение

### Вариант 2: Через Railway CLI

Если у вас установлен Railway CLI:

```bash
# 1. Войдите в Railway
railway login

# 2. Создайте проект (если нужно указать workspace)
railway init

# 3. Укажите workspace при создании проекта
railway init --workspace <workspace-id>

# 4. Или создайте проект через веб-интерфейс и затем:
railway link

# 5. Добавьте PostgreSQL
railway add postgresql

# 6. Установите переменные окружения
railway variables set SECRET_KEY=$(openssl rand -hex 32)
railway variables set ACCESS_TOKEN_EXPIRE_MINUTES=60

# 7. Запустите миграции
railway run alembic upgrade head

# 8. Задеплойте
railway up
```

### Как найти Workspace ID

Если Railway требует workspace ID:

1. Зайдите на [railway.app](https://railway.app)
2. В левом меню вы увидите список ваших workspace'ов
3. URL будет вида: `https://railway.app/workspace/<workspace-id>`
4. Или создайте новый workspace через веб-интерфейс

## Альтернативные варианты деплоя

### Render.com

1. Зайдите на [render.com](https://render.com)
2. "New" → "Web Service"
3. Подключите GitHub репозиторий
4. Укажите:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Добавьте PostgreSQL: "New" → "PostgreSQL"
6. В переменных окружения добавьте:
   - `DATABASE_URL` (автоматически из PostgreSQL)
   - `SECRET_KEY` (сгенерируйте)
7. После первого деплоя запустите миграции через Shell:
   ```bash
   alembic upgrade head
   ```

### Fly.io

1. Установите Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Войдите: `fly auth login`
3. В папке `backend` создайте `fly.toml`:
   ```bash
   fly launch
   ```
4. Добавьте PostgreSQL: `fly postgres create`
5. Привяжите БД: `fly postgres attach <db-name>`
6. Установите переменные:
   ```bash
   fly secrets set SECRET_KEY=$(openssl rand -hex 32)
   ```
7. Запустите миграции: `fly ssh console -C "alembic upgrade head"`
8. Задеплойте: `fly deploy`

## Деплой фронтенда на Vercel

1. Зайдите на [vercel.com](https://vercel.com)
2. "Add New Project"
3. Подключите GitHub репозиторий
4. Укажите:
   - Root Directory: `frontend`
   - Framework Preset: Next.js
5. В Environment Variables добавьте:
   - `NEXT_PUBLIC_API_URL=https://<ваш-бэкенд-домен>`
   - `NEXT_PUBLIC_WS_URL=wss://<ваш-бэкенд-домен>/ws/wishlists`
6. Нажмите "Deploy"

## Проверка после деплоя

### Бэкенд

Проверьте эти URL (замените на ваш домен):

```bash
# Health check
curl https://your-backend.railway.app/health

# Список роутов
curl https://your-backend.railway.app/routes

# Swagger документация
# Откройте в браузере: https://your-backend.railway.app/docs
```

### Фронтенд

Откройте в браузере ваш Vercel домен и проверьте:
- Главная страница загружается
- Можно зарегистрироваться
- Можно войти
- Можно создать вишлист

## Решение проблем

### Railway: "workspaceId required"

**Решение:** Используйте веб-интерфейс Railway вместо CLI, или создайте workspace через веб-интерфейс сначала.

### 404 на всех эндпоинтах

**Проверьте:**
1. Приложение запущено? Проверьте `/health`
2. Правильные ли пути в запросах? Бэкенд ожидает `/auth/login`, а не `/api/auth/login`
3. Правильно ли настроен `NEXT_PUBLIC_API_URL` на фронтенде?

### 500 Internal Server Error

**Проверьте логи:**
1. Установлены ли все зависимости? (`email-validator`, `python-multipart`)
2. Настроен ли `DATABASE_URL`?
3. Прогнаны ли миграции? (`alembic upgrade head`)

### CORS ошибки

**Решение:** В `backend/app/core/config.py` убедитесь, что `cors_origins` содержит домен фронтенда или `["*"]` для разработки.
