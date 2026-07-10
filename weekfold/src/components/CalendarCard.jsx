import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
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

  return (
    <Link
      to={`/calendar/${calendar.id}`}
      style={{ borderLeftColor: color }}
      className="block rounded-xl border border-line border-l-[3px] bg-white p-4 hover:shadow-sm transition"
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

      <h3 className="font-semibold text-ink mt-2">{calendar.name}</h3>

      {shared ? <SharedBy ownerId={calendar.ownerId} /> : <AccessLabel calendar={calendar} />}
    </Link>
  )
}