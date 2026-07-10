import { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { collection, doc, getDocs, onSnapshot, query, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext.jsx'
import WeekView from '../components/WeekView.jsx'
import EventModal from '../components/EventModal.jsx'
import ShareModal from '../components/ShareModal.jsx'
import ConfirmCard from '../components/ConfirmCard.jsx'
import { getWeekDays, shiftWeek, formatWeekRange, expandEventsForWeek } from '../utils/dateUtils'
import { DEFAULT_COLOR } from '../utils/palette'

export default function CalendarPage() {
  const { calendarId } = useParams()
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [calendar, setCalendar] = useState(null)
  const [masterEvents, setMasterEvents] = useState([])
  const [anchorDate, setAnchorDate] = useState(new Date())
  const [activeEvent, setActiveEvent] = useState(null)
  const [showShare, setShowShare] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingCalendar, setDeletingCalendar] = useState(false)

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'calendars', calendarId),
      (snap) => {
        setCalendar(snap.exists() ? { id: snap.id, ...snap.data() } : null)
      },
      (err) => {
        console.warn('Calendar snapshot error', err)
        setCalendar(null)
      },
    )
    return unsub
  }, [calendarId])

  useEffect(() => {
    const q = query(collection(db, 'calendars', calendarId, 'events'))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setMasterEvents(
          snap.docs.map((d) => {
            const data = d.data()
            return {
              id: d.id,
              ...data,
              start: data.start.toDate(),
              end: data.end.toDate(),
              recurrence: {
                enabled: Boolean(data.recurrence?.enabled),
                until: data.recurrence?.until ? data.recurrence.until.toDate() : null,
              },
            }
          }),
        )
      },
      (err) => {
        console.warn('Events snapshot error', err)
        setMasterEvents([])
      },
    )
    return unsub
  }, [calendarId])

  const days = useMemo(() => getWeekDays(anchorDate), [anchorDate])
  const visibleEvents = useMemo(() => expandEventsForWeek(masterEvents, days), [masterEvents, days])

  if (!calendar) {
    return <div className="p-8 text-sm text-ink/50">Cargando calendario…</div>
  }

  const role = calendar.members?.[currentUser.uid]
  const canEdit = role === 'owner' || role === 'editor'
  const isOwner = role === 'owner'
  const color = calendar.color || DEFAULT_COLOR

  function handleSlotClick(day, hour) {
    if (!canEdit) return
    const start = new Date(day)
    start.setHours(hour, 0, 0, 0)
    const end = new Date(start)
    end.setHours(hour + 1)
    setActiveEvent({ start, end })
  }

  function handleNewEventClick() {
    const start = new Date(days[0])
    start.setHours(9, 0, 0, 0)
    const end = new Date(days[0])
    end.setHours(10, 0, 0, 0)
    setActiveEvent({ start, end })
  }

  async function handleDeleteCalendar() {
    setDeletingCalendar(true)
    try {
      const eventsRef = collection(db, 'calendars', calendarId, 'events')
      const eventsSnap = await getDocs(eventsRef)
      const batch = writeBatch(db)

      eventsSnap.forEach((snapshot) => {
        batch.delete(snapshot.ref)
      })

      batch.delete(doc(db, 'calendars', calendarId))
      await batch.commit()
      navigate('/')
    } catch (err) {
      window.alert('No se pudo eliminar el calendario.')
    } finally {
      setDeletingCalendar(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-white border-b border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-2xl text-ink/60 hover:text-ink"
              aria-label="Volver a calendarios"
            >
              ‹
            </Link>
            <span className="text-sm font-semibold text-ink truncate max-w-[200px]">{calendar.name}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAnchorDate((d) => shiftWeek(d, -1))}
              className="w-9 h-9 rounded-md border border-line text-ink/70 hover:text-ink hover:border-ink transition"
              aria-label="Semana anterior"
            >
              ‹
            </button>
            <button
              onClick={() => setAnchorDate(new Date())}
              className="w-9 h-9 rounded-md border border-line text-ink/70 hover:text-ink hover:border-ink transition"
              aria-label="Hoy"
            >
              •
            </button>
            <button
              onClick={() => setAnchorDate((d) => shiftWeek(d, 1))}
              className="w-9 h-9 rounded-md border border-line text-ink/70 hover:text-ink hover:border-ink transition"
              aria-label="Semana siguiente"
            >
              ›
            </button>
            <span className="hidden sm:inline text-xs font-mono text-ink/60 w-40 text-center truncate">{formatWeekRange(days)}</span>
            <button
              onClick={handleNewEventClick}
              disabled={!canEdit}
              className="w-9 h-9 rounded-md bg-indigo text-white flex items-center justify-center hover:bg-indigo/90 disabled:opacity-40 transition"
              aria-label="Nuevo evento"
            >
              +
            </button>
            {isOwner && (
              <>
                <button
                  onClick={() => setShowShare(true)}
                  className="w-9 h-9 rounded-md border border-line text-ink/70 hover:text-indigo hover:border-indigo transition flex items-center justify-center"
                  aria-label="Compartir calendario"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M15 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-9 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm9 6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-9 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm3-1.5l6-3.5M9 10.5l6-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deletingCalendar}
                  className="w-9 h-9 rounded-md border border-line text-ink/70 hover:text-coral hover:border-coral transition flex items-center justify-center"
                  aria-label="Eliminar calendario"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M3 6h18M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">
        <WeekView
          days={days}
          events={visibleEvents}
          onSlotClick={handleSlotClick}
          onEventClick={(ev) => setActiveEvent(ev)}
        />
      </main>

      {activeEvent && (
        <EventModal
          calendarId={calendarId}
          days={days}
          initialEvent={activeEvent}
          canEdit={canEdit}
          onClose={() => setActiveEvent(null)}
        />
      )}

      {showShare && isOwner && <ShareModal calendar={calendar} onClose={() => setShowShare(false)} />}
      {showDeleteConfirm && (
        <ConfirmCard
          title="Eliminar calendario"
          description={`Estás a punto de eliminar “${calendar.name}”. Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          cancelLabel="Cancelar"
          danger
          loading={deletingCalendar}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteCalendar}
        />
      )}
    </div>
  )
}