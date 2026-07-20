import { useState } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext.jsx'
import { PALETTE, DEFAULT_COLOR } from '../utils/palette'

export default function CreateCalendarModal({ onClose }) {
  const { currentUser } = useAuth()
  const [name, setName] = useState('')
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    setError('')
    try {
      await addDoc(collection(db, 'calendars'), {
        name: name.trim(),
        color,
        ownerId: currentUser.uid,
        memberIds: [currentUser.uid],
        members: { [currentUser.uid]: 'owner' },
        createdAt: serverTimestamp(),
      })
      onClose()
    } catch (err) {
      setError('No se pudo crear el calendario.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <h2 className="font-display italic text-xl font-semibold text-ink">Nuevo calendario</h2>
          <button onClick={onClose} className="text-ink/40 hover:text-ink">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Nombre</label>
            <input
              autoFocus
              type="text"
              placeholder="Ej: Trabajo, Familia, Proyecto X…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-indigo/40 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">Color</label>
            <div className="flex flex-wrap gap-2.5">
              {PALETTE.map((c) => (
                <button
                  key={c.id}
                  type="button"
                    onClick={() => setColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className="w-7 h-7 rounded-full flex items-center justify-center ring-offset-2 transition"
                    aria-label={`Usar color ${c.id}`}
                >
                  {color === c.hex && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-coral">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-ink/60 px-4 py-2 rounded-lg hover:bg-paper"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={busy || !name.trim()}
              className="text-sm font-medium bg-indigo text-white rounded-lg px-4 py-2 hover:bg-indigo/90 disabled:opacity-40 transition"
            >
              {busy ? 'Creando…' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
