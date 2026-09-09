// Sign-in over email magic links.
//
// No password is ever typed into this app, and none is stored: Supabase mails
// a one-time link and the session arrives in the callback URL.

import { hasSupabase, supabase } from './supabase'

export { hasSupabase }

export async function sendMagicLink(email) {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: `${location.origin}/app/` },
  })
  if (error) throw error
}

export async function signOut() {
  await supabase?.auth.signOut()
}

/** The signed-in user plus their profile row, or null. */
export async function currentAccount() {
  if (!supabase) return null
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  return {
    id: user.id,
    email: user.email,
    handle: profile?.handle ?? user.email?.split('@')[0] ?? 'traveller',
    name: profile?.name ?? '',
    avatar: profile?.avatar ?? '',
  }
}

export function onAuthChange(fn) {
  if (!supabase) return () => {}
  const { data } = supabase.auth.onAuthStateChange(() => { currentAccount().then(fn) })
  return () => data.subscription.unsubscribe()
}
