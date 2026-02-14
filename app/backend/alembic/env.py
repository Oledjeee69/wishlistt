from logging.config import fileConfig
import os
import sys
from pathlib import Path

# Корень проекта (backend) — чтобы при запуске alembic из любой директории находился модуль app
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import create_engine, pool
from alembic import context

from app.core.config import settings
from app.db import Base  # noqa: F401

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

# URL берём из переменной окружения DATABASE_URL (Railway/Render подставляют её).
# Если не задана — используется значение из settings (localhost для локальной разработки).
_raw_url = os.environ.get("DATABASE_URL") or settings.database_url
# Некоторые платформы отдают postgres://, SQLAlchemy ожидает postgresql://
database_url = _raw_url.replace("postgres://", "postgresql://", 1) if _raw_url else settings.database_url

if "localhost" in database_url or "127.0.0.1" in database_url:
    if not os.environ.get("DATABASE_URL"):
        raise RuntimeError(
            "Миграции подключаются к localhost. Для облака (Railway/Render) задайте переменную DATABASE_URL. "
            "Локально: создайте .env с DATABASE_URL или запускайте миграции при запущенной локальной PostgreSQL."
        )


def run_migrations_offline() -> None:
    context.configure(url=database_url, target_metadata=target_metadata, literal_binds=True)

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = create_engine(database_url, poolclass=pool.NullPool)

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

