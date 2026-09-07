"""Criptografia simétrica AES-256-GCM para dados pessoais."""

from __future__ import annotations

import base64
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.core.config import obter_configuracoes

# Tamanho do nonce recomendado para AES-GCM (96 bits).
TAMANHO_NONCE = 12


class ErroCriptografia(Exception):
    """Erro ao criptografar ou descriptografar dados."""


def _carregar_chave_aes() -> bytes:
    """Decodifica a chave AES (Base64) da variável de ambiente AES_KEY."""
    bruto = obter_configuracoes().aes_key
    if not bruto or bruto.startswith("COLOCAR_"):
        raise ErroCriptografia(
            "AES_KEY não configurada. Defina uma chave válida no arquivo .env."
        )
    try:
        chave = base64.urlsafe_b64decode(bruto.encode("utf-8"))
    except Exception as exc:
        raise ErroCriptografia("AES_KEY inválida. Use Base64 urlsafe de 32 bytes.") from exc

    if len(chave) != 32:
        raise ErroCriptografia(
            f"AES_KEY deve ter 32 bytes (AES-256). Tamanho atual: {len(chave)}."
        )
    return chave


def criptografar_texto(valor: str | None) -> str | None:
    """
    Criptografa texto com AES-256-GCM.

    Fluxo: UTF-8 → AES-GCM(nonce aleatório) → Base64(nonce + ciphertext+tag)

    Retorna None para None ou string vazia (não persiste ciphertext vazio).
    """
    if valor is None:
        return None
    texto = valor.strip() if isinstance(valor, str) else str(valor)
    if texto == "":
        return None

    chave = _carregar_chave_aes()
    nonce = os.urandom(TAMANHO_NONCE)
    aesgcm = AESGCM(chave)
    ciphertext = aesgcm.encrypt(nonce, texto.encode("utf-8"), None)
    # ciphertext já inclui a tag de autenticação do GCM
    carga = nonce + ciphertext
    return base64.b64encode(carga).decode("ascii")


def descriptografar_texto(valor: str | None) -> str | None:
    """
    Descriptografa valor Base64 produzido por criptografar_texto.

    Fluxo: Base64 → separar nonce → AES-GCM decrypt → UTF-8
    """
    if valor is None:
        return None
    if isinstance(valor, str) and valor.strip() == "":
        return None

    chave = _carregar_chave_aes()
    try:
        carga = base64.b64decode(valor.encode("ascii"))
    except Exception as exc:
        raise ErroCriptografia("Falha ao decodificar Base64 do valor criptografado.") from exc

    if len(carga) < TAMANHO_NONCE + 16:
        raise ErroCriptografia("Payload criptografado inválido ou incompleto.")

    nonce = carga[:TAMANHO_NONCE]
    ciphertext = carga[TAMANHO_NONCE:]
    aesgcm = AESGCM(chave)
    try:
        texto_claro = aesgcm.decrypt(nonce, ciphertext, None)
    except Exception as exc:
        raise ErroCriptografia(
            "Falha ao descriptografar. Verifique se a AES_KEY é a mesma usada na gravação."
        ) from exc

    return texto_claro.decode("utf-8")
