import { useState } from 'react'
import { createTrip, getPlace, selectSavedPlaces, selectTrips, toggleSavePlace, useStore } from '../lib/store'
import { CalendarIcon, CloseIcon, Logo, NavIcon, PlusIcon } from './Icons'
import Media from './Media'
import TripDetail from './TripDetail'

const dateRange = (t) =>
  t.start && t.end ? `${t.start} → ${t.end}` : t.start || t.end || 'No dates yet'

export default function Trips({ onOpenPlace, open, onOpen, onNavigate }) {
  const trips = useStore(selectTrips)
  const saved = useStore(selectSavedPlaces)
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

      {/* To Visit lives here: the shortlist and the trips built from it. */}
      {saved.length > 0 && (
        <section className="px-4 pt-4">
          <h2 className="text-xs uppercase tracking-[0.14em] text-mist mb-2">
            To Visit · {saved.length}
          </h2>
          <ul className="flex gap-2 overflow-x-auto no-bar pb-1">
            {saved.map((p) => (
              <li key={p.id} className="shrink-0 w-36">
                <div className="bg-surface border border-line rounded-2xl overflow-hidden">
                  <button onClick={() => onOpenPlace(p.id)} className="block w-full text-left">
                    {p.cover
                      ? <Media media={p.cover} alt={p.name} className="w-full h-20 object-cover" />
                      : <span className="grid place-items-center w-full h-20 bg-raised"><Logo size={18} /></span>}
                    <span className="block px-2.5 pt-2">
                      <span className="block text-xs font-semibold truncate">{p.name}</span>
                      <span className="block text-[10px] text-mist truncate">{p.region}</span>
                    </span>
                  </button>
                  <div className="flex items-center gap-1 px-2.5 pb-2 pt-1.5">
                    {p.bestTime && (
                      <span className="inline-flex items-center gap-1 text-[9px] text-sun/90 bg-sun/10 rounded-full px-1.5 py-0.5">
                        <CalendarIcon size={9} /> {p.bestTime}
                      </span>
                    )}
                    <button onClick={() => onNavigate?.(p.id)} aria-label={`Navigate to ${p.name}`}
                            className="ml-auto text-brand"><NavIcon size={13} filled /></button>
                    <button onClick={() => toggleSavePlace(p.id)} aria-label={`Remove ${p.name}`}
                            className="text-mist hover:text-rose"><CloseIcon size={13} /></button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {trips.length === 0 ? (
        <div className="text-center px-10 py-16 space-y-3">
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
