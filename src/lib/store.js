// Single source of truth.
//
// A *place* is the primary record: you browse the map, open a place, and see
// what people shot there. Posts hang off places; saved places and trips are
// both just ordered lists of place ids.
//
// Everything is client-side (localStorage for records, IndexedDB for media) so
// the app works with no backend. Every read and write goes through this file,
// so a real backend replaces this module alone.

import { useSyncExternalStore } from 'react'
import { PLACES, POSTS, USERS } from './seed'
import { putBlob, delBlob } from './media'

const KEY = 'trekov.state.v2'
const ME = 'u_me'

function initial() {
  return {
    users: USERS,
    places: Object.fromEntries(PLACES.map((p) => [p.id, p])),
    posts: POSTS.map((p) => ({ ...p, likedByMe: false })),
    savedPlaces: [],   // place ids, newest first
    trips: [],         // { id, title, start, end, notes, stops: [{ placeId, note }] }
    profile: { name: 'You', handle: 'you', bio: 'Collecting places, one at a time.', avatar: USERS.u_me.avatar },
  }
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (!saved) return initial()
    const base = initial()
    // Reconcile with the seed so demo content added since the last visit shows
    // up, without touching anything the user made.
    const seenPosts = new Set(saved.posts.map((p) => p.id))
    const seedById = new Map(POSTS.map((p) => [p.id, p]))
    return {
      ...base,
      ...saved,
      places: { ...base.places, ...saved.places },
      posts: [
        ...saved.posts.map((p) => (seedById.has(p.id) ? { ...p, media: seedById.get(p.id).media } : p)),
        ...POSTS.filter((p) => !seenPosts.has(p.id)).map((p) => ({ ...p, likedByMe: false })),
      ],
    }
  } catch {
    return initial()
  }
}

let state = load()
const listeners = new Set()

function set(next) {
  state = next
  try { localStorage.setItem(KEY, JSON.stringify(state)) }
  catch (e) { console.warn('Trekov: could not persist state', e) }
  listeners.forEach((l) => l())
}

const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l) }

export function useStore(selector = (s) => s) {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state))
}

/* --------------------------------- reads ---------------------------------- */

export const meId = ME
export const getUser = (id) => state.users[id] ?? { id, name: 'Traveller', handle: id, avatar: '' }
export const getPlace = (id) => state.places[id]
export const getPost = (id) => state.posts.find((p) => p.id === id)

// Selectors build new arrays, so they must be memoised: useSyncExternalStore
// compares snapshots by identity. `state` only changes identity inside set(),
// which makes it a sound cache key.
function memo(fn) {
  let lastState, lastArg, lastResult, primed = false
  return (s, arg) => {
    if (primed && s === lastState && arg === lastArg) return lastResult
    lastState = s; lastArg = arg; lastResult = fn(s, arg); primed = true
    return lastResult
  }
}

const newest = (a, b) => new Date(b.createdAt) - new Date(a.createdAt)

/** Every place, with the numbers the map markers need. */
export const selectPlaces = memo((s) => {
  const byPlace = new Map()
  for (const post of s.posts) {
    if (!byPlace.has(post.placeId)) byPlace.set(post.placeId, [])
    byPlace.get(post.placeId).push(post)
  }
  return Object.values(s.places).map((place) => {
    const posts = (byPlace.get(place.id) ?? []).sort(newest)
    return {
      ...place,
      postCount: posts.length,
      cover: posts[0]?.media ?? null,
      latestAt: posts[0]?.createdAt ?? null,
      saved: s.savedPlaces.includes(place.id),
    }
  })
})

export const selectPlace = memo((s, id) => selectPlaces(s).find((p) => p.id === id) ?? null)

/** Posts at one place, most recent first. */
export const selectPostsAt = memo((s, placeId) =>
  s.posts.filter((p) => p.placeId === placeId).sort(newest))

export const selectSavedPlaces = memo((s) =>
  s.savedPlaces.map((id) => selectPlaces(s).find((p) => p.id === id)).filter(Boolean))

export const selectMyPosts = memo((s) => s.posts.filter((p) => p.authorId === ME).sort(newest))

export const selectTrips = memo((s) => s.trips)
export const selectTrip = memo((s, id) => s.trips.find((t) => t.id === id) ?? null)

export const selectPlaceSearch = memo((s, q) => {
  const term = (q ?? '').trim().toLowerCase()
  const all = selectPlaces(s)
  if (!term) return all
  return all.filter((p) =>
    `${p.name} ${p.region} ${p.country} ${p.blurb ?? ''}`.toLowerCase().includes(term))
})

/* --------------------------------- writes --------------------------------- */

export function toggleLike(postId) {
  set({
    ...state,
    posts: state.posts.map((p) =>
      p.id === postId
        ? { ...p, likedByMe: !p.likedByMe, likes: p.likes + (p.likedByMe ? -1 : 1) }
        : p),
  })
}

export function addComment(postId, text) {
  const body = text.trim()
  if (!body) return
  const comment = { id: `c_${Date.now()}`, userId: ME, text: body, createdAt: new Date().toISOString() }
  set({
    ...state,
    posts: state.posts.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, comment] } : p)),
  })
}

/** The core action: put a place on your To Visit list. */
export function toggleSavePlace(placeId) {
  const saved = state.savedPlaces.includes(placeId)
  set({
    ...state,
    savedPlaces: saved
      ? state.savedPlaces.filter((id) => id !== placeId)
      : [placeId, ...state.savedPlaces],
  })
  return !saved
}

export function upsertPlace(place) {
  const id = place.id ?? `pl_${Date.now()}`
  set({ ...state, places: { ...state.places, [id]: { ...place, id } } })
  return id
}

export async function createPost({ file, placeId, caption, tags }) {
  const id = `p_${Date.now()}`
  await putBlob(id, file)
  set({
    ...state,
    posts: [{
      id, placeId, authorId: ME, createdAt: new Date().toISOString(),
      media: { type: file.type.startsWith('video') ? 'video' : 'image', src: '', blobKey: id },
      caption, tags, likes: 0, likedByMe: false, comments: [],
    }, ...state.posts],
  })
  return id
}

export async function deletePost(id) {
  const post = getPost(id)
  if (post?.media.blobKey) await delBlob(post.media.blobKey).catch(() => {})
  set({ ...state, posts: state.posts.filter((p) => p.id !== id) })
}

/* ---------------------------------- trips --------------------------------- */

export function createTrip({ title, start = '', end = '', stops = [], notes = '' }) {
  const trip = { id: `t_${Date.now()}`, title: title.trim() || 'Untitled trip', start, end, notes, stops }
  set({ ...state, trips: [trip, ...state.trips] })
  return trip.id
}

const patchTrip = (id, fn) => set({ ...state, trips: state.trips.map((t) => (t.id === id ? fn(t) : t)) })

export const updateTrip = (id, patch) => patchTrip(id, (t) => ({ ...t, ...patch }))
export const deleteTrip = (id) => set({ ...state, trips: state.trips.filter((t) => t.id !== id) })

export function addStop(tripId, placeId) {
  patchTrip(tripId, (t) =>
    t.stops.some((s) => s.placeId === placeId) ? t : { ...t, stops: [...t.stops, { placeId, note: '' }] })
}

export const removeStop = (tripId, placeId) =>
  patchTrip(tripId, (t) => ({ ...t, stops: t.stops.filter((s) => s.placeId !== placeId) }))

export const setStopNote = (tripId, placeId, note) =>
  patchTrip(tripId, (t) => ({
    ...t, stops: t.stops.map((s) => (s.placeId === placeId ? { ...s, note } : s)),
  }))

/** Move a stop up or down the itinerary. */
export function moveStop(tripId, index, delta) {
  patchTrip(tripId, (t) => {
    const to = index + delta
    if (to < 0 || to >= t.stops.length) return t
    const stops = [...t.stops]
    ;[stops[index], stops[to]] = [stops[to], stops[index]]
    return { ...t, stops }
  })
}

/** Adopt a trip that arrived over a share link. */
export function importTrip(trip) {
  const places = { ...state.places }
  for (const p of trip.places ?? []) if (!places[p.id]) places[p.id] = p
  const copy = {
    id: `t_${Date.now()}`,
    title: trip.title, start: trip.start ?? '', end: trip.end ?? '', notes: trip.notes ?? '',
    stops: (trip.stops ?? []).filter((s) => places[s.placeId]),
  }
  set({ ...state, places, trips: [copy, ...state.trips] })
  return copy.id
}

export function updateProfile(patch) {
  set({ ...state, profile: { ...state.profile, ...patch } })
}

export function resetAll() {
  localStorage.removeItem(KEY)
  set(initial())
}
