"""Configuração do SQLAlchemy 2.x e sessão do banco."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import obter_configuracoes

configuracoes = obter_configuracoes()

engine = create_engine(
    configuracoes.url_banco,
    pool_pre_ping=True,
)

SessaoLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    """Base declarativa para os models."""


def obter_sessao() -> Generator[Session, None, None]:
    """Dependency FastAPI: fornece sessão e garante fechamento."""
    db = SessaoLocal()
    try:
        yield db
    finally:
        db.close()
