import { useEffect, useState } from 'react'
import {
  getPlace, getUser, markNotificationsRead, selectAttractionOfMonth, selectMostVisited,
  selectNewPlaces, selectNotifications, toggleSavePlace, useStore,
} from '../lib/store'
import { ago, timeAgo } from '../lib/format'
import { CalendarIcon, Logo, NavIcon, SaveIcon } from './Icons'
import Media from './Media'
import Nearby from './Nearby'

const MONTH = new Date().toLocaleString(undefined, { month: 'long' })

function Thumb({ place, className = 'size-16 rounded-xl' }) {
  return place.cover
    ? <Media media={place.cover} alt={place.name} className={`${className} object-cover shrink-0 bg-raised`} />
    : <span className={`${className} grid place-items-center bg-raised shrink-0`}><Logo size={18} /></span>
}

export default function Discover({ onOpenPlace, onNavigate }) {
  // Prefer the traveller's own position; fall back to the month's attraction
  // so the section is useful before location permission is granted.
  const [gps, setGps] = useState(null)
  useEffect(() => {
    if (!navigator.geolocation) return
    const id = navigator.geolocation.getCurrentPosition(
      (p) => setGps({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { maximumAge: 300000, timeout: 8000 },
    )
    return () => id && navigator.geolocation.clearWatch?.(id)
  }, [])
  const attraction = useStore(selectAttractionOfMonth)
  const mostVisited = useStore(selectMostVisited)
  const newPlaces = useStore(selectNewPlaces)
  const notifications = useStore(selectNotifications)
  const here = gps ?? (attraction ? { lat: attraction.lat, lng: attraction.lng } : null)
  const hereName = gps ? 'you' : attraction?.name

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 h-14
                         bg-ink/85 backdrop-blur-xl border-b border-line">
        <h1 className="text-lg font-semibold">Discover</h1>
        {notifications.some((n) => !n.read) && (
          <button onClick={markNotificationsRead} className="text-xs text-brand font-semibold">
            Mark all read
          </button>
        )}
      </header>

      <div className="p-4 space-y-8">
        {/* ---------------------------------------- attraction of the month */}
        {attraction && (
          <section>
            <h2 className="text-xs uppercase tracking-[0.14em] text-sun mb-3">
              Attraction of {MONTH}
            </h2>
            <button onClick={() => onOpenPlace(attraction.id)}
                    className="w-full text-left rounded-2xl overflow-hidden border border-sun/40 bg-surface">
              <div className="relative">
                <Thumb place={attraction} className="w-full aspect-[16/10] rounded-none" />
                <span className="absolute top-3 left-3 rounded-full bg-sun text-ink text-[10px] font-bold
                                 uppercase tracking-[0.1em] px-2.5 py-1">★ {MONTH}</span>
              </div>
              <div className="p-4">
                <p className="font-semibold leading-tight">{attraction.name}</p>
                <p className="text-xs text-mist">{attraction.region} · {attraction.country}</p>
                {attraction.blurb && (
                  <p className="text-sm text-white/85 leading-snug mt-2">{attraction.blurb}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px]">
                  {attraction.bestTime && (
                    <span className="inline-flex items-center gap-1.5 text-sun/90 bg-sun/10 rounded-full px-2.5 py-1">
                      <CalendarIcon size={12} /> Best {attraction.bestTime}
                    </span>
                  )}
                  <span className="text-mist">
                    {attraction.monthPhotos ?? 0} photo{attraction.monthPhotos === 1 ? '' : 's'} this month
                  </span>
                </div>
              </div>
            </button>
            <div className="flex gap-2 mt-2">
              <button onClick={() => toggleSavePlace(attraction.id)}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold border transition
                                  ${attraction.saved ? 'bg-brand/15 text-brand border-brand' : 'border-line hover:border-brand'}`}>
                <SaveIcon size={17} filled={attraction.saved} />
                {attraction.saved ? 'On your list' : 'Save place'}
              </button>
              <button onClick={() => onNavigate(attraction.id)}
                      className="flex-1 flex items-center justify-center gap-2 rounded-full bg-brand text-ink py-2.5 text-sm font-semibold">
                <NavIcon size={16} filled /> Navigate
              </button>
            </div>
          </section>
        )}

        {/* ------------------------------------------------- most visited */}
        {mostVisited.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-[0.14em] text-mist mb-1">Most visited</h2>
            <p className="text-[11px] text-mist mb-3">
              Ranked by how many different people have photographed the place — and photos
              can only be taken there, in the app.
            </p>
            <ol className="space-y-2">
              {mostVisited.slice(0, 8).map((p, i) => (
                <li key={p.id}>
                  <button onClick={() => onOpenPlace(p.id)}
                          className="w-full flex items-center gap-3 bg-surface border border-line rounded-2xl p-2.5 text-left hover:border-brand/50">
                    <span className="grid place-items-center size-7 rounded-full bg-brand/15 text-brand
                                     text-xs font-bold shrink-0 tabular-nums">{i + 1}</span>
                    <Thumb place={p} className="size-14 rounded-xl" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold truncate">{p.name}</span>
                      <span className="block text-xs text-mist truncate">{p.region}</span>
                    </span>
                    <span className="text-right shrink-0">
                      <span className="block text-sm font-semibold tabular-nums">{p.visitors}</span>
                      <span className="block text-[10px] text-mist">visitor{p.visitors === 1 ? '' : 's'}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Around wherever the traveller is, or the month's attraction. */}
        <Nearby centre={here} centreName={hereName} />

        {/* --------------------------------------------------- new places */}
        <section>
          <h2 className="text-xs uppercase tracking-[0.14em] text-mist mb-3">Recently added</h2>
          {newPlaces.length === 0 ? (
            <p className="text-sm text-mist leading-relaxed">
              No new places yet. Add one from the camera screen and everyone gets told.
            </p>
          ) : (
            <ul className="space-y-2">
              {newPlaces.map((p) => (
                <li key={p.id}>
                  <button onClick={() => onOpenPlace(p.id)}
                          className="w-full flex items-center gap-3 bg-surface border border-line rounded-2xl p-2.5 text-left hover:border-brand/50">
                    <Thumb place={p} className="size-14 rounded-xl" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold truncate">{p.name}</span>
                      <span className="block text-xs text-mist truncate">
                        {p.region} · added {ago(p.addedAt)} by @{getUser(p.addedBy).handle}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* -------------------------------------------------- alert feed */}
        {notifications.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-[0.14em] text-mist mb-3">Alerts</h2>
            <ul className="space-y-1.5">
              {notifications.map((n) => {
                const place = getPlace(n.placeId)
                return (
                  <li key={n.id}>
                    <button onClick={() => place && onOpenPlace(place.id)}
                            className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm
                                        ${n.read ? 'text-mist' : 'bg-brand/10 text-white'}`}>
                      {!n.read && <span className="size-1.5 rounded-full bg-brand shrink-0" />}
                      <span className="min-w-0 flex-1 truncate">
                        <span className="font-semibold">@{getUser(n.by).handle}</span> added{' '}
                        <span className="font-semibold">{place?.name ?? 'a new place'}</span>
                      </span>
                      <span className="text-[11px] text-mist shrink-0">{timeAgo(n.at)}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )}
      </div>
    </>
  )
}
