"""Ponto de entrada da API FastAPI."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import obter_configuracoes
from app.database.database import Base, engine
from app.models.pessoa import Pessoa  # noqa: F401 — registra o model
from app.routers import backup, cep, pessoas


@asynccontextmanager
async def ciclo_de_vida(_app: FastAPI):
    # Cria apenas as tabelas necessárias (não recria/exclui o banco)
    Base.metadata.create_all(bind=engine)
    yield


configuracoes = obter_configuracoes()

app = FastAPI(
    title="CRUD Dados Pessoais",
    description=(
        "API acadêmica de cadastro de dados pessoais com persistência no PostgreSQL "
        "e criptografia AES-256-GCM. Somente o nome completo permanece legível no banco."
    ),
    version="1.0.0",
    lifespan=ciclo_de_vida,
    openapi_tags=[
        {"name": "Pessoas", "description": "CRUD de pessoas com criptografia AES-256-GCM"},
        {"name": "CEP", "description": "Consulta de endereço via ViaCEP (proxy no backend)"},
        {"name": "Backup", "description": "Geração de dump com pg_dump"},
        {"name": "Sistema", "description": "Saúde e informações da API"},
    ],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=configuracoes.lista_origens_cors,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pessoas.router)
app.include_router(cep.router)
app.include_router(backup.router)


@app.get("/", tags=["Sistema"])
def raiz():
    return {
        "mensagem": "API CRUD Dados Pessoais",
        "docs": "/docs",
        "status": "ok",
    }


@app.get("/api/health", tags=["Sistema"])
def verificar_saude():
    return {"status": "ok"}
