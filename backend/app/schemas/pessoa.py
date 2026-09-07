"""Schemas Pydantic para Pessoa — validação de entrada/saída."""

from __future__ import annotations

import re
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


def apenas_digitos(valor: str) -> str:
    return re.sub(r"\D", "", valor or "")


def validar_cpf_digitos(cpf: str) -> bool:
    """Validação matemática do CPF (dígitos verificadores)."""
    if len(cpf) != 11 or cpf == cpf[0] * 11:
        return False

    def digito(nums: str, pesos: range) -> int:
        soma = sum(int(n) * p for n, p in zip(nums, pesos))
        resto = soma % 11
        return 0 if resto < 2 else 11 - resto

    d1 = digito(cpf[:9], range(10, 1, -1))
    d2 = digito(cpf[:10], range(11, 1, -1))
    return cpf[-2:] == f"{d1}{d2}"


class PessoaBase(BaseModel):
    """Campos comuns de criação/atualização (dados em claro)."""

    nome_completo: str = Field(..., min_length=2, max_length=255)
    apelido: Optional[str] = Field(None, max_length=100)
    data_nascimento: date
    genero: str = Field(..., min_length=1, max_length=50)
    nacionalidade: str = Field(..., min_length=1, max_length=100)
    cpf: str = Field(..., description="CPF com 11 dígitos")
    cep: str = Field(..., description="CEP com 8 dígitos")
    logradouro: str = Field(..., min_length=1, max_length=255)
    numero: str = Field(..., min_length=1, max_length=20)
    complemento: Optional[str] = Field(None, max_length=100)
    bairro: str = Field(..., min_length=1, max_length=150)
    cidade: str = Field(..., min_length=1, max_length=150)
    estado: str = Field(..., min_length=2, max_length=2, description="UF com 2 letras")
    telefone: str = Field(..., min_length=10, max_length=20)
    email: EmailStr

    @field_validator("nome_completo", "apelido", "genero", "nacionalidade",
                     "logradouro", "numero", "complemento", "bairro", "cidade",
                     mode="before")
    @classmethod
    def strip_strings(cls, v):
        if v is None:
            return v
        if isinstance(v, str):
            s = v.strip()
            return s if s != "" else None
        return v

    @field_validator("cpf")
    @classmethod
    def validar_cpf(cls, v: str) -> str:
        digitos = apenas_digitos(v)
        if len(digitos) != 11:
            raise ValueError("CPF deve conter 11 dígitos")
        if not validar_cpf_digitos(digitos):
            raise ValueError("CPF inválido")
        return digitos

    @field_validator("cep")
    @classmethod
    def validar_cep(cls, v: str) -> str:
        digitos = apenas_digitos(v)
        if len(digitos) != 8:
            raise ValueError("CEP deve conter 8 dígitos")
        return digitos

    @field_validator("estado")
    @classmethod
    def validar_uf(cls, v: str) -> str:
        uf = (v or "").strip().upper()
        if len(uf) != 2 or not uf.isalpha():
            raise ValueError("UF deve ter exatamente 2 letras")
        return uf

    @field_validator("telefone")
    @classmethod
    def validar_telefone(cls, v: str) -> str:
        digitos = apenas_digitos(v)
        if len(digitos) < 10 or len(digitos) > 11:
            raise ValueError("Telefone deve ter 10 ou 11 dígitos")
        return digitos

    @field_validator("data_nascimento")
    @classmethod
    def validar_nascimento(cls, v: date) -> date:
        if v > date.today():
            raise ValueError("Data de nascimento não pode ser futura")
        if v.year < 1900:
            raise ValueError("Data de nascimento inválida")
        return v


class PessoaCreate(PessoaBase):
    """Payload para criação."""


class PessoaUpdate(PessoaBase):
    """Payload para atualização completa."""


class PessoaRead(BaseModel):
    """Resposta com dados descriptografados."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    nome_completo: str
    apelido: Optional[str] = None
    data_nascimento: Optional[str] = None
    genero: Optional[str] = None
    nacionalidade: Optional[str] = None
    cpf: Optional[str] = None
    cep: Optional[str] = None
    logradouro: Optional[str] = None
    numero: Optional[str] = None
    complemento: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class PessoaListItem(BaseModel):
    """Item resumido para listagem."""

    id: int
    nome_completo: str
    cpf: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None


class PessoaEncrypted(BaseModel):
    """
    Dados exatamente como estão no PostgreSQL (sem descriptografar).
    Uso acadêmico: demonstrar que os campos estão cifrados.
    """

    id: int
    nome_completo: str
    apelido: Optional[str] = None
    data_nascimento: Optional[str] = None
    genero: Optional[str] = None
    nacionalidade: Optional[str] = None
    cpf: Optional[str] = None
    cep: Optional[str] = None
    logradouro: Optional[str] = None
    numero: Optional[str] = None
    complemento: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class MessageResponse(BaseModel):
    detail: str


class BackupResponse(BaseModel):
    detail: str
    arquivo: str
    caminho: str


class CepResponse(BaseModel):
    cep: str
    logradouro: str = ""
    complemento: str = ""
    bairro: str = ""
    localidade: str = ""
    uf: str = ""
    erro: bool = False
