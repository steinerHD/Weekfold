import { useEffect, useRef, useState } from 'react'
import { HOURS, isSameDay } from '../utils/dateUtils'

// Defaults; will be adapted on mount/resize for small screens
const DEFAULT_HOUR_HEIGHT = 52
const DEFAULT_BODY_HEIGHT = 560

function toMinutes(date) {
  return date.getHours() * 60 + date.getMinutes()
}

function withAlpha(hex, alpha) {
  return `${hex}${alpha}`
}

export default function WeekView({ days, events, onSlotClick, onEventClick }) {
  const today = new Date()
  const bodyRef = useRef(null)
  const [hourHeight, setHourHeight] = useState(DEFAULT_HOUR_HEIGHT)
  const [bodyHeight, setBodyHeight] = useState(DEFAULT_BODY_HEIGHT)

  useEffect(() => {
    function applySizes() {
      const w = window.innerWidth
      if (w < 380) {
        setHourHeight(30)
        setBodyHeight(300)
      } else if (w < 500) {
        setHourHeight(34)
        setBodyHeight(340)
      } else if (w < 640) {
        setHourHeight(38)
        setBodyHeight(400)
      } else if (w < 900) {
        setHourHeight(44)
        setBodyHeight(480)
      } else {
        setHourHeight(DEFAULT_HOUR_HEIGHT)
        setBodyHeight(DEFAULT_BODY_HEIGHT)
      }
    }
    applySizes()
    window.addEventListener('resize', applySizes)
    return () => window.removeEventListener('resize', applySizes)
  }, [])

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = 7 * hourHeight - 40
    }
  }, [hourHeight])

  return (
    <div className="border border-line rounded-xl bg-white overflow-hidden text-[12px] sm:text-sm">
      <div ref={bodyRef} className="overflow-auto" style={{ maxHeight: bodyHeight }}>
        <div className="min-w-[420px] sm:min-w-0">
          <div className="sticky top-0 z-20 grid grid-cols-[2.5rem_minmax(0,1fr)] sm:grid-cols-[3.5rem_minmax(0,1fr)] border-b border-line bg-white">
            <div className="border-r border-line" />
            <div className="grid grid-cols-7">
              {days.map((day) => {
                const isToday = isSameDay(day, today)
                return (
                  <div
                    key={day.toISOString()}
                    className="h-14 border-l border-line first:border-l-0 flex flex-col items-center justify-center gap-0.5"
                  >
                    <span className="text-[10px] font-mono uppercase tracking-wide text-ink/40">
                      {day.toLocaleDateString('es', { weekday: 'short' }).replace('.', '')}
                    </span>
                    {isToday ? (
                      <span className="w-6 h-6 rounded-full bg-indigo text-white text-xs font-semibold flex items-center justify-center">
                        {day.getDate()}
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-ink">{day.getDate()}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] sm:grid-cols-[3.5rem_minmax(0,1fr)]">
            <div className="border-r border-line bg-white">
              {HOURS.map((h) => (
                <div key={h} style={{ height: hourHeight }} className="relative font-mono text-ink/35 text-right">
                  {h > 0 && (
                    <span className="absolute -top-2 right-1 sm:right-2 text-[10px] leading-none">
                      {String(h).padStart(2, '0')}:00
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 min-w-0">
              {days.map((day) => {
                const dayEvents = events.filter((ev) => isSameDay(ev.start, day))
                return (
                  <div key={day.toISOString()} className="border-l border-line first:border-l-0 relative">
                    <div className="relative" style={{ height: hourHeight * 24 }}>
                      {HOURS.map((h) => (
                        <div
                          key={h}
                          onClick={() => onSlotClick(day, h)}
                          style={{ height: hourHeight }}
                          className="border-b border-line/60 hover:bg-indigo-soft/40 cursor-pointer"
                        />
                      ))}

                      {dayEvents.map((ev) => {
                        const color = ev.color || '#4F46E5'
                        const top = (toMinutes(ev.start) / 60) * hourHeight
                        const height = Math.max(((toMinutes(ev.end) - toMinutes(ev.start)) / 60) * hourHeight, 18)
                        return (
                          <button
                            key={ev.id + ev.start.toISOString()}
                            onClick={(e) => {
                              e.stopPropagation()
                              onEventClick(ev)
                            }}
                            style={{
                              top,
                              height,
                              backgroundColor: withAlpha(color, '1A'),
                              borderLeft: `3px solid ${color}`,
                              color,
                            }}
                            className="absolute left-1 right-1 rounded-md px-2 py-1 text-left text-[10px] sm:text-[11px] overflow-hidden hover:brightness-95"
                          >
                            <span className="font-semibold block truncate">{ev.title}</span>
                            <span className="font-mono opacity-70 block truncate">
                              {ev.start.toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              })}
                            </span>
                            {ev.description && (
                              <span className="hidden sm:block mt-0.5 truncate opacity-80">{ev.description}</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
