// Slippy-map tile maths and great-circle helpers, shared by routing,
// offline tile download and the navigation compass.

export const TILE_URL = (z, x, y) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`

export const lngToTileX = (lng, z) => Math.floor(((lng + 180) / 360) * 2 ** z)

export function latToTileY(lat, z) {
  const rad = (lat * Math.PI) / 180
  return Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** z)
}

const R = 6371e3 // metres

/** Great-circle distance in metres. */
export function distance(a, b) {
  const p1 = (a.lat * Math.PI) / 180
  const p2 = (b.lat * Math.PI) / 180
  const dp = p2 - p1
  const dl = ((b.lng - a.lng) * Math.PI) / 180
  const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Initial bearing from a to b, in degrees clockwise from north. */
export function bearing(a, b) {
  const p1 = (a.lat * Math.PI) / 180
  const p2 = (b.lat * Math.PI) / 180
  const dl = ((b.lng - a.lng) * Math.PI) / 180
  const y = Math.sin(dl) * Math.cos(p2)
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl)
  return (((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360
}

export const formatDistance = (m) =>
  m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`

export function formatDuration(s) {
  const h = Math.floor(s / 3600)
  const m = Math.round((s % 3600) / 60)
  return h ? `${h}h ${m}m` : `${m}m`
}

export const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
export const compassPoint = (deg) => COMPASS[Math.round(deg / 45) % 8]
