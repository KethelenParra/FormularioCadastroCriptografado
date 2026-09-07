import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

const titles = {
  '/cadastro': 'Novo cadastro',
  '/pessoas': 'Pessoas cadastradas',
  '/backup': 'Backup do banco',
}

function resolveTitle(pathname) {
  if (titles[pathname]) return titles[pathname]
  if (pathname.includes('/editar')) return 'Editar pessoa'
  if (pathname.includes('/criptografado')) return 'Dados criptografados'
  if (pathname.startsWith('/pessoas/')) return 'Detalhes da pessoa'
  return 'Sistema de cadastro'
}

function navClass({ isActive }) {
  return isActive ? 'nav-link active' : 'nav-link'
}

export default function Layout() {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      {menuOpen && (
        <button
          type="button"
          className="overlay"
          onClick={closeMenu}
          aria-label="Fechar menu"
        />
      )}

      <div className="app-shell">
        <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
          <div className="brand">
            <span className="brand-mark">CP</span>
            <div>
              <p className="brand-title">Cadastro Pessoal</p>
              <p className="brand-sub">Atividade 05 · CRUD</p>
            </div>
          </div>

          <nav className="sidebar-nav" aria-label="Principal">
            <NavLink to="/cadastro" className={navClass} onClick={closeMenu}>
              Cadastro
            </NavLink>
            <NavLink to="/pessoas" className={navClass} onClick={closeMenu}>
              Pessoas
            </NavLink>
            <NavLink to="/backup" className={navClass} onClick={closeMenu}>
              Backup
            </NavLink>
          </nav>

          <p className="sidebar-foot">PostgreSQL · AES-256-GCM</p>
        </aside>

        <div className="main-area">
          <header className="topbar">
            <button
              type="button"
              className="mobile-nav-toggle"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Abrir menu"
            >
              ☰
            </button>
            <div>
              <p className="topbar-kicker">Formulário de dados pessoais</p>
              <h1 className="topbar-title">{resolveTitle(location.pathname)}</h1>
            </div>
          </header>

          <main className="content">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  )
}
