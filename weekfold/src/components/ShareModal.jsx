import { useState } from 'react'
import { collection, query, where, orderBy, limit, getDocs, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext.jsx'

export default function ShareModal({ calendar, onClose }) {
  const { currentUser } = useAuth()
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [role, setRole] = useState('viewer')
  const [busyUid, setBusyUid] = useState(null)
  const [error, setError] = useState('')

  const members = calendar.members || {}
  const memberUids = Object.keys(members).filter((uid) => uid !== calendar.ownerId)

  async function handleSearch(e) {
    e.preventDefault()
    setError('')
    const term = search.trim().toLowerCase()
    if (!term) return
    const q = query(
      collection(db, 'users'),
      orderBy('username'),
      where('username', '>=', term),
      where('username', '<=', term + '\uf8ff'),
      limit(8),
    )
    const snap = await getDocs(q)
    const found = snap.docs
      .map((d) => ({ uid: d.id, ...d.data() }))
      .filter((u) => u.uid !== currentUser.uid && !memberUids.includes(u.uid) && u.uid !== calendar.ownerId)
    setResults(found)
  }

  async function handleAdd(uid) {
    setBusyUid(uid)
    setError('')
    try {
      await updateDoc(doc(db, 'calendars', calendar.id), {
        memberIds: arrayUnion(uid),
        [`members.${uid}`]: role,
      })
      setResults((r) => r.filter((u) => u.uid !== uid))
    } catch (err) {
      setError('No se pudo compartir. Revisa las reglas de Firestore.')
    } finally {
      setBusyUid(null)
    }
  }

  async function handleRemove(uid) {
    setBusyUid(uid)
    try {
      await updateDoc(doc(db, 'calendars', calendar.id), {
        memberIds: arrayRemove(uid),
        [`members.${uid}`]: null,
      })
    } finally {
      setBusyUid(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-start justify-between mb-1">
          <h2 className="font-display italic text-xl font-semibold text-ink">Compartir "{calendar.name}"</h2>
          <button onClick={onClose} className="text-ink/40 hover:text-ink">
            ✕
          </button>
        </div>
        <p className="text-sm text-ink/50 mb-4">Busca por nombre de usuario dentro de weekfold.</p>

        <form onSubmit={handleSearch} className="grid gap-3 mb-3 sm:grid-cols-[1fr_auto_auto]">
          <input
            type="text"
            placeholder="username"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-0 w-full rounded-lg border border-line px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="min-w-0 w-full rounded-lg border border-line px-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo sm:w-auto"
          >
            <option value="viewer">Ver</option>
            <option value="editor">Editar</option>
          </select>
          <button
            type="submit"
            className="w-full sm:w-auto text-sm font-medium bg-indigo text-white rounded-lg px-4 py-2 hover:bg-indigo/90 transition"
          >
            Buscar
          </button>
        </form>

        {error && <p className="text-sm text-coral mb-2">{error}</p>}

        <div className="space-y-1 mb-4 max-h-40 overflow-y-auto">
          {results.map((u) => (
            <div key={u.uid} className="flex items-center justify-between text-sm py-1.5">
              <span className="font-mono">@{u.username}</span>
              <button
                onClick={() => handleAdd(u.uid)}
                disabled={busyUid === u.uid}
                className="text-indigo font-medium hover:underline disabled:opacity-50"
              >
                Compartir como {role === 'editor' ? 'editor' : 'lector'}
              </button>
            </div>
          ))}
        </div>

        {memberUids.length > 0 && (
          <>
            <h3 className="text-xs font-semibold text-ink/40 uppercase tracking-wide mb-2">Con acceso</h3>
            <div className="space-y-1 mb-4">
              {memberUids.map((uid) => (
                <div key={uid} className="flex items-center justify-between text-sm py-1">
                  <span className="text-ink/60 font-mono text-xs">
                    {uid.slice(0, 8)}… · {members[uid]}
                  </span>
                  <button
                    onClick={() => handleRemove(uid)}
                    disabled={busyUid === uid}
                    className="text-coral text-xs hover:underline"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex justify-end">
          <button onClick={onClose} className="text-sm text-ink/60 px-4 py-2 rounded-lg hover:bg-paper">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}