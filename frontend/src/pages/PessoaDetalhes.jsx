import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { obterMensagemErro, obterPessoa } from '../services/api'
import {
  formatarCpfExibicao,
  formatarDataBrExibicao,
  mascararCep,
  mascararTelefone,
} from '../utils/masks'

function Item({ label, value }) {
  return (
    <div className="detail-item">
      <span className="label">{label}</span>
      <span className="value">{value || '—'}</span>
    </div>
  )
}

export default function PessoaDetalhes() {
  const { id } = useParams()
  const [pessoa, setPessoa] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ativo = true
    ;(async () => {
      setLoading(true)
      try {
        const data = await obterPessoa(id)
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
        <span className="spinner" /> Carregando detalhes…
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

  const endereco = [
    pessoa.logradouro,
    pessoa.numero,
    pessoa.complemento,
    pessoa.bairro,
    pessoa.cidade,
    pessoa.estado,
    pessoa.cep ? `CEP ${mascararCep(pessoa.cep)}` : null,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <div>
      <div className="page-header">
        <h1>Detalhes da pessoa</h1>
        <p>Valores descriptografados pelo backend (AES-256-GCM).</p>
      </div>

      <div className="form-actions" style={{ marginTop: 0, border: 'none', paddingTop: 0 }}>
        <Link to="/pessoas" className="btn btn-outline">
          Voltar à listagem
        </Link>
        <Link to={`/pessoas/${id}/editar`} className="btn btn-primary">
          Editar
        </Link>
        <Link to={`/pessoas/${id}/criptografado`} className="btn btn-ghost">
          Ver criptografado
        </Link>
      </div>

      <div className="card">
        <div className="section-title">
          <h2>Dados pessoais</h2>
        </div>
        <div className="detail-grid">
          <Item label="Nome completo" value={pessoa.nome_completo} />
          <Item label="Apelido" value={pessoa.apelido} />
          <Item label="Data de nascimento" value={formatarDataBrExibicao(pessoa.data_nascimento)} />
          <Item label="Gênero" value={pessoa.genero} />
          <Item label="Nacionalidade" value={pessoa.nacionalidade} />
        </div>
      </div>

      <div className="card">
        <div className="section-title">
          <h2>Documentos</h2>
        </div>
        <div className="detail-grid">
          <Item label="CPF" value={formatarCpfExibicao(pessoa.cpf)} />
        </div>
      </div>

      <div className="card">
        <div className="section-title">
          <h2>Endereço</h2>
        </div>
        <div className="detail-grid">
          <div className="detail-item full" style={{ gridColumn: '1 / -1' }}>
            <span className="label">Endereço completo</span>
            <span className="value">{endereco || '—'}</span>
          </div>
          <Item label="CEP" value={mascararCep(pessoa.cep || '')} />
          <Item label="Logradouro" value={pessoa.logradouro} />
          <Item label="Número" value={pessoa.numero} />
          <Item label="Complemento" value={pessoa.complemento} />
          <Item label="Bairro" value={pessoa.bairro} />
          <Item label="Cidade" value={pessoa.cidade} />
          <Item label="UF" value={pessoa.estado} />
        </div>
      </div>

      <div className="card">
        <div className="section-title">
          <h2>Contato</h2>
        </div>
        <div className="detail-grid">
          <Item label="Telefone" value={mascararTelefone(pessoa.telefone || '')} />
          <Item label="E-mail" value={pessoa.email} />
        </div>
      </div>
    </div>
  )
}
