// Broadcast notifications — "a new place was added", for now.
//
// Same shape as party.js and the same honest limit: BroadcastChannel reaches
// other tabs on this machine, not other people's phones. Swap the transport
// for Supabase Realtime (or web-push for background delivery) and every user
// gets it; nothing above this layer changes.

const CHANNEL = 'trekov-notifications'

export function broadcastTransport() {
  let ch = null
  return {
    join(onMessage) {
      ch = new BroadcastChannel(CHANNEL)
      ch.onmessage = (e) => onMessage(e.data)
      return () => { ch?.close(); ch = null }
    },
    send(message) { ch?.postMessage(message) },
  }
}

export const NEW_PLACE = 'place:new'
