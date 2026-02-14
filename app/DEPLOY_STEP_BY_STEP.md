# Пошаговый деплой: фронт на Vercel, бэкенд на Railway

Репозиторий — монорепозиторий: папка `frontend` (Next.js) и папка `backend` (FastAPI).  
Фронт деплоится на Vercel, бэкенд — на Railway с PostgreSQL.

---

## Часть 1. Бэкенд на Railway

### Шаг 1.1. Репозиторий на GitHub

- Закоммитьте и запушьте весь проект в репозиторий, например:  
  `https://github.com/Oledjeee69/wishlistssss`

### Шаг 1.2. Создание проекта в Railway

1. Зайдите на [railway.app](https://railway.app) и войдите (через GitHub).
2. Нажмите **New Project**.
3. Выберите **Deploy from GitHub repo**.
4. Выберите репозиторий `wishlistssss` (или ваш).
5. Railway создаст сервис. Не запускайте деплой сразу — сначала настройте его.

### Шаг 1.3. Root Directory для бэкенда

1. Откройте созданный сервис (не проект, а именно сервис с кодом).
2. Перейдите в **Settings**.
3. В блоке **Source** найдите **Root Directory**.
4. Укажите: `backend`.
5. Сохраните (если есть кнопка Save).

### Шаг 1.4. Добавление PostgreSQL

1. В том же проекте Railway нажмите **+ New**.
2. Выберите **Database** → **PostgreSQL**.
3. Дождитесь создания БД. Railway автоматически создаст переменную `DATABASE_URL` и привяжет её к сервису (если сервисы в одном проекте, часто подтягивается автоматически; иначе — см. шаг 1.7).

### Шаг 1.5. Переменные окружения бэкенда

1. Откройте ваш **сервис с кодом** (не БД).
2. Вкладка **Variables** (или **Settings** → **Variables**).
3. Добавьте вручную (если ещё нет):

| Переменная | Значение | Обязательно |
|------------|----------|-------------|
| `SECRET_KEY` | Случайная строка (см. ниже) | Да |
| `DATABASE_URL` | Обычно подставляется из PostgreSQL (см. шаг 1.7) | Да |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Нет (есть дефолт) |

Сгенерировать `SECRET_KEY` (в терминале на своём компьютере):

```bash
openssl rand -hex 32
```

Вставьте результат в значение `SECRET_KEY`.

### Шаг 1.6. Связь сервиса с PostgreSQL (если DATABASE_URL не подставился)

1. В проекте Railway откройте сервис **PostgreSQL**.
2. Вкладка **Variables** или **Connect** — скопируйте `DATABASE_URL` (или **Postgres connection URL**).
3. Откройте сервис с **вашим кодом** → **Variables**.
4. Нажмите **+ New Variable** → имя `DATABASE_URL`, значение — вставленный URL.
5. Сохраните.

### Шаг 1.7. Сборка и деплой

1. Убедитесь, что в корне **проекта** (не только сервиса) в репозитории есть папка `backend` с файлами `Dockerfile`, `requirements.txt`, `app/`, `alembic/`.
2. В сервисе с кодом откройте вкладку **Deployments**.
3. Если деплой уже запустился и упал — нажмите **Redeploy** после настройки Root Directory и переменных.
4. Дождитесь зелёного статуса деплоя.

### Шаг 1.8. Миграции БД

1. В Railway откройте сервис с кодом.
2. Найдите **Shell** / **Console** (или **Settings** → одна из кнопок для запуска команды в среде деплоя).
3. Выполните (если Railway даёт такую возможность):

```bash
alembic upgrade head
```

Если отдельной консоли нет — можно добавить в **Dockerfile** или в **Start Command** одноразовый запуск миграций перед uvicorn (по желанию; ниже не расписано).

### Шаг 1.9. Публичный домен бэкенда

1. Сервис с кодом → **Settings**.
2. Раздел **Networking** / **Public Networking**.
3. Нажмите **Generate Domain** (или **Add Domain**).
4. Скопируйте URL, например:  
   `https://wishlistssss-production.up.railway.app`

Проверка:

- Откройте в браузере: `https://ВАШ-ДОМЕН/health`  
  Должно вернуться: `{"status":"ok"}`.
- Откройте: `https://ВАШ-ДОМЕН/docs`  
  Должна открыться Swagger-документация API.

Домен бэкенда понадобится для фронта на Vercel (шаг 2.5).

---

## Часть 2. Фронтенд на Vercel

### Шаг 2.1. Импорт проекта в Vercel

1. Зайдите на [vercel.com](https://vercel.com) и войдите (через GitHub).
2. Нажмите **Add New** → **Project**.
3. Импортируйте репозиторий `wishlistssss` (или ваш).
4. Нажмите **Import**.

### Шаг 2.2. Root Directory для фронта

1. В настройках импорта найдите **Root Directory**.
2. Нажмите **Edit** и укажите: `frontend`.
3. Оставьте **Framework Preset**: Next.js (Vercel определит сам, если нужно).

### Шаг 2.3. Переменные окружения (до первого деплоя)

Перед первым деплоем добавьте переменные:

1. В том же экране найдите **Environment Variables**.
2. Добавьте две переменные (подставьте свой домен Railway из шага 1.9):

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_API_URL` | `https://wishlistssss-production.up.railway.app` |
| `NEXT_PUBLIC_WS_URL` | `wss://wishlistssss-production.up.railway.app/ws/wishlists` |

Важно:

- Без слэша в конце.
- `https` для API, `wss` для WebSocket (на том же домене).
- Примените переменные к окружениям **Production**, **Preview**, **Development** (или хотя бы Production).

### Шаг 2.4. Деплой

1. Нажмите **Deploy**.
2. Дождитесь окончания сборки и деплоя.

### Шаг 2.5. Проверка

1. Откройте выданный Vercel-домен (например `wishlistssss.vercel.app`).
2. Проверьте:
   - главная открывается;
   - регистрация и вход работают (не «Failed to fetch»);
   - после входа можно создать вишлист и открыть его.

Если при регистрации/входе всё ещё «Failed to fetch» — проверьте, что в Vercel в **Settings** → **Environment Variables** действительно заданы `NEXT_PUBLIC_API_URL` и при необходимости `NEXT_PUBLIC_WS_URL`, затем сделайте **Redeploy** проекта.

---

## Часть 3. Типичные проблемы и исправления

### Ошибка «Error creating build plan with Railpack» (Railway)

- **Причина:** Railway не видит, что собирать.
- **Решение:** В настройках сервиса указать **Root Directory** = `backend`. Убедиться, что в `backend` есть `Dockerfile` и `requirements.txt`, затем **Redeploy**.

### Ошибка «Failed to fetch» при регистрации/входе (Vercel)

- **Причина:** Фронт не знает адрес бэкенда (нет или неверный `NEXT_PUBLIC_API_URL`).
- **Решение:** В Vercel в **Settings** → **Environment Variables** задать `NEXT_PUBLIC_API_URL` = ваш Railway-URL бэкенда (без `/api` и без слэша в конце). Сделать **Redeploy**.

### 404 на корне бэкенда (`/`)

- В коде уже есть обработчик для `/`. После деплоя корень должен отдавать JSON. Если всё ещё 404 — убедитесь, что задеплоена последняя версия с зарегистрированным маршрутом `/` в `app/main.py`.

### 500 при запросах к API (логин/регистрация)

- **Причина:** Часто нет БД или миграций, либо не установлены зависимости.
- **Решение:**  
  - Проверить переменную `DATABASE_URL` в Railway.  
  - Выполнить миграции: `alembic upgrade head`.  
  - В `requirements.txt` должны быть `email-validator` и `python-multipart` (они уже добавлены в инструкции по зависимостям).

### CORS-ошибки в браузере

- На бэкенде в настройках по умолчанию разрешены все origins (`cors_origins = ["*"]`). Если меняли — убедитесь, что в списке есть домен Vercel (или оставьте `["*"]` для теста).

---

## Краткий чеклист

**Railway (бэкенд):**

- [ ] New Project → Deploy from GitHub repo.
- [ ] Root Directory = `backend`.
- [ ] Добавлена БД PostgreSQL, в сервисе задан `DATABASE_URL`.
- [ ] Заданы `SECRET_KEY` и при необходимости `ACCESS_TOKEN_EXPIRE_MINUTES`.
- [ ] Выполнены миграции: `alembic upgrade head`.
- [ ] Сгенерирован публичный домен, `/health` и `/docs` открываются.

**Vercel (фронт):**

- [ ] Import репозитория, Root Directory = `frontend`.
- [ ] Заданы `NEXT_PUBLIC_API_URL` и `NEXT_PUBLIC_WS_URL` (ваш Railway-домен).
- [ ] Deploy, проверка регистрации/входа и вишлистов.

После этого всё развёрнуто: фронт на Vercel, бэкенд на Railway.
