import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ConfirmModal from '../components/ConfirmModal'
import { excluirPessoa, obterMensagemErro, listarPessoas } from '../services/api'
import { formatarCpfExibicao } from '../utils/masks'

export default function Pessoas() {
  const [pessoas, setPessoas] = useState([])
  const [nome, setNome] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const carregar = useCallback(async (filtro) => {
    setLoading(true)
    setError('')
    try {
      const data = await listarPessoas(filtro)
      setPessoas(data)
    } catch (err) {
      setError(obterMensagemErro(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    carregar('')
  }, [carregar])

  function handleSearch(e) {
    e.preventDefault()
    carregar(nome.trim())
  }

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await excluirPessoa(toDelete.id)
      setToDelete(null)
      await carregar(nome.trim())
    } catch (err) {
      setError(obterMensagemErro(err))
      setToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Pessoas cadastradas</h1>
        <p>
          A busca no banco é feita apenas por <strong>nome completo</strong> (único campo legível).
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <form className="toolbar" onSubmit={handleSearch}>
          <div className="field search" style={{ margin: 0 }}>
            <input
              type="search"
              placeholder="Buscar por nome completo…"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              aria-label="Buscar por nome"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Buscar
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              setNome('')
              carregar('')
            }}
          >
            Limpar
          </button>
          <Link to="/cadastro" className="btn btn-success">
            Novo cadastro
          </Link>
        </form>

        {loading ? (
          <div className="loading">
            <span className="spinner" /> Carregando…
          </div>
        ) : pessoas.length === 0 ? (
          <div className="empty-state">Nenhuma pessoa encontrada.</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome completo</th>
                  <th>CPF</th>
                  <th>E-mail</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {pessoas.map((p) => (
                  <tr key={p.id}>
                    <td>{p.nome_completo}</td>
                    <td>{formatarCpfExibicao(p.cpf)}</td>
                    <td>{p.email || '—'}</td>
                    <td>
                      <div className="actions">
                        <Link to={`/pessoas/${p.id}`} className="btn btn-sm btn-ghost">
                          Visualizar
                        </Link>
                        <Link to={`/pessoas/${p.id}/editar`} className="btn btn-sm btn-outline">
                          Editar
                        </Link>
                        <Link
                          to={`/pessoas/${p.id}/criptografado`}
                          className="btn btn-sm btn-outline"
                        >
                          Ver criptografado
                        </Link>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => setToDelete(p)}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toDelete && (
        <ConfirmModal
          title="Confirmar exclusão"
          message="Tem certeza que deseja excluir esta pessoa?"
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
          busy={deleting}
        />
      )}
    </div>
  )
}
