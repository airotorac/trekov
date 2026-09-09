import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { selectPlaceSearch, selectPlaces, useStore } from '../lib/store'
import { SearchIcon } from './Icons'

const INDIA = [22.6, 79.0]

/**
 * Markers are grouped by a zoom-dependent grid so a wide view shows a handful
 * of counted clusters instead of a hundred overlapping pins. Zooming in splits
 * them apart until each place stands alone.
 */
function cluster(places, zoom) {
  if (zoom >= 8) return places.map((p) => ({ key: p.id, lat: p.lat, lng: p.lng, places: [p] }))
  const cell = 40 / 2 ** zoom // degrees; halves every zoom level
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

function markerHtml(node) {
  const { places } = node
  if (places.length === 1) {
    const p = places[0]
    const thumb = p.cover && !p.cover.blobKey ? p.cover.src : ''
    return `
      <div class="tk-pin ${p.saved ? 'is-saved' : ''}">
        <div class="tk-pin-img" ${thumb ? `style="background-image:url('${thumb}')"` : ''}></div>
        <span class="tk-pin-count">${p.postCount}</span>
        <span class="tk-pin-label">${p.name}</span>
      </div>`
  }
  const total = places.reduce((n, p) => n + p.postCount, 0)
  return `
    <div class="tk-cluster">
      <b>${places.length}</b>
      <span>${total} photo${total === 1 ? '' : 's'}</span>
    </div>`
}

export default function MapView({ onOpenPlace }) {
  const host = useRef(null)
  const map = useRef(null)
  const layer = useRef(null)
  const [zoom, setZoom] = useState(4)
  const [q, setQ] = useState('')

  const places = useStore(selectPlaces)
  const matches = useStore((s) => selectPlaceSearch(s, q))

  // Create the map once.
  useEffect(() => {
    const m = L.map(host.current, { zoomControl: false, attributionControl: true })
      .setView(INDIA, 4)
    // Esri's imagery + label services are keyless. Satellite suits a travel app:
    // zooming in shows the actual terrain, not an abstract street grid.
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics',
      maxZoom: 18,
    }).addTo(m)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 18, pane: 'shadowPane',
    }).addTo(m)
    L.control.zoom({ position: 'bottomright' }).addTo(m)
    layer.current = L.layerGroup().addTo(m)
    m.on('zoomend', () => setZoom(m.getZoom()))
    map.current = m
    // The map is created before the pane has its final size.
    setTimeout(() => m.invalidateSize(), 0)
    return () => { m.remove(); map.current = null }
  }, [])

  // Redraw markers whenever the data or the zoom level changes.
  useEffect(() => {
    if (!layer.current) return
    layer.current.clearLayers()
    for (const node of cluster(places, zoom)) {
      const single = node.places.length === 1
      const marker = L.marker([node.lat, node.lng], {
        icon: L.divIcon({
          className: 'tk-marker',
          html: markerHtml(node),
          iconSize: single ? [54, 68] : [52, 52],
          iconAnchor: single ? [27, 62] : [26, 26],
        }),
      })
      marker.on('click', () => {
        if (single) onOpenPlace(node.places[0].id)
        else map.current.flyTo([node.lat, node.lng], Math.min(zoom + 3, 9), { duration: .6 })
      })
      layer.current.addLayer(marker)
    }
  }, [places, zoom, onOpenPlace])

  function goTo(place) {
    setQ('')
    map.current?.flyTo([place.lat, place.lng], 9, { duration: .8 })
    onOpenPlace(place.id)
  }

  return (
    <div className="relative h-full">
      <div ref={host} className="absolute inset-0 bg-raised" />

      <div className="absolute inset-x-0 top-0 z-[500] p-3">
        <div className="flex items-center gap-2 bg-ink/90 backdrop-blur-xl border border-line rounded-full px-4 py-2.5 shadow-lg">
          <SearchIcon size={18} className="text-mist shrink-0" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search a place or region…"
            className="bg-transparent flex-1 text-sm outline-none placeholder:text-mist min-w-0"
          />
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
      </div>

      {zoom < 6 && !q && (
        <p className="absolute inset-x-0 bottom-4 z-[500] text-center text-xs text-mist pointer-events-none">
          Zoom in to split clusters into places
        </p>
      )}
    </div>
  )
}
