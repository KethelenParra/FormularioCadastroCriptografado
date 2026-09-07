import { useState } from 'react'
import { Link } from 'react-router-dom'
import PessoaForm from '../components/PessoaForm'
import { criarPessoa } from '../services/api'
import { formularioVazio } from '../utils/masks'

export default function Cadastro() {
  const [ocupado, setOcupado] = useState(false)
  const [sucesso, setSucesso] = useState('')
  const [chaveFormulario, setChaveFormulario] = useState(0)

  async function aoCadastrar(payload) {
    setOcupado(true)
    setSucesso('')
    try {
      await criarPessoa(payload)
      setSucesso('Pessoa cadastrada com sucesso.')
      setChaveFormulario((chave) => chave + 1)
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Cadastro de pessoa</h1>
        <p>
          Os dados pessoais (exceto o nome completo) serão criptografados com AES-256-GCM antes de
          serem gravados no PostgreSQL.
        </p>
      </div>

      {sucesso && (
        <div className="alert alert-success">
          {sucesso}{' '}
          <Link to="/pessoas" style={{ fontWeight: 600, textDecoration: 'underline' }}>
            Ver listagem
          </Link>
        </div>
      )}

      <PessoaForm
        key={chaveFormulario}
        initialValues={formularioVazio()}
        onSubmit={aoCadastrar}
        submitLabel="Cadastrar"
        busy={ocupado}
      />
    </div>
  )
}
