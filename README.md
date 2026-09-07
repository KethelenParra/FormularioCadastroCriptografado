# CRUD – Formulário de Cadastro de Dados Pessoais

Atividade acadêmica (Atividade 05): CRUD completo com persistência no **PostgreSQL**, criptografia simétrica **AES-256-GCM** e frontend em **React**.

Somente o **nome completo** permanece legível no banco. Todos os demais dados pessoais são criptografados antes da gravação.

---

## 1. Descrição

Sistema de cadastro de dados pessoais com:

- Formulário de cadastro (dados pessoais, documentos, endereço e contato)
- CRUD completo (Create, Read, Update, Delete)
- Consulta de CEP via backend (ViaCEP + HTTPX)
- Visualização dos dados criptografados (demonstração acadêmica)
- Geração de dump do banco com `pg_dump`

---

## 2. Tecnologias

| Camada | Tecnologia |
|--------|------------|
| Frontend | React, Vite, JavaScript, React Router DOM, Axios, CSS próprio |
| Backend | Python 3.13, FastAPI, SQLAlchemy 2.x, Pydantic, pydantic-settings |
| Banco | PostgreSQL 18.6 |
| Driver | Psycopg (v3) |
| Criptografia | cryptography (AESGCM / AES-256-GCM) |
| CEP | ViaCEP (consultado apenas pelo backend via HTTPX) |
| Dump | `pg_dump` |

---

## 3. Estrutura

```
FormularioPessoal/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/          # config + AES
│   │   ├── database/      # SQLAlchemy
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── routers/       # Pessoas, CEP, Backup
│   │   └── services/
│   ├── .env               # segredos locais (não versionar)
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── styles/
│   └── package.json
├── dump/                  # arquivos .sql gerados pelo backup
└── README.md
```

---

## 4. Pré-requisitos

- PostgreSQL **18.6** (banco `crud_dados_pessoais` já criado)
- Python **3.13+**
- Node.js e npm
- `pg_dump` disponível no PATH (instalação do PostgreSQL no Windows)

---

## 5. Configuração do banco

O banco já deve existir:

```text
Nome: crud_dados_pessoais
Host: localhost
Porta: 5432
Usuário: postgres
```

**Não** é necessário recriar ou excluir o banco. Na inicialização, o SQLAlchemy cria apenas a tabela `pessoas` (`create_all`).

---

## 6. Ambiente virtual (Windows PowerShell)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

---

## 7. Instalação do backend

```powershell
pip install -r requirements.txt
```

---

## 8. Configuração do `.env`

Copie o exemplo e edite com seus valores locais:

```powershell
Copy-Item .env.example .env
```

Variáveis:

| Variável | Descrição |
|----------|-----------|
| `DATABASE_HOST` | Host do PostgreSQL (ex.: `localhost`) |
| `DATABASE_PORT` | Porta (ex.: `5432`) |
| `DATABASE_NAME` | Nome do banco (`crud_dados_pessoais`) |
| `DATABASE_USER` | Usuário (`postgres`) |
| `DATABASE_PASSWORD` | Senha do PostgreSQL (**nunca** no código) |
| `AES_KEY` | Chave AES-256 em Base64 urlsafe (**nunca** no código) |
| `CORS_ORIGINS` | Origens permitidas do frontend |

---

## 9. Gerar `AES_KEY`

Gere uma chave de 256 bits (32 bytes) em Base64 urlsafe:

```powershell
python -c "import os,base64; print(base64.urlsafe_b64encode(os.urandom(32)).decode())"
```

Cole o resultado em `AES_KEY` no arquivo `.env`.

**Importante:** use sempre a mesma chave para descriptografar registros já gravados. Não gere uma chave nova a cada inicialização da aplicação.

---

## 10. Rodar o backend

A partir da pasta `backend` (com o venv ativo):

```powershell
uvicorn app.main:app --reload
```

API: http://127.0.0.1:8000

---

## 11. Swagger

Documentação interativa:

http://127.0.0.1:8000/docs

Tags: **Pessoas**, **CEP**, **Backup**.

---

## 12. Instalação do frontend

```powershell
cd frontend
npm install
npm run dev
```

---

## 13. URL do frontend

http://localhost:5173

Menu: Cadastro · Pessoas cadastradas · Backup

---

## 14. Criptografia (AES-256-GCM)

Fluxo de gravação:

```text
texto UTF-8 → AES-256-GCM (nonce aleatório de 12 bytes) → Base64(nonce + ciphertext+tag) → PostgreSQL
```

Fluxo de leitura:

```text
PostgreSQL → Base64 decode → separar nonce → AES-256-GCM decrypt → texto original
```

- Biblioteca: `cryptography.hazmat.primitives.ciphers.aead.AESGCM`
- Nonce: `os.urandom(12)` — **nunca** reutilizado com a mesma chave
- Em claro no banco: `id`, `nome_completo`, `created_at`, `updated_at`
- Demais campos pessoais: TEXT criptografado

Endpoints úteis:

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/pessoas` | Criar (criptografa e grava) |
| GET | `/api/pessoas` | Listar (descriptografado para UI) |
| GET | `/api/pessoas/{id}` | Detalhes descriptografados |
| GET | `/api/pessoas/{id}/criptografado` | Conteúdo bruto do banco |
| PUT | `/api/pessoas/{id}` | Atualizar (recriptografa) |
| DELETE | `/api/pessoas/{id}` | Excluir |
| GET | `/api/cep/{cep}` | Proxy ViaCEP |
| POST | `/api/backup` | Gerar dump com `pg_dump` |

**Limitação da busca:** como CPF/e-mail estão cifrados, a busca SQL é feita apenas por `nome_completo`.

---

## 15. Dump / Backup

Pelo frontend: página **Backup** → botão **Gerar Dump**.

Pela API:

```http
POST /api/backup
```

O arquivo é salvo em `dump/` com nome no formato:

```text
crud_dados_pessoais_YYYY-MM-DD_HHMMSS.sql
```

O dump preserva os ciphertexts exatamente como estão no PostgreSQL (não descriptografa).

---

## 16. Restauração

Com o PostgreSQL em execução (ajuste usuário/host conforme necessário):

```powershell
psql -U postgres -d crud_dados_pessoais -f dump\crud_dados_pessoais_YYYY-MM-DD_HHMMSS.sql
```

Ou, se preferir restaurar em um banco vazio já criado:

```powershell
$env:PGPASSWORD = "SUA_SENHA"
psql -U postgres -h localhost -d crud_dados_pessoais -f "dump\NOME_DO_ARQUIVO.sql"
```

A mesma `AES_KEY` usada na gravação original é necessária para descriptografar os dados após a restauração.

---

## Segurança (checklist)

- Senha do PostgreSQL e `AES_KEY` apenas no `.env`
- `.env` listado no `.gitignore`
- `.env.example` só com placeholders
- Senha do dump via `PGPASSWORD` no ambiente do subprocess
- Nonce aleatório por operação AES-GCM
- Frontend não chama ViaCEP diretamente
- Stack traces não são expostos ao cliente

---

## Testes manuais sugeridos

1. Cadastrar pessoa  
2. Conferir no PostgreSQL que CPF/e-mail estão ilegíveis  
3. Abrir detalhes (valores descriptografados)  
4. Usar **Ver criptografado**  
5. Editar pessoa  
6. Consultar novamente  
7. Excluir pessoa  
8. CEP válido  
9. CEP inválido  
10. Gerar dump  
11. Abrir o `.sql` e verificar que os dados sensíveis continuam cifrados  

Consulta rápida no PostgreSQL:

```sql
SELECT id, nome_completo, cpf, email FROM pessoas;
```

Esperado: `nome_completo` legível; `cpf` e `email` em Base64 (ciphertext).
