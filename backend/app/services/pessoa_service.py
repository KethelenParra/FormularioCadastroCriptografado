"""Serviço de Pessoa — criptografia, persistência e CRUD."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.crypto import ErroCriptografia, criptografar_texto, descriptografar_texto
from app.models.pessoa import Pessoa
from app.schemas.pessoa import PessoaCreate, PessoaUpdate

# Campos que devem ser criptografados antes de persistir
CAMPOS_CRIPTOGRAFADOS = (
    "apelido",
    "data_nascimento",
    "genero",
    "nacionalidade",
    "cpf",
    "cep",
    "logradouro",
    "numero",
    "complemento",
    "bairro",
    "cidade",
    "estado",
    "telefone",
    "email",
)


def _para_texto(valor) -> str | None:
    """Converte valor para string antes da criptografia (datas, etc.)."""
    if valor is None:
        return None
    return str(valor)


def _criptografar_payload(dados: dict) -> dict:
    """Aplica AES nos campos protegidos. nome_completo permanece em claro."""
    resultado = {"nome_completo": dados["nome_completo"]}
    for campo in CAMPOS_CRIPTOGRAFADOS:
        resultado[campo] = criptografar_texto(_para_texto(dados.get(campo)))
    return resultado


def _descriptografar_pessoa(pessoa: Pessoa) -> dict:
    """Monta dicionário com campos descriptografados."""
    try:
        return {
            "id": pessoa.id,
            "nome_completo": pessoa.nome_completo,
            "apelido": descriptografar_texto(pessoa.apelido),
            "data_nascimento": descriptografar_texto(pessoa.data_nascimento),
            "genero": descriptografar_texto(pessoa.genero),
            "nacionalidade": descriptografar_texto(pessoa.nacionalidade),
            "cpf": descriptografar_texto(pessoa.cpf),
            "cep": descriptografar_texto(pessoa.cep),
            "logradouro": descriptografar_texto(pessoa.logradouro),
            "numero": descriptografar_texto(pessoa.numero),
            "complemento": descriptografar_texto(pessoa.complemento),
            "bairro": descriptografar_texto(pessoa.bairro),
            "cidade": descriptografar_texto(pessoa.cidade),
            "estado": descriptografar_texto(pessoa.estado),
            "telefone": descriptografar_texto(pessoa.telefone),
            "email": descriptografar_texto(pessoa.email),
            "created_at": pessoa.created_at,
            "updated_at": pessoa.updated_at,
        }
    except ErroCriptografia:
        raise


def criar_pessoa(db: Session, payload: PessoaCreate) -> dict:
    dados = _criptografar_payload(payload.model_dump())
    pessoa = Pessoa(**dados)
    db.add(pessoa)
    try:
        db.commit()
        db.refresh(pessoa)
    except Exception:
        db.rollback()
        raise
    return _descriptografar_pessoa(pessoa)


def listar_pessoas(db: Session, nome: str | None = None) -> list[dict]:
    """
    Lista pessoas. Busca SQL apenas por nome_completo (único campo legível).
    Demais filtros por ciphertext não são possíveis de forma eficiente.
    """
    consulta = select(Pessoa).order_by(Pessoa.id.desc())
    if nome and nome.strip():
        consulta = consulta.where(Pessoa.nome_completo.ilike(f"%{nome.strip()}%"))

    pessoas = db.scalars(consulta).all()
    resultado = []
    for pessoa in pessoas:
        descriptografada = _descriptografar_pessoa(pessoa)
        resultado.append(
            {
                "id": descriptografada["id"],
                "nome_completo": descriptografada["nome_completo"],
                "cpf": descriptografada["cpf"],
                "email": descriptografada["email"],
                "telefone": descriptografada["telefone"],
                "cidade": descriptografada["cidade"],
                "estado": descriptografada["estado"],
            }
        )
    return resultado


def obter_pessoa(db: Session, pessoa_id: int) -> dict | None:
    pessoa = db.get(Pessoa, pessoa_id)
    if not pessoa:
        return None
    return _descriptografar_pessoa(pessoa)


def obter_pessoa_criptografada(db: Session, pessoa_id: int) -> dict | None:
    """Retorna exatamente o que está no banco — sem descriptografar."""
    pessoa = db.get(Pessoa, pessoa_id)
    if not pessoa:
        return None
    return {
        "id": pessoa.id,
        "nome_completo": pessoa.nome_completo,
        "apelido": pessoa.apelido,
        "data_nascimento": pessoa.data_nascimento,
        "genero": pessoa.genero,
        "nacionalidade": pessoa.nacionalidade,
        "cpf": pessoa.cpf,
        "cep": pessoa.cep,
        "logradouro": pessoa.logradouro,
        "numero": pessoa.numero,
        "complemento": pessoa.complemento,
        "bairro": pessoa.bairro,
        "cidade": pessoa.cidade,
        "estado": pessoa.estado,
        "telefone": pessoa.telefone,
        "email": pessoa.email,
        "created_at": pessoa.created_at,
        "updated_at": pessoa.updated_at,
    }


def atualizar_pessoa(db: Session, pessoa_id: int, payload: PessoaUpdate) -> dict | None:
    pessoa = db.get(Pessoa, pessoa_id)
    if not pessoa:
        return None

    dados = _criptografar_payload(payload.model_dump())
    for campo, valor in dados.items():
        setattr(pessoa, campo, valor)
    pessoa.updated_at = datetime.now(timezone.utc)

    try:
        db.commit()
        db.refresh(pessoa)
    except Exception:
        db.rollback()
        raise
    return _descriptografar_pessoa(pessoa)


def excluir_pessoa(db: Session, pessoa_id: int) -> bool:
    pessoa = db.get(Pessoa, pessoa_id)
    if not pessoa:
        return False
    try:
        db.delete(pessoa)
        db.commit()
    except Exception:
        db.rollback()
        raise
    return True
