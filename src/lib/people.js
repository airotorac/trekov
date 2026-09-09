// Finding people to invite on a group trip.
//
// Supabase profiles when a project is configured; otherwise the users already
// known locally, so the invite flow is still demonstrable offline.

import { supabase } from './supabase'
import { getState } from './store'

export async function searchProfiles(query) {
  const q = query.trim()
  if (q.length < 2) return []

  if (supabase) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, handle, name, avatar')
      .ilike('handle', `%${q}%`)
      .limit(8)
    if (!error) return data ?? []
    console.info('Trekov: profile search unavailable —', error.message)
  }

  // Local fallback: whoever this device already knows about.
  const term = q.toLowerCase()
  return Object.values(getState().users)
    .filter((u) => u.id !== 'u_me' && `${u.handle} ${u.name}`.toLowerCase().includes(term))
    .slice(0, 8)
}

/** Mirror a companion into Supabase so they can actually open the trip. */
export async function grantTripAccess(tripId, userId) {
  if (!supabase) return { ok: false, reason: 'local' }
  const { error } = await supabase.from('trip_members').upsert({ trip_id: tripId, user_id: userId })
  if (error) {
    console.info('Trekov: could not add member —', error.message)
    return { ok: false, reason: error.message }
  }
  return { ok: true }
}

/**
 * Invite links, one per channel.
 *
 * These open the person's own WhatsApp / mail / messages app with the text
 * ready — nothing is sent on their behalf, and no contact list is read.
 */
export function inviteLinks(tripTitle, url) {
  const text = `Join me on "${tripTitle}" — our trip on Trekov. Open this to see the route and follow along live:\n${url}`
  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
    email: `mailto:?subject=${encodeURIComponent(`Join my trip: ${tripTitle}`)}&body=${encodeURIComponent(text)}`,
    sms: `sms:?&body=${encodeURIComponent(text)}`,
    text,
  }
}
