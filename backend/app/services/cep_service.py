"""Serviço de consulta de CEP via ViaCEP."""

from __future__ import annotations

import re

import httpx

from app.schemas.pessoa import CepResponse


class ErroCep(Exception):
    """Erro de negócio na consulta de CEP."""

    def __init__(self, mensagem: str, codigo_status: int = 400):
        self.mensagem = mensagem
        self.codigo_status = codigo_status
        super().__init__(mensagem)


def normalizar_cep(cep: str) -> str:
    return re.sub(r"\D", "", cep or "")


async def buscar_cep(cep: str) -> CepResponse:
    """
    Consulta https://viacep.com.br/ws/{cep}/json/
    O frontend NÃO deve chamar o ViaCEP diretamente.
    """
    digitos = normalizar_cep(cep)
    if len(digitos) != 8:
        raise ErroCep("CEP deve conter 8 dígitos.", codigo_status=400)

    url = f"https://viacep.com.br/ws/{digitos}/json/"
    try:
        async with httpx.AsyncClient(timeout=10.0) as cliente:
            resposta = await cliente.get(url)
    except httpx.TimeoutException as exc:
        raise ErroCep(
            "Serviço ViaCEP indisponível (tempo esgotado). Tente novamente.",
            codigo_status=503,
        ) from exc
    except httpx.HTTPError as exc:
        raise ErroCep(
            "Não foi possível consultar o ViaCEP. Tente novamente mais tarde.",
            codigo_status=503,
        ) from exc

    if resposta.status_code != 200:
        raise ErroCep(
            "ViaCEP retornou erro. Verifique o CEP e tente novamente.",
            codigo_status=502,
        )

    dados = resposta.json()
    if dados.get("erro"):
        raise ErroCep(
            "CEP não encontrado. Verifique o número digitado.",
            codigo_status=404,
        )

    return CepResponse(
        cep=dados.get("cep", digitos),
        logradouro=dados.get("logradouro") or "",
        complemento=dados.get("complemento") or "",
        bairro=dados.get("bairro") or "",
        localidade=dados.get("localidade") or "",
        uf=dados.get("uf") or "",
        erro=False,
    )
