import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Logo from '../components/Logo.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError('Correo o contraseña incorrectos.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-2">
            <Logo size="lg" />
          </div>
          <p className="text-sm text-ink/50">Calendarios semanales para equipos y personas</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h1 className="font-display italic text-xl font-semibold text-ink mb-6">Bienvenido de vuelta</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Correo electrónico</label>
              <input
                type="email"
                required
                placeholder="alex@weekfold.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-line bg-paper/60 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo focus:bg-white"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-ink">Contraseña</label>
                <a href="#" className="text-xs font-medium text-indigo hover:underline">
                  ¿La olvidaste?
                </a>
              </div>
              <input
                type="password"
                required
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
              {busy ? 'Entrando…' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="text-sm text-ink/50 text-center mt-6">
            ¿No tienes cuenta?{' '}
            <Link to="/signup" className="text-indigo font-medium">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}