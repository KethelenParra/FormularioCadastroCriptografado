"""Router de backup / dump do PostgreSQL."""

from fastapi import APIRouter, HTTPException, status

from app.schemas.pessoa import BackupResponse
from app.services.backup_service import ErroBackup, gerar_dump

router = APIRouter(prefix="/api/backup", tags=["Backup"])


@router.post(
    "",
    response_model=BackupResponse,
    summary="Gerar dump do banco",
    description="Executa pg_dump (--format=p) e salva o arquivo SQL em dump/ com timestamp.",
)
def criar_backup():
    try:
        return gerar_dump()
    except ErroBackup as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=exc.mensagem,
        ) from exc
