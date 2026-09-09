import { useEffect, useRef, useState } from 'react'
import { selectPlaceSearch, selectPlaces, useStore } from '../lib/store'
import { createMap, preferredMapType, rememberMapType } from '../lib/mapDrivers'
import { SearchIcon, Wordmark } from './Icons'

const INDIA = [22.6, 79.0]

/**
 * Markers are grouped by a zoom-dependent grid so a wide view shows a handful
 * of counted clusters instead of a hundred overlapping pins. Zooming in splits
 * them apart until each place stands alone.
 */
function cluster(places, zoom) {
  if (zoom >= 8) return places.map((p) => ({ key: p.id, lat: p.lat, lng: p.lng, places: [p] }))
  const cell = 40 / 2 ** zoom
  const buckets = new Map()
  for (const p of places) {
    const key = `${Math.floor(p.lat / cell)}:${Math.floor(p.lng / cell)}`
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key).push(p)
  }
  return [...buckets.entries()].map(([key, group]) => ({
    key,
    lat: group.reduce((n, p) => n + p.lat, 0) / group.length,
    lng: group.reduce((n, p) => n + p.lng, 0) / group.length,
    places: group,
  }))
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

function markerHtml(node) {
  const { places } = node
  if (places.length === 1) {
    const p = places[0]
    const thumb = p.cover && !p.cover.blobKey ? p.cover.src : ''
    return `<div class="tk-pin ${p.saved ? 'is-saved' : ''}">
              <div class="tk-pin-img" ${thumb ? `style="background-image:url('${thumb}')"` : ''}></div>
              <span class="tk-pin-count">${p.postCount}</span>
              <span class="tk-pin-label">${esc(p.name)}</span>
            </div>`
  }
  const total = places.reduce((n, p) => n + p.postCount, 0)
  return `<div class="tk-cluster"><b>${places.length}</b><span>${total} photo${total === 1 ? '' : 's'}</span></div>`
}

export default function MapView({ onOpenPlace }) {
  const host = useRef(null)
  const drv = useRef(null)
  const markers = useRef([])
  const [engine, setEngine] = useState(null)
  const [zoom, setZoom] = useState(4)
  const [q, setQ] = useState('')
  const [mapType, setMapType] = useState(preferredMapType)
  const [traffic, setTraffic] = useState(false)

  const places = useStore(selectPlaces)
  const matches = useStore((s) => selectPlaceSearch(s, q))

  useEffect(() => {
    let alive = true
    let offZoom = () => {}
    createMap(host.current, { center: INDIA, zoom: 4, zoomControl: true, mapType }).then((d) => {
      if (!alive) { d.destroy(); return }
      drv.current = d
      offZoom = d.onZoomEnd(setZoom)
      setEngine(d.kind)
    })
    return () => { alive = false; offZoom(); drv.current?.destroy(); drv.current = null; markers.current = []; setEngine(null) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { rememberMapType(mapType); drv.current?.setMapType(mapType) }, [mapType, engine])
  useEffect(() => { drv.current?.setTraffic(traffic) }, [traffic, engine])

  // Redraw markers whenever the data or the zoom level changes.
  useEffect(() => {
    const d = drv.current
    if (!d) return
    markers.current.forEach((m) => m.remove())
    markers.current = cluster(places, zoom).map((node) => {
      const single = node.places.length === 1
      return d.htmlMarker([node.lat, node.lng], markerHtml(node), {
        size: single ? [54, 68] : [52, 52],
        anchor: single ? [27, 62] : [26, 26],
        onClick: () => single
          ? onOpenPlace(node.places[0].id)
          : d.flyTo([node.lat, node.lng], Math.min(zoom + 3, 9)),
      })
    })
  }, [places, zoom, onOpenPlace, engine])

  function goTo(place) {
    setQ('')
    drv.current?.flyTo([place.lat, place.lng], 9)
    onOpenPlace(place.id)
  }

  const types = drv.current?.mapTypes() ?? []

  return (
    <div className="relative h-full">
      <div ref={host} className="absolute inset-0 bg-raised" />
      <div className="absolute inset-x-0 top-0 h-32 z-[400] pointer-events-none bg-gradient-to-b from-ink/80 to-transparent" />

      <div className="absolute inset-x-0 top-0 z-[500] p-3">
        {/* The dark lockup rides over the map on a scrim, so the map screen
            carries the brand without spending a whole header on it. */}
        <div className="flex items-center justify-between pb-2.5 pt-0.5 px-1 [text-shadow:0_1px_6px_rgba(0,0,0,.9)]">
          <Wordmark size={19} />
          <span className="text-[11px] text-mist">The map is the feed</span>
        </div>

        <div className="flex items-center gap-2 bg-ink/90 backdrop-blur-xl border border-line rounded-full px-4 py-2.5 shadow-lg">
          <SearchIcon size={18} className="text-mist shrink-0" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a place or region…"
                 className="bg-transparent flex-1 text-sm outline-none placeholder:text-mist min-w-0" />
          {q && <button onClick={() => setQ('')} className="text-xs text-mist shrink-0">Clear</button>}
        </div>

        {q && (
          <ul className="mt-2 max-h-72 overflow-y-auto rounded-2xl border border-line bg-surface shadow-xl divide-y divide-line">
            {matches.length === 0 && <li className="px-4 py-4 text-sm text-mist">No place matches “{q}”.</li>}
            {matches.map((p) => (
              <li key={p.id}>
                <button onClick={() => goTo(p)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-raised">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium truncate">{p.name}</span>
                    <span className="block text-xs text-mist truncate">{p.region} · {p.country}</span>
                  </span>
                  <span className="text-xs text-mist shrink-0">{p.postCount} photos</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Map style and live traffic — Google only; Leaflet has neither. */}
        {!q && engine === 'google' && (
          <div className="mt-2 flex gap-1.5 overflow-x-auto no-bar">
            {types.map((t) => (
              <button key={t.id} onClick={() => setMapType(t.id)} aria-pressed={mapType === t.id}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs border backdrop-blur-xl transition
                                  ${mapType === t.id ? 'bg-brand text-ink border-brand font-semibold' : 'bg-ink/80 border-line text-mist hover:text-white'}`}>
                {t.label}
              </button>
            ))}
            <button onClick={() => setTraffic((v) => !v)} aria-pressed={traffic}
                    className={`shrink-0 ml-auto rounded-full px-3 py-1.5 text-xs border backdrop-blur-xl transition
                                ${traffic ? 'bg-brand text-ink border-brand font-semibold' : 'bg-ink/80 border-line text-mist hover:text-white'}`}>
              Traffic
            </button>
          </div>
        )}
      </div>

      {zoom < 6 && !q && (
        <p className="absolute inset-x-0 bottom-4 z-[500] text-center text-xs text-mist pointer-events-none">
          Zoom in to split clusters into places
        </p>
      )}
    </div>
  )
}
