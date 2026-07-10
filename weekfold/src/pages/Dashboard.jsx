import { useState } from 'react'
import Navbar from '../components/Navbar.jsx'
import CalendarCard from '../components/CalendarCard.jsx'
import CreateCalendarModal from '../components/CreateCalendarModal.jsx'
import { useCalendars } from '../hooks/useCalendars.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function Dashboard() {
  const { currentUser } = useAuth()
  const { mine, sharedWithMe, loading } = useCalendars()
  const [showCreate, setShowCreate] = useState(false)

  const hasAny = mine.length > 0 || sharedWithMe.length > 0

  return (
    <div className="min-h-screen bg-paper">
      <Navbar onNewCalendar={() => setShowCreate(true)} />

      <main className="max-w-6xl mx-auto px-6 py-10">
        {loading ? (
          <p className="text-sm text-ink/40">Cargando…</p>
        ) : !hasAny ? (
          <div className="border border-dashed border-line rounded-2xl p-14 text-center bg-white/60">
            <h2 className="font-display italic text-xl text-ink mb-2">Todavía no tienes calendarios</h2>
            <p className="text-sm text-ink/50 mb-6">Crea el primero para empezar a organizar tu semana.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-indigo text-white text-sm font-medium rounded-lg px-5 py-2.5 hover:bg-indigo/90 transition block w-full sm:inline-block sm:w-auto"
            >
              Crear mi primer calendario
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            <section>
              <div className="flex items-baseline gap-2 mb-4">
                <h2 className="text-xs font-semibold text-indigo/70 uppercase tracking-wider">Mis calendarios</h2>
                <span className="text-xs text-ink/30">{mine.length}</span>
              </div>
              {mine.length === 0 ? (
                <p className="text-sm text-ink/40">Aún no creas ninguno propio.</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mine.map((c) => (
                    <CalendarCard key={c.id} calendar={c} viewerUid={currentUser.uid} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="flex items-baseline gap-2 mb-4">
                <h2 className="text-xs font-semibold text-indigo/70 uppercase tracking-wider">Compartidos conmigo</h2>
                <span className="text-xs text-ink/30">{sharedWithMe.length}</span>
              </div>
              {sharedWithMe.length === 0 ? (
                <p className="text-sm text-ink/40">Nadie ha compartido un calendario contigo todavía.</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sharedWithMe.map((c) => (
                    <CalendarCard key={c.id} calendar={c} shared viewerUid={currentUser.uid} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {showCreate && <CreateCalendarModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}