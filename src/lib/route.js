// Routing via the public OSRM demo server, cached so a route stays usable
// after you lose signal.
//
// OSRM's demo instance is rate-limited and not for production traffic — swap
// the host for your own OSRM/Valhalla instance (or a commercial key) before
// this carries real users.

const HOST = 'https://router.project-osrm.org'
const KEY = 'trekov.routes.v1'
const MAX_CACHED = 40

const routeKey = (from, to, profile) =>
  [profile, from.lat.toFixed(3), from.lng.toFixed(3), to.lat.toFixed(3), to.lng.toFixed(3)].join('|')

function readCache() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}

function writeCache(cache) {
  // Keep the newest N so a long-lived install cannot fill the quota.
  const entries = Object.entries(cache).sort((a, b) => b[1].at - a[1].at).slice(0, MAX_CACHED)
  try { localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(entries))) } catch {}
}

export const cachedRoute = (from, to, profile = 'driving') => readCache()[routeKey(from, to, profile)] ?? null

/**
 * Fetch a route, falling back to the cached copy when offline or when the
 * demo server is unreachable. Returns { distance, duration, coordinates,
 * steps, cached, stale }.
 */
export async function getRoute(from, to, profile = 'driving') {
  const key = routeKey(from, to, profile)
  const cache = readCache()
  const hit = cache[key]

  if (!navigator.onLine) {
    return hit ? { ...hit, cached: true, stale: true } : null
  }

  try {
    const url = `${HOST}/route/v1/${profile}/${from.lng},${from.lat};${to.lng},${to.lat}` +
                `?overview=full&geometries=geojson&steps=true`
    const res = await fetch(url)
    if (!res.ok) throw new Error(res.status)
    const data = await res.json()
    if (data.code !== 'Ok' || !data.routes?.length) throw new Error(data.code || 'no route')

    const r = data.routes[0]
    const route = {
      at: Date.now(),
      distance: r.distance,
      duration: r.duration,
      // Leaflet wants [lat, lng]; GeoJSON gives [lng, lat].
      coordinates: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      steps: (r.legs?.[0]?.steps ?? []).map((s) => ({
        name: s.name,
        distance: s.distance,
        type: s.maneuver?.type,
        modifier: s.maneuver?.modifier,
        lat: s.maneuver?.location?.[1],
        lng: s.maneuver?.location?.[0],
      })),
    }
    cache[key] = route
    writeCache(cache)
    return { ...route, cached: false, stale: false }
  } catch (e) {
    console.warn('Trekov: routing failed', e)
    return hit ? { ...hit, cached: true, stale: true } : null
  }
}

/** Plain-English instruction for an OSRM maneuver. */
export function instruction(step) {
  if (!step) return 'Continue'
  const road = step.name ? ` onto ${step.name}` : ''
  // OSRM emits modifier "straight" on a turn maneuver, which reads as
  // "Turn straight" unless it is special-cased.
  const straight = step.modifier === 'straight' || !step.modifier
  const dir = step.modifier && !straight ? ` ${step.modifier}` : ''
  switch (step.type) {
    case 'depart':   return step.name ? `Head along ${step.name}` : 'Start'
    case 'arrive':   return 'Arrive at your destination'
    case 'turn':     return straight ? `Continue straight${road}` : `Turn${dir}${road}`
    case 'merge':    return `Merge${dir}${road}`
    case 'fork':     return `Keep${dir}${road}`
    case 'roundabout':
    case 'rotary':   return `Take the roundabout${road}`
    case 'new name': return `Continue${road}`
    default:         return `Continue${dir}${road}`
  }
}
