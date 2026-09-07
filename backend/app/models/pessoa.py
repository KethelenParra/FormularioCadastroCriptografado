"""Model Pessoa — tabela pessoas no PostgreSQL."""

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.database import Base


class Pessoa(Base):
    """
    Cadastro de pessoa.

    Somente id, nome_completo, created_at e updated_at ficam em claro.
    Demais campos pessoais são armazenados como TEXT criptografado (AES-256-GCM).
    """

    __tablename__ = "pessoas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # Em claro
    nome_completo: Mapped[str] = mapped_column(String(255), nullable=False, index=True)

    # Criptografados (AES) — TEXT
    apelido: Mapped[str | None] = mapped_column(Text, nullable=True)
    data_nascimento: Mapped[str | None] = mapped_column(Text, nullable=True)
    genero: Mapped[str | None] = mapped_column(Text, nullable=True)
    nacionalidade: Mapped[str | None] = mapped_column(Text, nullable=True)
    cpf: Mapped[str] = mapped_column(Text, nullable=False)
    cep: Mapped[str | None] = mapped_column(Text, nullable=True)
    logradouro: Mapped[str | None] = mapped_column(Text, nullable=True)
    numero: Mapped[str | None] = mapped_column(Text, nullable=True)
    complemento: Mapped[str | None] = mapped_column(Text, nullable=True)
    bairro: Mapped[str | None] = mapped_column(Text, nullable=True)
    cidade: Mapped[str | None] = mapped_column(Text, nullable=True)
    estado: Mapped[str | None] = mapped_column(Text, nullable=True)
    telefone: Mapped[str | None] = mapped_column(Text, nullable=True)
    email: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
