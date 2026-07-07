from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    environment: str

    postgres_user: str
    postgres_password: str
    postgres_db: str
    postgres_host: str

    model_config: SettingsConfigDict = SettingsConfigDict(
        env_file=".env", case_sensitive=False, env_file_encoding="utf-8", extra="ignore"
    )


settings = Settings()
