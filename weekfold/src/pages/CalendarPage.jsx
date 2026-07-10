import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, onSnapshot, collection, query } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext.jsx'
import WeekView from '../components/WeekView.jsx'
import EventModal from '../components/EventModal.jsx'
import ShareModal from '../components/ShareModal.jsx'
import { getWeekDays, shiftWeek, formatWeekRange, expandEventsForWeek } from '../utils/dateUtils'
import { DEFAULT_COLOR } from '../utils/palette'

export default function CalendarPage() {
  const { calendarId } = useParams()
  const { currentUser } = useAuth()

  const [calendar, setCalendar] = useState(null)
  const [masterEvents, setMasterEvents] = useState([])
  const [anchorDate, setAnchorDate] = useState(new Date())
  const [activeEvent, setActiveEvent] = useState(null)
  const [showShare, setShowShare] = useState(false)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'calendars', calendarId), (snap) => {
      setCalendar(snap.exists() ? { id: snap.id, ...snap.data() } : null)
    })
    return unsub
  }, [calendarId])

  useEffect(() => {
    const q = query(collection(db, 'calendars', calendarId, 'events'))
    const unsub = onSnapshot(q, (snap) => {
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
    })
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

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-white border-b border-line">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-ink/40 hover:text-ink flex items-center gap-1.5">
              <span className="text-base">‹</span> Calendarios
            </Link>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="font-display italic font-semibold text-ink">{calendar.name}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setAnchorDate((d) => shiftWeek(d, -1))}
              className="w-8 h-8 rounded-md hover:bg-paper text-ink/50 transition"
            >
              ‹
            </button>
            <button
              onClick={() => setAnchorDate(new Date())}
              className="text-sm font-medium text-indigo px-2 hover:underline"
            >
              Hoy
            </button>
            <button
              onClick={() => setAnchorDate((d) => shiftWeek(d, 1))}
              className="w-8 h-8 rounded-md hover:bg-paper text-ink/50 transition"
            >
              ›
            </button>
            <span className="text-sm font-mono text-ink/60 w-40 text-center">{formatWeekRange(days)}</span>

            <button
              onClick={handleNewEventClick}
              disabled={!canEdit}
              className="text-sm font-medium bg-indigo text-white rounded-lg px-4 py-2 hover:bg-indigo/90 disabled:opacity-40 transition ml-2"
            >
              + Evento
            </button>

            {isOwner && (
              <button
                onClick={() => setShowShare(true)}
                className="text-sm font-medium border border-line rounded-lg px-4 py-2 hover:border-indigo hover:text-indigo transition"
              >
                Compartir
              </button>
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
    </div>
  )
}