import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Cadastro from './pages/Cadastro'
import Pessoas from './pages/Pessoas'
import PessoaDetalhes from './pages/PessoaDetalhes'
import EditarPessoa from './pages/EditarPessoa'
import PessoaCriptografado from './pages/PessoaCriptografado'
import Backup from './pages/Backup'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/cadastro" replace />} />
        <Route path="cadastro" element={<Cadastro />} />
        <Route path="pessoas" element={<Pessoas />} />
        <Route path="pessoas/:id" element={<PessoaDetalhes />} />
        <Route path="pessoas/:id/editar" element={<EditarPessoa />} />
        <Route path="pessoas/:id/criptografado" element={<PessoaCriptografado />} />
        <Route path="backup" element={<Backup />} />
      </Route>
    </Routes>
  )
}
