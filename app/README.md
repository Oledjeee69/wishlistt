## Social Wishlist

Монорепозиторий приложения «социальный вишлист».

- **frontend** — Next.js (App Router, TypeScript)
- **backend** — FastAPI + PostgreSQL

### Деплой (пошагово)

**Пошаговая инструкция:** [DEPLOY_STEP_BY_STEP.md](DEPLOY_STEP_BY_STEP.md)  
Там описано, как развернуть фронт на **Vercel**, бэкенд и БД на **Railway**.

Кратко:
1. **Railway:** New Project → GitHub repo → Root Directory = `backend`, добавить PostgreSQL, задать `SECRET_KEY` и `DATABASE_URL`, выполнить `alembic upgrade head`, выдать домен.
2. **Vercel:** Import repo → Root Directory = `frontend`, задать `NEXT_PUBLIC_API_URL` и `NEXT_PUBLIC_WS_URL` (URL бэкенда с Railway), Deploy.

Подробности и решение типичных ошибок — в [DEPLOY_STEP_BY_STEP.md](DEPLOY_STEP_BY_STEP.md).

