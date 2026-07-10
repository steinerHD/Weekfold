import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [profile, setProfile] = useState(null) // doc de users/{uid}
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      if (user) {
        const snap = await getDoc(doc(db, 'users', user.uid))
        setProfile(snap.exists() ? snap.data() : null)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  // Reserva el username y crea el perfil en una sola transacción atómica.
  // Si el username ya existe, la transacción falla y no se crea nada a medias.
  async function signup(email, password, username) {
    const usernameLower = username.trim().toLowerCase()
    if (!/^[a-z0-9_]{3,20}$/.test(usernameLower)) {
      throw new Error('El usuario debe tener 3-20 caracteres: letras, números o guion bajo.')
    }

    const cred = await createUserWithEmailAndPassword(auth, email, password)
    const uid = cred.user.uid

    try {
      await runTransaction(db, async (tx) => {
        const usernameRef = doc(db, 'usernames', usernameLower)
        const usernameSnap = await tx.get(usernameRef)
        if (usernameSnap.exists()) {
          throw new Error('USERNAME_TAKEN')
        }
        tx.set(usernameRef, { uid })
        tx.set(doc(db, 'users', uid), {
          username: usernameLower,
          usernameDisplay: username.trim(),
          email,
          createdAt: serverTimestamp(),
        })
      })
    } catch (err) {
      // Si falla la reserva del username, no dejamos un usuario de Auth huérfano.
      await cred.user.delete().catch(() => {})
      if (err.message === 'USERNAME_TAKEN') {
        throw new Error('Ese nombre de usuario ya existe. Elige otro.')
      }
      throw err
    }

    setProfile({ username: usernameLower, usernameDisplay: username.trim(), email })
    return cred.user
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  function logout() {
    return signOut(auth)
  }

  const value = { currentUser, profile, loading, signup, login, logout }

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}
