// Offline map support.
//
// Tiles are stored in the Cache Storage API (not IndexedDB) so the service
// worker can serve them straight back to Leaflet on a cache-first rule, with
// no involvement from app code once they are down.

import { TILE_URL, latToTileY, lngToTileX } from './geo'

export const TILE_CACHE = 'trekov-tiles-v1'

/** Zoom levels worth keeping: enough to see the region and the final approach. */
const ZOOMS = [8, 10, 12, 14]
const RADIUS = 2 // tiles either side at each zoom

export function tilesFor(lat, lng, zooms = ZOOMS, radius = RADIUS) {
  const urls = []
  for (const z of zooms) {
    const cx = lngToTileX(lng, z)
    const cy = latToTileY(lat, z)
    const max = 2 ** z
    for (let x = cx - radius; x <= cx + radius; x++) {
      for (let y = cy - radius; y <= cy + radius; y++) {
        if (y < 0 || y >= max) continue
        urls.push(TILE_URL(z, ((x % max) + max) % max, y))
      }
    }
  }
  return urls
}

/** Tiles covering a whole route, sampled so a long route stays affordable. */
export function tilesForRoute(coordinates, zooms = [10, 12]) {
  const step = Math.max(1, Math.floor(coordinates.length / 60))
  const seen = new Set()
  for (let i = 0; i < coordinates.length; i += step) {
    const [lat, lng] = coordinates[i]
    for (const url of tilesFor(lat, lng, zooms, 1)) seen.add(url)
  }
  return [...seen]
}

const supported = () => typeof caches !== 'undefined'

/**
 * Download tiles into the cache, reporting progress. Already-cached tiles are
 * skipped, so re-running over an overlapping area is cheap.
 */
export async function downloadTiles(urls, onProgress) {
  if (!supported()) throw new Error('This browser cannot store maps offline.')
  const cache = await caches.open(TILE_CACHE)
  let done = 0
  let failed = 0

  // Small batches: hundreds of parallel requests get throttled or dropped.
  const BATCH = 6
  for (let i = 0; i < urls.length; i += BATCH) {
    await Promise.all(urls.slice(i, i + BATCH).map(async (url) => {
      try {
        if (!(await cache.match(url))) await cache.add(url)
      } catch {
        failed++
      } finally {
        done++
        onProgress?.(done, urls.length, failed)
      }
    }))
  }
  return { total: urls.length, failed }
}

export async function cachedTileCount() {
  if (!supported()) return 0
  const cache = await caches.open(TILE_CACHE)
  return (await cache.keys()).length
}

/** Rough size on disk. Cache Storage has no per-entry size, so estimate. */
export async function cacheEstimate() {
  const count = await cachedTileCount()
  return { count, approxMB: +((count * 18_000) / 1e6).toFixed(1) }
}

export async function clearTiles() {
  if (!supported()) return
  await caches.delete(TILE_CACHE)
}
