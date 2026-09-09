// "Search anywhere", not just the places Trekov already knows.
//
// Uses the Geocoding API through the Maps JS Geocoder, which is already
// loaded — no extra library in the script URL and no second API to enable.
// Results are cached per query because typing fires a lot of lookups and
// geocoding is billed per request.

import { loadGoogleMaps } from './gmaps'

const cache = new Map()
const MAX_CACHE = 80

export async function searchAnywhere(query, { near } = {}) {
  const q = query.trim()
  if (q.length < 3) return []
  if (cache.has(q)) return cache.get(q)
  if (!navigator.onLine) return []

  try {
    const gm = await loadGoogleMaps()
    const geocoder = new gm.Geocoder()
    const { results } = await geocoder.geocode({
      address: q,
      // Bias toward what you are looking at, so "market" finds the near one.
      ...(near ? { bounds: new gm.LatLngBounds(
        new gm.LatLng(near.lat - 2, near.lng - 2),
        new gm.LatLng(near.lat + 2, near.lng + 2),
      ) } : {}),
    })

    const hits = (results ?? []).slice(0, 6).map((r) => {
      const loc = r.geometry.location
      const parts = r.formatted_address.split(',').map((p) => p.trim())
      return {
        id: r.place_id,
        name: parts[0] || r.formatted_address,
        detail: parts.slice(1).join(', '),
        lat: loc.lat(),
        lng: loc.lng(),
      }
    })

    if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value)
    cache.set(q, hits)
    return hits
  } catch (e) {
    // Not fatal: the app's own places still match, so search keeps working.
    console.info('Trekov: geocoding unavailable —', e.message)
    return []
  }
}
