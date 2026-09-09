// Live location sharing between everyone on the same trip.
//
// Real multi-device presence needs a server. Rather than pretend otherwise,
// the transport is pluggable and ships with a BroadcastChannel implementation:
// it genuinely works across tabs and windows on one machine, which is enough
// to build and test the whole UI against.
//
// To go multi-device, implement this interface and pass it to joinParty:
//
//   { join(room, onMessage) -> leave(), send(message) }
//
// A Supabase Realtime adapter is about fifteen lines:
//   const ch = supabase.channel(`trip:${room}`)
//   ch.on('broadcast', { event: 'pos' }, ({ payload }) => onMessage(payload))
//   ch.subscribe();  send = (m) => ch.send({ type: 'broadcast', event: 'pos', payload: m })

const STALE_MS = 60_000   // drop a member we have not heard from in a minute
const BEAT_MS = 5_000     // and re-announce ourselves this often

/** Works across tabs on one device. No server, no network. */
export function broadcastTransport() {
  return {
    join(room, onMessage) {
      const ch = new BroadcastChannel(`trekov-trip-${room}`)
      ch.onmessage = (e) => onMessage(e.data)
      this._ch = ch
      return () => ch.close()
    },
    send(message) {
      this._ch?.postMessage(message)
    },
  }
}

const COLOURS = ['#00C08B', '#FFB33E', '#FF5C7A', '#5AA9FF', '#C77DFF', '#3DDC97']
export const colourFor = (id) => {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return COLOURS[h % COLOURS.length]
}

/**
 * Join a trip's party.
 *
 * @param tripId    room key — everyone with the same trip link shares one
 * @param me        { id, name }
 * @param onMembers called with the current member list whenever it changes
 * @returns { update(position), leave() }
 */
export function joinParty(tripId, me, onMembers, transport = broadcastTransport()) {
  const members = new Map()
  let mine = null

  const publish = () => onMembers([...members.values()].sort((a, b) => a.name.localeCompare(b.name)))

  function prune() {
    const cutoff = Date.now() - STALE_MS
    let changed = false
    for (const [id, m] of members) {
      if (m.at < cutoff) { members.delete(id); changed = true }
    }
    if (changed) publish()
  }

  const leaveTransport = transport.join(tripId, (msg) => {
    if (!msg || msg.id === me.id) return
    if (msg.type === 'leave') {
      if (members.delete(msg.id)) publish()
      return
    }
    if (msg.type !== 'pos') return
    members.set(msg.id, { id: msg.id, name: msg.name, lat: msg.lat, lng: msg.lng, at: Date.now() })
    publish()
    // A newcomer needs to learn where we are without waiting for the heartbeat.
    if (msg.hello && mine) transport.send({ ...mine, type: 'pos', hello: false })
  })

  const beat = setInterval(() => { if (mine) transport.send(mine); prune() }, BEAT_MS)

  return {
    update(position) {
      mine = { type: 'pos', id: me.id, name: me.name, lat: position.lat, lng: position.lng, hello: !mine }
      transport.send(mine)
      mine = { ...mine, hello: false }
    },
    leave() {
      clearInterval(beat)
      transport.send({ type: 'leave', id: me.id })
      leaveTransport()
    },
  }
}
