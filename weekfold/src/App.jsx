import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Dashboard from './pages/Dashboard.jsx'
import CalendarPage from './pages/CalendarPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { db } from './firebase.js'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { useAuth } from './context/AuthContext.jsx'
import { useTheme } from './hooks/useTheme.js'

export default function App() {
  const { currentUser } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  return (
    <>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard isDark={isDark} onToggleTheme={toggleTheme} />
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
