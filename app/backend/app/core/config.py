from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Social Wishlist API"
    database_url: str = "postgresql://postgres:postgres@localhost:5432/wishlist"
    secret_key: str = "CHANGE_ME"  # override in env
    access_token_expire_minutes: int = 60
    cors_origins: list[str] = ["*"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        env_prefix = ""


settings = Settings()

