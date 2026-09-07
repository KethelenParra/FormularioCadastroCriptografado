"""Carrega configurações a partir de variáveis de ambiente (.env)."""

from functools import lru_cache
from urllib.parse import quote_plus

from pydantic_settings import BaseSettings, SettingsConfigDict


class Configuracoes(BaseSettings):
    """Configurações da aplicação — valores sensíveis vêm do .env."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_host: str = "localhost"
    database_port: int = 5432
    database_name: str = "crud_dados_pessoais"
    database_user: str = "postgres"
    database_password: str = ""

    aes_key: str = ""

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def url_banco(self) -> str:
        """URL de conexão SQLAlchemy (psycopg v3)."""
        usuario = quote_plus(self.database_user)
        senha = quote_plus(self.database_password)
        return (
            f"postgresql+psycopg://{usuario}:{senha}"
            f"@{self.database_host}:{self.database_port}/{self.database_name}"
        )

    @property
    def lista_origens_cors(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def obter_configuracoes() -> Configuracoes:
    return Configuracoes()
