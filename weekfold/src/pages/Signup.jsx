import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Logo from '../components/Logo.jsx'

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await signup(email, password, username)
      navigate('/')
    } catch (err) {
      setError(err.message || 'No se pudo crear la cuenta.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Logo size="lg" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h1 className="font-display italic text-xl font-semibold text-ink mb-1">Crear cuenta</h1>
          <p className="text-sm text-ink/50 mb-6">Tu username es público – así te encuentran para compartir.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Username</label>
              <input
                type="text"
                required
                placeholder="@ tunombre"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-line bg-paper/60 px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Correo electrónico</label>
              <input
                type="email"
                required
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-line bg-paper/60 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Contraseña</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-line bg-paper/60 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo focus:bg-white"
              />
            </div>

            {error && <p className="text-sm text-coral">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-indigo text-white text-sm font-medium py-2.5 hover:bg-indigo/90 disabled:opacity-50 transition"
            >
              {busy ? 'Creando…' : 'Crear mi cuenta'}
            </button>
          </form>

          <p className="text-sm text-ink/50 text-center mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-indigo font-medium">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}