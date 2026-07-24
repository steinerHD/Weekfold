import { useAuth } from '../context/AuthContext.jsx'

export default function GoogleCalendarConnectButton({ calendarId }) {
  const { currentUser } = useAuth()

  async function connectGoogleCalendar() {
    if (!currentUser) return

    const idToken = await currentUser.getIdToken()
    const authStartUrl = new URL('/api/auth/google/start', window.location.origin).toString()

    const form = document.createElement('form')
    form.method = 'POST'
    form.action = authStartUrl
    form.style.display = 'none'

    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = 'idToken'
    input.value = idToken
    form.appendChild(input)

    const calendarInput = document.createElement('input')
    calendarInput.type = 'hidden'
    calendarInput.name = 'calendarId'
    calendarInput.value = calendarId
    form.appendChild(calendarInput)
    document.body.appendChild(form)
    form.submit()
  }

  return (
    <button
      type="button"
      onClick={connectGoogleCalendar}
      className="inline-flex items-center gap-1.5 rounded-md border border-line px-2 py-1.5 text-xs font-medium text-ink/70 transition hover:border-indigo hover:text-indigo"
      title="Crear y sincronizar este calendario con Google Calendar"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 3v3m10-3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 13h3v3H8zm5 0h3v3h-3z" fill="currentColor" />
      </svg>
      <span className="hidden sm:inline">Sincronizar Google</span>
      <span className="sm:hidden">Google</span>
    </button>
  )
}
