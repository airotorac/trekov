import { useState } from 'react'
import {
  selectPlace, selectPostsAt, selectTrips, addStop, createTrip, toggleSavePlace, useStore,
} from '../lib/store'
import { compact, mapsUrl, timeAgo } from '../lib/format'
import { CalendarIcon, CloseIcon, PlusIcon, SaveIcon } from './Icons'
import Media from './Media'
import Portal from './Portal'
import PhotoViewer from './PhotoViewer'

/** What you get when you tap a place on the map: its photos, newest first. */
export default function PlaceSheet({ placeId, onClose }) {
  const [tab, setTab] = useState('recent')
  const [openPost, setOpenPost] = useState(null)
  const [tripMenu, setTripMenu] = useState(false)
  const [toast, setToast] = useState('')

  const place = useStore((s) => selectPlace(s, placeId))
  const posts = useStore((s) => selectPostsAt(s, placeId))
  const trips = useStore(selectTrips)

  if (!place) return null

  const shown = tab === 'recent' ? posts : [...posts].sort((a, b) => b.likes - a.likes)

  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 1700) }

  function addTo(tripId) {
    addStop(tripId, place.id)
    setTripMenu(false)
    flash(`Added to ${trips.find((t) => t.id === tripId).title}`)
  }

  function addToNewTrip() {
    const id = createTrip({ title: `${place.region} trip`, stops: [{ placeId: place.id, note: '' }] })
    setTripMenu(false)
    flash('New trip started')
    return id
  }

  return (
    <Portal>
      <div className="fixed inset-0 z-[1000] flex items-end justify-center" role="dialog" aria-label={place.name}>
        <button className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} aria-label="Close" />

        <div className="sheet-up relative w-full max-w-[520px] h-[80vh] flex flex-col rounded-t-3xl border-t border-line bg-ink">
          <div className="shrink-0 px-5 pt-4 pb-3 border-b border-line">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-semibold leading-tight truncate">{place.name}</h2>
                <p className="text-sm text-mist truncate">{place.region} · {place.country}</p>
              </div>
              <button onClick={onClose} className="text-mist hover:text-white p-1 shrink-0" aria-label="Close">
                <CloseIcon size={22} />
              </button>
            </div>

            {place.blurb && <p className="mt-2.5 text-sm text-white/85 leading-snug">{place.blurb}</p>}

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              {place.bestTime && (
                <span className="inline-flex items-center gap-1.5 text-sun/90 bg-sun/10 rounded-full px-2.5 py-1">
                  <CalendarIcon size={13} /> Best {place.bestTime}
                </span>
              )}
              <span className="text-mist">{place.postCount} photo{place.postCount === 1 ? '' : 's'}</span>
              <a href={mapsUrl(place)} target="_blank" rel="noreferrer" className="text-brand font-medium ml-auto">
                Open in Maps
              </a>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => flash(toggleSavePlace(place.id) ? 'Saved to To Visit' : 'Removed from To Visit')}
                aria-pressed={place.saved}
                className={`flex-1 flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold border transition
                            ${place.saved ? 'bg-brand text-ink border-brand' : 'border-line hover:border-brand hover:text-brand'}`}>
                <SaveIcon size={18} filled={place.saved} />
                {place.saved ? 'Saved' : 'Save place'}
              </button>
              <button onClick={() => setTripMenu((v) => !v)}
                      className="flex-1 flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold
                                 border border-line hover:border-brand hover:text-brand transition">
                <PlusIcon size={18} /> Add to trip
              </button>
            </div>

            {tripMenu && (
              <ul className="mt-2 rounded-2xl border border-line bg-surface divide-y divide-line overflow-hidden">
                {trips.map((t) => (
                  <li key={t.id}>
                    <button onClick={() => addTo(t.id)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-raised">
                      {t.title} <span className="text-mist">· {t.stops.length} stops</span>
                    </button>
                  </li>
                ))}
                <li>
                  <button onClick={addToNewTrip} className="w-full text-left px-4 py-2.5 text-sm text-brand font-medium hover:bg-raised">
                    + Start a new trip
                  </button>
                </li>
              </ul>
            )}

            <div className="mt-3 flex gap-1 text-sm">
              {['recent', 'top'].map((t) => (
                <button key={t} onClick={() => setTab(t)}
                        className={`px-3 py-1.5 rounded-full capitalize transition
                                    ${tab === t ? 'bg-raised text-white font-semibold' : 'text-mist hover:text-white'}`}>
                  {t === 'recent' ? 'Recent' : 'Most liked'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-1">
            {shown.length === 0 ? (
              <p className="text-center text-sm text-mist py-16">No photos here yet. Be the first.</p>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {shown.map((post) => (
                  <button key={post.id} onClick={() => setOpenPost(post.id)} className="relative aspect-square">
                    <Media media={post.media} alt={place.name} className="size-full object-cover rounded-md" />
                    <span className="absolute inset-x-0 bottom-0 px-1.5 pb-1 pt-5 text-[10px] text-left
                                     bg-gradient-to-t from-black/80 to-transparent rounded-b-md truncate block">
                      ♥ {compact(post.likes)} · {timeAgo(post.createdAt)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {toast && (
            <div className="absolute left-1/2 -translate-x-1/2 bottom-6 rounded-full bg-white text-ink
                            text-sm font-medium px-4 py-2 shadow-lg pointer-events-none">
              {toast}
            </div>
          )}
        </div>

        {openPost && <PhotoViewer postId={openPost} onClose={() => setOpenPost(null)} />}
      </div>
    </Portal>
  )
}
