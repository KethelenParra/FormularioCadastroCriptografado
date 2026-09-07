"""Router CRUD de pessoas."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.crypto import ErroCriptografia
from app.database.database import obter_sessao
from app.schemas.pessoa import (
    PessoaCreate,
    PessoaEncrypted,
    PessoaListItem,
    PessoaRead,
    PessoaUpdate,
)
from app.services import pessoa_service

router = APIRouter(prefix="/api/pessoas", tags=["Pessoas"])


@router.post(
    "",
    response_model=PessoaRead,
    status_code=status.HTTP_201_CREATED,
    summary="Cadastrar pessoa",
    description="Valida os dados, criptografa campos protegidos com AES-256-GCM e persiste no PostgreSQL.",
)
def criar(payload: PessoaCreate, db: Session = Depends(obter_sessao)):
    try:
        return pessoa_service.criar_pessoa(db, payload)
    except ErroCriptografia as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao gravar no PostgreSQL: {exc.__class__.__name__}",
        ) from exc


@router.get(
    "",
    response_model=list[PessoaListItem],
    summary="Listar pessoas",
    description="Lista pessoas com dados descriptografados necessários à interface. Busca opcional por nome_completo.",
)
def listar(
    nome: str | None = Query(None, description="Filtro por nome completo (único campo legível no banco)"),
    db: Session = Depends(obter_sessao),
):
    try:
        return pessoa_service.listar_pessoas(db, nome=nome)
    except ErroCriptografia as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc


@router.get(
    "/{pessoa_id}",
    response_model=PessoaRead,
    summary="Detalhes descriptografados",
    description="Busca pessoa pelo ID e retorna todos os campos descriptografados.",
)
def obter(pessoa_id: int, db: Session = Depends(obter_sessao)):
    try:
        pessoa = pessoa_service.obter_pessoa(db, pessoa_id)
    except ErroCriptografia as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc
    if not pessoa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pessoa não encontrada.",
        )
    return pessoa


@router.get(
    "/{pessoa_id}/criptografado",
    response_model=PessoaEncrypted,
    summary="Dados criptografados (demonstração)",
    description="Retorna exatamente o conteúdo armazenado no PostgreSQL, sem descriptografar.",
)
def obter_criptografado(pessoa_id: int, db: Session = Depends(obter_sessao)):
    pessoa = pessoa_service.obter_pessoa_criptografada(db, pessoa_id)
    if not pessoa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pessoa não encontrada.",
        )
    return pessoa


@router.put(
    "/{pessoa_id}",
    response_model=PessoaRead,
    summary="Atualizar pessoa",
    description="Recebe dados em claro, valida, criptografa novamente e atualiza o registro.",
)
def atualizar(pessoa_id: int, payload: PessoaUpdate, db: Session = Depends(obter_sessao)):
    try:
        pessoa = pessoa_service.atualizar_pessoa(db, pessoa_id, payload)
    except ErroCriptografia as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar no PostgreSQL: {exc.__class__.__name__}",
        ) from exc
    if not pessoa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pessoa não encontrada.",
        )
    return pessoa


@router.delete(
    "/{pessoa_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Excluir pessoa",
    description="Remove a pessoa pelo ID.",
)
def excluir(pessoa_id: int, db: Session = Depends(obter_sessao)):
    try:
        ok = pessoa_service.excluir_pessoa(db, pessoa_id)
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao excluir no PostgreSQL: {exc.__class__.__name__}",
        ) from exc
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pessoa não encontrada.",
        )
    return None
