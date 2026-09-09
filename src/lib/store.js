// Single source of truth for the app.
//
// Everything is kept client-side (localStorage for records, IndexedDB for
// media) so the app is fully usable with no backend. Every read/write goes
// through the functions below, so swapping in Supabase/Firebase later means
// rewriting this file only — no component touches storage directly.

import { useSyncExternalStore } from 'react'
import { POSTS, USERS } from './seed'
import { putBlob, delBlob } from './media'

const KEY = 'trekov.state.v1'
const ME = 'u_me'

function initial() {
  return {
    users: USERS,
    posts: POSTS.map((p) => ({ ...p, likedByMe: false, saved: false })),
    // Places the user wants to go. Keyed by post id, ordered newest-first.
    savedOrder: [],
    profile: {
      name: 'You', handle: 'you', bio: 'Collecting places, one at a time.',
      avatar: USERS.u_me.avatar,
    },
  }
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return initial()
    const saved = JSON.parse(raw)
    // Reconcile with the seed: pull in posts added since the last visit, and
    // refresh demo media in place, without touching the user's own activity.
    const seedById = new Map(POSTS.map((p) => [p.id, p]))
    const merged = saved.posts.map((p) =>
      seedById.has(p.id) ? { ...p, media: seedById.get(p.id).media } : p)
    const known = new Set(saved.posts.map((p) => p.id))
    const fresh = POSTS.filter((p) => !known.has(p.id)).map((p) => ({ ...p, likedByMe: false, saved: false }))
    return { ...initial(), ...saved, posts: [...merged, ...fresh] }
  } catch {
    return initial()
  }
}

let state = load()
const listeners = new Set()

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch (e) {
    console.warn('Trekov: could not persist state', e)
  }
}

function set(next) {
  state = next
  persist()
  listeners.forEach((l) => l())
}

const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l) }
const snapshot = () => state

export function useStore(selector = (s) => s) {
  return useSyncExternalStore(subscribe, () => selector(snapshot()), () => selector(snapshot()))
}

/* ---------------------------------- reads --------------------------------- */

export const meId = ME
export const getUser = (id) => state.users[id] ?? { id, name: 'Traveller', handle: id, avatar: '' }

// Selectors derive new arrays, so they must be memoised: useSyncExternalStore
// compares snapshots by identity and would otherwise re-render forever.
// `state` only changes identity inside set(), which makes it a sound cache key.
function memo(fn) {
  let lastState, lastArg, lastResult, primed = false
  return (s, arg) => {
    if (primed && s === lastState && arg === lastArg) return lastResult
    lastState = s; lastArg = arg; lastResult = fn(s, arg); primed = true
    return lastResult
  }
}

export const selectFeed = memo((s) =>
  [...s.posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))

export const selectSaved = memo((s) =>
  s.savedOrder.map((id) => s.posts.find((p) => p.id === id)).filter(Boolean))

export const selectMine = memo((s) => s.posts.filter((p) => p.authorId === ME))

export const selectSearch = memo((s, q) => {
  const term = (q ?? '').trim().toLowerCase()
  if (!term) return selectFeed(s)
  return selectFeed(s).filter((p) =>
    [p.place.name, p.place.region, p.place.country, p.caption, ...p.tags]
      .join(' ').toLowerCase().includes(term))
})

/** Distinct tags across the feed, most used first. */
export const selectTags = memo((s) => {
  const counts = new Map()
  s.posts.forEach((p) => p.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)))
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t)
})

/* --------------------------------- writes --------------------------------- */

const mapPost = (id, fn) => state.posts.map((p) => (p.id === id ? fn(p) : p))

export function toggleLike(id) {
  set({
    ...state,
    posts: mapPost(id, (p) => ({
      ...p,
      likedByMe: !p.likedByMe,
      likes: p.likes + (p.likedByMe ? -1 : 1),
    })),
  })
}

/** The core action: put a place on your to-visit list. */
export function toggleSave(id) {
  const post = state.posts.find((p) => p.id === id)
  if (!post) return
  const nowSaved = !post.saved
  set({
    ...state,
    posts: mapPost(id, (p) => ({ ...p, saved: nowSaved })),
    savedOrder: nowSaved
      ? [id, ...state.savedOrder.filter((x) => x !== id)]
      : state.savedOrder.filter((x) => x !== id),
  })
  return nowSaved
}

export function addComment(id, text) {
  const body = text.trim()
  if (!body) return
  const comment = { id: `c_${Date.now()}`, userId: ME, text: body, createdAt: new Date().toISOString() }
  set({ ...state, posts: mapPost(id, (p) => ({ ...p, comments: [...p.comments, comment] })) })
}

export async function createPost({ file, place, caption, tags, bestTime }) {
  const id = `p_${Date.now()}`
  const media = { type: file.type.startsWith('video') ? 'video' : 'image', src: '', blobKey: id }
  await putBlob(id, file)
  set({
    ...state,
    posts: [
      {
        id, authorId: ME, createdAt: new Date().toISOString(), media,
        place, caption, tags, bestTime,
        likes: 0, likedByMe: false, saved: false, comments: [],
      },
      ...state.posts,
    ],
  })
  return id
}

export async function deletePost(id) {
  const post = state.posts.find((p) => p.id === id)
  if (post?.media.blobKey) await delBlob(post.media.blobKey).catch(() => {})
  set({
    ...state,
    posts: state.posts.filter((p) => p.id !== id),
    savedOrder: state.savedOrder.filter((x) => x !== id),
  })
}

export function updateProfile(patch) {
  set({ ...state, profile: { ...state.profile, ...patch } })
}

export function resetAll() {
  localStorage.removeItem(KEY)
  set(initial())
}
