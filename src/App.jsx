import { useEffect, useMemo, useState } from 'react'
import { getPlace, importTrip, selectSavedPlaces, selectTrip, useStore } from './lib/store'
import { decodeTripFromHash } from './lib/share'
import Composer from './components/Composer'
import MapView from './components/MapView'
import Navigate from './components/Navigate'
import PlaceSheet from './components/PlaceSheet'
import Profile from './components/Profile'
import Saved from './components/Saved'
import SharedTrip from './components/SharedTrip'
import TabBar from './components/TabBar'
import Trips from './components/Trips'

const TABS = ['map', 'trips', 'saved', 'profile']
const readHash = () => {
  const h = window.location.hash.replace('#', '')
  return TABS.includes(h) ? h : 'map'
}

export default function App() {
  const [tab, setTab] = useState(readHash)
  const [composing, setComposing] = useState(false)
  const [place, setPlace] = useState(null)
  const [openTrip, setOpenTrip] = useState(null)
  // { placeId, tripId? } while navigating.
  const [nav, setNav] = useState(null)
  // A trip that arrived over a share link, waiting to be accepted.
  const [incoming, setIncoming] = useState(() => decodeTripFromHash())

  const savedCount = useStore(selectSavedPlaces).length
  const profile = useStore((s) => s.profile)
  const navTrip = useStore((s) => (nav?.tripId ? selectTrip(s, nav.tripId) : null))

  // One identity per tab, so two tabs act as two travellers sharing a trip.
  // With a real backend this becomes the signed-in user's id.
  const me = useMemo(() => {
    let id = sessionStorage.getItem('trekov.memberId')
    if (!id) {
      id = `m_${Math.random().toString(36).slice(2, 9)}`
      sessionStorage.setItem('trekov.memberId', id)
    }
    return { id, name: profile.name }
  }, [profile.name])

  const startNavigation = (placeId, tripId) => { setPlace(null); setNav({ placeId, tripId }) }

  // Hash routing keeps the back button working and needs no server rewrites on
  // GitHub Pages.
  useEffect(() => {
    const sync = () => {
      const trip = decodeTripFromHash()
      if (trip) return setIncoming(trip)
      setTab(readHash())
    }
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  function go(next) {
    if (next === 'post') return setComposing(true)
    window.location.hash = next
    setTab(next)
  }

  function acceptTrip() {
    // Land on the trip that just arrived, not on whatever was open before.
    setOpenTrip(importTrip(incoming))
    setIncoming(null)
    go('trips')
  }

  function dismissTrip() {
    setIncoming(null)
    go('map')
  }

  const screens = {
    map: <MapView onOpenPlace={setPlace} />,
    trips: <Trips onOpenPlace={setPlace} open={openTrip} onOpen={setOpenTrip} onNavigate={startNavigation} />,
    saved: <Saved onExplore={() => go('map')} onOpenPlace={setPlace} onNavigate={startNavigation} />,
    profile: <Profile onPost={() => setComposing(true)} />,
  }

  return (
    <div className="h-full flex justify-center bg-black">
      <div className="relative w-full max-w-[520px] h-full flex flex-col bg-ink sm:border-x sm:border-line">
        {/* The map manages its own height; the other screens scroll. */}
        <main className={`flex-1 min-h-0 ${tab === 'map' ? '' : 'overflow-y-auto'}`}>
          {screens[tab]}
        </main>
        <TabBar tab={tab} onChange={go} savedCount={savedCount} />
      </div>

      {place && (
        <PlaceSheet placeId={place} onClose={() => setPlace(null)} onNavigate={startNavigation} />
      )}

      {nav && getPlace(nav.placeId) && (
        <Navigate
          place={getPlace(nav.placeId)}
          trip={navTrip}
          me={me}
          onClose={() => setNav(null)}
        />
      )}

      {composing && (
        <Composer
          onClose={() => setComposing(false)}
          onPosted={(placeId) => { setComposing(false); setPlace(placeId) }}
        />
      )}

      {incoming && <SharedTrip trip={incoming} onAccept={acceptTrip} onDismiss={dismissTrip} />}
    </div>
  )
}
