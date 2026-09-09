export function timeAgo(iso) {
  const s = Math.max(1, (Date.now() - new Date(iso)) / 1000)
  const units = [[31536000, 'y'], [2592000, 'mo'], [604800, 'w'], [86400, 'd'], [3600, 'h'], [60, 'm']]
  for (const [secs, label] of units) if (s >= secs) return `${Math.floor(s / secs)}${label}`
  return 'now'
}

/** "just now" / "3d ago" — timeAgo returns "now", which reads badly with " ago". */
export const ago = (iso) => {
  const t = timeAgo(iso)
  return t === 'now' ? 'just now' : `${t} ago`
}

export const compact = (n) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}k` : String(n)

export const mapsUrl = (place) =>
  place.lat != null
    ? `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} ${place.region}`)}`

/** "9 Sep 2026, 2:31 pm" — an upload's exact moment, next to the relative one. */
export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
