// Uploaded photos/videos are far too big for localStorage, so blobs live in
// IndexedDB and posts only keep the key. Object URLs are minted on read.

const DB = 'trekov-media'
const STORE = 'blobs'

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx(mode, fn) {
  const db = await open()
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode)
    const req = fn(t.objectStore(STORE))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export const putBlob = (key, blob) => tx('readwrite', (s) => s.put(blob, key))
export const getBlob = (key) => tx('readonly', (s) => s.get(key))
export const delBlob = (key) => tx('readwrite', (s) => s.delete(key))

const urlCache = new Map()

/** Resolve a post's media to something an <img>/<video> can use. */
export async function resolveSrc(media) {
  if (!media.blobKey) return media.src
  if (urlCache.has(media.blobKey)) return urlCache.get(media.blobKey)
  const blob = await getBlob(media.blobKey)
  if (!blob) return media.src || ''
  const url = URL.createObjectURL(blob)
  urlCache.set(media.blobKey, url)
  return url
}
