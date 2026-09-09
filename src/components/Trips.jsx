import { useState } from 'react'
import { createTrip, getPlace, selectTrips, useStore } from '../lib/store'
import { PlusIcon } from './Icons'
import Media from './Media'
import TripDetail from './TripDetail'

const dateRange = (t) =>
  t.start && t.end ? `${t.start} → ${t.end}` : t.start || t.end || 'No dates yet'

export default function Trips({ onOpenPlace, open, onOpen, onNavigate }) {
  const trips = useStore(selectTrips)
  const [title, setTitle] = useState('')
  const [adding, setAdding] = useState(false)

  if (open) {
    const trip = trips.find((t) => t.id === open)
    if (trip) return <TripDetail trip={trip} onBack={() => onOpen(null)} onOpenPlace={onOpenPlace} onNavigate={onNavigate} />
  }

  function submit(e) {
    e.preventDefault()
    if (!title.trim()) return
    const id = createTrip({ title })
    setTitle(''); setAdding(false); onOpen(id)
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 h-14
                         bg-ink/85 backdrop-blur-xl border-b border-line">
        <h1 className="text-lg font-semibold">Trips</h1>
        <button onClick={() => setAdding((v) => !v)}
                className="flex items-center gap-1.5 text-sm font-semibold text-brand" aria-label="New trip">
          <PlusIcon size={18} /> New
        </button>
      </header>

      {adding && (
        <form onSubmit={submit} className="p-4 flex gap-2 border-b border-line">
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
                 placeholder="Trip name — “Spiti in June”"
                 className="flex-1 bg-raised rounded-xl px-3.5 py-2.5 text-sm outline-none placeholder:text-mist focus:ring-2 focus:ring-brand/50" />
          <button type="submit" disabled={!title.trim()}
                  className="rounded-xl bg-brand text-ink font-semibold text-sm px-4 disabled:opacity-40">
            Create
          </button>
        </form>
      )}

      {trips.length === 0 ? (
        <div className="text-center px-10 py-24 space-y-3">
          <h2 className="text-lg font-semibold">No trips yet</h2>
          <p className="text-sm text-mist leading-relaxed">
            A trip is an ordered list of places with your notes on each one. Build it from
            the map, then send the link to whoever is coming with you.
          </p>
          <button onClick={() => setAdding(true)}
                  className="mt-2 rounded-full bg-brand text-ink font-semibold text-sm px-5 py-2.5">
            Start a trip
          </button>
        </div>
      ) : (
        <ul className="p-4 space-y-3">
          {trips.map((t) => {
            const covers = t.stops.slice(0, 3).map((s) => getPlace(s.placeId)).filter(Boolean)
            return (
              <li key={t.id}>
                <button onClick={() => onOpen(t.id)}
                        className="rise w-full text-left bg-surface border border-line rounded-2xl p-4 hover:border-brand/50 transition">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-tight truncate">{t.title}</p>
                      <p className="text-xs text-mist mt-0.5">{dateRange(t)}</p>
                    </div>
                    <span className="text-xs text-mist shrink-0">
                      {t.stops.length} stop{t.stops.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  {covers.length > 0 && (
                    <p className="mt-3 text-xs text-mist truncate">
                      {covers.map((p) => p.name).join(' · ')}
                      {t.stops.length > covers.length ? ` +${t.stops.length - covers.length}` : ''}
                    </p>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
