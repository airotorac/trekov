// Routing via the public OSRM demo server, cached so a route stays usable
// after you lose signal.
//
// OSRM's demo instance is rate-limited and not for production traffic — swap
// the host for your own OSRM/Valhalla instance (or a commercial key) before
// this carries real users.

import { loadGoogleMaps } from './gmaps'

const HOST = 'https://router.project-osrm.org'
const TRAVEL = { car: 'DRIVING', bike: 'TWO_WHEELER' }
const stripHtml = (h) => (h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
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

async function osrmRoute(from, to, mode) {
  // The demo server only carries the driving profile; a bike gets the same
  // road route, and says so.
  const url = `${HOST}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}` +
              `?overview=full&geometries=geojson&steps=true`
  const res = await fetch(url)
  if (!res.ok) throw new Error(res.status)
  const data = await res.json()
  if (data.code !== 'Ok' || !data.routes?.length) throw new Error(data.code || 'no route')
  const r = data.routes[0]
  return {
    at: Date.now(), via: 'osrm', mode, modeFallback: mode === 'bike',
    distance: r.distance, duration: r.duration, durationInTraffic: null,
    // Leaflet wants [lat, lng]; GeoJSON gives [lng, lat].
    coordinates: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    steps: (r.legs?.[0]?.steps ?? []).map((s) => ({
      text: '', name: s.name, distance: s.distance,
      type: s.maneuver?.type, modifier: s.maneuver?.modifier,
      lat: s.maneuver?.location?.[1], lng: s.maneuver?.location?.[0],
    })),
  }
}

/**
 * Google Directions. Bikes ask for TWO_WHEELER, which Google serves in India
 * and a handful of other countries; anywhere else it is refused and we fall
 * back to a car route and say so, rather than inventing a bike one.
 */
async function googleRoute(gm, from, to, mode) {
  const svc = new gm.DirectionsService()
  const ask = (travelMode) => svc.route({
    origin: from, destination: to, travelMode,
    ...(travelMode === 'DRIVING'
      ? { drivingOptions: { departureTime: new Date(), trafficModel: 'BEST_GUESS' } }
      : {}),
  })
  let res
  let modeFallback = false
  try {
    res = await ask(TRAVEL[mode] ?? 'DRIVING')
  } catch (e) {
    if (mode !== 'bike') throw e
    res = await ask('DRIVING')
    modeFallback = true
  }
  const r = res.routes?.[0]
  const leg = r?.legs?.[0]
  if (!leg) throw new Error('no route')
  return {
    at: Date.now(), via: 'google', mode, modeFallback,
    distance: leg.distance.value, duration: leg.duration.value,
    durationInTraffic: leg.duration_in_traffic?.value ?? null,
    coordinates: r.overview_path.map((p) => [p.lat(), p.lng()]),
    steps: leg.steps.map((s) => ({
      text: stripHtml(s.instructions), name: '', distance: s.distance.value,
      type: s.maneuver || '', modifier: '',
      lat: s.start_location.lat(), lng: s.start_location.lng(),
    })),
  }
}

/**
 * Fetch a route: Google when its key loads, the OSRM demo otherwise, and the
 * cached copy when offline or when both fail. `mode` is 'car' or 'bike'.
 * Returns { distance, duration, durationInTraffic, coordinates, steps, via,
 * modeFallback, cached, stale }.
 */
export async function getRoute(from, to, mode = 'car') {
  if (mode === 'driving') mode = 'car'
  const key = routeKey(from, to, mode)
  const cache = readCache()
  const hit = cache[key]

  if (!navigator.onLine) return hit ? { ...hit, cached: true, stale: true } : null

  try {
    let route
    try {
      route = await googleRoute(await loadGoogleMaps(), from, to, mode)
    } catch (e) {
      console.info('Trekov: Google directions unavailable —', e.message)
      route = await osrmRoute(from, to, mode)
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
  if (step.text) return step.text          // Google already wrote the sentence
  const road = step.name ? ` onto ${step.name}` : ''
  // OSRM emits modifier "straight" on a turn maneuver, which reads as
  // "Turn straight" unless it is special-cased.
  const straight = step.modifier === 'straight' || !step.modifier
  const dir = step.modifier && !straight ? ` ${step.modifier}` : ''
  switch (step.type) {
    case 'depart':   return step.name ? `Set off along ${step.name}` : 'Set off toward your route'
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
