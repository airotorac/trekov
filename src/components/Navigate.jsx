import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import { bearing, compassPoint, distance, formatDistance, formatDuration } from '../lib/geo'
import { getRoute, instruction } from '../lib/route'
import { colourFor, joinParty } from '../lib/party'
import { downloadTiles, tilesForRoute } from '../lib/offline'
import { BackIcon, CalendarIcon, Logo } from './Icons'
import Portal from './Portal'

const TILE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

/** Nearest point on the route to the user, used for "distance remaining". */
function remainingAlong(coords, here) {
  if (!coords?.length) return null
  let best = 0
  let bestD = Infinity
  for (let i = 0; i < coords.length; i++) {
    const d = distance(here, { lat: coords[i][0], lng: coords[i][1] })
    if (d < bestD) { bestD = d; best = i }
  }
  let left = bestD
  for (let i = best; i < coords.length - 1; i++) {
    left += distance(
      { lat: coords[i][0], lng: coords[i][1] },
      { lat: coords[i + 1][0], lng: coords[i + 1][1] },
    )
  }
  return { left, offRoute: bestD > 150 }
}

export default function Navigate({ place, trip, me, onClose }) {
  const host = useRef(null)
  const map = useRef(null)
  const meMarker = useRef(null)
  const partyLayer = useRef(null)
  const partyRef = useRef(null)

  const [pos, setPos] = useState(null)
  const [gpsError, setGpsError] = useState('')
  const [route, setRoute] = useState(null)
  const [routeState, setRouteState] = useState('idle') // idle | loading | ready | none
  const [online, setOnline] = useState(navigator.onLine)
  const [members, setMembers] = useState([])
  const [saving, setSaving] = useState(null)
  const [follow, setFollow] = useState(true)

  const dest = useMemo(() => ({ lat: place.lat, lng: place.lng }), [place.lat, place.lng])

  /* -------------------------------------------------------------- position */
  useEffect(() => {
    if (!navigator.geolocation) return setGpsError('This device has no location support.')
    const id = navigator.geolocation.watchPosition(
      (p) => { setGpsError(''); setPos({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }) },
      (e) => setGpsError(e.code === 1
        ? 'Location permission denied. Allow it to navigate.'
        : 'Waiting for a GPS fix…'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [])

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  /* ------------------------------------------------------------------- map */
  useEffect(() => {
    const m = L.map(host.current, { zoomControl: false, attributionControl: false }).setView([dest.lat, dest.lng], 9)
    L.tileLayer(TILE, { maxZoom: 18 }).addTo(m)
    L.marker([dest.lat, dest.lng], {
      icon: L.divIcon({ className: 'tk-marker', html: '<div class="tk-pin"><div class="tk-pin-img"></div></div>', iconSize: [54, 60], iconAnchor: [27, 56] }),
    }).addTo(m)
    partyLayer.current = L.layerGroup().addTo(m)
    m.on('dragstart', () => setFollow(false))
    map.current = m
    setTimeout(() => m.invalidateSize(), 0)
    return () => { m.remove(); map.current = null }
  }, [dest])

  // Draw the route once we have one.
  useEffect(() => {
    if (!map.current || !route?.coordinates?.length) return
    const line = L.polyline(route.coordinates, { color: '#00C08B', weight: 5, opacity: .9 }).addTo(map.current)
    const casing = L.polyline(route.coordinates, { color: '#0B0F0E', weight: 9, opacity: .5 }).addTo(map.current)
    casing.bringToBack()
    map.current.fitBounds(line.getBounds(), { padding: [40, 40] })
    return () => { line.remove(); casing.remove() }
  }, [route])

  // Keep our own marker in step with the GPS.
  useEffect(() => {
    if (!map.current || !pos) return
    if (!meMarker.current) {
      meMarker.current = L.circleMarker([pos.lat, pos.lng], {
        radius: 8, color: '#fff', weight: 3, fillColor: '#5AA9FF', fillOpacity: 1,
      }).addTo(map.current)
    } else {
      meMarker.current.setLatLng([pos.lat, pos.lng])
    }
    if (follow) map.current.setView([pos.lat, pos.lng], Math.max(map.current.getZoom(), 13), { animate: true })
  }, [pos, follow])

  /* ----------------------------------------------------------------- route */
  useEffect(() => {
    if (!pos || routeState === 'loading' || route) return
    setRouteState('loading')
    getRoute(pos, dest).then((r) => {
      setRoute(r)
      setRouteState(r ? 'ready' : 'none')
    })
  }, [pos, dest, route, routeState])

  /* ----------------------------------------------------------------- party */
  useEffect(() => {
    if (!trip) return
    partyRef.current = joinParty(trip.id, me, setMembers)
    return () => { partyRef.current?.leave(); partyRef.current = null }
  }, [trip, me])

  useEffect(() => { if (pos && partyRef.current) partyRef.current.update(pos) }, [pos])

  // Party markers.
  useEffect(() => {
    if (!partyLayer.current) return
    partyLayer.current.clearLayers()
    for (const m of members) {
      L.circleMarker([m.lat, m.lng], {
        radius: 8, color: '#0B0F0E', weight: 3, fillColor: colourFor(m.id), fillOpacity: 1,
      }).bindTooltip(m.name, { direction: 'top', offset: [0, -8] }).addTo(partyLayer.current)
    }
  }, [members])

  /* ------------------------------------------------------------ derivation */
  const straight = pos ? distance(pos, dest) : null
  const heading = pos ? bearing(pos, dest) : null
  const progress = pos && route ? remainingAlong(route.coordinates, pos) : null
  const remaining = progress?.left ?? straight

  const nextStep = useMemo(() => {
    if (!pos || !route?.steps?.length) return null
    let best = null
    let bestD = Infinity
    for (const s of route.steps) {
      if (s.lat == null) continue
      const d = distance(pos, { lat: s.lat, lng: s.lng })
      if (d < bestD) { bestD = d; best = { ...s, away: d } }
    }
    return best
  }, [pos, route])

  const eta = route && remaining != null
    ? formatDuration(route.duration * (remaining / Math.max(route.distance, 1)))
    : null

  async function saveOffline() {
    const urls = route?.coordinates?.length
      ? tilesForRoute(route.coordinates)
      : tilesForRoute([[dest.lat, dest.lng]])
    setSaving({ done: 0, total: urls.length })
    try {
      const { failed } = await downloadTiles(urls, (done, total) => setSaving({ done, total }))
      setSaving({ done: urls.length, total: urls.length, finished: true, failed })
    } catch (e) {
      setSaving({ error: e.message })
    }
  }

  return (
    <Portal>
      <div className="fixed inset-0 z-[1400] bg-ink flex flex-col" role="dialog" aria-label={`Navigate to ${place.name}`}>
        <header className="flex items-center gap-2 px-3 h-14 border-b border-line shrink-0">
          <button onClick={onClose} className="text-mist hover:text-white p-1" aria-label="Stop navigating">
            <BackIcon size={22} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-tight truncate">{place.name}</p>
            <p className="text-xs text-mist truncate">{place.region}</p>
          </div>
          {!online && (
            <span className="text-[10px] font-semibold text-sun bg-sun/15 rounded-full px-2 py-1 shrink-0">OFFLINE</span>
          )}
        </header>

        <div className="relative flex-1 min-h-0">
          <div ref={host} className="absolute inset-0 bg-raised" />

          {/* Turn instruction rides on the map, like any nav app. */}
          <div className="absolute inset-x-3 top-3 z-[500] space-y-2">
            {nextStep && (
              <div className="rounded-2xl bg-ink/92 backdrop-blur-xl border border-line p-3">
                <p className="text-sm font-semibold leading-tight">{instruction(nextStep)}</p>
                <p className="text-xs text-mist mt-0.5">in {formatDistance(nextStep.away)}</p>
              </div>
            )}
            {progress?.offRoute && (
              <p className="rounded-xl bg-rose/20 backdrop-blur-xl border border-rose/40 text-rose text-xs px-3 py-2">
                You're more than 150 m off the route.
              </p>
            )}
          </div>

          {!follow && pos && (
            <button onClick={() => setFollow(true)}
                    className="absolute right-3 bottom-3 z-[500] rounded-full bg-brand text-ink text-xs font-semibold px-3 py-2">
              Recentre
            </button>
          )}
        </div>

        <div className="shrink-0 border-t border-line p-4 space-y-3 max-h-[46vh] overflow-y-auto
                        pb-[max(1rem,env(safe-area-inset-bottom))]">
          {gpsError && <p className="text-sm text-sun">{gpsError}</p>}

          <div className="flex items-center gap-4">
            {/* Bearing arrow. Needs no network — this is the offline fallback. */}
            <div className="relative size-16 rounded-full border border-line grid place-items-center shrink-0">
              <span className="text-2xl leading-none transition-transform"
                    style={{ transform: `rotate(${heading ?? 0}deg)` }} aria-hidden="true">↑</span>
              <span className="absolute -bottom-2 text-[10px] text-mist bg-ink px-1">
                {heading != null ? compassPoint(heading) : '—'}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-2xl font-semibold tabular-nums leading-none">
                {remaining != null ? formatDistance(remaining) : '—'}
              </p>
              <p className="text-xs text-mist mt-1">
                {routeState === 'loading' && 'Finding a route…'}
                {routeState === 'none' && 'No road route — showing straight-line direction.'}
                {routeState === 'ready' && route && (
                  <>
                    {eta} by road{route.stale ? ' · cached route' : ''}
                    {' · '}{formatDistance(straight)} direct
                  </>
                )}
                {routeState === 'idle' && 'Waiting for your location…'}
              </p>
            </div>
          </div>

          {place.bestTime && (
            <p className="inline-flex items-center gap-1.5 text-[11px] text-sun/90 bg-sun/10 rounded-full px-2.5 py-1">
              <CalendarIcon size={12} /> Best {place.bestTime}
            </p>
          )}

          {trip && (
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-mist mb-2">
                Travelling together · {trip.title}
              </p>
              {members.length === 0 ? (
                <p className="text-xs text-mist">
                  Nobody else is navigating yet. Anyone who opens this trip and starts
                  navigating shows up here.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {members.map((m) => (
                    <li key={m.id} className="flex items-center gap-2 text-sm">
                      <span className="size-2.5 rounded-full shrink-0" style={{ background: colourFor(m.id) }} />
                      <span className="truncate flex-1">{m.name}</span>
                      <span className="text-xs text-mist tabular-nums shrink-0">
                        {pos ? formatDistance(distance(pos, m)) : '—'} away
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button onClick={saveOffline} disabled={!!saving && !saving.finished && !saving.error}
                    className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold
                               hover:border-brand hover:text-brand disabled:opacity-50">
              <Logo size={15} /> Save map offline
            </button>
            {saving && !saving.error && (
              <span className="text-xs text-mist tabular-nums">
                {saving.finished
                  ? `Saved${saving.failed ? ` · ${saving.failed} tiles failed` : ''}`
                  : `${saving.done}/${saving.total}`}
              </span>
            )}
            {saving?.error && <span className="text-xs text-rose">{saving.error}</span>}
          </div>
        </div>
      </div>
    </Portal>
  )
}
