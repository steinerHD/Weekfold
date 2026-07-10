const STORAGE_KEY = 'weekfold-notifications-enabled'
const STORAGE_MINUTES = 'weekfold-notification-minutes'

// Keep track of scheduled timeouts by event id so we can clear them if needed
const scheduled = new Map()

function normalizeDate(value) {
  if (!value) return null
  if (value.toDate) return value.toDate()
  if (value instanceof Date) return value
  try {
    return new Date(value)
  } catch (e) {
    return null
  }
}

export function requestNotificationPermission() {
  if (!('Notification' in window)) return Promise.resolve('unsupported')
  if (Notification.permission === 'granted') return Promise.resolve('granted')
  return Notification.requestPermission()
}

export function isNotificationEnabled() {
  return localStorage.getItem(STORAGE_KEY) === 'true'
}

export function setNotificationEnabled(enabled) {
  localStorage.setItem(STORAGE_KEY, String(enabled))
}

export function getNotificationMinutes() {
  const v = localStorage.getItem(STORAGE_MINUTES)
  return v ? Number(v) : 10
}

export function setNotificationMinutes(minutes) {
  localStorage.setItem(STORAGE_MINUTES, String(minutes))
}

export function scheduleBrowserReminder(event, calendarName, minutesBefore) {
  if (!isNotificationEnabled() || !('Notification' in window)) return

  const start = normalizeDate(event.start)
  if (!start) return

  const mins = typeof minutesBefore === 'number' ? minutesBefore : getNotificationMinutes()
  const reminderTime = new Date(start.getTime() - mins * 60 * 1000)
  const now = new Date()

  if (reminderTime <= now) return

  // clear previous timeout for this event if any
  if (event.id && scheduled.has(event.id)) {
    clearScheduledReminder(scheduled.get(event.id))
  }

  const timeoutId = window.setTimeout(() => {
    if (Notification.permission === 'granted') {
      new Notification(`⏰ ${event.title || 'Evento próximo'}`, {
        body: `${calendarName}\nEmpieza a las ${start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
        icon: '/favicon.ico',
      })
    }
    if (event.id) scheduled.delete(event.id)
  }, reminderTime.getTime() - now.getTime())

  if (event.id) scheduled.set(event.id, timeoutId)
  return timeoutId
}

export function clearScheduledReminder(timeoutId) {
  if (timeoutId) window.clearTimeout(timeoutId)
}
