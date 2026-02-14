# Решение ошибки "Error creating build plan with Railpack"

## Проблема
Railway не может автоматически определить, как собрать проект.

## Решения

### Решение 1: Указать Root Directory (самое важное!)

1. В Railway проекте откройте настройки сервиса (Settings)
2. Найдите раздел **"Root Directory"**
3. Установите: `backend`
4. Сохраните и перезапустите деплой

### Решение 2: Использовать Dockerfile напрямую

Если Root Directory уже установлен, но ошибка остаётся:

1. В настройках сервиса (Settings → Build & Deploy)
2. Найдите раздел **"Build Command"** или **"Dockerfile Path"**
3. Убедитесь, что указан путь к Dockerfile: `Dockerfile` (относительно Root Directory)
4. Или выберите **"Use Dockerfile"** вместо "Nixpacks"

### Решение 3: Явная конфигурация через railway.json

Я уже создал файл `railway.json` в папке `backend`. Убедитесь, что:

1. Файл `backend/railway.json` существует (я его создал)
2. Root Directory в Railway = `backend`
3. Railway автоматически подхватит эту конфигурацию

### Решение 4: Использовать Nixpacks (автоматическое определение)

Если Dockerfile не работает, можно попробовать Nixpacks:

1. В настройках сервиса (Settings → Build & Deploy)
2. Выберите **"Nixpacks"** вместо "Dockerfile"
3. Укажите:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Решение 5: Проверить структуру файлов

Убедитесь, что в папке `backend` есть:

```
backend/
├── Dockerfile          ✅
├── railway.json        ✅
├── requirements.txt    ✅
├── alembic.ini         ✅
├── app/
│   ├── main.py
│   ├── ...
└── ...
```

### Пошаговая инструкция для Railway

1. **Создайте новый проект** в Railway через веб-интерфейс
2. **Подключите GitHub репозиторий** (если ещё не подключен)
3. **Добавьте сервис**:
   - "New" → "GitHub Repo"
   - Выберите ваш репозиторий
4. **Настройте Root Directory**:
   - Settings → Root Directory → `backend`
5. **Настройте Build**:
   - Settings → Build & Deploy
   - Убедитесь, что выбран "Dockerfile" или "Nixpacks"
6. **Добавьте PostgreSQL**:
   - "New" → "Database" → "PostgreSQL"
7. **Настройте переменные окружения**:
   - Settings → Variables
   - Добавьте `SECRET_KEY` (сгенерируйте: `openssl rand -hex 32`)
   - `DATABASE_URL` установится автоматически из PostgreSQL
8. **Задеплойте**:
   - Railway автоматически начнёт сборку
   - Дождитесь завершения деплоя
9. **Запустите миграции**:
   - После успешного деплоя откройте консоль (View Logs → Connect)
   - Выполните: `alembic upgrade head`

### Проверка после деплоя

После успешного деплоя проверьте:

```bash
# Замените на ваш Railway домен
curl https://your-app.railway.app/health
```

Должно вернуть: `{"status": "ok"}`

### Если ничего не помогает

1. Удалите сервис в Railway
2. Создайте новый сервис заново
3. Убедитесь, что Root Directory = `backend` с самого начала
4. Используйте Nixpacks вместо Dockerfile (более надёжно для автоматического определения)
