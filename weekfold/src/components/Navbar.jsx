import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Logo from './Logo.jsx'

function initialsOf(username) {
  if (!username) return '?'
  return username.slice(0, 2).toUpperCase()
}

export default function Navbar({ onNewCalendar, isDark, onToggleTheme }) {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <header className="bg-white border-b border-line">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-12 sm:h-16 flex items-center justify-between">
        <Logo />

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleTheme}
            className="inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-ink/60 hover:bg-paper hover:text-ink transition"
            aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
            title={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
          >
            {isDark ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10 1.4 1.4m0-12.8L17 7m-10 10-1.4 1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M20.3 14.6A8.5 8.5 0 0 1 9.4 3.7 8.5 8.5 0 1 0 20.3 14.6Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            <span className="hidden md:inline">{isDark ? 'Claro' : 'Oscuro'}</span>
          </button>

          <button
            onClick={onNewCalendar}
            className="hidden sm:inline-flex text-sm font-medium bg-indigo text-white rounded-lg px-4 py-2 hover:bg-indigo/90 transition"
          >
            + Nuevo calendario
          </button>

          <button
            onClick={onNewCalendar}
            aria-label="Nuevo calendario"
            className="inline-flex sm:hidden w-8 h-8 items-center justify-center rounded-md bg-indigo text-white"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="w-px h-6 bg-line" />

          <button
            onClick={handleLogout}
            title="Salir"
            className="w-8 h-8 flex items-center justify-center rounded-md text-ink/40 hover:text-ink hover:bg-paper transition"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M15 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H15M10 17L15 12M15 12L10 7M15 12H3"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div className="w-8 h-8 rounded-full bg-indigo text-white text-xs font-semibold flex items-center justify-center">
            {initialsOf(profile?.usernameDisplay || profile?.username)}
          </div>
        </div>
      </div>
    </header>
  )
}
