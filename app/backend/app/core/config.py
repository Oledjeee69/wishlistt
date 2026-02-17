from pydantic_settings import BaseSettings


def _parse_cors_origins(v: str | list[str]) -> list[str]:
    if isinstance(v, list):
        return v
    return [x.strip() for x in str(v).split(",") if x.strip()]


class Settings(BaseSettings):
    app_name: str = "Social Wishlist API"
    database_url: str = "postgresql://postgres:postgres@localhost:5432/wishlist"
    secret_key: str = "CHANGE_ME"  # override in env
    access_token_expire_minutes: int = 60
    # При allow_credentials=True нельзя "*" — нужны явные origins. Через env: CORS_ORIGINS="https://wishlistt.vercel.app"
    cors_origins: str = "http://localhost:3000,https://wishlistt.vercel.app"

    @property
    def cors_origins_list(self) -> list[str]:
        return _parse_cors_origins(self.cors_origins)

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        env_prefix = ""


settings = Settings()
