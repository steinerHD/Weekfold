import { startOfWeek, addDays, addWeeks, format } from 'date-fns'
import { es } from 'date-fns/locale'

export function getWeekDays(anchorDate) {
  const start = startOfWeek(anchorDate, { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function shiftWeek(anchorDate, direction) {
  return addWeeks(anchorDate, direction)
}

export function formatDayLabel(date) {
  return format(date, 'EEE d', { locale: es })
}

export function formatWeekRange(days) {
  const first = days[0]
  const last = days[6]
  const sameMonth = first.getMonth() === last.getMonth()
  return sameMonth
    ? `${format(first, 'd')} – ${format(last, 'd MMMM yyyy', { locale: es })}`
    : `${format(first, 'd MMM', { locale: es })} – ${format(last, 'd MMM yyyy', { locale: es })}`
}

export function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export const HOURS = Array.from({ length: 24 }, (_, i) => i)

function dateOnly(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

// Dado un evento "maestro" (con o sin recurrencia semanal) y los 7 días
// de la semana visible, devuelve 0 o 1 "ocurrencia" de ese evento para
// esta semana, con la fecha ajustada pero conservando la hora original.
// La edición/eliminación siempre afecta al documento maestro completo
// (decisión de alcance v1: no hay excepciones por fecha individual).
export function getOccurrenceForWeek(event, days) {
  const eventStartDay = dateOnly(event.start)

  if (!event.recurrence?.enabled) {
    const match = days.find((d) => isSameDay(d, event.start))
    return match ? event : null
  }

  const jsDay = event.start.getDay() // 0 = Domingo ... 6 = Sábado
  const mondayIndexedDay = (jsDay + 6) % 7 // 0 = Lunes ... 6 = Domingo
  const targetDay = days[mondayIndexedDay]

  if (dateOnly(targetDay) < eventStartDay) return null
  if (event.recurrence.until && dateOnly(targetDay) > dateOnly(event.recurrence.until)) return null

  const durationMs = event.end - event.start
  const start = new Date(targetDay)
  start.setHours(event.start.getHours(), event.start.getMinutes(), 0, 0)
  const end = new Date(start.getTime() + durationMs)

  return { ...event, start, end, isRecurringInstance: true }
}

export function expandEventsForWeek(events, days) {
  return events.map((ev) => getOccurrenceForWeek(ev, days)).filter(Boolean)
}

// Devuelve la próxima ocurrencia futura de un evento, incluyendo los que se
// repiten semanalmente. Las ocurrencias se calculan en el cliente porque el
// documento maestro conserva la fecha original del evento.
export function getNextOccurrence(event, now = new Date()) {
  if (event.start >= now) return event
  if (!event.recurrence?.enabled) return null

  const candidate = new Date(now)
  candidate.setHours(event.start.getHours(), event.start.getMinutes(), 0, 0)

  const daysUntilEvent = (event.start.getDay() - candidate.getDay() + 7) % 7
  candidate.setDate(candidate.getDate() + daysUntilEvent)
  if (candidate < now) candidate.setDate(candidate.getDate() + 7)

  if (candidate < event.start) return null
  if (event.recurrence.until && dateOnly(candidate) > dateOnly(event.recurrence.until)) return null

  return {
    ...event,
    start: candidate,
    end: new Date(candidate.getTime() + (event.end.getTime() - event.start.getTime())),
    isRecurringInstance: true,
  }
}
