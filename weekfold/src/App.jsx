import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Dashboard from './pages/Dashboard.jsx'
import CalendarPage from './pages/CalendarPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { db } from './firebase.js'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { useAuth } from './context/AuthContext.jsx'
import {
  requestNotificationPermission,
  scheduleBrowserReminder,
  isNotificationEnabled,
  setNotificationEnabled,
  getNotificationMinutes,
  setNotificationMinutes,
} from './utils/notifications.js'

export default function App() {
  const { currentUser } = useAuth()
  const [reminderEnabled, setReminderEnabled] = useState(isNotificationEnabled())
  const [reminderMinutes, setReminderMinutesState] = useState(getNotificationMinutes())

  useEffect(() => {
    if (!currentUser) return

    const q = query(collection(db, 'calendars'), where('memberIds', 'array-contains', currentUser.uid))
    let eventsUnsubs = []
    const unsub = onSnapshot(
      q,
      (snap) => {
        // clear previous event listeners
        eventsUnsubs.forEach((u) => u())
        eventsUnsubs = []

        const calendars = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        const userCalendars = calendars.filter((calendar) => calendar.memberIds?.includes(currentUser.uid))

        userCalendars.forEach((calendar) => {
          const eventsRef = collection(db, 'calendars', calendar.id, 'events')
          const eventsUnsub = onSnapshot(eventsRef, (eventsSnap) => {
            eventsSnap.docs.forEach((docSnap) => {
              const event = { id: docSnap.id, ...docSnap.data() }
              if (!event.start) return
              scheduleBrowserReminder(event, calendar.name, reminderMinutes)
            })
          }, (err) => {
            console.warn('events subscription error', err)
          })
          eventsUnsubs.push(eventsUnsub)
        })
      },
      (err) => {
        console.warn('calendars subscription error', err)
      },
    )

    return () => {
      unsub()
      eventsUnsubs.forEach((u) => u())
    }
  }, [currentUser, reminderMinutes])

  async function handleEnableNotifications() {
    const result = await requestNotificationPermission()
    if (result === 'granted') {
      setNotificationEnabled(true)
      setReminderEnabled(true)
    }
  }

  function handleChangeMinutes(mins) {
    setNotificationMinutes(mins)
    setReminderMinutesState(mins)
  }

  return (
    <>
      {currentUser && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
          <div className="relative">
            <button
              onClick={handleEnableNotifications}
              className="rounded-full bg-indigo px-4 py-2 text-sm font-medium text-white shadow-lg"
            >
              {reminderEnabled ? 'Notificaciones activadas' : 'Activar recordatorios'}
            </button>
          </div>

          <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1 shadow">
            <span className="text-sm text-ink/60">Avisar</span>
            <select
              value={reminderMinutes}
              onChange={(e) => handleChangeMinutes(Number(e.target.value))}
              className="text-sm bg-transparent outline-none"
            >
              <option value={5}>5 min</option>
              <option value={10}>10 min</option>
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
            </select>
          </div>
        </div>
      )}
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendar/:calendarId"
        element={
          <ProtectedRoute>
            <CalendarPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  )
}
