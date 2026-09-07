import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

export function obterMensagemErro(erro) {
  if (erro.response?.data?.detail) {
    const detalhe = erro.response.data.detail
    if (typeof detalhe === 'string') return detalhe
    if (Array.isArray(detalhe)) {
      return detalhe
        .map((item) => {
          const local = item.loc ? item.loc.slice(1).join('.') : ''
          return local ? `${local}: ${item.msg}` : item.msg
        })
        .join('; ')
    }
  }
  if (erro.message === 'Network Error') {
    return 'Não foi possível conectar ao backend. Verifique se a API está em execução.'
  }
  return 'Ocorreu um erro inesperado. Tente novamente.'
}

export async function listarPessoas(nome) {
  const params = nome ? { nome } : {}
  const { data } = await api.get('/api/pessoas', { params })
  return data
}

export async function obterPessoa(id) {
  const { data } = await api.get(`/api/pessoas/${id}`)
  return data
}

export async function obterPessoaCriptografada(id) {
  const { data } = await api.get(`/api/pessoas/${id}/criptografado`)
  return data
}

export async function criarPessoa(payload) {
  const { data } = await api.post('/api/pessoas', payload)
  return data
}

export async function atualizarPessoa(id, payload) {
  const { data } = await api.put(`/api/pessoas/${id}`, payload)
  return data
}

export async function excluirPessoa(id) {
  await api.delete(`/api/pessoas/${id}`)
}

export async function buscarCep(cep) {
  const { data } = await api.get(`/api/cep/${cep}`)
  return data
}

export async function gerarBackup() {
  const { data } = await api.post('/api/backup')
  return data
}

export default api
