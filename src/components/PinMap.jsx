import { useEffect, useRef } from 'react'
import L from 'leaflet'

/** A small map you drop a single pin on, for giving a new place its coordinates. */
export default function PinMap({ lat, lng, onMove }) {
  const host = useRef(null)
  const marker = useRef(null)

  useEffect(() => {
    const m = L.map(host.current, { zoomControl: true, attributionControl: false }).setView([lat, lng], 5)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Imagery &copy; Esri', maxZoom: 18,
    }).addTo(m)

    marker.current = L.marker([lat, lng], {
      draggable: true,
      icon: L.divIcon({ className: 'tk-marker', html: '<div class="tk-pin"><div class="tk-pin-img"></div></div>', iconSize: [54, 60], iconAnchor: [27, 56] }),
    }).addTo(m)

    marker.current.on('dragend', () => {
      const { lat: a, lng: b } = marker.current.getLatLng()
      onMove(+a.toFixed(5), +b.toFixed(5))
    })
    m.on('click', (e) => {
      marker.current.setLatLng(e.latlng)
      onMove(+e.latlng.lat.toFixed(5), +e.latlng.lng.toFixed(5))
    })

    setTimeout(() => m.invalidateSize(), 0)
    return () => m.remove()
    // Created once; later lat/lng changes come from this map itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={host} className="h-52 rounded-2xl overflow-hidden border border-line" />
}
