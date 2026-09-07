/** Utilitários de máscara e normalização para o formulário. */

export function apenasDigitos(valor) {
  return String(valor || '').replace(/\D/g, '')
}

export function mascararCpf(valor) {
  const d = apenasDigitos(valor).slice(0, 11)
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function mascararCep(valor) {
  const d = apenasDigitos(valor).slice(0, 8)
  return d.replace(/(\d{5})(\d{1,3})$/, '$1-$2')
}

export function mascararTelefone(valor) {
  const d = apenasDigitos(valor).slice(0, 11)
  if (d.length <= 10) {
    return d
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }
  return d
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

export function formatarCpfExibicao(cpf) {
  if (!cpf) return '—'
  return mascararCpf(cpf)
}

/** Máscara DD/MM/AAAA */
export function mascararDataBr(valor) {
  const d = apenasDigitos(valor).slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
}

/**
 * Converte data da API (YYYY-MM-DD ou já DD/MM/AAAA) para exibição BR.
 */
export function isoParaBr(valor) {
  if (!valor) return ''
  const s = String(valor).trim()
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[3]}/${m[2]}/${m[1]}`
  return mascararDataBr(s)
}

/**
 * Converte DD/MM/AAAA → YYYY-MM-DD (formato enviado ao backend).
 * Retorna null se inválida.
 */
export function brParaIso(valor) {
  const m = String(valor || '')
    .trim()
    .match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return null
  const dia = Number(m[1])
  const mes = Number(m[2])
  const ano = Number(m[3])
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31 || ano < 1900) return null
  const data = new Date(ano, mes - 1, dia)
  if (
    data.getFullYear() !== ano ||
    data.getMonth() !== mes - 1 ||
    data.getDate() !== dia
  ) {
    return null
  }
  if (data > new Date()) return null
  const mm = String(mes).padStart(2, '0')
  const dd = String(dia).padStart(2, '0')
  return `${ano}-${mm}-${dd}`
}

export function formatarDataBrExibicao(valor) {
  const br = isoParaBr(valor)
  return br || '—'
}

export function formularioVazio() {
  return {
    nome_completo: '',
    apelido: '',
    data_nascimento: '',
    genero: '',
    nacionalidade: 'Brasileira',
    cpf: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    telefone: '',
    email: '',
  }
}

export function pessoaParaFormulario(pessoa) {
  return {
    nome_completo: pessoa.nome_completo || '',
    apelido: pessoa.apelido || '',
    data_nascimento: isoParaBr(pessoa.data_nascimento),
    genero: pessoa.genero || '',
    nacionalidade: pessoa.nacionalidade || '',
    cpf: mascararCpf(pessoa.cpf || ''),
    cep: mascararCep(pessoa.cep || ''),
    logradouro: pessoa.logradouro || '',
    numero: pessoa.numero || '',
    complemento: pessoa.complemento || '',
    bairro: pessoa.bairro || '',
    cidade: pessoa.cidade || '',
    estado: pessoa.estado || '',
    telefone: mascararTelefone(pessoa.telefone || ''),
    email: pessoa.email || '',
  }
}

export function formularioParaPayload(formulario) {
  return {
    nome_completo: formulario.nome_completo.trim(),
    apelido: formulario.apelido.trim() || null,
    data_nascimento: brParaIso(formulario.data_nascimento),
    genero: formulario.genero.trim(),
    nacionalidade: formulario.nacionalidade.trim(),
    cpf: apenasDigitos(formulario.cpf),
    cep: apenasDigitos(formulario.cep),
    logradouro: formulario.logradouro.trim(),
    numero: formulario.numero.trim(),
    complemento: formulario.complemento.trim() || null,
    bairro: formulario.bairro.trim(),
    cidade: formulario.cidade.trim(),
    estado: formulario.estado.trim().toUpperCase(),
    telefone: apenasDigitos(formulario.telefone),
    email: formulario.email.trim(),
  }
}

export function validarFormularioCliente(formulario) {
  const erros = []
  if (!formulario.nome_completo.trim()) erros.push('Nome completo é obrigatório')
  if (!brParaIso(formulario.data_nascimento)) {
    erros.push('Data de nascimento inválida (use DD/MM/AAAA)')
  }
  if (!formulario.genero.trim()) erros.push('Gênero é obrigatório')
  if (!formulario.nacionalidade.trim()) erros.push('Nacionalidade é obrigatória')
  if (apenasDigitos(formulario.cpf).length !== 11) erros.push('CPF deve ter 11 dígitos')
  if (apenasDigitos(formulario.cep).length !== 8) erros.push('CEP deve ter 8 dígitos')
  if (!formulario.logradouro.trim()) erros.push('Logradouro é obrigatório')
  if (!formulario.numero.trim()) erros.push('Número é obrigatório')
  if (!formulario.bairro.trim()) erros.push('Bairro é obrigatório')
  if (!formulario.cidade.trim()) erros.push('Cidade é obrigatória')
  if (formulario.estado.trim().length !== 2) erros.push('UF deve ter 2 letras')
  if (apenasDigitos(formulario.telefone).length < 10) erros.push('Telefone inválido')
  if (!formulario.email.trim() || !formulario.email.includes('@')) erros.push('E-mail inválido')
  return erros
}
