import { useEffect, useMemo, useRef, useState } from 'react'
import { bearing, compassPoint, distance, formatDistance, formatDuration } from '../lib/geo'
import { getRoute, instruction } from '../lib/route'
import { colourFor, joinParty } from '../lib/party'
import { downloadTiles, tilesForRoute } from '../lib/offline'
import { createMap } from '../lib/mapDrivers'
import { COLOURS, vehicleSvg } from '../lib/vehicleArt'
import { BackIcon, CalendarIcon, Logo } from './Icons'
import { VEHICLES } from './VehicleIcons'
import Portal from './Portal'

/** Street level. Esri imagery tops out at 18; 17 keeps a block of context. */
const NAV_ZOOM = 17
/** How far ahead of the vehicle to centre, as a fraction of the map height. */
const LOOK_AHEAD = 0.2
const PIN_HTML = '<div class="tk-pin"><div class="tk-pin-img"></div></div>'

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const pref = (key, fallback) => localStorage.getItem(key) ?? fallback

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
    left += distance({ lat: coords[i][0], lng: coords[i][1] }, { lat: coords[i + 1][0], lng: coords[i + 1][1] })
  }
  return { left, offRoute: bestD > 150 }
}

export default function Navigate({ place, trip, me, onClose }) {
  const host = useRef(null)
  const drv = useRef(null)            // the map driver, Google or Leaflet
  const meMarker = useRef(null)
  const routeLines = useRef([])
  const trailLines = useRef([])
  const partyMarkers = useRef([])
  const partyRef = useRef(null)
  const lastPos = useRef(null)
  const trail = useRef([])
  // Snap to NAV_ZOOM on the first fix and whenever the user recentres; in
  // between, respect whatever zoom they pinched to.
  const resetZoom = useRef(true)

  const [engine, setEngine] = useState(null)   // 'google' | 'leaflet' once ready
  const [pos, setPos] = useState(null)
  const [gpsError, setGpsError] = useState('')
  const [route, setRoute] = useState(null)
  const [routeState, setRouteState] = useState('idle') // idle | loading | ready | none
  const [online, setOnline] = useState(navigator.onLine)
  const [members, setMembers] = useState([])
  const [saving, setSaving] = useState(null)
  const [follow, setFollow] = useState(true)
  const [heading, setHeading] = useState(null)
  const [moving, setMoving] = useState(false)
  const [vehicle, setVehicle] = useState(() => pref('trekov.vehicle', 'car'))
  const [colour, setColour] = useState(() => pref('trekov.vehicleColour', 'green'))
  const [mapType, setMapType] = useState(() => pref('trekov.navMapType', 'roadmap'))
  const [traffic, setTraffic] = useState(() => pref('trekov.traffic', '1') === '1')

  const dest = useMemo(() => ({ lat: place.lat, lng: place.lng }), [place.lat, place.lng])
  const bearingToDest = pos ? bearing(pos, dest) : null

  /* --------------------------------------------------------- preferences */
  useEffect(() => { localStorage.setItem('trekov.vehicle', vehicle) }, [vehicle])
  useEffect(() => { localStorage.setItem('trekov.vehicleColour', colour) }, [colour])
  useEffect(() => { localStorage.setItem('trekov.navMapType', mapType); drv.current?.setMapType(mapType) }, [mapType, engine])
  useEffect(() => { localStorage.setItem('trekov.traffic', traffic ? '1' : '0'); drv.current?.setTraffic(traffic) }, [traffic, engine])

  /* ------------------------------------------------------------ position */
  useEffect(() => {
    if (!navigator.geolocation) return setGpsError('This device has no location support.')
    const id = navigator.geolocation.watchPosition(
      (p) => {
        setGpsError('')
        setPos({
          lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy,
          gpsSpeed: Number.isFinite(p.coords.speed) ? p.coords.speed : null,
          t: Date.now(),
        })
      },
      (e) => setGpsError(e.code === 1 ? 'Location permission denied. Allow it to navigate.' : 'Waiting for a GPS fix…'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [])

  useEffect(() => {
    if (!pos) return
    const prev = lastPos.current
    if (prev) {
      const metres = distance(prev, pos)
      if (metres > 5) setHeading(bearing(prev, pos))       // below ~5m it is jitter
      const secs = Math.max((pos.t - prev.t) / 1000, 0.001)
      setMoving((pos.gpsSpeed ?? metres / secs) > 0.7)     // ~2.5 km/h
    }
    lastPos.current = pos
    trail.current = [...trail.current, pos].slice(-14)
  }, [pos])

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  /* ----------------------------------------------------------------- map */
  useEffect(() => {
    let alive = true
    let offDrag = () => {}
    createMap(host.current, { center: [dest.lat, dest.lng], zoom: 9, mapType }).then((d) => {
      if (!alive) { d.destroy(); return }
      drv.current = d
      d.htmlMarker([dest.lat, dest.lng], PIN_HTML, { size: [54, 60], anchor: [27, 56] })
      offDrag = d.onDragStart(() => setFollow(false))
      setEngine(d.kind)
    })
    return () => {
      alive = false
      offDrag()
      drv.current?.destroy()
      drv.current = null
      meMarker.current = null
      routeLines.current = []
      trailLines.current = []
      partyMarkers.current = []
      setEngine(null)
    }
    // mapType is read once at creation; later changes go through setMapType.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dest])

  // Route line. Deliberately no fitBounds: a 600km route would zoom the map
  // out to the whole country, and on a laptop the next GPS fix that would
  // zoom it back in may never come. Overview is a button instead.
  useEffect(() => {
    const d = drv.current
    if (!d) return
    routeLines.current.forEach((l) => l.remove())
    routeLines.current = []
    if (!route?.coordinates?.length) return
    routeLines.current = [
      d.polyline(route.coordinates, { color: '#0B0F0E', weight: 9, opacity: .5, back: true }),
      d.polyline(route.coordinates, { color: '#00C08B', weight: 5, opacity: .9 }),
    ]
  }, [route, engine])

  // Comet trail of recent fixes: one line per segment, since neither engine
  // can gradient a single polyline.
  useEffect(() => {
    const d = drv.current
    if (!d) return
    trailLines.current.forEach((l) => l.remove())
    trailLines.current = []
    const pts = trail.current
    if (!moving || pts.length < 2) return
    for (let i = 1; i < pts.length; i++) {
      const k = i / (pts.length - 1)
      trailLines.current.push(d.polyline(
        [[pts[i - 1].lat, pts[i - 1].lng], [pts[i].lat, pts[i].lng]],
        { color: '#3DDC97', opacity: 0.08 + k * 0.55, weight: 2 + k * 4 },
      ))
    }
  }, [pos, moving, engine])

  // Our own marker: the chosen vehicle in the chosen colour, rotated to the
  // way we are moving. Rotation lives on the outer node, motion on the inner.
  useEffect(() => {
    const d = drv.current
    if (!d || !pos) return
    const rotate = heading ?? bearingToDest ?? 0
    // Dust is real elements rather than one pseudo-element: several puffs on
    // staggered delays billow, where a single blurred blob just sat there.
    const dust = moving
      ? `<span class="tk-dust ${vehicle === 'bike' ? 'is-bike' : ''}">
           <i style="--dx:-6px"></i><i style="--dx:5px"></i><i style="--dx:-2px"></i><i style="--dx:7px"></i><i style="--dx:1px"></i>
         </span>`
      : ''
    const html = `<div class="tk-me" style="--rot:${rotate}deg">
                    <div class="tk-me-inner ${moving ? 'is-moving' : 'is-idle'}">
                      ${dust}
                      ${vehicleSvg(vehicle, { colour, size: 40, id: 'mk' })}
                    </div>
                  </div>`
    if (!meMarker.current) {
      meMarker.current = d.htmlMarker([pos.lat, pos.lng], html, { size: [44, 44], zIndex: 1000 })
    } else {
      meMarker.current.setLatLng([pos.lat, pos.lng])
      meMarker.current.setHtml(html)
    }
    if (follow) {
      const z = resetZoom.current ? NAV_ZOOM : d.getZoom()
      resetZoom.current = false
      if (z !== d.getZoom()) d.setView([pos.lat, pos.lng], z, { animate: false })
      // Centre a little ahead of the vehicle so it rides in the lower part of
      // the map and the road you are about to drive fills the rest.
      const rad = (rotate * Math.PI) / 180
      const dist = d.size().y * LOOK_AHEAD
      d.setView(d.offsetLatLng([pos.lat, pos.lng], Math.sin(rad) * dist, -Math.cos(rad) * dist), z)
    }
  }, [pos, follow, heading, vehicle, colour, bearingToDest, moving, engine])

  /* --------------------------------------------------------------- route */
  // The route depends on the vehicle (Google serves bikes differently), so a
  // vehicle change invalidates any fetch in flight and starts over.
  //
  // Staleness is a sequence number, not an effect cleanup: the fetch effect
  // depends on `pos`, and a cleanup there would cancel the request on every
  // GPS tick — so the route would never land while the vehicle was moving.
  const fetchSeq = useRef(0)
  useEffect(() => { fetchSeq.current++; setRoute(null); setRouteState('idle') }, [vehicle])
  useEffect(() => () => { fetchSeq.current++ }, [])

  useEffect(() => {
    if (!pos || routeState !== 'idle') return
    setRouteState('loading')
    const id = ++fetchSeq.current
    getRoute(pos, dest, vehicle).then((r) => {
      if (id !== fetchSeq.current) return
      setRoute(r)
      setRouteState(r ? 'ready' : 'none')
    })
  }, [pos, dest, vehicle, routeState])

  /* --------------------------------------------------------------- party */
  useEffect(() => {
    if (!trip) return
    partyRef.current = joinParty(trip.id, me, setMembers)
    return () => { partyRef.current?.leave(); partyRef.current = null }
  }, [trip, me])

  useEffect(() => { if (pos && partyRef.current) partyRef.current.update(pos) }, [pos])

  useEffect(() => {
    const d = drv.current
    if (!d) return
    partyMarkers.current.forEach((m) => m.remove())
    partyMarkers.current = members.map((m) => {
      const c = colourFor(m.id)
      return d.htmlMarker([m.lat, m.lng],
        `<div class="tk-party"><b style="color:${c}">${esc(m.name)}</b><i style="background:${c}"></i></div>`,
        { size: [18, 18], zIndex: 900 })
    })
  }, [members, engine])

  /* ---------------------------------------------------------- derivation */
  const straight = pos ? distance(pos, dest) : null
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

  const frac = route && remaining != null ? remaining / Math.max(route.distance, 1) : 0
  const eta = route ? formatDuration((route.durationInTraffic ?? route.duration) * frac) : null

  /* ------------------------------------------------------------- actions */
  function recentre() { resetZoom.current = true; setFollow(true) }

  function overview() {
    const d = drv.current
    if (!d) return
    setFollow(false)
    const line = routeLines.current[1]
    if (line) d.fitBounds(line.bounds())
    else if (pos) d.fitBounds([[pos.lat, pos.lng], [dest.lat, dest.lng]])
  }

  function cycleMapType() {
    const types = drv.current?.mapTypes() ?? []
    if (!types.length) return
    const i = types.findIndex((t) => t.id === mapType)
    setMapType(types[(i + 1) % types.length].id)
  }

  async function saveOffline() {
    const urls = tilesForRoute(route?.coordinates?.length ? route.coordinates : [[dest.lat, dest.lng]])
    setSaving({ done: 0, total: urls.length })
    try {
      const { failed } = await downloadTiles(urls, (done, total) => setSaving({ done, total }))
      setSaving({ done: urls.length, total: urls.length, finished: true, failed })
    } catch (e) {
      setSaving({ error: e.message })
    }
  }

  const mapTypeLabel = drv.current?.mapTypes().find((t) => t.id === mapType)?.label ?? 'Map'

  return (
    <Portal>
      <div className="fixed inset-0 z-[1400] bg-black flex justify-center" role="dialog" aria-label={`Navigate to ${place.name}`}>
        <div className="w-full max-w-[520px] h-full bg-ink flex flex-col sm:border-x sm:border-line">
          <header className="flex items-center gap-2 px-3 h-14 border-b border-line shrink-0">
            <button onClick={onClose} className="text-mist hover:text-white p-1" aria-label="Stop navigating">
              <BackIcon size={22} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-tight truncate">{place.name}</p>
              <p className="text-xs text-mist truncate">{place.region}</p>
            </div>
            {/* Guidance starts as soon as this screen opens — say so, since
                there is no button to press and people look for one. */}
            <span className={`flex items-center gap-1.5 text-[10px] font-semibold rounded-full px-2 py-1 shrink-0
                              ${pos ? 'text-brand bg-brand/15' : 'text-mist bg-raised'}`}>
              <span className={`size-1.5 rounded-full ${pos ? 'bg-brand animate-pulse' : 'bg-mist'}`} />
              {pos ? 'NAVIGATING' : 'WAITING FOR GPS'}
            </span>
            {!online && (
              <span className="text-[10px] font-semibold text-sun bg-sun/15 rounded-full px-2 py-1 shrink-0">OFFLINE</span>
            )}
          </header>

          <div className="relative flex-1 min-h-0">
            <div ref={host} className="absolute inset-0 bg-raised" />

            <div className="absolute inset-x-3 top-3 z-[500] space-y-2">
              {nextStep && (
                <div className="rounded-2xl bg-ink/92 backdrop-blur-xl border border-line p-3">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-brand mb-1">Next</p>
                  <p className="text-sm font-semibold leading-tight">{instruction(nextStep)}</p>
                  <p className="text-xs text-mist mt-0.5">in {formatDistance(nextStep.away)}</p>
                </div>
              )}
              {progress?.offRoute && (
                <p className="rounded-xl bg-rose/20 backdrop-blur-xl border border-rose/40 text-rose text-xs px-3 py-2">
                  You're more than 150 m off the route.
                </p>
              )}
              {route?.modeFallback && vehicle === 'bike' && (
                <p className="rounded-xl bg-sun/15 backdrop-blur-xl border border-sun/40 text-sun text-xs px-3 py-2">
                  Bike routing isn't available here — showing the car route.
                </p>
              )}
            </div>

            <div className="absolute right-3 bottom-3 z-[500] flex flex-col items-end gap-2">
              {engine === 'google' && (
                <>
                  <button onClick={() => setTraffic((v) => !v)} aria-pressed={traffic}
                          className={`rounded-full backdrop-blur-xl border text-xs font-semibold px-3 py-2 transition
                                      ${traffic ? 'bg-brand text-ink border-brand' : 'bg-ink/90 border-line hover:border-brand'}`}>
                    Traffic
                  </button>
                  <button onClick={cycleMapType}
                          className="rounded-full bg-ink/90 backdrop-blur-xl border border-line text-xs font-semibold px-3 py-2 hover:border-brand">
                    {mapTypeLabel} ▾
                  </button>
                </>
              )}
              <button onClick={overview}
                      className="rounded-full bg-ink/90 backdrop-blur-xl border border-line text-xs font-semibold px-3 py-2 hover:border-brand">
                Overview
              </button>
              {!follow && pos && (
                <button onClick={recentre} className="rounded-full bg-brand text-ink text-xs font-semibold px-3 py-2">
                  Recentre
                </button>
              )}
            </div>
          </div>

          <div className="shrink-0 border-t border-line p-4 space-y-3 max-h-[46vh] overflow-y-auto
                          pb-[max(1rem,env(safe-area-inset-bottom))]">
            {gpsError && <p className="text-sm text-sun">{gpsError}</p>}

            <div className="flex items-center gap-4">
              {/* Bearing arrow. Needs no network — the offline fallback. */}
              <div className="relative size-16 rounded-full border border-line grid place-items-center shrink-0">
                <span className="text-2xl leading-none transition-transform"
                      style={{ transform: `rotate(${bearingToDest ?? 0}deg)` }} aria-hidden="true">↑</span>
                <span className="absolute -bottom-2 text-[10px] text-mist bg-ink px-1">
                  {bearingToDest != null ? compassPoint(bearingToDest) : '—'}
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
                      {eta}{route.durationInTraffic ? ' in current traffic' : ' by road'}
                      {route.stale ? ' · cached route' : ''}
                      {' · '}{formatDistance(straight)} direct
                    </>
                  )}
                  {routeState === 'idle' && 'Waiting for your location…'}
                </p>
              </div>
            </div>

            {/* Vehicle and colour: drive the map marker, and are remembered. */}
            <div className="flex items-center gap-2">
              {VEHICLES.map(({ id, label, Icon }) => {
                const on = vehicle === id
                return (
                  <button key={id} onClick={() => setVehicle(id)} aria-pressed={on}
                          className={`flex-1 flex items-center justify-center gap-2 rounded-2xl border py-2 transition
                                      ${on ? 'border-brand bg-brand/12' : 'border-line hover:border-mist'}`}>
                    <Icon size={34} id={`sel-${id}`} colour={colour} />
                    <span className={`text-sm font-semibold ${on ? 'text-brand' : 'text-mist'}`}>{label}</span>
                  </button>
                )
              })}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-bar py-0.5" role="radiogroup" aria-label="Vehicle colour">
              {COLOURS.map((c) => (
                <button key={c.id} onClick={() => setColour(c.id)} role="radio" aria-checked={colour === c.id}
                        aria-label={c.label} title={c.label}
                        className={`shrink-0 size-7 rounded-full border-2 transition
                                    ${colour === c.id ? 'border-white scale-110' : 'border-transparent hover:border-mist'}`}
                        style={{ background: `linear-gradient(135deg, ${c.tint.hi}, ${c.tint.mid} 55%, ${c.tint.lo})` }} />
              ))}
            </div>

            {place.bestTime && (
              <p className="inline-flex items-center gap-1.5 text-[11px] text-sun/90 bg-sun/10 rounded-full px-2.5 py-1">
                <CalendarIcon size={12} /> Best {place.bestTime}
              </p>
            )}

            {trip && (
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-mist mb-2">Travelling together · {trip.title}</p>
                {members.length === 0 ? (
                  <p className="text-xs text-mist">
                    Nobody else is navigating yet. Anyone who opens this trip and starts navigating shows up here.
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
                  {saving.finished ? `Saved${saving.failed ? ` · ${saving.failed} tiles failed` : ''}` : `${saving.done}/${saving.total}`}
                </span>
              )}
              {saving?.error && <span className="text-xs text-rose">{saving.error}</span>}
            </div>
          </div>
        </div>
      </div>
    </Portal>
  )
}
