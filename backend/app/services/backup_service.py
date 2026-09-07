"""Serviço de backup com pg_dump."""

from __future__ import annotations

import os
import shutil
import subprocess
from datetime import datetime
from pathlib import Path

from app.core.config import obter_configuracoes


class ErroBackup(Exception):
    """Erro ao gerar dump do PostgreSQL."""

    def __init__(self, mensagem: str):
        self.mensagem = mensagem
        super().__init__(mensagem)


def _diretorio_dump() -> Path:
    """Pasta dump/ na raiz do projeto (irmão de backend/)."""
    raiz = Path(__file__).resolve().parents[3]
    pasta_dump = raiz / "dump"
    pasta_dump.mkdir(parents=True, exist_ok=True)
    return pasta_dump


def gerar_dump() -> dict:
    """
    Executa pg_dump com formato texto (--format=p).
    Senha via PGPASSWORD no ambiente do subprocess (não na linha de comando).
    Não usa entrada arbitrária do usuário no comando.
    """
    configuracoes = obter_configuracoes()

    if not configuracoes.database_password or configuracoes.database_password.startswith("COLOCAR_"):
        raise ErroBackup(
            "DATABASE_PASSWORD não configurada no .env. Defina a senha do PostgreSQL."
        )

    pg_dump = shutil.which("pg_dump")
    if not pg_dump:
        raise ErroBackup(
            "pg_dump não encontrado no PATH. Verifique a instalação do PostgreSQL."
        )

    carimbo = datetime.now().strftime("%Y-%m-%d_%H%M%S")
    nome_arquivo = f"crud_dados_pessoais_{carimbo}.sql"
    caminho = _diretorio_dump() / nome_arquivo

    comando = [
        pg_dump,
        "--format=p",
        "--encoding=UTF8",
        "--no-owner",
        "--no-acl",
        f"--host={configuracoes.database_host}",
        f"--port={configuracoes.database_port}",
        f"--username={configuracoes.database_user}",
        f"--dbname={configuracoes.database_name}",
        f"--file={str(caminho)}",
    ]

    ambiente = os.environ.copy()
    ambiente["PGPASSWORD"] = configuracoes.database_password

    try:
        resultado = subprocess.run(
            comando,
            env=ambiente,
            capture_output=True,
            text=True,
            timeout=120,
            check=False,
        )
    except subprocess.TimeoutExpired as exc:
        raise ErroBackup("Tempo esgotado ao executar pg_dump.") from exc
    except OSError as exc:
        raise ErroBackup(f"Falha ao executar pg_dump: {exc}") from exc

    if resultado.returncode != 0:
        stderr = (resultado.stderr or "").strip()
        trecho = stderr[:200] if stderr else "código de saída diferente de zero"
        raise ErroBackup(f"pg_dump falhou: {trecho}")

    if not caminho.exists() or caminho.stat().st_size == 0:
        raise ErroBackup("Arquivo de dump não foi gerado ou está vazio.")

    return {
        "detail": "Backup gerado com sucesso",
        "arquivo": nome_arquivo,
        "caminho": str(caminho),
    }
