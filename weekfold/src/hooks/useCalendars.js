import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext.jsx'

export function useCalendars() {
  const { currentUser } = useAuth()
  const [calendars, setCalendars] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) return
    const q = query(
      collection(db, 'calendars'),
      where('memberIds', 'array-contains', currentUser.uid),
      orderBy('createdAt', 'desc'),
    )
    const unsub = onSnapshot(q, (snap) => {
      setCalendars(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [currentUser])

  const mine = calendars.filter((c) => c.ownerId === currentUser?.uid)
  const sharedWithMe = calendars.filter((c) => c.ownerId !== currentUser?.uid)

  return { mine, sharedWithMe, loading }
}
