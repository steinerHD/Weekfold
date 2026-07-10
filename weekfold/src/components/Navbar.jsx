import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Logo from './Logo.jsx'

function initialsOf(username) {
  if (!username) return '?'
  return username.slice(0, 2).toUpperCase()
}

export default function Navbar({ onNewCalendar }) {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <header className="bg-white border-b border-line">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Logo />

        <div className="flex items-center gap-3">
          <button
            onClick={onNewCalendar}
            className="text-sm font-medium bg-indigo text-white rounded-lg px-4 py-2 hover:bg-indigo/90 transition"
          >
            + Nuevo calendario
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