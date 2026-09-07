import { useEffect, useRef, useState } from 'react'
import { buscarCep, obterMensagemErro } from '../services/api'
import {
  brParaIso,
  formularioParaPayload,
  formularioVazio,
  isoParaBr,
  mascararCep,
  mascararCpf,
  mascararDataBr,
  mascararTelefone,
  apenasDigitos,
  validarFormularioCliente,
} from '../utils/masks'

const GENEROS = ['Feminino', 'Masculino']

/**
 * Formulário reutilizável para cadastro e edição.
 * CEP: busca automática ao completar 8 dígitos.
 */
export default function PessoaForm({
  initialValues,
  onSubmit,
  submitLabel = 'Salvar',
  busy = false,
}) {
  const [formulario, setFormulario] = useState(initialValues || formularioVazio())
  const [erro, setErro] = useState('')
  const [mensagemCep, setMensagemCep] = useState('')
  const [carregandoCep, setCarregandoCep] = useState(false)
  const referenciaCalendario = useRef(null)
  const ultimoCepBuscado = useRef(apenasDigitos(initialValues?.cep || ''))
  const primeiraCargaCep = useRef(true)

  function atualizarCampo(campo, valor) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }))
  }

  function aoAlterarCampo(evento) {
    const { name, value } = evento.target
    if (name === 'cpf') atualizarCampo(name, mascararCpf(value))
    else if (name === 'cep') atualizarCampo(name, mascararCep(value))
    else if (name === 'telefone') atualizarCampo(name, mascararTelefone(value))
    else if (name === 'data_nascimento') atualizarCampo(name, mascararDataBr(value))
    else if (name === 'estado') atualizarCampo(name, value.toUpperCase().slice(0, 2))
    else atualizarCampo(name, value)
  }

  function aoSelecionarDataCalendario(evento) {
    const iso = evento.target.value
    if (iso) atualizarCampo('data_nascimento', isoParaBr(iso))
  }

  function abrirCalendario() {
    const elemento = referenciaCalendario.current
    if (!elemento) return
    if (typeof elemento.showPicker === 'function') {
      elemento.showPicker()
    } else {
      elemento.click()
    }
  }

  // Busca automática ao completar 8 dígitos (com debounce)
  useEffect(() => {
    const cep = apenasDigitos(formulario.cep)

    if (primeiraCargaCep.current) {
      primeiraCargaCep.current = false
      ultimoCepBuscado.current = cep.length === 8 ? cep : ''
      return
    }

    if (cep.length !== 8) {
      if (cep.length < 8) {
        ultimoCepBuscado.current = ''
        setMensagemCep('')
        setCarregandoCep(false)
      }
      return
    }

    if (cep === ultimoCepBuscado.current) return

    const temporizador = setTimeout(async () => {
      setCarregandoCep(true)
      setMensagemCep('Buscando endereço…')
      try {
        const dados = await buscarCep(cep)
        ultimoCepBuscado.current = cep
        setFormulario((anterior) => ({
          ...anterior,
          cep: mascararCep(dados.cep || cep),
          logradouro: dados.logradouro || anterior.logradouro,
          bairro: dados.bairro || anterior.bairro,
          cidade: dados.localidade || anterior.cidade,
          estado: dados.uf || anterior.estado,
        }))
        setMensagemCep('Endereço preenchido. Confira e complete número/complemento.')
      } catch (err) {
        ultimoCepBuscado.current = cep
        setMensagemCep(obterMensagemErro(err))
      } finally {
        setCarregandoCep(false)
      }
    }, 450)

    return () => clearTimeout(temporizador)
  }, [formulario.cep])

  async function aoEnviar(evento) {
    evento.preventDefault()
    setErro('')
    const errosCliente = validarFormularioCliente(formulario)
    if (errosCliente.length) {
      setErro(errosCliente.join('; '))
      return
    }
    try {
      await onSubmit(formularioParaPayload(formulario))
    } catch (err) {
      setErro(obterMensagemErro(err))
    }
  }

  return (
    <form onSubmit={aoEnviar} noValidate>
      {erro && <div className="alert alert-error">{erro}</div>}

      <div className="card">
        <div className="section-title">
          <h2>Dados pessoais</h2>
        </div>
        <div className="form-grid">
          <div className="field full">
            <label htmlFor="nome_completo">Nome completo *</label>
            <input
              id="nome_completo"
              name="nome_completo"
              value={formulario.nome_completo}
              onChange={aoAlterarCampo}
              required
              autoComplete="name"
            />
          </div>
          <div className="field">
            <label htmlFor="apelido">Apelido</label>
            <input
              id="apelido"
              name="apelido"
              value={formulario.apelido}
              onChange={aoAlterarCampo}
            />
          </div>
          <div className="field">
            <label htmlFor="data_nascimento">Data de nascimento *</label>
            <div className="date-row">
              <input
                id="data_nascimento"
                name="data_nascimento"
                type="text"
                inputMode="numeric"
                placeholder="DD/MM/AAAA"
                value={formulario.data_nascimento}
                onChange={aoAlterarCampo}
                maxLength={10}
                required
              />
              <input
                ref={referenciaCalendario}
                type="date"
                className="date-picker-hidden"
                value={brParaIso(formulario.data_nascimento) || ''}
                onChange={aoSelecionarDataCalendario}
                tabIndex={-1}
                aria-hidden="true"
              />
              <button
                type="button"
                className="btn btn-outline date-picker-btn"
                onClick={abrirCalendario}
                title="Abrir calendário"
                aria-label="Abrir calendário"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <path d="M3 10h18M8 3v4M16 3v4" />
                </svg>
              </button>
            </div>
          </div>
          <div className="field">
            <label htmlFor="genero">Gênero *</label>
            <select
              id="genero"
              name="genero"
              value={formulario.genero}
              onChange={aoAlterarCampo}
              required
            >
              <option value="">Selecione</option>
              {GENEROS.map((genero) => (
                <option key={genero} value={genero}>
                  {genero}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="nacionalidade">Nacionalidade *</label>
            <input
              id="nacionalidade"
              name="nacionalidade"
              value={formulario.nacionalidade}
              onChange={aoAlterarCampo}
              required
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-title">
          <h2>Documentos</h2>
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="cpf">CPF *</label>
            <input
              id="cpf"
              name="cpf"
              value={formulario.cpf}
              onChange={aoAlterarCampo}
              placeholder="000.000.000-00"
              inputMode="numeric"
              required
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-title">
          <h2>Endereço</h2>
          <p>Preenchimento automático via ViaCEP (backend)</p>
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="cep">CEP *</label>
            <input
              id="cep"
              name="cep"
              value={formulario.cep}
              onChange={aoAlterarCampo}
              placeholder="00000-000"
              inputMode="numeric"
              required
              disabled={busy}
            />
            {(carregandoCep || mensagemCep) && (
              <span className="hint" style={{ marginTop: '0.35rem' }}>
                {carregandoCep && !mensagemCep ? 'Buscando endereço…' : mensagemCep}
              </span>
            )}
          </div>
          <div className="field">
            <label htmlFor="estado">UF *</label>
            <input
              id="estado"
              name="estado"
              value={formulario.estado}
              onChange={aoAlterarCampo}
              maxLength={2}
              placeholder="SP"
              required
            />
          </div>
          <div className="field full">
            <label htmlFor="logradouro">Logradouro *</label>
            <input
              id="logradouro"
              name="logradouro"
              value={formulario.logradouro}
              onChange={aoAlterarCampo}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="numero">Número *</label>
            <input
              id="numero"
              name="numero"
              value={formulario.numero}
              onChange={aoAlterarCampo}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="complemento">Complemento</label>
            <input
              id="complemento"
              name="complemento"
              value={formulario.complemento}
              onChange={aoAlterarCampo}
            />
          </div>
          <div className="field">
            <label htmlFor="bairro">Bairro *</label>
            <input
              id="bairro"
              name="bairro"
              value={formulario.bairro}
              onChange={aoAlterarCampo}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="cidade">Cidade *</label>
            <input
              id="cidade"
              name="cidade"
              value={formulario.cidade}
              onChange={aoAlterarCampo}
              required
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-title">
          <h2>Contato</h2>
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="telefone">Telefone *</label>
            <input
              id="telefone"
              name="telefone"
              value={formulario.telefone}
              onChange={aoAlterarCampo}
              placeholder="(00) 00000-0000"
              inputMode="tel"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="email">E-mail *</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formulario.email}
              onChange={aoAlterarCampo}
              required
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? (
              <>
                <span className="spinner" /> Salvando…
              </>
            ) : (
              submitLabel
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
