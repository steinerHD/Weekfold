import { useState } from 'react'
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { formatDayLabel, isSameDay } from '../utils/dateUtils'
import { PALETTE, DEFAULT_COLOR } from '../utils/palette'

const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']
const HOURS_24 = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))

function toDateInputValue(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export default function EventModal({ calendarId, days, initialEvent, canEdit, onClose }) {
  const isNew = !initialEvent?.id

  const [title, setTitle] = useState(initialEvent?.title || '')
  const [selectedDay, setSelectedDay] = useState(
    days.find((d) => isSameDay(d, initialEvent.start)) || days[0],
  )
  const [startHour, setStartHour] = useState(String(initialEvent.start.getHours()).padStart(2, '0'))
  const [startMin, setStartMin] = useState(
    String(Math.floor(initialEvent.start.getMinutes() / 5) * 5).padStart(2, '0'),
  )
  const [endHour, setEndHour] = useState(String(initialEvent.end.getHours()).padStart(2, '0'))
  const [endMin, setEndMin] = useState(String(Math.floor(initialEvent.end.getMinutes() / 5) * 5).padStart(2, '0'))
  const [color, setColor] = useState(initialEvent?.color || DEFAULT_COLOR)
  const [repeatsWeekly, setRepeatsWeekly] = useState(Boolean(initialEvent?.recurrence?.enabled))
  const [hasUntil, setHasUntil] = useState(Boolean(initialEvent?.recurrence?.until))
  const [until, setUntil] = useState(
    initialEvent?.recurrence?.until ? toDateInputValue(initialEvent.recurrence.until) : '',
  )
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function buildDate(day, hour, min) {
    const d = new Date(day)
    d.setHours(Number(hour), Number(min), 0, 0)
    return d
  }

  async function handleSave(e) {
    e.preventDefault()
    const start = buildDate(selectedDay, startHour, startMin)
    const end = buildDate(selectedDay, endHour, endMin)
    if (end <= start) {
      setError('La hora de fin debe ser posterior a la de inicio.')
      return
    }

    setBusy(true)
    setError('')
    try {
      const payload = {
        title: title.trim() || 'Sin título',
        start,
        end,
        color,
        recurrence: {
          enabled: repeatsWeekly,
          until: repeatsWeekly && hasUntil && until ? new Date(`${until}T23:59:59`) : null,
        },
      }
      if (isNew) {
        await addDoc(collection(db, 'calendars', calendarId, 'events'), {
          ...payload,
          createdAt: serverTimestamp(),
        })
      } else {
        await updateDoc(doc(db, 'calendars', calendarId, 'events', initialEvent.id), payload)
      }
      onClose()
    } catch (err) {
      setError('No se pudo guardar el evento.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    setBusy(true)
    try {
      await deleteDoc(doc(db, 'calendars', calendarId, 'events', initialEvent.id))
      onClose()
    } finally {
      setBusy(false)
    }
  }

  const selectClass =
    'rounded-lg border border-line px-2 py-1.5 text-sm font-mono disabled:bg-paper focus:outline-none focus:ring-2 focus:ring-indigo'

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <h2 className="font-display italic text-xl font-semibold text-ink">
            {isNew ? 'Nuevo evento' : canEdit ? 'Editar evento' : 'Evento'}
          </h2>
          <button onClick={onClose} className="text-ink/40 hover:text-ink">
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Título</label>
            <input
              disabled={!canEdit}
              type="text"
              placeholder="¿Qué tienes planeado?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-indigo/40 px-3.5 py-2.5 text-sm disabled:bg-paper focus:outline-none focus:ring-2 focus:ring-indigo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">Día</label>
            <div className="flex gap-1.5">
              {days.map((d) => (
                <button
                  key={d.toISOString()}
                  type="button"
                  disabled={!canEdit}
                  onClick={() => setSelectedDay(d)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition ${
                    isSameDay(d, selectedDay)
                      ? 'bg-indigo text-white'
                      : 'bg-paper text-ink/60 hover:bg-line'
                  } disabled:opacity-50`}
                >
                  {formatDayLabel(d)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink/60 mb-1">Inicio</label>
              <div className="flex gap-1.5">
                <select disabled={!canEdit} value={startHour} onChange={(e) => setStartHour(e.target.value)} className={selectClass}>
                  {HOURS_24.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <select disabled={!canEdit} value={startMin} onChange={(e) => setStartMin(e.target.value)} className={selectClass}>
                  {MINUTES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/60 mb-1">Fin</label>
              <div className="flex gap-1.5">
                <select disabled={!canEdit} value={endHour} onChange={(e) => setEndHour(e.target.value)} className={selectClass}>
                  {HOURS_24.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <select disabled={!canEdit} value={endMin} onChange={(e) => setEndMin(e.target.value)} className={selectClass}>
                  {MINUTES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {canEdit && (
            <div>
              <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={repeatsWeekly}
                  onChange={(e) => setRepeatsWeekly(e.target.checked)}
                  className="rounded border-line text-indigo focus:ring-indigo"
                />
                Repetir cada semana
              </label>

              {repeatsWeekly && (
                <div className="mt-2 pl-6 space-y-2">
                  <label className="flex items-center gap-2 text-xs text-ink/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasUntil}
                      onChange={(e) => setHasUntil(e.target.checked)}
                      className="rounded border-line text-indigo focus:ring-indigo"
                    />
                    Terminar en una fecha específica
                  </label>
                  {hasUntil && (
                    <input
                      type="date"
                      value={until}
                      onChange={(e) => setUntil(e.target.value)}
                      className="rounded-lg border border-line px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo"
                    />
                  )}
                  {!isNew && (
                    <p className="text-[11px] text-ink/40">
                      Editar o eliminar afecta toda la serie repetida, no solo esta semana.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {canEdit && (
            <div>
              <label className="block text-sm font-medium text-ink mb-2">Color</label>
              <div className="flex gap-2.5">
                {PALETTE.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                  >
                    {color === c.hex && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-coral">{error}</p>}

          <div className="flex justify-between items-center pt-1">
            {!isNew && canEdit ? (
              <button type="button" onClick={handleDelete} disabled={busy} className="text-sm text-coral hover:underline">
                Eliminar
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="text-sm text-ink/60 px-4 py-2 rounded-lg hover:bg-paper">
                {canEdit ? 'Cancelar' : 'Cerrar'}
              </button>
              {canEdit && (
                <button
                  type="submit"
                  disabled={busy}
                  className="text-sm font-medium bg-indigo text-white rounded-lg px-4 py-2 hover:bg-indigo/90 disabled:opacity-50 transition"
                >
                  {busy ? 'Guardando…' : 'Crear'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}