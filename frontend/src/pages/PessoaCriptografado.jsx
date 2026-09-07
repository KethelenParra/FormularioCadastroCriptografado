import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { obterMensagemErro, obterPessoaCriptografada } from '../services/api'

const CAMPOS = [
  ['nome_completo', 'Nome completo'],
  ['apelido', 'Apelido'],
  ['data_nascimento', 'Data de nascimento'],
  ['genero', 'Gênero'],
  ['nacionalidade', 'Nacionalidade'],
  ['cpf', 'CPF'],
  ['cep', 'CEP'],
  ['logradouro', 'Logradouro'],
  ['numero', 'Número'],
  ['complemento', 'Complemento'],
  ['bairro', 'Bairro'],
  ['cidade', 'Cidade'],
  ['estado', 'Estado'],
  ['telefone', 'Telefone'],
  ['email', 'E-mail'],
]

export default function PessoaCriptografado() {
  const { id } = useParams()
  const [pessoa, setPessoa] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ativo = true
    ;(async () => {
      try {
        const data = await obterPessoaCriptografada(id)
        if (ativo) setPessoa(data)
      } catch (err) {
        if (ativo) setError(obterMensagemErro(err))
      } finally {
        if (ativo) setLoading(false)
      }
    })()
    return () => {
      ativo = false
    }
  }, [id])

  if (loading) {
    return (
      <div className="loading">
        <span className="spinner" /> Carregando dados criptografados…
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <div className="alert alert-error">{error}</div>
        <Link to="/pessoas" className="btn btn-outline">
          Voltar
        </Link>
      </div>
    )
  }

  if (!pessoa) return null

  return (
    <div>
      <div className="page-header">
        <h1>Dados armazenados no PostgreSQL</h1>
        <p>Conteúdo bruto das colunas (sem descriptografar).</p>
      </div>

      <div className="alert alert-warning">
        Os valores exibidos nesta visualização correspondem ao conteúdo criptografado armazenado no
        banco de dados. Somente o <strong>nome completo</strong> permanece legível.
      </div>

      <div className="form-actions" style={{ marginTop: 0, border: 'none', paddingTop: 0 }}>
        <Link to={`/pessoas/${id}`} className="btn btn-primary">
          Voltar à visualização normal
        </Link>
        <Link to="/pessoas" className="btn btn-outline">
          Listagem
        </Link>
      </div>

      <div className="card">
        <div className="section-title">
          <h2>Conteúdo das colunas</h2>
        </div>
        <div className="detail-grid">
          {CAMPOS.map(([key, label]) => (
            <div className="detail-item" key={key} style={{ gridColumn: key === 'nome_completo' ? undefined : '1 / -1' }}>
              <span className="label">{label}</span>
              {key === 'nome_completo' ? (
                <span className="value">{pessoa[key]}</span>
              ) : (
                <div className="crypto-value">{pessoa[key] || '—'}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
