import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, doc, getDoc, getDocs, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import ConfirmCard from './ConfirmCard.jsx'
import { DEFAULT_COLOR } from '../utils/palette'

const ROLE_LABEL = { viewer: 'solo ver', editor: 'puede editar' }

function AccessLabel({ calendar }) {
  const memberCount = Object.keys(calendar.members || {}).length
  if (memberCount <= 1) return <p className="text-xs text-ink/45 mt-1">Solo tú tienes acceso</p>
  const others = memberCount - 1
  return (
    <p className="text-xs text-ink/45 mt-1">
      {others} {others === 1 ? 'persona' : 'personas'} con acceso
    </p>
  )
}

function SharedBy({ ownerId }) {
  const [owner, setOwner] = useState(null)

  useEffect(() => {
    let active = true
    getDoc(doc(db, 'users', ownerId)).then((snap) => {
      if (active && snap.exists()) setOwner(snap.data())
    })
    return () => {
      active = false
    }
  }, [ownerId])

  if (!owner) return null

  return (
    <div className="flex items-center gap-1.5 mt-2 text-xs text-ink/45">
      <span className="w-5 h-5 rounded-full bg-indigo/15 text-indigo font-semibold flex items-center justify-center text-[10px]">
        {owner.username?.slice(0, 2).toUpperCase()}
      </span>
      compartido por @{owner.username}
    </div>
  )
}

export default function CalendarCard({ calendar, shared, viewerUid }) {
  const color = calendar.color || DEFAULT_COLOR
  const role = calendar.members?.[viewerUid]
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const isOwner = calendar.ownerId === viewerUid

  function requestDelete(e) {
    e.preventDefault()
    e.stopPropagation()
    setShowDeleteConfirm(true)
  }

  async function confirmDelete() {
    setDeleting(true)
    try {
      const eventsRef = collection(db, 'calendars', calendar.id, 'events')
      const eventsSnap = await getDocs(eventsRef)
      const batch = writeBatch(db)

      eventsSnap.forEach((snapshot) => {
        batch.delete(snapshot.ref)
      })

      batch.delete(doc(db, 'calendars', calendar.id))
      await batch.commit()
    } catch (err) {
      window.alert('No se pudo eliminar el calendario.')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="relative">
      <Link
        to={`/calendar/${calendar.id}`}
        style={{ borderLeftColor: color }}
        className="block rounded-xl border border-line border-l-[3px] bg-white p-4 hover:shadow-sm transition pr-3 sm:pr-12"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          {shared && role && (
            <span
              className="text-[11px] font-medium px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: role === 'editor' ? '#F1EBFE' : '#FDE7E1',
                color: role === 'editor' ? '#8B5CF6' : '#F0653E',
              }}
            >
              {ROLE_LABEL[role]}
            </span>
          )}
        </div>

        <h3 className="font-semibold text-ink mt-2 truncate text-sm sm:text-base">{calendar.name}</h3>

        {shared ? <SharedBy ownerId={calendar.ownerId} /> : <AccessLabel calendar={calendar} />}
      </Link>

      {isOwner && (
        <>
          <button
            type="button"
            onClick={requestDelete}
            disabled={deleting}
            className="hidden sm:inline-block absolute top-3 right-3 text-xs text-coral hover:text-coral/80 disabled:opacity-50"
          >
            {deleting ? 'Borrando…' : 'Eliminar'}
          </button>

          <div className="sm:hidden mt-2">
            <button
              type="button"
              onClick={requestDelete}
              disabled={deleting}
              className="w-full text-sm text-coral text-left hover:underline disabled:opacity-50"
            >
              {deleting ? 'Borrando…' : 'Eliminar calendario'}
            </button>
          </div>
        </>
      )}

      {showDeleteConfirm && (
        <ConfirmCard
          title="Eliminar calendario"
          description={`Estás a punto de eliminar “${calendar.name}”. Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          cancelLabel="Cancelar"
          danger
          loading={deleting}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  )
}