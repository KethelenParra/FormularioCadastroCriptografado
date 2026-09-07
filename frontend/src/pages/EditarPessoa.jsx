import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PessoaForm from '../components/PessoaForm'
import { atualizarPessoa, obterMensagemErro, obterPessoa } from '../services/api'
import { pessoaParaFormulario } from '../utils/masks'

export default function EditarPessoa() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [valoresIniciais, setValoresIniciais] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  useEffect(() => {
    let ativo = true
    ;(async () => {
      try {
        const dados = await obterPessoa(id)
        if (ativo) setValoresIniciais(pessoaParaFormulario(dados))
      } catch (err) {
        if (ativo) setErro(obterMensagemErro(err))
      } finally {
        if (ativo) setCarregando(false)
      }
    })()
    return () => {
      ativo = false
    }
  }, [id])

  async function aoSalvar(payload) {
    setOcupado(true)
    setSucesso('')
    try {
      await atualizarPessoa(id, payload)
      setSucesso('Pessoa atualizada com sucesso.')
      setTimeout(() => navigate(`/pessoas/${id}`), 800)
    } finally {
      setOcupado(false)
    }
  }

  if (carregando) {
    return (
      <div className="loading">
        <span className="spinner" /> Carregando formulário…
      </div>
    )
  }

  if (erro) {
    return (
      <div>
        <div className="alert alert-error">{erro}</div>
        <Link to="/pessoas" className="btn btn-outline">
          Voltar
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>Editar pessoa</h1>
        <p>
          Os campos protegidos serão criptografados novamente (novo nonce AES-GCM a cada gravação).
        </p>
      </div>

      {sucesso && <div className="alert alert-success">{sucesso}</div>}

      <div style={{ marginBottom: '1rem' }}>
        <Link to={`/pessoas/${id}`} className="btn btn-outline">
          Cancelar
        </Link>
      </div>

      {valoresIniciais && (
        <PessoaForm
          initialValues={valoresIniciais}
          onSubmit={aoSalvar}
          submitLabel="Salvar alterações"
          busy={ocupado}
        />
      )}
    </div>
  )
}
