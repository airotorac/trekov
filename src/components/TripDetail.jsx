import { useState } from 'react'
import {
  deleteTrip, getPlace, moveStop, removeStop, setStopNote, updateTrip, useStore,
} from '../lib/store'
import { encodeTrip, shareLink } from '../lib/share'
import { mapsUrl } from '../lib/format'
import { BackIcon, CalendarIcon, CloseIcon, SendIcon } from './Icons'

const MSG = {
  shared: 'Shared.',
  copied: 'Link copied — paste it to anyone.',
  cancelled: '',
  failed: 'Could not copy. Long-press the link to copy it by hand.',
}

export default function TripDetail({ trip, onBack, onOpenPlace }) {
  const places = useStore((s) => s.places)
  const [msg, setMsg] = useState('')
  const [link, setLink] = useState('')

  const stops = trip.stops.map((s) => ({ ...s, place: getPlace(s.placeId) })).filter((s) => s.place)

  async function share() {
    const url = encodeTrip(trip, places)
    setLink(url)
    const result = await shareLink(url, trip.title)
    setMsg(MSG[result])
    if (result !== 'failed') setTimeout(() => setMsg(''), 2600)
  }

  const field = 'bg-raised rounded-xl px-3 py-2 text-sm outline-none placeholder:text-mist focus:ring-2 focus:ring-brand/50'

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center gap-2 px-3 h-14
                         bg-ink/85 backdrop-blur-xl border-b border-line">
        <button onClick={onBack} className="text-mist hover:text-white p-1" aria-label="Back to trips">
          <BackIcon size={22} />
        </button>
        <input
          value={trip.title}
          onChange={(e) => updateTrip(trip.id, { title: e.target.value })}
          aria-label="Trip name"
          className="flex-1 min-w-0 bg-transparent text-lg font-semibold outline-none focus:bg-raised rounded-lg px-2 py-1"
        />
        <button onClick={share} className="flex items-center gap-1.5 text-sm font-semibold text-brand px-2" aria-label="Share trip">
          <SendIcon size={19} /> Share
        </button>
      </header>

      {msg && <p className="px-4 py-2 text-sm text-brand border-b border-line">{msg}</p>}
      {link && (
        <p className="px-4 py-2 text-[11px] text-mist break-all border-b border-line">{link}</p>
      )}

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-xs text-mist">
            <span className="flex items-center gap-1.5"><CalendarIcon size={13} /> From</span>
            <input type="date" value={trip.start} onChange={(e) => updateTrip(trip.id, { start: e.target.value })} className={field} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-mist">
            <span className="flex items-center gap-1.5"><CalendarIcon size={13} /> To</span>
            <input type="date" value={trip.end} onChange={(e) => updateTrip(trip.id, { end: e.target.value })} className={field} />
          </label>
        </div>

        <textarea
          value={trip.notes} onChange={(e) => updateTrip(trip.id, { notes: e.target.value })}
          placeholder="Trip notes — permits, who's driving, what to book first…"
          className={`${field} w-full min-h-20 resize-none`}
        />

        <h2 className="text-xs uppercase tracking-[0.14em] text-mist pt-2">Itinerary</h2>

        {stops.length === 0 ? (
          <p className="text-sm text-mist leading-relaxed py-6">
            No stops yet. Open a place on the map and choose <span className="text-brand">Add to trip</span>.
          </p>
        ) : (
          <ol className="space-y-3">
            {stops.map((s, i) => (
              <li key={s.placeId} className="bg-surface border border-line rounded-2xl p-3">
                <div className="flex items-start gap-3">
                  <span className="grid place-items-center size-7 rounded-full bg-brand/15 text-brand
                                   text-xs font-bold shrink-0 tabular-nums">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <button onClick={() => onOpenPlace(s.placeId)} className="text-left">
                      <p className="font-semibold leading-tight truncate">{s.place.name}</p>
                      <p className="text-xs text-mist truncate">{s.place.region}</p>
                    </button>
                    {s.place.bestTime && (
                      <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-sun/90 bg-sun/10 rounded-full px-2 py-0.5">
                        <CalendarIcon size={11} /> {s.place.bestTime}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <button onClick={() => moveStop(trip.id, i, -1)} disabled={i === 0}
                            className="text-mist hover:text-white disabled:opacity-25 text-xs" aria-label="Move up">▲</button>
                    <button onClick={() => moveStop(trip.id, i, 1)} disabled={i === stops.length - 1}
                            className="text-mist hover:text-white disabled:opacity-25 text-xs" aria-label="Move down">▼</button>
                  </div>
                  <button onClick={() => removeStop(trip.id, s.placeId)}
                          className="text-mist hover:text-rose p-1 shrink-0" aria-label={`Remove ${s.place.name}`}>
                    <CloseIcon size={16} />
                  </button>
                </div>

                <input
                  value={s.note}
                  onChange={(e) => setStopNote(trip.id, s.placeId, e.target.value)}
                  placeholder="Note — nights, booking, who to call…"
                  className={`${field} w-full mt-2 text-xs`}
                />
                <a href={mapsUrl(s.place)} target="_blank" rel="noreferrer"
                   className="inline-block mt-2 text-xs text-brand font-medium">Open in Maps</a>
              </li>
            ))}
          </ol>
        )}

        <button
          onClick={() => confirm(`Delete “${trip.title}”?`) && (deleteTrip(trip.id), onBack())}
          className="text-xs text-mist underline underline-offset-4 hover:text-rose pt-4">
          Delete trip
        </button>
      </div>
    </>
  )
}
