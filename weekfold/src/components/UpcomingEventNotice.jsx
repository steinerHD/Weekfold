import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs } from 'firebase/firestore'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { db } from '../firebase'
import { getNextOccurrence } from '../utils/dateUtils'

function toDate(value) {
  if (value?.toDate) return value.toDate()
  return value instanceof Date ? value : new Date(value)
}

function timeUntil(date) {
  const minutes = Math.max(0, Math.round((date.getTime() - Date.now()) / 60000))
  if (minutes < 60) return minutes <= 1 ? 'en menos de un minuto' : `en ${minutes} minutos`

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (hours < 24) return `en ${hours} h${remainingMinutes ? ` ${remainingMinutes} min` : ''}`

  const days = Math.floor(hours / 24)
  return days === 1 ? 'mañana' : `en ${days} días`
}

export default function UpcomingEventNotice({ calendars }) {
  const navigate = useNavigate()
  const [upcoming, setUpcoming] = useState(null)

  useEffect(() => {
    const calendarIds = calendars.map((calendar) => calendar.id).sort().join(',')
    if (!calendarIds) return

    let active = true

    async function findUpcomingEvent() {
      try {
        const now = new Date()
        const eventGroups = await Promise.all(
          calendars.map(async (calendar) => {
            const snapshot = await getDocs(collection(db, 'calendars', calendar.id, 'events'))
            return snapshot.docs
              .map((document) => {
                const data = document.data()
                if (!data.start || !data.end) return null
                return {
                  id: document.id,
                  ...data,
                  start: toDate(data.start),
                  end: toDate(data.end),
                  recurrence: {
                    enabled: Boolean(data.recurrence?.enabled),
                    until: data.recurrence?.until ? toDate(data.recurrence.until) : null,
                  },
                  calendarId: calendar.id,
                  calendarName: calendar.name,
                }
              })
              .filter(Boolean)
          }),
        )

        const next = eventGroups
          .flat()
          .map((event) => getNextOccurrence(event, now))
          .filter(Boolean)
          .sort((a, b) => a.start - b.start)[0]

        if (active) setUpcoming(next || null)
      } catch (error) {
        console.warn('Could not find upcoming event', error)
      }
    }

    findUpcomingEvent()
    return () => {
      active = false
    }
  }, [calendars])

  if (!upcoming) return null

  function openCalendar() {
    navigate(`/calendar/${upcoming.calendarId}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo">Próximo evento</p>
            <h2 className="mt-1 font-display text-xl font-semibold italic text-ink">{upcoming.title || 'Sin título'}</h2>
          </div>
          <button
            type="button"
            onClick={() => setUpcoming(null)}
            className="flex-shrink-0 text-xl leading-none text-ink/40 hover:text-ink"
            aria-label="Cerrar aviso"
          >
            ×
          </button>
        </div>

        <div className="mt-4 rounded-xl bg-paper p-3 text-sm">
          <p className="font-medium text-ink">{format(upcoming.start, "EEEE d 'de' MMMM · h:mm a", { locale: es })}</p>
          <p className="mt-1 text-ink/60">{timeUntil(upcoming.start)} · {upcoming.calendarName}</p>
        </div>

        {upcoming.description && <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-ink/70">{upcoming.description}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setUpcoming(null)}
            className="rounded-lg px-4 py-2 text-sm text-ink/60 hover:bg-paper"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={openCalendar}
            className="rounded-lg bg-indigo px-4 py-2 text-sm font-medium text-white hover:bg-indigo/90"
          >
            Ver calendario
          </button>
        </div>
      </div>
    </div>
  )
}
