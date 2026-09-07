"""Router de consulta de CEP (proxy ViaCEP)."""

from fastapi import APIRouter, HTTPException

from app.schemas.pessoa import CepResponse
from app.services.cep_service import ErroCep, buscar_cep

router = APIRouter(prefix="/api/cep", tags=["CEP"])


@router.get(
    "/{cep}",
    response_model=CepResponse,
    summary="Consultar CEP",
    description="Consulta o ViaCEP pelo backend e retorna endereço (logradouro, bairro, cidade, UF).",
)
async def consultar_cep(cep: str):
    try:
        return await buscar_cep(cep)
    except ErroCep as exc:
        raise HTTPException(status_code=exc.codigo_status, detail=exc.mensagem) from exc
