import { useState } from 'react'
import { gerarBackup, obterMensagemErro } from '../services/api'

export default function Backup() {
  const [ocupado, setOcupado] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState('')

  async function aoGerarBackup() {
    setOcupado(true)
    setErro('')
    setResultado(null)
    try {
      const dados = await gerarBackup()
      setResultado(dados)
    } catch (err) {
      setErro(obterMensagemErro(err))
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Backup do banco de dados</h1>
        <p>
          Gera um dump SQL com <code>pg_dump</code> (--format=p). Os dados sensíveis permanecem
          criptografados no arquivo.
        </p>
      </div>

      {erro && <div className="alert alert-error">{erro}</div>}
      {resultado && (
        <div className="alert alert-success">
          <strong>Backup gerado com sucesso</strong>
          <br />
          Nome do arquivo: <code>{resultado.arquivo}</code>
          <br />
          Caminho: <code>{resultado.caminho}</code>
        </div>
      )}

      <div className="card">
        <div className="section-title">
          <h2>Gerar dump</h2>
          <p>Arquivos salvos na pasta dump/ na raiz do projeto</p>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          O comando utiliza as configurações do <code>.env</code> (host, porta, banco e usuário). A
          senha é passada apenas via variável de ambiente <code>PGPASSWORD</code> no subprocesso —
          nunca na linha de comando nem no código-fonte.
        </p>
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={aoGerarBackup}
            disabled={ocupado}
          >
            {ocupado ? (
              <>
                <span className="spinner" /> Gerando dump…
              </>
            ) : (
              'Gerar Dump'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
