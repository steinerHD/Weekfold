import { useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'
import ConfirmCard from './ConfirmCard.jsx'

function localDayKey(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function displayDay(day) {
  return new Date(`${day}T12:00:00`).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

const INITIAL_COLUMNS = ['Por hacer', 'Haciendo', 'Completado']

export default function TodoBoard({ calendarId, events, canEdit }) {
  const [columns, setColumns] = useState([])
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newColumn, setNewColumn] = useState('')
  const [addingColumn, setAddingColumn] = useState(false)
  const [cardDraft, setCardDraft] = useState(null)
  const [editingCard, setEditingCard] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [history, setHistory] = useState([])
  const [selectedHistory, setSelectedHistory] = useState(null)

  useEffect(() => {
    let active = true
    let stopColumns = () => {}
    let stopCards = () => {}

    async function prepareDailyBoard() {
      const today = localDayKey()
      const metaRef = doc(db, 'calendars', calendarId, 'todoMeta', 'board')

      try {
        const metaSnapshot = await getDoc(metaRef)
        const activeDay = metaSnapshot.data()?.activeDay

        if (!metaSnapshot.exists() && canEdit) {
          const batch = writeBatch(db)
          batch.set(metaRef, { activeDay: today })
          INITIAL_COLUMNS.forEach((title, position) => {
            batch.set(doc(db, 'calendars', calendarId, 'todoColumns', `initial-${position}`), { title, position })
          })
          await batch.commit()
        } else if (activeDay && activeDay !== today && canEdit) {
          const cardsSnapshot = await getDocs(collection(db, 'calendars', calendarId, 'todoCards'))
          const batch = writeBatch(db)
          batch.set(doc(db, 'calendars', calendarId, 'todoHistory', activeDay), {
            date: activeDay,
            archivedAt: new Date(),
            cards: cardsSnapshot.docs.map((card) => ({ id: card.id, ...card.data() })),
          })
          cardsSnapshot.docs.forEach((card) => batch.delete(card.ref))
          batch.set(metaRef, { activeDay: today }, { merge: true })
          await batch.commit()
        }
      } catch (err) {
        console.warn('Todo board setup error', err)
        if (active) setError('No se pudo preparar el tablero diario.')
      }

      if (!active) return
      stopColumns = onSnapshot(
        query(collection(db, 'calendars', calendarId, 'todoColumns'), orderBy('position')),
        (snapshot) => setColumns(snapshot.docs.map((column) => ({ id: column.id, ...column.data() }))),
        () => setError('No se pudieron cargar las columnas.'),
      )
      stopCards = onSnapshot(
        query(collection(db, 'calendars', calendarId, 'todoCards'), orderBy('createdAt')),
        (snapshot) => {
          setCards(snapshot.docs.map((card) => ({ id: card.id, ...card.data() })))
          setLoading(false)
        },
        () => {
          setError('No se pudieron cargar las tareas.')
          setLoading(false)
        },
      )
    }

    prepareDailyBoard()
    return () => {
      active = false
      stopColumns()
      stopCards()
    }
  }, [calendarId, canEdit])

  const eventOptions = useMemo(
    () => events.slice().sort((a, b) => a.start - b.start),
    [events],
  )

  async function addColumn(event) {
    event.preventDefault()
    const title = newColumn.trim()
    if (!title) return
    try {
      await addDoc(collection(db, 'calendars', calendarId, 'todoColumns'), {
        title,
        position: columns.length,
      })
      setNewColumn('')
      setAddingColumn(false)
    } catch (err) {
      setError('No se pudo crear la columna.')
    }
  }

  async function addCard(event) {
    event.preventDefault()
    const title = cardDraft?.title.trim()
    if (!title || !cardDraft) return
    try {
      await addDoc(collection(db, 'calendars', calendarId, 'todoCards'), {
        title,
        columnId: cardDraft.columnId,
        eventId: cardDraft.eventId || null,
        checked: false,
        createdAt: new Date(),
      })
      setCardDraft(null)
    } catch (err) {
      setError('No se pudo crear la tarjeta.')
    }
  }

  async function toggleCard(card) {
    try {
      await updateDoc(doc(db, 'calendars', calendarId, 'todoCards', card.id), {
        checked: !card.checked,
        checkedAt: !card.checked ? new Date() : null,
      })
    } catch (err) {
      setError('No se pudo actualizar la tarea.')
    }
  }

  async function moveCard(card, columnId) {
    try {
      await updateDoc(doc(db, 'calendars', calendarId, 'todoCards', card.id), { columnId })
    } catch (err) {
      setError('No se pudo mover la tarea.')
    }
  }

  async function saveCard(event) {
    event.preventDefault()
    const title = editingCard?.title.trim()
    if (!title || !editingCard) return

    try {
      await updateDoc(doc(db, 'calendars', calendarId, 'todoCards', editingCard.id), {
        title,
        eventId: editingCard.eventId || null,
        columnId: editingCard.columnId,
      })
      setEditingCard(null)
    } catch (err) {
      setError('No se pudo editar la tarea.')
    }
  }

  async function removeCard() {
    if (!pendingDelete) return
    try {
      await deleteDoc(doc(db, 'calendars', calendarId, 'todoCards', pendingDelete.id))
      if (editingCard?.id === pendingDelete.id) setEditingCard(null)
      setPendingDelete(null)
    } catch (err) {
      setError('No se pudo eliminar la tarea.')
    }
  }

  async function removeColumn(column) {
    if (cards.some((card) => card.columnId === column.id)) {
      setError('Mueve o completa las tarjetas de esta columna antes de eliminarla.')
      return
    }
    try {
      await deleteDoc(doc(db, 'calendars', calendarId, 'todoColumns', column.id))
    } catch (err) {
      setError('No se pudo eliminar la columna.')
    }
  }

  async function openHistory() {
    setHistoryOpen(true)
    setSelectedHistory(null)
    try {
      const snapshot = await getDocs(query(collection(db, 'calendars', calendarId, 'todoHistory'), orderBy('date', 'desc')))
      setHistory(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })))
    } catch (err) {
      setError('No se pudo cargar el historial.')
    }
  }

  if (loading) return <p className="text-sm text-ink/50">Cargando tablero…</p>

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold italic text-ink">Tareas de hoy</h2>
          <p className="mt-1 text-sm text-ink/50">Las tarjetas se archivan al comenzar un nuevo día.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={openHistory} className="rounded-lg border border-line px-3 py-2 text-sm text-ink/70 hover:bg-white">
            Ver historial
          </button>
          {canEdit && (
            <button type="button" onClick={() => setAddingColumn(true)} className="rounded-lg bg-indigo px-3 py-2 text-sm font-medium text-white hover:bg-indigo/90">
              + Columna
            </button>
          )}
        </div>
      </div>

      {error && <p className="mb-4 rounded-lg bg-coral/10 px-3 py-2 text-sm text-coral">{error}</p>}

      {addingColumn && (
        <form onSubmit={addColumn} className="mb-4 flex max-w-sm gap-2">
          <input autoFocus value={newColumn} onChange={(event) => setNewColumn(event.target.value)} placeholder="Nombre de la columna" className="min-w-0 flex-1 rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo" />
          <button type="submit" className="rounded-lg bg-indigo px-3 py-2 text-sm font-medium text-white">Crear</button>
          <button type="button" onClick={() => setAddingColumn(false)} className="rounded-lg px-2 text-sm text-ink/60">Cancelar</button>
        </form>
      )}

      <div className="flex gap-4 overflow-x-auto pb-3">
        {columns.map((column) => {
          const columnCards = cards.filter((card) => card.columnId === column.id)
          return (
            <div key={column.id} className="w-72 flex-shrink-0 rounded-xl border border-line bg-white p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="truncate text-sm font-semibold text-ink">{column.title}</h3>
                {canEdit && <button type="button" onClick={() => removeColumn(column)} className="text-xs text-ink/40 hover:text-coral" aria-label={`Eliminar ${column.title}`}>×</button>}
              </div>

              <div className="space-y-2">
                {columnCards.map((card) => {
                  const linkedEvent = eventOptions.find((event) => event.id === card.eventId)
                  return (
                    <article key={card.id} className="rounded-lg border border-line bg-paper/60 p-3">
                      {editingCard?.id === card.id ? (
                        <form onSubmit={saveCard} className="space-y-2">
                          <input autoFocus value={editingCard.title} onChange={(event) => setEditingCard({ ...editingCard, title: event.target.value })} className="w-full rounded border border-line bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo" />
                          <select value={editingCard.eventId || ''} onChange={(event) => setEditingCard({ ...editingCard, eventId: event.target.value })} className="w-full rounded border border-line bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo">
                            <option value="">Sin evento vinculado</option>
                            {eventOptions.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}
                          </select>
                          <select value={editingCard.columnId} onChange={(event) => setEditingCard({ ...editingCard, columnId: event.target.value })} className="w-full rounded border border-line bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo">
                            {columns.map((option) => <option key={option.id} value={option.id}>{option.title}</option>)}
                          </select>
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setEditingCard(null)} className="px-2 py-1 text-xs text-ink/60">Cancelar</button>
                            <button type="submit" className="rounded bg-indigo px-2 py-1 text-xs font-medium text-white">Guardar</button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <label className="flex cursor-pointer items-start gap-2">
                            <input type="checkbox" checked={Boolean(card.checked)} onChange={() => toggleCard(card)} disabled={!canEdit} className="mt-0.5 rounded border-line text-indigo focus:ring-indigo" />
                            <span className={`min-w-0 text-sm ${card.checked ? 'text-ink/40 line-through' : 'text-ink'}`}>{card.title}</span>
                          </label>
                          {linkedEvent && <p className="mt-2 truncate text-xs text-indigo">Evento: {linkedEvent.title}</p>}
                          {canEdit && (
                            <div className="mt-3 flex items-center justify-between gap-2">
                              {columns.length > 1 ? (
                                <select value={card.columnId} onChange={(event) => moveCard(card, event.target.value)} className="min-w-0 flex-1 rounded border border-line bg-white px-2 py-1 text-xs text-ink/60 focus:outline-none focus:ring-1 focus:ring-indigo">
                                  {columns.map((option) => <option key={option.id} value={option.id}>{option.title}</option>)}
                                </select>
                              ) : <span />}
                              <div className="flex flex-shrink-0 gap-2 text-xs">
                                <button type="button" onClick={() => setEditingCard({ ...card })} className="text-indigo hover:underline">Editar</button>
                                <button type="button" onClick={() => setPendingDelete(card)} className="text-coral hover:underline">Eliminar</button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </article>
                  )
                })}
              </div>

              {cardDraft?.columnId === column.id ? (
                <form onSubmit={addCard} className="mt-3 space-y-2">
                  <input autoFocus value={cardDraft.title} onChange={(event) => setCardDraft({ ...cardDraft, title: event.target.value })} placeholder="Nombre de la tarea" className="w-full rounded-lg border border-line px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo" />
                  <select value={cardDraft.eventId} onChange={(event) => setCardDraft({ ...cardDraft, eventId: event.target.value })} className="w-full rounded-lg border border-line bg-white px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo">
                    <option value="">Sin evento vinculado</option>
                    {eventOptions.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}
                  </select>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setCardDraft(null)} className="px-2 py-1 text-xs text-ink/60">Cancelar</button>
                    <button type="submit" className="rounded bg-indigo px-2 py-1 text-xs font-medium text-white">Añadir</button>
                  </div>
                </form>
              ) : canEdit ? (
                <button type="button" onClick={() => setCardDraft({ columnId: column.id, title: '', eventId: '' })} className="mt-3 text-sm font-medium text-indigo hover:underline">+ Añadir tarjeta</button>
              ) : null}
            </div>
          )
        })}
      </div>

      {columns.length === 0 && <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-ink/50">Crea una columna para empezar tu lista de tareas.</p>}

      {historyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div><h2 className="font-display text-xl font-semibold italic text-ink">Historial de tareas</h2><p className="mt-1 text-sm text-ink/50">Selecciona un día para revisar el tablero archivado.</p></div>
              <button type="button" onClick={() => setHistoryOpen(false)} className="text-xl text-ink/40 hover:text-ink" aria-label="Cerrar historial">×</button>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {history.map((entry) => <button key={entry.id} type="button" onClick={() => setSelectedHistory(entry)} className="rounded-lg border border-line p-3 text-left text-sm text-ink hover:bg-paper">{displayDay(entry.date)} <span className="block text-xs text-ink/50">{entry.cards?.length || 0} tarjetas</span></button>)}
              {history.length === 0 && <p className="text-sm text-ink/50">Aún no hay días archivados.</p>}
            </div>
            {selectedHistory && <div className="mt-5 border-t border-line pt-4"><h3 className="font-semibold text-ink">{displayDay(selectedHistory.date)}</h3><div className="mt-3 space-y-2">{selectedHistory.cards?.map((card) => <div key={card.id} className="rounded-lg bg-paper p-3 text-sm"><span className={card.checked ? 'text-ink/40 line-through' : 'text-ink'}>{card.checked ? '✓ ' : '○ '}{card.title}</span></div>)}</div></div>}
          </div>
        </div>
      )}

      {pendingDelete && (
        <ConfirmCard
          title="Eliminar tarea"
          description={`Estás a punto de eliminar “${pendingDelete.title}”. Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          cancelLabel="Cancelar"
          danger
          onCancel={() => setPendingDelete(null)}
          onConfirm={removeCard}
        />
      )}
    </section>
  )
}
